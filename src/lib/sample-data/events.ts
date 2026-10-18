import {
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { MEMBERS } from "./members"

/** A calendar entry: a meeting, a deadline, a release, or someone's time off. */
export type Event = {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  allDay?: boolean
  kind: "meeting" | "deadline" | "release" | "ooo"
  /** Member ids. */
  attendees: string[]
  location?: string
}

const COUNT = 80

const KIND_MIX: readonly (readonly [Event["kind"], number])[] = [
  ["meeting", 0.5],
  ["deadline", 0.15],
  ["release", 0.15],
  ["ooo", 0.2],
]

const MEETING_TITLES = [
  "Weekly Sync",
  "Sprint Planning",
  "Design Review",
  "All-Hands",
  "Roadmap Review",
  "Customer Call",
  "Stakeholder Update",
  "Retro",
]

const DEADLINE_TITLES = [
  "Q3 Report Due",
  "Budget Submission Due",
  "Contract Renewal Due",
  "Compliance Review Due",
  "Launch Readiness Deadline",
  "Content Freeze",
  "Code Freeze",
  "Renewal Deadline",
]

const RELEASE_TITLES = [
  "v2.4 Release",
  "Mobile App Release",
  "API v3 Release",
  "Public Beta Release",
  "Feature Flag Rollout",
  "Platform Upgrade Release",
  "Security Patch Release",
]

// Where a meeting happens: a room, or a call — never a named product.
const LOCATIONS = ["Video call", "Phone call", "Conference Room A", "Conference Room B", "HQ — 4th Floor"]

function generate(): Event[] {
  const rand = seeded("events")
  // Nobody invited to a meeting has left, or been deactivated.
  const activeMembers = MEMBERS.filter((row) => row.status === "active")

  return Array.from({ length: COUNT }, (_, index) => {
    const kind = pickWeighted(rand, KIND_MIX)
    // Roughly four weeks either side of "now" — eight weeks in total.
    const startsAt = dateBetween(rand, daysAgo(28), daysAhead(28))

    let title: string
    let attendees: string[]
    let endsAt: Date
    let allDay: boolean | undefined = undefined
    let location: string | undefined = undefined

    if (kind === "meeting" && chance(rand, 0.2)) {
      // A 1:1 lists just the other person — "you" are the calendar owner.
      const withMember = pick(rand, activeMembers)
      title = `1:1 with ${withMember.name.split(" ")[0]}`
      attendees = [withMember.id]
      location = pick(rand, LOCATIONS)
      endsAt = daysAhead((intBetween(rand, 2, 8) * 15) / 1440, startsAt)
    } else if (kind === "meeting") {
      title = pick(rand, MEETING_TITLES)
      attendees = shuffle(rand, activeMembers)
        .slice(0, intBetween(rand, 2, 6))
        .map((row) => row.id)
      location = pick(rand, LOCATIONS)
      // 30-120 minutes, in 15-minute increments.
      endsAt = daysAhead((intBetween(rand, 2, 8) * 15) / 1440, startsAt)
    } else if (kind === "deadline") {
      title = pick(rand, DEADLINE_TITLES)
      attendees = shuffle(rand, activeMembers)
        .slice(0, intBetween(rand, 1, 3))
        .map((row) => row.id)
      allDay = true
      endsAt = startsAt
    } else if (kind === "release") {
      title = pick(rand, RELEASE_TITLES)
      attendees = shuffle(rand, activeMembers)
        .slice(0, intBetween(rand, 1, 3))
        .map((row) => row.id)
      location = pick(rand, LOCATIONS)
      // A one-to-six-hour rollout window.
      endsAt = daysAhead(intBetween(rand, 1, 6) / 24, startsAt)
    } else {
      const member = pick(rand, activeMembers)
      title = `Out of Office — ${member.name.split(" ")[0]}`
      attendees = [member.id]
      allDay = chance(rand, 0.6)
      endsAt = daysAhead(intBetween(rand, 1, 5), startsAt)
    }

    return {
      id: rowId("evt", index + 1),
      title,
      startsAt,
      endsAt,
      // Left unset rather than `false`, same as `Member.avatarUrl`.
      ...(allDay ? { allDay: true as const } : {}),
      kind,
      attendees,
      ...(location ? { location } : {}),
    }
  })
}

/** The seeded calendar. The repository below owns the rows a demo mutates. */
export const EVENTS: Event[] = generate()

export const events = createRepository(EVENTS, {
  searchKeys: ["title"],
  filterKeys: ["kind"],
})
