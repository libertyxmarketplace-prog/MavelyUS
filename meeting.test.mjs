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
  handleMeetingButton,
  parseWhen,
  listScheduledMeetings,
  cardPayload
} from './src/meetings.js';

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
  members: {
    async fetch() {},
    cache: {
      values() {
        return [
          { user: { bot: false }, id: 'u1', roles: { cache: { has: () => true } } },
          { user: { bot: false }, id: 'u2', roles: { cache: { has: () => true } } },
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

// 11. Card design: V2 panel with an RSVP row (Joining / Maybe / Can't make it /
//     Not going) and a live response tally. Optional join link when a URL exists.
const cardPayloadOut = cardPayload(listScheduledMeetings()[0], 'invite', 'u1');
const cardJson = cardPayloadOut.components[0];
const text = cardJson.components.filter((c) => c.type === 10).map((c) => c.content).join('\n');
const labels = JSON.stringify(cardJson).match(/"label":"([^"]+)"/g) || [];

assert.strictEqual(cardPayloadOut.flags, 1 << 15, 'card must carry the IsComponentsV2 flag');
// Container type is 17 in this discord.js build (18 in newer ones).
assert.ok([17, 18].includes(cardJson.type), 'card is a Components V2 container');
// RSVP buttons present with the new labels.
assert.ok(labels.some((l) => /Joining/.test(l)), 'has a Joining button');
assert.ok(labels.some((l) => /Maybe/.test(l)), 'has a Maybe button');
assert.ok(labels.some((l) => /Can't make it/.test(l)), "has a Can't make it button");
assert.ok(labels.some((l) => /Not going/.test(l)), 'has a Not going button');
// Per-viewer reply line for the supplied viewer.
assert.ok(/Your reply/.test(text), 'shows the viewer their own reply line');
console.log('card: V2 / RSVP row / per-viewer reply:', 'ok');
console.log('rsvp buttons:', labels.join(', '));

// 12. Without a location there is no JOIN LINK, but the RSVP row is still shown
//     so people can always respond (Joining / Maybe / Can't make it / Not going).
const noPlace = cardPayload({ ...listScheduledMeetings()[0], location: null, locationUrl: null }, 'invite', 'u1');
const noPlaceLabels = JSON.stringify(noPlace.components[0]).match(/"label":"([^"]+)"/g) || [];
assert.ok(!noPlaceLabels.some((l) => /Join the meeting/.test(l)), 'no join link without a place');
assert.ok(noPlaceLabels.some((l) => /Joining/.test(l)), 'RSVP row still present without a place');
console.log('no location -> no join link but RSVP row stays:', 'ok');

fs.unlinkSync(store);
console.log('\nALL MEETING TESTS PASSED');