import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { CivLinkLogo } from './CivLinkLogo';

export function LegalModal({ isOpen, onClose, tab = 'terms' }) {
  const [activeTab, setActiveTab] = React.useState(tab);

  React.useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
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
          maxHeight: '80vh',
          background: 'var(--bg-card)',
          borderColor: 'var(--border-medium)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '8px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {activeTab === 'terms' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>1. Acceptance of Terms</h4>
              <p>By connecting your Roblox private server or Discord account to CivLink (civlink.xyz), you agree to comply with all applicable community guidelines, Roblox Terms of Use, and Discord Developer Policies.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>2. Server API and Data Ownership</h4>
              <p>CivLink acts solely as an operational bridge between the Roblox ER:LC Remote Server API and the Melonly API. All moderation logs, penal codes, and server data remain the intellectual property of the respective server owner.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>3. Anti-Ghost Auditing & Fair Play</h4>
              <p>Staff efficiency metrics (AER Scores) are algorithmic estimations based on logged server events and do not supersede human management discretion.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>4. Termination</h4>
              <p>You may disconnect CivLink API keys or revoke Discord OAuth2 tokens at any time via your server dashboard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>1. Information Collected</h4>
              <p>We only collect basic Discord identity tokens (username, discriminator, user ID, and server list) to confirm administrative permissions. We do not store passwords or unauthorized financial data.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>2. Use of Melonly and ER:LC Data</h4>
              <p>API keys provided in CivLink settings are utilized strictly to poll public/private server status, active shifts, and command logs requested by your server administrators.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>3. Data Retention and Security</h4>
              <p>Audit records and arrest logs are stored locally in secure browser storage or encrypted database backends. We do not sell user data to third parties.</p>

              <h4 style={{ color: '#ffffff', fontWeight: 700 }}>4. Contact & Compliance</h4>
              <p>For inquiries regarding GDPR compliance or data deletion requests, contact team@civlink.xyz.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary font-mono" style={{ fontSize: '12px' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
