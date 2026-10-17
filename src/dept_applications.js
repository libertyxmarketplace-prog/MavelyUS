import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextDisplayBuilder
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Channels Configuration ──
export const DEPT_PANEL_CHANNEL_ID = '1360792977181769768';
export const DEPT_REVIEW_CHANNEL_ID = '1559117237531447376';
export const DEPT_RESULTS_CHANNEL_ID = '1360793057930252539';

// ── Custom Emojis ──
export const EMOJI_POLICE = { id: '1546362652748677170', name: 'tuscaloosapolice' };
export const EMOJI_SHERIFF = { id: '1546362692229664778', name: 'tuscaloosasheriff' };
export const EMOJI_ALEA = { id: '1546362722923581533', name: 'ALEA' };
export const EMOJI_FIRE = { id: '1546362746595971124', name: 'tuscaloosafire' };
export const EMOJI_DISPATCH = { id: '1546362793077506180', name: 'alabamadispatch' };

export const EMOJI_ARROW_LEFT = { id: '1554995417681362964', name: 'left' };
export const EMOJI_ARROW_RIGHT = { id: '1554995281668612196', name: 'right' };

// ── Assets ──
const ASSETS_DIR = path.resolve(__dirname, '../assets');
const DEPT_BANNER_PATH = path.join(ASSETS_DIR, 'dept_app_banner.png');
const DEPT_PASSED_PATH = path.join(ASSETS_DIR, 'dept_app_passed.png');
const DEPT_FAILED_PATH = path.join(ASSETS_DIR, 'dept_app_failed.png');

export const DEPT_BANNER_FALLBACK_URL =
  'https://media.discordapp.net/attachments/1360792977181769768/1556006070256664636/Applications.png?backend=b2&ex=6acdcbd4&is=6acc7a54&hm=0ec4e20b2b3501c8cbab62b0d827a9f52c0310aff45c8cf42aa8fadd5de76268&=&format=webp&quality=lossless&width=2048&height=684';

// ── ANSI Anti-AI Warning Notice ──
export const DEPT_AI_POLICY_NOTICE =
  '```ansi\n' +
  '\u001b[1;31m⛔ AI-GENERATED APPLICATIONS ARE NOT ACCEPTED\u001b[0m\n' +
  '\u001b[1;33mAny section of your application written, edited, or expanded with AI results in an immediate and permanent blacklist - no warning, no appeal, no exceptions.\u001b[0m\n' +
  '\u001b[2;37mEvery answer must be written by you, in your own words, describing your own experience, availability, and personality. We review for authenticity.\u001b[0m\n' +
  '```';

// ── Persistence ──
const DEPT_APPS_FILE = path.resolve(__dirname, '../dept_applications.json');
const activeDeptApps = new Map();
const startingDeptApps = new Set();

function thinLine() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
}

export function loadDeptApplications() {
  try {
    if (!fs.existsSync(DEPT_APPS_FILE)) return;
    let text = fs.readFileSync(DEPT_APPS_FILE, 'utf8');
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    text = text.trim();
    if (text.startsWith('"')) text = text.replace(/^"+/, '');
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object') return;
    activeDeptApps.clear();
    for (const [k, v] of Object.entries(raw)) activeDeptApps.set(k, v);
    console.log(`[DeptApps] Restored ${activeDeptApps.size} department application(s) from dept_applications.json.`);
  } catch (err) {
    console.error('[DeptApps] Failed to load dept_applications.json:', err.message);
  }
}

export function saveDeptApplications() {
  try {
    const flat = {};
    for (const [k, v] of activeDeptApps) flat[k] = v;
    fs.writeFileSync(DEPT_APPS_FILE, JSON.stringify(flat, null, 2), 'utf8');
  } catch (err) {
    console.error('[DeptApps] Failed to save dept_applications.json:', err.message);
  }
}

// ── Department Configuration ──
export const DEPARTMENTS = {
  tpd: {
    key: 'tpd',
    name: 'Tuscaloosa Police Department',
    shortName: 'TPD',
    emoji: EMOJI_POLICE,
    desc: 'City patrol, traffic enforcement, municipal response, and urban order.',
    roleName: 'Tuscaloosa Police',
    discordInvite: 'https://discord.gg/rdUa4sGssB'
  },
  tcso: {
    key: 'tcso',
    name: 'Tuscaloosa County Sheriff\'s Office',
    shortName: 'TCSO',
    emoji: EMOJI_SHERIFF,
    desc: 'County jurisdiction, rural patrols, warrants, and court security.',
    roleName: 'Sheriff\'s Deputy',
    discordInvite: 'https://discord.gg/BptjsJXSGu'
  },
  ast: {
    key: 'ast',
    name: 'Alabama State Troopers',
    shortName: 'AST',
    emoji: EMOJI_ALEA,
    desc: 'State highway safety, interstate enforcement, and pursuit intervention.',
    roleName: 'State Trooper',
    discordInvite: 'https://discord.gg/3JsHhAnEfU'
  },
  tfr: {
    key: 'tfr',
    name: 'Tuscaloosa Fire Rescue',
    shortName: 'TFR',
    emoji: EMOJI_FIRE,
    desc: 'Fire suppression, vehicle extrication, and technical rescue operations.',
    roleName: 'Firefighter',
    discordInvite: 'https://discord.gg/VyejhZUWj5'
  },
  ems: {
    key: 'ems',
    name: 'Northstar Medical (EMS)',
    shortName: 'Northstar EMS',
    emoji: EMOJI_DISPATCH,
    desc: 'Emergency medical services, paramedic trauma care, and dispatch operations.',
    roleName: 'Paramedic / Dispatcher',
    discordInvite: 'https://discord.gg/MRRBwA948N'
  }
};

// ── Panel Card Builder (Clean, Sleek, NO generic emojis, NO buttons, Only Select Menu) ──
export function buildDeptApplicationPanelCard(bannerUrlOverride) {
  const card = new ContainerBuilder();
  const bannerUrl = bannerUrlOverride || (fs.existsSync(DEPT_BANNER_PATH) ? 'attachment://dept_app_banner.png' : DEPT_BANNER_FALLBACK_URL);

  card.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl))
  );

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '# DEPARTMENT APPLICATIONS\n' +
      '### Welcome to the Alabama State Roleplay Department Applications Hub!\n\n' +
      'This is where you will find the applications for all available departments within **Alabama State Roleplay**. If you are interested in joining a department, you must complete the appropriate application and meet the department\'s requirements before you can be accepted.'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### BEFORE APPLYING\n' +
      'Before submitting a department application, please make sure you understand the expectations and requirements of the department you are applying for:\n\n' +
      '• **Be Active:** You must remain active within Alabama State Roleplay and participate regularly within the community.\n' +
      '• **Meet Department Requirements:** Each department may have different requirements. Make sure you meet the requirements listed on the department application before submitting.\n' +
      '• **Be Professional:** You are expected to remain professional, respectful, and mature throughout the application process and while representing your department.\n' +
      '• **Be Honest:** All applications must be completed truthfully. Providing false or misleading information may result in your application being denied.'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### IMPORTANT NOTICE\n' +
      'Submitting an application does not guarantee acceptance.\n\n' +
      '• **Department Leadership** reserves the right to accept or deny applications based on the applicant\'s eligibility, application quality, activity, professionalism, and department needs.\n' +
      '• Do not repeatedly contact Department Leadership regarding the status of your application. Please allow adequate time for applications to be reviewed.'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(DEPT_AI_POLICY_NOTICE)
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('### SELECT A DEPARTMENT\nChoose the department you wish to apply for below. Your application will be sent directly to your Direct Messages.')
  );

  // Single Clean Select Menu with ONLY the requested custom emojis
  const selectOptions = Object.values(DEPARTMENTS).map((d) => ({
    label: d.name,
    value: `dept_apply_${d.key}`,
    description: d.desc.slice(0, 100),
    emoji: d.emoji
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('dept_app_select')
    .setPlaceholder('Choose a department to apply...')
    .addOptions(selectOptions);

  card.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

  return card;
}

// ── Applicant DM Dashboard Builder (High-End & Comprehensive) ──
export function buildDeptApplicantDashboard(appData) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const card = new ContainerBuilder();

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${dept.name} Application\n` +
      `### Welcome to the Official ${dept.name} Recruitment Process\n\n` +
      `Thank you for your interest in serving with the **${dept.name}**, <@${appData.applicantId}>. This application is designed to identify applicants who demonstrate professionalism, maturity, integrity, sound judgment, communication skills, and a genuine understanding of emergency roleplay.\n\n` +
      `> *This is a selective recruitment process. Submission does not guarantee an interview or appointment. Applicants are evaluated on the quality and depth of their reasoning, not simply one-word answers.*`
    )
  );

  card.addSeparatorComponents(thinLine());

  // 12-Step Recruitment Pipeline (Directly from User Specification)
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### What Happens After You Submit?\n' +
      '**1. Application Review:** Recruitment personnel review your responses for completeness, judgment, and suitability.\n' +
      '**2. Application Decision:** Outcomes include Accepted for Interview, Further Review, or Denied.\n' +
      '**3. Background & Conduct Review:** Review of prior departmental experience, server conduct, and disciplinary history.\n' +
      '**4. Interview:** Qualified applicants may be invited to a formal interview covering situational judgment.\n' +
      '**5. Conditional Acceptance:** Conditional offer to enter the recruitment pipeline.\n' +
      '**6. Recruit Status:** Onboarding as a Department Recruit with training requirements.\n' +
      '**7. Department Academy:** Training covering SOPs, communications, patrol/suppression procedures, report writing, and use-of-force.\n' +
      '**8. Academy Examination:** Successful completion of written and practical evaluations.\n' +
      '**9. Field Training Program:** Supervised operations with an assigned Field Training Officer (FTO).\n' +
      '**10. Probationary Status:** Advancement to probationary operational status under continuous evaluation.\n' +
      '**11. Final Evaluation:** Determination of competence, professionalism, judgment, and reliability.\n' +
      '**12. Full Appointment:** Completion results in official appointment to active duty.'
    )
  );

  card.addSeparatorComponents(thinLine());

  // Progress Checklist (6 Comprehensive Sections)
  const s1 = appData.step1Done ? '✅' : '⚪';
  const s2 = appData.step2Done ? '✅' : '⚪';
  const s3 = appData.step3Done ? '✅' : '⚪';
  const s4 = appData.step4Done ? '✅' : '⚪';
  const s5 = appData.step5Done ? '✅' : '⚪';
  const s6 = appData.step6Done ? '✅' : '⚪';

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### Application Sections\n' +
      `${s1} **Section 1:** Candidate Verification & Availability\n` +
      `${s2} **Section 2:** Department Experience & Disciplinary History\n` +
      `${s3} **Section 3:** Chain of Command, Trust & Patrol Decisions\n` +
      `${s4} **Section 4:** Roleplay Standards & Core Definitions\n` +
      `${s5} **Section 5:** High-Stakes Realistic Scenarios\n` +
      `${s6} **Section 6:** Leadership, Accountability & Integrity Pledge\n\n` +
      `*Click each section button below to open its form. Once all 6 sections show green checkmarks, the Submit button will unlock.*`
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(DEPT_AI_POLICY_NOTICE)
  );

  card.addSeparatorComponents(thinLine());

  const allDone = appData.step1Done && appData.step2Done && appData.step3Done && appData.step4Done && appData.step5Done && appData.step6Done;

  // Buttons Row 1: Sections 1-3
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_step1_${appData.id}`)
      .setLabel(appData.step1Done ? '✓ Sec 1: Verification' : 'Sec 1: Verification')
      .setStyle(appData.step1Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step2_${appData.id}`)
      .setLabel(appData.step2Done ? '✓ Sec 2: Experience' : 'Sec 2: Experience')
      .setStyle(appData.step2Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step3_${appData.id}`)
      .setLabel(appData.step3Done ? '✓ Sec 3: Protocol' : 'Sec 3: Protocol')
      .setStyle(appData.step3Done ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // Buttons Row 2: Sections 4-6
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_step4_${appData.id}`)
      .setLabel(appData.step4Done ? '✓ Sec 4: RP Knowledge' : 'Sec 4: RP Knowledge')
      .setStyle(appData.step4Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step5_${appData.id}`)
      .setLabel(appData.step5Done ? '✓ Sec 5: Scenarios' : 'Sec 5: Scenarios')
      .setStyle(appData.step5Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step6_${appData.id}`)
      .setLabel(appData.step6Done ? '✓ Sec 6: Integrity' : 'Sec 6: Integrity')
      .setStyle(appData.step6Done ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // Buttons Row 3: Submit / Cancel
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_submit_${appData.id}`)
      .setLabel(allDone ? 'Submit Application' : 'Complete All Sections to Submit')
      .setStyle(allDone ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!allDone),
    new ButtonBuilder()
      .setCustomId(`dept_btn_cancel_${appData.id}`)
      .setLabel('Cancel Application')
      .setStyle(ButtonStyle.Danger)
  );

  card.addActionRowComponents(row1, row2, row3);

  return card;
}

// ── Application Initialization ──
export async function startDeptApplication(interaction, deptKey) {
  const dept = DEPARTMENTS[deptKey];
  if (!dept) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: '❌ Invalid department selected.' }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Invalid department selected.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    return;
  }

  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch {
      return;
    }
  }

  const userId = interaction.user.id;
  if (startingDeptApps.has(userId)) {
    await interaction.editReply({ content: '⏳ Your application is already being initialized.' }).catch(() => {});
    return;
  }
  startingDeptApps.add(userId);
  setTimeout(() => startingDeptApps.delete(userId), 6000);

  loadDeptApplications();
  const existing = [...activeDeptApps.values()].find(a => a.applicantId === userId && a.status === 'pending_review');
  if (existing) {
    await interaction.editReply({
      content: `⚠️ You already have a pending **${existing.deptName}** application under review. Please await leadership results in <#${DEPT_RESULTS_CHANNEL_ID}>.`
    }).catch(() => {});
    return;
  }

  const appId = `dept_${Date.now().toString(36)}_${userId.slice(-4)}`;
  const newApp = {
    id: appId,
    applicantId: userId,
    applicantTag: interaction.user.tag,
    deptKey: deptKey,
    deptName: dept.name,
    status: 'in_progress',
    step1Done: false,
    step2Done: false,
    step3Done: false,
    step4Done: false,
    step5Done: false,
    step6Done: false,
    sec1: null,
    sec2: null,
    sec3: null,
    sec4: null,
    sec5: null,
    sec6: null,
    createdAt: Date.now(),
    submittedAt: null,
    reviewedBy: null,
    reviewerNotes: null,
    dmMessageId: null
  };

  try {
    const dmCh = await interaction.user.createDM().catch(() => null);
    if (!dmCh) {
      await interaction.editReply({
        content: '❌ Direct Messages are closed. Please enable **Direct Messages from server members** in your Privacy & Safety settings, then try again.'
      }).catch(() => {});
      return;
    }

    const recentDms = await dmCh.messages.fetch({ limit: 12 }).catch(() => null);
    if (recentDms) {
      const oldCards = recentDms.filter(m =>
        m.author?.id === interaction.client.user?.id &&
        (m.content?.includes('Application') || JSON.stringify(m.components || []).includes('dept_btn_'))
      );
      for (const old of oldCards.values()) {
        await old.delete().catch(() => {});
      }
    }

    const dashboard = buildDeptApplicantDashboard(newApp);
    const dmMsg = await dmCh.send({
      components: [dashboard.toJSON()],
      flags: MessageFlags.IsComponentsV2
    });
    newApp.dmMessageId = dmMsg.id;
    activeDeptApps.set(newApp.id, newApp);
    saveDeptApplications();

    await interaction.editReply({
      content: `✅ Opened your **${dept.name}** application in your Direct Messages! Check your DMs to proceed.`
    }).catch(() => {});
  } catch (err) {
    console.error('[DeptApps] Error launching application DM:', err.message);
    await interaction.editReply({
      content: `❌ Could not send application to your DMs (${err.message}).`
    }).catch(() => {});
  }
}

// ── Modals Builders (Strictly <= 45 character labels) ──
export function buildStep1Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step1_${appId}`)
    .setTitle('Section 1: Verification & Hours')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('roblox_user').setLabel('Roblox Username*').setPlaceholder('Enter your exact Roblox username').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('discord_info').setLabel('Discord Username & User ID*').setPlaceholder('Username / Discord ID').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('age_tz').setLabel('Current Age & Timezone*').setPlaceholder('e.g. 16 | EST (Eastern Time)').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('community_tenure').setLabel('Community Membership Duration*').setPlaceholder('How long have you been a member of ASRP?').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('hours_mic').setLabel('Hours/Week & Working Mic Status*').setPlaceholder('e.g. 12 hrs/wk | Yes - working microphone').setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
}

export function buildStep2Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step2_${appId}`)
    .setTitle('Section 2: Experience & History')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('prev_exp').setLabel('Describe your previous RP Experience*').setPlaceholder('Detail previous communities and departments you served with').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('highest_rank').setLabel('Highest rank earned & responsibilities?*').setPlaceholder('State rank, division, and what leadership you held').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('discipline_history').setLabel('Ever removed, demoted, warned in RP?*').setPlaceholder('Truthful explanation (honesty is evaluated)').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('erlc_bans').setLabel('Ever banned from an ER:LC community?*').setPlaceholder('State communities, reasons, or "Never banned"').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('trust_authority').setLabel('Why should we trust you with authority?*').setPlaceholder('Do not just say "I am mature" - explain what makes someone trustworthy').setStyle(TextInputStyle.Paragraph).setRequired(true)
      )
    );
}

export function buildStep3Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step3_${appId}`)
    .setTitle('Section 3: Protocol & Standards')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('respect_vs_trust').setLabel('More important: Respected or Trusted?*').setPlaceholder('Explain your reasoning thoughtfully').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('professionalism_meaning').setLabel('What does professionalism mean to you?*').setPlaceholder('Describe professionalism under stressful roleplay scenes').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('chain_of_command').setLabel('Explain purpose of Chain of Command*').setPlaceholder('Why does chain of command exist and what does it achieve?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('sergeant_conflict').setLabel('Order conflicts with established policy?*').setPlaceholder('Explain your exact process rather than just "I would disobey"').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('unseen_mistake').setLabel('Serious patrol mistake & nobody saw it?*').setPlaceholder('What do you do immediately?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      )
    );
}

export function buildStep4Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step4_${appId}`)
    .setTitle('Section 4: Roleplay Knowledge')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('meta_power').setLabel('Metagaming vs Powergaming difference?*').setPlaceholder('Provide clear ER:LC definitions and realistic examples for both').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('rdm_vdm').setLabel('What is RDM and VDM?*').setPlaceholder('Provide exact definitions and explain why both are prohibited').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('ic_ooc_separation').setLabel('Why separate IC and OOC information?*').setPlaceholder('Explain why IC frustration must never cross into OOC malice').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('insult_arrest').setLabel('Civilian insults you IC. Justify arrest?*').setPlaceholder('Does an insult provide legal grounds for arrest? Explain why/why not').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('friend_policy_violation').setLabel('Close friend violates policy; nobody saw?*').setPlaceholder('Friend says "Don\'t report this, we are friends." What do you do?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      )
    );
}

export function buildStep5Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step5_${appId}`)
    .setTitle('Section 5: Scenario Examination')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scen_traffic_rude').setLabel('Rude driver: "You are just a kid playing"*').setPlaceholder('Explain exactly how you handle this stop from beginning to end').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scen_supervisor_arrest').setLabel('Supervisor: Arrest civilian "Cause I say"*').setPlaceholder('You do not understand what violation occurred. What do you do?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scen_pursuit_terminate').setLabel('Minor pursuit turns dangerous; terminate?*').setPlaceholder('Supervisor orders termination. Suspect in visual. What do you do?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scen_wrong_person').setLabel('Arrested wrong person; nobody noticed?*').setPlaceholder('You realize after completing the arrest. What do you do?').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scen_action_escalate').setLabel('Escalate minor stop just for more action?*').setPlaceholder('Would you intentionally escalate a scene for entertainment? Explain').setStyle(TextInputStyle.Paragraph).setRequired(true)
      )
    );
}

export function buildStep6Modal(appId) {
  return new ModalBuilder()
    .setCustomId(`dept_modal_step6_${appId}`)
    .setTitle('Section 6: Leadership & Integrity')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('why_dept_specific').setLabel('Why do you specifically want this dept?*').setPlaceholder('Explain what you want to contribute (not just "I want to be a cop/medic")').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('weakness_growth').setLabel('One personal weakness & how to improve?*').setPlaceholder('Describe a genuine weakness and your active steps to address it').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('unsupervised_authority').setLabel('Given authority, nobody watching. Abuse?*').setPlaceholder('What prevents you from abusing authority? Provide a serious answer').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('criticism_disrespect').setLabel('Criticism vs Disrespect difference?*').setPlaceholder('Explain how you receive disciplinary direction and feedback').setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('integrity_pledge').setLabel('Pledge: 100% original, no AI (I Agree)*').setPlaceholder('Type "I Agree" to pledge truthful, original answers').setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
}

// ── Review Card Builder (In Review Logs #1559117237531447376) ──
export function buildDeptReviewCard(appData, pageIndex = 0) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const card = new ContainerBuilder();

  const totalPages = 6;
  const page = Math.max(0, Math.min(totalPages - 1, pageIndex));

  const s1 = appData.sec1 || {};
  const s2 = appData.sec2 || {};
  const s3 = appData.sec3 || {};
  const s4 = appData.sec4 || {};
  const s5 = appData.sec5 || {};
  const s6 = appData.sec6 || {};

  if (page === 0) {
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 1/6\n` +
        `### Candidate Verification & Availability\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
        `> **Department:** **${dept.name}**\n` +
        `> **Roblox Username:** \`${s1.roblox_user || 'N/A'}\`\n` +
        `> **Discord Info:** \`${s1.discord_info || 'N/A'}\`\n` +
        `> **Age & Timezone:** \`${s1.age_tz || 'N/A'}\`\n` +
        `> **Tenure:** \`${s1.community_tenure || 'N/A'}\`\n` +
        `> **Hours & Microphone:** \`${s1.hours_mic || 'N/A'}\``
      )
    );
  } else if (page === 1) {
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 2/6\n` +
        `### Experience & Disciplinary Record\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**Previous RP Experience:**\n` +
        `> ${(s2.prev_exp || 'N/A').slice(0, 350)}\n\n` +
        `**Highest Rank & Responsibilities:**\n` +
        `> ${(s2.highest_rank || 'N/A').slice(0, 350)}\n\n` +
        `**Disciplinary History in RP:**\n` +
        `> ${(s2.discipline_history || 'N/A').slice(0, 350)}\n\n` +
        `**ER:LC Bans:** \`${(s2.erlc_bans || 'N/A').slice(0, 200)}\`\n\n` +
        `**Trust with Authority:**\n` +
        `> ${(s2.trust_authority || 'N/A').slice(0, 350)}`
      )
    );
  } else if (page === 2) {
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 3/6\n` +
        `### Protocol, Chain of Command & Standards\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**Respected vs Trusted:**\n` +
        `> ${(s3.respect_vs_trust || 'N/A').slice(0, 350)}\n\n` +
        `**Professionalism Definition:**\n` +
        `> ${(s3.professionalism_meaning || 'N/A').slice(0, 350)}\n\n` +
        `**Chain of Command Purpose:**\n` +
        `> ${(s3.chain_of_command || 'N/A').slice(0, 350)}\n\n` +
        `**Conflicting Supervisor Order:**\n` +
        `> ${(s3.sergeant_conflict || 'N/A').slice(0, 350)}\n\n` +
        `**Unseen Patrol Mistake:**\n` +
        `> ${(s3.unseen_mistake || 'N/A').slice(0, 350)}`
      )
    );
  } else if (page === 3) {
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 4/6\n` +
        `### Roleplay Knowledge & Server Rules\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**Metagaming vs Powergaming:**\n` +
        `> ${(s4.meta_power || 'N/A').slice(0, 350)}\n\n` +
        `**RDM & VDM:**\n` +
        `> ${(s4.rdm_vdm || 'N/A').slice(0, 350)}\n\n` +
        `**IC vs OOC Separation:**\n` +
        `> ${(s4.ic_ooc_separation || 'N/A').slice(0, 350)}\n\n` +
        `**Civilian Insults & Arrest Grounds:**\n` +
        `> ${(s4.insult_arrest || 'N/A').slice(0, 350)}\n\n` +
        `**Friend Policy Violation:**\n` +
        `> ${(s4.friend_policy_violation || 'N/A').slice(0, 350)}`
      )
    );
  } else if (page === 4) {
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 5/6\n` +
        `### Scenario Examination\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**Rude Traffic Stop Handling:**\n` +
        `> ${(s5.scen_traffic_rude || 'N/A').slice(0, 350)}\n\n` +
        `**Supervisor Unexplained Arrest:**\n` +
        `> ${(s5.scen_supervisor_arrest || 'N/A').slice(0, 350)}\n\n` +
        `**Dangerous Pursuit Termination:**\n` +
        `> ${(s5.scen_pursuit_terminate || 'N/A').slice(0, 350)}\n\n` +
        `**Wrong Person Arrested:**\n` +
        `> ${(s5.scen_wrong_person || 'N/A').slice(0, 350)}\n\n` +
        `**Action Escalation Temptation:**\n` +
        `> ${(s5.scen_action_escalate || 'N/A').slice(0, 350)}`
      )
    );
  } else {
    const isDone = appData.status === 'accepted' || appData.status === 'denied';
    const statusText = appData.status === 'accepted'
      ? `✅ **ACCEPTED** by <@${appData.reviewedBy}>`
      : (appData.status === 'denied' ? `❌ **DENIED** by <@${appData.reviewedBy}>` : '⏳ **Pending Leadership Verdict**');

    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${dept.name} Application Review - Page 6/6\n` +
        `### Leadership, Accountability & Verdict\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
        `> **Status:** ${statusText}\n` +
        (appData.reviewerNotes ? `> **Reviewer Notes:** ${appData.reviewerNotes}\n\n` : '\n') +
        `**Why do you want to join ${dept.shortName}?**\n` +
        `> ${(s6.why_dept_specific || 'N/A').slice(0, 350)}\n\n` +
        `**Personal Weakness & Growth:**\n` +
        `> ${(s6.weakness_growth || 'N/A').slice(0, 350)}\n\n` +
        `**Preventing Abuse of Authority:**\n` +
        `> ${(s6.unsupervised_authority || 'N/A').slice(0, 350)}\n\n` +
        `**Criticism vs Disrespect:**\n` +
        `> ${(s6.criticism_disrespect || 'N/A').slice(0, 350)}\n\n` +
        `**Integrity Pledge:** \`${s6.integrity_pledge || 'N/A'}\``
      )
    );

    if (!isDone) {
      card.addSeparatorComponents(thinLine());
      const verdictRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dept_verdict_accept_${appData.id}`).setLabel('Accept Application').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`dept_verdict_deny_${appData.id}`).setLabel('Deny Application').setStyle(ButtonStyle.Danger)
      );
      card.addActionRowComponents(verdictRow);
    }
  }

  card.addSeparatorComponents(thinLine());

  // Navigation Row using the requested Custom Arrow Emojis
  const leftBtn = new ButtonBuilder()
    .setCustomId(`dept_rev_page_${appData.id}_${page - 1}`)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(EMOJI_ARROW_LEFT)
    .setDisabled(page <= 0);

  const indicatorBtn = new ButtonBuilder()
    .setCustomId('dept_rev_ind')
    .setLabel(`Page ${page + 1} / ${totalPages}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const rightBtn = new ButtonBuilder()
    .setCustomId(`dept_rev_page_${appData.id}_${page + 1}`)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(EMOJI_ARROW_RIGHT)
    .setDisabled(page >= totalPages - 1);

  card.addActionRowComponents(new ActionRowBuilder().addComponents(leftBtn, indicatorBtn, rightBtn));

  return card;
}

// ── Publish Decision to Results Channel (#1360793057930252539) ──
export async function publishDeptDecision(client, appData, isPassed, reviewerMember, notes) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const resultsChan = await client.channels.fetch(DEPT_RESULTS_CHANNEL_ID).catch(() => null);

  const passedExists = fs.existsSync(DEPT_PASSED_PATH);
  const failedExists = fs.existsSync(DEPT_FAILED_PATH);

  const bannerUrl = isPassed
    ? (passedExists ? 'attachment://dept_app_passed.png' : 'https://media.discordapp.net/attachments/1232495213986058283/1536858352754360392/content.png')
    : (failedExists ? 'attachment://dept_app_failed.png' : 'https://media.discordapp.net/attachments/1232495213986058283/1536858352754360392/content.png');

  const files = [];
  if (isPassed && passedExists) {
    files.push(new AttachmentBuilder(DEPT_PASSED_PATH, { name: 'dept_app_passed.png' }));
  } else if (!isPassed && failedExists) {
    files.push(new AttachmentBuilder(DEPT_FAILED_PATH, { name: 'dept_app_failed.png' }));
  }

  const resultCard = new ContainerBuilder();
  resultCard.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl))
  );

  resultCard.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      isPassed
        ? `## ${dept.name} Application Passed!`
        : `## ${dept.name} Application Denied`
    )
  );

  resultCard.addSeparatorComponents(thinLine());

  resultCard.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
      `> **Department:** **${dept.name}** (\`${dept.shortName}\`)\n` +
      `> **Roblox Username:** \`${appData.sec1?.roblox_user || 'N/A'}\`\n` +
      `> **Reviewed By:** <@${reviewerMember.id}> (${reviewerMember.user?.tag || reviewerMember.displayName})\n` +
      `> **Reviewer Notes:** ${notes || (isPassed ? 'Welcome to the department recruitment pipeline.' : 'Did not meet requirements.')}\n` +
      `> **Decision Date:** <t:${Math.floor(Date.now() / 1000)}:f>`
    )
  );

  resultCard.addSeparatorComponents(thinLine());

  if (isPassed) {
    resultCard.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Congratulations <@${appData.applicantId}>! You have been accepted into the **${dept.name}** recruitment pipeline. Department leadership will be in contact with you regarding training, orientation, and academy onboarding.\n\n` +
        (dept.discordInvite ? `🔗 **Department Server:** [Join ${dept.name}](${dept.discordInvite})` : '')
      )
    );
    if (dept.discordInvite) {
      resultCard.addSeparatorComponents(thinLine());
      const joinRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Join ${dept.shortName} Discord`)
          .setStyle(ButtonStyle.Link)
          .setURL(dept.discordInvite)
          .setEmoji(dept.emoji)
      );
      resultCard.addActionRowComponents(joinRow);
    }
  } else {
    resultCard.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Thank you for your interest in the **${dept.name}**, <@${appData.applicantId}>. Unfortunately, your application was not approved at this time. You may reapply during the next open application cycle.`
      )
    );
  }

  if (resultsChan) {
    await resultsChan.send({
      allowedMentions: { users: [appData.applicantId], parse: [] },
      components: [resultCard.toJSON()],
      files,
      flags: MessageFlags.IsComponentsV2
    }).catch((err) => console.error('[DeptApps] Error posting result:', err.message));
  }

  // DM applicant
  try {
    const user = await client.users.fetch(appData.applicantId).catch(() => null);
    if (user) {
      const dmCard = new ContainerBuilder();
      dmCard.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${isPassed ? 'Application Passed' : 'Application Update'}\n` +
          `Hello <@${appData.applicantId}>,\n\n` +
          `Your application for **${dept.name}** has been **${isPassed ? 'ACCEPTED' : 'DENIED'}** by <@${reviewerMember.id}>.\n\n` +
          `> **Reviewer Notes:** ${notes || 'No additional notes provided.'}\n` +
          `> **Official Decision Post:** <#${DEPT_RESULTS_CHANNEL_ID}>\n\n` +
          (isPassed
            ? `Please join your official department Discord server below to begin onboarding, academy training, and roster verification:\n\n🔗 **Department Discord:** ${dept.discordInvite || 'Contact leadership in main server'}`
            : `You are welcome to reapply during future application cycles.`)
        )
      );
      if (isPassed && dept.discordInvite) {
        dmCard.addSeparatorComponents(thinLine());
        const dmJoinRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Join ${dept.shortName} Discord`)
            .setStyle(ButtonStyle.Link)
            .setURL(dept.discordInvite)
            .setEmoji(dept.emoji)
        );
        dmCard.addActionRowComponents(dmJoinRow);
      }
      await user.send({
        components: [dmCard.toJSON()],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }
  } catch {}
}

export function getDeptApplication(appId) {
  loadDeptApplications();
  return activeDeptApps.get(appId) || null;
}

export function updateDeptApplication(appData) {
  activeDeptApps.set(appData.id, appData);
  saveDeptApplications();
}
