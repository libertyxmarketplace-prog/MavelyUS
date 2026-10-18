"use client"

import * as React from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type Step = {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  /** Replaces the step number in the indicator; sized to 3.5. */
  icon?: React.ReactNode
  optional?: boolean
}

/** Where a step sits relative to the one being worked on. */
export type StepState = "completed" | "active" | "upcoming"

export type StepperProps = React.ComponentProps<"div"> & {
  steps: Step[]
  /** Index of the step being worked on. */
  activeStep: number
  /** Which steps are done; without it, everything before activeStep is. */
  completedSteps?: number[]
  orientation?: "horizontal" | "vertical"
  onStepClick?: (index: number) => void
  size?: "sm" | "default"
  /** Which steps onStepClick reaches; nothing is clickable without a handler. */
  clickable?: "all" | "completed" | "none"
}

const INDICATOR: Record<StepState, string> = {
  completed: "border-primary bg-primary text-primary-foreground",
  active: "border-primary text-primary",
  upcoming: "border-border text-muted-foreground",
}

export type StepIndicatorProps = {
  step: Step
  /** Zero-based; the circle shows index + 1 when the step has no icon. */
  index: number
  state: StepState
  size?: "sm" | "default"
}

/** The numbered circle: 24px, a hairline border, filled once the step is done. */
function StepIndicator({ step, index, state, size = "default" }: StepIndicatorProps) {
  return (
    <span
      data-slot="stepper-indicator"
      data-state={state}
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium tabular-nums transition-colors",
        size === "sm" ? "size-5 text-avatar" : "size-6 text-xs",
        INDICATOR[state],
        "[&_svg]:size-3.5"
      )}
    >
      {state === "completed" ? <CheckIcon /> : (step.icon ?? index + 1)}
    </span>
  )
}

/** A numbered progress rail through a multi-step flow, across or down the page. */
function Stepper({
  className,
  steps,
  activeStep,
  completedSteps,
  orientation = "horizontal",
  onStepClick,
  size = "default",
  clickable = "completed",
  ...props
}: StepperProps) {
  const vertical = orientation === "vertical"
  const isCompleted = (index: number) =>
    completedSteps ? completedSteps.includes(index) : index < activeStep

  // The step being worked on is current whatever completedSteps says: a
  // reader who goes back to a finished step is on it again, and the rail has
  // to say where they are.
  function stateOf(index: number): StepState {
    if (index === activeStep) return "active"
    return isCompleted(index) ? "completed" : "upcoming"
  }

  // Going back to a finished step is safe; jumping ahead over unfinished work
  // usually is not, so "completed" is the default and "all" is opt-in. The
  // current step is where the reader already is, so it is never "completed".
  function canClick(index: number) {
    if (!onStepClick || clickable === "none") return false
    return clickable === "all" || stateOf(index) === "completed"
  }

  return (
    <div
      data-slot="stepper"
      data-orientation={orientation}
      data-size={size}
      className={cn("w-full", className)}
      {...props}
    >
      <ol
        data-slot="stepper-list"
        className={cn("flex", vertical ? "flex-col" : "items-start")}
      >
        {steps.map((step, index) => {
          const state = stateOf(index)
          const last = index === steps.length - 1
          const isClickable = canClick(index)

          // A narrow step — four across a phone — wraps its words inside
          // itself: a word longer than the step breaks rather than running
          // into the next one, and the Optional tag is set off from the title
          // by a space, not a margin, so it drops under the title flush.
          const labels = (
            <span
              className={cn(
                "flex min-w-0 flex-col gap-0.5 text-start wrap-anywhere",
                !vertical && "col-span-2 pt-2 pe-3"
              )}
            >
              <span
                className={cn(
                  "leading-tight font-medium",
                  size === "sm" ? "text-xs" : "text-sm",
                  state === "upcoming" && "text-muted-foreground"
                )}
              >
                {step.title}
                {step.optional ? (
                  <>
                    {" "}
                    <span className="text-xs font-normal whitespace-nowrap text-muted-foreground">
                      Optional
                    </span>
                  </>
                ) : null}
              </span>
              {step.description ? (
                <span className="text-xs text-muted-foreground">{step.description}</span>
              ) : null}
              {/* The circle's tick is decorative, so the state is said in words. */}
              {state === "completed" ? <span className="sr-only">Completed</span> : null}
            </span>
          )

          const connector = last ? null : (
            <span
              data-slot="stepper-connector"
              data-filled={state === "completed" || undefined}
              aria-hidden="true"
              className={cn(
                "transition-colors",
                state === "completed" ? "bg-primary" : "bg-border",
                // Down the page the line hangs from the circle's centre; across
                // it, the line fills its own grid cell beside the circle and
                // stops just short of the next one.
                vertical
                  ? cn("my-1 min-h-4 w-px", size === "sm" ? "ms-2.5" : "ms-3")
                  : "me-2 h-px"
              )}
            />
          )

          // Beside the circle when the rail runs down the page; underneath it
          // when it runs across, where a column is too narrow to hold both.
          const triggerClassName = cn(
            "rounded-md focus-ring",
            vertical
              ? "flex min-w-0 items-center gap-2.5"
              : "grid w-full grid-cols-[auto_1fr] items-center gap-x-2"
          )
          const triggerContent = (
            <>
              <StepIndicator step={step} index={index} state={state} size={size} />
              {vertical ? labels : connector}
              {vertical ? null : labels}
            </>
          )

          return (
            <li
              key={step.id}
              data-slot="stepper-step"
              data-state={state}
              aria-current={state === "active" ? "step" : undefined}
              className={cn("min-w-0", vertical ? "flex flex-col" : "flex-1")}
            >
              {isClickable ? (
                <button
                  type="button"
                  data-slot="stepper-trigger"
                  onClick={() => onStepClick?.(index)}
                  className={triggerClassName}
                >
                  {triggerContent}
                </button>
              ) : (
                <span data-slot="stepper-trigger" className={triggerClassName}>
                  {triggerContent}
                </span>
              )}

              {vertical ? connector : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export type StepperActionsProps = React.ComponentProps<"div"> & {
  onBack?: () => void
  onNext?: () => void
  canBack?: boolean
  canNext?: boolean
  /** Swaps the next label for the finish label. */
  isLast?: boolean
  nextText?: string
  backText?: string
  finishText?: string
  /** Locks both buttons and spins the forward one. */
  loading?: boolean
}

/** The Back and Next row under a stepped form. */
function StepperActions({
  className,
  onBack,
  onNext,
  canBack = true,
  canNext = true,
  isLast = false,
  nextText = "Next",
  backText = "Back",
  finishText = "Finish",
  loading = false,
  children,
  ...props
}: StepperActionsProps) {
  return (
    <div
      data-slot="stepper-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {onBack ? (
        <Button type="button" variant="ghost" disabled={!canBack || loading} onClick={onBack}>
          {backText}
        </Button>
      ) : null}
      <div className="ms-auto flex items-center gap-2">
        {children}
        {onNext ? (
          <Button
            type="button"
            disabled={!canNext || loading}
            aria-busy={loading || undefined}
            onClick={onNext}
          >
            {loading ? <Loader2Icon className="animate-spin motion-reduce:animate-none in-data-[motion=reduced]:animate-none" /> : null}
            {isLast ? finishText : nextText}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { Stepper, StepperActions, StepIndicator }
