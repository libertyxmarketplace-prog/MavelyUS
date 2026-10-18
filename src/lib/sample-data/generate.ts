export const REFERENCE_DATE = new Date("2026-09-04T15:40:00.000Z")

/** `rowId("cus", 1)` → `"cus_0001"`, so ids sort the way rows were generated. */
export function rowId(prefix: string, n: number, width = 4): string {
  return `${prefix}_${String(n).padStart(width, "0")}`
}

/**
 * `"Blue Harbor Labs"` → `"blue-harbor-labs"`. An accented letter folds to its
 * base letter first — `"Tomás"` → `"tomas"`, not `"tom-s"` — by decomposing it
 * (NFD) and dropping the combining marks.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * `"Blue Harbor Labs"` → `"blueharborlabs.example"`: on the reserved `.example`
 * top-level domain, so no address in the sample world is one somebody owns.
 */
export function domainFor(company: string, tld = "example"): string {
  return `${slugify(company).replace(/-/g, "")}.${tld}`
}

/** `"Ada Lovelace"` → `"ada.lovelace@<domain>"`. */
export function emailFor(name: string, domain: string): string {
  return `${slugify(name).replace(/-/g, ".")}@${domain}`
}

/** One item from a non-empty list. */
export function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]
}

/** One item from `[value, weight]` pairs; a zero weight is never picked. */
export function pickWeighted<T>(rand: () => number, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let ticket = rand() * total
  for (const [value, weight] of entries) {
    ticket -= weight
    if (ticket < 0) return value
  }
  return entries[entries.length - 1][0]
}

/** A whole number in `[min, max]`, both ends included. */
export function intBetween(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

/** True with probability `probability`; `chance(rand, 1)` always, `chance(rand, 0)` never. */
export function chance(rand: () => number, probability: number): boolean {
  return rand() < probability
}

const DAY_MS = 86_400_000

/** `days` before `from` — fractions welcome, so `daysAgo(1 / 24)` is an hour ago. */
export function daysAgo(days: number, from: Date = REFERENCE_DATE): Date {
  return new Date(from.getTime() - days * DAY_MS)
}

/** `days` after `from`, for the fields that are future dates by nature. */
export function daysAhead(days: number, from: Date = REFERENCE_DATE): Date {
  return new Date(from.getTime() + days * DAY_MS)
}

/** A minute-aligned date in `[start, end]`; `start` when `end` precedes it. */
export function dateBetween(rand: () => number, start: Date, end: Date): Date {
  const from = start.getTime()
  const to = end.getTime()
  if (to <= from) return new Date(from)
  const at = Math.floor((from + rand() * (to - from)) / 60_000) * 60_000
  return new Date(Math.min(Math.max(at, from), to))
}

/** A deterministic Fisher-Yates shuffle into a new array. */
export function shuffle<T>(rand: () => number, list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
