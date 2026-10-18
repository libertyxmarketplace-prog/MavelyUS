import * as React from "react"

import { AsyncButton } from "@/components/ui/async-button"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Stepper } from "@/components/ui/stepper"
import { Widget } from "@/components/ui/widget"

import { importCustomers, type ImportSummary } from "../actions"
import { parseCsv, type CsvTable } from "../csv"
import { FIELDS, PREVIEW_ROWS, SAMPLE_CSV, initialMapping, type FieldKey } from "../fields"
import { ColumnMapping, type Mapping } from "./column-mapping"
import { ImportPreview, type PreviewRow } from "./import-preview"

const STEPS = [
  { id: "file", title: "Choose a file", description: "A CSV with a header row" },
  { id: "map", title: "Map columns", description: "Each column to a field" },
  { id: "preview", title: "Preview", description: "The first rows, as read" },
  { id: "import", title: "Import", description: "What landed, and what did not" },
]

/** Every row as the mapping reads it: the file's own line, and a value per field. */
function mapRows(table: CsvTable, mapping: Mapping): PreviewRow[] {
  const pairs = Object.entries(mapping)
    .filter(([, field]) => field !== null)
    .map(([index, field]) => [Number(index), field as FieldKey] as const)

  return table.rows.map((row, index) => ({
    // The header is line 1, so the first data row is line 2 — which is the
    // line number a spreadsheet shows the reader.
    line: index + 2,
    values: Object.fromEntries(pairs.map(([column, field]) => [field, row[column] ?? ""])),
  }))
}

/** The required fields nothing has been mapped to yet. */
function missing(mapping: Mapping): string[] {
  const taken = new Set(Object.values(mapping).filter(Boolean))
  return FIELDS.filter((field) => field.required && !taken.has(field.key)).map(
    (field) => field.label
  )
}

/**
 * Drop a CSV, say what its columns are, look at what that produced, and write
 * it — four steps, all in the browser until the last one.
 *
 * The file is parsed here rather than uploaded: a reader deciding what a column
 * means should not have to wait for a round trip between each keystroke, and
 * nothing leaves the page until they press Import. That last step is a server
 * action, because writing rows is the one thing the browser must not do itself.
 */
export function ImportWizard() {
  const [step, setStep] = React.useState(0)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [table, setTable] = React.useState<CsvTable | null>(null)
  const [mapping, setMapping] = React.useState<Mapping>({})
  const [summary, setSummary] = React.useState<ImportSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  function load(name: string, text: string) {
    const parsed = parseCsv(text)
    if (parsed.columns.length === 0) {
      setError(`${name} has no header row, so there is nothing to map.`)
      return
    }
    setError(null)
    setFileName(name)
    setTable(parsed)
    setMapping(initialMapping(parsed.columns))
    setStep(1)
  }

  async function accept(files: File[]) {
    const file = files[0]
    if (!file) return
    load(file.name, await file.text())
  }

  function restart() {
    setStep(0)
    setFileName(null)
    setTable(null)
    setMapping({})
    setSummary(null)
    setError(null)
  }

  const rows = table ? mapRows(table, mapping) : []
  const unfilled = missing(mapping)

  return (
    <Widget
      title="Import"
      description="Bring a customer list in from a spreadsheet"
      contentClassName="flex flex-col gap-5"
      footer="Nothing leaves the browser until you press Import; the file itself is never uploaded."
    >
      <Stepper steps={STEPS} activeStep={step} size="sm" />

      {step === 0 ? (
        <div className="flex flex-col gap-3">
          <FileDropzone
            accept={[".csv", "text/csv"]}
            multiple={false}
            maxFiles={1}
            aria-label="CSV file"
            description="One CSV with a header row. It is read here in the browser, not uploaded."
            onFilesAccepted={accept}
          />
          {error ? (
            <Callout variant="danger" role="alert">
              {error}
            </Callout>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>No file to hand?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load("sample-customers.csv", SAMPLE_CSV)}
            >
              Use the sample file
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 && table ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {fileName} · {table.columns.length} columns · {table.rows.length} rows
          </p>
          <ColumnMapping
            columns={table.columns}
            sample={table.rows[0] ?? []}
            mapping={mapping}
            onChange={(index, field) => setMapping((current) => ({ ...current, [index]: field }))}
          />
          <p role="status" className="text-sm text-muted-foreground">
            {unfilled.length === 0
              ? "Every required field has a column."
              : `Still to map: ${unfilled.join(", ")}.`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={restart}>
              Choose another file
            </Button>
            <Button disabled={unfilled.length > 0} onClick={() => setStep(2)}>
              Preview
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 && table ? (
        <div className="flex flex-col gap-3">
          <ImportPreview rows={rows.slice(0, PREVIEW_ROWS)} total={rows.length} />
          {error ? (
            <Callout variant="danger" role="alert">
              {error}
            </Callout>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to mapping
            </Button>
            <AsyncButton
              onClick={async () => {
                const result = await importCustomers(rows)
                if (!result.ok) {
                  setError(result.error.message)
                  return
                }
                setError(null)
                setSummary(result.data)
                setStep(3)
              }}
            >
              {`Import ${rows.length} rows`}
            </AsyncButton>
          </div>
        </div>
      ) : null}

      {step === 3 && summary ? (
        <div className="flex flex-col gap-3">
          <Callout
            variant={summary.skipped === 0 ? "success" : "warning"}
            role="status"
            title={`${summary.imported} rows imported, ${summary.skipped} skipped`}
          >
            {summary.skipped === 0
              ? "Every row in the file was written."
              : "The rows below were left alone; the rest were written."}
          </Callout>

          {summary.refusals.length > 0 ? (
            <ul
              aria-label="Rows that were not imported"
              className="flex flex-col gap-1 panel p-3 text-sm"
            >
              {summary.refusals.map((refusal) => (
                <li key={refusal.line} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    Line {refusal.line}
                  </span>
                  <span>{refusal.message}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <Button variant="outline" onClick={restart}>
              Import another file
            </Button>
          </div>
        </div>
      ) : null}
    </Widget>
  )
}
