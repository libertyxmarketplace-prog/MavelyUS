export type LinkTemplate = { mark: string; domain: string; title: string; text: string }

export type PollTemplate = { text: string; options: readonly string[] }

/** A figure a teammate shares: where the series starts and ends, and the sentence that quotes its last point. */
export type StatTemplate = {
  label: string
  from: number
  to: number
  /** Decimal places the series is kept to. */
  places: number
  text: (last: string) => string
}

export const LINKS: readonly LinkTemplate[] = [
  {
    mark: "Lumen",
    domain: "lumen.example",
    title: "How Lumen moved its reporting onto event pipelines",
    text: "Lumen's write-up on moving their reporting onto event pipelines is the clearest account of backfills I have read. Worth ten minutes before the #analytics review.",
  },
  {
    mark: "Kestrel",
    domain: "kestrel.example",
    title: "Kestrel's notes on usage-based pricing",
    text: "Kestrel published their notes on moving to usage-based pricing, including what they got wrong in the first quarter. Relevant to the #pricing work.",
  },
  {
    mark: "Meridian",
    domain: "meridian.example",
    title: "What Meridian learned from 400 onboarding calls",
    text: "Meridian went through 400 onboarding calls and wrote down what actually made people stay. Most of it matches our #onboarding numbers.",
  },
  {
    mark: "Alder",
    domain: "alder.studio",
    title: "Designing tables people can scan",
    text: "Good piece from Alder on tables people can scan: right-aligned figures, fewer lines, one accent. Sharing it for the #design critique.",
  },
  {
    mark: "Tidewater",
    domain: "tidewater.example",
    title: "Tidewater's review of a four-hour outage",
    text: "Tidewater's review of their outage is a model of how to write one: a timeline, the decisions, no blame. Adding it to the #support reading list.",
  },
  {
    mark: "Copperline",
    domain: "copperline.example",
    title: "The case for fewer dashboards",
    text: "Copperline argues most teams need fewer dashboards and better defaults. I agree with about half of it; curious what the #analytics people think.",
  },
  {
    mark: "Solstice",
    domain: "solstice.example",
    title: "Hiring a first support engineer",
    text: "Solstice wrote about hiring their first support engineer and what the role looked like a year later. Useful for our #hiring plan.",
  },
  {
    mark: "Fieldstone",
    domain: "fieldstone.example",
    title: "A checklist for a quiet release day",
    text: "Fieldstone's release-day checklist is short and sensible. We already do most of it; the rollback drill is the part worth copying for the next #release.",
  },
  {
    mark: "Brightwater",
    domain: "brightwater.example",
    title: "Reports that run themselves: a Brightwater case study",
    text: "Brightwater wrote a case study about running their weekly reports on our product. Nice to read the #customers side of it in their own words.",
  },
  {
    mark: "Northgate",
    domain: "northgate.example",
    title: "Keeping an API stable for five years",
    text: "Northgate on keeping an API stable for five years: versioning, deprecation notices, and what they would never do again. Good background for the #api discussion.",
  },
]

export const POLLS: readonly PollTemplate[] = [
  { text: "Where should the next #offsite be? Voting closes on Friday.", options: ["Lisbon", "Copenhagen", "Dublin"] },
  { text: "Which day suits the fortnightly #design critique?", options: ["Tuesday", "Wednesday", "Thursday"] },
  { text: "Standup is moving. Which slot works for your mornings? #team", options: ["9:15", "9:30", "10:00"] },
  {
    text: "What should the next #release focus on?",
    options: ["Faster exports", "Saved views", "Phone layouts", "Audit log search"],
  },
  { text: "When should the #support rota hand over?", options: ["9:00", "13:00", "17:00"] },
]

export const STATS: readonly StatTemplate[] = [
  {
    label: "Weekly active workspaces",
    from: 1_180,
    to: 1_420,
    places: 0,
    text: (last) => `Weekly active workspaces ended the week at ${last}, the highest yet. #analytics`,
  },
  {
    label: "Median first response, minutes",
    from: 38,
    to: 14,
    places: 0,
    text: (last) => `Median first response is down to ${last} minutes. Thank you, support rota. #support`,
  },
  {
    label: "Signups per week",
    from: 236,
    to: 312,
    places: 0,
    text: (last) => `${last} signups last week. The new setup checklist is doing its job. #onboarding`,
  },
  {
    label: "Exports finished on time, %",
    from: 91,
    to: 99.2,
    places: 1,
    text: (last) => `${last}% of exports finished on time last week, the best run since we started counting. #release`,
  },
  {
    label: "Scheduled reports sent",
    from: 3_100,
    to: 5_450,
    places: 0,
    text: (last) => `${last} scheduled reports went out last week. Customers are setting them and forgetting them. #customers`,
  },
  {
    label: "Open support tickets",
    from: 84,
    to: 41,
    places: 0,
    text: (last) => `Open tickets are down to ${last}, half of where they were twelve weeks ago. #support`,
  },
]

/** What a product post says around the product's own name. */
export const PRODUCT_LINES: readonly ((name: string) => string)[] = [
  (name) => `${name} is back in stock and ships from Monday. #store`,
  (name) => `Best seller in the #store this week: the ${name}.`,
  (name) => `New in the #store: ${name}. The first batch goes out on Thursday.`,
  (name) => `The ${name} made it into the office refit, ordered through our own #store.`,
  (name) => `Heads up for the #store team: the ${name} is down to its last few units.`,
  (name) => `Customers keep asking about the ${name}. It is in the #store at the usual price.`,
  (name) => `Three orders for the ${name} came in from one office this morning. #store #customers`,
]

/** Posts with nothing attached; `name` is the teammate a post is about. Each opens on a topic tag of its own, which is how its replies are found. */
export const NOTES: readonly ((name: string) => string)[] = [
  () => "Shipped the new setup checklist to every workspace this morning. Thanks to everyone who tested it. #onboarding #release",
  () => "Reminder: the #design critique is in the big room at 2 PM. Bring one thing you would cut.",
  (name) => `Welcome ${name} to the support team. Say hello when you see them in the kitchen. #hiring`,
  () => "The seat-count job now runs in eleven minutes instead of forty-seven. Batching the audit writes did it. #release",
  () => "Fire drill on Thursday at 11 for anyone in the #office. It takes ten minutes.",
  () => "Wrote up the retention numbers. Short version: people who finish setup stay. The full doc is in the drive. #analytics",
  () => "Two customers asked for saved views this week alone. Adding it to the list for planning. #customers",
  () => "The incident review for Tuesday's export delay is published. No blame, three fixes, all merged. #support",
  () => "Offsite agenda is final. Wednesday is strategy, Thursday is building, Friday is off. #offsite",
  (name) => `Thank you ${name} for covering my #oncall shifts while I was away. Back on Monday.`,
  () => "Pairing on the single sign-on flow this afternoon if anyone wants to watch. #api",
]

/**
 * What people say under a post: by the media it carries, or — for a post
 * with none — by the first topic it names. `any` fits under anything, and
 * tops up a thread that outgrows its own list.
 */
export const REPLIES = {
  link: [
    "Good read. The part about backfills matches what we saw last quarter.",
    "Saving this for Thursday's review.",
    "Their point about defaults is the one I keep coming back to.",
    "Shared it with the platform team.",
    "Did they say how long the move took?",
    "Worth a slot in the next reading group.",
    "Bookmarked. The second half is the useful part.",
  ],
  poll: [
    "Voted. Anything but a Monday.",
    "Voted, and happy with whichever wins.",
    "Can we close it on Friday so people can plan?",
    "Mine is in.",
    "Does it go to a second round if it is close?",
    "Voted for the second one, but the first is fine too.",
    "Glad we are asking instead of guessing.",
  ],
  product: [
    "Ordered two for the design room.",
    "Is there a version in dark grey?",
    "We have one in the Rotterdam office and it has held up well.",
    "How long is delivery to Dublin?",
    "Putting this on the office refit list.",
    "The reviews on this one are good.",
    "Good to see it back.",
  ],
  stat: [
    "Is that including trial workspaces?",
    "Great trend. What changed in week six?",
    "Can we add this to the Monday dashboard?",
    "The dip in the middle was the holiday week.",
    "Would love the same chart split by plan.",
    "Let us see if it holds next week.",
    "Worth mentioning in the board update.",
  ],
  note: {
    "#onboarding": [
      "The checklist already saved me a support ticket.",
      "Can we see how many workspaces finish it after a week?",
      "Two customers mentioned it on calls today.",
    ],
    "#design": ["I will bring the pricing page.", "Can we keep it to an hour this time?", "See you there."],
    "#hiring": ["Welcome aboard.", "Great to have you on the team.", "Say hi if you need anything."],
    "#release": ["Great fix.", "No alerts overnight, for the record.", "That frees up the whole night window."],
    "#office": ["Thanks for the heads-up.", "Good to know, I will move my 11:00.", "Will the lifts be off during it?"],
    "#analytics": ["Which cohort moved the most?", "Can we share this with the sales team?", "The chart on page two says it all."],
    "#customers": ["Two of mine asked too.", "Adding my notes to the ticket.", "One of my accounts asked last month."],
    "#support": [
      "Thanks for keeping it blameless.",
      "Good write-up. The second fix is the one I would have missed.",
      "Clear and short. More of these, please.",
    ],
    "#offsite": ["Friday off is the best part of this agenda.", "Booked my train.", "Can we have the building day in one room?"],
    "#oncall": ["Welcome back.", "Any time.", "Quiet week, nothing to hand over."],
    "#api": ["I will drop by after three.", "Record it if you can.", "Which provider are we testing first?"],
  } as Record<string, readonly string[]>,
  any: ["Thanks for sharing.", "Great work, all.", "Noted, thanks.", "Good to know.", "Agreed.", "Thanks for writing this up."],
} as const
