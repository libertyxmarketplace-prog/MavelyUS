import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex flex-col w-full gap-2",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * One pill, moved — not a background fading in on each tab in turn.
 *
 * The measurement is the primitive's own `Tabs.Indicator`, which writes
 * `--active-tab-left` and `--active-tab-width` and re-runs before hydration, so
 * the pill is under the right tab on the first paint. SegmentedControl, which
 * is hand-rolled, gets the same behaviour from `useSlidingIndicator`; both
 * slide over `--duration-base` on the emphasized ease and both draw the sheet:
 * the card plane over the recessed track, with the sheet shadow.
 *
 * In a row the pill is centred in the track at the track's height; in a
 * column it takes the active tab's own top and height, or it would stand as
 * tall as the whole column. It is placed from the left on purpose: Base UI
 * measures `--active-tab-left` from the list's left edge in either direction,
 * so a physical left and a physical translate land it under the right tab in
 * a right-to-left row too, where an inline-start would not.
 */
function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {variant === "default" ? (
        <TabsPrimitive.Indicator
          data-slot="tabs-indicator"
          // Base UI's own inline script measures the active tab while the
          // server HTML is parsed, so the pill is under it on the first
          // paint instead of appearing only once React has hydrated.
          renderBeforeHydration
          className="absolute top-1/2 left-0 z-0 h-[calc(100%-6px)] w-(--active-tab-width) -translate-y-1/2 translate-x-(--active-tab-left) rounded-md bg-card shadow-(--shadow-sheet) transition-[translate,width,height] duration-(--duration-base) ease-(--ease-emphasized) group-data-vertical/tabs:top-0 group-data-vertical/tabs:h-(--active-tab-height) group-data-vertical/tabs:translate-y-(--active-tab-top)"
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // The tab itself paints no background: the sliding pill behind it is
        // what marks the selection, so it only owes the reader its ink.
        "relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 type-label whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-fast) ease-(--ease-standard) focus-ring group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-active:text-foreground",
        // The line variant has no pill; it underlines in the accent, and the
        // 2px rule lands on the row's own hairline. In a column the rail sits
        // at the inline end, the side facing the panel, in either direction;
        // the icon's tighter padding is on the inline axis for the same reason.
        "after:absolute after:bg-brand after:opacity-0 after:transition-opacity after:duration-(--duration-base) after:ease-(--ease-standard) group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-end-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      // Base UI makes the open panel a tab stop, so it wears the kit's
      // one focus treatment rather than no outline at all.
      className={cn("flex-1 text-sm focus-ring", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
