import { createRepository, intBetween, rowId, seeded } from "./core"

/** One asset in one wallet: how much is held and what it is worth right now. */
export type Holding = {
  id: string
  asset: "Bitcoin" | "Ethereum" | "Solana" | "Avalanche" | "Tether" | "Toncoin"
  /** The ticker a trade names: BTC, ETH, SOL, AVAX, USDT, TON. */
  symbol: string
  amount: number
  /** The asset's price now, in cents; the same in every wallet that holds it. */
  priceCents: number
  /** The last day's move as a ratio: 0.031 is up 3.1%. */
  change24h: number
  wallet: "Main" | "Savings" | "Trading"
}

/**
 * What each asset is called, what it trades as, where its price sits and how
 * much of it a wallet tends to hold. The bands are the plausible ranges, and
 * the generator picks a point in each; the stablecoin is pinned at a dollar
 * and never moves.
 */
const ASSETS: readonly {
  asset: Holding["asset"]
  symbol: string
  priceCents: [number, number]
  amount: [number, number]
  /** Decimal places the amount is kept to. */
  precision: number
}[] = [
  { asset: "Bitcoin", symbol: "BTC", priceCents: [6_150_000, 6_850_000], amount: [0.2, 2.5], precision: 4 },
  { asset: "Ethereum", symbol: "ETH", priceCents: [240_000, 320_000], amount: [1, 20], precision: 3 },
  { asset: "Solana", symbol: "SOL", priceCents: [14_000, 19_000], amount: [20, 300], precision: 2 },
  { asset: "Avalanche", symbol: "AVAX", priceCents: [2_400, 3_600], amount: [50, 800], precision: 2 },
  { asset: "Tether", symbol: "USDT", priceCents: [100, 100], amount: [1_000, 25_000], precision: 2 },
  { asset: "Toncoin", symbol: "TON", priceCents: [500, 700], amount: [500, 5_000], precision: 1 },
]

// Twelve of the eighteen pairings: the main wallet holds a spread, savings
// keeps the two majors and the stablecoin, and the trading wallet turns over
// the four most traded.
const WALLETS: readonly (readonly [Holding["wallet"], readonly string[]])[] = [
  ["Main", ["BTC", "ETH", "SOL", "USDT", "TON"]],
  ["Savings", ["BTC", "ETH", "USDT"]],
  ["Trading", ["BTC", "ETH", "SOL", "AVAX"]],
]

function generate(): Holding[] {
  const rand = seeded("holdings")

  // One price and one day's move per asset, drawn first so every wallet that
  // holds the asset reads the same number.
  const quotes = new Map(
    ASSETS.map((entry) => [
      entry.symbol,
      {
        priceCents: intBetween(rand, entry.priceCents[0], entry.priceCents[1]),
        change24h: entry.symbol === "USDT" ? 0 : intBetween(rand, -60, 80) / 1000,
      },
    ])
  )

  const rows: Holding[] = []
  for (const [wallet, symbols] of WALLETS) {
    for (const symbol of symbols) {
      const entry = ASSETS.find((candidate) => candidate.symbol === symbol)!
      const quote = quotes.get(symbol)!
      const scale = 10 ** entry.precision
      const amount = Math.round((entry.amount[0] + rand() * (entry.amount[1] - entry.amount[0])) * scale) / scale
      rows.push({
        id: rowId("hld", rows.length + 1),
        asset: entry.asset,
        symbol,
        amount,
        priceCents: quote.priceCents,
        change24h: quote.change24h,
        wallet,
      })
    }
  }
  return rows
}

/** The seeded book of holdings. The repository below owns the rows a trade moves. */
export const HOLDINGS: Holding[] = generate()

export const holdings = createRepository(HOLDINGS, {
  searchKeys: ["asset", "symbol"],
  filterKeys: ["wallet", "symbol"],
})
