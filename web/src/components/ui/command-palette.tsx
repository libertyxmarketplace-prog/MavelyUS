import * as React from "react"

import { cn } from "@/lib/utils"
import { matchesHotkey } from "@/lib/hotkeys"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  // The palette's own CommandGroup and CommandItem are the data shapes callers
  // hand in; the primitive uses those two names for components, so the
  // components are the ones that get renamed here.
  CommandGroup as CommandGroupList,
  CommandInput,
  CommandItem as CommandRow,
  CommandList,
  CommandShortcut,
  useCommandState,
} from "@/components/ui/command"
import { KbdShortcut } from "@/components/ui/kbd-shortcut"

export type CommandItem = {
  id: string
  label: string
  /** Sits before the label; sized to 4 unless it sets its own size. */
  icon?: React.ReactNode
  /** A chord ("mod+k") or a sequence of them ("g d"), rendered as keycaps. */
  shortcut?: string
  /** Extra words the item should be findable by; they never show. */
  keywords?: string[]
  onSelect: () => void
  /** A quiet second line under the label. */
  description?: string
}

export type CommandGroup = {
  heading: string
  items: CommandItem[]
}

export type CommandPaletteProps = React.ComponentProps<typeof Command> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  groups: CommandGroup[]
  placeholder?: string
  /** The shortcut that opens and closes it from anywhere; null turns it off. */
  hotkey?: string | null
  emptyMessage?: string
  /** Ids to lift into a "Recent" group at the top, in the order given. */
  recentIds?: string[]
  footer?: React.ReactNode
  /** What the dialog is called for a screen reader — "Search" for a palette that only finds things. */
  title?: string
  /** One line under the name, read out with it. */
  description?: string
}

/** cmdk matches against the item's value, so the keywords are folded into it. */
function itemValue(item: CommandItem): string {
  return [item.label, ...(item.keywords ?? [])].join(" ")
}

/**
 * What the query left, said aloud: "12 results", "1 result", or the empty
 * message. The rows repaint under a sighted reader as they type; a screen
 * reader hears nothing of that without a live region, and cmdk's own empty
 * state is `role="presentation"`. Inside the command root, because the count
 * is read from cmdk's store.
 */
function CommandResultCount({ emptyMessage }: { emptyMessage: string }) {
  const count = useCommandState((state) => state.filtered.count)
  return (
    <div data-slot="command-palette-status" role="status" aria-live="polite" className="sr-only">
      {count === 0 ? emptyMessage : `${count} ${count === 1 ? "result" : "results"}`}
    </div>
  )
}

/** The ⌘K dialog: grouped commands, fuzzy search, and the shortcut for each one. */
function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search…",
  hotkey = "mod+k",
  emptyMessage = "No results found.",
  recentIds,
  footer,
  title = "Command palette",
  description = "Search for a command to run.",
  className,
  ...props
}: CommandPaletteProps) {
  const [selfOpen, setSelfOpen] = React.useState(false)
  const isOpen = open ?? selfOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      // Uncontrolled palettes open themselves; controlled ones only report.
      if (open === undefined) setSelfOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange]
  )

  // The listener is attached once per hotkey and reads the current state
  // through a ref, so an inline onOpenChange does not resubscribe it every
  // render.
  const latest = React.useRef({ isOpen, setOpen })
  React.useEffect(() => {
    latest.current = { isOpen, setOpen }
  }, [isOpen, setOpen])

  React.useEffect(() => {
    if (!hotkey) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!matchesHotkey(event, hotkey)) return
      event.preventDefault()
      latest.current.setOpen(!latest.current.isOpen)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hotkey])

  const visibleGroups = React.useMemo(() => {
    const recent = new Set(recentIds ?? [])
    if (recent.size === 0) return groups

    const byId = new Map(groups.flatMap((group) => group.items).map((item) => [item.id, item]))
    const recentItems = (recentIds ?? [])
      .map((id) => byId.get(id))
      .filter((item): item is CommandItem => item !== undefined)
    if (recentItems.length === 0) return groups

    // Promoted, not copied: cmdk keys a row by its value, so the same item in
    // two groups would highlight in both at once. An emptied group goes too.
    const rest = groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !recent.has(item.id)),
      }))
      .filter((group) => group.items.length > 0)

    return [{ heading: "Recent", items: recentItems }, ...rest]
  }, [groups, recentIds])

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setOpen}
      title={title}
      description={description}
      className="gap-0 sm:max-w-xl"
    >
      {/* The command root is the palette's own root: data-slot lands here,
          replacing the primitive's name (nothing in command.tsx selects on it),
          and so do className and the rest of the caller's props. The dialog
          shell above keeps its own sizing. */}
      {/* `label` is what cmdk names the combobox by: it renders the text as
          the hidden <label> the input is already aria-labelledby, which was
          empty — an unnamed edit combobox — without it. */}
      <Command data-slot="command-palette" label={title} loop className={cn("p-2", className)} {...props}>
        <CommandInput placeholder={placeholder} />
        <CommandResultCount emptyMessage={emptyMessage} />
        <CommandList className="py-2 px-1 max-h-80">
          <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">{emptyMessage}</CommandEmpty>
          {visibleGroups.map((group) => (
            <CommandGroupList
              key={group.heading}
              heading={group.heading}
              className="py-1 px-1 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-zinc-400 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-2"
            >
              {group.items.map((item) => (
                <CommandRow
                  key={item.id}
                  value={itemValue(item)}
                  onSelect={() => {
                    item.onSelect()
                    setOpen(false)
                  }}
                  className="py-2.5 px-3 my-0.5 gap-3 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-colors text-xs sm:text-sm font-medium"
                >
                  {item.icon}
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-zinc-100">{item.label}</span>
                    {item.description ? (
                      <span className="truncate text-[11px] text-zinc-400 font-normal">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {item.shortcut ? (
                    // COUPLED TO registry/vibra/ui/command.tsx: CommandShortcut
                    // spaces plain-text shortcuts out with tracking-widest,
                    // which pulls the keycaps apart — but the slot has to stay,
                    // because CommandItem hides its trailing tick only for a
                    // row that carries a data-slot="command-shortcut".
                    <CommandShortcut className="flex shrink-0 items-center gap-1 tracking-normal ms-auto">
                      {item.shortcut
                        .split(" ")
                        .filter(Boolean)
                        .map((chord, index) => (
                          <KbdShortcut key={index} keys={chord} size="sm" />
                        ))}
                    </CommandShortcut>
                  ) : null}
                </CommandRow>
              ))}
            </CommandGroupList>
          ))}
        </CommandList>
      </Command>

      {footer ? (
        <div
          data-slot="command-palette-footer"
          className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground"
        >
          {footer}
        </div>
      ) : null}
    </CommandDialog>
  )
}

export { CommandPalette }
