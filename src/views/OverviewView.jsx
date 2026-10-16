import React from 'react';
import { 
  Users, 
  ShieldAlert, 
  Radio, 
  Activity, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { CivLinkLogo } from '../components/CivLinkLogo';

export function OverviewView({ setActiveTab, onOpenAuth, user }) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const copyServerCode = () => {
    navigator.clipboard.writeText(':join liberty-county-rp-702');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome / Server Header */}
      <div 
        className="card-shell" 
        style={{ 
          padding: '24px 28px',
          background: 'linear-gradient(180deg, #10141f 0%, #0d0f17 100%)',
          borderColor: 'var(--border-medium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CivLinkLogo size={24} showText={true} />
            <span className="badge badge-blue">ENTERPRISE PRC</span>
            <span className="badge badge-emerald">SERVER ONLINE</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Liberty County State Roleplay
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            PRC ID: <span className="font-mono" style={{ color: 'var(--civ-blue-light)' }}>liberty-county-rp-702</span> &nbsp;•&nbsp; Connected with Melonly API v2.4
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={copyServerCode} className="btn-secondary font-mono">
            {copiedCode ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
            {copiedCode ? 'COMMAND COPIED' : ':join liberty-county-rp-702'}
          </button>
          <button onClick={() => setActiveTab('ssu')} className="btn-primary font-mono">
            MANAGE SSU
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Metric 1: In-Game Population */}
        <div className="card-shell" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Server Population
            </span>
            <Users size={18} style={{ color: 'var(--civ-blue)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
              28 <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 35</span>
            </span>
            <span className="badge badge-emerald">80% CAPACITY</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            13 Law Enforcement • 11 Civilians • 4 Fire/DOT
          </p>
        </div>

        {/* Metric 2: Anti-Ghost Shift Radar */}
        <div className="card-shell" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Staff Activity Radar
            </span>
            <ShieldAlert size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
              7 <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Active</span>
            </span>
            <span className="badge badge-amber">1 GHOST FLAGGED</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Melonly sync verified • 1 staff AFK farming shift hours
          </p>
        </div>

        {/* Metric 3: Active Priority */}
        <div className="card-shell" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Priority Status
            </span>
            <Radio size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>
              PRIORITY 1
            </span>
            <span className="badge badge-rose">07:44 COOLDOWN</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Armed Bank Robbery underway at Postal 204
          </p>
        </div>

        {/* Metric 4: Citations & Arrests */}
        <div className="card-shell" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              24H Arrest Operations
            </span>
            <Activity size={18} style={{ color: 'var(--civ-blue-light)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
              42 <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Booked</span>
            </span>
            <span className="badge badge-blue font-mono">$18,450 FINES</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Calculated via CivLink Smart Penal Code
          </p>
        </div>
      </div>

      {/* Main Grid: Live Feed & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Live Incident & SSU Stream */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Real-Time Server Dispatch Stream</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Direct feed from ER:LC Server API & Melonly webhooks</p>
            </div>
            <span className="badge badge-emerald">LIVE POLLING (1s)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-rose">10-80 PURSUIT</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Black Bullhorn Pursuit heading South on Route 13</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Officer Badge #214 (Sgt. Miller) • 2 units in pursuit</div>
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>2m ago</span>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-amber">STAFF AUDIT</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Moderator @Kev_RP flagged for 90m zero-command shift</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Logged in Melonly shift but zero ER:LC server commands logged</div>
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>14m ago</span>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-emerald">SSU SEEDER</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>SSU Goal Reached: 25+ Players threshold unlocked</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awarded 2.0x server economy XP to 14 active early seeders</div>
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>38m ago</span>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Launch Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Quick Operations</h3>
            
            <button 
              onClick={() => setActiveTab('penal')}
              className="btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <span>⚖️ Smart Penal Code Calculator</span>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('staff')}
              className="btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <span>🛡️ Melonly Staff Shift Audit</span>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('dispatch')}
              className="btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <span>🚨 Live 911 Web Dispatch</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div 
            className="card-shell" 
            style={{ 
              padding: '20px', 
              background: 'linear-gradient(180deg, #121826 0%, #0c0f17 100%)',
              borderColor: 'var(--civ-blue-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-blue">OAUTH2 READY</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              Discord Integration Active
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
              Client ID: <span className="font-mono">1552165138017165372</span>
            </p>
            <button onClick={onOpenAuth} className="btn-primary font-mono" style={{ width: '100%' }}>
              MANAGE DISCORD AUTH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
