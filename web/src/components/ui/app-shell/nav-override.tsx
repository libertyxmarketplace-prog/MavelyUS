"use client"

import * as React from "react"

import { type NavConfig } from "@/lib/nav-config"

/**
 * The navigation a page wears when something outside it decides.
 *
 * A block ships with its own `nav.ts` because it installs as a route in your
 * app and has to stand up alone. Put the same block in a template and that is
 * no longer true: every page there shares the template's navigation, which is
 * why the generator rewrites each block's `nav.ts` into a re-export of
 * `app/nav.ts`.
 *
 * A preview cannot rewrite a file, so it says so at runtime instead. Wrap a
 * page in this and its shell takes the nav given here in place of the one the
 * page passed — the template browser frames a block this way, so the frame
 * shows the template's own sidebar rather than the block's, which is what the
 * reader would get if they installed it.
 *
 * `activeHref` travels with it because the two are one decision: a nav the page
 * did not choose does not contain the route the page thinks it is at. And
 * `navigate` travels with both: the nav's routes are not routes where the page
 * is shown, so when the shell moves to one itself — a command palette pick,
 * which is a router call rather than a link — it asks the override where that
 * route is shown instead of pushing an address that does not exist here.
 */
export type NavOverride = {
  nav: NavConfig
  activeHref?: string
  /** Moves the page to one of the nav's routes; the shell's own router when absent. */
  navigate?: (href: string) => void
}

const NavOverrideContext = React.createContext<NavOverride | null>(null)

export function NavOverrideProvider({
  value,
  children,
}: {
  value: NavOverride
  children: React.ReactNode
}) {
  const stable = React.useMemo(() => value, [value])
  return <NavOverrideContext.Provider value={stable}>{children}</NavOverrideContext.Provider>
}

/** The override in force, or null — which is the ordinary case. */
export function useNavOverride(): NavOverride | null {
  return React.useContext(NavOverrideContext)
}
