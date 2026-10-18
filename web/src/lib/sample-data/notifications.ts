import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, pick, pickWeighted, rowId, seeded } from "./core"

/** One entry in a member's notification inbox. */
export type Notification = {
  id: string
  title: string
  description?: string
  kind: "mention" | "assignment" | "billing" | "system" | "security"
  at: Date
  read: boolean
  href?: string
}

const COUNT = 40

const FIRST_NAMES = ["Priya", "Marco", "Elin", "Tariq", "Naledi", "Jasper", "Renata", "Kofi"]

const KIND_MIX: readonly (readonly [Notification["kind"], number])[] = [
  ["mention", 0.3],
  ["assignment", 0.25],
  ["system", 0.25],
  ["billing", 0.12],
  ["security", 0.08],
]

type Built = { title: string; description?: string; href?: string }

/** Title, description, and link per kind — a teammate's name where one fits. */
const BUILDERS: Record<Notification["kind"], (rand: () => number) => Built> = {
  mention: (rand) => ({
    title: `${pick(rand, FIRST_NAMES)} mentioned you in a comment`,
    description: "Tap to see the full thread.",
    href: "/comments",
  }),
  assignment: (rand) => ({
    title: `${pick(rand, FIRST_NAMES)} assigned you a task`,
    description: "Added to your queue just now.",
    href: "/projects/tasks",
  }),
  billing: () => ({
    title: "Your invoice is ready",
    description: "This month's invoice has been generated.",
    href: "/settings/billing",
  }),
  system: () => ({
    title: "Scheduled maintenance completed",
    description: "All systems are back to normal.",
    href: "/status",
  }),
  security: () => ({
    title: "New sign-in from an unrecognized device",
    description: "Review your recent account activity.",
    href: "/settings/security",
  }),
}

function generate(): Notification[] {
  const rand = seeded("notifications")
  return Array.from({ length: COUNT }, (_, index) => {
    const kind = pickWeighted(rand, KIND_MIX)
    const at = dateBetween(rand, daysAgo(30), REFERENCE_DATE)
    const daysOld = (REFERENCE_DATE.getTime() - at.getTime()) / 86_400_000
    const built = BUILDERS[kind](rand)
    return {
      id: rowId("ntf", index + 1),
      title: built.title,
      description: built.description,
      kind,
      at,
      // Anything older than a couple of days has almost certainly been seen.
      read: daysOld > 2 ? chance(rand, 0.9) : chance(rand, 0.35),
      href: built.href,
    }
  })
}

/** The seeded notification inbox. The repository below owns the rows a demo mutates. */
export const NOTIFICATIONS: Notification[] = generate()

export const notifications = createRepository(NOTIFICATIONS, {
  searchKeys: ["title", "description"],
  filterKeys: ["kind", "read"],
})
