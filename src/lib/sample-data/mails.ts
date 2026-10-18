import { chance, createRepository, dateBetween, daysAgo, intBetween, pick, rowId, seeded, shuffle } from "./core"
import { avatarFor } from "./avatars"
import { CUSTOMERS, type Customer } from "./customers"
import { MAIL_TEMPLATES, type MailContext, type MailTemplate } from "./mail-templates"
import { MEMBERS, type Member } from "./members"

export type MailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash"
export type MailLabel = "work" | "personal" | "finance" | "travel"

/** Whoever a mail is from: a name, the address it came from, and a face. */
export type MailPerson = { name: string; email: string; avatarUrl: string }

export type MailAttachment = { name: string; sizeBytes: number }

/**
 * One mail in the signed-in member's mailbox — `MEMBERS[0]`, the workspace
 * owner, the one reader every folder is generated around. What came in is
 * from a teammate or a customer's contact; what went out is from the reader.
 */
export type Mail = {
  id: string
  folder: MailFolder
  from: MailPerson
  /** Addresses, the main recipient first. */
  to: string[]
  subject: string
  /** The body, paragraph by paragraph, greeting and sign-off included. */
  body: string[]
  /**
   * The rich document the editor saved, validated on the way in and again on
   * the way out; `body` holds its plain paragraphs. A seeded mail has none.
   */
  doc?: unknown
  at: Date
  read: boolean
  starred: boolean
  labels: MailLabel[]
  attachments: MailAttachment[]
}

const COUNT = 64

/**
 * Exact counts rather than weighted draws, so the folders add up the same way
 * every time: six in ten in the inbox, the rest spread over what the reader
 * wrote, filed or threw away.
 */
const FOLDER_COUNTS: readonly (readonly [MailFolder, number])[] = [
  ["inbox", 38],
  ["sent", 10],
  ["drafts", 5],
  ["archive", 7],
  ["trash", 4],
]

// About three in ten unread: the reader is behind on the newest of the inbox,
// and two mails went into the trash unopened. Nothing the reader wrote is
// ever unread.
const UNREAD: Partial<Record<MailFolder, number>> = { inbox: 17, trash: 2 }
const STARRED: Partial<Record<MailFolder, number>> = { inbox: 4, archive: 1, sent: 1 }
/** The inbox mails the unread are drawn from: the newest, never last month's. */
const UNREAD_POOL = 26
/** One in five carries a file; never one in the trash. */
const WITH_FILES = 13

/** How far back each folder reaches, in days: the inbox is mostly the last fortnight, drafts are recent. */
const WINDOW: Record<MailFolder, readonly [number, number]> = {
  inbox: [1 / 48, 14],
  sent: [1 / 24, 30],
  drafts: [1 / 24, 5],
  archive: [3, 30],
  trash: [1, 30],
}

/** A file's weight by its extension: a spreadsheet is lighter than a signed contract. */
const SIZES: Record<string, readonly [number, number]> = {
  pdf: [80_000, 4_200_000],
  xlsx: [18_000, 900_000],
  docx: [30_000, 1_800_000],
  txt: [2_000, 180_000],
}

const firstName = (name: string) => name.split(" ")[0]

function generate(): Mail[] {
  const rand = seeded("mails")
  const me = MEMBERS[0]
  const reader: MailPerson = { name: me.name, email: me.email, avatarUrl: avatarFor(me.name) }
  // Only people still in the workspace write, and customers whose accounts are live.
  const team = MEMBERS.filter((member) => member.status === "active" && member.id !== me.id)
  const buyers = CUSTOMERS.filter((customer) => customer.status === "active" || customer.status === "trial")

  const folders = shuffle(
    rand,
    FOLDER_COUNTS.flatMap(([folder, count]) => Array.from({ length: count }, () => folder))
  )
  const filed = new Set(
    shuffle(
      rand,
      folders.flatMap((folder, index) => (folder === "trash" ? [] : [index]))
    ).slice(0, WITH_FILES)
  )

  // Each pool walks its own shuffle, so a subject repeats only once its pool
  // has been used up — and then from somebody else.
  const decks = new Map<string, { deck: MailTemplate[]; next: number }>()
  const draw = (kind: keyof typeof MAIL_TEMPLATES, withFiles: boolean): MailTemplate => {
    const key = `${kind}:${withFiles}`
    let entry = decks.get(key)
    if (!entry) {
      const pool = MAIL_TEMPLATES[kind].filter((template) => Boolean(template.files) === withFiles)
      entry = { deck: shuffle(rand, pool), next: 0 }
      decks.set(key, entry)
    }
    const template = entry.deck[entry.next % entry.deck.length]
    entry.next += 1
    return template
  }

  const rows = folders.map((folder, index): Mail => {
    const withFiles = filed.has(index)
    const [near, far] = WINDOW[folder]
    const at = dateBetween(rand, daysAgo(far), daysAgo(near))
    const outgoing = folder === "sent" || folder === "drafts"
    const withCustomer = chance(rand, outgoing ? 0.5 : 0.45)
    const person: Member | Customer = withCustomer ? pick(rand, buyers) : pick(rand, team)
    // A teammate the mail mentions or copies in: never the person it is with.
    const others = team.filter((member) => member.email !== person.email)
    const teammate = pick(rand, others)
    const kind = outgoing
      ? withCustomer ? "toCustomer" : "toTeam"
      : withCustomer ? "fromCustomer" : "fromTeam"
    const template = draw(kind, withFiles)
    const context: MailContext = {
      me: firstName(me.name),
      other: firstName(person.name),
      company: "company" in person ? person.company : "Northwind",
      teammate: firstName(teammate.name),
    }
    const body = template.body(context)
    // A teammate is copied in on a fifth of the mail between colleagues.
    const cc = !withCustomer && chance(rand, 0.2) ? [teammate.email] : []
    const attachments = withFiles
      ? (template.files ?? []).map((name) => {
          const [min, max] = SIZES[name.slice(name.lastIndexOf(".") + 1)] ?? SIZES.pdf
          return { name, sizeBytes: intBetween(rand, min, max) }
        })
      : []

    return {
      id: rowId("eml", index + 1),
      folder,
      from: outgoing ? reader : { name: person.name, email: person.email, avatarUrl: avatarFor(person.name) },
      to: outgoing ? [person.email, ...cc] : [me.email, ...cc],
      subject: template.subject(context),
      // A draft is a mail nobody has signed yet.
      body: folder === "drafts" ? body.slice(0, -1) : body,
      at,
      read: true,
      starred: false,
      labels: [...template.labels],
      attachments,
    }
  })

  // The unread and the starred are drawn once every row exists, so the counts
  // are exact rather than hoped for.
  const newest = (folder: MailFolder) =>
    rows.filter((row) => row.folder === folder).sort((a, b) => b.at.getTime() - a.at.getTime())
  for (const [folder, count] of Object.entries(UNREAD) as [MailFolder, number][]) {
    for (const row of shuffle(rand, newest(folder).slice(0, UNREAD_POOL)).slice(0, count)) row.read = false
  }
  for (const [folder, count] of Object.entries(STARRED) as [MailFolder, number][]) {
    for (const row of shuffle(rand, newest(folder)).slice(0, count)) row.starred = true
  }

  return rows.slice(0, COUNT)
}

/** The seeded mailbox. The repository below owns the rows the mail app files, stars and sends. */
export const MAILS: Mail[] = generate()

export const mails = createRepository(MAILS, {
  searchKeys: ["subject"],
  filterKeys: ["folder", "read", "starred"],
})
