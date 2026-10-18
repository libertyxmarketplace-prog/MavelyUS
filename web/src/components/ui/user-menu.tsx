"use client"

import * as React from "react"
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { KbdShortcut } from "@/components/ui/kbd-shortcut"
import { getInitials } from "@/lib/format"

export type UserMenuItem = {
  label: React.ReactNode
  icon?: React.ReactNode
  /** Runs on click; pair it with href to both navigate and record the choice. */
  onSelect?: () => void
  /** Renders the item as a link. */
  href?: string
  /** Written the way KbdShortcut takes it, e.g. "mod+," — "mod" is ⌘ on mac, Ctrl elsewhere. */
  shortcut?: string
  separatorBefore?: boolean
}

// The trigger button is the root: className and the rest of the props land on
// whichever of the two shapes `trigger` selects. className is re-declared as a
// plain string, and `trigger` names the shape rather than the button's content.
export type UserMenuProps = Omit<
  React.ComponentProps<typeof Button>,
  "className" | "variant" | "size" | "children" | "render" | "aria-label"
> & {
  user: {
    name: string
    email?: string
    src?: string
    /** Overrides the initials taken from the name. */
    fallback?: string
    /** A short plan or role, shown as a badge beside the name. */
    plan?: string
  }
  items?: UserMenuItem[]
  /** Adds a "Log out" entry at the bottom of the menu. */
  onSignOut?: () => void
  align?: "start" | "end"
  trigger?: "avatar" | "full"
  className?: string
}

/** The signed-in account: an avatar (or a full name row) that opens the account menu. */
function UserMenu({
  user,
  items,
  onSignOut,
  align = "end",
  trigger = "avatar",
  className,
  ...props
}: UserMenuProps) {
  const initials = user.fallback ?? getInitials(user.name)

  // Decorative everywhere it appears: the trigger names itself, and the name
  // is right beside it in the menu — initials would only add "A L" to both.
  const avatar = (size: "sm" | "default") => (
    <Avatar size={size} aria-hidden="true">
      {user.src ? <AvatarImage src={user.src} alt="" /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger === "full" ? (
            <Button
              type="button"
              variant="ghost"
              data-slot="user-menu"
              data-trigger="full"
              className={cn("h-auto w-full justify-start gap-2 px-2 py-1.5", className)}
              {...props}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-slot="user-menu"
              data-trigger="avatar"
              // The avatar carries no text, so the trigger says whose account
              // this is rather than leaving a reader with an unnamed button.
              aria-label={`Account menu for ${user.name}`}
              className={cn("rounded-full", className)}
              {...props}
            />
          )
        }
      >
        {trigger === "full" ? (
          <>
            {avatar("default")}
            <span className="min-w-0 flex-1 truncate text-start text-sm font-medium">
              {user.name}
            </span>
            <ChevronsUpDownIcon className="shrink-0 text-muted-foreground" />
          </>
        ) : (
          avatar("sm")
        )}
      </DropdownMenuTrigger>

      {/* COUPLED TO registry/vibra/ui/item.tsx: an xs Item resets its padding
          inside [data-slot=dropdown-menu-content], and renaming the slot here
          takes that name away. The menu's rows are its own and it accepts no
          arbitrary content, so nothing in it can be an Item; if that ever
          changes, move this slot to a wrapper instead. The trigger keeps the
          bare "user-menu" slot because it is the part always in the DOM. */}
      <DropdownMenuContent data-slot="user-menu-content" align={align} className="w-60">
        <div data-slot="user-menu-account" className="flex items-center gap-2 px-1.5 py-1.5">
          {avatar("default")}
          <div className="grid min-w-0 flex-1 gap-0.5 leading-tight">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">{user.name}</span>
              {user.plan ? (
                <Badge variant="secondary" className="shrink-0">
                  {user.plan}
                </Badge>
              ) : null}
            </div>
            {user.email ? (
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </div>
        </div>

        {items?.length ? <DropdownMenuSeparator /> : null}

        {items?.map((item, index) => (
          <React.Fragment key={index}>
            {item.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              data-slot="user-menu-item"
              onClick={item.onSelect}
              render={item.href ? <a href={item.href} /> : undefined}
            >
              {item.icon}
              {item.label}
              {item.shortcut ? (
                <KbdShortcut keys={item.shortcut} size="sm" className="ms-auto" />
              ) : null}
            </DropdownMenuItem>
          </React.Fragment>
        ))}

        {onSignOut ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-slot="user-menu-sign-out" onClick={onSignOut}>
              <LogOutIcon className="text-muted-foreground" />
              Log out
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
