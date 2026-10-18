import { REFERENCE_DATE, createRepository, dateBetween, daysAgo, intBetween, pick, pickWeighted, rowId, seeded } from "./core"

/**
 * One call to a hosted LLM, logged for usage and cost tracking. The providers
 * are fictional — Sparrowmere Labs, Galewright AI and Ternstead AI, and
 * Northwind's own models run in-house — and so are their models: the kit
 * names no real AI company, and no demo reads as anyone's price list.
 */
export type AiRequest = {
  id: string
  at: Date
  model: string
  provider: "sparrowmere" | "galewright" | "ternstead" | "northwind"
  promptTokens: number
  completionTokens: number
  latencyMs: number
  /** Cost in minor units — cents, not dollars. 0 for a request that failed. */
  costCents: number
  status: 200 | 429 | 500
  traceId: string
}

const COUNT = 3000

// Each provider's line-up, a current generation beside the one before it.
// Northwind's in-house family is the one the assistant pages offer.
const MODELS_BY_PROVIDER: Record<AiRequest["provider"], string[]> = {
  sparrowmere: ["sparrowmere-3", "sparrowmere-3-mini", "sparrowmere-2.5", "sparrowmere-2.5-mini"],
  galewright: ["galewright-pro", "galewright-ultra", "galewright-lite"],
  ternstead: ["ternstead-2-pro", "ternstead-2-lite", "ternstead-1-pro"],
  northwind: ["nw-large-2", "nw-fast-2", "nw-2"],
}

const PROVIDER_MIX: readonly (readonly [AiRequest["provider"], number])[] = [
  ["sparrowmere", 0.4],
  ["galewright", 0.35],
  ["ternstead", 0.15],
  ["northwind", 0.1],
]

const STATUS_MIX: readonly (readonly [AiRequest["status"], number])[] = [
  [200, 0.92],
  [429, 0.05],
  [500, 0.03],
]

/**
 * Cents per 1,000 tokens — illustrative, not a real price list. Galewright is
 * the dearest, Ternstead the cheapest of the three hosted, and the in-house
 * models cost little more than the machines they run on.
 */
const RATE_PER_1K: Record<AiRequest["provider"], { prompt: number; completion: number }> = {
  sparrowmere: { prompt: 50, completion: 150 },
  galewright: { prompt: 60, completion: 180 },
  ternstead: { prompt: 30, completion: 100 },
  northwind: { prompt: 5, completion: 8 },
}

const HEX = "0123456789abcdef"
function hex(rand: () => number, length: number): string {
  return Array.from({ length }, () => HEX[Math.floor(rand() * HEX.length)]).join("")
}

function generate(): AiRequest[] {
  const rand = seeded("aiRequests")
  return Array.from({ length: COUNT }, (_, index) => {
    const provider = pickWeighted(rand, PROVIDER_MIX)
    const status = pickWeighted(rand, STATUS_MIX)
    const promptTokens = intBetween(rand, 50, 4_000)
    // A throttled or failed call rarely produces much, if any, completion.
    const completionTokens = status === 200 ? intBetween(rand, 10, 2_000) : intBetween(rand, 0, 20)
    const rate = RATE_PER_1K[provider]
    const cost = Math.round((promptTokens / 1000) * rate.prompt + (completionTokens / 1000) * rate.completion)

    return {
      id: rowId("aiq", index + 1),
      at: dateBetween(rand, daysAgo(30), REFERENCE_DATE),
      model: pick(rand, MODELS_BY_PROVIDER[provider]),
      provider,
      promptTokens,
      completionTokens,
      latencyMs: 150 + completionTokens * intBetween(rand, 2, 6) + intBetween(rand, 0, 400),
      // Nobody is billed for a request that failed or was rate-limited.
      costCents: status === 200 ? cost : 0,
      status,
      traceId: `trace_${hex(rand, 12)}`,
    }
  })
}

/** The seeded request log. The repository below owns the rows a demo mutates. */
export const AI_REQUESTS: AiRequest[] = generate()

export const aiRequests = createRepository(AI_REQUESTS, {
  searchKeys: ["model", "traceId"],
  filterKeys: ["provider", "status"],
})
