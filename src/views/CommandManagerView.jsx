import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  Filter, 
  Clock, 
  Shield, 
  Check, 
  Edit3, 
  Save, 
  RotateCcw, 
  AlertCircle,
  Eye,
  Hash,
  Activity
} from 'lucide-react';
import { COMMANDS, MODULES } from '../../shared/catalog.js';

export function CommandManagerView({ botData, onSaveConfig }) {
  const config = botData?.config || {};
  const commandsConfig = config.commands || {};
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [editingCommand, setEditingCommand] = useState(null);
  const [commandStats, setCommandStats] = useState({});
  const [notice, setNotice] = useState('');

  // Load stats from server
  useEffect(() => {
    fetch('/api/bot/commands')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setCommandStats(data.stats);
      })
      .catch(console.error);
  }, []);

  const commandList = Object.entries(COMMANDS).map(([name, def]) => {
    const custom = commandsConfig[name] || {};
    const stats = commandStats[name] || { count: 0, failures: 0 };
    return {
      name,
      ...def,
      enabled: custom.enabled !== false,
      cooldown: custom.cooldown || 0,
      staffOnly: custom.staffOnly !== undefined ? custom.staffOnly : !!def.staffDefault,
      aliases: custom.aliases || [],
      responses: custom.responses || {},
      stats
    };
  });

  const filteredCommands = commandList.filter(cmd => {
    const matchSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) || 
                        cmd.description.toLowerCase().includes(search.toLowerCase());
    const matchMod = selectedModule === 'ALL' || cmd.module === selectedModule;
    return matchSearch && matchMod;
  });

  const handleToggleCommand = async (name, currentEnabled) => {
    try {
      const updated = {
        ...commandsConfig,
        [name]: {
          ...(commandsConfig[name] || {}),
          enabled: !currentEnabled
        }
      };
      await onSaveConfig({ ...config, commands: updated });
      setNotice(`/${name} ${!currentEnabled ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setNotice(''), 2500);
    } catch (e) {
      setNotice(`Error: ${e.message}`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCommand) return;
    try {
      const { name, enabled, cooldown, staffOnly, aliases, responses } = editingCommand;
      const res = await fetch(`/api/bot/commands/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, cooldown: Number(cooldown), staffOnly, aliases, responses })
      });
      if (res.ok) {
        setNotice(`/${name} configuration updated.`);
        setEditingCommand(null);
        setTimeout(() => setNotice(''), 2500);
      } else {
        const err = await res.json();
        setNotice(`Error: ${err.error || 'Failed to save'}`);
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
            <span className="badge badge-zinc">SLASH COMMAND MANAGER</span>
            <span className="badge badge-blue">{commandList.length} COMMANDS AVAILABLE</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
            Configure Command Permissions, Responses & Cooldowns
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Manage staff restrictions, execution aliases, and customized bot replies.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search /command..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="input-base"
            style={{ width: '150px' }}
          >
            <option value="ALL">All Modules</option>
            {MODULES.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '10px 14px', background: '#111827', border: '1px solid #1f293d', borderRadius: '6px', fontSize: '12px', color: '#10b981' }}>
          {notice}
        </div>
      )}

      {/* Commands Table / List */}
      <div className="card-shell" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1b202e', color: '#64748b' }}>
                <th style={{ padding: '10px 14px' }}>COMMAND</th>
                <th style={{ padding: '10px 14px' }}>MODULE</th>
                <th style={{ padding: '10px 14px' }}>ACCESS LEVEL</th>
                <th style={{ padding: '10px 14px' }}>COOLDOWN</th>
                <th style={{ padding: '10px 14px' }}>EXECUTIONS</th>
                <th style={{ padding: '10px 14px' }}>STATUS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommands.map((cmd) => (
                <tr key={cmd.name} style={{ borderBottom: '1px solid #141824', opacity: cmd.enabled ? 1 : 0.6 }}>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                        /{cmd.name}
                      </span>
                      {cmd.aliases.length > 0 && (
                        <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>
                          ({cmd.aliases.map(a => `/${a}`).join(', ')})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {cmd.description}
                    </div>
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-zinc">{cmd.module}</span>
                  </td>

                  <td style={{ padding: '14px' }}>
                    {cmd.staffOnly ? (
                      <span className="badge badge-amber">STAFF ONLY</span>
                    ) : (
                      <span className="badge badge-zinc">PUBLIC</span>
                    )}
                  </td>

                  <td className="font-mono" style={{ padding: '14px', color: '#94a3b8' }}>
                    {cmd.cooldown > 0 ? `${cmd.cooldown}s` : 'None'}
                  </td>

                  <td className="font-mono" style={{ padding: '14px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{cmd.stats.count}</span>
                    {cmd.stats.failures > 0 && (
                      <span style={{ color: '#f87171', fontSize: '11px', marginLeft: '6px' }}>
                        ({cmd.stats.failures} err)
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <button
                      onClick={() => handleToggleCommand(cmd.name, cmd.enabled)}
                      className={cmd.enabled ? 'badge badge-emerald' : 'badge badge-zinc'}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {cmd.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>

                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <button
                      onClick={() => setEditingCommand(JSON.parse(JSON.stringify(cmd)))}
                      className="btn-secondary font-mono"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                    >
                      <Edit3 size={12} />
                      CONFIGURE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Command Modal */}
      {editingCommand && (
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
          onClick={() => setEditingCommand(null)}
        >
          <form 
            onSubmit={handleSaveEdit}
            className="card-shell"
            style={{
              width: '100%',
              maxWidth: '540px',
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
                  Configure /{editingCommand.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{editingCommand.description}</p>
              </div>
              <button type="button" onClick={() => setEditingCommand(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>STAFF PERMISSION</label>
                <select
                  value={editingCommand.staffOnly ? 'true' : 'false'}
                  onChange={(e) => setEditingCommand({ ...editingCommand, staffOnly: e.target.value === 'true' })}
                  className="input-base"
                  style={{ marginTop: '4px' }}
                >
                  <option value="false">Public (All members)</option>
                  <option value="true">Staff Only (Staff roles & Admins)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>COOLDOWN (SECONDS)</label>
                <input
                  type="number"
                  min={0}
                  max={3600}
                  value={editingCommand.cooldown}
                  onChange={(e) => setEditingCommand({ ...editingCommand, cooldown: Number(e.target.value) })}
                  className="input-base font-mono"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>COMMAND ALIASES (COMMA SEPARATED)</label>
              <input
                type="text"
                placeholder="e.g. p, ply"
                value={editingCommand.aliases.join(', ')}
                onChange={(e) => setEditingCommand({
                  ...editingCommand,
                  aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="input-base font-mono"
                style={{ marginTop: '4px' }}
              />
            </div>

            {/* Custom Response Template */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid #1a202d' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Response Embed Template</div>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>EMBED TITLE</label>
                <input
                  type="text"
                  value={editingCommand.responses?.default?.title ?? (editingCommand.responses?.default?.title || '')}
                  onChange={(e) => setEditingCommand({
                    ...editingCommand,
                    responses: {
                      ...editingCommand.responses,
                      default: {
                        ...(editingCommand.responses?.default || {}),
                        title: e.target.value
                      }
                    }
                  })}
                  className="input-base"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>EMBED DESCRIPTION TEMPLATE</label>
                <textarea
                  rows={3}
                  value={editingCommand.responses?.default?.description ?? (editingCommand.responses?.default?.description || '')}
                  onChange={(e) => setEditingCommand({
                    ...editingCommand,
                    responses: {
                      ...editingCommand.responses,
                      default: {
                        ...(editingCommand.responses?.default || {}),
                        description: e.target.value
                      }
                    }
                  })}
                  className="input-base"
                  style={{ marginTop: '4px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setEditingCommand(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary font-mono">
                <Save size={13} />
                SAVE COMMAND
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
