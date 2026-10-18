import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, intBetween, rowId, seeded } from "./core"

/**
 * The lucide icons a step may wear, by name. The page that draws a canvas
 * holds one component per name in a fixed map, so a step can only name an
 * icon that map has — this list is that contract.
 */
export const WORKFLOW_ICONS = [
  "building-2",
  "calendar-clock",
  "chart-line",
  "clipboard-list",
  "credit-card",
  "file-text",
  "flag",
  "gauge",
  "hourglass",
  "list-todo",
  "mail",
  "message-circle",
  "message-square",
  "package",
  "receipt",
  "rotate-cw",
  "shopping-cart",
  "split",
  "tag",
  "ticket",
  "user-check",
  "user-plus",
  "users",
] as const

export type WorkflowIcon = (typeof WORKFLOW_ICONS)[number]

/** One step on a canvas: what starts the flow, what it does, where it forks and where it waits. */
export type WorkflowNode = {
  id: string
  kind: "trigger" | "action" | "branch" | "delay"
  title: string
  /** A lucide icon name from WORKFLOW_ICONS. */
  icon: WorkflowIcon
  /** One line: which app the step works in, and on what. */
  summary: string
  /** The step's top-left corner on the plane, in pixels at 100%. */
  x: number
  y: number
}

/** A connection from one step to the next; a branch's two ways out are labelled "yes" and "no". */
export type WorkflowEdge = { from: string; to: string; label?: string }

/** One time the workflow ran, start to finish. */
export type WorkflowRun = {
  id: string
  startedAt: Date
  durationMs: number
  status: "succeeded" | "failed" | "running"
}

/** An automation: a trigger and the steps it sets off, drawn as a graph, with the runs it has made. */
export type Workflow = {
  id: string
  name: string
  status: "active" | "paused" | "draft"
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  /** Oldest first. */
  runs: WorkflowRun[]
}

const COUNT = 8

/**
 * The grid the steps sit on: a column every 280px and a row every 104px, so a
 * step 216px wide and 76px tall leaves room for an edge and its label between
 * columns. A row may be a half — the step a branch leaves from sits between
 * its two ways out.
 */
const COLUMN = 280
const ROW = 104

/** A step as written below: its place on the grid by column and row. */
type Step = Omit<WorkflowNode, "x" | "y"> & { at: readonly [column: number, row: number] }

type Blueprint = {
  name: string
  status: Workflow["status"]
  steps: Step[]
  edges: WorkflowEdge[]
  /** How many runs a live workflow makes over the fortnight, and on what schedule a timed one runs. */
  runs: { count: [number, number]; failRate: number } | { mondaysAt: number } | null
}

// Real automations for the sample store, written by hand: a word combinator
// cannot draw a graph that means anything. Every app is Northwind's own or a
// fictional tool — "Team chat", "Mail", "Enrich" — never a third party's.
const BLUEPRINTS: readonly Blueprint[] = [
  {
    name: "Announce new orders",
    status: "active",
    steps: [
      { id: "trigger", kind: "trigger", title: "Order placed", icon: "shopping-cart", summary: "Store · a paid order comes in", at: [0, 0.5] },
      { id: "size", kind: "branch", title: "Over $500?", icon: "split", summary: "Checks the order total before tax", at: [1, 0.5] },
      { id: "big", kind: "action", title: "Post to #big-orders", icon: "message-square", summary: "Team chat · number, customer and total", at: [2, 0] },
      { id: "all", kind: "action", title: "Post to #orders", icon: "message-square", summary: "Team chat · one line per order", at: [2, 1] },
    ],
    edges: [
      { from: "trigger", to: "size" },
      { from: "size", to: "big", label: "yes" },
      { from: "size", to: "all", label: "no" },
    ],
    runs: { count: [12, 16], failRate: 0.06 },
  },
  {
    name: "Recover failed payments",
    status: "active",
    steps: [
      { id: "trigger", kind: "trigger", title: "Payment failed", icon: "credit-card", summary: "Billing · a card charge is declined", at: [0, 0.5] },
      { id: "email", kind: "action", title: "Email the customer", icon: "mail", summary: "Mail · the update-your-card note", at: [1, 0.5] },
      { id: "wait", kind: "delay", title: "Wait 3 days", icon: "hourglass", summary: "Gives the customer time to update", at: [2, 0.5] },
      { id: "check", kind: "branch", title: "Card updated?", icon: "split", summary: "Billing · reads the card on file", at: [3, 0.5] },
      { id: "retry", kind: "action", title: "Retry the charge", icon: "rotate-cw", summary: "Billing · charges the new card", at: [4, 0] },
      { id: "flag", kind: "action", title: "Flag for billing", icon: "flag", summary: "Adds a task for the billing team", at: [4, 1] },
    ],
    edges: [
      { from: "trigger", to: "email" },
      { from: "email", to: "wait" },
      { from: "wait", to: "check" },
      { from: "check", to: "retry", label: "yes" },
      { from: "check", to: "flag", label: "no" },
    ],
    runs: { count: [4, 7], failRate: 0.2 },
  },
  {
    name: "Route new leads",
    status: "active",
    steps: [
      { id: "trigger", kind: "trigger", title: "Lead created", icon: "user-plus", summary: "CRM · a form fill or an import", at: [0, 0.5] },
      { id: "enrich", kind: "action", title: "Enrich the company", icon: "building-2", summary: "Enrich · size, industry and country", at: [1, 0.5] },
      { id: "size", kind: "branch", title: "500 or more staff?", icon: "split", summary: "Reads the enriched headcount", at: [2, 0.5] },
      { id: "owner", kind: "action", title: "Assign an account exec", icon: "user-check", summary: "CRM · the enterprise desk takes it", at: [3, 0] },
      { id: "rotation", kind: "action", title: "Assign by rotation", icon: "users", summary: "CRM · next rep in the queue", at: [3, 1] },
      { id: "announce", kind: "action", title: "Post to #sales", icon: "message-square", summary: "Team chat · the lead and its owner", at: [4, 0.5] },
    ],
    edges: [
      { from: "trigger", to: "enrich" },
      { from: "enrich", to: "size" },
      { from: "size", to: "owner", label: "yes" },
      { from: "size", to: "rotation", label: "no" },
      { from: "owner", to: "announce" },
      { from: "rotation", to: "announce" },
    ],
    runs: { count: [8, 11], failRate: 0.1 },
  },
  {
    name: "Reorder low stock",
    status: "active",
    steps: [
      { id: "trigger", kind: "trigger", title: "Stock below reorder point", icon: "package", summary: "Inventory · a count drops past the line", at: [0, 0.5] },
      { id: "order", kind: "action", title: "Draft a purchase order", icon: "file-text", summary: "Inventory · to the product's supplier", at: [1, 0.5] },
      { id: "supplier", kind: "action", title: "Email the supplier", icon: "mail", summary: "Mail · the order as a PDF", at: [2, 0] },
      { id: "announce", kind: "action", title: "Post to #inventory", icon: "message-square", summary: "Team chat · what was ordered", at: [2, 1] },
    ],
    edges: [
      { from: "trigger", to: "order" },
      { from: "order", to: "supplier" },
      { from: "order", to: "announce" },
    ],
    runs: { count: [3, 5], failRate: 0.1 },
  },
  {
    name: "Welcome new customers",
    status: "active",
    steps: [
      { id: "trigger", kind: "trigger", title: "Customer signed up", icon: "user-plus", summary: "Store · a new account is created", at: [0, 0.5] },
      { id: "email", kind: "action", title: "Send the welcome email", icon: "mail", summary: "Mail · from the founders", at: [1, 0.5] },
      { id: "wait", kind: "delay", title: "Wait 2 days", icon: "hourglass", summary: "Leaves room for a first order", at: [2, 0.5] },
      { id: "check", kind: "branch", title: "Placed an order?", icon: "split", summary: "Store · reads the order book", at: [3, 0.5] },
      { id: "tag", kind: "action", title: "Tag as a buyer", icon: "tag", summary: "CRM · moves them to the buyer list", at: [4, 0] },
      { id: "code", kind: "action", title: "Send the WELCOME10 code", icon: "ticket", summary: "Mail · 10% off a first order", at: [4, 1] },
    ],
    edges: [
      { from: "trigger", to: "email" },
      { from: "email", to: "wait" },
      { from: "wait", to: "check" },
      { from: "check", to: "tag", label: "yes" },
      { from: "check", to: "code", label: "no" },
    ],
    runs: { count: [6, 9], failRate: 0.05 },
  },
  {
    name: "Weekly sales digest",
    status: "paused",
    steps: [
      { id: "trigger", kind: "trigger", title: "Every Monday at 08:00", icon: "calendar-clock", summary: "Schedule · UTC", at: [0, 0.5] },
      { id: "compile", kind: "action", title: "Compile last week's sales", icon: "chart-line", summary: "Store · revenue, orders and returns", at: [1, 0.5] },
      { id: "email", kind: "action", title: "Email the leadership list", icon: "mail", summary: "Mail · the digest as a table", at: [2, 0] },
      { id: "announce", kind: "action", title: "Post to #general", icon: "message-square", summary: "Team chat · the three headline numbers", at: [2, 1] },
    ],
    edges: [
      { from: "trigger", to: "compile" },
      { from: "compile", to: "email" },
      { from: "compile", to: "announce" },
    ],
    runs: { mondaysAt: 8 },
  },
  {
    name: "Refund follow-up",
    status: "draft",
    steps: [
      { id: "trigger", kind: "trigger", title: "Refund issued", icon: "receipt", summary: "Billing · an order is refunded", at: [0, 0.5] },
      { id: "reason", kind: "action", title: "Log the refund reason", icon: "clipboard-list", summary: "CRM · on the customer's record", at: [1, 0] },
      { id: "wait", kind: "delay", title: "Wait 7 days", icon: "hourglass", summary: "Lets the refund land first", at: [1, 1] },
      { id: "survey", kind: "action", title: "Ask how it went", icon: "message-circle", summary: "Mail · a two-question survey", at: [2, 1] },
    ],
    edges: [
      { from: "trigger", to: "reason" },
      { from: "trigger", to: "wait" },
      { from: "wait", to: "survey" },
    ],
    runs: null,
  },
  {
    name: "Churn-risk alert",
    status: "draft",
    // Half-built: the steps are drawn, the trigger that would start them is not.
    steps: [
      { id: "score", kind: "action", title: "Score the account", icon: "gauge", summary: "CRM · usage, seats and tickets", at: [0, 0.5] },
      { id: "check", kind: "branch", title: "Score below 40?", icon: "split", summary: "Reads the health score", at: [1, 0.5] },
      { id: "task", kind: "action", title: "Open a task for the owner", icon: "list-todo", summary: "CRM · due in two days", at: [2, 0] },
      { id: "log", kind: "action", title: "Log the score", icon: "clipboard-list", summary: "CRM · the account's health history", at: [2, 1] },
    ],
    edges: [
      { from: "score", to: "check" },
      { from: "check", to: "task", label: "yes" },
      { from: "check", to: "log", label: "no" },
    ],
    runs: null,
  },
]

/** Every Monday at `hour` UTC in the fortnight before now, oldest first. */
function mondaysAt(hour: number): Date[] {
  const from = daysAgo(14).getTime()
  const out: Date[] = []
  for (let day = 14; day >= 0; day--) {
    const at = daysAgo(day)
    const slot = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), hour)
    if (new Date(slot).getUTCDay() === 1 && slot >= from && slot <= REFERENCE_DATE.getTime()) out.push(new Date(slot))
  }
  return out
}

function generate(): Workflow[] {
  const rand = seeded("workflows")
  let runNumber = 0

  return BLUEPRINTS.slice(0, COUNT).map((blueprint, index) => {
    const nodes: WorkflowNode[] = blueprint.steps.map(({ at: [column, row], ...step }) => ({
      ...step,
      x: column * COLUMN,
      y: row * ROW,
    }))

    // A timed workflow ran on its schedule until it was paused; an event
    // workflow ran whenever its trigger fired, at any hour of the fortnight.
    const plan = blueprint.runs
    const starts =
      plan === null
        ? []
        : "mondaysAt" in plan
          ? mondaysAt(plan.mondaysAt)
          : Array.from({ length: intBetween(rand, plan.count[0], plan.count[1]) }, () =>
              dateBetween(rand, daysAgo(14), REFERENCE_DATE)
            ).sort((a, b) => a.getTime() - b.getTime())
    const failRate = plan && "failRate" in plan ? plan.failRate : 0.05

    const runs: WorkflowRun[] = starts.map((startedAt) => ({
      id: rowId("run", ++runNumber, 5),
      startedAt,
      // Work, not waiting: a step takes a few hundred milliseconds to call
      // its app, and a delay step's wait is not the run's own time.
      durationMs: nodes.filter((node) => node.kind !== "delay").length * intBetween(rand, 240, 900),
      status: chance(rand, failRate) ? "failed" : "succeeded",
    }))

    return {
      id: rowId("wfl", index + 1),
      name: blueprint.name,
      status: blueprint.status,
      nodes,
      edges: blueprint.edges.map((edge) => ({ ...edge })),
      runs,
    }
  })
}

/** The seeded automations. The repository below owns the rows a canvas changes. */
export const WORKFLOWS: Workflow[] = generate()

export const workflows = createRepository(WORKFLOWS, {
  searchKeys: ["name"],
  filterKeys: ["status"],
})
