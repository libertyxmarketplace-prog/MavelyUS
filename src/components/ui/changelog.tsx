import * as React from "react"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

/** What a release did to the product. */
export type ChangelogTag = "new" | "improved" | "fixed" | "removed"

const TAG_LABELS: Record<ChangelogTag, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
  removed: "Removed",
}

const TAG_TONES: Record<ChangelogTag, string> = {
  new: "border-transparent bg-emerald-500/15 text-emerald-400",
  improved: "border-transparent bg-blue-500/15 text-blue-400",
  fixed: "border-transparent bg-amber-500/15 text-amber-400",
  removed: "border-transparent bg-zinc-800 text-zinc-400",
}

const TAG_ORDER: ChangelogTag[] = ["new", "improved", "fixed", "removed"]

export type ChangelogEntry = {
  version?: string
  date: Date | string
  title: React.ReactNode
  description?: React.ReactNode
  tags?: ChangelogTag[]
  items?: string[]
  href?: string
}

export type ChangelogProps = React.ComponentProps<"div"> & {
  entries: ChangelogEntry[]
}

function Changelog({ className, entries, ...props }: ChangelogProps) {
  return (
    <div
      data-slot="changelog"
      className={cn("grid w-full grid-cols-[max-content_minmax(0,1fr)] gap-x-6 divide-y divide-white/[0.08]", className)}
      {...props}
    >
      {entries.map((entry, index) => {
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date)
        const tags = entry.tags?.length
          ? TAG_ORDER.filter((tag) => entry.tags?.includes(tag))
          : []

        return (
          <div
            key={index}
            data-slot="changelog-entry"
            className="col-span-full grid grid-cols-subgrid gap-y-2 py-5 first:pt-0 last:pb-0"
          >
            <time
              data-slot="changelog-date"
              dateTime={date.toISOString()}
              className="pt-0.5 text-xs tabular-nums text-muted-foreground"
            >
              {formatDate(date, "medium", { timeZone: "UTC" })}
            </time>

            <div data-slot="changelog-body" className="flex min-w-0 flex-col gap-2">
              {entry.version || tags.length > 0 ? (
                <div data-slot="changelog-badges" className="flex flex-wrap items-center gap-1.5">
                  {entry.version ? (
                    <Badge
                      data-slot="changelog-version"
                      variant="outline"
                      className="font-mono tabular-nums text-xs"
                    >
                      {entry.version}
                    </Badge>
                  ) : null}
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      data-slot="changelog-tag"
                      data-tag={tag}
                      variant="outline"
                      className={TAG_TONES[tag]}
                    >
                      {TAG_LABELS[tag]}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div data-slot="changelog-title" className="text-sm font-medium text-white">
                {entry.href ? (
                  <a
                    href={entry.href}
                    className="rounded-sm hover:underline hover:text-emerald-400"
                  >
                    {entry.title}
                  </a>
                ) : (
                  entry.title
                )}
              </div>

              {entry.description ? (
                <p
                  data-slot="changelog-description"
                  className="text-sm text-zinc-400"
                >
                  {entry.description}
                </p>
              ) : null}

              {entry.items?.length ? (
                <ul
                  data-slot="changelog-items"
                  className="flex list-disc flex-col gap-1 ps-4 text-sm text-zinc-400 marker:text-zinc-600"
                >
                  {entry.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Changelog }
