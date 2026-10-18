export type NavIconName =
  | "layout-dashboard"
  | "users"
  | "user-round"
  | "shopping-cart"
  | "receipt"
  | "credit-card"
  | "settings"
  | "bell"
  | "inbox"
  | "calendar"
  | "activity"
  | "shield"
  | "key"
  | "key-round"
  | "plug"
  | "chart-line"
  | "file-text"
  | "life-buoy"
  | "server"
  | "sparkles"
  | "package"
  | "megaphone"
  | "git-branch"
  | "alert-triangle"
  | "list"
  | "home"
  | "briefcase"
  | "building"
  | "graduation-cap"
  | "heart-pulse"
  | "coins"
  | "folder"
  | "sticky-note"
  | "message-circle"
  | "list-todo"
  | "bot"
  | "image"
  | "audio-lines"
  | "wallet"
  | "workflow"
  | "mail"
  | "message-square-heart"

export type NavItem = {
  title: string
  href: string
  icon?: NavIconName
  badge?: string | number
  items?: NavItem[] // one level of nesting
  exact?: boolean // match pathname exactly (default: prefix)
}

export type NavGroup = { label?: string; items: NavItem[] }

export type NavBrand = { name: string; initial: string; href: string; caption?: string }

export type NavConfig = { brand: NavBrand; groups: NavGroup[]; footer?: NavItem[] }

/**
 * Every item in `config`, depth-first: each item is immediately followed by
 * its own nested items, groups are visited in order, and the footer comes
 * last.
 */
export function flattenNav(config: NavConfig): NavItem[] {
  const result: NavItem[] = []
  const visit = (item: NavItem) => {
    result.push(item)
    item.items?.forEach(visit)
  }
  for (const group of config.groups) group.items.forEach(visit)
  config.footer?.forEach(visit)
  return result
}

// An href matches its own pathname or anything one full segment below it —
// "/settings" matches "/settings/security" but not "/settings-billing", a
// sibling route that merely shares a text prefix.
function isUnder(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// An `exact` item matches only its own pathname; any other item, by isUnder.
function matchesPathname(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : isUnder(item.href, pathname)
}

/**
 * The item whose href best matches `pathname`. An `exact` item matches only
 * that exact pathname; every other item matches by prefix, and when more
 * than one item matches, the one with the longest href wins.
 */
export function findNavItem(config: NavConfig, pathname: string): NavItem | undefined {
  let best: NavItem | undefined
  for (const item of flattenNav(config)) {
    if (!matchesPathname(item, pathname)) continue
    if (!best || item.href.length >= best.href.length) best = item
  }
  return best
}

/**
 * The href in a flat list of links that `pathname` is on — `findNavItem`'s
 * rule without a NavConfig around it, for a bar of plain links such as a
 * marketing site's navbar: an href matches its own pathname or one full
 * segment and more below it, and the longest match wins, so on "/docs/api"
 * the list ["/docs", "/docs/api"] answers "/docs/api" and ["/docs", "/pricing"]
 * answers "/docs". Undefined when nothing matches or there is no pathname.
 */
export function currentHref(hrefs: readonly string[], pathname: string | null | undefined): string | undefined {
  if (!pathname) return undefined
  let best: string | undefined
  for (const href of hrefs) {
    if (!isUnder(href, pathname)) continue
    if (best === undefined || href.length >= best.length) best = href
  }
  return best
}

/**
 * The trail from the brand to the matched item: the brand, then the matched
 * item's group item, then the matched item itself when it is nested one
 * level down. Returns just the brand when nothing matches `pathname`.
 */
export function breadcrumbsFor(config: NavConfig, pathname: string): { title: string; href: string }[] {
  const trail: { title: string; href: string }[] = [{ title: config.brand.name, href: config.brand.href }]
  const match = findNavItem(config, pathname)
  if (!match) return trail

  const lists = [...config.groups.map((group) => group.items), config.footer ?? []]
  for (const items of lists) {
    for (const item of items) {
      if (item === match) return [...trail, { title: item.title, href: item.href }]
      const nested = item.items?.find((child) => child === match)
      if (nested) {
        return [...trail, { title: item.title, href: item.href }, { title: nested.title, href: nested.href }]
      }
    }
  }
  return trail
}

/**
 * The matched item's title, or the last pathname segment humanised: dashes
 * become spaces and only the first letter is capitalised, e.g. "/api-keys" →
 * "Api keys".
 */
export function titleFor(config: NavConfig, pathname: string): string {
  const match = findNavItem(config, pathname)
  if (match) return match.title

  const segment = pathname.split("/").filter(Boolean).pop() ?? ""
  const humanised = segment.replace(/-/g, " ")
  return humanised.charAt(0).toUpperCase() + humanised.slice(1)
}

/**
 * Several navs as one sidebar — two dashboards installed in one app. The first
 * nav's brand leads; every group follows in order, and a group with no label
 * of its own takes its nav's brand caption (its name, when it has none) so the
 * reader can tell whose tabs they are. The footers join with each href once,
 * the first claim winning — and a footer link to a route one of the merged
 * tabs already holds is dropped, since findNavItem gives a tie to the later
 * item and the tab would never read as current. One nav comes back as it was.
 */
export function mergeNav(...navs: NavConfig[]): NavConfig {
  const [first] = navs
  if (!first) throw new Error("mergeNav needs at least one nav to take the brand from.")
  if (navs.length === 1) return { ...first }

  const groups = navs.flatMap((nav) =>
    nav.groups.map((group) => (group.label ? group : { ...group, label: nav.brand.caption || nav.brand.name }))
  )
  const held = new Set(flattenNav({ brand: first.brand, groups }).map((item) => item.href))
  const footer = navs
    .flatMap((nav) => nav.footer ?? [])
    .filter((item) => {
      if (held.has(item.href)) return false
      held.add(item.href)
      return true
    })

  return { brand: first.brand, groups, ...(navs.some((nav) => nav.footer) ? { footer } : {}) }
}
