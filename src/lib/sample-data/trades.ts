import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { HOLDINGS } from "./holdings"

/** One movement of an asset: bought or sold for cash, or sent to or received from another wallet. */
export type Trade = {
  id: string
  /** The ticker, one a holding carries. */
  symbol: string
  kind: "buy" | "sell" | "send" | "receive"
  amount: number
  /** The asset's price when the trade was made, in cents. */
  priceCents: number
  at: Date
  status: "settled" | "pending"
}

const COUNT = 80

// Seven months of activity, for a chart by month; the last few trades land
// in the past two days, so the ledger always opens on something unsettled.
const WINDOW_DAYS = 210
const RECENT = 5

const KIND_MIX: readonly (readonly [Trade["kind"], number])[] = [
  ["buy", 0.38],
  ["sell", 0.24],
  ["send", 0.2],
  ["receive", 0.18],
]

function generate(): Trade[] {
  const rand = seeded("trades")
  // One quote per symbol; a holding in a second wallet carries the same price.
  const quotes = new Map<string, { priceCents: number; amount: number; precision: number }>()
  for (const holding of HOLDINGS) {
    if (quotes.has(holding.symbol)) continue
    const decimals = String(holding.amount).split(".")[1]?.length ?? 0
    quotes.set(holding.symbol, { priceCents: holding.priceCents, amount: holding.amount, precision: decimals })
  }
  const symbols = [...quotes.keys()]

  const rows = Array.from({ length: COUNT }, (_, index) => {
    const symbol = pick(rand, symbols)
    const quote = quotes.get(symbol)!
    const recent = index >= COUNT - RECENT
    const at = recent
      ? dateBetween(rand, daysAgo(2), REFERENCE_DATE)
      : dateBetween(rand, daysAgo(WINDOW_DAYS), daysAgo(2))
    // The further back a trade sits, the further its price could have been
    // from today's; a stablecoin never moves.
    const age = (REFERENCE_DATE.getTime() - at.getTime()) / (WINDOW_DAYS * 86_400_000)
    const drift = symbol === "USDT" ? 0 : (rand() * 2 - 1) * 0.3 * age
    const scale = 10 ** Math.max(quote.precision, 2)
    const amount = Math.round(quote.amount * (0.02 + rand() * 0.38) * scale) / scale

    return {
      symbol,
      kind: pickWeighted(rand, KIND_MIX),
      amount: Math.max(amount, 1 / scale),
      priceCents: Math.max(1, Math.round(quote.priceCents * (1 + drift))),
      at,
      // Only the newest trades can still be unsettled.
      status: recent && chance(rand, 0.5) ? ("pending" as const) : ("settled" as const),
    }
  }).sort((a, b) => a.at.getTime() - b.at.getTime())

  // Whatever the draw, the very last trade is still clearing.
  rows[rows.length - 1].status = "pending"

  return rows.map((row, index) => ({ ...row, id: rowId("trd", index + 1) }))
}

/** The seeded ledger, oldest first. The repository below owns the rows a new order joins. */
export const TRADES: Trade[] = generate()

export const trades = createRepository(TRADES, {
  searchKeys: ["symbol"],
  filterKeys: ["kind", "symbol", "status"],
})
