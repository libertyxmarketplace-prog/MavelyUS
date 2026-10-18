import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * The framed card. The root is the `frame` recipe — the surface plane and a
 * hairline ring — and it holds a strip of header, a gap of four pixels, and
 * the content as an inset sheet on the card plane with a ring of its own, so
 * a title sits on the frame and the numbers, the chart or the table sit on
 * white a step above it. A footer is a second strip under the sheet. A page
 * that hand-rolls either recipe is drawing a fifth kind of box; there is a
 * test that says so.
 *
 * Padding comes from `--density-card` so a compact dashboard tightens its cards
 * along with its tables, with the comfortable literal as the fallback for an
 * install that took the component without the density stylesheet.
 */
function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /**
   * `interactive` is for a card that is itself a link or a button: the ring
   * lifts to `--rule` and the frame takes the floating shadow on hover, and
   * the whole card presses a pixel down. The property list is explicit —
   * `transition-all` would animate the layout too.
   */
  variant?: "default" | "interactive"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-1 overflow-hidden frame text-sm text-card-foreground [--card-spacing:var(--density-card,1rem)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        variant === "interactive" &&
          "transition-[box-shadow,background-color,translate] duration-(--duration-base) ease-(--ease-standard) hover:ring-(--rule) hover:shadow-(--shadow-float) active:translate-y-px",
        className
      )}
      {...props}
    />
  )
}

// The strip: 52px tall with the title centred in it, so a card with an action
// and a card without one carry their titles on the same line. A description
// adds a second row and the strip grows. The strip is a container of its own:
// under 12rem of content width — a tile in a four-up divided group, a KPI on
// a phone — the action drops under the title instead of being clipped off the
// right edge. A four-up row on a 1,440px page is 238px of content and keeps
// its action on the title line.
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid min-h-13 auto-rows-min content-center items-center gap-1 px-(--card-spacing) py-2.5 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=sm]/card:min-h-11 group-data-[size=sm]/card:py-2 [.border-b]:pb-2.5 @max-[12rem]/card-header:has-data-[slot=card-action]:grid-cols-1",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-heading text-sm font-semibold", className)}
      {...props}
    />
  )
}

// The title's second line: body size, muted.
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// The action shares the title's row and centre line. With a description it
// spans both lines and centres against the pair; spanning two rows without
// one made an empty second row, which lifted the title above the action's
// centre (2px for a pill, 6px for a 32px tab list).
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-start-1 self-center justify-self-end group-has-data-[slot=card-description]/card-header:row-end-3 @max-[12rem]/card-header:col-start-1 @max-[12rem]/card-header:row-span-1 @max-[12rem]/card-header:row-start-2 @max-[12rem]/card-header:justify-self-start",
        className
      )}
      {...props}
    />
  )
}

// The inset sheet: the card plane with its own hairline, a radius one step
// inside the frame's, and the density padding. `flex-1` so it takes the slack
// in a row of unequal cards and their footers land on one line. A table or a
// chart that wants the sheet's full width passes `p-0`.
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) ring-1 ring-border",
        className
      )}
      {...props}
    />
  )
}

// A second strip on the frame, under the sheet. `mt-auto` so a card without
// content still pins it to the bottom.
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex items-center gap-2 px-(--card-spacing) py-2.5", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
