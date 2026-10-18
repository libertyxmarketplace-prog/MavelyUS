"use client"

import * as React from "react"
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

/** Swaps the plain anchor for a router link — pass Next's Link, or your router's. */
export type RenderLink = (href: string, props: React.ComponentProps<"a">) => React.ReactNode

export type NavItem = {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  /** A count or short status beside the title. */
  badge?: React.ReactNode
  /** Sub-pages; the item becomes a collapsible group when there are any. */
  items?: { title: string; href: string }[]
  external?: boolean
}

export type NavGroup = { label?: string; items: NavItem[] }

export type AppSidebarProps = Omit<React.ComponentProps<typeof Sidebar>, "children"> & {
  brand: { name: string; logo?: React.ReactNode; href?: string; description?: string }
  header?: React.ReactNode
  groups: NavGroup[]
  footer?: React.ReactNode
  /**
   * The current pathname. The one entry it resolves to is lit — the longest
   * href it equals or sits below — and a group holding that entry is lit and open.
   */
  activePath?: string
  /** Items pinned to the bottom — settings, docs, support. */
  secondary?: NavItem[]
  /** Accessible name for the nav landmark; give each nav on a page its own. */
  navLabel?: string
  /**
   * A search field under the brand — usually the trigger of a command
   * palette. It hides with the rail, so keep the same search reachable from
   * the header or a shortcut.
   */
  search?: React.ReactNode
  renderLink?: RenderLink
}

/**
 * Sidebar rows follow the density token at half its swing: a nav item is not a
 * table row, and taking the full 0.5rem off would leave 24px of chrome around a
 * 16px icon. Comfortable resolves to exactly the 2rem and 1.75rem these have
 * always been; compact takes 4px off each. The literal is the comfortable
 * --density-row, so an install without the theme stylesheet is unchanged.
 */
const ROW_HEIGHT = {
  default: "h-[calc(var(--density-row,2.75rem)/2_+_0.625rem)]",
  sm: "h-[calc(var(--density-row,2.75rem)/2_+_0.375rem)]",
} as const

/**
 * A count sits as a plain figure; a word — "New", "Beta" — sits in a small
 * outlined chip in the success tone, the way a product marks what just
 * shipped. The badge is a ReactNode, so only a string or a number can be told
 * apart; anything else renders as given.
 */
function navBadge(badge: React.ReactNode): React.ReactNode {
  if (typeof badge === "string" && badge.trim() !== "" && Number.isNaN(Number(badge))) {
    return (
      <span
        data-slot="app-sidebar-chip"
        className="inline-flex h-5 items-center rounded-md border border-success/40 px-1 text-xs font-medium text-success"
      >
        {badge}
      </span>
    )
  }
  return badge
}

/** One entry of the sidebar: an item, or one of its sub-pages. */
type NavEntry = NavItem | NonNullable<NavItem["items"]>[number]

/** True when `path` is the entry's own route, or one or more full segments below it. */
function matchesPath(href: string, path: string) {
  return path === href || path.startsWith(`${href}/`)
}

/**
 * The one entry `activePath` resolves to, by findNavItem's rule in nav-config —
 * so the sidebar lights what the trail and the palette name: the longest href
 * the path equals or sits below, and of two equal ones the later, walking each
 * item before its sub-pages and the groups before the pinned items. A plain
 * prefix test lit every ancestor route as well, and a dashboard's Overview sits
 * at the root of all of them.
 */
function currentEntry(lists: NavItem[][], activePath?: string): NavEntry | undefined {
  if (!activePath) return undefined
  let best: NavEntry | undefined
  for (const items of lists) {
    for (const item of items) {
      for (const entry of [item, ...(item.items ?? [])]) {
        if (!matchesPath(entry.href, activePath)) continue
        if (!best || entry.href.length >= best.href.length) best = entry
      }
    }
  }
  return best
}

// renderLink is typed to ReactNode for callers; the sidebar primitive's render
// slot needs an element, and both branches here produce one.
type LinkFactory = (href: string, props?: React.ComponentProps<"a">) => React.ReactElement

function makeLinkFactory(renderLink?: RenderLink): LinkFactory {
  return (href, props = {}) =>
    (renderLink ? renderLink(href, props) : <a href={href} {...props} />) as React.ReactElement
}

function externalProps(item: NavItem): React.ComponentProps<"a"> {
  return item.external ? { target: "_blank", rel: "noreferrer" } : {}
}

/**
 * The lit entry's link says so to assistive technology as well as in paint:
 * the fill alone is colour, and a reader moving through the links would hear
 * nothing. A renderLink that sets its own aria-current still has the last word.
 */
function currentProps(isCurrent: boolean): React.ComponentProps<"a"> {
  return isCurrent ? { "aria-current": "page" } : {}
}

function AppSidebarItem({
  item,
  current,
  link,
  size = "default",
}: {
  item: NavItem
  /** The one entry the sidebar lights, from `currentEntry`. */
  current?: NavEntry
  link: LinkFactory
  size?: "default" | "sm"
}) {
  const Icon = item.icon
  // A group is lit, and opens, while it holds the current entry — itself or one of its pages.
  const holdsCurrent = current !== undefined && (item === current || (item.items?.includes(current) ?? false))
  const label = (
    <>
      {Icon ? <Icon className="shrink-0" /> : null}
      <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
      {item.external ? <ExternalLinkIcon className="ms-auto size-3.5 opacity-60 group-data-[collapsible=icon]:hidden" /> : null}
    </>
  )

  if (item.items?.length) {
    return (
      <SidebarMenuItem>
        <Collapsible key={`${item.href}:${holdsCurrent}`} defaultOpen={holdsCurrent}>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                isActive={holdsCurrent}
                size={size}
                tooltip={item.title}
                className={cn(ROW_HEIGHT[size], "group-data-[collapsible=icon]:justify-center")}
              >
                {label}
                {item.badge !== undefined ? (
                  <span
                    data-slot="app-sidebar-count"
                    className="ms-auto text-xs font-medium text-sidebar-foreground tabular-nums group-data-[collapsible=icon]:hidden"
                  >
                    <span className="sr-only">,</span> {navBadge(item.badge)}
                  </span>
                ) : null}
                <ChevronRightIcon
                  className={cn(
                    "shrink-0 transition-transform duration-(--duration-base) ease-(--ease-standard) group-data-[panel-open]/menu-button:rotate-90 rtl:-scale-x-100 rtl:group-data-[panel-open]/menu-button:-rotate-90 group-data-[collapsible=icon]:hidden",
                    item.badge === undefined && "ms-auto"
                  )}
                />
              </SidebarMenuButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((sub) => (
                <SidebarMenuSubItem key={sub.href}>
                  <SidebarMenuSubButton
                    // Only the current entry itself: a parent's own route (a
                    // "General" leaf at /settings) does not light up on every
                    // sibling sub-route.
                    isActive={sub === current}
                    render={link(sub.href, currentProps(sub === current))}
                    className={ROW_HEIGHT.sm}
                  >
                    <span className="truncate">{sub.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={item === current}
        size={size}
        tooltip={item.title}
        render={link(item.href, { ...externalProps(item), ...currentProps(item === current) })}
        className={cn(ROW_HEIGHT[size], "group-data-[collapsible=icon]:justify-center")}
      >
        {label}
      </SidebarMenuButton>
      {item.badge !== undefined ? (
        <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">
          {navBadge(item.badge)}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

/** The product sidebar: brand, grouped navigation, pinned secondary links, and a footer slot. */
function AppSidebar({
  className,
  brand,
  groups,
  footer,
  activePath,
  secondary,
  navLabel = "Main",
  search,
  renderLink,
  collapsible = "icon",
  variant = "inset",
  ...props
}: AppSidebarProps) {
  const link = makeLinkFactory(renderLink)
  const current = currentEntry([...groups.map((group) => group.items), secondary ?? []], activePath)
  const mark = (
    <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground [&_svg]:size-4">
      {brand.logo ?? (
        // Decorative: the wordmark beside it carries the name, and it stays in
        // the tree when the rail collapses (clipped by overflow, not hidden),
        // so the initial would only add letter noise.
        <span aria-hidden="true" className="text-sm font-semibold">
          {brand.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  )
  const wordmark = (
    <div className="grid flex-1 leading-tight">
      <span className="truncate text-sm font-semibold">{brand.name}</span>
      {brand.description ? (
        // The sidebar's own alpha-washed foreground reads at 3.85:1 on the
        // default palette's light mode — below the 4.5:1 floor for small
        // text. `muted-foreground` is one of the kit's four text tiers,
        // proven at 4.5:1 or better on every plane (including `sidebar`) in
        // every palette and both modes — see tests/contrast.test.ts.
        <span className="truncate text-xs text-muted-foreground">{brand.description}</span>
      ) : null}
    </div>
  )

  return (
    // data-slot lands on the sidebar's own container element, replacing the
    // upstream slot name there; the outer wrapper keeps data-slot="sidebar",
    // and none of the primitive's styling selects on either.
    <Sidebar
      data-slot="app-sidebar"
      collapsible={collapsible}
      variant={variant}
      // The phone's sheet is named for the product it navigates, not "Sidebar".
      sheetTitle={[brand.name, brand.description].filter((part) => typeof part === "string" && part).join(" ")}
      className={cn(className)}
      {...props}
    >
      {/* The brand row is 56px, the same as the header bar beside it, so the
          brand and the bar's controls sit on one line across the two planes;
          the search, when there is one, sits under it. No hairline: the
          sidebar is one quiet ground, and the bar draws the only rule. */}
      <SidebarHeader className="gap-0 px-2 py-0">
        {props.header ? (
          <div className="flex h-14 items-center">
            {props.header}
          </div>
        ) : (
          <SidebarMenu className="h-14 justify-center">
            <SidebarMenuItem>
              {brand.href ? (
                <SidebarMenuButton size="lg" className="h-10" render={link(brand.href)}>
                  {mark}
                  {wordmark}
                </SidebarMenuButton>
              ) : (
                // Not a link, so not a button either — a brand that goes nowhere
                // should not offer a tab stop.
                <div className="flex h-10 items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
                  {mark}
                  {wordmark}
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        {search ? (
          <div
            data-slot="app-sidebar-search"
            className="px-2 pb-2 group-data-[collapsible=icon]:hidden"
          >
            {search}
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <nav
          aria-label={navLabel}
          data-slot="app-sidebar-nav"
          className="flex min-h-0 flex-1 flex-col"
        >
          {groups.map((group, index) => (
            <SidebarGroup key={group.label ?? index}>
              {group.label ? <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{group.label}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <AppSidebarItem
                      key={item.href}
                      item={item}
                      current={current}
                      link={link}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {secondary?.length ? (
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondary.map((item) => (
                    <AppSidebarItem
                      key={item.href}
                      item={item}
                      current={current}
                      link={link}
                      size="sm"
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </nav>
      </SidebarContent>

      {footer ? (
        <SidebarFooter className="border-t border-sidebar-border">{footer}</SidebarFooter>
      ) : null}
    </Sidebar>
  )
}

export { AppSidebar }
