import { REFERENCE_DATE, createRepository, daysAgo, daysAhead, intBetween, pick, pickWeighted, rowId, seeded } from "./core"
import { MEMBERS } from "./members"

/** A named piece of work with a lead, a window and a share of it done. */
export type Project = {
  id: string
  name: string
  /** The three-letter code a task's title is prefixed with on a board. */
  code: string
  status: "planning" | "active" | "at_risk" | "shipped"
  /** A Member id: whoever runs it. */
  lead: string
  /** Midnight UTC on the day the work opened. */
  startAt: Date
  /** Midnight UTC on the day it is due to land. */
  endAt: Date
  /** Share of the work finished, 0..100. */
  progress: number
}

const NAMES: readonly (readonly [string, string])[] = [
  ["Atlas migration", "ATL"],
  ["Billing rewrite", "BIL"],
  ["Checkout redesign", "CHK"],
  ["Data warehouse", "DWH"],
  ["Edge caching", "EDG"],
  ["Fraud scoring", "FRD"],
  ["Guest onboarding", "GST"],
  ["Insights API", "INS"],
  ["Mobile parity", "MOB"],
  ["Partner portal", "PTL"],
  ["Search relevance", "SRC"],
  ["Trust centre", "TRS"],
]

const STATUS_MIX: readonly (readonly [Project["status"], number])[] = [
  ["active", 0.45],
  ["at_risk", 0.2],
  ["planning", 0.15],
  ["shipped", 0.2],
]

/** Midnight UTC on the day `date` falls on — a project's window is whole days. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * How far along a project reads, given what it is: a shipped one is finished,
 * a planned one has barely started, and the two in flight are somewhere in
 * between — with the one at risk behind where the calendar says it should be.
 */
function progressFor(rand: () => number, status: Project["status"]): number {
  if (status === "shipped") return 100
  if (status === "planning") return intBetween(rand, 0, 10)
  if (status === "at_risk") return intBetween(rand, 15, 55)
  return intBetween(rand, 30, 85)
}

function generate(): Project[] {
  const rand = seeded("projects")
  const leads = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )

  return NAMES.map(([name, code], index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    // Every project opened at least forty days ago, so a shipped one — which
    // landed inside the last month — always closes after it opened.
    const startAt = utcDay(daysAgo(intBetween(rand, 40, 200)))
    const endAt = utcDay(
      status === "shipped"
        ? daysAgo(intBetween(rand, 2, 30))
        : // Everything still running runs out ahead of the reference date,
          // which is what puts a bar across "today" on a timeline.
          daysAhead(intBetween(rand, 20, 150), REFERENCE_DATE)
    )

    return {
      id: rowId("prj", index + 1),
      name,
      code,
      status,
      lead: pick(rand, leads),
      startAt,
      endAt,
      progress: progressFor(rand, status),
    }
  })
}

/** The seeded project list. The repository below owns the rows a demo mutates. */
export const PROJECTS: Project[] = generate()

export const projects = createRepository(PROJECTS, {
  searchKeys: ["name", "code"],
  filterKeys: ["status", "lead"],
})
