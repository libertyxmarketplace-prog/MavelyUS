const META_TOKENS = new Set(["cmd", "command", "meta"])
const CTRL_TOKENS = new Set(["ctrl", "control"])
const ALT_TOKENS = new Set(["alt", "opt", "option"])
const KNOWN_MODIFIERS = new Set(["mod", "shift", ...META_TOKENS, ...CTRL_TOKENS, ...ALT_TOKENS])

/** Whether the event landed in something the reader is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element?.tagName) return false
  const tag = element.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" || element.isContentEditable
}

/**
 * Whether a keydown is the hotkey, written as KbdShortcut writes it: "mod+k",
 * "shift+?", or a bare "c".
 *
 * A bare key belongs to whatever the reader is typing into, so it only fires
 * outside a field; a chord fires anywhere. A held chord repeats at the OS rate,
 * and toggling on every one of those would strobe whatever it opens, so a
 * repeat is never a match.
 */
export function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return false

  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)
  // A token neither side understands must not quietly become no modifier at
  // all: "win+k" is better off never firing than firing on every bare K.
  if (modifiers.some((modifier) => !KNOWN_MODIFIERS.has(modifier))) return false

  // "mod" is the one drawn as whichever key the reader's platform uses, so
  // either satisfies it. Naming a specific key means that key and not the other.
  const wantsMod = modifiers.includes("mod")
  const wantsMeta = modifiers.some((modifier) => META_TOKENS.has(modifier))
  const wantsCtrl = modifiers.some((modifier) => CTRL_TOKENS.has(modifier))
  const wantsAlt = modifiers.some((modifier) => ALT_TOKENS.has(modifier))

  if (event.repeat) return false
  if (wantsMod) {
    if (!event.metaKey && !event.ctrlKey) return false
  } else {
    if (wantsMeta !== event.metaKey) return false
    if (wantsCtrl !== event.ctrlKey) return false
  }
  if (modifiers.includes("shift") !== event.shiftKey) return false
  if (wantsAlt !== event.altKey) return false
  if (event.key.toLowerCase() !== key) return false
  return wantsMod || wantsMeta || wantsCtrl || wantsAlt || !isTypingTarget(event.target)
}

/**
 * A check that passes each native event once. React hands a key pressed
 * inside a nested portal — a Base UI dialog is two portal containers deep — to
 * an ancestor's handler once for every container the event passes, capture
 * and bubble alike, so a handler that toggles something on a chord (a band's
 * ⌘K around its palette) saw each press twice. Make one per handler and keep
 * it for the component's life — `const [once] = React.useState(firstDelivery)`
 * — and return early unless `once(event.nativeEvent)`. One per handler, never
 * shared: a second handler asking about the same press must still hear it.
 */
export function firstDelivery(): (event: Event) => boolean {
  const seen = new WeakSet<Event>()
  return (event) => {
    if (seen.has(event)) return false
    seen.add(event)
    return true
  }
}
