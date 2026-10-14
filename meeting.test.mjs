/**
 * Offline smoke test for the meeting scheduler and the new AI helpers.
 * Mocks just enough of the Discord surface to exercise the real code paths.
 * Run: node meeting.test.mjs
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  initMeetingService,
  scheduleMeeting,
  postponeMeeting,
  cancelMeeting,
  listMeetings,
  meetingRsvp,
  handleMeetingButton,
  parseWhen,
  listScheduledMeetings,
  cardPayload
} from './src/meetings.js';
import { parseLocally } from './src/ai.js';

const store = path.join(os.tmpdir(), `meetings-test-${Date.now()}.json`);

// ── Mock Discord surface ─────────────────────────────────────────────────────
const dms = new Map(); // userId -> [message]
const channelMsgs = [];
let dmFailFor = new Set();

function makeMessage(id, payload) {
  let current = payload;
  return {
    id,
    get payload() { return current; },
    async edit(next) { current = next; return this; }
  };
}

const client = {
  users: {
    async fetch(id) {
      return {
        id,
        async send(payload) {
          if (dmFailFor.has(id)) throw new Error('Cannot send messages to this user');
          const msg = makeMessage(`dm_${id}_${dms.get(id)?.length ?? 0}`, payload);
          if (!dms.has(id)) dms.set(id, []);
          dms.get(id).push(msg);
          return msg;
        },
        async createDM() {
          const list = dms.get(id) ?? [];
          return {
            messages: {
              async fetch(messageId) {
                const found = list.find((m) => m.id === messageId);
                if (!found) throw new Error('Unknown Message');
                return found;
              }
            }
          };
        }
      };
    }
  }
};

const guild = {
  id: 'g1',
  channels: {
    async fetch(id) {
      return { id, name: 'staff-voice', isVoiceBased: () => true };
    }
  },
  roles: {
    cache: new Map([
      ['role_mod', {
        id: 'role_mod',
        name: 'Moderator',
        members: new Map([
          ['u1', { user: { bot: false }, id: 'u1' }],
          ['u2', { user: { bot: false }, id: 'u2' }]
        ])
      }]
    ])
  },
  members: {
    async fetch() {},
    cache: {
      get(id) {
        if (id === 'u1') return { id: 'u1', displayName: 'Sulman', user: { username: 'sulman', bot: false } };
        if (id === 'u2') return { id: 'u2', displayName: 'Alex', user: { username: 'alex', bot: false } };
        return null;
      },
      values() {
        return [
          { user: { bot: false }, id: 'u1', displayName: 'Sulman', roles: { cache: { has: () => true } } },
          { user: { bot: false }, id: 'u2', displayName: 'Alex', roles: { cache: { has: () => true } } },
          { user: { bot: true }, id: 'bot', roles: { cache: { has: () => true } } }
        ][Symbol.iterator]();
      }
    }
  }
};

const channel = {
  id: 'c1',
  isTextBased: () => true,
  async send(payload) {
    const msg = makeMessage(`ch_${channelMsgs.length}`, payload);
    channelMsgs.push(msg);
    return msg;
  },
  async messages() {},
  messages: {
    async fetch(messageId) {
      const found = channelMsgs.find((m) => m.id === messageId);
      if (!found) throw new Error('Unknown Message');
      return found;
    }
  }
};

// ── Tests ────────────────────────────────────────────────────────────────────
initMeetingService({ client, storeFile: store, tzOffset: -6 });

console.log('parseWhen "in 2 hours":', parseWhen('in 2 hours') ? 'ok' : 'FAIL');
console.log('parseWhen "tomorrow at 7pm":', parseWhen('tomorrow at 7pm') ? 'ok' : 'FAIL');
console.log('parseWhen "gibberish":', parseWhen('gibberish') === null ? 'ok' : 'FAIL');

const by = { id: 'owner1', tag: 'owner#0001' };

// 1. Schedule → DMs every attendee, posts NOTHING in the channel.
const sched = await scheduleMeeting({
  guild,
  channel,
  title: 'Command Meeting',
  start: 'in 2 hours',
  location: '<#987654321098765432>',
  attendees: ['u1', 'u2'],
  agenda: 'Weekly staffing review',
  reminders: true,
  by,
  staffRoleId: 'r1'
});
assert.strictEqual(sched.ok, true, 'schedule ok');
console.log('schedule message:', sched.message.split('\n')[0]);
console.log('DMs to u1:', dms.get('u1')?.length, '| DMs to u2:', dms.get('u2')?.length, '| channel posts:', channelMsgs.length);
assert.strictEqual(dms.get('u1').length, 1, 'one invite DM per attendee');
assert.strictEqual(channelMsgs.length, 0, 'nothing is posted in the channel');

const meeting = listScheduledMeetings()[0];
const originalStart = meeting.startTs;

// 2. Legacy RSVP buttons still work for cards created by older builds.
const interaction = {
  customId: `meet_yes_${meeting.id}`,
  user: { id: 'u1' },
  message: makeMessage('legacy_dm', dms.get('u1')[0].payload),
  async followUp() {},
  async reply() {}
};
const handled = await handleMeetingButton(interaction);
assert.strictEqual(handled, true);
assert.strictEqual(meeting.rsvp.u1.status, 'yes');
console.log('legacy RSVP button still handled:', 'ok');

// 3. Postpone → shifts time, EDITS existing DMs (no new DMs).
const beforeCount = dms.get('u1').length;
const post = await postponeMeeting({ guild, by: '2 hours', reason: 'host busy', user: by });
assert.strictEqual(post.ok, true);
assert.strictEqual(meeting.startTs - originalStart, 2 * 3600_000, 'start moved 2h');
assert.strictEqual(dms.get('u1').length, beforeCount, 'no new DM on postpone');
console.log('postpone moved time 2h:', 'ok', '| new DMs created:', dms.get('u1').length - beforeCount);

// 4. list meetings.
const list = await listMeetings({ guild });
assert.strictEqual(list.ok, true);
console.log('list meetings header:', list.message.split('\n')[0]);
console.log('list shows where/host/invited:', list.message.includes('Where:') && list.message.includes('Invited:') ? 'ok' : 'FAIL');

// 5. Cancel → edits everyone, marks cancelled.
const cancel = await cancelMeeting({ guild, reason: 'holiday', user: by });
assert.strictEqual(cancel.ok, true);
assert.strictEqual(meeting.status, 'cancelled');
console.log('cancel message:', cancel.message);

// 6. Persistence round-trip.
const saved = JSON.parse(fs.readFileSync(store, 'utf8'));
assert.ok(Object.values(saved)[0].title === 'Command Meeting');
console.log('persisted to disk:', 'ok');

// 7. Bad time is refused, not guessed.
const bad = await scheduleMeeting({ guild, channel, title: 'x', start: 'sometime maybe', attendees: ['u1'], by });
assert.strictEqual(bad.ok, false);
console.log('bad time refused:', 'ok');

// 8. Bare duration ("2 hours", no "in") is read as relative to now.
const bare = await scheduleMeeting({
  guild, channel, title: 'Bare duration', start: '2 hours',
  attendees: ['u1'], agenda: null, reminders: true, by,
  raw: '-ai schedule a meeting in 2 hours'
});
assert.strictEqual(bare.ok, true, 'bare duration ok');
console.log('bare "2 hours" accepted:', 'ok');

// 9. A stale model-generated date recovers from what the human actually typed.
//    This is the exact bug behind "That time is in the past".
const stale = await scheduleMeeting({
  guild, channel, title: 'Stale date', start: '2023-10-04T19:00',
  attendees: ['u1'], agenda: null, reminders: true, by,
  raw: '-ai schedule a staff meeting tomorrow at 7pm to talk about rosters'
});
assert.strictEqual(stale.ok, true, 'stale date recovered from raw text');
const recovered = listScheduledMeetings().find((m) => m.title === 'Stale date');
assert.ok(recovered.startTs > Date.now(), 'recovered time is in the future');
console.log('stale 2023 ISO recovered from raw text:', 'ok', '->', new Date(recovered.startTs).toUTCString());

// 10. "tonight" never returns a past time either.
const tonight = parseWhen('tonight');
assert.ok(tonight && tonight > Date.now(), 'tonight is in the future');
console.log('tonight is future:', 'ok');

// 11. Card design: borderless V2 panel with only Joining & Maybe buttons.
//     Live roll-call tally is NOT on the card (only shown via -ai).
//     Join button only appears once the user accepts ('yes') or meeting starts.
const m0 = listScheduledMeetings()[0];
m0.locationUrl = 'https://discord.gg/example';
m0.rsvp = {};
const cardBeforeAccept = cardPayload(m0, 'invite', 'u1');
const cardBeforeJson = cardBeforeAccept.components[0];
const textBefore = cardBeforeJson.components.filter((c) => c.type === 10).map((c) => c.content).join('\n');
const labelsBefore = JSON.stringify(cardBeforeJson).match(/"label":"([^"]+)"/g) || [];

assert.strictEqual(cardBeforeAccept.flags, 1 << 15, 'card must carry the IsComponentsV2 flag');
assert.ok([17, 18].includes(cardBeforeJson.type), 'card is a Components V2 container');
assert.strictEqual(cardBeforeJson.accent_color, undefined, 'card has no accent color (borderless V2 panel)');

// RSVP buttons present: ONLY Joining & Maybe
assert.ok(labelsBefore.some((l) => /Joining/.test(l)), 'has a Joining button');
assert.ok(labelsBefore.some((l) => /Maybe/.test(l)), 'has a Maybe button');
assert.ok(!labelsBefore.some((l) => /Not going/.test(l)), 'no Not going button');
assert.ok(!labelsBefore.some((l) => /Can't make it/.test(l)), 'no Can\'t make it button');

// Join button hidden before accept
assert.ok(!labelsBefore.some((l) => /Join Meeting/.test(l)), 'Join button hidden until accepted');

// No live response tally on the card
assert.ok(!textBefore.includes('### Responses'), 'no live responses tally on the card');

// Join button appears once user accepts ('yes')
m0.rsvp = { u1: { status: 'yes', at: Date.now() } };
const cardAfterAccept = cardPayload(m0, 'invite', 'u1');
const labelsAfter = JSON.stringify(cardAfterAccept.components[0]).match(/"label":"([^"]+)"/g) || [];
assert.ok(labelsAfter.some((l) => /Join Meeting/.test(l)), 'Join button unlocked after accepting');

console.log('card: borderless V2 / Joining & Maybe only (gray) / Join unlocked on accept / no tally:', 'ok');

// 13. Natural full date with weekday, month, time, and timezone.
const userPrompt = 'We will be holding a mandatory Staff Meeting this upcoming Wednesday, October 21st at 6:00 PM EST.';
const parsedUserDate = parseWhen(userPrompt);
assert.ok(parsedUserDate && parsedUserDate > Date.now(), 'user natural prompt parsed to future timestamp');
console.log('user natural prompt parsed date:', 'ok', '->', new Date(parsedUserDate).toUTCString());

// 14. Intent parser matches schedule with title and start intact.
const schedIntent = parseLocally(`-ai ${userPrompt}`);
assert.strictEqual(schedIntent.action, 'meeting_schedule', 'matches meeting_schedule intent');
assert.strictEqual(schedIntent.args.title, 'Mandatory Staff Meeting', 'title extracted as Mandatory Staff Meeting');
assert.ok(schedIntent.args.start, 'start time extracted');
console.log('parseLocally on user meeting request:', 'ok', schedIntent.action, schedIntent.args.title);

// 15. Role ID attendee expansion -> DMs every member of that role.
dms.clear();
const roleSched = await scheduleMeeting({
  guild,
  channel,
  title: 'Role Scheduled Meeting',
  start: 'in 3 hours',
  location: '<#123456789012345678>',
  attendees: ['<@&role_mod>'],
  agenda: 'Role sync',
  reminders: true,
  by
});
assert.strictEqual(roleSched.ok, true, 'role schedule ok');
assert.strictEqual(dms.get('u1')?.length, 1, 'u1 (in role_mod) received DM');
assert.strictEqual(dms.get('u2')?.length, 1, 'u2 (in role_mod) received DM');
console.log('role ID expanded to all role members and DM sent:', 'ok');

// 16. Attendance roll-call ("whos joining the meeting and who isnt"):
//     - Intent matches meeting_rsvp
//     - Returns Components V2 container
//     - Never mentions <@id> (zero pings)
//     - Shows display names of attendees
const rsvpIntent = parseLocally('-ai whos joining the meeting and who isnt');
assert.strictEqual(rsvpIntent.action, 'meeting_rsvp', 'whos joining matched meeting_rsvp');

// RSVP interaction: u1 joins, u2 is busy (can't make it)
const latestMeeting = listScheduledMeetings().filter((m) => m.title === 'Role Scheduled Meeting')[0];
await handleMeetingButton({
  customId: `meet_rsvp_yes_${latestMeeting.id}`,
  user: { id: 'u1' },
  message: makeMessage('dm_u1', dms.get('u1')[0].payload),
  async followUp() {},
  async reply() {}
});
await handleMeetingButton({
  customId: `meet_rsvp_busy_${latestMeeting.id}`,
  user: { id: 'u2' },
  message: makeMessage('dm_u2', dms.get('u2')[0].payload),
  async followUp() {},
  async reply() {}
});

const rollcall = await meetingRsvp({ guild, meetingId: latestMeeting.id });
assert.strictEqual(rollcall.ok, true, 'rollcall ok');
assert.strictEqual(rollcall.flags, 1 << 15, 'rollcall has Components V2 flag');
const rollJson = JSON.stringify(rollcall.components);
assert.ok(!rollJson.includes('<@u1>') && !rollJson.includes('<@u2>'), 'rollcall does NOT ping with <@id>');
assert.ok(rollJson.includes('Sulman') && rollJson.includes('Alex'), 'shows member display names');
assert.ok(rollJson.includes('Can Join') && rollJson.includes('Cannot Join'), 'shows Can Join and Cannot Join sections');
console.log('meetingRsvp: V2 container / no pings / display names:', 'ok');

fs.unlinkSync(store);
console.log('\nALL MEETING TESTS PASSED');