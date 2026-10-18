import { createRepository, dateBetween, daysAgo, pickWeighted, rowId, seeded, shuffle } from "./core"

/** A service the workspace can connect — fictional, like every company in the kit. */
export type Integration = {
  id: string
  name: string
  provider: string
  category: string
  status: "connected" | "available" | "error"
  connectedAt?: Date
  description: string
}

const COUNT = 24

// The catalogue is fictional, like every company in the kit: services that
// read as real, one per line, each drawn with its category's icon wherever it
// is shown. It is the marketing sections' world too: a vendor they show
// (Duesbrook billing, Closemere CRM, Huddlemere team chat, Gatemere identity,
// Clickbrook events, Convoline live chat, Replyhouse help desk, Letterbrook
// campaigns, Silomere warehouse) is the same service here. Every name was
// checked before it shipped, by a web search and by fetching its own .com,
// .dev, .app, .ai, .co and .io; a coinage that turned out to be somebody's
// product is on the guard's denylist. The order is the seeded
// draw's, so keep it: a row's status and date come from its place in this list.
const INTEGRATION_DEFS: { name: string; provider: string; category: string; description: string }[] = [
  { name: "Huddlemere", provider: "huddlemere", category: "communication", description: "Send alerts and notifications to team channels." },
  { name: "Forkstead", provider: "forkstead", category: "developer-tools", description: "Sync repositories and trigger deployments on push." },
  { name: "Duesbrook", provider: "duesbrook", category: "payments", description: "Sync billing, invoices, and subscription data." },
  { name: "Visitmere", provider: "visitmere", category: "analytics", description: "Track usage and conversion events." },
  { name: "Hookmere", provider: "hookmere", category: "automation", description: "Connect to thousands of other apps without code." },
  { name: "Closemere", provider: "closemere", category: "crm", description: "Sync customer and deal data two ways." },
  { name: "Prospectmere", provider: "prospectmere", category: "crm", description: "Sync contacts, deals, and marketing activity." },
  { name: "Metricsmith", provider: "metricsmith", category: "observability", description: "Ship metrics, logs, and traces for monitoring." },
  { name: "Rotamere", provider: "rotamere", category: "observability", description: "Route alerts to on-call engineers." },
  { name: "Clickbrook", provider: "clickbrook", category: "analytics", description: "Collect and route event data to your tools." },
  { name: "Convoline", provider: "convoline", category: "support", description: "Sync conversations and customer context." },
  { name: "Replyhouse", provider: "replyhouse", category: "support", description: "Sync support tickets and customer history." },
  { name: "Pagemere", provider: "pagemere", category: "productivity", description: "Sync docs and databases with your workspace." },
  { name: "Trackmere", provider: "trackmere", category: "developer-tools", description: "Link issues and track engineering work." },
  { name: "Sprintmill", provider: "sprintmill", category: "developer-tools", description: "Sync issues and sprints with engineering." },
  { name: "Framemere", provider: "framemere", category: "design", description: "Embed and link design files in context." },
  { name: "Vaultbrook", provider: "vaultbrook", category: "storage", description: "Store and retrieve exported files and backups." },
  { name: "Sharestead", provider: "sharestead", category: "storage", description: "Export reports directly to shared drives." },
  { name: "Gatemere", provider: "gatemere", category: "security", description: "Single sign-on and provisioning for the workspace." },
  { name: "Signbrook", provider: "signbrook", category: "security", description: "Authenticate users with your own login flow." },
  { name: "Letterbrook", provider: "letterbrook", category: "marketing", description: "Sync audiences and campaign activity." },
  { name: "Pingstead", provider: "pingstead", category: "communication", description: "Send SMS and voice notifications." },
  { name: "Querystead", provider: "querystead", category: "analytics", description: "Explore product data in your BI tool." },
  { name: "Silomere", provider: "silomere", category: "data", description: "Warehouse raw events for custom analysis." },
]

const STATUS_MIX: readonly (readonly [Integration["status"], number])[] = [
  ["connected", 0.4],
  ["available", 0.5],
  ["error", 0.1],
]

function generate(): Integration[] {
  const rand = seeded("integrations")
  return shuffle(rand, INTEGRATION_DEFS)
    .slice(0, COUNT)
    .map((def, index) => {
      const status = pickWeighted(rand, STATUS_MIX)
      return {
        id: rowId("itg", index + 1),
        name: def.name,
        provider: def.provider,
        category: def.category,
        status,
        // "available" means never connected; the other two both imply it was.
        connectedAt: status === "available" ? undefined : dateBetween(rand, daysAgo(400), daysAgo(1)),
        description: def.description,
      }
    })
}

/** The seeded integration catalog. The repository below owns the rows a demo mutates. */
export const INTEGRATIONS: Integration[] = generate()

export const integrations = createRepository(INTEGRATIONS, {
  searchKeys: ["name", "provider", "description"],
  filterKeys: ["category", "status"],
})
