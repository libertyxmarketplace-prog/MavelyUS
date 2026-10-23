/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TICKET AI  -  intelligent, self-learning support for Alabama State Roleplay.
 *
 *  Goal: answer ticket questions accurately from a persistent, editable
 *  knowledge base built from real server material, calling the existing AI
 *  provider ONLY when no reliable stored answer exists. Learns reusable
 *  answers from staff responses via an approval workflow. Escalates instead
 *  of ever inventing server rules.
 *
 *  DESIGN
 *  ──────
 *  • STORAGE  - src/ticket_knowledge.json (durable). faqs[] + learned[] are
 *               "approved/reusable"; pending[] holds unanswered questions and
 *               staff-captured answers awaiting review. Fully editable.
 *  • RETRIEVE - exact match → keyword/full-text scoring → (optional) AI.
 *  • API COST - approved answers are served with ZERO provider calls. The
 *               provider is only hit when the question is unknown/ambiguous.
 *  • SAFETY   - AI may only use confirmed KB facts as context and must output
 *               a strict {action,answer} envelope. Sensitive categories are
 *               escalate-first. Never approves applications/roles/refunds.
 *  • PARTNERSHIP - AI is DISABLED for partnership & staff_partnership by owner
 *               request (settings.enabledCategories). Nothing is auto-answered
 *               for those; a human handles them.
 *
 *  This module never imports index.js. It imports only the already-configured
 *  provider chain from ai.js, so the dependency arrow stays one-directional.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { callAIProvider } from './ai.js';

const KB_PATH = fileURLToPath(new URL('./ticket_knowledge.json', import.meta.url));

// Category guidance used to steer the AI tone and escalation bias.
// `escalateFirst:true` categories only acknowledge + gather info, then hand
// off to staff - they never make a decision.
const CATEGORY_GUIDE = {
  general: {
    label: 'General Support',
    note: 'Community questions, general inquiries, and store assistance. Answer common questions from the knowledge base, explain role requests/applications/store/server procedures, and redirect paid advertising or partnership inquiries to the Partnership category.',
    escalateFirst: false
  },
  ia: {
    label: 'Internal Affairs',
    note: 'Staff reports and community concerns. Answer questions about IA procedures and server rules, help the user clarify what happened, and guide them directly.',
    escalateFirst: false
  },
  highrank: {
    label: 'High Rank Support',
    note: 'Executive and administrative matters. Answer questions regarding server structure, high rank procedures, and policies.',
    escalateFirst: false
  },
  deptreport: {
    label: 'Department Reports',
    note: 'Department-specific questions and concerns. Guide the user on department procedures, applications in <#1360792977181769768>, and server rules.',
    escalateFirst: false
  },
  partnership: {
    label: 'Partnership',
    note: 'Partnerships, mutual advertising, paid promotions, and staff transfers. AI is DISABLED here by owner request - a human staff member handles these.',
    escalateFirst: false
  },
  staff_partnership: {
    label: 'Staff Partnership',
    note: 'Staff transfers. AI is DISABLED here by owner request - a human staff member handles these.',
    escalateFirst: false
  }
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'doing', 'have', 'has', 'had', 'having', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'as', 'by', 'from',
  'and', 'or', 'but', 'if', 'then', 'so', 'than', 'that', 'this', 'these',
  'those', 'what', 'when', 'where', 'who', 'whom', 'why', 'how', 'which',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  'get', 'got', 'need', 'want', 'please', 'any', 'some', 'there', 'here'
]);

/** Lowercases and strips punctuation to a single-spaced string. */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9+$.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common domain abbreviations expanded to their full word(s) so paraphrased
// questions ("dept", "app", "IA", "HR") still match stored records.
const ALIASES = {
  dept: ['department'],
  depts: ['department'],
  app: ['application'],
  apps: ['application'],
  applications: ['application'],
  application: ['application'],
  hr: ['highrank'],
  ia: ['internal', 'affairs'],
  shr: ['highrank'],
  leo: ['law', 'enforcement'],
  ems: ['medical', 'fire'],
  rp: ['roleplay'],
  mod: ['moderator'],
  mods: ['moderator'],
  moderator: ['moderator'],
  advert: ['advertise'],
  advertising: ['advertise'],
  promo: ['promotion'],
  promos: ['promotion'],
  transfer: ['transfer'],
  transfers: ['transfer'],
  codes: ['code'],
  sessions: ['session'],
  roles: ['role'],
  characters: ['character'],
  keys: ['key'],
  permissions: ['permission'],
  rules: ['rule'],
  requirements: ['requirement'],
  reports: ['report'],
  partnerships: ['partnership'],
  partners: ['partnership'],
  links: ['link'],
  questions: ['question']
};

/** Splits normalized text into meaningful word tokens, expanding aliases. */
export function tokenize(text) {
  const out = [];
  for (const raw of normalize(text).split(' ')) {
    if (!raw || raw.length <= 1 || STOPWORDS.has(raw)) continue;
    if (ALIASES[raw]) {
      out.push(...ALIASES[raw]);
    } else {
      out.push(raw);
    }
  }
  return out;
}

/**
 * Fuzzy token equality: exact, or a shared >=4-char prefix (handles plurals
 * like application/applications and minor inflection).
 */
function tokenMatch(a, b) {
  if (a === b) return true;
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return false;
}


// ── Persistent knowledge-base load / save ────────────────────────────────────
let KB = null;

function defaultKB() {
  return {
    version: 1,
    meta: { name: 'Alabama State Roleplay Ticket Knowledge Base', updatedAt: Math.floor(Date.now() / 1000) },
    faqs: [],
    learned: [],
    pending: [],
    settings: {
      enabledCategories: {
        general: true, ia: true, highrank: true, deptreport: true,
        partnership: false, staff_partnership: false
      },
      confidenceThreshold: 0.55
    }
  };
}

/** Loads the knowledge base from disk once; returns the in-memory object. */
export function loadKB() {
  if (KB) return KB;
  try {
    const raw = fs.readFileSync(KB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    KB = { ...defaultKB(), ...parsed, settings: { ...defaultKB().settings, ...(parsed.settings || {}) } };
  } catch (err) {
    console.warn(`[ticket-ai] Could not read knowledge base (${err.message}) - starting empty.`);
    KB = defaultKB();
  }
  return KB;
}

/** Persists the knowledge base to disk (atomic write). Returns true on success. */
export function saveKB() {
  try {
    const db = loadKB();
    db.meta = { ...(db.meta || {}), updatedAt: Math.floor(Date.now() / 1000) };
    const tmp = `${KB_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n', 'utf8');
    fs.renameSync(tmp, KB_PATH);
    return true;
  } catch (err) {
    console.error(`[ticket-ai] Failed to save knowledge base: ${err.message}`);
    return false;
  }
}

/** True when AI auto-response is enabled for a ticket category. */
export function isCategoryEnabled(category) {
  const settings = loadKB().settings || {};
  if (settings.aiGloballyDisabled) return false;
  const cats = settings.enabledCategories || {};
  return cats[category] !== false;
}

export function isAiGloballyDisabled() {
  return loadKB().settings?.aiGloballyDisabled === true;
}

/** Returns the KB settings block. */
export function kbSettings() {
  return loadKB().settings;
}

/** Every reusable (approved) record - seed faqs plus staff-approved learned answers. */
function reusableRecords() {
  const db = loadKB();
  return [
    ...(db.faqs || []).map((f) => ({ ...f, kind: 'faq' })),
    ...(db.learned || []).filter((l) => l.approved).map((l) => ({ ...l, kind: 'learned' }))
  ];
}


// ── Retrieval: exact → keyword/full-text scoring ─────────────────────────────
/**
 * Scores a record against a normalized question token set.
 * Returns a 0..1 confidence. Combines keyword hits, question-token overlap,
 * and a bonus for an exact normalized-question match.
 */
function scoreRecord(qTokens, qNorm, rec) {
  if (!qTokens.length) return 0;

  // Build the record's searchable tokens: question + keywords (fuzzy set).
  const recQNorm = normalize(rec.question || '');
  const recTokens = [...tokenize(rec.question || '')];
  for (const kw of rec.keywords || []) {
    for (const t of tokenize(kw)) recTokens.push(t);
  }
  if (!recTokens.length) return 0;

  // 1) Token overlap (fuzzy): how much of the question is covered by the record.
  let hits = 0;
  for (const qt of qTokens) {
    if (recTokens.some((rt) => tokenMatch(qt, rt))) hits += 1;
  }
  const overlap = hits / qTokens.length;

  // 2) Keyword/phrase match strength (substring against the raw question).
  const kwList = (rec.keywords || []).map((k) => normalize(k)).filter(Boolean);
  let kwHits = 0;
  for (const kw of kwList) {
    if (kw && qNorm.includes(kw)) kwHits += 1;
  }
  const kwScore = kwList.length ? kwHits / kwList.length : 0;

  // 3) Exact normalized question equality is a guaranteed hit.
  const exact = recQNorm && recQNorm === qNorm ? 1 : 0;

  // Weighted blend. Overlap dominates; keywords add signal; exact is decisive.
  let score = overlap * 0.6 + kwScore * 0.35;
  if (exact) score = 1;
  return Math.max(0, Math.min(1, score));
}

/**
 * Finds the best reusable answer for a question.
 * @returns {{record:object, confidence:number}|null}
 */
export function findBestAnswer(question, { category = null, minConfidence = null } = {}) {
  const qNorm = normalize(question);
  const qTokens = tokenize(question);
  if (!qTokens.length) return null;

  const threshold = minConfidence ?? loadKB().settings?.confidenceThreshold ?? 0.55;
  const records = reusableRecords();

  let best = null;
  let bestScore = 0;
  for (const rec of records) {
    // Prefer same-category records on ties, but never hard-exclude others so a
    // general FAQ can still answer a differently-categorised question.
    let score = scoreRecord(qTokens, qNorm, rec);
    if (category && rec.category === category) score = Math.min(1, score + 0.05);
    if (score > bestScore) {
      bestScore = score;
      best = rec;
    }
  }

  if (best && bestScore >= threshold) return { record: best, confidence: Number(bestScore.toFixed(3)) };
  return null;
}

/**
 * Searches the knowledge base for staff review (does not apply the threshold).
 * @returns {Array<{record:object, confidence:number}>}
 */
export function searchKnowledge(query, limit = 10) {
  const qNorm = normalize(query);
  const qTokens = tokenize(query);
  const scored = reusableRecords()
    .map((rec) => ({ record: rec, confidence: Number(scoreRecord(qTokens, qNorm, rec).toFixed(3)) }))
    .sort((a, b) => b.confidence - a.confidence);
  return scored.slice(0, limit);
}


// ── AI generation ────────────────────────────────────────────────────────────
function buildTicketSystemPrompt(category) {
  const guide = CATEGORY_GUIDE[category] || CATEGORY_GUIDE.general;
  const lines = [
    'You are the official AI Support Assistant for "Alabama State Roleplay", a Roblox Emergency Response: Liberty County (ER:LC) community Discord server.',
    `You are assisting in a **${guide.label}** ticket. ${guide.note}`,
    '',
    'OFFICIAL SERVER CHANNELS & DESTINATIONS (Use exact mentions <#id>):',
    '- Patrol Schedules & Sessions: <#1232495212333498455> (Patrol times, session announcements, votes, server start times. Join Key: ALABAM)',
    '- Staff Applications: <#1539681421306896476> (Requirements: 14+ years old, active each week in ER:LC/Discord, working mic, clip-recording software. AI-generated answers prohibited)',
    '- Staff Results: <#1232495212333498458>',
    '- Department Applications: <#1360792977181769768> (Police, Sheriff, Troopers, Fire/EMS, DOT)',
    '- Department Results: <#1360793057930252539>',
    '- Department Information & Links: <#1360729375300915372>, <#1558664179307774063>, announcements in <#1277652317780574248>, shouts in <#1360729073235787858>',
    '- Server Shop & Purchases: <#1539680102449680495> (Donator tiers, custom liveries, priority queue, server perks)',
    '- Server Information: <#1232495212019056736> | Announcements: <#1234009587703742504>',
    '- CAD System: <#1541170978837766245> | CAD Verification: <#1543478855006818426>',
    '- Suggestions: <#1343769737439608853> (Submit community ideas)',
    '- Roles Information: <#1234228145796808755>',
    '- Ticket Desk: <#1360798150910021735>',
    '- Partnerships & Ads: <#1234265981250179072> (Info: <#1234265597504651366>, Affiliations Requirements: <#1546368440355266570>, Paid Ads: <#1539679984371896411>, Our Ad: <#1234265868502831164>)',
    '- Community Media: <#1341896131398864916> | Content Creators: <#1540139740224032798> | Daily Positivity: <#1461825936260599818>',
    '',
    'YOUR BEHAVIOR:',
    '- Talk naturally, concisely, and practically like an experienced human Discord helper or admin assistant. NEVER sound like a generic AI, customer service chatbot, or ChatGPT template.',
    '- NO EMDASHES: NEVER use em dashes (-). Always use standard hyphens (-) or colons (:) instead.',
    '- NO EMOJIS: NEVER use ANY emojis anywhere in your responses, briefings, or statements. Keep all text completely emoji-free.',
    '- NO BOT PREFIXES: NEVER prefix your responses with "Alabama Support Assistant:", "Assistant:", or roleplay labels. Start your message directly with the answer.',
    '- NO ROBOTIC FILLER: Avoid repetitive AI customer-service clichés like "Certainly!", "I can certainly assist with that", "Please do not hesitate to reach out", "Rest assured", "I would be delighted to", "Feel free to", etc. Give the exact helpful information directly.',
    '- Whenever referring a user to a channel, always mention the channel directly using <#id> so they can click it instantly.',
    '- CRITICAL CONVERSATION MEMORY: Read the conversation history above from the ticket carefully. Memorize and keep track of everything previously sent by the user, staff members, and the assistant. If staff or the user already gave information or answered something above, use that context immediately. Never ask for information that was already provided in the chat.',
    '- CRITICAL: The user is ALREADY inside their active private ticket channel. NEVER tell the user to visit the ticket desk (<#1360798150910021735>) or use a ticket desk button to request support, assistance, or an agent. They are already here!',
    '- DEFAULT BEHAVIOR: Always answer the user\'s question and assist them directly with action "answer". Do NOT escalate or step aside for routine questions, inquiries, complaints, or discussions. Keep chatting and helping them.',
    '- ESCALATION & HUMAN STAFF REQUESTS: If the user asks to escalate, says "escalate this", "escalate", "call staff", "talk to human", "get me staff", or expresses frustration ("getting me mad", "annoying", etc.), ALWAYS immediately return action "escalate"! NEVER ask for player names or screenshots when a user just wants to speak with staff or is asking a general question. Return: {"action": "escalate", "answer": "I have escalated your ticket to our staff team. An authorized staff member will assist you shortly!", "statement": "<concise factual 1-2 sentence summary of what the user is asking about or requesting>"}',
    '- STAFF PASS / GAME PASS INQUIRIES: Staff applications are completely free in <#1539681421306896476>. Server shop perks and custom passes are in <#1539680102449680495>. If the user is asking to purchase a staff pass or custom rank, clarify that staff ranks are obtained via application in <#1539681421306896476> or store perks in <#1539680102449680495>.',
    '- STAFF TAKEOVER / HANDOVER: If anyone says "I\'ll take it from here", "il take it from here", "I got this", "let me handle this", "let go of the ticket", or "step aside", you MUST return action "escalate" with answer: "I have stepped aside and let go of the ticket. The ticket is open for our staff team to claim and assist directly." NEVER claim you are closing the ticket!',
    '- SCREENSHOT / IMAGE EVIDENCE: When the inquiry or history indicates uploaded screenshot/image evidence (e.g. "[Uploaded screenshot/image evidence: ...]"), you CAN see it! Always acknowledge the screenshot evidence, reassure the user that their evidence has been recorded for staff review, and reference it in the statement.',
    '- NEVER CLOSE TICKETS UNLESS EXPLICITLY ASKED: NEVER say "I\'ll go ahead and close the ticket now" or close the ticket when someone says "thank you", "thanks", "i\'ll take it from here", or finishes asking a question. Only acknowledge closing if the user explicitly commanded to close the ticket.',
    '- If the user mentions that a button is not working or asks how to open a partnership or report ticket, let them know they can use the quick-action button attached below.',
    '- STAFF RETIREMENTS: Staff retirements are handled EXCLUSIVELY in High Rank Support or Internal Affairs tickets. If the ticket is in General Support, inform them that staff retirements can only be processed in High Rank Support or Internal Affairs, and advise them to create a ticket there. If the ticket IS in High Rank Support or Internal Affairs, ask them for: (1) Current rank, (2) Reason for retirement (optional), (3) Any final remarks or messages for the community, and let them know the request will be escalated to Senior High Rank for review.',
    '- If their request requires staff action (e.g. assigning roles, reviewing proof/applications, in-game ban appeals), acknowledge their request, let them know what details/screenshots to post, and reassure them staff has been notified.',
    '- NEVER use emojis (including robot 🤖, bell 🔔, clipboard 📋, orange circle 🟠, etc.) anywhere in your response or statement.',
    '- Format your message cleanly using Discord Markdown (bolding, lists).',
    '- Keep your reply under 700 characters.',
    '- Reply with RAW JSON ONLY: {"action": "answer", "answer": "<your response to user>"} or {"action": "escalate", "answer": "<hand-off message>", "statement": "<case briefing summary>"}',
    '',
    'CONFIRMED SERVER FACTS (may be empty):',
    '__FACTS__'
  ];
  return lines.join('\n');
}

/** Formats KB records into compact fact blocks for the prompt. */
function factsBlock(records) {
  if (!records || !records.length) return '(none available)';
  return records
    .map((r, i) => `FACT ${i + 1} - Q: ${r.question}\nA: ${r.answer}`)
    .join('\n\n')
    .slice(0, 3500);
}

/**
 * Asks the provider for a structured answer using server context and facts.
 * @returns {Promise<{action:'answer'|'escalate', answer:string, provider:string, model:string}>}
 */
async function aiGenerate({ question, category, facts, history = [] }) {
  const system = buildTicketSystemPrompt(category).replace('__FACTS__', factsBlock(facts));

  // Up to 25 recent conversation turns from the ticket channel (most recent last) + the live question.
  const convo = history.slice(-25).map((m) => ({
    role: (m.role === 'assistant' || m.staff || m.role === 'bot') ? 'assistant' : 'user',
    content: String(m.content).slice(0, 1000)
  }));
  convo.push({ role: 'user', content: `Ticket category: ${CATEGORY_GUIDE[category]?.label || category}\nUser Inquiry/Reason: ${String(question).slice(0, 1000)}` });

  const { text, provider, model } = await callAIProvider(
    [{ role: 'system', content: system }, ...convo],
    { timeout: 12_000, maxTokens: 450 }
  );

  // Parse the strict JSON envelope; tolerate stray code fences.
  let parsed = null;
  const cleaned = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
  }

  if (parsed && typeof parsed.answer === 'string' && parsed.answer.trim()) {
    return {
      action: parsed.action || 'answer',
      answer: parsed.answer.trim(),
      statement: typeof parsed.statement === 'string' ? parsed.statement.trim() : null,
      provider,
      model
    };
  }

  // Could not parse JSON envelope - treat the raw text as an answer.
  return { action: 'answer', answer: String(text).trim().slice(0, 1000), statement: null, provider, model };
}


// ── Pending-question tracking (unanswered + awaiting staff) ───────────────────
/** Records an unresolved question so the same one never re-hits the API. */
export function recordPending({ question, category, ticketId, channelId, userId, context = '' }) {
  const db = loadKB();
  const now = Math.floor(Date.now() / 1000);
  const qNorm = normalize(question);
  // Deduplicate: if an equivalent pending question exists, just bump it.
  const existing = (db.pending || []).find((p) => normalize(p.question) === qNorm && p.status !== 'resolved');
  if (existing) {
    existing.lastAskedAt = now;
    existing.timesAsked = (existing.timesAsked || 1) + 1;
    if (ticketId && !existing.ticketIds.includes(ticketId)) existing.ticketIds.push(ticketId);
    saveKB();
    return existing;
  }
  const entry = {
    id: `pq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    question: String(question).slice(0, 800),
    category,
    status: 'unanswered', // unanswered -> awaiting_review -> approved/rejected
    ticketIds: ticketId ? [ticketId] : [],
    channelIds: channelId ? [channelId] : [],
    userId: userId || null,
    context: String(context || '').slice(0, 1000),
    timesAsked: 1,
    staffAnswer: null,
    staffId: null,
    approvedAnswerId: null,
    createdAt: now,
    updatedAt: now
  };
  db.pending = db.pending || [];
  db.pending.push(entry);
  saveKB();
  return entry;
}

/** True if an equivalent pending question is already awaiting/answered (dedupe). */
export function hasPending(question) {
  const db = loadKB();
  const qNorm = normalize(question);
  return (db.pending || []).some((p) => normalize(p.question) === qNorm && p.status !== 'rejected');
}

/**
 * Marks a pending question as awaiting staff review and attaches the staff
 * member's answer. Idempotent - only the first transition out of 'unanswered'
 * is recorded, so a busy ticket can't overwrite an existing captured answer.
 */
export function markPendingAwaiting(id, staffAnswer, staffId) {
  const db = loadKB();
  const p = (db.pending || []).find((x) => x.id === id);
  if (!p || p.status !== 'unanswered') return p || null;
  p.status = 'awaiting_review';
  p.staffAnswer = String(staffAnswer).slice(0, 1500);
  p.staffId = staffId || null;
  p.updatedAt = Math.floor(Date.now() / 1000);
  saveKB();
  return p;
}

// ── Main orchestration ───────────────────────────────────────────────────────
/**
 * Produces a support reply for a ticket message or opening inquiry.
 * Priority: exact/KB hit (no API) → AI with confirmed facts & server context → graceful fallback.
 *
 * @returns {Promise<{text:string, source:'knowledge'|'ai'|'disabled'|'fallback', escalated:boolean, meta?:object}>}
 */
export async function answerTicket({ question, category, history = [], ticketId = null, channelId = null, userId = null }) {
  // 0) Category gate - partnership/staff_partnership are disabled by owner request.
  if (!isCategoryEnabled(category)) {
    return { text: null, source: 'disabled', escalated: false };
  }

  const cleanQ = String(question ?? '').trim();
  const isDefaultReason = !cleanQ || cleanQ === 'Not specified' || cleanQ === 'No reason provided';

  // Helper to remove any emojis from text
  const sanitizeText = (str) =>
    String(str || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/🤖/g, '')
      .trim();

  // If opening without a specific reason, provide a welcoming guidance greeting
  if (isDefaultReason) {
    return {
      text: 'Hello and welcome to **Alabama State Roleplay Support**!\n\nHow can we help you today? Please describe your inquiry, question, or issue in detail below, and provide any screenshots or usernames if applicable. An authorized staff member will also assist you shortly!',
      source: 'knowledge',
      escalated: false
    };
  }

  // 1) Knowledge-base hit → serve stored answer with ZERO API calls.
  // In an ongoing conversation (history present), require high confidence (>=0.85)
  // so contextual follow-ups route to conversational AI instead of generic static FAQs.
  const minConf = (history && history.length > 0) ? 0.85 : null;
  const hit = findBestAnswer(cleanQ, { category, minConfidence: minConf });
  if (hit) {
    return { text: sanitizeText(hit.record.answer), source: 'knowledge', escalated: false, meta: { confidence: hit.confidence, id: hit.record.id } };
  }

  // 2) AI generation using server context + relevant KB facts
  try {
    const related = searchKnowledge(cleanQ, 3).filter((r) => r.confidence > 0.15);
    const facts = related.map((r) => r.record);
    const { action, answer, statement, provider, model } = await aiGenerate({ question: cleanQ, category, facts, history });

    if (action === 'escalate') {
      return {
        text: sanitizeText(answer) || 'I have stepped aside and notified our staff team to assist you directly.',
        source: 'ai',
        escalated: true,
        statement: statement ? sanitizeText(statement) : null,
        meta: { provider, model }
      };
    }

    if (answer && answer.trim()) {
      const cleanAnswer = sanitizeText(answer);
      captureAiCandidate({ question: cleanQ, answer: cleanAnswer, category, ticketId, userId });
      return { text: cleanAnswer, source: 'ai', escalated: false, meta: { provider, model } };
    }
  } catch (err) {
    console.error(`[ticket-ai] AI generation failed: ${err.message}`);
  }

  // 3) Graceful fallback. Only used for the very FIRST message of a ticket.
  // For follow-ups (history present) we stay silent instead of echoing the
  // user's message back as "I have noted your inquiry regarding: ...".
  if (history && history.length > 0) {
    return { text: null, source: 'fallback', escalated: false };
  }
  return {
    text: `Thank you for reaching out to **Alabama State Roleplay Support**!\n\nOur support team has been notified. Please provide any additional screenshots, player names, or details below, and an authorized staff member will assist you shortly!`,
    source: 'fallback',
    escalated: false
  };
}


// ── Learning: capture candidates, then staff approval workflow ────────────────
/** Lightweight keyword derivation from a question. */
function deriveKeywords(question) {
  return [...new Set(tokenize(question))].slice(0, 12);
}

/** Stores an AI answer as a NON-approved candidate for staff review. */
function captureAiCandidate({ question, answer, category, ticketId = null }) {
  const db = loadKB();
  const now = Math.floor(Date.now() / 1000);
  const qNorm = normalize(question);
  const dupLearned = (db.learned || []).some((l) => normalize(l.question) === qNorm);
  if (dupLearned) return null;
  const dupPending = (db.pending || []).some((p) => normalize(p.question) === qNorm && p.status === 'awaiting_review');
  if (dupPending) return null;

  const cand = {
    id: `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    question: String(question).slice(0, 800),
    answer: String(answer).slice(0, 1500),
    category,
    keywords: deriveKeywords(question),
    approved: false,           // ← NOT served to users until a staff member approves
    origin: 'ai',
    sourceTicketId: ticketId,
    suppliedBy: null,
    createdAt: now,
    updatedAt: now
  };
  db.learned = db.learned || [];
  db.learned.push(cand);
  saveKB();
  return cand;
}

/** Captures a staff member's reply and memorizes it to help future users. */
export function captureStaffAnswer({ question, answer, category, ticketId = null, staffId = null, approved = true }) {
  const db = loadKB();
  const now = Math.floor(Date.now() / 1000);
  const qNorm = normalize(question);
  const aNorm = normalize(answer);
  if (!qNorm || !aNorm) return null;

  const existing = (db.learned || []).find((l) => normalize(l.question) === qNorm);
  if (existing) {
    existing.answer = String(answer).slice(0, 1500);
    existing.approved = approved ?? true;
    existing.updatedAt = now;
    saveKB();
    return existing;
  }

  const cand = {
    id: `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    question: String(question).slice(0, 800),
    answer: String(answer).slice(0, 1500),
    category,
    keywords: deriveKeywords(question),
    approved: approved ?? true,
    origin: 'staff',
    sourceTicketId: ticketId,
    suppliedBy: staffId,
    createdAt: now,
    updatedAt: now
  };
  db.learned = db.learned || [];
  db.learned.push(cand);
  saveKB();
  return cand;
}

/** Approves a candidate (or its proposed correction) so it is served for free. */
export function approveEntry(id) {
  const db = loadKB();
  const rec = (db.learned || []).find((l) => l.id === id);
  if (!rec) return null;
  if (rec.pendingAnswer) { rec.answer = rec.pendingAnswer; delete rec.pendingAnswer; }
  rec.approved = true;
  rec.rejected = false;
  rec.updatedAt = Math.floor(Date.now() / 1000);
  const p = (db.pending || []).find((x) => normalize(x.question) === normalize(rec.question));
  if (p) { p.status = 'approved'; p.approvedAnswerId = rec.id; p.updatedAt = Math.floor(Date.now() / 1000); }
  saveKB();
  return rec;
}

/** Rejects a candidate so it is never served. */
export function rejectEntry(id) {
  const db = loadKB();
  const rec = (db.learned || []).find((l) => l.id === id);
  if (!rec) return null;
  rec.approved = false;
  rec.rejected = true;
  rec.updatedAt = Math.floor(Date.now() / 1000);
  saveKB();
  return rec;
}

/** Edits a record's question/answer/keywords (staff-only; can update approved entries). */
export function editEntry(id, { question, answer, keywords, category }) {
  const db = loadKB();
  const rec = (db.learned || []).find((l) => l.id === id) || (db.faqs || []).find((f) => f.id === id);
  if (!rec) return null;
  if (question != null) rec.question = String(question).slice(0, 800);
  if (answer != null) rec.answer = String(answer).slice(0, 1500);
  if (Array.isArray(keywords)) rec.keywords = keywords.map((k) => String(k).slice(0, 40)).slice(0, 20);
  if (category != null) rec.category = category;
  delete rec.pendingAnswer;
  rec.updatedAt = Math.floor(Date.now() / 1000);
  saveKB();
  return rec;
}

/** Permanently removes a knowledge record. */
export function deleteEntry(id) {
  const db = loadKB();
  const beforeL = (db.learned || []).length;
  const beforeF = (db.faqs || []).length;
  db.learned = (db.learned || []).filter((l) => l.id !== id);
  db.faqs = (db.faqs || []).filter((f) => f.id !== id);
  const removed = beforeL !== (db.learned || []).length || beforeF !== (db.faqs || []).length;
  if (removed) saveKB();
  return removed;
}

/** Adds a brand-new approved entry directly (staff authoring). */
export function addEntry({ question, answer, category = 'general', keywords = [] }) {
  const db = loadKB();
  const now = Math.floor(Date.now() / 1000);
  const rec = {
    id: `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    question: String(question).slice(0, 800),
    answer: String(answer).slice(0, 1500),
    category,
    keywords: (Array.isArray(keywords) && keywords.length ? keywords : deriveKeywords(question)).slice(0, 20),
    approved: true,
    origin: 'staff',
    source: 'manual',
    createdAt: now,
    updatedAt: now
  };
  db.learned = db.learned || [];
  db.learned.push(rec);
  saveKB();
  return rec;
}


// ── Category enable/disable + review listings ─────────────────────────────────
/** Enable/disable AI auto-response for a category (owner/directive control). */
export function setCategoryEnabled(category, enabled) {
  const db = loadKB();
  db.settings = db.settings || {};
  db.settings.enabledCategories = db.settings.enabledCategories || {};
  db.settings.enabledCategories[category] = !!enabled;
  saveKB();
  return db.settings.enabledCategories;
}

/** Shut off AI auto-response for all categories globally. */
export function disableAllAiCategories() {
  const db = loadKB();
  db.settings = db.settings || {};
  db.settings.aiGloballyDisabled = true;
  db.settings.enabledCategories = db.settings.enabledCategories || {};
  for (const k of Object.keys(db.settings.enabledCategories)) {
    db.settings.enabledCategories[k] = false;
  }
  saveKB();
  return true;
}

/** Enable AI auto-response for all categories globally. */
export function enableAllAiCategories() {
  const db = loadKB();
  db.settings = db.settings || {};
  db.settings.aiGloballyDisabled = false;
  db.settings.enabledCategories = db.settings.enabledCategories || {};
  for (const k of Object.keys(db.settings.enabledCategories)) {
    db.settings.enabledCategories[k] = true;
  }
  saveKB();
  return true;
}

export function listPending(limit = 25) {
  return (loadKB().pending || [])
    .filter((p) => p.status !== 'rejected')
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit);
}
export function listCandidates(limit = 25) {
  return (loadKB().learned || [])
    .filter((l) => !l.approved && !l.rejected)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit);
}
export function listApproved(limit = 25) {
  return reusableRecords().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, limit);
}
export function getEntry(id) {
  return (loadKB().learned || []).find((l) => l.id === id) || (loadKB().faqs || []).find((f) => f.id === id) || null;
}
