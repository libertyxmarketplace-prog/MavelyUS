import type { MailTemplate } from "./mail-templates"

/** From a teammate to the reader. */
export const FROM_TEAM: MailTemplate[] = [
  {
    subject: () => "Staging deploy for 4.2 is out",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "The 4.2 build went out to staging at nine. The seat-count job and the new export queue are both in it, and nothing has shown up in the error log so far.",
      `${c.teammate} is running the regression pass this afternoon. If it comes back clean, I would like to ship to production on Thursday morning.`,
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Design review moved to Thursday",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "The design review for the new onboarding flow has moved from Wednesday to Thursday at 2 PM, same room. The prototype link has not changed.",
      `Could you bring the numbers on where people drop out of the setup step? ${c.teammate} wants to decide on the checklist before the sprint closes.`,
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "The seat-count job ran long again",
    labels: ["work"],
    body: (c) => [
      `${c.me},`,
      "The nightly seat-count job took 47 minutes last night, against about 20 a month ago. It finished, but it ran into the start of the invoice mailer.",
      "I think the new audit trail writes are the cause. I have a branch that batches them; it needs a review before we try it on staging.",
      c.other,
    ],
  },
  {
    subject: () => "Draft of the retention write-up",
    labels: ["work"],
    files: ["retention-draft.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      "Attached is the first draft of the retention write-up. The short version: week-four retention is up two points, almost all of it from workspaces that finished the setup checklist.",
      "Two open questions are marked in the margin. Comments by Friday would let me send it with the board pack on Monday.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "On-call rota for next week",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      `The rota for next week has a gap on Tuesday night. ${c.teammate} is out, and I would rather not double anyone up after the last release.`,
      "Could you take it, or should I ask the platform team to cover?",
      c.other,
    ],
  },
  {
    subject: () => "Offsite in Lisbon: flights and hotel",
    labels: ["travel", "work"],
    files: ["offsite-itinerary.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      "Flights for the Lisbon offsite are booked for everyone who confirmed. The itinerary is attached, with the hotel address and the times for each day.",
      "We land on the Tuesday afternoon and the first session starts on Wednesday at 9:30. Dinner that evening is at the place by the river we used last year.",
      `Tell me if anything on the list is wrong. ${c.other}`,
    ],
  },
  {
    subject: () => "Train times for the Berlin workshop",
    labels: ["travel"],
    body: (c) => [
      `${c.me},`,
      "The workshop in Berlin starts at 10, so the 6:40 train gets us there with an hour to spare. The later one cuts it too close.",
      "I have held two seats in the quiet coach. If you would rather go the night before, say so today and I will change the booking.",
      c.other,
    ],
  },
  {
    subject: () => "Expense report for sign-off",
    labels: ["finance"],
    files: ["expense-report.xlsx"],
    body: (c) => [
      `Hi ${c.me},`,
      "My expenses from the customer visit in Rotterdam are attached for sign-off: two nights of hotel, the train there and back, and one dinner.",
      "The total is under the trip budget. The receipts are on the second tab of the sheet.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Book club: the next pick",
    labels: ["personal"],
    body: (c) => [
      `Hi ${c.me},`,
      "The vote for the next book closed last night. The history of the shipping container won by two votes, so that is what we are reading.",
      "We meet on the last Thursday of the month, after work, in the small kitchen.",
      c.other,
    ],
  },
  {
    subject: () => "Lunch on Friday?",
    labels: ["personal"],
    body: (c) => [
      `${c.me},`,
      `A few of us are going to the noodle place on the corner on Friday at 12:30. ${c.teammate} is coming too.`,
      "Shall I add you to the booking?",
      c.other,
    ],
  },
  {
    subject: () => "Budget sign-off for the analytics pilot",
    labels: ["finance", "work"],
    files: ["analytics-pilot-contract.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      "The analytics pilot needs your sign-off before the vendor will hold the price. It is a three-month term, cancellable with a month's notice.",
      "The cost fits inside this quarter's tooling budget with about a tenth left over. The contract is attached.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Notes from the support retro",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "Notes from this morning's support retro, in short: first responses are faster, but tickets about exports still bounce between teams.",
      `We agreed to route anything about exports to ${c.teammate} for the next two weeks and look at the numbers again after that.`,
      c.other,
    ],
  },
  {
    subject: () => "Pricing page copy for review",
    labels: ["work"],
    files: ["pricing-page-copy.docx"],
    body: (c) => [
      `Hi ${c.me},`,
      "The new copy for the pricing page is attached, with the plan names unchanged and the strikethrough prices gone.",
      "I would like to publish it with Thursday's release. Could you read the enterprise section in particular? That is the one sales asked about.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Customer interviews this week",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "I have five customer interviews booked this week, all about the scheduled reports. Two of them are on the enterprise plan.",
      "If you want to sit in on one, Thursday at 11 is the most interesting. I will share the notes either way.",
      c.other,
    ],
  },
  {
    subject: () => "New card for the tooling subscriptions",
    labels: ["finance"],
    body: (c) => [
      `${c.me},`,
      "The company card on the design and analytics tools expires at the end of the month. Seven subscriptions still use it.",
      "Finance has issued the new card. Can I move them over this week, or do you want to review the list first?",
      c.other,
    ],
  },
  {
    subject: () => "Tickets for the product conference",
    labels: ["travel", "work"],
    body: (c) => [
      `Hi ${c.me},`,
      "Early-bird tickets for the product conference close on Friday. Three of us would like to go, and the talks on pricing look worth it.",
      "The total with the hotel is inside the travel budget. Shall I book?",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Drinks on Friday for the release",
    labels: ["personal"],
    body: (c) => [
      `Hi ${c.me},`,
      `We are having a drink on Friday after work to mark the release. ${c.teammate} has booked the back room at the place on the corner.`,
      "Partners are welcome. No speeches, promise.",
      c.other,
    ],
  },
  {
    subject: () => "Access to the billing settings",
    labels: ["work", "finance"],
    body: (c) => [
      `Hi ${c.me},`,
      "Could you give me access to the billing settings? I need to download last quarter's invoices for the audit.",
      "Read-only would be enough, if that is easier.",
      `Thanks, ${c.other}`,
    ],
  },
]

/** From the reader to a teammate. */
export const TO_TEAM: MailTemplate[] = [
  {
    subject: () => "Agenda for Thursday's review",
    labels: ["work"],
    files: ["review-agenda.pdf"],
    body: (c) => [
      `Hi ${c.other},`,
      "The agenda for Thursday's design review is attached. We start with the onboarding checklist, then the pricing page, and keep the last twenty minutes for questions.",
      "If you want anything added, reply by Wednesday noon.",
      `Thanks, ${c.me}`,
    ],
  },
  {
    subject: () => "Hotel rooms for the offsite",
    labels: ["travel"],
    body: (c) => [
      `Hi ${c.other},`,
      "I have held twelve rooms at the hotel for the offsite, Tuesday to Friday. The hold runs out at the end of next week.",
      "Can you confirm who is coming from your team, so I can release the rest?",
      c.me,
    ],
  },
  {
    subject: () => "Welcome to the team",
    labels: ["personal"],
    body: (c) => [
      `Hi ${c.other},`,
      "Welcome to Northwind. Your laptop is on your desk and your accounts are set up; the first week's schedule is pinned in the team channel.",
      "Lunch on Monday is on us. I will come and find you at noon.",
      c.me,
    ],
  },
  {
    subject: () => "Covering the Tuesday rota",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.other},`,
      "I can take the Tuesday night on-call. Put me on the rota and we will swap back later in the month.",
      c.me,
    ],
  },
  {
    subject: () => "Numbers for the retention write-up",
    labels: ["work"],
    files: ["retention-by-cohort.xlsx"],
    body: (c) => [
      `Hi ${c.other},`,
      "The numbers you asked for are attached: week-four retention by signup month, split by whether the workspace finished setup.",
      "The last two months are still settling, so treat them as provisional.",
      c.me,
    ],
  },
  {
    subject: () => "Your expenses are approved",
    labels: ["finance"],
    body: (c) => [
      `Hi ${c.other},`,
      "Your expenses from the Rotterdam trip are approved and will be paid with this month's salary.",
      `Thanks, ${c.me}`,
    ],
  },
]
