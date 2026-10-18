import {
  createRepository,
  dateBetween,
  daysAgo,
  emailFor,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
  shuffle,
} from "./core"
import { avatarFor } from "./avatars"

/** Someone on the payroll: where they sit, what they do, and how the year is going. */
export type Employee = {
  id: string
  name: string
  email: string
  department: "Engineering" | "Design" | "Sales" | "Marketing" | "Finance" | "Support" | "People"
  role: string
  type: "fulltime" | "contract"
  status: "active" | "on_leave" | "remote"
  startedAt: Date
  /** The share of working days they were in, 0..1, over the last quarter. */
  attendanceRate: number
  /** The last review's score, 0..10. */
  kpi: number
  avatarUrl?: string
}

/** The company's own domain — the one the workspace brand is on. */
const COMPANY_DOMAIN = "northwind.example"

const COUNT = 96

const FIRST_NAMES = [
  "Ada", "Bastian", "Céline", "Dario", "Eleni", "Femi", "Gwen", "Hiro",
  "Isla", "Joaquín", "Kasia", "Leon", "Maren", "Nikolaj", "Orla", "Petra",
  "Rasmus", "Saoirse", "Tomás", "Uma", "Vera", "Wim", "Yara", "Zoltán",
]

const LAST_NAMES = [
  "Alvarez", "Bergström", "Chowdhury", "Delgado", "Engel", "Fontana", "Gruber", "Hoffmann",
  "Ibarra", "Joubert", "Kimura", "Lehmann", "Moreno", "Nilsson", "Okafor", "Pavlov",
  "Rinaldi", "Schäfer", "Takahashi", "Uribe", "Visser", "Wagner", "Yilmaz", "Zimmer",
]

const DEPARTMENT_MIX: readonly (readonly [Employee["department"], number])[] = [
  ["Engineering", 0.34],
  ["Design", 0.12],
  ["Sales", 0.16],
  ["Marketing", 0.1],
  ["Finance", 0.08],
  ["Support", 0.12],
  ["People", 0.08],
]

const ROLES: Record<Employee["department"], string[]> = {
  Engineering: ["Software engineer", "Senior engineer", "Staff engineer", "Engineering manager", "Site reliability engineer", "QA engineer"],
  Design: ["Product designer", "Senior designer", "Design lead", "UX researcher", "Brand designer"],
  Sales: ["Account executive", "Sales development rep", "Account manager", "Sales lead", "Solutions engineer"],
  Marketing: ["Content marketer", "Growth marketer", "Product marketer", "Marketing lead"],
  Finance: ["Accountant", "Financial analyst", "Controller", "Payroll specialist"],
  Support: ["Support engineer", "Support specialist", "Support lead", "Technical writer"],
  People: ["People partner", "Recruiter", "Office manager", "People operations lead"],
}

const TYPE_MIX: readonly (readonly [Employee["type"], number])[] = [
  ["fulltime", 0.82],
  ["contract", 0.18],
]

const STATUS_MIX: readonly (readonly [Employee["status"], number])[] = [
  ["active", 0.72],
  ["remote", 0.2],
  ["on_leave", 0.08],
]

function generate(): Employee[] {
  const rand = seeded("employees")
  // Every pairing, shuffled once, so no two colleagues share a name.
  const names = shuffle(
    rand,
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`))
  ).slice(0, COUNT)

  return names.map((name, index) => {
    const department = pickWeighted(rand, DEPARTMENT_MIX)
    const type = pickWeighted(rand, TYPE_MIX)
    const status = pickWeighted(rand, STATUS_MIX)
    // A contractor is a recent arrival more often than not.
    const startedDaysAgo = type === "contract" ? intBetween(rand, 10, 400) : intBetween(rand, 20, 2400)
    // Someone on leave has been out for part of the quarter.
    const attendance = status === "on_leave" ? intBetween(rand, 620, 840) : intBetween(rand, 840, 995)

    return {
      id: rowId("emp", index + 1),
      name,
      email: emailFor(name, COMPANY_DOMAIN),
      department,
      role: pick(rand, ROLES[department]),
      type,
      status,
      startedAt: dateBetween(rand, daysAgo(startedDaysAgo), daysAgo(startedDaysAgo - 1)),
      attendanceRate: attendance / 1000,
      kpi: intBetween(rand, 52, 98) / 10,
      avatarUrl: avatarFor(name),
    }
  })
}

/** The seeded payroll. The repository below owns the rows a page reads. */
export const EMPLOYEES: Employee[] = generate()

export const employees = createRepository(EMPLOYEES, {
  searchKeys: ["name", "email", "role"],
  filterKeys: ["department", "type", "status"],
})
