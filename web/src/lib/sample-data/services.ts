import { chance, createRepository, intBetween, pick, pickWeighted, rowId, seeded } from "./core"

/** A status-page entry: one piece of the product with its own uptime history. */
export type Service = {
  id: string
  name: string
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance"
  /** 90 daily uptime percentages, oldest first, ending on REFERENCE_DATE. */
  uptime90d: number[]
  region: string
}

const COUNT = 8

const SERVICE_NAMES = [
  "API",
  "Web Dashboard",
  "Authentication",
  "Billing",
  "Webhooks",
  "Notifications",
  "File Storage",
  "Search",
]

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]

const STATUS_MIX: readonly (readonly [Service["status"], number])[] = [
  ["operational", 0.72],
  ["degraded", 0.12],
  ["partial_outage", 0.06],
  ["major_outage", 0.02],
  ["maintenance", 0.08],
]

/** A non-operational status dips the most recent day or two; most days sit near 100. */
function uptimeSeries(rand: () => number, status: Service["status"]): number[] {
  return Array.from({ length: 90 }, (_, day) => {
    const daysFromToday = 89 - day
    const inIncidentWindow = status !== "operational" && status !== "maintenance" && daysFromToday <= 1
    const dip = inIncidentWindow ? intBetween(rand, 8, 45) : chance(rand, 0.06) ? intBetween(rand, 1, 6) : 0
    const jitter = rand() * 0.4
    return Math.max(0, Math.min(100, Math.round((100 - dip - jitter) * 100) / 100))
  })
}

function generate(): Service[] {
  const rand = seeded("services")
  return SERVICE_NAMES.slice(0, COUNT).map((name, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    return {
      id: rowId("svc", index + 1),
      name,
      status,
      uptime90d: uptimeSeries(rand, status),
      region: pick(rand, REGIONS),
    }
  })
}

/** The seeded status-page services. The repository below owns the rows a demo mutates. */
export const SERVICES: Service[] = generate()

export const services = createRepository(SERVICES, {
  searchKeys: ["name", "region"],
  filterKeys: ["status", "region"],
})
