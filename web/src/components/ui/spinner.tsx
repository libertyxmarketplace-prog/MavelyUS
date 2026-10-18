import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    // A spin is a loop, so no token can time it: it turns only for a reader
    // who has not asked for less motion — by the OS setting or a
    // [data-motion="reduced"] above it — and the status and its name still
    // say it is working when it is still.
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 motion-safe:not-in-data-[motion=reduced]:animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
