import { createRepository, dateBetween, daysAgo, intBetween, rowId, seeded, slugify } from "./core"

/** The six shelves the help centre is arranged on. */
export const ARTICLE_CATEGORIES = [
  "Getting started",
  "Billing",
  "Integrations",
  "Security",
  "Data & exports",
  "Troubleshooting",
] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

/** One help article: what it is called, where it is filed, and what it says. */
export type Article = {
  id: string
  /** From the title; the URL a help centre links each article at. */
  slug: string
  title: string
  category: ArticleCategory
  /** The line under the title in a list. */
  summary: string
  body: string
  updatedAt: Date
  minutesToRead: number
  /** Reads in the last 90 days, for ordering a "most read" list. */
  views: number
}

// The articles themselves, written out rather than generated: help text is the
// one thing a reader actually reads, and a sentence assembled from fragments
// reads like one. The generator below only decides when each was last touched
// and how often it has been opened.
const TOPICS: readonly { title: string; category: ArticleCategory; summary: string; body: string }[] = [
  {
    title: "Create your first workspace",
    category: "Getting started",
    summary: "Name a workspace, pick a region, and invite the people who will work in it.",
    body: "A workspace is the boundary everything else sits inside: members, data, billing and audit history all belong to exactly one. Choose the region closest to the people who will use it — the region fixes where rows are stored and cannot be changed afterwards. Once it exists, invite your team from Settings → Members; an invitation is good for fourteen days and can be resent or revoked at any point before it is accepted.",
  },
  {
    title: "Invite teammates and set their roles",
    category: "Getting started",
    summary: "The four roles, what each one may do, and how to change someone's later.",
    body: "Every member holds one of four roles. Owner is the single account that can delete the workspace or move billing; admin can do everything else, including managing members and API keys; member can read and write the data itself; viewer can read it and nothing more. Change a role from the members table — the change takes effect on that person's next request, and is written to the audit log with who made it.",
  },
  {
    title: "Import your existing data",
    category: "Getting started",
    summary: "Bring a CSV in, map its columns to fields, and check the preview before you commit.",
    body: "The importer reads a CSV with a header row and shows you the first five rows as it understood them. Columns are matched to fields by name where they line up, and anything it could not match is left for you to choose. Nothing is written until you confirm the preview, and a row that fails validation is reported with its line number rather than silently skipped.",
  },
  {
    title: "Set up your notification preferences",
    category: "Getting started",
    summary: "Choose which events reach you, and whether they arrive by email or in the app.",
    body: "Notifications are grouped by the thing they are about — deployments, billing, mentions, and weekly summaries. Each group can be switched on for email, for the in-app inbox, or for both. Preferences are per person, not per workspace, so the same choices follow you into every workspace you belong to.",
  },
  {
    title: "Understand your invoice",
    category: "Billing",
    summary: "What each line means, when it is charged, and how proration is worked out.",
    body: "An invoice covers one billing period and is issued on the first day of it. The subscription line is the plan's own price for the seats you held at the start of the period; usage lines are metered and billed a period in arrears. If you changed plans or seat count mid-period, the difference appears as a prorated line calculated to the day, not the hour.",
  },
  {
    title: "Change or cancel your plan",
    category: "Billing",
    summary: "Upgrades take effect immediately; downgrades wait for the period to end.",
    body: "An upgrade applies the moment you confirm it, and the remainder of the current period is prorated onto your next invoice. A downgrade is scheduled for the end of the period so you keep what you have already paid for. Cancelling behaves the same way: the workspace stays on its plan until the period ends, then moves to the free tier with its data intact and read-only where the free tier does not reach.",
  },
  {
    title: "Update your payment method",
    category: "Billing",
    summary: "Add a card, make it the default, and remove the one it replaced.",
    body: "Add the new card first from Billing → Payment methods, then mark it as the default; a workspace always keeps at least one card on file while it has an active subscription. Removing a card that is not the default is immediate. If a charge has already failed, adding a card does not retry it on its own — use Retry payment on the invoice itself.",
  },
  {
    title: "Add a VAT number and billing address",
    category: "Billing",
    summary: "Where tax details go, and when a change reaches the next invoice.",
    body: "Billing details live on the workspace, not on the person paying, so they survive a change of owner. A VAT number is validated against the registry for its country when you save it; an invalid one is rejected rather than stored. Details you change apply to the next invoice issued — an invoice already sent cannot be reissued with new tax details.",
  },
  {
    title: "Connect a chat workspace",
    category: "Integrations",
    summary: "Authorise the app, pick a default channel, and route events per project.",
    body: "Authorising the app installs it into the chat workspace you choose and posts nothing until you pick a default channel. Each project can then override that channel, which is how a noisy service ends up somewhere other than the room everyone reads. Disconnecting removes the app's token immediately; the messages it has already posted stay where they are.",
  },
  {
    title: "Create and rotate API keys",
    category: "Integrations",
    summary: "Scope a key to what it needs, and replace it without downtime.",
    body: "A key is shown once, at the moment it is created, and stored only as a hash afterwards — if you lose it, create another. Scope each key to the smallest set of permissions the integration needs. To rotate without downtime, create the replacement, deploy it, then revoke the old key once its last-used timestamp stops moving.",
  },
  {
    title: "Send events to a webhook",
    category: "Integrations",
    summary: "Register an endpoint, verify the signature, and read the delivery log.",
    body: "Register the endpoint and choose which event types it should receive. Every delivery carries a signature header computed from your endpoint's secret; verify it before you trust the payload. Failed deliveries are retried with exponential backoff for up to 24 hours, and every attempt — with its response code and body — is visible in the delivery log.",
  },
  {
    title: "Export to your data warehouse",
    category: "Integrations",
    summary: "Schedule a nightly sync into the warehouse your analysts already use.",
    body: "A warehouse sync writes one table per entity plus a manifest describing the run. Schedule it for a quiet hour in your own timezone; the first run is a full load and every run after it is incremental, keyed on the row's updated timestamp. A run that fails leaves the previous tables untouched, so a warehouse is never half-updated.",
  },
  {
    title: "Turn on two-factor authentication",
    category: "Security",
    summary: "Scan the setup code with an authenticator app, then confirm a six-digit code.",
    body: "Two-factor authentication asks for a code from your phone in addition to your password. Scan the setup code with any authenticator app, or type the secret in by hand if the camera is not available, then confirm the six digits it shows. Save your recovery codes somewhere other than the phone — they are the only way back in if you lose the device.",
  },
  {
    title: "Sign in with a passkey",
    category: "Security",
    summary: "What a passkey is, where it is stored, and how to add one to your account.",
    body: "A passkey replaces your password with a key pair your device holds. The private half never leaves the device and is unlocked by whatever already unlocks it — a fingerprint, a face, a PIN — so there is nothing to type and nothing a phishing page can capture. Add one from Settings → Security; you can hold several, one per device, and remove any of them without affecting the rest.",
  },
  {
    title: "Enforce single sign-on for your workspace",
    category: "Security",
    summary: "Point the workspace at your identity provider and require it for everyone.",
    body: "Single sign-on is configured per workspace against a SAML or OIDC provider. Test it with your own account before you enforce it: once enforcement is on, every member signs in through the provider and password sign-in stops working. The owner keeps a break-glass password login so a misconfigured provider cannot lock the workspace out entirely.",
  },
  {
    title: "Read the audit log",
    category: "Security",
    summary: "Who changed what, when, and from where — and how far back it goes.",
    body: "Every change to a member, a role, a key or a billing detail is written to the audit log with the actor, the resource, the fields that changed, and the address the request came from. Entries are immutable and retained for 90 days on Team and two years on Enterprise. Filter by actor or resource to narrow a search, and export the result as CSV for an auditor who cannot log in.",
  },
  {
    title: "Export a table as CSV",
    category: "Data & exports",
    summary: "Export what is on screen, filters and column choices included.",
    body: "An export takes the table exactly as you are looking at it: the same filters, the same sort, the same visible columns. Anything under fifty thousand rows downloads straight away; anything larger is prepared in the background and emailed to you as a link that expires after seven days. Dates are written in ISO 8601 and always in UTC.",
  },
  {
    title: "Schedule a recurring report",
    category: "Data & exports",
    summary: "Have the same view delivered by email every week or every month.",
    body: "Save a view first — its filters and columns are what the report will contain — then schedule it daily, weekly or monthly, and choose who receives it. Recipients do not need an account to open the attachment, so treat the schedule as a sharing decision. A scheduled report that errors twice in a row is paused and its owner told why.",
  },
  {
    title: "Request an export of your whole account",
    category: "Data & exports",
    summary: "One archive of everything the workspace holds, and how long it takes.",
    body: "An account export packages every entity the workspace holds as newline-delimited JSON, one file per entity, in a single archive. Only an owner can request one, and only one request runs at a time. Large workspaces take a few hours; you will get an email with a download link when it is ready, and the link is good for seven days.",
  },
  {
    title: "Delete data and understand retention",
    category: "Data & exports",
    summary: "What a delete removes now, what it removes later, and what it never removes.",
    body: "Deleting a row removes it from every view immediately and from backups within 35 days. Audit entries are the exception: they record that the deletion happened and are kept for the retention window of your plan. Deleting a workspace schedules the whole account for removal after 30 days, during which an owner can still restore it.",
  },
  {
    title: "A sign-in link says it has expired",
    category: "Troubleshooting",
    summary: "Why magic links expire, and what to do when yours already has.",
    body: "A sign-in link is good for fifteen minutes and for one use. A mail scanner that follows links before you do will spend it — which is why the second click reports an expired link even though you never used the first. Request a new one from the same page; if that keeps happening, ask your mail administrator to exclude our sending domain from link scanning.",
  },
  {
    title: "An import failed part way through",
    category: "Troubleshooting",
    summary: "How to read the error report, fix the file, and import the rest.",
    body: "An import is applied in batches, and a batch that fails is rolled back whole, so rows are never half-written. The error report names the line number and the field for every rejected row. Fix those lines in the original file, remove the lines that already imported, and run it again — repeated rows are matched on their external id and updated rather than duplicated.",
  },
  {
    title: "A webhook is not being delivered",
    category: "Troubleshooting",
    summary: "Work through the delivery log, the signature, and the response your endpoint sends.",
    body: "Start with the delivery log: it shows every attempt, the status code your endpoint returned, and the first kilobyte of its response. Anything other than a 2xx counts as a failure and is retried. The two common causes are a signature check comparing against the wrong secret after a rotation, and an endpoint that takes longer than ten seconds to answer — acknowledge first, then do the work.",
  },
  {
    title: "Charts show no data for a period",
    category: "Troubleshooting",
    summary: "Timezones, incomplete days, and filters that outlive the page you set them on.",
    body: "Three things usually explain an empty chart. The period may be measured in UTC while you are reading it in your own timezone, so the current day looks short. The most recent hour is still being aggregated and is deliberately left out. And a filter saved on a view stays on it — check the toolbar for a filter you set on a previous visit before concluding the data is missing.",
  },
]

function generate(): Article[] {
  const rand = seeded("articles")

  return TOPICS.map((topic, index) => ({
    id: rowId("art", index + 1),
    slug: slugify(topic.title),
    title: topic.title,
    category: topic.category,
    summary: topic.summary,
    body: topic.body,
    // Help text is revised, not written once: everything has been touched in
    // the last ten months, and nothing is stamped after "now".
    updatedAt: dateBetween(rand, daysAgo(300), daysAgo(2)),
    minutesToRead: intBetween(rand, 2, 8),
    views: intBetween(rand, 180, 9_400),
  }))
}

/** The seeded help centre. The repository below owns the rows a demo mutates. */
export const ARTICLES: Article[] = generate()

export const articles = createRepository(ARTICLES, {
  searchKeys: ["title", "summary", "category", "body"],
  filterKeys: ["category"],
})
