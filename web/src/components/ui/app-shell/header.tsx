import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CommandPalette, type CommandItem } from "@/components/ui/command-palette"
import { HeaderBar } from "@/components/ui/header-bar"
import {
  NotificationCenter,
  type Notification,
} from "@/components/ui/notification-center"
import { flattenNav, type NavConfig } from "@/lib/nav-config"

import { useNavOverride } from "./nav-override"

// Type-only, so nothing of index.tsx survives into this module at runtime and
// the two files never form an import cycle.
import type { AppShellUser } from "./index"
import { navIcon } from "./icons"

/** The chord that opens the palette from anywhere on the page; the sidebar's field prints it. */
export const SEARCH_HOTKEY = "mod+k"

export type AppShellHeaderProps = {
  nav: NavConfig
  /** The palette's open state — owned by the shell, because the sidebar's search field opens it too. */
  paletteOpen: boolean
  onPaletteOpenChange: (open: boolean) => void
  breadcrumbs: { title: string; href: string }[]
  user: AppShellUser
  /** Already merged with whatever the reader has marked read in this session. */
  notifications: Notification[]
  /** What "now" is when the bell dates a row; defaults to the machine clock. */
  now?: Date
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  actions?: React.ReactNode
  /** Adds the account menu's "Log out" item. */
  onSignOut?: () => void
  /** False when the trail stops short of the page, because a PageHeader names it. */
  lastCrumbIsPage?: boolean
}

/** The bar above the page: where you are, what you can jump to, and who you are. */
function AppShellHeader({
  nav,
  paletteOpen,
  onPaletteOpenChange,
  breadcrumbs,
  user: _user,
  notifications,
  now,
  onMarkRead,
  onMarkAllRead,
  actions,
  onSignOut: _onSignOut,
  lastCrumbIsPage = true,
}: AppShellHeaderProps) {
  // Every link the bar renders — crumbs and notification rows alike — goes
  // through the router, so none of them costs a full document load; the sidebar
  // has its own, which also stamps the current page. A framed page's hrefs are
  // not routes where it is shown, so there they do not prefetch either.
  const override = useNavOverride()
  const framed = override !== null
  const renderLink = React.useCallback(
    (href: string, props: React.ComponentProps<"a">) => (
      <Link to={href} {...(props as any)} />
    ),
    []
  )
  const navigate = useNavigate()
  const router = React.useMemo(() => ({ push: (href: string) => navigate(href) }), [navigate])
  // A palette pick is a router call, not a link, so nothing outside the page
  // can take it over the way it takes a click over: under an override the
  // override says where the route is shown, or the pick goes nowhere.
  const go = React.useCallback(
    (href: string) => {
      if (override?.navigate) override.navigate(href)
      else if (!framed) router.push(href)
    },
    [override, framed, router]
  )

  const commands = React.useMemo<CommandItem[]>(
    () =>
      flattenNav(nav).map((item) => {
        const Icon = navIcon(item.icon)
        return {
          id: item.href,
          label: item.title,
          icon: Icon ? <Icon /> : undefined,
          // cmdk matches rows by value, which is the label plus the keywords —
          // so the route both disambiguates two same-named items and becomes
          // something you can search by.
          keywords: [item.href],
          onSelect: () => go(item.href),
        }
      }),
    [nav, go]
  )

  return (
    <>
      <HeaderBar
        sticky
        lastCrumbIsPage={lastCrumbIsPage}
        breadcrumbs={breadcrumbs.map((crumb) => ({ label: crumb.title, href: crumb.href }))}
        renderLink={renderLink}
        search={
          // The search field lives under the brand in the sidebar; the bar
          // keeps one icon for the phone, where the sidebar is a sheet and the
          // field inside it is a tap further away than the dialog itself.
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Search"
            aria-haspopup="dialog"
            className="md:hidden"
            onClick={() => onPaletteOpenChange(true)}
          >
            <SearchIcon />
          </Button>
        }
        actions={
          <>
            {actions}
            <NotificationCenter
              notifications={notifications}
              now={now}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              renderLink={renderLink}
            />
          </>
        }
      />

      {/* Outside the bar: it is a dialog, and its own hotkey listener is what
          opens it from anywhere on the page. */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={onPaletteOpenChange}
        hotkey={SEARCH_HOTKEY}
        placeholder="Search pages…"
        emptyMessage="No page matches that."
        groups={[{ heading: "Go to", items: commands }]}
      />
    </>
  )
}

export { AppShellHeader }
