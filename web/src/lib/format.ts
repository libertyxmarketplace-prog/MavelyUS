const DEFAULT_LOCALE = "en-US"

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/** Formats a number with locale thousands separators, e.g. 1234567.891 → "1,234,567.89". */
export function formatNumber(
  value: number,
  opts: { locale?: string; maximumFractionDigits?: number; minimumFractionDigits?: number } = {}
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2, minimumFractionDigits } = opts
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits }).format(value)
}

/** Abbreviates a number to its shortest human form, e.g. 1234567 → "1.2M", 950 → "950". */
export function formatCompact(value: number, opts: { locale?: string; maximumFractionDigits?: number } = {}): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = opts
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits }).format(value)
}

/** Formats a currency amount, e.g. 1234.5 → "$1,234.50"; pass `compact` to abbreviate large amounts. */
export function formatCurrency(
  value: number,
  currency = "USD",
  opts: { locale?: string; maximumFractionDigits?: number; compact?: boolean } = {}
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits, compact = false } = opts
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: maximumFractionDigits ?? (compact ? 1 : undefined),
  }).format(value)
}

/** Formats a 0..1 ratio as a percentage, e.g. 0.1234 → "12.3%". */
export function formatPercent(value: number, opts: { locale?: string; maximumFractionDigits?: number } = {}): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = opts
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits }).format(value)
}

/** Formats a signed change: a leading "+" for positive values, U+2212 (not a hyphen) for negative, and a plain "0%"/"0" for exactly zero. */
export function formatDelta(
  value: number,
  opts: { style?: "percent" | "number" | "compact"; locale?: string; maximumFractionDigits?: number } = {}
): string {
  const { style = "percent", locale = DEFAULT_LOCALE, maximumFractionDigits } = opts
  if (value === 0) return style === "percent" ? "0%" : "0"

  const sign = value > 0 ? "+" : "−"
  const magnitude = Math.abs(value)

  if (style === "compact") return `${sign}${formatCompact(magnitude, { locale, maximumFractionDigits: maximumFractionDigits ?? 1 })}`
  if (style === "number") {
    const digits = maximumFractionDigits ?? 0
    return `${sign}${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(magnitude)}`
  }
  const digits = maximumFractionDigits ?? 1
  return `${sign}${new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(magnitude)}`
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const

/** Formats a byte count at the largest binary unit that keeps it readable, e.g. 1536 → "1.5 KB". */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B"
  let value = bytes
  let unitIndex = 0
  while (Math.abs(value) >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  const rounded = parseFloat(value.toFixed(Math.max(0, decimals)))
  return `${rounded} ${BYTE_UNITS[unitIndex]}`
}

// Rounds once, to whole seconds, then derives every coarser unit by exact integer floor/modulo — never
// re-rounding a remainder — so a value that rounds up to a unit's modulus (e.g. 59.5s → 60s) carries over
// ("1m") instead of overshooting ("60s").
/** Formats a millisecond duration as a short human string, e.g. 5400000 → "1h 30m". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`

  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`

  const totalMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (totalMinutes < 60) return seconds > 0 ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`

  const totalHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (totalHours < 24) return minutes > 0 ? `${totalHours}h ${minutes}m` : `${totalHours}h`

  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`
}

/** How a date is rendered: which locale writes it, and which zone decides what day it is. */
export type DateFormatOptions = {
  locale?: string
  /**
   * IANA zone the instant is read in. Left off, the runtime's own zone decides
   * — right for a date the reader picked off a calendar, wrong for an instant
   * stored in UTC, which lands on the previous day west of Greenwich. Pass
   * `"UTC"` whenever the value came from a database rather than a date picker.
   */
  timeZone?: string
}

// Constructing an Intl.DateTimeFormat is the expensive part and each one is
// immutable, so they are shared by their options: a strip of 720 day tooltips
// built 720 formatters before this.
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>()

function dateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${options.dateStyle ?? ""}|${options.timeStyle ?? ""}|${options.timeZone ?? ""}`
  const cached = dateTimeFormatters.get(key)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat(locale, options)
  dateTimeFormatters.set(key, formatter)
  return formatter
}

/** Formats a date, e.g. medium: "Sep 4, 2026". Accepts a `Date`, ISO string, or epoch number, and a locale string or `{ locale, timeZone }`. */
export function formatDate(
  date: Date | string | number,
  style: "short" | "medium" | "long" = "medium",
  options: string | DateFormatOptions = {}
): string {
  const { locale = DEFAULT_LOCALE, timeZone } =
    typeof options === "string" ? { locale: options, timeZone: undefined } : options
  const value = date instanceof Date ? date : new Date(date)
  return dateTimeFormat(locale, { dateStyle: style, timeZone }).format(value)
}

/** Formats a date and the time on it, e.g. "Sep 4, 2026, 3:30 PM". Same zone rule as `formatDate`: pass `timeZone: "UTC"` for a stored instant. */
export function formatDateTime(
  date: Date | string | number,
  options: DateFormatOptions & {
    dateStyle?: "short" | "medium" | "long"
    timeStyle?: "short" | "medium"
  } = {}
): string {
  const { locale = DEFAULT_LOCALE, timeZone, dateStyle = "medium", timeStyle = "short" } = options
  const value = date instanceof Date ? date : new Date(date)
  return dateTimeFormat(locale, { dateStyle, timeStyle, timeZone }).format(value)
}

/**
 * Formats a date relative to `now` (default: current time): "just now" under
 * 45s, then "3m ago"/"in 2h", falling back to `formatDate(date, "short")` at
 * 7+ days; returns "" for an invalid date. The fallback is a calendar date of
 * a stored instant, so it is read in UTC unless `options.timeZone` says
 * otherwise: in the reader's own zone an instant after midnight UTC printed the
 * day before west of Greenwich, and the server's page and the browser's
 * disagreed.
 */
export function formatRelative(date: Date | string | number, now: Date = new Date(), options: DateFormatOptions = {}): string {
  const target = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(target.getTime()) || Number.isNaN(now.getTime())) return ""

  const diff = target.getTime() - now.getTime()
  const abs = Math.abs(diff)

  if (abs < 45_000) return "just now"
  if (abs >= 7 * DAY) return formatDate(target, "short", { timeZone: "UTC", ...options })

  const magnitude = abs < HOUR ? `${Math.round(abs / MINUTE)}m` : abs < DAY ? `${Math.round(abs / HOUR)}h` : `${Math.round(abs / DAY)}d`
  return diff < 0 ? `${magnitude} ago` : `in ${magnitude}`
}

/**
 * How a component formats a number it is handed: a function, or — what a
 * server component can pass across to a client one, since a function cannot
 * cross — the options of an `Intl.NumberFormat`, with the locale among them.
 */
export type NumberFormat = ((value: number) => string) | (Intl.NumberFormatOptions & { locale?: string })

/** The function a NumberFormat stands for; plain options become an `Intl.NumberFormat`. */
export function numberFormatter(format: NumberFormat): (value: number) => string {
  if (typeof format === "function") return format
  const { locale = DEFAULT_LOCALE, ...options } = format
  const formatter = new Intl.NumberFormat(locale, options)
  return (value) => formatter.format(value)
}

/** Clamps `n` to the inclusive [min, max] range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

/** Returns what percentage `part` is of `total`, or 0 when `total` is zero or negative. */
export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

/** Extracts up to `max` (default 2) uppercase initials from a name, e.g. "Ada Lovelace" → "AL". */
export function getInitials(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
