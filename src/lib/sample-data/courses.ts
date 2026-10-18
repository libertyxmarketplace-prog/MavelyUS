import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { MEMBERS } from "./members"

/** One course in the academy's catalogue, and how far the signed-in learner is through it. */
export type Course = {
  id: string
  title: string
  category: "Web" | "Backend" | "Design" | "Data" | "Product"
  level: "intro" | "intermediate" | "advanced"
  /** Out of five, to one decimal, from 3.5 up: a catalogue keeps what it is proud of. */
  rating: number
  lessons: number
  /** How many learners have ever enrolled. */
  enrolled: number
  /** The share of enrolled learners who finished, 0–1. */
  completionRate: number
  /** A Member id: who teaches it. */
  instructorId: string
  /** The signed-in learner's own progress, 0–1; 0 is not started, 1 is done. */
  progress: number
  updatedAt: Date
}

// The catalogue is a list, not a random draw: a title and its category are
// written together, so "SQL for Analysts" can never land under Design.
const CATALOG: readonly (readonly [string, Course["category"]])[] = [
  ["Introduction to React", "Web"],
  ["TypeScript for Application Code", "Web"],
  ["CSS Layout Systems", "Web"],
  ["Shipping with Next.js", "Web"],
  ["Accessible Interfaces", "Web"],
  ["Node.js API Development", "Backend"],
  ["PostgreSQL Performance", "Backend"],
  ["Event-driven Architecture", "Backend"],
  ["Authentication from Scratch", "Backend"],
  ["Observability in Practice", "Backend"],
  ["Design Systems", "Design"],
  ["Interface Typography", "Design"],
  ["Prototyping Interactions", "Design"],
  ["Colour for Interfaces", "Design"],
  ["Motion Principles", "Design"],
  ["SQL for Analysts", "Data"],
  ["Data Modelling", "Data"],
  ["Statistics for Product Teams", "Data"],
  ["Dashboards That Get Read", "Data"],
  ["Building Data Pipelines", "Data"],
  ["Product Discovery", "Product"],
  ["Writing a Product Brief", "Product"],
  ["Roadmaps and Trade-offs", "Product"],
  ["Pricing and Packaging", "Product"],
]

const LEVEL_MIX: readonly (readonly [Course["level"], number])[] = [
  ["intro", 0.4],
  ["intermediate", 0.4],
  ["advanced", 0.2],
]

// Most of the catalogue the learner has not opened; a good third is under
// way and a handful is finished, so a progress column reads three ways.
const PROGRESS_MIX: readonly (readonly ["untouched" | "doing" | "done", number])[] = [
  ["untouched", 0.42],
  ["doing", 0.38],
  ["done", 0.2],
]

function generate(): Course[] {
  const rand = seeded("courses")
  const instructors = MEMBERS.filter((member) => member.status === "active").map((member) => member.id)

  return CATALOG.map(([title, category], index) => {
    const level = pickWeighted(rand, LEVEL_MIX)
    const state = pickWeighted(rand, PROGRESS_MIX)
    // Tenths, so the table's "60%" is the number the row carries.
    const progress =
      state === "untouched" ? 0 : state === "done" ? 1 : intBetween(rand, 1, 9) / 10
    const enrolled = intBetween(rand, 120, 2_400)

    return {
      id: rowId("crs", index + 1),
      title,
      category,
      level,
      rating: intBetween(rand, 35, 50) / 10,
      lessons: intBetween(rand, 8, 42),
      enrolled,
      // A harder course loses more people on the way through.
      completionRate: Math.round((level === "advanced" ? 0.42 : level === "intermediate" ? 0.58 : 0.7) * 100 + intBetween(rand, -8, 18)) / 100,
      instructorId: pick(rand, instructors),
      progress,
      // A course the learner is on was touched recently; the rest, whenever.
      updatedAt:
        state === "doing" && chance(rand, 0.8)
          ? dateBetween(rand, daysAgo(21), REFERENCE_DATE)
          : dateBetween(rand, daysAgo(240), REFERENCE_DATE),
    }
  })
}

/** The seeded catalogue. The repository below owns the rows a learner moves through. */
export const COURSES: Course[] = generate()

export const courses = createRepository(COURSES, {
  searchKeys: ["title"],
  filterKeys: ["category", "level", "instructorId"],
})
