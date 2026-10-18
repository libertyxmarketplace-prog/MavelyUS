import {
  REFERENCE_DATE,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { CUSTOMERS } from "./customers"
import { MEMBERS } from "./members"

/** An opportunity on the pipeline: a company, a stage, a number and an owner. */
export type Deal = {
  id: string
  /** What the deal is for — "Blue Harbor Labs · Team, 40 seats". */
  name: string
  company: string
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
  /** Contract value in minor units — cents, not dollars. */
  amountCents: number
  currency: "USD"
  /** A Member id: the rep who owns it. */
  owner: string
  /** A Customer id when the company is already on the books. */
  customerId?: string
  /** How likely it is to close, 0..100. A closed deal is 100 or 0. */
  probability: number
  source: "inbound" | "outbound" | "referral" | "partner" | "event"
  createdAt: Date
  lastActivityAt: Date
  /** Midnight UTC on the day it is forecast to close. */
  expectedCloseAt: Date
}

const COUNT = 64

const STAGE_MIX: readonly (readonly [Deal["stage"], number])[] = [
  ["lead", 0.24],
  ["qualified", 0.2],
  ["proposal", 0.16],
  ["negotiation", 0.12],
  ["won", 0.18],
  ["lost", 0.1],
]

const SOURCE_MIX: readonly (readonly [Deal["source"], number])[] = [
  ["inbound", 0.34],
  ["outbound", 0.24],
  ["referral", 0.18],
  ["partner", 0.14],
  ["event", 0.1],
]

/** The share of deals in a stage that close, as the forecast reads it. */
const PROBABILITY: Record<Deal["stage"], [number, number]> = {
  lead: [5, 20],
  qualified: [20, 45],
  proposal: [40, 65],
  negotiation: [60, 85],
  won: [100, 100],
  lost: [0, 0],
}

const PACKAGES: readonly (readonly [string, number, number])[] = [
  ["Starter", 1_200_00, 4_800_00],
  ["Team", 4_800_00, 24_000_00],
  ["Business", 18_000_00, 60_000_00],
  ["Enterprise", 48_000_00, 240_000_00],
]

/** Midnight UTC on the day `date` falls on — a forecast names a day, not an instant. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function generate(): Deal[] {
  const rand = seeded("deals")
  const reps = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )
  // One company per deal, so a pipeline does not show the same logo four times.
  const accounts = shuffle(rand, CUSTOMERS).slice(0, COUNT)

  return Array.from({ length: COUNT }, (_, index) => {
    const stage = pickWeighted(rand, STAGE_MIX)
    const closed = stage === "won" || stage === "lost"
    const account = accounts[index]
    const [tier, low, high] = pick(rand, PACKAGES)
    const seats = intBetween(rand, 10, 400)

    const createdAt = dateBetween(rand, daysAgo(240), daysAgo(closed ? 20 : 2))
    const lastActivityAt = dateBetween(rand, createdAt, REFERENCE_DATE)
    // A closed deal closed behind us; an open one is forecast ahead of today.
    const expectedCloseAt = utcDay(
      closed ? lastActivityAt : daysAhead(intBetween(rand, 3, 120), REFERENCE_DATE)
    )
    const [minimum, maximum] = PROBABILITY[stage]

    return {
      id: rowId("dea", index + 1),
      name: `${account.company} · ${tier}, ${seats} seats`,
      company: account.company,
      stage,
      amountCents: Math.round(intBetween(rand, low, high) / 100_00) * 100_00,
      currency: "USD" as const,
      owner: pick(rand, reps),
      customerId: account.id,
      probability: intBetween(rand, minimum, maximum),
      source: pickWeighted(rand, SOURCE_MIX),
      createdAt,
      lastActivityAt,
      expectedCloseAt,
    }
  })
}

/** The seeded pipeline. The repository below owns the rows a board moves. */
export const DEALS: Deal[] = generate()

export const deals = createRepository(DEALS, {
  searchKeys: ["name", "company"],
  filterKeys: ["stage", "owner", "source"],
})
