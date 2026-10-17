/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MEETING SCHEDULER  -  `-ai schedule a meeting ...`
 *
 *  Staff plan a meeting, the bot:
 *    • DMs every attendee an RSVP card (Can attend / Cannot attend / Maybe)
 *    • posts an announcement in the channel with the same buttons
 *    • schedules reminder DMs 7 days prior and the morning of
 *    • `-ai postpone the meeting by 2 hours` shifts the time and EDITS every
 *      card in place, so nobody is pinged twice
 *    • `-ai cancel the meeting` tells everyone it is off
 *
 *  State lives in meetings.json and is re-armed on boot.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'node:fs';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} from 'discord.js';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MAX_ATTENDEES = 250;

/** @type {Map<string, object>} */
const meetings = new Map();
/** @type {Map<string, NodeJS.Timeout>} */
const timers = new Map();

const cfg = {
  client: null,
  storeFile: null,
  tzOffset: -6
};

// ── Persistence ──────────────────────────────────────────────────────────────

export function loadMeetings() {
  try {
    if (!cfg.storeFile || !fs.existsSync(cfg.storeFile)) return 0;
    const raw = JSON.parse(fs.readFileSync(cfg.storeFile, 'utf8'));
    for (const [id, rec] of Object.entries(raw)) {
      if (meetings.has(id)) {
        Object.assign(meetings.get(id), rec);
      } else {
        meetings.set(id, rec);
      }
    }
    return meetings.size;
  } catch (err) {
    console.error('Could not read meetings.json:', err.message);
    return 0;
  }
}

function saveMeetings() {
  try {
    const flat = {};
    for (const [id, rec] of meetings) flat[id] = rec;
    fs.writeFileSync(cfg.storeFile, JSON.stringify(flat, null, 2), 'utf8');
  } catch (err) {
    console.error('Could not save meetings.json:', err.message);
  }
}

/** Wires the scheduler to the running bot. Call once at boot. */
export function initMeetingService({ client, storeFile, tzOffset }) {
  cfg.client = client;
  if (storeFile) cfg.storeFile = storeFile;
  if (Number.isFinite(Number(tzOffset))) cfg.tzOffset = Number(tzOffset);
  loadMeetings();
  armAll();
  return meetings.size;
}

// ── Time parsing ─────────────────────────────────────────────────────────────

/** UTC epoch (ms) for a wall-clock time expressed in the configured offset. */
function wallClock(baseDate, hour, minute, tzOffset = cfg.tzOffset) {
  const shifted = new Date(baseDate.getTime() + tzOffset * HOUR);
  const utc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    hour,
    minute
  );
  return utc - tzOffset * HOUR;
}

const TZ_OFFSETS = {
  est: -5,
  edt: -4,
  cst: -6,
  cdt: -5,
  mst: -7,
  mdt: -6,
  pst: -8,
  pdt: -7,
  utc: 0,
  gmt: 0
};

const MONTH_NAMES = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const DOW_NAMES = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednes: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, satur: 6, saturday: 6
};

/**
 * Reads a meeting time out of free text.
 * Supports:
 * - Natural full dates: "this upcoming Wednesday, October 21st at 6:00 PM EST"
 * - Month & Day: "October 21st at 6pm", "Oct 21 18:00"
 * - Day of week: "Wednesday at 6pm", "next Friday 7pm"
 * - Relative: "in 2 hours", "3 days", "45 mins"
 * - Day words: "tomorrow at 7pm", "tonight", "today at 18:30"
 * - ISO: "2026-03-14T19:00"
 * - Timezones: EST, EDT, CST, CDT, MST, MDT, PST, PDT, UTC, GMT
 */
export function parseWhen(input) {
  const text = String(input || '').trim().toLowerCase();
  if (!text) return null;
  const now = new Date();

  // 1. Relative - checked FIRST so a duration is never mistaken for a date.
  //    Covers "in 2 hours", "2 hours", "in 3 days", "45 minutes", "3d".
  const rel = text.match(/\b(\d+(?:\.\d+)?)\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|wks?|w)\b/);
  // Ensure it's not preceded by a month name (e.g., "October 21st at 6:00 PM")
  const isMonthDay = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}/.test(text);
  if (rel && !isMonthDay) {
    const n = Number(rel[1]);
    const unit = rel[2][0];
    const ms = unit === 'm' ? 60_000 : unit === 'h' ? HOUR : unit === 'd' ? DAY : 604_800_000;
    return now.getTime() + n * ms;
  }

  // Timezone extraction
  const tzMatch = text.match(/\b(est|edt|cst|cdt|mst|mdt|pst|pdt|utc|gmt)\b/);
  const activeTz = tzMatch ? TZ_OFFSETS[tzMatch[1]] : cfg.tzOffset;

  // 2. Time of day: "at 7pm", "6:00 pm", "at 18:30", "19:00"
  let hour = null;
  let minute = 0;
  const ampm = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (ampm) {
    hour = Number(ampm[1]) % 12;
    if (ampm[3] === 'pm') hour += 12;
    minute = Number(ampm[2] ?? 0);
  } else {
    const h24 = text.match(/\b(?:at\s+)?(\d{1,2}):(\d{2})\b/);
    if (h24) {
      hour = Number(h24[1]);
      minute = Number(h24[2]);
    }
  }

  // 3. Absolute ISO: "2026-03-14T19:00" or "2026-03-14 19:00"
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[t ](\d{1,2})(?::(\d{2}))?)?/);
  if (iso) {
    const [, y, mo, d, h, mi] = iso;
    return wallClock(new Date(Date.UTC(+y, +mo - 1, +d, 12)), +(h ?? hour ?? 19), +(mi ?? minute ?? 0), activeTz);
  }

  // 4. Specific Month and Day: "October 21st", "Oct 21", "21st of October"
  const monthMatch =
    text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/) ||
    text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*(\d{4}))?\b/);

  if (monthMatch) {
    const isFirstNum = /^\d+$/.test(monthMatch[1]);
    const monthStr = isFirstNum ? monthMatch[2] : monthMatch[1];
    const dayStr = isFirstNum ? monthMatch[1] : monthMatch[2];
    const yearStr = monthMatch[3];

    const monthKey = monthStr.slice(0, 3);
    const month = MONTH_NAMES[monthKey] ?? MONTH_NAMES[monthStr];
    const day = Number(dayStr);
    const shiftedNow = new Date(now.getTime() + activeTz * HOUR);
    let year = yearStr ? Number(yearStr) : shiftedNow.getUTCFullYear();

    const targetH = hour ?? 19;
    const targetM = minute ?? 0;
    let ts = Date.UTC(year, month, day, targetH, targetM) - activeTz * HOUR;
    // If no year specified and date already passed by more than 1 day, roll to next year
    if (!yearStr && ts < now.getTime() - DAY) {
      year += 1;
      ts = Date.UTC(year, month, day, targetH, targetM) - activeTz * HOUR;
    }
    return ts;
  }

  // 5. Day of week: "Wednesday", "this upcoming Wednesday", "next Friday"
  const dowMatch = text.match(/\b(?:(?:this\s+)?upcoming\s+|next\s+|this\s+)?(mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?|sun)(?:day)?\b/);
  if (dowMatch) {
    const dowKey = dowMatch[1].slice(0, 3);
    const targetDow = DOW_NAMES[dowKey] ?? DOW_NAMES[dowMatch[1]];
    if (targetDow !== undefined) {
      const shiftedNow = new Date(now.getTime() + activeTz * HOUR);
      const currentDow = shiftedNow.getUTCDay();
      let diff = (targetDow - currentDow + 7) % 7;
      const targetH = hour ?? 19;
      const targetM = minute ?? 0;
      const todayTs = Date.UTC(shiftedNow.getUTCFullYear(), shiftedNow.getUTCMonth(), shiftedNow.getUTCDate(), targetH, targetM) - activeTz * HOUR;
      if (diff === 0 && (todayTs <= now.getTime() || /\b(next|upcoming)\b/.test(dowMatch[0]))) {
        diff = 7;
      }
      const targetDate = new Date(shiftedNow.getTime() + diff * DAY);
      return Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), targetH, targetM) - activeTz * HOUR;
    }
  }

  // Always the NEXT occurrence, so these branches can never return the past.
  const upcoming = (base, h, m) => {
    const ts = wallClock(base, h, m, activeTz);
    return ts > now.getTime() ? ts : ts + DAY;
  };

  // 6. Day words, resolved against the server's local wall clock.
  if (/\btomorrow\b/.test(text)) return wallClock(new Date(now.getTime() + DAY), hour ?? 19, minute, activeTz);
  if (/\b(tonight|this evening|today)\b/.test(text)) return upcoming(now, hour ?? 19, minute);
  if (hour !== null) return upcoming(now, hour, minute);

  return null;
}
// ── Cards ────────────────────────────────────────────────────────────────────

const RSVP_STATUSES = ['yes', 'no'];
const RSVP_LABEL = { yes: 'Yes', no: 'No' };

const CHECKMARK_EMOJI = { id: '1549993561871618060', name: 'checkmark' };
const WRONG_EMOJI = { id: '1549993610550714381', name: 'wrong' };

// Custom ids: meet_rsvp_<status>_<meetingId>
// Yes and No buttons with custom emojis
const RSVP_BUTTONS = [
  { status: 'yes', label: 'Yes', style: ButtonStyle.Secondary, emoji: CHECKMARK_EMOJI },
  { status: 'no', label: 'No', style: ButtonStyle.Secondary, emoji: WRONG_EMOJI }
];

/** Formats the meeting location as a clickable Discord channel mention and URL link. */
function formatWhere(meeting) {
  const loc = String(meeting.location || '').trim();
  const url = meeting.locationUrl || (isLink(loc) ? loc : null);
  const idMatch = loc.match(/\b\d{17,20}\b/)?.[0];

  if (idMatch) {
    if (url) return `<#${idMatch}> (${url})`;
    return `<#${idMatch}>`;
  }
  if (url) {
    if (loc && !isLink(loc)) return `${loc} (${url})`;
    return url;
  }
  return loc || 'To be announced';
}

/** Thin divider used between card sections. */
const divider = () =>
  new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

/** True for an absolute http(s) link the card can turn into a button. */
const isLink = (value) => /^https?:\/\/\S+$/i.test(String(value || '').trim());

/** A link button - it opens the voice channel / invite. */
function joinRow(url) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Join Meeting').setURL(url)
  );
}

/**
 * The meeting card - a compact Components V2 panel without side accent border.
 * Always displays "Meeting Invitation" without redundant "Meeting Confirmed" headers.
 *
 * @param {object} meeting
 * @param {'invite'|'reminder'|'postponed'|'cancelled'|'start'} variant
 * @param {string|null} viewerId
 */
function buildCard(meeting, variant = 'invite', viewerId = null) {
  const card = new ContainerBuilder();
  const mine = viewerId ? meeting.rsvp?.[viewerId] : null;
  const isAccepted = mine?.status === 'yes';

  // Headings - always Meeting Invitation (no "Meeting Confirmed" banner)
  let heading = '## Meeting Invitation';
  if (variant === 'cancelled') heading = '## Meeting Cancelled';
  else if (variant === 'postponed') heading = '## Meeting Postponed';
  else if (variant === 'reminder') heading = '## Meeting Reminder';
  else if (variant === 'start') heading = '## Meeting Starting Now';

  card.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${heading}\n### **${meeting.title}**`));
  card.addSeparatorComponents(divider());

  const secs = Math.floor(meeting.startTs / 1000);
  const fields = [];

  if (variant === 'reminder') {
    fields.push(`**Starting**  <t:${secs}:R>  ·  <t:${secs}:t>`);
  } else if (variant === 'start') {
    fields.push(`**Started**  <t:${secs}:t>`);
  } else {
    fields.push(`**When**  <t:${secs}:F>  ·  <t:${secs}:R>`);
  }

  fields.push(`**Where**  ${formatWhere(meeting)}`);
  fields.push(`**Host**  <@${meeting.hostId}>`);
  if (meeting.agenda) fields.push(`**Agenda**  ${meeting.agenda}`);
  if (meeting.postponedCount) {
    fields.push(
      `**Postponed**  ${meeting.postponedCount} time(s)` +
        (meeting.lastPostponeReason ? ` - ${meeting.lastPostponeReason}` : '')
    );
  }
  if (variant === 'cancelled' && meeting.cancelReason) fields.push(`**Reason**  ${meeting.cancelReason}`);

  card.addTextDisplayComponents(new TextDisplayBuilder().setContent(fields.join('\n')));

  // Status line for the viewer with matching emoji indicators
  if (viewerId && variant !== 'cancelled') {
    let mineLine = '**Your Status**  Awaiting response';
    if (isAccepted) {
      mineLine = '<:checkmark:1549993561871618060> **Your Status**  Yes - Attending';
    } else if (mine?.status === 'no') {
      mineLine = '<:wrong:1549993610550714381> **Your Status**  No - Not attending';
    }
    card.addSeparatorComponents(divider());
    card.addTextDisplayComponents(new TextDisplayBuilder().setContent(mineLine));
  }

  // Action buttons
  if (variant !== 'cancelled') {
    const url = meeting.locationUrl || (isLink(meeting.location) ? String(meeting.location).trim() : null);

    // Show Join Meeting button if meeting is starting, in reminder mode, or if attendee accepted
    if (url && (variant === 'start' || variant === 'reminder' || isAccepted)) {
      card.addSeparatorComponents(divider());
      card.addActionRowComponents(joinRow(url));
    }

    if (variant === 'invite' || variant === 'reminder') {
      card.addSeparatorComponents(divider());
      card.addActionRowComponents(rsvpRow(meeting.id, mine?.status));
    }
  }

  card.addSeparatorComponents(divider());
  card.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('-# Reminders are sent 30 minutes before the meeting.')
  );

  return card;
}

/** One row of RSVP buttons for a meeting (Yes and No with custom emojis). */
function rsvpRow(meetingId, currentStatus = null) {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`meet_rsvp_yes_${meetingId}`)
      .setLabel('Yes')
      .setEmoji(CHECKMARK_EMOJI)
      .setStyle(currentStatus === 'yes' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`meet_rsvp_no_${meetingId}`)
      .setLabel('No')
      .setEmoji(WRONG_EMOJI)
      .setStyle(currentStatus === 'no' ? ButtonStyle.Danger : ButtonStyle.Secondary)
  );
  return row;
}

/** Builds the Components V2 payload for a meeting card (exported for tests). */
export function cardPayload(meeting, variant, viewerId = null) {
  return {
    components: [buildCard(meeting, variant, viewerId).toJSON()],
    flags: MessageFlags.IsComponentsV2
  };
}
// ── Delivery helpers ─────────────────────────────────────────────────────────

/** Sends a DM and returns the message (or null when DMs are closed). */
async function sendDm(userId, payload) {
  try {
    const user = await cfg.client.users.fetch(userId);
    return await user.send(payload);
  } catch {
    return null;
  }
}

/** Edits a previously sent DM in place - used by postpone so nobody is re-pinged. */
async function editDm(userId, messageId, payload) {
  if (!messageId) return false;
  try {
    // In discord.js v14 a DM channel's id is the recipient user id, so we
    // target it directly instead of calling createDM(), which can hand back a
    // fresh channel and make this edit fail and fall through to a duplicate DM.
    const dm = await cfg.client.channels.fetch(userId, { force: true }).catch(() => null);
    if (!dm || !dm.isDMBased?.()) return false;
    const msg = await dm.messages.fetch(messageId).catch(() => null);
    if (!msg) return false;
    await msg.edit(payload);
    return true;
  } catch {
    return false;
  }
}

/** Edits the channel announcement in place. */
async function editAnnouncement(meeting, payload) {
  if (!meeting.channelId || !meeting.messageId) return false;
  try {
    const channel = await cfg.client.channels.fetch(meeting.channelId);
    if (!channel?.isTextBased?.()) return false;
    const msg = await channel.messages.fetch(meeting.messageId);
    await msg.edit(payload);
    return true;
  } catch {
    return false;
  }
}

/** Turns the AI's `attendees` argument into a concrete list of user ids. */
async function resolveAttendees(guild, attendees) {
  const ids = new Set();
  let everyone = false;
  const list = Array.isArray(attendees) ? attendees : [attendees];

  if (guild?.members?.fetch) {
    await guild.members.fetch().catch(() => null);
  }

  for (const raw of list) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    if (/^(everyone|all|@everyone|here)$/i.test(value)) {
      everyone = true;
      continue;
    }

    // Role mention: <@&id>
    const roleMention = value.match(/<@&([^\s>]+)>/);
    if (roleMention) {
      const roleId = roleMention[1];
      if (guild) {
        const role = (guild.roles?.cache instanceof Map ? guild.roles.cache.get(roleId) : guild.roles?.cache?.get?.(roleId)) || (await guild.roles?.fetch?.(roleId).catch(() => null));
        if (role) {
          const membersList = role.members?.values ? [...role.members.values()] : (role.members ? Object.values(role.members) : []);
          for (const member of membersList) {
            if (!member.user?.bot) ids.add(member.id);
          }
          continue;
        }
      }
    }

    // Direct role lookup (by id or name)
    if (guild?.roles?.cache) {
      const role = (guild.roles.cache instanceof Map ? guild.roles.cache.get(value) : guild.roles.cache.get?.(value));
      if (role) {
        const membersList = role.members?.values ? [...role.members.values()] : (role.members ? Object.values(role.members) : []);
        for (const member of membersList) {
          if (!member.user?.bot) ids.add(member.id);
        }
        continue;
      }
    }

    // User mention: <@123...> or <@!123...>
    const userMention = value.match(/<@!?([^\s>]+)>/);
    if (userMention) {
      ids.add(userMention[1]);
      continue;
    }

    // Bare snowflake: could be a role or a user!
    const snowflake = value.match(/\b\d{17,20}\b/)?.[0] || value;
    if (snowflake) {
      if (guild) {
        const role = (guild.roles?.cache instanceof Map ? guild.roles.cache.get(snowflake) : guild.roles?.cache?.get?.(snowflake)) || (await guild.roles?.fetch?.(snowflake).catch(() => null));
        if (role) {
          const membersList = role.members?.values ? [...role.members.values()] : (role.members ? Object.values(role.members) : []);
          for (const member of membersList) {
            if (!member.user?.bot) ids.add(member.id);
          }
          continue;
        }
      }
      // If not a role in the guild, it is a user ID
      ids.add(snowflake);
      continue;
    }

    // Role by name (e.g. "Staff Team", "High Rank", "Trial Mod")
    if (guild?.roles?.cache) {
      let role = null;
      if (typeof guild.roles.cache.find === 'function') {
        role = guild.roles.cache.find((r) => r.name?.toLowerCase() === value.toLowerCase());
      } else if (guild.roles.cache.values) {
        for (const r of guild.roles.cache.values()) {
          if (r.name?.toLowerCase() === value.toLowerCase()) {
            role = r;
            break;
          }
        }
      }
      if (role) {
        const membersList = role.members?.values ? [...role.members.values()] : (role.members ? Object.values(role.members) : []);
        for (const member of membersList) {
          if (!member.user?.bot) ids.add(member.id);
        }
        continue;
      }
    }
  }
  return { ids, everyone };
}

/** Expands "staff" into every member wearing the Staff Team role. */
async function staffMemberIds(guild, staffRoleId) {
  if (guild?.members?.fetch) await guild.members.fetch().catch(() => null);
  const ids = [];
  if (guild?.members?.cache) {
    for (const member of guild.members.cache.values()) {
      if (member.user?.bot) continue;
      if (staffRoleId && member.roles.cache.has(staffRoleId)) ids.push(member.id);
    }
  }
  return ids;
}

// ── Reminder timers ──────────────────────────────────────────────────────────

function clearTimers() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}

/** 09:00 (configured offset) on the day the meeting starts. */
function morningOf(startTs) {
  const shifted = new Date(startTs + cfg.tzOffset * HOUR);
  const utc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    9,
    0
  );
  return utc - cfg.tzOffset * HOUR;
}

function arm(id, kind, at) {
  const key = `${id}:${kind}`;
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  const delay = Math.max(1000, at - Date.now());
  const timer = setTimeout(() => {
    timers.delete(key);
    fireReminder(id, kind).catch((err) => console.warn('[meetings] reminder failed:', err.message));
  }, delay);
  timer.unref?.();
  timers.set(key, timer);
}

/** (Re)arms every pending reminder for every scheduled meeting. */
export function armAll() {
  clearTimers();
  for (const meeting of meetings.values()) {
    if (meeting.status !== 'scheduled') continue;
    const now = Date.now();
    if (meeting.reminders) {
      // 30 minutes before the meeting starts
      const thirtyMinAt = meeting.startTs - 30 * 60_000;
      if (!meeting.sentThirtyMin && thirtyMinAt > now) {
        arm(meeting.id, 'thirty_min', thirtyMinAt);
      }
    }
    if (!meeting.sentStart && meeting.startTs > now) arm(meeting.id, 'start', meeting.startTs);
  }
}

/** Fires a reminder / start ping. Edits the existing DM where possible. */
async function fireReminder(id, kind) {
  const meeting = meetings.get(id);
  if (!meeting || meeting.status !== 'scheduled') return;

  if (kind === 'start') {
    meeting.status = 'started';
    meeting.sentStart = true;
    saveMeetings();

    const startCard = cardPayload(meeting, 'start');
    await editAnnouncement(meeting, startCard).catch(() => null);

    for (const uid of meeting.attendees || []) {
      const entry = meeting.rsvp?.[uid];
      let edited = false;
      if (entry?.dmMessageId) {
        edited = await editDm(uid, entry.dmMessageId, cardPayload(meeting, 'start', uid)).catch(() => false);
      }
      // Notify with the "Join Meeting" button for attendees who haven't declined
      if (!edited || entry?.status === 'yes' || !entry?.status) {
        await sendDm(uid, {
          content: `**${meeting.title} is starting now.**`,
          ...cardPayload(meeting, 'start', uid)
        }).catch(() => null);
      }
    }
    saveMeetings();
    return;
  }

  if (kind === 'thirty_min') {
    meeting.sentThirtyMin = true;
    saveMeetings();

    const reminderPayload = cardPayload(meeting, 'reminder');
    await editAnnouncement(meeting, reminderPayload).catch(() => null);

    for (const uid of meeting.attendees || []) {
      const entry = meeting.rsvp?.[uid];
      if (entry?.status === 'busy' || entry?.status === 'no') continue;

      const userCard = cardPayload(meeting, 'reminder', uid);
      let edited = false;
      if (entry?.dmMessageId) {
        edited = await editDm(uid, entry.dmMessageId, userCard).catch(() => false);
      }
      // Send a clean DM alert 30 minutes ahead so attendees get a fresh reminder notification
      await sendDm(uid, {
        content: `Reminder: **${meeting.title}** starts in 30 minutes.`,
        ...userCard
      }).catch(() => null);
    }
    saveMeetings();
    return;
  }
}

// ── Public AI-facing operations ──────────────────────────────────────────────

/**
 * `-ai schedule a meeting ...`
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function scheduleMeeting({ guild, channel, title, start, location, attendees, agenda, reminders, by, staffRoleId, raw }) {
  // Use the parsed/model value first. If it is unusable OR lands in the past,
  // fall back to what the human actually typed - the model sometimes invents a
  // stale date when it does not know what day it is.
  let when = parseWhen(start);
  const stale = !when || when - Date.now() < 60_000;
  if (stale && raw) {
    const fallback = parseWhen(String(raw).replace(/^.*?-ai\s+/i, ''));
    if (fallback && fallback - Date.now() >= 60_000) when = fallback;
  }

  if (!when) {
    return {
      ok: false,
      message: '❌ I could not read that time. Try "in 2 hours", "tomorrow at 7pm", "Wednesday, Oct 21 at 6:00 PM EST" or 2026-10-21T18:00.'
    };
  }
  if (when - Date.now() < 60_000) {
    return {
      ok: false,
      message:
        `❌ I read that as <t:${Math.floor(when / 1000)}:F>, which has already passed.\n` +
        `> Try a relative time instead - "in 2 hours" or "tomorrow at 7pm".`
    };
  }

  const { ids, everyone } = await resolveAttendees(guild, attendees);
  if (everyone && guild) {
    for (const member of guild.members.cache.values()) {
      if (!member.user?.bot) ids.add(member.id);
    }
  }
  // Anything that is not an explicit id means "the staff team".
  if (!ids.size) (await staffMemberIds(guild, staffRoleId)).forEach((id) => ids.add(id));

  // If a duplicate was created within the last 15 seconds, prevent rapid double-clicks.
  // Otherwise, supersede any older scheduled meeting with the same title so tests & reschedules work seamlessly.
  loadMeetings();
  const rapidDuplicate = [...meetings.values()].find(
    (m) =>
      m.status === 'scheduled' &&
      m.title.toLowerCase() === (title || 'Staff Meeting').toLowerCase() &&
      Math.abs(m.startTs - when) < 60_000 &&
      Date.now() - (m.createdAt || 0) < 15_000
  );
  if (rapidDuplicate) {
    return {
      ok: true,
      message:
        `**${rapidDuplicate.title}** is scheduled for <t:${Math.floor(rapidDuplicate.startTs / 1000)}:F>.\n` +
        `> Invites have been dispatched.`
    };
  }

  // Supersede any older scheduled meeting with the same title
  for (const m of meetings.values()) {
    if (
      m.status === 'scheduled' &&
      m.title.toLowerCase() === (title || 'Staff Meeting').toLowerCase() &&
      (!guild?.id || !m.guildId || m.guildId === guild?.id)
    ) {
      m.status = 'cancelled';
      m.cancelReason = 'Superseded by new schedule';
    }
  }

  // Resolve the place: a channel id/mention becomes a readable label plus a
  // joinable link; an invite or URL is used verbatim as the button target.
  let locationLabel = null;
  let locationUrl = null;
  const loc = String(location ?? '').trim();
  if (loc) {
    const channelId = isLink(loc) ? null : loc.match(/\b\d{17,20}\b/)?.[0] ?? null;
    if (channelId && guild) {
      const ch = await guild.channels.fetch(channelId).catch(() => null);
      if (ch) {
        locationLabel = `<#${ch.id}>`;
        // /voice/ deep-links straight into a voice channel and offers to join.
        locationUrl = ch.isVoiceBased?.()
          ? `https://discord.com/voice/${guild.id}/${ch.id}`
          : `https://discord.com/channels/${guild.id}/${ch.id}`;
      } else {
        locationLabel = loc;
        locationUrl = `https://discord.com/channels/${guild.id}/${channelId}`;
      }
    } else if (isLink(loc)) {
      locationLabel = loc;
      locationUrl = loc;
    } else {
      locationLabel = loc;
    }
  }

  const id = `mtg${Date.now().toString(36)}${Math.floor(Math.random() * 1e5).toString(36)}`;
  const meeting = {
    id,
    guildId: guild?.id ?? null,
    hostId: by.id,
    hostTag: by.tag,
    title: title || 'Staff Meeting',
    startTs: when,
    location: locationLabel,
    locationUrl,
    agenda: agenda || null,
    attendees: [...ids].slice(0, MAX_ATTENDEES),
    rsvp: {},
    status: 'scheduled',
    reminders: reminders !== false,
    sentThirtyMin: false,
    sentStart: false,
    postponedCount: 0,
    lastPostponeReason: null,
    cancelReason: null,
    channelId: channel?.id ?? null,
    messageId: null,
    createdAt: Date.now()
  };

  // DM each attendee an invite card with RSVP buttons. Each message id is
  // remembered so postpone, cancel, or start edits it in place.
  let delivered = 0;
  for (const uid of meeting.attendees) {
    const msg = await sendDm(uid, cardPayload(meeting, 'invite', uid));
    if (msg) {
      delivered++;
      meeting.rsvp[uid] = meeting.rsvp[uid] || { status: null, dmMessageId: null };
      meeting.rsvp[uid].dmMessageId = msg.id;
    }
  }

  meetings.set(id, meeting);
  saveMeetings();
  armAll();

  return {
    ok: true,
    message:
      `**${meeting.title}** scheduled for <t:${Math.floor(when / 1000)}:F> (<t:${Math.floor(when / 1000)}:R>).\n` +
      `> **Invitation sent:** ${delivered}/${meeting.attendees.length} by DM\n` +
      `${locationUrl ? `> **Join link:** ${locationLabel}\n` : (locationLabel ? `> **Where:** ${locationLabel}\n` : '')}` +
      `> **Reminder:** ${meeting.reminders ? '30 minutes before start time' : 'off'}`
  };
}

/** `-ai postpone the meeting by <duration>` */
export async function postponeMeeting({ guild, by, reason, user }) {
  loadMeetings();
  const now = Date.now();
  const scheduled = [...meetings.values()].filter(
    (m) => m.status === 'scheduled' && (!m.guildId || m.guildId === guild?.id)
  );
  const upcoming = scheduled.filter((m) => m.startTs >= now - 30 * 60_000).sort((a, b) => a.startTs - b.startTs);
  const meeting = upcoming[0] || scheduled.sort((a, b) => (b.createdAt || b.startTs) - (a.createdAt || a.startTs))[0];
  if (!meeting) return { ok: false, message: 'There is no scheduled meeting to postpone.' };

  const delta = parseDurationMs(by);
  if (!delta) return { ok: false, message: `I could not read the duration "${by}". Try "1 hour" or "3 days".` };

  meeting.startTs += delta;
  meeting.postponedCount = (meeting.postponedCount || 0) + 1;
  meeting.lastPostponeReason = reason || null;
  meeting.sentThirtyMin = false;
  meeting.sentStart = false;
  saveMeetings();

  const when = `<t:${Math.floor(meeting.startTs / 1000)}:F> (<t:${Math.floor(meeting.startTs / 1000)}:R>)`;
  await editAnnouncement(meeting, cardPayload(meeting, 'postponed')).catch(() => null);

  let edited = 0;
  for (const uid of meeting.attendees) {
    const entry = meeting.rsvp?.[uid];
    if (await editDm(uid, entry?.dmMessageId, cardPayload(meeting, 'postponed', uid))) edited++;
  }
  armAll();

  return {
    ok: true,
    message:
      `**${meeting.title}** postponed to ${when}.\n` +
      `> **Cards updated in place:** ${edited}/${meeting.attendees.length} (no double pings)\n` +
      (reason ? `> **Reason:** ${reason}\n` : '')
  };
}

/** `-ai cancel the meeting` */
export async function cancelMeeting({ guild, reason, user }) {
  loadMeetings();
  const now = Date.now();
  const scheduled = [...meetings.values()].filter(
    (m) => m.status === 'scheduled' && (!m.guildId || m.guildId === guild?.id)
  );
  const upcoming = scheduled.filter((m) => m.startTs >= now - 30 * 60_000).sort((a, b) => a.startTs - b.startTs);
  const meeting = upcoming[0] || scheduled.sort((a, b) => (b.createdAt || b.startTs) - (a.createdAt || a.startTs))[0];
  if (!meeting) return { ok: false, message: 'There is no scheduled meeting to cancel.' };

  meeting.status = 'cancelled';
  meeting.cancelReason = reason || null;
  saveMeetings();
  clearTimers();
  armAll();

  await editAnnouncement(meeting, cardPayload(meeting, 'cancelled')).catch(() => null);
  let notified = 0;
  for (const uid of meeting.attendees) {
    const entry = meeting.rsvp?.[uid];
    if (await editDm(uid, entry?.dmMessageId, cardPayload(meeting, 'cancelled', uid))) notified++;
  }

  return { ok: true, message: `**${meeting.title}** cancelled. ${notified} attendee(s) notified.` };
}

/** `-ai list meetings` */
export async function listMeetings({ guild } = {}) {
  const rows = [...meetings.values()]
    .filter((m) => !guild?.id || !m.guildId || m.guildId === guild?.id)
    .sort((a, b) => a.startTs - b.startTs);
  if (!rows.length) return { ok: true, message: 'There are no meetings scheduled.' };

  const lines = rows.map((m, i) => {
    const status = m.status === 'scheduled' ? '' : ` **(${m.status})**`;
    return (
      `${i + 1}. **${m.title}**${status} - <t:${Math.floor(m.startTs / 1000)}:F> (<t:${Math.floor(m.startTs / 1000)}:R>)\n` +
      `> Where: ${m.location || 'Not set'} · Host: <@${m.hostId}>\n` +
      `> Invited: ${(m.attendees || []).length} · Invited by DM` +
      (m.postponedCount ? ` · Postponed ${m.postponedCount} time(s)` : '')
    );
  });
  return { ok: true, message: `## Scheduled Meetings\n${lines.join('\n\n')}` };
}

/**
 * `-ai who accepted the meetings` / `who is busy` / `whos joining the meeting and who isnt`
 * RSVP roll-call for the next upcoming scheduled meeting.
 * Renders a clean Components V2 card without pinging users and with zero emojis.
 * @returns {Promise<{ok: boolean, components: object[], flags: number, message: string}>}
 */
export async function meetingRsvp({ guild, meetingId = null } = {}) {
  loadMeetings();
  const now = Date.now();
  const scheduled = [...meetings.values()].filter(
    (m) => m.status === 'scheduled' && (!guild?.id || !m.guildId || m.guildId === guild?.id)
  );

  // Prioritize upcoming meetings (future start time or within last 30 minutes)
  const upcoming = scheduled
    .filter((m) => m.startTs >= now - 30 * 60_000)
    .sort((a, b) => a.startTs - b.startTs);

  const next = (meetingId ? meetings.get(meetingId) : null) ||
    upcoming[0] ||
    scheduled.sort((a, b) => (b.createdAt || b.startTs) - (a.createdAt || a.startTs))[0];

  if (!next) return { ok: true, message: 'There is no scheduled meeting to roll-call.' };

  const rsvp = next.rsvp || {};
  const buckets = { yes: [], maybe: [], busy: [], no: [], pending: [] };
  for (const uid of next.attendees || []) {
    const st = rsvp[uid]?.status;
    if (st && buckets[st]) buckets[st].push(uid);
    else buckets.pending.push(uid);
  }

  // Resolves a user's display name or username cleanly without ever mentioning <@id>
  const resolveName = async (uid) => {
    try {
      if (guild) {
        const member = guild.members.cache.get(uid) || (await guild.members.fetch?.(uid).catch(() => null));
        if (member) return member.displayName || member.user?.username || uid;
      }
      const user = cfg.client?.users?.cache?.get(uid) || (await cfg.client?.users?.fetch?.(uid).catch(() => null));
      return user?.globalName || user?.username || uid;
    } catch {
      return uid;
    }
  };

  const [yesNames, busyNames, noNames, maybeNames, pendingNames] = await Promise.all([
    Promise.all(buckets.yes.map(resolveName)),
    Promise.all(buckets.busy.map(resolveName)),
    Promise.all(buckets.no.map(resolveName)),
    Promise.all(buckets.maybe.map(resolveName)),
    Promise.all(buckets.pending.map(resolveName))
  ]);

  const cannotNames = [...busyNames, ...noNames];
  const cannotCount = buckets.busy.length + buckets.no.length;

  const formatList = (names) => (names.length ? names.map((n) => `• \`${n}\``).join('\n') : '*None*');

  const container = new ContainerBuilder();
  const secs = Math.floor(next.startTs / 1000);

  // Header: Clean V2 panel title
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `## Meeting Attendance\n` +
      `### **${next.title}**`
    )
  );

  container.addSeparatorComponents(divider());

  // Meeting metadata
  const meta = [
    `**When**  <t:${secs}:F>  ·  <t:${secs}:R>`,
    `**Where**  ${next.location || 'To be announced'}`,
    `**Host**  <@${next.hostId}>`
  ];
  if (next.agenda) meta.push(`**Agenda**  ${next.agenda}`);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(meta.join('\n')));

  container.addSeparatorComponents(divider());

  // Attendance breakdown
  const sections = [];
  sections.push(`**Can Join - ${buckets.yes.length}**\n${formatList(yesNames)}`);
  if (buckets.maybe.length) {
    sections.push(`**Maybe - ${buckets.maybe.length}**\n${formatList(maybeNames)}`);
  }
  if (cannotCount) {
    sections.push(`**Cannot Join - ${cannotCount}**\n${formatList(cannotNames)}`);
  }
  sections.push(`**Awaiting Response - ${buckets.pending.length}**\n${formatList(pendingNames)}`);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(sections.join('\n\n'))
  );

  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Total: ${next.attendees?.length || 0} invited · ${buckets.yes.length} confirmed attending.`
    )
  );

  // Fallback plain-text representation (clean usernames, no pings, no emojis)
  const plainFallback = [
    `## Meeting Attendance - ${next.title}`,
    `> **When:** <t:${secs}:F> (<t:${secs}:R>)`,
    `> **Where:** ${next.location || 'To be announced'} · **Host:** <@${next.hostId}>`,
    ``,
    `**Attending (${buckets.yes.length}):** ${yesNames.length ? yesNames.map((n) => `\`${n}\``).join(', ') : '*None*'}`,
    buckets.maybe.length ? `**Tentative (${buckets.maybe.length}):** ${maybeNames.map((n) => `\`${n}\``).join(', ')}` : '',
    cannotCount ? `**Unable to Attend (${cannotCount}):** ${cannotNames.map((n) => `\`${n}\``).join(', ')}` : '',
    `**Awaiting Response (${buckets.pending.length}):** ${pendingNames.length ? pendingNames.map((n) => `\`${n}\``).join(', ') : '*None*'}`
  ].filter(Boolean).join('\n');

  return {
    ok: true,
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    message: plainFallback
  };
}
// ── Buttons ──────────────────────────────────────────────────────────────────

/**
 * Handles a meeting RSVP button, in a DM or in the channel.
 * Edits the card in place so the tally stays accurate and nothing is re-pinged.
 * @returns {Promise<boolean>} true when the customId belonged to a meeting.
 */
export async function handleMeetingButton(interaction) {
  // New RSVP row: meet_rsvp_<status>_<meetingId>. Status is a fixed word, so we
  // match it explicitly rather than splitting on '_' (meeting ids contain '_').
  const rsvpMatch = /^meet_rsvp_(yes|maybe|busy|no)_(.+)$/.exec(interaction.customId || '');
  // Legacy buttons from older builds: meet_yes/no/maybe_<id>.
  const legacyMatch = /^meet_(yes|no|maybe)_(.+)$/.exec(interaction.customId || '');
  const match = rsvpMatch || legacyMatch;
  if (!match) return false;
  const status = match[1];
  const id = match[2];

  // Another instance may own this meeting. Re-read the shared store before
  // giving up, so a stale in-memory copy never shows "no longer exists".
  let meeting = meetings.get(id);
  if (!meeting) {
    loadMeetings();
    meeting = meetings.get(id);
  }

  if (!meeting) {
    await interaction
      .reply({
        content:
          'That meeting is no longer available - it may have been cancelled or the record has been cleared.\n' +
          '> Ask the host for the current details.',
        flags: MessageFlags.Ephemeral
      })
      .catch(() => null);
    return true;
  }

  if (meeting.status === 'cancelled') {
    await interaction
      .reply({ content: 'That meeting was cancelled.', flags: MessageFlags.Ephemeral })
      .catch(() => null);
    return true;
  }

  meeting.rsvp = meeting.rsvp || {};
  const previous = meeting.rsvp[interaction.user.id]?.status;
  meeting.rsvp[interaction.user.id] = {
    ...(meeting.rsvp[interaction.user.id] || {}),
    status,
    at: Date.now()
  };
  saveMeetings();

  // Shared channel panel: rebuild WITHOUT a viewer id, so "Your reply" (which
  // is per-person) never leaks the last clicker's choice to everyone - the
  // live tally below is the shared truth. In DMs (legacy cards) keep the
  // personalised "Your reply" line.
  const inDm = !interaction.guildId;
  const payload = cardPayload(
    meeting,
    meeting.status === 'started' ? 'start' : 'invite',
    inDm ? interaction.user.id : null
  );
  // Prefer interaction.update(): it edits the card AND acknowledges the click
  // (editing interaction.message directly leaves the interaction un-acked, so
  // the confirmation followUp below would 40060). Fall back to message.edit
  // for the rare case update() is unavailable.
  try {
    if (typeof interaction.update === 'function') {
      await interaction.update(payload);
    } else if (interaction.message && typeof interaction.message.edit === 'function') {
      await interaction.message.edit(payload);
    }
  } catch {
    // Fall through to a plain acknowledgement so the click still registers.
  }
  return true;
}

/** Local duration parser ("2 hours", "3 days", "90 minutes") -> milliseconds. */
function parseDurationMs(input) {
  const text = String(input || '').trim().toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w)\b/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = match[2][0];
  const ms = unit === 'm' ? 60_000 : unit === 'h' ? HOUR : unit === 'd' ? DAY : 604_800_000;
  return n * ms;
}

/** Snapshot of the pending meetings, handy for tests / diagnostics. */
export const listScheduledMeetings = () => [...meetings.values()];