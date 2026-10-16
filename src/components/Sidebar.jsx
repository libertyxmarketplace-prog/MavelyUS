import React, { useState, useRef, useEffect } from 'react';
import { 
  Home,
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Radio,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  FileQuestion
} from 'lucide-react';

export function Sidebar({ 
  currentView = 'home',
  onNavigate,
  activeTab = 'overview',
  setActiveTab,
  onOpenSettings,
  onOpenLegal,
  user,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      active: currentView === 'home',
      onClick: () => onNavigate?.('home')
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      active: currentView === 'dashboard',
      onClick: () => onNavigate?.('dashboard')
    },
    { 
      id: 'docs', 
      label: 'Documentation', 
      icon: BookOpen, 
      active: currentView === 'docs',
      onClick: () => onNavigate?.('docs')
    },
    { 
      id: 'moderation', 
      label: 'Staff & Security', 
      icon: ShieldCheck, 
      active: currentView === 'dashboard' && activeTab === 'commands',
      onClick: () => {
        onNavigate?.('dashboard');
        setActiveTab?.('commands');
      }
    },
    { 
      id: 'telemetry', 
      label: 'Server Telemetry', 
      icon: Radio, 
      active: currentView === 'dashboard' && activeTab === 'builder',
      onClick: () => {
        onNavigate?.('dashboard');
        setActiveTab?.('builder');
      }
    },
    { 
      id: 'records', 
      label: 'Module Catalog', 
      icon: FileText, 
      active: currentView === 'dashboard' && activeTab === 'marketplace',
      onClick: () => {
        onNavigate?.('dashboard');
        setActiveTab?.('marketplace');
      }
    },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-14 sm:w-16 flex flex-col items-center justify-between py-5 border-r border-white/[0.08] bg-[#0b0c10]/95 backdrop-blur-md select-none">
      {/* Top Branding / Logo */}
      <div className="flex flex-col items-center gap-7">
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center justify-center p-0 hover:opacity-80 transition-opacity outline-none focus:outline-none"
          title="Home"
        >
          <img src="/mavely-mark.png" alt="Mavely" className="size-7 object-contain" onError={(e) => {
            // fallback if image not loaded
            e.currentTarget.style.display = 'none';
          }} />
        </button>

        {/* Main Nav Icons */}
        <nav className="flex flex-col items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className={`group relative flex size-8 items-center justify-center rounded-none bg-transparent transition-colors outline-none focus:outline-none focus:ring-0 active:bg-transparent ${
                  item.active ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Icon className="size-[19px]" />
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-md bg-[#141416] border border-white/10 px-2 py-1 text-[11px] font-medium text-white whitespace-nowrap shadow-xl group-hover:block z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Icons & User Popover */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/[0.06] relative" ref={menuRef}>
        {/* Discord Support Link */}
        <a
          href="https://discord.gg/UCqXrvHFqh"
          target="_blank"
          rel="noreferrer"
          title="Discord Community & Support"
          className="flex size-8 items-center justify-center text-white/40 hover:text-white transition-colors outline-none focus:outline-none"
        >
          <MessageSquare className="size-[18px]" />
        </a>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Bot Tokens & Server Config"
          className="flex size-8 items-center justify-center text-white/40 hover:text-white transition-colors outline-none focus:outline-none"
        >
          <Settings className="size-[18px]" />
        </button>

        {/* User Avatar with Clickable Popover Menu (contains Terms of Service and Privacy Policy) */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            title={user ? (user.globalName || user.username) : "User profile & legal"}
            className={`mt-1 flex size-8 items-center justify-center rounded-full overflow-hidden ring-1 transition-all outline-none ${
              userMenuOpen ? 'ring-emerald-400 scale-105' : 'ring-white/20 hover:ring-white/60'
            }`}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="size-full object-cover rounded-full"
              />
            ) : (
              <img
                src="/mavely_avatar.png"
                alt="User"
                className="size-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </button>

          {/* User Popover Menu showing profile, Terms, Privacy Policy & Log Out */}
          {userMenuOpen && (
            <div className="absolute left-12 bottom-0 w-64 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-3 space-y-3 z-50">
              {/* Header User Profile Info */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.06]">
                <img
                  src={user?.avatarUrl || "/mavely_avatar.png"}
                  alt={user?.username || "Guest"}
                  className="size-9 object-cover rounded-full ring-1 ring-white/15"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.displayName || user?.username || 'Guest Administrator'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user ? `@${user.username}` : 'Discord OAuth2'}
                  </p>
                </div>
                <span className="size-2 rounded-full bg-emerald-400" title="System Online" />
              </div>

              {/* Menu Actions including Terms of Service and Privacy Policy */}
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

              {/* Log In / Log Out */}
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
                    <span>Connect Discord</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
