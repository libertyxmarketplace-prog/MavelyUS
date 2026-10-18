"use client"

import * as React from "react"
import {
  BellIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  CheckCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RelativeTime } from "@/components/ui/relative-time"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getInitials } from "@/lib/format"

export type RenderLink = (href: string, props: React.ComponentProps<"a">) => React.ReactNode

export type NotificationTone = "default" | "success" | "warning" | "danger" | "info"

export type Notification = {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  time: Date | string
  read: boolean
  type?: NotificationTone
  avatar?: { name: string; src?: string }
  href?: string
}

export type NotificationCenterProps = Omit<
  React.ComponentProps<typeof PopoverTrigger>,
  "className" | "render" | "children" | "aria-label"
> & {
  notifications: Notification[]
  onMarkAllRead?: () => void
  onMarkRead?: (id: string) => void
  onClear?: () => void
  onOpenNotification?: (notification: Notification) => void
  trigger?: React.ReactNode
  emptyMessage?: React.ReactNode
  align?: "start" | "end"
  now?: Date
  className?: string
  renderLink?: RenderLink
}

export function unreadCount(notifications: { read: boolean }[]): number {
  return notifications.reduce((total, notification) => total + (notification.read ? 0 : 1), 0)
}

const TONE_ICON: Record<NotificationTone, React.ComponentType<{ className?: string }>> = {
  default: BellIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
  info: InfoIcon,
}

const TONE_CLASS: Record<NotificationTone, string> = {
  default: "bg-white/[0.06] text-zinc-400",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-rose-500/15 text-rose-400",
  info: "bg-cyan-500/15 text-cyan-400",
}

export type NotificationMarkProps = { notification: Notification }

function NotificationMark({ notification }: NotificationMarkProps) {
  if (notification.avatar) {
    return (
      <Avatar size="sm" aria-hidden="true" className="mt-0.5 shrink-0">
        {notification.avatar.src ? <AvatarImage src={notification.avatar.src} alt="" /> : null}
        <AvatarFallback>{getInitials(notification.avatar.name)}</AvatarFallback>
      </Avatar>
    )
  }

  const tone = notification.type ?? "default"
  const Icon = TONE_ICON[tone]
  return (
    <span
      data-slot="notification-center-mark"
      data-tone={tone}
      aria-hidden="true"
      className={cn(
        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10",
        TONE_CLASS[tone]
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

function NotificationCenter({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClear,
  onOpenNotification,
  trigger,
  emptyMessage = "No notifications right now.",
  align = "end",
  now,
  className,
  renderLink,
  ...props
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all")
  const unread = unreadCount(notifications)
  const unreadOnly = notifications.filter((n) => !n.read)
  const displayed = activeTab === "all" ? notifications : unreadOnly

  function handleOpen(notification: Notification) {
    if (!notification.read) onMarkRead?.(notification.id)
    onOpenNotification?.(notification)
  }

  return (
    <Popover>
      <PopoverTrigger asChild {...props}>
        {(trigger as React.ReactElement) ?? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("relative size-8 rounded-lg hover:bg-white/[0.08]", className)}
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <BellIcon className="size-4 text-zinc-300" />
            {unread > 0 ? (
              <span
                data-slot="notification-center-count"
                aria-hidden="true"
                className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] leading-none font-bold text-black"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-80 sm:w-96 max-w-[calc(100vw-2rem)] overflow-hidden p-0 border border-white/[0.08] bg-[#161a24] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-2xl"
      >
        <div className="flex flex-col w-full">
          {/* Header Top: Title + Mark All Read */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">Notifications</span>
              {unread > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md font-bold">
                  {unread} new
                </span>
              ) : null}
            </div>

            {onMarkAllRead && unread > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors font-medium"
              >
                <CheckCheck className="size-3.5" />
                <span>Mark all as read</span>
              </button>
            ) : null}
          </div>

          {/* Filter Pills: All / Unread (Full width row, never squished!) */}
          <div className="flex items-center gap-1 p-2 border-b border-white/[0.06] bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-colors text-center",
                activeTab === "all"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-1.5",
                activeTab === "unread"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <span>Unread</span>
              {unread > 0 && (
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                  activeTab === "unread" ? "bg-black/15 text-black font-bold" : "bg-white/[0.08] text-zinc-300"
                )}>
                  {unread}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-80 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-1 text-xs text-muted-foreground">
                <p>{emptyMessage}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {displayed.map((notification) => {
                  const content = (
                    <>
                      <NotificationMark notification={notification} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                        <span className="truncate text-xs font-semibold text-zinc-100">
                          {notification.title}
                        </span>
                        {notification.description ? (
                          <span className="line-clamp-2 text-xs text-zinc-400 break-words leading-relaxed">
                            {notification.description}
                          </span>
                        ) : null}
                        <RelativeTime
                          date={notification.time}
                          now={now}
                          className="text-[10px] text-zinc-500 font-mono mt-0.5"
                        />
                      </div>
                      {!notification.read && (
                        <span
                          aria-hidden="true"
                          className="mt-2 size-2 shrink-0 rounded-full bg-emerald-400"
                        />
                      )}
                    </>
                  )

                  const rowProps = {
                    onClick: () => handleOpen(notification),
                    className: cn(
                      "flex w-full items-start gap-3 p-3 text-start outline-none transition-colors hover:bg-white/[0.04]",
                      !notification.read ? "bg-white/[0.02]" : "opacity-75"
                    ),
                  }

                  if (!notification.href) {
                    return (
                      <button key={notification.id} type="button" {...rowProps}>
                        {content}
                      </button>
                    )
                  }

                  return (
                    <React.Fragment key={notification.id}>
                      {renderLink ? (
                        renderLink(notification.href, { ...rowProps, children: content } as any)
                      ) : (
                        <a href={notification.href} {...rowProps}>
                          {content}
                        </a>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer Clear All */}
          {onClear && notifications.length > 0 ? (
            <div className="p-2 border-t border-white/[0.06] bg-white/[0.02]">
              <button
                type="button"
                onClick={onClear}
                className="w-full text-xs text-zinc-400 hover:text-white py-1.5 rounded-lg transition-colors font-medium text-center hover:bg-white/[0.04]"
              >
                Clear all notifications
              </button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationCenter, NotificationMark }
