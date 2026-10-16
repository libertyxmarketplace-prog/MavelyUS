import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  AttachmentBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotInstance } from './botManager.js';
import { AI_CAPABILITIES } from './aiConfigAssistant.js';
import { getPanelBottomBanner } from './panelMenu.js';
import { activeCustomerClients } from './customerBotRunner.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAVELY_LOGO_PATH = path.join(__dirname, 'assets', 'mavely_logo.png');

export const TOTAL_PAGES = 7;

export const EMOJIS = {
  LEFT: '1552907890681970688',
  RIGHT: '1552909020833259520',
  BOOK: '<:book:1552550166224179241>',
  BRIEFCASE: '<:briefcase:1552550290425909258>',
  CHART: '<:chart:1552551135737413663>',
  CHECK: '<:checkmark:1552901024400932894>',
  CROSS: '<:xmark:1552901454098989056>',
  PEOPLE: '<:people:1552549954109706250>',
  HOME: '<:home:1552548373830311986>',
  DEVELOPMENT: '<:development:1552549821272039465>'
};

export const DEFAULT_BOTTOM_BANNER = null;

export const PAGE_META = [
  { id: 1, tab: 'Credentials', title: 'CREDENTIALS & SETUP' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES & APPEARANCE' },
  { id: 3, tab: 'Sessions', title: 'LIVE SESSIONS' },
  { id: 4, tab: 'Applications', title: 'STAFF APPLICATIONS' },
  { id: 5, tab: 'Docs', title: 'STAFF DOCUMENTATION' },
  { id: 6, tab: 'Community', title: 'COMMUNITY & TRACKING' },
  { id: 7, tab: 'AI', title: 'MAVELY AI ASSISTANT' }
];

function maskSecret(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 'Not Set';
  if (str.length <= 8) return '********';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

function statusText(isConfigured, yesLabel = 'Configured', noLabel = 'Not Configured') {
  return isConfigured ? yesLabel : noLabel;
}

function chanRef(id) {
  return (id && String(id).trim()) ? `<#${String(id).trim()}>` : 'Not Configured';
}

function roleRef(id) {
  return (id && String(id).trim()) ? `<@&${String(id).trim()}>` : 'Not Configured';
}

/**
 * Build Initial Setup Gate payload (shown before config when credentials are missing)
 */
export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('Initial Setup')
    .setDescription(
      '> Connect your Discord bot token and ER:LC server key to activate your instance.\n\n' +
      '**Credentials**\n' +
      `${hasToken ? EMOJIS.CHECK : EMOJIS.CROSS} Bot Token: ${hasToken ? 'Connected' : 'Not Configured'}\n` +
      `${hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS} ER:LC API Key: ${hasApiKey ? 'Connected' : 'Not Configured'}`
    )
    .setThumbnail('https://cdn.discordapp.com/avatars/1552165138017165372/9c397e6df530a28a6208310c9c3491a2.png?size=256')
    .setFooter({ text: 'Initial Setup' });

  const buttons = [
    new ButtonBuilder()
      .setCustomId(`cfg_btn_initial_setup_${botId}`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success)
  ];

  const row = new ActionRowBuilder().addComponents(buttons);

  return {
    embeds: [embed],
    components: [row],
    attachments: [],
    flags: 64
  };
}

/**
 * Shared Modules Dropdown Menu
 */
function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`cfg_menu_modules_${botId}`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Credentials & Setup', value: 'edit_credentials', description: 'Configure bot token and ER:LC API key' },
        { label: 'Server Details', value: 'edit_servercore', description: 'Server name, join code, and custom presence' },
        { label: 'Ticket System & Appearance', value: 'nav_page_2', description: 'Categories, routing, and panel styling' },
        { label: 'Live Sessions', value: 'nav_page_3', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_4', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_5', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_6', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_7', description: 'Automated configuration with AI' }
      ])
  );
}

/**
 * Shared Navigation Button Row
 */
export function buildNavButtonRow(botId, activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cfg_nav_prev_${botId}_${activePage}`)
      .setEmoji(EMOJIS.LEFT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage <= 1),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_page_${botId}_${activePage}`)
      .setLabel(`${activePage} / ${TOTAL_PAGES}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_next_${botId}_${activePage}`)
      .setEmoji(EMOJIS.RIGHT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage >= TOTAL_PAGES),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_helper_${botId}`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );
}

/**
 * Build interactive /config control panel payload with native Discord select menus
 */
export function buildConfigPanelPayload(botId, page = 1, includeAttachment = false, guild = null) {
  const bot = getBotInstance(botId);
  if (!bot) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Bot Not Found')
      .setDescription(`> No bot instance found matching ID **${botId}**.\n\nPlease verify your Bot ID or run /config again.`);
    return {
      embeds: [errEmbed],
      components: [],
      flags: 64
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  const rows = [];

  let guildName = guild?.name;
  let guildIcon = guild?.iconURL?.({ extension: 'png', size: 256 }) || null;

  if (!guildName && bot?.guildId) {
    const custClient = activeCustomerClients?.get(botId);
    const cachedGuild = custClient?.guilds?.cache?.get(bot.guildId);
    if (cachedGuild) {
      guildName = cachedGuild.name;
      guildIcon = cachedGuild.iconURL?.({ extension: 'png', size: 256 }) || null;
    }
  }

  const displayName = guildName || cust.serverName || 'Server Configuration';

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: displayName, iconURL: guildIcon || undefined })
    .setTitle(PAGE_META[activePage - 1]?.title || 'SERVER CONFIGURATION')
    .setFooter({ text: `Page ${activePage} of ${TOTAL_PAGES}` });

  if (guildIcon) {
    embed.setThumbnail(guildIcon);
  }

  if (cust.topBannerUrl && typeof cust.topBannerUrl === 'string' && cust.topBannerUrl.startsWith('http') && !cust.topBannerUrl.includes('imgur.com/8QzX9nB')) {
    embed.setImage(cust.topBannerUrl.trim());
  }

  switch (activePage) {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: CREDENTIALS & SETUP
    // ══════════════════════════════════════════════════════════════════════
    case 1: {
      const isOnline = bot?.status === 'active' && Boolean(bot?.token && bot.token.trim().length > 0);
      const isInvalid = bot?.status === 'invalid_token';
      const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);

      const tokenMark = isOnline ? EMOJIS.CHECK : EMOJIS.CROSS;
      const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
      const tokenText = hasToken ? 'Connected' : 'Not Configured';
      const apiKeyMark = hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS;

      const staffMark = cust.botStaffRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const staffDisplay = cust.botStaffRoleId ? `<@&${cust.botStaffRoleId}>` : 'Not Configured';
      const adminRole = cust.adminRoleId || (Array.isArray(cust.staffRoleIds) && cust.staffRoleIds[0]) || '';
      const adminMark = adminRole ? EMOJIS.CHECK : EMOJIS.CROSS;
      const adminDisplay = adminRole ? `<@&${adminRole}>` : 'Not Configured';

      const defaultPromo = cust.serverName ? `${cust.serverName} | Code: ${cust.joinCode || 'Join'}` : 'Our Community';
      const actText = cust.botActivityText?.trim() || defaultPromo;

      embed.setDescription(
        '> Connect your Discord bot token and ER:LC server key to activate your instance, and manage community access.\n\n' +
        '**Credentials**\n' +
        `${tokenMark} Bot Token: ${tokenText}\n` +
        `${apiKeyMark} ER:LC API Key: ${hasApiKey ? 'Connected' : 'Not Configured'}\n\n` +
        '**Permissions**\n' +
        `${staffMark} Staff Role: ${staffDisplay}\n` +
        `${adminMark} Admin Role: ${adminDisplay}\n\n` +
        '**In-Game Server**\n' +
        `╭ Community Name: ${cust.serverName?.trim() || 'Not Configured'}\n` +
        `├ Join Code: ${cust.joinCode?.trim() || 'Not Configured'}\n` +
        `╰ Presence: Watching ${actText}`
      );

      // Row 1: Staff Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_staff_${botId}`)
          .setPlaceholder('Select Staff Role')
      ));

      // Row 2: Admin Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_admin_${botId}`)
          .setPlaceholder('Select Admin Role')
      ));

      // Row 3: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 4: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 1));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: TICKET CATEGORIES & APPEARANCE
    // ══════════════════════════════════════════════════════════════════════
    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const rawCategories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      // Filter out any removed / blank categories
      const categories = rawCategories.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
      const displayCats = categories.length > 0 ? categories : defaultCategories.slice(0, 1);

      const spawnCatId = cust.ticketSpawnCategoryId || displayCats[0]?.spawnCategoryId;
      const spawnMark = spawnCatId ? EMOJIS.CHECK : EMOJIS.CROSS;

      const catsList = displayCats
        .map((c, i) => `${i + 1}. **${c.name}** ${c.spawnCategoryId ? `→ <#${c.spawnCategoryId}>` : ''}`)
        .join('\n');

      const bannerStatus = cust.topBannerUrl ? 'Custom' : 'Not Set (Optional)';
      const insideStatus = cust.ticketInsideBannerUrl ? 'Custom' : 'Not Set (Optional)';
      const rulesStatus = cust.showRulesButton !== false ? (cust.rulesButtonLabel || 'Server Guidelines') : 'Disabled';

      embed.setDescription(
        '> Support desk routing, category channels, and appearance styling.\n\n' +
        '**Ticket Routing**\n' +
        `${spawnMark} Spawn Category: ${chanRef(spawnCatId)}\n\n` +
        '**Active Categories**\n' +
        `${catsList}\n\n` +
        '**Panel Appearance**\n' +
        `Title: ${cust.panelTitle || 'Support'}\n` +
        `Top Banner: ${bannerStatus}\n` +
        `Header Banner: ${insideStatus}\n` +
        `Rules Button: ${rulesStatus}\n\n` +
        '**Assistant**\n' +
        'Need help? Click the **Helper** button below for guidance.'
      );

      // Row 1: Category Spawn Channel (Native Channel Select Menu)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_ticketspawn_${botId}`)
          .setPlaceholder('Select Ticket Spawn Category / Channel')
          .setChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText)
      ));

      // Row 2: Appearance & Category Settings dropdown
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_2`)
          .setPlaceholder('Appearance & Category Settings')
          .addOptions([
            { label: 'Rename & Remove Categories', value: 'edit_ticket_catnames', description: 'Customize category names (leave blank to remove)' },
            { label: 'Category Spawn Channels', value: 'edit_ticket_catspawns', description: 'Configure spawn channels for active categories' },
            { label: 'Panel Headline & Description', value: 'edit_ticket_text', description: 'Customize title and ticket center description' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set panel top banner and inside header (optional)' },
            { label: 'Rules Button & Greeting', value: 'edit_rules_greeting', description: 'Rules button label and greeting message' },
            { label: 'Staff Notification Pings', value: 'edit_ticket_catpings', description: 'Roles alerted when tickets open' },
            { label: 'Reset to Defaults', value: 'reset_ticket_categories', description: 'Restore default categories & style' }
          ])
      ));

      // Row 3: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 4: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: LIVE SESSIONS
    // ══════════════════════════════════════════════════════════════════════
    case 3: {
      const sesMark = cust.sessionChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const hostMark = cust.hostRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const notifMark = cust.notificationRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Patrol announcements, radio channels, and host roles.\n\n' +
        '**Patrol Channels & Roles**\n' +
        `${sesMark} Announcement Channel: ${chanRef(cust.sessionChannelId)}\n` +
        `In-Game Radio VC: ${chanRef(cust.ingameVcId)}\n` +
        `${hostMark} Host Role: ${roleRef(cust.hostRoleId)}\n` +
        `${notifMark} Notification Role: ${roleRef(cust.notificationRoleId)}\n\n` +
        '**Connection**\n' +
        `Join Code: ${cust.joinCode || 'Not Set'}\n` +
        `ER:LC API: ${bot.erlcApiKey ? 'Connected' : 'Not Set'}`
      );

      // Row 1: Session Announcement Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_session_${botId}`)
          .setPlaceholder('Select Session Announcement Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      // Row 2: Patrol Host Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_host_${botId}`)
          .setPlaceholder('Select Patrol Host Role')
      ));

      // Row 3: Notification Ping Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_notif_${botId}`)
          .setPlaceholder('Select Notification Ping Role')
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 3));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: STAFF APPLICATIONS
    // ══════════════════════════════════════════════════════════════════════
    case 4: {
      const revMark = cust.reviewChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const resMark = cust.resultsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Staff recruitment pipelines and candidate evaluation feeds.\n\n' +
        '**Review Feeds**\n' +
        `${revMark} Review Channel: ${chanRef(cust.reviewChannelId)}\n` +
        `${resMark} Results Feed: ${chanRef(cust.resultsChannelId)}\n\n` +
        '**Pipeline Status**\n' +
        `In-Game Moderation: ${cust.appIngameOpen !== false ? 'Open' : 'Closed'}\n` +
        `Discord Moderation: ${cust.appDiscordOpen !== false ? 'Open' : 'Closed'}`
      );

      // Row 1: Review Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_appreview_${botId}`)
          .setPlaceholder('Select Staff Review Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 2: Results Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_appresults_${botId}`)
          .setPlaceholder('Select Public Results Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 4));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: STAFF DOCUMENTATION
    // ══════════════════════════════════════════════════════════════════════
    case 5: {
      const docMark = cust.staffDocsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Staff guidelines, handbook, and operational protocols.\n\n' +
        '**Documentation Hub**\n' +
        `${docMark} Destination Channel: ${chanRef(cust.staffDocsChannelId)}\n` +
        `Layout Mode: ${cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Select Menu'}\n` +
        `Hub Title: ${cust.staffDocsTitle || 'Staff Documentation'}`
      );

      // Row 1: Destination Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_staffdocs_${botId}`)
          .setPlaceholder('Select Staff Documentation Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_6`)
          .setPlaceholder('Documentation Settings')
          .addOptions([
            { label: 'Hub Title & Description', value: 'edit_staffdocs_content', description: 'Set headline and intro copy' },
            { label: 'Header & Footer Banners', value: 'edit_staffdocs_banners', description: 'Artwork images' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 5));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 6: COMMUNITY & TRACKING
    // ══════════════════════════════════════════════════════════════════════
    case 6: {
      const infChanMark = cust.infractionsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const infRoleMark = cust.infractionStaffRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const promChanMark = cust.promotionsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Disciplinary tracking, rank advancements, and engagement channels.\n\n' +
        '**Infractions**\n' +
        `${infChanMark} Channel: ${chanRef(cust.infractionsChannelId)}\n` +
        `${infRoleMark} Supervisor Role: ${roleRef(cust.infractionStaffRoleId)}\n\n` +
        '**Promotions**\n' +
        `${promChanMark} Channel: ${chanRef(cust.promotionsChannelId)}\n` +
        `Promoter Role: ${roleRef(cust.promotionStaffRoleId)}\n\n` +
        '**Community Channels**\n' +
        `Forums: ${chanRef(cust.forumChannelId)}\n` +
        `Daily Questions: ${chanRef(cust.dailyQuestionsChannelId)}`
      );

      // Row 1: Infractions Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_infractions_${botId}`)
          .setPlaceholder('Select Infractions Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 2: Promotions Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`cfg_chan_promotions_${botId}`)
          .setPlaceholder('Select Promotions Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 3: Infraction Supervisor Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_supervisor_${botId}`)
          .setPlaceholder('Select Infraction Supervisor Role')
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 6));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 7: MAVELY AI ASSISTANT
    // ══════════════════════════════════════════════════════════════════════
    case 7: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');
      const aiStatusMark = hasAiKey ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '### <:development:1552549821272039465> AI Intelligence Core\n' +
        '> Connect your neural API engine to unlock automated server setup suggestions, smart rules, and intelligent parsing.\n\n' +
        '**Integration Status**\n' +
        `${aiStatusMark} **Key Status:** \`${hasAiKey ? 'Active & Authenticated' : 'Not Configured'}\`\n` +
        `<:chart:1552551135737413663> **Provider:** \`${activeAiProv}\`\n` +
        `<:briefcase:1552550290425909258> **Active Model:** \`${activeModel}\`\n\n` +
        '**Capabilities**\n' +
        `\`\`\`yaml\n` +
        `• Natural Language Server Configuration\n` +
        `• Automated Setup Suggestions\n` +
        `• Instant Rule & Guideline Optimization\n` +
        `\`\`\`\n` +
        '**Assistant**\n' +
        'Need help with your AI key? Click the **Helper** button below for guidance.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_8`)
          .setPlaceholder('AI Engine Settings')
          .addOptions([
            { label: 'Connect AI Key', value: 'edit_ai_key', description: 'Authenticate OpenRouter, OpenAI, Groq, or Gemini key' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 7));
      break;
    }
  }

  return {
    embeds: [embed],
    components: rows,
    attachments: [],
    flags: 64
  };
}

// ══════════════════════════════════════════════════════════════════════
// MODAL BUILDERS
// ══════════════════════════════════════════════════════════════════════

/**
 * Build Credentials Modal (Page 1)
 */
export function buildCredentialsModal(botId) {
  const bot = getBotInstance(botId);
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_creds_${botId}`)
    .setTitle('Bot Setup: Credentials');

  const tokenInput = new TextInputBuilder()
    .setCustomId('token')
    .setLabel('Discord Bot Token (Required)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your Discord Bot Token')
    .setRequired(true);
  if (bot?.token && bot.token.trim().length > 0) tokenInput.setValue(bot.token.trim());

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('erlcApiKey')
    .setLabel('ER:LC Server API Key (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your ER:LC Server API Key (Optional)')
    .setRequired(false);
  if (bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0) apiKeyInput.setValue(bot.erlcApiKey.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(tokenInput),
    new ActionRowBuilder().addComponents(apiKeyInput)
  );

  return modal;
}

/**
 * Build Server Core & Join Code Modal (Page 1)
 */
export function buildServerCoreModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_servercore_${botId}`)
    .setTitle('Server Identity & Join Code');

  const currentName = cust.serverName?.trim() || '';
  const currentJoin = cust.joinCode?.trim() || '';
  const currentActivity = cust.botActivityText?.trim() || '';

  const nameInput = new TextInputBuilder()
    .setCustomId('serverName')
    .setLabel('In-Game Server Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. My Community')
    .setRequired(false);
  if (currentName) nameInput.setValue(currentName);

  const joinInput = new TextInputBuilder()
    .setCustomId('joinCode')
    .setLabel('Server Join Code')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. JOINCODE')
    .setRequired(false);
  if (currentJoin) joinInput.setValue(currentJoin);

  const activityInput = new TextInputBuilder()
    .setCustomId('botActivityText')
    .setLabel('Bot Status Activity (Custom Presence)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Patrolling | Code: JOINCODE')
    .setRequired(false);
  if (currentActivity) activityInput.setValue(currentActivity);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(joinInput),
    new ActionRowBuilder().addComponents(activityInput)
  );

  return modal;
}

/**
 * Build Ticket Category Names Modal (Page 2)
 */
export function buildTicketCategoryNamesModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatnames_${botId}`)
    .setTitle('Rename Categories (Blank = Remove)');

  for (let i = 1; i <= 5; i++) {
    const existing = currentCats[i - 1]?.name || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_name_${i}`)
      .setLabel(`Category ${i} Name (Leave empty to remove)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(i === 1 ? 'General Support' : i === 2 ? 'High Rank' : `Category ${i} (Optional)`)
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Category Spawn Channels Modal (Page 2)
 */
export function buildTicketCategorySpawnsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const allCats = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
    ? cust.ticketCategories
    : [{ id: 'cat_1', name: 'General Support', spawnCategoryId: cust.ticketSpawnCategoryId || '' }];
  const activeCats = allCats.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
  const displayCats = activeCats.length > 0 ? activeCats : allCats.slice(0, 1);

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatspawns_${botId}`)
    .setTitle('Category Spawn Channels');

  for (let i = 0; i < displayCats.length && i < 5; i++) {
    const cat = displayCats[i];
    const catName = cat.name || `Category ${i + 1}`;
    const existing = cat.spawnCategoryId || cust.ticketSpawnCategoryId || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_spawn_${i + 1}`)
      .setLabel(`${catName.slice(0, 20)} Spawn Category ID`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Discord Category ID or Channel ID')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Category Ping Roles Modal (Page 2)
 */
export function buildTicketCategoryPingsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const allCats = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
    ? cust.ticketCategories
    : [{ id: 'cat_1', name: 'General Support', pingRoleId: '' }];
  const activeCats = allCats.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
  const displayCats = activeCats.length > 0 ? activeCats : allCats.slice(0, 1);

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatpings_${botId}`)
    .setTitle('Category Alert Roles');

  for (let i = 0; i < displayCats.length && i < 5; i++) {
    const cat = displayCats[i];
    const catName = cat.name || `Category ${i + 1}`;
    const existing = cat.pingRoleId || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_ping_${i + 1}`)
      .setLabel(`${catName.slice(0, 20)} Role ID`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Staff Role ID to ping when opened')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Banners & Settings Modal (Page 3)
 */
export function buildTicketBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketbanners_${botId}`)
    .setTitle('Ticket Banners & Appearance');

  const topBannerInput = new TextInputBuilder()
    .setCustomId('topBannerUrl')
    .setLabel('Main Panel Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/banner.png')
    .setRequired(false);
  if (cust.topBannerUrl?.trim()) topBannerInput.setValue(cust.topBannerUrl.trim());

  const insideBannerInput = new TextInputBuilder()
    .setCustomId('ticketInsideBannerUrl')
    .setLabel('Inside-Ticket Header Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/inside_banner.png')
    .setRequired(false);
  if (cust.ticketInsideBannerUrl?.trim()) insideBannerInput.setValue(cust.ticketInsideBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('bottomBannerUrl')
    .setLabel('Global Bottom Strip Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/bottom_strip.png')
    .setRequired(false);
  if (cust.bottomBannerUrl?.trim()) bottomInput.setValue(cust.bottomBannerUrl.trim());

  const transInput = new TextInputBuilder()
    .setCustomId('transcriptsChannelId')
    .setLabel('Transcripts Log Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where closed transcripts are sent')
    .setRequired(false);
  if (cust.transcriptsChannelId?.trim()) transInput.setValue(cust.transcriptsChannelId.trim());

  const claimRoleInput = new TextInputBuilder()
    .setCustomId('ticketClaimRoleId')
    .setLabel('Allowed Ticket Claim Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role ID allowed to claim tickets')
    .setRequired(false);
  if (cust.ticketClaimRoleId?.trim()) claimRoleInput.setValue(cust.ticketClaimRoleId.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(insideBannerInput),
    new ActionRowBuilder().addComponents(bottomInput),
    new ActionRowBuilder().addComponents(transInput),
    new ActionRowBuilder().addComponents(claimRoleInput)
  );

  return modal;
}

export const buildBannersModal = buildTicketBannersModal;

/**
 * Build Support Text & Guidelines Modal (Page 3)
 */
export function buildSupportTextModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_text_${botId}`)
    .setTitle('Ticket Guidelines & Welcome');

  const titleInput = new TextInputBuilder()
    .setCustomId('panelTitle')
    .setLabel('Support Panel Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Support')
    .setRequired(false);
  if (cust.panelTitle) titleInput.setValue(cust.panelTitle);

  const descInput = new TextInputBuilder()
    .setCustomId('panelDescription')
    .setLabel('Support Panel Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('If you require support, open a ticket below...')
    .setRequired(false);
  if (cust.panelDescription) descInput.setValue(cust.panelDescription);

  const defaultWelcome = `Welcome {user} to support! A staff member will assist you shortly.\nPlease provide your Roblox username and detail your inquiry below.`;
  const openMsgInput = new TextInputBuilder()
    .setCustomId('ticketOpenMessage')
    .setLabel('Inside-Ticket Welcome Message')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter inside-ticket welcome message (supports {user})...')
    .setRequired(false);
  openMsgInput.setValue(cust.ticketOpenMessage || defaultWelcome);

  const rulesLabelInput = new TextInputBuilder()
    .setCustomId('rulesButtonLabel')
    .setLabel('Rules Button Name (blue button on panel)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Rules')
    .setRequired(false);
  if (cust.rulesButtonLabel) rulesLabelInput.setValue(cust.rulesButtonLabel);

  const rulesDescInput = new TextInputBuilder()
    .setCustomId('rulesDescription')
    .setLabel('Rules Content (shown when Rules is clicked)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Read and follow all community and roleplay rules before opening a ticket...')
    .setRequired(false);
  if (cust.rulesDescription) rulesDescInput.setValue(cust.rulesDescription);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(rulesLabelInput),
    new ActionRowBuilder().addComponents(rulesDescInput),
    new ActionRowBuilder().addComponents(openMsgInput)
  );

  return modal;
}

/**
 * Build Session Channels & Roles Modal (Page 4)
 */
export function buildSessionChannelsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessionchannels_${botId}`)
    .setTitle('Session Channels & Roles');

  const sChanInput = new TextInputBuilder()
    .setCustomId('sessionChannelId')
    .setLabel('Session Announcements Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where live panel is sent')
    .setRequired(false);
  if (cust.sessionChannelId?.trim()) sChanInput.setValue(cust.sessionChannelId.trim());

  const hostRoleInput = new TextInputBuilder()
    .setCustomId('hostRoleId')
    .setLabel('Session Host Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role permitted to start, vote, and shutdown')
    .setRequired(false);
  if (cust.hostRoleId?.trim()) hostRoleInput.setValue(cust.hostRoleId.trim());

  const notifyRoleInput = new TextInputBuilder()
    .setCustomId('notificationRoleId')
    .setLabel('Session Alert / Notification Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role pinged when session goes live')
    .setRequired(false);
  if (cust.notificationRoleId?.trim()) notifyRoleInput.setValue(cust.notificationRoleId.trim());

  const ingameInput = new TextInputBuilder()
    .setCustomId('ingameVcId')
    .setLabel('In-Game Radio VC ID (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Voice channel ID for active in-game radio')
    .setRequired(false);
  if (cust.ingameVcId?.trim()) ingameInput.setValue(cust.ingameVcId.trim());

  const queueInput = new TextInputBuilder()
    .setCustomId('queueVcId')
    .setLabel('Queue Staging VC ID (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Voice channel ID for queue staging')
    .setRequired(false);
  if (cust.queueVcId?.trim()) queueInput.setValue(cust.queueVcId.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(sChanInput),
    new ActionRowBuilder().addComponents(hostRoleInput),
    new ActionRowBuilder().addComponents(notifyRoleInput),
    new ActionRowBuilder().addComponents(ingameInput),
    new ActionRowBuilder().addComponents(queueInput)
  );

  return modal;
}

/**
 * Build Session Banners Modal (Page 4)
 */
export function buildSessionBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessionbanners_${botId}`)
    .setTitle('Session Banners');

  const topInput = new TextInputBuilder()
    .setCustomId('sessionTopBannerUrl')
    .setLabel('Live Session Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/live_banner.png')
    .setRequired(false);
  if (cust.sessionTopBannerUrl?.trim()) topInput.setValue(cust.sessionTopBannerUrl.trim());

  const voteTopInput = new TextInputBuilder()
    .setCustomId('sessionVoteTopBannerUrl')
    .setLabel('Session Vote Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/vote_top.png')
    .setRequired(false);
  if (cust.sessionVoteTopBannerUrl?.trim()) voteTopInput.setValue(cust.sessionVoteTopBannerUrl.trim());

  const shutInput = new TextInputBuilder()
    .setCustomId('sessionShutdownBannerUrl')
    .setLabel('Session Concluded Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/shutdown_banner.png')
    .setRequired(false);
  if (cust.sessionShutdownBannerUrl?.trim()) shutInput.setValue(cust.sessionShutdownBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('sessionBottomBannerUrl')
    .setLabel('Session Bottom Strip Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/bottom_strip.png')
    .setRequired(false);
  if (cust.sessionBottomBannerUrl?.trim()) bottomInput.setValue(cust.sessionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topInput),
    new ActionRowBuilder().addComponents(voteTopInput),
    new ActionRowBuilder().addComponents(shutInput),
    new ActionRowBuilder().addComponents(bottomInput)
  );

  return modal;
}

/**
 * Build Session Announcement Text Modal (Page 4)
 */
export function buildSessionTextModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessiontext_${botId}`)
    .setTitle('Session Announcement Text');

  const startTitleInput = new TextInputBuilder()
    .setCustomId('sessionStartTitle')
    .setLabel('Session Startup Headline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('SESSION STARTING')
    .setRequired(false);
  if (cust.sessionStartTitle) startTitleInput.setValue(cust.sessionStartTitle);

  const startDescInput = new TextInputBuilder()
    .setCustomId('sessionStartDesc')
    .setLabel('Session Startup Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('The session vote has succeeded and operations are commencing.')
    .setRequired(false);
  if (cust.sessionStartDesc) startDescInput.setValue(cust.sessionStartDesc);

  const shutTitleInput = new TextInputBuilder()
    .setCustomId('sessionShutdownTitle')
    .setLabel('Session Concluded Headline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('SESSION CONCLUDED')
    .setRequired(false);
  if (cust.sessionShutdownTitle) shutTitleInput.setValue(cust.sessionShutdownTitle);

  const shutDescInput = new TextInputBuilder()
    .setCustomId('sessionShutdownDesc')
    .setLabel('Session Concluded Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('The session has concluded. Thank you for attending today.')
    .setRequired(false);
  if (cust.sessionShutdownDesc) shutDescInput.setValue(cust.sessionShutdownDesc);

  modal.addComponents(
    new ActionRowBuilder().addComponents(startTitleInput),
    new ActionRowBuilder().addComponents(startDescInput),
    new ActionRowBuilder().addComponents(shutTitleInput),
    new ActionRowBuilder().addComponents(shutDescInput)
  );

  return modal;
}

/**
 * Build Applications Modal (Page 5)
 */
export function buildAppsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_apps_${botId}`)
    .setTitle('Staff Application Settings');

  const revInput = new TextInputBuilder()
    .setCustomId('reviewChannelId')
    .setLabel('Application Review Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where submitted applications go')
    .setRequired(false);
  if (cust.reviewChannelId?.trim()) revInput.setValue(cust.reviewChannelId.trim());

  const resInput = new TextInputBuilder()
    .setCustomId('resultsChannelId')
    .setLabel('Public Results Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where accept/deny notices post')
    .setRequired(false);
  if (cust.resultsChannelId?.trim()) resInput.setValue(cust.resultsChannelId.trim());

  const ingameInput = new TextInputBuilder()
    .setCustomId('appIngameOpen')
    .setLabel('In-Game Moderator Open? (yes / no)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('yes')
    .setRequired(false);
  ingameInput.setValue(cust.appIngameOpen !== false ? 'yes' : 'no');

  const discordInput = new TextInputBuilder()
    .setCustomId('appDiscordOpen')
    .setLabel('Discord Moderator Open? (yes / no)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('yes')
    .setRequired(false);
  discordInput.setValue(cust.appDiscordOpen !== false ? 'yes' : 'no');

  modal.addComponents(
    new ActionRowBuilder().addComponents(revInput),
    new ActionRowBuilder().addComponents(resInput),
    new ActionRowBuilder().addComponents(ingameInput),
    new ActionRowBuilder().addComponents(discordInput)
  );

  return modal;
}

/**
 * Build In-Game Moderator Questions Modal (Page 5, up to 20 questions)
 */
export function buildIngameQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const defaultQuestions = [
    '1. What is your Roblox username and age?',
    '2. What prior staff or moderation experience do you have in ER:LC?',
    '3. How many hours per week can you actively dedicate to in-game moderation?',
    '4. How do you handle a player performing Random Deathmatch (RDM)?',
    '5. What steps do you take when a user accuses another player of Fail Roleplay?',
    '6. When is it appropriate to freeze an active roleplay scene?',
    '7. How do you respond to a player who disrespects or argues with you in mod call?',
    '8. What evidence do you require before executing a server ban?',
    '9. How do you de-escalate tension between two disputing civs?',
    '10. How would you handle a fellow staff member abusing mod commands?',
    '11. What is your timezone and typical availability?',
    '12. Why should we choose you over other in-game applicant candidates?',
    '13. Describe your understanding of Powergaming and Metagaming.',
    '14. Do you have working recording software for capturing clip evidence?',
    '15. Any additional notes or information for management review?'
  ].join('\n');

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_appquestions_ingame_${botId}`)
    .setTitle('In-Game Mod Questions (1-20)');

  const questionsInput = new TextInputBuilder()
    .setCustomId('ingameQuestions')
    .setLabel('Interview Questions (1 per line, up to 20)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your questions, 1 per line (up to 20)...')
    .setRequired(false);
  questionsInput.setValue(cust.ingameQuestions || defaultQuestions);

  modal.addComponents(new ActionRowBuilder().addComponents(questionsInput));
  return modal;
}

/**
 * Build Discord Moderator Questions Modal (Page 5, up to 20 questions)
 */
export function buildDiscordQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const defaultQuestions = [
    '1. What is your Discord tag, Roblox username, and age?',
    '2. What experience do you have moderating large Discord servers?',
    '3. How would you handle a raid or mass spam attack in public text channels?',
    '4. When is a verbal warning appropriate versus an official warning or mute?',
    '5. How do you handle NSFW or illegal content posted in a general channel?',
    '6. What steps do you take if a user opens a ticket complaining about an unfair mute?',
    '7. How do you handle hate speech or extreme toxicity in Discord voice channels?',
    '8. How many hours daily do you spend monitoring Discord chat activity?',
    '9. How do you address staff members arguing in front of community members?',
    '10. What Discord bot moderation commands are you most familiar with?',
    '11. Why are you interested in becoming a Discord Moderator specifically?',
    '12. What would you do if an unauthorized user attempts to access staff chats?',
    '13. What is your strategy for keeping community chat active and positive?',
    '14. Do you agree to keep all staff discussions strictly confidential?',
    '15. Any closing remarks or credentials for the management team?'
  ].join('\n');

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_appquestions_discord_${botId}`)
    .setTitle('Discord Mod Questions (1-20)');

  const questionsInput = new TextInputBuilder()
    .setCustomId('discordQuestions')
    .setLabel('Interview Questions (1 per line, up to 20)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your questions, 1 per line (up to 20)...')
    .setRequired(false);
  questionsInput.setValue(cust.discordQuestions || defaultQuestions);

  modal.addComponents(new ActionRowBuilder().addComponents(questionsInput));
  return modal;
}

/**
 * Build Application Questionnaire Modal (Page 5 fallback)
 */
export function buildAppQuizModal(botId) {
  return buildIngameQuestionsModal(botId);
}

/**
 * Build Staff Docs Content & Layout Modal (Page 6)
 */
export function buildDocsContentModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docscontent_${botId}`)
    .setTitle('Documentation Content & Layout');

  const titleInput = new TextInputBuilder()
    .setCustomId('staffDocsTitle')
    .setLabel('Documentation Hub Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Official Staff Documentation')
    .setRequired(false);
  if (cust.staffDocsTitle) titleInput.setValue(cust.staffDocsTitle);

  const descInput = new TextInputBuilder()
    .setCustomId('staffDocsDescription')
    .setLabel('Documentation Overview / Welcome Text')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Welcome to the official Staff Documentation directory...')
    .setRequired(false);
  if (cust.staffDocsDescription) descInput.setValue(cust.staffDocsDescription);

  const layoutInput = new TextInputBuilder()
    .setCustomId('staffDocsLayout')
    .setLabel('Layout Style ("select" or "buttons")')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('select')
    .setRequired(false);
  layoutInput.setValue(cust.staffDocsLayout || 'select');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(layoutInput)
  );

  return modal;
}

/**
 * Build Staff Docs Banners Modal (Page 6)
 */
export function buildDocsBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docsbanners_${botId}`)
    .setTitle('Staff Documentation Banners');

  const topInput = new TextInputBuilder()
    .setCustomId('staffDocsTopBannerUrl')
    .setLabel('Top Header Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/docs_top.png')
    .setRequired(false);
  if (cust.staffDocsTopBannerUrl?.trim()) topInput.setValue(cust.staffDocsTopBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('staffDocsBottomBannerUrl')
    .setLabel('Bottom Accent Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/docs_bottom.png')
    .setRequired(false);
  if (cust.staffDocsBottomBannerUrl?.trim()) bottomInput.setValue(cust.staffDocsBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topInput),
    new ActionRowBuilder().addComponents(bottomInput)
  );

  return modal;
}

/**
 * Build Staff Docs Hub Modal (Page 6)
 */
export function buildDocsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docs_${botId}`)
    .setTitle('Staff Documentation Channel');

  const chanInput = new TextInputBuilder()
    .setCustomId('staffDocsChannelId')
    .setLabel('Staff Docs Hub Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where documentation is posted')
    .setRequired(false);
  if (cust.staffDocsChannelId?.trim()) chanInput.setValue(cust.staffDocsChannelId.trim());

  modal.addComponents(new ActionRowBuilder().addComponents(chanInput));
  return modal;
}

/**
 * Build Promotion Config Modal (Page 7)
 */
export function buildPromotionConfigModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_promotion_${botId}`)
    .setTitle('Staff Promotion Settings');

  const chanInput = new TextInputBuilder()
    .setCustomId('promotionsChannelId')
    .setLabel('Promotions Announcement Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where rank promotions post')
    .setRequired(false);
  if (cust.promotionsChannelId?.trim()) chanInput.setValue(cust.promotionsChannelId.trim());

  const roleInput = new TextInputBuilder()
    .setCustomId('promotionStaffRoleId')
    .setLabel('Allowed Promoters Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role allowed to run /promote')
    .setRequired(false);
  if (cust.promotionStaffRoleId?.trim()) roleInput.setValue(cust.promotionStaffRoleId.trim());

  const topBannerInput = new TextInputBuilder()
    .setCustomId('promotionsBannerUrl')
    .setLabel('Promotion Top Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/promotion_banner.png')
    .setRequired(false);
  if (cust.promotionsBannerUrl?.trim()) topBannerInput.setValue(cust.promotionsBannerUrl.trim());

  const bottomBannerInput = new TextInputBuilder()
    .setCustomId('promotionBottomBannerUrl')
    .setLabel('Promotion Bottom Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/promotion_bottom.png')
    .setRequired(false);
  if (cust.promotionBottomBannerUrl?.trim()) bottomBannerInput.setValue(cust.promotionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(roleInput),
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(bottomBannerInput)
  );

  return modal;
}

/**
 * Build Infraction Config Modal (Page 7)
 */
export function buildInfractionConfigModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_infraction_${botId}`)
    .setTitle('Staff Infraction Settings');

  const chanInput = new TextInputBuilder()
    .setCustomId('infractionsChannelId')
    .setLabel('Infractions Announcement Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where infractions post')
    .setRequired(false);
  if (cust.infractionsChannelId?.trim()) chanInput.setValue(cust.infractionsChannelId.trim());

  const roleInput = new TextInputBuilder()
    .setCustomId('infractionStaffRoleId')
    .setLabel('Allowed Supervisors Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role allowed to run /infract')
    .setRequired(false);
  if (cust.infractionStaffRoleId?.trim()) roleInput.setValue(cust.infractionStaffRoleId.trim());

  const topBannerInput = new TextInputBuilder()
    .setCustomId('infractionsBannerUrl')
    .setLabel('Infraction Top Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/infraction_banner.png')
    .setRequired(false);
  if (cust.infractionsBannerUrl?.trim()) topBannerInput.setValue(cust.infractionsBannerUrl.trim());

  const bottomBannerInput = new TextInputBuilder()
    .setCustomId('infractionBottomBannerUrl')
    .setLabel('Infraction Bottom Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/infraction_bottom.png')
    .setRequired(false);
  if (cust.infractionBottomBannerUrl?.trim()) bottomBannerInput.setValue(cust.infractionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(roleInput),
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(bottomBannerInput)
  );

  return modal;
}

/**
 * Build Staff Role Permission Modal (Page 1)
 */
export function buildStaffRoleModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_staffrole_${botId}`)
    .setTitle('Authorized Staff Role');

  const roleInput = new TextInputBuilder()
    .setCustomId('botStaffRoleId')
    .setLabel('Authorized Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role ID required to use the bot')
    .setRequired(false);
  if (cust.botStaffRoleId?.trim()) roleInput.setValue(cust.botStaffRoleId.trim());

  modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
  return modal;
}

/**
 * Build AI API Key Modal (Page 8)
 */
export function buildAiKeyModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_aikey_${botId}`)
    .setTitle('Connect AI Assistant Key');

  const provInput = new TextInputBuilder()
    .setCustomId('aiProvider')
    .setLabel('Provider (openrouter or openai)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('openrouter')
    .setRequired(true);
  provInput.setValue(cust.aiProvider || bot?.aiProvider || 'openrouter');

  const keyInput = new TextInputBuilder()
    .setCustomId('aiApiKey')
    .setLabel('API Key')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your OpenRouter or OpenAI API Key')
    .setRequired(true);
  if (cust.aiApiKey || bot?.aiApiKey) keyInput.setValue(cust.aiApiKey || bot.aiApiKey);

  modal.addComponents(
    new ActionRowBuilder().addComponents(provInput),
    new ActionRowBuilder().addComponents(keyInput)
  );

  return modal;
}

/**
 * Build Ask AI Modal (Page 8)
 */
export function buildAskAiModal(botId) {
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_askai_${botId}`)
    .setTitle('Ask AI Assistant');

  const promptInput = new TextInputBuilder()
    .setCustomId('prompt')
    .setLabel('What would you like the AI to configure?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g. Remove rules in ticket panel, set session channel to #sessions...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(promptInput));
  return modal;
}

/**
 * Build Welcome System Modal
 */
export function buildWelcomeModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_welcome_${botId}`)
    .setTitle('Welcome Settings');

  const channelInput = new TextInputBuilder()
    .setCustomId('welcomeChannelId')
    .setLabel('Welcome Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste welcome channel ID')
    .setRequired(false);
  if (cust.welcomeChannelId?.trim()) channelInput.setValue(cust.welcomeChannelId.trim());

  const bannerInput = new TextInputBuilder()
    .setCustomId('welcomeBannerUrl')
    .setLabel('Welcome Card Banner Image URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://... image link')
    .setRequired(false);
  if (cust.welcomeBannerUrl?.trim()) bannerInput.setValue(cust.welcomeBannerUrl.trim());

  const textInput = new TextInputBuilder()
    .setCustomId('welcomeText')
    .setLabel('Welcome Message Text')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Welcome to {server}, {user}! Enjoy your stay.')
    .setRequired(false);
  if (cust.welcomeText?.trim()) textInput.setValue(cust.welcomeText.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(channelInput),
    new ActionRowBuilder().addComponents(bannerInput),
    new ActionRowBuilder().addComponents(textInput)
  );

  return modal;
}


/**
 * Build Initial Setup Modal
 */
export function buildInitialSetupModal(botId) {
  const bot = getBotInstance(botId);
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_initial_setup_${botId}`)
    .setTitle('Mavely Credentials');

  const tokenInput = new TextInputBuilder()
    .setCustomId('discord_token')
    .setLabel('Discord Bot Token (Required)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Paste your Discord Bot Token')
    .setRequired(true);
  if (bot?.token && bot.token.trim().length > 0) tokenInput.setValue(bot.token.trim());

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('erlc_api_key')
    .setLabel('ER:LC Server API Key (Required)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your ER:LC Server API Key')
    .setRequired(true);
  if (bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0) apiKeyInput.setValue(bot.erlcApiKey.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(tokenInput),
    new ActionRowBuilder().addComponents(apiKeyInput)
  );

  return modal;
}

/**
 * Build Message Quota Modal
 */
export function buildMessageQuotaModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_quota_${botId}`)
    .setTitle('Staff Message Quota');

  const targetInput = new TextInputBuilder()
    .setCustomId('quotaRequirement')
    .setLabel('Weekly Messages Required')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. 100')
    .setValue(cust.quotaRequirement || '100')
    .setRequired(true);

  const chanInput = new TextInputBuilder()
    .setCustomId('quotaChannelId')
    .setLabel('Quota Tracking Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where quotas post')
    .setValue(cust.quotaChannelId || '')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(targetInput),
    new ActionRowBuilder().addComponents(chanInput)
  );

  return modal;
}

/**
 * Build Forums Modal
 */
export function buildForumsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_forums_${botId}`)
    .setTitle('Community Forums Setup');

  const chanInput = new TextInputBuilder()
    .setCustomId('forumChannelId')
    .setLabel('Forum Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID for community forums')
    .setValue(cust.forumChannelId || '')
    .setRequired(false);

  modal.addComponents(new ActionRowBuilder().addComponents(chanInput));
  return modal;
}

/**
 * Build Daily Questions Modal
 */
export function buildDailyQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_daily_q_${botId}`)
    .setTitle('Daily Questions Setup');

  const chanInput = new TextInputBuilder()
    .setCustomId('dailyQuestionsChannelId')
    .setLabel('Daily Questions Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where questions post')
    .setValue(cust.dailyQuestionsChannelId || '')
    .setRequired(false);

  const timeInput = new TextInputBuilder()
    .setCustomId('dailyQuestionsTime')
    .setLabel('Post Schedule Time')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. 12:00 PM EST')
    .setValue(cust.dailyQuestionsTime || '12:00 PM')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(timeInput)
  );

  return modal;
}
