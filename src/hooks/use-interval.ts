import * as React from "react"

/** Runs `callback` every `delay` ms, always invoking its latest version (no stale closures); pass `null` to pause without tearing down. */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = React.useRef(callback)

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
