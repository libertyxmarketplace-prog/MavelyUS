import { REFERENCE_DATE, chance, createRepository, dateBetween, intBetween, pick, rowId, seeded, shuffle } from "./core"
import { avatarFor } from "./avatars"
import { MEMBERS } from "./members"
import { REPLIES } from "./post-templates"
import { POSTS, type Post } from "./posts"

/** A reply under a post on the team feed, from someone in the workspace. */
export type Comment = {
  id: string
  /** A Post id. */
  postId: string
  author: { name: string; avatarUrl: string }
  /** Always after the post it answers, never after now. */
  at: Date
  text: string
}

const COUNT = 140

const MINUTE_MS = 60_000
/** A thread goes quiet within two days of its post. */
const THREAD_MS = 2 * 24 * 60 * MINUTE_MS

/**
 * How many replies each post gets, adding up to `COUNT` exactly: a draw per
 * post — a few get none — scaled to the total, with the rounding error settled
 * on the busiest thread.
 */
function allocate(rand: () => number, posts: readonly Post[]): number[] {
  const raw = posts.map(() => (chance(rand, 0.12) ? 0 : intBetween(rand, 1, 8)))
  const total = raw.reduce((sum, value) => sum + value, 0)
  const counts = raw.map((value) => Math.round((value / total) * COUNT))
  const settled = counts.reduce((sum, value) => sum + value, 0)
  const busiest = counts.indexOf(Math.max(...counts))
  counts[busiest] += COUNT - settled
  return counts
}

/** The replies that fit a post: by its media, else by the first topic it names, then the ones that fit anything. */
function repliesFor(rand: () => number, post: Post): string[] {
  const topic = post.text.match(/#[a-z][a-z-]*/)?.[0] ?? ""
  const own = post.media ? REPLIES[post.media.kind] : (REPLIES.note[topic] ?? [])
  return [...shuffle(rand, own), ...shuffle(rand, REPLIES.any)]
}

function generate(): Comment[] {
  const rand = seeded("comments")
  const people = MEMBERS.filter((member) => member.status === "active")
  const counts = allocate(rand, POSTS)
  const rows: Comment[] = []

  POSTS.forEach((post, postIndex) => {
    const count = counts[postIndex]
    if (count === 0) return
    const replies = repliesFor(rand, post)
    const opens = post.at.getTime() + 5 * MINUTE_MS
    const closes = Math.min(post.at.getTime() + THREAD_MS, REFERENCE_DATE.getTime())
    const times = Array.from({ length: count }, () => dateBetween(rand, new Date(opens), new Date(closes)))
      .map((date) => date.getTime())
      .sort((a, b) => a - b)

    for (let index = 0; index < count; index += 1) {
      // Mostly other people; now and then the author answers their own thread.
      const answering = chance(rand, 0.15)
      const author = answering
        ? (people.find((member) => member.name === post.author.name) ?? pick(rand, people))
        : pick(rand, people.filter((member) => member.name !== post.author.name))
      rows.push({
        id: rowId("cmt", rows.length + 1),
        postId: post.id,
        author: { name: author.name, avatarUrl: avatarFor(author.name) },
        at: new Date(times[index]),
        text: replies[index % replies.length],
      })
    }
  })

  return rows
}

/** The seeded replies. The repository below owns the ones the feed adds. */
export const COMMENTS: Comment[] = generate()

export const comments = createRepository(COMMENTS, {
  searchKeys: ["text"],
  filterKeys: ["postId"],
})
