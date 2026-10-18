import { chance, createRepository, intBetween, pick, rowId, seeded, shuffle } from "./core"
import { CHATS, type Chat } from "./chats"
import { MEMBERS } from "./members"

/** One line of a chat, with how far it got: sent, delivered, or read by the other side. */
export type Message = {
  id: string
  /** A Chat id. */
  chatId: string
  /** A Member id: whoever wrote it. */
  fromId: string
  text: string
  at: Date
  status: "sent" | "delivered" | "read"
}

const COUNT = 300

const MINUTE_MS = 60_000

// What teammates on an analytics product write to each other. Three registers,
// so a thread opens, carries on and closes the way a real one does; the openers
// and closers are walked by chat so no two threads start or end alike.
const OPENERS = [
  "Morning — did the staging deploy go out?",
  "Quick one: can you look at the webhook retries when you have a minute?",
  "Are we still on for the design review on Thursday?",
  "I pushed the funnel export branch, ready for a look.",
  "Heads up, the events endpoint is close to its rate limit again.",
  "Do you have the numbers for the renewal call?",
  "Has anyone seen the seat-count job finish today?",
  "Lunch at 12:30? I want to talk through the pricing page.",
  "Is the sandbox workspace ready for Fathom to try?",
  "Who is on support this week? The rota note has a gap.",
  "Can we move standup to 9:30 tomorrow?",
  "The retention export is done — want to see it before it ships?",
  "Anyone free to pair on the SSO loop this afternoon?",
  "The changelog draft is up. Two paragraphs, no surprises.",
]

const REPLIES = [
  "Yes, it went out an hour ago. Nothing in the error log so far.",
  "On it. I think it is the retry backoff, not the queue.",
  "Still on. I moved it to the big room.",
  "Looking now — first pass looks good, one comment on the CSV header.",
  "Saw that. I raised the limit on the staging cluster for now.",
  "Usage is up 40% quarter on quarter. Sending the deck.",
  "It finished at 09:12, took twice as long as yesterday though.",
  "Works for me. Bring the copy doc.",
  "Sounds good, thanks.",
  "Can you add that to the standup notes?",
  "Agreed. Let us ship it Monday.",
  "I will write it up and share the link here.",
  "That matches what I saw in the trace.",
  "Perfect, thank you.",
  "Let me check with the platform team first.",
  "Which workspace was that on? I only see it on Fathom's.",
  "The dashboard totals disagree with the API by about 2%; I think it is the sampling.",
  "Pushed a fix for the timezone on scheduled reports.",
  "Could you review the seat-count PR before standup?",
  "I would keep the plan names and drop the strikethrough prices.",
  "The alert fired at 03:10 and nobody was paged — rota gap again.",
  "Adding it to the retro notes now.",
  "Do we have a customer who would try the sandbox workspace?",
  "Lumen is near the seat cap, worth raising on the renewal call.",
  "I moved the design review to Thursday, same room.",
  "Fine by me. Let us do it after the release.",
  "One more thing: the webhook page never says the payload is signed.",
  "Yes — I will bring the enterprise comparison.",
  "The export queue drained overnight, all green now.",
  "Thanks, that is exactly what I needed.",
]

const CLOSERS = [
  "Great, see you then.",
  "Done. Closing the ticket.",
  "Thanks — that unblocks me.",
  "Talk tomorrow.",
  "Merged. Thank you both.",
  "I will pick it up first thing.",
  "Perfect. Have a good evening.",
  "Sent the link. Shout if it does not open.",
  "Booked. See everyone Thursday.",
  "Great work today, all.",
  "Noted — adding it to the retro.",
  "Sorted. Off for the day.",
  "Cheers, that is all from me.",
  "Deal. Monday it is.",
]

/**
 * How many messages each chat holds, adding up to `COUNT` exactly: a draw per
 * chat, scaled to the total, with the rounding error settled on the last one.
 */
function allocate(rand: () => number, chats: readonly Chat[]): number[] {
  const raw = chats.map(() => intBetween(rand, 10, 34))
  const total = raw.reduce((sum, value) => sum + value, 0)
  const counts = raw.map((value) => Math.max(1, Math.round((value / total) * COUNT)))
  const settled = counts.reduce((sum, value) => sum + value, 0)
  counts[counts.length - 1] += COUNT - settled
  return counts
}

function generate(): Message[] {
  const rand = seeded("messages")
  const me = MEMBERS[0].id
  const counts = allocate(rand, CHATS)
  const rows: Message[] = []

  CHATS.forEach((chat, chatIndex) => {
    const count = counts[chatIndex]
    const others = chat.memberIds.filter((id) => id !== me)
    // Each thread walks its own shuffle of the replies, so a line repeats only
    // once every thirty messages rather than whenever the draw lands on it.
    const deck = shuffle(rand, REPLIES)

    // Timestamps are laid down backwards from the chat's own lastMessageAt, so
    // the thread ends exactly where the list says it does and never after now.
    const times: number[] = new Array(count)
    times[count - 1] = chat.lastMessageAt.getTime()
    for (let index = count - 2; index >= 0; index -= 1) {
      // A reply lands within the hour most of the time; now and then the
      // thread sleeps overnight.
      const gap = chance(rand, 0.8) ? intBetween(rand, 2, 55) : intBetween(rand, 300, 900)
      times[index] = times[index + 1] - gap * MINUTE_MS
    }

    for (let index = 0; index < count; index += 1) {
      const inUnreadTail = index >= count - chat.unread
      // The unread tail is what the other side wrote since the reader last
      // opened the thread, so it is never the reader's own.
      const fromMe = inUnreadTail ? false : chance(rand, 0.48)
      const fromId = fromMe ? me : pick(rand, others)
      const last = index === count - 1
      const text =
        index === 0
          ? OPENERS[chatIndex % OPENERS.length]
          : last && !inUnreadTail
            ? CLOSERS[chatIndex % CLOSERS.length]
            : deck[index % deck.length]

      let status: Message["status"]
      if (fromMe) {
        // The reader's last word may still be on its way; everything earlier
        // has been read by the other side.
        status = last ? (chance(rand, 0.5) ? "delivered" : "read") : "read"
      } else {
        status = inUnreadTail ? "delivered" : "read"
      }

      rows.push({
        id: rowId("msg", rows.length + 1),
        chatId: chat.id,
        fromId,
        text,
        at: new Date(times[index]),
        status,
      })
    }
  })

  return rows
}

/** The seeded messages. The repository below owns the rows the composer adds to. */
export const MESSAGES: Message[] = generate()

export const messages = createRepository(MESSAGES, {
  searchKeys: ["text"],
  filterKeys: ["chatId", "fromId", "status"],
})
