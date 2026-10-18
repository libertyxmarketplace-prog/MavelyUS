import { createRepository, daysAgo, intBetween, rowId, seeded } from "./core"

/** The four kinds of line a release note carries. */
export type ReleaseTag = "new" | "improved" | "fixed" | "removed"

/** One line of a release: what changed, and which kind of change it was. */
export type ReleaseEntry = { tag: ReleaseTag; text: string }

/** A shipped version of the product. */
export type Release = {
  id: string
  /** Semver, unique, newest first in the array. */
  version: string
  date: Date
  title: string
  summary: string
  /** Every tag its entries use, in the order the tags are declared. */
  tags: ReleaseTag[]
  entries: ReleaseEntry[]
  channel: "stable" | "beta"
}

const TAG_ORDER: readonly ReleaseTag[] = ["new", "improved", "fixed", "removed"]

// Written out rather than generated: a release note is prose a reader reads
// line by line, and an assembled sentence reads like one. The generator below
// only dates them and derives each release's tag set from its own entries.
const NOTES: readonly {
  version: string
  title: string
  summary: string
  channel: Release["channel"]
  entries: ReleaseEntry[]
}[] = [
  {
    version: "4.3.0",
    title: "Passkeys, and a faster orders table",
    summary: "Sign in without a password, and page through a hundred thousand orders without waiting.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Passkeys can now be registered from Settings → Security, one per device." },
      { tag: "improved", text: "The orders table pages on the server, so a large workspace opens in under a second." },
      { tag: "fixed", text: "A saved filter no longer survives a change of workspace." },
    ],
  },
  {
    version: "4.2.1",
    title: "Invoice rounding",
    summary: "A rounding fix for prorated lines, and two smaller corrections.",
    channel: "stable",
    entries: [
      { tag: "fixed", text: "Prorated lines round to the currency's minor unit instead of to the cent." },
      { tag: "fixed", text: "The billing period shown on an invoice honours the workspace timezone." },
    ],
  },
  {
    version: "4.2.0",
    title: "Scheduled reports",
    summary: "Have a saved view delivered by email, daily, weekly or monthly.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Schedule any saved view as a recurring CSV report." },
      { tag: "new", text: "Recipients outside the workspace can be added to a schedule." },
      { tag: "improved", text: "Exports now write dates in ISO 8601, always in UTC." },
    ],
  },
  {
    version: "4.1.0",
    title: "Webhook delivery log",
    summary: "Every attempt, its status code and its response body, kept for seven days.",
    channel: "stable",
    entries: [
      { tag: "new", text: "A delivery log for every webhook endpoint, with replay." },
      { tag: "improved", text: "Failed deliveries retry with exponential backoff for 24 hours." },
      { tag: "fixed", text: "Signature headers are computed over the raw body, not the parsed one." },
    ],
  },
  {
    version: "4.0.0",
    title: "The new shell",
    summary: "A rebuilt navigation, a command palette, and one breaking change to the API.",
    channel: "stable",
    entries: [
      { tag: "new", text: "A command palette on ⌘K reaches every page and every recent record." },
      { tag: "improved", text: "The sidebar collapses to icons and remembers the choice per device." },
      { tag: "removed", text: "The v1 REST endpoints are gone; v2 has been the default since 3.4." },
    ],
  },
  {
    version: "3.9.2",
    title: "Import stability",
    summary: "Large imports no longer time out at the mapping step.",
    channel: "stable",
    entries: [
      { tag: "fixed", text: "A CSV over 20 MB is parsed in chunks rather than in one pass." },
      { tag: "fixed", text: "Quoted fields containing newlines are read as one value." },
    ],
  },
  {
    version: "3.9.0",
    title: "Warehouse sync",
    summary: "Nightly incremental loads into your data warehouse.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Warehouse sync writes one table per entity plus a run manifest." },
      { tag: "new", text: "A first run loads everything; every run after it is incremental." },
      { tag: "improved", text: "Sync failures leave the previous tables untouched." },
    ],
  },
  {
    version: "3.8.0",
    title: "Roles you can shape",
    summary: "Custom roles with per-resource permissions, and an audit entry for every change.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Custom roles can be built from read, write, delete and admin per resource." },
      { tag: "improved", text: "The audit log records the fields a role change actually moved." },
      { tag: "fixed", text: "A member demoted mid-session loses access on their next request." },
    ],
  },
  {
    version: "3.7.1",
    title: "Chart legends",
    summary: "Legends stay readable at narrow widths.",
    channel: "beta",
    entries: [
      { tag: "improved", text: "Series names wrap instead of being clipped under 480px." },
      { tag: "fixed", text: "A single-series chart no longer draws an empty legend row." },
    ],
  },
  {
    version: "3.7.0",
    title: "Fulfillment stages",
    summary: "Track a parcel from picking to delivered, with exceptions raised where they happen.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Shipments carry four stages, each stamped as it is reached." },
      { tag: "new", text: "An exception on a parcel is shown on the order it belongs to." },
      { tag: "improved", text: "Carrier performance is broken out by service level." },
    ],
  },
  {
    version: "3.6.0",
    title: "Single sign-on",
    summary: "SAML and OIDC, with a break-glass login for the owner.",
    channel: "stable",
    entries: [
      { tag: "new", text: "SAML and OIDC providers can be configured per workspace." },
      { tag: "new", text: "Enforcement can be tested on one account before it is turned on for everyone." },
      { tag: "fixed", text: "An invitation accepted through SSO keeps the role it was sent with." },
    ],
  },
  {
    version: "3.5.0",
    title: "Two-factor authentication",
    summary: "Time-based codes, recovery codes, and a setup flow that fits on a phone.",
    channel: "stable",
    entries: [
      { tag: "new", text: "Time-based one-time codes from any authenticator app." },
      { tag: "new", text: "Ten single-use recovery codes, downloadable once." },
      { tag: "improved", text: "The setup secret can be typed by hand where a camera is not available." },
    ],
  },
  {
    version: "3.4.1",
    title: "Timezone corrections",
    summary: "Two places that read the server's clock instead of the workspace's.",
    channel: "stable",
    entries: [
      { tag: "fixed", text: "Daily aggregates bucket on the workspace timezone, not the server's." },
      { tag: "fixed", text: "The activity feed groups by the reader's own day boundaries." },
    ],
  },
  {
    version: "3.4.0",
    title: "API v2",
    summary: "Cursor pagination, sparse fieldsets, and a deprecation clock on v1.",
    channel: "stable",
    entries: [
      { tag: "new", text: "v2 endpoints page by cursor and accept sparse fieldsets." },
      { tag: "improved", text: "Rate limits are reported on every response, not only on a 429." },
      { tag: "removed", text: "v1 is deprecated and will be removed in the next major version." },
    ],
  },
]

function generate(): Release[] {
  const rand = seeded("releases")
  // Newest first: the most recent shipped a few days ago, and each older one
  // steps further back, so the array is already in the order a changelog reads.
  let daysBack = intBetween(rand, 3, 9)

  return NOTES.map((note, index) => {
    if (index > 0) daysBack += intBetween(rand, 12, 40)

    return {
      id: rowId("rel", index + 1),
      version: note.version,
      // Whole days, so a release is dated rather than timed.
      date: new Date(Date.UTC(...dayParts(daysAgo(daysBack)))),
      title: note.title,
      summary: note.summary,
      tags: TAG_ORDER.filter((tag) => note.entries.some((entry) => entry.tag === tag)),
      entries: note.entries,
      channel: note.channel,
    }
  })
}

/** A date's UTC year, month and day, for a midnight-UTC rebuild of it. */
function dayParts(at: Date): [number, number, number] {
  return [at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()]
}

/** The seeded release history, newest first. The repository owns the live rows. */
export const RELEASES: Release[] = generate()

export const releases = createRepository(RELEASES, {
  searchKeys: ["version", "title", "summary"],
  filterKeys: ["channel"],
})
