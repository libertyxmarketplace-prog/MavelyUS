export type CsvTable = { columns: string[]; rows: string[][] }

/** Every field of the file, in order, as rows of raw strings. */
function scan(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char !== '"') {
        field += char
        continue
      }
      // A doubled quote inside a quoted field is one literal quote; a single
      // one closes the field.
      if (text[index + 1] === '"') {
        field += '"'
        index += 1
        continue
      }
      quoted = false
      continue
    }

    if (char === '"' && field === "") {
      quoted = true
      continue
    }
    if (char === ",") {
      row.push(field)
      field = ""
      continue
    }
    if (char === "\n" || char === "\r") {
      // CRLF is one break, not two.
      if (char === "\r" && text[index + 1] === "\n") index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      continue
    }
    field += char
  }

  // Whatever the file ended on, unless it ended cleanly on a line break.
  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** True for a row a spreadsheet left behind: no cells, or one empty one. */
const blank = (row: string[]) => row.every((cell) => cell.trim() === "")

/**
 * The file as a header and its rows. A short row is padded to the header's
 * width so a mapping never reads past the end of it; a long one is kept whole,
 * because dropping a column silently is worse than showing one nothing maps to.
 */
export function parseCsv(text: string): CsvTable {
  const scanned = scan(text.replace(/^﻿/, "")).filter((row) => !blank(row))
  if (scanned.length === 0) return { columns: [], rows: [] }

  const columns = scanned[0].map((cell) => cell.trim())
  const rows = scanned.slice(1).map((row) =>
    row.length >= columns.length
      ? row
      : [...row, ...Array.from({ length: columns.length - row.length }, () => "")]
  )

  return { columns, rows }
}
