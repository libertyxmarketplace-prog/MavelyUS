import * as React from "react"
import { useTheme } from "next-themes"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const

// The icon variant walks this order; an unset theme starts the cycle at light.
const CYCLE = ["light", "dark", "system"] as const

function nextTheme(theme: string | undefined): string {
  const index = CYCLE.indexOf((theme ?? "") as (typeof CYCLE)[number])
  return CYCLE[(index + 1) % CYCLE.length]
}

// Nothing to subscribe to: the store exists only to hand the server and the
// client different snapshots, which is what a mount guard actually needs.
const subscribeToNothing = () => () => {}
const onClient = () => true
const onServer = () => false

/** The theme is only known on the client, so the first paint must not depend on it. False through the server render and the hydrating one, true from the commit on. */
function useMounted(): boolean {
  // useSyncExternalStore rather than an effect that sets state: React reads
  // the client snapshot once hydration has committed, with no cascading render.
  return React.useSyncExternalStore(subscribeToNothing, onClient, onServer)
}

type ThemeToggleOwnProps = {
  size?: "sm" | "default"
  className?: string
}

/**
 * The variant chooses the root element, so it chooses what the rest of the
 * props may be: "segmented" renders a radiogroup div, the other two render the
 * Button that opens or cycles the theme. Both roots take className and spread
 * everything else, but a div and a button do not accept the same attributes —
 * hence the union rather than one loose type.
 */
export type ThemeToggleProps =
  | ({ variant: "segmented" } & ThemeToggleOwnProps &
      Omit<React.ComponentProps<"div">, "className" | "role" | "aria-label" | "children">)
  | ({ variant?: "icon" | "dropdown" } & ThemeToggleOwnProps &
      Omit<
        React.ComponentProps<typeof Button>,
        "className" | "variant" | "size" | "aria-label" | "children" | "render"
      >)

function ThemeToggle(props: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (props.variant === "segmented") {
    // Destructured inside the branch, not in the signature: a rest element does
    // not narrow with the discriminant it was destructured beside.
    const { variant, size = "default", className, ...rest } = props
    return (
      <div
        data-slot="theme-toggle"
        data-variant={variant}
        data-size={size}
        role="radiogroup"
        aria-label="Theme"
        className={cn("inline-flex w-fit items-center gap-0.5 rounded-lg border p-0.5", className)}
        {...rest}
      >
        {THEMES.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            data-slot="theme-toggle-option"
            data-theme={entry.value}
            role="radio"
            aria-checked={mounted && theme === entry.value}
            aria-label={entry.label}
            variant="ghost"
            size={size === "sm" ? "icon-xs" : "icon-sm"}
            onClick={() => setTheme(entry.value)}
            // The chosen theme wears the kit's selected fill, the accent's
            // muted tint, in both modes: a plane of grey reads as hover.
            className="text-muted-foreground aria-checked:bg-brand-muted aria-checked:text-foreground"
          >
            <entry.icon />
          </Button>
        ))}
      </div>
    )
  }

  const { variant = "icon", size = "default", className, onClick, ...rest } = props
  const iconSize = size === "sm" ? "icon-sm" : "icon"

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              data-slot="theme-toggle"
              data-variant="dropdown"
              data-size={size}
              variant="ghost"
              size={iconSize}
              aria-label="Change theme"
              className={className}
              // Pulled out of `rest` for the icon variant below, so it is
              // handed back here rather than silently dropped; Base UI merges
              // it with the trigger's own open handler.
              onClick={onClick}
              {...rest}
            >
              <ThemeIcon mounted={mounted} theme={theme} />
            </Button>
          }
        />
        {/* Portalled, so it first renders on the client — reading `theme` here
            cannot cause a hydration mismatch. */}
        <DropdownMenuContent align="end" className="w-36">
          {THEMES.map((entry) => (
            <DropdownMenuItem key={entry.value} onClick={() => setTheme(entry.value)}>
              <entry.icon className="text-muted-foreground" />
              {entry.label}
              {theme === entry.value ? <CheckIcon className="ms-auto size-3.5" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      type="button"
      data-slot="theme-toggle"
      data-variant="icon"
      data-size={size}
      variant="ghost"
      size={iconSize}
      aria-label="Change theme"
      className={className}
      // Composed rather than overridden: cycling the theme is what this button
      // is for, so a caller's own handler runs beside it, not instead of it.
      onClick={(event) => {
        onClick?.(event)
        setTheme(nextTheme(theme))
      }}
      {...rest}
    >
      <ThemeIcon mounted={mounted} theme={theme} />
    </Button>
  )
}

function ThemeIcon({ mounted, theme }: { mounted: boolean; theme: string | undefined }) {
  // Before mount the resolved theme is unknown, so the icon is swapped by the
  // `.dark` class rather than by state — state would flash the wrong glyph.
  if (!mounted) {
    return (
      <>
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
      </>
    )
  }
  if (theme === "dark") return <MoonIcon />
  if (theme === "system") return <MonitorIcon />
  return <SunIcon />
}

export { ThemeToggle }
