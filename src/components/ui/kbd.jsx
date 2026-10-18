import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 select-none items-center justify-center rounded border border-white/10 bg-white/[0.06] px-1.5 font-mono text-[10px] font-medium text-zinc-400 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export default Kbd;
