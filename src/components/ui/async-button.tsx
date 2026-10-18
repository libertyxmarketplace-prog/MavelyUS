"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

function isPromise(value: unknown): value is Promise<unknown> {
  return typeof (value as Promise<unknown> | undefined)?.then === "function"
}

export type AsyncButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  /** Forces the loading state, for work this button did not start itself. */
  loading?: boolean
  /** Replaces the label while loading; the label stays put when it is unset. */
  loadingText?: React.ReactNode
  /** Return a promise and the button holds its loading state until that promise settles. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
}

/**
 * A <Button> that runs its own loading state off whatever `onClick` returns —
 * no `useState` in the page for the one thing every submit button needs.
 */
function AsyncButton({
  className,
  children,
  loading = false,
  loadingText,
  onClick,
  disabled,
  focusableWhenDisabled,
  "aria-disabled": ariaDisabled,
  ...props
}: AsyncButtonProps) {
  const [pending, setPending] = React.useState(false)
  const mountedRef = React.useRef(true)

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const isLoading = loading || pending
  const isDisabled = Boolean(disabled) || isLoading
  const staysFocusable = focusableWhenDisabled ?? isLoading

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const result = onClick?.(event)
    if (!isPromise(result)) return

    setPending(true)
    const settle = () => {
      if (mountedRef.current) setPending(false)
    }
    // Both outcomes only free the button. A rejection is the caller's to report —
    // catch it inside `onClick` and raise a notify.error from there.
    result.then(settle, settle)
  }

  return (
    <Button
      data-slot="async-button"
      data-loading={isLoading || undefined}
      aria-busy={isLoading || undefined}
      // While it works the button is disabled but stays focusable: a natively
      // disabled button drops the focus it was pressed with, and a keyboard
      // user starts over from the top of the page. Base UI still swallows a
      // second press, and Button dims an aria-disabled button like a disabled
      // one. A caller's own disabled stays native unless it asks otherwise.
      disabled={isDisabled}
      focusableWhenDisabled={staysFocusable}
      // Set here rather than left to Base UI, because the attribute a caller
      // passes — undefined when it computes one and the button is enabled, or
      // simply unset — lands after Base UI's own and overwrites it: a button
      // disabled but kept focusable, mid-request or by the caller, looked
      // pressable. Any such button says so; otherwise the caller's stands.
      aria-disabled={isDisabled && staysFocusable ? true : ariaDisabled}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {/* aria-hidden, not a second live region: aria-busy on the button already says it is working. */}
      {isLoading ? <Spinner aria-hidden="true" /> : null}
      {isLoading ? (loadingText ?? children) : children}
    </Button>
  )
}

export { AsyncButton }
