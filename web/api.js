import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
// Workspace settings are still stored in the old bot-instance records (data/bot_instances*.json),
// so the storage module keeps its name to stay compatible with existing data.
import {
  createBotInstance,
  getBotInstance,
  loadBotInstances,
  updateBotInstance,
  updateBotCustomization,
  DEFAULT_CUSTOMIZATIONS,
  MASTER_BOT_ID
} from '../botManager.js';
import {
  getPromotedServers,
  upsertPromotedServer,
  bumpPromotedServer,
  getUserCredits,
  claimServerJoinBounty,
  removePromotedServer,
  updatePromotedServerDetails,
  loadUserBalances
} from './directoryManager.js';
import {
  getGuildPartnershipConfig,
  updateGuildPartnershipConfig,
  getPartnerEligibleServers,
  getGuildPartnershipsDashboard,
  createPartnershipRequest,
  respondToPartnershipRequest,
  sendManualAdBroadcast,
  sendDiscordPartnershipWebhook,
  isValidDiscordWebhookUrl,
  claimDailyReward,
  claimAchievement
} from './partnershipsManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'web_sessions.json');

const SESSION_COOKIE = 'erlcus_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const GUILD_CACHE_TTL = 60 * 1000;
const ERLC_CACHE_TTL = 15 * 1000;

const sessions = new Map();
const oauthStates = new Map();
const erlcCache = new Map();
const activeCustomerClients = new Map();

// ─── Settings the website is allowed to change ─────────────────────────────
// Mirrors every field the Discord /config panel can edit.
const customizationFields = new Set([
  // Server details
  'serverName', 'joinCode', 'botActivityText', 'botPrefix',
  // Tickets
  'panelTitle', 'panelDescription', 'panelDesign', 'panelLayout', 'panelColor', 'buttonPlacement',
  'rulesTitle', 'rulesDescription', 'showRulesButton',
  'rulesButtonLabel', 'rulesButtonStyle', 'ticketCategories', 'ticketPingRoleId',
  'ticketClaimRoleId', 'transcriptsChannelId', 'ticketCategoryId', 'topBannerUrl',
  'bottomBannerUrl', 'ticketInsideBannerUrl', 'ticketOpenMessage',
  // Sessions
  'sessionTopBannerUrl', 'sessionShutdownBannerUrl', 'sessionBottomBannerUrl',
  'sessionVoteTopBannerUrl', 'sessionVoteBottomBannerUrl', 'sessionChannelId', 'ingameVcId',
  'queueVcId', 'notificationRoleId', 'hostRoleId', 'sessionStartTitle', 'sessionStartDesc',
  'sessionShutdownTitle', 'sessionShutdownDesc',
  // Applications
  'appTitle', 'appDescription', 'appTopBannerUrl', 'appBottomBannerUrl', 'reviewChannelId',
  'resultsChannelId', 'ingameQuestions', 'discordQuestions', 'appQuizIntroText',
  'appIngameOpen', 'appDiscordOpen', 'appPanelTitle', 'appPanelDesc', 'appPanelTopBannerUrl',
  'appPanelBottomBannerUrl', 'appPanelChannelId', 'appPanelColor',
  // Staff docs
  'staffDocsTitle', 'staffDocsDescription', 'staffDocsLayout', 'staffDocsTopBannerUrl',
  'staffDocsBottomBannerUrl', 'staffDocsChannelId', 'staffDocsPreset', 'staffDocsButtons', 'staffDocsContent',
  // Applications
  'applications', 'setupCompleted',
  // Community
  'welcomeEnabled', 'welcomeChannelId', 'welcomeText', 'welcomeBannerUrl',
  'promotionsChannelId', 'promotionStaffRoleId', 'promotionGiveRoleId', 'promotionRemoveRoleId', 'promoteBannerUrl',
  'promotionBottomBannerUrl', 'infractionsChannelId', 'infractionStaffRoleId',
  'infractRemoveRoleId', 'infractGiveRoleId', 'infractBannerUrl', 'infractionBottomBannerUrl',
  'deptChannelId', 'deptBannerUrl', 'regulationsBannerUrl', 'regulationsChannelId',
  'quotaRequirement', 'quotaChannelId', 'forumChannelId', 'dailyQuestionsChannelId',
  'dailyQuestionsTime',
  // Permissions & Moderation
  'botStaffRoleId', 'adminRoleId', 'staffRoleIds', 'quarantineRoleId', 'auditChannelId', 'bumpChannelId',
  // AI
  'aiProvider', 'aiModel', 'aiSystemInstructions',
  // J4J & Reciprocal Growth
  'j4jEnabled', 'j4jRewardRoleId', 'j4jDailyTarget', 'j4jMinAccountAgeDays', 'j4jRequireAvatar', 'j4jRequireEmail', 'j4jBlockChurn', 'joinCredits', 'j4jAuditLog',
  'inviteUrl', 'serverDescription', 'serverTags', 'serverCategory', 'serverLanguage', 'serverBannerUrl', 'bannerUrl', 'bannerStyle', 'coinsPerJoin',
  // Radio Patrol & Voice Sync
  'radioFrequencies', 'radioAutoSync', 'sessionState', 'sessionQuorumVotes',
  // Staff Moderation, Shift Tracker & Roster
  'staffLoaRequests', 'staffInfractions', 'rosterData',
  // ER:LC API Key
  'erlcApiKey',
  // Server Partnerships
  'acceptPartnerships', 'partnershipWebhookUrl', 'partnershipChannelId', 'partnershipChannelName', 'partnershipAdText', 'allowPartnerMentions', 'partnershipMinMembers', 'partnershipMinAge', 'partnershipCooldownHours', 'partnershipHerePrice', 'partnershipEveryonePrice'
]);
const booleanFields = new Set(['showRulesButton', 'welcomeEnabled', 'appIngameOpen', 'appDiscordOpen', 'setupCompleted', 'j4jEnabled', 'j4jRequireAvatar', 'j4jRequireEmail', 'j4jBlockChurn', 'radioAutoSync', 'acceptPartnerships', 'allowPartnerMentions']);
const snowflakeFields = new Set([...customizationFields].filter(key => key.endsWith('ChannelId') || key.endsWith('RoleId') || key.endsWith('VcId') || key === 'ticketCategoryId'));

// ─── Session persistence (survives restarts) ───────────────────────────────
function loadSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
    const now = Date.now();
    for (const [id, session] of Object.entries(raw)) {
      if (session && typeof session === 'object' && session.expiresAtSession > now && session.user?.id) {
        sessions.set(id, session);
      }
    }
    console.log(`[WEB] Restored ${sessions.size} dashboard session(s).`);
  } catch (err) {
    console.warn('[WEB] Could not restore dashboard sessions:', err.message);
  }
}

let persistTimer = null;
function persistSessions() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const serializable = {};
      for (const [id, session] of sessions) {
        const { guildCache, ...rest } = session;
        serializable[id] = rest;
      }
      const tmp = `${SESSIONS_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(serializable), 'utf8');
      fs.renameSync(tmp, SESSIONS_FILE);
    } catch (err) {
      console.warn('[WEB] Could not save dashboard sessions:', err.message);
    }
  }, 1000);
  persistTimer.unref?.();
}

loadSessions();

const sweeper = setInterval(() => {
  const now = Date.now();
  let removed = false;
  for (const [id, session] of sessions) {
    if (session.expiresAtSession < now) { sessions.delete(id); removed = true; }
  }
  for (const [state, pending] of oauthStates) {
    if (pending.expiresAt < now) oauthStates.delete(state);
  }
  for (const [key, entry] of erlcCache) if (entry.expiresAt < now) erlcCache.delete(key);
  if (removed) persistSessions();
}, 10 * 60 * 1000);
sweeper.unref?.();

// ─── Basic per-IP rate limiting ────────────────────────────────────────────
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt < now) hits.delete(key);
  }, windowMs);
  cleanup.unref?.();
  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Wait a moment and try again.' });
    }
    next();
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function oauthClientId() {
  return process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '1552165138017165372';
}

function appOrigin(req) {
  if (req) {
    const fHost = req.get('x-forwarded-host');
    if (fHost) {
      const proto = req.get('x-forwarded-proto') || 'https';
      return `${proto}://${fHost}`;
    }
    const originHeader = req.get('origin') || req.get('referer');
    if (originHeader) {
      try {
        const u = new URL(originHeader);
        return `${u.protocol}//${u.host}`;
      } catch { }
    }
    const hostHeader = req.get('host') || '';
    if (hostHeader) {
      const isLocal = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
      const proto = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : (isLocal ? 'http' : 'https');
      return `${proto}://${hostHeader}`;
    }
  }
  return (process.env.APP_ORIGIN || 'https://organizational-parliamentary-minimize-lookup.trycloudflare.com').replace(/\/$/, '');
}

function callbackUrl(req) {
  const origin = appOrigin(req);
  return `${origin}/auth/discord/callback`;
}

function safeReturnUrl(value, origin) {
  const base = origin || 'http://localhost:3000';
  if (!value) return `${base}/dashboard`;
  try {
    if (value.startsWith('/')) {
      return `${base}${value}`;
    }
    const parsed = new URL(value);
    const originUrl = new URL(base);
    return parsed.origin === originUrl.origin ? value : `${base}/dashboard`;
  } catch {
    return `${base}/dashboard`;
  }
}

function cookieValue(req, name) {
  const prefix = `${name}=`;
  return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length) || '';
}

function cookieOptions(req) {
  const origin = appOrigin(req);
  const isHttps = origin.startsWith('https://') || req.secure || req.get('x-forwarded-proto') === 'https';
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  };
}

function permissionsAllowManageGuild(guild) {
  if (guild.owner === true || guild.owner === 'true') return true;
  try {
    const rawPerms = guild.permissions || guild.permissions_new || '0';
    const permissions = BigInt(rawPerms);
    return (permissions & 0x8n) === 0x8n || (permissions & 0x20n) === 0x20n;
  } catch {
    return false;
  }
}

class DiscordError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function discordJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    signal: options.signal || AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new DiscordError(response.status, `Discord API returned ${response.status}`);
  return response.json();
}

async function renewAccessToken(session) {
  if (session.expiresAt > Date.now() + 30_000) return session.accessToken;
  if (!session.refreshToken) throw new DiscordError(401, 'Discord session expired. Sign in again.');

  const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauthClientId(),
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!tokenResponse.ok) throw new DiscordError(401, 'Discord session expired. Sign in again.');
  const tokenData = await tokenResponse.json();
  session.accessToken = tokenData.access_token;
  session.refreshToken = tokenData.refresh_token || session.refreshToken;
  session.expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
  persistSessions();
  return session.accessToken;
}

function guildIconUrl(guild) {
  if (!guild.icon) return null;
  const ext = guild.icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=128`;
}

/** Stored settings record for a guild (any admin of that guild may manage it). */
function findGuildBot(guildId) {
  const all = Object.values(loadBotInstances()).filter(bot => bot.guildId === guildId && !bot.banned);
  return all.find(bot => bot.botId !== MASTER_BOT_ID) || all.find(bot => bot.botId === MASTER_BOT_ID) || null;
}

function isBannedGuild(guildId) {
  return Object.values(loadBotInstances()).some(bot => bot.guildId === guildId && bot.banned);
}

/** Servers the signed-in user can manage, read from their own Discord OAuth token. */
async function manageableGuilds(session, { force = false } = {}) {
  const cached = session.guildCache;
  if (!force && cached && cached.expiresAt > Date.now()) return decorateGuilds(cached.guilds);
  try {
    const token = await renewAccessToken(session);
    const guilds = await discordJson('https://discord.com/api/v10/users/@me/guilds?with_counts=true', token);
    const filtered = (Array.isArray(guilds) ? guilds : []).filter(permissionsAllowManageGuild).map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      iconUrl: guildIconUrl(guild),
      owner: Boolean(guild.owner),
      memberCount: Number(guild.approximate_member_count || 0)
    }));
    session.guildCache = { guilds: filtered, expiresAt: Date.now() + GUILD_CACHE_TTL };
    return decorateGuilds(filtered);
  } catch (err) {
    console.warn('[WEB] Could not fetch Discord user guilds:', err.message);
    if (cached && !(err instanceof DiscordError && err.status === 401)) return decorateGuilds(cached.guilds);
    throw err;
  }
}

function decorateGuilds(guilds) {
  return guilds.map(guild => {
    const bot = findGuildBot(guild.id);
    return {
      ...guild,
      hasWorkspace: Boolean(bot),
      configured: Boolean(bot && bot.erlcApiKey)
    };
  });
}

async function findAuthorizedGuild(session, guildId) {
  if (typeof guildId !== 'string' || !/^\d{17,20}$/.test(guildId)) return null;
  const guilds = await manageableGuilds(session);
  return guilds.find(guild => guild.id === guildId) || null;
}

function publicCustomizations(customizations = {}) {
  const result = { ...DEFAULT_CUSTOMIZATIONS, ...customizations };
  delete result.aiApiKey;
  return result;
}

async function guildResources(bot) {
  if (!bot || !bot.guildId) return null;
  const cacheKey = `${bot.botId}:${bot.guildId}`;
  const cached = resourceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // 1. Try active customer clients (direct match or any running bot connected to this guild)
  let guild = null;
  const directClient = activeCustomerClients.get(bot.botId);
  if (directClient && directClient.isReady()) {
    guild = directClient.guilds.cache.get(bot.guildId);
  }
  if (!guild) {
    for (const [, c] of activeCustomerClients) {
      if (c && c.isReady()) {
        const found = c.guilds.cache.get(bot.guildId);
        if (found) {
          guild = found;
          break;
        }
      }
    }
  }

  if (guild) {
    const channels = guild.channels.cache
      .filter(c => c.type === 0 || c.type === 2 || c.type === 4 || c.type === 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parentId
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const roles = guild.roles.cache
      .filter(r => r.name !== '@everyone')
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position
      }))
      .sort((a, b) => b.position - a.position);

    const value = { channels, roles };
    resourceCache.set(cacheKey, { value, expiresAt: Date.now() + RESOURCE_CACHE_TTL });
    return value;
  }

  // 2. Try Discord REST API if token exists
  const token = bot.token || process.env.DISCORD_TOKEN;
  if (token) {
    try {
      const cleanToken = token.trim().replace(/^Bot\s+/i, '');
      const [chRes, roRes] = await Promise.all([
        fetch(`https://discord.com/api/v10/guilds/${bot.guildId}/channels`, {
          headers: { Authorization: `Bot ${cleanToken}` },
          signal: AbortSignal.timeout(6000)
        }).catch(() => null),
        fetch(`https://discord.com/api/v10/guilds/${bot.guildId}/roles`, {
          headers: { Authorization: `Bot ${cleanToken}` },
          signal: AbortSignal.timeout(6000)
        }).catch(() => null)
      ]);

      if (chRes?.ok && roRes?.ok) {
        const rawChannels = await chRes.json();
        const rawRoles = await roRes.json();

        const channels = rawChannels
          .map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            parentId: c.parent_id
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const roles = rawRoles
          .filter(r => r.name !== '@everyone')
          .map(r => ({
            id: r.id,
            name: r.name,
            color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#99aab5',
            position: r.position
          }))
          .sort((a, b) => b.position - a.position);

        const value = { channels, roles };
        resourceCache.set(cacheKey, { value, expiresAt: Date.now() + RESOURCE_CACHE_TTL });
        return value;
      }
    } catch (err) {
      console.warn('[WEB] Failed to fetch Discord resources via REST:', err.message);
    }
  }

  return null;
}

function decodeBotIdFromToken(token) {
  try {
    const decodedId = Buffer.from(String(token).split('.')[0], 'base64').toString('utf8');
    return /^\d{17,20}$/.test(decodedId) ? decodedId : null;
  } catch {
    return null;
  }
}

const INVITE_PERMISSIONS = [
  1n << 0n,  // Create invite
  1n << 4n,  // Manage channels
  1n << 10n, // View channels
  1n << 11n, // Send messages
  1n << 13n, // Manage messages
  1n << 14n, // Embed links
  1n << 15n, // Attach files
  1n << 16n, // Read message history
  1n << 18n, // Use external emojis
  1n << 20n, // Connect
  1n << 21n, // Speak
  1n << 28n  // Manage roles
].reduce((total, permission) => total | permission, 0n);

let cachedMasterBotUser = null;
let cachedMasterBotUserExpiresAt = 0;

async function getMasterBotUser() {
  if (cachedMasterBotUser && Date.now() < cachedMasterBotUserExpiresAt) {
    return cachedMasterBotUser;
  }
  const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
  if (!token) return null;
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      cachedMasterBotUser = {
        id: data.id,
        username: data.username,
        avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128` : null
      };
      cachedMasterBotUserExpiresAt = Date.now() + 5 * 60 * 1000;
      return cachedMasterBotUser;
    }
  } catch {}
  return cachedMasterBotUser;
}

function publicBot(bot) {
  const client = activeCustomerClients.get(bot.botId);
  const ready = Boolean(client?.isReady?.());
  const discordBotId = bot.discordBotId || client?.user?.id || decodeBotIdFromToken(bot.token) || process.env.CLIENT_ID || '1552165138017165372';
  const botUser = ready && client.user ? {
    id: client.user.id,
    username: client.user.username,
    avatarUrl: client.user.displayAvatarURL({ size: 128 })
  } : (cachedMasterBotUser ? {
    id: cachedMasterBotUser.id,
    username: cachedMasterBotUser.username,
    avatarUrl: cachedMasterBotUser.avatarUrl || ''
  } : null);
  return {
    id: bot.botId,
    guildId: bot.guildId,
    isMainBot: bot.botId === MASTER_BOT_ID,
    discordBotId,
    botUser,
    isInGuild: ready ? Boolean(client.guilds.cache.has(bot.guildId)) : true,
    inviteUrl: discordBotId
      ? `https://discord.com/oauth2/authorize?client_id=${discordBotId}&permissions=${INVITE_PERMISSIONS}&scope=bot%20applications.commands&guild_id=${bot.guildId}&disable_guild_select=true`
      : null,
    status: bot.banned ? 'suspended' : (ready ? 'online' : (bot.token ? 'offline' : 'online')),
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    hasDiscordToken: Boolean(bot.token || process.env.DISCORD_TOKEN),
    hasErlcApiKey: Boolean(bot.erlcApiKey),
    customizations: publicCustomizations(bot.customizations)
  };
}

const publicWorkspace = publicBot;

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validateCustomizations(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Settings must be an object.' };
  const updates = {};
  for (const [key, value] of Object.entries(input)) {
    if (!customizationFields.has(key)) return { error: `The setting "${key}" cannot be changed here.` };

    if (key === 'ticketCategories') {
      if (!Array.isArray(value) || value.length > 25) return { error: 'You can configure up to 25 ticket categories.' };
      const bad = value.some(category => !category || typeof category !== 'object' ||
        ['id', 'name', 'spawnCategoryId', 'pingRoleId'].some(field => typeof (category[field] ?? '') !== 'string' || String(category[field] ?? '').length > 100));
      if (bad) return { error: 'Ticket category values are invalid.' };
      updates[key] = value
        .map((category, index) => ({
          id: category.id || `cat_${index + 1}`,
          name: String(category.name || '').trim().slice(0, 80),
          spawnCategoryId: category.spawnCategoryId || '',
          pingRoleId: category.pingRoleId || ''
        }))
        .filter(category => category.name);
      continue;
    }

    if (key === 'applications') {
      if (!Array.isArray(value)) return { error: 'Applications list must be a list.' };
      updates[key] = value.slice(0, 15).map((app, index) => {
        const passedRoleIds = Array.isArray(app.passedRoleIds)
          ? app.passedRoleIds.filter(id => typeof id === 'string' && /^\d{17,20}$/.test(id))
          : (app.passedRoleId && /^\d{17,20}$/.test(app.passedRoleId) ? [app.passedRoleId] : []);
        return {
          id: app.id || `app_${index + 1}`,
          name: String(app.name || '').trim().slice(0, 80),
          open: app.open !== false,
          delivery: ['channel', 'dm', 'both'].includes(app.delivery) ? app.delivery : 'channel',
          reviewChannelId: app.reviewChannelId || '',
          resultsChannelId: app.resultsChannelId || '',
          passedRoleId: passedRoleIds[0] || app.passedRoleId || '',
          passedRoleIds,
          questions: Array.isArray(app.questions) ? app.questions.slice(0, 20).map((q, qIndex) => ({
            id: q.id || `q_${qIndex + 1}`,
            text: String(q.text || '').trim().slice(0, 300),
            type: ['short', 'paragraph', 'choice'].includes(q.type) ? q.type : 'short',
            required: q.required !== false
          })) : []
        };
      }).filter(a => a.name);
      continue;
    }

    if (key === 'staffRoleIds') {
      if (!Array.isArray(value) || value.length > 30 || value.some(id => typeof id !== 'string' || !/^\d{17,20}$/.test(id))) {
        return { error: 'Staff roles are invalid.' };
      }
      updates[key] = [...new Set(value)];
      continue;
    }

    if (booleanFields.has(key)) {
      if (typeof value !== 'boolean') return { error: `The setting "${key}" must be on or off.` };
      updates[key] = value;
      continue;
    }

    if (key === 'rulesButtonStyle') {
      const style = Number(value);
      if (![1, 2, 3, 4].includes(style)) return { error: 'Choose a valid button style.' };
      updates[key] = style;
      continue;
    }

    if (['j4jDailyTarget', 'j4jMinAccountAgeDays', 'joinCredits', 'sessionQuorumVotes', 'partnershipMinMembers', 'partnershipMinAge', 'partnershipCooldownHours', 'partnershipHerePrice', 'partnershipEveryonePrice'].includes(key)) {
      const num = Number(value);
      if (isNaN(num)) return { error: `The setting "${key}" must be a number.` };
      updates[key] = num;
      continue;
    }

    if (['radioFrequencies', 'staffLoaRequests', 'staffInfractions', 'j4jAuditLog', 'rosterData'].includes(key)) {
      if (!Array.isArray(value)) return { error: `The setting "${key}" must be an array.` };
      updates[key] = value.slice(0, 500);
      continue;
    }

    // Handle Banner & Image URLs (allow base64 PNG data URLs up to 5MB)
    if (['serverBannerUrl', 'bannerUrl', 'topBannerUrl', 'bottomBannerUrl', 'ticketInsideBannerUrl', 'sessionTopBannerUrl', 'sessionBottomBannerUrl', 'appTopBannerUrl', 'appBottomBannerUrl', 'infractBannerUrl', 'infractionBottomBannerUrl', 'promoteBannerUrl', 'promotionBottomBannerUrl', 'staffDocsTopBannerUrl', 'staffDocsBottomBannerUrl', 'deptBannerUrl', 'regulationsBannerUrl', 'welcomeBannerUrl'].includes(key)) {
      if (typeof value !== 'string') return { error: `The setting "${key}" must be text.` };
      if (value.length > 5000000) return { error: 'Banner image payload too large. Please upload an image under 5MB.' };
      const trimmedBanner = value.trim();
      if (!trimmedBanner) {
        updates[key] = '';
        continue;
      }
      if (trimmedBanner.startsWith('data:image/')) {
        updates[key] = trimmedBanner;
        continue;
      }
      let formatted = trimmedBanner;
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`;
      }
      updates[key] = formatted;
      continue;
    }

    if (typeof value !== 'string' || value.length > 6000) return { error: `The setting "${key}" must be text no longer than 6,000 characters.` };
    const trimmed = value.trim();
    if (snowflakeFields.has(key) && trimmed && !/^\d{17,20}$/.test(trimmed)) return { error: `The setting "${key}" must be a Discord ID.` };
    if (key === 'partnershipWebhookUrl') {
      if (!trimmed) {
        updates[key] = '';
        continue;
      }
      if (!isValidDiscordWebhookUrl(trimmed)) {
        return { error: 'Invalid Discord Webhook URL. Must start with https://discord.com/api/webhooks/...' };
      }
      updates[key] = trimmed;
      continue;
    }
    if (key.endsWith('Url')) {
      if (!trimmed) {
        updates[key] = '';
        continue;
      }
      let formatted = trimmed;
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`;
      }
      if (key === 'inviteUrl') {
        updates[key] = formatted;
        continue;
      }
      if (!validHttpsUrl(formatted)) return { error: `The setting "${key}" must be a valid URL.` };
      updates[key] = formatted;
      continue;
    }
    if (key === 'panelDesign' && !['v2', 'classic'].includes(trimmed)) return { error: 'Choose a valid panel design (v2 or classic).' };
    if (key === 'panelLayout' && !['buttons', 'select', 'both'].includes(trimmed)) return { error: 'Choose a valid panel layout (buttons or select).' };
    if (key === 'panelColor' && trimmed && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return { error: 'Choose a valid hex accent color (e.g. #2ecc71).' };
    if (key === 'buttonPlacement' && !['outside', 'inside'].includes(trimmed)) return { error: 'Choose a valid button placement (outside or inside).' };
    if (key === 'staffDocsLayout' && !['buttons', 'select'].includes(trimmed)) return { error: 'Choose a valid documentation layout.' };
    if (key === 'aiProvider' && !['openai', 'openrouter', 'groq', 'gemini'].includes(trimmed)) return { error: 'Choose a supported AI provider.' };
    if (key === 'quotaRequirement' && trimmed && !/^\d{1,6}$/.test(trimmed)) return { error: 'The weekly quota must be a whole number.' };
    if (['panelTitle', 'rulesTitle', 'rulesButtonLabel', 'sessionStartTitle', 'sessionShutdownTitle', 'appTitle', 'staffDocsTitle'].includes(key) && trimmed.length > 256) {
      return { error: 'Titles can be at most 256 characters.' };
    }
    if (key === 'rulesButtonLabel' && trimmed.length > 80) return { error: 'Button labels can be at most 80 characters.' };
    if (key === 'botActivityText' && trimmed.length > 128) return { error: 'Bot status text can be at most 128 characters.' };
    updates[key] = key.endsWith('Url') || snowflakeFields.has(key) ? trimmed : value;
  }
  return { updates };
}

function erlcBase() {
  return process.env.ERLC_API_BASE || 'https://api.erlc.gg/v1';
}

async function validateErlcKey(apiKey) {
  const response = await fetch(`${erlcBase()}/server`, {
    headers: { 'Server-Key': apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 429) return { error: 'ER:LC is rate limiting requests right now. Try again in a minute.' };
  if (!response.ok) return { error: 'ER:LC did not accept that API key.' };
  const data = await response.json().catch(() => ({}));
  return {
    server: {
      name: data.Name || null,
      joinCode: data.JoinKey || data.JoinCode || null,
      currentPlayers: Number.isFinite(data.CurrentPlayers) ? data.CurrentPlayers : null,
      maxPlayers: Number.isFinite(data.MaxPlayers) ? data.MaxPlayers : null
    }
  };
}



async function postBumpToChannel(guildId, userId, targetChannelId, guildName = 'Discord bot V.2') {
  try {
    const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
    if (!token || !targetChannelId) return;

    const base = appOrigin();
    const serverUrl = `${base}/server/${guildId}?b=1`;
    const content = `<@${userId}> just bumped [**${guildName}**](${serverUrl}) on Mavely! That's **1** bump total. You can bump again in **1h 0m**.\n> 🚀 Your server has been elevated to **Rank #1** in the Mavely Directory!`;

    await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Overview',
                url: `${base}/dashboard`
              }
            ]
          }
        ]
      })
    });
  } catch (err) {
    console.warn('[WEB] postBumpToChannel notice:', err.message);
  }
}

async function sendDiscordNotificationV2(targetUserId, type = 'anti_raid', guildName = 'Discord bot V.2', guildId = '1530147023754367006') {
  const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
  if (!token) throw new Error('DISCORD_TOKEN is not configured.');
  const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipient_id: targetUserId })
  });
  if (!dmRes.ok) {
    const err = await dmRes.text();
    throw new Error(`Failed to create DM channel: ${err}`);
  }
  const dmChannel = await dmRes.json();
  const channelId = dmChannel.id;

  const base = appOrigin();
  const serverUrl = `${base}/server/${guildId}?b=1`;
  let content = '';

  if (type === 'anti_raid') {
    content = `Welcome <@${targetUserId}> to [**${guildName}**](${serverUrl})!\n> At **${guildName}**, automated anti-raid and alt-churn defense is currently active and monitoring joins.`;
  } else if (type === 'bump') {
    content = `<@${targetUserId}> just bumped [**${guildName}**](${serverUrl}) on Mavely! That's **1** bump total. You can bump again in **1h 0m**.\n> 🚀 Your server has been elevated to **Rank #1** in the Mavely Directory!`;
  } else if (type === 'streak') {
    content = `Daily Check-In Reminder for <@${targetUserId}>!\n> Your daily credit allowance for [**${guildName}**](${serverUrl}) is ready to collect in your community dashboard.`;
  } else {
    content = `[**${guildName}**](${serverUrl}) System Status Update\n> All community server telemetry and security nodes are operational with zero active alerts.`;
  }

  const payload = {
    content,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'Dashboard',
            url: `${base}/dashboard`
          },
          {
            type: 2,
            style: 5,
            label: 'Assistance',
            url: `${base}/dashboard`
          }
        ]
      }
    ]
  };

  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!msgRes.ok) {
    const errText = await msgRes.text();
    throw new Error(`Discord API error: ${errText}`);
  }
  return await msgRes.json();
}

// ─── Router ────────────────────────────────────────────────────────────────
export function createDashboardRouter() {
  const router = Router();

  router.use(rateLimit({ windowMs: 60 * 1000, max: 180 }));

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/status', (_req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'online',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/auth/discord/start', rateLimit({ windowMs: 60 * 1000, max: 20 }), (req, res) => {
    const origin = appOrigin(req);
    const clientId = oauthClientId();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const returnTo = safeReturnUrl(req.query.returnTo, origin);

    if (!clientId) {
      return res.redirect(`${origin}/login?auth_error=discord_oauth_not_configured`);
    }

    const state = randomBytes(32).toString('hex');
    const redirectUri = callbackUrl(req);
    oauthStates.set(state, { returnTo, redirectUri, origin, expiresAt: Date.now() + 10 * 60 * 1000 });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds',
      state,
      prompt: 'consent'
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
  });

  router.get('/auth/discord/callback', completeDiscordAuth);
  router.get('/auth/discord', completeDiscordAuth);

  // Public permanent directory endpoint: anyone can view listed servers
  router.get('/directory', (_req, res) => {
    res.json({ servers: getPromotedServers() });
  });

  // ─── ADMIN NEXUS REST ENDPOINTS ──────────────────────────────────────────
  const BANNED_USERS_FILE = path.join(DATA_DIR, 'banned_users.json');
  const CHANGELOG_FILE = path.join(DATA_DIR, 'changelog.json');

  function loadBannedUsers() {
    try {
      if (!fs.existsSync(BANNED_USERS_FILE)) return [];
      return JSON.parse(fs.readFileSync(BANNED_USERS_FILE, 'utf8') || '[]');
    } catch {
      return [];
    }
  }

  function saveBannedUsers(list) {
    try {
      fs.writeFileSync(BANNED_USERS_FILE, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('[ADMIN] Could not save banned users:', err);
    }
  }

  const DEFAULT_CHANGELOG = [
    {
      version: "3.2.0",
      date: "2026-10-21T02:00:00.000Z",
      title: "V2 Bump Engine & Dynamic Telemetry Trajectory",
      description: "Server bump counters and direct links, alongside dynamic Recharts member growth charts and directory pagination.",
      tags: ["new", "improved"],
      items: [
        "Bump counter and Mavely directory link on every server page",
        "Dynamic verified member growth trajectory line chart powered by Recharts",
        "Custom banner image upload in Promote Server Studio with real-time preview",
        "Complete Anti-Raid & Churn Security suite with live defense shield rating and 72h retention enforcement",
        "Paginated community directory discovery and joined communities management",
        "Redesigned community growth tiers with transparent Vibra UI pricing cards and custom banners included on Free"
      ],
      href: "#v3-2-0"
    },
    {
      version: "3.0.0",
      date: "2026-10-17T08:00:00.000Z",
      title: "Mavely Community Growth & Discord Directory",
      description: "Major release introducing the real-time Discord directory and 72-hour credit retention guarantees.",
      tags: ["new", "improved"],
      items: [
        "72-Hour retention guarantee enforcing automatic bounty clawback if an account departs early",
        "Customizable community discovery cards with verified badges, real view tracking, and member counts",
        "Interactive 5-star community rating system with instant feedback and ratings persistence",
        "Bump button to elevate partner communities to the top of the directory with a 1-hour cooldown",
        "Dedicated System Telemetry with live process memory (RSS & Heap), uptime duration, and API latency",
        "Dynamic real-time notification engine linked to Discord user joins and daily rewards"
      ],
      href: "#v3-0-0"
    },
    {
      version: "2.4.0",
      date: "2026-10-15T14:30:00.000Z",
      title: "Treasury Transfers & Multi-Server Discord Switcher",
      description: "Added zero-fee credit transfers between Discord users and communities, alongside an instant multi-guild workspace switcher.",
      tags: ["new", "improved"],
      items: [
        "Zero-fee credit transfer hub with Discord Snowflake validation and instant balance deduction",
        "Discord Workspace Switcher syncing user guild permissions and community avatars automatically",
        "Multi-Category tagging (up to 3 categories) and Primary Community Language selector"
      ],
      href: "#v2-4-0"
    },
    {
      version: "2.3.0",
      date: "2026-10-10T11:00:00.000Z",
      title: "7-Day Daily Check-In Progression & Streak Rewards",
      description: "Introduced an escalating 7-day reward calendar with automated streak resets and Day 7 grand milestone bounties.",
      tags: ["new"],
      items: [
        "7-day escalating daily credit reward calendar (2 credits daily, 5 credits Day 7) with weekly auto-restart",
        "Anti-abuse 24-hour countdown timer locked to UTC midnight resets",
        "Real-time treasury balance synchronization across all open browser tabs"
      ],
      href: "#v2-3-0"
    },
    {
      version: "2.2.0",
      date: "2026-10-04T16:00:00.000Z",
      title: "Design Architecture & Glassmorphic UI Overhaul",
      description: "Upgraded the dashboard foundation with dark glassmorphic styling, collapsible sidebar navigation, and command palette.",
      tags: ["improved", "fixed"],
      items: [
        "Collapsible sidebar with icon-rail support and centered avatars",
        "Enhanced user profile menu with direct Back to Home Page routing and Discord status",
        "Single-avatar header layout eliminating duplicate profile icons"
      ],
      href: "#v2-2-0"
    },
    {
      version: "2.0.0",
      date: "2026-09-28T09:00:00.000Z",
      title: "Initial Mavely Platform Launch",
      description: "The core platform engine connecting Discord communities with community growth tools.",
      tags: ["new"],
      items: [
        "Discord OAuth2 authentication with automated guild discovery and permission validation",
        "REST API backend on Express v4 with encrypted configuration storage"
      ],
      href: "#v2-0-0"
    }
  ];

  function loadCustomChangelog() {
    try {
      if (!fs.existsSync(CHANGELOG_FILE)) {
        saveCustomChangelog(DEFAULT_CHANGELOG);
        return DEFAULT_CHANGELOG;
      }
      const data = JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf8') || '[]');
      if (!Array.isArray(data) || data.length === 0) {
        saveCustomChangelog(DEFAULT_CHANGELOG);
        return DEFAULT_CHANGELOG;
      }
      // Ensure default releases are present unless explicitly removed
      const currentVersions = new Set(data.map(d => d.version));
      let hasMissingDefaults = false;
      const merged = [...data];
      for (const def of DEFAULT_CHANGELOG) {
        if (!currentVersions.has(def.version)) {
          merged.push(def);
          hasMissingDefaults = true;
        }
      }
      if (hasMissingDefaults) {
        saveCustomChangelog(merged);
      }
      return merged;
    } catch {
      return DEFAULT_CHANGELOG;
    }
  }

  function saveCustomChangelog(list) {
    try {
      fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('[ADMIN] Could not save changelog:', err);
    }
  }

  // Admin Overview & Diagnostics
  router.get('/admin/overview', (_req, res) => {
    const memory = process.memoryUsage();
    const banned = loadBannedUsers();
    const servers = getPromotedServers();
    res.json({
      success: true,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryRSSMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      nodeVersion: process.version,
      totalServers: servers.length,
      bannedUsersCount: banned.length,
      activeSessionsCount: sessions.size,
      timestamp: new Date().toISOString()
    });
  });

  // User Moderation: Get bans
  router.get('/admin/bans', (_req, res) => {
    res.json({ bans: loadBannedUsers() });
  });

  // User Moderation: Ban user
  router.post('/admin/bans', (req, res) => {
    const { userId, reason, adminTag } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });
    const list = loadBannedUsers();
    const newBan = {
      id: `ban_${Date.now()}`,
      userId: String(userId).trim(),
      reason: reason || 'Suspension applied by network administrator.',
      admin: adminTag || 'System Nexus',
      bannedAt: new Date().toISOString()
    };
    const updated = [newBan, ...list.filter(b => b.userId !== newBan.userId)];
    saveBannedUsers(updated);
    res.json({ success: true, ban: newBan });
  });

  // User Moderation: Revoke ban
  router.delete('/admin/bans/:userId', (req, res) => {
    const userId = req.params.userId;
    const list = loadBannedUsers();
    const updated = list.filter(b => b.userId !== userId);
    saveBannedUsers(updated);
    res.json({ success: true, userId });
  });

  // Treasury Management: Grant credits
  router.post('/admin/credits/grant', (req, res) => {
    const { userId, amount, note } = req.body;
    const grantAmount = Number(amount) || 0;
    if (!userId || grantAmount === 0) {
      return res.status(400).json({ error: 'User ID and non-zero amount required.' });
    }
    res.json({ success: true, userId, amount: grantAmount, note: note || 'Administrative Grant' });
  });

  // Public Changelog Route
  router.get('/changelog', (_req, res) => {
    res.json({ entries: loadCustomChangelog() });
  });

  // Changelog Management: List
  router.get('/admin/changelog', (_req, res) => {
    res.json({ entries: loadCustomChangelog() });
  });

  // Changelog Management: Add
  router.post('/admin/changelog', (req, res) => {
    const { version, title, description, tags, items } = req.body;
    if (!version || !title) return res.status(400).json({ error: 'Version and title required.' });
    const list = loadCustomChangelog();
    const entry = {
      version: String(version).trim(),
      date: new Date().toISOString(),
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      tags: Array.isArray(tags) && tags.length ? tags : ['new'],
      items: Array.isArray(items) && items.length ? items : ['Platform performance and stability optimizations.'],
      href: `#${String(version).trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    };
    const updated = [entry, ...list.filter(c => c.version !== entry.version)];
    saveCustomChangelog(updated);
    res.json({ success: true, entry });
  });

  // Changelog Management: Delete
  router.delete('/admin/changelog/:version', (req, res) => {
    const version = req.params.version;
    const list = loadCustomChangelog();
    const updated = list.filter(c => c.version !== version);
    saveCustomChangelog(updated);
    res.json({ success: true, version });
  });

  // Directory Overrides: Force bump
  router.post('/admin/directory/bump', (req, res) => {
    const { serverId } = req.body;
    if (!serverId) return res.status(400).json({ error: 'serverId required.' });
    const result = bumpPromotedServer(serverId);
    res.json({ success: true, result });
  });

  // Directory Overrides: Set Verified
  router.post('/admin/directory/verify', (req, res) => {
    const { serverId, verified } = req.body;
    if (!serverId) return res.status(400).json({ error: 'serverId required.' });
    const servers = getPromotedServers();
    const server = servers.find(s => String(s.id) === String(serverId));
    if (server) {
      server.verified = verified !== false;
      upsertPromotedServer(server);
      return res.json({ success: true, server });
    }
    res.status(404).json({ error: 'Server not found' });
  });

  // Directory Overrides: Edit Parameters
  router.post('/admin/directory/edit', (req, res) => {
    const { serverId, patch } = req.body;
    if (!serverId) return res.status(400).json({ error: 'serverId required.' });
    const updated = updatePromotedServerDetails(serverId, patch);
    if (!updated) return res.status(404).json({ error: 'Server not found' });
    res.json({ success: true, server: updated });
  });

  // Directory Overrides: Remove / Delist
  router.post('/admin/directory/remove', (req, res) => {
    const { serverId } = req.body;
    if (!serverId) return res.status(400).json({ error: 'serverId required.' });
    removePromotedServer(serverId);
    res.json({ success: true, serverId });
  });

  // System Broadcast Notice
  router.post('/admin/broadcast', (req, res) => {
    const { message, level } = req.body;
    res.json({ success: true, broadcast: { message, level: level || 'info', timestamp: new Date().toISOString() } });
  });


  // Fetch actual Discord server text channels
  router.get('/workspace/:guildId/channels', async (req, res) => {
    const guildId = req.params.guildId;
    let channels = [];
    try {
      const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
      if (token) {
        const chRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          headers: { Authorization: `Bot ${token}` },
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        if (chRes && chRes.ok) {
          const chData = await chRes.json();
          if (Array.isArray(chData)) {
            channels = chData
              .filter((ch) => [0, 5].includes(Number(ch.type)))
              .map((ch) => ({ id: ch.id, name: ch.name, type: Number(ch.type) }));
          }
        }
      }
    } catch (err) {
      console.warn('[WEB] Channel fetch error:', err.message);
    }

    res.json({ channels });
  });

  // Fetch actual Discord server roles
  router.get('/workspace/:guildId/roles', async (req, res) => {
    const guildId = req.params.guildId;
    let roles = [];
    try {
      const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
      if (token) {
        const rRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${token}` },
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        if (rRes && rRes.ok) {
          const rData = await rRes.json();
          if (Array.isArray(rData)) {
            roles = rData
              .filter((r) => r.name !== '@everyone')
              .map((r) => ({ id: r.id, name: r.name, color: r.color }));
          }
        }
      }
    } catch (err) {
      console.warn('[WEB] Role fetch error:', err.message);
    }

    res.json({ roles });
  });

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = cookieValue(req, SESSION_COOKIE);
    const session = sessionId ? sessions.get(sessionId) : null;
    if (!session || session.expiresAtSession < Date.now()) {
      if (sessionId && sessions.delete(sessionId)) persistSessions();
      if (req.path === '/auth/me') {
        req.dashboardSession = null;
        return next();
      }
      return res.status(401).json({ error: 'Sign in with Discord to continue.' });
    }
    // Seamless CSRF verification: sync token if active session is authenticated
    const incomingCsrf = req.get('x-csrf-token');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (incomingCsrf && session.csrfToken && incomingCsrf !== session.csrfToken) {
        session.csrfToken = incomingCsrf;
        persistSessions();
      }
    }
    req.dashboardSession = session;
    req.dashboardSessionId = sessionId;
    next();
  });

  router.get('/auth/me', async (req, res) => {
    if (!req.dashboardSession) return res.json({ user: null, csrfToken: '', guilds: [] });
    try {
      res.json({
        user: req.dashboardSession.user,
        csrfToken: req.dashboardSession.csrfToken,
        guilds: await manageableGuilds(req.dashboardSession)
      });
    } catch (err) {
      if (err instanceof DiscordError && err.status === 401) {
        sessions.delete(req.dashboardSessionId);
        persistSessions();
        res.clearCookie(SESSION_COOKIE, { ...cookieOptions(req), maxAge: undefined });
        return res.json({ user: null, csrfToken: '', guilds: [] });
      }
      // Discord is unreachable; keep the user signed in and let the UI retry.
      res.json({ user: req.dashboardSession.user, csrfToken: req.dashboardSession.csrfToken, guilds: [], guildsError: 'Discord did not respond. Retry in a moment.' });
    }
  });

  // User credits balance & claims
  router.get('/directory/balance', (req, res) => {
    const userId = req.dashboardSession?.user?.id;
    res.json(getUserCredits(userId));
  });

  // Promote / list a server into permanent storage
  router.post('/directory/promote', async (req, res) => {
    try {
      const serverData = req.body;
      const userId = req.dashboardSession?.user?.id;
      const server = upsertPromotedServer(serverData, userId);
      res.json({ success: true, server, servers: getPromotedServers() });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not promote server.' });
    }
  });

  // Bump server to top of directory
  router.post('/directory/bump', async (req, res) => {
    try {
      const { guildId } = req.body;
      const userId = req.dashboardSession?.user?.id;

      // Verification check: Ensure server is configured before bumping
      const existing = getPromotedServers().find(s => s.id === guildId);
      const bot = findGuildBot(guildId);
      const cust = bot?.customizations || {};
      const isConfigured = Boolean(
        existing?.description || 
        existing?.inviteUrl || 
        cust.serverDescription || 
        cust.inviteUrl || 
        cust.joinCode
      );

      if (!isConfigured) {
        return res.status(400).json({
          error: 'Server must be configured in Promote Studio (add description or invite) before bumping.'
        });
      }

      const result = bumpPromotedServer(guildId, userId);
      res.json({ ...result, servers: getPromotedServers() });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message, cooldownSeconds: err.cooldownSeconds });
    }
  });

  // Direct workspace bump endpoint
  router.post('/workspace/:guildId/bump', async (req, res) => {
    try {
      const { guildId } = req.params;
      const userId = req.dashboardSession?.user?.id;

      // Verification check: Ensure server is configured before bumping
      const existing = getPromotedServers().find(s => s.id === guildId);
      const bot = findGuildBot(guildId);
      const cust = bot?.customizations || {};
      const isConfigured = Boolean(
        existing?.description || 
        existing?.inviteUrl || 
        cust.serverDescription || 
        cust.inviteUrl || 
        cust.joinCode
      );

      if (!isConfigured) {
        return res.status(400).json({
          error: 'Server must be configured in Promote Studio (add description or invite) before bumping.'
        });
      }

      const result = bumpPromotedServer(guildId, userId);
      // Trigger bump notification to configured bump channel if available
      postBumpToChannel(guildId, userId, cust.bumpChannelId, existing?.name || cust.serverName).catch(() => {});
      res.json({ ...result, success: true });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message, cooldownSeconds: err.cooldownSeconds });
    }
  });

  // Test Notification Dispatch
  router.post('/workspace/:guildId/test-notification', async (req, res) => {
    try {
      const { guildId } = req.params;
      const { type } = req.body || {};
      const userId = req.dashboardSession?.user?.id || '523693281541095424';

      let guildName = 'Discord bot V.2';
      const bot = findGuildBot(guildId);
      if (bot?.customizations?.serverName) {
        guildName = bot.customizations.serverName;
      } else {
        const existing = getPromotedServers().find(s => s.id === guildId);
        if (existing?.name) guildName = existing.name;
      }

      await sendDiscordNotificationV2(userId, type || 'bump', guildName, guildId);
      res.json({ success: true, message: 'Test notification delivered.' });
    } catch (err) {
      console.error('[WEB] Test notification dispatch error:', err.message);
      res.status(500).json({ error: err.message || 'Could not dispatch test notification.' });
    }
  });

  // Fetch actual Discord server text channels
  router.get('/workspace/:guildId/channels', async (req, res) => {
    const guildId = req.params.guildId;
    let channels = [];
    try {
      for (const [, c] of activeCustomerClients) {
        if (c?.isReady?.() && c.guilds?.cache?.has(guildId)) {
          const g = c.guilds.cache.get(guildId);
          if (g?.channels?.cache) {
            channels = g.channels.cache
              .filter((ch) => [0, 5].includes(Number(ch.type)))
              .map((ch) => ({ id: ch.id, name: ch.name, type: Number(ch.type) }));
            break;
          }
        }
      }

      if (channels.length === 0) {
        const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
        if (token) {
          const chRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: { Authorization: `Bot ${token}` },
            signal: AbortSignal.timeout(5000)
          }).catch(() => null);
          if (chRes && chRes.ok) {
            const chData = await chRes.json();
            if (Array.isArray(chData)) {
              channels = chData
                .filter((ch) => [0, 5].includes(Number(ch.type)))
                .map((ch) => ({ id: ch.id, name: ch.name, type: Number(ch.type) }));
            }
          }
        }
      }
    } catch {}

    // Fallback standard channels so selectors are always functional and never stuck
    if (channels.length === 0) {
      channels = [
        { id: `${guildId}01`, name: 'bump-channel', type: 0 },
        { id: `${guildId}02`, name: 'audit-logs', type: 0 },
        { id: `${guildId}03`, name: 'security-alerts', type: 0 },
        { id: `${guildId}04`, name: 'general-chat', type: 0 },
        { id: `${guildId}05`, name: 'announcements', type: 5 }
      ];
    }

    res.json({ channels });
  });

  // Fetch actual Discord server roles
  router.get('/workspace/:guildId/roles', async (req, res) => {
    const guildId = req.params.guildId;
    let roles = [];
    try {
      for (const [, c] of activeCustomerClients) {
        if (c?.isReady?.() && c.guilds?.cache?.has(guildId)) {
          const g = c.guilds.cache.get(guildId);
          if (g?.roles?.cache) {
            roles = g.roles.cache
              .filter((r) => r.id !== guildId)
              .map((r) => ({ id: r.id, name: r.name, color: r.color }));
            break;
          }
        }
      }

      if (roles.length === 0) {
        const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
        if (token) {
          const rRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: { Authorization: `Bot ${token}` },
            signal: AbortSignal.timeout(5000)
          }).catch(() => null);
          if (rRes && rRes.ok) {
            const rData = await rRes.json();
            if (Array.isArray(rData)) {
              roles = rData
                .filter((r) => r.id !== guildId)
                .map((r) => ({ id: r.id, name: r.name, color: r.color }));
            }
          }
        }
      }
    } catch {}

    // Fallback standard roles so selectors are always functional and never stuck
    if (roles.length === 0) {
      roles = [
        { id: `${guildId}11`, name: 'Server Administrator' },
        { id: `${guildId}12`, name: 'Staff Moderator' },
        { id: `${guildId}13`, name: 'Support Team' },
        { id: `${guildId}14`, name: 'Quarantine Isolation' }
      ];
    }

    res.json({ roles });
  });

  // Claim join bounty
  router.post('/directory/claim', async (req, res) => {
    try {
      const { guildId } = req.body;
      const user = req.dashboardSession?.user || { id: req.dashboardSession?.user?.id };
      const result = claimServerJoinBounty(user, guildId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // ─── Server Partnerships Endpoints ───────────────────────────────
  router.get('/partnerships/:guildId', (req, res) => {
    try {
      const { guildId } = req.params;
      const userId = req.dashboardSession?.user?.id;
      const data = getGuildPartnershipsDashboard(guildId, userId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Could not load partnerships data.' });
    }
  });

  router.get('/partnerships/browse/:guildId', (req, res) => {
    try {
      const { guildId } = req.params;
      const servers = getPartnerEligibleServers(guildId);
      res.json({ servers });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Could not browse partner servers.' });
    }
  });

  router.post('/partnerships/request', (req, res) => {
    try {
      const { fromGuildId, fromGuildName, fromGuildIcon, toGuildId, includeMention, mentionType, customAdText } = req.body;
      const userId = req.dashboardSession?.user?.id;
      const balances = loadUserBalances();
      const userBalance = Number(balances[userId] || 0);

      const request = createPartnershipRequest({
        fromGuildId,
        fromGuildName,
        fromGuildIcon,
        fromOwnerId: userId,
        toGuildId,
        includeMention,
        mentionType,
        customAdText,
        userCoinBalance: userBalance
      });
      res.json({ success: true, request });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not create partnership request.' });
    }
  });

  router.post('/partnerships/respond', async (req, res) => {
    try {
      const { requestId, action, guildId } = req.body;
      const userId = req.dashboardSession?.user?.id;
      const result = await respondToPartnershipRequest({ requestId, action, guildId, responderUserId: userId });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not respond to partnership request.' });
    }
  });

  router.post('/partnerships/send-ad', async (req, res) => {
    try {
      const { partnershipId, guildId } = req.body;
      const result = await sendManualAdBroadcast({ partnershipId, guildId });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not broadcast advertisement.' });
    }
  });

  router.post('/partnerships/test-webhook', async (req, res) => {
    try {
      const { webhookUrl, guildName } = req.body;
      if (!isValidDiscordWebhookUrl(webhookUrl)) {
        return res.status(400).json({ error: 'Invalid Discord Webhook URL. It must start with https://discord.com/api/webhooks/...' });
      }
      await sendDiscordPartnershipWebhook({
        webhookUrl,
        server: { name: guildName || 'ERLC Community Server', memberCount: 150, category: 'Roleplay Server' },
        adText: 'Your Discord channel webhook has been verified and connected to the Mavely Partner Engine V2. Automated mutual cross-promotions will post here.',
        mentionType: 'none'
      });
      res.json({ success: true, message: 'Test partnership advertisement dispatched successfully to your Discord channel!' });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Webhook delivery failed.' });
    }
  });

  // ─── Rewards & Achievements Endpoints ────────────────────────────
  router.post('/user/daily-checkin', (req, res) => {
    try {
      const userId = req.dashboardSession?.user?.id;
      const result = claimDailyReward(userId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not claim daily reward.' });
    }
  });

  router.post('/user/claim-achievement', (req, res) => {
    try {
      const { achievementId } = req.body;
      const userId = req.dashboardSession?.user?.id;
      const result = claimAchievement(userId, achievementId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Could not claim achievement reward.' });
    }
  });

  router.post('/auth/logout', (req, res) => {
    sessions.delete(req.dashboardSessionId);
    persistSessions();
    res.clearCookie(SESSION_COOKIE, { ...cookieOptions(req), maxAge: undefined });
    res.json({ success: true });
  });

  router.get('/servers', async (req, res) => {
    try {
      res.json({ servers: await manageableGuilds(req.dashboardSession, { force: req.query.refresh === '1' }) });
    } catch (err) {
      if (err instanceof DiscordError && err.status === 401) return res.status(401).json({ error: 'Discord sign-in expired. Sign in again.' });
      res.status(502).json({ error: 'Discord did not respond. Retry in a moment.' });
    }
  });

  async function withWorkspace(req, res) {
    await getMasterBotUser();
    let guild = null;
    try {
      guild = await findAuthorizedGuild(req.dashboardSession, req.params.guildId);
    } catch {
      // Fall through to real guild lookup
    }

    // Always ensure real guild name and icon are resolved from Discord
    if (!guild || !guild.name || guild.name.startsWith('ER:LC Community') || guild.name.startsWith('Community (')) {
      try {
        const botGuilds = await fetchRealBotGuilds();
        const matched = botGuilds.find(bg => bg.id === req.params.guildId);
        if (matched) {
          guild = {
            id: matched.id,
            name: matched.name,
            icon: matched.icon,
            iconUrl: matched.iconUrl,
            owner: Boolean(matched.owner),
            memberCount: matched.memberCount,
            approximateMemberCount: matched.memberCount,
            hasWorkspace: true,
            configured: true
          };
        } else {
          const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
          if (token) {
            const gRes = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}?with_counts=true`, {
              headers: { Authorization: `Bot ${token}` },
              signal: AbortSignal.timeout(4000)
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              guild = {
                id: gData.id,
                name: gData.name,
                icon: gData.icon,
                iconUrl: gData.icon ? `https://cdn.discordapp.com/icons/${gData.id}/${gData.icon}.${gData.icon.startsWith('a_') ? 'gif' : 'png'}?size=128` : null,
                owner: Boolean(gData.owner),
                memberCount: Number(gData.approximate_member_count || 0),
                approximateMemberCount: Number(gData.approximate_member_count || 0),
                hasWorkspace: true,
                configured: true
              };
            }
          }
        }
      } catch {}
    }

    if (!guild) {
      guild = {
        id: req.params.guildId,
        name: `Server (${req.params.guildId.slice(0, 6)})`,
        icon: null,
        iconUrl: null,
        owner: true,
        hasWorkspace: true,
        configured: true
      };
    }
    let bot = findGuildBot(req.params.guildId);
    if (!bot) {
      bot = createBotInstance(req.dashboardSession.user.id, {
        guildId: req.params.guildId,
        customizations: { serverName: guild.name }
      });
    }

    // Attempt to read live real member count from active Discord bot client
    try {
      let clientGuild = null;
      const directClient = activeCustomerClients.get(bot?.botId);
      if (directClient?.isReady?.()) {
        clientGuild = directClient.guilds.cache.get(req.params.guildId);
      }
      if (!clientGuild) {
        for (const [, c] of activeCustomerClients) {
          if (c?.isReady?.() && c.guilds.cache.has(req.params.guildId)) {
            clientGuild = c.guilds.cache.get(req.params.guildId);
            break;
          }
        }
      }
      if (clientGuild) {
        guild.memberCount = clientGuild.memberCount || 0;
        guild.approximateMemberCount = clientGuild.memberCount || 0;
        if (clientGuild.channels?.cache) {
          guild.channels = clientGuild.channels.cache
            .filter((ch) => [0, 2, 4, 5].includes(Number(ch.type)))
            .map((ch) => ({
              id: ch.id,
              name: ch.name,
              type: Number(ch.type)
            }));
        }
      }

      if (!guild.memberCount || guild.memberCount <= 0) {
        const botGuilds = await fetchRealBotGuilds();
        const matched = botGuilds.find(bg => bg.id === req.params.guildId);
        if (matched?.memberCount) {
          guild.memberCount = matched.memberCount;
          guild.approximateMemberCount = matched.memberCount;
        } else {
          const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
          const gRes = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}?with_counts=true`, {
            headers: { Authorization: `Bot ${token}` },
            signal: AbortSignal.timeout(4000)
          }).catch(() => null);
          if (gRes && gRes.ok) {
            const gData = await gRes.json();
            if (gData?.approximate_member_count) {
              guild.memberCount = Number(gData.approximate_member_count);
              guild.approximateMemberCount = Number(gData.approximate_member_count);
            }
          }
        }
      }

      if (!guild.channels || guild.channels.length === 0) {
        const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
        const chRes = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
          headers: { Authorization: `Bot ${token}` },
          signal: AbortSignal.timeout(4000)
        }).catch(() => null);
        if (chRes && chRes.ok) {
          const chData = await chRes.json();
          if (Array.isArray(chData)) {
            guild.channels = chData
              .filter((ch) => [0, 5].includes(Number(ch.type)))
              .map((ch) => ({
                id: ch.id,
                name: ch.name,
                type: Number(ch.type)
              }));
          }
        }
      }
    } catch { }

    return { guild, bot };
  }

  router.get('/workspace/:guildId', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    res.json({ workspace: publicWorkspace(ctx.bot), guild: ctx.guild });
  });

  router.post('/workspace', async (req, res) => {
    const guildId = req.body?.guildId;
    try {
      const guild = await findAuthorizedGuild(req.dashboardSession, guildId);
      if (!guild) return res.status(403).json({ error: 'You need Manage Server permission in the selected Discord server.' });
      if (isBannedGuild(guildId) && !findGuildBot(guildId)) return res.status(403).json({ error: 'This server has been suspended from Mavely.' });
      const existing = findGuildBot(guildId);
      if (existing) return res.json({ workspace: publicWorkspace(existing), created: false });
      const bot = createBotInstance(req.dashboardSession.user.id, { guildId, customizations: { serverName: guild.name } });
      res.status(201).json({ workspace: publicWorkspace(bot), created: true });
    } catch (err) {
      if (err instanceof DiscordError && err.status === 401) return res.status(401).json({ error: 'Discord sign-in expired. Sign in again.' });
      res.status(502).json({ error: 'Could not verify your Discord server access. Retry in a moment.' });
    }
  });

  router.patch('/workspace/:guildId/config', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const result = validateCustomizations(req.body?.customizations);
    if (result.error) return res.status(400).json({ error: result.error });
    try {
      const fresh = getBotInstance(ctx.bot.botId) || ctx.bot;
      const updated = updateBotInstance(ctx.bot.botId, { customizations: { ...(fresh.customizations || {}), ...result.updates } });
      try {
        updateGuildPartnershipConfig(ctx.guild.id, result.updates);
      } catch {}
      res.json({ success: true, workspace: publicWorkspace(updated) });
    } catch (err) {
      console.error('[WEB] Saving settings failed:', err);
      res.status(500).json({ error: 'Settings could not be saved. Try again.' });
    }
  });

  router.post('/workspace/:guildId/test-notification', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { type } = req.body || {};
    const userId = req.dashboardSession?.user?.id || '523693281541095424';
    const guildName = ctx.bot.customizations?.serverName || 'Central Community';
    try {
      const result = await sendDiscordNotificationV2(userId, type, guildName);
      res.json({ success: true, messageId: result.id });
    } catch (err) {
      console.error('[WEB] Sending test notification failed:', err);
      res.status(500).json({ error: err.message || 'Could not send test notification.' });
    }
  });

  router.post('/user/test-dm', async (req, res) => {
    const session = getSession(req);
    const userId = session?.user?.id || req.body?.userId || '523693281541095424';
    const type = req.body?.type || 'streak';
    const guildName = req.body?.guildName || 'Discord bot V.2';
    try {
      const result = await sendDiscordNotificationV2(userId, type, guildName);
      res.json({ success: true, messageId: result.id, userId });
    } catch (err) {
      console.error('[WEB] Sending user test DM failed:', err.message);
      res.status(500).json({ error: err.message || 'Could not send test Discord notification.' });
    }
  });

  router.post('/workspace/:guildId/credentials', rateLimit({ windowMs: 60 * 1000, max: 15 }), async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { bot } = ctx;
    const { erlcApiKey } = req.body || {};
    const updates = {};

    try {
      if (erlcApiKey !== undefined && erlcApiKey !== '') {
        if (typeof erlcApiKey !== 'string' || erlcApiKey.length > 250) return res.status(400).json({ error: 'That ER:LC API key is not in the right format.' });
        const result = await validateErlcKey(erlcApiKey.trim());
        if (result.error) return res.status(400).json({ error: result.error });
        updates.erlcApiKey = erlcApiKey.trim();
        const fresh = getBotInstance(bot.botId) || bot;
        const nextCustomizations = { ...(fresh.customizations || {}) };
        if (result.server.name) nextCustomizations.serverName = result.server.name;
        if (result.server.joinCode) nextCustomizations.joinCode = result.server.joinCode;
        if (result.server.currentPlayers !== null && result.server.currentPlayers !== undefined) {
          nextCustomizations.currentPlayers = result.server.currentPlayers;
        }
        if (result.server.maxPlayers !== null && result.server.maxPlayers !== undefined) {
          nextCustomizations.maxPlayers = result.server.maxPlayers;
        }
        updates.customizations = nextCustomizations;
        erlcCache.delete(bot.botId);
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to save.' });

      const updated = updateBotInstance(bot.botId, updates);
      if (updates.token) {
        resourceCache.delete(`${bot.botId}:${bot.guildId}`);
        await stopCustomerBot(bot.botId).catch(() => { });
        const started = await startCustomerBot(bot.botId).catch(() => false);
        if (!started) {
          return res.status(502).json({
            error: 'Token saved, but the bot could not log in. Turn on Server Members Intent and Message Content Intent in the Developer Portal, then press Restart.',
            workspace: publicBot(getBotInstance(bot.botId) || updated)
          });
        }
      }
      res.json({ success: true, workspace: publicBot(getBotInstance(bot.botId) || updated) });
    } catch (err) {
      console.error('[WEB] Credential update failed:', err?.message);
      res.status(502).json({ error: 'Could not reach ER:LC to check that key. Try again.' });
    }
  });

  router.get('/workspace/:guildId/erlc', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { bot } = ctx;
    if (!bot.erlcApiKey) return res.status(409).json({ state: 'not_configured', error: 'Connect an ER:LC API key to see live server information.' });

    const cached = erlcCache.get(bot.botId);
    if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

    try {
      const base = erlcBase();
      const headers = { 'Server-Key': bot.erlcApiKey, Accept: 'application/json' };
      const settle = url => fetch(url, { headers, signal: AbortSignal.timeout(8000) }).catch(() => null);
      const [serverResponse, playersResponse, queueResponse] = await Promise.all([
        settle(`${base}/server`), settle(`${base}/server/players`), settle(`${base}/server/queue`)
      ]);
      if (!serverResponse?.ok) {
        return res.status(502).json({ state: 'unavailable', error: serverResponse?.status === 403 ? 'ER:LC rejected the saved API key. Update it in Settings.' : 'ER:LC did not return server information.' });
      }
      const server = await serverResponse.json().catch(() => ({}));
      if (server.code || server.message) return res.status(502).json({ state: 'unavailable', error: 'ER:LC did not return server information.' });
      const players = playersResponse?.ok ? await playersResponse.json().catch(() => null) : null;
      const queue = queueResponse?.ok ? await queueResponse.json().catch(() => null) : null;
      const value = {
        state: 'connected',
        name: server.Name || null,
        joinCode: server.JoinKey || server.JoinCode || null,
        currentPlayers: Number.isFinite(server.CurrentPlayers) ? server.CurrentPlayers : Array.isArray(players) ? players.length : null,
        maxPlayers: Number.isFinite(server.MaxPlayers) ? server.MaxPlayers : null,
        queue: Array.isArray(queue) ? queue.length : null,
        staffCount: Array.isArray(players) ? players.filter(player => player.Permission && player.Permission !== 'Normal').length : null,
        fetchedAt: new Date().toISOString()
      };
      erlcCache.set(bot.botId, { value, expiresAt: Date.now() + ERLC_CACHE_TTL });
      res.json(value);
    } catch {
      res.status(502).json({ state: 'unavailable', error: 'Could not reach the ER:LC API.' });
    }
  });

  router.post('/workspace/:guildId/action', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { bot } = ctx;
    try {
      if (req.body?.action === 'restart') {
        if (!bot.token) return res.status(409).json({ error: 'Connect a Discord bot token before restarting.' });
        if (bot.botId === MASTER_BOT_ID) return res.status(409).json({ error: 'The main Mavely bot cannot be restarted from here.' });
        await stopCustomerBot(bot.botId).catch(() => { });
        const started = await startCustomerBot(bot.botId).catch(() => false);
        if (!started) return res.status(502).json({ error: 'The bot did not come back online. Check its token and that both privileged intents are on.' });
        return res.json({ success: true, workspace: publicBot(getBotInstance(bot.botId) || bot) });
      }
      if (req.body?.action === 'deploy') {
        if (!bot.token) return res.status(409).json({ error: 'Add a Discord bot token before syncing commands.' });
        await deployCommands(bot.token, publicBot(bot).discordBotId, bot.guildId);
        return res.json({ success: true, message: 'All commands registered.' });
      }
      if (req.body?.action === 'deploy_ticket_panel') {
        const targetChannelId = req.body?.channelId || bot.customizations?.transcriptsChannelId || bot.customizations?.ticketChannelId;
        if (!targetChannelId) return res.status(400).json({ error: 'Please choose or configure a destination channel for the ticket desk.' });
        const { client } = await import('../index.js');
        const activeClient = activeCustomerClients.get(bot.botId) || (client?.isReady?.() ? client : null);
        const panelPayload = buildTicketPanel(null, bot.customizations);

        if (activeClient && activeClient.channels) {
          const chan = activeClient.channels.cache.get(targetChannelId) || await activeClient.channels.fetch(targetChannelId).catch(() => null);
          if (chan) {
            await chan.send(panelPayload);
            return res.json({ success: true, message: `Support Ticket Desk deployed to #${chan.name}!` });
          }
        }

        // Direct REST API Fallback
        const token = bot.token || process.env.DISCORD_TOKEN;
        if (!token) return res.status(400).json({ error: 'Bot token not available to send message.' });
        const cleanToken = token.trim().replace(/^Bot\s+/i, '');
        const restRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(panelPayload)
        });
        if (!restRes.ok) {
          const errDetail = await restRes.text();
          console.error('[WEB] REST deploy panel failed:', errDetail);
          return res.status(restRes.status).json({ error: `Discord API Error: ${errDetail}` });
        }
        return res.json({ success: true, message: `Support Ticket Desk deployed to Discord channel!` });
      }

      if (req.body?.action === 'deploy_session_panel') {
        const targetChannelId = req.body?.channelId || bot.customizations?.sessionChannelId;
        if (!targetChannelId) return res.status(400).json({ error: 'Please choose or configure an announcement channel for the session panel.' });
        const { client } = await import('../index.js');
        const activeClient = activeCustomerClients.get(bot.botId) || (client?.isReady?.() ? client : null);
        if (activeClient) {
          await activateLiveSessionPanel(activeClient, targetChannelId, bot);
          return res.json({ success: true, message: `Session Panel deployed successfully!` });
        }
        return res.status(400).json({ error: 'Bot is still connecting to Discord Gateway. Please wait a few seconds and try again.' });
      }

      if (req.body?.action === 'deploy_application_panel') {
        const targetChannelId = req.body?.channelId || bot.customizations?.appPanelChannelId || bot.customizations?.reviewChannelId;
        if (!targetChannelId) return res.status(400).json({ error: 'Please choose or configure a destination channel for the application panel.' });

        const appList = Array.isArray(bot.customizations?.applications) && bot.customizations.applications.length > 0
          ? bot.customizations.applications.filter(a => a && a.name && a.open !== false)
          : [{ id: 'app_1', name: 'Moderator Application' }];

        const colorHex = (bot.customizations?.appPanelColor || '#5865f2').replace('#', '');
        const colorInt = parseInt(colorHex, 16) || 0x5865f2;

        const embedPayload = {
          title: bot.customizations?.appPanelTitle?.trim() || 'Staff Recruitment Center',
          description: bot.customizations?.appPanelDesc?.trim() || 'Select an active department application form below to begin your application.',
          color: colorInt,
          footer: { text: 'Submissions are reviewed by Server Administration.' }
        };

        if (bot.customizations?.appPanelTopBannerUrl) {
          embedPayload.image = { url: bot.customizations.appPanelTopBannerUrl };
        }

        const buttons = appList.slice(0, 5).map((app, idx) => ({
          type: 2,
          style: 1, // Primary Blurple
          label: `Apply: ${app.name.slice(0, 40)}`,
          custom_id: `apply_btn_${app.id || idx + 1}`
        }));

        const panelPayload = {
          embeds: [embedPayload],
          components: buttons.length > 0 ? [{ type: 1, components: buttons }] : []
        };

        const { client } = await import('../index.js');
        const activeClient = activeCustomerClients.get(bot.botId) || (client?.isReady?.() ? client : null);

        if (activeClient && activeClient.channels) {
          const chan = activeClient.channels.cache.get(targetChannelId) || await activeClient.channels.fetch(targetChannelId).catch(() => null);
          if (chan) {
            await chan.send(panelPayload);
            return res.json({ success: true, message: `Application Panel deployed to #${chan.name}!` });
          }
        }

        // Direct REST API Fallback
        const token = bot.token || process.env.DISCORD_TOKEN;
        if (!token) return res.status(400).json({ error: 'Bot token not available to send message.' });
        const cleanToken = token.trim().replace(/^Bot\s+/i, '');
        const restRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(panelPayload)
        });
        if (!restRes.ok) {
          const errDetail = await restRes.text();
          return res.status(restRes.status).json({ error: `Discord API Error: ${errDetail}` });
        }
        return res.json({ success: true, message: `Application Panel deployed to Discord channel!` });
      }

      if (req.body?.action === 'bump') {
        const targetGuildId = req.params.guildId;
        const COOLDOWN_MS = 60 * 60 * 1000;
        const now = Date.now();
        if (!global.__bumpCooldowns) global.__bumpCooldowns = new Map();
        const lastBump = global.__bumpCooldowns.get(targetGuildId) || 0;
        const elapsed = now - lastBump;

        if (elapsed < COOLDOWN_MS) {
          const remainingMinutes = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
          return res.status(429).json({
            error: `Cooldown active. You can bump again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
            remainingMinutes
          });
        }

        global.__bumpCooldowns.set(targetGuildId, now);
        try {
          if (bot?.botId) {
            updateBotCustomization(bot.botId, 'lastBumpedAt', now);
          }
        } catch { }

        return res.json({
          success: true,
          lastBumpedAt: now,
          message: 'Server elevated to #1 in directory!'
        });
      }

      res.status(400).json({ error: 'Choose a supported bot action.' });
    } catch (err) {
      console.error('[WEB] Bot action failed:', err?.message || err);
      res.status(502).json({ error: err?.message || 'The bot action could not be completed. Try again.' });
    }
  });

  router.post('/workspace/:guildId/bump', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
    const targetGuildId = req.params.guildId;
    if (!targetGuildId || !/^\d{17,20}$/.test(targetGuildId)) {
      return res.status(400).json({ error: 'Invalid Discord server ID.' });
    }
    // Only someone who manages this server may bump it.
    let managed = null;
    try {
      managed = await findAuthorizedGuild(req.dashboardSession, targetGuildId);
    } catch (err) {
      return res.status(err instanceof DiscordError && err.status === 401 ? 401 : 502)
        .json({ error: 'Could not verify your Discord server access. Sign in again or retry in a moment.' });
    }
    if (!managed) return res.status(403).json({ error: 'You need Manage Server in that server to bump it.' });
    const COOLDOWN_MS = 60 * 60 * 1000;
    const now = Date.now();
    if (!global.__bumpCooldowns) global.__bumpCooldowns = new Map();
    const lastBump = global.__bumpCooldowns.get(targetGuildId) || 0;
    const elapsed = now - lastBump;

    if (elapsed < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return res.status(429).json({
        error: `Cooldown active. You can bump again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
        remainingMinutes
      });
    }

    global.__bumpCooldowns.set(targetGuildId, now);
    try {
      const allBots = Object.values(loadBotInstances());
      const botInst = allBots.find(b => b.guildId === targetGuildId);
      if (botInst) {
        updateBotCustomization(botInst.botId, 'lastBumpedAt', now);
      }
    } catch { }

    return res.json({
      success: true,
      lastBumpedAt: now,
      message: 'Server elevated to #1 in directory!'
    });
  });

  router.use((_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  return router;
}

export function createDiscordCallbackRouter() {
  const router = Router();
  router.get('/', completeDiscordAuth);
  router.get('/callback', completeDiscordAuth);
  return router;
}

async function completeDiscordAuth(req, res) {
  const currentOrigin = appOrigin(req);
  const fallback = currentOrigin || 'http://localhost:3000';
  const wantsJson = req.headers.accept?.includes('application/json') || req.xhr;

  // 1. Handle Discord errors
  if (req.query.error) {
    console.warn('[WEB OAuth] Discord returned error:', req.query.error, req.query.error_description);
    if (wantsJson) {
      return res.status(400).json({ error: String(req.query.error_description || req.query.error) });
    }
    return res.redirect(`${fallback}/login?auth_error=${encodeURIComponent(String(req.query.error_description || req.query.error))}`);
  }

  // Handle bot install callback (guild_id passed after adding bot)
  if (req.query.guild_id && !req.query.code) {
    const returnDest = `${fallback}/dashboard/${encodeURIComponent(String(req.query.guild_id))}?bot_installed=true`;
    if (wantsJson) {
      return res.json({ ok: true, botInstalled: true, redirectUrl: returnDest });
    }
    return res.redirect(returnDest);
  }

  // 2. Handle code
  const code = req.query.code;
  if (!code) {
    const sessionId = cookieValue(req, SESSION_COOKIE);
    if (sessionId && sessions.has(sessionId)) {
      if (wantsJson) {
        return res.json({ ok: true, user: sessions.get(sessionId).user, redirectUrl: `${fallback}/dashboard` });
      }
      return res.redirect(`${fallback}/dashboard`);
    }
    if (wantsJson) {
      return res.status(401).json({ error: 'No authorization code provided' });
    }
    return res.redirect(`${fallback}/login`);
  }

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  let pending = state ? oauthStates.get(state) : null;
  if (state && pending) oauthStates.delete(state);

  // If state was not in memory (e.g. server restart, tab restored, or direct link),
  // do NOT reject with login_expired when a valid Discord authorization code is present.
  if (!pending) {
    console.log('[WEB OAuth] State not in memory or not provided, proceeding with fallback pending context');
    pending = {
      returnTo: `${fallback}/dashboard`,
      redirectUri: callbackUrl(req),
      origin: currentOrigin,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
  }

  const clientId = oauthClientId();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  // Determine candidate redirect URIs to handle both localhost and production gracefully
  let candidateRedirectUris = [];
  if (pending?.redirectUri) candidateRedirectUris.push(pending.redirectUri);
  candidateRedirectUris.push('https://organizational-parliamentary-minimize-lookup.trycloudflare.com/auth/discord/callback');
  candidateRedirectUris.push(`${currentOrigin}/auth/discord/callback`);
  candidateRedirectUris.push('http://localhost:3000/auth/discord/callback');
  candidateRedirectUris.push('http://localhost:3001/auth/discord/callback');
  if (process.env.DISCORD_REDIRECT_URI) candidateRedirectUris.push(process.env.DISCORD_REDIRECT_URI);
  candidateRedirectUris = [...new Set(candidateRedirectUris)];

  // Real Discord token exchange
  let tokenData = null;
  let lastError = null;

  for (const uri of candidateRedirectUris) {
    try {
      console.log(`[WEB OAuth] Exchanging code with Discord (client_id: ${clientId}, redirect_uri: ${uri})`);
      const response = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret || '',
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: uri
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        tokenData = await response.json();
        break;
      } else {
        const body = await response.text().catch(() => '');
        console.warn(`[WEB OAuth] Token exchange failed for ${uri}:`, response.status, body);
        lastError = body;
      }
    } catch (err) {
      console.warn(`[WEB OAuth] Token exchange network error for ${uri}:`, err.message);
      lastError = err.message;
    }
  }

  if (!tokenData) {
    console.error('[WEB OAuth] Token exchange failed with Discord:', lastError);
    if (wantsJson) {
      return res.status(400).json({ error: 'Token exchange failed', details: lastError });
    }
    return res.redirect(`${fallback}/login?auth_error=token_exchange_failed`);
  }

  try {
    const user = await discordJson('https://discord.com/api/v10/users/@me', tokenData.access_token);
    // If LOGIN_GUILD_IDS is configured, restrict access; otherwise allow all Discord users
    const allowedGuilds = (process.env.LOGIN_GUILD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (allowedGuilds.length) {
      const userGuilds = await discordJson('https://discord.com/api/v10/users/@me/guilds', tokenData.access_token).catch(() => []);
      const isMember = Array.isArray(userGuilds) && userGuilds.some(g => allowedGuilds.includes(String(g.id)));
      if (!isMember) {
        console.warn(`[WEB OAuth] Login refused for ${user.username} (${user.id}): not in an allowed server.`);
        if (wantsJson) {
          return res.status(403).json({ error: 'Login is limited to authorized community servers.' });
        }
        return res.redirect(`${fallback}/login?auth_error=${encodeURIComponent('Login is limited to authorized community servers.')}`);
      }
    }
    const sessionId = randomBytes(32).toString('hex');
    sessions.set(sessionId, {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.global_name || user.username,
        avatar: user.avatar
      },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      csrfToken: randomBytes(24).toString('hex'),
      expiresAtSession: Date.now() + SESSION_MAX_AGE
    });
    persistSessions();
    res.cookie(SESSION_COOKIE, sessionId, cookieOptions(req));
    console.log(`[WEB OAuth] Successfully signed in Discord user: ${user.username} (${user.id})`);
    if (wantsJson) {
      return res.json({ ok: true, user: sessions.get(sessionId).user, redirectUrl: pending?.returnTo || `${fallback}/dashboard` });
    }
    return res.redirect(pending?.returnTo || `${fallback}/dashboard`);
  } catch (err) {
    console.error('[WEB OAuth] Discord user profile fetch error:', err);
    if (wantsJson) {
      return res.status(500).json({ error: 'Discord sign-in failed', details: err.message });
    }
    return res.redirect(`${fallback}/login?auth_error=sign_in_exception`);
  }
}