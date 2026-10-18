import {
  REFERENCE_DATE,
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
import { CUSTOMERS } from "./customers"
import { PRODUCTS } from "./products"

/** One line of an order: a product, a quantity, and the price charged for it. */
export type OrderItem = { productId: string; qty: number; unitCents: number }

/** A purchase placed by a customer, fulfilled from the product catalog. */
export type Order = {
  id: string
  number: string
  /** A Customer id — "" for a walk-in the till sold to without a name. */
  customerId: string
  status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled"
  items: OrderItem[]
  /**
   * What the customer paid, in minor units: the sum of every item's
   * `qty * unitCents`, less `discountCents` and plus `taxCents` where a sale
   * carries them — a web order carries neither, a till sale both.
   */
  totalCents: number
  /** Taken off the goods by a discount code at the till, in minor units. */
  discountCents?: number
  /** Sales tax charged at the till, in minor units. */
  taxCents?: number
  currency: "USD"
  placedAt: Date
  fulfilledAt?: Date
  /**
   * How it was paid. The web store takes card, bank transfer and a digital
   * wallet; the till in the shop takes card, cash and a gift voucher.
   */
  paymentMethod: "card" | "bank" | "wallet" | "cash" | "voucher"
  country: string
  /** Where it was placed: the web store, or the till in the shop. */
  channel: "online" | "pos"
}

const COUNT = 400

const STATUS_MIX: readonly (readonly [Order["status"], number])[] = [
  ["pending", 0.08],
  ["paid", 0.15],
  ["fulfilled", 0.65],
  ["refunded", 0.05],
  ["cancelled", 0.07],
]

const PAYMENT_MIX: readonly (readonly [Order["paymentMethod"], number])[] = [
  ["card", 0.7],
  ["wallet", 0.2],
  ["bank", 0.1],
]

function generate(): Order[] {
  const rand = seeded("orders")

  return Array.from({ length: COUNT }, (_, index) => {
    const customer = pick(rand, CUSTOMERS)
    const itemCount = intBetween(rand, 1, 4)
    // Distinct products per order — a real cart does not list the same SKU twice.
    // Up to 2 of a line, not 3: with real anchor prices (averaging ~$94, up
    // from a department-wide random draw), keeping the old 1–3 range put the
    // average order past $500 — a business-order quantity, not a shopper's.
    // Tuning the quantity (never the price) back into a believable $120–$400
    // AOV is what this range does; it draws exactly as many times as before,
    // so which products, statuses, and dates land where does not shift.
    const items: OrderItem[] = shuffle(rand, PRODUCTS)
      .slice(0, itemCount)
      .map((product) => ({ productId: product.id, qty: intBetween(rand, 1, 2), unitCents: product.priceCents }))
    const totalCents = items.reduce((sum, item) => sum + item.qty * item.unitCents, 0)

    const status = pickWeighted(rand, STATUS_MIX)
    const placedAt = dateBetween(rand, daysAgo(180), REFERENCE_DATE)
    // Fulfilled within a week of placing it, but never later than "now".
    const fulfillBy = daysAhead(7, placedAt)
    const fulfillCap = fulfillBy.getTime() < REFERENCE_DATE.getTime() ? fulfillBy : REFERENCE_DATE

    return {
      id: rowId("ord", index + 1),
      number: `ORD-${100_000 + index + 1}`,
      customerId: customer.id,
      status,
      items,
      totalCents,
      currency: "USD" as const,
      placedAt,
      ...(status === "fulfilled" || status === "refunded"
        ? { fulfilledAt: dateBetween(rand, placedAt, fulfillCap) }
        : {}),
      paymentMethod: pickWeighted(rand, PAYMENT_MIX),
      // An order ships to the customer who placed it.
      country: customer.country,
      // The seeded book is the web store's; a sale rung up at the till is
      // written at runtime, marked "pos".
      channel: "online" as const,
    }
  })
}

/** The seeded order history. The repository below owns the rows a demo mutates. */
export const ORDERS: Order[] = generate()

export const orders = createRepository(ORDERS, {
  searchKeys: ["number", "customerId"],
  filterKeys: ["status", "paymentMethod", "country", "channel"],
})
