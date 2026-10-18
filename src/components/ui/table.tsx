import * as React from "react"
import { cn } from "@/lib/utils"

/** Whether a box scrolls: its overflow lets it, and what it holds is bigger than it is. */
function scrolls(box: HTMLElement) {
  const style = getComputedStyle(box)
  const scrollable = (overflow: string) => overflow === "auto" || overflow === "scroll"
  return (
    (scrollable(style.overflowX) && box.scrollWidth > box.clientWidth) ||
    (scrollable(style.overflowY) && box.scrollHeight > box.clientHeight)
  )
}

/** The text a name comes from: the elements aria-labelledby names, else aria-label. */
function nameOf(element: Element | null | undefined): string {
  if (!element) return ""
  const ids = element.getAttribute("aria-labelledby")
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim()
  }
  return element.getAttribute("aria-label")?.trim() ?? ""
}

/**
 * Whether the box, as a region, would carry the very name of the landmark
 * region around it — a card or a band named by the same title as its table —
 * which is two landmarks of one name (axe landmark-unique, on fourteen pages
 * and eight table sections). The box is then a group instead: still a named
 * tab stop, no second landmark.
 */
function sharesEnclosingName(box: HTMLElement, table: HTMLTableElement | null): boolean {
  const own = nameOf(table) || table?.caption?.textContent?.trim() || ""
  const around = box.parentElement?.closest('[role="region"], section[aria-label], section[aria-labelledby]')
  return Boolean(own && around && nameOf(around) === own)
}

/** The id a TableCaption takes when it is given none, so the scroll region can be named by it. */
const CaptionIdContext = React.createContext<string | undefined>(undefined)

/**
 * The table, in a box that scrolls it sideways when it is wider than the page.
 * A box that scrolls is one the keyboard has to reach — the arrow keys scroll
 * only what has the focus — so while the table overflows, the box is a tab
 * stop and a region named after the table (its aria-labelledby, its
 * aria-label, else its caption), with a focus ring drawn inside its edge where
 * no ancestor's overflow can clip it — or a group of that name, when the card
 * or band around it is already a region called the same. While it fits, it is
 * neither: a tab stop that scrolls nothing is one more press for nothing.
 */
function Table({
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<"table">) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const captionId = React.useId()
  const [scrolling, setScrolling] = React.useState(false)
  const [captionedBy, setCaptionedBy] = React.useState<string | undefined>(undefined)
  const [sharesName, setSharesName] = React.useState(false)

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    // Measured after mount and on every resize, of the box or of the table in
    // it: a page of wider rows, a column shown, a narrower window.
    const measure = () => {
      const table = box.firstElementChild as HTMLTableElement | null
      setScrolling(scrolls(box))
      setCaptionedBy(table?.caption?.id || undefined)
      setSharesName(sharesEnclosingName(box, table))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    if (box.firstElementChild) observer.observe(box.firstElementChild)
    return () => observer.disconnect()
  }, [])

  const regionLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : captionedBy)
  const named = Boolean(regionLabelledBy || ariaLabel)

  return (
    <CaptionIdContext.Provider value={captionId}>
      <div
        ref={boxRef}
        data-slot="table-container"
        data-scrolling={scrolling || undefined}
        {...(scrolling
          ? {
              tabIndex: 0,
              ...(named
                ? {
                    role: sharesName ? "group" : "region",
                    "aria-labelledby": regionLabelledBy,
                    "aria-label": regionLabelledBy ? undefined : ariaLabel,
                  }
                : null),
            }
          : null)}
        className="relative w-full overflow-x-auto focus-ring-inset"
      >
        <table
          data-slot="table"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
    </CaptionIdContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-rule", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-rule bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// A selected row is the accent-muted plane, medium weight and a 2px accent
// rail. The rail is an inset shadow on the first cell: drawn as a ::before on
// the row, Chrome laid it out as one more cell and pushed every cell of a
// selected row a column to the right. A shadow has no logical offset, so a
// right-to-left row turns it round: the rail stays on the row's inline start.
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "relative border-b transition-colors duration-(--duration-fast) ease-(--ease-standard) hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-brand-muted data-[state=selected]:font-medium data-[state=selected]:*:first:shadow-[inset_2px_0_0_var(--brand)] rtl:data-[state=selected]:*:first:shadow-[inset_-2px_0_0_var(--brand)]",
        className
      )}
      {...props}
    />
  )
}

// Titles start at the inline start and a checkbox column trims its inline
// end, so a right-to-left table reads from the right like its rows do.
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "type-label h-10 px-2 text-start align-middle whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pe-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  id,
  ...props
}: React.ComponentProps<"caption">) {
  const fallbackId = React.useContext(CaptionIdContext)
  return (
    <caption
      id={id ?? fallbackId}
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
