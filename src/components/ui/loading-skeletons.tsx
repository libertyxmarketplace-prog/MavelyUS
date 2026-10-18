import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// Fixed, not random: a placeholder that reshuffles on every render reads as a
// glitch, and random heights would differ between the server and the client.
const BAR_HEIGHTS = [52, 78, 41, 90, 64, 72, 35, 84, 58, 96, 47, 69]

/** Cell widths cycle so a skeleton table does not read as a perfect grid of identical bars. */
const CELL_WIDTHS = ["w-full", "w-4/5", "w-2/3", "w-3/4", "w-1/2"]

/**
 * Placeholder for a <StatCard>: label, value, and the delta row beneath it.
 * Hidden from assistive tech — announce loading with aria-busy on the region instead.
 */
function StatCardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-skeleton"
      aria-hidden="true"
      className={cn("flex flex-col gap-3 panel p-4", className)}
      {...props}
    >
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  )
}

export type TableSkeletonProps = React.ComponentProps<"div"> & {
  rows?: number
  columns?: number
}

/** Placeholder for a data table: one header row of hairline-separated cells, then body rows. */
function TableSkeleton({ className, rows = 5, columns = 4, ...props }: TableSkeletonProps) {
  const template = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }

  return (
    <div
      data-slot="table-skeleton"
      aria-hidden="true"
      className={cn("w-full overflow-hidden panel", className)}
      {...props}
    >
      <div
        data-slot="table-skeleton-header"
        className="grid gap-4 border-b border-rule bg-surface px-4 py-2.5"
        style={template}
      >
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          data-slot="table-skeleton-row"
          className="grid gap-4 border-b border-border px-4 py-3 last:border-b-0"
          style={template}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={cn("h-3.5", CELL_WIDTHS[(row + column) % CELL_WIDTHS.length])}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export type ChartSkeletonProps = React.ComponentProps<"div"> & {
  /** Plot height in pixels, matching the chart it stands in for. */
  height?: number
}

/** Placeholder for a chart: a legend, an axis, and a row of bars at settled heights. */
function ChartSkeleton({ className, height = 200, ...props }: ChartSkeletonProps) {
  return (
    <div
      data-slot="chart-skeleton"
      aria-hidden="true"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div
        data-slot="chart-skeleton-plot"
        className="flex items-end gap-2 border-b border-border"
        style={{ height }}
      >
        {BAR_HEIGHTS.map((barHeight, index) => (
          <Skeleton
            key={index}
            className="w-full rounded-t-sm rounded-b-none"
            style={{ height: `${barHeight}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }, (_, tick) => (
          <Skeleton key={tick} className="h-3 w-10" />
        ))}
      </div>
    </div>
  )
}

export type ListSkeletonProps = React.ComponentProps<"div"> & {
  rows?: number
  /** Adds a round avatar placeholder at the start of every row. */
  avatar?: boolean
}

/** Placeholder for a feed or activity list: an optional avatar and two lines per row. */
function ListSkeleton({ className, rows = 5, avatar = false, ...props }: ListSkeletonProps) {
  return (
    <div
      data-slot="list-skeleton"
      aria-hidden="true"
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          data-slot="list-skeleton-row"
          className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
        >
          {avatar ? (
            <Skeleton data-slot="list-skeleton-avatar" className="size-8 shrink-0 rounded-full" />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cn("h-3.5", CELL_WIDTHS[row % CELL_WIDTHS.length])} />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export type FormSkeletonProps = React.ComponentProps<"div"> & {
  fields?: number
}

/** Placeholder for a form: a label and control per field, then the submit row. */
function FormSkeleton({ className, fields = 3, ...props }: FormSkeletonProps) {
  return (
    <div
      data-slot="form-skeleton"
      aria-hidden="true"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    >
      {Array.from({ length: fields }, (_, field) => (
        <div key={field} data-slot="form-skeleton-field" className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}

export { ChartSkeleton, FormSkeleton, ListSkeleton, StatCardSkeleton, TableSkeleton }
