import { Changelog, type ChangelogEntry } from "@/components/ui/changelog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

const ENTRIES: ChangelogEntry[] = [
  {
    version: "3.2.0",
    date: "2026-10-21T02:00:00.000Z",
    title: "V2 Bump Engine & Dynamic Telemetry Trajectory",
    description: "Upgraded slash command /bump with server bump counters and direct links, alongside dynamic Recharts member growth charts and directory pagination.",
    tags: ["new", "improved"],
    items: [
      "Enhanced /bump slash command returning rich embed with custom emojis, total bump counter, and erlc.us directory link",
      "Dynamic verified member growth trajectory line chart powered by Recharts",
      "Custom banner image upload in Promote Server Studio with real-time preview",
      "Complete Anti-Raid & Churn Security suite with live defense shield rating and 72h retention enforcement",
      "Paginated community directory discovery and joined communities management",
      "Redesigned community growth tiers with transparent Vibra UI pricing cards and custom banners included on Free",
    ],
    href: "#v3-2-0",
  },
  {
    version: "3.0.0",
    date: "2026-10-17T08:00:00.000Z",
    title: "Mavely Community Growth & Discord Gateway Integration",
    description: "Major release introducing the real-time Discord directory, live bot presence inspection, and 72-hour credit retention guarantees.",
    tags: ["new", "improved"],
    items: [
      "Automated Discord bot guild membership detection via live gateway presence inspection",
      "72-Hour retention guarantee enforcing automatic bounty clawback if an account departs early",
      "Customizable community discovery cards with verified badges, real view tracking, and member counts",
      "Interactive 5-star community rating system with instant feedback and ratings persistence",
      "/bump command integration to elevate partner communities to the top of the directory with a 1-hour cooldown",
      "Dedicated System Telemetry with live process memory (RSS & Heap), uptime duration, and API latency",
      "Dynamic real-time notification engine linked to Discord user joins and daily rewards",
    ],
    href: "#v3-0-0",
  },
  {
    version: "2.4.0",
    date: "2026-10-15T14:30:00.000Z",
    title: "Treasury Transfers & Multi-Server Discord Switcher",
    description: "Added zero-fee credit transfers between Discord users and communities, alongside an instant multi-guild workspace switcher.",
    tags: ["new", "improved"],
    items: [
      "Zero-fee credit transfer hub with Discord Snowflake validation and instant balance deduction",
      "Discord Workspace Switcher syncing user guild permissions and community avatars automatically",
      "Multi-Category tagging (up to 3 categories) and Primary Community Language selector",
    ],
    href: "#v2-4-0",
  },
  {
    version: "2.3.0",
    date: "2026-10-10T11:00:00.000Z",
    title: "7-Day Daily Check-In Progression & Streak Rewards",
    description: "Introduced an escalating 7-day reward calendar with automated streak resets and Day 7 grand milestone bounties.",
    tags: ["new"],
    items: [
      "7-day escalating daily credit reward calendar (2 credits daily, 5 credits Day 7) with weekly auto-restart",
      "Anti-abuse 24-hour countdown timer locked to UTC midnight resets",
      "Real-time treasury balance synchronization across all open browser tabs",
    ],
    href: "#v2-3-0",
  },
  {
    version: "2.2.0",
    date: "2026-10-04T16:00:00.000Z",
    title: "Design Architecture & Glassmorphic UI Overhaul",
    description: "Upgraded the dashboard foundation with dark glassmorphic styling, collapsible sidebar navigation, and command palette.",
    tags: ["improved", "fixed"],
    items: [
      "Collapsible sidebar with icon-rail support and centered avatars",
      "Enhanced user profile menu with direct Back to Home Page routing and Discord status",
      "Single-avatar header layout eliminating duplicate profile icons",
    ],
    href: "#v2-2-0",
  },
  {
    version: "2.0.0",
    date: "2026-09-28T09:00:00.000Z",
    title: "Initial Mavely Bot Platform Launch",
    description: "The core platform engine connecting Discord communities with community growth tools.",
    tags: ["new"],
    items: [
      "Discord OAuth2 authentication with automated guild discovery and permission validation",
      "Discord bot gateway manager supporting multi-tenant bot instances",
      "REST API backend on Express v4 with encrypted configuration storage",
    ],
    href: "#v2-0-0",
  },
]

export function ChangelogTab() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="size-4" />
            <span>Platform Updates</span>
          </div>
          <CardTitle className="text-lg font-bold text-white tracking-tight">
            Release Notes & Development Changelog
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            Real historical releases, engineering improvements, and feature rollouts for the Mavely Discord platform.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Changelog className="w-full" entries={ENTRIES} />
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangelogTab;
