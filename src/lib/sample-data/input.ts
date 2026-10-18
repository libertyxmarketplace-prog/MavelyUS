import { REFERENCE_DATE } from "./generate"

/** A refusal: what the caller sent is not something this action takes. */
export type Refusal = { ok: false; error: { code: string; message: string; field?: string } }

/** The refusal for an argument of the wrong shape or out of range, naming the field when there is one. */
export function invalidInput(message: string, field?: string): Refusal {
  return { ok: false, error: field ? { code: "invalid_input", message, field } : { code: "invalid_input", message } }
}

/** A plain object — not null, an array, a Map, a Date or a FormData. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * The fields of an object argument, or none: `fields(input)` is `input` when it
 * is a plain object and `{}` otherwise, so reading a field of a string, a
 * `null` or an array is `undefined` rather than a throw. Each field is still
 * whatever the caller sent — read it through the checks below.
 */
export function fields<T extends object>(value: T | null | undefined): Partial<T> {
  return isRecord(value) ? (value as Partial<T>) : {}
}

/** A FormData — what a form action is handed, and nothing else it can be sent. */
export function isForm(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData
}

/** A form field as trimmed text: "" when the form has no such field, or holds a file there. */
export function formText(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === "string" ? value.trim() : ""
}

/** `value` when it is a string, else "". Trim and cap it with `text` when it is going into the store. */
export function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/**
 * `value` trimmed, when it is a string no longer than `max` once trimmed;
 * `undefined` for anything else — a number, an object, a 900 KB string.
 */
export function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : undefined
}

/** Whether `value` is one of `allowed`: a member of the list, never a key some object inherits. */
export function oneOf<T extends string | number>(value: unknown, allowed: readonly T[]): value is T {
  return (typeof value === "string" || typeof value === "number") && allowed.includes(value as T)
}

/** Whether `key` is one of `table`'s own keys — so `table[key]` is its entry, never `Object.prototype`'s. */
export function ownKey<K extends string>(table: Record<K, unknown>, key: unknown): key is K {
  return typeof key === "string" && Object.hasOwn(table, key)
}

/** A whole number from `min` to `max`, both included, and within what a double counts exactly. */
export function isWhole(value: unknown, min: number, max: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max
}

/** A finite number from `min` to `max`, both included. */
export function isAmount(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
}

/**
 * A server-paged table's query as the server can answer it: every field of
 * `defaults`, taken from `value` when it is the same kind and in range, and
 * the default where it is not — so a crafted query reads as the table's own
 * view instead of throwing on `query.sort.id`. A number is a whole one from 1
 * (a page size at most `maxPageSize`); text runs to 200 characters; a filter
 * is a list of at most 50 short strings; a field named in `words` is one of
 * its words; and a sort — defaulted or not — is `{ id, desc }` with an id
 * the table may know. The table's own lookups still read only their own keys.
 */
export function tableQuery<Q extends object>(
  value: unknown,
  defaults: Q,
  rules: { words?: { [K in keyof Q]?: readonly string[] }; maxPageSize?: number } = {}
): Q {
  const sent = isRecord(value) ? value : {}
  const query: Record<string, unknown> = { ...(defaults as Record<string, unknown>) }
  const words = (rules.words ?? {}) as Record<string, readonly string[] | undefined>
  for (const key of new Set([...Object.keys(defaults), "sort"])) {
    const given = sent[key]
    const fallback = (defaults as Record<string, unknown>)[key]
    if (given === undefined) continue
    if (key === "sort") {
      if (isRecord(given) && typeof given.id === "string" && given.id.length <= 64) query.sort = { id: given.id, desc: given.desc === true }
    } else if (words[key]) {
      if (oneOf(given, words[key])) query[key] = given
    } else if (typeof fallback === "number") {
      if (isWhole(given, 1, key === "pageSize" ? (rules.maxPageSize ?? 100) : 1_000_000)) query[key] = given
    } else if (typeof fallback === "string") {
      if (typeof given === "string" && given.length <= 200) query[key] = given
    } else if (typeof fallback === "boolean") {
      if (typeof given === "boolean") query[key] = given
    } else if (Array.isArray(fallback)) {
      if (Array.isArray(given) && given.length <= 50 && given.every((entry) => typeof entry === "string" && entry.length <= 100)) query[key] = given
    }
  }
  return query as Q
}

/** The years a date in the store can fall in: none before the product, none past the century. */
const FIRST_YEAR = 1990
const LAST_YEAR = 2100

/**
 * A calendar day written `YYYY-MM-DD`, as the UTC midnight it names — when it
 * exists. `"2026-02-31"` does not (a `Date` would quietly roll it to March 3),
 * nor does a day outside `from`–`to` (by default 1990 to 2100), so a
 * `"9999-12-31"` or a `"+275760-09-12"` is refused rather than stored.
 */
export function calendarDay(value: unknown, span: { from?: Date; to?: Date } = {}): Date | undefined {
  if (typeof value !== "string") return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined
  return within(date, span) ? date : undefined
}

/**
 * An instant — a `Date`, or a string a `Date` reads — when it is a real one
 * inside `from`–`to` (by default 1990 to 2100). An Invalid Date, a year 9999
 * or a string that is not a date at all is `undefined`.
 */
export function instant(value: unknown, span: { from?: Date; to?: Date } = {}): Date | undefined {
  if (!(value instanceof Date) && typeof value !== "string") return undefined
  if (typeof value === "string" && value.length > 40) return undefined
  const date = new Date(value instanceof Date ? value.getTime() : value)
  return within(date, span) ? date : undefined
}

function within(date: Date, { from, to }: { from?: Date; to?: Date }): boolean {
  const time = date.getTime()
  if (Number.isNaN(time)) return false
  if (date.getUTCFullYear() < FIRST_YEAR || date.getUTCFullYear() > LAST_YEAR) return false
  return (!from || time >= from.getTime()) && (!to || time <= to.getTime())
}

/** `REFERENCE_DATE`'s year: the "this year" a card's expiry or a plan's renewal is measured from. */
export const REFERENCE_YEAR = REFERENCE_DATE.getUTCFullYear()
