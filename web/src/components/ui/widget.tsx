"use client"

import * as React from "react"
import { EllipsisIcon, Maximize2Icon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorState } from "@/components/ui/error-state"
import { ChartSkeleton } from "@/components/ui/loading-skeletons"

export type WidgetMenuItem = {
  label: React.ReactNode
  onSelect: () => void
  icon?: React.ReactNode
  destructive?: boolean
  separatorBefore?: boolean
}

export type WidgetProps = React.ComponentProps<"div"> & {
  title: React.ReactNode
  /** The title's id, so a table or a chart inside can be named by it (`aria-labelledby`). */
  titleId?: string
  description?: React.ReactNode
  /** Sits before the title; sized to 4 unless it sets its own size. */
  icon?: React.ReactNode
  /** Controls of your own, placed before the built-in icon buttons. */
  actions?: React.ReactNode
  menu?: WidgetMenuItem[]
  /** Return a promise to spin the refresh icon until it settles. */
  onRefresh?: () => void | Promise<void>
  /** Adds a destructive Remove entry to the menu. */
  onRemove?: () => void
  /** Takes over the expand button; without it the widget opens its own dialog. */
  onExpand?: () => void
  expandable?: boolean
  loading?: boolean
  /** What went wrong; replaces the body with an error state. */
  error?: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "default"
  contentClassName?: string
}

/** A titled panel on a dashboard, with its own refresh, expand, and menu controls. */
function Widget({
  className,
  title,
  titleId: ownTitleId,
  description,
  icon,
  actions,
  menu,
  onRefresh,
  onRemove,
  onExpand,
  expandable = false,
  loading = false,
  error,
  footer,
  size = "default",
  contentClassName,
  children,
  ...props
}: WidgetProps) {
  const id = React.useId()
  const titleId = ownTitleId ?? `${id}-title`
  const [refreshing, setRefreshing] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)

  // A refresh can outlive the widget — a dashboard is edited while it loads.
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  async function handleRefresh() {
    const result = onRefresh?.()
    if (!(result instanceof Promise)) return
    setRefreshing(true)
    try {
      await result
    } finally {
      if (alive.current) setRefreshing(false)
    }
  }

  const menuItems = menu ?? []
  const hasMenu = menuItems.length > 0 || Boolean(onRemove)
  const showExpand = expandable || Boolean(onExpand)
  const ownsDialog = expandable && !onExpand
  const hasControls = Boolean(actions) || Boolean(onRefresh) || showExpand || hasMenu

  const body = loading ? (
    <ChartSkeleton />
  ) : error ? (
    <ErrorState
      size="sm"
      description={error}
      onRetry={onRefresh ? () => void handleRefresh() : undefined}
    />
  ) : (
    children
  )

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      data-slot="widget"
      size={size}
      className={cn("gap-3", className)}
      {...props}
    >
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span
              aria-hidden="true"
              className="text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0"
            >
              {icon}
            </span>
          ) : null}
          <CardTitle id={titleId} className="min-w-0 truncate">
            {title}
          </CardTitle>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}

        {hasControls ? (
          <CardAction>
            <div className="flex items-center gap-0.5">
              {actions}
              {onRefresh ? (
                // Every icon-only control is named after the widget it acts on,
                // so a reader tabbing a dashboard hears "Refresh Revenue by
                // channel" rather than five buttons all called "Refresh".
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  data-pending={refreshing || undefined}
                  disabled={refreshing}
                  aria-labelledby={`${id}-refresh ${titleId}`}
                  onClick={() => void handleRefresh()}
                >
                  <RefreshCwIcon aria-hidden="true" className={cn(refreshing && "animate-spin motion-reduce:animate-none in-data-[motion=reduced]:animate-none")} />
                  <span id={`${id}-refresh`} className="sr-only">
                    Refresh
                  </span>
                </Button>
              ) : null}
              {showExpand ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-labelledby={`${id}-expand ${titleId}`}
                  onClick={() => (onExpand ? onExpand() : setExpanded(true))}
                >
                  <Maximize2Icon aria-hidden="true" />
                  <span id={`${id}-expand`} className="sr-only">
                    Expand
                  </span>
                </Button>
              ) : null}
              {hasMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-labelledby={`${id}-menu ${titleId}`}
                      >
                        <EllipsisIcon aria-hidden="true" />
                        <span id={`${id}-menu`} className="sr-only">
                          More options for
                        </span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-44">
                    {menuItems.map((item, index) => (
                      <React.Fragment key={index}>
                        {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuItem
                          variant={item.destructive ? "destructive" : "default"}
                          onClick={item.onSelect}
                        >
                          {item.icon}
                          {item.label}
                        </DropdownMenuItem>
                      </React.Fragment>
                    ))}
                    {onRemove ? (
                      <>
                        {menuItems.length > 0 ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuItem variant="destructive" onClick={onRemove}>
                          <Trash2Icon />
                          Remove
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className={cn("min-w-0", contentClassName)}>{body}</CardContent>
      {footer ? <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter> : null}

      {ownsDialog ? (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
            <div className={cn("min-w-0", contentClassName)}>{children}</div>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  )
}

export { Widget }
