import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ArrowRight,
  BookOpen,
  LogIn,
  LayoutDashboard
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { SearchModal } from '@/components/ui/search-modal';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import FeaturesBlock from '@/components/ui/features-4';
import Faq from '@/components/ui/faq';
import { EmbedShowcase } from '@/components/EmbedShowcase';
import { useAuth } from '@/lib/auth';

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
    <div className="min-h-screen bg-[#0a0b0f] text-white selection:bg-cyan-500/30 selection:text-white flex font-sans relative overflow-x-hidden">
      {/* Clean top edge highlight - crisp and premium */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Far-Left Dock Sidebar */}
      <Sidebar />

      {/* Main Container offset by sidebar */}
      <div className="flex-1 pl-14 sm:pl-16 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-14 bg-[#0a0b0f]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-end px-6 gap-3">
          {/* Add your server link in header */}
          <a
            href="https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-cyan-400 transition-colors font-medium px-2 py-1"
          >
            <span className="text-cyan-400 font-bold">+</span>
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

          {/* Ringtone notification bell */}
          <div className="relative">
            <button
              className="flex size-8 items-center justify-center rounded-md text-white/50 hover:text-white transition-colors outline-none focus:outline-none"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-cyan-400" />
          </div>

          {/* User Auth Section in Header:
              If logged in: show small avatar & username link to dashboard
              If not logged in: show sleek "Login with Discord" CTA button, NO user avatar/icon until logged in! */}
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all"
            >
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
              <span className="text-xs font-medium text-white/80 hidden sm:inline max-w-[100px] truncate">
                {user.globalName || user.username}
              </span>
            </Link>
          ) : (
            <a
              href="/auth/discord/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <LogIn className="size-3.5" />
              <span>Login with Discord</span>
            </a>
          )}
        </header>

        {/* Hero Section: Split layout with headline on left, interactive Skip-Through Embed Showcase on the right */}
        <section className="relative px-6 sm:px-12 py-12 sm:py-20 min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
          {/* 2-Column Split Container */}
          <div className="mx-auto max-w-6xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtext, Buttons, Server Slider */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <img src="/civlink-mark.png" alt="" className="size-3.5 object-contain" />
                <span className="font-semibold tracking-wide uppercase text-[10px]">CivLink Bot Platform</span>
                <span className="text-cyan-400/50">•</span>
                <span className="text-white/80">Built for Roblox ER:LC</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                  CivLink
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
                  href={user ? '/dashboard' : '/auth/discord/login'}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-white text-black font-semibold px-6 py-3 text-sm shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <LayoutDashboard className="size-4 text-black/70" />
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

              {/* Continuous straight-moving horizontal server slider */}
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/[0.1] hover:bg-cyan-500/[0.2] border border-cyan-500/30 rounded-lg px-2.5 py-1 transition-all shadow-sm shadow-cyan-500/10 shrink-0"
                  >
                    <span className="font-bold text-xs">+</span>
                    <span>Add your server</span>
                  </a>

                  {SERVERS.map((server, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white shrink-0 transition-colors select-none px-1"
                    >
                      <img src="/civlink-mark.png" alt="" className="size-3.5 object-contain opacity-80" />
                      <span className="font-medium text-white/80">{server.name}</span>
                    </div>
                  ))}
                </InfiniteSlider>
              </div>
            </div>

            {/* Right Column: Skip-Through Discord Embed Showcase with dynamic ambient blush */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
              <EmbedShowcase />
            </div>
          </div>
        </section>

        {/* Core Bot Systems Feature Block */}
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
              <img src="/civlink-mark.png" alt="CivLink" className="size-4 object-contain" />
              <span className="font-medium text-white/70">CivLink</span>
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
              avatar: '/civlink-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Patrol Sessions & Voice Radios',
              meta: 'Startup/shutdown embeds, scheduled votes, radio VC sync',
              avatar: '/civlink-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Applications & Quizzes',
              meta: 'In-game & Discord moderation quizzes, review channels',
              avatar: '/civlink-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Handbook Directory',
              meta: 'Deploy interactive policy hubs and dropdown menus to Discord',
              avatar: '/civlink-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Staff Actions & Quotas',
              meta: 'Infractions, automated role penalties, promotions, activity',
              avatar: '/civlink-mark.png',
              onClick: () => {
                setSearchOpen(false);
                navigate('/dashboard');
              }
            },
            {
              name: 'Live ER:LC Server Radar',
              meta: 'Real-time player counts, queue status, and join keys via PRC API',
              avatar: '/civlink-mark.png',
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
