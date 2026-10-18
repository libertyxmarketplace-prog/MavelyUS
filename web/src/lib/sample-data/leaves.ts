import {
  REFERENCE_DATE,
  chance,
  createRepository,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { EMPLOYEES } from "./employees"

/** A request for time off: who, what kind, which days, and whether it was granted. */
export type Leave = {
  id: string
  /** An Employee id. */
  employeeId: string
  kind: "annual" | "sick" | "parental" | "unpaid"
  /** Midnight UTC on the first day away. */
  from: Date
  /** Midnight UTC on the last day away, `from` included. */
  to: Date
  status: "pending" | "approved" | "declined"
  note?: string
}

const COUNT = 40

const KIND_MIX: readonly (readonly [Leave["kind"], number])[] = [
  ["annual", 0.55],
  ["sick", 0.25],
  ["parental", 0.08],
  ["unpaid", 0.12],
]

const STATUS_MIX: readonly (readonly [Leave["status"], number])[] = [
  ["pending", 0.35],
  ["approved", 0.45],
  ["declined", 0.2],
]

/** How long a request runs, in days, by kind. */
const SPAN: Record<Leave["kind"], [number, number]> = {
  annual: [1, 10],
  sick: [1, 4],
  parental: [30, 90],
  unpaid: [2, 14],
}

const NOTES: Record<Leave["kind"], string[]> = {
  annual: ["Family holiday", "Long weekend away", "Wedding", "Moving house", "Visiting parents"],
  sick: ["Flu", "Dental surgery", "Migraine", "Back injury"],
  parental: ["Paternity leave", "Maternity leave", "Adoption leave"],
  unpaid: ["Sabbatical", "Study leave", "Travel", "Caring for a relative"],
}

/** Midnight UTC on the day `date` falls on — a request names days, not instants. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function generate(): Leave[] {
  const rand = seeded("leaves")

  return Array.from({ length: COUNT }, (_, index) => {
    const kind = pickWeighted(rand, KIND_MIX)
    const status = pickWeighted(rand, STATUS_MIX)
    const [least, most] = SPAN[kind]
    // A request still waiting is for days ahead; a decided one may be behind us.
    const from = utcDay(
      status === "pending"
        ? daysAhead(intBetween(rand, 2, 45), REFERENCE_DATE)
        : daysAgo(intBetween(rand, -30, 60), REFERENCE_DATE)
    )
    const to = utcDay(daysAhead(intBetween(rand, least, most) - 1, from))
    const note = chance(rand, 0.6) ? pick(rand, NOTES[kind]) : undefined

    return {
      id: rowId("lve", index + 1),
      employeeId: pick(rand, EMPLOYEES).id,
      kind,
      from,
      to,
      status,
      ...(note ? { note } : {}),
    }
  })
}

/** The seeded leave book. The repository below owns the rows a manager decides. */
export const LEAVES: Leave[] = generate()

export const leaves = createRepository(LEAVES, {
  searchKeys: ["note"],
  filterKeys: ["status", "kind", "employeeId"],
})
