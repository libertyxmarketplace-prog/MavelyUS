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
} from "./core"
import { CUSTOMERS } from "./customers"

/** One charge on an invoice. */
export type InvoiceLineItem = { description: string; amountCents: number }

/** A billing document sent to a customer for their subscription. */
export type Invoice = {
  id: string
  number: string
  customerId: string
  status: "draft" | "open" | "paid" | "overdue" | "void"
  /** The sum of `lineItems`, in minor units. */
  amountCents: number
  issuedAt: Date
  /** Net terms put this after `issuedAt` — often still ahead of REFERENCE_DATE, by nature. */
  dueAt: Date
  paidAt?: Date
  lineItems: InvoiceLineItem[]
}

const COUNT = 300

// Status is derived from whether the due date has already passed (below),
// rather than rolled independently, so "overdue" only ever describes a real
// invoice whose due date is behind it.
const PAST_DUE_STATUS_MIX: readonly (readonly [Invoice["status"], number])[] = [
  ["paid", 0.72],
  ["overdue", 0.18],
  ["void", 0.1],
]

const UPCOMING_STATUS_MIX: readonly (readonly [Invoice["status"], number])[] = [
  ["open", 0.55],
  ["paid", 0.3],
  ["draft", 0.15],
]

/** "team" -> "Team". */
function capitalize(word: string): string {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word
}

function generate(): Invoice[] {
  const rand = seeded("invoices")
  // A free, trial, or churned account is never billed, so it is never invoiced.
  const eligible = CUSTOMERS.filter((row) => row.mrrCents > 0)

  return Array.from({ length: COUNT }, (_, index) => {
    const customer = pick(rand, eligible)
    const seatWord = customer.seats === 1 ? "seat" : "seats"
    const lineItems: InvoiceLineItem[] = [
      { description: `${capitalize(customer.plan)} plan (${customer.seats} ${seatWord})`, amountCents: customer.mrrCents },
    ]
    if (chance(rand, 0.22)) lineItems.push({ description: "Additional usage", amountCents: intBetween(rand, 500, 8_000) })
    const amountCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0)

    const issuedAt = dateBetween(rand, daysAgo(365), REFERENCE_DATE)
    const dueAt = daysAhead(intBetween(rand, 14, 30), issuedAt)
    const isPastDue = dueAt.getTime() < REFERENCE_DATE.getTime()
    const status = pickWeighted(rand, isPastDue ? PAST_DUE_STATUS_MIX : UPCOMING_STATUS_MIX)
    const paidAt = status === "paid" ? dateBetween(rand, issuedAt, isPastDue ? dueAt : REFERENCE_DATE) : undefined

    return {
      id: rowId("inv", index + 1),
      number: `INV-${100_000 + index + 1}`,
      customerId: customer.id,
      status,
      amountCents,
      issuedAt,
      dueAt,
      ...(paidAt ? { paidAt } : {}),
      lineItems,
    }
  })
}

/** The seeded billing history. The repository below owns the rows a demo mutates. */
export const INVOICES: Invoice[] = generate()

export const invoices = createRepository(INVOICES, {
  searchKeys: ["number", "customerId"],
  filterKeys: ["status", "customerId"],
})
