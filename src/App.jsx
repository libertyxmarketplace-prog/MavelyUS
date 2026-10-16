import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './views/HomeView';
import { DocsView } from './views/DocsView';
import { OverviewView } from './views/OverviewView';
import { BotBuilderView } from './views/BotBuilderView';
import { CommandManagerView } from './views/CommandManagerView';
import { ModuleMarketplaceView } from './views/ModuleMarketplaceView';
import { SettingsModal } from './components/SettingsModal';
import { LegalModal } from './components/LegalModal';
import { CivLinkLogo } from './components/CivLinkLogo';
import { 
  Server, 
  LogIn, 
  Settings, 
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const p = window.location.pathname;
    if (p.startsWith('/dashboard')) return 'dashboard';
    if (p.startsWith('/docs')) return 'docs';
    return 'home';
  });
  const [activeTab, setActiveTab] = useState('overview'); // overview, builder, commands, marketplace
  const [user, setUser] = useState(null);
  const [botData, setBotData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, tab: 'terms' });
  const [loading, setLoading] = useState(true);

  // Fetch current user and bot state
  const loadUserAndBot = async () => {
    try {
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const me = await meRes.json();
        setUser(me);
      } else {
        setUser(null);
      }

      const botRes = await fetch('/api/bot');
      if (botRes.ok) {
        const b = await botRes.json();
        setBotData(b);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndBot();
    const handlePop = () => {
      const p = window.location.pathname;
      if (p.startsWith('/dashboard')) setCurrentView('dashboard');
      else if (p.startsWith('/docs')) setCurrentView('docs');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    const path = view === 'dashboard' ? '/dashboard' : view === 'docs' ? '/docs' : '/';
    window.history.pushState({}, '', path);
  };

  const handleSaveConfig = async (newConfig) => {
    const res = await fetch('/api/bot/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: newConfig })
    });
    const data = await res.json();
    if (res.ok) {
      setBotData(data);
    } else {
      throw new Error(data.error || 'Failed to save config');
    }
  };

  const isBotOnline = botData?.runtime?.status === 'online';

  return (
    <div className="flex min-h-screen bg-[#08090d] text-white selection:bg-emerald-500/20 selection:text-white">
      {/* Persistent Left Sidebar Rail across all views */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigateTo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLegal={(tab) => setLegalModal({ isOpen: true, tab })}
        user={user}
      />

      {/* Main Content Area Offset by Left Sidebar */}
      <div className="flex-1 pl-14 sm:pl-16 min-w-0 flex flex-col">
        {/* Landing Home View */}
        {currentView === 'home' && (
          <HomeView
            onEnterDashboard={() => navigateTo('dashboard')}
            onOpenDocs={() => navigateTo('docs')}
            user={user}
            onOpenLegal={(tab) => setLegalModal({ isOpen: true, tab })}
          />
        )}

        {/* Documentation View */}
        {currentView === 'docs' && (
          <DocsView
            onBackHome={() => navigateTo('home')}
            onEnterDashboard={() => navigateTo('dashboard')}
          />
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Dashboard Header */}
            <header className="h-14 border-b border-white/[0.06] bg-[#0a0c12] flex items-center justify-between px-6 sticky top-0 z-30">
              {/* Left: Active Server & Bot Status */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
                  title="Change server in Settings"
                >
                  <Server className="size-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    {botData?.config?.guildId ? 'Configured Server' : 'No Server Selected'}
                  </span>
                  <ChevronDown className="size-3 text-zinc-400" />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isBotOnline 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : botData?.hasToken 
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isBotOnline ? 'BOT ONLINE' : botData?.hasToken ? 'BOT STOPPED' : 'NO BOT TOKEN'}
                  </span>
                  {botData?.hasErlcKey && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      PRC API LINKED
                    </span>
                  )}
                </div>
              </div>

              {/* Right: User Login & Quick Actions */}
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="size-5 rounded-full" />
                    ) : (
                      <div className="size-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white">
                      @{user.username}
                    </span>
                  </div>
                ) : (
                  <a 
                    href="/auth/discord/login" 
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black font-semibold text-xs px-3 py-1.5 hover:bg-zinc-200 transition-all"
                  >
                    <LogIn className="size-3.5" />
                    <span>LOGIN WITH DISCORD</span>
                  </a>
                )}

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Settings"
                >
                  <Settings className="size-3.5" />
                </button>
              </div>
            </header>

            {/* Dashboard View Router */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
              {activeTab === 'overview' && (
                <OverviewView 
                  botData={botData} 
                  onRefresh={loadUserAndBot} 
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'builder' && (
                <BotBuilderView 
                  botData={botData} 
                  onSaveConfig={handleSaveConfig} 
                  onRefresh={loadUserAndBot}
                />
              )}

              {activeTab === 'commands' && (
                <CommandManagerView 
                  botData={botData} 
                  onSaveConfig={handleSaveConfig}
                />
              )}

              {activeTab === 'marketplace' && (
                <ModuleMarketplaceView 
                  botData={botData} 
                  onRefresh={loadUserAndBot}
                />
              )}
            </main>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        botData={botData}
        onRefresh={loadUserAndBot}
      />

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        tab={legalModal.tab}
      />
    </div>
  );
}
