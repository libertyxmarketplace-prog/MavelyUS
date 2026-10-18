import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, intBetween, pick, pickWeighted, rowId, seeded } from "./core"
import { MEMBERS } from "./members"

/** One build pushed through the pipeline. */
export type Deployment = {
  id: string
  sha: string
  branch: string
  environment: "production" | "staging" | "preview"
  status: "success" | "failed" | "running" | "cancelled"
  startedAt: Date
  durationSec: number
  /** A display name, not a Member id — some deploys are triggered by bots. */
  author: string
}

const COUNT = 200

const FEATURE_BRANCHES = [
  "feat/checkout-redesign", "fix/webhook-retry", "chore/upgrade-deps", "feat/api-rate-limits",
  "fix/date-timezone-bug", "feat/sso-login", "chore/ci-cache", "fix/memory-leak-worker",
  "feat/notification-center", "fix/pagination-off-by-one", "chore/rotate-secrets", "feat/audit-log-export",
]

// The machines that ship too, named for their job rather than a vendor's bot.
const BOT_AUTHORS = ["ci-bot", "deps-bot", "release-bot"]

const ENVIRONMENT_MIX: readonly (readonly [Deployment["environment"], number])[] = [
  ["production", 0.32],
  ["staging", 0.36],
  ["preview", 0.32],
]

const STATUS_MIX: readonly (readonly [Exclude<Deployment["status"], "running">, number])[] = [
  ["success", 0.84],
  ["failed", 0.1],
  ["cancelled", 0.06],
]

const SHA_CHARS = "0123456789abcdef"

function shortSha(rand: () => number): string {
  return Array.from({ length: 7 }, () => SHA_CHARS[Math.floor(rand() * SHA_CHARS.length)]).join("")
}

function generate(): Deployment[] {
  const rand = seeded("deployments")
  return Array.from({ length: COUNT }, (_, index) => {
    // A deployment can only still be "running" if it started moments ago —
    // one stuck mid-flight for months would read as a bug in the data.
    const isRunning = chance(rand, 0.015)
    const status: Deployment["status"] = isRunning ? "running" : pickWeighted(rand, STATUS_MIX)
    const startedAt = isRunning
      ? dateBetween(rand, daysAgo(20 / 1440), REFERENCE_DATE)
      : dateBetween(rand, daysAgo(180), daysAgo(1 / 48))
    const durationSec =
      status === "running"
        ? intBetween(rand, 5, 240)
        : status === "failed"
          ? intBetween(rand, 10, 180)
          : status === "cancelled"
            ? intBetween(rand, 5, 60)
            : intBetween(rand, 30, 600)

    return {
      id: rowId("dpl", index + 1),
      sha: shortSha(rand),
      branch: chance(rand, 0.5) ? "main" : pick(rand, FEATURE_BRANCHES),
      environment: pickWeighted(rand, ENVIRONMENT_MIX),
      status,
      startedAt,
      durationSec,
      // Free-text author: mostly a teammate's name, occasionally a bot.
      author: chance(rand, 0.85) ? pick(rand, MEMBERS).name : pick(rand, BOT_AUTHORS),
    }
  })
}

/** The seeded deployment history. The repository below owns the rows a demo mutates. */
export const DEPLOYMENTS: Deployment[] = generate()

export const deployments = createRepository(DEPLOYMENTS, {
  searchKeys: ["sha", "branch", "author"],
  filterKeys: ["environment", "status"],
})
