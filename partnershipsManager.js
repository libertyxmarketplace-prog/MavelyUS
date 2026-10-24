import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPromotedServers, loadUserBalances, saveUserBalances } from './directoryManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PARTNERSHIPS_FILE = path.join(DATA_DIR, 'partnerships.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadPartnershipsData() {
  try {
    if (fs.existsSync(PARTNERSHIPS_FILE)) {
      const raw = fs.readFileSync(PARTNERSHIPS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        partnerships: Array.isArray(parsed?.partnerships) ? parsed.partnerships : [],
        requests: Array.isArray(parsed?.requests) ? parsed.requests : [],
        serverConfigs: parsed?.serverConfigs && typeof parsed.serverConfigs === 'object' ? parsed.serverConfigs : {},
        transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
        analytics: parsed?.analytics && typeof parsed.analytics === 'object' ? parsed.analytics : {},
        achievements: parsed?.achievements && typeof parsed.achievements === 'object' ? parsed.achievements : {}
      };
    }
  } catch (err) {
    console.warn('[PARTNERSHIPS] Error reading partnerships data file:', err.message);
  }
  return {
    partnerships: [],
    requests: [],
    serverConfigs: {},
    transactions: [],
    analytics: {},
    achievements: {}
  };
}

function savePartnershipsData(data) {
  try {
    const tmp = `${PARTNERSHIPS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, PARTNERSHIPS_FILE);
    return true;
  } catch (err) {
    console.error('[PARTNERSHIPS] Error saving partnerships data file:', err);
    return false;
  }
}

/** Validate Discord Webhook URL */
export function isValidDiscordWebhookUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i.test(url.trim());
}

/** Get partnership configuration for a specific guild */
export function getGuildPartnershipConfig(guildId) {
  const data = loadPartnershipsData();
  const cfg = data.serverConfigs[guildId] || {};
  return {
    acceptPartnerships: cfg.acceptPartnerships !== false, // default true
    partnershipWebhookUrl: cfg.partnershipWebhookUrl || '',
    partnershipChannelId: cfg.partnershipChannelId || '',
    partnershipChannelName: cfg.partnershipChannelName || '',
    partnershipAdText: cfg.partnershipAdText || '',
    allowPartnerMentions: cfg.allowPartnerMentions === true,
    partnershipMinMembers: Number(cfg.partnershipMinMembers || 50),
    partnershipMinAge: Number(cfg.partnershipMinAge || 7),
    partnershipCooldownHours: Number(cfg.partnershipCooldownHours || 24),
    partnershipHerePrice: Number(cfg.partnershipHerePrice !== undefined ? cfg.partnershipHerePrice : 15),
    partnershipEveryonePrice: Number(cfg.partnershipEveryonePrice !== undefined ? cfg.partnershipEveryonePrice : 25),
    lastAdSentAt: cfg.lastAdSentAt || 0
  };
}

/** Update partnership configuration for a specific guild */
export function updateGuildPartnershipConfig(guildId, patch) {
  const data = loadPartnershipsData();
  const current = data.serverConfigs[guildId] || {};

  data.serverConfigs[guildId] = {
    ...current,
    ...patch,
    updatedAt: Date.now()
  };

  savePartnershipsData(data);
  return data.serverConfigs[guildId];
}

/** Get list of public servers eligible for partnership, with private credentials sanitized */
export function getPartnerEligibleServers(currentGuildId) {
  const allServers = getPromotedServers();
  const data = loadPartnershipsData();

  return allServers
    .filter(s => String(s.id) !== String(currentGuildId))
    .map(server => {
      const cfg = data.serverConfigs[server.id] || {};
      const acceptPartnerships = cfg.acceptPartnerships !== false;
      const hasWebhook = Boolean(cfg.partnershipWebhookUrl && isValidDiscordWebhookUrl(cfg.partnershipWebhookUrl));

      // Check if existing partnership exists
      const existingPart = data.partnerships.find(p =>
        p.status === 'active' &&
        ((p.guildIdA === currentGuildId && p.guildIdB === server.id) ||
         (p.guildIdB === currentGuildId && p.guildIdA === server.id))
      );

      // Check if pending request exists
      const existingReq = data.requests.find(r =>
        r.status === 'pending' &&
        ((r.fromGuildId === currentGuildId && r.toGuildId === server.id) ||
         (r.toGuildId === currentGuildId && r.fromGuildId === server.id))
      );

      return {
        id: server.id,
        name: server.name,
        icon: server.icon || server.iconUrl,
        iconUrl: server.iconUrl || server.icon,
        category: server.category || 'Roleplay Server',
        memberCount: Number(server.memberCount) > 0 ? Number(server.memberCount) : 150,
        description: server.description || '',
        bannerUrl: server.bannerUrl || '',
        inviteUrl: server.inviteUrl || '',
        verified: Boolean(server.verified),
        acceptPartnerships,
        hasWebhookConfigured: hasWebhook,
        allowPartnerMentions: Boolean(cfg.allowPartnerMentions),
        partnershipHerePrice: Number(cfg.partnershipHerePrice !== undefined ? cfg.partnershipHerePrice : 15),
        minMembersRequired: Number(cfg.partnershipMinMembers || 50),
        minAgeDaysRequired: Number(cfg.partnershipMinAge || 7),
        adTextPreview: cfg.partnershipAdText || server.description || '',
        partnershipStatus: existingPart ? 'partnered' : existingReq ? (existingReq.fromGuildId === currentGuildId ? 'outgoing_pending' : 'incoming_pending') : 'available'
      };
    });
}

/** Get complete partnership dashboard state for a guild */
export function getGuildPartnershipsDashboard(guildId, userId) {
  const data = loadPartnershipsData();
  const allServers = getPromotedServers();

  const myConfig = getGuildPartnershipConfig(guildId);

  // Active partnerships
  const activePartnerships = data.partnerships
    .filter(p => p.status === 'active' && (p.guildIdA === guildId || p.guildIdB === guildId))
    .map(p => {
      const isA = p.guildIdA === guildId;
      const otherId = isA ? p.guildIdB : p.guildIdA;
      const otherServer = allServers.find(s => s.id === otherId) || {};
      const otherCfg = data.serverConfigs[otherId] || {};

      return {
        id: p.id,
        partnerGuildId: otherId,
        partnerGuildName: isA ? p.guildNameB : p.guildNameA,
        partnerGuildIcon: isA ? p.guildIconB : p.guildIconA,
        partnerCategory: otherServer.category || 'Roleplay Server',
        partnerMemberCount: Number(otherServer.memberCount) > 0 ? Number(otherServer.memberCount) : 150,
        partnerInviteUrl: otherServer.inviteUrl || '',
        partnerBannerUrl: otherServer.bannerUrl || '',
        status: p.status,
        acceptedAt: p.acceptedAt,
        lastAdSentAt: isA ? p.lastAdSentAtA : p.lastAdSentAtB,
        totalAdsSent: p.totalAdsSent || 1,
        verifiedJoins: p.verifiedJoins || 0,
        pageVisits: p.pageVisits || 0,
        allowMentions: Boolean(otherCfg.allowPartnerMentions)
      };
    });

  // Incoming requests
  const incomingRequests = data.requests
    .filter(r => r.toGuildId === guildId && r.status === 'pending')
    .map(r => {
      const senderServer = allServers.find(s => s.id === r.fromGuildId) || {};
      return {
        ...r,
        senderCategory: senderServer.category || 'Roleplay Server',
        senderMemberCount: senderServer.memberCount || 0,
        senderBannerUrl: senderServer.bannerUrl || r.bannerUrl || ''
      };
    });

  // Outgoing requests
  const outgoingRequests = data.requests
    .filter(r => r.fromGuildId === guildId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => {
      const targetServer = allServers.find(s => s.id === r.toGuildId) || {};
      return {
        ...r,
        targetCategory: targetServer.category || 'Roleplay Server',
        targetMemberCount: targetServer.memberCount || 0,
        targetBannerUrl: targetServer.bannerUrl || ''
      };
    });

  // Guild Analytics
  const guildAnalytics = data.analytics[guildId] || {
    totalPartnerships: activePartnerships.length,
    adsDelivered: activePartnerships.reduce((sum, p) => sum + (p.totalAdsSent || 1), 0),
    deliverySuccessRate: 100,
    pageVisits: activePartnerships.reduce((sum, p) => sum + (p.pageVisits || 0), 0),
    verifiedJoinsGenerated: activePartnerships.reduce((sum, p) => sum + (p.verifiedJoins || 0), 0)
  };

  // User coin balance
  let userCoinBalance = 0;
  if (userId) {
    const balances = loadUserBalances();
    userCoinBalance = Number(balances[userId] || 0);
  }

  // User transactions
  const userTransactions = userId
    ? data.transactions.filter(t => t.userId === userId).slice(0, 30)
    : [];

  // User daily check-in state
  const userAch = userId ? (data.achievements[userId] || { lastCheckin: 0, streak: 0 }) : { lastCheckin: 0, streak: 0 };
  const now = Date.now();
  const oneDayMs = 24 * 3600 * 1000;
  const isDailyClaimed = userId ? (now - userAch.lastCheckin < oneDayMs) : false;

  return {
    settings: myConfig,
    activePartnerships,
    incomingRequests,
    outgoingRequests,
    analytics: guildAnalytics,
    userCoins: userCoinBalance,
    transactions: userTransactions,
    lastCheckin: userAch.lastCheckin || 0,
    dailyStreak: userAch.streak || 0,
    dailyClaimed: isDailyClaimed
  };
}

/** Dispatch a Discord Webhook advertisement (optional embed) */
export async function sendDiscordPartnershipWebhook({ webhookUrl, server, adText, mentionType, embed = true }) {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    throw new Error('Invalid Discord Webhook URL provided.');
  }

  // Only allow @here mention - strictly no @everyone
  const contentMention = mentionType === 'here' ? '@here' : undefined;

  // Sanitize custom text to strip any unauthorized pings
  const rawDescription = (adText || server.description || `Verified community presence on the ERLC.US platform.`)
    .replace(/@(everyone|here)/gi, '')
    .trim();

  if (embed) {
    // V2 Panel embed without emdashes
    const embedObj = {
      title: `🤝 ${server.name}`,
      description: rawDescription,
      color: 0x10b981, // Emerald green
      fields: [
        { name: 'Category', value: server.category || 'Roleplay Server', inline: true },
        { name: 'Community Size', value: `${server.memberCount || 150} Members`, inline: true },
        { name: 'Community Link', value: server.inviteUrl ? `[Join Discord Server](${server.inviteUrl})` : '[Explore on ERLC.US](https://erlc.us)', inline: true }
      ],
      footer: {
        text: 'Verified Server Partnership | ERLC.US V2',
        icon_url: 'https://erlc.us/erlcus-mark.png'
      },
      timestamp: new Date().toISOString()
    };

    if (server.icon || server.iconUrl) {
      embedObj.thumbnail = { url: server.icon || server.iconUrl };
    }
    if (server.bannerUrl && /^https?:\/\//i.test(server.bannerUrl)) {
      embedObj.image = { url: server.bannerUrl };
    }

    const payload = {
      username: 'ERLC.US Partnerships V2',
      avatar_url: 'https://erlc.us/erlcus_logo.png',
      content: contentMention,
      embeds: [embedObj]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => '');
      if (response.status === 404) {
        throw new Error(`Webhook not found - the Discord channel webhook may have been deleted or revoked. Please ask the partner to re-configure their partnership webhook URL.`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`Discord webhook unauthorized (status ${response.status}). The webhook URL is invalid or the bot lacks send permissions.`);
      }
      throw new Error(`Discord Webhook responded with status ${response.status}: ${errorText || 'Delivery failed'}`);
    }

    return true;
  }

  // Plain text message without embed
  const payload = {
    username: 'ERLC.US Partnerships V2',
    avatar_url: 'https://erlc.us/erlcus_logo.png',
    content: contentMention ? `${contentMention}\n\n${server.name} - ${server.inviteUrl || 'Join our community!'}` : `${server.name} - ${server.inviteUrl || 'Join our community!'}`
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 404) {
      throw new Error(`Webhook not found - the Discord channel webhook may have been deleted or revoked. Please ask the partner to re-configure their partnership webhook URL.`);
    } else if (response.status === 401 || response.status === 403) {
      throw new Error(`Discord webhook unauthorized (status ${response.status}). The webhook URL is invalid or the bot lacks send permissions.`);
    }
    throw new Error(`Discord Webhook responded with status ${response.status}: ${errorText || 'Delivery failed'}`);
  }

  return true;
}

/** Create a new partnership request */
export function createPartnershipRequest({
  fromGuildId,
  fromGuildName,
  fromGuildIcon,
  fromOwnerId,
  toGuildId,
  includeMention = false,
  mentionType = 'none',
  customAdText = '',
  userCoinBalance = 0
}) {
  if (fromGuildId === toGuildId) {
    throw new Error('You cannot send a partnership request to your own server.');
  }

  const data = loadPartnershipsData();
  const targetConfig = data.serverConfigs[toGuildId] || {};

  if (targetConfig.acceptPartnerships === false) {
    throw new Error('This community is currently not accepting new partnership requests.');
  }

  // Check duplicate active partnership
  const existingActive = data.partnerships.find(p =>
    p.status === 'active' &&
    ((p.guildIdA === fromGuildId && p.guildIdB === toGuildId) ||
     (p.guildIdB === fromGuildId && p.guildIdA === toGuildId))
  );
  if (existingActive) {
    throw new Error('Your server is already partnered with this community.');
  }

  // Check duplicate pending request
  const existingPending = data.requests.find(r =>
    r.status === 'pending' &&
    ((r.fromGuildId === fromGuildId && r.toGuildId === toGuildId) ||
     (r.toGuildId === fromGuildId && r.fromGuildId === toGuildId))
  );
  if (existingPending) {
    throw new Error('A pending partnership request already exists between these two servers.');
  }

  // Get sender server info
  const allServers = getPromotedServers();
  const senderServer = allServers.find(s => s.id === fromGuildId);
  const targetServer = allServers.find(s => s.id === toGuildId);

  // Check minimum member requirements
  const minMembers = Number(targetConfig.partnershipMinMembers || 50);
  if (senderServer && senderServer.memberCount && senderServer.memberCount < minMembers) {
    throw new Error(`This server requires a minimum of ${minMembers} members to partner.`);
  }

  // Mentions permission and coin cost calculation - only allow @here
  let coinsCost = 0;
  const effectiveMentionType = mentionType === 'here' ? 'here' : 'none';
  const effectiveIncludeMention = includeMention && effectiveMentionType === 'here';

  if (effectiveIncludeMention) {
    if (!targetConfig.allowPartnerMentions) {
      throw new Error('The target server owner has disabled role mentions.');
    }
    const hereCost = Number(targetConfig.partnershipHerePrice !== undefined ? targetConfig.partnershipHerePrice : 15);
    coinsCost = hereCost;
    if (userCoinBalance < coinsCost) {
      throw new Error(`You need at least ${coinsCost} coins to unlock an @here mention announcement.`);
    }

    // Deduct coins from balance and record transaction
    if (fromOwnerId) {
      const balances = loadUserBalances();
      balances[fromOwnerId] = Math.max(0, (balances[fromOwnerId] || 0) - coinsCost);
      saveUserBalances(balances);

      data.transactions.unshift({
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: fromOwnerId,
        amount: -coinsCost,
        type: 'mention_upgrade',
        description: `Mention upgrade (@here) for partnership request to ${targetServer?.name || toGuildId}`,
        timestamp: Date.now()
      });
    }
  }

  // Sanitize custom advertisement text to strip unauthorized @everyone/@here pings
  const sanitizedAdText = (customAdText || '').replace(/@(everyone|here)/gi, '').trim();

  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newRequest = {
    id: requestId,
    fromGuildId,
    fromGuildName: fromGuildName || senderServer?.name || 'Partner Server',
    fromGuildIcon: fromGuildIcon || senderServer?.icon || senderServer?.iconUrl || null,
    fromOwnerId,
    toGuildId,
    toGuildName: targetServer?.name || 'Target Server',
    status: 'pending',
    includeMention: Boolean(effectiveIncludeMention),
    mentionType: effectiveMentionType,
    coinsPaid: coinsCost,
    adText: sanitizedAdText || senderServer?.description || '',
    inviteUrl: senderServer?.inviteUrl || '',
    bannerUrl: senderServer?.bannerUrl || '',
    createdAt: Date.now()
  };

  data.requests.unshift(newRequest);
  savePartnershipsData(data);

  return newRequest;
}

/** Respond to a partnership request (Accept or Decline) */
export async function respondToPartnershipRequest({ requestId, action, guildId, responderUserId }) {
  const data = loadPartnershipsData();
  const reqIndex = data.requests.findIndex(r => r.id === requestId && r.toGuildId === guildId);

  if (reqIndex < 0) {
    throw new Error('Partnership request not found or you are not authorized to respond.');
  }

  const req = data.requests[reqIndex];
  if (req.status !== 'pending') {
    throw new Error(`This request has already been ${req.status}.`);
  }

  const allServers = getPromotedServers();
  const serverA = allServers.find(s => s.id === req.fromGuildId) || { id: req.fromGuildId, name: req.fromGuildName };
  const serverB = allServers.find(s => s.id === req.toGuildId) || { id: req.toGuildId, name: req.toGuildName };

  const configA = data.serverConfigs[req.fromGuildId] || {};
  const configB = data.serverConfigs[req.toGuildId] || {};

  if (action === 'accept') {
    // Both webhooks delivery
    let webhookDeliveries = { aToB: false, bToA: false };
    const deliveryErrors = [];

    // Deliver Server A ad into Server B webhook (no embed - plain text only)
    if (configB.partnershipWebhookUrl && isValidDiscordWebhookUrl(configB.partnershipWebhookUrl)) {
      try {
        await sendDiscordPartnershipWebhook({
          webhookUrl: configB.partnershipWebhookUrl,
          server: serverA,
          adText: req.adText || configA.partnershipAdText || serverA.description,
          mentionType: req.includeMention ? req.mentionType : 'none',
          embed: false
        });
        webhookDeliveries.aToB = true;
      } catch (err) {
        console.warn(`[PARTNERSHIPS] Error delivering ad to server B webhook:`, err.message);
        deliveryErrors.push(`Server B channel: ${err.message}`);
      }
    }

    // Deliver Server B ad into Server A webhook (no embed - plain text only)
    if (configA.partnershipWebhookUrl && isValidDiscordWebhookUrl(configA.partnershipWebhookUrl)) {
      try {
        await sendDiscordPartnershipWebhook({
          webhookUrl: configA.partnershipWebhookUrl,
          server: serverB,
          adText: configB.partnershipAdText || serverB.description,
          mentionType: 'none',
          embed: false
        });
        webhookDeliveries.bToA = true;
      } catch (err) {
        console.warn(`[PARTNERSHIPS] Error delivering ad to server A webhook:`, err.message);
        deliveryErrors.push(`Server A channel: ${err.message}`);
      }
    }

    // Create active partnership
    const partnershipId = `part_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newPartnership = {
      id: partnershipId,
      guildIdA: req.fromGuildId,
      guildNameA: serverA.name,
      guildIconA: serverA.icon || serverA.iconUrl || null,
      guildIdB: req.toGuildId,
      guildNameB: serverB.name,
      guildIconB: serverB.icon || serverB.iconUrl || null,
      status: 'active',
      acceptedAt: Date.now(),
      lastAdSentAtA: webhookDeliveries.aToB ? Date.now() : 0,
      lastAdSentAtB: webhookDeliveries.bToA ? Date.now() : 0,
      totalAdsSent: (webhookDeliveries.aToB ? 1 : 0) + (webhookDeliveries.bToA ? 1 : 0) || 1,
      verifiedJoins: 0,
      pageVisits: 0
    };

    data.partnerships.unshift(newPartnership);
    data.requests[reqIndex].status = 'accepted';
    data.requests[reqIndex].respondedAt = Date.now();

    // Reward both server owners with partnership bonus coins (+10 coins each)!
    const balances = loadUserBalances();
    if (req.fromOwnerId) {
      balances[req.fromOwnerId] = (balances[req.fromOwnerId] || 0) + 10;
      data.transactions.unshift({
        id: `tx_${Date.now()}_a`,
        userId: req.fromOwnerId,
        amount: 10,
        type: 'partnership_bonus',
        description: `Partnership established with ${serverB.name}`,
        timestamp: Date.now()
      });
    }
    if (responderUserId) {
      balances[responderUserId] = (balances[responderUserId] || 0) + 10;
      data.transactions.unshift({
        id: `tx_${Date.now()}_b`,
        userId: responderUserId,
        amount: 10,
        type: 'partnership_bonus',
        description: `Partnership established with ${serverA.name}`,
        timestamp: Date.now()
      });
    }
    saveUserBalances(balances);

    savePartnershipsData(data);

    return {
      success: true,
      partnership: newPartnership,
      deliveries: webhookDeliveries,
      deliveryNotice: deliveryErrors.length > 0 ? deliveryErrors.join(' | ') : 'Both Discord advertisements delivered successfully.'
    };
  } else {
    // Decline request: refund any coins paid for mentions
    data.requests[reqIndex].status = 'declined';
    data.requests[reqIndex].respondedAt = Date.now();

    if (req.coinsPaid > 0 && req.fromOwnerId) {
      const balances = loadUserBalances();
      balances[req.fromOwnerId] = (balances[req.fromOwnerId] || 0) + req.coinsPaid;
      saveUserBalances(balances);

      data.transactions.unshift({
        id: `tx_${Date.now()}_refund`,
        userId: req.fromOwnerId,
        amount: req.coinsPaid,
        type: 'refund',
        description: `Refund for declined partnership request mention to ${serverB.name}`,
        timestamp: Date.now()
      });
    }

    savePartnershipsData(data);
    return { success: true, status: 'declined' };
  }
}

/** Trigger scheduled or manual ad dispatch to an active partner */
export async function sendManualAdBroadcast({ partnershipId, guildId }) {
  const data = loadPartnershipsData();
  const part = data.partnerships.find(p => p.id === partnershipId && p.status === 'active');
  if (!part) {
    throw new Error('Active partnership not found.');
  }

  const isA = part.guildIdA === guildId;
  const targetGuildId = isA ? part.guildIdB : part.guildIdA;
  const targetConfig = data.serverConfigs[targetGuildId] || {};

  if (!targetConfig.partnershipWebhookUrl || !isValidDiscordWebhookUrl(targetConfig.partnershipWebhookUrl)) {
    throw new Error('Partner community does not have a valid Discord webhook configured.');
  }

  // Check cooldown
  const lastSent = isA ? part.lastAdSentAtA : part.lastAdSentAtB;
  const cooldownHours = Number(targetConfig.partnershipCooldownHours || 24);
  const cooldownMs = cooldownHours * 3600 * 1000;
  const now = Date.now();

  if (now - lastSent < cooldownMs) {
    const hoursLeft = Math.ceil((cooldownMs - (now - lastSent)) / (3600 * 1000));
    throw new Error(`Cooldown active: You can dispatch the next advertisement in ${hoursLeft} hour(s).`);
  }

  const allServers = getPromotedServers();
  const senderServer = allServers.find(s => s.id === guildId) || { id: guildId, name: isA ? part.guildNameA : part.guildNameB };
  const senderConfig = data.serverConfigs[guildId] || {};

  await sendDiscordPartnershipWebhook({
    webhookUrl: targetConfig.partnershipWebhookUrl,
    server: senderServer,
    adText: senderConfig.partnershipAdText || senderServer.description,
    mentionType: 'none'
  });

  if (isA) {
    part.lastAdSentAtA = now;
  } else {
    part.lastAdSentAtB = now;
  }
  part.totalAdsSent = (part.totalAdsSent || 0) + 1;

  savePartnershipsData(data);
  return { success: true, timestamp: now };
}

/** Claim daily check-in reward */
export function claimDailyReward(userId) {
  if (!userId) throw new Error('User not authenticated.');
  const data = loadPartnershipsData();
  const balances = loadUserBalances();

  const userAch = data.achievements[userId] || { lastCheckin: 0, streak: 0 };
  const now = Date.now();
  const oneDayMs = 24 * 3600 * 1000;

  if (now - userAch.lastCheckin < oneDayMs) {
    const hoursRemaining = Math.ceil((oneDayMs - (now - userAch.lastCheckin)) / (3600 * 1000));
    throw new Error(`Daily reward already claimed today. Next claim available in ${hoursRemaining} hour(s).`);
  }

  // If claimed within 48h, increment streak; otherwise reset to 1
  if (now - userAch.lastCheckin < 2 * oneDayMs) {
    userAch.streak = (userAch.streak || 0) + 1;
  } else {
    userAch.streak = 1;
  }
  userAch.lastCheckin = now;

  const rewardAmount = 5 + Math.min(userAch.streak, 5); // +5 to +10 based on streak
  balances[userId] = (balances[userId] || 0) + rewardAmount;

  data.achievements[userId] = userAch;
  data.transactions.unshift({
    id: `tx_${now}_checkin`,
    userId,
    amount: rewardAmount,
    type: 'daily_checkin',
    description: `Day ${userAch.streak} Daily Check-In reward claimed`,
    timestamp: now
  });

  saveUserBalances(balances);
  savePartnershipsData(data);

  return {
    success: true,
    amount: rewardAmount,
    newBalance: balances[userId],
    streak: userAch.streak
  };
}

/** Claim milestone achievement */
export function claimAchievement(userId, achievementId) {
  if (!userId) throw new Error('User not authenticated.');
  const data = loadPartnershipsData();
  const balances = loadUserBalances();

  const userAch = data.achievements[userId] || { claimedAchievements: [] };
  userAch.claimedAchievements = userAch.claimedAchievements || [];

  if (userAch.claimedAchievements.includes(achievementId)) {
    throw new Error('This achievement reward has already been claimed.');
  }

  const achievementsDefs = {
    first_partner: { title: 'First Community Alliance', reward: 15 },
    five_partners: { title: 'Network Vanguard (5 Partners)', reward: 50 },
    profile_complete: { title: 'Complete Server Presence', reward: 10 },
    verified_ten: { title: 'Decade of Verified Growth (10 Joins)', reward: 25 }
  };

  const def = achievementsDefs[achievementId];
  if (!def) throw new Error('Unknown achievement identifier.');

  balances[userId] = (balances[userId] || 0) + def.reward;
  userAch.claimedAchievements.push(achievementId);
  data.achievements[userId] = userAch;

  data.transactions.unshift({
    id: `tx_${Date.now()}_ach`,
    userId,
    amount: def.reward,
    type: 'achievement',
    description: `Achievement: ${def.title}`,
    timestamp: Date.now()
  });

  saveUserBalances(balances);
  savePartnershipsData(data);

  return {
    success: true,
    amount: def.reward,
    newBalance: balances[userId],
    achievementId
  };
}
