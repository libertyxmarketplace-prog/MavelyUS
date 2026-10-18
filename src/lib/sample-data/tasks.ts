import {
  REFERENCE_DATE,
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
import { PROJECTS } from "./projects"

/** One unit of work on a board: a column, an owner, an estimate and a window. */
export type Task = {
  id: string
  title: string
  /** The column a board puts it in. */
  status: "backlog" | "todo" | "in_progress" | "review" | "done"
  priority: "urgent" | "high" | "medium" | "low" | "none"
  /** A Member id: whoever has it. */
  assignee: string
  /** A Project id. */
  projectId: string
  /** The estimate, on the Fibonacci scale teams actually use. */
  points: number
  /** Midnight UTC on the day work is meant to start. */
  startAt: Date
  /** Midnight UTC on the day it is due. */
  dueAt: Date
  createdAt: Date
  updatedAt: Date
  labels: string[]
}

const COUNT = 72

const STATUS_MIX: readonly (readonly [Task["status"], number])[] = [
  ["backlog", 0.24],
  ["todo", 0.2],
  ["in_progress", 0.18],
  ["review", 0.14],
  ["done", 0.24],
]

const PRIORITY_MIX: readonly (readonly [Task["priority"], number])[] = [
  ["urgent", 0.08],
  ["high", 0.22],
  ["medium", 0.38],
  ["low", 0.22],
  ["none", 0.1],
]

const POINTS = [1, 2, 3, 5, 8] as const

const LABELS = ["api", "backend", "billing", "design", "docs", "infra", "mobile", "perf", "security", "web"]

const VERBS = [
  "Add",
  "Audit",
  "Backfill",
  "Cache",
  "Document",
  "Harden",
  "Instrument",
  "Migrate",
  "Rate-limit",
  "Refactor",
  "Retire",
  "Split",
  "Throttle",
  "Version",
]

const OBJECTS = [
  "the checkout webhook",
  "the invoice mailer",
  "the search index",
  "the seat-count job",
  "the session store",
  "the settings API",
  "the signup funnel",
  "the sync worker",
  "the usage rollup",
  "the webhook retries",
  "the audit trail",
  "the export queue",
  "the price ladder",
  "the onboarding tour",
  "the refund flow",
]

/**
 * Where a task's dates sit relative to the reference date, given its column.
 * `start` is an offset in days — negative is behind us — and `span` is how long
 * the work runs, so a column's bars land where a reader expects them on a
 * timeline: the backlog ahead of today, the finished work behind it.
 */
const WINDOW: Record<Task["status"], { start: [number, number]; span: [number, number] }> = {
  backlog: { start: [4, 30], span: [5, 21] },
  todo: { start: [-2, 9], span: [3, 14] },
  in_progress: { start: [-12, -2], span: [6, 20] },
  review: { start: [-20, -6], span: [8, 24] },
  done: { start: [-90, -20], span: [3, 18] },
}

/** Midnight UTC on the day `date` falls on — a task's window is whole days. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function generate(): Task[] {
  const rand = seeded("tasks")
  const assignees = MEMBERS.filter((member) => member.status === "active").map((member) => member.id)
  // A shipped project takes no new work, so a board never opens on a column of
  // tasks nobody is going to do.
  const open = PROJECTS.filter((project) => project.status !== "shipped")

  return Array.from({ length: COUNT }, (_, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    const project = pick(rand, status === "done" ? PROJECTS : open)
    const { start, span } = WINDOW[status]
    const startAt = utcDay(daysAhead(intBetween(rand, start[0], start[1])))
    const dueAt = utcDay(daysAhead(intBetween(rand, span[0], span[1]), startAt))

    // Created before the work opened; touched since, but never after "now".
    const createdAt = dateBetween(rand, daysAgo(120), new Date(Math.min(startAt.getTime(), REFERENCE_DATE.getTime())))
    const updatedAt = dateBetween(rand, createdAt, REFERENCE_DATE)

    // The draws stay in this order: the rows every block and test reads are
    // the ones this sequence has always produced.
    const title = `${pick(rand, VERBS)} ${pick(rand, OBJECTS)}`
    const priority = pickWeighted(rand, PRIORITY_MIX)
    const assignee = pick(rand, assignees)
    const points = pick(rand, POINTS)
    const labels = shuffle(rand, LABELS).slice(0, chance(rand, 0.35) ? 2 : 1)
    // A star is the label "starred" (the to-do list reads it): an open urgent
    // task carries one, so the list opens with a few starred rows rather than
    // none, and starring anything else is the reader's own act.
    if (priority === "urgent" && status !== "done") labels.push("starred")

    return {
      id: rowId("tsk", index + 1),
      title,
      status,
      priority,
      assignee,
      projectId: project.id,
      points,
      startAt,
      dueAt,
      createdAt,
      updatedAt,
      labels,
    }
  })
}

/** The seeded backlog. The repository below owns the rows a board moves. */
export const TASKS: Task[] = generate()

export const tasks = createRepository(TASKS, {
  searchKeys: ["title"],
  filterKeys: ["status", "priority", "assignee", "projectId"],
})
