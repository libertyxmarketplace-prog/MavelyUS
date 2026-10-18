import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { matchesHotkey } from "@/lib/hotkeys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KbdShortcut } from "@/components/ui/kbd-shortcut"
import { Spinner } from "@/components/ui/spinner"

export type SearchInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "size"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Milliseconds to wait after the last keystroke before reporting; the field itself never lags. */
  debounce?: number
  /** A shortcut that focuses the field, e.g. "mod+k"; its keycap shows while the field is empty. */
  shortcut?: string
  /**
   * Where the shortcut listens. Left off, the whole window — right for the one
   * search a page has. A band or a panel that is one of several on a page
   * passes its own element, so the key answers only while the focus is in it
   * and never for its neighbours; `null` binds nothing and only shows the
   * keycap, for a field whose key another control owns — AppShell's palette
   * owns its ⌘K, and its sidebar field only prints it.
   */
  shortcutScope?: React.RefObject<HTMLElement | null> | null
  /** Shows a clear button once there is something to clear. */
  clearable?: boolean
  loading?: boolean
  size?: "sm" | "default"
}

/** A search field with a clear button, an optional debounce, and a shortcut that focuses it — from anywhere, or from within its scope. */
function SearchInput({
  className,
  value,
  defaultValue,
  onValueChange,
  debounce = 0,
  shortcut,
  shortcutScope,
  clearable = true,
  loading = false,
  size = "default",
  disabled,
  onKeyDown,
  onBlur,
  ref,
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  // The field keeps its own handle — clearing and the shortcut focus through
  // it — and hands the caller's ref the same element, rather than one
  // replacing the other.
  const setInput = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  const isControlled = value !== undefined
  // A controlled field with no debounce keeps no draft at all: it renders the
  // caller's value, so a keystroke the caller rejects never lands. With a
  // debounce there has to be a draft — the field cannot wait to show a
  // keystroke — and it gives way again on blur.
  const ownsText = !isControlled || debounce > 0

  const [text, setText] = React.useState(value ?? defaultValue ?? "")
  const [lastValue, setLastValue] = React.useState(value)
  // The last string the field and its owner agreed on: what the field last
  // reported, or what the owner last set of its own accord.
  const [agreed, setAgreed] = React.useState(value ?? defaultValue ?? "")

  if (isControlled && value !== lastValue) {
    setLastValue(value)
    // The owner's own word — a reset, a normalised string — replaces the
    // draft. The field's own report coming back does not: an owner that
    // answers late finds the typist a letter further on, and that letter stays.
    if (value !== agreed) {
      setText(value)
      setAgreed(value)
    }
  }

  // What the pending report and the handlers read: the latest, never the
  // render they were made in. Level with every commit, and kept level by the
  // handlers in between.
  const live = React.useRef({ text, agreed, value, onValueChange })
  React.useLayoutEffect(() => {
    live.current = { text, agreed, value, onValueChange }
  })

  // At most one report waits out the debounce, re-armed by every keystroke.
  // It reads the draft when it fires, so the latest text is always the one
  // reported, and it goes with the field.
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  // Tells the owner `next` now, dropping whatever the debounce still owed —
  // unless the owner has heard it already, or holds it as its value.
  function report(next: string) {
    clearTimeout(timer.current)
    timer.current = undefined
    const now = live.current
    if (next === now.agreed) return
    now.agreed = next
    setAgreed(next)
    if (now.value !== undefined && next === now.value) return
    now.onValueChange?.(next)
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setText(next)
    live.current.text = next
    // With no debounce there is nothing to wait for, so there is no timer at
    // all: the report goes inside the keystroke's own event. A timer, even a
    // zero-delay one, could settle on an older draft after a newer keystroke
    // had been reported, and a controlled field would put the older string
    // back under the typist ("invoice" arrived as "ivic").
    if (debounce <= 0) {
      report(next)
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      report(live.current.text)
    }, debounce)
  }

  // Clearing is a decision, not a keystroke, so it skips the debounce.
  function clear() {
    setText("")
    live.current.text = ""
    report("")
    inputRef.current?.focus()
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    // Leaving the field ends the wait: what the debounce still owes goes now,
    // and then the draft gives way to the owner's value. Agreeing on that value
    // means an owner that takes the report and re-renders with it is followed
    // like any value it sets, while one that rejects it keeps its own.
    if (isControlled && text !== value) {
      report(text)
      setText(value)
      setAgreed(value)
    }
    onBlur?.(event)
  }

  React.useEffect(() => {
    const combo = shortcut
    if (!combo || shortcutScope === null) return
    const target: HTMLElement | Window | null = shortcutScope ? shortcutScope.current : window
    if (!target) return

    const handleKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || !matchesHotkey(event, combo)) return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    target.addEventListener("keydown", handleKeyDown)
    return () => target.removeEventListener("keydown", handleKeyDown)
  }, [shortcut, shortcutScope])

  const shown = ownsText ? text : (value as string)
  const showClear = clearable && shown.length > 0 && !disabled
  // The hint gives up its corner as soon as there is something to clear.
  const shortcutHint = shortcut && shown.length === 0 ? shortcut : null

  return (
    <div
      data-slot="search-input"
      data-size={size}
      data-loading={loading || undefined}
      className={cn("relative w-full", className)}
    >
      <span
        aria-hidden={loading ? undefined : "true"}
        className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-muted-foreground"
      >
        {loading ? <Spinner className="size-4" /> : <SearchIcon className="size-4" />}
      </span>

      <Input
        ref={setInput}
        type="search"
        value={shown}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Escape" && shown) {
            event.preventDefault()
            // The Escape emptied the field, so it is spent: a dialog or a menu
            // around the field must not also take it as a dismiss.
            event.stopPropagation()
            clear()
          }
          onKeyDown?.(event)
        }}
        className={cn(
          "ps-8 [&::-webkit-search-cancel-button]:appearance-none",
          size === "sm" ? "h-7" : "h-8",
          shortcutHint ? "pe-12" : showClear ? "pe-8" : "pe-2.5"
        )}
        {...props}
      />

      <span className="absolute inset-y-0 end-0 flex items-center gap-1 pe-1.5">
        {shortcutHint ? (
          <KbdShortcut keys={shortcutHint} size="sm" className="pointer-events-none" />
        ) : null}
        {showClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={clear}
            className="text-muted-foreground"
          >
            <XIcon />
          </Button>
        ) : null}
      </span>
    </div>
  )
}

export { SearchInput }
