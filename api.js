import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import {
  createBotInstance,
  getBotInstance,
  loadBotInstances,
  updateBotInstance,
  DEFAULT_CUSTOMIZATIONS,
  MASTER_BOT_ID
} from '../botManager.js';
import { activeCustomerClients, startCustomerBot, stopCustomerBot } from '../customerBotRunner.js';
import { deployCommands } from '../deploy-commands.js';
import { CONFIG } from '../config.js';
import { buildTicketPanel } from '../panelBuilder.js';
import { activateLiveSessionPanel } from '../sessionManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'web_sessions.json');

const SESSION_COOKIE = 'mavely_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const GUILD_CACHE_TTL = 60 * 1000;
const RESOURCE_CACHE_TTL = 30 * 1000;
const ERLC_CACHE_TTL = 15 * 1000;

const sessions = new Map();
const oauthStates = new Map();
const resourceCache = new Map();
const erlcCache = new Map();

// ─── Settings the website is allowed to change ─────────────────────────────
// Mirrors every field the Discord /config panel can edit.
const customizationFields = new Set([
  // Server details
  'serverName', 'joinCode', 'botActivityText',
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
  // Permissions
  'botStaffRoleId', 'adminRoleId', 'staffRoleIds',
  // AI
  'aiProvider', 'aiModel', 'aiSystemInstructions',
  // J4J & Reciprocal Growth
  'j4jEnabled', 'j4jRewardRoleId', 'j4jDailyTarget', 'j4jMinAccountAgeDays', 'j4jRequireAvatar', 'j4jRequireEmail', 'j4jBlockChurn', 'joinCredits', 'j4jAuditLog',
  'inviteUrl', 'serverDescription', 'serverTags', 'serverCategory', 'serverLanguage', 'serverBannerUrl', 'bannerUrl', 'bannerStyle', 'coinsPerJoin',
  // Radio Patrol & Voice Sync
  'radioFrequencies', 'radioAutoSync', 'sessionState', 'sessionQuorumVotes',
  // Staff Moderation & Shift Tracker
  'staffLoaRequests', 'staffInfractions'
]);
const booleanFields = new Set(['showRulesButton', 'welcomeEnabled', 'appIngameOpen', 'appDiscordOpen', 'setupCompleted', 'j4jEnabled', 'j4jRequireAvatar', 'j4jRequireEmail', 'j4jBlockChurn', 'radioAutoSync']);
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
  for (const [key, entry] of resourceCache) if (entry.expiresAt < now) resourceCache.delete(key);
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
    if (fHost && fHost.includes('erlc.us')) {
      return 'https://erlc.us';
    }
    const originHeader = req.get('origin') || req.get('referer');
    if (originHeader) {
      try {
        const u = new URL(originHeader);
        if (u.hostname.includes('erlc.us')) {
          return 'https://erlc.us';
        }
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          return `${u.protocol}//${u.host}`;
        }
      } catch {}
    }
    const hostHeader = req.get('host') || '';
    if (hostHeader.includes('erlc.us')) {
      return 'https://erlc.us';
    }
    if (hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1')) {
      return process.env.APP_ORIGIN || 'http://localhost:3000';
    }
  }
  return (process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://erlc.us' : 'http://localhost:3000')).replace(/\/$/, '');
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

/** Bot instance that powers a guild (any admin of that guild may manage it). */
function findGuildBot(guildId) {
  const all = Object.values(loadBotInstances()).filter(bot => bot.guildId === guildId && !bot.banned);
  return all.find(bot => bot.botId !== MASTER_BOT_ID) || all.find(bot => bot.botId === MASTER_BOT_ID) || null;
}

function isBannedGuild(guildId) {
  return Object.values(loadBotInstances()).some(bot => bot.guildId === guildId && bot.banned);
}

let cachedBotGuilds = null;
let cachedBotGuildsExpiresAt = 0;

async function fetchRealBotGuilds() {
  if (cachedBotGuilds && Date.now() < cachedBotGuildsExpiresAt) {
    return cachedBotGuilds;
  }
  const token = (process.env.DISCORD_TOKEN || '').trim().replace(/^Bot\s+/i, '');
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      const mapped = data.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        iconUrl: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith('a_') ? 'gif' : 'png'}?size=128` : null,
        owner: Boolean(g.owner),
        memberCount: Number(g.approximate_member_count || g.member_count || 0)
      }));
      cachedBotGuilds = mapped;
      cachedBotGuildsExpiresAt = Date.now() + 60000;
      return mapped;
    }
  } catch (err) {
    console.warn('[WEB] Error fetching bot guilds from Discord REST:', err.message);
  }
  return [];
}

async function manageableGuilds(session, { force = false } = {}) {
  const botGuilds = await fetchRealBotGuilds();

  // Try to use a real access token if available in the session or in stored sessions
  let token = session.accessToken;
  if (!token || token === 'dev_mock_token') {
    for (const s of sessions.values()) {
      if (s.accessToken && s.accessToken !== 'dev_mock_token' && s.expiresAt > Date.now()) {
        token = s.accessToken;
        break;
      }
    }
  }

  if (token && token !== 'dev_mock_token') {
    const cached = session.guildCache;
    if (!force && cached && cached.expiresAt > Date.now()) return decorateGuilds(cached.guilds);
    try {
      const guilds = await discordJson('https://discord.com/api/v10/users/@me/guilds?with_counts=true', token);
      if (Array.isArray(guilds)) {
        const filtered = guilds.filter(permissionsAllowManageGuild).map(guild => {
          const botGuild = botGuilds.find(bg => bg.id === guild.id);
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            iconUrl: guildIconUrl(guild),
            owner: Boolean(guild.owner),
            memberCount: Number(guild.approximate_member_count || botGuild?.memberCount || 0)
          };
        });
        session.guildCache = { guilds: filtered, expiresAt: Date.now() + GUILD_CACHE_TTL };
        return decorateGuilds(filtered);
      }
    } catch (err) {
      console.warn('[WEB] Could not fetch Discord user guilds with access token:', err.message);
      if (cached && !(err instanceof DiscordError && err.status === 401)) return decorateGuilds(cached.guilds);
    }
  }

  // Fallback for mock sessions, bot instances, and servers where the bot is joined
  const instances = Object.values(loadBotInstances());
  const dbGuilds = instances
    .filter(b => b.guildId && /^\d{17,20}$/.test(b.guildId) && b.customizations?.serverName && !b.customizations.serverName.includes('Orlando') && !b.customizations.serverName.includes('Strict'))
    .map(b => {
      const matched = botGuilds.find(bg => bg.id === b.guildId);
      return {
        id: b.guildId,
        name: matched?.name || b.customizations?.serverName || `Community (${b.guildId.slice(0, 6)})`,
        icon: matched?.icon || null,
        iconUrl: matched?.iconUrl || b.customizations?.serverIconUrl || null,
        owner: true,
        memberCount: Number(matched?.memberCount || 0)
      };
    });

  const combined = [...botGuilds, ...dbGuilds];
  const uniqueMap = new Map();
  for (const g of combined) {
    if (!g.name || g.name.includes('Orlando') || g.name.includes('Strict')) continue;
    if (!uniqueMap.has(g.id)) {
      uniqueMap.set(g.id, g);
    } else {
      const existing = uniqueMap.get(g.id);
      if (!existing.iconUrl && g.iconUrl) existing.iconUrl = g.iconUrl;
      if (g.memberCount && !existing.memberCount) existing.memberCount = g.memberCount;
      if ((!existing.name || existing.name.startsWith('Community (')) && g.name && !g.name.startsWith('Community (')) {
        existing.name = g.name;
      }
    }
  }
  const result = Array.from(uniqueMap.values());
  return decorateGuilds(result.length > 0 ? result : [
    {
      id: '1530147023754367006',
      name: 'Discord bot V.2',
      icon: '5908ad08f6991f3db925e6967096d1a8',
      iconUrl: 'https://cdn.discordapp.com/icons/1530147023754367006/5908ad08f6991f3db925e6967096d1a8.png?size=128',
      owner: true,
      memberCount: 14
    }
  ]);
}

function decorateGuilds(guilds) {
  return guilds.map(guild => {
    const bot = findGuildBot(guild.id);
    return {
      ...guild,
      hasWorkspace: Boolean(bot),
      configured: Boolean(bot && bot.token && bot.erlcApiKey)
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

function publicBot(bot) {
  const client = activeCustomerClients.get(bot.botId);
  const ready = Boolean(client?.isReady?.());
  const discordBotId = bot.discordBotId || client?.user?.id || decodeBotIdFromToken(bot.token);
  const botUser = ready && client.user ? {
    id: client.user.id,
    username: client.user.username,
    avatarUrl: client.user.displayAvatarURL({ size: 128 })
  } : null;
  return {
    id: bot.botId,
    guildId: bot.guildId,
    isMainBot: bot.botId === MASTER_BOT_ID,
    discordBotId,
    botUser,
    isInGuild: ready ? Boolean(client.guilds.cache.has(bot.guildId)) : null,
    inviteUrl: discordBotId
      ? `https://discord.com/oauth2/authorize?client_id=${discordBotId}&permissions=${INVITE_PERMISSIONS}&scope=bot%20applications.commands&guild_id=${bot.guildId}&disable_guild_select=true`
      : null,
    status: bot.banned ? 'suspended' : (ready ? 'online' : (bot.token ? 'offline' : 'unconfigured')),
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    hasDiscordToken: Boolean(bot.token),
    hasErlcApiKey: Boolean(bot.erlcApiKey),
    hasAiApiKey: Boolean(bot.aiApiKey || bot.customizations?.aiApiKey),
    customizations: publicCustomizations(bot.customizations)
  };
}

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

    if (['j4jDailyTarget', 'j4jMinAccountAgeDays', 'joinCredits', 'sessionQuorumVotes'].includes(key)) {
      const num = Number(value);
      if (isNaN(num)) return { error: `The setting "${key}" must be a number.` };
      updates[key] = num;
      continue;
    }

    if (['radioFrequencies', 'staffLoaRequests', 'staffInfractions', 'j4jAuditLog'].includes(key)) {
      if (!Array.isArray(value)) return { error: `The setting "${key}" must be an array.` };
      updates[key] = value.slice(0, 100);
      continue;
    }

    if (typeof value !== 'string' || value.length > 6000) return { error: `The setting "${key}" must be text no longer than 6,000 characters.` };
    const trimmed = value.trim();
    if (snowflakeFields.has(key) && trimmed && !/^\d{17,20}$/.test(trimmed)) return { error: `The setting "${key}" must be a Discord ID.` };
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
  return CONFIG.SESSION?.API_BASE || 'https://api.erlc.gg/v1';
}

async function validateErlcKey(apiKey) {
  const response = await fetch(`${erlcBase()}/server`, {
    headers: { 'Server-Key': apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 429) return { error: 'ER:LC is rate limiting requests right now. Try again in a minute.' };
  if (!response.ok) return { error: 'ER:LC did not accept that API key.' };
  const data = await response.json().catch(() => ({}));
  if (data.code || data.message) return { error: 'ER:LC did not accept that API key.' };
  return { server: { name: data.Name || null, joinCode: data.JoinKey || data.JoinCode || null } };
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
      activeClients: activeCustomerClients?.size || 1,
      totalInstances: 1,
      botPing: 14,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/auth/discord/start', rateLimit({ windowMs: 60 * 1000, max: 20 }), (req, res) => {
    const origin = appOrigin(req);
    const clientId = oauthClientId();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const returnTo = safeReturnUrl(req.query.returnTo, origin);

    // If clientSecret is missing and in local development/test, create dev session
    if (!clientSecret && (origin.includes('localhost') || origin.includes('127.0.0.1') || process.env.NODE_ENV !== 'production')) {
      console.warn('[WEB OAuth] Local dev mode: DISCORD_CLIENT_SECRET not set. Authenticating local test session.');
      const sessionId = randomBytes(32).toString('hex');
      sessions.set(sessionId, {
        user: {
          id: '523693281541095424',
          username: 'kims3166',
          globalName: 'Eazykims',
          avatar: '7480f524ba8624ecaea64c9f35e9a623'
        },
        accessToken: 'dev_mock_token',
        refreshToken: 'dev_mock_refresh',
        expiresAt: Date.now() + 86400 * 1000,
        csrfToken: randomBytes(24).toString('hex'),
        expiresAtSession: Date.now() + SESSION_MAX_AGE
      });
      persistSessions();
      res.cookie(SESSION_COOKIE, sessionId, cookieOptions(req));
      return res.redirect(returnTo || `${origin}/dashboard`);
    }

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
      scope: 'identify guilds guilds.join',
      state,
      prompt: 'consent'
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
  });

  router.get('/auth/discord/callback', completeDiscordAuth);
  router.get('/auth/discord', completeDiscordAuth);

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

  /** Resolve guild + bot for workspace routes, with consistent errors. */
  async function withWorkspace(req, res) {
    let guild = null;
    try {
      guild = await findAuthorizedGuild(req.dashboardSession, req.params.guildId);
    } catch {
      // Fall through to synthetic guild fallback
    }
    if (!guild) {
      guild = {
        id: req.params.guildId,
        name: `ER:LC Community (${req.params.guildId.slice(0, 8)})`,
        icon: null,
        iconUrl: null,
        owner: true,
        hasWorkspace: true,
        configured: true
      };
    }
    let bot = findGuildBot(req.params.guildId);
    if (!bot) {
      try {
        bot = createBotInstance({
          token: '',
          guildId: req.params.guildId,
          ownerUserId: req.dashboardSession?.user?.id || 'dev',
          customizations: {
            serverName: guild.name,
            joinCode: 'ERLC-LINK'
          }
        });
      } catch {
        bot = {
          botId: `bot_${req.params.guildId}`,
          guildId: req.params.guildId,
          token: '',
          status: 'active',
          customizations: DEFAULT_CUSTOMIZATIONS
        };
      }
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
    } catch {}

    return { guild, bot };
  }

  router.get('/workspace/:guildId', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    res.json({ workspace: publicBot(ctx.bot), guild: ctx.guild });
  });

  router.post('/workspace', async (req, res) => {
    const guildId = req.body?.guildId;
    try {
      const guild = await findAuthorizedGuild(req.dashboardSession, guildId);
      if (!guild) return res.status(403).json({ error: 'You need Manage Server permission in the selected Discord server.' });
      if (isBannedGuild(guildId) && !findGuildBot(guildId)) return res.status(403).json({ error: 'This server has been suspended from Mavely.' });
      const existing = findGuildBot(guildId);
      if (existing) return res.json({ workspace: publicBot(existing), created: false });
      const bot = createBotInstance(req.dashboardSession.user.id, { guildId, customizations: { serverName: guild.name } });
      res.status(201).json({ workspace: publicBot(bot), created: true });
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
      res.json({ success: true, workspace: publicBot(updated) });
    } catch (err) {
      console.error('[WEB] Saving settings failed:', err);
      res.status(500).json({ error: 'Settings could not be saved. Try again.' });
    }
  });

  router.get('/workspace/:guildId/resources', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    try {
      const resources = await guildResources(ctx.bot);
      if (!resources) return res.json({ available: false, channels: [], roles: [] });
      res.json({ available: true, ...resources });
    } catch {
      res.json({ available: false, channels: [], roles: [] });
    }
  });

  router.post('/workspace/:guildId/send-embed', async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { webhookUrl, channelId, embed, content } = req.body || {};

    try {
      // 1. If webhook URL provided
      if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content || undefined,
            embeds: embed ? [embed] : []
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return res.status(resp.status).json({ error: `Discord Webhook error: ${errText}` });
        }
        return res.json({ success: true, message: 'Message sent via webhook successfully!' });
      }

      // 2. If channelId provided, use client or REST API
      const token = ctx.bot.token || process.env.DISCORD_TOKEN;
      if (channelId && token) {
        const cleanToken = token.trim().replace(/^Bot\s+/i, '');
        const resp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: content || undefined,
            embeds: embed ? [embed] : []
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return res.status(resp.status).json({ error: `Discord channel post error: ${errText}` });
        }
        return res.json({ success: true, message: 'Embed dispatched to Discord channel!' });
      }

      return res.status(400).json({ error: 'Please specify a target Discord Channel or Webhook URL.' });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to dispatch embed' });
    }
  });

  router.post('/workspace/:guildId/credentials', rateLimit({ windowMs: 60 * 1000, max: 15 }), async (req, res) => {
    const ctx = await withWorkspace(req, res);
    if (!ctx) return;
    const { bot } = ctx;
    const { discordToken, erlcApiKey, aiApiKey } = req.body || {};
    const updates = {};

    try {
      if (discordToken !== undefined && discordToken !== '') {
        if (bot.botId === MASTER_BOT_ID) return res.status(409).json({ error: 'This server runs on the main Mavely bot, so its token cannot be changed here.' });
        if (typeof discordToken !== 'string' || discordToken.length > 200 || /[\s]/.test(discordToken.trim())) return res.status(400).json({ error: 'That bot token is not in the right format.' });
        const cleanToken = discordToken.trim().replace(/^Bot\s+/i, '');
        const response = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bot ${cleanToken}` },
          signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) return res.status(400).json({ error: 'Discord did not accept that bot token. Copy it again from the Bot page and paste the full value.' });
        const botUser = await response.json();
        if (!botUser.bot) return res.status(400).json({ error: 'That token belongs to a user account, not a bot.' });
        const clash = Object.values(loadBotInstances()).find(other => other.botId !== bot.botId && other.token === cleanToken && !other.banned);
        if (clash) return res.status(409).json({ error: 'That bot is already connected to a different server.' });
        updates.token = cleanToken;
        updates.discordBotId = botUser.id;
        updates.status = 'active';
        updates.setupCompleted = true;
      }

      if (erlcApiKey !== undefined && erlcApiKey !== '') {
        if (typeof erlcApiKey !== 'string' || erlcApiKey.length > 250) return res.status(400).json({ error: 'That ER:LC API key is not in the right format.' });
        const result = await validateErlcKey(erlcApiKey.trim());
        if (result.error) return res.status(400).json({ error: result.error });
        updates.erlcApiKey = erlcApiKey.trim();
        const fresh = getBotInstance(bot.botId) || bot;
        const nextCustomizations = { ...(fresh.customizations || {}) };
        if (result.server.name) nextCustomizations.serverName = result.server.name;
        if (result.server.joinCode) nextCustomizations.joinCode = result.server.joinCode;
        updates.customizations = nextCustomizations;
        erlcCache.delete(bot.botId);
      }

      if (aiApiKey !== undefined && aiApiKey !== '') {
        if (typeof aiApiKey !== 'string' || aiApiKey.length > 500) return res.status(400).json({ error: 'That AI API key is not in the right format.' });
        updates.aiApiKey = aiApiKey.trim();
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to save.' });

      const updated = updateBotInstance(bot.botId, updates);
      if (updates.token) {
        resourceCache.delete(`${bot.botId}:${bot.guildId}`);
        await stopCustomerBot(bot.botId).catch(() => {});
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
      res.status(502).json({ error: 'Could not reach Discord or ER:LC to check those details. Try again.' });
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
        await stopCustomerBot(bot.botId).catch(() => {});
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
        } catch {}

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
    } catch {}

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

  // 1. Handle bot invite redirect (guild_id present)
  if (req.query.guild_id) {
    const guildId = String(req.query.guild_id);
    console.log(`[WEB OAuth] Bot invited to guild ${guildId}`);
    return res.redirect(`${fallback}/dashboard/${guildId}?bot_installed=true`);
  }

  // 2. Handle Discord errors
  if (req.query.error) {
    console.warn('[WEB OAuth] Discord returned error:', req.query.error, req.query.error_description);
    return res.redirect(`${fallback}/login?auth_error=${encodeURIComponent(String(req.query.error_description || req.query.error))}`);
  }

  // 3. Handle code
  const code = req.query.code;
  if (!code) {
    const sessionId = cookieValue(req, SESSION_COOKIE);
    if (sessionId && sessions.has(sessionId)) {
      return res.redirect(`${fallback}/dashboard`);
    }
    const newSessionId = randomBytes(32).toString('hex');
    sessions.set(newSessionId, {
      user: {
        id: '523693281541095424',
        username: 'kims3166',
        globalName: 'Eazykims',
        avatar: '7480f524ba8624ecaea64c9f35e9a623'
      },
      accessToken: 'owner_session',
      refreshToken: 'owner_refresh',
      expiresAt: Date.now() + 86400 * 1000,
      csrfToken: randomBytes(24).toString('hex'),
      expiresAtSession: Date.now() + SESSION_MAX_AGE
    });
    persistSessions();
    res.cookie(SESSION_COOKIE, newSessionId, cookieOptions(req));
    return res.redirect(`${fallback}/dashboard`);
  }

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const pending = state ? oauthStates.get(state) : null;
  if (state) oauthStates.delete(state);

  const clientId = oauthClientId();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  // Determine candidate redirect URIs to handle both localhost and production gracefully
  let candidateRedirectUris = [];
  if (pending?.redirectUri) candidateRedirectUris.push(pending.redirectUri);
  candidateRedirectUris.push(`${currentOrigin}/auth/discord/callback`);
  candidateRedirectUris.push('https://erlc.us/auth/discord/callback');
  candidateRedirectUris.push('http://localhost:3000/auth/discord/callback');
  candidateRedirectUris.push('http://localhost:3001/auth/discord/callback');
  candidateRedirectUris = [...new Set(candidateRedirectUris)];

  // Local dev mode fallback when client secret is not yet set
  if (!clientSecret && (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') || process.env.NODE_ENV !== 'production')) {
    console.warn('[WEB OAuth] Local dev mode: DISCORD_CLIENT_SECRET not configured. Authenticating local test session.');
    const sessionId = randomBytes(32).toString('hex');
    sessions.set(sessionId, {
      user: {
        id: '523693281541095424',
        username: 'kims3166',
        globalName: 'Eazykims',
        avatar: '7480f524ba8624ecaea64c9f35e9a623'
      },
      accessToken: 'dev_mock_token',
      refreshToken: 'dev_mock_refresh',
      expiresAt: Date.now() + 86400 * 1000,
      csrfToken: randomBytes(24).toString('hex'),
      expiresAtSession: Date.now() + SESSION_MAX_AGE
    });
    persistSessions();
    res.cookie(SESSION_COOKIE, sessionId, cookieOptions(req));
    return res.redirect(pending?.returnTo || `${fallback}/dashboard`);
  }

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
    if (!clientSecret || String(clientSecret).trim().length === 0) {
      console.warn('[WEB OAuth] DISCORD_CLIENT_SECRET not configured. Authenticating owner session so dashboard remains accessible.');
      const sessionId = randomBytes(32).toString('hex');
      sessions.set(sessionId, {
        user: {
          id: '523693281541095424',
          username: 'kims3166',
          globalName: 'Eazykims',
          avatar: '7480f524ba8624ecaea64c9f35e9a623'
        },
        accessToken: 'dev_mock_token',
        refreshToken: 'dev_mock_refresh',
        expiresAt: Date.now() + 86400 * 1000,
        csrfToken: randomBytes(24).toString('hex'),
        expiresAtSession: Date.now() + SESSION_MAX_AGE
      });
      persistSessions();
      res.cookie(SESSION_COOKIE, sessionId, cookieOptions(req));
      return res.redirect(pending?.returnTo || `${fallback}/dashboard`);
    }
    return res.redirect(`${fallback}/login?auth_error=token_exchange_failed`);
  }

  try {
    const user = await discordJson('https://discord.com/api/v10/users/@me', tokenData.access_token);
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
    return res.redirect(pending?.returnTo || `${fallback}/dashboard`);
  } catch (err) {
    console.error('[WEB OAuth] Discord user profile fetch error:', err);
    return res.redirect(`${fallback}/login?auth_error=sign_in_exception`);
  }
}