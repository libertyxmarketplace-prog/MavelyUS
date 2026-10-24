"use client";

import { CheckIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";

type StepperOrientation = "horizontal" | "vertical";
type StepperState = "complete" | "current" | "upcoming";

interface StepperLabels {
  /** Read after the number of a finished step. */
  complete: string;
  /** Read after the number of the step in progress. */
  current: string;
  /** Read after the number of a step not reached yet. An empty string reads nothing. */
  upcoming: string;
}

const defaultLabels: StepperLabels = {
  complete: "Completed",
  current: "Current",
  upcoming: "Upcoming",
};

interface StepperContextValue {
  value: number;
  setValue: (value: number) => void;
  orientation: StepperOrientation;
  linear: boolean;
  labels: StepperLabels;
}

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepper(part: string) {
  const context = useContext(StepperContext);
  if (!context) throw new Error(`${part} must be used inside <Stepper>.`);
  return context;
}

interface StepperItemContextValue {
  step: number;
  state: StepperState;
}

const StepperItemContext = createContext<StepperItemContextValue | null>(null);

function useStepperItem(part: string) {
  const context = useContext(StepperItemContext);
  if (!context) throw new Error(`${part} must be used inside <StepperItem>.`);
  return context;
}

/** True inside a `StepperTrigger`, which then carries `aria-current` instead of the indicator. */
const StepperTriggerContext = createContext(false);

interface StepperProps extends Omit<ComponentProps<"nav">, "defaultValue"> {
  /** The current step, as a 0-based index. Steps before it are complete. */
  value?: number;
  /** The first current step when uncontrolled. */
  defaultValue?: number;
  /** Called with the index of the step a `StepperTrigger` asks for. */
  onValueChange?: (value: number) => void;
  orientation?: StepperOrientation;
  /**
   * When true (the default), a `StepperTrigger` on a step not reached yet is
   * disabled, so steps are taken in order. Set it to false to let people jump
   * to any step.
   */
  linear?: boolean;
  /** Accessible name of the `<nav>` landmark. */
  label?: string;
  /** State text read by screen readers after each step's number. */
  labels?: Partial<StepperLabels>;
}

/**
 * The steps of a multi-step flow (checkout, onboarding, a long form) and
 * where the user is in it.
 */
function Stepper({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  orientation = "horizontal",
  linear = true,
  label = "Progress",
  labels: labelsProp,
  className,
  children,
  ...props
}: StepperProps) {
  const [internal, setInternal] = useState(defaultValue);
  const value = valueProp ?? internal;
  const setValue = (next: number) => {
    if (valueProp === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const labels = { ...defaultLabels, ...labelsProp };
  return (
    <nav
      data-slot="stepper"
      data-orientation={orientation}
      aria-label={label}
      className={className}
      {...props}
    >
      <ol
        data-slot="stepper-list"
        data-orientation={orientation}
        className={cn(
          "flex",
          orientation === "vertical"
            ? "flex-col"
            : "items-center gap-1.5 sm:gap-2",
        )}
      >
        <StepperContext.Provider
          value={{ value, setValue, orientation, linear, labels }}
        >
          {children}
        </StepperContext.Provider>
      </ol>
    </nav>
  );
}

interface StepperItemProps extends ComponentProps<"li"> {
  /** This step's 0-based index. */
  step: number;
}

/** One step. Its state is `data-state`: "complete", "current" or "upcoming". */
function StepperItem({ step, className, ...props }: StepperItemProps) {
  const { value, orientation } = useStepper("StepperItem");
  const state: StepperState =
    step < value ? "complete" : step === value ? "current" : "upcoming";
  return (
    <StepperItemContext.Provider value={{ step, state }}>
      <li
        data-slot="stepper-item"
        data-state={state}
        data-orientation={orientation}
        className={cn(
          "group/stepper-item",
          orientation === "vertical"
            ? "relative flex flex-col pb-6 last:pb-0"
            : "flex items-center gap-1.5 sm:gap-2 [&:not(:last-child)]:flex-1 max-sm:[&:not(:last-child)]:flex-auto",
          orientation === "horizontal" && state === "current" && "min-w-0",
          className,
        )}
        {...props}
      />
    </StepperItemContext.Provider>
  );
}

/**
 * Makes the step a button that moves to it. Disabled for steps not reached
 * yet while the Stepper is `linear`; pass `disabled` to lock any step.
 */
function StepperTrigger({
  className,
  disabled,
  onClick,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  const { setValue, linear } = useStepper("StepperTrigger");
  const { step, state } = useStepperItem("StepperTrigger");
  return (
    <StepperTriggerContext.Provider value={true}>
      <button
        data-slot="stepper-trigger"
        data-state={state}
        type={type}
        aria-current={state === "current" ? "step" : undefined}
        disabled={disabled ?? (linear && state === "upcoming")}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setValue(step);
        }}
        className={cn(
          "inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left",
          "transition-[color,box-shadow] outline-none motion-reduce:transition-none",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </StepperTriggerContext.Provider>
  );
}

/**
 * The round marker with the step's number, or a check mark once complete.
 */
function StepperIndicator({
  className,
  children,
  ...props
}: ComponentProps<"span">) {
  const { labels } = useStepper("StepperIndicator");
  const { step, state } = useStepperItem("StepperIndicator");
  const inTrigger = useContext(StepperTriggerContext);
  const stateLabel = labels[state];
  return (
    <span
      data-slot="stepper-indicator"
      data-state={state}
      aria-current={!inTrigger && state === "current" ? "step" : undefined}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
        "transition-all duration-200 motion-reduce:transition-none",
        "data-[state=upcoming]:bg-[#141416] data-[state=upcoming]:text-zinc-500 data-[state=upcoming]:border-white/10",
        "data-[state=current]:border-white/20 data-[state=current]:bg-zinc-800 data-[state=current]:text-white",
        "data-[state=complete]:border-white/10 data-[state=complete]:bg-[#141416] data-[state=complete]:text-zinc-300",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {state === "complete" ? (
        <>
          <CheckIcon aria-hidden="true" className="size-3.5 text-emerald-400 stroke-[2.5]" />
          <span className="sr-only">{step + 1}</span>
        </>
      ) : (
        (children ?? step + 1)
      )}
      {stateLabel ? <span className="sr-only">{`, ${stateLabel}`}</span> : null}
    </span>
  );
}

/**
 * The step's name.
 */
function StepperTitle({ className, ...props }: ComponentProps<"span">) {
  const stepper = useContext(StepperContext);
  const item = useContext(StepperItemContext);
  const horizontal = stepper?.orientation === "horizontal" && item !== null;
  return (
    <span
      data-slot="stepper-title"
      className={cn(
        "group-data-[state=upcoming]/stepper-item:text-zinc-500 group-data-[state=current]/stepper-item:text-white group-data-[state=complete]/stepper-item:text-zinc-300 block text-xs font-medium",
        horizontal &&
          (item.state === "current" ? "max-sm:truncate" : "max-sm:sr-only"),
        className,
      )}
      {...props}
    />
  );
}

function StepperDescription({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="stepper-description"
      className={cn("text-zinc-500 block text-[11px]", className)}
      {...props}
    />
  );
}

/**
 * The line to the next step, coloured once this step is complete.
 */
function StepperSeparator({ className, ...props }: ComponentProps<"span">) {
  const { orientation } = useStepper("StepperSeparator");
  return (
    <span
      data-slot="stepper-separator"
      data-orientation={orientation}
      aria-hidden="true"
      className={cn(
        "bg-white/10 block shrink-0 group-last/stepper-item:hidden",
        "group-data-[state=complete]/stepper-item:bg-emerald-500/50 transition-colors motion-reduce:transition-none",
        orientation === "vertical"
          ? "absolute top-10 bottom-2 left-[calc(1rem-0.5px)] w-px"
          : "h-px min-w-2 flex-1 sm:min-w-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  type StepperItemProps,
  type StepperLabels,
  type StepperOrientation,
  type StepperProps,
  type StepperState,
};

export default Stepper;
