import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const LOA_FILE = path.join(DATA_DIR, 'loa_records.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export function loadLoaRecords() {
  return readJsonFile(LOA_FILE, { active: {}, history: {} });
}

export function saveLoaRecords(data) {
  writeJsonFile(LOA_FILE, data);
}

/**
 * Parses user-input duration into milliseconds.
 * Supports "3d", "5 days", "1w", "2 weeks", or direct date formats.
 */
export function parseLoaDuration(input) {
  if (!input) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  const trimmed = input.trim().toLowerCase();

  const dayMatch = trimmed.match(/^(\d+)\s*(d|day|days)$/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000;
  }

  const weekMatch = trimmed.match(/^(\d+)\s*(w|week|weeks)$/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7 * 24 * 60 * 60 * 1000;
  }

  const monthMatch = trimmed.match(/^(\d+)\s*(m|month|months)$/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30 * 24 * 60 * 60 * 1000;
  }

  // Attempt standard date parsing (e.g. "2026-09-28" or "09/28/2026")
  const parsedDate = Date.parse(input);
  if (!isNaN(parsedDate) && parsedDate > Date.now()) {
    return parsedDate - Date.now();
  }

  return 7 * 24 * 60 * 60 * 1000; // Default 7 days if unparseable
}

/**
 * Builds the LOA Submission Card sent to the management review channel (#1548336007311527996).
 */
export function buildLoaSubmissionCard(record) {
  const files = [];
  const bannerPath = path.join(__dirname, 'assets', 'banner_loa.png');
  let topBannerUrl = null;

  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'banner_loa.png' }));
    topBannerUrl = 'attachment://banner_loa.png';
  }

  const containerComponents = [];

  if (topBannerUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBannerUrl
          }
        }
      ]
    });
  }

  const isPending = record.status === 'pending';
  const statusLabel = isPending
    ? 'Awaiting Management Review'
    : record.status === 'approved'
    ? 'Approved'
    : 'Denied';
  const statusStyle = isPending ? 2 : record.status === 'approved' ? 3 : 4;

  containerComponents.push({
    type: 10,
    content:
      `## LIBERTX | Leave of Absence Request\n` +
      `> A staff member has submitted an official Leave of Absence request for management review.\n` +
      `> Staff Member: <@${record.userId}> (\`${record.userTag}\`)`
  });

  containerComponents.push({
    type: 9, // Section
    components: [
      {
        type: 10,
        content: `**Request Status**\n-# Current operational standing of this leave request.`
      }
    ],
    accessory: {
      type: 2,
      style: statusStyle,
      label: statusLabel,
      disabled: true,
      custom_id: 'loa_status_pill'
    }
  });

  const details = [
    `### Leave Schedule & Justification`,
    `> • **Start Date:** <t:${Math.floor(record.startTimestamp / 1000)}:f> (<t:${Math.floor(record.startTimestamp / 1000)}:R>)`,
    `> • **End Date:** <t:${Math.floor(record.endTimestamp / 1000)}:f> (<t:${Math.floor(record.endTimestamp / 1000)}:R>)`,
    `> • **Reason for Absence:** ${record.reason}`,
    ...(record.reviewedBy ? [`> • **Reviewed By:** <@${record.reviewedBy}>`] : []),
    ...(record.notes ? [`> • **Management Notes:** ${record.notes}`] : [])
  ];

  containerComponents.push({
    type: 10,
    content: details.join('\n')
  });

  if (isPending) {
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 3, // Success Green
          label: 'Accept LOA',
          custom_id: `loa_btn_accept_${record.id}`
        },
        {
          type: 2,
          style: 4, // Danger Red
          label: 'Deny LOA',
          custom_id: `loa_btn_deny_${record.id}`
        }
      ]
    });
  } else {
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 2,
          style: statusStyle,
          label: `LOA ${statusLabel}`,
          disabled: true,
          custom_id: 'loa_btn_resolved'
        }
      ]
    });
  }

  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Administration • Leave Management System`
  });

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };
}

/**
 * Builds the DM notification sent to the staff member when their LOA is decided.
 */
export function buildLoaStatusDm({ record, status, notes = null }) {
  const files = [];
  const bannerPath = path.join(__dirname, 'assets', 'banner_loa.png');
  let topBannerUrl = null;

  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'banner_loa.png' }));
    topBannerUrl = 'attachment://banner_loa.png';
  }

  const isApproved = status === 'approved';
  const containerComponents = [];

  if (topBannerUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBannerUrl
          }
        }
      ]
    });
  }

  const content = isApproved
    ? `## Leave of Absence Approved\n` +
      `> Your requested Leave of Absence has been **APPROVED** by Staff Management.\n\n` +
      `### Scheduled Term\n` +
      `> • **Start:** <t:${Math.floor(record.startTimestamp / 1000)}:f>\n` +
      `> • **Return Date:** <t:${Math.floor(record.endTimestamp / 1000)}:f> (<t:${Math.floor(record.endTimestamp / 1000)}:R>)\n` +
      `> • **Nickname:** Your server nickname has been updated with the \`𝖫𝖮𝖠 |\` prefix.\n\n` +
      `### Return Protocol\n` +
      `> When your scheduled leave concludes, the bot will automatically revert your server nickname and notify you. If you need to extend your leave, please submit a renewal request prior to expiration.`
    : `## Leave of Absence Denied\n` +
      `> Your requested Leave of Absence has been **DENIED** by Staff Management.\n\n` +
      `### Review Notice\n` +
      `> • **Reason / Feedback:** ${notes || 'Reason not specified by management.'}\n` +
      `> • **Reviewed By:** <@${record.reviewedBy}>\n\n` +
      `If you have questions regarding this decision, please speak directly with a member of Staff Management.`;

  containerComponents.push({
    type: 10,
    content
  });

  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Management • Official Status Notification`
  });

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };
}

/**
 * Builds the DM sent to a staff member when their LOA ends naturally.
 */
export function buildLoaExpiredDm(record) {
  const files = [];
  const bannerPath = path.join(__dirname, 'assets', 'banner_loa.png');
  let topBannerUrl = null;

  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'banner_loa.png' }));
    topBannerUrl = 'attachment://banner_loa.png';
  }

  const containerComponents = [];

  if (topBannerUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBannerUrl
          }
        }
      ]
    });
  }

  containerComponents.push({
    type: 10,
    content:
      `## Leave of Absence Concluded\n` +
      `> Your scheduled Leave of Absence in **LIBERTX** has officially ended.\n\n` +
      `### Return to Active Service\n` +
      `> • **Nickname:** Your server nickname has been restored to normal.\n` +
      `> • **Activity Requirements:** You are now expected to resume full moderation activity and attendance at official sessions.\n\n` +
      `If you require an extension or need to renew your leave, please submit a new request via \`-loa\`. Welcome back to active service!`
  });

  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Administration • Leave of Absence System`
  });

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };
}

/**
 * Checks all active LOAs and automatically reverts nicknames and notifies users upon expiration.
 */
export async function checkAndExpireLoas(client) {
  const store = loadLoaRecords();
  const now = Date.now();
  let changed = false;

  for (const [loaId, record] of Object.entries(store.active || {})) {
    if (now >= record.endTimestamp) {
      try {
        const guild = client.guilds.cache.get(record.guildId) ||
          await client.guilds.fetch(record.guildId).catch(() => null);

        if (guild) {
          const member = await guild.members.fetch(record.userId).catch(() => null);
          if (member) {
            // Revert nickname to original
            const cleanNick = record.originalNickname || member.user.username;
            await member.setNickname(cleanNick).catch(err => {
              console.warn(`[LOA Expiration] Could not revert nickname for ${member.user.tag}:`, err.message);
            });

            // Send expiration notification DM
            const dmPayload = buildLoaExpiredDm(record);
            await member.send(dmPayload).catch(() => null);
            console.log(`[LOA Expiration] Expired LOA for ${member.user.tag} and reverted nickname.`);
          }
        }
      } catch (err) {
        console.error(`[LOA Expiration] Error expiring LOA ${loaId}:`, err);
      }

      // Move from active to history
      record.status = 'expired';
      record.expiredAt = now;
      if (!store.history) store.history = {};
      store.history[loaId] = record;
      delete store.active[loaId];
      changed = true;
    }
  }

  if (changed) {
    saveLoaRecords(store);
  }
}
