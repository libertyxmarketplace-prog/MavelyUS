import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  loadBotInstances,
  getBotInstance,
  saveBotInstances,
  createBotInstance,
  updateBotInstance,
  updateBotCustomization,
  generateBotId,
  MASTER_BOT_ID,
  PRIMARY_BOT_ID,
  DEFAULT_CUSTOMIZATIONS
} from './botManager.js';
import { botDb } from './botDatabase.js';
import { activeCustomerClients, startCustomerBot, stopCustomerBot } from './customerBotRunner.js';
import { deployCommands } from './deploy-commands.js';
import { CONFIG } from './config.js';
import { createDashboardRouter, createDiscordCallbackRouter } from './web/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// Railway and most hosts sit behind a proxy: needed for secure cookies and real client IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use('/api', createDashboardRouter());
app.use('/auth/discord', createDiscordCallbackRouter());

const startTime = Date.now();

// ─── HEALTH & ECOSYSTEM STATUS ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  const instances = loadBotInstances();
  const botList = Object.values(instances);
  const activeCount = activeCustomerClients.size;
  const mem = process.memoryUsage();

  res.json({
    activeClients: activeCount,
    totalInstances: botList.length,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    memoryUsageMB: Math.round(mem.rss / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    nodeVersion: process.version,
    masterBotId: MASTER_BOT_ID,
    primaryBotId: PRIMARY_BOT_ID
  });
});

// ─── LIST BOTS ─────────────────────────────────────────────────────────────
app.get('/api/bots', (req, res) => {
  try {
    const instances = loadBotInstances();
    const list = Object.values(instances).map(bot => {
      const isOnline = activeCustomerClients.has(bot.botId);
      let discordBotId = bot.discordBotId || null;
      if (!discordBotId && bot.token) {
        try {
          const raw = Buffer.from(bot.token.split('.')[0], 'base64').toString('utf-8');
          if (/^\d{17,20}$/.test(raw)) discordBotId = raw;
        } catch {}
      }

      return {
        botId: bot.botId,
        ownerUserId: bot.ownerUserId,
        serverName: bot.customizations?.serverName || 'Community Server',
        joinCode: bot.customizations?.joinCode || '',
        guildId: bot.guildId,
        discordBotId,
        isOnline,
        hasToken: Boolean(bot.token && bot.token.trim().length > 0),
        hasApiKey: Boolean(bot.erlcApiKey && bot.erlcApiKey.trim().length > 0),
        status: bot.banned ? 'suspended' : (isOnline ? 'online' : (bot.status || 'unconfigured')),
        updatedAt: bot.updatedAt || bot.createdAt
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET SINGLE BOT DETAILS & CUSTOMIZATIONS ────────────────────────────────
app.get('/api/bots/:id', (req, res) => {
  try {
    let botId = req.params.id;
    if (botId === 'primary' || botId === 'default') {
      botId = PRIMARY_BOT_ID;
    }

    let bot = getBotInstance(botId);
    if (!bot) {
      // If primary bot doesn't exist yet, initialize it
      const instances = loadBotInstances();
      if (botId === PRIMARY_BOT_ID) {
        bot = createBotInstance('OWNER', {
          botId: PRIMARY_BOT_ID,
          token: process.env.DISCORD_TOKEN || '',
          erlcApiKey: CONFIG.SESSION?.API_KEY || ''
        });
      } else {
        return res.status(404).json({ error: `Bot instance '${botId}' not found.` });
      }
    }

    const isOnline = activeCustomerClients.has(bot.botId);
    let discordBotId = bot.discordBotId || null;
    if (!discordBotId && bot.token) {
      try {
        const raw = Buffer.from(bot.token.split('.')[0], 'base64').toString('utf-8');
        if (/^\d{17,20}$/.test(raw)) discordBotId = raw;
      } catch {}
    }

    // Mask secrets for safety
    const maskedToken = bot.token && bot.token.length > 10
      ? `${bot.token.slice(0, 6)}...${bot.token.slice(-4)}`
      : (bot.token ? '******' : '');

    const maskedApiKey = bot.erlcApiKey && bot.erlcApiKey.length > 8
      ? `${bot.erlcApiKey.slice(0, 4)}...${bot.erlcApiKey.slice(-4)}`
      : (bot.erlcApiKey ? '******' : '');

    res.json({
      ...bot,
      token: bot.token || '',
      maskedToken,
      erlcApiKey: bot.erlcApiKey || '',
      maskedApiKey,
      isOnline,
      discordBotId,
      customizations: {
        ...DEFAULT_CUSTOMIZATIONS,
        ...(bot.customizations || {})
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE / ONBOARD NEW BOT INSTANCE ─────────────────────────────────────
app.post('/api/bots', (req, res) => {
  try {
    const {
      ownerUserId,
      token,
      erlcApiKey,
      guildId,
      serverName,
      joinCode,
      customizations
    } = req.body;

    const newBot = createBotInstance(ownerUserId || 'OWNER', {
      token: token || '',
      erlcApiKey: erlcApiKey || '',
      guildId: guildId || null,
      customizations: {
        serverName: serverName || 'Liberty County Community',
        joinCode: joinCode || '',
        ...(customizations || {})
      }
    });

    // If token provided, trigger start attempt
    if (newBot.token) {
      startCustomerBot(newBot.botId).catch(err => console.warn(`[API] Bot ${newBot.botId} start error:`, err.message));
    }

    res.status(201).json(newBot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE BOT CUSTOMIZATIONS (ALL 8 /CONFIG PAGES) ────────────────────────
app.put('/api/bots/:id/customizations', (req, res) => {
  try {
    const botId = req.params.id;
    const bot = getBotInstance(botId);
    if (!bot) {
      return res.status(404).json({ error: `Bot instance '${botId}' not found.` });
    }

    const {
      token,
      erlcApiKey,
      guildId,
      ownerUserId,
      customizations
    } = req.body;

    let modified = false;

    if (token !== undefined && token !== bot.token) {
      bot.token = token.trim();
      bot.status = bot.token ? 'active' : 'unconfigured';
      bot.setupCompleted = Boolean(bot.token);
      modified = true;
    }

    if (erlcApiKey !== undefined && erlcApiKey !== bot.erlcApiKey) {
      bot.erlcApiKey = erlcApiKey.trim();
      modified = true;
    }

    if (guildId !== undefined) {
      bot.guildId = guildId;
      modified = true;
    }

    if (ownerUserId !== undefined) {
      bot.ownerUserId = ownerUserId;
      modified = true;
    }

    if (customizations && typeof customizations === 'object') {
      bot.customizations = {
        ...DEFAULT_CUSTOMIZATIONS,
        ...(bot.customizations || {}),
        ...customizations
      };
      modified = true;
    }

    if (modified) {
      bot.updatedAt = new Date().toISOString();
      const instances = loadBotInstances();
      instances[bot.botId] = bot;
      saveBotInstances(instances);
    }

    res.json({
      success: true,
      message: 'Bot customizations updated successfully.',
      bot
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEST DISCORD BOT TOKEN ─────────────────────────────────────────────────
app.post('/api/test/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const cleanToken = token.trim().replace(/^Bot\s+/i, '');
    const discordRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bot ${cleanToken}`
      }
    });

    if (!discordRes.ok) {
      const errBody = await discordRes.json().catch(() => ({}));
      return res.status(200).json({
        valid: false,
        status: discordRes.status,
        error: errBody.message || 'Invalid Discord Bot Token'
      });
    }

    const data = await discordRes.json();
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(data.id) % 5}.png`;

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${data.id}&permissions=8&scope=bot%20applications.commands`;

    res.json({
      valid: true,
      user: {
        id: data.id,
        username: data.username,
        discriminator: data.discriminator,
        globalName: data.global_name,
        avatarUrl,
        bot: data.bot,
        inviteUrl
      }
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ─── TEST ER:LC API KEY ────────────────────────────────────────────────────
app.post('/api/test/erlc', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ valid: false, error: 'ER:LC API Key is required' });
    }

    const cleanKey = apiKey.trim();
    const erlcRes = await fetch('https://api.erlc.gg/v1/server', {
      headers: {
        'Server-Key': cleanKey,
        'Accept': 'application/json'
      }
    });

    if (!erlcRes.ok) {
      const errText = await erlcRes.text().catch(() => 'Connection failed');
      return res.status(200).json({
        valid: false,
        status: erlcRes.status,
        error: `ER:LC API returned status ${erlcRes.status}: ${errText}`
      });
    }

    const serverData = await erlcRes.json();
    res.json({
      valid: true,
      server: {
        name: serverData.Name || 'ER:LC Private Server',
        joinKey: serverData.JoinKey || serverData.JoinCode || '',
        ownerId: serverData.OwnerId || '',
        currentPlayers: serverData.CurrentPlayers ?? serverData.Players ?? 0,
        maxPlayers: serverData.MaxPlayers ?? 32,
        queuePlayers: serverData.QueuePlayers ?? 0,
        raw: serverData
      }
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ─── DISCORD OAUTH CALLBACK ────────────────────────────────────
app.post('/api/discord/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // No OAuth app configured - return a demo profile for local dev
      console.warn('[OAuth] DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET not set, returning demo profile.');
      return res.json({
        id: '1548112626389618718',
        name: 'Server Administrator',
        username: 'admin_libertyx',
        discriminator: '0000',
        email: 'admin@libertyx.gg',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png'
      });
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || `http://localhost:3001/auth/discord/callback`
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      return res.status(400).json({ error: err.error_description || 'Failed to exchange Discord code' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch Discord user profile' });
    }

    const userData = await userRes.json();
    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(userData.discriminator || 0) % 5}.png`;

    res.json({
      id: userData.id,
      name: userData.global_name || userData.username,
      username: userData.username,
      discriminator: userData.discriminator,
      email: userData.email || '',
      avatarUrl
    });
  } catch (err) {
    console.error('[OAuth] Callback error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current Discord user (for sessions where token is stored in cookie/session)
app.get('/api/discord/me', (req, res) => {
  res.status(401).json({ error: 'Not authenticated' });
});

// ─── BOT ACTION (RESTART / DEPLOY COMMANDS) ──────────────────────────────────
app.post('/api/bots/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const botId = req.params.id;
    const bot = getBotInstance(botId);

    if (!bot) {
      return res.status(404).json({ error: `Bot '${botId}' not found.` });
    }

    if (action === 'restart') {
      await stopCustomerBot(botId);
      if (bot.token) {
        await startCustomerBot(botId);
      }
      return res.json({ success: true, message: `Bot ${botId} restarted successfully.` });
    }

    if (action === 'deploy') {
      if (!bot.token) {
        return res.status(400).json({ error: 'Cannot deploy commands: Bot has no token configured.' });
      }
      const deployResult = await deployCommands(bot.token, bot.guildId);
      return res.json({ success: true, message: 'Slash commands deployed successfully.', result: deployResult });
    }

    res.status(400).json({ error: `Unknown action: '${action}'` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SERVE FRONTEND STATIC FILES IN PRODUCTION ──────────────────────────────
const candidatePaths = [
  path.join(__dirname, 'WEBSITE', 'artifacts', 'testaa-preview', 'dist', 'public'),
  path.join(__dirname, 'zip-repl-1', 'artifacts', 'testaa-preview', 'dist', 'public'),
  path.join(__dirname, 'web', 'dist')
];

const webDistPath = candidatePaths.find(p => fs.existsSync(p));
console.log('[LIBERTX WEB] Serving frontend from:', webDistPath || 'NOT FOUND');

if (webDistPath) {
  app.use(express.static(webDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(webDistPath, 'index.html'));
    }
    next();
  });
}

// Last line of defence: any thrown error becomes a clean response, never a crash.
app.use((err, req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  console.error('[LIBERTX WEB API] Unhandled route error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

const server = app.listen(PORT, () => {
  console.log(`[LIBERTX WEB API] Dashboard backend listening on http://localhost:${PORT}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[LIBERTX WEB API] Port ${PORT} is already in use by another instance. Web dashboard active on previous instance.`);
  } else {
    console.error('[LIBERTX WEB API] Server error:', err);
  }
});

export default app;
