import { REFERENCE_DATE, createRepository, daysAgo, intBetween, pick, rowId, seeded } from "./core"

/** One piece of text turned into speech: the script, the voice and the knobs it was read with. */
export type VoiceJob = {
  id: string
  /** The script, at most 2,000 characters. */
  text: string
  voice: "Ada" | "Kai" | "Noor" | "Sol" | "Yuki"
  /** Playback rate, 0.5 (half speed) to 2 (double). */
  speed: number
  /** Semitones above or below the voice's own pitch, -6 to 6. */
  pitch: number
  /** How closely the read sticks to the voice, 0 (expressive) to 1 (steady). */
  stability: number
  /** How long the audio runs, in seconds — a rule over the script and the speed. */
  durationSec: number
  status: "done" | "queued"
  createdAt: Date
}

const COUNT = 20

const VOICES: readonly VoiceJob["voice"][] = ["Ada", "Kai", "Noor", "Sol", "Yuki"]

// The rates a reader actually picks: mostly normal, a notch either side.
const SPEEDS = [0.8, 0.9, 1, 1, 1, 1.1, 1.25, 1.5]

/** Spoken words per second at normal speed — the pace of a clear narrator. */
const WORDS_PER_SECOND = 2.5

// The things a product team sends to a voice: announcements, phone lines,
// narration, reminders. Every one is a script somebody would actually read.
const SCRIPTS = [
  "Welcome to Northwind. Your dashboards are ready, and your first report will arrive on Monday morning.",
  "Thanks for calling Northwind support. Our team is available Monday to Friday, nine to six, Central European Time.",
  "Your export has finished and is waiting in the downloads folder. Open it whenever you are ready.",
  "This week the team shipped faster filters, a redesigned invoice page and a fix for the double email on retries.",
  "Press one to check the status of an order. Press two to speak with a member of the team.",
  "Good morning. You have three tasks due today and one review waiting for your comment.",
  "The maintenance window opens at midnight and closes at two. Dashboards stay readable; exports pause until it ends.",
  "Your workspace has grown past ten seats. Upgrade to the Team plan to keep every seat active.",
  "Chapter one. The harbour was quiet at dawn, and the boats sat low in the water with their nets folded.",
  "New sign-in from an unrecognised device in Lisbon. If this was you, no action is needed.",
  "Signups rose twelve percent week over week, driven by the launch post and a steady referral stream.",
  "Reminder: your trial ends on Friday. Pick a plan to keep the dashboards you have built.",
  "Thank you for your order. It has been packed and will leave the warehouse this afternoon.",
  "The incident is resolved. Exports have caught up, and no data was lost during the delay.",
  "Meeting notes, Tuesday. We agreed to move the pricing toggle above the fold and to test it for two weeks.",
  "Hello and welcome to the product tour. In the next two minutes we will set up your first data source.",
  "Your invoice for September is ready. The total is unchanged from last month.",
  "Tip of the day: press the slash key anywhere in the app to open the command palette.",
  "The quarterly review starts in five minutes in the main room. Bring the retention numbers.",
  "Recording ends here. Thanks for listening, and see you in the next update.",
]

/**
 * How long a script runs at a speed: the words in it at 2.5 a second, slower
 * at a lower rate and faster at a higher one, to a tenth of a second. The
 * voice page's `synthesize` action reads the same rule, so a job made at
 * runtime is timed exactly like a seeded one.
 */
export function durationFor(text: string, speed: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 0
  return Math.round((words / WORDS_PER_SECOND / speed) * 10) / 10
}

const HOUR = 1 / 24

function generate(): VoiceJob[] {
  const rand = seeded("voice-jobs")

  return SCRIPTS.slice(0, COUNT).map((text, index) => {
    // The two newest jobs are still in the queue; everything older has rendered.
    const hoursAgo = index < 2 ? 0.1 + index * 0.3 : intBetween(rand, 2, 30 * 24)
    const speed = pick(rand, SPEEDS)
    return {
      id: rowId("voi", index + 1),
      text,
      voice: pick(rand, VOICES),
      speed,
      pitch: intBetween(rand, -3, 3),
      stability: Math.round(rand() * 100) / 100,
      durationSec: durationFor(text, speed),
      status: hoursAgo < 1 ? "queued" : "done",
      createdAt: daysAgo(hoursAgo * HOUR, REFERENCE_DATE),
    }
  })
}

/** The seeded history. The repository below owns the rows the voice page prepends to. */
export const VOICE_JOBS: VoiceJob[] = generate()

export const voiceJobs = createRepository(VOICE_JOBS, {
  searchKeys: ["text"],
  filterKeys: ["voice", "status"],
})
