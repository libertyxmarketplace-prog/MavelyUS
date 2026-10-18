import { REFERENCE_DATE, createRepository, dateBetween, daysAgo, intBetween, pick, pickWeighted, rowId, seeded, shuffle } from "./core"
import { MEMBERS } from "./members"

/** One line in the workspace's audit trail. */
export type AuditEvent = {
  id: string
  at: Date
  /** A Member id: whoever performed the action. */
  actor: string
  action: string
  resource: string
  resourceId: string
  ip: string
  diff?: { field: string; from: string; to: string }[]
}

const COUNT = 500

const RESOURCES = [
  "customer", "member", "invitation", "role", "api_key",
  "integration", "billing", "service", "deployment", "alert",
]

// A plausible-looking id for the log line — not asserted to resolve to a real
// row the way `actor` is; an audit trail routinely outlives the records it
// describes.
const RESOURCE_PREFIX: Record<string, string> = {
  customer: "cus",
  member: "mbr",
  invitation: "ivt",
  role: "rol",
  api_key: "key",
  integration: "itg",
  billing: "bil",
  service: "svc",
  deployment: "dpl",
  alert: "alr",
}

const ACTION_MIX: readonly (readonly [string, number])[] = [
  ["updated", 0.35],
  ["created", 0.25],
  ["deleted", 0.08],
  ["invited", 0.08],
  ["revoked", 0.06],
  ["enabled", 0.06],
  ["disabled", 0.06],
  ["exported", 0.06],
]

/** A field this kind of change might touch, and a few plausible values. */
const DIFF_FIELDS: { field: string; values: string[] }[] = [
  { field: "status", values: ["active", "suspended", "churned", "trial"] },
  { field: "role", values: ["member", "admin", "viewer", "owner"] },
  { field: "plan", values: ["free", "starter", "team", "enterprise"] },
  { field: "seats", values: ["5", "10", "25", "50"] },
  { field: "name", values: ["Untitled", "Renamed workspace", "Northwind", "Northwind Studio"] },
]

function buildDiff(rand: () => number): NonNullable<AuditEvent["diff"]> {
  const fields = shuffle(rand, DIFF_FIELDS).slice(0, intBetween(rand, 1, 2))
  return fields.map(({ field, values }) => {
    const [from, to] = shuffle(rand, values).slice(0, 2)
    return { field, from, to }
  })
}

function generate(): AuditEvent[] {
  const rand = seeded("auditEvents")
  const actors = MEMBERS.filter((member) => member.status === "active").map((member) => member.id)

  return Array.from({ length: COUNT }, (_, index) => {
    const resource = pick(rand, RESOURCES)
    const action = pickWeighted(rand, ACTION_MIX)

    return {
      id: rowId("aud", index + 1),
      at: dateBetween(rand, daysAgo(365), REFERENCE_DATE),
      actor: pick(rand, actors),
      action,
      resource,
      resourceId: rowId(RESOURCE_PREFIX[resource], intBetween(rand, 1, 200)),
      ip: `${intBetween(rand, 1, 255)}.${intBetween(rand, 0, 255)}.${intBetween(rand, 0, 255)}.${intBetween(rand, 1, 254)}`,
      diff: action === "updated" ? buildDiff(rand) : undefined,
    }
  })
}

/** The seeded audit trail. The repository below owns the rows a demo mutates. */
export const AUDIT_EVENTS: AuditEvent[] = generate()

export const auditEvents = createRepository(AUDIT_EVENTS, {
  searchKeys: ["action", "resource", "resourceId"],
  filterKeys: ["resource", "actor"],
})
