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

// ── Assets ──
const ASSETS_DIR = path.resolve(__dirname, '../assets');
const DEPT_BANNER_PATH = path.join(ASSETS_DIR, 'dept_app_banner.png');
const DEPT_PASSED_PATH = path.join(ASSETS_DIR, 'dept_app_passed.png');
const DEPT_FAILED_PATH = path.join(ASSETS_DIR, 'dept_app_failed.png');

export const DEPT_BANNER_FALLBACK_URL =
  'https://media.discordapp.net/attachments/1360792977181769768/1556006070256664636/Applications.png?backend=b2&ex=6acdcbd4&is=6acc7a54&hm=0ec4e20b2b3501c8cbab62b0d827a9f52c0310aff45c8cf42aa8fadd5de76268&=&format=webp&quality=lossless&width=2048&height=684';

// ── Persistence ──
const DEPT_APPS_FILE = path.resolve(__dirname, '../dept_applications.json');
const activeDeptApps = new Map(); // id -> appData
const activeDeptReviewSessions = new Map(); // reviewerId -> { appId, pageIndex }
const startingDeptApps = new Set(); // userId -> boolean

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
    icon: '🚓',
    roleName: 'Tuscaloosa Police',
    desc: 'City patrol, traffic enforcement, municipal response, and urban order.',
    reqs: [
      'Must meet community age requirement & remain active weekly',
      'Must use required CAD & radio systems realistically',
      'Demonstrate sound situational judgment, composure & de-escalation',
      'Working microphone & recording/clipping software required',
      'No AI-generated answers or copied templates allowed'
    ],
    step2: {
      title: 'Step 2: Police Knowledge & Procedure',
      q1: { id: 'respect_trust', label: 'More important: respected or trusted as an officer?', placeholder: 'Explain your reasoning thoughtfully' },
      q2: { id: 'chain_command', label: 'Purpose of Chain of Command & conflict handling?', placeholder: 'Explain what COC achieves and how you handle disagreements' },
      q3: { id: 'meta_power', label: 'Explain the difference: Metagaming vs Powergaming', placeholder: 'Provide clear ER:LC roleplay definitions for both' },
      q4: { id: 'rdm_vdm_icooc', label: 'Define RDM & VDM, and why separate IC from OOC?', placeholder: 'Explain why IC frustration must never become OOC malice' },
      q5: { id: 'insult_arrest', label: 'A civilian insults you in-character. Can you arrest?', placeholder: 'Explain why or why not, detailing legal justification' }
    },
    step3: {
      title: 'Step 3: Realistic Police Scenarios',
      q1: { id: 'scen_traffic_stop', label: 'Rude stop: Driver insults you & refuses orders', placeholder: 'Explain your exact procedure from start to finish' },
      q2: { id: 'scen_friend_force', label: 'Friend officer uses excessive force & says not to tell', placeholder: 'What do you do and why?' },
      q3: { id: 'scen_supervisor_err', label: 'Supervisor orders arrest with no explained violation', placeholder: 'How do you handle this professionally?' },
      q4: { id: 'scen_pursuit_terminate', label: 'High-speed pursuit turns dangerous; supervisor terminates', placeholder: 'What do you do immediately?' },
      q5: { id: 'scen_false_arrest', label: 'You realize you arrested the wrong person; nobody saw', placeholder: 'What do you do to correct the situation?' }
    }
  },
  tcso: {
    key: 'tcso',
    name: 'Tuscaloosa County Sheriff\'s Office',
    shortName: 'TCSO',
    icon: '🤠',
    roleName: 'Sheriff\'s Deputy',
    desc: 'County jurisdiction, rural patrols, warrants, and county jail operations.',
    reqs: [
      'Active county presence in unincorporated Tuscaloosa territory',
      'High degree of independence & rural tactical judgment',
      'Clear CAD/radio communication with delayed backup distances',
      'Working microphone & clip recording software',
      'Zero tolerance for AI or falsified application data'
    ],
    step2: {
      title: 'Step 2: Sheriff Jurisdiction & Policy',
      q1: { id: 'jurisdiction_diff', label: 'Difference: County Sheriff vs Municipal Police?', placeholder: 'Explain jurisdictional boundaries and operational differences' },
      q2: { id: 'rural_deescalate', label: 'Why is calm de-escalation crucial in rural county?', placeholder: 'Consider distance from backup and isolated terrain' },
      q3: { id: 'meta_power', label: 'Define Metagaming & Powergaming in sheriff RP', placeholder: 'Explain how both harm immersion in county scenes' },
      q4: { id: 'warrant_probable', label: 'Difference between Consensual Stop & Probable Cause?', placeholder: 'Explain legal standards required before searching vehicles' },
      q5: { id: 'interagency_sheriff', label: 'City police and Sheriff dispute scene authority', placeholder: 'How should jurisdictional coordination be resolved?' }
    },
    step3: {
      title: 'Step 3: Realistic County Scenarios',
      q1: { id: 'scen_rural_dispute', label: 'Hostile armed resident on county land demands you leave', placeholder: 'How do you ensure officer safety and de-escalate?' },
      q2: { id: 'scen_solo_backup', label: 'Uncooperative suspect alone in county; backup 3 mins out', placeholder: 'How do you control the scene without unnecessary lethal force?' },
      q3: { id: 'scen_unlawful_search', label: 'Partner searches a trunk without consent or warrant', placeholder: 'What actions do you take regarding the search?' },
      q4: { id: 'scen_county_pursuit', label: 'Pursuit heads onto dangerous unpaved mountain roads', placeholder: 'How do you manage vehicle control, safety, and radio traffic?' },
      q5: { id: 'scen_foot_flee', label: 'Unarmed traffic stop suspect runs into the woods on foot', placeholder: 'Explain your pursuit and containment strategy' }
    }
  },
  ast: {
    key: 'ast',
    name: 'Alabama State Troopers',
    shortName: 'AST',
    icon: '🚔',
    roleName: 'State Trooper',
    desc: 'Highway safety, interstate patrols, crash reconstruction, and high-speed enforcement.',
    reqs: [
      'Exemplary driving skill & high-speed vehicle control standards',
      'Strict adherence to state statutes, radio brevity & PIT policies',
      'Inter-agency coordination across all county & city borders',
      'Working microphone & clip recording software',
      'Strict anti-AI policy; all answers must reflect genuine thought'
    ],
    step2: {
      title: 'Step 2: State Trooper & Highway Standards',
      q1: { id: 'trooper_mission', label: 'Primary mission of Alabama State Troopers on highways?', placeholder: 'Explain high-speed safety, enforcement, and public presence' },
      q2: { id: 'pit_policy', label: 'When is a PIT maneuver safe and authorized?', placeholder: 'Describe speed, traffic density, surroundings, and approval requirements' },
      q3: { id: 'felony_stop', label: 'What differentiates a Felony Traffic Stop on a highway?', placeholder: 'Explain positioning, drawn weapons, commands, and backup coordination' },
      q4: { id: 'adrenaline_composure', label: 'How do you keep composure during 110+ MPH chases?', placeholder: 'Describe how you prevent tunnel vision and maintain radio communication' },
      q5: { id: 'radio_brevity', label: 'Why is strict radio brevity essential for Troopers?', placeholder: 'Explain clear dispatch communication during rapid inter-agency pursuits' }
    },
    step3: {
      title: 'Step 3: High-Speed & Highway Scenarios',
      q1: { id: 'scen_wrong_way', label: 'Suspect goes wrong-way on interstate; heavy civilian traffic', placeholder: 'What actions do you take immediately to prevent fatalities?' },
      q2: { id: 'scen_multiagency_lead', label: 'City police chase enters interstate; you join as Trooper', placeholder: 'How do you coordinate with city units and assume highway lead?' },
      q3: { id: 'scen_major_pileup', label: 'First on scene of a 4-car highway rollover with fires', placeholder: 'Detail your immediate triage, traffic diversion, and command steps' },
      q4: { id: 'scen_els_abuse', label: 'Off-duty Trooper uses emergency lights to bypass traffic', placeholder: 'How do you address this violation of state policy?' },
      q5: { id: 'scen_commercial_evade', label: 'Commercial semi-truck refuses to pull over at weigh station', placeholder: 'How do you safely bring the heavy vehicle to a stop?' }
    }
  },
  tfr: {
    key: 'tfr',
    name: 'Tuscaloosa Fire Rescue',
    shortName: 'TFR',
    icon: '🚒',
    roleName: 'Firefighter',
    desc: 'Fire suppression, vehicle extrication, hazmat response, and technical rescue.',
    reqs: [
      'Commitment to realism & dedicated fire suppression RP',
      'Understanding of Incident Command System (ICS) & team coordination',
      'Clear apparatus safety & scene positioning discipline',
      'Working microphone & clip recording software',
      'Original responses only — AI usage results in immediate denial'
    ],
    step2: {
      title: 'Step 2: Fire Rescue Fundamentals',
      q1: { id: 'fire_priorities', label: 'Order & importance of 3 incident priorities (LIP)?', placeholder: 'Explain Life Safety, Incident Stabilization, Property Conservation' },
      q2: { id: 'incident_command', label: 'Role of Incident Commander & danger of freelancing?', placeholder: 'Why must every firefighter follow assigned sector tasks?' },
      q3: { id: 'extrication_safety', label: 'Key hazards when extricating pinned victims in a crash?', placeholder: 'Mention battery disconnection, fuel leaks, stabilization' },
      q4: { id: 'meta_fire_rp', label: 'How do you ensure fire scenes feel immersive for all?', placeholder: 'Explain realistic fire behavior and descriptive roleplay' },
      q5: { id: 'police_coordination', label: 'Coordinating with police for traffic & perimeter control?', placeholder: 'Explain perimeter security and protecting fire apparatus' }
    },
    step3: {
      title: 'Step 3: Fire & Rescue Scenarios',
      q1: { id: 'scen_structure_fire', label: 'Residential fire with heavy smoke; bystander claims trapped kid', placeholder: 'How do you balance search & rescue with thermal safety?' },
      q2: { id: 'scen_fuel_tanker', label: 'Fuel tanker rolled over spilling gas on hot roadway', placeholder: 'Detail your foam, evacuation, and hazard containment steps' },
      q3: { id: 'scen_civilian_charge', label: 'Distraught family member tries running into burning home', placeholder: 'How do you physically stop and de-escalate without violence?' },
      q4: { id: 'scen_scba_low', label: 'Interior attack: Your SCBA low-air bell sounds unexpectedly', placeholder: 'What is your immediate Mayday / egress protocol?' },
      q5: { id: 'scen_order_evacuate', label: 'Lieutenant orders roof evacuation that you believe is stable', placeholder: 'Do you argue or immediately evacuate? Explain why.' }
    }
  },
  ems: {
    key: 'ems',
    name: 'Northstar Medical (EMS)',
    shortName: 'Northstar EMS',
    icon: '🚑',
    roleName: 'Paramedic',
    desc: 'Emergency medical services, pre-hospital trauma stabilization, and ambulance transport.',
    reqs: [
      'Dedication to immersive, detailed medical roleplay (no 1-word heals)',
      'Understanding of triage, trauma assessment & patient care protocols',
      'Composure under high-stress emergency medical scenes',
      'Working microphone & clip recording software',
      'All responses must be genuine; AI generation strictly prohibited'
    ],
    step2: {
      title: 'Step 2: Medical & EMS Fundamentals',
      q1: { id: 'abc_triage', label: 'Explain the ABCs of medical assessment and why order matters', placeholder: 'Airway, Breathing, Circulation and vital stability' },
      q2: { id: 'mci_triage', label: 'Mass Casualty Triage categories (Green, Yellow, Red, Black)?', placeholder: 'Explain how you prioritize care during multi-casualty incidents' },
      q3: { id: 'medical_neutrality', label: 'Why must EMS treat police and criminals with equal care?', placeholder: 'Explain medical ethics and oath to treat all patients' },
      q4: { id: 'immersive_med_rp', label: 'How do you avoid 1-word "auto-heals" and create good RP?', placeholder: 'Describe how you talk through injuries and treatments with players' },
      q5: { id: 'consent_refusal', label: 'How do you handle conscious patient refusing ambulance care?', placeholder: 'Explain informed refusal, capacity check, and documentation' }
    },
    step3: {
      title: 'Step 3: Realistic Medical Scenarios',
      q1: { id: 'scen_hot_zone', label: 'Shootout ongoing; wounded officer down 20ft away; scene NOT secure', placeholder: 'Do you enter or stage? Explain tactical EMS staging protocol' },
      q2: { id: 'scen_cardiac_arrest', label: 'Driver in full cardiac arrest following major collision', placeholder: 'Detail your CPR, AED, airway management, and transport steps' },
      q3: { id: 'scen_hostile_crowd', label: 'Hostile crowd surrounds ambulance while treating patient', placeholder: 'How do you maintain patient care and coordinate emergency extraction?' },
      q4: { id: 'scen_medical_mistake', label: 'You realize you administered the wrong treatment in RP', placeholder: 'What do you do immediately for patient safety and transparency?' },
      q5: { id: 'scen_suspect_custody', label: 'Injured suspect in police custody spits and curses at you', placeholder: 'How do you safely provide medical evaluation?' }
    }
  }
};

// ── Step 1 Questions (Common Across Departments) ──
export const STEP1_QUESTIONS = {
  title: 'Step 1: General Info & Background',
  q1: { id: 'roblox_user', label: 'Roblox Username', placeholder: 'Your exact Roblox username' },
  q2: { id: 'age_tz', label: 'Current Age & Timezone', placeholder: 'e.g. 16, EST (Eastern Time)' },
  q3: { id: 'hours_week', label: 'Hours/week you can dedicate?', placeholder: 'e.g. 10-15 hours per week' },
  q4: { id: 'prev_exp', label: 'Previous Department & RP Experience', placeholder: 'Describe previous communities, departments, and highest ranks held' },
  q5: { id: 'past_discipline', label: 'Past removals/demotions/blacklists?', placeholder: 'Explain truthfully what happened (honesty is evaluated)' }
};

// ── Step 4 Questions (Commitment & Integrity) ──
export const STEP4_QUESTIONS = {
  title: 'Step 4: Commitment & Integrity',
  q1: { id: 'why_dept', label: 'Why do you want to join this department?', placeholder: 'Explain what you want to contribute (do not just say "I want to be a cop/medic")' },
  q2: { id: 'weakness_improve', label: 'One weakness & how you are improving it?', placeholder: 'Be authentic — explain your personal growth approach' },
  q3: { id: 'unsupervised_authority', label: 'What prevents abuse of authority?', placeholder: 'Explain what personal integrity and accountability mean to you' },
  q4: { id: 'criticism_disrespect', label: 'Difference: criticism vs disrespect?', placeholder: 'Explain how you respond to feedback and disciplinary direction' },
  q5: { id: 'integrity_pledge', label: 'Confirm: 100% original, no AI (I Agree)?', placeholder: 'Type "I Agree" to pledge truthful and original answers' }
};

// ── Panel Card Builder ──
export function buildDeptApplicationPanelCard(bannerUrlOverride) {
  const card = new ContainerBuilder();
  const bannerUrl = bannerUrlOverride || (fs.existsSync(DEPT_BANNER_PATH) ? 'attachment://dept_app_banner.png' : DEPT_BANNER_FALLBACK_URL);

  card.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl))
  );

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '# 🏛️ DEPARTMENT APPLICATIONS\n' +
      '### Welcome to the Alabama State Roleplay Department Applications Hub!\n\n' +
      'This is where you will find the applications for all available departments within **Alabama State Roleplay**. If you are interested in joining a department, you must complete the appropriate application and meet the department\'s requirements before you can be accepted.'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### 📋 BEFORE APPLYING\n' +
      'Before submitting a department application, please make sure you understand the expectations and requirements of the department you are applying for:\n\n' +
      '• **Be Active:** You must remain active within Alabama State Roleplay and participate regularly within the community.\n' +
      '• **Meet Department Requirements:** Each department may have different requirements. Make sure you meet the requirements listed on the department application before submitting.\n' +
      '• **Be Professional:** You are expected to remain professional, respectful, and mature throughout the application process and while representing your department.\n' +
      '• **Be Honest:** All applications must be completed truthfully. Providing false or misleading information may result in your application being denied.\n\n' +
      '⚠️ **This includes any use of AI. AI-generated answers will result in immediate disqualification.**'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### ⚠️ IMPORTANT NOTICE\n' +
      'Submitting an application does not guarantee acceptance.\n\n' +
      '• **Department Leadership** reserves the right to accept or deny applications based on the applicant\'s eligibility, application quality, activity, professionalism, and department needs.\n' +
      '• Do not repeatedly contact Department Leadership regarding the status of your application. Please allow adequate time for applications to be reviewed.'
    )
  );

  card.addSeparatorComponents(thinLine());

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### 🎖️ SELECT YOUR DEPARTMENT\n' +
      'Choose the department you wish to join using the dropdown menu or buttons below. Your comprehensive application will be delivered directly to your **Direct Messages (DMs)**.'
    )
  );

  // Select Menu
  const selectOptions = Object.values(DEPARTMENTS).map((d) => ({
    label: d.name,
    value: `dept_apply_${d.key}`,
    description: d.desc.slice(0, 100),
    emoji: d.icon
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('dept_app_select')
    .setPlaceholder('Choose a department to begin your application...')
    .addOptions(selectOptions);

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);
  card.addActionRowComponents(selectRow);

  // Quick Action Buttons Row
  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dept_quick_tpd').setLabel('TPD (Police)').setStyle(ButtonStyle.Primary).setEmoji('🚓'),
    new ButtonBuilder().setCustomId('dept_quick_tcso').setLabel('TCSO (Sheriff)').setStyle(ButtonStyle.Secondary).setEmoji('🤠'),
    new ButtonBuilder().setCustomId('dept_quick_ast').setLabel('AST (Troopers)').setStyle(ButtonStyle.Primary).setEmoji('🚔'),
    new ButtonBuilder().setCustomId('dept_quick_tfr').setLabel('TFR (Fire)').setStyle(ButtonStyle.Danger).setEmoji('🚒'),
    new ButtonBuilder().setCustomId('dept_quick_ems').setLabel('Northstar (EMS)').setStyle(ButtonStyle.Success).setEmoji('🚑')
  );
  card.addActionRowComponents(buttonsRow);

  return card;
}

// ── Applicant DM Dashboard Builder ──
export function buildDeptApplicantDashboard(appData) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const card = new ContainerBuilder();

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${dept.icon} ${dept.name} Application\n` +
      `Thank you for your interest in serving with the **${dept.name}**, <@${appData.applicantId}>.\n\n` +
      `> *This is an official recruitment process. Submission does not guarantee acceptance. Applicants are evaluated on sound judgment, integrity, roleplay knowledge, and honesty.*`
    )
  );

  card.addSeparatorComponents(thinLine());

  // Department Requirements Box
  const reqLines = dept.reqs.map(r => `• ${r}`).join('\n');
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 📌 Department Requirements & Expectations\n${reqLines}`
    )
  );

  card.addSeparatorComponents(thinLine());

  // Progress Checklist
  const s1Icon = appData.step1Done ? '✅' : '⚪';
  const s2Icon = appData.step2Done ? '✅' : '⚪';
  const s3Icon = appData.step3Done ? '✅' : '⚪';
  const s4Icon = appData.step4Done ? '✅' : '⚪';

  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 📋 Application Progress Checklist\n` +
      `${s1Icon} **Step 1:** General Information & Background\n` +
      `${s2Icon} **Step 2:** ${dept.shortName} Knowledge & Procedures\n` +
      `${s3Icon} **Step 3:** Realistic Situational Scenarios\n` +
      `${s4Icon} **Step 4:** Commitment, Leadership & Integrity\n\n` +
      `*Complete all four sections in order. Once all sections show a green checkmark, the **Submit Application** button will unlock.*`
    )
  );

  card.addSeparatorComponents(thinLine());

  // Step Buttons Row
  const allComplete = appData.step1Done && appData.step2Done && appData.step3Done && appData.step4Done;

  const stepsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_step1_${appData.id}`)
      .setLabel(appData.step1Done ? '✓ Step 1: General Info' : 'Step 1: General Info')
      .setStyle(appData.step1Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step2_${appData.id}`)
      .setLabel(appData.step2Done ? `✓ Step 2: ${dept.shortName} Knowledge` : `Step 2: ${dept.shortName} Knowledge`)
      .setStyle(appData.step2Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step3_${appData.id}`)
      .setLabel(appData.step3Done ? '✓ Step 3: Scenarios' : 'Step 3: Scenarios')
      .setStyle(appData.step3Done ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dept_btn_step4_${appData.id}`)
      .setLabel(appData.step4Done ? '✓ Step 4: Integrity' : 'Step 4: Integrity')
      .setStyle(appData.step4Done ? ButtonStyle.Success : ButtonStyle.Secondary)
  );
  card.addActionRowComponents(stepsRow);

  // Submit / Cancel Row
  const submitRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dept_btn_submit_${appData.id}`)
      .setLabel(allComplete ? '🚀 Submit Application' : '⏳ Complete All Steps to Submit')
      .setStyle(allComplete ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!allComplete),
    new ButtonBuilder()
      .setCustomId(`dept_btn_cancel_${appData.id}`)
      .setLabel('Cancel Application')
      .setStyle(ButtonStyle.Danger)
  );
  card.addActionRowComponents(submitRow);

  return card;
}

// ── Start Application Workflow ──
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
    await interaction.editReply({ content: '⏳ Please wait a moment, your application is already being initialized.' }).catch(() => {});
    return;
  }
  startingDeptApps.add(userId);
  setTimeout(() => startingDeptApps.delete(userId), 6000);

  loadDeptApplications();
  const existing = [...activeDeptApps.values()].find(a => a.applicantId === userId && a.status === 'pending_review');
  if (existing) {
    await interaction.editReply({
      content: `⚠️ You already have a pending **${existing.deptName}** application under review! Please wait for Department Leadership to review your submission in <#${DEPT_RESULTS_CHANNEL_ID}>.`
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
    generalInfo: null,
    knowledgeAnswers: null,
    scenarioAnswers: null,
    commitmentAnswers: null,
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
        content: '❌ Could not open Direct Messages with you. Please enable **Direct Messages from server members** in your Privacy & Safety settings and try again.'
      }).catch(() => {});
      return;
    }

    // Clean up older department application cards
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
      content: `✅ Opened your **${dept.name}** application in your Direct Messages! Please check your DMs to begin.`
    }).catch(() => {});
  } catch (err) {
    console.error('[DeptApps] Error launching application DM:', err.message);
    await interaction.editReply({
      content: `❌ Could not send application to your DMs (${err.message}). Ensure your DMs are open.`
    }).catch(() => {});
  }
}

// ── Modals Builders ──
export function buildStep1Modal(appId) {
  const modal = new ModalBuilder()
    .setCustomId(`dept_modal_step1_${appId}`)
    .setTitle('Step 1: General Info & Background');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('roblox_user').setLabel(STEP1_QUESTIONS.q1.label).setPlaceholder(STEP1_QUESTIONS.q1.placeholder).setStyle(TextInputStyle.Short).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('age_tz').setLabel(STEP1_QUESTIONS.q2.label).setPlaceholder(STEP1_QUESTIONS.q2.placeholder).setStyle(TextInputStyle.Short).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('hours_week').setLabel(STEP1_QUESTIONS.q3.label).setPlaceholder(STEP1_QUESTIONS.q3.placeholder).setStyle(TextInputStyle.Short).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('prev_exp').setLabel(STEP1_QUESTIONS.q4.label).setPlaceholder(STEP1_QUESTIONS.q4.placeholder).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('past_discipline').setLabel(STEP1_QUESTIONS.q5.label).setPlaceholder(STEP1_QUESTIONS.q5.placeholder).setStyle(TextInputStyle.Paragraph).setRequired(true)
    )
  );
  return modal;
}

export function buildStep2Modal(appData) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const cfg = dept.step2;
  const modal = new ModalBuilder()
    .setCustomId(`dept_modal_step2_${appData.id}`)
    .setTitle(cfg.title.slice(0, 45));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q1.id).setLabel(cfg.q1.label.slice(0, 45)).setPlaceholder(cfg.q1.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q2.id).setLabel(cfg.q2.label.slice(0, 45)).setPlaceholder(cfg.q2.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q3.id).setLabel(cfg.q3.label.slice(0, 45)).setPlaceholder(cfg.q3.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q4.id).setLabel(cfg.q4.label.slice(0, 45)).setPlaceholder(cfg.q4.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q5.id).setLabel(cfg.q5.label.slice(0, 45)).setPlaceholder(cfg.q5.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    )
  );
  return modal;
}

export function buildStep3Modal(appData) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const cfg = dept.step3;
  const modal = new ModalBuilder()
    .setCustomId(`dept_modal_step3_${appData.id}`)
    .setTitle(cfg.title.slice(0, 45));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q1.id).setLabel(cfg.q1.label.slice(0, 45)).setPlaceholder(cfg.q1.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q2.id).setLabel(cfg.q2.label.slice(0, 45)).setPlaceholder(cfg.q2.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q3.id).setLabel(cfg.q3.label.slice(0, 45)).setPlaceholder(cfg.q3.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q4.id).setLabel(cfg.q4.label.slice(0, 45)).setPlaceholder(cfg.q4.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(cfg.q5.id).setLabel(cfg.q5.label.slice(0, 45)).setPlaceholder(cfg.q5.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    )
  );
  return modal;
}

export function buildStep4Modal(appId) {
  const modal = new ModalBuilder()
    .setCustomId(`dept_modal_step4_${appId}`)
    .setTitle(STEP4_QUESTIONS.title.slice(0, 45));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(STEP4_QUESTIONS.q1.id).setLabel(STEP4_QUESTIONS.q1.label.slice(0, 45)).setPlaceholder(STEP4_QUESTIONS.q1.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(STEP4_QUESTIONS.q2.id).setLabel(STEP4_QUESTIONS.q2.label.slice(0, 45)).setPlaceholder(STEP4_QUESTIONS.q2.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(STEP4_QUESTIONS.q3.id).setLabel(STEP4_QUESTIONS.q3.label.slice(0, 45)).setPlaceholder(STEP4_QUESTIONS.q3.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(STEP4_QUESTIONS.q4.id).setLabel(STEP4_QUESTIONS.q4.label.slice(0, 45)).setPlaceholder(STEP4_QUESTIONS.q4.placeholder.slice(0, 100)).setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(STEP4_QUESTIONS.q5.id).setLabel(STEP4_QUESTIONS.q5.label.slice(0, 45)).setPlaceholder(STEP4_QUESTIONS.q5.placeholder.slice(0, 100)).setStyle(TextInputStyle.Short).setRequired(true)
    )
  );
  return modal;
}

// ── Review Log Card Builder (For Staff Review Channel) ──
export function buildDeptReviewCard(appData, pageIndex = 0) {
  const dept = DEPARTMENTS[appData.deptKey] || DEPARTMENTS.tpd;
  const card = new ContainerBuilder();

  const totalPages = 4;
  const page = Math.max(0, Math.min(totalPages - 1, pageIndex));

  const g = appData.generalInfo || {};
  const k = appData.knowledgeAnswers || {};
  const s = appData.scenarioAnswers || {};
  const c = appData.commitmentAnswers || {};

  if (page === 0) {
    // Page 1: General Info & Background
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 📋 ${dept.icon} ${dept.name} Application Review — Page 1/4\n` +
        `### Candidate Profile & Background\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
        `> **Department:** **${dept.name}** (\`${dept.shortName}\`)\n` +
        `> **Roblox Username:** \`${g.roblox_user || 'N/A'}\`\n` +
        `> **Age & Timezone:** \`${g.age_tz || 'N/A'}\`\n` +
        `> **Dedicated Hours/Week:** \`${g.hours_week || 'N/A'}\`\n\n` +
        `**Previous RP Experience:**\n` +
        `> ${(g.prev_exp || 'N/A').slice(0, 400)}\n\n` +
        `**Past Removals / Demotions / Disciplinary History:**\n` +
        `> ${(g.past_discipline || 'N/A').slice(0, 400)}`
      )
    );
  } else if (page === 1) {
    // Page 2: Knowledge & Procedures
    const cfg = dept.step2;
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 📋 ${dept.icon} ${dept.name} Application Review — Page 2/4\n` +
        `### Department Procedures & Roleplay Knowledge\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**1. ${cfg.q1.label}:**\n` +
        `> ${(k[cfg.q1.id] || 'N/A').slice(0, 300)}\n\n` +
        `**2. ${cfg.q2.label}:**\n` +
        `> ${(k[cfg.q2.id] || 'N/A').slice(0, 300)}\n\n` +
        `**3. ${cfg.q3.label}:**\n` +
        `> ${(k[cfg.q3.id] || 'N/A').slice(0, 300)}\n\n` +
        `**4. ${cfg.q4.label}:**\n` +
        `> ${(k[cfg.q4.id] || 'N/A').slice(0, 300)}\n\n` +
        `**5. ${cfg.q5.label}:**\n` +
        `> ${(k[cfg.q5.id] || 'N/A').slice(0, 300)}`
      )
    );
  } else if (page === 2) {
    // Page 3: Scenarios
    const cfg = dept.step3;
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 📋 ${dept.icon} ${dept.name} Application Review — Page 3/4\n` +
        `### Realistic Scenarios & Situational Judgment\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n\n` +
        `**1. ${cfg.q1.label}:**\n` +
        `> ${(s[cfg.q1.id] || 'N/A').slice(0, 300)}\n\n` +
        `**2. ${cfg.q2.label}:**\n` +
        `> ${(s[cfg.q2.id] || 'N/A').slice(0, 300)}\n\n` +
        `**3. ${cfg.q3.label}:**\n` +
        `> ${(s[cfg.q3.id] || 'N/A').slice(0, 300)}\n\n` +
        `**4. ${cfg.q4.label}:**\n` +
        `> ${(s[cfg.q4.id] || 'N/A').slice(0, 300)}\n\n` +
        `**5. ${cfg.q5.label}:**\n` +
        `> ${(s[cfg.q5.id] || 'N/A').slice(0, 300)}`
      )
    );
  } else {
    // Page 4: Commitment, Integrity & Verdict
    const isReviewed = appData.status === 'accepted' || appData.status === 'denied';
    const statusText = appData.status === 'accepted'
      ? `✅ **ACCEPTED** by <@${appData.reviewedBy}>`
      : (appData.status === 'denied' ? `❌ **DENIED** by <@${appData.reviewedBy}>` : '⏳ **Pending Staff Review**');

    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 📋 ${dept.icon} ${dept.name} Application Review — Page 4/4\n` +
        `### Commitment, Integrity & Leadership\n` +
        `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
        `> **Status:** ${statusText}\n` +
        (appData.reviewerNotes ? `> **Reviewer Notes:** ${appData.reviewerNotes}\n\n` : '\n') +
        `**Why do you want to join ${dept.shortName}?**\n` +
        `> ${(c.why_dept || 'N/A').slice(0, 300)}\n\n` +
        `**Personal Weakness & Improvement:**\n` +
        `> ${(c.weakness_improve || 'N/A').slice(0, 300)}\n\n` +
        `**Integrity / Prevention of Authority Abuse:**\n` +
        `> ${(c.unsupervised_authority || 'N/A').slice(0, 300)}\n\n` +
        `**Criticism vs Disrespect:**\n` +
        `> ${(c.criticism_disrespect || 'N/A').slice(0, 300)}\n\n` +
        `**Integrity Pledge:** \`${c.integrity_pledge || 'N/A'}\``
      )
    );

    if (!isReviewed) {
      card.addSeparatorComponents(thinLine());
      const verdictRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dept_verdict_accept_${appData.id}`).setLabel('Accept Application').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`dept_verdict_deny_${appData.id}`).setLabel('Deny Application').setStyle(ButtonStyle.Danger)
      );
      card.addActionRowComponents(verdictRow);
    }
  }

  card.addSeparatorComponents(thinLine());

  // Nav row
  const leftBtn = new ButtonBuilder()
    .setCustomId(`dept_rev_page_${appData.id}_${page - 1}`)
    .setStyle(ButtonStyle.Secondary)
    .setLabel('⬅️ Prev')
    .setDisabled(page <= 0);

  const indicatorBtn = new ButtonBuilder()
    .setCustomId('dept_rev_ind')
    .setLabel(`Page ${page + 1} / ${totalPages}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const rightBtn = new ButtonBuilder()
    .setCustomId(`dept_rev_page_${appData.id}_${page + 1}`)
    .setStyle(ButtonStyle.Secondary)
    .setLabel('Next ➡️')
    .setDisabled(page >= totalPages - 1);

  const navRow = new ActionRowBuilder().addComponents(leftBtn, indicatorBtn, rightBtn);
  card.addActionRowComponents(navRow);

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
        ? `## 🎖️ ${dept.icon} ${dept.name} Application Passed!`
        : `## ❌ ${dept.icon} ${dept.name} Application Denied`
    )
  );

  resultCard.addSeparatorComponents(thinLine());

  resultCard.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> **Applicant:** <@${appData.applicantId}> (\`${appData.applicantTag}\`)\n` +
      `> **Department:** **${dept.name}** (\`${dept.shortName}\`)\n` +
      `> **Roblox Username:** \`${appData.generalInfo?.roblox_user || 'N/A'}\`\n` +
      `> **Reviewed By:** <@${reviewerMember.id}> (${reviewerMember.user?.tag || reviewerMember.displayName})\n` +
      `> **Reviewer Notes:** ${notes || (isPassed ? 'Welcome to the department recruitment pipeline.' : 'Did not meet requirements.')}\n` +
      `> **Decision Date:** <t:${Math.floor(Date.now() / 1000)}:f>`
    )
  );

  resultCard.addSeparatorComponents(thinLine());

  if (isPassed) {
    resultCard.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Congratulations <@${appData.applicantId}>! You have been accepted into the **${dept.name}** recruitment pipeline. Department leadership will be in contact with you regarding training, orientation, and academy onboarding.`
      )
    );
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

  // Also DM applicant
  try {
    const user = await client.users.fetch(appData.applicantId).catch(() => null);
    if (user) {
      const dmCard = new ContainerBuilder();
      dmCard.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${isPassed ? '🎉 Application Passed' : '📋 Application Update'}\n` +
          `Hello <@${appData.applicantId}>,\n\n` +
          `Your application for **${dept.name}** has been **${isPassed ? 'ACCEPTED' : 'DENIED'}** by <@${reviewerMember.id}>.\n\n` +
          `> **Reviewer Notes:** ${notes || 'No additional notes provided.'}\n` +
          `> **Official Decision Post:** <#${DEPT_RESULTS_CHANNEL_ID}>\n\n` +
          (isPassed
            ? `Please check the department channels in the server for your next steps and academy schedule.`
            : `You are welcome to reapply during future application cycles.`)
        )
      );
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
