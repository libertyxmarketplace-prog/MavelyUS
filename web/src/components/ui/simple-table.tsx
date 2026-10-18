import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const simpleTableHeadVariants = cva(
  "bg-surface text-xs font-medium whitespace-nowrap text-muted-foreground",
  {
    variants: {
      size: { default: "h-9 px-3", sm: "h-8 px-2.5" },
      align: { left: "text-start", center: "text-center", right: "text-end" },
    },
    defaultVariants: { size: "default", align: "left" },
  }
)

const simpleTableCellVariants = cva("", {
  variants: {
    size: { default: "px-3", sm: "px-2.5" },
    // Numbers sit right on tabular figures; text stays where the reader starts.
    align: { left: "", center: "text-center", right: "text-end tabular-nums" },
  },
  defaultVariants: { size: "default", align: "left" },
})

const simpleTableRowVariants = cva("", {
  variants: {
    size: { default: "h-11", sm: "h-9" },
    // COUPLED TO registry/vibra/ui/table.tsx: TableRow highlights on hover by
    // default. A read-only summary table has nothing to hover towards, so the
    // false branch cancels it rather than leaving rows twitching under the
    // cursor; simple-table.test.tsx pins the data attribute that drives this.
    hoverable: { true: "", false: "hover:bg-transparent" },
    interactive: {
      true: "cursor-pointer focus-visible:bg-muted/50 focus-ring-inset",
      false: "",
    },
  },
  defaultVariants: { size: "default", hoverable: false, interactive: false },
})

export type SimpleTableColumn<T> = {
  /** Property to read when the column has no `cell`, and the column's own id. */
  key: string
  header: React.ReactNode
  align?: "left" | "right" | "center"
  /** Any CSS length; the browser treats it as a hint, not a hard constraint. */
  width?: string
  cell?: (row: T, index: number) => React.ReactNode
  className?: string
}

export type SimpleTableProps<T> = React.ComponentProps<"div"> & {
  columns: SimpleTableColumn<T>[]
  rows: T[]
  /** A property name or a function; must be unique across rows. */
  rowKey: keyof T | ((row: T) => string)
  caption?: React.ReactNode
  size?: NonNullable<VariantProps<typeof simpleTableRowVariants>["size"]>
  striped?: boolean
  hoverable?: boolean
  /** Cells for one footer row — totals, averages, a count. */
  footer?: React.ReactNode
  /**
   * Cells for each of several footer rows, top to bottom — a subtotal, a
   * discount, the tax and the total. Takes the place of `footer`.
   */
  footerRows?: React.ReactNode[]
  emptyMessage?: React.ReactNode
  onRowClick?: (row: T) => void
}

/** A read-only table you hand rows and columns; no sorting, filtering, or paging. */
function SimpleTable<T extends object>({
  className,
  columns,
  rows,
  rowKey,
  caption,
  size = "default",
  striped = false,
  hoverable = false,
  footer,
  footerRows,
  emptyMessage,
  onRowClick,
  ...props
}: SimpleTableProps<T>) {
  const interactive = Boolean(onRowClick)
  const highlight = hoverable || interactive

  const footers = footerRows ?? (footer ? [footer] : [])

  const keyOf = (row: T, index: number) =>
    typeof rowKey === "function" ? rowKey(row) : String(row[rowKey] ?? index)

  return (
    <div
      data-slot="simple-table"
      data-size={size}
      data-striped={striped || undefined}
      data-hoverable={hoverable || undefined}
      className={cn(
        "w-full overflow-hidden rounded-lg border",
        striped && "[&_tbody>tr:nth-child(even)]:bg-surface/60",
        className
      )}
      {...props}
    >
      {/* COUPLED TO registry/vibra/ui/table.tsx: the table primitive sets
          caption-bottom. A caption here is a label for the panel, so it belongs
          above the header band, not stranded under the last row. */}
      <Table className={caption ? "caption-top" : undefined}>
        {caption ? (
          <TableCaption className="mt-0 border-b bg-surface px-3 py-2 text-start text-xs font-medium text-foreground">
            {caption}
          </TableCaption>
        ) : null}

        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                data-align={column.align ?? "left"}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  simpleTableHeadVariants({ size, align: column.align }),
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <div
                  data-slot="simple-table-empty"
                  role="status"
                  className="flex items-center justify-center"
                >
                  {emptyMessage === undefined ? (
                    <EmptyState size="sm" title="No rows" description="Nothing to show here yet." />
                  ) : (
                    <span className="py-6 text-sm text-muted-foreground">{emptyMessage}</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={keyOf(row, index)}
                tabIndex={interactive ? 0 : undefined}
                onClick={interactive ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  interactive
                    ? (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return
                        event.preventDefault()
                        onRowClick?.(row)
                      }
                    : undefined
                }
                className={simpleTableRowVariants({ size, hoverable: highlight, interactive })}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    data-align={column.align ?? "left"}
                    className={cn(
                      simpleTableCellVariants({ size, align: column.align }),
                      column.className
                    )}
                  >
                    {column.cell
                      ? column.cell(row, index)
                      : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>

        {footers.length > 0 ? (
          <TableFooter>
            {footers.map((cells, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                {cells}
              </TableRow>
            ))}
          </TableFooter>
        ) : null}
      </Table>
    </div>
  )
}

export { SimpleTable, simpleTableCellVariants, simpleTableHeadVariants, simpleTableRowVariants }
