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
  return process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '1562365417815543808';
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

function publicWorkspace(bot) {
  return {
    id: bot.botId,
    guildId: bot.guildId,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    hasErlcApiKey: Boolean(bot.erlcApiKey),
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
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/auth/discord/start', rateLimit({ windowMs: 60 * 1000, max: 20 }), (req, res) => {
    const origin = appOrigin(req);
    const clientId = oauthClientId();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const returnTo = safeReturnUrl(req.query.returnTo, origin);

    // Without a client secret the code exchange cannot work, so never start a login.
    if (!clientSecret) {
      return res.redirect(`${origin}/login?auth_error=not_configured`);
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

  /** Resolve the guild and its stored settings for workspace routes, with consistent errors. */
  async function withWorkspace(req, res) {
    let guild = null;
    try {
      guild = await findAuthorizedGuild(req.dashboardSession, req.params.guildId);
    } catch (err) {
      if (err instanceof DiscordError && err.status === 401) {
        res.status(401).json({ error: 'Discord sign-in expired. Sign in again.' });
      } else {
        res.status(502).json({ error: 'Could not verify your Discord server access. Retry in a moment.' });
      }
      return null;
    }
    if (!guild) {
      res.status(403).json({ error: 'You need Manage Server permission in this Discord server.' });
      return null;
    }
    let bot = findGuildBot(req.params.guildId);
    if (!bot) {
      bot = createBotInstance(req.dashboardSession.user.id, {
        guildId: req.params.guildId,
        customizations: { serverName: guild.name }
      });
    }
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
      if (isBannedGuild(guildId) && !findGuildBot(guildId)) return res.status(403).json({ error: 'This server has been suspended from ERLC.US.' });
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
      res.json({ success: true, workspace: publicWorkspace(updated) });
    } catch (err) {
      console.error('[WEB] Saving settings failed:', err);
      res.status(500).json({ error: 'Settings could not be saved. Try again.' });
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
        updates.customizations = nextCustomizations;
        erlcCache.delete(bot.botId);
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to save.' });

      const updated = updateBotInstance(bot.botId, updates);
      res.json({ success: true, workspace: publicWorkspace(getBotInstance(bot.botId) || updated) });
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

  // 1. Handle Discord errors
  if (req.query.error) {
    console.warn('[WEB OAuth] Discord returned error:', req.query.error, req.query.error_description);
    return res.redirect(`${fallback}/login?auth_error=${encodeURIComponent(String(req.query.error_description || req.query.error))}`);
  }

  // 2. Handle code
  const code = req.query.code;
  if (!code) {
    const sessionId = cookieValue(req, SESSION_COOKIE);
    if (sessionId && sessions.has(sessionId)) {
      return res.redirect(`${fallback}/dashboard`);
    }
    return res.redirect(`${fallback}/login?auth_error=no_code_provided`);
  }

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const pending = state ? oauthStates.get(state) : null;
  if (state) oauthStates.delete(state);
  // Only finish logins this server started, so a forged callback link cannot sign someone in.
  if (!pending) return res.redirect(`${fallback}/login?auth_error=login_expired`);

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

  // Without a client secret the code exchange cannot work, and a missing secret must never log anyone in.
  if (!clientSecret) {
    return res.redirect(`${fallback}/login?auth_error=not_configured`);
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
    return res.redirect(`${fallback}/login?auth_error=token_exchange_failed`);
  }

  try {
    const user = await discordJson('https://discord.com/api/v10/users/@me', tokenData.access_token);
    // For now only members of the allowed server(s) can log in (LOGIN_GUILD_IDS, comma separated).
    const allowedGuilds = (process.env.LOGIN_GUILD_IDS || '1562353446294781972').split(',').map(id => id.trim()).filter(Boolean);
    if (allowedGuilds.length) {
      const userGuilds = await discordJson('https://discord.com/api/v10/users/@me/guilds', tokenData.access_token).catch(() => []);
      const isMember = Array.isArray(userGuilds) && userGuilds.some(g => allowedGuilds.includes(String(g.id)));
      if (!isMember) {
        console.warn(`[WEB OAuth] Login refused for ${user.username} (${user.id}): not in an allowed server.`);
        return res.redirect(`${fallback}/login?auth_error=${encodeURIComponent('Login is limited to members of the ERLC.US testing server for now.')}`);
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
    return res.redirect(pending?.returnTo || `${fallback}/dashboard`);
  } catch (err) {
    console.error('[WEB OAuth] Discord user profile fetch error:', err);
    return res.redirect(`${fallback}/login?auth_error=sign_in_exception`);
  }
}