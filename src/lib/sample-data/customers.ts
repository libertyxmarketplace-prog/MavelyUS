import {
  REFERENCE_DATE,
  createRepository,
  dateBetween,
  daysAgo,
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

/** A company account: the billing relationship, plus the person who signed up. */
export type Customer = {
  id: string
  name: string
  /** A face for the contact — the kit's own avatar route for the name — */
  avatarUrl?: string
  email: string
  company: string
  plan: "free" | "starter" | "team" | "enterprise"
  status: "active" | "trial" | "churned" | "suspended"
  /** Monthly recurring revenue in minor units — cents, not dollars. */
  mrrCents: number
  seats: number
  country: string
  createdAt: Date
  lastSeenAt: Date
  /** A `Member` id: the account's owner on our side. */
  owner: string
}

const COUNT = 250

const FIRST_NAMES = [
  "Ada", "Owen", "Mira", "Luis", "Nina", "Tobias", "Priya", "Jonas",
  "Elena", "Marcus", "Yuki", "Sofia", "Ivan", "Clara", "Hugo", "Anouk",
  "Diego", "Freya", "Omar", "Lena", "Noah", "Ines", "Rafael", "Maja",
]

const LAST_NAMES = [
  "Lovelace", "Hartley", "Okonkwo", "Ferreira", "Bauer", "Lindqvist", "Raman", "Novak",
  "Petrova", "Delacroix", "Tanaka", "Moreau", "Kovacs", "Nyman", "Silva", "Vermeer",
  "Castillo", "Andersen", "Weiss", "Bergman", "Duarte", "Fontaine", "Kowalski", "Marchetti",
]

const COMPANY_HEADS = [
  "Northwind", "Blue Harbor", "Meridian", "Lakeside", "Kestrel", "Ironwood", "Fathom",
  "Cobalt", "Alder", "Vantage", "Brightline", "Silverpine", "Harborview", "Quarry",
  "Lumen", "Trellis", "Wavelength", "Foxglove", "Beacon", "Granite",
]

const COMPANY_TAILS = [
  "Labs", "Systems", "Analytics", "Health", "Logistics", "Studio", "Retail",
  "Robotics", "Digital", "Group", "Software", "Partners", "Media", "Energy",
]

const COUNTRIES: readonly (readonly [string, number])[] = [
  ["United States", 0.3],
  ["United Kingdom", 0.11],
  ["Germany", 0.1],
  ["Canada", 0.08],
  ["France", 0.07],
  ["Netherlands", 0.06],
  ["Australia", 0.06],
  ["Sweden", 0.05],
  ["Spain", 0.04],
  ["Japan", 0.04],
  ["Brazil", 0.04],
  ["India", 0.03],
  ["Portugal", 0.01],
  ["Ireland", 0.01],
]

const PLAN_MIX: readonly (readonly [Customer["plan"], number])[] = [
  ["free", 0.34],
  ["starter", 0.31],
  ["team", 0.26],
  ["enterprise", 0.09],
]

/** Cents per seat per month. A free plan bills nothing, whatever the seat count. */
const PLAN_PRICE_CENTS: Record<Customer["plan"], number> = {
  free: 0,
  starter: 1_200,
  team: 2_400,
  enterprise: 4_800,
}

const SEAT_RANGE: Record<Customer["plan"], readonly [number, number]> = {
  free: [1, 3],
  starter: [3, 15],
  team: [10, 60],
  enterprise: [50, 400],
}

// Nobody trials the free plan — there is nothing to try — so the status mix
// depends on the plan the account is on.
const FREE_STATUS_MIX: readonly (readonly [Customer["status"], number])[] = [
  ["active", 0.7],
  ["churned", 0.25],
  ["suspended", 0.05],
]

const PAID_STATUS_MIX: readonly (readonly [Customer["status"], number])[] = [
  ["active", 0.72],
  ["trial", 0.12],
  ["churned", 0.12],
  ["suspended", 0.04],
]

function generate(): Customer[] {
  const rand = seeded("customers")
  // Every head/tail pairing, shuffled once and sliced: 280 companies for 250
  // accounts, so no two customers share a company (or, therefore, a domain).
  const companies = shuffle(
    rand,
    COMPANY_HEADS.flatMap((head) => COMPANY_TAILS.map((tail) => `${head} ${tail}`))
  ).slice(0, COUNT)
  const owners = MEMBERS.filter((member) => member.status === "active").map((member) => member.id)

  return companies.map((company, index) => {
    const name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
    const plan = pickWeighted(rand, PLAN_MIX)
    const status = pickWeighted(rand, plan === "free" ? FREE_STATUS_MIX : PAID_STATUS_MIX)
    const [minSeats, maxSeats] = SEAT_RANGE[plan]
    const seats = intBetween(rand, minSeats, maxSeats)

    // A churned account has had time to churn; a trial has not had time to age.
    const ageDays =
      status === "churned"
        ? intBetween(rand, 120, 900)
        : status === "trial"
          ? intBetween(rand, 1, 21)
          : intBetween(rand, 21, 900)
    // Somewhere inside that day, rather than on its edge: whole-day offsets
    // would stamp all 250 accounts with the same time as REFERENCE_DATE.
    const createdAt = dateBetween(rand, daysAgo(ageDays), daysAgo(ageDays - 1))
    const fortnight = daysAgo(14)
    const lastSeenAt =
      status === "churned"
        ? dateBetween(rand, createdAt, daysAgo(45))
        : status === "suspended"
          ? dateBetween(rand, createdAt, daysAgo(7))
          : // A live account was here recently — but never before it existed.
            dateBetween(rand, fortnight > createdAt ? fortnight : createdAt, REFERENCE_DATE)

    return {
      id: rowId("cus", index + 1),
      name,
      avatarUrl: avatarFor(name),
      email: emailFor(name, domainFor(company)),
      company,
      plan,
      status,
      // Trials and churned accounts bill nothing; everyone else pays per seat.
      mrrCents: plan === "free" || status === "trial" || status === "churned" ? 0 : seats * PLAN_PRICE_CENTS[plan],
      seats,
      country: pickWeighted(rand, COUNTRIES),
      createdAt,
      lastSeenAt,
      owner: pick(rand, owners),
    }
  })
}

/** The seeded customer list. The repository below owns the rows a demo mutates. */
export const CUSTOMERS: Customer[] = generate()

export const customers = createRepository(CUSTOMERS, {
  searchKeys: ["name", "email", "company", "country"],
  filterKeys: ["plan", "status", "country", "owner"],
})
