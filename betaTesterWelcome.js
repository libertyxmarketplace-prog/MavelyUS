import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_BANNER_PATH = path.join(__dirname, 'assets', 'bottom-banner.png');

/**
 * Builds the official Welcome & Private Beta Tester V2 Container payload
 * @param {object} options
 * @param {string} [options.userId] - Optional member ID to mention
 * @param {string} [options.serverName] - Server name
 */
export function buildBetaTesterWelcomePayload({ userId = null, serverName = 'LIBERTX' } = {}) {
  const containerComponents = [];
  const files = [];

  const mention = userId ? `<@${userId}>` : 'there';

  // 1. Header with custom Logo emoji (no dot) and sub-text
  containerComponents.push({
    type: 10,
    content: [
      `# <:Logo:1552544997612589056> Welcome to ${serverName}`,
      userId
        ? `-# Thank you for joining ${mention}! Exclusive private beta testing program`
        : '-# Exclusive private beta testing program'
    ].join('\n')
  });

  // Top Divider
  containerComponents.push({ type: 14, divider: true, spacing: 1 });

  // 2. Structured Content (Balanced quotes & clean text)
  containerComponents.push({
    type: 10,
    content: [
      `> We are actively onboarding private beta testers to help test and polish our new Discord bot and automated systems before public release.`,
      `> In exchange for your time, active feedback, and bug reports, you will receive **3 Months of Free Premium**.`,
      ``,
      `### Testing Checklist`,
      `• **Buttons & Select Menus** — Test tickets, staff docs, commands, and menus to ensure they respond quickly without freezing.`,
      `• **Bugs & Permissions** — Look for broken text, missing bot permissions, infinite loading, or unsent messages.`,
      `• **Design & Layout** — Check if embeds, colors, fonts, and layouts look clean or need a remodel.`,
      `• **Suggestions & Feedback** — Tell us what felt confusing, what features are missing, or what we should add next.`,
      ``,
      `> ### How to Join`,
      `> **1.** Click **Invite Bot** below to add the bot to your private test server.`,
      `> **2.** Open a ticket in <#1552531450211991552> to claim your tester role and activate your **3-Month Premium**.`
    ].join('\n')
  });

  // Divider line directly under "Open a ticket in ... to claim your tester role and activate your 3-Month Premium."
  containerComponents.push({ type: 14, divider: true, spacing: 1 });

  // 3. Action Row with Buttons
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 5, // Link button
        label: 'Invite Bot',
        url: 'https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&integration_type=0&scope=bot'
      },
      {
        type: 2,
        style: 5, // Link button
        label: 'Open Ticket',
        url: 'https://discord.com/channels/1320109891175845988/1552531450211991552'
      },
      {
        type: 2,
        style: 2, // Secondary Pill
        label: '3-Month Premium',
        disabled: true,
        custom_id: 'beta_tester_reward_pill'
      }
    ]
  });

  // 4. Bottom Banner
  if (fs.existsSync(LOCAL_BANNER_PATH)) {
    containerComponents.push({
      type: 12,
      items: [{ media: { url: 'attachment://bottom-banner.png' } }]
    });
    files.push(new AttachmentBuilder(LOCAL_BANNER_PATH, { name: 'bottom-banner.png' }));
  }

  const payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ]
  };

  if (files.length > 0) {
    payload.files = files;
  }

  return payload;
}

/**
 * Builds the official Welcome & Private Beta Tester Embed payload
 * @param {object} options
 * @param {string} [options.userId] - Optional member ID to mention
 * @param {string} [options.serverName] - Server name
 */
export function buildBetaTesterWelcomeEmbed({ userId = null, serverName = 'LIBERTX' } = {}) {
  const mention = userId ? `<@${userId}>` : 'there';
  const files = [];

  const embed = new EmbedBuilder()
    .setColor(0x0a84fd)
    .setTitle(`Welcome to ${serverName}`)
    .setDescription([
      userId
        ? `-# Thank you for joining ${mention}! Exclusive private beta testing program`
        : '-# Exclusive private beta testing program',
      ``,
      `> We are actively onboarding private beta testers to help test and polish our new Discord bot and automated systems before public release.`,
      `> In exchange for your time, active feedback, and bug reports, you will receive **3 Months of Free Premium**.`,
      ``,
      `### Testing Checklist`,
      `• **Buttons & Select Menus** — Test tickets, staff docs, commands, and menus to ensure they respond quickly without freezing.`,
      `• **Bugs & Permissions** — Look for broken text, missing bot permissions, infinite loading, or unsent messages.`,
      `• **Design & Layout** — Check if embeds, colors, fonts, and layouts look clean or need a remodel.`,
      `• **Suggestions & Feedback** — Tell us what felt confusing, what features are missing, or what we should add next.`,
      ``,
      `> ### How to Join`,
      `> **1.** Click **Invite Bot** below to add the bot to your private test server.`,
      `> **2.** Open a ticket in <#1552531450211991552> to claim your tester role and activate your **3-Month Premium**.`
    ].join('\n'));

  if (fs.existsSync(LOCAL_BANNER_PATH)) {
    embed.setImage('attachment://bottom-banner.png');
    files.push(new AttachmentBuilder(LOCAL_BANNER_PATH, { name: 'bottom-banner.png' }));
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Invite Bot')
      .setURL('https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&integration_type=0&scope=bot'),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Open Ticket')
      .setURL('https://discord.com/channels/1320109891175845988/1552531450211991552'),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setLabel('3-Month Premium')
      .setDisabled(true)
      .setCustomId('beta_tester_reward_pill')
  );

  return {
    embeds: [embed],
    components: [row],
    files: files.length > 0 ? files : undefined
  };
}
