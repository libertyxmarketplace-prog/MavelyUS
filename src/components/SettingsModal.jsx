import React, { useState, useEffect } from 'react';
import { X, Key, Server, Link, ExternalLink, Save, Check, Trash2, Shield } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, botData, onRefresh }) {
  const [tokenInput, setTokenInput] = useState('');
  const [erlcKeyInput, setErlcKeyInput] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [staffRoleInput, setStaffRoleInput] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/guilds')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGuilds(data);
      })
      .catch(console.error);

    if (botData?.config?.guildId) {
      setSelectedGuild(botData.config.guildId);
    }
    if (botData?.config?.staffRoleIds) {
      setStaffRoleInput(botData.config.staffRoleIds.join(', '));
    }
  }, [isOpen, botData]);

  if (!isOpen) return null;

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/bot/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(`Token error: ${data.error}`);
      } else {
        setNotice('Bot token authenticated and saved.');
        setTokenInput('');
        onRefresh?.();
      }
    } catch (err) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleSaveErlc = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/bot/erlc-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: erlcKeyInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(`ER:LC key error: ${data.error}`);
      } else {
        setNotice(`Connected to ER:LC server: ${data.erlcServerName || 'Saved'}`);
        setErlcKeyInput('');
        onRefresh?.();
      }
    } catch (err) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleSaveServerConfig = async (e) => {
    e.preventDefault();
    try {
      const staffRoleIds = staffRoleInput.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/bot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...botData?.config,
            guildId: selectedGuild,
            staffRoleIds
          }
        })
      });
      if (res.ok) {
        setNotice('Discord server & staff role configuration saved.');
        onRefresh?.();
      }
    } catch (err) {
      setNotice(`Error: ${err.message}`);
    }
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
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
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#10131c',
          borderColor: '#252c3f',
          padding: '26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Bot Integrations & Keys</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Configure your Discord Bot Token and ER:LC Server Key</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {notice && (
          <div style={{ padding: '10px 14px', background: '#121a28', border: '1px solid #1f2d45', borderRadius: '6px', fontSize: '12px', color: '#38bdf8' }}>
            {notice}
          </div>
        )}

        {/* 1. Bot Token Form */}
        <form onSubmit={handleSaveToken} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #1a202e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>DISCORD BOT TOKEN</label>
            {botData?.hasToken && <span className="badge badge-emerald">TOKEN SAVED</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder={botData?.hasToken ? '••••••••••••••••••••••••••••••••' : 'Paste Discord bot token...'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="input-base font-mono"
            />
            <button type="submit" className="btn-primary font-mono" style={{ whiteSpace: 'nowrap' }} disabled={saving}>
              AUTHENTICATE
            </button>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Found in Discord Developer Portal &gt; Applications &gt; Bot &gt; Reset Token.
          </span>
        </form>

        {/* 2. ER:LC Server Key Form */}
        <form onSubmit={handleSaveErlc} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #1a202e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ER:LC PRIVATE SERVER KEY (PRC API)</label>
            {botData?.hasErlcKey && <span className="badge badge-emerald">CONNECTED</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder={botData?.hasErlcKey ? '••••••••••••••••' : 'Paste PRC server key...'}
              value={erlcKeyInput}
              onChange={(e) => setErlcKeyInput(e.target.value)}
              className="input-base font-mono"
            />
            <button type="submit" className="btn-primary font-mono" style={{ whiteSpace: 'nowrap' }} disabled={saving}>
              CONNECT
            </button>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Generates from ER:LC In-Game Server Settings &gt; Remote Server API.
          </span>
        </form>

        {/* 3. Discord Server Selection */}
        <form onSubmit={handleSaveServerConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ACTIVE DISCORD SERVER</label>
            <select
              value={selectedGuild}
              onChange={(e) => setSelectedGuild(e.target.value)}
              className="input-base"
              style={{ marginTop: '4px' }}
            >
              <option value="">Select your server...</option>
              {guilds.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>STAFF ROLE IDS (COMMA SEPARATED)</label>
            <input
              type="text"
              placeholder="e.g. 1182749182749182, 1182749182749183"
              value={staffRoleInput}
              onChange={(e) => setStaffRoleInput(e.target.value)}
              className="input-base font-mono"
              style={{ marginTop: '4px' }}
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Members with these roles can use staff-only commands like /ssu, /warn, /kick, /shift.
            </span>
          </div>

          {/* Bot Invite Link */}
          {botData?.inviteUrl && (
            <div style={{ padding: '12px', background: '#121622', borderRadius: '6px', border: '1px solid #1a2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Bot Invite Link</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Add the bot to your selected Discord server</div>
              </div>
              <a
                href={botData.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary font-mono"
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                INVITE BOT
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button type="submit" className="btn-primary font-mono">
              <Save size={13} />
              SAVE SETTINGS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
