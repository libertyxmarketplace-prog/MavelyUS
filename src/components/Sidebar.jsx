import React, { useState } from 'react';
import { 
  Home, 
  LayoutGrid, 
  BookOpen, 
  ShieldCheck, 
  Radio, 
  FileText, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { CivLinkIcon } from './CivLinkLogo';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onOpenLegal, 
  user, 
  onOpenAuth 
}) {
  const [hoveredTab, setHoveredTab] = useState(null);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'ssu', label: 'SSU & Server Monitor', icon: LayoutGrid },
    { id: 'penal', label: 'Penal Code & Arrests', icon: BookOpen },
    { id: 'staff', label: 'Staff Audit (Anti-Ghost)', icon: ShieldCheck },
    { id: 'dispatch', label: '911 Dispatch & Radar', icon: Radio },
    { id: 'records', label: 'Audit Records & Logs', icon: FileText },
  ];

  return (
    <aside
      style={{
        width: '68px',
        minWidth: '68px',
        height: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        userSelect: 'none'
      }}
    >
      {/* Brand Icon Header */}
      <div 
        onClick={() => setActiveTab('overview')}
        style={{
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease'
        }}
        title="CivLink — Home"
      >
        <CivLinkIcon size={30} />
      </div>

      {/* Navigation Rail */}
      <nav 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
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
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: isActive ? 'var(--civ-blue-dim)' : isHovered ? 'var(--bg-elevated)' : 'transparent',
                  border: isActive ? '1px solid var(--civ-blue-border)' : '1px solid transparent',
                  color: isActive ? 'var(--civ-blue-light)' : isHovered ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  position: 'relative'
                }}
                aria-label={item.label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />

                {/* Subtle active left indicator bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-12px',
                      width: '3px',
                      height: '24px',
                      background: 'var(--civ-blue)',
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: '68px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#131722',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
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
          gap: '12px'
        }}
      >
        {/* Subtle Horizontal Divider */}
        <div 
          style={{
            width: '32px',
            height: '1px',
            background: 'var(--border-subtle)',
            margin: '4px 0'
          }}
        />

        {/* Documentation / Legal */}
        <button
          onClick={() => onOpenLegal('terms')}
          title="Documentation & Terms"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.15s ease'
          }}
        >
          <MessageSquare size={19} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="API Keys & Server Configuration"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.15s ease'
          }}
        >
          <Settings size={19} />
        </button>

        {/* User Avatar with Green Online Status Dot (Replicating Image 2) */}
        <div 
          onClick={onOpenAuth}
          title={user?.username ? `@${user.username} (Connected)` : "Connect Discord Account"}
          style={{
            position: 'relative',
            cursor: 'pointer',
            marginTop: '4px'
          }}
        >
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80"}
            alt="User profile"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #1a2233',
              display: 'block'
            }}
          />
          {/* Online green indicator dot */}
          <span
            style={{
              position: 'absolute',
              bottom: '0px',
              right: '0px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid var(--bg-sidebar)'
            }}
          />
        </div>
      </div>
    </aside>
  );
}
