import * as React from "react"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/format"

export type Workspace = {
  id: string
  name: string
  /** A short plan or tier, shown quietly beside the name. */
  plan?: string
  /** Replaces the initials in the mark; sized to 3.5. */
  logo?: React.ReactNode
}

// The trigger button is the root: className and the rest of the props land on
// it. className is re-declared as a plain string, and size is the item's
// density axis, passed straight through to the button.
export type WorkspaceSwitcherProps = Omit<
  React.ComponentProps<typeof Button>,
  "className" | "size" | "variant" | "children" | "render" | "onSelect"
> & {
  workspaces: Workspace[]
  activeId: string
  onSelect: (id: string) => void
  /** Adds a "Create workspace" entry under the list. */
  onCreate?: () => void
  className?: string
  size?: "sm" | "default"
}

export type WorkspaceMarkProps = {
  workspace: Workspace
  size?: "sm" | "default"
}

/** The square mark that stands in for a workspace — its logo, or its initials. */
function WorkspaceMark({ workspace, size = "default" }: WorkspaceMarkProps) {
  return (
    <span
      data-slot="workspace-switcher-mark"
      // Decorative: the name sits right beside it, and initials read as
      // letter noise ("A C M E") to a screen reader.
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground [&_svg]:size-3.5",
        size === "sm" ? "size-5 text-avatar" : "size-6 text-2xs"
      )}
    >
      {workspace.logo ?? getInitials(workspace.name)}
    </span>
  )
}

/** The workspace you are working in, and a menu of the others to switch to. */
function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  onCreate,
  className,
  size = "default",
  ...props
}: WorkspaceSwitcherProps) {
  const active = workspaces.find((workspace) => workspace.id === activeId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={size}
            data-slot="workspace-switcher"
            data-size={size}
            className={cn("w-full justify-between", className)}
            {...props}
          />
        }
      >
        {active ? (
          <span className="flex min-w-0 items-center gap-2">
            <WorkspaceMark workspace={active} size={size} />
            <span className="truncate font-medium">{active.name}</span>
            {/* The plan is a short token and the name is not, so the name is
                the one that gives way when the rail is narrow. The comma is
                for the button's name: "Northwind Analytics, Pro", not "Northwind AnalyticsPro". */}
            {active.plan ? (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                <span className="sr-only">,</span> {active.plan}
              </span>
            ) : null}
          </span>
        ) : (
          // An id that matches nothing is a caller bug, but emptying the
          // sidebar over it helps nobody: the switcher still switches.
          <span className="truncate text-muted-foreground">Select workspace</span>
        )}
        <ChevronsUpDownIcon className="shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      {/* COUPLED TO registry/vibra/ui/item.tsx: see the same note in
          user-menu.tsx — this rename takes [data-slot=dropdown-menu-content]
          away from the popup, and the switcher's rows are its own. */}
      <DropdownMenuContent
        data-slot="workspace-switcher-content"
        align="start"
        className="min-w-56"
      >
        <DropdownMenuRadioGroup
          value={activeId}
          onValueChange={(value) => onSelect(String(value))}
        >
          {/* Inside the group, not above it: Base UI's GroupLabel reads the
              group context to name it, and throws without one. */}
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuRadioItem
              key={workspace.id}
              value={workspace.id}
              // Base UI keeps a radio menu open by default, which suits a
              // filter; picking the workspace you are moving to is a
              // destination, so the menu gets out of the way.
              closeOnClick
              data-slot="workspace-switcher-item"
              // The menu item repaints every descendant on focus
              // (focus:**:text-accent-foreground), which lands white-on-white
              // on the mark's own bg-primary tile in dark. This selector is one
              // specificity step higher, so the tile keeps its own foreground
              // on the row that opens focused — the active workspace's.
              className="gap-2 focus:[&_[data-slot=workspace-switcher-mark]]:text-primary-foreground"
            >
              <WorkspaceMark workspace={workspace} size="sm" />
              <span className="truncate">{workspace.name}</span>
              {workspace.plan ? (
                <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                  <span className="sr-only">,</span> {workspace.plan}
                </span>
              ) : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {onCreate ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-slot="workspace-switcher-create" onClick={onCreate}>
              <PlusIcon className="text-muted-foreground" />
              Create workspace
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WorkspaceMark, WorkspaceSwitcher }
