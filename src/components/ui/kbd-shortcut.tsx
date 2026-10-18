"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

// Modifier glyphs are the mac convention; every other platform spells them out.
const MAC_MODIFIERS: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  opt: "⌥",
  option: "⌥",
  shift: "⇧",
}

const OTHER_MODIFIERS: Record<string, string> = {
  mod: "Ctrl",
  ctrl: "Ctrl",
  control: "Ctrl",
  cmd: "Win",
  command: "Win",
  meta: "Win",
  alt: "Alt",
  opt: "Alt",
  option: "Alt",
  shift: "Shift",
}

// Named keys read the same on every platform.
const KEYS: Record<string, string> = {
  esc: "Esc",
  escape: "Esc",
  enter: "↵",
  return: "↵",
  tab: "⇥",
  space: "Space",
  backspace: "⌫",
  delete: "⌦",
  del: "⌦",
  up: "↑",
  arrowup: "↑",
  down: "↓",
  arrowdown: "↓",
  left: "←",
  arrowleft: "←",
  right: "→",
  arrowright: "→",
  pageup: "⇞",
  pagedown: "⇟",
}

// Screen readers announce most of these glyphs as their Unicode names —
// "place of interest sign" for ⌘ — so the group is labelled with words.
const SPOKEN: Record<string, string> = {
  "⌘": "Command",
  "⌃": "Control",
  "⌥": "Option",
  "⇧": "Shift",
  "↵": "Enter",
  "⇥": "Tab",
  "⌫": "Backspace",
  "⌦": "Delete",
  "↑": "Up",
  "↓": "Down",
  "←": "Left",
  "→": "Right",
  "⇞": "Page up",
  "⇟": "Page down",
}

/** Turns a shortcut string into the key labels to render, e.g. "mod+shift+k" → ["⌘", "⇧", "K"] on mac, ["Ctrl", "Shift", "K"] elsewhere. */
export function parseShortcut(shortcut: string, platform: "mac" | "other" = "mac"): string[] {
  const modifiers = platform === "mac" ? MAC_MODIFIERS : OTHER_MODIFIERS
  return shortcut
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const token = part.toLowerCase()
      if (modifiers[token]) return modifiers[token]
      if (KEYS[token]) return KEYS[token]
      // Single characters read best uppercased ("k" → "K"); longer names keep
      // their shape ("home" → "Home", "f5" → "F5").
      return part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)
    })
}

// There is nothing to subscribe to — the user agent does not change under a
// running page — so the store only exists to give the client and the server
// different snapshots.
const subscribeToNothing = () => () => {}

function readPlatform(): "mac" | "other" {
  if (typeof navigator === "undefined") return "mac"
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? "mac" : "other"
}

const serverPlatform = (): "mac" | "other" => "mac"

/** Resolves "auto" against the client. The server has no user agent, so it renders the mac mapping and React swaps in the real one right after hydration. */
function usePlatform(platform: "mac" | "other" | "auto"): "mac" | "other" {
  // useSyncExternalStore rather than an effect: the snapshot is read after
  // hydration has committed, so the swap costs no cascading render and the
  // server's markup is never wrong on arrival.
  const detected = React.useSyncExternalStore(subscribeToNothing, readPlatform, serverPlatform)
  return platform === "auto" ? detected : platform
}

export type KbdShortcutProps = React.ComponentProps<"span"> & {
  /** The shortcut, as "mod+shift+k" or ["mod", "shift", "k"]; "mod" is ⌘ on mac and Ctrl everywhere else. */
  keys: string | string[]
  size?: "sm" | "default"
  platform?: "mac" | "other" | "auto"
}

function KbdShortcut({
  className,
  keys,
  size = "default",
  platform = "auto",
  ...props
}: KbdShortcutProps) {
  const resolved = usePlatform(platform)
  const shortcut = Array.isArray(keys) ? keys.join("+") : keys
  const labels = parseShortcut(shortcut, resolved)

  return (
    <span
      data-slot="kbd-shortcut"
      data-size={size}
      // One label for the whole group, so the shortcut is read as a phrase
      // rather than as a run of unnamed symbols; role="img" keeps the glyphs
      // themselves out of the accessibility tree.
      role="img"
      aria-label={labels.map((label) => SPOKEN[label] ?? label).join(" + ")}
      className={cn("inline-flex w-fit align-middle", className)}
      {...props}
    >
      <KbdGroup className={cn(size === "sm" && "gap-0.5")}>
        {labels.map((label, index) => (
          <Kbd
            key={`${label}-${index}`}
            className={cn(size === "sm" && "h-4 min-w-4 px-1 text-avatar")}
          >
            {label}
          </Kbd>
        ))}
      </KbdGroup>
    </span>
  )
}

export { KbdShortcut }
