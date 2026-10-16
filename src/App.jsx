import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './views/HomeView';
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
  RotateCw, 
  Settings, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith('/dashboard') ? 'dashboard' : 'home';
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
    // sync browser history state
    const handlePop = () => {
      setCurrentView(window.location.pathname.startsWith('/dashboard') ? 'dashboard' : 'home');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    window.history.pushState({}, '', view === 'dashboard' ? '/dashboard' : '/');
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

  // If user is on the Landing / Home view
  if (currentView === 'home') {
    return (
      <>
        <HomeView 
          onEnterDashboard={() => navigateTo('dashboard')} 
          user={user} 
          onOpenLegal={(tab) => setLegalModal({ isOpen: true, tab })} 
        />
        <LegalModal 
          isOpen={legalModal.isOpen} 
          onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
          tab={legalModal.tab} 
        />
      </>
    );
  }

  // Dashboard View
  const isBotOnline = botData?.runtime?.status === 'online';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08090d', color: '#f8fafc' }}>
      {/* 54px Thin Sidebar Rail (Zero Blue on click, purely neutral active state) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLegal={(tab) => setLegalModal({ isOpen: true, tab })}
        user={user}
        onGoHome={() => navigateTo('home')}
      />

      {/* Main Dashboard Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '56px',
            borderBottom: '1px solid #161a25',
            background: '#0a0c12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          {/* Left: Active Server & Bot Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 10px',
                background: '#121622',
                borderRadius: '5px',
                border: '1px solid #1f2536',
                cursor: 'pointer'
              }}
              title="Change server in Settings"
            >
              <Server size={14} style={{ color: '#2E90FA' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {botData?.config?.guildId ? 'Configured Server' : 'No Server Selected'}
              </span>
              <ChevronDown size={13} style={{ color: '#64748b' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={isBotOnline ? 'badge badge-emerald' : botData?.hasToken ? 'badge badge-zinc' : 'badge badge-rose'}>
                {isBotOnline ? 'BOT ONLINE' : botData?.hasToken ? 'BOT STOPPED' : 'NO BOT TOKEN'}
              </span>
              {botData?.hasErlcKey && (
                <span className="badge badge-blue">PRC API LINKED</span>
              )}
            </div>
          </div>

          {/* Right: User Login & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '4px 8px',
                  background: '#121622',
                  borderRadius: '6px',
                  border: '1px solid #1f2536'
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#252d40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                  @{user.username}
                </span>
              </div>
            ) : (
              <a 
                href="/auth/discord/login" 
                className="btn-primary font-mono" 
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <LogIn size={13} />
                LOGIN WITH DISCORD
              </a>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-secondary font-mono"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              title="Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </header>

        {/* View Router */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
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

        {/* Bottom Minimal Footer */}
        <footer
          style={{
            borderTop: '1px solid #141722',
            padding: '16px 28px',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#090a0f'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CivLinkLogo size={18} showText={true} />
            <span>•</span>
            <span className="font-mono">v1.4.2-enterprise</span>
            <span>•</span>
            <span>Custom ER:LC Bot Runtime Engine</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setLegalModal({ isOpen: true, tab: 'terms' })}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setLegalModal({ isOpen: true, tab: 'privacy' })}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
            >
              Privacy Policy
            </button>
            <span className="font-mono" style={{ color: '#2E90FA' }}>civlink.xyz</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
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
