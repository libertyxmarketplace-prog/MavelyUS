import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  domainFor,
  emailFor,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { avatarFor } from "./avatars"
import { MEMBERS } from "./members"

/** A person who showed interest: where they came from, how far they have got, what they might be worth. */
export type Lead = {
  id: string
  name: string
  /** A face for the lead — the kit's own avatar route for the name — */
  avatarUrl?: string
  email: string
  company: string
  source: "website" | "referral" | "ads" | "social" | "event"
  status: "new" | "contacted" | "qualified" | "won" | "lost"
  /** What the deal would be worth, in minor units — cents, not dollars. */
  valueCents: number
  /** A Member id: the rep who is working it. */
  ownerId: string
  /**
   * When the rep next has to do something about it. Unset on a lead that was
   * never scheduled, `null` once the follow-up is done — the store's `update`
   * keeps `undefined` out of a patch, so an erase is written as null.
   */
  nextActionAt?: Date | null
  createdAt: Date
}

const COUNT = 120

const FIRST_NAMES = [
  "Amara", "Benedikt", "Chiara", "Daan", "Elif", "Fionn", "Gabriela", "Henrik",
  "Ingrid", "Jaro", "Kenji", "Leila", "Matteo", "Nell", "Oskar", "Paloma",
  "Quentin", "Rosa", "Samir", "Teodora", "Ulla", "Viktor", "Wren", "Zara",
]

const LAST_NAMES = [
  "Abernathy", "Bakker", "Castellanos", "Dahl", "Eze", "Fischer", "Grünewald", "Haddad",
  "Iversen", "Jiménez", "Kowal", "Lindgren", "Marais", "Nkemelu", "Olsen", "Pedersen",
  "Quist", "Rossi", "Sato", "Tremblay", "Ueda", "Varga", "Whitlock", "Ziegler",
]

const COMPANY_HEADS = [
  "Ashford", "Brightwater", "Caldera", "Driftwood", "Evergreen", "Fernhill", "Goldcrest",
  "Hollowell", "Ironbridge", "Juniper", "Kingfisher", "Larkspur", "Marlow", "Nightjar",
  "Oakridge", "Pinecrest", "Redwood", "Saltmarsh", "Thornfield", "Umber", "Vale", "Westbrook",
]

const COMPANY_TAILS = [
  "Consulting", "Freight", "Interactive", "Foods", "Ventures", "Clinics", "Outfitters",
  "Learning", "Capital", "Works", "Supply", "Hospitality", "Creative", "Mobility",
]

const SOURCE_MIX: readonly (readonly [Lead["source"], number])[] = [
  ["website", 0.34],
  ["referral", 0.2],
  ["ads", 0.18],
  ["social", 0.18],
  ["event", 0.1],
]

const STATUS_MIX: readonly (readonly [Lead["status"], number])[] = [
  ["new", 0.28],
  ["contacted", 0.26],
  ["qualified", 0.2],
  ["won", 0.16],
  ["lost", 0.1],
]

/** How much of the funnel is still waiting on the rep, by stage. */
const NEEDS_ACTION: Record<Lead["status"], number> = {
  new: 0.85,
  contacted: 0.7,
  qualified: 0.6,
  won: 0,
  lost: 0,
}

/** Minute-aligned, on the quarter hour between nine and six — the hours a rep books calls in. */
function officeHours(rand: () => number, day: Date): Date {
  const midnight = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())
  return new Date(midnight + (9 * 60 + 15 * intBetween(rand, 0, 36)) * 60_000)
}

function generate(): Lead[] {
  const rand = seeded("leads")
  const reps = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )
  // Every pairing, shuffled once, so no two leads share a name.
  const names = shuffle(
    rand,
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`))
  ).slice(0, COUNT)
  const companies = shuffle(
    rand,
    COMPANY_HEADS.flatMap((head) => COMPANY_TAILS.map((tail) => `${head} ${tail}`))
  ).slice(0, COUNT)

  return names.map((name, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    const closed = status === "won" || status === "lost"
    const company = companies[index]
    // A closed lead has had time to close; an open one may be a day old.
    const createdAt = dateBetween(rand, daysAgo(150), daysAgo(closed ? 14 : 1))
    // Mostly ahead of today, with a few that have slipped past it — a
    // follow-up list that is never overdue would have nothing to flag.
    const nextActionAt = chance(rand, NEEDS_ACTION[status])
      ? officeHours(rand, daysAhead(intBetween(rand, -3, 34), REFERENCE_DATE))
      : undefined

    return {
      id: rowId("lea", index + 1),
      name,
      avatarUrl: avatarFor(name),
      email: emailFor(name, domainFor(company)),
      company,
      source: pickWeighted(rand, SOURCE_MIX),
      status,
      valueCents: intBetween(rand, 15, 480) * 100_00,
      ownerId: pick(rand, reps),
      ...(nextActionAt ? { nextActionAt } : {}),
      createdAt,
    }
  })
}

/** The seeded funnel. The repository below owns the rows a page converts or ticks off. */
export const LEADS: Lead[] = generate()

export const leads = createRepository(LEADS, {
  searchKeys: ["name", "company", "email"],
  filterKeys: ["source", "status", "ownerId"],
})
