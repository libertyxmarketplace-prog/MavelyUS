import {
  REFERENCE_DATE,
  chance,
  createRepository,
  daysAhead,
  emailFor,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { avatarFor } from "./avatars"

/** One booked visit at the clinic: who, with whom, when, and what came of it. */
export type Appointment = {
  id: string
  patient: string
  /** A face for the patient — the kit's own avatar route for the name — */
  avatarUrl?: string
  email: string
  /**
   * The patient's number in E.164, the same on every visit of theirs, from
   * the numbers kept for fiction: London's drama range, +44 20 7946
   * 0000–0999, or the US 555-0100–0199 block. Optional: a field the book grew.
   */
  phone?: string
  /** "Dr. Amara Osei" — written the way the schedule prints it. */
  doctor: string
  department: "Cardiology" | "Neurology" | "Oncology" | "Pediatrics" | "Orthopedics"
  at: Date
  durationMin: number
  status: "scheduled" | "checked_in" | "done" | "cancelled"
  /** What was done, when the visit was more than a consultation. */
  procedure?: string
  /** True when this visit was the patient's first at the clinic. */
  isNewPatient: boolean
}

const COUNT = 160

const FIRST_NAMES = [
  "Ana", "Bilal", "Clara", "Daniel", "Elif", "Femi", "Grace", "Hugo",
  "Ines", "Jonas", "Kaia", "Leon", "Mira", "Noah", "Olivia", "Pavel",
  "Rosa", "Samir", "Tessa", "Umar", "Vera", "Wren", "Yara", "Zane",
]

const LAST_NAMES = [
  "Almeida", "Baker", "Chen", "Dahl", "Ekwueme", "Fischer", "Garcia", "Hoffmann",
  "Ibrahim", "Jensen", "Kowalski", "Lindqvist", "Mendes", "Novak", "Okafor", "Petrova",
]

const DOMAINS = ["mail.example", "inbox.example", "post.example", "example.org"]

// Each doctor belongs to one department, so a visit's doctor and department
// never disagree; the list is what the schedule offers.
const DOCTORS: readonly (readonly [string, Appointment["department"]])[] = [
  ["Dr. Amara Osei", "Cardiology"],
  ["Dr. Tomas Lind", "Cardiology"],
  ["Dr. Priya Raman", "Neurology"],
  ["Dr. Elias Berg", "Neurology"],
  ["Dr. Hana Sato", "Oncology"],
  ["Dr. Marcus Reid", "Oncology"],
  ["Dr. Lucia Ferrer", "Pediatrics"],
  ["Dr. Kofi Mensah", "Pediatrics"],
  ["Dr. Ingrid Vos", "Orthopedics"],
  ["Dr. Rafael Duarte", "Orthopedics"],
]

// Three procedures a department books most, so the ranking on the dashboard
// has a head rather than twenty names with three visits each.
const PROCEDURES: Record<Appointment["department"], readonly string[]> = {
  Cardiology: ["Echocardiogram", "Stress test", "Holter fitting"],
  Neurology: ["EEG", "Nerve conduction study", "MRI review"],
  Oncology: ["Chemotherapy session", "Biopsy", "Port placement"],
  Pediatrics: ["Vaccination", "Growth assessment", "Hearing screen"],
  Orthopedics: ["Joint injection", "Cast fitting", "Physiotherapy review"],
}

const DURATIONS = [15, 30, 30, 45, 60, 90] as const

/**
 * Where a visit sits in time. The book runs six months back — enough for a
 * chart by month — and three weeks ahead. The two thirty-day windows behind
 * "now" are weighted close to each other, so a month-on-month delta reads
 * as growth rather than as a cliff, and today gets a few visits of its own so
 * a calendar opening on it has a list to show — three of them, brought forward
 * below, still ahead of "now" for the desk to check in.
 */
const WINDOW_MIX: readonly (readonly [[number, number], number])[] = [
  [[-180, -61], 0.24],
  [[-60, -31], 0.28],
  [[-30, -1], 0.22],
  [[0, 0], 0.04],
  [[1, 21], 0.22],
]

/** A clinic slot: a weekday between 08:00 and 16:45 UTC, on a quarter hour. */
function slotOn(rand: () => number, dayOffset: number): Date {
  const day = daysAhead(dayOffset)
  const base = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())
  const hour = intBetween(rand, 8, 16)
  const quarter = intBetween(rand, 0, 3) * 15
  return new Date(base + hour * 3_600_000 + quarter * 60_000)
}

/** The last quarter hours of the reference day the desk can still fill: from 16:00 on. */
const LATE_FROM_MIN = 16 * 60
const QUARTER_MS = 15 * 60_000

/**
 * The end of the reference day, where a desk opening the book at 15:40 still
 * has patients to check in. The draw leaves nothing booked on it after then —
 * today's visits all fall in the morning — so the three visits nearest ahead
 * are brought forward onto it: the same patients, doctors, lengths and
 * procedures, only the day moved, each from 16:00 on a quarter hour and after
 * the one before it with the same doctor. They are still the first three rows
 * ahead of now, so no other row moves and no id changes.
 */
function bringForward(rows: Appointment[]): Appointment[] {
  const first = rows.findIndex((row) => row.at.getTime() > REFERENCE_DATE.getTime())
  if (first < 0) return rows
  const day = Date.UTC(REFERENCE_DATE.getUTCFullYear(), REFERENCE_DATE.getUTCMonth(), REFERENCE_DATE.getUTCDate())
  const freeFrom = new Map<string, number>()

  return rows.map((row, index) => {
    const slot = index - first
    if (slot < 0 || slot > 2) return row
    const earliest = day + (LATE_FROM_MIN + slot * 15) * 60_000
    const start = Math.ceil(Math.max(earliest, freeFrom.get(row.doctor) ?? 0) / QUARTER_MS) * QUARTER_MS
    freeFrom.set(row.doctor, start + row.durationMin * 60_000)
    return { ...row, at: new Date(start), status: "scheduled" as const }
  })
}

/** The area codes the US numbers are written under; the 555-0100–0199 block is kept for fiction in each. */
const AREA_CODES = ["202", "312", "415", "617"] as const

/**
 * One number for each patient, drawn by name in the order the book first
 * meets them, from a stream of its own — so no other draw moves — half from
 * London's drama range and half from the US block, never one another patient
 * already has.
 */
function phonesFor(rows: Appointment[]): Map<string, string> {
  const rand = seeded("appointments:phones")
  const phones = new Map<string, string>()
  const taken = new Set<string>()
  for (const { patient } of rows) {
    if (phones.has(patient)) continue
    let phone: string
    do {
      phone = chance(rand, 0.5)
        ? `+442079460${String(intBetween(rand, 0, 999)).padStart(3, "0")}`
        : `+1${pick(rand, AREA_CODES)}55501${String(intBetween(rand, 0, 99)).padStart(2, "0")}`
    } while (taken.has(phone))
    taken.add(phone)
    phones.set(patient, phone)
  }
  return phones
}

function generate(): Appointment[] {
  const rand = seeded("appointments")

  const drawn = Array.from({ length: COUNT }, (_, index) => {
    const [from, to] = pickWeighted(rand, WINDOW_MIX)
    let offset = intBetween(rand, from, to)
    // Clinics close at the weekend: nudge a Saturday or Sunday to Monday.
    const weekday = daysAhead(offset).getUTCDay()
    if (weekday === 6) offset += 2
    if (weekday === 0) offset += 1
    const at = slotOn(rand, offset)
    const past = at.getTime() <= REFERENCE_DATE.getTime()
    const today = daysAhead(offset).toISOString().slice(0, 10) === REFERENCE_DATE.toISOString().slice(0, 10)

    const [doctor, department] = pick(rand, DOCTORS)
    const status: Appointment["status"] = !past
      ? "scheduled"
      : today && chance(rand, 0.5)
        ? "checked_in"
        : chance(rand, 0.08)
          ? "cancelled"
          : "done"

    const name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`

    return {
      id: rowId("apt", index + 1),
      patient: name,
      avatarUrl: avatarFor(name),
      email: emailFor(name, pick(rand, DOMAINS)),
      doctor,
      department,
      at,
      durationMin: pick(rand, DURATIONS),
      status,
      // Half the book is procedures; the rest are consultations.
      procedure: chance(rand, 0.5) ? pick(rand, PROCEDURES[department]) : undefined,
      isNewPatient: chance(rand, 0.22),
    }
  }).sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((row, index) => ({ ...row, id: rowId("apt", index + 1) }))

  const book = bringForward(drawn)
  const phones = phonesFor(book)
  return book.map((row) => ({ ...row, phone: phones.get(row.patient) }))
}

/** The seeded book, oldest first. The repository below owns the rows the desk changes. */
export const APPOINTMENTS: Appointment[] = generate()

export const appointments = createRepository(APPOINTMENTS, {
  searchKeys: ["patient", "doctor", "email"],
  filterKeys: ["department", "status", "doctor"],
})
