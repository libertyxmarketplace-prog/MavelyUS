import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { MEMBERS } from "./members"

/** A property on the books: what it is, where, what it asks, and how the market has answered. */
export type Listing = {
  id: string
  title: string
  kind: "house" | "apartment" | "villa" | "office"
  city: string
  country: string
  /** The asking price in minor units — cents, not dollars. */
  priceCents: number
  status: "listed" | "under_offer" | "sold" | "rented"
  beds: number
  baths: number
  sqm: number
  /** A Member id: the agent who holds it. */
  agentId: string
  listedAt: Date
  /** When it sold or let; only a sold or rented listing has one. */
  closedAt?: Date
  /** Page views since it was listed. */
  views: number
  /** Enquiries since it was listed. */
  enquiries: number
  /** The next booked viewing; only an open listing has one. */
  nextViewingAt?: Date
}

const COUNT = 60

const STREETS = [
  "Linden", "Harbour", "Maple", "Riverside", "Orchard", "Beacon", "Willow", "Granite",
  "Elm", "Meadow", "Lakeview", "Cedar", "Chapel", "Vineyard", "Marlow", "Hawthorn",
]

const SUFFIXES: Record<Listing["kind"], string[]> = {
  house: ["Lane", "Road", "Close", "Drive"],
  apartment: ["Court", "Lofts", "Residences", "Apartments"],
  villa: ["Villa", "Estate", "Gardens"],
  office: ["Exchange", "Tower", "Works", "Offices"],
}

const PLACES: readonly (readonly [string, string])[] = [
  ["Lisbon", "Portugal"],
  ["Porto", "Portugal"],
  ["Barcelona", "Spain"],
  ["Valencia", "Spain"],
  ["Amsterdam", "Netherlands"],
  ["Berlin", "Germany"],
  ["Munich", "Germany"],
  ["Copenhagen", "Denmark"],
  ["Dublin", "Ireland"],
  ["Edinburgh", "United Kingdom"],
  ["Lyon", "France"],
  ["Milan", "Italy"],
]

const KIND_MIX: readonly (readonly [Listing["kind"], number])[] = [
  ["house", 0.36],
  ["apartment", 0.34],
  ["villa", 0.14],
  ["office", 0.16],
]

const STATUS_MIX: readonly (readonly [Listing["status"], number])[] = [
  ["listed", 0.5],
  ["under_offer", 0.15],
  ["sold", 0.22],
  ["rented", 0.13],
]

/** Asking prices in whole thousands of dollars, by kind. */
const PRICE_THOUSANDS: Record<Listing["kind"], [number, number]> = {
  house: [320, 1_400],
  apartment: [180, 780],
  villa: [900, 3_600],
  office: [400, 2_200],
}

const BEDS: Record<Listing["kind"], [number, number]> = {
  house: [2, 6],
  apartment: [1, 4],
  villa: [3, 7],
  office: [0, 0],
}

const BATHS: Record<Listing["kind"], [number, number]> = {
  house: [1, 4],
  apartment: [1, 2],
  villa: [2, 5],
  office: [1, 4],
}

const SQM: Record<Listing["kind"], [number, number]> = {
  house: [90, 320],
  apartment: [45, 160],
  villa: [220, 640],
  office: [120, 900],
}

const DAY = 86_400_000

/** Minute-aligned, on the quarter hour between nine and six — when viewings are booked. */
function officeHours(rand: () => number, day: Date): Date {
  const midnight = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())
  return new Date(midnight + (9 * 60 + 15 * intBetween(rand, 0, 36)) * 60_000)
}

function generate(): Listing[] {
  const rand = seeded("listings")
  const agents = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )

  return Array.from({ length: COUNT }, (_, index) => {
    const kind = pickWeighted(rand, KIND_MIX)
    const status = pickWeighted(rand, STATUS_MIX)
    const closed = status === "sold" || status === "rented"
    const [city, country] = pick(rand, PLACES)
    const [low, high] = PRICE_THOUSANDS[kind]

    // A closed listing was on the market long enough to close; an open one may
    // have gone up this week.
    const listedAt = dateBetween(rand, daysAgo(240), daysAgo(closed ? 20 : 2))
    const closedAt = closed ? dateBetween(rand, daysAhead(5, listedAt), REFERENCE_DATE) : undefined
    // Interest accrues while the listing is live, at a pace of its own.
    const liveDays = Math.max(1, Math.round(((closedAt ?? REFERENCE_DATE).getTime() - listedAt.getTime()) / DAY))
    const views = Math.max(20, Math.round(liveDays * intBetween(rand, 4, 22)))
    const enquiries = Math.round(views * intBetween(rand, 20, 70) / 1000)
    const nextViewingAt =
      !closed && chance(rand, 0.5) ? officeHours(rand, daysAhead(intBetween(rand, 1, 14))) : undefined

    return {
      id: rowId("lst", index + 1),
      title: `${intBetween(rand, 1, 240)} ${pick(rand, STREETS)} ${pick(rand, SUFFIXES[kind])}`,
      kind,
      city,
      country,
      priceCents: intBetween(rand, low, high) * 1_000_00,
      status,
      beds: intBetween(rand, BEDS[kind][0], BEDS[kind][1]),
      baths: intBetween(rand, BATHS[kind][0], BATHS[kind][1]),
      sqm: intBetween(rand, SQM[kind][0], SQM[kind][1]),
      agentId: pick(rand, agents),
      listedAt,
      ...(closedAt ? { closedAt } : {}),
      views,
      enquiries,
      ...(nextViewingAt ? { nextViewingAt } : {}),
    }
  })
}

/** The seeded book. The repository below owns the rows a page reads. */
export const LISTINGS: Listing[] = generate()

export const listings = createRepository(LISTINGS, {
  searchKeys: ["title", "city"],
  filterKeys: ["kind", "status", "agentId", "city"],
})
