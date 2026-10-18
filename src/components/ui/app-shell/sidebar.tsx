import * as React from "react"
import { Link } from "react-router-dom"
import { Home, LogOut, ChevronUp, LifeBuoy } from "lucide-react"

import {
  AppSidebar,
  type NavGroup as SidebarNavGroup,
  type NavItem as SidebarNavItem,
} from "@/components/ui/app-sidebar"
import { SearchInput } from "@/components/ui/search-input"
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type NavConfig, type NavItem } from "@/lib/nav-config"

// Type-only, so nothing of index.tsx survives into this module at runtime and
// the two files never form an import cycle.
import type { AppShellUser, AppShellWorkspace } from "./index"
import { SEARCH_HOTKEY } from "./header"
import { navIcon } from "./icons"
import { useNavOverride } from "./nav-override"

export type AppShellSidebarProps = {
  nav: NavConfig
  /** The href of the item findNavItem matched, or undefined when none did. */
  activeHref?: string
  /** Opens the command palette; the field under the brand is its affordance. */
  onSearch: () => void
  workspaces?: AppShellWorkspace[]
  workspaceId?: string
  onWorkspaceChange?: (id: string) => void
  /** The physical edge the rail sits on: the inline start, which the shell reads off the page. */
  side?: "left" | "right"
  user?: AppShellUser
  onSignOut?: () => void
}

/** A NavConfig item, with its named icon resolved to the component that draws it. */
function toSidebarItem(item: NavItem): SidebarNavItem {
  return {
    title: item.title,
    href: item.href,
    icon: navIcon(item.icon),
    badge: item.badge,
    items: item.items?.map((child) => ({ title: child.title, href: child.href })),
  }
}

function toSidebarGroups(nav: NavConfig): SidebarNavGroup[] {
  return nav.groups.map((group) => ({
    label: group.label,
    items: group.items.map(toSidebarItem),
  }))
}

/** The shell's sidebar: the nav config as groups, and the workspace you are in. */
function AppShellSidebar({
  nav,
  activeHref,
  onSearch,
  workspaces,
  workspaceId,
  onWorkspaceChange,
  side = "left",
  user,
  onSignOut,
}: AppShellSidebarProps) {
  // A framed page's hrefs are not routes where it is shown — the frame rewrites
  // them on the way out — so prefetching them would only fetch 404s.
  const framed = useNavOverride() !== null
  const renderLink = React.useCallback(
    (href: string, props: React.ComponentProps<"a">) => (
      <Link
        to={href}
        {...(props as any)}
        aria-current={href === activeHref ? "page" : undefined}
      />
    ),
    [activeHref, framed]
  )

  return (
    <AppSidebar
      side={side}
      header={
        workspaces?.length && workspaceId && onWorkspaceChange ? (
          <div className="w-full py-1">
            <WorkspaceSwitcher
              size="default"
              className="w-full justify-between h-10 border border-white/[0.09] bg-[#161a24] hover:bg-[#1a202c] hover:border-white/[0.16] text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl transition-all"
              workspaces={workspaces.map((w) => ({
                id: w.id,
                name: w.name,
                plan: w.plan,
                logo: w.initial,
                iconUrl: w.iconUrl,
              }))}
              activeId={workspaceId}
              onSelect={onWorkspaceChange}
            />
          </div>
        ) : undefined
      }
      brand={{
        name: nav.brand.name,
        description: nav.brand.caption,
        href: nav.brand.href === activeHref ? undefined : nav.brand.href,
        logo: (
          <span aria-hidden="true" className="text-sm font-semibold">
            {nav.brand.initial}
          </span>
        ),
      }}
      groups={toSidebarGroups(nav)}
      secondary={nav.footer?.map(toSidebarItem)}
      search={
        <SearchInput
          size="sm"
          readOnly
          shortcut={SEARCH_HOTKEY}
          shortcutScope={null}
          aria-label="Search"
          aria-haspopup="dialog"
          placeholder="Search"
          className="[&>span]:pointer-events-none"
          onClick={onSearch}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            onSearch()
          }}
        />
      }
      activePath={activeHref}
      renderLink={renderLink}
      footer={
        user ? (
          <div className="w-full px-1 py-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-full flex items-center justify-between p-2 rounded-xl text-white hover:bg-white/[0.06] transition-all cursor-pointer group group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-8 rounded-full object-cover shrink-0 border border-white/10 ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                      {user.initials || user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                    <span className="text-[10px] text-zinc-400 truncate">@{user.name.toLowerCase()}</span>
                  </div>
                </div>
                <ChevronUp className="size-3.5 text-zinc-400 group-hover:text-white transition-colors group-data-[collapsible=icon]:hidden shrink-0" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-60 border-white/[0.09] bg-[#161a24]/95 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-1.5"
              >
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex items-center gap-2.5">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="size-9 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="size-9 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                        {user.initials || user.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{user.name}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Signed in via Discord
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

                <DropdownMenuItem
                  render={
                    <Link
                      to="/"
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer transition-colors"
                    >
                      <Home className="size-4 text-emerald-400 shrink-0" />
                      <span>Back to Home Page</span>
                    </Link>
                  }
                />

                <DropdownMenuItem
                  render={
                    <a
                      href="https://discord.gg/mZcp3VBtBq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer transition-colors"
                    >
                      <LifeBuoy className="size-4 text-purple-400 shrink-0" />
                      <span>Mavely Discord Support</span>
                    </a>
                  }
                />

                {onSignOut && (
                  <>
                    <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                    <DropdownMenuItem
                      onClick={onSignOut}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <LogOut className="size-4 text-rose-400 shrink-0" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : undefined
      }
    />
  )
}

export { AppShellSidebar }
