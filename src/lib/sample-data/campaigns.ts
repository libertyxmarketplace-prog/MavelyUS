import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  intBetween,
  rowId,
  seeded,
  shuffle,
} from "./core"

/** A marketing push on one channel, tracked from spend through to conversions. */
export type Campaign = {
  id: string
  name: string
  channel: "search" | "social" | "email" | "referral" | "organic"
  /** Spend in minor units — cents, not dollars. */
  spendCents: number
  clicks: number
  conversions: number
  startedAt: Date
  endedAt?: Date
  status: "active" | "paused" | "completed"
}

const COUNT = 24

// A hand-written slate, each name already paired with the channel it runs on.
// A campaign is named for its idea, never for a platform someone else owns:
// the channel already says where it runs.
const CATALOG: readonly (readonly [string, Campaign["channel"]])[] = [
  ["Search — Brand Terms", "search"],
  ["Search — Competitor Terms", "search"],
  ["Search — Product Launch", "search"],
  ["Search — Holiday Push", "search"],
  ["Search — Retargeting", "search"],
  ["Founder Thought Leadership", "social"],
  ["Brand Awareness Series", "social"],
  ["Cart Abandoner Retargeting", "social"],
  ["Short-Form Product Teasers", "social"],
  ["Launch Day Announcement", "social"],
  ["Welcome Series Revamp", "email"],
  ["Quarterly Newsletter", "email"],
  ["Win-Back Campaign", "email"],
  ["Feature Announcement Blast", "email"],
  ["Customer Advocacy Digest", "email"],
  ["Partner Referral Program", "referral"],
  ["Customer Referral Bonus", "referral"],
  ["Affiliate Launch Push", "referral"],
  ["Reseller Incentive Drive", "referral"],
  ["Community Ambassador Program", "referral"],
  ["SEO Content Overhaul", "organic"],
  ["Blog Editorial Calendar", "organic"],
  ["Guest Post Outreach", "organic"],
  ["Documentation Refresh", "organic"],
]

const SPEND_RANGE_CENTS: Record<Campaign["channel"], readonly [number, number]> = {
  search: [200_000, 2_000_000],
  social: [100_000, 1_500_000],
  email: [5_000, 50_000],
  referral: [10_000, 200_000],
  // Organic is editorial time, not ad spend — a small tooling cost at most.
  organic: [0, 20_000],
}

function generate(): Campaign[] {
  const rand = seeded("campaigns")
  // The slate is already distinct; shuffle only so id order does not mirror
  // the channel grouping it was written in.
  const slate = shuffle(rand, CATALOG).slice(0, COUNT)

  return slate.map(([name, channel], index) => {
    const [minSpend, maxSpend] = SPEND_RANGE_CENTS[channel]
    const clicks = intBetween(rand, 200, 40_000)
    // Up to an 8% click-to-conversion rate.
    const conversions = intBetween(rand, 0, Math.floor(clicks * 0.08))
    const startedAt = dateBetween(rand, daysAgo(365), daysAgo(1))
    const hasEnded = chance(rand, 0.6)
    // A live campaign is occasionally paused rather than actively running.
    const status: Campaign["status"] = hasEnded ? "completed" : chance(rand, 0.15) ? "paused" : "active"

    return {
      id: rowId("cmp", index + 1),
      name,
      channel,
      spendCents: intBetween(rand, minSpend, maxSpend),
      clicks,
      conversions,
      startedAt,
      ...(hasEnded ? { endedAt: dateBetween(rand, startedAt, REFERENCE_DATE) } : {}),
      status,
    }
  })
}

/** The seeded campaign slate. The repository below owns the rows a demo mutates. */
export const CAMPAIGNS: Campaign[] = generate()

export const campaigns = createRepository(CAMPAIGNS, {
  searchKeys: ["name"],
  filterKeys: ["channel", "status"],
})
