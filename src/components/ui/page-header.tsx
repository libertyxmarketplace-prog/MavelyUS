import * as React from "react"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Swaps the plain anchor for a router link. Declared here rather than imported
 * from app-sidebar so this file installs on its own; the shape is the same.
 */
export type RenderLink = (href: string, props: React.ComponentProps<"a">) => React.ReactNode

export type PageHeaderVariant = "compact" | "editorial"

export type PageHeaderProps = React.ComponentProps<"div"> & {
  title: React.ReactNode
  /** The title's id, so the table or the region the page is about can be named by it (`aria-labelledby`). */
  titleId?: string
  description?: React.ReactNode
  actions?: React.ReactNode
  /** Sits beside the title — a status, a plan, an environment. */
  badge?: React.ReactNode
  /** Renders the back control as a link; onBack renders it as a button instead. */
  backHref?: string
  onBack?: () => void
  /** A quiet line under the description — owner, last run, record id. */
  meta?: React.ReactNode
  /** A short caps line above an editorial title — the section this page is in. */
  eyebrow?: React.ReactNode
  /** Usually a NavTabs; it hangs off the header's bottom rule. */
  tabs?: React.ReactNode
  /**
   * `compact` is one 64px band — a 28px serif title with its description set
   * beside it and the actions centred against it — which is what puts a
   * dashboard's first real number at y≈152 on a 1,440px page. `editorial` is
   * the front of a document: an eyebrow, a 32px serif title, the description on
   * its own line beneath.
   */
  variant?: PageHeaderVariant
  /**
   * The title's level. A page's own header is its one h1; a page drawn inside
   * something else — a shell previewed in a band under an h2 — steps down so
   * the outline stays in order. The register is the page title's either way.
   */
  as?: "h1" | "h2" | "h3"
  renderLink?: RenderLink
}

/** The title block at the top of a page, with its actions and an optional tab row. */
function PageHeader({
  className,
  title,
  titleId,
  description,
  actions,
  badge,
  backHref,
  onBack,
  meta,
  eyebrow,
  tabs,
  variant = "compact",
  as: Heading = "h1",
  renderLink,
  ...props
}: PageHeaderProps) {
  const backClassName = cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "-ms-1",
    variant === "editorial" && "mt-0.5"
  )
  const backContent = (
    <>
      <ArrowLeftIcon aria-hidden="true" className="rtl:rotate-180" />
      <span className="sr-only">Back</span>
    </>
  )
  const back = backHref ? (
    renderLink ? (
      renderLink(backHref, { className: backClassName, children: backContent })
    ) : (
      <a href={backHref} className={backClassName}>
        {backContent}
      </a>
    )
  ) : onBack ? (
    <button type="button" onClick={onBack} className={backClassName}>
      {backContent}
    </button>
  ) : null

  const heading = (
    <Heading
      id={titleId}
      data-slot="page-header-title"
      className={cn(
        "type-display text-pretty text-foreground",
        variant === "editorial" ? "text-3xl" : "text-2xl"
      )}
    >
      {title}
    </Heading>
  )

  const descriptionNode = description ? (
    <p
      data-slot="page-header-description"
      className={cn(
        "text-sm text-pretty text-muted-foreground",
        variant === "editorial" && "max-w-2xl"
      )}
    >
      {description}
    </p>
  ) : null

  // The meta tier: 12px on --faint-foreground, which clears 4.5:1 on every
  // plane a header can land on.
  const metaNode = meta ? (
    <div
      data-slot="page-header-meta"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint-foreground"
    >
      {meta}
    </div>
  ) : null

  const actionsNode = actions ? (
    <div data-slot="page-header-actions" className="flex shrink-0 items-center gap-2">
      {actions}
    </div>
  ) : null

  return (
    <div
      data-slot="page-header"
      data-variant={variant}
      // No rule of its own: the title sits on the sheet like the cards under
      // it, and the page's spacing is the spacing. Tabs bring the rule with
      // them — it is the line their underline lands on — in the heavier of
      // the two weights, the same one a table head and a section break use.
      className={cn(
        "flex flex-col gap-[var(--density-gap,1rem)]",
        tabs && "border-b border-rule",
        className
      )}
      {...props}
    >
      {variant === "compact" ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            {back}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {heading}
                {badge}
              </div>
              {descriptionNode}
              {metaNode}
            </div>
          </div>
          {actionsNode}
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-start gap-2">
            {back}
            <div className="flex min-w-0 flex-col gap-1.5">
              {eyebrow ? (
                <p data-slot="page-header-eyebrow" className="type-eyebrow">
                  {eyebrow}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {heading}
                {badge}
              </div>
              {descriptionNode}
              {metaNode}
            </div>
          </div>
          {actionsNode}
        </div>
      )}

      {/* -mb-px drops the tab row a pixel so a NavTabs underline lands exactly
          on the header's own rule instead of a hair above it. */}
      {tabs ? (
        <div data-slot="page-header-tabs" className="-mb-px">
          {tabs}
        </div>
      ) : null}
    </div>
  )
}

export { PageHeader }
