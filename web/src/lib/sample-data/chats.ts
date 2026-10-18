import {
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  intBetween,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { MEMBERS } from "./members"

/**
 * A conversation in the chat app: a direct message with one teammate, or a
 * named group. The signed-in member — `MEMBERS[0]`, the workspace owner — is
 * in every one of them, which is what makes the list theirs.
 */
export type Chat = {
  id: string
  kind: "dm" | "group"
  /** A group's own name; for a dm, the other member's name. */
  name: string
  /** Member ids, the signed-in member included. */
  memberIds: string[]
  /** Messages at the end of the thread the reader has not opened yet. */
  unread: number
  lastMessageAt: Date
  muted: boolean
}

const DM_COUNT = 9

const GROUP_NAMES = ["Design team", "Launch week", "Platform on-call", "Weekend trip", "Book club"]

function generate(): Chat[] {
  const rand = seeded("chats")
  const me = MEMBERS[0]
  // Only people still in the workspace write, and nobody chats with themselves.
  const others = MEMBERS.filter((member) => member.status === "active" && member.id !== me.id)
  const partners = shuffle(rand, others).slice(0, DM_COUNT)

  const dms: Chat[] = partners.map((partner, index) => ({
    id: rowId("cht", index + 1),
    kind: "dm",
    name: partner.name,
    memberIds: [me.id, partner.id],
    unread: chance(rand, 0.3) ? intBetween(rand, 1, 5) : 0,
    // Most threads moved this week; a couple went quiet a fortnight ago.
    lastMessageAt: dateBetween(rand, daysAgo(chance(rand, 0.75) ? 6 : 16), daysAgo(1 / 96)),
    muted: chance(rand, 0.1),
  }))

  const groups: Chat[] = GROUP_NAMES.map((name, index) => {
    const size = intBetween(rand, 3, 5)
    return {
      id: rowId("cht", DM_COUNT + index + 1),
      kind: "group",
      name,
      memberIds: [me.id, ...shuffle(rand, others).slice(0, size - 1).map((member) => member.id)],
      unread: chance(rand, 0.4) ? intBetween(rand, 1, 8) : 0,
      lastMessageAt: dateBetween(rand, daysAgo(chance(rand, 0.75) ? 6 : 16), daysAgo(1 / 48)),
      // A busy group is the one a reader mutes.
      muted: chance(rand, 0.4),
    }
  })

  return [...dms, ...groups]
}

/** The seeded chats. The repository below owns the rows the app opens and answers. */
export const CHATS: Chat[] = generate()

export const chats = createRepository(CHATS, {
  searchKeys: ["name"],
  filterKeys: ["kind", "muted"],
})
