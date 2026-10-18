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
  logo?: React.ReactNode
  iconUrl?: string | null
}

export type WorkspaceSwitcherProps = Omit<
  React.ComponentProps<typeof Button>,
  "className" | "size" | "variant" | "children" | "render" | "onSelect"
> & {
  workspaces: Workspace[]
  activeId: string
  onSelect: (id: string) => void
  onCreate?: () => void
  className?: string
  size?: "sm" | "default"
}

export type WorkspaceMarkProps = {
  workspace: Workspace
  size?: "sm" | "default"
}

/** Clean Discord-style server mark: real icon image if available, else clean monogram */
function WorkspaceMark({ workspace, size = "default" }: WorkspaceMarkProps) {
  const sizeClasses = size === "sm" ? "size-5 text-2xs" : "size-6 text-xs"

  if (workspace.iconUrl) {
    return (
      <img
        src={workspace.iconUrl}
        alt={workspace.name}
        className={cn(
          "shrink-0 rounded-md object-cover border border-white/10",
          sizeClasses
        )}
      />
    )
  }

  return (
    <span
      data-slot="workspace-switcher-mark"
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-[#5865F2] font-semibold text-white",
        sizeClasses
      )}
    >
      {workspace.logo ?? getInitials(workspace.name)}
    </span>
  )
}

/** Clean Discord Server Switcher with zero status badge noise */
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
            className={cn(
              "w-full justify-between transition-all group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent",
              className
            )}
            {...props}
          />
        }
      >
        {active ? (
          <span className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <WorkspaceMark workspace={active} size={size} />
            <span className="truncate font-medium group-data-[collapsible=icon]:hidden">{active.name}</span>
          </span>
        ) : (
          <span className="truncate text-muted-foreground group-data-[collapsible=icon]:hidden">Select server</span>
        )}
        <ChevronsUpDownIcon className="shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-slot="workspace-switcher-content"
        align="start"
        className="min-w-64 border-white/[0.08] bg-[#161a24]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      >
        <DropdownMenuRadioGroup
          value={activeId}
          onValueChange={(value) => onSelect(String(value))}
        >
          <DropdownMenuLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Discord Servers</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuRadioItem
              key={workspace.id}
              value={workspace.id}
              closeOnClick
              data-slot="workspace-switcher-item"
              className="gap-2.5 py-2 cursor-pointer focus:[&_[data-slot=workspace-switcher-mark]]:text-primary-foreground hover:bg-white/[0.04]"
            >
              <WorkspaceMark workspace={workspace} size="sm" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium text-xs text-zinc-100">{workspace.name}</span>
                <span className="font-mono text-[10px] text-zinc-500">{workspace.id}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {onCreate ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-slot="workspace-switcher-create" onClick={onCreate}>
              <PlusIcon className="text-muted-foreground" />
              Add Server
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WorkspaceMark, WorkspaceSwitcher }
