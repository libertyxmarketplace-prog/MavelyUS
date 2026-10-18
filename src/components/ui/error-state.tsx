import * as React from "react"
import { ChevronDownIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState, type EmptyStateProps } from "@/components/ui/empty-state"

/** `error.message` when there is one, the value itself otherwise — never throws on an odd shape. */
function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (message !== undefined && message !== null) return String(message)
  }
  return String(error)
}

export type ErrorStateProps = Omit<EmptyStateProps, "icon" | "title"> & {
  title?: React.ReactNode
  /** Whatever was thrown or returned; only ever shown behind the details toggle. */
  error?: unknown
  onRetry?: () => void
  retryText?: string
  /** Offers a toggle that reveals the raw error text — keep it off in production UIs. */
  showDetails?: boolean
}

function ErrorState({
  className,
  title = "Something went wrong",
  description = "The request did not complete. Retrying often clears it.",
  error,
  onRetry,
  retryText = "Retry",
  showDetails = false,
  action,
  children,
  ...props
}: ErrorStateProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const detailsId = React.useId()
  const hasDetails = showDetails && error !== undefined && error !== null

  return (
    <EmptyState
      data-slot="error-state"
      role="alert"
      // The media tile belongs to <EmptyState>; tinting it from here keeps the
      // danger tone in one place without widening that component's API.
      className={cn(
        "[&_[data-slot=empty-icon]]:bg-danger-muted [&_[data-slot=empty-icon]]:text-danger",
        className
      )}
      icon={<TriangleAlertIcon />}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            <RotateCwIcon aria-hidden="true" />
            {retryText}
          </Button>
        ) : (
          action
        )
      }
      {...props}
    >
      {children}
      {hasDetails ? (
        <div data-slot="error-state-details" className="flex w-full max-w-sm flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
            className="text-muted-foreground"
          >
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("transition-transform duration-(--duration-fast) ease-(--ease-standard)", detailsOpen && "rotate-180")}
            />
            {detailsOpen ? "Hide details" : "Show details"}
          </Button>
          {detailsOpen ? (
            <pre
              id={detailsId}
              className="max-h-40 w-full overflow-auto rounded-md bg-muted p-3 text-start font-mono text-xs whitespace-pre-wrap text-muted-foreground"
            >
              {errorMessage(error)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </EmptyState>
  )
}

export { ErrorState, errorMessage }
