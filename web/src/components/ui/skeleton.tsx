import { cn } from "@/lib/utils"

/**
 * The placeholder plane: the warm recessed track, breathing at 1.2s.
 *
 * `motion-safe:` rather than an unconditional animation, so a reader who has
 * asked the system for less motion gets a still block instead of a page of
 * pulsing rectangles — and so the reduced-motion census finds nothing running
 * after load. The theme's other switch, a `[data-motion="reduced"]` a page or
 * a preview frame sets above its content, stops it too: a loop takes no
 * duration token, so it has to not run rather than run in zero time. The pace
 * is a shade quicker than Tailwind's 2s default: at two seconds a table of
 * forty bars reads as a page that has stalled.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-muted motion-safe:not-in-data-[motion=reduced]:animate-pulse motion-safe:[animation-duration:1.2s]",
        className
      )}
      {...props}
    />
  )
}

/**
 * What replaces a skeleton, fading in over `--duration-slow` rather than
 * appearing outright — the same beat the sheets enter on, so a page settling
 * reads as one movement instead of a series of pops.
 */
function SkeletonReveal({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-reveal"
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-(--duration-slow) motion-safe:ease-(--ease-standard)",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton, SkeletonReveal }
