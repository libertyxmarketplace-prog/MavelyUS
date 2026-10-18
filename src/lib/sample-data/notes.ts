import { chance, createRepository, daysAgo, rowId, seeded } from "./core"

/** The five tints a note can carry on its top band; the same tones the tiles use. */
export type NoteTone = "info" | "success" | "warning" | "danger" | "neutral"

/** One line of a checklist note. */
export type ChecklistItem = { id: string; text: string; done: boolean }

/** A note on the board: prose or a checklist, labelled, pinned or filed away. */
export type Note = {
  id: string
  title: string
  body: string
  /**
   * The rich document the editor saved, validated on the way in and again on
   * the way out; `body` holds its plain text. A seeded note has none.
   */
  doc?: unknown
  /** Words from the notes app's own label vocabulary. */
  labels: string[]
  /** Set on a checklist note; a prose note has none. */
  checklist?: ChecklistItem[]
  pinned: boolean
  archived: boolean
  /** The tint of the card's top band. A note without one sits plain on the sheet. */
  tone?: NoteTone
  updatedAt: Date
}

/** The five tints, walked in turn by the notes that carry one. */
const TONES: NoteTone[] = ["info", "success", "warning", "danger", "neutral"]

const MINUTE_MS = 60_000

/**
 * What the notes say, and what they are filed under. Written out rather than
 * assembled from parts because eighteen notes that read like notes are the
 * whole point of the page; the generator decides only what is drawn around
 * them — the tint, the dates, and which boxes are ticked. The labels are the
 * app's own vocabulary — Personal, Work, Ideas, Meetings, Planning, Reading
 * and Travel — which `projects-notes` names beside a tone dot in its rail, so a
 * note's labels always resolve to something on screen.
 */
const SEEDS: { title: string; labels: string[]; body: string; checklist?: string[] }[] = [
  {
    title: "Launch checklist — events API v2",
    labels: ["Work", "Planning"],
    body: "",
    checklist: [
      "Freeze the schema and tag the release",
      "Run the migration against staging",
      "Update the SDK quickstart",
      "Announce in the changelog",
      "Retire the v1 endpoints after 30 days",
    ],
  },
  {
    title: "Onboarding call with Wavelength Health",
    labels: ["Meetings"],
    body: "They want the funnel report emailed weekly and a sandbox workspace for their clinics. Follow up on SSO before the seats renew.",
  },
  {
    title: "Q4 planning themes",
    labels: ["Planning", "Work"],
    body: "Three bets: cut time-to-first-event to under ten minutes, make the retention view exportable, and ship the seat-count job before the enterprise renewals land.",
  },
  {
    title: "Reading list",
    labels: ["Reading"],
    body: "",
    checklist: [
      "Rivers of Records, chapter 11",
      "The On-Call Field Guide — alerting on SLOs",
      "Six Weeks at a Time, the betting table",
      "Talking to Customers Every Week",
    ],
  },
  {
    title: "Standup notes",
    labels: ["Meetings", "Work"],
    body: "Webhook retries are firing twice on the staging cluster. Rate limit on the events endpoint goes to 5k per minute on Monday. Design review moved to Thursday.",
  },
  {
    title: "Pricing page copy",
    labels: ["Work", "Ideas"],
    body: "Lead with the outcome, not the feature: “See every signup, from the first click to the first invoice.” Keep the plan names, drop the strikethrough prices.",
  },
  {
    title: "Berlin offsite",
    labels: ["Travel", "Planning"],
    body: "",
    checklist: [
      "Book the meeting room for both days",
      "Confirm the dietary list",
      "Draft the retrospective agenda",
      "Order the whiteboards",
    ],
  },
  {
    title: "Ideas parking lot",
    labels: ["Ideas"],
    body: "A weekly digest email built from the saved reports. Annotations on the traffic chart that anyone can leave. A one-line CLI that tails events from a workspace.",
  },
  {
    title: "Support rota — September",
    labels: ["Work"],
    body: "Week 1 Aisha, week 2 Bruno, week 3 Camille, week 4 Dmitri. Swap by writing in the channel, not by editing this note.",
  },
  {
    title: "Grocery run",
    labels: ["Personal"],
    body: "",
    checklist: ["Oat milk", "Coffee beans", "Rice", "Lemons", "Olive oil", "Eggs"],
  },
  {
    title: "Interview loop feedback",
    labels: ["Meetings"],
    body: "Strong on systems design, unsure on the pairing exercise. Ask the second round to go deeper on incident handling before we decide.",
  },
  {
    title: "Home renovation",
    labels: ["Personal", "Planning"],
    body: "",
    checklist: [
      "Get two quotes for the kitchen floor",
      "Pick the paint for the hallway",
      "Fix the bathroom tap",
      "Measure for the bookshelves",
    ],
  },
  {
    title: "Talk outline — observability on a budget",
    labels: ["Ideas", "Work"],
    body: "Open with the bill. Show what a sampled trace still tells you. Close with the three alerts worth paging on and the dozen that are not.",
  },
  {
    title: "Renewal call prep — Lumen Analytics",
    labels: ["Meetings", "Planning"],
    body: "Usage is up 40% quarter on quarter and they are near the seat cap. Bring the enterprise comparison and the SSO timeline.",
  },
  {
    title: "Weekend trip",
    labels: ["Travel", "Personal"],
    body: "",
    checklist: ["Tent and pegs", "Camping stove", "Water filter", "Map of the trail", "First-aid kit"],
  },
  {
    title: "Retrospective — August incident",
    labels: ["Work", "Meetings"],
    body: "The alert fired, nobody was paged: the rota had a gap. Action: the rota is checked by the deploy job, and a gap blocks the release.",
  },
  {
    title: "Docs to rewrite",
    labels: ["Work"],
    body: "The quickstart still shows the v1 SDK. The webhook page never says the payload is signed. Retention needs a worked example.",
  },
  {
    title: "Gift ideas",
    labels: ["Personal", "Ideas"],
    body: "A good kitchen knife, the trail-running shoes she mentioned, or a weekend away once the launch is out of the way.",
  },
]

function generate(): Note[] {
  const rand = seeded("notes")

  return SEEDS.map((seed, index) => {
    const id = rowId("not", index + 1)
    const checklist = seed.checklist?.map((text, line) => ({
      id: `${id}-c${line + 1}`,
      text,
      done: chance(rand, 0.4),
    }))
    // How long since the note was touched: most are days old, a few have sat
    // for weeks — a square-law draw rather than a flat one, so the board reads
    // as something in use. Minute-aligned, like every other date in the data.
    const ageDays = 60 * rand() ** 2
    const updatedAt = new Date(Math.floor(daysAgo(ageDays).getTime() / MINUTE_MS) * MINUTE_MS)
    // The rules, not draws: a note untouched for a month has been filed away,
    // and the ones touched in the last day are the ones pinned to the top.
    const archived = ageDays > 30
    const pinned = !archived && ageDays < 1

    return {
      id,
      title: seed.title,
      body: seed.body,
      labels: seed.labels,
      ...(checklist ? { checklist } : {}),
      pinned,
      archived,
      // About half the notes carry a tint, walking the five tones in turn so a
      // board of eighteen shows every one rather than whichever the draw favours.
      ...(chance(rand, 0.55) ? { tone: TONES[index % TONES.length] } : {}),
      updatedAt,
    }
  })
}

/** The seeded notes. The repository below owns the rows the app edits. */
export const NOTES: Note[] = generate()

export const notes = createRepository(NOTES, {
  searchKeys: ["title", "body"],
  filterKeys: ["archived", "pinned", "tone"],
})
