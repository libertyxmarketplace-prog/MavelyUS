import React, { useState } from 'react';
import { 
  Bell, 
  ArrowRight, 
  BookOpen, 
  ExternalLink,
  Shield,
  FileText,
  LogOut,
  LogIn,
  Check,
  Server,
  Zap,
  Activity
} from 'lucide-react';
import { TiltedShowcase } from '../components/TiltedShowcase';
import { KbdInputGroup } from '../components/ui/kbd-input-group';
import { StatsCounter } from '../components/ui/stats-counter';
import { Faq } from '../components/ui/faq';
import { CivLinkIcon } from '../components/CivLinkLogo';

export function HomeView({ onEnterDashboard, onOpenDocs, user, onOpenLegal }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-[#2E90FA]/20 selection:text-white">
      {/* Crisp top edge highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Top Header: Clean right-aligned controls */}
      <header className="sticky top-0 z-40 h-14 bg-[#0a0b0f]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-between px-6 sm:px-10">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5">
          <CivLinkIcon size={22} />
          <span className="text-sm font-bold tracking-tight text-white">CivLink</span>
          <span className="text-zinc-600">/</span>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">ER:LC Bot Builder</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Add Server Link */}
          <a
            href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#2E90FA] transition-colors font-medium px-2 py-1"
          >
            <span className="text-[#2E90FA] font-bold">+</span>
            <span>Add your server</span>
          </a>

          {/* KBD Input Group Search */}
          <div className="w-56 sm:w-64">
            <KbdInputGroup placeholder="Search features, commands..." />
          </div>

          {/* Realistic Notification Bell: Transparent background, subtle status dot */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex size-8 items-center justify-center rounded-md text-zinc-400 hover:text-white transition-colors outline-none focus:outline-none bg-transparent border-0 cursor-pointer"
              title="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-400" />
            </button>

            {/* Notification Popover */}
            {notifOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#12141c] p-3 shadow-2xl z-50 text-left"
                onClick={() => setNotifOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">System Telemetry</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed">
                  Discord OAuth2 active. Ready to deploy ticket panels and link Roblox ER:LC private server API.
                </div>
              </div>
            )}
          </div>

          {/* Top User Icon with Popover containing Terms of Service & Privacy Policy */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex size-8 items-center justify-center rounded-full overflow-hidden ring-1 ring-white/15 hover:ring-white/40 transition-all outline-none bg-transparent"
              title="User menu & legal"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="size-full object-cover" />
              ) : (
                <img src="/mavely_avatar.png" alt="User" className="size-full object-cover" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-3 space-y-3 z-50 text-left">
                {/* User Info */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.06]">
                  <img
                    src={user?.avatarUrl || "/mavely_avatar.png"}
                    alt={user?.username || "Guest"}
                    className="size-9 object-cover rounded-full ring-1 ring-white/15"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.displayName || user?.username || 'Guest Administrator'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {user ? `@${user.username}` : 'Discord OAuth2'}
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
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
                  >
                    <FileText className="size-3.5 text-zinc-400" />
                    <span>Terms of Service</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenLegal?.('privacy');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
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
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="size-3.5" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <a
                      href="/auth/discord/login"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-white text-black font-semibold px-2.5 py-1.5 text-xs hover:bg-zinc-200 transition-colors"
                    >
                      <LogIn className="size-3.5" />
                      <span>Log In with Discord</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2-Column Split Hero Section */}
      <section className="relative px-6 sm:px-12 py-16 sm:py-20 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtext, Action Buttons */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
              <span className="bg-gradient-to-r from-[#2E90FA] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">
                CivLink
              </span>{' '}
              <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                powers your server&apos;s own all-in-one ER:LC bot.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-sans font-normal">
              Not a shared generic bot. Your community runs its own custom bot with custom avatar, branding, and name — preloaded with tickets, patrol sessions, staff applications, and live PRC server status managed from one dashboard.
            </p>

            {/* Action Buttons: Open Dashboard & Documentation */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button 
                onClick={onEnterDashboard} 
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-white text-black font-semibold px-6 py-3 text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="size-4 text-black/70" />
              </button>

              <button 
                onClick={onOpenDocs} 
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-white font-medium px-5 py-3 text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <BookOpen className="size-4 text-zinc-400" />
                <span>Documentation</span>
              </button>
            </div>

            {/* Key feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] font-medium text-zinc-400">
                <Check className="size-3 text-[#2E90FA]" />
                100% Whitelabel Discord Bot
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] font-medium text-zinc-400">
                <Check className="size-3 text-[#2E90FA]" />
                PRC API Telemetry
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] font-medium text-zinc-400">
                <Check className="size-3 text-[#2E90FA]" />
                Automated Shifts & Logs
              </span>
            </div>
          </div>

          {/* Right Column: High-Fidelity Tilted Embed Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <div className="mb-3 text-center">
                <span className="font-sans text-xs tracking-[0.2em] uppercase text-zinc-400 font-semibold">
                  HIGH-FIDELITY EMBED PANELS & DISPATCH MENUS
                </span>
              </div>
              <TiltedShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Row — Transparent Background, Centered */}
      <section className="px-6 sm:px-12 py-10 max-w-6xl mx-auto w-full">
        <div className="w-full px-6 py-8 rounded-2xl border border-white/[0.08] bg-transparent">
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
      <section className="border-t border-white/[0.06] bg-[#07080c]/50">
        <Faq layout="split" type="single" />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div>
          © {new Date().getFullYear()} CivLink. Dedicated Roblox ER:LC community bot runtime.
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onOpenLegal('terms')}
            className="hover:text-zinc-300 transition-colors"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button 
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-zinc-300 transition-colors"
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
            Discord
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomeView;
