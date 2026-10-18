import * as React from "react"

import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type DashboardShellContextValue = {
  /** Always true: the shell provides a SidebarProvider around everything inside it. */
  hasSidebar: boolean
}

const DashboardShellContext = React.createContext<DashboardShellContextValue | null>(null)

// Frozen module constant rather than a memo: nothing about it can change.
const SHELL_CONTEXT: DashboardShellContextValue = { hasSidebar: true }

/** The shell wrapped around this subtree, or null when there is none. */
function useDashboardShell(): DashboardShellContextValue | null {
  return React.useContext(DashboardShellContext)
}

export type DashboardShellProps = {
  /** Usually an AppSidebar; it sits beside the content and owns its own collapse. */
  sidebar: React.ReactNode
  /** Usually a HeaderBar; it stays above the scrolling content. */
  header?: React.ReactNode
  children: React.ReactNode
  /** Whether the sidebar starts expanded; read it from the sidebar_state cookie to avoid a flash. */
  defaultOpen?: boolean
  /**
   * How wide the expanded sidebar is, as a CSS length. The provider writes
   * --sidebar-width as an inline style, which beats any class, so this is the
   * way to change it; the collapsed icon rail keeps its own width.
   */
  sidebarWidth?: string
  className?: string
  /** Merged into the provider's own --sidebar-width and --sidebar-width-icon. */
  style?: React.CSSProperties
  /** Classes for the content region, e.g. a different max width or padding. */
  contentClassName?: string
  /**
   * Frames a box on a page instead of the viewport — the whole shell shown as
   * one band of a page. The sidebar sits in the box rather than being fixed to
   * the window, the page is a plain region rather than a second <main>, and
   * ⌘B / Ctrl+B only toggles the rail while focus is inside the shell. Give
   * the box its height through className, or let the page inside set it.
   */
  contained?: boolean
}

/** The frame every dashboard page sits in: sidebar, header, and the page body. */
function DashboardShell({
  sidebar,
  header,
  children,
  defaultOpen = true,
  sidebarWidth,
  className,
  style,
  contentClassName,
  contained = false,
}: DashboardShellProps) {
  return (
    <DashboardShellContext.Provider value={SHELL_CONTEXT}>
      <SidebarProvider
        data-slot="dashboard-shell"
        defaultOpen={defaultOpen}
        contained={contained}
        className={cn(className)}
        style={
          sidebarWidth
            ? ({ "--sidebar-width": sidebarWidth, ...style } as React.CSSProperties)
            : style
        }
      >
        {sidebar}
        {/* SidebarInset is itself the <main> landmark, so the content region below
            is a plain div — a page has one main, not two. (Contained, the inset
            is a plain region too: the page around the box has the main.)
            Beside an inset sidebar it is the page's sheet: white, ringed, a
            step off the sidebar's ground, with the bar and the content on one
            plane. */}
        <SidebarInset>
          {header}
          <div
            data-slot="dashboard-shell-content"
            className={cn("flex-1 space-y-6 p-4 md:p-6", contentClassName)}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardShellContext.Provider>
  )
}

/** The same width and spacing as the shell's content region, for a page that skips the shell. */
function DashboardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-content"
      className={cn("mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-6", className)}
      {...props}
    />
  )
}

export { DashboardContent, DashboardShell, DashboardShellContext, useDashboardShell }
