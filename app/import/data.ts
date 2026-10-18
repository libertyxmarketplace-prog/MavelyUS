/**
 * What this page reads. The importer itself reads nothing from `db` — the file
 * a reader brings is the data — so this is only what the shell around it needs:
 * who is signed in, what is in the bell, and how many accounts the store holds
 * before anything is added to it. "Now" is `REFERENCE_DATE`.
 */
import { REFERENCE_DATE, db } from "@/lib/sample-data"

const NOW = new Date(2026, 8, 4, 12, 0, 0).getTime()

/** The bell's contents: the newest notifications, unread first in the panel. */
export function shellNotifications() {
  return [
    {
      id: "n_8241",
      title: "Deploy finished",
      description: "web-app 4.12.0 is live in production.",
      at: new Date(NOW - 3 * 60_000),
      read: false,
    },
    {
      id: "n_8240",
      title: "Usage at 92% of plan",
      description: "1.84M of 2M events this cycle.",
      at: new Date(NOW - 48 * 60_000),
      read: false,
    },
    {
      id: "n_8239",
      title: "Priya Raman commented on Weekly revenue",
      description: "“Can we split this by region before Thursday?”",
      at: new Date(NOW - 2 * 60 * 60_000),
      read: true,
    },
    {
      id: "n_8238",
      title: "Webhook delivery failed",
      description: "orders.created returned 502 four times.",
      at: new Date(NOW - 5 * 60 * 60_000),
      read: true,
    },
    {
      id: "n_8237",
      title: "Invoice INV-2093 paid",
      description: "$1,240.00 from Blue Harbor Logistics.",
      at: new Date(NOW - 22 * 60 * 60_000),
      read: true,
    },
    {
      id: "n_8236",
      title: "Marcus Bell accepted your invitation",
      description: "Joined the community staff team.",
      at: new Date(NOW - 2 * 24 * 60 * 60_000),
      read: true,
    },
    {
      id: "n_8235",
      title: "Scheduled export completed",
      description: "customers-weekly.csv · 42,918 rows.",
      at: new Date(NOW - 3 * 24 * 60 * 60_000),
      read: true,
    },
    {
      id: "n_8234",
      title: "API key rotated",
      description: "sk_live_…f21c was replaced by Ada Lovelace.",
      at: new Date(NOW - 6 * 24 * 60 * 60_000),
      read: true,
    },
  ]
}

/** The person looking at the page: CivLink operator or authenticated Discord admin. */
export function currentUser(customUser?: { username?: string; id?: string; avatar?: string | null } | null) {
  if (customUser && customUser.username) {
    const avatarUrl = customUser.avatar
      ? `https://cdn.discordapp.com/avatars/${customUser.id}/${customUser.avatar}.png`
      : "/mavely-mark.png"
    return {
      name: customUser.username,
      email: `${customUser.username.toLowerCase()}@discord.user`,
      initials: customUser.username.slice(0, 2).toUpperCase(),
      avatarUrl,
    }
  }

  return {
    name: "CivLink Operator",
    email: "operator@civlink.app",
    initials: "CL",
    avatarUrl: "/mavely-mark.png",
  }
}

// Fixed to UTC so the line reads the same wherever the page is rendered.
const UPDATED_AT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  hourCycle: "h23",
  timeZone: "UTC",
})

/** How many accounts the store held when the page was rendered. */
export function lastUpdated(): string {
  return `${db.customers.all().length} accounts · ${UPDATED_AT.format(REFERENCE_DATE)} UTC`
}
