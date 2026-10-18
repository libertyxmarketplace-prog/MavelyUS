import { REFERENCE_DATE, seeded } from "./core"

/** The currency pairs the store quotes, each written base/quote: EUR/USD is dollars per euro. */
export type FxPair = "EUR/USD" | "GBP/USD" | "USD/JPY" | "USD/CHF" | "EUR/GBP"

/** One day's closing rate. `date` is the UTC day, "2026-09-04". */
export type FxPoint = { date: string; rate: number }

/** The pairs in the order a picker lists them. */
export const FX_PAIRS: FxPair[] = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "EUR/GBP"]

/** A year of days, ending on REFERENCE_DATE's. */
const DAYS = 365

/** How far a rate moves in a day: a standard deviation of 0.4%, about what a major pair does. */
const DAILY_SIGMA = 0.004

/**
 * How closely the euro and the pound move against the dollar, day to day.
 * News that moves one moves the other, so EUR/USD and GBP/USD share most of a
 * day's shock — and the pound-per-euro between them moves less than either:
 * at 0.6, EUR/GBP's daily move is about 0.36%, as the real cross's is.
 */
const EUR_GBP_CORRELATION = 0.6

/** Where each dollar pair stood a year before REFERENCE_DATE — realistic levels, not quotes. */
const BASE: Record<Exclude<FxPair, "EUR/GBP">, number> = {
  "EUR/USD": 1.082,
  "GBP/USD": 1.265,
  "USD/JPY": 148.2,
  "USD/CHF": 0.881,
}

/** Four decimal places, two for a yen pair, which is how the pairs are quoted. */
const places = (pair: FxPair) => (pair.includes("JPY") ? 2 : 4)
const round = (value: number, digits: number) => Number(value.toFixed(digits))

/** A standard normal draw from two uniform ones (Box–Muller), on the module's own generator. */
function normal(rand: () => number): number {
  const u = Math.max(rand(), Number.EPSILON)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * A year of daily rates for each pair. The four dollar pairs are seeded random
 * walks — each day's rate is the day before's times e^(0.4% × a normal draw),
 * so a rate can never cross zero — with the pound's draw sharing the euro's
 * (EUR_GBP_CORRELATION); EUR/GBP is their cross, EUR/USD over GBP/USD, so the
 * pound-per-euro the chart shows is the one a conversion through dollars
 * arrives at.
 */
function generate(): Record<FxPair, FxPoint[]> {
  const rand = seeded("fx-rates")
  const last = Date.UTC(REFERENCE_DATE.getUTCFullYear(), REFERENCE_DATE.getUTCMonth(), REFERENCE_DATE.getUTCDate())
  const dates = Array.from({ length: DAYS }, (_, index) =>
    new Date(last - (DAYS - 1 - index) * 86_400_000).toISOString().slice(0, 10)
  )

  // Each pair's own daily draws — none on the first day, which is its base.
  const pairs = Object.keys(BASE) as (keyof typeof BASE)[]
  const shocks = {} as Record<keyof typeof BASE, number[]>
  for (const pair of pairs) shocks[pair] = dates.map((_, index) => (index === 0 ? 0 : normal(rand)))
  const own = Math.sqrt(1 - EUR_GBP_CORRELATION ** 2)
  shocks["GBP/USD"] = shocks["GBP/USD"].map(
    (draw, index) => EUR_GBP_CORRELATION * shocks["EUR/USD"][index] + own * draw
  )

  // Unrounded walks, so rounding a day never feeds into the next one.
  const walks = {} as Record<keyof typeof BASE, number[]>
  for (const pair of pairs) {
    let rate = BASE[pair]
    walks[pair] = shocks[pair].map((shock) => (rate *= Math.exp(DAILY_SIGMA * shock)))
  }

  const series = (pair: FxPair, values: number[]): FxPoint[] =>
    dates.map((date, index) => ({ date, rate: round(values[index], places(pair)) }))

  return {
    "EUR/USD": series("EUR/USD", walks["EUR/USD"]),
    "GBP/USD": series("GBP/USD", walks["GBP/USD"]),
    "USD/JPY": series("USD/JPY", walks["USD/JPY"]),
    "USD/CHF": series("USD/CHF", walks["USD/CHF"]),
    "EUR/GBP": series(
      "EUR/GBP",
      walks["EUR/USD"].map((eur, index) => eur / walks["GBP/USD"][index])
    ),
  }
}

/**
 * A year of daily rates per pair. Not a repository: a rate series is read
 * whole, by pair, for a chart or a conversion, and never written — so `db`
 * holds it as the record it is.
 */
export const FX_RATES: Record<FxPair, FxPoint[]> = generate()

export const fxRates = FX_RATES
