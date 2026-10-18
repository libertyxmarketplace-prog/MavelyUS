import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, intBetween, pick, pickWeighted, rowId, seeded } from "./core"

/** One line of application log output. */
export type LogEntry = {
  id: string
  at: Date
  level: "debug" | "info" | "warn" | "error"
  service: string
  message: string
  requestId?: string
  durationMs?: number
}

const COUNT = 2000

// Internal service names for the log stream. Deliberately not imported from
// services.ts: a log line's `service` is an implementation detail (which
// worker emitted it), not the public-status entity a status page shows.
const SERVICE_NAMES = [
  "api-gateway",
  "auth-service",
  "billing-worker",
  "notifications-queue",
  "search-indexer",
  "webhook-dispatcher",
  "file-storage",
  "scheduler",
]

const LEVEL_MIX: readonly (readonly [LogEntry["level"], number])[] = [
  ["debug", 0.15],
  ["info", 0.7],
  ["warn", 0.1],
  ["error", 0.05],
]

const MESSAGES: Record<LogEntry["level"], string[]> = {
  debug: [
    "cache miss, fetching from origin",
    "computed response payload",
    "acquired connection from pool",
    "skipping optional middleware",
  ],
  info: [
    "request completed",
    "job finished successfully",
    "user session refreshed",
    "scheduled task started",
    "webhook delivered",
    "cache warmed",
  ],
  warn: [
    "retrying request after timeout",
    "rate limit approaching for client",
    "slow query detected",
    "connection pool nearing capacity",
  ],
  error: [
    "unhandled exception in request handler",
    "database connection failed",
    "upstream request failed with 502",
    "failed to acquire lock",
    "message processing failed after retries",
  ],
}

function generate(): LogEntry[] {
  const rand = seeded("logEntries")
  return Array.from({ length: COUNT }, (_, index) => {
    const level = pickWeighted(rand, LEVEL_MIX)
    // A debug line is rarely worth a request id; everything louder usually gets one.
    const hasRequest = level !== "debug" && chance(rand, 0.85)
    return {
      id: rowId("log", index + 1),
      at: dateBetween(rand, daysAgo(14), REFERENCE_DATE),
      level,
      service: pick(rand, SERVICE_NAMES),
      message: pick(rand, MESSAGES[level]),
      requestId: hasRequest ? `req_${intBetween(rand, 100_000, 999_999)}` : undefined,
      durationMs: hasRequest ? intBetween(rand, 4, level === "error" ? 6_000 : 1_400) : undefined,
    }
  })
}

/** The seeded log stream. The repository below owns the rows a demo mutates. */
export const LOG_ENTRIES: LogEntry[] = generate()

export const logEntries = createRepository(LOG_ENTRIES, {
  searchKeys: ["message", "service"],
  filterKeys: ["level", "service"],
})
