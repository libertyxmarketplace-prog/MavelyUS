import { mockAuthAdapter } from "@/lib/auth-adapter"
import { REFERENCE_DATE, db, isRecord, isWhole, type Customer, type Result } from "@/lib/sample-data"
import { isEmail } from "@/lib/validation"

import { PLANS } from "./fields"

/** One row as the mapping left it: a value per target field, everything a string. */
export type ImportRow = {
  /** The line the row was on in the file, header counted, so a refusal can name it. */
  line: number
  values: Record<string, string>
}

/** Why one row was not written. */
export type ImportRefusal = { line: number; message: string }

/** What an import did. */
export type ImportSummary = {
  imported: number
  skipped: number
  refusals: ImportRefusal[]
}

// Whoever owns the workspace holds an imported account until someone reassigns
// it; a row arriving with no owner at all would be invisible on every page that
// groups customers by the teammate who looks after them. Read per import, never
// held at module scope.
const importer = () => db.members.all().find((member) => member.role === "owner") ?? db.members.all()[0]

/** The longest a cell may run, by field — what the customers table draws, not what a file can hold. */
const MAX_LENGTH: Record<string, number> = { name: 120, email: 254, company: 120, country: 60, plan: 20, seats: 7, mrrCents: 20 }

/** The most an imported account can pay a month, in cents ($100,000,000), and the most seats it holds. */
const MAX_MRR_CENTS = 10_000_000_000
const MAX_SEATS = 1_000_000

/** One cell as text: "" for a cell the row does not have, or one that is not text. */
function cell(values: Record<string, unknown>, key: string): string {
  const value = values[key]
  return typeof value === "string" ? value.trim() : ""
}

/** The complaint about one row, or null when there is nothing wrong with it. */
function refuse(values: Record<string, unknown>): string | null {
  const name = cell(values, "name")
  const email = cell(values, "email")
  const company = cell(values, "company")
  const plan = cell(values, "plan").toLowerCase()
  const seats = cell(values, "seats")
  const mrr = cell(values, "mrrCents")

  for (const [key, max] of Object.entries(MAX_LENGTH)) {
    if (cell(values, key).length > max) return `${key === "mrrCents" ? "MRR" : key[0].toUpperCase() + key.slice(1)} runs past ${max} characters.`
  }
  if (name === "") return "Name is empty."
  if (email === "") return "Email is empty."
  if (!isEmail(email)) return `Email "${email}" is not an address.`
  if (company === "") return "Company is empty."
  if (plan !== "" && !(PLANS as string[]).includes(plan)) {
    return `Plan "${plan}" is not one of ${PLANS.join(", ")}.`
  }
  if (seats !== "" && !/^\d+$/.test(seats)) return `Seats "${seats}" is not a whole number.`
  if (seats !== "" && Number(seats) > MAX_SEATS) return `Seats "${seats}" is more than ${MAX_SEATS.toLocaleString("en-US")}.`
  if (mrr !== "" && toCents(mrr) === undefined) return `MRR "${mrr}" is not an amount up to $100,000,000.`
  return null
}

/**
 * Dollars as written in a spreadsheet — "1,840", "$1840.50" — as whole cents;
 * undefined for an amount past `MAX_MRR_CENTS`, which a row is refused for.
 */
function toCents(value: string): number | undefined {
  const cleaned = value.replace(/[^0-9.]/g, "")
  const amount = Number.parseFloat(cleaned)
  if (!Number.isFinite(amount)) return 0
  const cents = Math.round(amount * 100)
  return cents <= MAX_MRR_CENTS ? cents : undefined
}

// A single import writes rows one at a time (see below) rather than in a
// batch, so a file with no real ceiling would tie up the request for however
// long an unbounded loop over it takes. 5,000 is comfortably above any file a
// spreadsheet export produces by hand and comfortably below where that loop
// becomes the problem.
const MAX_ROWS = 5000

/**
 * Writes the mapped rows into `db.customers`, one at a time, and reports what
 * happened to each.
 *
 * A row that fails a check is refused by line number rather than dropped, and
 * one bad row never stops the others: an import that gave up halfway would
 * leave the reader with a store they cannot reason about. `Result` is only
 * `ok: false` when nothing could be attempted at all — every per-row outcome
 * is inside the summary, which is what the page renders.
 */
export async function importCustomers(rows: ImportRow[]): Promise<Result<ImportSummary>> {
  if (!Array.isArray(rows)) {
    return { ok: false, error: { code: "invalid_input", message: "Send the file's rows to import." } }
  }
  if (rows.length === 0) {
    return { ok: false, error: { code: "empty", message: "There are no rows to import." } }
  }
  if (rows.length > MAX_ROWS) {
    return {
      ok: false,
      error: {
        code: "too-many",
        message: `This file has ${rows.length} rows; import ${MAX_ROWS} or fewer at a time.`,
      },
    }
  }

  const refusals: ImportRefusal[] = []
  let imported = 0
  const owner = importer()

  for (const [index, row] of rows.entries()) {
    // The line a refusal names is the file's, or the row's place in it when
    // the row does not say.
    const line = isRecord(row) && isWhole(row.line, 1, Number.MAX_SAFE_INTEGER) ? row.line : index + 2
    const values = isRecord(row) && isRecord(row.values) ? row.values : undefined
    const complaint = values ? refuse(values) : "The row holds no values."
    if (!values || complaint) {
      refusals.push({ line, message: complaint ?? "The row holds no values." })
      continue
    }

    const seats = Number.parseInt(cell(values, "seats"), 10)
    const created = await db.customers.create({
      name: cell(values, "name"),
      email: cell(values, "email"),
      company: cell(values, "company"),
      plan: (cell(values, "plan").toLowerCase() || "free") as Customer["plan"],
      // An imported account is live from the moment it arrives; nothing in a
      // CSV says otherwise, and inventing a status would be a lie about it.
      status: "active",
      mrrCents: toCents(cell(values, "mrrCents")) ?? 0,
      seats: Number.isFinite(seats) && seats > 0 ? seats : 1,
      country: cell(values, "country") || "Unknown",
      createdAt: REFERENCE_DATE,
      lastSeenAt: REFERENCE_DATE,
      owner: owner.id,
    })

    if (created.ok) imported += 1
    else refusals.push({ line, message: created.error.message })
  }

  return { ok: true, data: { imported, skipped: refusals.length, refusals } }
}

/**
 * The other thing this page changes: signing out. A server action so the page
 * can stay a server component and still hand the shell something to call.
 */
export async function signOut(): Promise<Result<{ signedOut: true }>> {
  await mockAuthAdapter.signOut()
  return { ok: true, data: { signedOut: true } }
}
