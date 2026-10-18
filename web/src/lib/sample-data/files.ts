import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { MEMBERS } from "./members"

/** One entry in the workspace's drive: a folder at the root, or a file in one or beside them. */
export type File = {
  id: string
  name: string
  kind: "folder" | "document" | "image" | "video" | "audio" | "archive" | "other"
  /** A folder weighs what is inside it. */
  sizeBytes: number
  /** A Member id: who put it there. */
  ownerId: string
  /** The folder it sits in — one of the folder rows — or undefined at the root. */
  parentId?: string
  modifiedAt: Date
  starred: boolean
}

const COUNT = 140

const FOLDERS = [
  "Design",
  "Documents",
  "Downloads",
  "Music",
  "Pictures",
  "Projects",
  "Contracts",
  "Invoices",
  "Marketing",
  "Recordings",
  "Archive",
  "Shared",
] as const

type FileKind = Exclude<File["kind"], "folder">

// Stems and extensions per kind; a name is one of each, and a stem that comes
// up twice in one folder takes a version suffix rather than colliding.
const NAMES: Record<FileKind, { stems: readonly string[]; extensions: readonly string[] }> = {
  document: {
    stems: ["project-proposal", "q3-budget", "onboarding-guide", "meeting-notes", "brand-guidelines", "roadmap-2026", "hiring-plan", "board-update", "pricing-sheet", "customer-interviews", "release-checklist", "vendor-contract", "handbook", "retro-notes"],
    extensions: ["pdf", "docx", "xlsx", "md", "pptx"],
  },
  image: {
    stems: ["hero-banner", "logo-dark", "logo-light", "icon-set", "team-offsite", "product-shot", "og-image", "wireframe", "screenshot", "chart-export", "app-icon", "cover"],
    extensions: ["png", "jpg", "svg", "webp"],
  },
  video: {
    stems: ["product-demo", "webinar-recording", "onboarding-walkthrough", "all-hands", "launch-teaser", "customer-story", "tutorial-01", "tutorial-02"],
    extensions: ["mp4", "mov"],
  },
  audio: {
    stems: ["podcast-ep-12", "voice-memo", "interview-raw", "standup-recording", "jingle", "call-notes"],
    extensions: ["mp3", "m4a", "wav"],
  },
  archive: {
    stems: ["assets-2026", "backup-08", "design-tokens", "site-export", "logs-week-35", "font-pack", "photos-offsite"],
    extensions: ["zip", "tar.gz"],
  },
  other: {
    stems: ["config", "dataset", "events-export", "schema", "seed-data", "translations", "sitemap"],
    extensions: ["yaml", "csv", "json", "sql", "xml"],
  },
}

const KIND_MIX: readonly (readonly [FileKind, number])[] = [
  ["document", 0.34],
  ["image", 0.24],
  ["video", 0.12],
  ["audio", 0.09],
  ["archive", 0.1],
  ["other", 0.11],
]

// Byte ranges per kind. Videos and archives carry the weight, so the drive's
// total lands in the tens of gigabytes rather than the hundreds of megabytes.
const SIZES: Record<FileKind, [number, number]> = {
  document: [24_000, 24_000_000],
  image: [120_000, 40_000_000],
  video: [200_000_000, 1_600_000_000],
  audio: [2_000_000, 90_000_000],
  archive: [30_000_000, 900_000_000],
  other: [1_000, 30_000_000],
}

// Where a kind tends to live; anything can also land at the root.
const HOMES: Record<FileKind, readonly (typeof FOLDERS)[number][]> = {
  document: ["Documents", "Contracts", "Invoices", "Projects", "Shared"],
  image: ["Design", "Pictures", "Marketing"],
  video: ["Marketing", "Recordings", "Shared"],
  audio: ["Music", "Recordings"],
  archive: ["Archive", "Downloads"],
  other: ["Downloads", "Projects", "Archive"],
}

function generate(): File[] {
  const rand = seeded("files")
  const owners = MEMBERS.filter((member) => member.status === "active").map((member) => member.id)

  const folders: File[] = FOLDERS.map((name, index) => ({
    id: rowId("fil", index + 1),
    name,
    kind: "folder",
    sizeBytes: 0,
    ownerId: pick(rand, owners),
    parentId: undefined,
    modifiedAt: daysAgo(400),
    starred: chance(rand, 0.2),
  }))
  const folderByName = new Map(folders.map((folder) => [folder.name, folder]))

  // Names taken so far per folder, so a second "hero-banner.png" in Design
  // becomes "hero-banner-v2.png" rather than a twin.
  const taken = new Map<string, Set<string>>()
  const uniqueName = (parent: string, stem: string, extension: string): string => {
    const names = taken.get(parent) ?? new Set<string>()
    taken.set(parent, names)
    let candidate = `${stem}.${extension}`
    for (let version = 2; names.has(candidate); version++) candidate = `${stem}-v${version}.${extension}`
    names.add(candidate)
    return candidate
  }

  const rows: File[] = Array.from({ length: COUNT - FOLDERS.length }, (_, index) => {
    const kind = pickWeighted(rand, KIND_MIX)
    const vocabulary = NAMES[kind]
    const home = chance(rand, 0.12) ? undefined : folderByName.get(pick(rand, HOMES[kind]))
    const [min, max] = SIZES[kind]
    return {
      id: rowId("fil", FOLDERS.length + index + 1),
      name: uniqueName(home?.id ?? "root", pick(rand, vocabulary.stems), pick(rand, vocabulary.extensions)),
      kind,
      sizeBytes: intBetween(rand, min, max),
      ownerId: pick(rand, owners),
      parentId: home?.id,
      modifiedAt: dateBetween(rand, daysAgo(180), REFERENCE_DATE),
      starred: chance(rand, 0.12),
    }
  })

  // A folder weighs what is in it and was touched when its newest file was.
  for (const folder of folders) {
    const inside = rows.filter((row) => row.parentId === folder.id)
    folder.sizeBytes = inside.reduce((sum, row) => sum + row.sizeBytes, 0)
    folder.modifiedAt = inside.reduce(
      (latest, row) => (row.modifiedAt.getTime() > latest.getTime() ? row.modifiedAt : latest),
      folder.modifiedAt
    )
  }

  return [...folders, ...rows]
}

/** The seeded drive, folders first. The repository below owns the rows a browser changes. */
export const FILES: File[] = generate()

export const files = createRepository(FILES, {
  searchKeys: ["name"],
  filterKeys: ["kind", "parentId", "ownerId", "starred"],
})
