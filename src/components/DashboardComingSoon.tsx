import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Ticket,
  Radio,
  Users,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Home,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  Bot
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar.tsx';
import { useAuth } from '@/lib/auth';

interface DashboardComingSoonProps {
  onUnlockSandbox?: () => void;
}

export function DashboardComingSoon({ onUnlockSandbox }: DashboardComingSoonProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Subtle top edge glow line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Far-Left Dock Sidebar */}
      <Sidebar />

      {/* Main Container offset by sidebar */}
      <div className="flex-1 pl-14 sm:pl-16 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-14 bg-[#0a0b0f]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center p-1">
              <img src="/civlink-mark.png" alt="CivLink" className="size-full object-contain" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">CivLink Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/[0.05] border border-white/10">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                    alt={user.username}
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-cyan-500/20 text-[10px] flex items-center justify-center font-bold text-cyan-300">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-white/80 max-w-[120px] truncate">
                  {user.globalName || user.username}
                </span>
              </div>
            ) : (
              <a
                href="/auth/discord/login"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign In with Discord
              </a>
            )}
          </div>
        </header>

        {/* Hero Arena with dynamic ambient lighting */}
        <main className="flex-1 px-6 sm:px-12 py-12 sm:py-20 flex flex-col items-center justify-center text-center max-w-5xl mx-auto relative">
          {/* Ambient Lighting Backdrop */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
            style={{
              background: 'radial-gradient(ellipse 75% 55% at 50% 40%, rgba(14, 165, 233, 0.14) 0%, rgba(59, 130, 246, 0.04) 50%, transparent 75%)',
              filter: 'blur(35px)'
            }}
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1 text-xs text-sky-300 backdrop-blur-sm mb-6">
            <Clock className="size-3.5 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-semibold tracking-wide uppercase text-[10px]">CivLink v2.0 Platform</span>
            <span className="text-sky-400/50">•</span>
            <span className="text-white/80 font-medium">Under Active Construction</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white max-w-3xl">
            Dashboard{' '}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            We are putting the final touches on your community&apos;s all-in-one ER:LC Discord Bot control panel. Live PRC telemetry, 5-slot ticket routing, staff application scenario quizzes, and tactical radio sync are undergoing closed testing.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://discord.gg/UCqXrvHFqh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-3 text-sm shadow-xl shadow-[#5865F2]/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Join Discord for Early Access</span>
              <ExternalLink className="size-4 text-white/70" />
            </a>

            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-white font-medium px-5 py-3 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <BookOpen className="size-4 text-white/70" />
              <span>Read Documentation</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-white px-4 py-3 text-sm transition-colors"
            >
              <Home className="size-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Module Roadmap Teasers */}
          <div className="mt-14 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c]/80 p-5 space-y-2 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between">
                <Ticket className="size-5 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  95% Ready
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white pt-1">Ticket Engine</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                5 customized category buttons, claim locks, DM receipts, and HTML transcripts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c]/80 p-5 space-y-2 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between">
                <Radio className="size-5 text-sky-400" />
                <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  90% Ready
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white pt-1">ER:LC Radar</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time player counts, queue status, and join keys directly via official PRC API.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c]/80 p-5 space-y-2 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between">
                <Users className="size-5 text-indigo-400" />
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  85% Ready
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white pt-1">Shifts &amp; Radios</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Patrol shift embeds, host attendance tracking, and tactical voice radio frequency sync.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c]/80 p-5 space-y-2 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between">
                <ShieldCheck className="size-5 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  90% Ready
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white pt-1">Staff Recruitment</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                In-game scenario quizzes with anti-AI protection, supervisor approvals, and infractions.
              </p>
            </div>
          </div>

          {/* Optional Developer Sandbox Unlock (Discreet for testers/devs) */}
          {onUnlockSandbox && (
            <div className="mt-10 pt-4 border-t border-white/[0.06] text-center">
              <button
                onClick={onUnlockSandbox}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors font-mono"
              >
                <Sliders className="size-3" />
                <span>Open Developer Configuration Preview</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
