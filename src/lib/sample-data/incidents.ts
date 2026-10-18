import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, daysAhead, intBetween, pick, pickWeighted, rowId, seeded, shuffle } from "./core"
import { MEMBERS } from "./members"
import { SERVICES } from "./services"

/** One entry in an incident's status-page timeline. */
type Update = { at: Date; status: Incident["status"]; message: string }

/** A status-page incident affecting one or more services. */
export type Incident = {
  id: string
  title: string
  severity: "sev1" | "sev2" | "sev3"
  status: "investigating" | "identified" | "monitoring" | "resolved"
  /** Service ids this incident affects. */
  serviceIds: string[]
  startedAt: Date
  resolvedAt?: Date
  updates: Update[]
  /** A Member id: the engineer running point on the incident. */
  commander: string
}

const COUNT = 40

const SEVERITY_MIX: readonly (readonly [Incident["severity"], number])[] = [
  ["sev3", 0.55],
  ["sev2", 0.32],
  ["sev1", 0.13],
]

const STAGE_ORDER: Incident["status"][] = ["investigating", "identified", "monitoring", "resolved"]

const TITLE_TEMPLATES: ((service: string) => string)[] = [
  (service) => `Elevated error rates on ${service}`,
  (service) => `${service} latency spike`,
  (service) => `${service} degraded performance`,
  (service) => `Intermittent timeouts calling ${service}`,
  (service) => `${service} returning 5xx responses`,
  (service) => `Connection failures affecting ${service}`,
  (service) => `${service} outage`,
]

const UPDATE_MESSAGES: Record<Incident["status"], string[]> = {
  investigating: [
    "We are investigating reports of an issue.",
    "Engineers are looking into elevated error rates.",
    "We are aware of the issue and beginning triage.",
  ],
  identified: [
    "We have identified the root cause and are working on a fix.",
    "The cause has been found; a fix is being rolled out.",
  ],
  monitoring: [
    "A fix has been deployed. We are monitoring the results.",
    "The fix is live and metrics are recovering. Monitoring closely.",
  ],
  resolved: ["This incident has been resolved.", "The issue is fully resolved. Thank you for your patience."],
}

/** One update per reached stage, starting at `startedAt`, each no earlier than the last. */
function buildUpdates(rand: () => number, startedAt: Date, finalStatus: Incident["status"], resolvedAt?: Date): Update[] {
  const stages = STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(finalStatus) + 1)
  const endTime = resolvedAt ?? REFERENCE_DATE
  let previous = startedAt
  return stages.map((status, index) => {
    const at = index === 0 ? startedAt : dateBetween(rand, previous, endTime)
    previous = at
    return { at, status, message: pick(rand, UPDATE_MESSAGES[status]) }
  })
}

function generate(): Incident[] {
  const rand = seeded("incidents")
  const commanders = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )

  return Array.from({ length: COUNT }, (_, index) => {
    const ageDays = intBetween(rand, 1, 180)
    const startedAt = dateBetween(rand, daysAgo(ageDays), daysAgo(ageDays - 1))
    // Only a recently-started incident has a chance of still being open —
    // one from six months ago has long since been resolved one way or another.
    const isRecent = ageDays <= 14
    const isResolved = isRecent ? chance(rand, 0.5) : true
    const status: Incident["status"] = isResolved
      ? "resolved"
      : pickWeighted(rand, [
          ["investigating", 0.4],
          ["identified", 0.35],
          ["monitoring", 0.25],
        ])
    const resolutionDeadline = new Date(Math.min(daysAhead(2, startedAt).getTime(), REFERENCE_DATE.getTime()))
    const resolvedAt = isResolved ? dateBetween(rand, startedAt, resolutionDeadline) : undefined

    const affectedServices = chance(rand, 0.8) ? [pick(rand, SERVICES)] : shuffle(rand, SERVICES).slice(0, 2)

    return {
      id: rowId("inc", index + 1),
      title: pick(rand, TITLE_TEMPLATES)(affectedServices[0].name),
      severity: pickWeighted(rand, SEVERITY_MIX),
      status,
      serviceIds: affectedServices.map((service) => service.id),
      startedAt,
      resolvedAt,
      updates: buildUpdates(rand, startedAt, status, resolvedAt),
      commander: pick(rand, commanders),
    }
  })
}

/** The seeded incident history. The repository below owns the rows a demo mutates. */
export const INCIDENTS: Incident[] = generate()

export const incidents = createRepository(INCIDENTS, {
  searchKeys: ["title"],
  filterKeys: ["severity", "status"],
})
