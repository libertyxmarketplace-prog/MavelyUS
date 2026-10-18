import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { formatDate, percentOf } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const uptimeBarDayVariants = cva("min-w-0 flex-1 rounded-[2px]", {
  variants: {
    status: {
      up: "bg-success",
      degraded: "bg-warning",
      down: "bg-danger",
      none: "bg-muted",
    },
    size: {
      default: "h-8",
      sm: "h-6",
    },
  },
  defaultVariants: { status: "up", size: "default" },
})

/** How one day went: up, degraded, down, or never measured. */
export type UptimeDayStatus = NonNullable<VariantProps<typeof uptimeBarDayVariants>["status"]>

/** How tall the strip stands. */
export type UptimeBarSize = NonNullable<VariantProps<typeof uptimeBarDayVariants>["size"]>

const DAY_WEIGHTS: Partial<Record<UptimeDayStatus, number>> = { up: 1, degraded: 0.5, down: 0 }

const DAY_LABELS: Record<UptimeDayStatus, string> = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
  none: "No data",
}

export type UptimeDay = {
  date: string | Date
  status: UptimeDayStatus
  label?: string
}

export function computeUptime(days: UptimeDay[]): number {
  let counted = 0
  let earned = 0
  for (const day of days) {
    const weight = DAY_WEIGHTS[day.status]
    if (weight === undefined) continue
    counted += 1
    earned += weight
  }
  if (counted === 0) return 100
  return percentOf(earned, counted)
}

function uptimeText(percent: number): string {
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(2)}%`
}

export type UptimeBarProps = React.ComponentProps<"div"> & {
  days: UptimeDay[]
  uptime?: number
  label?: React.ReactNode
  labelText?: string
  timeZone?: string
  showLegend?: boolean
  size?: UptimeBarSize
}

function UptimeBar({
  className,
  days,
  uptime,
  label,
  labelText,
  showLegend = true,
  size = "default",
  timeZone = "UTC",
  ...props
}: UptimeBarProps) {
  const percent = uptime ?? computeUptime(days)
  const reading = `${uptimeText(percent)} uptime`
  const first = days[0]
  const last = days[days.length - 1]

  const summary = [
    labelText ?? (typeof label === "string" ? label : "Daily status"),
    `${days.length} ${days.length === 1 ? "day" : "days"}`,
    reading,
  ].join(", ")

  return (
    <div
      data-slot="uptime-bar"
      data-size={size}
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      <div data-slot="uptime-bar-header" className="flex items-baseline justify-between gap-3">
        {label ? (
          <span
            data-slot="uptime-bar-label"
            className={cn(
              "min-w-0 truncate text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {label}
          </span>
        ) : (
          <span />
        )}
        <span
          data-slot="uptime-bar-uptime"
          className={cn(
            "shrink-0 font-medium tabular-nums",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {reading}
        </span>
      </div>

      <div
        data-slot="uptime-bar-track"
        role="group"
        aria-label={summary}
        className="flex w-full items-stretch gap-px"
      >
        {days.map((day, index) => {
          const date = formatDate(day.date, "medium", { timeZone })
          const detail = day.label
            ? `${DAY_LABELS[day.status]}. ${day.label}`
            : DAY_LABELS[day.status]

          return (
            <Tooltip key={index}>
              <TooltipTrigger
                render={
                  <span
                    data-slot="uptime-bar-day"
                    data-status={day.status}
                    role="img"
                    aria-label={`${date}: ${detail}`}
                    className={cn(uptimeBarDayVariants({ status: day.status, size }))}
                  />
                }
              />
              <TooltipContent className="flex-col items-start gap-0.5">
                <span className="font-medium">{date}</span>
                <span>{detail}</span>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {showLegend && first && last ? (
        <div
          data-slot="uptime-bar-legend"
          className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground"
        >
          <span>{formatDate(first.date, "medium", { timeZone })}</span>
          <span>{formatDate(last.date, "medium", { timeZone })}</span>
        </div>
      ) : null}
    </div>
  )
}

export { UptimeBar, uptimeBarDayVariants }
