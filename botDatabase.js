import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'bot_instances.db.json');
const COMPAT_FILE = path.join(DATA_DIR, 'bot_instances.json');
const MAX_BACKUPS = 10;

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

class BotDatabase {
  constructor() {
    this.cache = new Map();
    this.isDirty = false;
    this.writeLock = false;
    this.init();
  }

  /**
   * Initializes the database, loading from disk or recovering from backup if needed.
   */
  init() {
    try {
      let rawData = null;
      let targetFile = null;

      if (fs.existsSync(DB_FILE)) {
        targetFile = DB_FILE;
        rawData = fs.readFileSync(DB_FILE, 'utf-8');
      } else if (fs.existsSync(COMPAT_FILE)) {
        targetFile = COMPAT_FILE;
        rawData = fs.readFileSync(COMPAT_FILE, 'utf-8');
      }

      if (rawData && rawData.trim().length > 0) {
        try {
          const parsed = JSON.parse(rawData);
          for (const [key, val] of Object.entries(parsed)) {
            if (val && typeof val === 'object') {
              this.cache.set(key, val);
            }
          }
          console.log(`[BOT DATABASE] Loaded ${this.cache.size} bot instances from ${path.basename(targetFile)}.`);
          this.createBackup('startup');
          return;
        } catch (parseErr) {
          console.error(`[BOT DATABASE CRITICAL] Corrupted database file detected in ${targetFile}:`, parseErr.message);
          this.restoreFromBackup();
          return;
        }
      }

      console.log(`[BOT DATABASE] Initializing fresh database repository.`);
      this.cache.clear();
      this.save();
    } catch (err) {
      console.error(`[BOT DATABASE ERROR] Failed initializing database:`, err);
      this.restoreFromBackup();
    }
  }

  /**
   * Restores database records from the latest valid backup in data/backups/
   */
  restoreFromBackup() {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return false;
      const backupFiles = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      for (const bFile of backupFiles) {
        const fullPath = path.join(BACKUPS_DIR, bFile);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(content);
          this.cache.clear();
          for (const [key, val] of Object.entries(parsed)) {
            this.cache.set(key, val);
          }
          console.warn(`[BOT DATABASE RECOVERY] Successfully restored ${this.cache.size} instances from backup ${bFile}!`);
          this.save();
          return true;
        } catch {
          // If this backup is also invalid, try previous
        }
      }
    } catch (recErr) {
      console.error(`[BOT DATABASE RECOVERY FAILED]:`, recErr);
    }
    return false;
  }

  /**
   * Creates a timestamped snapshot in data/backups/ and trims old backups.
   */
  createBackup(label = 'auto') {
    try {
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUPS_DIR, `backup_${label}_${now}.json`);
      const payload = JSON.stringify(Object.fromEntries(this.cache), null, 2);
      fs.writeFileSync(backupFile, payload, 'utf-8');

      // Trim backups exceeding MAX_BACKUPS
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .sort();

      while (files.length > MAX_BACKUPS) {
        const toRemove = files.shift();
        fs.unlinkSync(path.join(BACKUPS_DIR, toRemove));
      }
    } catch (bErr) {
      console.warn(`[BOT DATABASE BACKUP WARN]:`, bErr.message);
    }
  }

  /**
   * Atomically flushes in-memory cache to disk using temporary write + atomic rename.
   */
  save() {
    if (this.writeLock) {
      this.isDirty = true;
      return;
    }

    this.writeLock = true;
    try {
      const serialized = JSON.stringify(Object.fromEntries(this.cache), null, 2);
      const tmpFile = `${DB_FILE}.tmp`;
      // 1. Write to DB_FILE
      try {
        fs.writeFileSync(tmpFile, serialized, 'utf-8');
        fs.renameSync(tmpFile, DB_FILE);
      } catch {
        try { fs.writeFileSync(DB_FILE, serialized, 'utf-8'); } catch {}
      }

      // 2. Sync to legacy COMPAT_FILE for backward compatibility
      try {
        const compatTmp = `${COMPAT_FILE}.tmp`;
        fs.writeFileSync(compatTmp, serialized, 'utf-8');
        fs.renameSync(compatTmp, COMPAT_FILE);
      } catch {
        try { fs.writeFileSync(COMPAT_FILE, serialized, 'utf-8'); } catch {}
      }

      this.isDirty = false;
    } catch (saveErr) {
      console.warn(`[BOT DATABASE SAVE WARN]:`, saveErr.message);
    } finally {
      this.writeLock = false;
      if (this.isDirty) {
        setTimeout(() => this.save(), 500);
      }
    }
  }

  /**
   * Fetch a bot instance by ID
   */
  get(botId) {
    if (!botId) return null;
    return this.cache.get(botId) || null;
  }

  /**
   * Return all bot instances as a dictionary
   */
  getAll() {
    return Object.fromEntries(this.cache);
  }

  /**
   * Set or overwrite a bot instance
   */
  set(botId, data) {
    if (!botId || !data) return;
    data.updatedAt = new Date().toISOString();
    this.cache.set(botId, data);
    this.save();
  }

  /**
   * Atomically patch fields of an existing bot instance
   */
  update(botId, updates) {
    const existing = this.get(botId);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      customizations: {
        ...(existing.customizations || {}),
        ...(updates.customizations || {})
      }
    };

    this.cache.set(botId, merged);
    this.save();
    return merged;
  }

  /**
   * Delete a bot instance
   */
  delete(botId) {
    if (!this.cache.has(botId)) return false;
    this.cache.delete(botId);
    this.save();
    return true;
  }

  /**
   * Find instances by owner Discord User ID
   */
  findByOwner(ownerUserId) {
    if (!ownerUserId) return [];
    const results = [];
    for (const inst of this.cache.values()) {
      if (inst.ownerUserId === ownerUserId) {
        results.push(inst);
      }
    }
    return results;
  }

  /**
   * Find an instance assigned to a specific Guild ID
   */
  findByGuild(guildId) {
    if (!guildId) return null;
    for (const inst of this.cache.values()) {
      if (inst.guildId === guildId) {
        return inst;
      }
    }
    return null;
  }
}

// Global Singleton Database Instance
export const botDb = new BotDatabase();
