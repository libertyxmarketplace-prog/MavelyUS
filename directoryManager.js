import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DIRECTORY_FILE = path.join(DATA_DIR, 'promoted_servers.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDirectoryData() {
  try {
    if (fs.existsSync(DIRECTORY_FILE)) {
      const raw = fs.readFileSync(DIRECTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        servers: Array.isArray(parsed?.servers) ? parsed.servers : [],
        userBalances: parsed?.userBalances && typeof parsed.userBalances === 'object' ? parsed.userBalances : {},
        userJoins: parsed?.userJoins && typeof parsed.userJoins === 'object' ? parsed.userJoins : {},
        bumpCooldowns: parsed?.bumpCooldowns && typeof parsed.bumpCooldowns === 'object' ? parsed.bumpCooldowns : {}
      };
    }
  } catch (err) {
    console.warn('[DIRECTORY] Error reading directory file, initializing empty:', err.message);
  }
  return { servers: [], userBalances: {}, userJoins: {}, bumpCooldowns: {} };
}

function saveDirectoryData(data) {
  try {
    const tmp = `${DIRECTORY_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DIRECTORY_FILE);
    return true;
  } catch (err) {
    console.error('[DIRECTORY] Error writing directory file:', err);
    return false;
  }
}

/** Get all promoted servers sorted with latest bumps first */
export function getPromotedServers() {
  const data = loadDirectoryData();
  return data.servers.sort((a, b) => {
    const aTime = a.lastBumpedAt || a.createdAt || 0;
    const bTime = b.lastBumpedAt || b.createdAt || 0;
    return bTime - aTime;
  });
}

/** Upsert a server listing into permanent storage */
export function upsertPromotedServer(serverData, ownerUserId) {
  const data = loadDirectoryData();
  const id = String(serverData.id || serverData.guildId);
  if (!id) throw new Error('Missing server id');

  const existingIndex = data.servers.findIndex(s => s.id === id);
  const existing = existingIndex >= 0 ? data.servers[existingIndex] : null;

  const now = Date.now();
  const cleanServer = {
    id,
    name: String(serverData.name || existing?.name || `Server ${id.slice(0, 6)}`).trim(),
    icon: serverData.icon || serverData.iconUrl || existing?.icon || null,
    iconUrl: serverData.iconUrl || serverData.icon || existing?.iconUrl || null,
    category: serverData.category || serverData.serverCategory || existing?.category || 'Roleplay Server',
    categories: Array.isArray(serverData.categories) ? serverData.categories : [serverData.category || existing?.category || 'Roleplay Server'],
    language: serverData.language || existing?.language || 'English',
    description: String(serverData.description || serverData.serverDescription || existing?.description || '').trim(),
    tags: Array.isArray(serverData.tags) ? serverData.tags : (typeof serverData.serverTags === 'string' ? serverData.serverTags.split(',').map(t => t.trim()).filter(Boolean) : existing?.tags || []),
    rewardCoins: Number(serverData.rewardCoins || serverData.reward || existing?.rewardCoins || 2),
    inviteUrl: String(serverData.inviteUrl || existing?.inviteUrl || '').trim(),
    bannerUrl: String(serverData.bannerUrl || serverData.serverBannerUrl || existing?.bannerUrl || '').trim(),
    memberCount: Number(serverData.memberCount || existing?.memberCount || 0),
    bumps: Number(existing?.bumps || 0),
    lastBumpedAt: existing?.lastBumpedAt || now,
    ownerId: ownerUserId || existing?.ownerId || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    reviews: Array.isArray(existing?.reviews) ? existing.reviews : []
  };

  if (existingIndex >= 0) {
    data.servers[existingIndex] = cleanServer;
  } else {
    data.servers.unshift(cleanServer);
  }

  saveDirectoryData(data);
  return cleanServer;
}

/** Bump a server to #1 position (enforces 1-hour cooldown) */
export function bumpPromotedServer(guildId, userId) {
  const data = loadDirectoryData();
  const targetId = String(guildId);
  const server = data.servers.find(s => s.id === targetId);
  if (!server) {
    throw new Error('Server not found in directory');
  }

  const COOLDOWN_MS = 60 * 60 * 1000;
  const now = Date.now();
  const lastBump = Number(data.bumpCooldowns[targetId] || server.lastBumpedAt || 0);

  if (lastBump && (now - lastBump < COOLDOWN_MS)) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastBump)) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const cooldownErr = new Error(`Server was bumped recently. Next bump available in ${minutes}m ${seconds}s.`);
    cooldownErr.status = 429;
    cooldownErr.cooldownSeconds = remainingSeconds;
    throw cooldownErr;
  }

  data.bumpCooldowns[targetId] = now;
  server.lastBumpedAt = now;
  server.bumps = (Number(server.bumps) || 0) + 1;
  server.updatedAt = now;

  saveDirectoryData(data);
  return { success: true, server, lastBumpedAt: now };
}

/** Get balance and joined guilds for a user */
export function getUserCredits(userId) {
  if (!userId) return { balance: 0, joined: [] };
  const data = loadDirectoryData();
  const balance = Number(data.userBalances[userId] || 0);
  const joined = Array.isArray(data.userJoins[userId]) ? data.userJoins[userId] : [];
  return { balance, joined };
}

/** Claim bounty for joining server */
export function claimServerJoinBounty(userId, guildId) {
  if (!userId) throw new Error('You must be signed in to earn credits.');
  const data = loadDirectoryData();
  const targetId = String(guildId);
  const server = data.servers.find(s => s.id === targetId);
  if (!server) throw new Error('Server not found in directory');

  if (server.ownerId && server.ownerId === userId) {
    throw new Error('You cannot claim credits for joining your own community.');
  }

  const userJoined = Array.isArray(data.userJoins[userId]) ? data.userJoins[userId] : [];
  if (userJoined.includes(targetId)) {
    throw new Error('You have already claimed this bounty.');
  }

  const reward = Number(server.rewardCoins || 2);
  const currentBalance = Number(data.userBalances[userId] || 0);
  const newBalance = currentBalance + reward;

  data.userBalances[userId] = newBalance;
  userJoined.push(targetId);
  data.userJoins[userId] = userJoined;

  saveDirectoryData(data);
  return { success: true, newBalance, joined: userJoined, reward };
}
