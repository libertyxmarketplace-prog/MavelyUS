import React, { useState } from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { CivLinkLogo } from './CivLinkLogo';

export function LegalModal({ isOpen, onClose, tab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(tab);

  React.useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="card-shell"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          background: '#10131c',
          borderColor: '#242b3d',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CivLinkLogo size={22} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('terms')}
                className={activeTab === 'terms' ? 'badge badge-blue' : 'badge badge-zinc'}
                style={{ cursor: 'pointer', padding: '6px 12px' }}
              >
                TERMS OF SERVICE
              </button>
              <button 
                onClick={() => setActiveTab('privacy')}
                className={activeTab === 'privacy' ? 'badge badge-blue' : 'badge badge-zinc'}
                style={{ cursor: 'pointer', padding: '6px 12px' }}
              >
                PRIVACY POLICY
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '8px', fontSize: '13px', lineHeight: 1.6, color: '#94a3b8' }}>
          {activeTab === 'terms' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>1. Agreement to Terms</h4>
              <p>By connecting your Discord account or hosting a bot instance through CivLink (civlink.xyz), you agree to comply with Discord Developer Terms of Service, Discord Community Guidelines, and Roblox Terms of Use.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>2. Bot Tokens and Authentication</h4>
              <p>You retain full ownership of any Discord bot application tokens and ER:LC server keys you submit. Tokens are stored using AES-256-GCM encryption at rest on your host and are only used to maintain gateway sessions and command registrations.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>3. Acceptable Use</h4>
              <p>You agree not to use CivLink bot infrastructure to engage in mass raiding, automated harassment, malicious webhook spam, or unauthorized server disruption.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>4. Termination</h4>
              <p>You may disconnect your tokens or terminate your bot instance at any time via the CivLink dashboard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>1. Information We Collect</h4>
              <p>When you log in via Discord OAuth2, we receive your basic public Discord profile (User ID, username, and avatar URL) and the list of Discord servers where you hold administrative permissions.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>2. Server Data & Storage</h4>
              <p>Bot configurations, custom embed styles, command permissions, and PRC keys are encrypted on the server instance. We do not sell, rent, or transfer your data or server member records to third parties.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>3. Cookies and Sessions</h4>
              <p>We use an encrypted HTTP-only session cookie solely to maintain your administrative dashboard login.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>4. Contact</h4>
              <p>For questions or data deletion requests, reach out at legal@civlink.xyz.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #1a202e' }}>
          <button onClick={onClose} className="btn-secondary font-mono" style={{ fontSize: '12px' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
