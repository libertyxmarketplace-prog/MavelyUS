import React, { useState } from 'react';
import { X, Save, Check, Key, Server, Webhook, RefreshCw } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }) {
  const [erlcKey, setErlcKey] = useState('PRC-LIVE-9048-A8F1');
  const [melonlyKey, setMelonlyKey] = useState('MLN-SEC-8492049182');
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/123456789/xyz');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
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
          maxWidth: '520px',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Server & API Integrations</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Configure connections to Melonly and ER:LC Remote APIs</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ER:LC Server Remote API Key
            </label>
            <input 
              type="password" 
              value={erlcKey} 
              onChange={(e) => setErlcKey(e.target.value)} 
              className="input-base font-mono"
              style={{ marginTop: '4px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enables live player counts, kill logs, and command triggers.</span>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Melonly API Token
            </label>
            <input 
              type="password" 
              value={melonlyKey} 
              onChange={(e) => setMelonlyKey(e.target.value)} 
              className="input-base font-mono"
              style={{ marginTop: '4px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connects shift durations and moderation history for anti-ghost audits.</span>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Discord Dispatch / SSU Webhook
            </label>
            <input 
              type="text" 
              value={webhookUrl} 
              onChange={(e) => setWebhookUrl(e.target.value)} 
              className="input-base font-mono"
              style={{ marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary font-mono">
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'CONFIG SAVED' : 'SAVE INTEGRATIONS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
