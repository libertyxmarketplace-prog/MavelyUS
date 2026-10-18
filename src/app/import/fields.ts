import { type Customer } from "@/lib/sample-data"

/** The customer columns this importer can fill. */
export type FieldKey = "name" | "email" | "company" | "plan" | "country" | "seats" | "mrrCents"

export type ImportField = {
  key: FieldKey
  label: string
  required: boolean
  /** What the column has to hold, said in one line under the select. */
  hint: string
  /** Names a spreadsheet is likely to have used, normalised the same way. */
  aliases: string[]
}

export const PLANS: Customer["plan"][] = ["free", "starter", "team", "enterprise"]

export const FIELDS: ImportField[] = [
  {
    key: "name",
    label: "Name",
    required: true,
    hint: "The person's own name",
    aliases: ["name", "fullname", "contact", "contactname", "person"],
  },
  {
    key: "email",
    label: "Email",
    required: true,
    hint: "One address, with an @ in it",
    aliases: ["email", "emailaddress", "mail", "workemail"],
  },
  {
    key: "company",
    label: "Company",
    required: true,
    hint: "The account the person belongs to",
    aliases: ["company", "account", "organisation", "organization", "org"],
  },
  {
    key: "plan",
    label: "Plan",
    required: false,
    hint: `One of ${PLANS.join(", ")}; anything else is refused`,
    aliases: ["plan", "tier", "subscription", "package"],
  },
  {
    key: "country",
    label: "Country",
    required: false,
    hint: "Where the account is billed",
    aliases: ["country", "region", "market", "location"],
  },
  {
    key: "seats",
    label: "Seats",
    required: false,
    hint: "A whole number; blank counts as one",
    aliases: ["seats", "seatcount", "licences", "licenses", "users"],
  },
  {
    key: "mrrCents",
    label: "MRR",
    required: false,
    hint: "Dollars a month, stored in cents",
    aliases: ["mrr", "revenue", "monthlyrevenue", "amount", "value"],
  },
]

/** The value the mapping select uses for "this column goes nowhere". */
export const UNMAPPED = ""

// Case, spaces, underscores and punctuation are how the same column is written
// in ten different exports; none of them changes which column it is.
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

/** The field a source column is called by, or null when nothing recognises it. */
export function autoMatch(column: string): FieldKey | null {
  const key = normalise(column)
  if (key === "") return null
  const hit = FIELDS.find(
    (field) => normalise(field.label) === key || field.aliases.includes(key)
  )
  return hit?.key ?? null
}

/**
 * A first mapping for a file: each column takes the field its name matches, and
 * a field is never claimed twice — the leftmost column that matches wins, which
 * is the one a reader sees first.
 */
export function initialMapping(columns: string[]): Record<number, FieldKey | null> {
  const taken = new Set<FieldKey>()

  return Object.fromEntries(
    columns.map((column, index) => {
      const match = autoMatch(column)
      if (!match || taken.has(match)) return [index, null]
      taken.add(match)
      return [index, match]
    })
  )
}

/** How many rows the preview shows before the reader commits to the rest. */
export const PREVIEW_ROWS = 5

/**
 * A file to try the importer with: ten rows, of which two are deliberately
 * wrong — one has no email at all, one has an address with no @ — so a reader
 * who has no CSV to hand still sees what a refusal looks like.
 */
export const SAMPLE_CSV = `Full name,Email Address,Company,Plan,Country,Seats,MRR
Ada Kowalski,ada.kowalski@meridian.example,Meridian Analytics,team,Poland,24,1840
Owen Brandt,owen.brandt@harborline.example,Harbor Line,starter,Ireland,6,290
Mira Nakamura,mira.nakamura@kestrel.example,Kestrel Systems,enterprise,Japan,180,14200
Luis Ferreira,luis.ferreira@northgate.example,Northgate Retail,team,Portugal,31,2110
Nina Halvorsen,nina.halvorsen@fjordworks.example,Fjordworks,starter,Norway,9,420
Tobias Keller,,Keller Instruments,team,Germany,17,1260
Priya Raman,priya.raman@sundial.example,Sundial Freight,free,India,3,0
Jonas Eriksen,jonas.eriksen,Eriksen Bakeries,starter,Denmark,4,180
Elena Costa,elena.costa@viafiore.example,Via Fiore,team,Italy,22,1520
Marcus Ortiz,marcus.ortiz@cedarpoint.example,Cedar Point Labs,enterprise,United States,96,8300
`
