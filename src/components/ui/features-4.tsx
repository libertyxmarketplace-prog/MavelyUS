import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Ticket,
  Radio,
  Users,
  Activity,
  BookOpen,
  ShieldAlert,
  Clock,
  Mic,
  Gift,
  Bot
} from "lucide-react";

export interface FeatureItem {
  icon: React.ElementType;
  title: string;
  tag: string;
  badge: string;
  description: string;
  color: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    icon: Radio,
    title: "Patrol Sessions & Shifts",
    tag: "@sessions",
    badge: "Live Shifts",
    description:
      "Automate server startup & shutdown embeds, schedule roleplay votes, and sync in-game radio voice channels.",
    color: "#06b6d4",
  },
  {
    icon: Users,
    title: "Staff Applications",
    tag: "@applications",
    badge: "Recruitment",
    description:
      "Custom moderation quizzes with multi-step interview lineages, automatic review channels, and pass/fail roles.",
    color: "#8b5cf6",
  },
  {
    icon: Activity,
    title: "Live PRC Server Radar",
    tag: "@prc-status",
    badge: "Real-Time",
    description:
      "Direct ER:LC server key integration displaying live players, join codes, server queue, and staff on-duty.",
    color: "#f59e0b",
  },
  {
    icon: BookOpen,
    title: "Staff Handbook Hub",
    tag: "@handbook",
    badge: "Documents",
    description:
      "Deploy interactive policy guides, role rules, and protocol hubs to Discord with clean select dropdowns.",
    color: "#38bdf8",
  },
  {
    icon: Ticket,
    title: "Support Ticket System",
    tag: "@tickets",
    badge: "Automated",
    description:
      "5 customizable category slots with category spawn IDs, auto-claiming, ping role alerts, and HTML transcripts.",
    color: "#3b82f6",
  },
  {
    icon: ShieldAlert,
    title: "Infractions & Actions",
    tag: "@moderation",
    badge: "Enforcement",
    description:
      "Strike logging, automated role removal, demotions, message quotas, and promotion announcement tracking.",
    color: "#ef4444",
  },
  {
    icon: Clock,
    title: "Leave of Absence (LOA)",
    tag: "@loa-manager",
    badge: "Staff Tools",
    description:
      "Automated leave submissions, temporary staff role stripping during leave, and scheduled return alerts.",
    color: "#ec4899",
  },
  {
    icon: Mic,
    title: "Emergency Radio VC",
    tag: "@radio-sync",
    badge: "Voice Audio",
    description:
      "In-game radio frequency binding, tactical voice channel routing, and seamless audio playback.",
    color: "#6366f1",
  },
  {
    icon: Gift,
    title: "Giveaway Engine",
    tag: "@giveaways",
    badge: "Community",
    description:
      "Weighted role entries, custom timers, anti-cheat detection, automated rolling, and winner DM pings.",
    color: "#f97316",
  },
  {
    icon: Bot,
    title: "Multi-Tenant Customer Bots",
    tag: "@bot-engine",
    badge: "Whitelabel",
    description:
      "Run your server’s own custom bot token, custom avatar, and custom bot name on the unified Mavely runtime.",
    color: "#a855f7",
  },
];

const FEATURE_TABS = [
  {
    value: "all",
    label: "All Systems",
    features: ALL_FEATURES,
  },
  {
    value: "operations",
    label: "Operations",
    features: ALL_FEATURES.filter((f) =>
      ["@tickets", "@sessions", "@prc-status", "@radio-sync"].includes(f.tag)
    ),
  },
  {
    value: "moderation",
    label: "Staff & Moderation",
    features: ALL_FEATURES.filter((f) =>
      ["@applications", "@handbook", "@moderation", "@loa-manager"].includes(f.tag)
    ),
  },
  {
    value: "community",
    label: "Community & Whitelabel",
    features: ALL_FEATURES.filter((f) =>
      ["@giveaways", "@bot-engine"].includes(f.tag)
    ),
  },
];

interface FeaturesBlockProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function FeaturesBlock({
  eyebrow = "Core bot systems",
  title = "Everything your ER:LC community needs",
  description = "Mavely brings support tickets, patrol shifts, staff moderation, and live PRC server status together in one dashboard.",
  className,
}: FeaturesBlockProps) {
  return (
    <section className={cn("flex w-full items-center justify-center px-4 sm:px-6 py-12 text-foreground", className)}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-3">
          <Badge variant="secondary" className="gap-1.5 border-white/10 bg-white/[0.04] text-zinc-300 px-3 py-1 text-xs">
            <span className="size-1.5 rounded-full bg-white/60" />
            {eyebrow}
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <Tabs defaultValue="all" className="mt-10 w-full flex flex-col items-center">
          <TabsList className="h-auto flex-wrap gap-1.5 rounded-xl p-1.5 bg-white/[0.03] border border-white/[0.08]">
            {FEATURE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 outline-none data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/10 text-zinc-400 hover:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {FEATURE_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-8 w-full outline-none">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tab.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={feature.title}
                      className="flex flex-col h-full gap-3 p-5 rounded-xl border border-white/[0.08] bg-[#12141c]/90 transition-all duration-150 hover:border-white/25 hover:bg-[#151824] select-none"
                    >
                      {/* Top Bar: Pure Icon + Tag (no badge pills) */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0">
                          <Icon
                            className="size-5 transition-transform duration-150"
                            style={{ color: feature.color }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-zinc-500 font-medium">
                          {feature.tag}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 pt-0.5">
                        <h3 className="font-display text-base font-semibold text-white tracking-tight">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                          {feature.description}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
