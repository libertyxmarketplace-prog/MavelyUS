import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} from 'discord.js';
import fs from 'fs';
import { CONFIG } from './config.js';
import { loadDeskData, isReportStaffDisabled } from './storage.js';

/**
 * Builds the ticket panel using Discord Components V2 Container (type 17):
 * - Banner at top (type 12)
 * - TextDisplay (type 10)
 * - Section (type 9) with blue Rules button touching the far right wall
 * - ActionRow (type 1) with General and Management buttons
 * - Bottom blue accent strip (type 12)
 */
export function buildTicketPanel(deskData = null, customConfig = null) {
  const desk = deskData || loadDeskData();
  const disabledList = Array.isArray(desk?.disabledCategories) ? desk.disabledCategories : [];

  const topBanner = customConfig?.topBannerUrl || null;
  const bottomBanner = customConfig?.bottomBannerUrl || null;
  const panelTitle = customConfig?.panelTitle || 'Support';
  const panelDesc = customConfig?.panelDescription || 'If you require support, open a ticket below and our team will be ready to help.';

  const containerComponents = [];

  // 1. Top Banner Image inside container (only if explicitly configured by user)
  if (topBanner && topBanner.trim() !== '') {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBanner
          }
        }
      ]
    });
  }

  // 2. Title and Description inside container
  containerComponents.push({
    type: 10,
    content: `## ${panelTitle}\n${panelDesc}`
  });

  // Action Row with dynamic category buttons (no emojis)
  const defaultCats = [
    { id: 'cat_1', name: 'General Support' },
    { id: 'cat_2', name: 'High Rank' }
  ];
  const configuredCats = Array.isArray(customConfig?.ticketCategories) && customConfig.ticketCategories.length > 0
    ? customConfig.ticketCategories.filter(c => c && c.name && c.name.trim() !== '' && c.name.toLowerCase() !== 'none' && c.name.toLowerCase() !== 'disabled')
    : defaultCats;

  const categoryButtons = configuredCats.slice(0, 5).map((cat, idx) => {
    const catId = cat.id || `cat_${idx + 1}`;
    const cleanLabel = (cat.name || `Support ${idx + 1}`).trim();
    const isClosed = disabledList.includes(catId) || disabledList.includes(cleanLabel.toLowerCase());
    return {
      type: 2,
      style: 2, // Secondary (Gray)
      label: isClosed ? `${cleanLabel} (Closed)` : cleanLabel,
      custom_id: `ticket_btn_${catId}`,
      disabled: isClosed
    };
  });

  const layout = customConfig?.panelLayout || 'buttons'; // 'buttons' | 'select' | 'both'
  const isClassic = customConfig?.panelDesign === 'classic';

  if (isClassic) {
    const colorHex = (customConfig?.panelColor || '#2ecc71').replace('#', '');
    const colorInt = parseInt(colorHex, 16) || 0x2ecc71;
    const embed = new EmbedBuilder()
      .setColor(colorInt)
      .setTitle(panelTitle)
      .setDescription(panelDesc);

    if (topBanner && topBanner.trim() !== '') {
      embed.setImage(topBanner.trim());
    }

    const rows = [];
    if ((layout === 'buttons' || layout === 'both') && categoryButtons.length > 0) {
      rows.push(new ActionRowBuilder().addComponents(
        categoryButtons.map(b => new ButtonBuilder().setCustomId(b.custom_id).setLabel(b.label).setStyle(ButtonStyle.Secondary).setDisabled(b.disabled))
      ));
    }
    if ((layout === 'select' || layout === 'both') && selectOptions.length > 0) {
      rows.push({
        type: 1,
        components: [
          {
            type: 3,
            custom_id: 'ticket_category_select',
            placeholder: customConfig?.panelSelectPlaceholder?.trim() || 'Select a category to open a ticket...',
            options: selectOptions
          }
        ]
      });
    }

    return {
      embeds: [embed],
      components: rows
    };
  }

  // Discord Components V2 Container format
  if ((layout === 'buttons' || layout === 'both') && categoryButtons.length > 0) {
    containerComponents.push({
      type: 1,
      components: categoryButtons
    });
  }

  if ((layout === 'select' || layout === 'both') && selectOptions.length > 0) {
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'ticket_category_select',
          placeholder: customConfig?.panelSelectPlaceholder?.trim() || 'Select a category to open a ticket...',
          options: selectOptions
        }
      ]
    });
  }

  // 5. Bottom banner (only if explicitly configured by user)
  if (bottomBanner && bottomBanner.trim() !== '') {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: bottomBanner
          }
        }
      ]
    });
  }

  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: containerComponents
      }
    ]
  };
}

/**
 * Builds the rich rules embed displayed when a user clicks the blue Rules button.
 */
export function buildRulesEmbed(customConfig = null) {
  const title = customConfig?.rulesTitle || CONFIG.RULES_CONTENT.title;
  const description = customConfig?.rulesDescription || CONFIG.RULES_CONTENT.description;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: "Rules verified. You may now select a category."
    })
    .setTimestamp();

  return {
    embeds: [embed],
    flags: 64
  };
}

/**
 * Builds the inside-ticket control card for staff onboarding and training using Components V2 Container:
 * - Top Banner inside at top
 * - Onboarding information, assigned position, reasons & next steps
 * - Claim, Close and Position pill controls
 */
export function buildTrainingTicketControl(ticketData) {
  const isClaimed = Boolean(ticketData.claimedBy);
  const handlerText = isClaimed ? `<@${ticketData.claimedBy}>` : 'None (Awaiting Management)';
  const statusText = isClaimed ? '**Claimed**' : '**Unclaimed**';
  const roleName = ticketData.role || 'Staff Member';

  const containerComponents = [
    // 1. Top Banner inside ticket container
    {
      type: 12,
      items: [
        {
          media: {
            url: CONFIG.TOP_BANNER_URL
          }
        }
      ]
    },
    // 2. Title and Onboarding Header
    {
      type: 10,
      content:
        `## LIBERTX Support | Staff Training & Onboarding\n` +
        `> Welcome <@${ticketData.authorId}> to the **LIBERTX** staff team!\n` +
        `> This private onboarding channel has been prepared for your staff orientation and in-game training.`
    },
    // 3. Section with Green Accepted Status Pill
    {
      type: 9,
      components: [
        {
          type: 10,
          content:
            `**Appointed Staff Member**\n` +
            `• **Applicant:** <@${ticketData.authorId}> (\`${ticketData.authorTag || ticketData.authorId}\`)\n` +
            `• **Assigned Position:** **${roleName}**\n` +
            `• **Handler:** ${handlerText} (${statusText})`
        }
      ],
      accessory: {
        type: 2,
        style: 3, // Success Green
        label: 'Accepted',
        disabled: true,
        custom_id: 'ticket_training_status_pill'
      }
    },
    // 4. Ticket Purpose & Onboarding Reason
    {
      type: 10,
      content:
        `### Ticket Purpose & Onboarding Reason\n` +
        `> • **Primary Reason:** Staff Orientation, Permission Allocation & In-Game Patrol Training for **${roleName}**.\n` +
        (ticketData.reviewedBy ? `> • **Approved By:** <@${ticketData.reviewedBy}>\n` : '') +
        (ticketData.notes ? `> • **Management Notes:** ${ticketData.notes}\n` : '') +
        `\n### Next Steps & Instructions\n` +
        `> **1. Role & Permissions:** Management will assign your in-game & Discord staff permissions.\n` +
        `> **2. Staff Orientation:** A Management member will walk you through the staff guidelines and expectations.\n` +
        `> **3. Patrol Training:** Your practical in-game patrol training session will be scheduled directly here.\n\n` +
        `*Please reply below with your Roblox username and your availability for training.*`
    },
    // 5. Action Row with Claim, Close and Position Pill
    {
      type: 1,
      components: [
        isClaimed
          ? {
              type: 2,
              style: 2, // Secondary
              label: 'Unclaim',
              custom_id: 'ticket_unclaim'
            }
          : {
              type: 2,
              style: 3, // Success (Green)
              label: 'Claim',
              custom_id: 'ticket_claim'
            },
        {
          type: 2,
          style: 4, // Danger (Red)
          label: 'Close Ticket',
          custom_id: 'ticket_close_request'
        },
        {
          type: 2,
          style: 2, // Secondary Gray Pill
          label: roleName,
          disabled: true,
          custom_id: 'ticket_training_role_pill'
        }
      ]
    }
  ];

  // 6. Bottom Banner Accent Strip
  if (CONFIG.BOTTOM_BANNER_URL) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: CONFIG.BOTTOM_BANNER_URL
          }
        }
      ]
    });
  }

  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: containerComponents
      }
    ]
  };
}

/**
 * Builds the inside-ticket control card using Discord Components V2 Container (type 17):
 * - Banner at top (only if configured)
 * - Title and custom welcome greeting
 * - Claim and Close buttons INSIDE the container
 */
export function buildTicketControl(ticketData, customConfig = null) {
  if (ticketData?.category === 'training') {
    return buildTrainingTicketControl(ticketData);
  }

  const isClaimed = Boolean(ticketData.claimedBy);
  const handlerText = isClaimed ? `<@${ticketData.claimedBy}>` : 'None (Awaiting Staff)';
  const statusText = isClaimed ? '**Claimed**' : '**Unclaimed**';
  const reasonText = ticketData.reason ? ticketData.reason : '*No reason provided.*';

  const categoryName = ticketData.categoryLabel || 'Support';
  const serverName = customConfig?.serverName || 'LIBERTX';
  const welcomeText = customConfig?.ticketOpenMessage ||
    `Welcome <@${ticketData.authorId}>. Our support team has been notified.\nPlease provide all relevant details regarding your inquiry while a staff member responds.`;

  const topBanner = customConfig?.ticketInsideBannerUrl || customConfig?.topBannerUrl || null;
  const bottomBanner = customConfig?.bottomBannerUrl || null;

  const containerComponents = [];

  // 1. Top Banner inside ticket container (only if set by user)
  if (topBanner && topBanner.trim() !== '') {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: topBanner
          }
        }
      ]
    });
  }

  // 2. Ticket information
  containerComponents.push({
    type: 10,
    content: 
      `## ${serverName} Support | ${categoryName}\n` +
      `> ${welcomeText.replace(/\n/g, '\n> ')}\n\n` +
      `**Opened By:** <@${ticketData.authorId}> (${ticketData.authorTag || ticketData.authorId})\n` +
      `**Assigned Handler:** ${handlerText}\n` +
      `**Status:** ${statusText}\n` +
      `**Reason:** ${reasonText}`
  });

  // 3. Action Row with Claim and Close buttons INSIDE the container
  containerComponents.push({
    type: 1,
    components: [
      isClaimed
        ? {
            type: 2,
            style: 2, // Secondary
            label: 'Unclaim',
            custom_id: 'ticket_unclaim'
          }
        : {
            type: 2,
            style: 3, // Success (Green)
            label: 'Claim',
            custom_id: 'ticket_claim'
          },
      {
        type: 2,
        style: 4, // Danger (Red)
        label: 'Close',
        custom_id: 'ticket_close_request'
      }
    ]
  });

  // 4. Section with Red Report Staff Button on far right wall (Management tickets only, if enabled)
  if (ticketData.category === 'management' && !isReportStaffDisabled()) {
    containerComponents.push({
      type: 9, // Section
      components: [
        {
          type: 10,
          content: '**Reporting a staff member? Click here to file an official report.**'
        }
      ],
      accessory: {
        type: 2,
        style: 4, // Danger (Red!)
        label: 'Report Staff',
        custom_id: 'ticket_btn_report_staff'
      }
    });
  }

  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: containerComponents
      }
    ]
  };
}

/**
 * Builds the close confirmation prompt.
 */
export function buildCloseConfirmation() {
  const confirmEmbed = new EmbedBuilder()
    .setTitle("Close Ticket Confirmation")
    .setDescription(
      "> Are you sure you want to close this ticket?\n" +
      "> Upon confirmation, an archive transcript will be generated and the channel will close in 5 seconds."
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close_confirm')
      .setLabel('Confirm Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_close_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [confirmEmbed],
    components: [row]
  };
}

/**
 * Builds the closed ticket log embed for transcripts channel.
 */
export function buildTranscriptLogEmbed({
  channelName,
  channelId,
  authorId,
  authorTag,
  closedById,
  claimedById,
  openDuration,
  closeReason,
  transcriptUrl = null,
  bannerImage = null
}) {
  const embed = new EmbedBuilder()
    .setTitle(`Ticket Archive | #${channelName}`)
    .setDescription(
      `> Support inquiry channel has been closed and archived.\n` +
      `> Official transcript record generated and stored.`
    )
    .addFields(
      {
        name: "Ticket Author",
        value: `<@${authorId}> (${authorTag || 'User'})`,
        inline: true
      },
      {
        name: "Handled By",
        value: claimedById ? `<@${claimedById}>` : "Unclaimed",
        inline: true
      },
      {
        name: "Closed By",
        value: `<@${closedById}>`,
        inline: true
      },
      {
        name: "Channel Reference",
        value: `#${channelName} (\`${channelId}\`)`,
        inline: true
      },
      {
        name: "Duration",
        value: openDuration || 'N/A',
        inline: true
      },
      {
        name: "Status",
        value: "Archived",
        inline: true
      },
      {
        name: "Closure Reason",
        value: closeReason ? `>>> ${closeReason}` : ">>> No reason provided.",
        inline: false
      }
    )
    .setFooter({
      text: `LIBERTX Support Desk • ID: ${channelId}`
    })
    .setTimestamp();

  const finalBanner = bannerImage || CONFIG.BOTTOM_BANNER_URL;
  if (finalBanner) {
    embed.setImage(finalBanner);
  }

  const row = new ActionRowBuilder();

  if (transcriptUrl) {
    row.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('Open Transcript')
        .setURL(transcriptUrl)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_edit_reason_${channelId}`)
      .setLabel('Edit Reason')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

/**
 * Builds the official Welcome message and member count display button.
 */
export function buildWelcomePayload(member, customConfig = null) {
  const guild = member.guild;
  const memberCount = guild?.memberCount || 1;
  const serverName = customConfig?.serverName || guild?.name || CONFIG.WELCOME.SERVER_NAME || 'our community';
  const bannerUrl = customConfig?.welcomeBannerUrl || null;
  const rawText = customConfig?.welcomeText || "Welcome to {server}, {user}! Please check the rules and enjoy your stay.";
  const formattedText = rawText
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user?.username || '')
    .replace(/{server}/g, serverName)
    .replace(/{count}/g, memberCount.toLocaleString());

  const containerComponents = [];

  if (bannerUrl && bannerUrl.trim() !== '') {
    containerComponents.push({
      type: 12,
      items: [{ media: { url: bannerUrl.trim() } }]
    });
  }

  containerComponents.push({
    type: 10,
    content: [
      `# Welcome to ${serverName}`,
      `> ${formattedText}`,
      ``,
      `*You are member **#${memberCount.toLocaleString()}**.*`
    ].join('\n')
  });

  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        label: `${memberCount.toLocaleString()} Members`,
        disabled: true,
        custom_id: 'welcome_member_count_pill'
      }
    ]
  });

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ]
  };
}

/**
 * Transforms normal Latin alphanumeric text into Mathematical Sans-Serif font (𝖳𝗁𝗂𝗌 𝖥𝗈𝗇𝗍).
 */
export function toSansSerif(text) {
  if (!text) return '';
  return text.replace(/[A-Za-z0-9]/g, char => {
    const code = char.charCodeAt(0);
    // A-Z -> U+1D5A0
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D5A0 + code - 65);
    // a-z -> U+1D5BA
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D5BA + code - 97);
    // 0-9 -> U+1D7E2
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7E2 + code - 48);
    return char;
  });
}

// Registered application command IDs by guild for authentic blue clickable slash command pills
const GUILD_COMMAND_MAPS = {
  // Guild 1: 1541210827967823955
  '1541210827967823955': {
    ticket: '1550289751058284544',
    add: '1550289751058284545',
    remove: '1550289751058284546',
    session: '1550289751058284547',
    purge: '1550292662727352423',
    say: '1550301620980686849',
    giveaway: '1550314106790350950',
    application: '1550444075444998165',
    commands: '1550686187792900147',
    refont: '1550686187792900149',
    media: '1550717056221978666',
    department: '1551135473139847188',
    staffdocs: '1551154053507977336',
    promote: '1551154053507977337',
    infract: '1551154053507977338',
    loa: '1551154053507977339'
  },
  // Guild 2: 1530147023754367006
  '1530147023754367006': {
    ticket: '1550289749351211018',
    add: '1550289749351211019',
    remove: '1550289749351211020',
    session: '1550289749351211021',
    purge: '1550292659447529532',
    say: '1550301619864731788',
    giveaway: '1550314105728929852',
    application: '1550444074023260240',
    commands: '1550686186178216078',
    refont: '1550686186178216080',
    media: '1550717055261605918',
    department: '1551135471914979388',
    staffdocs: '1551154052174192740',
    promote: '1551154052174192741',
    infract: '1551154052174192742',
    loa: '1551154052174192743'
  }
};

/**
 * Resolves a clickable blue slash command mention string </name subcommand:id>.
 */
export function getCommandMention(client, name, subcommand = '', guildId = null) {
  let cmdId = null;

  // 1. Direct guild lookup from known ID maps
  if (guildId && GUILD_COMMAND_MAPS[guildId]) {
    cmdId = GUILD_COMMAND_MAPS[guildId][name];
  }

  // 2. Client guild cache lookup
  if (!cmdId && guildId && client?.guilds?.cache?.has(guildId)) {
    const guild = client.guilds.cache.get(guildId);
    const found = guild.commands?.cache?.find(c => c.name === name);
    if (found) cmdId = found.id;
  }

  // 3. Client global application commands cache
  if (!cmdId && client?.application?.commands?.cache) {
    const found = client.application.commands.cache.find(c => c.name === name);
    if (found) cmdId = found.id;
  }

  // 4. Fallback defaults (prioritizing 1541210827967823955)
  if (!cmdId) {
    cmdId = GUILD_COMMAND_MAPS['1541210827967823955']?.[name] || GUILD_COMMAND_MAPS['1530147023754367006']?.[name];
  }

  if (subcommand) {
    return `</${name} ${subcommand}:${cmdId || '0'}>`;
  }
  return `</${name}:${cmdId || '0'}>`;
}

/**
 * Builds the remodeled /commands directory with clickable blue slash command pills,
 * bottom banner image, and clean gray arrow pagination.
 */
export function buildCommandsDirectoryPayload(client, page = 0, guildOrId = null) {
  const totalPages = 5;
  const safePage = Math.max(0, Math.min(totalPages - 1, page));

  const leftEmojiId = CONFIG.APPLICATIONS?.ARROW_LEFT_EMOJI_ID || '1550446757396348958';
  const rightEmojiId = CONFIG.APPLICATIONS?.ARROW_RIGHT_EMOJI_ID || '1550446417376448593';

  let guild = null;
  if (guildOrId && typeof guildOrId === 'object') {
    guild = guildOrId;
  } else if (guildOrId && typeof guildOrId === 'string') {
    guild = client?.guilds?.cache?.get(guildOrId) || null;
  }
  const guildId = guild?.id || (typeof guildOrId === 'string' ? guildOrId : null);
  const serverName = guild?.name || 'Server';
  const serverIcon = guild?.iconURL?.({ size: 128 }) || null;

  const categoryTitles = [
    'Support Desk & Ticket Operations',
    'ER:LC Live Sessions & Announcements',
    'Community Giveaways & Applications',
    'Staff Administration & Governance',
    'Voice Channel Music & Media Utilities'
  ];

  let pageContent = '';

  if (safePage === 0) {
    pageContent = [
      `### Support Desk & Moderation`,
      getCommandMention(client, 'panel', '', guildId),
      getCommandMention(client, 'purge', '', guildId),
      getCommandMention(client, 'say', '', guildId),
      getCommandMention(client, 'ticket', 'close', guildId),
      getCommandMention(client, 'ticket', 'claim', guildId),
      getCommandMention(client, 'ticket', 'unclaim', guildId),
      getCommandMention(client, 'ticket', 'add', guildId),
      getCommandMention(client, 'ticket', 'remove', guildId),
      getCommandMention(client, 'ticket', 'rename', guildId),
      getCommandMention(client, 'ticket', 'status', guildId),
      '',
      `**Prefix Shortcuts**`,
      `\`-close [reason]\`  \`-open\`  \`-claim\`  \`-unclaim\`  \`-purge [1-100]\``
    ].join('\n');
  } else if (safePage === 1) {
    pageContent = [
      `### ER:LC Live Sessions`,
      getCommandMention(client, 'panel', '', guildId),
      getCommandMention(client, 'session', 'start', guildId),
      getCommandMention(client, 'session', 'vote', guildId),
      getCommandMention(client, 'session', 'shutdown', guildId),
      '',
      `**Prefix Shortcuts**`,
      `\`-startup [code] [vc]\`  \`-shutdown\`  \`-cancel\`  \`-delay <time>\`  \`-setcode <code>\``
    ].join('\n');
  } else if (safePage === 2) {
    pageContent = [
      `### Giveaways & Applications`,
      getCommandMention(client, 'panel', '', guildId),
      getCommandMention(client, 'giveaway', 'start', guildId),
      getCommandMention(client, 'giveaway', 'end', guildId),
      getCommandMention(client, 'giveaway', 'reroll', guildId),
      getCommandMention(client, 'application', 'setreview', guildId),
      getCommandMention(client, 'application', 'setresults', guildId),
      '',
      `**Prefix Shortcuts**`,
      `\`-gstart <time> <winners> <prize>\`  \`-gend\`  \`-greroll\``
    ].join('\n');
  } else if (safePage === 3) {
    pageContent = [
      `### Staff Administration & Governance`,
      getCommandMention(client, 'panel', '', guildId),
      getCommandMention(client, 'promote', '', guildId),
      getCommandMention(client, 'infract', '', guildId),
      getCommandMention(client, 'loa', 'request', guildId),
      '',
      `**Staff Prefix Shortcuts**`,
      `\`-promote @user <role/rank> | [reason]\``,
      `\`-infract @user <type> | <reason> | [proof]\``,
      `\`-loa <duration or date> | <reason>\``
    ].join('\n');
  } else if (safePage === 4) {
    pageContent = [
      `### Voice Music & Utilities`,
      getCommandMention(client, 'commands', '', guildId),
      getCommandMention(client, 'media', '', guildId),
      '',
      `**Music Prefix Commands**`,
      `\`-join\`  \`-play <query>\`  \`-volume <1-100>\``,
      `\`-pause\`  \`-unpause\` / \`-resume\`  \`-replay\`  \`-loop\`  \`-leave\``,
      '',
      `**Utility Shortcuts**`,
      `\`-media [caption]\``
    ].join('\n');
  }

  const embed = new EmbedBuilder()
    .setColor(0x2B6CB0)
    .setAuthor({
      name: `${serverName} Command Directory`,
      iconURL: serverIcon || undefined
    })
    .setTitle(`${serverName} | Command Directory`)
    .setDescription(
      `> **Section ${safePage + 1} of ${totalPages}** | **${categoryTitles[safePage]}**\n` +
      `> Click any command tag below to execute directly in Discord.\n\n` +
      pageContent
    )
    .setFooter({
      text: `${serverName} Systems | Page ${safePage + 1} of ${totalPages}`,
      iconURL: serverIcon || undefined
    });

  const bannerPath = './assets/bottom-banner.png';
  let bannerFile = null;
  if (fs.existsSync(bannerPath)) {
    bannerFile = new AttachmentBuilder(bannerPath, { name: 'bottom-banner.png' });
    embed.setImage('attachment://bottom-banner.png');
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cmd_page_prev_${safePage}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(leftEmojiId)
      .setDisabled(safePage === 0),
    new ButtonBuilder()
      .setCustomId('cmd_page_info')
      .setStyle(ButtonStyle.Secondary)
      .setLabel(`Page ${safePage + 1} of ${totalPages}`)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`cmd_page_next_${safePage}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(rightEmojiId)
      .setDisabled(safePage === totalPages - 1)
  );

  return {
    embeds: [embed],
    components: [row],
    files: bannerFile ? [bannerFile] : []
  };
}

/**
 * Builds the Media Showcase payload in modern Discord Components V2 format,
 * featuring the top camera emoji <:camera:1550716464200290386>, the uploaded image,
 * user credit, optional caption, and local bottom banner attachment.
 */
export function buildMediaShowcasePayload({ attachment, title = null, caption = null, creditUser, pingRole = null }) {
  const files = [];
  const fileName = attachment.name || 'media.png';

  // Forward attachment into files array so Components V2 can reference attachment://
  files.push(new AttachmentBuilder(attachment.url, { name: fileName }));

  // Header content inside the card with camera emoji, optional title, credit and caption
  let headerContent = '';
  if (title && title.trim()) {
    headerContent = `### <:camera:1550716464200290386> ${title.trim()}\n> **Credit:** <@${creditUser.id}>`;
    if (caption && caption.trim()) {
      headerContent += `\n> ${caption.trim()}`;
    }
  } else {
    headerContent = `### <:camera:1550716464200290386> Credit: <@${creditUser.id}>`;
    if (caption && caption.trim()) {
      headerContent += `\n> ${caption.trim()}`;
    }
  }

  const containerComponents = [
    {
      type: 10,
      content: headerContent
    },
    {
      type: 12,
      items: [
        {
          media: {
            url: `attachment://${fileName}`
          }
        }
      ]
    }
  ];

  const v2Payload = {
    content: pingRole ? `<@&${pingRole.id}>` : null,
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ],
    files
  };

  // Fallback embed WITHOUT bottom banner and WITHOUT footer text/timestamp
  const fallbackEmbed = new EmbedBuilder()
    .setColor(0x2B6CB0)
    .setDescription(headerContent)
    .setImage(`attachment://${fileName}`);

  const fallbackPayload = {
    content: pingRole ? `<@&${pingRole.id}>` : null,
    embeds: [fallbackEmbed],
    files: [new AttachmentBuilder(attachment.url, { name: fileName })]
  };

  return { v2Payload, fallbackPayload };
}

