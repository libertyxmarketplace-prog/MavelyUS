import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export interface EmbedSlide {
  id: string;
  name: string;
  tabLabel: string;
  badge: string;
  image: string;
  accent: string;
  blush: string;
  glow: string;
  tagline: string;
  features: string[];
}

export const EMBED_SLIDES: EmbedSlide[] = [
  {
    id: 'orlando-support',
    name: 'Orlando Support',
    tabLabel: 'Support Ticket',
    badge: 'Ticket System',
    image: '/embeds/orlando-support.png',
    accent: '#0284c7', // Sky / Cyan
    blush: 'from-sky-500/40 via-cyan-500/25 to-blue-600/35',
    glow: 'rgba(2, 132, 199, 0.4)',
    tagline: 'Interactive Ticket Category Buttons & Modal Routing',
    features: ['Rules modal trigger', 'General & Management channels', 'Instant Discord button deployment']
  },
  {
    id: 'alabama-assistance',
    name: 'Assistance Support',
    tabLabel: 'Help Desk',
    badge: 'Operational Desk',
    image: '/embeds/alabama-assistance.png',
    accent: '#f97316', // Orange Flame
    blush: 'from-orange-500/40 via-amber-500/25 to-rose-600/35',
    glow: 'rgba(249, 115, 22, 0.4)',
    tagline: 'Dynamic Live Select Menu & Operational Telemetry',
    features: ['Operational Online status', 'Multi-department select menu', 'Desk availability toggle']
  },
  {
    id: 'staff-applications',
    name: 'Staff Applications',
    tabLabel: 'Applications',
    badge: 'Recruitment Hub',
    image: '/embeds/staff-applications.png',
    accent: '#ef4444', // Red Flame
    blush: 'from-rose-500/40 via-red-500/25 to-amber-600/35',
    glow: 'rgba(239, 68, 68, 0.4)',
    tagline: 'Position Recruitment with Anti-AI Safeguards',
    features: ['In-Game Staff position selection', 'DM application dispatch', 'Automated review routing']
  },
  {
    id: 'promotion-notice',
    name: 'Promotion Notice',
    tabLabel: 'Promotions',
    badge: 'Staff Logs',
    image: '/embeds/promotion-notice.png',
    accent: '#eab308', // Gold / Amber
    blush: 'from-amber-500/40 via-yellow-500/25 to-orange-600/35',
    glow: 'rgba(234, 179, 8, 0.4)',
    tagline: 'Advancement Notices & Verified Commendation Logging',
    features: ['Rank change announcement', 'Supervisor signoff metadata', 'Audit log verification']
  }
];

export function EmbedShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const active = EMBED_SLIDES[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % EMBED_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + EMBED_SLIDES.length) % EMBED_SLIDES.length);
  };

  // Auto-advance every 5.5s unless hovered
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="relative w-full max-w-[460px] mx-auto select-none group/container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── DYNAMIC "BLUSH" AMBIENT BACKDROP ─── */}
      {/* Multi-layered radiant mesh glow that softly "blushes" the website background */}
      <div
        className={`pointer-events-none absolute -inset-6 sm:-inset-12 rounded-[40px] bg-gradient-to-tr ${active.blush} blur-[70px] sm:blur-[100px] opacity-75 sm:opacity-85 transition-all duration-700 -z-10`}
      />
      <div
        className="pointer-events-none absolute -inset-1 sm:-inset-2 rounded-3xl bg-cyan-500/10 blur-xl opacity-60 transition-opacity duration-500 -z-10"
        style={{
          boxShadow: `0 0 60px 10px ${active.glow}`
        }}
      />

      {/* Main Container Card with 2.5D tilt & glass effect */}
      <div
        className="relative rounded-2xl sm:rounded-3xl bg-[#14161f]/95 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 hover:border-white/25 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        style={{
          transform: 'perspective(1100px) rotateY(-3.5deg) rotateX(1.5deg) translateZ(0)',
          transformOrigin: 'center center'
        }}
      >
        {/* Top Header Bar: Tabs & Skip Controls */}
        <div className="px-3.5 py-3 border-b border-white/[0.08] bg-[#0f1118]/90 flex items-center justify-between gap-2">
          {/* Engine Badge & Counter */}
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              CivLink Live Embeds
            </span>
          </div>

          {/* Quick Skip Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-medium text-white/40 mr-1">
              {currentIndex + 1} / {EMBED_SLIDES.length}
            </span>
            <button
              onClick={handlePrev}
              title="Previous Embed"
              className="size-6 rounded-md bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all outline-none"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={handleNext}
              title="Next Embed"
              className="size-6 rounded-md bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all outline-none"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Category Pill Selectors: Skip Directly */}
        <div className="px-3 py-2 bg-[#0c0e14] border-b border-white/[0.05] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {EMBED_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md shadow-white/10 scale-[1.02]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {isActive && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: slide.accent }}
                  />
                )}
                <span>{slide.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Screenshot Viewport */}
        <div className="relative bg-[#1e1f22] p-2.5 sm:p-3 overflow-hidden group/screen">
          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-inner bg-[#2b2d31]">
            <img
              src={active.image}
              alt={active.name}
              className="w-full h-auto object-cover block transition-transform duration-300 group-hover/screen:scale-[1.01]"
              loading="eager"
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/screen:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
              <span className="text-[11px] font-medium text-white/90 drop-shadow">
                {active.tagline}
              </span>
              <span className="text-[10px] bg-black/60 backdrop-blur-sm border border-white/20 text-white/90 px-2 py-0.5 rounded-full">
                Interactive Bot Output
              </span>
            </div>
          </div>

          {/* Floating Left/Right Skip Paddles */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/container:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-sm hover:scale-110 active:scale-95"
            title="Previous Embed"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/container:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-sm hover:scale-110 active:scale-95"
            title="Next Embed"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Footer Meta & Features */}
        <div className="p-3.5 bg-[#10121a] border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: active.accent }}
              />
              <span className="text-xs font-semibold text-white tracking-tight">
                {active.name}
              </span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">
                • {active.badge}
              </span>
            </div>

            {/* Clickable Dots Indicator */}
            <div className="flex items-center gap-1.5">
              {EMBED_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  title={`Go to ${EMBED_SLIDES[idx].name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-5 bg-white'
                      : 'w-1.5 bg-white/25 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quick bullet points of capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-400">
            {active.features.slice(0, 2).map((feat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-cyan-400 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
