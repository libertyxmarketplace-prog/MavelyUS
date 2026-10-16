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

function getBottomBannerAttachment(customUrl = null) {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return {
      url: customUrl.trim(),
      attachment: null
    };
  }
  return {
    url: null,
    attachment: null
  };
}

/**
 * Builds the Promotion Announcement card matching the Application Results V2 styling.
 */
export function buildPromotionCard({ user, newRank, oldRank = null, reason = null, promotedBy, role = null, bannerUrl = null }) {
  const files = [];
  let topBannerUrl = bannerUrl?.trim() || null;

  // Sanitize rank label so buttons and pills NEVER display numeric IDs or mention tokens
  let cleanRank = (role ? role.name : newRank) || 'Promoted Staff';
  cleanRank = cleanRank.replace(/<@&?(\d+)>/g, (m, id) => (role && role.id === id ? role.name : '')).trim();
  if (/^\d{17,20}$/.test(cleanRank)) {
    cleanRank = role ? role.name : 'Promoted Staff';
  }
  if (!cleanRank) cleanRank = role ? role.name : 'Promoted Staff';

  let cleanOldRank = oldRank;
  if (cleanOldRank) {
    cleanOldRank = cleanOldRank.replace(/<@&?(\d+)>/g, '').trim();
    if (/^\d{17,20}$/.test(cleanOldRank)) cleanOldRank = null;
  }

  const containerComponents = [];

  // 1. Top Banner
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

  // 2. Title & User Mention
  containerComponents.push({
    type: 10,
    content:
      `## LIBERTX | Staff Promotion\n` +
      `> Please join us in congratulating our staff member on their official rank promotion!\n` +
      `> Staff Member: <@${user.id}> (\`${user.tag || user.username}\`)`
  });

  // 3. Section with New Rank Pill (using cleanRank)
  containerComponents.push({
    type: 9, // Section
    components: [
      {
        type: 10,
        content: `**New Position / Rank**\n-# Official rank advancement within LIBERTX.`
      }
    ],
    accessory: {
      type: 2,
      style: 3, // Success Green Pill
      label: cleanRank.slice(0, 80),
      disabled: true,
      custom_id: 'promo_rank_pill'
    }
  });

  // 4. Details
  const details = [
    `### Advancement Details`,
    ...(cleanOldRank ? [`> • **Previous Rank:** ${cleanOldRank}`] : []),
    `> • **Promoted To:** ${role ? `<@&${role.id}> (${cleanRank})` : `**${cleanRank}**`}`,
    `> • **Authorized By:** <@${promotedBy.id}>`,
    `> • **Date:** <t:${Math.floor(Date.now() / 1000)}:f>`,
    ...(reason ? [`> • **Reason / Merits:** ${reason}`] : []),
    `\n### Management Notice`,
    `> Thank you for your continued dedication, active service, and professional conduct. Keep up the exceptional work representing LIBERTX!`
  ];

  containerComponents.push({
    type: 10,
    content: details.join('\n')
  });

  // 5. Action Row with visual status buttons (using cleanRank)
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 3, // Success Green
        label: 'Promotion Approved',
        disabled: true,
        custom_id: 'promo_status_btn'
      },
      {
        type: 2,
        style: 2, // Secondary Gray
        label: cleanRank.slice(0, 80),
        disabled: true,
        custom_id: 'promo_role_btn'
      }
    ]
  });

  // 6. Micro Footer
  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Administration • Official Promotion Notification`
  });

  const bottomBanner = getBottomBannerAttachment();
  if (bottomBanner.attachment) {
    files.push(bottomBanner.attachment);
  }

  if (bottomBanner.url) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: bottomBanner.url
          }
        }
      ]
    });
  }

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
 * Builds the Infraction Announcement card matching the Application Results V2 styling.
 */
export function buildInfractionCard({ user, type, reason, proof = null, issuedBy, bannerUrl = null }) {
  const files = [];
  let topBannerUrl = bannerUrl?.trim() || null;

  const containerComponents = [];

  // 1. Top Banner
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

  // 2. Title & Staff Mention
  containerComponents.push({
    type: 10,
    content:
      `## LIBERTX | Staff Infraction Notice\n` +
      `> An official disciplinary action has been issued by Staff Management.\n` +
      `> Staff Member: <@${user.id}> (\`${user.tag || user.username}\`)`
  });

  // 3. Section with Infraction Level Pill
  const isSevere = type.toLowerCase().includes('strike') || type.toLowerCase().includes('demot');
  containerComponents.push({
    type: 9, // Section
    components: [
      {
        type: 10,
        content: `**Disciplinary Classification**\n-# Recorded infraction level under the progressive disciplinary policy.`
      }
    ],
    accessory: {
      type: 2,
      style: isSevere ? 4 : 2, // Danger Red for strikes, Secondary Gray for warnings
      label: type,
      disabled: true,
      custom_id: 'infract_level_pill'
    }
  });

  // 4. Details
  const details = [
    `### Infraction Specifications`,
    `> • **Classification:** **${type}**`,
    `> • **Issued By:** <@${issuedBy.id}>`,
    `> • **Date Issued:** <t:${Math.floor(Date.now() / 1000)}:f>`,
    `> • **Violation Reason:** ${reason}`,
    ...(proof ? [`> • **Evidence / Case Documentation:** [View Case Clip](${proof})`] : []),
    `\n### Disciplinary Guidance`,
    `> Active strikes remain recorded on your staff profile for **45 consecutive days** from the issuance date. Continued infractions will trigger immediate escalation up to and including termination from the staff team.`
  ];

  containerComponents.push({
    type: 10,
    content: details.join('\n')
  });

  // 5. Action Row with status button
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: isSevere ? 4 : 2,
        label: `${type} Logged`,
        disabled: true,
        custom_id: 'infract_status_btn'
      }
    ]
  });

  // 6. Micro Footer
  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Management • Official Disciplinary Documentation`
  });

  const bottomBanner = getBottomBannerAttachment();
  if (bottomBanner.attachment) {
    files.push(bottomBanner.attachment);
  }

  if (bottomBanner.url) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: bottomBanner.url
          }
        }
      ]
    });
  }

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
