import * as React from "react"
import { CircleCheckIcon, CircleXIcon, InfoIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type CalloutVariant = "default" | "neutral" | "success" | "warning" | "danger" | "info"

// The tone lives in a 2px left rule and a wash behind it. In dark mode the
// -muted tokens are already translucent, so the extra /50 comes off.
const CALLOUT_VARIANTS: Record<CalloutVariant, string> = {
  default: "border-border bg-muted/50 dark:bg-muted",
  // Same as default; both spellings exist so a tone prop can be passed through verbatim.
  neutral: "border-border bg-muted/50 dark:bg-muted",
  success: "border-success bg-success-muted",
  warning: "border-warning bg-warning-muted",
  danger: "border-danger bg-danger-muted",
  info: "border-info bg-info-muted",
}

const CALLOUT_ICON_TONES: Record<CalloutVariant, string> = {
  default: "text-muted-foreground",
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
}

// Shape carries the tone as well as color does: a check never means the same as a cross.
const CALLOUT_ICONS: Record<CalloutVariant, React.ComponentType<React.ComponentProps<"svg">>> = {
  default: InfoIcon,
  neutral: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleXIcon,
  info: InfoIcon,
}

// `title` is content here, not the HTML tooltip attribute, so it replaces it.
export type CalloutProps = Omit<React.ComponentProps<"div">, "title"> & {
  variant?: CalloutVariant
  title?: React.ReactNode
  /** Replaces the tone's default icon; pass null for no icon at all. */
  icon?: React.ReactNode | null
}

/** A <Banner> shrunk to prose scale: an aside inside a card or a docs page, not a page-level notice. */
function Callout({ className, variant = "default", title, icon, children, ...props }: CalloutProps) {
  const DefaultIcon = CALLOUT_ICONS[variant]
  const resolvedIcon = icon === undefined ? <DefaultIcon /> : icon

  return (
    <div
      data-slot="callout"
      data-variant={variant}
      className={cn(
        "flex items-start gap-2 rounded-e-md border-s-2 px-3 py-2 text-sm text-foreground",
        CALLOUT_VARIANTS[variant],
        className
      )}
      {...props}
    >
      {resolvedIcon ? (
        <span
          data-slot="callout-icon"
          aria-hidden="true"
          className={cn(
            "mt-0.5 shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
            CALLOUT_ICON_TONES[variant]
          )}
        >
          {resolvedIcon}
        </span>
      ) : null}

      <div data-slot="callout-content" className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? (
          <div data-slot="callout-title" className="font-medium">
            {title}
          </div>
        ) : null}
        {children ? (
          <div data-slot="callout-description" className="text-pretty">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Callout }
