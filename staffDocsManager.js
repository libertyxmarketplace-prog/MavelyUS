import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
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
 * Builds the primary Staff Documentation Panel (Hub) featuring the top banner
 * and an interactive dropdown select menu (strictly zero emojis).
 */
export function buildStaffDocsHubPayload(customConfig = null) {
  const files = [];
  let topBannerUrl = customConfig?.staffDocsTopBannerUrl?.trim() || null;
  let bottomBannerUrl = customConfig?.staffDocsBottomBannerUrl?.trim() || null;
  const srvName = customConfig?.serverName || 'Staff';

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

  const hubTitle = customConfig?.staffDocsTitle?.trim() || `${srvName} | Staff Documentation`;
  const hubDesc = customConfig?.staffDocsDescription?.trim() || [
    `> Welcome to the official Staff Documentation directory.`,
    `> Holding a staff position is a privilege that demands impartiality, professionalism, and accountability at all times. As a staff member, your conduct represents the standard of the entire community.`,
    ``,
    `### Directory Overview`,
    `> • General Staff Regulations & Code of Conduct`,
    `> • In-Game & Discord Moderation Standard Operating Procedures (SOP)`,
    `> • Progressive Disciplinary System & Strike Matrix`,
    `> • Official In-Game & Administrative Command Directory`,
    ``,
    `### Select a Document`,
    `> Choose a document below to review the corresponding operational policy.`
  ].join('\n');

  containerComponents.push({
    type: 10,
    content: `## ${hubTitle}\n${hubDesc}`
  });

  const layoutMode = customConfig?.staffDocsLayout || 'select';

  if (layoutMode === 'buttons') {
    // Buttons layout (2 rows of buttons)
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: 'General Staff Regulations',
          custom_id: 'staffdoc_btn_general_regulations'
        },
        {
          type: 2,
          style: 2,
          label: 'Moderation SOP',
          custom_id: 'staffdoc_btn_moderation_sop'
        }
      ]
    });
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: 'Strike Matrix & Disciplinary Policy',
          custom_id: 'staffdoc_btn_strike_matrix'
        },
        {
          type: 2,
          style: 2,
          label: 'Moderation Command Directory',
          custom_id: 'staffdoc_btn_staff_commands'
        }
      ]
    });
  } else {
    // String Select Menu (strictly zero emojis)
    containerComponents.push({
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'staffdoc_select_category',
          placeholder: 'Select a Staff Operational Manual...',
          options: [
            {
              label: 'General Staff Regulations & Conduct',
              value: 'general_regulations',
              description: 'Core responsibilities, activity expectations, integrity, and anti-abuse policies.'
            },
            {
              label: 'In-Game & Moderation SOP',
              value: 'moderation_sop',
              description: 'Mod call response protocol, freezing scenes, evidence standards, and ticket duties.'
            },
            {
              label: 'Strike Matrix & Disciplinary Policy',
              value: 'strike_matrix',
              description: 'Staff accountability, warning levels, strike penalties, and expiration timelines.'
            },
            {
              label: 'In-Game Moderation Command Directory',
              value: 'staff_commands',
              description: 'Authorized ER:LC server commands, syntax, and proper administrative usage.'
            }
          ]
        }
      ]
    });
  }

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

/**
 * Builds the selected documentation view (strictly zero emojis, high quality).
 */
export function buildStaffDocSectionPayload(sectionId) {
  const bannerPath = path.join(__dirname, 'assets', 'banner_staff_docs.png');
  const files = [];

  if (fs.existsSync(bannerPath)) {
    files.push(new AttachmentBuilder(bannerPath, { name: 'banner_staff_docs.png' }));
  }

  let contentText = '';

  if (sectionId === 'staff_regulations' || sectionId === 'general_regulations') {
    contentText =
      `## LIBERTX | Staff Regulations & Code of Conduct\n` +
      `> Section I: Core Directives & Professional Expectations\n\n` +
      `### S1. Standard of Professionalism\n` +
      `> Staff members must maintain a calm, objective, and mature demeanor in all interactions. Arguing with community members, engaging in public toxicity, or reacting defensively during administrative disputes will not be tolerated under any circumstances.\n\n` +
      `### S2. Activity Requirements\n` +
      `> All staff members must attend a minimum of three (3) official server sessions weekly and maintain an active presence across Discord ticket channels. If personal obligations prevent you from fulfilling your quota, you are required to submit an official Leave of Absence via \`-loa\` prior to inactivity.\n\n` +
      `### S3. Neutrality & Impartiality\n` +
      `> Staff members are strictly prohibited from showing bias, favoritism, or leniency toward friends, faction members, or department colleagues. Decisions must be grounded entirely on verifiable evidence and established server rules.\n\n` +
      `### S4. Abuse of Administrative Power\n` +
      `> In-game commands (including teleportation, vehicle spawning, health overrides, and respawning) may only be utilized strictly for active administrative duty. Utilizing staff privileges to gain in-character advantages during pursuits, shootouts, or criminal scenarios results in immediate termination and server blacklisting.\n\n` +
      `### S5. Confidentiality & Security\n` +
      `> Discussions within staff channels, management directives, internal reviews, and ticket transcripts are strictly confidential. Sharing screenshots or disclosing internal records to regular community members is considered severe misconduct.\n\n` +
      `-# LIBERTX Staff Administration • Official Regulatory Standard`;
  } else if (sectionId === 'moderation_sop') {
    contentText =
      `## LIBERTX | In-Game & Moderation SOP\n` +
      `> Section II: Operational Callout & Dispute Resolution Protocol\n\n` +
      `### M1. Mod Call Response Procedure\n` +
      `> 1. Enter moderation mode before responding to any active callout.\n` +
      `> 2. Teleport to the reporting player using discreet positioning to avoid disrupting ongoing realistic scenes.\n` +
      `> 3. If a scene requires immediate administrative pause, freeze the involved parties and communicate via administrative private message.\n\n` +
      `### M2. Proof & Evidence Verification Standard\n` +
      `> Disciplinary actions exceeding verbal warnings require verifiable evidence (unaltered video recordings or direct staff observation). Verbal claims from reporting players are insufficient grounds for kicks or bans. If evidence cannot be produced, advise the player to document future encounters.\n\n` +
      `### M3. Discord Ticket Handling\n` +
      `> Staff members must claim support tickets promptly. Read the inquiry completely before responding, communicate with formal grammar, and ensure all user questions are answered prior to initiating ticket closure. Do not leave tickets unclaimed for more than five (5) minutes.\n\n` +
      `### M4. In-Game Roleplay Prioritization\n` +
      `> When on the staff team, server moderation takes absolute priority over personal roleplay. If mod calls are pending or server rules are being violated, staff must immediately handle moderation obligations before returning to character play.\n\n` +
      `-# LIBERTX Staff Administration • Standard Operating Procedure`;
  } else if (sectionId === 'strike_matrix') {
    contentText =
      `## LIBERTX | Progressive Disciplinary Matrix\n` +
      `> Section III: Staff Accountability & Strike Structure\n\n` +
      `### Overview of Progressive Discipline\n` +
      `> Staff members are subject to consistent disciplinary standards. Violations of staff regulations or neglect of duty will result in recorded disciplinary actions posted publicly to #infractions.\n\n` +
      `### Strike Progression Levels\n` +
      `> • **Level 1 (Written Warning):**\n` +
      `> Formal counseling regarding minor infractions (e.g. low activity, minor procedural errors). Documented in #infractions.\n\n` +
      `> • **Level 2 (First Strike):**\n` +
      `> Issued for repeated errors, unprofessional conduct, or neglect of mod calls. Suspends promotion eligibility for 30 days.\n\n` +
      `> • **Level 3 (Second Strike):**\n` +
      `> Issued for serious policy violations, failure to follow management directives, or severe inactivity without LOA. Results in temporary suspension of moderation permissions and final notice.\n\n` +
      `> • **Level 4 (Third Strike / Demotion / Removal):**\n` +
      `> Reaching three active strikes results in immediate demotion or permanent removal from the LIBERTX staff team.\n\n` +
      `### Strike Expiration Timeline\n` +
      `> Strikes remain active on a staff member's record for forty-five (45) consecutive days from the date of issuance. Following 45 days of clean and active service, the strike is removed from the active count.\n\n` +
      `-# LIBERTX Staff Administration • Disciplinary Matrix`;
  } else if (sectionId === 'staff_commands') {
    contentText =
      `## LIBERTX | Administrative Command Directory\n` +
      `> Section IV: In-Game ER:LC & Discord Syntax Guide\n\n` +
      `### In-Game ER:LC Commands\n` +
      `> • \`:to [player]\` - Teleports staff member directly to target player.\n` +
      `> • \`:bring [player]\` - Teleports player to staff member's location.\n` +
      `> • \`:freeze [player]\` - Locks player avatar position during active dispute resolution.\n` +
      `> • \`:thaw [player]\` - Unlocks player movement following call resolution.\n` +
      `> • \`:respawn [player]\` - Respawns player avatar to resolve glitching or physics bugs.\n` +
      `> • \`:jail [player] [time] [reason]\` - Places disruptive user in administrative confinement.\n` +
      `> • \`:kick [player] [reason]\` - Removes disruptive user from the current live session.\n` +
      `> • \`:ban [player] [time] [reason]\` - Issues temporary or permanent server blacklist.\n` +
      `> • \`:m [message]\` - Broadcasts server-wide administrative announcement.\n` +
      `> • \`:pm [player] [message]\` - Sends private administrative directive to player.\n\n` +
      `### Usage Guidelines\n` +
      `> Broadcast commands (\`:m\`) must only be utilized for critical server operations such as session starts, priority cooldowns, and server shutdowns.\n\n` +
      `-# LIBERTX Staff Administration • Command Directory`;
  }

  const v2Payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          ...(files.length > 0
            ? [
                {
                  type: 12,
                  items: [{ media: { url: 'attachment://banner_staff_docs.png' } }]
                }
              ]
            : []),
          {
            type: 10,
            content: contentText
          }
        ]
      }
    ],
    files
  };

  return v2Payload;
}
