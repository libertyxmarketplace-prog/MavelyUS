import {
  REFERENCE_DATE,
  createRepository,
  dateBetween,
  daysAgo,
  emailFor,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { avatarFor } from "./avatars"
import { COURSES, type Course } from "./courses"

/** One place a student holds on a course, and how far through it they are. */
export type StudentEnrolment = {
  /** A Course id. */
  courseId: string
  /** How much of the course they have done, as a whole percentage, 0–100. */
  progress: number
  /** When they took the place. */
  startedAt: Date
}

/**
 * A learner on the academy's roster. `Course.enrolled` stays each course's own
 * lifetime figure; the places here are the learners the academy is looking
 * after now, so a course never has more of them than it has ever enrolled.
 */
export type Student = {
  id: string
  name: string
  email: string
  avatarUrl: string
  enrolled: StudentEnrolment[]
  lastActiveAt: Date
  /** A graduate has finished every course they hold; paused is away for three weeks or more. */
  status: "active" | "paused" | "graduated"
}

const COUNT = 80

const FIRST_NAMES = [
  "Adaeze", "Bram", "Carmen", "Devika", "Emeka", "Fatima", "Georgia", "Hyun",
  "Idris", "Julia", "Kasper", "Linnea", "Malik", "Nora", "Obinna", "Pilar",
  "Ravi", "Signe", "Theo", "Valentina",
]

const LAST_NAMES = [
  "Achebe", "Bianchi", "Carvalho", "Dang", "Eklund", "Farouk", "Gomez", "Horvath",
  "Iyer", "Juarez", "Kuznetsov", "Laurent", "Mensah", "Nguyen", "Pires", "Rahman",
  "Sandoval", "Tiwari", "Vogel", "Walsh",
]

// Reserved example domains (RFC 2606), so no generated address can be a real person's.
const EMAIL_DOMAINS = ["example.com", "example.net", "example.org", "mail.example"]

const STATUS_MIX: readonly (readonly [Student["status"], number])[] = [
  ["active", 0.7],
  ["paused", 0.2],
  ["graduated", 0.1],
]

// Most learners hold one or two places; a keen few carry four.
const PLACES_MIX: readonly (readonly [number, number])[] = [
  [1, 0.3],
  [2, 0.35],
  [3, 0.22],
  [4, 0.13],
]

const DAY_MS = 86_400_000

/** Added to every course's own figure when drawing places, so the smallest course is not left empty. */
const WEIGHT_FLOOR = 400

/** When the student was last in, by status: this fortnight, three weeks or more ago, or since they finished. */
function lastSeen(rand: () => number, status: Student["status"]): Date {
  if (status === "active") return dateBetween(rand, daysAgo(14), REFERENCE_DATE)
  if (status === "paused") return dateBetween(rand, daysAgo(120), daysAgo(21))
  return dateBetween(rand, daysAgo(90), daysAgo(3))
}

/**
 * `count` different courses, drawn without replacement and weighted by each
 * course's own enrolment figure, so the popular courses carry more of the
 * roster — on a floor, so a small course still has someone on it. A course
 * already holding as many students as it has ever enrolled is passed over:
 * the roster is a part of that figure, never more than it.
 */
function drawCourses(rand: () => number, count: number, held: Map<string, number>): Course[] {
  const open = COURSES.filter((course) => (held.get(course.id) ?? 0) < course.enrolled)
  const chosen: Course[] = []
  while (chosen.length < count && chosen.length < open.length) {
    const left = open.filter((course) => !chosen.includes(course))
    chosen.push(pickWeighted(rand, left.map((course) => [course, WEIGHT_FLOOR + course.enrolled] as const)))
  }
  return chosen
}

/**
 * How far a student has got: they learn at a pace of their own while they are
 * active, so progress is the days between taking the place and last being seen
 * times that pace, in whole percent. A place taken and never opened reads 0.
 */
function progressOn(rand: () => number, startedAt: Date, seen: Date): number {
  if (rand() < 0.08) return 0
  const days = (seen.getTime() - startedAt.getTime()) / DAY_MS
  const pace = 0.25 + rand() * 1.1
  return Math.min(100, Math.max(1, Math.round(days * pace)))
}

function generate(): Student[] {
  const rand = seeded("students")
  // Every pairing, shuffled once, so no two students share a name.
  const names = shuffle(
    rand,
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`))
  ).slice(0, COUNT)
  const held = new Map<string, number>()

  const rows = names.map((name, index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    const seen = lastSeen(rand, status)
    const courses = drawCourses(rand, pickWeighted(rand, PLACES_MIX), held)

    const enrolled = courses.map((course) => {
      held.set(course.id, (held.get(course.id) ?? 0) + 1)
      // A graduate took their places long enough ago to have finished them.
      const startedAt =
        status === "graduated" ? dateBetween(rand, daysAgo(320), daysAgo(120)) : dateBetween(rand, daysAgo(180), seen)
      const progress = status === "graduated" ? 100 : progressOn(rand, startedAt, seen)
      return { courseId: course.id, progress, startedAt }
    })

    // Anyone still studying has something left to finish: a learner who has
    // done every course they hold is a graduate, and the status says so.
    if (status !== "graduated" && enrolled.every((place) => place.progress === 100)) {
      const last = enrolled[enrolled.length - 1]
      last.progress = 40 + Math.floor(rand() * 56)
    }

    return {
      id: rowId("stu", index + 1),
      name,
      email: emailFor(name, pick(rand, EMAIL_DOMAINS)),
      avatarUrl: avatarFor(name),
      enrolled,
      lastActiveAt: seen,
      status,
    }
  })

  return rows
}

/** The seeded roster. The repository below owns the rows an enrolment changes. */
export const STUDENTS: Student[] = generate()

export const students = createRepository(STUDENTS, {
  searchKeys: ["name", "email"],
  filterKeys: ["status"],
})
