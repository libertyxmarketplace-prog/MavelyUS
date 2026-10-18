import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ExternalLink,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';

const MOCK_RECORDS = [
  {
    id: 'REC-901',
    timestamp: '2026-10-16 00:18',
    suspect: 'SpeedDemon_99',
    officer: 'Sgt. Miller #214',
    charges: 'TC-104 Evading Police, TC-102 Reckless Driving',
    fine: 1650,
    jail: 240,
    status: 'BOOKED_JAILED',
    melonlySynced: true
  },
  {
    id: 'REC-902',
    timestamp: '2026-10-15 23:42',
    suspect: 'GhostDrifter',
    officer: 'Off. Davis #305',
    charges: 'TC-101 Speeding (12 MPH Over)',
    fine: 150,
    jail: 0,
    status: 'CITATION_ISSUED',
    melonlySynced: true
  },
  {
    id: 'REC-903',
    timestamp: '2026-10-15 22:15',
    suspect: 'BrawlMaster_X',
    officer: 'Sgt. Miller #214',
    charges: 'PC-201 Assault on Peace Officer, FC-301 Illegal Firearm',
    fine: 4000,
    jail: 300,
    status: 'BOOKED_JAILED',
    melonlySynced: true
  },
  {
    id: 'REC-904',
    timestamp: '2026-10-15 21:04',
    suspect: 'TrollAccount_9',
    officer: 'Dep. James #108',
    charges: 'RO-402 Fail Roleplay (FRP)',
    fine: 1000,
    jail: 150,
    status: 'MOD_KICK',
    melonlySynced: true
  }
];

export function RecordsView() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_RECORDS.filter(r => 
    r.suspect.toLowerCase().includes(search.toLowerCase()) ||
    r.officer.toLowerCase().includes(search.toLowerCase()) ||
    r.charges.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div 
        className="card-shell" 
        style={{ 
          padding: '24px', 
          background: 'linear-gradient(180deg, #101522 0%, #0d0f17 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-blue">AUDIT LEDGER</span>
            <span className="badge badge-emerald">AUTOMATIC MELONLY SYNC</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Official Arrest & Citation Records
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Tamper-evident logs of all booked charges, citations, and staff enforcement actions.
          </p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search suspect, officer, or charge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '32px' }}
          />
        </div>
      </div>

      <div className="card-shell" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>RECORD ID</th>
                <th style={{ padding: '10px 14px' }}>TIMESTAMP</th>
                <th style={{ padding: '10px 14px' }}>SUSPECT</th>
                <th style={{ padding: '10px 14px' }}>OFFICER</th>
                <th style={{ padding: '10px 14px' }}>CHARGES</th>
                <th style={{ padding: '10px 14px' }}>TOTAL FINE</th>
                <th style={{ padding: '10px 14px' }}>JAIL</th>
                <th style={{ padding: '10px 14px' }}>CAD SYNC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="font-mono" style={{ padding: '14px', color: 'var(--civ-blue-light)', fontWeight: 600 }}>
                    {record.id}
                  </td>
                  <td className="font-mono" style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {record.timestamp}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, color: '#ffffff' }}>
                    {record.suspect}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    {record.officer}
                  </td>
                  <td style={{ padding: '14px', maxWidth: '300px', fontSize: '12px' }}>
                    {record.charges}
                  </td>
                  <td className="font-mono" style={{ padding: '14px', color: '#10b981', fontWeight: 600 }}>
                    ${record.fine.toLocaleString()}
                  </td>
                  <td className="font-mono" style={{ padding: '14px', color: record.jail > 0 ? '#f87171' : 'var(--text-muted)' }}>
                    {record.jail > 0 ? `${record.jail}s` : '0s'}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-emerald">SYNCED</span>
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
