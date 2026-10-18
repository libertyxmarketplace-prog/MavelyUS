import { REFERENCE_DATE, createRepository, intBetween, pick, pickWeighted, rowId, seeded } from "./core"
import { CUSTOMERS } from "./customers"

/** A card on file for a paying customer. */
export type PaymentMethod = {
  id: string
  customerId: string
  brand: "visa" | "mastercard" | "amex"
  last4: string
  expMonth: number
  expYear: number
  default: boolean
}

const COUNT = 120

const BRAND_MIX: readonly (readonly [PaymentMethod["brand"], number])[] = [
  ["visa", 0.55],
  ["mastercard", 0.35],
  ["amex", 0.1],
]

function generate(): PaymentMethod[] {
  const rand = seeded("paymentMethods")
  // The free plan has nothing to bill, so it has nothing on file.
  const eligible = CUSTOMERS.filter((row) => row.plan !== "free").map((row) => row.id)
  const referenceYear = REFERENCE_DATE.getUTCFullYear()

  const seenCustomer = new Set<string>()
  return Array.from({ length: COUNT }, (_, index) => {
    const customerId = pick(rand, eligible)
    // The first card generated for a customer is their default; every later
    // one for the same customer is not.
    const isDefault = !seenCustomer.has(customerId)
    seenCustomer.add(customerId)

    return {
      id: rowId("pmt", index + 1),
      customerId,
      brand: pickWeighted(rand, BRAND_MIX),
      last4: String(intBetween(rand, 0, 9999)).padStart(4, "0"),
      expMonth: intBetween(rand, 1, 12),
      // A handful of cards are already expired — nobody has gotten around to updating them.
      expYear: intBetween(rand, referenceYear - 1, referenceYear + 5),
      default: isDefault,
    }
  })
}

/** The seeded wallet. The repository below owns the rows a demo mutates. */
export const PAYMENT_METHODS: PaymentMethod[] = generate()

export const paymentMethods = createRepository(PAYMENT_METHODS, {
  searchKeys: ["last4"],
  filterKeys: ["customerId", "brand", "default"],
})
