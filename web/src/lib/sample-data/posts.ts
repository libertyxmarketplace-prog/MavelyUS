import { chance, createRepository, dateBetween, daysAgo, intBetween, pick, rowId, seeded, shuffle } from "./core"
import { avatarFor } from "./avatars"
import { MEMBERS } from "./members"
import { LINKS, NOTES, POLLS, PRODUCT_LINES, STATS } from "./post-templates"
import { PRODUCTS } from "./products"

/** Who wrote a post: a teammate, their face, and the handle the feed prints in mono. */
export type PostAuthor = { name: string; handle: string; avatarUrl: string }

export type PostPollOption = { label: string; votes: number }

/**
 * What a post carries besides its text — never a picture. A link is a card
 * with a company's mark — the name of one of logo-mark's companies, kept as a
 * plain string so the store depends on no component, and checked by the page
 * that draws it; a poll is its options and their votes, and which of
 * them the signed-in member picked (`null` until they vote, once); a product
 * is a row of `db.products`, drawn and priced from the catalogue when it is
 * shown; a stat is a small series a sparkline can draw, its last point the
 * figure the text quotes.
 */
export type PostMedia =
  | { kind: "link"; title: string; domain: string; mark: string }
  | { kind: "poll"; options: PostPollOption[]; voted: number | null }
  | { kind: "product"; productId: string }
  | { kind: "stat"; label: string; values: number[] }

/** One post on the team's feed. `liked` is whether the signed-in member likes it; `likes` counts them in. */
export type Post = {
  id: string
  author: PostAuthor
  at: Date
  text: string
  media?: PostMedia
  likes: number
  liked: boolean
  shares: number
}

const COUNT = 36

/** Exact counts, so every kind of media is on the feed and a third of the posts carry none. */
const MEDIA_COUNTS: readonly (readonly [PostMedia["kind"] | "none", number])[] = [
  ["link", 8],
  ["poll", 5],
  ["product", 7],
  ["stat", 6],
  ["none", 10],
]

/** Points in a stat's series: a quarter of weeks. */
const WEEKS = 12

/** `Sonia Keller` → `sonia.keller`: the handle a person is known by on the feed. */
export function handleFor(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
}

/**
 * A series from `from` to exactly `to`: the straight line between them with a
 * little noise on every point but the ends, so the figure the text quotes is
 * the one the sparkline finishes on.
 */
function series(rand: () => number, from: number, to: number, places: number): number[] {
  const scale = 10 ** places
  const wobble = Math.max(Math.abs(to - from) * 0.08, 1 / scale)
  return Array.from({ length: WEEKS }, (_, index) => {
    if (index === 0) return from
    if (index === WEEKS - 1) return to
    const line = from + ((to - from) * index) / (WEEKS - 1)
    const value = line + (rand() * 2 - 1) * wobble
    return Math.max(0, Math.round(value * scale) / scale)
  })
}

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

function generate(): Post[] {
  const rand = seeded("posts")
  const me = MEMBERS[0]
  const active = MEMBERS.filter((member) => member.status === "active")
  const others = active.filter((member) => member.id !== me.id)
  const stock = PRODUCTS.filter((product) => product.status === "active")

  const kinds = shuffle(
    rand,
    MEDIA_COUNTS.flatMap(([kind, count]) => Array.from({ length: count }, () => kind))
  ).slice(0, COUNT)
  // Each list is walked in its own order, so no two posts say the same thing.
  const links = shuffle(rand, LINKS)
  const polls = shuffle(rand, POLLS)
  const stats = shuffle(rand, STATS)
  const lines = shuffle(rand, PRODUCT_LINES)
  const notes = shuffle(rand, NOTES)
  const products = shuffle(rand, stock)
  const walked = { link: 0, poll: 0, product: 0, stat: 0, none: 0 }
  // The signed-in member writes a handful; everyone else the rest.
  const mine = new Set(shuffle(rand, kinds.map((_, index) => index)).slice(0, 4))

  return kinds.map((kind, index): Post => {
    const author = mine.has(index) ? me : pick(rand, others)
    const n = walked[kind]++
    let text: string
    let media: PostMedia | undefined

    if (kind === "link") {
      const link = links[n % links.length]
      text = link.text
      media = { kind, title: link.title, domain: link.domain, mark: link.mark }
    } else if (kind === "poll") {
      const poll = polls[n % polls.length]
      const options = poll.options.map((label) => ({ label, votes: intBetween(rand, 1, 14) }))
      // The reader has answered two of the polls already; their vote is in the count.
      const voted = n < 2 ? intBetween(rand, 0, options.length - 1) : null
      if (voted !== null) options[voted].votes += 1
      text = poll.text
      media = { kind, options, voted }
    } else if (kind === "product") {
      const product = products[n % products.length]
      text = lines[n % lines.length](product.name)
      media = { kind, productId: product.id }
    } else if (kind === "stat") {
      const stat = stats[n % stats.length]
      const values = series(rand, stat.from, stat.to, stat.places)
      text = stat.text(number.format(values[values.length - 1]))
      media = { kind, label: stat.label, values }
    } else {
      const subject = pick(rand, others.filter((member) => member.id !== author.id))
      text = notes[n % notes.length](subject.name.split(" ")[0])
    }

    // Most of the feed is the last fortnight; the rest reaches back two months.
    const at = dateBetween(rand, daysAgo(chance(rand, 0.55) ? 14 : 60), daysAgo(1 / 24))
    const liked = chance(rand, 0.3)
    const likes = intBetween(rand, 0, 42) + (liked ? 1 : 0)
    return {
      id: rowId("pst", index + 1),
      author: { name: author.name, handle: handleFor(author.name), avatarUrl: avatarFor(author.name) },
      at,
      text,
      ...(media ? { media } : {}),
      likes,
      liked,
      shares: intBetween(rand, 0, 9),
    }
  })
}

/** The seeded feed. The repository below owns the posts the feed adds, likes and votes on. */
export const POSTS: Post[] = generate()

export const posts = createRepository(POSTS, {
  searchKeys: ["text"],
})
