import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPLICATIONS_FILE = path.join(__dirname, 'data', 'applications.json');

const ACCENT_COLOR = 0x0a84fd;

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

export function loadApplicationsData() {
  return readJsonFile(APPLICATIONS_FILE, {
    submissions: {},
    activeSessions: {},
    openPositions: {
      ingame_mod: true,
      discord_mod: true
    },
    reviewChannelId: CONFIG.APPLICATIONS?.REVIEW_CHANNEL_ID || '1550446015859925012'
  });
}

export function saveApplicationsData(data) {
  writeJsonFile(APPLICATIONS_FILE, data);
}

export function isPositionOpen(role) {
  const store = loadApplicationsData();
  if (!store.openPositions) return true;
  return store.openPositions[role] !== false;
}

export function setPositionOpen(role, isOpen) {
  const store = loadApplicationsData();
  if (!store.openPositions) store.openPositions = { ingame_mod: true, discord_mod: true };
  store.openPositions[role] = isOpen;
  saveApplicationsData(store);
}

export function setAllPositionsOpen(isOpen) {
  const store = loadApplicationsData();
  store.openPositions = {
    ingame_mod: isOpen,
    discord_mod: isOpen
  };
  saveApplicationsData(store);
}

export function getActiveSession(userId) {
  const store = loadApplicationsData();
  return store.activeSessions?.[userId] || null;
}

export function setActiveSession(userId, session) {
  const store = loadApplicationsData();
  if (!store.activeSessions) store.activeSessions = {};
  store.activeSessions[userId] = session;
  saveApplicationsData(store);
}

export function removeActiveSession(userId) {
  const store = loadApplicationsData();
  if (store.activeSessions) {
    delete store.activeSessions[userId];
    saveApplicationsData(store);
  }
}

export function saveSubmission(submission) {
  const store = loadApplicationsData();
  if (!store.submissions) store.submissions = {};
  store.submissions[submission.id] = submission;
  saveApplicationsData(store);
}

export function getSubmission(submissionId) {
  const store = loadApplicationsData();
  return store.submissions?.[submissionId] || null;
}

export function updateSubmission(submissionId, updates) {
  const store = loadApplicationsData();
  if (store.submissions?.[submissionId]) {
    store.submissions[submissionId] = {
      ...store.submissions[submissionId],
      ...updates
    };
    saveApplicationsData(store);
    return store.submissions[submissionId];
  }
  return null;
}

export function setReviewChannel(channelId) {
  const store = loadApplicationsData();
  store.reviewChannelId = channelId;
  saveApplicationsData(store);
}

export function getReviewChannelId() {
  const store = loadApplicationsData();
  return store.reviewChannelId || CONFIG.APPLICATIONS?.REVIEW_CHANNEL_ID || '1550446015859925012';
}

export function setResultsChannel(channelId) {
  const store = loadApplicationsData();
  store.resultsChannelId = channelId;
  saveApplicationsData(store);
}

export function getResultsChannelId() {
  const store = loadApplicationsData();
  return store.resultsChannelId || CONFIG.APPLICATIONS?.RESULTS_CHANNEL_ID || '1550413729013829725';
}

export function getRoleDisplayName(role) {
  if (role === 'ingame_mod') return 'In-Game Moderator';
  if (role === 'discord_mod') return 'Discord Moderator';
  return 'Staff Member';
}

/* ========================================================================== */
/*                         PUBLIC APPLICATION PANEL                           */
/* ========================================================================== */

/**
 * Builds the official Application Panel using Discord Components V2 Container
 * featuring the top banner and String Select Menu (strictly no emojis).
 */
export function buildApplicationPanel(customConfig = null) {
  const files = [];

  let topBannerMediaUrl = customConfig?.appTopBannerUrl?.trim() || null;
  let bottomBannerUrl = customConfig?.appBottomBannerUrl?.trim() || null;

  const isIngameOpen = isPositionOpen('ingame_mod');
  const isDiscordOpen = isPositionOpen('discord_mod');

  const containerComponents = [];

  // 1. Top Banner
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

  // 2. Title and Clean Content (No Emojis)
  const appTitle = customConfig?.appTitle || 'LIBERTX | Staff Application';
  const appDesc = customConfig?.appDescription ||
    `> Welcome to the official LIBERTX Staff Application portal.\n` +
    `> Holding a staff position is a privilege that requires consistent activity, professionalism, and accountability. As a staff member, you represent LIBERTX at all times.\n\n` +
    `### Application Requirements\n` +
    `> • Must be at least 14 years of age.\n` +
    `> • Discord and Roblox accounts must be at least 30 days old.\n` +
    `> • Working microphone with willingness to communicate verbally.\n` +
    `> • Minimum sentence requirements must be met; low effort answers are rejected.\n` +
    `> • The use of AI is strictly prohibited and results in a permanent blacklist.\n\n` +
    `### Select Your Position\n` +
    `> Choose your desired staff position from the dropdown menu below to begin.`;

  containerComponents.push({
    type: 10,
    content: `## ${appTitle}\n${appDesc}`
  });

  // 3. String Select Menu (NO EMOJIS)
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 3,
        custom_id: 'application_select_role',
        placeholder: 'Select a Staff Position to Apply For...',
        options: [
          {
            label: isIngameOpen ? 'In-Game Moderator' : 'In-Game Moderator (Closed)',
            value: 'ingame_mod',
            description: isIngameOpen
              ? 'Supervise live ER:LC sessions, answer mod calls, enforce in-game rules.'
              : 'In-Game Moderator applications are currently closed.'
          },
          {
            label: isDiscordOpen ? 'Discord Moderator' : 'Discord Moderator (Closed)',
            value: 'discord_mod',
            description: isDiscordOpen
              ? 'Moderate Discord text channels, assist support tickets, maintain order.'
              : 'Discord Moderator applications are currently closed.'
          }
        ]
      }
    ]
  });

  // 4. Bottom Banner
  if (bottomBannerUrl) {
    containerComponents.push({
      type: 12,
      items: [
        {
          media: {
            url: bottomBannerUrl
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

/* ========================================================================== */
/*               DM APPLICATION DASHBOARD (COMPONENTS V2 CONTAINER)          */
/* ========================================================================== */

/**
 * Builds the DM Hub using Discord Components V2 Container (type 17).
 * - Application banner is placed at the VERY TOP.
 * - Text inside.
 * - Buttons are INSIDE the container card.
 * - Module 1 button is GRAY (style 2).
 * - When a module is done, it turns GREEN (style 3).
 * - Submit Application and Cancel Application ONLY appear when Step 4 is finished!
 */
export function buildApplicationHubMessage(session) {
  const roleName = getRoleDisplayName(session.role);
  const bannerPath = path.join(__dirname, 'assets', 'applications_banner.png');
  const files = [];

  let topBannerMediaUrl = 'attachment://applications_banner.png';
  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'applications_banner.png' }));
  }

  const bottomBanner = getBottomBannerAttachment();
  if (bottomBanner.attachment) {
    files.push(bottomBanner.attachment);
  }

  const mod1Done = Boolean(session.modules?.mod1);
  const mod2Done = Boolean(session.modules?.mod2);
  const mod3Done = Boolean(session.modules?.mod3);
  const mod4Done = Boolean(session.modules?.mod4);
  const allDone = mod1Done && mod2Done && mod3Done && mod4Done;

  const containerComponents = [];

  // 1. Top Banner (At the very top!)
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

  // 2. Title & Description
  containerComponents.push({
    type: 10,
    content:
      `## LIBERTX | ${roleName} Application\n` +
      `> Welcome to the official **LIBERTX Staff Application**.\n` +
      `> Holding a staff position is a privilege requiring consistent activity and professionalism.\n\n` +
      `### Module Progress\n` +
      `> 1. Rules & Requirements: **${mod1Done ? 'Completed' : 'Ready'}**\n` +
      `> 2. General Information: **${mod2Done ? 'Completed' : mod1Done ? 'Ready' : 'Locked'}**\n` +
      `> 3. Core Knowledge: **${mod3Done ? 'Completed' : mod2Done ? 'Ready' : 'Locked'}**\n` +
      `> 4. Realistic Scenarios: **${mod4Done ? 'Completed' : mod3Done ? 'Ready' : 'Locked'}**\n\n` +
      (allDone
        ? `All modules have been completed! Review your answers and click **Submit Application** below to finish.`
        : `Click on the next available module button below to fill in your responses.`)
  });

  // 3. Module Buttons Row (INSIDE container)
  // Rules & Requirements is Gray (style: 2) initially, Green (style: 3) once completed!
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: mod1Done ? 3 : 2, // 3 = Green (Done), 2 = Gray
        label: mod1Done ? 'Rules & Requirements (Done)' : '1. Rules & Requirements',
        custom_id: 'app_mod_btn_1'
      },
      {
        type: 2,
        style: mod2Done ? 3 : 2,
        label: mod2Done ? 'General Information (Done)' : '2. General Information',
        custom_id: 'app_mod_btn_2',
        disabled: !mod1Done
      },
      {
        type: 2,
        style: mod3Done ? 3 : 2,
        label: mod3Done ? 'Core Knowledge (Done)' : '3. Core Knowledge',
        custom_id: 'app_mod_btn_3',
        disabled: !mod2Done
      },
      {
        type: 2,
        style: mod4Done ? 3 : 2,
        label: mod4Done ? 'Realistic Scenarios (Done)' : '4. Realistic Scenarios',
        custom_id: 'app_mod_btn_4',
        disabled: !mod3Done
      }
    ]
  });

  // 4. Submit & Cancel Row (ONLY APPEARS WHEN USER FINISHES STEP 4!)
  if (allDone) {
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 2, // Secondary Gray (as requested!)
          label: 'Submit Application',
          custom_id: 'app_submit'
        },
        {
          type: 2,
          style: 4, // Danger Red
          label: 'Cancel Application',
          custom_id: 'app_cancel'
        }
      ]
    });
  }

  // 5. Bottom accent strip
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

/* ========================================================================== */
/*                MODAL BUILDERS (LABELS STRICTLY <= 45 CHARACTERS)           */
/* ========================================================================== */

/**
 * Module 1 Modal: Rules & Requirements
 * Every label is strictly <= 45 chars to prevent "Invalid string length" error!
 */
export function buildModule1Modal(session) {
  const modal = new ModalBuilder()
    .setCustomId('modal_app_mod_1')
    .setTitle('1. Rules & Requirements');

  if (session.role === 'ingame_mod') {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('rule_regulations')
          .setLabel('Read In-Game & Discord Regulations?') // 36 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes" or "No"')
          .setValue(session.answers?.rule_regulations || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('current_age')
          .setLabel('Current Age (Must be 14 or older)') // 33 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter your current age')
          .setValue(session.answers?.current_age || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('functional_mic')
          .setLabel('Working Microphone for Voice Duties?') // 36 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes" or "No"')
          .setValue(session.answers?.functional_mic || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('recording_software')
          .setLabel('Recording Software (OBS/Medal/GeForce)?') // 40 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes" or "No"')
          .setValue(session.answers?.recording_software || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('urgent_availability')
          .setLabel('Urgent Availability Outside Shift Hours?') // 40 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Yes / No / Dependent on availability')
          .setValue(session.answers?.urgent_availability || '')
          .setRequired(true)
      )
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('rule_regulations')
          .setLabel('Read Discord Guidelines & Terms of Service?') // 43 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes" or "No"')
          .setValue(session.answers?.rule_regulations || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('current_age')
          .setLabel('Current Age (Must be 14 or older)') // 33 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter your current age')
          .setValue(session.answers?.current_age || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('functional_mic')
          .setLabel('Working Microphone for Staff Meetings?') // 38 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes" or "No"')
          .setValue(session.answers?.functional_mic || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('timezone')
          .setLabel('Your Timezone') // 13 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. EST, CST, GMT, PST')
          .setValue(session.answers?.timezone || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('weekly_schedule')
          .setLabel('Weekly Schedule & Available Mod Hours') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Days of week, active hours, estimated weekly time')
          .setValue(session.answers?.weekly_schedule || '')
          .setRequired(true)
      )
    );
  }

  return modal;
}

/**
 * Module 2 Modal: General Information
 * Every label is strictly <= 45 chars to prevent "Invalid string length" error!
 */
export function buildModule2Modal(session) {
  const modal = new ModalBuilder()
    .setCustomId('modal_app_mod_2')
    .setTitle('2. General Information');

  if (session.role === 'ingame_mod') {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('roblox_profile')
          .setLabel('Roblox Username & Roblox User ID') // 32 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. Username (123456789)')
          .setValue(session.answers?.roblox_profile || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('schedule_timezone')
          .setLabel('Timezone & Weekly Availability') // 30 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. EST, 15 hrs/week, Mon-Fri 4-9 PM')
          .setValue(session.answers?.schedule_timezone || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('background_erlc')
          .setLabel('ER:LC Background & Interests (3 Sentences)') // 42 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Minimum of 3 complete sentences about your background')
          .setValue(session.answers?.background_erlc || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('previous_history')
          .setLabel('Past Moderation History (4 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Servers, highest rank, departure reason, skills gained')
          .setValue(session.answers?.previous_history || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('why_liberty')
          .setLabel('Why Liberty County / LIBERTX? (4 Sentences)') // 42 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Why choose Liberty County / LIBERTX and what sets you apart')
          .setValue(session.answers?.why_liberty || '')
          .setRequired(true)
      )
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('motivation')
          .setLabel('Motivation for LIBERTX Staff (3 Sentences)') // 40 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Why you want to moderate LIBERTX Discord')
          .setValue(session.answers?.motivation || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('discord_exp')
          .setLabel('Past Discord Mod History & Bots (4 Sentences)') // 44 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Servers, ranks, Carl, Dyno, AutoMod experience')
          .setValue(session.answers?.discord_exp || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('candidate_strengths')
          .setLabel('Unique Traits & Assets (4 Sentences)') // 36 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Patience, de-escalation, communication skills')
          .setValue(session.answers?.candidate_strengths || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('handling_bias')
          .setLabel('Handling Bias & Impartiality (4 Sentences)') // 42 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('How you handle friends violating rules')
          .setValue(session.answers?.handling_bias || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('prior_infractions')
          .setLabel('Prior Disciplinary History (3 Sentences)') // 39 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Warns, mutes, kicks, bans received and lessons learned')
          .setValue(session.answers?.prior_infractions || '')
          .setRequired(true)
      )
    );
  }

  return modal;
}

/**
 * Module 3 Modal: Core Knowledge
 * Every label is strictly <= 45 chars to prevent "Invalid string length" error!
 */
export function buildModule3Modal(session) {
  const modal = new ModalBuilder()
    .setCustomId('modal_app_mod_3')
    .setTitle('3. Core Knowledge');

  if (session.role === 'ingame_mod') {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('def_frp')
          .setLabel('Define FailRP & Actions (3 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Scenario example and corrective actions you would take')
          .setValue(session.answers?.def_frp || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('def_rdm_vdm')
          .setLabel('Define RDM & VDM + Evidence (3 Sentences)') // 41 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Definitions and required evidentiary threshold')
          .setValue(session.answers?.def_rdm_vdm || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('def_meta_power')
          .setLabel('Define Metagaming & Powergaming (3 Sentences)') // 44 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Provide in-game examples of each and resolution')
          .setValue(session.answers?.def_meta_power || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('def_nlr_ltarp')
          .setLabel('Define NLR & LTARP vs LTAP (3 Sentences)') // 40 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Respawn rules and difference in severity')
          .setValue(session.answers?.def_nlr_ltarp || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('key_commands')
          .setLabel('Key Commands (:h, :m, :pm, vehicle, mute)') // 41 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Explain what each command does and when to use it')
          .setValue(session.answers?.key_commands || '')
          .setRequired(true)
      )
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_toxicity')
          .setLabel('Toxic Arguments in Chat (3 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Step-by-step de-escalation procedure')
          .setValue(session.answers?.scenario_toxicity || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_raid')
          .setLabel('Mass-Ping Raid Containment (3 Sentences)') // 40 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Immediate lockdown and cleanup actions')
          .setValue(session.answers?.scenario_raid || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_automod_bypass')
          .setLabel('Automod Bypass Handling (3 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Detection, documentation, and punishment steps')
          .setValue(session.answers?.scenario_automod_bypass || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_ticket_dispute')
          .setLabel('Ticket Accusing Staff (3 Sentences)') // 35 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('How you handle ticket complaints professionally')
          .setValue(session.answers?.scenario_ticket_dispute || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_banter')
          .setLabel('Banter vs Real Harassment (3 Sentences)') // 39 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Where you draw the line and when to intervene')
          .setValue(session.answers?.scenario_banter || '')
          .setRequired(true)
      )
    );
  }

  return modal;
}

/**
 * Module 4 Modal: Realistic Scenarios
 * Every label is strictly <= 45 chars to prevent "Invalid string length" error!
 */
export function buildModule4Modal(session) {
  const modal = new ModalBuilder()
    .setCustomId('modal_app_mod_4')
    .setTitle('4. Realistic Scenarios');

  if (session.role === 'ingame_mod') {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_mod_parking')
          .setLabel('Where to park before !mod? (2 Sentences)') // 40 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Vehicle positioning before answering requests')
          .setValue(session.answers?.scenario_mod_parking || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_rdm_dispute')
          .setLabel('Unproven RDM Investigation (4 Sentences)') // 40 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Investigation procedure when neither has video proof')
          .setValue(session.answers?.scenario_rdm_dispute || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_exploits')
          .setLabel('Exploiter Response Protocol (3 Sentences)') // 41 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Verification to punishment logging steps')
          .setValue(session.answers?.scenario_exploits || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_staff_abuse')
          .setLabel('Colleague Command Abuse (4 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Handling discretely without causing a public scene')
          .setValue(session.answers?.scenario_staff_abuse || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('verification_affirmation')
          .setLabel('Affirmation: No AI & all info is true') // 38 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes, I agree"')
          .setValue(session.answers?.verification_affirmation || '')
          .setRequired(true)
      )
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('protocol_punishments')
          .setLabel('Sanction Progression (3 Sentences)') // 34 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Progression: Warn, Mute, Kick, Ban and escalation')
          .setValue(session.answers?.protocol_punishments || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('protocol_selfpromo')
          .setLabel('Unauthorized Self-Promo (2 Sentences)') // 37 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('How you handle unauthorized promotional links')
          .setValue(session.answers?.protocol_selfpromo || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_ticket_heated')
          .setLabel('Heated Ticket Conversations (3 Sentences)') // 41 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Maintaining professional decorum under pressure')
          .setValue(session.answers?.scenario_ticket_heated || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('scenario_incident_escalation')
          .setLabel('Critical Incident Escalation (3 Sentences)') // 42 chars
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('When and how you alert Upper Management')
          .setValue(session.answers?.scenario_incident_escalation || '')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('verification_affirmation')
          .setLabel('Affirmation: No AI & all info is true') // 38 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Type "Yes, I agree"')
          .setValue(session.answers?.verification_affirmation || '')
          .setRequired(true)
      )
    );
  }

  return modal;
}

/* ========================================================================== */
/*                 STAFF REVIEW CARD WITH ARROW PAGINATION                    */
/* ========================================================================== */

/**
 * Builds the staff review card using modern Discord Components V2 Container (flags: 32768)
 * featuring the official applications banner, candidate status pill, formatted responses,
 * arrow pagination, and decision controls.
 */
export function buildStaffReviewCard(submission, page = 0) {
  const roleName = getRoleDisplayName(submission.role);
  const totalPages = 4;
  const safePage = Math.max(0, Math.min(totalPages - 1, page));

  const bannerPath = path.join(__dirname, 'assets', 'applications_banner.png');
  const files = [];

  let topBannerMediaUrl = 'attachment://applications_banner.png';
  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'applications_banner.png' }));
  }

  const isPending = submission.status === 'pending';
  const isApproved = submission.status === 'approved';
  const isDenied = submission.status === 'denied';

  let statusPillStyle = 1; // 1 = Primary Blurple
  let statusPillLabel = 'Pending Review';
  if (isApproved) {
    statusPillStyle = 3; // Success Green
    statusPillLabel = 'Approved';
  } else if (isDenied) {
    statusPillStyle = 4; // Danger Red
    statusPillLabel = 'Denied';
  }

  const ans = submission.answers || {};
  let pageContentText = '';

  if (safePage === 0) {
    if (submission.role === 'ingame_mod') {
      pageContentText = [
        `### Page 1 of 4 • Rules & Prerequisites`,
        `> **1. Read In-Game & Discord Regulations?**`,
        `• ${ans.rule_regulations || 'N/A'}`,
        '',
        `> **2. Current Age (14+ Requirement)**`,
        `• \`${ans.current_age || 'N/A'}\``,
        '',
        `> **3. Working Microphone for Voice Duties?**`,
        `• ${ans.functional_mic || 'N/A'}`,
        '',
        `> **4. Recording Software (OBS/Medal/GeForce)?**`,
        `• ${ans.recording_software || 'N/A'}`,
        '',
        `> **5. Emergency Availability Outside Shift Hours?**`,
        `• ${ans.urgent_availability || 'N/A'}`
      ].join('\n');
    } else {
      pageContentText = [
        `### Page 1 of 4 • Rules & Prerequisites`,
        `> **1. Read Guidelines & Terms of Service?**`,
        `• ${ans.rule_regulations || 'N/A'}`,
        '',
        `> **2. Current Age (14+ Requirement)**`,
        `• \`${ans.current_age || 'N/A'}\``,
        '',
        `> **3. Working Microphone for Staff Meetings?**`,
        `• ${ans.functional_mic || 'N/A'}`,
        '',
        `> **4. Timezone**`,
        `• \`${ans.timezone || 'N/A'}\``,
        '',
        `> **5. Weekly Schedule & Available Hours**`,
        ans.weekly_schedule ? ans.weekly_schedule.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    }
  } else if (safePage === 1) {
    if (submission.role === 'ingame_mod') {
      pageContentText = [
        `### Page 2 of 4 • Candidate Background & History`,
        `> **Roblox Profile & User ID**`,
        `• \`${ans.roblox_profile || 'N/A'}\``,
        '',
        `> **Timezone & Weekly Availability**`,
        `• ${ans.schedule_timezone || 'N/A'}`,
        '',
        `> **ER:LC Background & Interests**`,
        ans.background_erlc ? ans.background_erlc.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Previous Moderation History**`,
        ans.previous_history ? ans.previous_history.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Why Liberty County / LIBERTX Specifically?**`,
        ans.why_liberty ? ans.why_liberty.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    } else {
      pageContentText = [
        `### Page 2 of 4 • Motivation & Discord History`,
        `> **Motivation for LIBERTX Staff**`,
        ans.motivation ? ans.motivation.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Previous Discord Experience & Bot Knowledge**`,
        ans.discord_exp ? ans.discord_exp.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Unique Traits & Assets**`,
        ans.candidate_strengths ? ans.candidate_strengths.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Handling Bias & Impartiality**`,
        ans.handling_bias ? ans.handling_bias.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **Prior Infractions & Disciplinary History**`,
        ans.prior_infractions ? ans.prior_infractions.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    }
  } else if (safePage === 2) {
    if (submission.role === 'ingame_mod') {
      pageContentText = [
        `### Page 3 of 4 • Core Roleplay Knowledge & Rules`,
        `> **1. FailRP Definition & Corrective Actions**`,
        ans.def_frp ? ans.def_frp.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **2. RDM & VDM + Evidentiary Standards**`,
        ans.def_rdm_vdm ? ans.def_rdm_vdm.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **3. Metagaming & Powergaming Examples**`,
        ans.def_meta_power ? ans.def_meta_power.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **4. NLR & LTARP vs LTAP Distinction**`,
        ans.def_nlr_ltarp ? ans.def_nlr_ltarp.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **5. Key Admin Commands Proficiency**`,
        ans.key_commands ? ans.key_commands.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    } else {
      pageContentText = [
        `### Page 3 of 4 • Chat Moderation & Scenarios`,
        `> **1. Handling Toxic Arguments in Chat**`,
        ans.scenario_toxicity ? ans.scenario_toxicity.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **2. Mass-Ping Raid & Phishing Containment**`,
        ans.scenario_raid ? ans.scenario_raid.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **3. Automod Bypass & Hidden Toxicity**`,
        ans.scenario_automod_bypass ? ans.scenario_automod_bypass.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **4. Ticket Dispute & Abuse Allegation**`,
        ans.scenario_ticket_dispute ? ans.scenario_ticket_dispute.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **5. Banter vs Real Harassment Distinction**`,
        ans.scenario_banter ? ans.scenario_banter.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    }
  } else if (safePage === 3) {
    if (submission.role === 'ingame_mod') {
      pageContentText = [
        `### Page 4 of 4 • Realistic In-Game Scenarios & Affirmation`,
        `> **1. Mod Call Parking Location & Protocol**`,
        ans.scenario_mod_parking ? ans.scenario_mod_parking.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **2. Unproven RDM Investigation Procedure**`,
        ans.scenario_rdm_dispute ? ans.scenario_rdm_dispute.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **3. Exploiter Response Protocol**`,
        ans.scenario_exploits ? ans.scenario_exploits.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **4. Handling Colleague Command Abuse**`,
        ans.scenario_staff_abuse ? ans.scenario_staff_abuse.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **5. Candidate Affirmation & Verification**`,
        ans.verification_affirmation ? ans.verification_affirmation.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    } else {
      pageContentText = [
        `### Page 4 of 4 • Escalation Protocols & Affirmation`,
        `> **1. Sanction Progression (Warn, Mute, Kick, Ban)**`,
        ans.protocol_punishments ? ans.protocol_punishments.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **2. Unauthorized Self-Promo / Invite Links**`,
        ans.protocol_selfpromo ? ans.protocol_selfpromo.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **3. De-escalating Heated Ticket Conversations**`,
        ans.scenario_ticket_heated ? ans.scenario_ticket_heated.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **4. Critical Incident Escalation**`,
        ans.scenario_incident_escalation ? ans.scenario_incident_escalation.split('\n').map(l => `> ${l}`).join('\n') : '> N/A',
        '',
        `> **5. Candidate Affirmation & Verification**`,
        ans.verification_affirmation ? ans.verification_affirmation.split('\n').map(l => `> ${l}`).join('\n') : '> N/A'
      ].join('\n');
    }
  }

  const leftEmojiId = CONFIG.APPLICATIONS?.ARROW_LEFT_EMOJI_ID || '1550446757396348958';
  const rightEmojiId = CONFIG.APPLICATIONS?.ARROW_RIGHT_EMOJI_ID || '1550446417376448593';

  const containerComponents = [
    // 1. Top Banner
    {
      type: 12,
      items: [
        {
          media: {
            url: topBannerMediaUrl
          }
        }
      ]
    },
    // 2. Title & Header
    {
      type: 10,
      content:
        `## LIBERTX | Staff Application Review\n` +
        `> Official Staff Evaluation & Confidential Candidate Dossier • **${roleName}**`
    },
    // 3. Candidate Section with Status Pill
    {
      type: 9,
      components: [
        {
          type: 10,
          content:
            `**Candidate Information**\n` +
            `• **Applicant:** <@${submission.userId}> (\`${submission.userTag || submission.userId}\`)\n` +
            `• **Position Applied:** **${roleName}** • \`#${submission.id.slice(0, 8).toUpperCase()}\`\n` +
            `• **Submitted:** <t:${Math.floor(submission.submittedAt / 1000)}:f> (<t:${Math.floor(submission.submittedAt / 1000)}:R>)`
        }
      ],
      accessory: {
        type: 2,
        style: statusPillStyle,
        label: statusPillLabel,
        disabled: true,
        custom_id: 'app_review_status_pill'
      }
    }
  ];

  // 4. Executive Decision Box (if reviewed)
  if (submission.reviewedBy) {
    containerComponents.push({
      type: 10,
      content:
        `### Staff Executive Decision\n` +
        `> • **Reviewed By:** <@${submission.reviewedBy}>\n` +
        `> • **Decision Date:** <t:${Math.floor((submission.reviewedAt || Date.now()) / 1000)}:f>\n` +
        (submission.notes ? `> • **Staff Notes / Feedback:** ${submission.notes}\n` : '')
    });
  }

  // 5. Answers Display for Current Page
  containerComponents.push({
    type: 10,
    content: pageContentText
  });

  // 6. Navigation Action Row
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        emoji: { id: leftEmojiId },
        custom_id: `app_page_prev_${submission.id}_${safePage}`,
        disabled: safePage === 0
      },
      {
        type: 2,
        style: 2,
        label: `Page ${safePage + 1} of ${totalPages}`,
        disabled: true,
        custom_id: `app_page_info_${submission.id}`
      },
      {
        type: 2,
        style: 2,
        emoji: { id: rightEmojiId },
        custom_id: `app_page_next_${submission.id}_${safePage}`,
        disabled: safePage === totalPages - 1
      }
    ]
  });

  // 7. Review Decisions Action Row
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 3, // Success Green
        label: 'Approve Application',
        custom_id: `app_approve_${submission.id}`,
        disabled: !isPending
      },
      {
        type: 2,
        style: 4, // Danger Red
        label: 'Deny Application',
        custom_id: `app_deny_${submission.id}`,
        disabled: !isPending
      }
    ]
  });

  // 8. Micro Footer
  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Administration • Confidential Dossier #${submission.id.slice(0, 8).toUpperCase()}`
  });

  const bottomBanner = getBottomBannerAttachment();
  if (bottomBanner.attachment) {
    files.push(bottomBanner.attachment);
  }

  // 9. Bottom Accent Banner
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
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: containerComponents
      }
    ],
    files
  };
}

/**
 * Builds the modern Discord Components V2 result card posted into the public results channel
 * (1550413729013829725) when an application is accepted or denied.
 */
export function buildApplicationResultV2(submission) {
  const isApproved = submission.status === 'approved';
  const roleName = getRoleDisplayName(submission.role);
  const bannerPath = path.join(__dirname, 'assets', 'applications_banner.png');
  const files = [];

  let topBannerMediaUrl = 'attachment://applications_banner.png';
  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'applications_banner.png' }));
  }

  const statusLabel = isApproved ? 'Accepted' : 'Denied';
  const statusStyle = isApproved ? 3 : 4; // 3 = Success Green, 4 = Danger Red

  const containerComponents = [
    // 1. Top Banner
    {
      type: 12,
      items: [
        {
          media: {
            url: topBannerMediaUrl
          }
        }
      ]
    },
    // 2. Title & Introductory Text
    {
      type: 10,
      content:
        `## LIBERTX | Staff Application Result\n` +
        (isApproved
          ? `> Please join us in welcoming our newest staff member to the **LIBERTX** team!\n`
          : `> Thank you to all candidates who applied for the **LIBERTX** staff team.\n`)
    },
    // 3. Candidate Section with Status Pill
    {
      type: 9,
      components: [
        {
          type: 10,
          content: `**Applicant**\n<@${submission.userId}> • \`${submission.userTag || submission.userId}\``
        }
      ],
      accessory: {
        type: 2,
        style: statusStyle,
        label: statusLabel,
        disabled: true,
        custom_id: 'app_result_status_pill'
      }
    },
    // 4. Role Section with Position Pill
    {
      type: 9,
      components: [
        {
          type: 10,
          content: `**Staff Division & Position**\n${isApproved ? 'Official appointment to' : 'Application for'} **${roleName}**.`
        }
      ],
      accessory: {
        type: 2,
        style: 2, // Secondary Gray Pill
        label: roleName,
        disabled: true,
        custom_id: 'app_result_role_pill'
      }
    },
    // 5. Details & Next Steps Text
    {
      type: 10,
      content:
        `### Verification & Decision\n` +
        `> • **Decision:** **${statusLabel}** by <@${submission.reviewedBy}>\n` +
        `> • **Date Reviewed:** <t:${Math.floor((submission.reviewedAt || Date.now()) / 1000)}:f>\n` +
        (submission.notes ? `> • **Notes / Feedback:** ${submission.notes}\n` : '') +
        `\n### Next Steps\n` +
        (isApproved
          ? `> Please head over to <#1548146597743960146> and open a ticket to claim your staff permissions and schedule your staff orientation & patrol training.`
          : `> You may reapply during our next staff application cycle. We encourage you to remain active and try again!`)
    }
  ];

  // 6. Action Buttons inside card
  const buttonComponents = [
    {
      type: 2,
      style: statusStyle,
      label: statusLabel,
      disabled: true,
      custom_id: 'app_result_btn_status'
    },
    {
      type: 2,
      style: 2,
      label: roleName,
      disabled: true,
      custom_id: 'app_result_btn_role'
    }
  ];

  if (isApproved) {
    buttonComponents.push({
      type: 2,
      style: 1, // Primary Blurple
      label: 'Open Training Ticket',
      custom_id: `app_training_ticket_${submission.userId}_${submission.id}`
    });
  }

  containerComponents.push({
    type: 1,
    components: buttonComponents
  });

  // 7. Micro Footer
  containerComponents.push({
    type: 10,
    content: `-# LIBERTX Staff Administration • Official Application Result`
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
 * Fallback Embed result card if Discord Components V2 is unavailable
 */
export function buildApplicationResultFallback(submission) {
  const isApproved = submission.status === 'approved';
  const roleName = getRoleDisplayName(submission.role);
  const bannerPath = path.join(__dirname, 'assets', 'applications_banner.png');
  const files = [];

  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'applications_banner.png' }));
  }

  const embed = new EmbedBuilder()
    .setColor(isApproved ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`LIBERTX | Staff Application Result`)
    .setDescription(
      (isApproved
        ? `> Please join us in welcoming our newest staff member to the **LIBERTX** team!\n\n`
        : `> Thank you to all candidates who applied for the **LIBERTX** staff team.\n\n`) +
      `**Applicant:** <@${submission.userId}> (\`${submission.userTag || submission.userId}\`)\n` +
      `**Position:** **${roleName}**\n` +
      `**Decision:** **${isApproved ? 'Accepted' : 'Denied'}**\n` +
      `**Reviewed By:** <@${submission.reviewedBy}>\n` +
      `**Date:** <t:${Math.floor((submission.reviewedAt || Date.now()) / 1000)}:f>\n` +
      (submission.notes ? `**Notes / Feedback:** ${submission.notes}\n` : '') +
      `\n**Next Steps:**\n` +
      (isApproved
        ? `> Please open a ticket in <#1548146597743960146> to complete your staff orientation.`
        : `> You may reapply during our next staff application cycle.`)
    )
    .setImage('attachment://applications_banner.png')
    .setFooter({ text: 'LIBERTX Staff Administration' })
    .setTimestamp();

  const components = [];
  if (isApproved) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel('Open Training Ticket')
        .setCustomId(`app_training_ticket_${submission.userId}_${submission.id}`)
    );
    components.push(row);
  }

  return {
    embeds: [embed],
    components,
    files
  };
}

/**
 * Builds the modern Discord Components V2 direct message sent to the applicant
 * upon review (Acceptance or Denial) with banner at top and buttons inside the card.
 */
export function buildApplicationStatusDmV2({ status, role, notes, userId, reviewedBy }) {
  const roleName = getRoleDisplayName(role);
  const bannerPath = path.join(__dirname, 'assets', 'applications_banner.png');
  const files = [];

  let topBannerMediaUrl = 'attachment://applications_banner.png';
  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'applications_banner.png' }));
  }

  const bottomBanner = getBottomBannerAttachment();
  if (bottomBanner.attachment) {
    files.push(bottomBanner.attachment);
  }

  const isApproved = status === 'approved';

  const containerComponents = [
    // 1. Top Banner
    {
      type: 12,
      items: [
        {
          media: {
            url: topBannerMediaUrl
          }
        }
      ]
    },
    // 2. Title & Status Content
    {
      type: 10,
      content:
        `## LIBERTX | Application Status\n` +
        (isApproved
          ? `> Congratulations <@${userId}>! Your staff application for **${roleName}** has been **Accepted**.\n\n` +
            `### Application Summary\n` +
            `> • **Assigned Position:** **${roleName}**\n` +
            `> • **Status:** **Accepted**\n` +
            `> • **Reviewed By:** <@${reviewedBy}>\n` +
            `> • **Decision Date:** <t:${Math.floor(Date.now() / 1000)}:f>\n` +
            (notes ? `> • **Staff Notes:** ${notes}\n\n` : '\n') +
            `### Next Steps & Staff Training\n` +
            `> Please open a ticket in <#1548146597743960146> to claim your in-game & Discord staff roles and schedule your staff orientation & training session.\n\n` +
            `> *Welcome to the LIBERTX Staff Team.*`
          : `> Hello <@${userId}>, thank you for taking the time to apply for **${roleName}**.\n` +
            `> After review by Leadership, your staff application has been **Denied** at this time.\n\n` +
            `### Application Summary\n` +
            `> • **Applied Position:** **${roleName}**\n` +
            `> • **Status:** **DENIED**\n` +
            `> • **Reviewed By:** <@${reviewedBy}>\n` +
            `> • **Decision Date:** <t:${Math.floor(Date.now() / 1000)}:f>\n` +
            (notes ? `> • **Staff Feedback:** ${notes}\n\n` : '\n') +
            `> *You are welcome to re-apply in the future once you meet all server requirements and have gained more experience.*`)
    },
    // 3. Status Section Pill
    {
      type: 9,
      components: [
        {
          type: 10,
          content: isApproved
            ? '**Executive Decision**\n-# Verified and accepted by LIBERTX Leadership.'
            : '**Executive Decision**\n-# Reviewed and closed by LIBERTX Leadership.'
        }
      ],
      accessory: {
        type: 2,
        style: isApproved ? 3 : 4, // 3 = Success Green, 4 = Danger Red
        label: isApproved ? 'Accepted' : 'Denied',
        disabled: true,
        custom_id: 'app_dm_status_pill'
      }
    },
    // 4. Action Row with Buttons INSIDE Container
    {
      type: 1,
      components: isApproved
        ? [
            {
              type: 2,
              style: 3, // Green
              label: 'Accepted',
              disabled: true,
              custom_id: 'app_dm_btn_status'
            },
            {
              type: 2,
              style: 2, // Gray
              label: roleName,
              disabled: true,
              custom_id: 'app_dm_btn_role'
            },
            {
              type: 2,
              style: 1, // Primary Blurple
              label: 'Open Training Ticket',
              custom_id: `app_training_ticket_${userId}`
            }
          ]
        : [
            {
              type: 2,
              style: 4, // Red
              label: 'Denied',
              disabled: true,
              custom_id: 'app_dm_btn_status'
            },
            {
              type: 2,
              style: 2, // Gray
              label: roleName,
              disabled: true,
              custom_id: 'app_dm_btn_role'
            }
          ]
    },
    // 5. Micro Footer
    {
      type: 10,
      content: `-# LIBERTX Staff Management • Official Status Notification`
    }
  ];

  // 6. Bottom Banner Accent Strip
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

