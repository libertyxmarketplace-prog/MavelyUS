/**
 * What this page reads. Community growth data, notifications, and user session.
 */
export type StoredNotification = {
  id: string
  title: string
  description?: string
  at: Date
  read: boolean
  type?: "default" | "success" | "warning" | "danger" | "info"
  avatar?: { name: string; src?: string }
}

/** Real community growth notifications with Discord events, dynamically loaded */
export function shellNotifications(): StoredNotification[] {
  try {
    const raw = localStorage.getItem('erlcus_live_notifications')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          at: new Date(item.at),
        }))
      }
    }
  } catch (e) {
    console.warn('Error reading notifications:', e)
  }
  return []
}

/** Add a real notification dynamically when real events occur */
export function addLiveNotification(notif: {
  title: string
  description?: string
  type?: "default" | "success" | "warning" | "danger" | "info"
  avatar?: { name: string; src?: string }
}) {
  try {
    const existing = shellNotifications()
    const newNotif: StoredNotification = {
      id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: notif.title,
      description: notif.description,
      at: new Date(),
      read: false,
      type: notif.type || "info",
      avatar: notif.avatar,
    }
    const updated = [newNotif, ...existing].slice(0, 30)
    localStorage.setItem('erlcus_live_notifications', JSON.stringify(updated))
    window.dispatchEvent(new Event('erlcus_notifications_updated'))
  } catch (e) {
    console.warn('Error saving notification:', e)
  }
}

/** The person looking at the page: Mavely operator or authenticated Discord admin. */
export function currentUser(customUser?: { username?: string; globalName?: string; id?: string; avatar?: string | null } | null) {
  if (customUser && customUser.username) {
    const avatarUrl = customUser.avatar
      ? `https://cdn.discordapp.com/avatars/${customUser.id}/${customUser.avatar}.png`
      : undefined
    const displayName = customUser.globalName || customUser.username
    const handle = `@${customUser.username}`
    return {
      name: displayName,
      username: customUser.username,
      handle,
      email: handle,
      initials: displayName.slice(0, 2).toUpperCase(),
      avatarUrl,
    }
  }

  return {
    name: "Mavely Operator",
    username: "operator",
    handle: "@operator",
    email: "@operator",
    initials: "MO",
    avatarUrl: undefined,
  }
}

// Fixed to UTC so the line reads the same wherever the page is rendered.
const UPDATED_AT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  hourCycle: "h23",
  timeZone: "UTC",
})

/** How many accounts or communities are active. */
export function lastUpdated(): string {
  return `Synchronized · ${UPDATED_AT.format(new Date())} UTC`
}
