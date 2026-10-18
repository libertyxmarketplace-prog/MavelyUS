import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const emptyStateVariants = cva("", {
  variants: {
    variant: {
      // Nothing of its own: the surrounding card or table already frames it.
      default: "",
      dashed: "rounded-lg border border-dashed border-border",
    },
    size: {
      default: "gap-4 p-8",
      sm: "gap-3 p-5",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

const emptyStateMediaVariants = cva("", {
  variants: {
    size: {
      default: "",
      sm: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
    },
  },
  defaultVariants: { size: "default" },
})

// On the face's own spacing: the upstream title tightens it, and nothing at or
// under 16px carries negative tracking in this kit.
const emptyStateTitleVariants = cva("tracking-normal", {
  variants: {
    size: { default: "text-base", sm: "text-sm" },
  },
  defaultVariants: { size: "default" },
})

const emptyStateDescriptionVariants = cva("", {
  variants: {
    size: { default: "", sm: "text-xs" },
  },
  defaultVariants: { size: "default" },
})

// `title` is content here, not the HTML tooltip attribute, so it replaces it.
export type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Sits in a muted tile above the title. Sized to 4 unless it sets its own size. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** The one thing to do next — a button, a link. */
  action?: React.ReactNode
  /** A quieter way out, placed beside the action. */
  secondaryAction?: React.ReactNode
  size?: NonNullable<VariantProps<typeof emptyStateVariants>["size"]>
  /** dashed draws its own placeholder frame, for a region that has no card of its own. */
  variant?: NonNullable<VariantProps<typeof emptyStateVariants>["variant"]>
}

function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "default",
  variant = "default",
  children,
  ...props
}: EmptyStateProps) {
  const hasActions = Boolean(action) || Boolean(secondaryAction)

  return (
    <Empty
      data-slot="empty-state"
      data-variant={variant}
      data-size={size}
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    >
      <EmptyHeader>
        {icon ? (
          <EmptyMedia variant="icon" className={cn(emptyStateMediaVariants({ size }))}>
            {icon}
          </EmptyMedia>
        ) : null}
        <EmptyTitle className={cn(emptyStateTitleVariants({ size }))}>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className={cn(emptyStateDescriptionVariants({ size }))}>
            {description}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>

      {hasActions ? (
        <EmptyContent className="flex-row flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </EmptyContent>
      ) : null}

      {children}
    </Empty>
  )
}

export { EmptyState, emptyStateVariants }
