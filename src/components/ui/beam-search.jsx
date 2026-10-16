import React, { useState, useRef } from 'react';
import { Search, X, Bell } from 'lucide-react';

export function BeamSearch({
  placeholder = "Search commands, modules...",
  onSearch,
  className = ""
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    setValue("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  return (
    <div 
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '260px'
      }}
    >
      {/* Outer Search Box */}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          height: '38px',
          width: '100%',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '8px',
          border: focused ? '1px solid rgba(46, 144, 250, 0.6)' : '1px solid #1e2433',
          background: focused ? '#10141f' : '#0d1017',
          padding: '0 10px',
          boxShadow: focused ? '0 0 16px rgba(46, 144, 250, 0.2)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <Search size={15} style={{ color: '#64748b', flexShrink: 0 }} />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            onSearch?.(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            color: '#f8fafc',
            fontFamily: 'inherit'
          }}
        />

        {value ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={handleClear}
            style={{
              display: 'flex',
              height: '18px',
              width: '18px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#1a202c',
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={11} />
          </button>
        ) : (
          <kbd 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '4px',
              border: '1px solid #1e2538',
              background: '#141824',
              padding: '2px 5px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#64748b',
              userSelect: 'none'
            }}
          >
            ⌘K
          </kbd>
        )}

        {/* Traveling Laser Beam on bottom edge */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: 0,
            right: 0,
            height: '2px',
            borderRadius: '0 0 8px 8px',
            background: focused 
              ? 'linear-gradient(90deg, transparent, #2E90FA, #38bdf8, #60a5fa, transparent)' 
              : 'linear-gradient(90deg, transparent, rgba(46,144,250,0.4), transparent)',
            backgroundSize: '200% 100%',
            animation: 'beamTravel 2.4s linear infinite',
            filter: focused ? 'drop-shadow(0 0 6px rgba(46,144,250,0.8))' : 'none'
          }}
        />
      </div>

      <style>{`
        @keyframes beamTravel {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function NotificationBell({ count = 1 }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          display: 'flex',
          height: '38px',
          width: '38px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #1e2433',
          background: '#0d1017',
          color: '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2a3449';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1e2433';
          e.currentTarget.style.color = '#94a3b8';
        }}
        title="Notifications"
      >
        <Bell size={16} />
        {count > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              display: 'flex',
              height: '16px',
              minWidth: '16px',
              padding: '0 4px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: '#2E90FA',
              fontSize: '9px',
              fontWeight: 700,
              color: '#ffffff',
              boxShadow: '0 0 8px rgba(46,144,250,0.8)'
            }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div 
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '8px',
            width: '280px',
            borderRadius: '10px',
            border: '1px solid #22293b',
            background: '#10131c',
            padding: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            zIndex: 60,
            textAlign: 'left'
          }}
          onClick={() => setOpen(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c2232', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'monospace', color: '#94a3b8' }}>
              System Alerts
            </span>
            <span style={{ fontSize: '10px', color: '#10b981' }}>Engine v1.4.2</span>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            🟢 Discord OAuth2 client secret configured. Ready to authenticate server administrators.
          </div>
        </div>
      )}
    </div>
  );
}
