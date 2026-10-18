import * as React from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {/* Inside the popup, so the name and the description exist only
            while the dialog does: as a sibling they were an sr-only h2 on
            every page, ahead of the page's own h1, with the palette shut.
            Base UI wires aria-labelledby and -describedby from in here. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Keeps the combobox's `aria-activedescendant` on the option that is painted
 * as selected.
 *
 * cmdk 1.1.1 computes that id inside its own scheduler flush: the first item
 * selects itself while the flush is running, so the lookup for
 * `[aria-selected="true"]` runs before the item has re-rendered and finds
 * nothing — the selection a reader opens on is painted but never announced
 * until an arrow key moves it, and a selection the filter moves can be
 * announced as the row it left. (Controlling `value` does not help: that path
 * never computes the id at all.) So after each commit the id is read off the
 * DOM, where the painted selection is, and written only when it disagrees.
 * React rewrites the attribute only when cmdk's own value changes, and this
 * runs after every such commit, so the two never fight.
 */
function useActiveDescendant(wrapper: React.RefObject<HTMLDivElement | null>) {
  const value = useCommandState((state) => state.value)
  const selectedItemId = useCommandState((state) => state.selectedItemId)
  React.useEffect(() => {
    const input = wrapper.current?.querySelector("[cmdk-input]")
    const root = wrapper.current?.closest("[cmdk-root]")
    if (!input || !root) return
    const selected = root.querySelector('[cmdk-item][aria-selected="true"]')
    const id = selected?.id || null
    if (input.getAttribute("aria-activedescendant") === id) return
    if (id) input.setAttribute("aria-activedescendant", id)
    else input.removeAttribute("aria-activedescendant")
  }, [value, selectedItemId, wrapper])
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const wrapper = React.useRef<HTMLDivElement | null>(null)
  useActiveDescendant(wrapper)

  return (
    <div ref={wrapper} data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:type-eyebrow",
        className
      )}
      {...props}
    />
  )
}

// The rule sits inside cmdk's listbox, where a separator is not a child a
// listbox may have (axe aria-required-children, critical) — and cmdk's own
// Separator writes role="separator" over any role it is handed. So the kit
// draws the rule itself, presentational: the groups on either side already
// carry the structure. Like cmdk's, it steps aside while a search is typed,
// unless alwaysRender says otherwise.
function CommandSeparator({
  className,
  alwaysRender = false,
  ...props
}: React.ComponentProps<"div"> & { alwaysRender?: boolean }) {
  const searching = useCommandState((state) => state.search !== "")
  if (searching && !alwaysRender) return null
  return <div data-slot="command-separator" role="none" className={cn("-mx-1 h-px bg-rule", className)} {...props} />
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-label outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        // Tracked wide for a plain "⌘D"; keycaps (KbdShortcut, Kbd) keep
        // their own letters together and sit a gap apart instead.
        "ms-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground has-[kbd]:flex has-[kbd]:shrink-0 has-[kbd]:items-center has-[kbd]:gap-1 has-[kbd]:tracking-normal",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  // cmdk's own store hook, re-exported so a palette built on this item reads
  // the result count from here rather than depending on cmdk itself.
  useCommandState,
}
