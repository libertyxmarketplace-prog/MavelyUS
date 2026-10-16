import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Users, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Square, 
  Cpu, 
  Clock, 
  Ticket, 
  Shield, 
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function OverviewView({ botData, onRefresh, onOpenSettings, setActiveTab }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningDiag, setRunningDiag] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleBotAction = async (action) => {
    try {
      const res = await fetch(`/api/bot/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setActionNotice(`Error: ${data.error || 'Action failed'}`);
      } else {
        setActionNotice(`Bot ${action} command sent successfully.`);
        loadData();
        onRefresh?.();
      }
    } catch (e) {
      setActionNotice(`Error: ${e.message}`);
    }
    setTimeout(() => setActionNotice(''), 4000);
  };

  const runDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await fetch('/api/bot/diagnostics', { method: 'POST' });
      const data = await res.json();
      setDiagnostics(data.checks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningDiag(false);
    }
  };

  const bot = overview?.bot || {};
  const isOnline = bot.status === 'online';
  const hasToken = bot.hasToken;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner / Actions */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '8px', 
              background: '#161a26', 
              border: '1px solid #232a3d', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {bot.user?.avatarUrl ? (
              <img src={bot.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Server size={22} style={{ color: '#2E90FA' }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {bot.user?.username || 'Your ER:LC Bot'}
              </h1>
              <span className={isOnline ? 'badge badge-emerald' : hasToken ? 'badge badge-amber' : 'badge badge-zinc'}>
                {isOnline ? 'ONLINE' : hasToken ? 'OFFLINE' : 'NO TOKEN CONFIGURED'}
              </span>
              {bot.latency !== null && bot.latency !== undefined && (
                <span className="badge badge-zinc font-mono">{bot.latency}ms ping</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
              Uptime: <strong style={{ color: '#ffffff' }}>{bot.uptimeMs ? `${Math.floor(bot.uptimeMs / 60000)}m active` : '0m (Stopped)'}</strong>
              &nbsp;•&nbsp; Managed via CivLink Engine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOnline ? (
            <button onClick={() => handleBotAction('stop')} className="btn-danger font-mono" style={{ fontSize: '12px' }}>
              <Square size={13} />
              STOP BOT
            </button>
          ) : (
            <button onClick={() => handleBotAction('start')} className="btn-primary font-mono" style={{ fontSize: '12px' }}>
              <Play size={13} />
              START BOT
            </button>
          )}

          <button onClick={() => handleBotAction('restart')} className="btn-secondary font-mono" style={{ fontSize: '12px' }}>
            <RotateCw size={13} />
            RESTART
          </button>

          <button onClick={runDiagnostics} className="btn-secondary font-mono" style={{ fontSize: '12px' }} disabled={runningDiag}>
            <Activity size={13} style={{ color: '#2E90FA' }} />
            {runningDiag ? 'CHECKING...' : 'RUN DIAGNOSTICS'}
          </button>
        </div>
      </div>

      {actionNotice && (
        <div style={{ padding: '10px 16px', background: '#131826', border: '1px solid #232b40', borderRadius: '6px', fontSize: '13px', color: '#94a3b8' }}>
          {actionNotice}
        </div>
      )}

      {/* Diagnostics Results Modal / Drawer if triggered */}
      {diagnostics && (
        <div className="card-shell" style={{ padding: '20px', borderColor: '#2d374f', background: '#0e121a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>System Diagnostics Report</h3>
            <button onClick={() => setDiagnostics(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>
              Dismiss
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {diagnostics.map((chk, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#131722', borderRadius: '6px', border: '1px solid #1f2536', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {chk.status === 'pass' && <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: '2px' }} />}
                {chk.status === 'warn' && <AlertTriangle size={16} style={{ color: '#f59e0b', marginTop: '2px' }} />}
                {chk.status === 'fail' && <XCircle size={16} style={{ color: '#ef4444', marginTop: '2px' }} />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{chk.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{chk.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Metric 1: Discord Guild */}
        <div className="card-shell" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Discord Members</span>
            <Users size={16} style={{ color: '#2E90FA' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {overview?.discord?.memberCount !== undefined && overview?.discord?.memberCount !== null 
              ? Number(overview.discord.memberCount).toLocaleString()
              : overview?.guildSelected ? 'Synced' : 'No Server'}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview?.discord?.name || 'Set Discord Server in Settings'}
          </p>
        </div>

        {/* Metric 2: ER:LC In-Game Players */}
        <div className="card-shell" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>ER:LC Players</span>
            <Server size={16} style={{ color: '#10b981' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {overview?.erlc?.players !== undefined ? (
              <span>{overview.erlc.players} <span style={{ fontSize: '15px', color: '#64748b' }}>/ {overview.erlc.maxPlayers}</span></span>
            ) : overview?.erlc?.configured ? (
              'Linked'
            ) : (
              'Key needed'
            )}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview?.erlc?.queue !== undefined ? `${overview.erlc.queue} waiting in queue` : 'Set PRC Server Key'}
          </p>
        </div>

        {/* Metric 3: Staff on Duty & Sessions */}
        <div className="card-shell" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Staff On Shift</span>
            <Shield size={16} style={{ color: '#f59e0b' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {overview?.staffOnDuty !== null && overview?.staffOnDuty !== undefined ? overview.staffOnDuty : '0'} Active
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview?.session ? 'Session startup in progress' : 'No active SSU session'}
          </p>
        </div>

        {/* Metric 4: Tickets & Hosting Resources */}
        <div className="card-shell" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Host CPU / Memory</span>
            <Cpu size={16} style={{ color: '#2E90FA' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {overview?.host?.cpuPercent ?? 0}% <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>CPU</span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview?.host ? `${Math.round(overview.host.heapUsed / 1024 / 1024)} MB heap • ${overview.tickets?.open ?? 0} open tickets` : 'Tracking active'}
          </p>
        </div>
      </div>

      {/* Main Grid: Activity Feed & Errors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Recent Activity Feed */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Recent Bot Activity</h3>
            <span className="badge badge-zinc">LIVE DISPATCH LOG</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overview?.activity && overview.activity.length > 0 ? (
              overview.activity.slice(0, 7).map((act, i) => (
                <div key={i} style={{ padding: '9px 12px', background: '#121622', borderRadius: '5px', border: '1px solid #1a2030', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={act.type === 'command' ? 'badge badge-blue' : act.type === 'error' ? 'badge badge-rose' : 'badge badge-zinc'} style={{ fontSize: '9px' }}>
                      {act.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#ffffff' }}>{act.message}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(act.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                No recent activity logged yet. Start the bot or execute a command to see live telemetry.
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Launch & Diagnostics Quick Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Setup / Navigation */}
          <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Quick Configuration</h3>
            
            <button onClick={() => setActiveTab('builder')} className="btn-secondary" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
              <span>🛠️ Customize Bot & Embed Styles</span>
              <ChevronRight size={15} />
            </button>

            <button onClick={() => setActiveTab('commands')} className="btn-secondary" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
              <span>⌨️ Configure Slash Commands & Roles</span>
              <ChevronRight size={15} />
            </button>

            <button onClick={() => setActiveTab('marketplace')} className="btn-secondary" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
              <span>📦 Install ER:LC & Staff Modules</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Errors Log box */}
          <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Command Failures & Errors</h3>
              <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>
                {overview?.errors?.length ?? 0} logged
              </span>
            </div>

            {overview?.errors && overview.errors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overview.errors.slice(0, 3).map((err, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#f87171' }}>{err.source}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{err.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                ✓ Zero fatal errors or failed command executions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
