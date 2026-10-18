import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

/**
 * The id of the copy of its words a described trigger points at, or nothing.
 *
 * Base UI draws a tooltip for the pointer and tells assistive technology
 * nothing: the trigger has no aria-describedby, and the popup exists only
 * while it is open, in a portal at the end of the page. A tooltip that only
 * repeats its trigger's name — an icon button's label — loses nothing by
 * that. One that carries information does, so `describeTrigger` keeps a copy
 * of the tooltip's words in the page and points the trigger at it.
 */
const TooltipDescriptionContext = React.createContext<string | undefined>(
  undefined
)

function Tooltip({
  describeTrigger = false,
  ...props
}: TooltipPrimitive.Root.Props & {
  /**
   * Also gives the trigger the tooltip's words as its accessible description,
   * read after its name whether or not the tooltip is open. For a tooltip
   * that says more than the trigger's name: a status, a definition, the
   * reason a control is disabled.
   */
  describeTrigger?: boolean
}) {
  const id = React.useId()
  return (
    <TooltipDescriptionContext.Provider
      value={describeTrigger ? `${id}-description` : undefined}
    >
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipDescriptionContext.Provider>
  )
}

function TooltipTrigger({ render, ...props }: TooltipPrimitive.Trigger.Props) {
  const descriptionId = React.useContext(TooltipDescriptionContext)
  if (!descriptionId) {
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        render={render}
        {...props}
      />
    )
  }

  // Joined with a description the trigger already has, on itself or on the
  // element it renders — that element's own props win a merge, so the joined
  // value is written onto it as well.
  const element = React.isValidElement<{ "aria-describedby"?: string }>(render)
    ? render
    : undefined
  const describedBy = [
    props["aria-describedby"] ?? element?.props["aria-describedby"],
    descriptionId,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      render={
        element
          ? React.cloneElement(element, { "aria-describedby": describedBy })
          : render
      }
      {...props}
      aria-describedby={describedBy}
    />
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const descriptionId = React.useContext(TooltipDescriptionContext)
  return (
    <>
      {descriptionId ? (
        // The words a described trigger points at: in the page from the first
        // render, beside the trigger rather than in the portal, and sr-only —
        // spoken, never shown, and out of the layout. Chrome reads a
        // description from a display:none element aria-describedby names, but
        // not every browser and screen reader pair has done so reliably; a
        // rendered node is the case they all support. A reader moving line by
        // line meets the words once more after the trigger, as with a field's
        // help text.
        <span id={descriptionId} className="sr-only">
          {children}
        </span>
      ) : null}
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-50"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip-content"
            className={cn(
              "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pe-1.5 data-[side=bottom]:slide-in-from-top-1 data-[side=inline-end]:slide-in-from-start-1 data-[side=inline-start]:slide-in-from-end-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:duration-(--duration-base) data-[state=delayed-open]:ease-(--ease-standard) data-open:animate-in data-open:fade-in-0 data-open:duration-(--duration-base) data-open:ease-(--ease-standard) data-closed:animate-out data-closed:fade-out-0 data-closed:duration-(--duration-fast) data-closed:ease-(--ease-exit)",
              className
            )}
            {...props}
          >
            {children}
            {/* An inline side is logical, so its arrow is too: on the edge
                that faces the trigger in either direction. */}
            <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-start-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-end-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
