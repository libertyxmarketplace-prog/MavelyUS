import fs from 'fs';

const content = fs.readFileSync('configPanel.js', 'utf8');

const marker = '// ══════════════════════════════════════════════════════════════════════';
const modalMarker = '// MODAL BUILDERS';

const lines = content.split('\n');
let modalStartLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('MODAL BUILDERS')) {
    modalStartLine = i - 1; // including the decorative bar
    break;
  }
}

if (modalStartLine === -1) {
  throw new Error('Could not find MODAL BUILDERS in configPanel.js');
}

const modalBuildersCode = lines.slice(modalStartLine).join('\n');

const newHeaderCode = `import {
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAVELY_LOGO_PATH = path.join(__dirname, 'assets', 'mavely_logo.png');

export const TOTAL_PAGES = 8;

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
  { id: 1, tab: 'Permissions', title: 'PERMISSIONS & ACCESS' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES' },
  { id: 3, tab: 'Appearance', title: 'TICKET APPEARANCE' },
  { id: 4, tab: 'Sessions', title: 'LIVE SESSIONS' },
  { id: 5, tab: 'Applications', title: 'STAFF APPLICATIONS' },
  { id: 6, tab: 'Docs', title: 'STAFF DOCUMENTATION' },
  { id: 7, tab: 'Community', title: 'COMMUNITY & TRACKING' },
  { id: 8, tab: 'AI', title: 'MAVELY AI ASSISTANT' }
];

function maskSecret(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 'Not Set';
  if (str.length <= 8) return '********';
  return \`\${str.slice(0, 4)}...\${str.slice(-4)}\`;
}

function statusText(isConfigured, yesLabel = 'Configured', noLabel = 'Not Configured') {
  return isConfigured ? yesLabel : noLabel;
}

function chanRef(id) {
  return (id && String(id).trim()) ? \`<#\${String(id).trim()}>\` : 'Not Configured';
}

function roleRef(id) {
  return (id && String(id).trim()) ? \`<@&\${String(id).trim()}>\` : 'Not Configured';
}

/**
 * Build Initial Setup Gate payload (shown before config when credentials are missing)
 */
export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_logo.png' })
    .setTitle('Initial Setup')
    .setDescription(
      '> Connect your Discord bot token and ER:LC server key to activate your instance.\\n\\n' +
      '**Credentials**\\n' +
      \`Bot Token: \${hasToken ? 'Connected' : 'Not Configured'}\\n\` +
      \`ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\`
    )
    .setThumbnail('attachment://mavely_logo.png')
    .setFooter({ text: 'Mavely • Initial Setup' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_skip_setup_\${botId}\`)
      .setLabel('Open Config Panel')
      .setStyle(ButtonStyle.Secondary)
  );

  const files = [];
  if (fs.existsSync(MAVELY_LOGO_PATH)) {
    files.push(new AttachmentBuilder(MAVELY_LOGO_PATH, { name: 'mavely_logo.png' }));
  }

  return {
    embeds: [embed],
    components: [row],
    files,
    flags: 64
  };
}

/**
 * Shared Modules Dropdown Menu
 */
function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(\`cfg_menu_modules_\${botId}\`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Permissions & Access', value: 'nav_page_1', description: 'Staff and administrator permissions' },
        { label: 'Ticket Categories', value: 'nav_page_2', description: 'Support desk categories and claiming' },
        { label: 'Ticket Appearance', value: 'nav_page_3', description: 'Panel headline, rules button, and banners' },
        { label: 'Live Sessions', value: 'nav_page_4', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_5', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_6', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_7', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_8', description: 'Automated configuration with AI' }
      ])
  );
}

/**
 * Shared Navigation Button Row
 */
export function buildNavButtonRow(botId, activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_prev_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.LEFT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage <= 1),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_page_\${botId}_\${activePage}\`)
      .setLabel(\`\${activePage} / \${TOTAL_PAGES}\`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_next_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.RIGHT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage >= TOTAL_PAGES),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_refresh_\${botId}_\${activePage}\`)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_helper_\${botId}\`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );
}

/**
 * Build interactive /config control panel payload with native Discord select menus
 */
export function buildConfigPanelPayload(botId, page = 1, includeAttachment = true) {
  const bot = getBotInstance(botId);
  if (!bot) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_logo.png' })
      .setThumbnail('attachment://mavely_logo.png')
      .setTitle('Bot Not Found')
      .setDescription(\`> No bot instance found matching ID **\${botId}**.\\n\\nPlease verify your Bot ID or run /config again.\`);
    return {
      embeds: [errEmbed],
      components: [],
      files: fs.existsSync(MAVELY_LOGO_PATH) ? [new AttachmentBuilder(MAVELY_LOGO_PATH, { name: 'mavely_logo.png' })] : [],
      flags: 64
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  const rows = [];
  const files = [];

  if (fs.existsSync(MAVELY_LOGO_PATH)) {
    files.push(new AttachmentBuilder(MAVELY_LOGO_PATH, { name: 'mavely_logo.png' }));
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_logo.png' })
    .setThumbnail('attachment://mavely_logo.png')
    .setFooter({ text: \`Mavely • Page \${activePage} of \${TOTAL_PAGES}\` });

  switch (activePage) {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: PERMISSIONS & ACCESS
    // ══════════════════════════════════════════════════════════════════════
    case 1: {
      const staffDisplay = cust.botStaffRoleId ? \`<@&\${cust.botStaffRoleId}>\` : 'Not Configured';
      const adminRole = cust.adminRoleId || (Array.isArray(cust.staffRoleIds) && cust.staffRoleIds[0]) || '';
      const adminDisplay = adminRole ? \`<@&\${adminRole}>\` : 'Not Configured';

      embed.setDescription(
        '> Manage server access and authority levels for your community. Select roles below to grant permissions.\\n\\n' +
        '**Permissions**\\n' +
        \`Staff Role: \${staffDisplay}\\n\` +
        \`Admin Role: \${adminDisplay}\`
      );

      // Row 1: Staff Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_staff_\${botId}\`)
          .setPlaceholder('Select Staff Role')
      ));

      // Row 2: Admin Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_admin_\${botId}\`)
          .setPlaceholder('Select Admin Role')
      ));

      // Row 3: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 4: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 1));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: TICKET CATEGORIES
    // ══════════════════════════════════════════════════════════════════════
    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const categories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      embed.setDescription(
        '> Support desk configuration and transcript archiving.\\n\\n' +
        '**Ticket Categories**\\n' +
        \`Slot 1: \${categories[0]?.name || 'General Support'}\\n\` +
        \`Slot 2: \${categories[1]?.name || 'High Rank'}\\n\` +
        \`Slot 3: \${categories[2]?.name || 'Player Report'}\\n\` +
        \`Slot 4: \${categories[3]?.name || 'Appeals'}\\n\` +
        \`Slot 5: \${categories[4]?.name || 'Other'}\\n\\n\` +
        '**Transcripts & Claiming**\\n' +
        \`Transcripts Channel: \${chanRef(cust.transcriptsChannelId)}\\n\` +
        \`Claim Role: \${roleRef(cust.ticketClaimRoleId)}\`
      );

      // Row 1: Transcripts Channel (Select text channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_transcripts_\${botId}\`)
          .setPlaceholder('Select Transcripts Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      // Row 2: Ticket Claim Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_claim_\${botId}\`)
          .setPlaceholder('Select Ticket Claim Role')
      ));

      // Row 3: Category Names Option Menu
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_2\`)
          .setPlaceholder('Category Options')
          .addOptions([
            { label: 'Rename Category Slots', value: 'edit_ticket_catnames', description: 'Customize category display names' },
            { label: 'Category Spawn Channels', value: 'edit_ticket_catspawns', description: 'Where tickets are opened' },
            { label: 'Category Alert Roles', value: 'edit_ticket_catpings', description: 'Roles alerted when opened' }
          ])
      ));

      // Row 4: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: TICKET APPEARANCE
    // ══════════════════════════════════════════════════════════════════════
    case 3: {
      embed.setDescription(
        '> Customize ticket panel display, rules button, and banner artwork.\\n\\n' +
        '**Panel Display**\\n' +
        \`Title: \${cust.panelTitle || 'Mavely Support'}\\n\` +
        \`Rules Button: \${cust.showRulesButton !== false ? 'Enabled' : 'Disabled'}\\n\` +
        \`Rules Content: \${cust.rulesDescription ? 'Custom' : 'Standard'}\\n\` +
        \`Greeting Message: \${cust.ticketOpenMessage ? 'Custom' : 'Standard'}\\n\\n\` +
        '**Artwork**\\n' +
        \`Top Banner: \${cust.topBannerUrl ? 'Custom' : 'Default'}\\n\` +
        \`Bottom Accent: \${cust.bottomBannerUrl ? 'Custom' : 'Default'}\`
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_3\`)
          .setPlaceholder('Appearance Settings')
          .addOptions([
            { label: 'Panel Headline Text', value: 'edit_ticket_text', description: 'Customize ticket center title and welcome text' },
            { label: 'Rules & Greeting', value: 'edit_rules_greeting', description: 'Rules button label and guidance modal' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set artwork image links' },
            { label: 'Reset Banners', value: 'reset_banners', description: 'Restore default Mavely graphics' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 3));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: LIVE SESSIONS
    // ══════════════════════════════════════════════════════════════════════
    case 4: {
      embed.setDescription(
        '> Patrol announcements, radio channels, and host roles.\\n\\n' +
        '**Patrol Channels & Roles**\\n' +
        \`Announcement Channel: \${chanRef(cust.sessionChannelId)}\\n\` +
        \`In-Game Radio VC: \${chanRef(cust.ingameVcId)}\\n\` +
        \`Host Role: \${roleRef(cust.hostRoleId)}\\n\` +
        \`Notification Role: \${roleRef(cust.notificationRoleId)}\\n\\n\` +
        '**Connection**\\n' +
        \`Join Code: \${cust.joinCode || 'Not Set'}\\n\` +
        \`ER:LC API: \${bot.erlcApiKey ? 'Connected' : 'Not Set'}\`
      );

      // Row 1: Session Announcement Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_session_\${botId}\`)
          .setPlaceholder('Select Session Announcement Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      // Row 2: Patrol Host Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_host_\${botId}\`)
          .setPlaceholder('Select Patrol Host Role')
      ));

      // Row 3: Notification Ping Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_notif_\${botId}\`)
          .setPlaceholder('Select Notification Ping Role')
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 4));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: STAFF APPLICATIONS
    // ══════════════════════════════════════════════════════════════════════
    case 5: {
      embed.setDescription(
        '> Staff recruitment pipelines and candidate evaluation feeds.\\n\\n' +
        '**Review Feeds**\\n' +
        \`Review Channel: \${chanRef(cust.reviewChannelId)}\\n\` +
        \`Results Feed: \${chanRef(cust.resultsChannelId)}\\n\\n\` +
        '**Pipeline Status**\\n' +
        \`In-Game Moderation: \${cust.appIngameOpen !== false ? 'Open' : 'Closed'}\\n\` +
        \`Discord Moderation: \${cust.appDiscordOpen !== false ? 'Open' : 'Closed'}\`
      );

      // Row 1: Review Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_appreview_\${botId}\`)
          .setPlaceholder('Select Staff Review Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 2: Results Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_appresults_\${botId}\`)
          .setPlaceholder('Select Public Results Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 5));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 6: STAFF DOCUMENTATION
    // ══════════════════════════════════════════════════════════════════════
    case 6: {
      embed.setDescription(
        '> Staff guidelines, handbook, and operational protocols.\\n\\n' +
        '**Documentation Hub**\\n' +
        \`Destination Channel: \${chanRef(cust.staffDocsChannelId)}\\n\` +
        \`Layout Mode: \${cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Select Menu'}\\n\` +
        \`Hub Title: \${cust.staffDocsTitle || 'Staff Documentation'}\`
      );

      // Row 1: Destination Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_staffdocs_\${botId}\`)
          .setPlaceholder('Select Staff Documentation Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_6\`)
          .setPlaceholder('Documentation Settings')
          .addOptions([
            { label: 'Hub Title & Description', value: 'edit_staffdocs_content', description: 'Set headline and intro copy' },
            { label: 'Header & Footer Banners', value: 'edit_staffdocs_banners', description: 'Artwork images' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 6));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 7: COMMUNITY & TRACKING
    // ══════════════════════════════════════════════════════════════════════
    case 7: {
      embed.setDescription(
        '> Disciplinary tracking, rank advancements, and engagement channels.\\n\\n' +
        '**Infractions**\\n' +
        \`Channel: \${chanRef(cust.infractionsChannelId)}\\n\` +
        \`Supervisor Role: \${roleRef(cust.infractionStaffRoleId)}\\n\\n\` +
        '**Promotions**\\n' +
        \`Channel: \${chanRef(cust.promotionsChannelId)}\\n\` +
        \`Promoter Role: \${roleRef(cust.promotionStaffRoleId)}\\n\\n\` +
        '**Community Channels**\\n' +
        \`Forums: \${chanRef(cust.forumChannelId)}\\n\` +
        \`Daily Questions: \${chanRef(cust.dailyQuestionsChannelId)}\`
      );

      // Row 1: Infractions Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_infractions_\${botId}\`)
          .setPlaceholder('Select Infractions Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 2: Promotions Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_promotions_\${botId}\`)
          .setPlaceholder('Select Promotions Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 3: Infraction Supervisor Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_supervisor_\${botId}\`)
          .setPlaceholder('Select Infraction Supervisor Role')
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 7));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 8: MAVELY AI ASSISTANT
    // ══════════════════════════════════════════════════════════════════════
    case 8: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');

      embed.setDescription(
        '> Natural language assistant for instant server configuration and setup.\\n\\n' +
        '**AI Engine**\\n' +
        \`Provider: \${activeAiProv}\\n\` +
        \`Status: \${statusText(hasAiKey, 'Connected', 'Not Connected')}\\n\` +
        \`Model: \${activeModel}\`
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_8\`)
          .setPlaceholder('AI Actions')
          .addOptions([
            { label: 'Ask AI Assistant', value: 'ask_ai', description: 'Describe a configuration change in plain text' },
            { label: 'Connect AI Key', value: 'edit_ai_key', description: 'Connect OpenRouter or OpenAI API key' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 8));
      break;
    }
  }

  const payload = {
    embeds: [embed],
    components: rows,
    flags: 64
  };

  if (files.length > 0) {
    payload.files = files;
  }

  return payload;
}
`;

fs.writeFileSync('configPanel.js', newHeaderCode + '\n' + modalBuildersCode, 'utf8');
console.log('Successfully written configPanel.js');
