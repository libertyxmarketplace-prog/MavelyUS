import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AttachmentBuilder } from 'discord.js';
import { getBotInstance, getBotInstanceForGuild } from './botManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_BANNER_PATH = path.join(__dirname, 'assets', 'bottom-banner.png');
const CONFIG_HEADER_PATH = path.join(__dirname, 'assets', 'config-header.png');

/**
 * Returns top header banner information for /config
 */
export function getConfigHeaderBanner() {
  if (fs.existsSync(CONFIG_HEADER_PATH)) {
    return {
      mediaUrl: 'attachment://config-header.png',
      attachment: new AttachmentBuilder(CONFIG_HEADER_PATH, { name: 'config-header.png' })
    };
  }
  return { mediaUrl: null, attachment: null };
}

/**
 * Returns bottom banner information for V2 components
 */
export function getPanelBottomBanner(customUrl = null) {
  if (customUrl && customUrl.trim() !== '' && !customUrl.includes('ex=')) {
    return {
      mediaUrl: customUrl.trim(),
      attachment: null
    };
  }

  if (fs.existsSync(LOCAL_BANNER_PATH)) {
    return {
      mediaUrl: 'attachment://bottom-banner.png',
      attachment: new AttachmentBuilder(LOCAL_BANNER_PATH, { name: 'bottom-banner.png' })
    };
  }

  return { mediaUrl: null, attachment: null };
}

/**
 * Builds the interactive V2 Panel Menu
 * @param {object} options
 * @param {string} options.targetChannelId - ID of channel where panels will be dispatched
 * @param {string} [options.statusMessage] - Optional status message banner (e.g. "Ticket Panel Dispatched")
 * @param {string} [options.statusType] - "success" | "error" | "info"
 * @param {boolean} [options.includeAttachment=true] - Whether to attach file (needed on first reply)
 * @param {string} [options.guildName] - Discord server name
 * @param {object} [options.customizations] - Customizations from bot instance
 */
export function buildPanelMenuPayload({
  targetChannelId = null,
  guildName = null,
  statusMessage = null,
  statusType = 'success',
  includeAttachment = true,
  customizations = null
} = {}) {
  const containerComponents = [];
  const files = [];

  const titleName = guildName || customizations?.serverName || 'Server';

  // Header Title strictly featuring ONLY the requested custom emoji:
  // # <:cheers:1552548989172195399> ・ <Server Name> Panel Menu
  let headerContent = [
    `# <:cheers:1552548989172195399> ・ ${titleName} Panel Menu`,
    `> Select an operational module below to dispatch its interactive panel into your designated channel.`
  ].join('\n');

  if (statusMessage) {
    headerContent += `\n\n> **Notice:** ${statusMessage}`;
  }

  containerComponents.push({
    type: 10,
    content: headerContent
  });

  // Divider
  containerComponents.push({ type: 14, divider: true, spacing: 1 });

  // Panel Dispatch Select Menu (Strictly clean, zero miscellaneous emojis)
  const chanSuffix = targetChannelId || 'current';
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `panel_menu_select_${chanSuffix}`,
        placeholder: 'Select a panel to deploy...',
        options: [
          {
            label: 'Ticket Support Desk',
            value: 'dispatch_ticket',
            description: 'Deploy support tickets center with category routing'
          },
          {
            label: 'ER:LC Session Panel',
            value: 'dispatch_session',
            description: 'Deploy live server status and session management controls'
          },
          {
            label: 'Staff Documentation Hub',
            value: 'dispatch_staffdocs',
            description: 'Deploy staff rules, handbooks and documentation directory'
          },
          {
            label: 'Staff Application Desk',
            value: 'dispatch_application',
            description: 'Deploy official staff team recruitment questionnaire'
          },
          {
            label: 'Department Information',
            value: 'dispatch_department',
            description: 'Deploy department roster and guidelines panel'
          },
          {
            label: 'Ask AI Assistant Desk',
            value: 'dispatch_askai',
            description: 'Deploy automated AI community support query desk'
          }
        ]
      }
    ]
  });

  // Destination Channel Selector (Direct channel picker)
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 8,
        custom_id: `panel_menu_chan_pick_${chanSuffix}`,
        placeholder: 'Change destination channel (optional)...',
        channel_types: [0, 5]
      }
    ]
  });

  // Quick Action Buttons (Clean, zero miscellaneous emojis)
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        label: 'Open /config',
        custom_id: `panel_menu_btn_config`
      },
      {
        type: 2,
        style: 2,
        label: 'Refresh',
        custom_id: `panel_menu_btn_refresh_${chanSuffix}`
      }
    ]
  });



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
