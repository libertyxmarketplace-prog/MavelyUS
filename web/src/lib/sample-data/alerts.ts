import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, pick, pickWeighted, rowId, seeded } from "./core"

/** A monitoring rule and its current firing state. */
export type Alert = {
  id: string
  name: string
  condition: string
  /** Reuses the incident severity scale so the two read together on a dashboard. */
  severity: "sev1" | "sev2" | "sev3"
  status: "firing" | "resolved" | "silenced"
  firedAt?: Date
  /**
   * What the rule was doing when it was muted, so lifting a silence puts it
   * back rather than guessing — a resolved rule someone quietened must not
   * come back firing. Read it only while `status` is "silenced": resuming
   * leaves it behind as the record of the silence that was lifted.
   */
  silencedFrom?: "firing" | "resolved"
  /** When the silence runs out. Same rule: meaningful only while silenced. */
  silencedUntil?: Date
  channel: "chat" | "email" | "pager"
}

const COUNT = 30

const ALERT_DEFS: { name: string; condition: string; severity: Alert["severity"] }[] = [
  { name: "High CPU usage", condition: "CPU utilization > 90% for 5m", severity: "sev2" },
  { name: "Elevated error rate", condition: "5xx rate > 2% for 10m", severity: "sev1" },
  { name: "Slow API responses", condition: "p99 latency > 800ms for 5m", severity: "sev2" },
  { name: "Low disk space", condition: "disk usage > 85%", severity: "sev3" },
  { name: "Queue backlog growing", condition: "queue depth > 10,000 for 15m", severity: "sev2" },
  { name: "Memory pressure", condition: "memory utilization > 92% for 5m", severity: "sev2" },
  { name: "Database connections exhausted", condition: "connection pool usage > 95%", severity: "sev1" },
  { name: "Failed login spike", condition: "failed logins > 50 in 5m", severity: "sev3" },
  { name: "Certificate expiring soon", condition: "TLS certificate expires in < 14 days", severity: "sev3" },
  { name: "Deployment failure", condition: "deployment status = failed", severity: "sev2" },
  { name: "Webhook delivery failures", condition: "webhook failure rate > 5% for 10m", severity: "sev3" },
  { name: "Replication lag", condition: "database replica lag > 30s", severity: "sev2" },
]

const STATUS_MIX: readonly (readonly [Alert["status"], number])[] = [
  ["resolved", 0.55],
  ["silenced", 0.25],
  ["firing", 0.2],
]

const CHANNEL_MIX: readonly (readonly [Alert["channel"], number])[] = [
  ["chat", 0.55],
  ["pager", 0.28],
  ["email", 0.17],
]

// How recently a rule must have fired for it to still be the one going off,
// which is what a silence seeded into the store was muting.
const RECENT_FIRE_MS = 3 * 86_400_000

/** The longest a seeded silence can still have to run. */
const MAX_SILENCE_MS = 30 * 86_400_000

function firedAtFor(rand: () => number, status: Alert["status"]): Date | undefined {
  if (status === "firing") return dateBetween(rand, daysAgo(3), REFERENCE_DATE)
  if (status === "resolved") return chance(rand, 0.9) ? dateBetween(rand, daysAgo(90), daysAgo(1)) : undefined
  // Silenced: sometimes it fired before being muted, often it never has.
  return chance(rand, 0.3) ? dateBetween(rand, daysAgo(120), daysAgo(10)) : undefined
}

function generate(): Alert[] {
  const rand = seeded("alerts")
  return Array.from({ length: COUNT }, (_, index) => {
    const def = pick(rand, ALERT_DEFS)
    const status = pickWeighted(rand, STATUS_MIX)
    const firedAt = firedAtFor(rand, status)
    const silenced = status === "silenced"
    return {
      id: rowId("alr", index + 1),
      name: def.name,
      condition: def.condition,
      severity: def.severity,
      status,
      firedAt,
      // A silence in the store is one somebody started before the demo did, so
      // it carries the same two facts a silence started inside it does: what
      // the rule was doing, and how long the quiet lasts.
      silencedFrom: silenced
        ? firedAt && REFERENCE_DATE.getTime() - firedAt.getTime() <= RECENT_FIRE_MS
          ? ("firing" as const)
          : ("resolved" as const)
        : undefined,
      silencedUntil: silenced
        ? dateBetween(rand, REFERENCE_DATE, new Date(REFERENCE_DATE.getTime() + MAX_SILENCE_MS))
        : undefined,
      channel: pickWeighted(rand, CHANNEL_MIX),
    }
  })
}

/** The seeded alert rules. The repository below owns the rows a demo mutates. */
export const ALERTS: Alert[] = generate()

export const alerts = createRepository(ALERTS, {
  searchKeys: ["name", "condition"],
  filterKeys: ["severity", "status", "channel"],
})
