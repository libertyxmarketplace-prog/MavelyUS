import type { MailTemplate } from "./mail-templates"

/** From a customer's contact to the reader. */
export const FROM_CUSTOMER: MailTemplate[] = [
  {
    subject: (c) => `Renewal quote for ${c.company}`,
    labels: ["finance"],
    files: ["renewal-quote.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      `Our renewal comes up at the end of next month, and finance wants the quote in writing before they approve it. The one attached is last year's; could you send the updated version for ${c.company}?`,
      "We plan to add about ten seats in the new year, so a price for those would help too.",
      `Best, ${c.other}`,
    ],
  },
  {
    subject: () => "A question about seat pricing",
    labels: ["finance"],
    body: (c) => [
      `Hello ${c.me},`,
      "When someone leaves our team and we remove their seat halfway through the month, is the unused part credited on the next invoice, or does it only change from the next cycle?",
      "We want to tidy up our seats before the renewal.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Invoice charged twice",
    labels: ["finance"],
    files: ["card-statement.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      `Our card was charged twice for this month's invoice, a few minutes apart. Both charges are on the statement for ${c.company}, attached.`,
      "Could you refund the second one, or tell me who to talk to about it?",
      `Thank you, ${c.other}`,
    ],
  },
  {
    subject: () => "Single sign-on rollout next week",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      `We are turning on single sign-on for everyone at ${c.company} next Tuesday. Is there anything we should do on your side first, or does the setting apply to people who are already signed in?`,
      "Our IT lead would like a short call on Monday if you have half an hour.",
      `Best, ${c.other}`,
    ],
  },
  {
    subject: () => "Warehouse export keeps timing out",
    labels: ["work"],
    files: ["export-log.txt"],
    body: (c) => [
      `Hi ${c.me},`,
      "The nightly export to our warehouse has timed out three nights in a row. Last night's log is attached; it stops at the same table each time.",
      "Nothing has changed on our side since the start of the month. Can you see anything from yours?",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Thanks for the onboarding session",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "Thank you for walking the team through the setup yesterday. Everyone left with their workspace connected, which has never happened in one sitting before.",
      "We will try the scheduled reports next week and come back with questions.",
      `Best, ${c.other}`,
    ],
  },
  {
    subject: () => "Can we move our quarterly review?",
    labels: ["work"],
    body: (c) => [
      `Hello ${c.me},`,
      "Our quarterly review now clashes with our board meeting. Could we move it to the following week?",
      "Any afternoon works for us. The agenda can stay as it is.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Webhook signatures failing since Tuesday",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      "Since Tuesday about one in five webhooks from your side fails our signature check. The payloads look fine; it is only the check.",
      "Did anything change in how the header is built? We have paused the retries on our side for now.",
      c.other,
    ],
  },
  {
    subject: () => "Visiting your London office",
    labels: ["travel", "work"],
    body: (c) => [
      `Hi ${c.me},`,
      `Two of us from ${c.company} will be in London in a fortnight. Would you have an hour to meet? We would like to show you how we use the dashboards day to day.`,
      "We are flexible on the day. Mornings are better for us.",
      `Best, ${c.other}`,
    ],
  },
  {
    subject: () => "A second workspace for our new office",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.me},`,
      `${c.company} is opening an office in Toronto, and the team there wants its own workspace. Can it sit under our current contract, or is it a separate account?`,
      "We would like the two to share one sign-in.",
      `Thanks, ${c.other}`,
    ],
  },
  {
    subject: () => "Feedback on the new dashboards",
    labels: ["work"],
    body: (c) => [
      `Hello ${c.me},`,
      "The team has used the new dashboards for two weeks. The overview is a clear improvement; people open it every morning now.",
      "One request: the date range resets when we switch pages. It would help if it stayed where we set it.",
      `Best, ${c.other}`,
    ],
  },
  {
    subject: (c) => `Purchase order for ${c.company}`,
    labels: ["finance"],
    files: ["purchase-order.pdf"],
    body: (c) => [
      `Hi ${c.me},`,
      "Our procurement team needs a purchase order number on every invoice from now on. This year's order is attached.",
      "Could you add the number to the next invoice and to the renewal?",
      `Thanks, ${c.other}`,
    ],
  },
]

/** From the reader to a customer's contact. */
export const TO_CUSTOMER: MailTemplate[] = [
  {
    subject: (c) => `Re: Renewal quote for ${c.company}`,
    labels: ["finance"],
    files: ["renewal-quote-updated.pdf"],
    body: (c) => [
      `Hi ${c.other},`,
      `The updated quote for ${c.company} is attached. It keeps this year's price per seat and adds the ten seats you mentioned at the same rate.`,
      "It is valid until the end of next month. Tell me if finance needs it in another format.",
      `Best, ${c.me}`,
    ],
  },
  {
    subject: () => "Notes from our call",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.other},`,
      "Thanks for the time today. To sum up: we look into the export timeouts first, and you will have an answer on the webhook signatures by Friday.",
      "I will send a short update on both at the end of the week, whatever we find.",
      `Best, ${c.me}`,
    ],
  },
  {
    subject: () => "About the double charge",
    labels: ["finance"],
    body: (c) => [
      `Hi ${c.other},`,
      "You are right, the second charge was our mistake. It has been refunded and should reach your card within five working days.",
      "Sorry for the trouble.",
      `Best, ${c.me}`,
    ],
  },
  {
    subject: () => "Moving the quarterly review",
    labels: ["work"],
    body: (c) => [
      `Hi ${c.other},`,
      "No problem at all. I have moved the review to the following Wednesday at 2 PM and sent a new invite.",
      c.me,
    ],
  },
  {
    subject: () => "Your export timeouts",
    labels: ["work"],
    files: ["export-fix-notes.pdf"],
    body: (c) => [
      `Hi ${c.other},`,
      "We found the cause of the export timeouts: one table had grown past the batch size we allowed for. The fix goes out tonight; the notes are attached.",
      "Tomorrow's export should run in its usual time. I will check it myself in the morning.",
      `Best, ${c.me}`,
    ],
  },
  {
    subject: () => "Meeting in London",
    labels: ["travel", "work"],
    body: (c) => [
      `Hi ${c.other},`,
      `It would be good to meet the ${c.company} team. Tuesday morning works for us; our office is five minutes from the station.`,
      "I will send an invite with the address.",
      `Best, ${c.me}`,
    ],
  },
]
