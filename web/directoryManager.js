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
  let cleanIcon = serverData.icon || serverData.iconUrl || existing?.icon || null;
  if (cleanIcon && !cleanIcon.startsWith('http://') && !cleanIcon.startsWith('https://') && !cleanIcon.startsWith('data:')) {
    cleanIcon = `https://cdn.discordapp.com/icons/${id}/${cleanIcon}.${cleanIcon.startsWith('a_') ? 'gif' : 'png'}?size=128`;
  }

  const cleanServer = {
    id,
    name: String(serverData.name || existing?.name || `Server ${id.slice(0, 6)}`).trim(),
    icon: cleanIcon,
    iconUrl: cleanIcon,
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
    const minutes = Math.ceil(remainingSeconds / 60);
    const cooldownErr = new Error(`⚠️ Cooldown Active: This server was bumped recently. You can run /bump again in ${minutes} minute${minutes === 1 ? '' : 's'}. (Limit: 1 bump per hour)`);
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

/** Claim bounty for joining server with real Anti-Raid Defense verification */
export function claimServerJoinBounty(userOrId, guildId) {
  const user = typeof userOrId === 'object' && userOrId !== null ? userOrId : { id: String(userOrId) };
  const userId = user.id;
  if (!userId) throw new Error('You must be signed in to earn credits.');
  const data = loadDirectoryData();
  const targetId = String(guildId);
  const server = data.servers.find(s => s.id === targetId);
  if (!server) throw new Error('Server not found in directory');

  if (server.ownerId && server.ownerId === userId) {
    throw new Error('You cannot claim credits for joining your own community.');
  }

  // 1. Anti-Raid: 7-Day Minimum Discord Account Age via Snowflake
  try {
    const discordEpoch = 1420070400000n;
    const createdAtMs = Number((BigInt(userId) >> 22n) + discordEpoch);
    const accountAgeDays = (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7) {
      throw new Error('Anti-Raid Defense: Discord account must be at least 7 days old to claim rewards.');
    }
  } catch (err) {
    if (err.message.includes('Anti-Raid')) throw err;
  }

  // 2. Anti-Raid: Default Avatar Filter
  if (server.requireAvatar !== false && !user.avatar && (user.avatarUrl?.includes('embed/avatars') || !user.avatarUrl)) {
    throw new Error('Anti-Raid Defense: A custom Discord profile avatar is required to claim rewards.');
  }

  // 3. Raid Wave Velocity Limiter: Rate-limit sudden bursts (max 5 claims in 60s)
  data.joinVelocity = data.joinVelocity || {};
  const recent = (data.joinVelocity[targetId] || []).filter(ts => Date.now() - ts < 60000);
  if (recent.length >= 5) {
    throw new Error('Raid Wave Velocity Limiter: Rapid join burst detected for this server. Please wait a moment.');
  }
  recent.push(Date.now());
  data.joinVelocity[targetId] = recent;

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

/** Delist / remove a server from directory */
export function removePromotedServer(guildId) {
  const data = loadDirectoryData();
  const targetId = String(guildId);
  data.servers = data.servers.filter(s => String(s.id) !== targetId);
  saveDirectoryData(data);
  return true;
}

/** Update specific parameters of a promoted server */
export function updatePromotedServerDetails(guildId, patch = {}) {
  const data = loadDirectoryData();
  const targetId = String(guildId);
  const server = data.servers.find(s => String(s.id) === targetId);
  if (!server) return null;

  if (patch.name !== undefined) server.name = String(patch.name).trim();
  if (patch.description !== undefined) server.description = String(patch.description).trim();
  if (patch.category !== undefined) server.category = String(patch.category).trim();
  if (patch.verified !== undefined) server.verified = Boolean(patch.verified);
  if (patch.memberCount !== undefined) server.memberCount = Number(patch.memberCount) || 0;
  if (patch.bumps !== undefined) server.bumps = Number(patch.bumps) || 0;
  if (patch.rewardCoins !== undefined) server.rewardCoins = Number(patch.rewardCoins) || 2;
  if (patch.inviteUrl !== undefined) server.inviteUrl = String(patch.inviteUrl).trim();
  if (patch.bannerUrl !== undefined) server.bannerUrl = String(patch.bannerUrl).trim();
  server.updatedAt = Date.now();

  saveDirectoryData(data);
  return server;
}

export function loadUserBalances() {
  const data = loadDirectoryData();
  return data.userBalances || {};
}

export function saveUserBalances(balances) {
  const data = loadDirectoryData();
  data.userBalances = balances;
  return saveDirectoryData(data);
}
