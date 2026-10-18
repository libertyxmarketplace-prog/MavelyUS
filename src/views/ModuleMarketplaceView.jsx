import React, { useState } from 'react';
import { 
  Boxes, 
  Check, 
  Download, 
  Trash2, 
  RotateCcw, 
  Sliders, 
  Key, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MODULES, COMMANDS } from '../../shared/catalog.js';

export function ModuleMarketplaceView({ botData, onRefresh }) {
  const config = botData?.config || {};
  const modulesState = config.modules || {};
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [configuringModule, setConfiguringModule] = useState(null);
  const [notice, setNotice] = useState('');

  const categories = ['ALL', 'Essentials', 'ER:LC', 'Staff', 'Support', 'Community'];

  const filteredModules = MODULES.filter(m => {
    return selectedCategory === 'ALL' || m.category === selectedCategory;
  });

  const handleModuleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/bot/modules/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        setNotice(`Module ${action} successful.`);
        onRefresh?.();
        setTimeout(() => setNotice(''), 2500);
      } else {
        const err = await res.json();
        setNotice(`Error: ${err.error || 'Failed'}`);
      }
    } catch (e) {
      setNotice(`Error: ${e.message}`);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!configuringModule) return;
    try {
      const updatedModules = {
        ...modulesState,
        [configuringModule.id]: {
          ...modulesState[configuringModule.id],
          settings: configuringModule.settings
        }
      };
      const res = await fetch('/api/bot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ...config, modules: updatedModules } })
      });
      if (res.ok) {
        setNotice(`${configuringModule.name} settings saved.`);
        setConfiguringModule(null);
        onRefresh?.();
        setTimeout(() => setNotice(''), 2500);
      }
    } catch (err) {
      setNotice(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div 
        className="card-shell" 
        style={{ 
          padding: '22px 24px', 
          background: 'linear-gradient(180deg, #10141f 0%, #0d0f17 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-zinc">FEATURE MODULE LIBRARY</span>
            <span className="badge badge-blue">{MODULES.length} MODULES DISCOVERABLE</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
            Install, Configure & Manage Bot Modules
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Modular architecture: activate only what your ER:LC community needs.
          </p>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={selectedCategory === c ? 'badge badge-blue' : 'badge badge-zinc'}
              style={{ cursor: 'pointer', padding: '6px 10px', fontSize: '11px' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div style={{ padding: '10px 14px', background: '#111827', border: '1px solid #1f293d', borderRadius: '6px', fontSize: '12px', color: '#10b981' }}>
          {notice}
        </div>
      )}

      {/* Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredModules.map((m) => {
          const state = modulesState[m.id] || { installed: m.required, enabled: m.required, settings: {} };
          const isInstalled = state.installed;
          const isEnabled = state.enabled;
          const relatedCommands = Object.entries(COMMANDS).filter(([, c]) => c.module === m.id).map(([n]) => `/${n}`);

          return (
            <div 
              key={m.id} 
              className="card-shell" 
              style={{ 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                borderColor: isInstalled && isEnabled ? '#253046' : '#191d29'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{m.name}</h3>
                    {m.tier === 'premium' && <span className="badge badge-amber">PRO</span>}
                    {m.required && <span className="badge badge-zinc">CORE</span>}
                  </div>
                  <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>v{m.version} • {m.category}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {isInstalled ? (
                    <span className={isEnabled ? 'badge badge-emerald' : 'badge badge-zinc'}>
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  ) : (
                    <span className="badge badge-zinc">NOT INSTALLED</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {m.description}
              </p>

              {/* Requirements & Commands list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid #161a25' }}>
                {m.requirements.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Key size={12} />
                    <span>Requires: {m.requirements.join(', ')}</span>
                  </div>
                )}

                {relatedCommands.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Commands: <span className="font-mono" style={{ color: '#94a3b8' }}>{relatedCommands.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                <div>
                  {m.settings && m.settings.length > 0 && isInstalled && (
                    <button
                      onClick={() => setConfiguringModule({ ...m, settings: { ...state.settings } })}
                      className="btn-secondary font-mono"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                    >
                      <Sliders size={12} />
                      SETTINGS
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {isInstalled ? (
                    <>
                      <button
                        onClick={() => handleModuleAction(m.id, 'reset')}
                        className="btn-secondary font-mono"
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                        title="Reset module defaults"
                      >
                        <RotateCcw size={12} />
                      </button>

                      {!m.required && (
                        <button
                          onClick={() => handleModuleAction(m.id, 'uninstall')}
                          className="btn-danger font-mono"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                        >
                          <Trash2 size={12} />
                          UNINSTALL
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleModuleAction(m.id, 'install')}
                      className="btn-primary font-mono"
                      style={{ fontSize: '11px', padding: '5px 12px' }}
                    >
                      <Download size={12} />
                      INSTALL MODULE
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Configuration Modal */}
      {configuringModule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setConfiguringModule(null)}
        >
          <form
            onSubmit={handleSaveSettings}
            className="card-shell"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#10131c',
              borderColor: '#252c3f',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  {configuringModule.name} Configuration
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{configuringModule.summary}</p>
              </div>
              <button type="button" onClick={() => setConfiguringModule(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {configuringModule.settings.map((s) => (
                <div key={s.key}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    {s.label} ({s.type})
                  </label>
                  <input
                    type={s.type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter Discord ${s.type} snowflake ID`}
                    value={configuringModule.settings[s.key] ?? ''}
                    onChange={(e) => setConfiguringModule({
                      ...configuringModule,
                      settings: {
                        ...configuringModule.settings,
                        [s.key]: s.type === 'number' ? Number(e.target.value) : e.target.value
                      }
                    })}
                    className="input-base font-mono"
                    style={{ marginTop: '4px' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setConfiguringModule(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary font-mono">
                SAVE MODULE SETTINGS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
