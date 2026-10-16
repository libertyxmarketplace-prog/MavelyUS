import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { SearchModal } from '@/components/ui/search-modal';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import FeaturesBlock from '@/components/ui/features-4';
import Faq from '@/components/ui/faq';
import { useAuth } from '@/lib/auth';

const OAUTH_URL =
  'https://discord.com/oauth2/authorize?client_id=1552165138017165372&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds';

const SERVERS = [
  { name: 'Pacific Coast Emergency', members: '14.2k members' },
  { name: 'River City RP', members: '9.8k members' },
  { name: 'LC State Patrol', members: '18.5k members' },
  { name: 'Metro Police Network', members: '11.3k members' },
  { name: 'Blaine County Services', members: '7.6k members' },
  { name: 'San Andreas First Response', members: '16.1k members' },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white selection:bg-brand/30 selection:text-white flex font-sans relative overflow-x-hidden">
      {/* Clean top edge highlight - crisp and premium */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Far-Left Dock Sidebar */}
      <Sidebar />

      {/* Main Container offset by sidebar */}
      <div className="flex-1 pl-14 sm:pl-16 flex flex-col min-w-0 relative z-10">
        {/* Top Header: Clean, search trigger + ringtone bell */}
        <header className="sticky top-0 z-40 h-14 bg-[#0a0b0f]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-end px-6 gap-3">
          {/* Add your server link in header */}
          <a
            href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-[#2ecc71] transition-colors font-medium px-2 py-1"
          >
            <span className="text-[#2ecc71] font-bold">+</span>
            <span>Add your server</span>
          </a>

          {/* Search Trigger (⌘K) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all outline-none"
            title="Search (⌘K)"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search features, tickets, commands...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-mono text-white/50">
              ⌘K
            </kbd>
          </button>

          {/* Ringtone notification bell on the far right */}
          <div className="relative">
            <button
              className="flex size-8 items-center justify-center rounded-md text-white/50 hover:text-white transition-colors outline-none focus:outline-none"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand" />
          </div>
        </header>

        {/* Hero Section: Split layout with headline on left, tilted Mavely Card on the right */}
        <section className="relative px-6 sm:px-12 py-16 sm:py-24 min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
          {/* 2-Column Split Container */}
          <div className="mx-auto max-w-6xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtext, Buttons, Server Slider */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
                <span className="bg-gradient-to-r from-[#2ecc71] via-[#46e89f] to-[#11998e] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(46,204,113,0.35)]">
                  Mavely
                </span>{' '}
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  powers your server&apos;s own all-in-one ER:LC bot.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed font-sans font-normal">
                Not a shared generic bot. Your community runs its own custom bot with custom avatar, branding, and name — preloaded with tickets, patrol sessions, staff applications, and live PRC server status managed from one dashboard.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={user ? '/dashboard' : OAUTH_URL}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-white text-black font-semibold px-6 py-3 text-sm shadow-xl shadow-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="size-4 text-black/70" />
                </a>

                <Link
                  to="/docs"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-white font-medium px-5 py-3 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <BookOpen className="size-4 text-white/70" />
                  <span>Documentation</span>
                </Link>
              </div>

              {/* Continuous straight-moving horizontal server slider: Transparent background, clean fade edges without side boxes */}
              <div
                className="relative h-10 w-full max-w-lg overflow-hidden flex items-center select-none pt-1"
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 85%, transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 10%, black 85%, transparent)',
                }}
              >
                <InfiniteSlider
                  className="flex h-full w-full items-center"
                  duration={24}
                  gap={18}
                >
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2ecc71] hover:text-[#38ef7d] bg-[#2ecc71]/[0.1] hover:bg-[#2ecc71]/[0.2] border border-[#2ecc71]/30 rounded-lg px-2.5 py-1 transition-all shadow-sm shadow-[#2ecc71]/10 shrink-0"
                  >
                    <span className="font-bold text-xs">+</span>
                    <span>Add your server</span>
                  </a>

                  {SERVERS.map((server, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white shrink-0 transition-colors select-none px-1"
                    >
                      <img src="/mavely-mark.png" alt="" className="size-3.5 object-contain opacity-80" />
                      <span className="font-medium text-white/80">{server.name}</span>
                    </div>
                  ))}
                </InfiniteSlider>
              </div>
            </div>

            {/* Right Column: Mavely Discord Profile Card on the right side, tilted slightly */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div
                className="w-full max-w-[340px] rounded-[22px] bg-[#1e1f22] border border-white/[0.08] shadow-2xl overflow-hidden text-white transition-all duration-300 hover:scale-[1.02] text-left hover:rotate-0"
                style={{
                  transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg) rotate(-2deg)'
                }}
              >
                {/* Banner (Mint green top banner) */}
                <div className="h-20 bg-[#2bb377] relative flex items-start justify-end p-2.5">
                  <button className="flex size-7 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
                    <span className="text-xs font-bold leading-none tracking-widest pb-1">···</span>
                  </button>
                </div>

                {/* Body with overlapping enlarged avatar */}
                <div className="px-4 pb-5 pt-0 relative space-y-3.5">
                  {/* Enlarged Avatar */}
                  <div className="-mt-14 relative inline-block">
                    <div className="size-[98px] rounded-full bg-[#1e1f22] p-1.5">
                      <div className="size-full rounded-full bg-[#232428] flex items-center justify-center p-3">
                        <img
                          src="/mavely-mark.png"
                          alt="Mavely"
                          className="size-full object-contain"
                        />
                      </div>
                    </div>
                    {/* Discord Online Status Badge */}
                    <div className="absolute bottom-1.5 right-1.5 size-6 rounded-full bg-[#1e1f22] flex items-center justify-center">
                      <span className="size-4 rounded-full bg-[#23a55a] ring-2 ring-[#1e1f22]" title="Online" />
                    </div>
                  </div>

                  {/* Name & Handle */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg font-bold text-white tracking-tight">Mavely</h2>
                      <span className="rounded bg-[#5865F2] px-1 py-0.2 text-[10px] font-bold uppercase tracking-wider text-white">
                        APP
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-medium">Mavely#3200</p>
                  </div>

                  {/* Mutual Servers */}
                  <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                    <span className="text-[11px] text-white/40">bot</span>
                    <img src="/mavely-mark.png" alt="" className="size-3.5 object-contain" />
                    <span>3 Mutual Servers</span>
                  </div>

                  {/* Add App Button */}
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-md bg-[#383a40] hover:bg-[#474a52] py-2 text-xs font-semibold text-white transition-colors"
                  >
                    <span>+</span>
                    <span>Add App</span>
                  </a>

                  {/* Bio */}
                  <div className="border-l-2 border-white/20 pl-2.5 py-0.5 text-xs text-white/80 space-y-0.5 leading-snug">
                    <p className="font-semibold text-white">Your server&apos;s own dedicated bot.</p>
                    <p className="text-white/60">Fully loaded with tickets, shifts &amp; moderation.</p>
                  </div>

                  <div className="text-[11px] text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                    View Full Bio
                  </div>

                  {/* Roles Badges: Mavely Network */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">Roles</span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2b2d31] px-2 py-0.5 text-white/80">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        Mavely Network
                        <span className="text-[9px] text-white/40 hover:text-white cursor-pointer ml-0.5">✕</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2b2d31] px-2 py-0.5 text-white/80">
                        <span className="size-2 rounded-full bg-slate-300" />
                        Developer
                        <span className="text-[9px] text-white/40 hover:text-white cursor-pointer ml-0.5">✕</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2b2d31] px-2 py-0.5 text-white/80">
                        <span className="size-2 rounded-full bg-slate-300" />
                        Mavely
                      </span>
                    </div>
                  </div>

                  {/* Mock Chat Input */}
                  <div className="pt-2">
                    <div className="rounded-lg bg-[#383a40]/60 border border-white/5 px-3 py-2 text-xs text-white/30 flex items-center justify-between">
                      <span>Message @Mavely</span>
                      <span className="text-sm">😊</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Restored Core Bot Systems Feature Block */}
        <section id="features" className="py-20 sm:py-28 bg-[#0d0f16] border-t border-white/[0.06] relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 relative z-10">
            <FeaturesBlock />
          </div>
        </section>

        {/* Frequently Asked Questions Section */}
        <Faq />

        {/* Footer */}
        <footer className="mt-auto py-8 border-t border-white/[0.06] bg-[#090a0f] text-xs text-white/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/mavely-mark.png" alt="Mavely" className="size-4 object-contain" />
              <span className="font-medium text-white/70">Mavely</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="https://discord.gg/UCqXrvHFqh" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Discord Server</a>
            </div>
          </div>
        </footer>

        {/* Search Modal Component (⌘K / Ctrl+K) */}
        <SearchModal
          modal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          placeholder="Search bot modules, tickets, commands..."
          results={[
            {
              name: 'Support Ticket System',
              meta: '5 category slots, claim locks, ping roles, HTML transcripts',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Patrol Sessions & Voice Radios',
              meta: 'Startup/shutdown embeds, scheduled votes, radio VC sync',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Applications & Quizzes',
              meta: 'In-game & Discord moderation quizzes, review channels',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Handbook Directory',
              meta: 'Deploy interactive policy hubs and dropdown menus to Discord',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Actions & Quotas',
              meta: 'Infractions, automated role penalties, promotions, activity',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Live ER:LC Server Radar',
              meta: 'Real-time player counts, queue status, and join keys via PRC API',
              avatar: '/mavely-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            }
          ]}
        />
      </div>
    </div>
  );
}
