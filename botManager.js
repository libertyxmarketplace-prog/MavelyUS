import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const INSTANCES_FILE = path.join(DATA_DIR, 'bot_instances.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

import dotenv from 'dotenv';
dotenv.config();

export const PRIMARY_BOT_ID = "LC-74921";
export const MASTER_BOT_ID = PRIMARY_BOT_ID;
export const MASTER_TOKEN = process.env.DISCORD_TOKEN || "";

export const DEFAULT_CUSTOMIZATIONS = {
  // ─── Ticket ────────────────────────────────────────────────────────────────
  panelTitle: "Support",
  panelDescription:
    "> If you require support, we ask you to **open a ticket and our team will be ready to help**. Choose the category that matches your issue below and a private channel will be opened for you. Any trolling or rule violations will result in instant moderation towards your account.",
  rulesTitle: "TICKET CENTER",
  rulesDescription:
    "> Need help, want to report an issue, or have a question for our team? Select the ticket option that best matches your situation.\n" +
    "> Before opening a ticket, please read the information below carefully.\n\n" +
    "### TICKET GUIDELINES\n" +
    "> • Only open a ticket when you have a legitimate reason for doing so.\n" +
    "> • Please do not spam, troll, or intentionally misuse the ticket system.\n" +
    "> • Be respectful when speaking with our staff team. Disrespect, arguing, or unnecessary behavior may result in moderation action.\n\n" +
    "### RESPONSE REQUIREMENTS\n" +
    "> • Please respond to your ticket within 24 hours. Tickets with no response may be closed.\n" +
    "> • Provide clear and accurate information so our team can assist you properly.",
  topBannerUrl: "",
  bottomBannerUrl: "",
  ticketInsideBannerUrl: "",    // Header banner inside ticket channels
  ticketOpenMessage: "",        // Custom welcome/instructions inside opened tickets
  // Ticket categories (up to 5 customizable slots without emojis)
  ticketCategories: [
    { id: "cat_1", name: "General Support", spawnCategoryId: "", pingRoleId: "" },
    { id: "cat_2", name: "High Rank", spawnCategoryId: "", pingRoleId: "" },
    { id: "cat_3", name: "Player Report", spawnCategoryId: "", pingRoleId: "" },
    { id: "cat_4", name: "Appeals", spawnCategoryId: "", pingRoleId: "" },
    { id: "cat_5", name: "Other", spawnCategoryId: "", pingRoleId: "" }
  ],
  ticketPingRoleId: "",         // Default fallback role to ping when ticket opens
  ticketClaimRoleId: "",        // Specific role allowed to claim tickets
  transcriptsChannelId: "",
  ticketCategoryId: "",         // Default fallback Discord category where ticket channels spawn
  showRulesButton: true,        // Toggle ticket rules button visibility
  rulesButtonLabel: "Server Guidelines",
  rulesButtonStyle: 2,          // 1: Primary, 2: Secondary, 3: Success, 4: Danger

  // ─── Sessions / ER:LC ─────────────────────────────────────────────────────
  sessionTopBannerUrl: "",
  sessionShutdownBannerUrl: "",
  sessionBottomBannerUrl: "",
  sessionVoteTopBannerUrl: "",
  sessionVoteBottomBannerUrl: "",
  sessionChannelId: "",
  ingameVcId: "",
  queueVcId: "",
  notificationRoleId: "",
  hostRoleId: "",               // Role allowed to start/stop sessions
  sessionStartTitle: "SESSION STARTING",
  sessionStartDesc: "The session vote has succeeded and staff has officially started the patrol. Join up in-game now!",
  sessionShutdownTitle: "SESSION CONCLUDED",
  sessionShutdownDesc: "The session has concluded. Thank you to everyone who joined our patrol!",

  // ─── Branding & Graphics ──────────────────────────────────────────────────
  appTopBannerUrl: "",
  appBottomBannerUrl: "",
  infractBannerUrl: "",
  infractionBottomBannerUrl: "",
  promoteBannerUrl: "",
  promotionBottomBannerUrl: "",
  staffDocsTopBannerUrl: "",
  staffDocsBottomBannerUrl: "",
  deptBannerUrl: "",
  regulationsBannerUrl: "",
  regulationsChannelId: "",
  welcomeBannerUrl: "",

  // ─── Staff Panels & Docs ───────────────────────────────────────────────────
  infractionStaffRoleId: "",    // Staff role authorized to issue infractions
  infractRemoveRoleId: "",      // Role removed when infraction issued
  infractGiveRoleId: "",        // Role given when infraction issued
  promotionStaffRoleId: "",     // Staff role authorized to issue promotions
  promotionGiveRoleId: "",      // Role assigned on promotion
  appDescription:
    "> Welcome to the official Staff Application portal.\n" +
    "> Holding a staff position is a privilege that requires consistent activity, professionalism, and accountability.",
  appTitle: "Staff Application",
  appQuizIntroText: "Welcome to the in-game quiz! Answer all questions honestly. Your response will be reviewed by management.",
  ingameQuestions: "",
  discordQuestions: "",
  staffDocsTitle: "Official Staff Documentation",
  staffDocsDescription: "Welcome to the official Staff Documentation directory. Review operational policies below.",
  staffDocsLayout: "select",   // "select" | "buttons"

  // ─── Welcome System ────────────────────────────────────────────────────────
  welcomeEnabled: false,
  welcomeChannelId: "",
  welcomeText: "Welcome to the server, {user}! We're glad to have you here. Please read the rules and enjoy your stay.",

  // ─── Community & Applications ─────────────────────────────────────────────
  serverName: "",
  reviewChannelId: "",
  resultsChannelId: "",

  // ─── Panel Channels ────────────────────────────────────────────────────────
  promotionsChannelId: "",
  infractionsChannelId: "",
  deptChannelId: "",
  staffDocsChannelId: "",

  // ─── Staff Roles & Permissions ─────────────────────────────────────────────
  botStaffRoleId: "",           // Authorized bot staff role required to execute customer bot staff commands
  adminRoleId: "",              // Administrator staff role
  staffRoleIds: [],

  // ─── New Community Modules ─────────────────────────────────────────────────
  quotaRequirement: "100",      // Weekly message quota target
  quotaChannelId: "",           // Quota updates channel
  forumChannelId: "",           // Forums channel
  dailyQuestionsChannelId: "",  // Daily questions channel
  dailyQuestionsTime: "12:00 PM", // Daily questions schedule time

  // ─── AI ────────────────────────────────────────────────────────────────────
  aiProvider: "openrouter",
  aiModel: "openai/gpt-4o-mini",
  aiApiKey: "",
  aiSystemInstructions: "",

  // ─── Bot Presence ──────────────────────────────────────────────────────────
  botActivityText: "" // Custom activity status text (replaces default 'ER:LC')
};


import { botDb } from './botDatabase.js';

/**
 * Load all bot instances (cached in-memory for instant 0ms access)
 */
export function loadBotInstances(forceReload = false) {
  if (forceReload) {
    botDb.init();
  }
  return botDb.getAll();
}

/**
 * Save all bot instances to disk and update memory cache with atomic persistence
 */
export function saveBotInstances(instances) {
  for (const [id, data] of Object.entries(instances)) {
    botDb.cache.set(id, data);
  }
  botDb.save();
}

/**
 * Generate a unique identification number for each bot (e.g. BOT-4821)
 */
export function generateBotId() {
  const instances = loadBotInstances();
  let botId = '';
  do {
    const num = Math.floor(10000 + Math.random() * 90000);
    botId = `LC-${num}`;
  } while (instances[botId]);
  return botId;
}

/**
 * Create a new customer bot instance
 */
export function createBotInstance(ownerUserId, options = {}) {
  const instances = loadBotInstances();
  const botId = options.botId || generateBotId();

  instances[botId] = {
    botId,
    ownerUserId: ownerUserId || 'UNASSIGNED',
    token: options.token || '',
    erlcApiKey: options.erlcApiKey || '',
    aiApiKey: options.aiApiKey || '',
    aiProvider: options.aiProvider || 'openai',
    status: (options.token && options.token.trim().length > 0) ? 'active' : 'unconfigured',
    setupCompleted: Boolean(options.token && options.token.trim().length > 0),
    banned: false,
    bannedReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    guildId: options.guildId || null,
    customizations: {
      ...DEFAULT_CUSTOMIZATIONS,
      ...(options.customizations || {})
    }
  };

  saveBotInstances(instances);
  return instances[botId];
}

let onBotBannedCallback = null;
export function setOnBotBanned(cb) {
  onBotBannedCallback = cb;
}

let onBotUnbannedCallback = null;
export function setOnBotUnbanned(cb) {
  onBotUnbannedCallback = cb;
}

/**
 * Fetch a bot instance by its Bot ID or linked Discord ID / Owner ID
 */
export function getBotInstance(botId) {
  if (!botId) return null;
  const cleanId = String(botId).replace(/[<@!&>]/g, '').trim();
  const instances = loadBotInstances();
  if (instances[cleanId]) return instances[cleanId];

  // Also check case-insensitively or via discordBotId / ownerUserId / token client ID
  for (const [id, b] of Object.entries(instances)) {
    if (id.toLowerCase() === cleanId.toLowerCase()) return b;
    if (b.discordBotId === cleanId || b.ownerUserId === cleanId || b.clientId === cleanId) return b;
    if (b.token) {
      try {
        const rawId = Buffer.from(b.token.split('.')[0], 'base64').toString('utf-8');
        if (rawId === cleanId) return b;
      } catch {}
    }
  }
  return null;
}

/**
 * Find bot instance associated with a Guild ID or user ID
 */
export function getBotInstanceForGuild(guildId, ownerUserId = null) {
  const instances = loadBotInstances();
  // 1. Exact match by owner AND guild first
  if (guildId && ownerUserId) {
    for (const bot of Object.values(instances)) {
      if (bot.ownerUserId === ownerUserId && bot.guildId === guildId && !bot.banned) return bot;
    }
  }
  // 2. Exact match by guild
  if (guildId) {
    for (const bot of Object.values(instances)) {
      if (bot.guildId === guildId && bot.botId !== MASTER_BOT_ID && !bot.banned) return bot;
    }
  }
  // 3. Match by owner
  if (ownerUserId) {
    for (const bot of Object.values(instances)) {
      if (bot.ownerUserId === ownerUserId && bot.botId !== MASTER_BOT_ID && !bot.banned) return bot;
    }
  }
  // 4. Fallback to Master
  return instances[MASTER_BOT_ID] || null;
}

/**
 * Get or create a dedicated bot instance for a user
 */
export function getOrCreateBotInstanceForUser(ownerUserId, guildId = null) {
  const instances = loadBotInstances();
  
  // 1. If guildId is provided, first look for an existing bot already assigned to this guild with completed setup
  if (guildId) {
    for (const bot of Object.values(instances)) {
      if (bot.guildId === guildId && bot.botId !== MASTER_BOT_ID && !bot.banned && bot.token && bot.erlcApiKey && bot.erlcApiKey.length > 5) {
        if (ownerUserId && (!bot.ownerUserId || bot.ownerUserId === 'UNASSIGNED')) {
          bot.ownerUserId = ownerUserId;
          saveBotInstances(instances);
        }
        return bot;
      }
    }
    for (const bot of Object.values(instances)) {
      if (bot.guildId === guildId && bot.botId !== MASTER_BOT_ID && !bot.banned) {
        if (ownerUserId && (!bot.ownerUserId || bot.ownerUserId === 'UNASSIGNED')) {
          bot.ownerUserId = ownerUserId;
          saveBotInstances(instances);
        }
        return bot;
      }
    }
  }

  if (ownerUserId) {
    if (guildId) {
      for (const bot of Object.values(instances)) {
        if (bot.ownerUserId === ownerUserId && bot.guildId === guildId && !bot.banned && bot.token && bot.erlcApiKey) {
          return bot;
        }
      }
      for (const bot of Object.values(instances)) {
        if (bot.ownerUserId === ownerUserId && bot.guildId === guildId && !bot.banned) {
          return bot;
        }
      }
    }
    for (const bot of Object.values(instances)) {
      if (bot.ownerUserId === ownerUserId && !bot.banned && bot.token && bot.erlcApiKey) {
        if (guildId && !bot.guildId) {
          bot.guildId = guildId;
          saveBotInstances(instances);
        }
        return bot;
      }
    }
    for (const bot of Object.values(instances)) {
      if (bot.ownerUserId === ownerUserId && !bot.banned) {
        if (guildId && !bot.guildId) {
          bot.guildId = guildId;
          saveBotInstances(instances);
        }
        return bot;
      }
    }
    for (const bot of Object.values(instances)) {
      if (bot.ownerUserId === ownerUserId) {
        if (guildId && !bot.guildId) {
          bot.guildId = guildId;
          saveBotInstances(instances);
        }
        return bot;
      }
    }
  }

  // 2. If no owner specified and guild has a master instance, use it as fallback
  if (!ownerUserId && guildId && instances[PRIMARY_BOT_ID] && !instances[PRIMARY_BOT_ID].banned) {
    return instances[PRIMARY_BOT_ID];
  }

  return createBotInstance(ownerUserId, { guildId });
}

/**
 * Update an existing bot instance
 */
export function updateBotInstance(botId, updates) {
  const instances = loadBotInstances();
  const bot = getBotInstance(botId);
  const actualId = bot ? bot.botId : botId;
  if (!instances[actualId]) {
    instances[actualId] = {
      botId: actualId,
      ownerUserId: 'UNASSIGNED',
      token: '',
      erlcApiKey: '',
      aiApiKey: '',
      aiProvider: 'openai',
      status: 'unconfigured',
      setupCompleted: false,
      banned: false,
      bannedReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customizations: { ...DEFAULT_CUSTOMIZATIONS }
    };
  }

  instances[actualId] = {
    ...instances[actualId],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Re-check setup completion
  if (instances[actualId].token && instances[actualId].token.trim().length > 0) {
    instances[actualId].setupCompleted = true;
    if (instances[actualId].status === 'unconfigured') {
      instances[actualId].status = 'active';
    }
  }

  // Preserve banned status if instance is banned
  if (instances[actualId].banned) {
    instances[actualId].status = 'banned';
  }

  saveBotInstances(instances);
  return instances[actualId];
}

/**
 * Update specific customization property for a bot
 */
export function updateBotCustomization(botId, key, value) {
  const instances = loadBotInstances();
  const bot = getBotInstance(botId);
  const actualId = bot ? bot.botId : botId;
  if (!instances[actualId]) {
    instances[actualId] = {
      botId: actualId,
      ownerUserId: 'UNASSIGNED',
      token: '',
      erlcApiKey: '',
      aiApiKey: '',
      aiProvider: 'openai',
      status: 'unconfigured',
      setupCompleted: false,
      banned: false,
      bannedReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customizations: { ...DEFAULT_CUSTOMIZATIONS }
    };
  }

  if (!instances[actualId].customizations) {
    instances[actualId].customizations = { ...DEFAULT_CUSTOMIZATIONS };
  }

  instances[actualId].customizations[key] = value;
  instances[actualId].updatedAt = new Date().toISOString();
  saveBotInstances(instances);
  return instances[actualId];
}

/**
 * Retrigger / restart a customer's bot instance
 */
export function retriggerBot(botId) {
  const instances = loadBotInstances();
  const bot = getBotInstance(botId);
  if (!bot) {
    return { success: false, message: `Bot ID '${botId}' not found.` };
  }
  const actualId = bot.botId;
  if (bot.banned) {
    return { success: false, message: `Cannot retrigger bot '${actualId}' because it is banned.` };
  }

  instances[actualId].status = 'active';
  instances[actualId].lastRetriggeredAt = new Date().toISOString();
  saveBotInstances(instances);

  return {
    success: true,
    message: `Bot '${actualId}' has been retriggered and refreshed successfully.`,
    bot: instances[actualId]
  };
}

/**
 * Ban a bot instance and shut down running processes
 */
export function banBot(botId, reason = 'Administrative action by owner') {
  const instances = loadBotInstances();
  const bot = getBotInstance(botId);
  if (!bot) {
    return { success: false, message: `Bot ID '${botId}' not found.` };
  }
  const actualId = bot.botId;
  if (actualId === MASTER_BOT_ID) {
    return { success: false, message: `The Master Bot cannot be banned.` };
  }

  instances[actualId].banned = true;
  instances[actualId].bannedReason = reason;
  instances[actualId].status = 'banned';
  instances[actualId].bannedAt = new Date().toISOString();
  saveBotInstances(instances);

  if (onBotBannedCallback) {
    try {
      onBotBannedCallback(actualId, reason);
    } catch (err) {
      console.error(`[banBot] Error executing onBotBannedCallback for ${actualId}:`, err);
    }
  }

  return { success: true, message: `Bot '${actualId}' has been banned and shut off. Reason: ${reason}`, bot: instances[actualId] };
}

/**
 * Unban a bot instance
 */
export function unbanBot(botId) {
  const instances = loadBotInstances();
  const bot = getBotInstance(botId);
  if (!bot) {
    return { success: false, message: `Bot ID '${botId}' not found.` };
  }
  const actualId = bot.botId;

  instances[actualId].banned = false;
  instances[actualId].bannedReason = null;
  instances[actualId].status = instances[actualId].setupCompleted ? 'active' : 'unconfigured';
  instances[actualId].unbannedAt = new Date().toISOString();
  saveBotInstances(instances);

  if (onBotUnbannedCallback) {
    try {
      onBotUnbannedCallback(actualId);
    } catch (err) {
      console.error(`[unbanBot] Error executing onBotUnbannedCallback for ${actualId}:`, err);
    }
  }

  return { success: true, message: `Bot '${actualId}' has been unbanned.`, bot: instances[actualId] };
}

/**
 * Get all bot instances as a list
 */
export function listBots() {
  const instances = loadBotInstances();
  return Object.values(instances);
}

/**
 * Resolves the bot instance associated with a Discord interaction
 * Works seamlessly across both Master Bot and Customer Bots.
 */
export function getBotForInteraction(interaction) {
  if (!interaction) return null;
  const instances = loadBotInstances();

  // 1. Direct botId attached to client
  if (interaction.client?.botId && instances[interaction.client.botId]) {
    return instances[interaction.client.botId];
  }

  // 2. Match by client application/user ID
  const clientId = interaction.client?.user?.id;
  if (clientId) {
    for (const b of Object.values(instances)) {
      if (b.botId === clientId || b.clientId === clientId) {
        return b;
      }
    }
  }

  // 3. Match by guild ID if bot was registered for guild
  if (interaction.guildId && instances[interaction.guildId]) {
    return instances[interaction.guildId];
  }

  // 4. Fallback to Master Bot instance
  return instances[MASTER_BOT_ID] || null;
}

