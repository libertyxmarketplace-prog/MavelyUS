"use client"

import { SimpleTable, type SimpleTableColumn } from "@/components/ui/simple-table"

import { FIELDS, type FieldKey } from "../fields"

/** One previewed row: the line it came from, and a value per target field. */
export type PreviewRow = { line: number; values: Record<string, string> }

const COLUMNS: SimpleTableColumn<PreviewRow>[] = FIELDS.map((field) => ({
  key: field.key,
  header: field.label,
  cell: (row) => {
    const value = row.values[field.key as FieldKey] ?? ""
    // A blank cell says nothing about whether the column was mapped, so an
    // unfilled field is drawn as one rather than as empty space.
    return value.trim() === "" ? <span className="text-muted-foreground">—</span> : value
  },
}))

/** The first rows as they will be written, under the names they will be written to. */
export function ImportPreview({ rows, total }: { rows: PreviewRow[]; total: number }) {
  return (
    <SimpleTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => String(row.line)}
      size="sm"
      caption={`The first ${rows.length} of ${total} rows, as the mapping reads them.`}
      emptyMessage="Nothing in this file mapped to a field."
    />
  )
}
