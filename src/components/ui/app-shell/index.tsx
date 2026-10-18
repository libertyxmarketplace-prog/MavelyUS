import * as React from "react"
import { useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { type Notification } from "@/components/ui/notification-center"
import { breadcrumbsFor, findNavItem, type NavConfig } from "@/lib/nav-config"
import { useNavOverride } from "@/components/ui/app-shell/nav-override"

import { AppShellHeader } from "./header"
import { AppShellSidebar } from "./sidebar"

export type AppShellUser = { name: string; email: string; avatarUrl?: string; initials?: string }
export type AppShellWorkspace = { id: string; name: string; initial: string; plan?: string; iconUrl?: string | null }
export type AppShellNotification = {
  id: string
  title: string
  description?: string
  at: Date
  read?: boolean
  href?: string
}

export type AppShellContextValue = {
  nav: NavConfig
  user: AppShellUser
  workspace?: AppShellWorkspace
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null)

/** Who is signed in, where they are working, and the nav the shell was given. */
function useAppShell(): AppShellContextValue {
  const context = React.useContext(AppShellContext)
  if (!context) {
    throw new Error("useAppShell must be called inside an <AppShell>.")
  }
  return context
}

// A stable empty list: a fresh `[]` default on every render would look like a
// new set of notifications and throw away what the reader has just read.
const NO_NOTIFICATIONS: AppShellNotification[] = []

export type AppShellProps = React.ComponentProps<"div"> & {
  nav: NavConfig
  user: AppShellUser
  workspaces?: { current: string; items: AppShellWorkspace[] }
  onWorkspaceChange?: (id: string) => void
  notifications?: AppShellNotification[]
  /**
   * What "now" is when the bell dates a notification. Defaults to the machine
   * clock, which is right for a live app; a page whose figures are fixed to a
   * reference date passes that date, so the bell does not drift away from the
   * numbers on the page as the year turns.
   */
  now?: Date
  /** Extra header actions rendered before the theme toggle. */
  actions?: React.ReactNode
  /**
   * The route this page lives at. Defaults to usePathname(); pass it so a page
   * rendered under some other URL — a preview frame, a gallery route — still
   * highlights its own nav item and builds the trail from it.
   */
  activeHref?: string
  /** Override the breadcrumb trail; defaults to breadcrumbsFor(nav, activeHref ?? pathname). */
  breadcrumbs?: { title: string; href: string }[]
  /**
   * Keeps the page's own name as the last crumb. Off by default: the page
   * writes its name once, in its PageHeader's h1, and a bar that repeats it
   * eight pixels above is the same word twice. A page with no PageHeader —
   * an embedded view, a full-bleed canvas — turns it back on. An explicit
   * `breadcrumbs` trail is used exactly as given either way.
   */
  showLastCrumb?: boolean
  /** Renders the account menu's "Log out" item (upstream UserMenu label). */
  onSignOut?: () => void
  /** Initial sidebar state; read the `sidebar_state` cookie server-side to keep it across navigations. */
  defaultOpen?: boolean
  /**
   * The row rhythm this page is laid out at, written onto the shell root so it
   * covers the sidebar as well as the page. Left off, the shell inherits
   * whatever the document says — which is what the reader's own DensityToggle
   * writes — so pass it only when the page has an opinion of its own.
   */
  density?: "comfortable" | "compact"
  children: React.ReactNode
}

/** The reading direction an element sits in: the nearest dir attribute, else its computed direction. */
function directionOf(element: HTMLElement): "ltr" | "rtl" {
  const attribute = element.closest("[dir]")?.getAttribute("dir")?.toLowerCase()
  if (attribute === "rtl" || attribute === "ltr") return attribute
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr"
}

/** The frame every page renders in: nav at the inline start, page identity on top, your page inside. */
function AppShell({
  className,
  nav: ownNav,
  user,
  workspaces,
  onWorkspaceChange,
  notifications = NO_NOTIFICATIONS,
  now,
  actions,
  activeHref,
  breadcrumbs,
  showLastCrumb = false,
  onSignOut,
  defaultOpen,
  density,
  children,
  dir,
  ...props
}: AppShellProps) {
  // The rail sits at the inline start: the left of a left-to-right page and
  // the right of a right-to-left one, on the desktop and as the phone's sheet.
  // A `dir` given to the shell decides it on the server too; otherwise the
  // page's direction is read once the shell is mounted, as Carousel reads it.
  const root = React.useRef<HTMLDivElement>(null)
  const [pageDirection, setPageDirection] = React.useState<"ltr" | "rtl">("ltr")
  React.useLayoutEffect(() => {
    if (root.current) setPageDirection(directionOf(root.current))
  }, [])
  const side = (dir === "rtl" || dir === "ltr" ? dir : pageDirection) === "rtl" ? "right" : "left"

  // A page framed inside a template wears the template's navigation, the way it
  // would once installed there; everywhere else this is null and the page's own
  // nav stands.
  const override = useNavOverride()
  const nav = override?.nav ?? ownNav
  const pathname = useLocation().pathname
  // The route the page says it is at wins over the one the browser is showing:
  // the two differ whenever the page is framed somewhere else.
  const route = override?.activeHref ?? activeHref ?? pathname

  // Which workspace is current is a choice the reader makes here, seeded by
  // the caller — the props carry no change handler to lift it to. A caller
  // that moves `current` itself still wins: the seed is re-read whenever it
  // changes.
  const [workspaceId, setWorkspaceId] = React.useState(workspaces?.current)
  const [lastCurrent, setLastCurrent] = React.useState(workspaces?.current)
  if (workspaces?.current !== lastCurrent) {
    setLastCurrent(workspaces?.current)
    setWorkspaceId(workspaces?.current)
  }

  // Read state is the same bargain: marking one read is a local act, and a
  // fresh list from the caller replaces the whole record.
  // The palette is opened from two places — the field under the brand and
  // the phone's search icon in the bar — so the shell holds the state.
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [readIds, setReadIds] = React.useState<string[]>([])
  const [lastNotifications, setLastNotifications] = React.useState(notifications)
  if (notifications !== lastNotifications) {
    setLastNotifications(notifications)
    setReadIds([])
  }

  const active = React.useMemo(() => findNavItem(nav, route), [nav, route])
  const trail = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs
    const full = breadcrumbsFor(nav, route)
    // Never below one crumb: the workspace is where the trail starts, and a
    // bar with nothing in it reads as a missing element rather than a quiet one.
    return showLastCrumb || full.length < 2 ? full : full.slice(0, -1)
  }, [breadcrumbs, nav, route, showLastCrumb])
  // A trail the shell cut short still ends somewhere you can go, so its last
  // crumb stays a link rather than becoming a page that is not this page.
  const trailEndsAtPage =
    breadcrumbs !== undefined || showLastCrumb || breadcrumbsFor(nav, route).length < 2

  const workspace = workspaces?.items.find((item) => item.id === workspaceId)
  const context = React.useMemo<AppShellContextValue>(
    () => ({ nav, user, workspace }),
    [nav, user, workspace]
  )

  const rows = React.useMemo<Notification[]>(
    () =>
      notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        // NotificationCenter dates every row with RelativeTime.
        time: notification.at,
        read: notification.read === true || readIds.includes(notification.id),
        href: notification.href,
      })),
    [notifications, readIds]
  )

  return (
    <AppShellContext.Provider value={context}>
      <div
        ref={root}
        data-slot="app-shell"
        data-density={density}
        dir={dir}
        // Full height by default, and no taller than its box when a caller
        // gives it one — the height classes here are the ones cn() lets a
        // caller's className replace.
        //
        // COUPLED TO registry/vibra/ui/dashboard-shell.tsx: the inset it
        // renders is a flex item beside the sidebar with the default
        // min-width:auto, so the header bar inside it — a trail plus a search
        // field and four controls — sets a floor the row cannot fall below,
        // and a shell narrower than that floor spills its right-hand controls
        // out of the frame instead of tightening. DashboardShell takes no
        // className for the inset, so the rule is written from here; move it
        // onto the inset itself if it ever grows one.
        className={cn(
          "flex min-h-svh w-full flex-col [&_[data-slot=sidebar-inset]]:min-w-0",
          className
        )}
        {...props}
      >
        <DashboardShell
          defaultOpen={defaultOpen}
          className="min-h-0 flex-1"
          contentClassName="min-h-0"
          sidebar={
            <AppShellSidebar
              side={side}
              nav={nav}
              activeHref={active?.href}
              onSearch={() => setPaletteOpen(true)}
              workspaces={workspaces?.items}
              workspaceId={workspaceId}
              onWorkspaceChange={(id) => {
                setWorkspaceId(id)
                onWorkspaceChange?.(id)
              }}
              user={user}
              onSignOut={onSignOut}
            />
          }
          header={
            <AppShellHeader
              nav={nav}
              paletteOpen={paletteOpen}
              onPaletteOpenChange={setPaletteOpen}
              breadcrumbs={trail}
              user={user}
              notifications={rows}
              now={now}
              actions={actions}
              onSignOut={onSignOut}
              lastCrumbIsPage={trailEndsAtPage}
              onMarkRead={(id) =>
                setReadIds((current) => (current.includes(id) ? current : [...current, id]))
              }
              onMarkAllRead={() => setReadIds(notifications.map((item) => item.id))}
            />
          }
        >
          {children}
        </DashboardShell>
      </div>
    </AppShellContext.Provider>
  )
}

export { AppShell, AppShellContext, useAppShell }
