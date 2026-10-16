import * as React from "react";
import { cn } from "@/lib/utils";

export const InputGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-9 w-full items-center rounded-lg border border-white/10 bg-white/[0.03] text-sm transition-all focus-within:border-white/30 focus-within:bg-white/[0.05]",
      className
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

export const InputGroupInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-full w-full bg-transparent pl-8 pr-16 text-xs text-white outline-none placeholder:text-zinc-500",
      className
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

export const InputGroupAddon = React.forwardRef(
  ({ align = "inline-start", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute flex items-center gap-1 text-zinc-400",
        align === "inline-end" ? "right-2" : "left-2.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
InputGroupAddon.displayName = "InputGroupAddon";
