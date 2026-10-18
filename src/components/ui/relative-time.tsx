import * as React from "react"

import { cn } from "@/lib/utils"
import { useInterval } from "@/hooks/use-interval"
import { formatDate, formatRelative } from "@/lib/format"

const UNIT_WORDS: Record<string, string> = { m: "minute", h: "hour", d: "day" }

// formatRelative owns the thresholds — "just now" under 45 seconds, an
// absolute date from seven days out — so the long form re-reads its output
// rather than keeping a second set of rules that could drift from it.
const NARROW = /^(?:in )?(\d+)([mhd])( ago)?$/

/** Rewrites `formatRelative`'s narrow output into the requested shape, e.g. "3m ago" → "3 minutes ago" or "3m". */
function relativeText(
  date: Date | string | number,
  now: Date,
  format: "narrow" | "long",
  addSuffix: boolean
): string {
  const base = formatRelative(date, now)
  const match = NARROW.exec(base)
  // "just now", or the absolute-date fallback: neither takes a suffix.
  if (!match) return base

  const [, amount, unit, ago] = match
  const core =
    format === "long"
      ? `${amount} ${UNIT_WORDS[unit] ?? unit}${amount === "1" ? "" : "s"}`
      : `${amount}${unit}`
  if (!addSuffix) return core
  return ago ? `${core} ago` : `in ${core}`
}

export type RelativeTimeProps = React.ComponentProps<"time"> & {
  date: Date | string | number
  /**
   * What "now" is. Defaults to the machine clock, which is right for a live
   * page; a page whose figures are fixed to a reference date passes that date
   * instead, so its stamps do not drift away from them as the year turns. When
   * it is given, the machine clock plays no part in the stamp and the interval
   * that would refresh it does not start.
   */
  now?: Date
  /** Milliseconds between re-reads of the clock; null freezes the value. */
  updateInterval?: number | null
  format?: "narrow" | "long"
  addSuffix?: boolean
}

function RelativeTime({
  className,
  date,
  now: fixedNow,
  updateInterval = 60_000,
  format = "narrow",
  addSuffix = true,
  ...props
}: RelativeTimeProps) {
  const target = React.useMemo(() => (date instanceof Date ? date : new Date(date)), [date])
  const [clock, setClock] = React.useState(() => new Date())
  const now = fixedNow ?? clock

  useInterval(() => setClock(new Date()), fixedNow ? null : updateInterval)

  return (
    <time
      data-slot="relative-time"
      data-format={format}
      dateTime={target.toISOString()}
      // The exact moment stays one hover away, whatever the relative text says.
      title={formatDate(target, "long")}
      // The server and the client read their clocks a moment apart.
      suppressHydrationWarning
      className={cn("tabular-nums", className)}
      {...props}
    >
      {relativeText(target, now, format, addSuffix)}
    </time>
  )
}

export { RelativeTime }
