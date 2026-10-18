import { FROM_CUSTOMER, TO_CUSTOMER } from "./mail-templates-customers"
import { FROM_TEAM, TO_TEAM } from "./mail-templates-team"
import type { MailLabel } from "./mails"

/** The people a template names: the reader, whoever is on the other end, their company, and a teammate. */
export type MailContext = { me: string; other: string; company: string; teammate: string }

export type MailTemplate = {
  subject: (c: MailContext) => string
  body: (c: MailContext) => string[]
  labels: readonly MailLabel[]
  /** Files the mail carries when it is one of the mailbox's mails with attachments. */
  files?: readonly string[]
}

export const MAIL_TEMPLATES = {
  fromTeam: FROM_TEAM,
  fromCustomer: FROM_CUSTOMER,
  toTeam: TO_TEAM,
  toCustomer: TO_CUSTOMER,
} as const
