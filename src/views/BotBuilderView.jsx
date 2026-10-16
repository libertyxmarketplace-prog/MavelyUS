import React, { useState } from 'react';
import { 
  Bot, 
  Palette, 
  Sparkles, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Eye,
  Sliders,
  MessageSquare
} from 'lucide-react';
import { DiscordEmbedPreview } from '../components/DiscordEmbedPreview';
import { MODULES, PRESENCE_TYPES, DEFAULT_STYLE } from '../../shared/catalog.js';

export function BotBuilderView({ botData, onSaveConfig, onRefresh }) {
  const config = botData?.config || {};
  const [presence, setPresence] = useState(config.presence || { status: 'online', activityType: 'Watching', activityText: 'ER:LC' });
  const [style, setStyle] = useState(config.style || { ...DEFAULT_STYLE });
  const [welcome, setWelcome] = useState(config.welcome || { enabled: false, channelId: '', title: 'Welcome to {server}', description: 'Hey {user}, welcome! Member #{memberCount}', image: '' });
  const [goodbye, setGoodbye] = useState(config.goodbye || { enabled: false, channelId: '', title: '', description: '**{username}** has departed.', image: '' });
  const [savedNotice, setSavedNotice] = useState('');
  const [previewTab, setPreviewTab] = useState('embed'); // 'embed' or 'welcome'

  const handleSave = async () => {
    try {
      const updatedConfig = {
        ...config,
        presence,
        style,
        welcome,
        goodbye
      };
      await onSaveConfig(updatedConfig);
      setSavedNotice('Bot configuration saved and synced to runtime.');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (e) {
      setSavedNotice(`Error saving: ${e.message}`);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/bot/export';
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const res = await fetch('/api/bot/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          setSavedNotice('Configuration imported successfully.');
          onRefresh?.();
        }
      } catch (err) {
        setSavedNotice(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const colorPresets = ['#2E90FA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '24px', alignItems: 'start' }}>
      {/* Left Column: Configuration Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header & Quick Sync */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Bot Customization Workshop</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Configure presence, custom embed appearance, and welcome broadcasts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExport} className="btn-secondary font-mono" style={{ fontSize: '11px', padding: '6px 10px' }} title="Export JSON config">
              <Download size={13} />
              EXPORT
            </button>
            <label className="btn-secondary font-mono" style={{ fontSize: '11px', padding: '6px 10px', cursor: 'pointer' }} title="Import JSON config">
              <Upload size={13} />
              IMPORT
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button onClick={handleSave} className="btn-primary font-mono" style={{ fontSize: '12px' }}>
              <Save size={13} />
              SAVE
            </button>
          </div>
        </div>

        {savedNotice && (
          <div style={{ padding: '10px 14px', background: '#111827', border: '1px solid #1f293d', borderRadius: '6px', fontSize: '12px', color: '#10b981' }}>
            {savedNotice}
          </div>
        )}

        {/* 1. Bot Presence & Status */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={16} style={{ color: '#2E90FA' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Presence & Activity Status</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>GATEWAY STATUS</label>
              <select
                value={presence.status}
                onChange={(e) => setPresence({ ...presence, status: e.target.value })}
                className="input-base"
                style={{ marginTop: '4px' }}
              >
                <option value="online">Online (Green Dot)</option>
                <option value="idle">Idle (Amber Crescent)</option>
                <option value="dnd">Do Not Disturb (Red Minus)</option>
                <option value="invisible">Invisible / Offline</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ACTIVITY TYPE</label>
              <select
                value={presence.activityType}
                onChange={(e) => setPresence({ ...presence, activityType: e.target.value })}
                className="input-base"
                style={{ marginTop: '4px' }}
              >
                {PRESENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ACTIVITY STATUS TEXT</label>
            <input
              type="text"
              placeholder="e.g. Liberty County PRC • /help"
              value={presence.activityText}
              onChange={(e) => setPresence({ ...presence, activityText: e.target.value })}
              className="input-base"
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>

        {/* 2. Default Embed Colors & Branding */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} style={{ color: '#2E90FA' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Discord Embed Visual Theme</h3>
          </div>

          {/* Color Presets */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>SIGNATURE ACCENT COLOR</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="color"
                value={style.color || '#2E90FA'}
                onChange={(e) => setStyle({ ...style, color: e.target.value })}
                style={{ width: '38px', height: '36px', borderRadius: '4px', border: '1px solid #283042', background: '#0e1117', cursor: 'pointer', padding: '2px' }}
              />
              <input
                type="text"
                value={style.color || '#2E90FA'}
                onChange={(e) => setStyle({ ...style, color: e.target.value })}
                className="input-base font-mono"
                style={{ width: '120px' }}
              />
              <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                {colorPresets.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStyle({ ...style, color: c })}
                    style={{ width: '22px', height: '22px', borderRadius: '4px', background: c, border: style.color === c ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.4)', cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>GLOBAL FOOTER TEXT</label>
              <input
                type="text"
                placeholder="e.g. Liberty County State RP"
                value={style.footerText}
                onChange={(e) => setStyle({ ...style, footerText: e.target.value })}
                className="input-base"
                style={{ marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>INCLUDE TIMESTAMP</label>
              <select
                value={style.timestamp ? 'true' : 'false'}
                onChange={(e) => setStyle({ ...style, timestamp: e.target.value === 'true' })}
                className="input-base"
                style={{ marginTop: '4px' }}
              >
                <option value="true">Yes (Enabled)</option>
                <option value="false">No (Disabled)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Welcome & Goodbye Messages */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: '#2E90FA' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Welcome Broadcast</h3>
            </div>
            <button
              onClick={() => setWelcome({ ...welcome, enabled: !welcome.enabled })}
              className={welcome.enabled ? 'badge badge-emerald' : 'badge badge-zinc'}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {welcome.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {welcome.enabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>WELCOME EMBED TITLE</label>
                <input
                  type="text"
                  value={welcome.title}
                  onChange={(e) => setWelcome({ ...welcome, title: e.target.value })}
                  className="input-base"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>WELCOME DESCRIPTION (VARIABLES: {'{user}'}, {'{server}'}, {'{memberCount}'})</label>
                <textarea
                  rows={2}
                  value={welcome.description}
                  onChange={(e) => setWelcome({ ...welcome, description: e.target.value })}
                  className="input-base"
                  style={{ marginTop: '4px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>BANNER IMAGE URL (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="https://i.imgur.com/your-banner.png"
                  value={welcome.image}
                  onChange={(e) => setWelcome({ ...welcome, image: e.target.value })}
                  className="input-base font-mono"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Diskhook-Style Embed Simulator */}
      <div style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Live Diskhook Embed Preview</h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Instant visual feedback before saving changes</p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPreviewTab('embed')}
                className={previewTab === 'embed' ? 'badge badge-zinc' : 'badge'}
                style={{ background: previewTab === 'embed' ? '#22293b' : 'transparent', cursor: 'pointer', border: '1px solid #2d364f', color: previewTab === 'embed' ? '#ffffff' : '#64748b' }}
              >
                COMMAND PREVIEW
              </button>
              <button
                onClick={() => setPreviewTab('welcome')}
                className={previewTab === 'welcome' ? 'badge badge-zinc' : 'badge'}
                style={{ background: previewTab === 'welcome' ? '#22293b' : 'transparent', cursor: 'pointer', border: '1px solid #2d364f', color: previewTab === 'welcome' ? '#ffffff' : '#64748b' }}
              >
                WELCOME PREVIEW
              </button>
            </div>
          </div>

          {/* Render Preview */}
          {previewTab === 'embed' ? (
            <DiscordEmbedPreview
              botUser={botData?.user || { username: 'Liberty Bot', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png' }}
              style={style}
              title="Liberty County State RP"
              description="**28/35** players on patrol, **2** in queue.
Join Code: **liberty-702**

• Police & Sheriff: **FULL PATROL**
• Fire & Rescue: **AVAILABLE**"
              footerText={style.footerText || 'CivLink ER:LC Realtime Engine'}
              timestamp={style.timestamp}
            />
          ) : (
            <DiscordEmbedPreview
              botUser={botData?.user || { username: 'Liberty Bot', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png' }}
              style={style}
              title={welcome.title}
              description={welcome.description}
              vars={{ user: '@NewCadet_44', server: 'Liberty County State RP', memberCount: '1,420' }}
              image={welcome.image}
              footerText={style.footerText}
              timestamp={style.timestamp}
            />
          )}

          <div style={{ padding: '12px', background: '#0e1119', borderRadius: '6px', border: '1px solid #1a202e', fontSize: '12px', color: '#94a3b8' }}>
            💡 <strong style={{ color: '#ffffff' }}>Diskhook Engine:</strong> Changes made to colors, text, and timestamps reflect automatically in your live Discord slash command responses.
          </div>
        </div>
      </div>
    </div>
  );
}
