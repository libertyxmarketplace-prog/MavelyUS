import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Terminal, 
  Download, 
  Search, 
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const MOCK_STAFF = [
  {
    id: 1,
    name: 'Sgt. Miller',
    discord: '@miller_rp',
    role: 'Staff Supervisor',
    melonlyHours: '4h 15m',
    commandsLogged: 34,
    kicks: 3,
    bans: 1,
    warnings: 8,
    aerScore: 96,
    status: 'ACTIVE_DUTY',
    flagged: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Officer Davis',
    discord: '@davis_leo',
    role: 'Senior Moderator',
    melonlyHours: '3h 40m',
    commandsLogged: 22,
    kicks: 1,
    bans: 0,
    warnings: 6,
    aerScore: 88,
    status: 'ACTIVE_DUTY',
    flagged: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'Kev_RP',
    discord: '@kev_99',
    role: 'Trial Moderator',
    melonlyHours: '2h 55m',
    commandsLogged: 0,
    kicks: 0,
    bans: 0,
    warnings: 0,
    aerScore: 8,
    status: 'GHOST_SHIFT',
    flagged: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    name: 'Vortex_Mod',
    discord: '@vortex_erlc',
    role: 'Moderator',
    melonlyHours: '1h 20m',
    commandsLogged: 12,
    kicks: 2,
    bans: 0,
    warnings: 4,
    aerScore: 91,
    status: 'ON_BREAK',
    flagged: false,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 5,
    name: 'ShadowGhost',
    discord: '@shadow_staff',
    role: 'Moderator',
    melonlyHours: '5h 10m',
    commandsLogged: 2,
    kicks: 0,
    bans: 0,
    warnings: 1,
    aerScore: 19,
    status: 'GHOST_SHIFT',
    flagged: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80'
  }
];

export function StaffAuditView() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [exportNotice, setExportNotice] = useState(false);

  const filteredStaff = MOCK_STAFF.filter((staff) => {
    const matchSearch = staff.name.toLowerCase().includes(search.toLowerCase()) || 
                        staff.discord.toLowerCase().includes(search.toLowerCase());
    if (filter === 'FLAGGED') return matchSearch && staff.flagged;
    if (filter === 'ACTIVE') return matchSearch && staff.status === 'ACTIVE_DUTY';
    return matchSearch;
  });

  const exportCSV = () => {
    const headers = "Name,Discord,Role,Melonly Shift Time,Commands Logged,AER Score,Status\n";
    const rows = MOCK_STAFF.map(s => `"${s.name}","${s.discord}","${s.role}","${s.melonlyHours}",${s.commandsLogged},${s.aerScore}%,"${s.status}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civlink-melonly-shift-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div 
        className="card-shell" 
        style={{ 
          padding: '24px', 
          background: 'linear-gradient(180deg, #121826 0%, #0d0f17 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-amber">ANTI-GHOST RADAR</span>
            <span className="badge badge-blue">MELONLY API CONNECTED</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Melonly Shift Audit & Staff Performance Intelligence
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Cross-references Melonly shift clock-ins with real ER:LC server command executions to catch AFK hour-farming.
          </p>
        </div>

        <button onClick={exportCSV} className="btn-secondary font-mono">
          <Download size={14} />
          {exportNotice ? 'CSV EXPORTED' : 'EXPORT AUDIT CSV'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-shell" style={{ padding: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Melonly Shift Hours Audited
          </span>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            17h 20m
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across 5 active staff members</p>
        </div>

        <div className="card-shell" style={{ padding: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            In-Game Mod Commands
          </span>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--civ-blue-light)', marginTop: '6px' }}>
            70 Actions
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>6 kicks, 1 ban, 19 warnings</p>
        </div>

        <div className="card-shell" style={{ padding: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Ghost Shifts Detected
          </span>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', marginTop: '6px' }}>
            2 Flagged
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Clocked in &gt; 2h with &lt; 3 commands</p>
        </div>

        <div className="card-shell" style={{ padding: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Average Staff AER Score
          </span>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
            68.4%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Activity Efficiency Ratio</p>
        </div>
      </div>

      {/* Staff Audit Table */}
      <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Table Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setFilter('ALL')}
              className={filter === 'ALL' ? 'badge badge-blue' : 'badge badge-zinc'}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
            >
              ALL ROSTER (5)
            </button>
            <button 
              onClick={() => setFilter('FLAGGED')}
              className={filter === 'FLAGGED' ? 'badge badge-rose' : 'badge badge-zinc'}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
            >
              ⚠️ GHOST SHIFTS FLAGGED (2)
            </button>
            <button 
              onClick={() => setFilter('ACTIVE')}
              className={filter === 'ACTIVE' ? 'badge badge-emerald' : 'badge badge-zinc'}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
            >
              ACTIVE ON PATROL (2)
            </button>
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search staff or discord..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '30px' }}
            />
          </div>
        </div>

        {/* The Roster Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>STAFF MEMBER</th>
                <th style={{ padding: '10px 14px' }}>ROLE</th>
                <th style={{ padding: '10px 14px' }}>MELONLY CLOCKED</th>
                <th style={{ padding: '10px 14px' }}>ER:LC COMMANDS</th>
                <th style={{ padding: '10px 14px' }}>AER EFFICIENCY</th>
                <th style={{ padding: '10px 14px' }}>AUDIT VERDICT</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: staff.flagged ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={staff.avatar} 
                        alt={staff.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{staff.name}</div>
                        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{staff.discord}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-zinc">{staff.role}</span>
                  </td>
                  <td className="font-mono" style={{ padding: '14px', color: '#ffffff', fontWeight: 600 }}>
                    {staff.melonlyHours}
                  </td>
                  <td className="font-mono" style={{ padding: '14px' }}>
                    <span style={{ color: staff.commandsLogged > 0 ? 'var(--civ-blue-light)' : '#f87171', fontWeight: 700 }}>
                      {staff.commandsLogged}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> commands</span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: staff.aerScore > 75 ? '#10b981' : staff.aerScore > 40 ? '#f59e0b' : '#f87171' }}>
                        {staff.aerScore}%
                      </span>
                      <div style={{ width: '60px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${staff.aerScore}%`, height: '100%', background: staff.aerScore > 75 ? '#10b981' : staff.aerScore > 40 ? '#f59e0b' : '#f87171' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {staff.flagged ? (
                      <span className="badge badge-rose">
                        ⚠️ GHOST SHIFT (AFK)
                      </span>
                    ) : (
                      <span className="badge badge-emerald">
                        VERIFIED ACTIVE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
