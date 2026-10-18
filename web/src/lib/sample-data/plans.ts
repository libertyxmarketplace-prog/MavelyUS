import { createRepository, intBetween, rowId, seeded } from "./core"

/** A pricing tier: what a subscription's `planId` points at. */
export type Plan = {
  id: string
  name: string
  priceMonthlyCents: number
  priceYearlyCents: number
  seatsIncluded: number
  features: string[]
  popular?: boolean
}

// A real pricing page, not a random one — tiers, prices and feature lists are
// business decisions. `generate()` still runs it through `seeded("plans")` to
// derive the one number that *is* a range: the yearly discount.
const CATALOG: readonly {
  name: string
  priceMonthlyCents: number
  seatsIncluded: number
  features: string[]
  popular?: boolean
}[] = [
  {
    name: "Free",
    priceMonthlyCents: 0,
    seatsIncluded: 3,
    features: ["Up to 3 seats", "Community support", "1 GB storage"],
  },
  {
    name: "Starter",
    priceMonthlyCents: 1_900,
    seatsIncluded: 10,
    features: ["Up to 10 seats", "Email support", "10 GB storage", "Basic analytics"],
  },
  {
    name: "Team",
    priceMonthlyCents: 4_900,
    // 30, not 25: the sample workspace is on Team, and with every open
    // invitation holding a seat (seatUsage) it holds 25 — at 25 it would be
    // full at REFERENCE_DATE, with nobody left to invite.
    seatsIncluded: 30,
    features: ["Up to 30 seats", "Priority support", "100 GB storage", "Advanced analytics", "Custom roles"],
    popular: true,
  },
  {
    name: "Enterprise",
    priceMonthlyCents: 14_900,
    seatsIncluded: 100,
    features: [
      "Unlimited seats",
      "Dedicated support",
      "Unlimited storage",
      "Advanced analytics",
      "Custom roles",
      "SSO & SAML",
      "Audit logs",
    ],
  },
]

function generate(): Plan[] {
  const rand = seeded("plans")

  return CATALOG.map((plan, index) => {
    // An annual plan discounts 15-20% off twelve months, rounded to the dollar.
    const priceYearlyCents =
      plan.priceMonthlyCents === 0
        ? 0
        : Math.round((plan.priceMonthlyCents * 12 * (100 - intBetween(rand, 15, 20))) / 100 / 100) * 100

    return {
      id: rowId("pln", index + 1),
      name: plan.name,
      priceMonthlyCents: plan.priceMonthlyCents,
      priceYearlyCents,
      seatsIncluded: plan.seatsIncluded,
      features: plan.features,
      // Left unset rather than `false` on the other tiers, same as
      // `Member.avatarUrl` — it is a flag, not a tri-state.
      ...(plan.popular ? { popular: true as const } : {}),
    }
  })
}

/** The four pricing tiers. The repository below owns the rows a demo mutates. */
export const PLANS: Plan[] = generate()

export const plans = createRepository(PLANS, {
  searchKeys: ["name"],
})
