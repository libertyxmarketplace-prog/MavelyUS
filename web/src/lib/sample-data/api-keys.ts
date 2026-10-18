import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, intBetween, pick, pickWeighted, rowId, seeded, shuffle } from "./core"
import { MEMBERS } from "./members"

/** A workspace API key, shown to the user only as its prefix once created. */
export type ApiKey = {
  id: string
  name: string
  prefix: string
  lastUsedAt?: Date
  createdAt: Date
  /** A Member id: whoever generated the key. */
  createdBy: string
  scopes: string[]
  status: "active" | "revoked"
}

const COUNT = 12

const NAME_POOL = [
  "Production Server", "CI Pipeline", "Local Development", "Workflow Automation",
  "Mobile App", "Analytics Export", "Staging Environment", "Backup Script",
  "Partner API - Blue Harbor", "Data Warehouse Sync", "Support Tooling", "Billing Reconciliation",
  "Monitoring Agent", "Internal Dashboard",
]

const SCOPE_POOL = [
  "read:customers", "write:customers", "read:invoices", "write:invoices",
  "read:analytics", "read:deployments", "write:deployments", "admin",
]

const STATUS_MIX: readonly (readonly [ApiKey["status"], number])[] = [
  ["active", 0.75],
  ["revoked", 0.25],
]

const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

/** A short opaque token — the only part of the real key ever shown again. */
function token(rand: () => number, length: number): string {
  return Array.from({ length }, () => TOKEN_CHARS[Math.floor(rand() * TOKEN_CHARS.length)]).join("")
}

function generate(): ApiKey[] {
  const rand = seeded("apiKeys")
  const names = shuffle(rand, NAME_POOL).slice(0, COUNT)
  const creators = MEMBERS.filter((member) => member.status === "active" && member.role !== "viewer").map(
    (member) => member.id
  )

  return names.map((name, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    const ageDays = intBetween(rand, 5, 500)
    const createdAt = dateBetween(rand, daysAgo(ageDays), daysAgo(ageDays - 1))
    const lastUsedAt =
      status === "revoked"
        ? chance(rand, 0.7)
          ? dateBetween(rand, createdAt, daysAgo(30))
          : undefined
        : chance(rand, 0.85)
          ? dateBetween(rand, createdAt, REFERENCE_DATE)
          : undefined

    return {
      id: rowId("key", index + 1),
      name,
      prefix: `sk_live_${token(rand, 6)}`,
      lastUsedAt,
      createdAt,
      createdBy: pick(rand, creators),
      scopes: shuffle(rand, SCOPE_POOL).slice(0, intBetween(rand, 1, 4)),
      status,
    }
  })
}

/** The seeded API keys. The repository below owns the rows a demo mutates. */
export const API_KEYS: ApiKey[] = generate()

export const apiKeys = createRepository(API_KEYS, {
  searchKeys: ["name", "prefix"],
  filterKeys: ["status"],
})
