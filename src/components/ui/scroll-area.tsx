import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  focusableViewport = true,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  /**
   * Whether the viewport is a tab stop while it overflows, as Base UI makes
   * it. Turn it off when everything inside is focusable already — a list of
   * links or buttons, whose own focus scrolls it into view — so the viewport
   * is not one more stop in front of them, and names nothing.
   */
  focusableViewport?: boolean
}) {
  const named = focusableViewport && (label !== undefined || labelledBy !== undefined)

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // The focus outline is drawn on the root, inside its edge: a mask on the
      // viewport (the fades pattern) clipped the viewport's own outline away
      // entirely, and an ancestor that clips its overflow — a popover, a card
      // — cannot cut an inset one.
      className={cn("relative has-[>[data-slot=scroll-area-viewport]:focus-visible]:focus-outline-inset", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] outline-none"
        // Base UI puts the viewport in the tab order only while its content
        // overflows, and that is when a keyboard reader lands on it — so that
        // is when it becomes a region carrying the scroll area's name. A name
        // on the root sat on a box nobody can focus.
        render={(viewportProps, state) => (
          <div
            {...viewportProps}
            {...(focusableViewport ? null : { tabIndex: -1 })}
            {...(named && (state.hasOverflowX || state.hasOverflowY)
              ? { role: "region", "aria-label": label, "aria-labelledby": labelledBy }
              : null)}
          />
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-s data-vertical:border-s-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
