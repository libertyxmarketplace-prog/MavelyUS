import { createRepository, dateBetween, daysAgo, daysAhead, emailFor, intBetween, pick, pickWeighted, rowId, seeded, shuffle } from "./core"
import { MEMBERS } from "./members"

/** A pending or resolved invite to join the workspace. */
export type Invitation = {
  id: string
  email: string
  /** The access level granted once accepted — never "owner"; there is only one. */
  role: "admin" | "member" | "viewer"
  /** A Member id: whoever sent the invitation. */
  invitedBy: string
  sentAt: Date
  /** Always a future date — daysAhead from REFERENCE_DATE, independent of status. */
  expiresAt: Date
  status: "pending" | "accepted" | "expired" | "revoked"
}

const COUNT = 15

const FIRST_NAMES = [
  "Talia", "Soren", "Bianca", "Kian", "Yara", "Milo", "Petra", "Idris",
  "Wren", "Anton", "Selin", "Cyrus", "Nadia", "Emrys", "Ottilie",
]

const LAST_NAMES = [
  "Marchetti", "Solheim", "Okafor", "Vasquez", "Lindberg", "Aoki", "Reyes", "Haugen",
  "Kobayashi", "Fontana", "Riis", "Beaumont", "Zeleny", "Iversen", "Cabral",
]

// Reserved example domains (RFC 2606), so no generated address can be a real person's.
const EMAIL_DOMAINS = ["example.com", "example.net", "example.org", "mail.example"]

const ROLE_MIX: readonly (readonly [Invitation["role"], number])[] = [
  ["member", 0.6],
  ["viewer", 0.25],
  ["admin", 0.15],
]

const STATUS_MIX: readonly (readonly [Invitation["status"], number])[] = [
  ["accepted", 0.45],
  ["pending", 0.25],
  ["expired", 0.2],
  ["revoked", 0.1],
]

function generate(): Invitation[] {
  const rand = seeded("invitations")
  // Every first/last pairing, shuffled once and sliced, so no two invitees share a name.
  const names = shuffle(rand, FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`))).slice(
    0,
    COUNT
  )
  const senders = MEMBERS.filter(
    (member) => member.status === "active" && (member.role === "owner" || member.role === "admin")
  ).map((member) => member.id)

  return names.map((name, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    // A still-pending invite was sent recently; anything else has had time to
    // be accepted, expire, or get revoked.
    const sentDaysAgo = status === "pending" ? intBetween(rand, 0, 10) : intBetween(rand, 5, 75)
    const sentAt = dateBetween(rand, daysAgo(sentDaysAgo), daysAgo(Math.max(sentDaysAgo - 1, 0)))

    return {
      id: rowId("ivt", index + 1),
      email: emailFor(name, pick(rand, EMAIL_DOMAINS)),
      role: pickWeighted(rand, ROLE_MIX),
      invitedBy: pick(rand, senders),
      sentAt,
      // An invitation's expiry is a future date by nature (core.ts's doc
      // comment calls this out explicitly): every row gets one, even an
      // already-expired or revoked invite, so the field always reads as
      // "when this link stops working," independent of `status`.
      expiresAt: daysAhead(intBetween(rand, 3, 21)),
      status,
    }
  })
}

/** The seeded invitation list. The repository below owns the rows a demo mutates. */
export const INVITATIONS: Invitation[] = generate()

export const invitations = createRepository(INVITATIONS, {
  searchKeys: ["email"],
  filterKeys: ["role", "status"],
})
