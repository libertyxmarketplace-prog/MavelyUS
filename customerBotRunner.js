import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType
} from 'discord.js';
import { loadBotInstances, getBotInstance, updateBotInstance, setOnBotBanned, setOnBotUnbanned, MASTER_BOT_ID } from './botManager.js';
import { deployCommands, customerCommands } from './deploy-commands.js';

// Map of active running clients: botId -> Client
export const activeCustomerClients = new Map();

// Deduplication set for welcome messages (guildId_memberId -> timestamp)
const recentlyWelcomed = new Set();

let interactionHandler = null;
let messageHandler = null;

// Immediately enforce ban actions across customer bot clients
setOnBotBanned(async (botId) => {
  console.log(`[CUSTOMER BOT] Administrative ban received for ${botId}. Disconnecting and destroying client...`);
  await stopCustomerBot(botId);
});

setOnBotUnbanned(async (botId) => {
  const bot = getBotInstance(botId);
  if (bot?.token && bot.token.trim() !== '' && bot.setupCompleted && !bot.banned) {
    console.log(`[CUSTOMER BOT] Bot ${botId} unbanned. Re-establishing connection...`);
    await startCustomerBot(botId).catch(err => {
      console.warn(`[CUSTOMER BOT] Error reconnecting unbanned bot ${botId}:`, err.message);
    });
  }
});

/**
 * Register the main interaction handler function to be shared across customer bots
 */
export function setInteractionHandler(handler) {
  interactionHandler = handler;
}

/**
 * Register the main message handler function to be shared across customer bots for prefix commands
 */
export function setMessageHandler(handler) {
  messageHandler = handler;
}

function createCustomerClient(bot, intents) {
  const botId = bot.botId;
  const freshBot = getBotInstance(bot.botId) || bot;
  const freshCust = freshBot.customizations || {};
  const defaultPromo = freshCust.serverName
    ? `${freshCust.serverName} | Code: ${freshCust.joinCode || 'Join'}`
    : 'Our Community';
  const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;

  const customerClient = new Client({
    intents,
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
    presence: {
      status: 'online',
      activities: [{ name: actName, type: ActivityType.Watching }]
    }
  });
  customerClient.botId = botId;

    customerClient.once(Events.ClientReady, async () => {
      console.log(`=============================================`);
      console.log(`[CUSTOMER BOT ONLINE] Bot ID ${bot.botId} logged in as ${customerClient.user.tag} (${customerClient.user.id})`);
      console.log(`=============================================`);

      updateBotInstance(bot.botId, {
        discordBotId: customerClient.user.id,
        discordTag: customerClient.user.tag
      });

      try {
        const freshBot = getBotInstance(bot.botId) || bot;
        const freshCust = freshBot.customizations || {};
        const defaultPromo = freshCust.serverName
          ? `${freshCust.serverName} | Code: ${freshCust.joinCode || 'Join'}`
          : 'Our Community';
        const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;
        customerClient.user.setPresence({
          activities: [{ name: actName, type: ActivityType.Watching }],
          status: 'online'
        });
      } catch {}

      // Register directly to every guild the bot is in for instant availability (clearing global to avoid duplicates)
      for (const guild of customerClient.guilds.cache.values()) {
        try {
          await deployCommands(bot.token, customerClient.user.id, guild.id, false);
          console.log(`[CUSTOMER BOT] Commands deployed for ${customerClient.user.tag} in ${guild.name} (${guild.id})`);
        } catch (depErr) {
          console.warn(`[CUSTOMER BOT] Could not deploy commands in ${guild.name}:`, depErr.message);
        }
      }
    });

    // Deploy commands if added to a new guild while online
    customerClient.on(Events.GuildCreate, async guild => {
      console.log(`[CUSTOMER BOT] ${customerClient.user.tag} joined guild: ${guild.name} (${guild.id})`);
      try {
        await deployCommands(bot.token, customerClient.user.id, guild.id, false);
      } catch (err) {
        console.warn(`[CUSTOMER BOT] Guild join command deploy failed:`, err.message);
      }
    });

    // Automated self-healing reconnect listeners
    customerClient.on(Events.ShardDisconnect, async (closeEvent, shardId) => {
      console.warn(`[CUSTOMER BOT ${botId}] Shard ${shardId} disconnected (code: ${closeEvent?.code}). Initiating auto-reconnect...`);
      scheduleBotReconnect(botId, 3000);
    });

    customerClient.on(Events.ShardError, (error, shardId) => {
      console.warn(`[CUSTOMER BOT ${botId}] Shard ${shardId} network error:`, error?.message);
    });

    customerClient.on(Events.ShardResume, (shardId, replayedEvents) => {
      console.log(`[CUSTOMER BOT ${botId}] Shard ${shardId} connection resumed (${replayedEvents} events replayed).`);
    });

    customerClient.on(Events.Error, err => {
      if (err.code === 10062 || err.code === 40060) return;
      console.warn(`[CUSTOMER BOT ${botId}] Error:`, err.message);
      if (!customerClient.ws || customerClient.ws.status === 5) {
        scheduleBotReconnect(botId, 4000);
      }
    });

    // Send Welcome Message when a new member joins on customer bot's server
    customerClient.on(Events.GuildMemberAdd, async member => {
      try {
        const currentBot = getBotInstance(botId);
        if (!currentBot || currentBot.banned) return;
        const cust = currentBot?.customizations;
        if (!cust?.welcomeEnabled || !cust?.welcomeChannelId) return;

        const guild = member.guild;
        const dedupeKey = `${guild.id}_${member.id}`;
        if (recentlyWelcomed.has(dedupeKey)) return;
        recentlyWelcomed.add(dedupeKey);
        setTimeout(() => recentlyWelcomed.delete(dedupeKey), 60000);

        const channel = guild.channels.cache.get(cust.welcomeChannelId) ||
          await guild.channels.fetch(cust.welcomeChannelId).catch(() => null);

        if (!channel || !channel.isTextBased()) return;

        const serverName = cust.serverName || guild.name || 'our community';
        const welcomeTemplate = cust.welcomeText || "Welcome to {server}, {user}! Please check the rules and enjoy your stay.";
        const memberCount = (guild.memberCount || 1).toLocaleString();

        const formattedMsg = welcomeTemplate
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user?.username || '')
          .replace(/{server}/g, serverName)
          .replace(/{count}/g, memberCount);

        const containerComponents = [];
        if (cust.welcomeBannerUrl && cust.welcomeBannerUrl.trim() !== '') {
          containerComponents.push({
            type: 12,
            items: [{ media: { url: cust.welcomeBannerUrl.trim() } }]
          });
        }

        containerComponents.push({
          type: 10,
          content: [
            `# Welcome to ${serverName}`,
            `> ${formattedMsg}`,
            ``,
            `*You are member **#${memberCount}**.*`
          ].join('\n')
        });

        // Pill with member count
        containerComponents.push({
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              label: `${memberCount} Members`,
              disabled: true,
              custom_id: 'welcome_member_count_pill'
            }
          ]
        });

        await channel.send({
          flags: 32768,
          components: [
            {
              type: 17,
              components: containerComponents
            }
          ]
        });
        console.log(`[CUSTOMER BOT ${botId}] Sent welcome card for ${member.user.tag} in #${channel.name}`);
      } catch (wErr) {
        console.warn(`[CUSTOMER BOT ${botId}] Welcome send error:`, wErr.message);
      }
    });

    // Handle slash commands, buttons, and modals for this customer bot
    customerClient.on(Events.InteractionCreate, async interaction => {
      try {
        const MASTER_CMDS = ['banbot', 'createbot', 'unbanbot', 'listbots'];
        if (interaction.isChatInputCommand() && MASTER_CMDS.includes(interaction.commandName)) {
          if (interaction.isRepliable()) {
            return interaction.reply({
              content: `<:xmark:1552901454098989056> \`/${interaction.commandName}\` is an administrative command for the central system.`,
              flags: 64
            }).catch(() => null);
          }
          return;
        }

        const currentBot = getBotInstance(botId);
        if (!currentBot || currentBot.banned) {
          console.warn(`[CUSTOMER BOT ${botId}] Blocked interaction on banned bot instance.`);
          await stopCustomerBot(botId);
          if (interaction.isRepliable()) {
            return interaction.reply({
              content: `<:xmark:1552901454098989056> **Bot Instance Suspended**\n> This bot instance (\`${botId}\`) has been suspended by administration.\n> **Reason:** \`${currentBot?.bannedReason || 'Violation of service terms'}\``,
              flags: 64
            }).catch(() => null);
          }
          return;
        }

        if (interactionHandler) {
          await interactionHandler(interaction);
        }
      } catch (err) {
        if (err.code === 10062 || err.code === 40060) return;
        console.error(`[CUSTOMER BOT ${botId}] Interaction error:`, err);
      }
    });

    // Handle prefix commands for this customer bot
    customerClient.on(Events.MessageCreate, async message => {
      try {
        const currentBot = getBotInstance(botId);
        if (!currentBot || currentBot.banned) {
          await stopCustomerBot(botId);
          return;
        }

        if (messageHandler) {
          await messageHandler(message);
        }
      } catch (err) {
        console.error(`[CUSTOMER BOT ${botId}] Message error:`, err);
      }
    });

  return customerClient;
}

export async function startCustomerBot(botId) {
  if (botId === MASTER_BOT_ID) return false;
  const bot = getBotInstance(botId);
  if (!bot || !bot.token || bot.token.trim() === '' || bot.banned) {
    if (bot?.banned && activeCustomerClients.has(botId)) {
      await stopCustomerBot(botId);
    }
    return false;
  }

  // If already running, clean up old client first
  if (activeCustomerClients.has(botId)) {
    await stopCustomerBot(botId);
  }

  // ── Duplicate-token guard ───────────────────────────────────────────────
  // Two instances pointing at the same Discord token would each open their own
  // gateway connection for one account, and they would keep kicking each other
  // offline  - which reads as "the bot randomly turned off". Instead of fighting,
  // the second instance shares the live client owned by the first.
  const tokenKey = bot.token.trim();
  for (const [otherBotId, otherClient] of activeCustomerClients) {
    if (otherBotId === bot.botId) continue;
    const other = getBotInstance(otherBotId);
    if (!other || !other.token || other.token.trim() !== tokenKey) continue;
    if (!otherClient || !otherClient.isReady()) continue;

    console.warn(`[CUSTOMER BOT] ${bot.botId} and ${otherBotId} use the same Discord token  - sharing the live connection instead of opening a second one.`);
    // Mark the client so stopCustomerBot knows the connection is shared and
    // must only be destroyed once every borrower has released it.
    if (!otherClient.__tokenOwners) otherClient.__tokenOwners = new Set([otherBotId]);
    otherClient.__tokenOwners.add(bot.botId);
    activeCustomerClients.set(bot.botId, otherClient);

    updateBotInstance(bot.botId, {
      discordBotId: otherClient.user?.id || bot.discordBotId || null,
      discordTag: otherClient.user?.tag || bot.discordTag || null,
      status: 'active',
      invalidTokenDetectedAt: null,
      setupCompleted: true
    });
    return true;
  }

  const fullIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers
  ];

  const standardIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers
  ];

  async function connectClient(intents) {
    const client = createCustomerClient(bot, intents);
    let timer = null;
    try {
      const readyPromise = new Promise((resolve) => {
        if (client.isReady()) {
          return resolve(client);
        }
        timer = setTimeout(() => {
          resolve(client);
        }, 8000);

        client.once(Events.ClientReady, () => {
          clearTimeout(timer);
          resolve(client);
        });
      });

      const cleanToken = bot.token.replace(/^["']|["']$/g, '').replace(/^Bot\s+/i, '').trim();
      await client.login(cleanToken);
      await readyPromise;
      return client;
    } catch (err) {
      if (timer) clearTimeout(timer);
      client.removeAllListeners();
      await client.destroy().catch(() => null);
      throw err;
    }
  }

  let clientToUse = null;
  try {
    // Attempt standard gateway intents for universal, 100% instant connectivity without developer portal blockers
    try {
      clientToUse = await connectClient(standardIntents);
      console.log(`[CUSTOMER BOT ${bot.botId}] Connected successfully with standard gateway intents.`);
    } catch (stdErr) {
      // If error is privileged intents or other, retry with full intents if requested
      const msg = stdErr?.message || '';
      if (!msg.includes('invalid token') && !stdErr.code?.includes('TokenInvalid')) {
        console.warn(`[CUSTOMER BOT ${bot.botId}] Standard intents connection note (${msg}), attempting full intents...`);
        clientToUse = await connectClient(fullIntents);
      } else {
        throw stdErr;
      }
    }

    activeCustomerClients.set(bot.botId, clientToUse);
    let resolvedId = clientToUse.user?.id;
    if (!resolvedId && bot.token) {
      try {
        const raw = Buffer.from(bot.token.split('.')[0], 'base64').toString('utf-8');
        if (/^\d{17,20}$/.test(raw)) resolvedId = raw;
      } catch {}
    }
    const resolvedTag = clientToUse.user?.tag || `Customer Bot (${bot.botId})`;

    updateBotInstance(bot.botId, {
      discordBotId: resolvedId,
      discordTag: resolvedTag,
      status: 'active',
      invalidTokenDetectedAt: null,
      invalidTokenAttempts: 0,
      setupCompleted: true,
      banned: false,
      bannedReason: null
    });
    // Token proved itself  - reset the failure backoff so a future outage retries fast.
    invalidTokenAttempts.delete(bot.botId);
    return true;
  } catch (err) {
    console.error(`[CUSTOMER BOT ${botId}] Login failed:`, err.message);
    if (clientToUse) {
      clientToUse.removeAllListeners();
      await clientToUse.destroy().catch(() => null);
    }
    const isTokenInvalid = (err.message && (err.message.includes('An invalid token was provided') || err.message.includes('TokenInvalid'))) || err.code === 'TokenInvalid';
    const isDisallowedIntents = err.code === 'DisallowedIntents' || (err.message && err.message.includes('disallowed intents'));

    if (isTokenInvalid) {
      const prev = invalidTokenAttempts.get(botId)?.count || 0;
      const count = prev + 1;
      invalidTokenAttempts.set(botId, { count, nextRetryAt: Date.now() + invalidTokenBackoffMs(count) });
      const waitMin = Math.round(invalidTokenBackoffMs(count) / 60000);
      console.warn(`[CUSTOMER BOT ${botId}] Token rejected by Discord (attempt ${count}). Next retry in ${waitMin} min.`);
      updateBotInstance(botId, {
        status: 'invalid_token',
        invalidTokenDetectedAt: new Date().toISOString(),
        setupCompleted: false
      });
    } else if (isDisallowedIntents) {
      console.warn(`[CUSTOMER BOT ${botId}] Privileged intents not enabled in Discord Developer Portal.`);
      updateBotInstance(botId, {
        status: 'disallowed_intents',
        invalidTokenDetectedAt: new Date().toISOString(),
        setupCompleted: false
      });
    } else {
      updateBotInstance(botId, {
        status: 'error',
        invalidTokenDetectedAt: new Date().toISOString(),
        setupCompleted: false
      });
    }
    return false;
  }
}

/**
 * Stop and completely disconnect a running customer bot.
 */
export async function stopCustomerBot(botId) {
  const bot = getBotInstance(botId);
  const actualId = bot ? bot.botId : botId;
  if (activeCustomerClients.has(actualId)) {
    try {
      const client = activeCustomerClients.get(actualId);
      activeCustomerClients.delete(actualId);

      // This client may be shared with another instance that uses the same token.
      // Only tear the gateway connection down once the last borrower releases it,
      // otherwise stopping one bot would silently take its twin offline too.
      const owners = client?.__tokenOwners;
      if (owners) {
        owners.delete(actualId);
        if (owners.size > 0) {
          console.log(`[CUSTOMER BOT] ${actualId} released the shared connection  - still in use by ${[...owners].join(', ')}.`);
          return true;
        }
      }

      if (client) {
        client.removeAllListeners();
        await client.destroy().catch(() => null);
      }
      console.log(`[CUSTOMER BOT] Client for bot ${actualId} completely shut off and destroyed.`);
      return true;
    } catch (e) {
      console.warn(`[CUSTOMER BOT] Error stopping bot ${actualId}:`, e.message);
      activeCustomerClients.delete(actualId);
      return false;
    }
  }
  return false;
}

const reconnectTimeouts = new Map();

/**
 * Debounced self-healing reconnection scheduler
 */
export function scheduleBotReconnect(botId, delayMs = 3000) {
  if (botId === MASTER_BOT_ID) return;
  if (reconnectTimeouts.has(botId)) return;

  const timer = setTimeout(async () => {
    reconnectTimeouts.delete(botId);
    const bot = getBotInstance(botId);
    if (!bot || bot.banned || !bot.token) return;
    // 'invalid_token' bots still get their scheduled retry  - the watchdog only
    // schedules them when the retry cooldown has elapsed.
    console.log(`[CUSTOMER BOT WATCHDOG] Executing self-healing reconnect for bot ${botId}...`);
    await startCustomerBot(botId).catch(err => {
      console.warn(`[CUSTOMER BOT WATCHDOG] Reconnect error for bot ${botId}:`, err.message);
    });
  }, delayMs);

  reconnectTimeouts.set(botId, timer);
}

let watchdogTimer = null;

// Consecutive invalid-token failures per bot. A token that Discord answers with
// 401 has been revoked or reset by its owner  - hammering it every few minutes
// just burns rate limit and floods the logs, so failures back off exponentially.
const invalidTokenAttempts = new Map(); // botId -> { count, nextRetryAt }

function invalidTokenBackoffMs(count) {
  const steps = [5, 15, 45]; // minutes for the 1st, 2nd, 3rd failure...
  const minutes = count <= steps.length ? steps[count - 1] : 120; // ...then cap at 2h
  return minutes * 60 * 1000;
}

function invalidTokenRetryDue(bot) {
  if (bot.status !== 'invalid_token') return true;
  const rec = invalidTokenAttempts.get(bot.botId);
  if (!rec) return true;
  return Date.now() >= rec.nextRetryAt;
}


/**
 * 24/7 Watchdog Heartbeat that ensures all active customer bots remain online
 */
export function startWatchdog() {
  if (watchdogTimer) return;
  console.log('[CUSTOMER BOT WATCHDOG] Active 24/7 keep-alive monitoring service started.');
  watchdogTimer = setInterval(async () => {
    try {
      const instances = loadBotInstances();
      for (const [bId, bot] of Object.entries(instances)) {
        if (bId === MASTER_BOT_ID || !bot.token || bot.token.trim() === '' || bot.banned) {
          continue;
        }

        // Bots that failed on a bad token are retried on a cooldown rather than
        // being abandoned  - otherwise a transient failure kills them for good.
        if (!invalidTokenRetryDue(bot)) {
          continue;
        }

        const client = activeCustomerClients.get(bId);
        // If client is missing, not ready, or disconnected from gateway
        const isOffline = !client || !client.isReady() || (client.ws && client.ws.status !== 0);
        if (isOffline) {
          console.warn(`[CUSTOMER BOT WATCHDOG] Bot ${bId} is offline or stalled (status: ${client?.ws?.status ?? 'none'}). Self-healing...`);
          scheduleBotReconnect(bId, 1000);
        }
      }
    } catch (wErr) {
      console.warn('[CUSTOMER BOT WATCHDOG ERROR]:', wErr.message);
    }
  }, 20000); // Check every 20 seconds
}

/**
 * Start all configured customer bots on startup and start keep-alive watchdog.
 */
export async function startAllConfiguredBots() {
  startWatchdog();
  const instances = loadBotInstances();
  for (const [bId, bot] of Object.entries(instances)) {
    if (bId === MASTER_BOT_ID) continue;
    // 'invalid_token' is retryable: a boot attempt re-validates the token so a
    // previously revoked/reset token comes back online on its own.
    if (bot.token && bot.token.trim() !== '' && !bot.banned) {
      if (bot.status === 'invalid_token') {
        console.log(`[STARTUP] Re-validating token for previously failed bot ${bId}...`);
      } else {
        console.log(`[STARTUP] Auto-connecting customer bot ${bId}...`);
      }
      await startCustomerBot(bId).catch(err => {
        console.warn(`[STARTUP] Error starting bot ${bId}:`, err.message);
      });
    }
  }
}

