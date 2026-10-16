import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Settings,
  MessageSquare,
  Crown,
  LogOut,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { SiteSettingsModal } from '@/components/ui/site-settings-modal';

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const path = location.pathname;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navItems = [
    { href: '/', label: 'Home', icon: Home, active: path === '/' },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: path.startsWith('/dashboard') },
    { href: '/pricing', label: 'Choose Your Plan', icon: CreditCard, active: path === '/pricing' },
    { href: '/docs', label: 'Documentation', icon: BookOpen, active: path.startsWith('/docs') },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-14 sm:w-16 flex flex-col items-center justify-between py-5 border-r border-white/[0.08] bg-[#0b0c10]/95 backdrop-blur-md select-none">
      {/* Top Branding / Logo */}
      <div className="flex flex-col items-center gap-7">
        <Link to="/" className="flex items-center justify-center p-0 hover:opacity-90 transition-all outline-none focus:outline-none group relative" title="CivLink">
          <div className="relative size-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-transparent p-1 ring-1 ring-cyan-500/30 group-hover:ring-cyan-400/60 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center">
            <img src="/civlink-mark.png" alt="CivLink" className="size-full object-contain" />
          </div>
          <span className="sr-only">CivLink Home</span>
        </Link>

        {/* Main Nav Icons */}
        <nav className="flex flex-col items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                title={item.label}
                className={`relative flex size-8 items-center justify-center rounded-none bg-transparent transition-colors outline-none focus:outline-none focus:ring-0 active:bg-transparent ${
                  item.active ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Icon className="size-[18px]" />
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-md bg-[#141416] border border-white/10 px-2 py-1 text-[11px] font-medium text-white whitespace-nowrap shadow-xl group-hover:block z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/[0.06] relative" ref={menuRef}>
        <a
          href="https://discord.gg/UCqXrvHFqh"
          target="_blank"
          rel="noreferrer"
          title="Discord Support"
          className="flex size-8 items-center justify-center text-white/40 hover:text-white transition-colors outline-none focus:outline-none"
        >
          <MessageSquare className="size-[18px]" />
        </a>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="Website Preferences & Settings"
          className="flex size-8 items-center justify-center text-white/40 hover:text-white transition-colors outline-none focus:outline-none"
        >
          <Settings className="size-[18px]" />
        </button>

        {/* User Avatar with Clickable Popover Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              title={user.globalName || user.username}
              className={`mt-1 flex size-8 items-center justify-center rounded-full overflow-hidden ring-1 transition-all outline-none ${
                userMenuOpen ? 'ring-[#2ecc71] scale-105' : 'ring-white/20 hover:ring-white/60'
              }`}
            >
              {user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                  alt={user.username}
                  className="size-full object-cover rounded-full"
                />
              ) : (
                <div className="size-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.username.slice(0, 2)}
                </div>
              )}
            </button>

            {/* User Popover Menu showing profile & Log Out */}
            {userMenuOpen && (
              <div className="absolute left-12 bottom-0 w-64 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-3 space-y-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                {/* Header User Profile Info */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.06]">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                      alt={user.username}
                      className="size-9 object-cover rounded-full ring-1 ring-white/15"
                    />
                  ) : (
                    <div className="size-9 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.globalName || user.username}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                  <span className="size-2 rounded-full bg-[#2ecc71]" title="Online" />
                </div>

                {/* Quick Menu Actions */}
                <div className="space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <LayoutDashboard className="size-3.5 text-zinc-400" />
                    <span>Server Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <Settings className="size-3.5 text-zinc-400" />
                    <span>Site Preferences</span>
                  </button>
                </div>

                {/* Log Out Action */}
                <div className="pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>

    {/* Site Settings & Preferences Modal */}
    <SiteSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
