import { REFERENCE_DATE, chance, createRepository, dateBetween, pickWeighted, rowId, seeded, shuffle } from "./core"
import { avatarFor } from "./avatars"
import { CUSTOMERS } from "./customers"
import { ORDERS, type Order } from "./orders"
import { PRODUCTS } from "./products"
import { RETURN_LINES, REVIEW_POOLS, type ReviewLine, type ReviewPool } from "./review-templates"

/** What a buyer wrote about a product that reached them: the stars, a title and a few sentences. */
export type Review = {
  id: string
  /** A Product id: what the review is of. */
  productId: string
  /** A Customer id: who wrote it — the customer whose order brought the product. */
  customerId: string
  /** An Order id: the delivered order that holds the product. */
  orderId: string
  author: { name: string; avatarUrl: string }
  /** One to five stars. */
  rating: number
  title: string
  body: string
  /** After the order reached the buyer, and never after now. */
  at: Date
  /**
   * The store tied the review to its order: it was written through the review
   * request that follows a delivery. One left on the product page instead
   * carries no badge, though the buyer is the same.
   */
  verified: boolean
  /** How many readers marked it helpful. */
  helpful: number
}

const DAY_MS = 86_400_000

/** The share of delivered order lines a buyer goes on to review. */
const RESPONSE = 0.6

/** What a buyer who kept the product gives it, by share of buyers. */
const KEPT: readonly (readonly [number, number])[] = [
  [5, 0.56],
  [4, 0.28],
  [3, 0.1],
  [2, 0.04],
  [1, 0.02],
]

/** What a buyer who sent it back gives it: a one or a two, now and then a three for a fit that was not theirs. */
const RETURNED: readonly (readonly [number, number])[] = [
  [1, 0.45],
  [2, 0.35],
  [3, 0.2],
]

/** The share of reviews written through the review request. */
const VERIFIED = 0.86

/** A buyer writes at least half a day after the parcel arrives, and within this many days of it. */
const WINDOW_DAYS = 24

/** The sentences a review of each score is made of, and the one it may add. */
const PLAN: Record<number, { lines: (keyof Omit<ReviewPool, "titles">)[]; extra?: [keyof Omit<ReviewPool, "titles">, number] }> = {
  5: { lines: ["praise", "praise"], extra: ["detail", 0.5] },
  4: { lines: ["praise", "detail"], extra: ["gripe", 0.5] },
  3: { lines: ["praise", "gripe"], extra: ["detail", 0.5] },
  2: { lines: ["gripe", "fault"] },
  1: { lines: ["fault", "fault"], extra: ["gripe", 0.4] },
}

/** "Portable SSD 1TB" → "portable SSD": the name as a buyer says it, without the spec at its end. */
function itemOf(name: string): string {
  const words = name.split(" ")
  while (words.length > 1 && /\d|^(HD|LED)$/.test(words[words.length - 1])) words.pop()
  return words
    .map((word) => (/^[A-Z0-9-]+$/.test(word) ? word : /^[A-Z]-/.test(word) ? word[0] + word.slice(1).toLowerCase() : word.toLowerCase()))
    .join(" ")
}

/** A line's tokens filled for one product: its name, its pronouns and its verbs. */
function fill(text: string, item: string): string {
  const plural = /[^s]s$/.test(item)
  const tokens: Record<string, string> = {
    item,
    It: plural ? "They" : "It",
    they: plural ? "they" : "it",
    them: plural ? "them" : "it",
    has: plural ? "have" : "has",
    s: plural ? "" : "s",
  }
  return text.replace(/\{(\w+)\}/g, (token, key: string) => tokens[key] ?? token)
}

const fits = (line: ReviewLine, name: string) =>
  typeof line === "string" || ((!line.only || line.only.test(name)) && (!line.not || !line.not.test(name)))

const textOf = (line: ReviewLine) => (typeof line === "string" ? line : line.text)
const aboutOf = (line: ReviewLine) => (typeof line === "string" ? undefined : line.about)

/**
 * Deals a pool's lines to one product at a time, from its own shuffled run of
 * the lines that fit it, so its reviews repeat a sentence only once they have
 * used every one. A line about something the review has already made a claim
 * about is passed over for the next; none is dealt when every line is.
 */
function dealer(rand: () => number) {
  const decks = new Map<string, { lines: ReviewLine[]; next: number }>()
  return (productId: string, name: string, key: string, lines: readonly ReviewLine[], claimed: ReadonlySet<string>): ReviewLine | null => {
    const id = `${productId}/${key}`
    let deck = decks.get(id)
    if (!deck) {
      deck = { lines: shuffle(rand, lines.filter((line) => fits(line, name))), next: 0 }
      decks.set(id, deck)
    }
    for (let tries = 0; tries < deck.lines.length; tries++) {
      const line = deck.lines[deck.next++ % deck.lines.length]
      const about = aboutOf(line)
      if (!about || !claimed.has(about)) return line
    }
    return null
  }
}

function generate(): Review[] {
  const rand = seeded("reviews")
  const deal = dealer(rand)
  const customers = new Map(CUSTOMERS.map((customer) => [customer.id, customer]))
  const products = new Map(PRODUCTS.map((product) => [product.id, product]))
  const rows: Review[] = []

  const reached = (order: Order) => (order.status === "fulfilled" || order.status === "refunded") && order.fulfilledAt
  for (const order of ORDERS.filter(reached)) {
    const delivered = order.fulfilledAt!.getTime()
    const opens = delivered + DAY_MS / 2
    const closes = Math.min(delivered + WINDOW_DAYS * DAY_MS, REFERENCE_DATE.getTime())
    // A parcel that arrived in the last few hours has not been written about yet.
    if (closes <= opens) continue
    const customer = customers.get(order.customerId)
    if (!customer) continue
    const returned = order.status === "refunded"

    for (const line of order.items) {
      if (!chance(rand, RESPONSE)) continue
      const product = products.get(line.productId)!
      const pool = REVIEW_POOLS[product.category]
      const item = itemOf(product.name)
      const rating = pickWeighted(rand, returned ? RETURNED : KEPT)
      const at = dateBetween(rand, new Date(opens), new Date(closes))
      // What the review has made a claim about, so it never contradicts itself.
      const claimed = new Set<string>()
      const take = (key: string, lines: readonly ReviewLine[]) => {
        const dealt = deal(product.id, product.name, key, lines, claimed)
        if (!dealt) return null
        const about = aboutOf(dealt)
        if (about) claimed.add(about)
        return fill(textOf(dealt), item)
      }
      const say = (key: keyof Omit<ReviewPool, "titles">) => take(key, pool[key])

      const plan = PLAN[rating]
      const sentences = plan.lines.map(say)
      if (plan.extra && chance(rand, plan.extra[1])) sentences.push(say(plan.extra[0]))
      if (returned) sentences.push(fill(RETURN_LINES[Math.floor(rand() * RETURN_LINES.length)], item))
      const tier = rating >= 4 ? "high" : rating === 3 ? "mid" : "low"
      // A title pool always holds lines that claim nothing, so one is always dealt.
      const title = take(`title-${tier}`, pool.titles[tier])!
      const written = sentences.filter((sentence) => sentence !== null)

      // Older reviews have had more readers, and a warning is voted up more than praise.
      const age = (REFERENCE_DATE.getTime() - at.getTime()) / DAY_MS
      const reach = 3 + age / 6 + (rating <= 2 ? 6 : 0) + (written.length > 2 ? 2 : 0)

      rows.push({
        id: rowId("rev", rows.length + 1),
        productId: product.id,
        customerId: customer.id,
        orderId: order.id,
        author: { name: customer.name, avatarUrl: customer.avatarUrl ?? avatarFor(customer.name) },
        rating,
        title,
        body: [...new Set(written)].join(" "),
        at,
        verified: chance(rand, VERIFIED),
        helpful: Math.floor(rand() * rand() * reach),
      })
    }
  }

  return rows
}

/** The seeded reviews, in the order the book delivered them. The repository below owns the ones a demo adds. */
export const REVIEWS: Review[] = generate()

export const reviews = createRepository(REVIEWS, {
  searchKeys: ["title", "body"],
  filterKeys: ["productId", "customerId", "rating", "verified"],
})
