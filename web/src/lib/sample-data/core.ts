import { rowId } from "./generate"

export * from "./generate"

/**
 * The id prefix assigned to each entity module, in the order the modules were
 * planned. One prefix per module, never reused: `cus_0001` says which table a
 * row came from at a glance, in a URL, and in a test.
 */
export const ID_PREFIXES = [
  ["customers", "cus"],
  ["members", "mbr"],
  ["orders", "ord"],
  ["invoices", "inv"],
  ["subscriptions", "sub"],
  ["products", "prd"],
  ["plans", "pln"],
  ["paymentMethods", "pmt"],
  ["campaigns", "cmp"],
  ["events", "evt"],
  ["invitations", "ivt"],
  ["roles", "rol"],
  ["incidents", "inc"],
  ["services", "svc"],
  ["logEntries", "log"],
  ["alerts", "alr"],
  ["notifications", "ntf"],
  ["apiKeys", "key"],
  ["integrations", "itg"],
  ["deployments", "dpl"],
  ["aiRequests", "aiq"],
  ["auditEvents", "aud"],
  ["sessions", "ses"],
  ["cohorts", "coh"],
  ["tasks", "tsk"],
  ["projects", "prj"],
  ["deals", "dea"],
  ["bookings", "bkg"],
  ["shipments", "shp"],
  ["articles", "art"],
  ["releases", "rel"],
  ["leads", "lea"],
  ["employees", "emp"],
  ["leaves", "lve"],
  ["listings", "lst"],
  ["courses", "crs"],
  ["appointments", "apt"],
  ["holdings", "hld"],
  ["trades", "trd"],
  ["files", "fil"],
  ["notes", "not"],
  ["chats", "cht"],
  ["messages", "msg"],
  ["aiThreads", "ait"],
  ["generations", "gen"],
  ["voiceJobs", "voi"],
  ["transactions", "txn"],
  ["students", "stu"],
  ["workflows", "wfl"],
  ["mails", "eml"],
  ["posts", "pst"],
  ["comments", "cmt"],
  ["reviews", "rev"],
] as const satisfies readonly (readonly [string, string])[]

export type SortSpec = { id: string; desc?: boolean }

export type ListQuery = {
  page?: number
  pageSize?: number
  sort?: SortSpec
  search?: string
  filters?: Record<string, string | string[]>
}

export type Page<T> = { rows: T[]; total: number; page: number; pageSize: number; pageCount: number }

export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; field?: string } }

export type Repository<T extends { id: string }> = {
  list(query?: ListQuery): Promise<Page<T>>
  get(id: string): Promise<T | undefined>
  create(input: Omit<T, "id">): Promise<Result<T>>
  update(id: string, patch: Partial<T>): Promise<Result<T>>
  remove(id: string): Promise<Result<{ id: string }>>
  /** Synchronous, for charts and aggregates. A fresh array of the store's own rows. */
  all(): T[]
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

const notFound = (id: string): Result<never> => ({
  ok: false,
  error: { code: "not_found", message: `No row with id "${id}"` },
})

/** A finite number, floored; anything else (NaN from an unparsed input) is the default. */
const counted = (value: number, fallback: number): number =>
  Number.isFinite(value) ? Math.floor(value) : fallback

/** The `cus` in `cus_0001`; `row` when the seed is empty or its ids are not prefixed. */
function prefixOf(rows: { id: string }[]): string {
  const [first] = rows
  if (!first || !first.id.includes("_")) return "row"
  return first.id.slice(0, first.id.indexOf("_"))
}

/**
 * An in-memory `Repository<T>` over a copy of `rows`.
 *
 * `list` applies, in order: `search` (case-insensitive substring over
 * `searchKeys`), `filters`, `sort`, then pagination.
 *
 * - Filters are equality, or membership when the value is an array, over
 *   `filterKeys` only, with every value compared as a string. An empty string
 *   or an empty array means no constraint at all, because that is what a
 *   cleared filter menu hands back and the reader means "all of them" by it.
 * - Sorting is `localeCompare` for strings and subtraction for numbers and
 *   dates. A `null` or `undefined` value compares as an empty string, so those
 *   rows lead in ascending order and trail in descending; an unknown `sort.id`
 *   leaves the order alone.
 * - `page` is 1-based and clamped into range; `pageSize` defaults to 20; a
 *   value that is not a finite number falls back to the default.
 */
export function createRepository<T extends { id: string }>(
  rows: T[],
  options: { searchKeys?: (keyof T)[]; filterKeys?: (keyof T)[] } = {}
): Repository<T> {
  const { searchKeys = [], filterKeys = [] } = options
  const store: T[] = [...rows]
  const prefix = prefixOf(store)
  let counter = store.length

  const matchesSearch = (row: T, search: string): boolean => {
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    return searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle))
  }

  const matchesFilters = (row: T, filters: Record<string, string | string[]>): boolean =>
    Object.entries(filters).every(([key, value]) => {
      if (!filterKeys.includes(key as keyof T)) return true
      const wanted = (Array.isArray(value) ? value : [value]).filter((entry) => entry !== "")
      // Nothing selected is not the same as "match nothing" — a cleared filter
      // menu hands back an empty array, and the reader means "all of them".
      if (!wanted.length) return true
      return wanted.includes(String(row[key as keyof T] ?? ""))
    })

  const compare = (a: T, b: T, key: keyof T): number => {
    const left = a[key]
    const right = b[key]
    if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
    if (typeof left === "number" && typeof right === "number") return left - right
    return String(left ?? "").localeCompare(String(right ?? ""))
  }

  const paginate = (query: ListQuery = {}): Page<T> => {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, sort, search = "", filters = {} } = query

    let matched = store.filter((row) => matchesSearch(row, search) && matchesFilters(row, filters))
    if (sort) {
      const key = sort.id as keyof T
      const direction = sort.desc ? -1 : 1
      // Array.prototype.sort is stable, so an unknown key (every comparison 0)
      // leaves the rows in the order the filters left them.
      matched = [...matched].sort((a, b) => direction * compare(a, b, key))
    }

    const total = matched.length
    const size = Math.max(1, counted(pageSize, DEFAULT_PAGE_SIZE))
    const pageCount = Math.ceil(total / size)
    const current = Math.min(Math.max(1, counted(page, DEFAULT_PAGE)), Math.max(1, pageCount))
    const start = (current - 1) * size
    return { rows: matched.slice(start, start + size), total, page: current, pageSize: size, pageCount }
  }

  return {
    async list(query) {
      return paginate(query)
    },
    async get(id) {
      return store.find((row) => row.id === id)
    },
    async create(input) {
      // Padded like a generated id, so a row added at runtime sits in the same
      // series as the seeded ones; the loop steps over an id the seed took.
      let id = rowId(prefix, ++counter)
      while (store.some((row) => row.id === id)) id = rowId(prefix, ++counter)
      const row = { ...input, id } as T
      store.push(row)
      return { ok: true, data: row }
    },
    async update(id, patch) {
      const index = store.findIndex((row) => row.id === id)
      if (index === -1) return notFound(id)
      // An undefined value means "not in this patch", not "erase the field" —
      // a form that leaves a control untouched sends exactly that.
      const defined = Object.entries(patch).filter(([, value]) => value !== undefined)
      // A new object rather than an in-place edit, so the seed array the
      // repository was built from keeps the row it started with.
      const next = { ...store[index], ...Object.fromEntries(defined), id } as T
      store[index] = next
      return { ok: true, data: next }
    },
    async remove(id) {
      const index = store.findIndex((row) => row.id === id)
      if (index === -1) return notFound(id)
      store.splice(index, 1)
      return { ok: true, data: { id } }
    },
    all() {
      return [...store]
    },
  }
}

/** FNV-1a: a string to a 32-bit seed, so a name alone fixes a sequence. */
function hashName(name: string): number {
  let hash = 2166136261
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** A mulberry32 generator seeded from `name`: the same name, the same sequence. */
export function seeded(name: string): () => number {
  let state = hashName(name)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
