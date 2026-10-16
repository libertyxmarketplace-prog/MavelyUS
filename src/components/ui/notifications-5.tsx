"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CircleCheck, Info, TriangleAlert, CircleAlert, X } from "lucide-react";

export type NotificationVariant = "success" | "info" | "warning" | "error";

export interface ToastNotification {
  id: number | string;
  variant: NotificationVariant;
  title: string;
  body: string;
}

const config: Record<NotificationVariant, { icon: typeof CircleCheck; accent: string }> = {
  success: { icon: CircleCheck, accent: "text-emerald-400" },
  info: { icon: Info, accent: "text-blue-400" },
  warning: { icon: TriangleAlert, accent: "text-amber-400" },
  error: { icon: CircleAlert, accent: "text-rose-400" },
};

interface NotificationsBlockProps {
  notifications?: ToastNotification[];
  onDismiss?: (id: number | string) => void;
  className?: string;
}

export default function NotificationsBlock({
  notifications,
  onDismiss,
  className = ""
}: NotificationsBlockProps) {
  const [internalToasts, setInternalToasts] = useState<ToastNotification[]>([
    {
      id: 1,
      variant: "success",
      title: "Changes saved",
      body: "Your project settings were updated successfully.",
    },
    {
      id: 2,
      variant: "info",
      title: "New version available",
      body: "Refresh to get the latest features and fixes.",
    },
    {
      id: 3,
      variant: "warning",
      title: "Usage nearing limit",
      body: "You've used 85% of your monthly quota.",
    },
    {
      id: 4,
      variant: "error",
      title: "Payment failed",
      body: "We couldn't process your card. Update it to continue.",
    },
  ]);

  const toasts = notifications !== undefined ? notifications : internalToasts;

  const handleDismiss = (id: number | string) => {
    if (onDismiss) {
      onDismiss(id);
    } else {
      setInternalToasts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col gap-2 pointer-events-none", className)}>
      {toasts.map((toast) => {
        const { icon: Icon, accent } = config[toast.variant] || config.info;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/[0.12] bg-[#10121a]/95 p-3 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-2 duration-200"
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", accent)}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-semibold text-white tracking-tight">{toast.title}</span>
              <span className="text-[11px] text-zinc-300 leading-snug">
                {toast.body}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-zinc-500 transition-colors hover:text-white p-0.5"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { NotificationsBlock };
