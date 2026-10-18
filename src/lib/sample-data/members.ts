import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  emailFor,
  intBetween,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { avatarFor } from "./avatars"

/** A person in the workspace this sample data describes. */
export type Member = {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member" | "viewer"
  status: "active" | "invited" | "deactivated"
  avatarUrl?: string
  joinedAt: Date
  lastActiveAt: Date
  twoFactor: boolean
}

/** The workspace's own domain: every member is on it, no customer is. */
const TEAM_DOMAIN = "vibra.example"

const COUNT = 24

const FIRST_NAMES = [
  "Aisha", "Bruno", "Camille", "Dmitri", "Esther", "Farid", "Greta", "Hassan",
  "Iris", "Kwame", "Lior", "Magda", "Nadia", "Ola", "Rafik", "Sonia",
]

const LAST_NAMES = [
  "Adeyemi", "Brandt", "Costa", "Dubois", "Eriksen", "Farrow", "Gallo", "Halvorsen",
  "Imani", "Jansen", "Keller", "Larsen", "Meyer", "Nakamura", "Ortiz", "Pereira",
]

// The workspace has one owner (the first row), so the rest share out the
// remaining roles: a few admins, mostly members, a handful of read-only seats.
const ROLE_MIX: readonly (readonly [Member["role"], number])[] = [
  ["admin", 0.22],
  ["member", 0.6],
  ["viewer", 0.18],
]

const STATUS_MIX: readonly (readonly [Member["status"], number])[] = [
  ["active", 0.75],
  ["invited", 0.17],
  ["deactivated", 0.08],
]

function generate(): Member[] {
  const rand = seeded("members")
  // Every pairing, shuffled once, so no two teammates share a name.
  const names = shuffle(
    rand,
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`))
  ).slice(0, COUNT)

  return names.map((name, index) => {
    const founder = index === 0
    const role = founder ? "owner" : pickWeighted(rand, ROLE_MIX)
    const status = founder ? "active" : pickWeighted(rand, STATUS_MIX)

    const joinedDaysAgo = founder
      ? 1180
      : status === "invited"
        ? intBetween(rand, 1, 21)
        : status === "deactivated"
          ? intBetween(rand, 180, 1100)
          : intBetween(rand, 30, 1100)
    // Somewhere inside that day, rather than on its edge: whole-day offsets
    // would stamp every row with the same time as REFERENCE_DATE.
    const joinedAt = dateBetween(rand, daysAgo(joinedDaysAgo), daysAgo(joinedDaysAgo - 1))

    const lastActiveAt =
      status === "invited"
        ? // An invitation nobody has accepted yet: there is nothing to show.
          joinedAt
        : status === "deactivated"
          ? dateBetween(rand, joinedAt, daysAgo(60))
          : dateBetween(rand, daysAgo(10), REFERENCE_DATE)

    return {
      id: rowId("mbr", index + 1),
      name,
      email: emailFor(name, TEAM_DOMAIN),
      role,
      status,
      // Drawn by the kit's own avatar route from the name — a face for
      // everyone, and nothing here links to an image host.
      avatarUrl: avatarFor(name),
      joinedAt,
      lastActiveAt,
      twoFactor: status === "invited" ? false : role === "owner" || role === "admin" || chance(rand, 0.55),
    }
  })
}

/** The seeded team directory. The repository below owns the rows a demo mutates. */
export const MEMBERS: Member[] = generate()

export const members = createRepository(MEMBERS, {
  searchKeys: ["name", "email"],
  filterKeys: ["role", "status"],
})
