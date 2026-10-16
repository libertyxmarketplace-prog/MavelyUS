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

// Active departments displayed on the public department panel (FHP and OCSO only)
export const DEPARTMENTS = [
  {
    id: 'fhp',
    aliases: ['fdot'],
    name: 'Florida Highway Patrol',
    file: 'dept_fhp.png',
    dmBanner: 'dept_fhp.png',
    inviteUrl: 'https://discord.gg/HANcqDBmG',
    emoji: '<:imageremovebgpreview8:1551402839933198378>',
    emojiObj: { id: '1551402839933198378', name: 'imageremovebgpreview8' },
    jurisdiction: 'Statewide Highways & Highway Safety',
    description:
      'Florida Highway Patrol is dedicated to ensuring safety, security, and order across Florida highways and state roadways. Troopers conduct traffic enforcement, accident investigations, commercial vehicle operations, and state-level emergency response.'
  },
  {
    id: 'ocso',
    aliases: ['osco'],
    name: "Orange County Sheriff's Office",
    file: 'dept_ocso.png',
    dmBanner: 'dm_banner_ocso.png',
    inviteUrl: 'https://discord.gg/rJ3q5HGs',
    emoji: '<:Orange_County:1551137313898111036>',
    emojiObj: { id: '1551137313898111036', name: 'Orange_County' },
    jurisdiction: 'Orange County & Unincorporated Areas',
    description:
      'Dedicated to preserving public safety across unincorporated Orange County and surrounding jurisdictions. Deputies perform county patrols, civil processing, tactical response, warrant services, and specialized operations. Join our dedicated law enforcement family today!'
  }
];

// Preserved/inactive departments kept in reserve
export const ARCHIVED_DEPARTMENTS = [
  {
    id: 'opd',
    name: 'Liberty County Police Department',
    file: 'dept_opd.png',
    dmBanner: 'dm_banner_opd.png',
    inviteUrl: 'https://discord.gg/ZH4k9zq3BZ',
    emoji: '<:LibertyCountyPolice:1551137354477994055>',
    emojiObj: { id: '1551137354477994055', name: 'LibertyCountyPolice' },
    jurisdiction: 'Liberty County & Municipal Patrols',
    description:
      'Join the Liberty County Police Department and serve your community with integrity, professionalism, and pride. We are seeking dedicated individuals who are committed to public safety, teamwork, and making a positive impact. Start a rewarding career protecting and serving the citizens of Liberty County. Apply today!'
  },
  {
    id: 'ocfr',
    name: 'Orange County Fire Rescue',
    file: 'dept_ocfr.png',
    dmBanner: 'dm_banner_ocfr.png',
    inviteUrl: 'https://discord.gg/UCqXrvHFqh',
    emoji: '<:Fire_Department:1551137271326179390>',
    emojiObj: { id: '1551137271326179390', name: 'Fire_Department' },
    jurisdiction: 'Countywide Fire Protection & Advanced EMS',
    description:
      'Orange County Fire Rescue is responsible for protecting the lives and property of our community. Dedicated to fire suppression, emergency medical services, technical rescues, and rapid emergency response across the county.'
  }
];

/**
 * Resolves a department from active or archived departments by id or alias.
 */
export function findDepartment(deptId) {
  return (
    DEPARTMENTS.find(d => d.id === deptId || d.aliases?.includes(deptId)) ||
    ARCHIVED_DEPARTMENTS.find(d => d.id === deptId || d.aliases?.includes(deptId))
  );
}

/**
 * Builds the Header Card (Top Banner + Overview)
 */
export function buildHeaderPayload(customConfig = null) {
  const files = [];
  let topBannerMediaUrl = customConfig?.deptBannerUrl?.trim() || null;

  const arrowEmoji = CONFIG.DEPARTMENTS?.ARROW_EMOJI || '<:Right_arrow:1550446417376448593>';
  const overviewList = DEPARTMENTS.map(d => `${arrowEmoji} ${d.emoji} | **${d.name}**`).join('\n');

  const containerComponents = [];

  if (topBannerMediaUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBannerMediaUrl
          }
        }
      ]
    });
  }

  const deptCount = DEPARTMENTS.length;
  containerComponents.push({
    type: 10,
    content:
      `## Departments\n` +
      `LIBERTX currently has a total of ${deptCount} legitimate departments at the moment which serve crucial parts of this community. You can view the variety of departments we have down below.\n\n` +
      overviewList
  });

  const v2Payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };

  const fallbackEmbed = new EmbedBuilder()
    .setColor(0x0a84fd)
    .setTitle('Departments')
    .setDescription(
      `LIBERTX currently has a total of ${deptCount} legitimate departments at the moment which serve crucial parts of this community. You can view the variety of departments we have down below.\n\n` +
      overviewList
    );

  if (topBannerMediaUrl) {
    fallbackEmbed.setImage(topBannerMediaUrl);
  }

  const fallbackPayload = {
    embeds: [fallbackEmbed],
    files
  };

  return { v2Payload, fallbackPayload };
}

/**
 * Builds an individual Department Card (Section with Logo Thumbnail on right + Button with custom emoji inside).
 */
export function buildDepartmentCardPayload(dept) {
  const deptPath = path.join(__dirname, 'assets', dept.file);
  const files = [];

  if (fs.existsSync(deptPath)) {
    files.push(new AttachmentBuilder(deptPath, { name: dept.file }));
  }

  const v2Payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 9, // Section
            components: [
              {
                type: 10,
                content: `### ${dept.name}\n${dept.description}`
              }
            ],
            accessory: {
              type: 11, // Thumbnail on the right
              media: {
                url: `attachment://${dept.file}`
              }
            }
          },
          {
            type: 1, // Action Row inside the card
            components: [
              {
                type: 2,
                style: 2, // Secondary sleek gray
                label: dept.name,
                emoji: dept.emojiObj,
                custom_id: `dept_btn_${dept.id}`
              }
            ]
          }
        ]
      }
    ],
    files
  };

  const fallbackEmbed = new EmbedBuilder()
    .setColor(0x0a84fd)
    .setTitle(dept.name)
    .setDescription(dept.description)
    .setThumbnail(`attachment://${dept.file}`);

  const fallbackRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_${dept.id}`)
      .setLabel(dept.name)
      .setEmoji(dept.emojiObj)
      .setStyle(ButtonStyle.Secondary)
  );

  const fallbackPayload = {
    embeds: [fallbackEmbed],
    components: [fallbackRow],
    files
  };

  return { v2Payload, fallbackPayload };
}

/**
 * Builds the Direct Message (DM) payload sent to a user when clicking a department button.
 * Includes department banner, clean intro, information summary, and official Discord invite link button.
 */
export function buildDepartmentDmPayload(dept) {
  const bannerPath = path.join(__dirname, 'assets', dept.dmBanner);
  const files = [];

  let bannerMediaUrl = null;
  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: dept.dmBanner }));
    bannerMediaUrl = `attachment://${dept.dmBanner}`;
  }

  const containerComponents = [];

  // Top Department Banner
  if (bannerMediaUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: bannerMediaUrl
          }
        }
      ]
    });
  }

  // Simple, clean, and professional DM content
  containerComponents.push({
    type: 10,
    content:
      `## ${dept.emoji} ${dept.name}\n` +
      `> Welcome to **${dept.name}**! We are actively seeking dedicated individuals to join our agency and represent LIBERTX.\n\n` +
      `### Quick Department Details\n` +
      `> • **Jurisdiction:** ${dept.jurisdiction}\n` +
      `> • **Status:** Open & Recruiting\n\n` +
      `Click the button below to join the official **${dept.name}** Discord server to apply and begin your journey.`
  });

  // Action Row with Link Button
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 5, // Link Button
        label: `Join ${dept.name} ↗`,
        emoji: dept.emojiObj,
        url: dept.inviteUrl
      }
    ]
  });

  const v2Payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };

  const fallbackEmbed = new EmbedBuilder()
    .setColor(0x0a84fd)
    .setTitle(`${dept.name}`)
    .setDescription(
      `### ${dept.emoji} ${dept.name}\n` +
      `> Welcome to **${dept.name}**! We are actively seeking dedicated individuals to join our agency and represent LIBERTX.\n\n` +
      `### Quick Department Details\n` +
      `> • **Jurisdiction:** ${dept.jurisdiction}\n` +
      `> • **Status:** Open & Recruiting\n\n` +
      `Click the button below to join the official **${dept.name}** Discord server to apply and begin your journey.`
    );

  if (fs.existsSync(bannerPath)) {
    fallbackEmbed.setImage(`attachment://${dept.dmBanner}`);
  }

  const fallbackRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel(`Join ${dept.name} ↗`)
      .setEmoji(dept.emojiObj)
      .setURL(dept.inviteUrl)
  );

  const fallbackPayload = {
    embeds: [fallbackEmbed],
    components: [fallbackRow],
    files
  };

  return { v2Payload, fallbackPayload };
}

/**
 * Sends clean, properly formatted Department Panel cards into the channel.
 */
export async function postDepartmentPanel(channel) {
  if (!channel || !channel.isTextBased()) {
    throw new Error('Invalid channel provided.');
  }

  const headerData = buildHeaderPayload();
  let headerMsg = null;
  try {
    headerMsg = await channel.send(headerData.v2Payload);
  } catch {
    headerMsg = await channel.send(headerData.fallbackPayload);
  }

  const deptMessageIds = {};

  for (const dept of DEPARTMENTS) {
    const cardData = buildDepartmentCardPayload(dept);
    let deptMsg = null;
    try {
      deptMsg = await channel.send(cardData.v2Payload);
    } catch {
      deptMsg = await channel.send(cardData.fallbackPayload);
    }
    deptMessageIds[dept.id] = deptMsg.id;
  }

  return {
    headerId: headerMsg.id,
    departmentIds: deptMessageIds
  };
}
