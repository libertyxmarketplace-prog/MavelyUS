import {
  Ticket,
  Radio,
  Users,
  Activity,
  FileText,
  ShieldCheck,
  Calendar,
  Disc,
  Gift,
  Cpu
} from 'lucide-react';
import { Marquee } from '@/components/ui/marquee';

// Real bot features & operations data
const botFeatures = [
  {
    name: 'Support Ticket System',
    tag: '@tickets',
    badge: 'Automated',
    body: '5 customizable category slots with category spawn IDs, auto-claiming, ping role alerts, and HTML transcripts.',
    icon: Ticket,
    iconColor: 'text-emerald-400'
  },
  {
    name: 'Patrol Sessions & Shifts',
    tag: '@sessions',
    badge: 'Live Shifts',
    body: 'Automate server startup & shutdown embeds, schedule roleplay votes, and sync in-game radio voice channels.',
    icon: Radio,
    iconColor: 'text-sky-400'
  },
  {
    name: 'Staff Applications',
    tag: '@applications',
    badge: 'Recruitment',
    body: 'Custom moderation quizzes with multi-step interview lineages, automatic review channels, and pass/fail roles.',
    icon: Users,
    iconColor: 'text-violet-400'
  },
  {
    name: 'Live PRC Server Radar',
    tag: '@prc-status',
    badge: 'Real-Time',
    body: 'Direct ER:LC server key integration displaying live players, join codes, server queue, and staff on-duty.',
    icon: Activity,
    iconColor: 'text-emerald-400'
  },
  {
    name: 'Staff Handbook Hub',
    tag: '@handbook',
    badge: 'Documents',
    body: 'Deploy interactive policy guides, role rules, and protocol hubs to Discord with clean select dropdowns.',
    icon: FileText,
    iconColor: 'text-amber-400'
  },
  {
    name: 'Infractions & Actions',
    tag: '@moderation',
    badge: 'Enforcement',
    body: 'Strike logging, automated role removal, demotions, message quotas, and promotion announcement tracking.',
    icon: ShieldCheck,
    iconColor: 'text-rose-400'
  },
  {
    name: 'Leave of Absence (LOA)',
    tag: '@loa-manager',
    badge: 'Staff Tools',
    body: 'Automated leave submissions, temporary staff role stripping during leave, and scheduled return alerts.',
    icon: Calendar,
    iconColor: 'text-indigo-400'
  },
  {
    name: 'Emergency Radio VC',
    tag: '@radio-sync',
    badge: 'Voice Audio',
    body: 'In-game radio frequency binding, tactical voice channel routing, and seamless audio playback.',
    icon: Disc,
    iconColor: 'text-cyan-400'
  },
  {
    name: 'Giveaway Engine',
    tag: '@giveaways',
    badge: 'Community',
    body: 'Weighted role entries, custom timers, anti-cheat detection, automated rolling, and winner DM pings.',
    icon: Gift,
    iconColor: 'text-pink-400'
  },
  {
    name: 'Multi-Tenant Customer Bots',
    tag: '@bot-engine',
    badge: 'Whitelabel',
    body: 'Run your server’s own custom bot token, custom avatar, and custom bot name on the unified Mavely runtime.',
    icon: Cpu,
    iconColor: 'text-[#2ecc71]'
  }
];

function FeatureCard({
  name,
  tag,
  badge,
  body,
  icon: Icon,
  iconColor
}: (typeof botFeatures)[number]) {
  return (
    <div className="w-64 p-4 rounded-xl border border-white/[0.08] bg-[#121316]/95 backdrop-blur-sm group hover:border-white/20 transition-all shadow-lg shadow-black/40">
      <div className="flex items-start gap-3">
        {/* Pure icon without a rectangle box */}
        <Icon className={`size-5 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-[#2ecc71] transition-colors">
            {name}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mt-0.5">
            <span className="font-mono text-zinc-500">{tag}</span>
            <span className="size-1 rounded-full bg-zinc-600 inline-block" />
            <span className="text-[#2ecc71] text-[10px] uppercase tracking-wider font-semibold">{badge}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-normal">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarqueeVertical() {
  const col1 = botFeatures.slice(0, 5);
  const col2 = botFeatures.slice(5);

  return (
    <div className="relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden gap-3">
      {/* Vertical Marquee (downwards) */}
      <Marquee vertical pauseOnHover repeat={3} className="[--duration:36s]">
        {col1.map((item) => (
          <FeatureCard key={item.tag} {...item} />
        ))}
      </Marquee>

      {/* Vertical Marquee (upwards) */}
      <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:36s]">
        {col2.map((item) => (
          <FeatureCard key={item.tag} {...item} />
        ))}
      </Marquee>

      {/* Gradient overlays for vertical marquee */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#09090b] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#09090b] to-transparent z-10" />
    </div>
  );
}
