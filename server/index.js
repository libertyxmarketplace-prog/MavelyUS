import express from 'express';
import session from 'express-session';
import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import * as db from './db.js';
import { discordApi, avatarUrl, guildIconUrl, hasMembersIntent } from './discord.js';
import { prc, prcCached } from './erlc.js';
import { getInstance, ensureBotRecord, autoStartAll } from './botManager.js';
import { MODULES, COMMANDS, normalizeConfig, isModuleOn, defaultModuleState, defaultCommandState, INVITE_PERMISSIONS, COMMAND_NAME_RE } from '../shared/catalog.js';

const PORT = Number(process.env.PORT || 3001);
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1552165138017165372';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) console.warn('[civlink] SESSION_SECRET is not set. Using a development secret.');
if (!CLIENT_SECRET) console.warn('[civlink] DISCORD_CLIENT_SECRET is not set. Discord login will not work until you add it to .env');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));
app.use(
  session({
    store: new db.FileSessionStore(),
    secret: process.env.SESSION_SECRET || 'civlink-dev-secret',
    resave: false,
    saveUninitialized: false,
    name: 'civlink.sid',
    cookie: { httpOnly: true, sameSite: 'lax', secure: BASE_URL.startsWith('https://'), maxAge: 1000 * 60 * 60 * 24 * 14 },
  })
);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(req, res, next) {
  if (!req.session.userId || !db.getUser(req.session.userId)) return res.status(401).json({ error: 'Not logged in' });
  req.user = db.getUser(req.session.userId);
  req.bot = ensureBotRecord(req.user);
  next();
}

const token = (req) => db.decrypt(req.bot.tokenEnc);

// ---------- Auth ----------

app.get('/auth/discord/login', (req, res) => {
  if (!CLIENT_SECRET) {
    return res.status(500).send('Discord login is not configured yet. Add DISCORD_CLIENT_SECRET to the .env file and restart the server.');
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  const params = new URLSearchParams({ client_id: CLIENT_ID, response_type: 'code', redirect_uri: REDIRECT_URI, scope: 'identify guilds', state, prompt: 'none' });
  req.session.save(() => res.redirect(`https://discord.com/oauth2/authorize?${params}`));
});

app.get(
  '/auth/discord/callback',
  wrap(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) return res.redirect('/?login=cancelled');
    if (!code || !state || state !== req.session.oauthState) return res.redirect('/?login=failed');
    delete req.session.oauthState;
    const tokenData = await discordApi('/oauth2/token', {
      method: 'POST',
      form: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI },
    });
    const [me, guilds] = await Promise.all([
      discordApi('/users/@me', { bearer: tokenData.access_token }),
      discordApi('/users/@me/guilds', { bearer: tokenData.access_token }),
    ]);
    const user = db.upsertUser(me.id, {
      id: me.id,
      username: me.username,
      globalName: me.global_name || null,
      avatar: me.avatar || null,
    });
    user.guilds = guilds
      .filter((g) => g.owner || (BigInt(g.permissions) & 0x8n) === 0x8n || (BigInt(g.permissions) & 0x20n) === 0x20n)
      .map((g) => ({ id: g.id, name: g.name, icon: g.icon, owner: g.owner }));
    ensureBotRecord(user);
    db.save();
    req.session.regenerate((err) => {
      if (err) return res.redirect('/?login=failed');
      req.session.userId = me.id;
      req.session.save(() => res.redirect('/dashboard'));
    });
  })
);

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('civlink.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  const user = req.session.userId && db.getUser(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  const p = user.profile;
  res.json({ id: p.id, username: p.username, displayName: p.globalName || p.username, avatarUrl: avatarUrl(p, 128) });
});

app.get('/api/guilds', requireAuth, (req, res) => {
  res.json((req.user.guilds || []).map((g) => ({ ...g, iconUrl: guildIconUrl(g) })));
});

// ---------- Bot ----------

function botPayload(req) {
  const b = req.bot;
  const inst = getInstance(req.user.id);
  const bu = b.botUser;
  return {
    hasToken: !!b.tokenEnc,
    hasErlcKey: !!b.erlcKeyEnc,
    applicationId: b.applicationId || null,
    membersIntent: hasMembersIntent(b.appFlags || 0),
    user: bu
      ? {
          id: bu.id,
          username: bu.username,
          avatarUrl: avatarUrl(bu, 256),
          bannerUrl: bu.banner ? `https://cdn.discordapp.com/banners/${bu.id}/${bu.banner}.png?size=600` : null,
        }
      : null,
    description: b.description || '',
    inviteUrl: b.applicationId
      ? `https://discord.com/oauth2/authorize?client_id=${b.applicationId}&scope=bot+applications.commands&permissions=${INVITE_PERMISSIONS}${b.config.guildId ? `&guild_id=${b.config.guildId}&disable_guild_select=true` : ''}`
      : null,
    config: b.config,
    runtime: inst.snapshot(),
  };
}

app.get('/api/bot', requireAuth, (req, res) => res.json(botPayload(req)));

app.post(
  '/api/bot/token',
  requireAuth,
  wrap(async (req, res) => {
    const value = String(req.body?.token || '').trim();
    if (!value) return res.status(400).json({ error: 'Paste your bot token.' });
    let me, appInfo;
    try {
      [me, appInfo] = await Promise.all([discordApi('/users/@me', { token: value }), discordApi('/applications/@me', { token: value })]);
    } catch (e) {
      return res.status(400).json({ error: e.status === 401 ? 'Discord rejected that token. Reset it in the Developer Portal and paste the new one.' : e.message });
    }
    const inst = getInstance(req.user.id);
    if (inst.client) await inst.stop({ manual: false });
    req.bot.tokenEnc = db.encrypt(value);
    req.bot.applicationId = appInfo.id;
    req.bot.appFlags = appInfo.flags || 0;
    req.bot.description = appInfo.description || '';
    req.bot.botUser = { id: me.id, username: me.username, avatar: me.avatar, banner: me.banner };
    db.save();
    inst.log('info', `Token saved for ${me.username}`);
    res.json(botPayload(req));
  })
);

app.delete(
  '/api/bot/token',
  requireAuth,
  wrap(async (req, res) => {
    await getInstance(req.user.id).stop();
    Object.assign(req.bot, { tokenEnc: '', applicationId: null, appFlags: 0, botUser: null, description: '' });
    db.save();
    res.json(botPayload(req));
  })
);

app.put(
  '/api/bot/erlc-key',
  requireAuth,
  wrap(async (req, res) => {
    const value = String(req.body?.key || '').trim();
    if (!value) {
      req.bot.erlcKeyEnc = '';
      db.save();
      return res.json(botPayload(req));
    }
    try {
      const s = await prc(value, '/server');
      req.bot.erlcKeyEnc = db.encrypt(value);
      req.bot.erlcServerName = s.Name;
      db.save();
      res.json({ ...botPayload(req), erlcServerName: s.Name });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  })
);

app.put(
  '/api/bot/config',
  requireAuth,
  wrap(async (req, res) => {
    const previous = req.bot.config;
    req.bot.config = normalizeConfig(req.body?.config);
    db.save();
    const inst = getInstance(req.user.id);
    try {
      await inst.applyConfig(previous);
    } catch (e) {
      inst.error('Apply config', e);
      return res.json({ ...botPayload(req), warning: `Saved, but the running bot could not apply it: ${e.message}` });
    }
    res.json(botPayload(req));
  })
);

app.put(
  '/api/bot/profile',
  requireAuth,
  wrap(async (req, res) => {
    const t = token(req);
    if (!t) return res.status(400).json({ error: 'Add your bot token first.' });
    const { username, avatar, banner, description } = req.body || {};
    const patch = {};
    if (typeof username === 'string' && username.trim() && username.trim() !== req.bot.botUser?.username) patch.username = username.trim().slice(0, 32);
    const isImage = (v) => typeof v === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,/.test(v);
    if (avatar === null || isImage(avatar)) patch.avatar = avatar;
    if (banner === null || isImage(banner)) patch.banner = banner;
    try {
      if (Object.keys(patch).length) {
        const me = await discordApi('/users/@me', { token: t, method: 'PATCH', body: patch });
        req.bot.botUser = { id: me.id, username: me.username, avatar: me.avatar, banner: me.banner };
      }
      if (typeof description === 'string' && description !== req.bot.description) {
        const appInfo = await discordApi('/applications/@me', { token: t, method: 'PATCH', body: { description: description.slice(0, 400) } });
        req.bot.description = appInfo.description || '';
      }
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    db.save();
    res.json(botPayload(req));
  })
);

for (const action of ['start', 'stop', 'restart']) {
  app.post(
    `/api/bot/${action}`,
    requireAuth,
    wrap(async (req, res) => {
      try {
        await getInstance(req.user.id)[action]();
      } catch (e) {
        return res.status(400).json({ error: e.message, ...botPayload(req) });
      }
      res.json(botPayload(req));
    })
  );
}

app.get(
  '/api/bot/guild-meta',
  requireAuth,
  wrap(async (req, res) => {
    const t = token(req);
    const gid = req.bot.config.guildId;
    if (!t || !gid) return res.json({ available: false, reason: !t ? 'no-token' : 'no-guild', roles: [], channels: [] });
    try {
      const [guild, roles, channels] = await Promise.all([
        discordApi(`/guilds/${gid}?with_counts=true`, { token: t }),
        discordApi(`/guilds/${gid}/roles`, { token: t }),
        discordApi(`/guilds/${gid}/channels`, { token: t }),
      ]);
      res.json({
        available: true,
        guild: { id: guild.id, name: guild.name, iconUrl: guildIconUrl(guild), memberCount: guild.approximate_member_count ?? null },
        roles: roles
          .filter((r) => r.id !== gid && !r.managed)
          .sort((a, b) => b.position - a.position)
          .map((r) => ({ id: r.id, name: r.name, color: r.color })),
        channels: channels
          .filter((c) => [0, 4, 5].includes(c.type))
          .sort((a, b) => a.position - b.position)
          .map((c) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parent_id })),
      });
    } catch (e) {
      res.json({ available: false, reason: e.status === 403 || e.status === 404 ? 'not-in-guild' : 'error', error: e.message, roles: [], channels: [] });
    }
  })
);

// ---------- Overview ----------

let cpuSample = { usage: process.cpuUsage(), at: process.hrtime.bigint() };
function hostStats() {
  const now = process.hrtime.bigint();
  const usage = process.cpuUsage(cpuSample.usage);
  const elapsedMicros = Number(now - cpuSample.at) / 1000;
  cpuSample = { usage: process.cpuUsage(), at: now };
  const cpu = elapsedMicros > 0 ? ((usage.user + usage.system) / elapsedMicros / os.cpus().length) * 100 : 0;
  const mem = process.memoryUsage();
  return { cpuPercent: Math.min(100, Math.round(cpu * 10) / 10), rss: mem.rss, heapUsed: mem.heapUsed, totalMem: os.totalmem(), processUptime: Math.round(process.uptime()) };
}

app.get(
  '/api/overview',
  requireAuth,
  wrap(async (req, res) => {
    const b = req.bot;
    const c = b.config;
    const inst = getInstance(req.user.id);
    const t = token(req);

    let discord = null;
    if (c.guildId && t) {
      const cached = inst.client?.guilds?.cache?.get(c.guildId);
      if (cached) discord = { name: cached.name, memberCount: cached.memberCount, iconUrl: cached.iconURL({ size: 128 }) };
      else {
        try {
          const g = await discordApi(`/guilds/${c.guildId}?with_counts=true`, { token: t });
          discord = { name: g.name, memberCount: g.approximate_member_count ?? null, iconUrl: guildIconUrl(g) };
        } catch (e) {
          discord = { error: e.status === 403 || e.status === 404 ? 'The bot is not in this server yet.' : e.message };
        }
      }
    }

    let erlc = { configured: !!b.erlcKeyEnc };
    if (b.erlcKeyEnc) {
      const key = db.decrypt(b.erlcKeyEnc);
      try {
        const [s, q, players] = await Promise.all([prcCached(key, '/server'), prcCached(key, '/server/queue'), prcCached(key, '/server/players')]);
        erlc = {
          configured: true,
          name: s.Name,
          players: s.CurrentPlayers,
          maxPlayers: s.MaxPlayers,
          queue: q.length,
          staffInGame: players.filter((p) => p.Permission && p.Permission !== 'Normal').length,
        };
      } catch (e) {
        erlc = { configured: true, error: e.message };
      }
    }

    const tickets = Object.values(b.state.tickets);
    res.json({
      bot: { ...inst.snapshot(), hasToken: !!b.tokenEnc, user: b.botUser ? { username: b.botUser.username, avatarUrl: avatarUrl(b.botUser, 128) } : null },
      guildSelected: !!c.guildId,
      discord,
      erlc,
      session: isModuleOn(c, 'sessions') ? b.state.session : undefined,
      staffOnDuty: isModuleOn(c, 'shifts') ? Object.keys(b.state.shifts).length : null,
      tickets: isModuleOn(c, 'tickets') ? { open: tickets.length, awaiting: tickets.filter((x) => x.awaiting).length } : null,
      activity: inst.activity.slice(0, 25),
      errors: b.errors.slice(0, 8),
      host: hostStats(),
    });
  })
);

// ---------- Diagnostics ----------

app.post(
  '/api/bot/diagnostics',
  requireAuth,
  wrap(async (req, res) => {
    const b = req.bot;
    const c = b.config;
    const t = token(req);
    const checks = [];
    const add = (name, status, detail) => checks.push({ name, status, detail });

    if (!t) {
      add('Bot token', 'fail', 'No token saved. Add one in Settings.');
      return res.json({ checks });
    }
    let appInfo = null;
    try {
      const me = await discordApi('/users/@me', { token: t });
      appInfo = await discordApi('/applications/@me', { token: t });
      b.appFlags = appInfo.flags || 0;
      add('Bot token', 'pass', `Authenticated as ${me.username}.`);
    } catch (e) {
      add('Bot token', 'fail', e.message);
      return res.json({ checks });
    }

    if (isModuleOn(c, 'welcome')) {
      hasMembersIntent(b.appFlags)
        ? add('Server Members Intent', 'pass', 'Enabled in the Developer Portal.')
        : add('Server Members Intent', 'fail', 'The Welcome module needs it. Enable it in the Developer Portal under Bot, Privileged Gateway Intents.');
    }

    if (!c.guildId) {
      add('Server', 'fail', 'Pick the Discord server your bot runs in, in Settings.');
    } else {
      try {
        const [guild, roles, member] = await Promise.all([
          discordApi(`/guilds/${c.guildId}`, { token: t }),
          discordApi(`/guilds/${c.guildId}/roles`, { token: t }),
          discordApi(`/guilds/${c.guildId}/members/${b.botUser.id}`, { token: t }),
        ]);
        add('Server', 'pass', `The bot is in ${guild.name}.`);
        let perms = 0n;
        for (const r of roles) if (r.id === c.guildId || member.roles.includes(r.id)) perms |= BigInt(r.permissions);
        const admin = (perms & 0x8n) === 0x8n;
        const need = [
          ['Send Messages', 0x800n, true],
          ['Embed Links', 0x4000n, true],
          ['Manage Channels', 0x10n, isModuleOn(c, 'tickets')],
          ['Kick Members', 0x2n, isModuleOn(c, 'moderation')],
          ['Ban Members', 0x4n, isModuleOn(c, 'moderation')],
          ['Timeout Members', 0x10000000000n, isModuleOn(c, 'moderation')],
          ['Mention Roles', 0x20000n, isModuleOn(c, 'sessions')],
        ].filter(([, , needed]) => needed);
        const missing = admin ? [] : need.filter(([, bit]) => (perms & bit) !== bit).map(([n]) => n);
        missing.length
          ? add('Permissions', 'warn', `Missing: ${missing.join(', ')}. Use the invite link again or edit the bot role.`)
          : add('Permissions', 'pass', admin ? 'The bot has Administrator.' : 'All permissions your modules need are granted.');
      } catch (e) {
        add('Server', 'fail', e.status === 403 || e.status === 404 ? 'The bot is not in the selected server. Use the invite link in Settings.' : e.message);
      }
    }

    const needsKey = ['erlc', 'erlc_logs', 'remote'].some((m) => isModuleOn(c, m));
    if (needsKey || b.erlcKeyEnc) {
      if (!b.erlcKeyEnc) add('ER:LC server key', 'fail', 'An ER:LC module is on but no server key is saved.');
      else {
        try {
          const s = await prc(db.decrypt(b.erlcKeyEnc), '/server');
          add('ER:LC server key', 'pass', `Connected to ${s.Name}.`);
        } catch (e) {
          add('ER:LC server key', 'fail', e.message);
        }
      }
    }

    for (const m of MODULES) {
      if (!isModuleOn(c, m.id) || m.id === 'erlc_logs') continue;
      const empty = m.settings.filter((s) => s.type !== 'number' && !c.modules[m.id].settings[s.key]).map((s) => s.label);
      if (m.id === 'sessions' && empty.includes('Announcement channel')) add(`${m.name} module`, 'warn', 'No announcement channel set.');
      if (m.id === 'tickets' && empty.length) add(`${m.name} module`, 'warn', `Not set: ${empty.join(', ')}.`);
    }
    if (isModuleOn(c, 'welcome') && ((c.welcome.enabled && !c.welcome.channelId) || (c.goodbye.enabled && !c.goodbye.channelId))) {
      add('Welcome module', 'warn', 'A message is turned on but has no channel.');
    }
    if (Object.entries(c.commands).some(([n, x]) => x.staffOnly && x.enabled && isModuleOn(c, COMMANDS[n].module))) {
      if (!c.staffRoleIds.length) add('Staff roles', 'warn', 'Some commands are staff only but no staff roles are set. Only administrators can use them.');
    }

    const inst = getInstance(req.user.id);
    const snap = inst.snapshot();
    if (snap.status === 'online') add('Gateway', 'pass', `Connected, ${snap.latency}ms latency.`);
    else add('Gateway', snap.status === 'error' ? 'fail' : 'warn', snap.lastError || 'The bot is not running.');

    db.save();
    inst.log('info', `Diagnostics ran: ${checks.filter((x) => x.status === 'pass').length}/${checks.length} passed`);
    res.json({ checks });
  })
);

// ---------- Commands ----------

app.get('/api/bot/commands', requireAuth, (req, res) => {
  const b = req.bot;
  res.json({
    stats: b.stats.commands,
    errors: b.errors.filter((e) => e.source.startsWith('/')).slice(0, 50),
  });
});

app.put(
  '/api/bot/commands/:name',
  requireAuth,
  wrap(async (req, res) => {
    const name = req.params.name;
    if (!COMMANDS[name]) return res.status(404).json({ error: 'Unknown command' });
    const aliases = Array.isArray(req.body?.aliases) ? req.body.aliases.map((a) => String(a).toLowerCase().trim()).filter(Boolean) : [];
    const used = new Set(Object.keys(COMMANDS));
    for (const [n, cc] of Object.entries(req.bot.config.commands)) if (n !== name) cc.aliases.forEach((a) => used.add(a));
    for (const a of aliases) {
      if (!COMMAND_NAME_RE.test(a)) return res.status(400).json({ error: `"${a}" is not a valid name. Use lowercase letters, numbers, dashes or underscores.` });
      if (used.has(a)) return res.status(400).json({ error: `"${a}" is already used by another command.` });
    }
    const previous = req.bot.config;
    req.bot.config = normalizeConfig({ ...previous, commands: { ...previous.commands, [name]: { ...req.body, aliases } } });
    db.save();
    getInstance(req.user.id).applyConfig(previous).catch((e) => getInstance(req.user.id).error('Apply config', e));
    res.json(botPayload(req));
  })
);

// ---------- Modules ----------

app.post(
  '/api/bot/modules/:id/:action',
  requireAuth,
  wrap(async (req, res) => {
    const { id, action } = req.params;
    const mod = MODULES.find((m) => m.id === id);
    if (!mod) return res.status(404).json({ error: 'Unknown module' });
    const previous = req.bot.config;
    const next = structuredClone(previous);
    if (action === 'install') next.modules[id] = { ...next.modules[id], installed: true, enabled: true };
    else if (action === 'uninstall') {
      if (mod.required) return res.status(400).json({ error: 'Core cannot be removed.' });
      next.modules[id] = { ...next.modules[id], installed: false, enabled: false };
    } else if (action === 'reset') {
      next.modules[id] = { ...defaultModuleState(id, true), installed: next.modules[id].installed, enabled: next.modules[id].enabled };
      for (const [name, def] of Object.entries(COMMANDS)) if (def.module === id) next.commands[name] = defaultCommandState(name);
      if (id === 'welcome') {
        const fresh = normalizeConfig({});
        next.welcome = fresh.welcome;
        next.goodbye = fresh.goodbye;
      }
    } else return res.status(400).json({ error: 'Unknown action' });
    req.bot.config = normalizeConfig(next);
    db.save();
    getInstance(req.user.id).log('info', `Module ${mod.name}: ${action}`);
    getInstance(req.user.id).applyConfig(previous).catch((e) => getInstance(req.user.id).error('Apply config', e));
    res.json(botPayload(req));
  })
);

// ---------- Import / export ----------

app.get('/api/bot/export', requireAuth, (req, res) => {
  const { guildId, staffRoleIds, ...portable } = req.bot.config;
  res.setHeader('Content-Disposition', 'attachment; filename="civlink-bot-config.json"');
  res.json({ format: 'civlink-config', version: 1, exportedAt: new Date().toISOString(), config: { ...portable, guildId, staffRoleIds } });
});

app.post(
  '/api/bot/import',
  requireAuth,
  wrap(async (req, res) => {
    const file = req.body;
    if (file?.format !== 'civlink-config' || !file.config) return res.status(400).json({ error: 'That file is not a CivLink config export.' });
    const previous = req.bot.config;
    req.bot.config = normalizeConfig({ ...file.config, guildId: previous.guildId });
    db.save();
    getInstance(req.user.id).applyConfig(previous).catch((e) => getInstance(req.user.id).error('Apply config', e));
    res.json(botPayload(req));
  })
);

// ---------- Static (production) ----------

const dist = path.resolve(process.cwd(), 'dist');
if (IS_PROD && fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api|auth).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error('[civlink]', err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/auth')) return res.redirect('/?login=failed');
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`[civlink] API listening on http://localhost:${PORT}`);
  console.log(`[civlink] Discord redirect URI: ${REDIRECT_URI}`);
  autoStartAll();
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    db.flush();
    process.exit(0);
  });
}
