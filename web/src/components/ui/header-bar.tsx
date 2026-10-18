"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useDashboardShell } from "@/components/ui/dashboard-shell"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Swaps the plain anchor for a router link. Declared here rather than imported
 * from app-sidebar so this file installs on its own; the shape is the same.
 */
export type RenderLink = (href: string, props: React.ComponentProps<"a">) => React.ReactNode

export type Crumb = { label: React.ReactNode; href?: string }

export type HeaderBarProps = React.ComponentProps<"header"> & {
  /** The trail to this page; the last entry is the page itself. */
  breadcrumbs?: Crumb[]
  /** Shown when there are no breadcrumbs. */
  title?: React.ReactNode
  search?: React.ReactNode
  actions?: React.ReactNode
  sticky?: boolean
  /**
   * Whether the last crumb is the page you are on. True renders it as
   * BreadcrumbPage, which is what a full trail wants. Pass false when the trail
   * has been cut short of the page — because the page writes its own name in a
   * PageHeader — so the crumb that is left stays a link to somewhere.
   */
  lastCrumbIsPage?: boolean
  /** "auto" shows the collapse toggle only inside a DashboardShell; true always shows it. */
  showSidebarTrigger?: boolean | "auto"
  /**
   * Names the trail's nav landmark; the Breadcrumb primitive calls it
   * "breadcrumb". Give each bar its own when a page holds two — two shells
   * previewed on one page, say — so the landmarks can be told apart.
   */
  breadcrumbLabel?: string
  renderLink?: RenderLink
}

/** The 56px bar across the top of a dashboard page: trigger, trail, search, actions. */
function HeaderBar({
  className,
  breadcrumbs,
  title,
  search,
  actions,
  sticky = false,
  lastCrumbIsPage = true,
  showSidebarTrigger = true,
  breadcrumbLabel,
  renderLink,
  ...props
}: HeaderBarProps) {
  const showTrigger = showSidebarTrigger !== false
  // renderLink is typed to ReactNode for callers; Breadcrumb's render slot
  // needs an element, and every path here produces one.
  const link = (href: string, linkProps: React.ComponentProps<"a">) =>
    (renderLink ? renderLink(href, linkProps) : <a href={href} {...linkProps} />) as React.ReactElement

  return (
    <header
      data-slot="header-bar"
      data-sticky={sticky || undefined}
      className={cn(
        // The bar and the content beneath it share one plane — --background —
        // in both themes, which ends the old raised-in-light / recessed-in-dark
        // flip. 85% is the floor for translucent chrome: below it the text
        // starts reading against whatever scrolls under the bar.
        "flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/85",
        sticky && "sticky top-0 z-30",
        className
      )}
      {...props}
    >
      {showTrigger ? (
        <>
          <SidebarTrigger className="-ms-1.5" />
          <Separator orientation="vertical" className="me-1 data-vertical:h-4 data-vertical:self-center" />
        </>
      ) : null}

      {breadcrumbs?.length ? (
        <Breadcrumb className="min-w-0" {...(breadcrumbLabel ? { "aria-label": breadcrumbLabel } : {})}>
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((crumb, index) => {
              const last = index === breadcrumbs.length - 1
              const isPage = last && lastCrumbIsPage
              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem className="min-w-0">
                    {isPage ? (
                      <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                    ) : crumb.href ? (
                      <BreadcrumbLink
                        className="truncate"
                        render={link(crumb.href, { children: crumb.label })}
                      />
                    ) : (
                      <span className="truncate">{crumb.label}</span>
                    )}
                  </BreadcrumbItem>
                  {last ? null : <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : title ? (
        <div data-slot="header-bar-title" className="truncate text-sm font-medium">
          {title}
        </div>
      ) : null}

      {search || actions ? (
        <div data-slot="header-bar-actions" className="ms-auto flex items-center gap-2">
          {search}
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export { HeaderBar }
