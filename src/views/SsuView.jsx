import React, { useState } from 'react';
import { 
  Users, 
  Flame, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Play, 
  RefreshCw,
  Clock,
  Shield,
  Car,
  Truck,
  HeartPulse
} from 'lucide-react';

export function SsuView() {
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);
  const [copiedJoinCmd, setCopiedJoinCmd] = useState(false);
  const [seederMultiplier, setSeederMultiplier] = useState(true);

  const serverCode = "liberty-county-rp-702";
  const currentPlayers = 28;
  const maxPlayers = 35;
  const percentage = Math.round((currentPlayers / maxPlayers) * 100);

  const departments = [
    { name: 'Police / Sheriff', count: 13, target: 8, icon: Shield, color: '#2e90fa' },
    { name: 'Civilians', count: 11, target: 18, icon: Car, color: '#10b981' },
    { name: 'Fire & EMS', count: 2, target: 4, icon: HeartPulse, color: '#f87171' },
    { name: 'DOT & Public Works', count: 2, target: 3, icon: Truck, color: '#f59e0b' },
  ];

  const announcementText = `🚨 **LIBERTY COUNTY STATE RP — SERVER STARTUP (SSU) ACTIVE!** 🚨

🎮 **Server Code:** \`${serverCode}\`
👥 **Current Players:** \`${currentPlayers}/${maxPlayers}\` (High Density RP)
⚡ **SSU Seeder Perk:** Join in the next 15 mins for **2.0x Economy Cash & Priority Queue**!

🚔 **Department Status:**
• Police / Sheriff: **FULL PATROL**
• Fire & Rescue: **OPEN CALLOUTS**
• Civilians Needed: **WANTED FOR ACTIVE ROLEPLAY SCENES**

🔗 **Join Now:** https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County?privateServerLinkCode=erlc-702`;

  const copyAnnouncement = () => {
    navigator.clipboard.writeText(announcementText);
    setCopiedAnnouncement(true);
    setTimeout(() => setCopiedAnnouncement(false), 2000);
  };

  const copyJoin = () => {
    navigator.clipboard.writeText(`:join ${serverCode}`);
    setCopiedJoinCmd(true);
    setTimeout(() => setCopiedJoinCmd(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SSU Header */}
      <div 
        className="card-shell" 
        style={{ 
          padding: '24px', 
          background: 'linear-gradient(180deg, #101524 0%, #0d0f17 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">SSU CAMPAIGN ACTIVE</span>
            <span className="badge badge-blue">ER:LC REMOTE API LINKED</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Server Start Up (SSU) & Community Seeder Terminal
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Monitor real-time department ratios, automate early-bird reward seeders, and keep server queues filled.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={copyJoin} className="btn-secondary font-mono">
            {copiedJoinCmd ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
            {copiedJoinCmd ? 'COPIED :join' : `:join ${serverCode}`}
          </button>
          <button onClick={copyAnnouncement} className="btn-primary font-mono">
            {copiedAnnouncement ? <Check size={14} /> : <Share2 size={14} />}
            {copiedAnnouncement ? 'ANNOUNCEMENT COPIED' : 'COPY SSU DISCORD PING'}
          </button>
        </div>
      </div>

      {/* Population & Ratio Balancer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        {/* Left: Population Gauge */}
        <div className="card-shell" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Live Population Capacity</span>
            <span className="font-mono" style={{ fontSize: '12px', color: 'var(--civ-blue-light)' }}>
              {percentage}% FILLED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff' }}>
              {currentPlayers}
            </span>
            <span className="font-mono" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
              / {maxPlayers} max
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '10px', background: 'var(--bg-elevated)', borderRadius: '5px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${percentage}%`, 
                height: '100%', 
                background: percentage > 75 ? 'var(--civ-blue)' : '#10b981',
                borderRadius: '5px',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: '#ffffff' }}>Seeder Advice:</strong> You are 7 players away from a full queue. Announce a Civilian Crime Priority to bring in non-LEO players!
          </div>

          {/* Quick Toggle for Seeder Multiplier */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>2.0x Seeder XP Multiplier</span>
            </div>
            <button 
              onClick={() => setSeederMultiplier(!seederMultiplier)}
              className={seederMultiplier ? "badge badge-emerald" : "badge badge-zinc"}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {seederMultiplier ? 'ENABLED' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* Right: Department Balancer Breakdown */}
        <div className="card-shell" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Live Department Balancer</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ensures server doesn't become 100% cops with no civilian roleplay</p>
            </div>
            <span className="badge badge-zinc">ACTIVE CENSUS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {departments.map((dept) => {
              const Icon = dept.icon;
              const ratio = Math.round((dept.count / currentPlayers) * 100);
              const isOverTarget = dept.count > dept.target;

              return (
                <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} style={{ color: dept.color }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{dept.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {dept.count} units
                      </span>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({ratio}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${ratio}%`, 
                        height: '100%', 
                        background: dept.color,
                        borderRadius: '3px'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SSU Seeder Leaderboard / Early Birds */}
      <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Active SSU Early-Bird Seeders</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Players currently receiving 2.0x economy reward perks for joining first</p>
          </div>
          <span className="badge badge-emerald">6 REWARDED SEEDERS</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>ROBLOX USERNAME</th>
                <th style={{ padding: '10px 14px' }}>JOIN TIMESTAMP</th>
                <th style={{ padding: '10px 14px' }}>DEPARTMENT</th>
                <th style={{ padding: '10px 14px' }}>EARNED SEEDER BONUS</th>
                <th style={{ padding: '10px 14px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>Apex_Rider99</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>00:04:12 (Minute 1)</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-blue">LCSO DEPUTY</span></td>
                <td className="font-mono" style={{ padding: '12px 14px', color: '#10b981' }}>+$500 Cash + VIP Car</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">ACTIVE IN GAME</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>ShadowCiv_RP</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>00:05:40 (Minute 2)</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">CIVILIAN</span></td>
                <td className="font-mono" style={{ padding: '12px 14px', color: '#10b981' }}>+$500 Cash + VIP Car</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">ACTIVE IN GAME</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>FireCaptain_Tom</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>00:08:19 (Minute 5)</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-rose">FIRE / RESCUE</span></td>
                <td className="font-mono" style={{ padding: '12px 14px', color: '#10b981' }}>+$350 Cash</td>
                <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">ACTIVE IN GAME</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
