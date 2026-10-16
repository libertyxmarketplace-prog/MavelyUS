import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  AlertOctagon, 
  Clock, 
  PhoneCall, 
  CheckCircle2, 
  Car, 
  Plus,
  Send,
  Shield,
  Volume2
} from 'lucide-react';

const INITIAL_CALLS = [
  {
    id: '911-8841',
    caller: 'Jessica_V',
    type: '10-80 Vehicle Pursuit',
    postal: 'Postal 204 (Downtown Springfield)',
    details: 'Black Bullhorn sedan driving recklessly on wrong side of highway at 95+ MPH.',
    priority: 'HIGH',
    status: 'EN_ROUTE',
    units: ['Unit 214 (Sgt. Miller)', 'Unit 108 (Dep. James)']
  },
  {
    id: '911-8842',
    caller: 'StoreOwner_Rob',
    type: '10-71 Shots Fired / Store Robbery',
    postal: 'Postal 112 (Gas & Go Convenience)',
    details: 'Suspect wearing ski mask and dark hoodie armed with semi-automatic pistol demanding safe contents.',
    priority: 'URGENT',
    status: 'ON_SCENE',
    units: ['Unit 305 (Off. Davis)']
  },
  {
    id: '911-8843',
    caller: 'Civilian_Trucker',
    type: '10-50 Major Vehicle Accident',
    postal: 'Postal 409 (Highway 10 Exit)',
    details: 'Two civilian vehicles collided head-on near the bridge. EMS assistance requested for injuries.',
    priority: 'MEDIUM',
    status: 'PENDING',
    units: []
  }
];

export function DispatchView() {
  const [calls, setCalls] = useState(INITIAL_CALLS);
  const [priorityLevel, setPriorityLevel] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(452); // ~7:32
  const [newCaller, setNewCaller] = useState('');
  const [newPostal, setNewPostal] = useState('');
  const [newType, setNewType] = useState('10-80 Vehicle Pursuit');
  const [newDetails, setNewDetails] = useState('');
  const [showCivilianForm, setShowCivilianForm] = useState(false);

  useEffect(() => {
    if (priorityLevel === 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [priorityLevel]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearPriority = () => {
    setPriorityLevel(0);
  };

  const setPriority = (lvl) => {
    setPriorityLevel(lvl);
    setSecondsRemaining(600); // 10 minutes default
  };

  const handleCreateCall = (e) => {
    e.preventDefault();
    if (!newDetails || !newPostal) return;
    const newEntry = {
      id: `911-${Math.floor(1000 + Math.random() * 9000)}`,
      caller: newCaller || 'Anonymous Citizen',
      type: newType,
      postal: newPostal,
      details: newDetails,
      priority: 'HIGH',
      status: 'PENDING',
      units: []
    };
    setCalls([newEntry, ...calls]);
    setNewCaller('');
    setNewPostal('');
    setNewDetails('');
    setShowCivilianForm(false);
  };

  const assignUnit = (id) => {
    setCalls(calls.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'EN_ROUTE',
          units: [...c.units, `Unit ${Math.floor(100 + Math.random() * 900)} (Dispatched)`]
        };
      }
      return c;
    }));
  };

  const resolveCall = (id) => {
    setCalls(calls.filter(c => c.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Priority Status Radar */}
      <div 
        className="card-shell" 
        style={{ 
          padding: '24px', 
          background: priorityLevel > 0 ? 'linear-gradient(180deg, #1f1214 0%, #0d0f17 100%)' : 'linear-gradient(180deg, #101924 0%, #0d0f17 100%)',
          borderColor: priorityLevel > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-medium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className={priorityLevel > 0 ? 'badge badge-rose' : 'badge badge-emerald'}>
              {priorityLevel > 0 ? `PRIORITY ${priorityLevel} IN PROGRESS` : 'CODE 4 — NORMAL TRAFFIC'}
            </span>
            <span className="badge badge-zinc">RADIO RADAR 142.85 MHz</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {priorityLevel === 1 && 'Major Bank Robbery & Armed Pursuit Active'}
            {priorityLevel === 2 && 'Priority 2: Tactical Perimeter & Search Active'}
            {priorityLevel === 3 && 'Priority 3: Minor Scenario Underway'}
            {priorityLevel === 0 && 'All Clear: No active priority scene restrictions.'}
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {priorityLevel > 0 ? (
              <span>All secondary pursuits are restricted under server rules until this scene clears.</span>
            ) : (
              <span>Units are free to initiate routine traffic stops and minor calls.</span>
            )}
          </p>
        </div>

        {/* Priority Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {priorityLevel > 0 && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Cooldown Remaining
              </span>
              <div className="font-mono" style={{ fontSize: '32px', fontWeight: 800, color: '#f87171' }}>
                {formatTimer(secondsRemaining)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {priorityLevel > 0 ? (
              <button onClick={clearPriority} className="btn-secondary font-mono" style={{ borderColor: '#10b981', color: '#10b981' }}>
                <CheckCircle2 size={15} />
                CLEAR TO CODE 4
              </button>
            ) : (
              <>
                <button onClick={() => setPriority(1)} className="btn-danger font-mono">
                  SET PRIORITY 1
                </button>
                <button onClick={() => setPriority(2)} className="btn-secondary font-mono">
                  SET PRIORITY 2
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 911 Call Intake Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Active 911 Emergency Calls Queue</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage ongoing civilian reports, dispatch units, and track locations</p>
        </div>

        <button 
          onClick={() => setShowCivilianForm(!showCivilianForm)}
          className="btn-primary font-mono"
        >
          <Plus size={15} />
          {showCivilianForm ? 'CLOSE CALL INTAKE' : 'INTAKE 911 CALL'}
        </button>
      </div>

      {/* Civilian Call Intake Modal / Drawer */}
      {showCivilianForm && (
        <form onSubmit={handleCreateCall} className="card-shell" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', borderColor: 'var(--civ-blue-border)' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Submit In-Game 911 Incident Report</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CALLER NAME / ROBLOX USER</label>
              <input 
                type="text" 
                placeholder="e.g. John_Doe (or leave blank for Anonymous)"
                value={newCaller}
                onChange={(e) => setNewCaller(e.target.value)}
                className="input-base"
                style={{ marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION / POSTAL CODE</label>
              <input 
                type="text" 
                placeholder="e.g. Postal 304 - Lakeview Apartments"
                value={newPostal}
                onChange={(e) => setNewPostal(e.target.value)}
                className="input-base"
                style={{ marginTop: '4px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CALL TYPE</label>
              <select 
                value={newType} 
                onChange={(e) => setNewType(e.target.value)}
                className="input-base"
                style={{ marginTop: '4px', background: 'var(--bg-input)' }}
              >
                <option value="10-80 Vehicle Pursuit">10-80 Vehicle Pursuit</option>
                <option value="10-71 Shots Fired">10-71 Shots Fired</option>
                <option value="10-50 Vehicle Collision">10-50 Vehicle Collision</option>
                <option value="Bank / Store Robbery">Bank / Store Robbery</option>
                <option value="Suspicious Person / Trespassing">Suspicious Person / Trespassing</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>INCIDENT DESCRIPTION</label>
            <textarea 
              rows={3} 
              placeholder="Provide vehicle color, weapons seen, direction of travel..."
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              className="input-base"
              style={{ marginTop: '4px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setShowCivilianForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary font-mono">
              <Send size={14} />
              DISPATCH CALL
            </button>
          </div>
        </form>
      )}

      {/* Calls Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {calls.map((call) => (
          <div 
            key={call.id}
            className="card-shell"
            style={{ 
              padding: '18px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              gap: '20px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{call.id}</span>
                <span className="badge badge-rose">{call.type}</span>
                <span className="badge badge-zinc">{call.postal}</span>
                <span className={call.status === 'ON_SCENE' ? 'badge badge-emerald' : call.status === 'EN_ROUTE' ? 'badge badge-amber' : 'badge badge-zinc'}>
                  {call.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: 1.5 }}>
                {call.details}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Caller: <strong style={{ color: 'var(--text-secondary)' }}>{call.caller}</strong></span>
                {call.units.length > 0 && (
                  <span>Assigned Units: <strong style={{ color: 'var(--civ-blue-light)' }}>{call.units.join(', ')}</strong></span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => assignUnit(call.id)} 
                className="btn-secondary font-mono"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                + ASSIGN UNIT
              </button>
              <button 
                onClick={() => resolveCall(call.id)} 
                className="btn-secondary font-mono"
                style={{ fontSize: '12px', padding: '6px 12px', color: '#10b981' }}
              >
                RESOLVE SCENE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
