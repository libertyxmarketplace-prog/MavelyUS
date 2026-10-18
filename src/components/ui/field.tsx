import * as React from "react"
import { cn } from "@/lib/utils"

export const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props} />
))
FieldGroup.displayName = "FieldGroup"

export const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex",
      orientation === "horizontal" ? "items-start gap-3" : "flex-col gap-1.5",
      className
    )}
    {...props}
  />
))
Field.displayName = "Field"

export const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("grid gap-1 leading-none", className)} {...props} />
))
FieldContent.displayName = "FieldContent"

export const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-xs font-medium text-zinc-200 cursor-pointer select-none", className)}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

export const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[11px] text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"
