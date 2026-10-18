import { REFERENCE_DATE, chance, createRepository, daysAhead, rowId, seeded } from "./core"
import { CUSTOMERS, type Customer } from "./customers"
import { PLANS } from "./plans"

/** The billing relationship behind a `Customer`: one subscription per account. */
export type Subscription = {
  id: string
  customerId: string
  planId: string
  status: "trialing" | "active" | "past_due" | "cancelled"
  mrrCents: number
  startedAt: Date
  renewsAt: Date
  cancelledAt?: Date
  seats: number
}

const DAY_MS = 86_400_000

// `Plan.name` and `Customer.plan` are written in the same four tiers, so a
// subscription's plan is the customer's own tier, looked up by name.
const PLAN_ID_BY_TIER: Record<Customer["plan"], string> = {
  free: PLANS.find((plan) => plan.name === "Free")!.id,
  starter: PLANS.find((plan) => plan.name === "Starter")!.id,
  team: PLANS.find((plan) => plan.name === "Team")!.id,
  enterprise: PLANS.find((plan) => plan.name === "Enterprise")!.id,
}

/** The next multiple of `cycleDays` after `startedAt` that lands past `REFERENCE_DATE`. */
function nextRenewal(startedAt: Date, cycleDays: number): Date {
  const cycleMs = cycleDays * DAY_MS
  const elapsed = REFERENCE_DATE.getTime() - startedAt.getTime()
  const cyclesElapsed = Math.floor(elapsed / cycleMs) + 1
  return daysAhead(cyclesElapsed * cycleDays, startedAt)
}

function generate(): Subscription[] {
  const rand = seeded("subscriptions")

  return CUSTOMERS.map((customer, index) => {
    // A subscription mirrors the account it bills: same tier, same seats,
    // same MRR (already zeroed for free/trial/churned by customers.ts).
    const status: Subscription["status"] =
      customer.status === "churned"
        ? "cancelled"
        : customer.status === "suspended"
          ? "past_due"
          : customer.status === "trial"
            ? "trialing"
            : // A live account occasionally has a payment failure without losing access yet.
              chance(rand, 0.06)
              ? "past_due"
              : "active"

    const cycleDays = chance(rand, 0.75) ? 30 : 365
    const startedAt = customer.createdAt

    return {
      id: rowId("sub", index + 1),
      customerId: customer.id,
      planId: PLAN_ID_BY_TIER[customer.plan],
      status,
      mrrCents: customer.mrrCents,
      startedAt,
      renewsAt: nextRenewal(startedAt, cycleDays),
      // A cancelled subscription stopped the day the account went quiet.
      ...(status === "cancelled" ? { cancelledAt: customer.lastSeenAt } : {}),
      seats: customer.seats,
    }
  })
}

/** One subscription per customer. The repository below owns the rows a demo mutates. */
export const SUBSCRIPTIONS: Subscription[] = generate()

export const subscriptions = createRepository(SUBSCRIPTIONS, {
  searchKeys: ["customerId"],
  filterKeys: ["status", "planId", "customerId"],
})
