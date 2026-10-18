import { aiRequests } from "./ai-requests"
import { aiThreads } from "./ai-threads"
import { alerts } from "./alerts"
import { apiKeys } from "./api-keys"
import { appointments } from "./appointments"
import { articles } from "./articles"
import { auditEvents } from "./audit-events"
import { bookings } from "./bookings"
import { campaigns } from "./campaigns"
import { chats } from "./chats"
import { cohorts } from "./cohorts"
import { comments } from "./comments"
import { courses } from "./courses"
import { customers } from "./customers"
import { deals } from "./deals"
import { deployments } from "./deployments"
import { employees } from "./employees"
import { events } from "./events"
import { files } from "./files"
import { fxRates } from "./fx-rates"
import { generations } from "./generations"
import { holdings } from "./holdings"
import { incidents } from "./incidents"
import { integrations } from "./integrations"
import { invitations } from "./invitations"
import { invoices } from "./invoices"
import { leads } from "./leads"
import { leaves } from "./leaves"
import { listings } from "./listings"
import { logEntries } from "./log-entries"
import { mails } from "./mails"
import { members } from "./members"
import { messages } from "./messages"
import { notes } from "./notes"
import { notifications } from "./notifications"
import { orders } from "./orders"
import { paymentMethods } from "./payment-methods"
import { plans } from "./plans"
import { posts } from "./posts"
import { products } from "./products"
import { projects } from "./projects"
import { releases } from "./releases"
import { reviews } from "./reviews"
import { roles } from "./roles"
import { services } from "./services"
import { sessions } from "./sessions"
import { shipments } from "./shipments"
import { students } from "./students"
import { subscriptions } from "./subscriptions"
import { tasks } from "./tasks"
import { trades } from "./trades"
import { transactions } from "./transactions"
import { voiceJobs } from "./voice-jobs"
import { workflows } from "./workflows"

export * from "./ai-requests"
export * from "./ai-threads"
export * from "./alerts"
export * from "./api-keys"
export * from "./appointments"
export * from "./articles"
export * from "./audit-events"
export * from "./avatars"
export * from "./bookings"
export * from "./campaigns"
export * from "./chats"
export * from "./cohorts"
export * from "./comments"
export * from "./core"
export * from "./courses"
export * from "./customers"
export * from "./deals"
export * from "./deployments"
export * from "./employees"
export * from "./events"
export * from "./files"
export * from "./fx-rates"
export * from "./generations"
export * from "./holdings"
export * from "./incidents"
// The checks a server action reads its arguments through; not an entity.
export * from "./input"
export * from "./integrations"
export * from "./invitations"
export * from "./invoices"
export * from "./leads"
export * from "./leaves"
export * from "./listings"
export * from "./log-entries"
export * from "./mails"
export * from "./members"
export * from "./messages"
export * from "./notes"
export * from "./notifications"
export * from "./orders"
export * from "./payment-methods"
export * from "./plans"
export * from "./posts"
export * from "./products"
export * from "./projects"
export * from "./releases"
export * from "./reviews"
export * from "./roles"
// A selector over members, invitations and plans, not an entity: no key on `db`.
export * from "./seats"
export * from "./services"
export * from "./sessions"
export * from "./shipments"
export * from "./students"
export * from "./subscriptions"
export * from "./tasks"
export * from "./trades"
export * from "./transactions"
export * from "./voice-jobs"
export * from "./workflows"

/**
 * The one handle a block reads through: `db.customers.list({ page: 2 })` for a
 * table, `db.customers.all()` for a chart. Swap any entry for a repository
 * backed by a real store and the blocks above it keep working. One entry is
 * not a repository: `db.fxRates` is a year of daily rates per currency pair,
 * read whole by pair and never written, so it is held as the record it is.
 */
export const db = {
  aiRequests,
  aiThreads,
  alerts,
  apiKeys,
  appointments,
  articles,
  auditEvents,
  bookings,
  campaigns,
  chats,
  cohorts,
  comments,
  courses,
  customers,
  deals,
  deployments,
  employees,
  events,
  files,
  fxRates,
  generations,
  holdings,
  incidents,
  integrations,
  invitations,
  invoices,
  leads,
  leaves,
  listings,
  logEntries,
  mails,
  members,
  messages,
  notes,
  notifications,
  orders,
  paymentMethods,
  plans,
  posts,
  products,
  projects,
  releases,
  reviews,
  roles,
  services,
  sessions,
  shipments,
  students,
  subscriptions,
  tasks,
  trades,
  transactions,
  voiceJobs,
  workflows,
}
