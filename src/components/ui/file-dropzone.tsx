import * as React from "react"
import { UploadIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format"
import { Button } from "@/components/ui/button"

export type DropzoneError = {
  file: File
  reason: "type" | "size" | "count"
}

export type ValidateFilesOptions = {
  /** Extensions (".csv"), wildcard mime ("image/*"), or exact mime ("text/csv"). */
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  /** Files already held, so the count rule spans more than one drop. */
  existing?: number
}

/** Whether a file matches one accept rule: an extension, a wildcard mime, or an exact mime. */
function matchesRule(file: File, rule: string): boolean {
  const pattern = rule.trim().toLowerCase()
  if (!pattern) return false
  if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern)
  const type = file.type.toLowerCase()
  if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1))
  return type === pattern
}

/** Splits files into the ones a dropzone will take and the ones it turns down, with the reason. */
export function validateFiles(
  files: File[],
  opts: ValidateFilesOptions
): { accepted: File[]; rejected: DropzoneError[] } {
  const { accept, maxSize, maxFiles, existing = 0 } = opts
  const accepted: File[] = []
  const rejected: DropzoneError[] = []

  for (const file of files) {
    // Rules run cheapest and most specific first, so a file that breaks several
    // is reported under the one worth telling the reader about.
    if (accept && accept.length > 0 && !accept.some((rule) => matchesRule(file, rule))) {
      rejected.push({ file, reason: "type" })
    } else if (maxSize !== undefined && file.size > maxSize) {
      rejected.push({ file, reason: "size" })
    } else if (maxFiles !== undefined && existing + accepted.length >= maxFiles) {
      rejected.push({ file, reason: "count" })
    } else {
      accepted.push(file)
    }
  }

  return { accepted, rejected }
}

export type FileDropzoneProps = React.ComponentProps<"div"> & {
  onFilesAccepted: (files: File[]) => void
  onFilesRejected?: (errors: DropzoneError[]) => void
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  /** Replaces the generated line about what is accepted and how large it may be. */
  description?: React.ReactNode
  /** The files already held; listed under the panel with their sizes. */
  value?: File[]
  /** Adds an X to each listed file; without it the list is read-only. */
  onRemove?: (file: File) => void
  /**
   * False keeps `value` counting towards maxFiles but draws no list, for a
   * parent that lists the files itself — FileUpload does, with progress.
   */
  listFiles?: boolean
}

/** A dashed panel that takes files by drag or by browse, listing what it took and what it turned down. */
function FileDropzone({
  className,
  onFilesAccepted,
  onFilesRejected,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  disabled = false,
  description,
  value,
  onRemove,
  listFiles = true,
  "aria-label": ariaLabel = "File upload",
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hintId = React.useId()
  const errorId = React.useId()
  const [dragging, setDragging] = React.useState(false)
  const [rejected, setRejected] = React.useState<DropzoneError[]>([])

  function take(files: File[]) {
    if (disabled || files.length === 0) return
    const result = validateFiles(files, {
      accept,
      maxSize,
      maxFiles,
      existing: value?.length ?? 0,
    })
    setRejected(result.rejected)
    if (result.accepted.length > 0) onFilesAccepted(result.accepted)
    if (result.rejected.length > 0) onFilesRejected?.(result.rejected)
  }

  // Written as a sentence rather than a run of separators: ".csv or .tsv up to
  // 5 MB, 3 files max".
  const types = accept && accept.length > 0 ? accept.join(" or ") : null
  const size = maxSize === undefined ? null : formatBytes(maxSize, 0)
  const hint =
    description ??
    [
      types && size ? `${types} up to ${size}` : (types ?? (size && `Up to ${size}`)),
      maxFiles === undefined ? null : `${maxFiles} ${maxFiles === 1 ? "file" : "files"} max`,
    ]
      .filter(Boolean)
      .join(", ")

  return (
    <div
      data-slot="file-dropzone"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      role="group"
      aria-label={ariaLabel}
      className={cn("group/dropzone flex w-full flex-col gap-2", className)}
      onDragOver={(event) => {
        if (!disabled) {
          event.preventDefault()
          setDragging(true)
        }
        onDragOver?.(event)
      }}
      onDragLeave={(event) => {
        // Only the crossing that leaves the whole panel counts; moving between
        // the icon and the copy inside it does not.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        onDragLeave?.(event)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        take(Array.from(event.dataTransfer?.files ?? []))
        onDrop?.(event)
      }}
      {...props}
    >
      <div
        data-slot="file-dropzone-panel"
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-transparent px-4 py-6 text-center transition-colors",
          disabled
            ? "pointer-events-none opacity-50"
            : "cursor-pointer hover:bg-accent/40 group-data-[dragging]/dropzone:bg-brand-muted"
        )}
      >
        <UploadIcon aria-hidden="true" className="size-5 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Drag files here or click to browse</p>
          {hint ? (
            <p id={hintId} className="text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          // The visible button is the one anybody reaches, so it carries the
          // hint and the rejections; the input below it is never focused.
          aria-describedby={
            [hint ? hintId : null, rejected.length > 0 ? errorId : null].filter(Boolean).join(" ") ||
            undefined
          }
          onClick={(event) => {
            // The panel opens the picker too; without this the click would run
            // it twice.
            event.stopPropagation()
            inputRef.current?.click()
          }}
        >
          Browse files
        </Button>

        <input
          ref={inputRef}
          type="file"
          // Off the tab order on purpose: the visible button is the keyboard
          // path to the same dialog, so the field is not a second stop.
          tabIndex={-1}
          aria-label="Choose files"
          className="sr-only"
          multiple={multiple}
          accept={accept?.join(",")}
          disabled={disabled}
          onChange={(event) => {
            take(Array.from(event.target.files ?? []))
            // Cleared so choosing the same file twice still fires a change.
            event.target.value = ""
          }}
        />
      </div>

      {listFiles && value && value.length > 0 ? (
        <ul data-slot="file-dropzone-files" className="flex flex-col gap-1">
          {value.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center gap-2 rounded-md border border-input px-2 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatBytes(file.size)}
              </span>
              {onRemove ? (
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    // The rejections described the last batch; changing what is
                    // held retires them rather than leaving a stale alert.
                    setRejected([])
                    onRemove(file)
                  }}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-ring"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {rejected.length > 0 ? (
        <ul id={errorId} role="alert" data-slot="file-dropzone-rejected" className="flex flex-col gap-0.5">
          {rejected.map((error) => (
            <li key={`${error.file.name}-${error.reason}`} className="text-xs text-danger">
              {error.file.name} — {reasonText(error, { maxSize, maxFiles })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Says why a file was turned down, in the reader's terms rather than the rule's. */
function reasonText(
  error: DropzoneError,
  limits: { maxSize?: number; maxFiles?: number }
): string {
  if (error.reason === "type") return "not an accepted file type"
  if (error.reason === "size")
    return limits.maxSize === undefined
      ? "too large"
      : `larger than ${formatBytes(limits.maxSize, 0)}`
  return limits.maxFiles === undefined
    ? "over the file limit"
    : `over the ${limits.maxFiles} file limit`
}

export { FileDropzone }
