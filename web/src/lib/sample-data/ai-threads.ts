import { chance, createRepository, daysAgo, intBetween, pickWeighted, rowId, seeded } from "./core"

/** One turn in a conversation with the assistant. */
export type AiMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  at: Date
}

/**
 * A conversation with the assistant: a title for the rail, a model, and the
 * turns. The models are Northwind's own, run in-house: the default, the large
 * one and the fast one — fictional, like every AI name in the kit.
 */
export type AiThread = {
  id: string
  title: string
  model: "nw-2" | "nw-large-2" | "nw-fast-2"
  createdAt: Date
  /** When the last turn landed; the rail groups threads by it. */
  updatedAt: Date
  /** Alternating user and assistant turns, opening on the user and closing on the assistant. */
  messages: AiMessage[]
}

const COUNT = 12

const MODEL_MIX: readonly (readonly [AiThread["model"], number])[] = [
  ["nw-2", 0.6],
  ["nw-large-2", 0.25],
  ["nw-fast-2", 0.15],
]

// What a product team asks an assistant inside its own analytics workspace:
// the title the rail shows, the question as it was typed, and the answer.
const OPENERS: readonly { title: string; question: string; answer: string }[] = [
  {
    title: "Summarise last week's signups",
    question: "Can you summarise how signups moved last week and what drove the change?",
    answer:
      "Signups rose about 12% week over week, with most of the lift landing on Tuesday and Wednesday after the launch post went out. Organic search held steady, so the change is almost entirely the referral spike. If you want, I can break the week down by plan.",
  },
  {
    title: "Draft a trial-ending email",
    question: "Draft a short email to customers whose trial ends this week, nudging them to pick a plan.",
    answer:
      "Here is a draft you can adapt: subject “Your trial ends Friday — keep your dashboards”. The body thanks them, names the one feature they used most, and closes with a single link to the plans page. I kept it to four sentences so it reads on a phone.",
  },
  {
    title: "Explain the P95 latency spike",
    question: "Why did P95 latency jump on Monday afternoon?",
    answer:
      "The jump lines up with the 14:10 deploy of the events service: P95 climbed from 380 ms to 1.2 s and settled once the rollback landed at 15:05. Nothing in the traffic mix changed, so it reads as a regression rather than load. The deploy notes mention a new serialisation path, which is the first place I would look.",
  },
  {
    title: "SQL for weekly active workspaces",
    question: "Write a query that counts weekly active workspaces for the last 12 weeks.",
    answer:
      "Group events by workspace and by the Monday of the week they landed in, count the distinct workspaces per week, and keep the last twelve weeks. The trick is to truncate to the week before counting, not after, or a workspace active on two days is counted twice. I have written it to read from the events table with a 12-week window on the timestamp.",
  },
  {
    title: "Rename the onboarding steps",
    question: "Suggest clearer names for the four onboarding steps: Setup, Connect, Invite, Done.",
    answer:
      "Try “Name your workspace”, “Connect a data source”, “Invite your team” and “You’re all set”. Each one says what the reader does on that step rather than what the step is called, which is what a progress bar needs. The last one can stay a sentence, since it is a state and not a task.",
  },
  {
    title: "Compare the two pricing pages",
    question: "Compare the current pricing page with the draft: which one converts better and why?",
    answer:
      "The draft moves the plan comparison above the fold and drops the toggle for annual billing, which are the two changes most likely to matter. On the current page readers scroll past the plans to find the price, and the toggle hides the number half of them want. I would ship the draft’s layout and keep the annual toggle visible.",
  },
  {
    title: "Regex for order numbers",
    question: "What regex matches our order numbers like ORD-10432?",
    answer:
      "Use ^ORD-\\d{5}$ if the number is always five digits, or ^ORD-\\d{4,6}$ to leave room for growth. Anchor both ends so a longer string with an order number inside it does not match. If you are validating user input, trim whitespace first.",
  },
  {
    title: "Plan the Q4 roadmap doc",
    question: "Help me outline a one-page Q4 roadmap for the platform team.",
    answer:
      "Open with the three outcomes the quarter is for, then one line per project naming the outcome it serves, the owner and the month it lands. Keep risks as a short list at the bottom rather than woven into the projects, so a reader can find them. A page that fits on one screen gets read; the appendix can hold the rest.",
  },
  {
    title: "Plain-English release notes",
    question: "Translate the 2.4 release notes into plain English for the changelog.",
    answer:
      "Here is a plainer version: “Dashboards now load twice as fast, filters remember what you picked, and the export button works on every table.” The original names the caching layer and the state store, which nobody outside the team needs. Three sentences cover the three changes.",
  },
  {
    title: "Explain the retention cohort chart",
    question: "Explain what the retention cohort chart is showing, in one paragraph.",
    answer:
      "Each row is the set of workspaces that signed up in one month, and each cell is the share of them still active some weeks later. Reading down a column compares cohorts at the same age, which is where a product change shows up. The chart is saying that cohorts since May keep about ten points more of their users at week eight.",
  },
  {
    title: "Write a status page notice",
    question: "Write a short incident notice for the status page about the delayed exports.",
    answer:
      "“Exports are delayed. Since 09:20 UTC, CSV exports are taking up to 20 minutes to arrive. Dashboards and the API are unaffected. We have found the cause and expect exports to catch up within the hour; we will update this notice when they do.” Four sentences: what, since when, what still works, what happens next.",
  },
  {
    title: "Tidy a changelog entry",
    question: "Tidy this changelog entry: “fixed bug where the invoice mailer sent twice sometimes when retried”.",
    answer:
      "“Fixed: a retried invoice email could be sent twice.” Lead with the outcome, keep the tense consistent, and drop “sometimes” — a reader wants to know the bug is gone, not how often it struck. If it helps, add the version it shipped in.",
  },
]

const FOLLOW_UPS = [
  "Can you make that shorter?",
  "What would you change if the audience were customers rather than the team?",
  "Give me one more option.",
  "Which part of that is most likely to be wrong?",
  "Can you turn that into three bullet points?",
]

const FOLLOW_UP_ANSWERS = [
  "Shorter version: keep the first sentence, cut the second, and end on the action. That loses the reasoning but keeps the point, which is what a busy reader takes away.",
  "For customers, drop the internal names and say what changes for them. The structure stays the same; only the nouns move.",
  "One more: lead with the number, then the cause, then the next step. It reads more like a status line and less like a memo.",
  "The weakest part is the causal claim: the timing fits, but nothing here proves it. A quick check against the deploy log would settle it either way.",
  "As bullets: what changed, why it matters, what to do next. Each one a single line, and no bullet that needs the one above it to make sense.",
]

const HOUR = 1 / 24
const MINUTE = HOUR / 60

/**
 * When a thread opened, in days before now. The first three opened earlier
 * today, the next two yesterday, the rest over the last six weeks — so the
 * rail's three groups are all populated whichever way the seed falls.
 */
function openedDaysAgo(rand: () => number, index: number): number {
  if (index < 3) return intBetween(rand, 1, 12) * HOUR
  if (index < 5) return intBetween(rand, 26, 36) * HOUR
  return intBetween(rand, 3, 40) + rand()
}

function generate(): AiThread[] {
  const rand = seeded("ai-threads")

  return OPENERS.slice(0, COUNT).map((opener, index) => {
    const id = rowId("ait", index + 1)
    // At least an hour back, and the turns below add under forty minutes
    // between them, so no thread ever runs past "now".
    const openedAt = daysAgo(openedDaysAgo(rand, index))
    let at = openedAt
    let count = 0

    const turn = (role: AiMessage["role"], text: string, gapMinutes: number): AiMessage => {
      at = new Date(at.getTime() + gapMinutes * MINUTE * 86_400_000)
      count += 1
      return { id: `${id}-m${count}`, role, text, at }
    }

    const messages: AiMessage[] = [
      turn("user", opener.question, 0),
      turn("assistant", opener.answer, intBetween(rand, 1, 3)),
    ]

    // A follow-up or two, as a reader who got a useful answer tends to ask.
    const exchanges = chance(rand, 0.55) ? intBetween(rand, 1, 2) : 0
    for (let i = 0; i < exchanges; i += 1) {
      const which = intBetween(rand, 0, FOLLOW_UPS.length - 1)
      messages.push(turn("user", FOLLOW_UPS[which], intBetween(rand, 2, 15)))
      messages.push(turn("assistant", FOLLOW_UP_ANSWERS[which], intBetween(rand, 1, 3)))
    }

    return {
      id,
      title: opener.title,
      model: pickWeighted(rand, MODEL_MIX),
      createdAt: openedAt,
      updatedAt: messages[messages.length - 1].at,
      messages,
    }
  })
}

/** The seeded conversations. The repository below owns the rows the assistant page appends to. */
export const AI_THREADS: AiThread[] = generate()

export const aiThreads = createRepository(AI_THREADS, {
  searchKeys: ["title"],
  filterKeys: ["model"],
})
