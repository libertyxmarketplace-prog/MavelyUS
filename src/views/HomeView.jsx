import React, { useState } from 'react';
import { 
  Bell, 
  ArrowRight, 
  BookOpen, 
  Shield, 
  FileText, 
  LogOut, 
  LogIn, 
  Check, 
  User,
  LayoutDashboard
} from 'lucide-react';
import { TiltedShowcase } from '../components/TiltedShowcase';
import { KbdInputGroup } from '../components/ui/kbd-input-group';
import { StatsCounter } from '../components/ui/stats-counter';
import { Faq } from '../components/ui/faq';

export function HomeView({ onEnterDashboard, onOpenDocs, user, onOpenLegal }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-[#2E90FA]/25 selection:text-white">
      {/* Top subtle highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Top Header: Clean right-aligned controls (No redundant left logo) */}
      <header className="sticky top-0 z-40 h-14 bg-[#08090d]/80 backdrop-blur-md border-b border-white/[0.05] flex items-center justify-end px-6 sm:px-10 gap-3.5">
        {/* Add Server Link */}
        <a
          href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#2E90FA] transition-colors font-medium px-2 py-1"
        >
          <span className="text-[#2E90FA] font-bold text-sm">+</span>
          <span>Add your server</span>
        </a>

        {/* KBD Input Group Search */}
        <div className="w-52 sm:w-64">
          <KbdInputGroup placeholder="Search features, commands..." />
        </div>

        {/* Notification Bell: Transparent background, subtle status dot */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white transition-colors outline-none focus:outline-none bg-transparent border-0 cursor-pointer"
            title="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </button>

          {/* Notification Popover */}
          {notifOpen && (
            <div 
              className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#10131a] p-3.5 shadow-2xl z-50 text-left"
              onClick={() => setNotifOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">System Telemetry</span>
                <span className="text-[10px] text-emerald-400 font-medium">Online</span>
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed">
                Discord OAuth2 ready. Connect your bot token in Settings to begin dispatching live ER:LC embeds.
              </div>
            </div>
          )}
        </div>

        {/* User Icon with Popover containing Terms of Service & Privacy Policy */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex size-8 items-center justify-center rounded-full overflow-hidden ring-1 ring-white/15 hover:ring-[#2E90FA]/60 transition-all outline-none bg-[#121620] cursor-pointer"
            title="User menu & legal"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-zinc-400 hover:text-white">
                <User className="size-4" />
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#10131a] border border-white/10 shadow-2xl p-3.5 space-y-3 z-50 text-left">
              {/* User Info */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.06]">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="size-9 object-cover rounded-full ring-1 ring-white/15"
                  />
                ) : (
                  <div className="size-9 rounded-full bg-[#182030] border border-cyan-500/30 flex items-center justify-center p-1.5">
                    <img src="/civlink-mark.png" alt="CivLink" className="size-full object-contain" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.displayName || user?.username || 'CivLink Network'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user ? `@${user.username}` : 'Not connected'}
                  </p>
                </div>
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>

              {/* Legal Links inside User Popover */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenLegal?.('terms');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                >
                  <FileText className="size-3.5 text-zinc-400" />
                  <span>Terms of Service</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenLegal?.('privacy');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Shield className="size-3.5 text-zinc-400" />
                  <span>Privacy Policy</span>
                </button>
              </div>

              {/* Auth Action */}
              <div className="pt-2 border-t border-white/[0.06]">
                {user ? (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      fetch('/auth/logout', { method: 'POST' }).then(() => window.location.reload());
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <a
                    href="/auth/discord/login"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E90FA] text-white font-semibold px-2.5 py-1.5 text-xs hover:bg-[#1570ef] transition-colors"
                  >
                    <LogIn className="size-3.5" />
                    <span>Log In with Discord</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2-Column Split Hero Section */}
      <section className="relative px-6 sm:px-12 pt-16 pb-12 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Description, Action Buttons */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E90FA]/10 border border-[#2E90FA]/25 text-[#2E90FA] text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-[#2E90FA] animate-pulse" />
              <span>CivLink v1.4.2 • Dedicated ER:LC Workshop</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
              <span className="text-[#2E90FA]">CivLink</span> powers your community&apos;s own ER:LC bot.
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-normal">
              Not a shared generic bot. Your community runs its own custom bot with custom avatar, branding, and name — preloaded with tickets, patrol sessions, staff applications, and live PRC server status managed from one dashboard.
            </p>

            {/* Action Buttons: Open Dashboard & Documentation */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button 
                onClick={onEnterDashboard} 
                className="btn-hero-primary"
              >
                <LayoutDashboard className="size-4" />
                <span>Open Dashboard</span>
                <ArrowRight className="size-4" />
              </button>

              <button 
                onClick={onOpenDocs} 
                className="btn-hero-secondary"
              >
                <BookOpen className="size-4 text-zinc-400" />
                <span>Documentation</span>
              </button>
            </div>

            {/* Feature Checkmarks */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#2E90FA]" />
                100% Whitelabel Bot
              </span>
              <span className="text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#2E90FA]" />
                PRC Telemetry Engine
              </span>
              <span className="text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#2E90FA]" />
                Automated Staff Shifts
              </span>
            </div>
          </div>

          {/* Right Column: High-Fidelity Tilted Embed Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <div className="mb-3 text-center">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">
                  HIGH-FIDELITY EMBED PANELS & DISPATCH MENUS
                </span>
              </div>
              <TiltedShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Row — Transparent Background, Centered with Generous Spacing */}
      <section className="px-6 sm:px-12 my-12 max-w-5xl mx-auto w-full">
        <div className="w-full px-6 py-8 rounded-2xl border border-white/[0.08] bg-white/[0.01]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-white">
                <StatsCounter target={18} suffix="+" />
              </div>
              <div className="text-xs text-zinc-400 font-medium mt-1">Slash Commands</div>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white">
                <StatsCounter target={100} suffix="%" />
              </div>
              <div className="text-xs text-zinc-400 font-medium mt-1">Custom Branding</div>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white">
                <StatsCounter target={30} suffix="s" />
              </div>
              <div className="text-xs text-zinc-400 font-medium mt-1">Telemetry Polling Rate</div>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white">
                <StatsCounter target={24} suffix="/7" />
              </div>
              <div className="text-xs text-zinc-400 font-medium mt-1">Hosted Cloud Runtime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <Faq />

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 mt-auto">
        <div>
          © {new Date().getFullYear()} CivLink. Dedicated Roblox ER:LC community bot runtime.
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onOpenLegal('terms')}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button 
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <a
            href="https://discord.gg/UCqXrvHFqh"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            Discord Support
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomeView;
