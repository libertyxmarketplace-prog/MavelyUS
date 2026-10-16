import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Check, 
  Copy, 
  Key, 
  LogIn, 
  LogOut,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { CivLinkLogo } from './CivLinkLogo';

export function AuthModal({ isOpen, onClose, user, onLogin, onLogout }) {
  const [copiedUrl, setCopiedUrl] = useState('');

  if (!isOpen) return null;

  const clientId = "1552165138017165372";
  const localRedirect = "http://localhost:3000/auth/discord/callback";
  const prodRedirect = "https://civlink.xyz/auth/discord/callback";

  const localAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(localRedirect)}&scope=identify+guilds`;
  const prodAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(prodRedirect)}&scope=identify+guilds`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

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
          maxWidth: '560px',
          background: 'var(--bg-card)',
          borderColor: 'var(--border-medium)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CivLinkLogo size={24} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Discord OAuth2 Authorization</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current User Status */}
        {user ? (
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={user.avatar} 
                alt={user.username} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--civ-blue)' }} 
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  @{user.username}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ID: <span className="font-mono">{user.id || '982741928472918'}</span> • <span style={{ color: '#10b981' }}>Connected</span>
                </div>
              </div>
            </div>

            <button onClick={onLogout} className="btn-danger font-mono" style={{ fontSize: '12px' }}>
              <LogOut size={13} />
              DISCONNECT
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px', background: 'rgba(46, 144, 250, 0.06)', borderRadius: '8px', border: '1px solid var(--civ-blue-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--civ-blue)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Secure Discord Identification</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              CivLink requests only <code className="font-mono" style={{ color: 'var(--civ-blue-light)' }}>identify</code> and <code className="font-mono" style={{ color: 'var(--civ-blue-light)' }}>guilds</code> scopes to verify your staff permissions.
            </p>
          </div>
        )}

        {/* OAuth2 Configuration Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Discord Client ID
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input readOnly value={clientId} className="input-base font-mono" />
              <button onClick={() => copyToClipboard(clientId, 'id')} className="btn-secondary font-mono">
                {copiedUrl === 'id' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Localhost Callback URI (Port 3000)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input readOnly value={localRedirect} className="input-base font-mono" style={{ fontSize: '12px' }} />
              <button onClick={() => copyToClipboard(localRedirect, 'local')} className="btn-secondary font-mono">
                {copiedUrl === 'local' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Production Callback URI (civlink.xyz)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input readOnly value={prodRedirect} className="input-base font-mono" style={{ fontSize: '12px' }} />
              <button onClick={() => copyToClipboard(prodRedirect, 'prod')} className="btn-secondary font-mono">
                {copiedUrl === 'prod' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Login Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <a 
            href={localAuthUrl}
            className="btn-primary font-mono"
            style={{ width: '100%', padding: '12px', fontSize: '13px' }}
          >
            <LogIn size={15} />
            LOGIN VIA LOCALHOST DISCORD OAUTH (PORT 3000)
          </a>

          <a 
            href={prodAuthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary font-mono"
            style={{ width: '100%', padding: '10px', fontSize: '12px', justifyContent: 'center' }}
          >
            <Globe size={14} />
            OPEN PRODUCTION AUTH (CIVLINK.XYZ)
            <ExternalLink size={13} />
          </a>

          {!user && (
            <button 
              onClick={() => {
                onLogin({
                  username: 'sulma',
                  id: '1552165138017165372',
                  avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80',
                  guilds: ['Liberty County State RP']
                });
                onClose();
              }}
              className="btn-secondary font-mono"
              style={{ fontSize: '11px', color: 'var(--text-muted)', borderStyle: 'dashed' }}
            >
              SIMULATE VERIFIED SESSION (OFFLINE PREVIEW)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
