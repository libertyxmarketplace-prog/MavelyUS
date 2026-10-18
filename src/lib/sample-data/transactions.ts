import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { avatarFor } from "./avatars"
import { CUSTOMERS } from "./customers"
import { FX_RATES } from "./fx-rates"

/** A currency the store holds a balance in. */
export type Currency = "USD" | "EUR" | "GBP" | "JPY"

/**
 * One movement on a currency balance: money in, money out, or money moved
 * between balances. A move between balances is booked as two rows — out of
 * one, into the other, the same instant and status — so no money appears or
 * vanishes between the cards.
 */
export type Transaction = {
  id: string
  kind: "charge" | "payout" | "refund" | "transfer" | "fee"
  /** Who the money came from or went to: a customer, a bank account, a fee, another balance. */
  counterparty: string
  /** A face — people counterparties only: the customer behind a charge or a refund. */
  avatarUrl?: string
  /**
   * Signed, in the minor unit of `currency` — cents, pence, or whole yen,
   * since the yen has no minor unit. A charge is in (+); a payout, a refund
   * and a fee are out (−); a transfer's out leg is −, its in leg +, the two
   * worth the same at that day's close in `db.fxRates`.
   */
  amountCents: number
  currency: Currency
  /** A scheduled row is booked for a day ahead of now; every other row happened on or before it. */
  status: "completed" | "pending" | "scheduled" | "failed"
  /** When it happened — or, for a scheduled row, the day it is booked for, after REFERENCE_DATE. */
  at: Date
}

const COUNT = 120

const STATUS_MIX: readonly (readonly [Transaction["status"], number])[] = [
  ["completed", 0.78],
  ["pending", 0.08],
  ["scheduled", 0.08],
  ["failed", 0.06],
]

/**
 * The mix as whole rows — each share of COUNT floored, and the rows left over
 * handed to the largest remainders: 94 completed, 10 pending, 9 scheduled and
 * 7 failed. Exact rather than drawn, so a ledger of 120 rows holds the mix it
 * is written to hold instead of wandering off it by chance.
 */
function statusCounts(): (readonly [Transaction["status"], number])[] {
  const counts = STATUS_MIX.map(([status, share]) => ({ status, exact: share * COUNT, rows: Math.floor(share * COUNT) }))
  let left = COUNT - counts.reduce((sum, entry) => sum + entry.rows, 0)
  for (const entry of [...counts].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))) {
    if (left === 0) break
    entry.rows += 1
    left -= 1
  }
  return counts.map((entry) => [entry.status, entry.rows] as const)
}

/** What happens: customers pay and are refunded, the store is paid out, fees are taken, balances are topped up. */
const KIND_MIX: readonly (readonly [Transaction["kind"], number])[] = [
  ["charge", 0.52],
  ["payout", 0.14],
  ["refund", 0.1],
  ["fee", 0.14],
  ["transfer", 0.08],
]

/** What is booked ahead: nobody schedules a customer's charge, so only money going out or moving. */
const SCHEDULED_MIX: readonly (readonly [Transaction["kind"], number])[] = [
  ["payout", 0.6],
  ["transfer", 0.25],
  ["fee", 0.15],
]

/** The currency a customer is billed in, by the country they are in. */
const BILLING: Record<string, Currency> = {
  "United Kingdom": "GBP",
  Germany: "EUR",
  France: "EUR",
  Netherlands: "EUR",
  Spain: "EUR",
  Portugal: "EUR",
  Ireland: "EUR",
  Sweden: "EUR",
  Japan: "JPY",
}

/** Where the store's own money goes: payouts and fees, most of them in dollars. */
const HOUSE_MIX: readonly (readonly [Currency, number])[] = [
  ["USD", 0.5],
  ["EUR", 0.26],
  ["GBP", 0.16],
  ["JPY", 0.08],
]

/** The balances a transfer tops up from the dollar one, or sweeps back into it. */
const TRANSFER_MIX: readonly (readonly [Exclude<Currency, "USD">, number])[] = [
  ["EUR", 0.5],
  ["GBP", 0.32],
  ["JPY", 0.18],
]

/** The bank account each balance pays out to — fictional banks, the last four digits only. */
const PAYOUT_ACCOUNTS: Record<Currency, string> = {
  USD: "Harbor Trust ··4402",
  EUR: "Meridian Bank ··0917",
  GBP: "Keystone Savings ··2210",
  JPY: "Kestrel Trust ··5531",
}

const FEES = ["Card processing fees", "Payout fee", "Currency conversion fee"]

/** How many minor units a major unit holds: a hundred cents, or one yen. */
const MINOR: Record<Currency, number> = { USD: 100, EUR: 100, GBP: 100, JPY: 1 }

/** Roughly what a major unit is worth in dollars, so a yen amount lands at a yen scale. */
const SCALE: Record<Currency, number> = { USD: 1, EUR: 1, GBP: 1, JPY: 150 }

/** Major-unit ranges of what customers pay and are refunded, and of a fee, before the currency's scale. */
const RANGE: Record<"charge" | "refund" | "fee", readonly [number, number]> = {
  charge: [60, 2_400],
  refund: [30, 900],
  fee: [5, 180],
}

/** A transfer's size in the smaller balance's own major units, so a yen top-up is sized for a yen balance. */
const TRANSFER_RANGE: Record<Exclude<Currency, "USD">, readonly [number, number]> = {
  EUR: [400, 3_500],
  GBP: [300, 2_800],
  JPY: [50_000, 450_000],
}

/** The least a payout sweeps, in major units: less is not worth the bank's fee. */
const MIN_PAYOUT: Record<Currency, number> = { USD: 250, EUR: 250, GBP: 200, JPY: 30_000 }

/** A range in the currency's own major units, drawn in its minor unit: with cents where it has them, whole yen where not. */
function minorBetween(rand: () => number, [low, high]: readonly [number, number], currency: Currency): number {
  if (MINOR[currency] === 1) return intBetween(rand, low, high)
  return intBetween(rand, low, high) * MINOR[currency] + intBetween(rand, 0, 99)
}

/** A dollar-sized range drawn in `currency`: a yen amount lands at a yen scale, anywhere in it — not on a ¥150 grid. */
function drawn(rand: () => number, [low, high]: readonly [number, number], currency: Currency): number {
  return minorBetween(rand, [low * SCALE[currency], high * SCALE[currency]], currency)
}

/** Dollars per unit of `currency` on the UTC day of `at`: that day's close, or the latest for a day still ahead. */
function dollarsPer(currency: Currency, at: Date): number {
  if (currency === "USD") return 1
  const series = FX_RATES[currency === "JPY" ? "USD/JPY" : currency === "EUR" ? "EUR/USD" : "GBP/USD"]
  const day = at.toISOString().slice(0, 10)
  const close = (series.find((point) => point.date === day) ?? series[series.length - 1]).rate
  return currency === "JPY" ? 1 / close : close
}

/**
 * When a row falls: a scheduled one is booked one to thirty days ahead; a
 * pending one is a few days old at most, because a charge settles within the
 * week; the rest fall across the last 120 days.
 */
function dateFor(rand: () => number, status: Transaction["status"]): Date {
  if (status === "scheduled") return dateBetween(rand, daysAhead(1), daysAhead(30))
  if (status === "pending") return dateBetween(rand, daysAgo(5), REFERENCE_DATE)
  return dateBetween(rand, daysAgo(120), REFERENCE_DATE)
}

type Row = Omit<Transaction, "id">
/** A payout's share of what its balance took in, sized once every row before it is known. */
type Sweep = { row: Row; share: number }

/**
 * The ledger as events — a transfer is one event and two rows — drawn per
 * status until that status has its rows, then shuffled into the order the
 * ids follow. Every amount is drawn here except a payout's: a payout sweeps
 * a share of what its balance took in since the one before, so it is sized
 * afterwards, in date order.
 */
function generate(): Transaction[] {
  const rand = seeded("transactions")
  const plan: { status: Transaction["status"]; kind: Transaction["kind"] }[] = []
  for (const [status, rows] of statusCounts()) {
    const mix = status === "scheduled" ? SCHEDULED_MIX : KIND_MIX
    for (let left = rows; left > 0; ) {
      let kind = pickWeighted(rand, mix)
      // Two rows to a transfer, so one is drawn only while two remain.
      if (kind === "transfer" && left < 2) kind = pickWeighted(rand, mix.filter(([entry]) => entry !== "transfer"))
      plan.push({ status, kind })
      left -= kind === "transfer" ? 2 : 1
    }
  }

  const sweeps: Sweep[] = []
  const events = shuffle(rand, plan).map(({ status, kind }): Row[] => {
    const at = dateFor(rand, status)
    if (kind === "charge" || kind === "refund") {
      const customer = pick(rand, CUSTOMERS)
      const currency = BILLING[customer.country] ?? "USD"
      const size = drawn(rand, RANGE[kind], currency)
      const amountCents = kind === "charge" ? size : -size
      return [{ kind, counterparty: customer.name, avatarUrl: avatarFor(customer.name), amountCents, currency, status, at }]
    }
    if (kind === "fee") {
      const currency = pickWeighted(rand, HOUSE_MIX)
      return [{ kind, counterparty: pick(rand, FEES), amountCents: -drawn(rand, RANGE.fee, currency), currency, status, at }]
    }
    if (kind === "payout") {
      const currency = pickWeighted(rand, HOUSE_MIX)
      const row: Row = { kind, counterparty: PAYOUT_ACCOUNTS[currency], amountCents: 0, currency, status, at }
      sweeps.push({ row, share: 0.6 + rand() * 0.35 })
      return [row]
    }
    // A transfer tops a balance up from the dollar one or sends money back to
    // it, sized in the smaller balance's units; the dollar leg is its worth
    // at that day's close.
    const other = pickWeighted(rand, TRANSFER_MIX)
    const otherMinor = minorBetween(rand, TRANSFER_RANGE[other], other)
    const dollarMinor = Math.round((otherMinor / MINOR[other]) * dollarsPer(other, at) * 100)
    const legs = { USD: dollarMinor, [other]: otherMinor } as Record<Currency, number>
    const [from, to]: Currency[] = chance(rand, 0.5) ? ["USD", other] : [other, "USD"]
    return [
      { kind, counterparty: `${to} balance`, amountCents: -legs[from], currency: from, status, at },
      { kind, counterparty: `${from} balance`, amountCents: legs[to], currency: to, status, at },
    ]
  })

  // What each balance has taken in from customers and not yet swept, walked
  // in date order: a payout that went — or is going, or is booked — takes its
  // share of it; one that failed takes nothing, and the money waits for the next.
  const unswept: Record<Currency, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0 }
  const sized = new Set(sweeps.map((sweep) => sweep.row))
  const share = new Map(sweeps.map((sweep) => [sweep.row, sweep.share]))
  for (const row of events.flat().sort((a, b) => a.at.getTime() - b.at.getTime())) {
    if (sized.has(row)) {
      const amount = Math.max(MIN_PAYOUT[row.currency] * MINOR[row.currency], Math.round(share.get(row)! * unswept[row.currency]))
      row.amountCents = -amount
      if (row.status !== "failed") unswept[row.currency] = Math.max(0, unswept[row.currency] - amount)
    } else if ((row.kind === "charge" || row.kind === "refund") && row.status === "completed") {
      unswept[row.currency] += row.amountCents
    }
  }

  return events.flat().map((row, index) => ({ id: rowId("txn", index + 1), ...row }))
}

/** The seeded ledger. The repository below owns the rows a demo reads. */
export const TRANSACTIONS: Transaction[] = generate()

export const transactions = createRepository(TRANSACTIONS, {
  searchKeys: ["counterparty"],
  filterKeys: ["kind", "currency", "status"],
})
