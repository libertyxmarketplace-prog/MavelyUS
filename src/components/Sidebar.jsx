import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Terminal, 
  Boxes, 
  Settings, 
  FileText,
  Home,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { CivLinkIcon } from './CivLinkLogo';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onOpenLegal, 
  user,
  onGoHome 
}) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'overview', label: '01. Overview', icon: LayoutDashboard },
    { id: 'builder', label: '02. Bot Builder', icon: Bot },
    { id: 'commands', label: '03. Command Manager', icon: Terminal },
    { id: 'marketplace', label: '04. Module Library', icon: Boxes },
  ];

  return (
    <aside
      style={{
        width: '54px',
        minWidth: '54px',
        height: '100vh',
        background: '#090a0f',
        borderRight: '1px solid #1a1e29',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        userSelect: 'none'
      }}
    >
      {/* Top Logo - takes back to Home landing page or Overview */}
      <div 
        onClick={onGoHome}
        style={{
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.15s ease'
        }}
        title="CivLink — Home"
      >
        <CivLinkIcon size={24} />
      </div>

      {/* Main Navigation Rail */}
      <nav 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          width: '100%',
          flex: 1
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredTab === item.id;

          return (
            <div
              key={item.id}
              style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  /* Clean monochrome active state - NOT BLUE */
                  background: isActive ? '#20242f' : isHovered ? '#141720' : 'transparent',
                  border: isActive ? '1px solid #2d3345' : '1px solid transparent',
                  color: isActive ? '#ffffff' : isHovered ? '#d1d5db' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  outline: 'none',
                  position: 'relative'
                }}
                aria-label={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.1 : 1.7} />

                {/* Subtle neutral indicator bar on left - NOT BLUE */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-8px',
                      width: '3px',
                      height: '20px',
                      background: '#94a3b8',
                      borderRadius: '0 3px 3px 0'
                    }}
                  />
                )}
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: '54px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#141722',
                    border: '1px solid #23293a',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 10px',
                    borderRadius: '5px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    zIndex: 50
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div 
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div 
          style={{
            width: '28px',
            height: '1px',
            background: '#191d28',
            margin: '2px 0'
          }}
        />

        {/* Home link */}
        <button
          onClick={onGoHome}
          title="Return to Website Home"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.12s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <Home size={18} />
        </button>

        {/* Legal / Docs */}
        <button
          onClick={() => onOpenLegal('terms')}
          title="Terms & Privacy"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.12s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <FileText size={18} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Bot Tokens & Keys"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.12s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <Settings size={18} />
        </button>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative', marginTop: '2px' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user ? `@${user.username}` : "Not logged in"}
            style={{
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #2d3345',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#191d28',
                  border: '1px solid #2d3345',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {user?.username ? user.username.slice(0, 2).toUpperCase() : '?'}
              </div>
            )}

            {/* Online indicator dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: user ? '#10b981' : '#64748b',
                border: '1.5px solid #090a0f'
              }}
            />
          </div>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                left: '48px',
                bottom: '0',
                background: '#10131c',
                border: '1px solid #23293a',
                borderRadius: '8px',
                padding: '12px',
                width: '180px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {user?.displayName || user?.username || 'Guest'}
                </div>
                <div className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>
                  {user ? `@${user.username}` : 'Not connected'}
                </div>
              </div>

              <div style={{ height: '1px', background: '#1c2232', margin: '2px 0' }} />

              {user ? (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    fetch('/auth/logout', { method: 'POST' }).then(() => window.location.reload());
                  }}
                  className="btn-danger"
                  style={{ width: '100%', fontSize: '11px', padding: '6px 10px' }}
                >
                  <LogOut size={13} />
                  LOG OUT
                </button>
              ) : (
                <a
                  href="/auth/discord/login"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '11px', padding: '6px 10px' }}
                >
                  LOG IN WITH DISCORD
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
