import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  Send,
  AlertCircle
} from 'lucide-react';

const PENAL_DATABASE = [
  // Traffic
  { id: 't1', code: 'TC-101', title: 'Speeding (1-15 MPH Over)', category: 'Traffic', fine: 150, jail: 0, points: 1, severity: 'Infraction' },
  { id: 't2', code: 'TC-102', title: 'Speeding (20+ MPH Over / Reckless)', category: 'Traffic', fine: 450, jail: 60, points: 3, severity: 'Misdemeanor' },
  { id: 't3', code: 'TC-103', title: 'Failure to Yield to Emergency Vehicles', category: 'Traffic', fine: 300, jail: 0, points: 2, severity: 'Infraction' },
  { id: 't4', code: 'TC-104', title: 'Evading Peace Officer in a Motor Vehicle', category: 'Traffic', fine: 1200, jail: 180, points: 5, severity: 'Felony', revokeLicense: true },
  { id: 't5', code: 'TC-105', title: 'Driving Without a Valid License', category: 'Traffic', fine: 250, jail: 30, points: 2, severity: 'Misdemeanor' },

  // Violent Crimes
  { id: 'v1', code: 'PC-201', title: 'Assault on a Peace Officer', category: 'Violent', fine: 2500, jail: 240, points: 0, severity: 'Felony' },
  { id: 'v2', code: 'PC-202', title: 'Attempted Murder of Law Enforcement', category: 'Violent', fine: 5000, jail: 300, points: 0, severity: 'Felony', noBond: true },
  { id: 'v3', code: 'PC-203', title: 'Armed Robbery (Bank / Jewelry / Store)', category: 'Violent', fine: 3500, jail: 240, points: 0, severity: 'Felony' },
  { id: 'v4', code: 'PC-204', title: 'Hostage Taking / Kidnapping', category: 'Violent', fine: 4000, jail: 300, points: 0, severity: 'Felony', noBond: true },

  // Firearms & Contraband
  { id: 'f1', code: 'FC-301', title: 'Possession of Illegal Class 2 Firearm', category: 'Weapons', fine: 1500, jail: 120, points: 0, severity: 'Felony' },
  { id: 'f2', code: 'FC-302', title: 'Discharging a Firearm in City Limits', category: 'Weapons', fine: 800, jail: 90, points: 0, severity: 'Misdemeanor' },
  { id: 'f3', code: 'FC-303', title: 'Brandishing a Deadly Weapon', category: 'Weapons', fine: 600, jail: 60, points: 0, severity: 'Misdemeanor' },

  // Roleplay & Public Order
  { id: 'r1', code: 'RO-401', title: 'Resisting Arrest / Obstruction of Justice', category: 'Public Order', fine: 500, jail: 90, points: 0, severity: 'Misdemeanor' },
  { id: 'r2', code: 'RO-402', title: 'Fail Roleplay (FRP) / Breaking Fear RP', category: 'Public Order', fine: 1000, jail: 150, points: 0, severity: 'Server Infraction' },
  { id: 'r3', code: 'RO-403', title: 'Cop Baiting / Unrealistic Provocation', category: 'Public Order', fine: 750, jail: 100, points: 0, severity: 'Server Infraction' },
];

export function PenalCodeView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedOffenses, setSelectedOffenses] = useState([]);
  const [suspectUser, setSuspectUser] = useState('');
  const [officerBadge, setOfficerBadge] = useState('Sgt. Miller #214');
  const [locationPostal, setLocationPostal] = useState('Postal 204');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [syncedMelonly, setSyncedMelonly] = useState(false);

  const categories = ['All', 'Traffic', 'Violent', 'Weapons', 'Public Order'];

  const filteredOffenses = useMemo(() => {
    return PENAL_DATABASE.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const toggleOffense = (item) => {
    if (selectedOffenses.find(o => o.id === item.id)) {
      setSelectedOffenses(selectedOffenses.filter(o => o.id !== item.id));
    } else {
      setSelectedOffenses([...selectedOffenses, item]);
    }
  };

  const clearDossier = () => {
    setSelectedOffenses([]);
  };

  // Calculations
  const totalFine = selectedOffenses.reduce((acc, curr) => acc + curr.fine, 0);
  const rawJail = selectedOffenses.reduce((acc, curr) => acc + curr.jail, 0);
  const maxJailCap = 300; // Standard ER:LC maximum server jail limit
  const finalJail = Math.min(rawJail, maxJailCap);
  const totalPoints = selectedOffenses.reduce((acc, curr) => acc + curr.points, 0);
  const licenseRevoked = selectedOffenses.some(o => o.revokeLicense) || totalPoints >= 6;
  const noBond = selectedOffenses.some(o => o.noBond);

  // Formatted In-Game ER:LC Command
  const chargesSummary = selectedOffenses.map(o => o.code).join(', ');
  const inGameJailCommand = `/jail ${suspectUser || '[SUSPECT]'} ${finalJail} ${chargesSummary || 'Multiple Citations'}`;

  // Formatted Discord Arrest Embed Markdown
  const discordEmbedMarkdown = `\`\`\`ini
[ ER:LC ARREST RECORD & CITATION DOSSIER ]
Suspect: ${suspectUser || 'Unknown Suspect'}
Arresting Officer: ${officerBadge}
Location: ${locationPostal}

Total Fine: $${totalFine.toLocaleString()}
Jail Sentence: ${finalJail}s (Raw: ${rawJail}s)
License Status: ${licenseRevoked ? 'REVOKED' : `${totalPoints} Points Added`}
Bond: ${noBond ? 'NO BOND' : 'ELIGIBLE'}

Charges Booked:
${selectedOffenses.map(o => `• [${o.code}] ${o.title} ($${o.fine} / ${o.jail}s)`).join('\n')}
\`\`\``;

  const copyCommand = () => {
    navigator.clipboard.writeText(inGameJailCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(discordEmbedMarkdown);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const pushToMelonly = () => {
    setSyncedMelonly(true);
    setTimeout(() => setSyncedMelonly(false), 3000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '24px', alignItems: 'start' }}>
      {/* Left Column: Penal Code Explorer & Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Bar */}
        <div className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Smart Penal Code Selector</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select charges to instantly calculate jail time, fines, and copy formatted commands.
              </p>
            </div>
            <span className="badge badge-blue">PENAL CODE v3.2</span>
          </div>

          {/* Search & Category Filter */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search charge or penal code (e.g. TC-104, Evading)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base"
                style={{ paddingLeft: '32px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: selectedCategory === cat ? 'var(--civ-blue-dim)' : 'var(--bg-elevated)',
                    border: selectedCategory === cat ? '1px solid var(--civ-blue-border)' : '1px solid var(--border-subtle)',
                    color: selectedCategory === cat ? 'var(--civ-blue-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Offenses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredOffenses.map((item) => {
            const isSelected = selectedOffenses.some(o => o.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleOffense(item)}
                className="card-shell"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--civ-blue-border)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(46, 144, 250, 0.06)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: isSelected ? 'var(--civ-blue)' : 'var(--text-muted)' }}>
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--civ-blue-light)', fontWeight: 600 }}>
                        [{item.code}]
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                        {item.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className={item.severity === 'Felony' ? 'badge badge-rose' : item.severity === 'Misdemeanor' ? 'badge badge-amber' : 'badge badge-zinc'} style={{ fontSize: '10px' }}>
                        {item.severity}
                      </span>
                      {item.revokeLicense && <span className="badge badge-rose" style={{ fontSize: '10px' }}>REVOKES LICENSE</span>}
                      {item.noBond && <span className="badge badge-rose" style={{ fontSize: '10px' }}>NO BOND</span>}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    ${item.fine.toLocaleString()}
                  </div>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.jail > 0 ? `${item.jail}s jail` : 'Citation only'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Booking Dossier & Output Terminal */}
      <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-shell" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', borderColor: 'var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Live Arrest & Citation Dossier</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {selectedOffenses.length} charge{selectedOffenses.length === 1 ? '' : 's'} staged
              </p>
            </div>
            {selectedOffenses.length > 0 && (
              <button 
                onClick={clearDossier}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--status-danger)', 
                  cursor: 'pointer', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>

          {/* Suspect & Officer Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Suspect Roblox Username
              </label>
              <input
                type="text"
                placeholder="e.g. SpeedDemon_99"
                value={suspectUser}
                onChange={(e) => setSuspectUser(e.target.value)}
                className="input-base font-mono"
                style={{ marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Officer Badge #
                </label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  className="input-base font-mono"
                  style={{ marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Location / Postal
                </label>
                <input
                  type="text"
                  value={locationPostal}
                  onChange={(e) => setLocationPostal(e.target.value)}
                  className="input-base font-mono"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Real-time Calculation Ticker */}
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-medium)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Fine</span>
              <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                ${totalFine.toLocaleString()}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Jail Sentence</span>
              <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                {finalJail}s
                {rawJail > maxJailCap && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                    (Capped from {rawJail}s)
                  </span>
                )}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>License Action</span>
              <div style={{ marginTop: '4px' }}>
                {licenseRevoked ? (
                  <span className="badge badge-rose">REVOKED (6+ PTS)</span>
                ) : (
                  <span className="badge badge-zinc font-mono">{totalPoints} PTS</span>
                )}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bail Eligibility</span>
              <div style={{ marginTop: '4px' }}>
                {noBond ? (
                  <span className="badge badge-rose">NO BOND</span>
                ) : (
                  <span className="badge badge-emerald">ELIGIBLE</span>
                )}
              </div>
            </div>
          </div>

          {/* Output Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* In-Game ER:LC Chat Command */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                IN-GAME ER:LC COMMAND
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  readOnly 
                  value={inGameJailCommand} 
                  className="input-base font-mono" 
                  style={{ background: '#0a0d14', color: 'var(--civ-blue-light)' }} 
                />
                <button onClick={copyCommand} className="btn-primary font-mono" style={{ whiteSpace: 'nowrap' }}>
                  {copiedCmd ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCmd ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Discord Embed Button */}
            <button onClick={copyEmbed} className="btn-secondary font-mono" style={{ width: '100%' }}>
              {copiedEmbed ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              {copiedEmbed ? 'DISCORD LOG COPIED' : 'COPY DISCORD ARREST EMBED'}
            </button>

            {/* Melonly Sync Button */}
            <button onClick={pushToMelonly} className="btn-secondary font-mono" style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              {syncedMelonly ? <Check size={14} style={{ color: '#10b981' }} /> : <Send size={14} style={{ color: '#10b981' }} />}
              {syncedMelonly ? 'RECORD PUSHED TO MELONLY CAD' : 'SYNC TO MELONLY CAD RECORD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
