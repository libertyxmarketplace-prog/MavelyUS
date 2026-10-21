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


// Workspace settings storage for the website. The records and data files keep their old
// "bot instance" names so settings saved before the Discord bot was removed still load.
// Id of the old shared record; kept so lookups can prefer a server's own record over it.
export const PRIMARY_BOT_ID = "LC-74921";
export const MASTER_BOT_ID = PRIMARY_BOT_ID;

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
 * Create a new workspace settings record
 */
export function createBotInstance(ownerUserId, options = {}) {
  const instances = loadBotInstances();
  const botId = options.botId || generateBotId();

  instances[botId] = {
    botId,
    ownerUserId: ownerUserId || 'UNASSIGNED',
    erlcApiKey: options.erlcApiKey || '',
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

/**
 * Fetch a record by its id (case-insensitive) or owner user id
 */
export function getBotInstance(botId) {
  if (!botId) return null;
  const cleanId = String(botId).replace(/[<@!&>]/g, '').trim();
  const instances = loadBotInstances();
  if (instances[cleanId]) return instances[cleanId];

  // Also check case-insensitively or by owner user id
  for (const [id, b] of Object.entries(instances)) {
    if (id.toLowerCase() === cleanId.toLowerCase()) return b;
    if (b.ownerUserId === cleanId) return b;
  }
  return null;
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
      erlcApiKey: '',
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
      erlcApiKey: '',
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
 * Get all bot instances as a list
 */
export function listBots() {
  const instances = loadBotInstances();
  return Object.values(instances);
}
