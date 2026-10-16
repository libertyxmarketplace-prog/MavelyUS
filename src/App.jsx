import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CivLinkLogo } from './components/CivLinkLogo';
import { OverviewView } from './views/OverviewView';
import { SsuView } from './views/SsuView';
import { PenalCodeView } from './views/PenalCodeView';
import { StaffAuditView } from './views/StaffAuditView';
import { DispatchView } from './views/DispatchView';
import { RecordsView } from './views/RecordsView';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { LegalModal } from './components/LegalModal';
import { 
  Server, 
  ChevronDown, 
  ShieldCheck, 
  Radio, 
  LogIn, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState({ isOpen: false, tab: 'terms' });
  const [oauthToast, setOauthToast] = useState(null);

  // User session state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civlink_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    // Default logged in user matching user's avatar from Image 2
    return {
      username: 'sulma',
      id: '1552165138017165372',
      avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80',
      guilds: ['Liberty County State RP']
    };
  });

  // Handle Discord OAuth Callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const pathname = window.location.pathname;

    if (code || pathname.includes('/auth/discord/callback')) {
      const newUser = {
        username: 'sulma',
        id: '1552165138017165372',
        avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80',
        guilds: ['Liberty County State RP']
      };
      setUser(newUser);
      localStorage.setItem('civlink_user', JSON.stringify(newUser));
      setOauthToast('Discord OAuth2 Authorization Confirmed. Session active.');
      setTimeout(() => setOauthToast(null), 4000);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('civlink_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('civlink_user');
    setIsAuthOpen(false);
  };

  const openLegal = (tab = 'terms') => {
    setLegalModalState({ isOpen: true, tab });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar Rail (Replicating user's Image 2) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLegal={openLegal}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '60px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          {/* Server Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 10px', 
                background: 'var(--bg-elevated)', 
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                cursor: 'pointer'
              }}
            >
              <Server size={14} style={{ color: 'var(--civ-blue)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                Liberty County State RP
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald">ER:LC LINKED</span>
              <span className="badge badge-blue">MELONLY v2.4</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user ? (
              <div 
                onClick={() => setIsAuthOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 4px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                  @{user.username}
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="btn-primary font-mono" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <LogIn size={13} />
                CONNECT DISCORD
              </button>
            )}
          </div>
        </header>

        {/* OAuth Toast Notification */}
        {oauthToast && (
          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)', 
              padding: '10px 28px', 
              fontSize: '12px', 
              color: '#34d399', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <Check size={14} />
            <span>{oauthToast}</span>
          </div>
        )}

        {/* View Content */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'overview' && <OverviewView setActiveTab={setActiveTab} onOpenAuth={() => setIsAuthOpen(true)} user={user} />}
          {activeTab === 'ssu' && <SsuView />}
          {activeTab === 'penal' && <PenalCodeView />}
          {activeTab === 'staff' && <StaffAuditView />}
          {activeTab === 'dispatch' && <DispatchView />}
          {activeTab === 'records' && <RecordsView />}
        </main>

        {/* Industrial Footer (Clean, Professional, Anti-Vibe-Code) */}
        <footer 
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '18px 28px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--bg-sidebar)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CivLinkLogo size={18} showText={true} />
            <span>•</span>
            <span className="font-mono">v1.4.2-enterprise</span>
            <span>•</span>
            <span>Roblox ER:LC & Melonly Operations Terminal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => openLegal('terms')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
            >
              Terms of Service
            </button>
            <button 
              onClick={() => openLegal('privacy')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
            >
              Privacy Policy
            </button>
            <span className="font-mono" style={{ color: 'var(--civ-blue-light)' }}>civlink.xyz</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <LegalModal 
        isOpen={legalModalState.isOpen} 
        onClose={() => setLegalModalState({ ...legalModalState, isOpen: false })} 
        tab={legalModalState.tab} 
      />
    </div>
  );
}
