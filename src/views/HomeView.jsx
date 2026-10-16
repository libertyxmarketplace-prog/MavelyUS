import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Boxes, 
  ShieldCheck, 
  Server, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Cpu, 
  Radio, 
  Layers, 
  Sliders,
  Sparkles,
  Zap,
  Clock,
  Shield
} from 'lucide-react';
import { CivLinkLogo } from '../components/CivLinkLogo';
import { TiltedShowcase } from '../components/TiltedShowcase';
import { BeamSearch, NotificationBell } from '../components/ui/beam-search';
import { FlipFadeText } from '../components/ui/flip-fade-text';
import { StatsCounter } from '../components/ui/stats-counter';
import { Faq } from '../components/ui/faq';

export function HomeView({ onEnterDashboard, user, onOpenLegal }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '68px',
          borderBottom: '1px solid #161923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(8, 9, 13, 0.88)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        {/* Left: Brand Logo & Engine Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <CivLinkLogo size={28} showText={true} />
          <span className="badge badge-zinc" style={{ fontSize: '10px' }}>v1.4.2</span>
        </div>

        {/* Center/Right: BeamSearch + Notification UI + Legal Links + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notification UI */}
          <NotificationBell count={1} />

          {/* BeamSearch with Traveling Laser Beam */}
          <BeamSearch 
            placeholder="Search commands, modules..." 
            onSearch={setSearchQuery} 
          />

          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '8px' }}>
            <button 
              onClick={() => onOpenLegal('terms')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#94a3b8', 
                fontSize: '13px', 
                fontWeight: 500,
                cursor: 'pointer', 
                transition: 'color 0.15s' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              Terms of Service
            </button>

            <button 
              onClick={() => onOpenLegal('privacy')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#94a3b8', 
                fontSize: '13px', 
                fontWeight: 500,
                cursor: 'pointer', 
                transition: 'color 0.15s' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              Privacy Policy
            </button>

            {user ? (
              <button onClick={onEnterDashboard} className="btn-primary font-mono" style={{ padding: '7px 16px', fontSize: '12px' }}>
                OPEN DASHBOARD (@{user.username})
                <ArrowRight size={14} />
              </button>
            ) : (
              <a href="/auth/discord/login" className="btn-primary font-mono" style={{ padding: '7px 16px', fontSize: '12px' }}>
                LOGIN WITH DISCORD
                <ArrowRight size={14} />
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        style={{ 
          padding: '80px 24px 60px', 
          maxWidth: '1280px', 
          margin: '0 auto', 
          width: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Subtle, refined atmospheric blue glow (NOT crazy vibe coded) */}
        <div 
          style={{
            position: 'absolute',
            top: '0',
            width: '700px',
            height: '320px',
            background: 'radial-gradient(ellipse at center, rgba(46, 144, 250, 0.09) 0%, transparent 68%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Main Title with FlipFadeText */}
        <h1 
          style={{ 
            fontSize: '56px', 
            fontWeight: 800, 
            letterSpacing: '-0.04em', 
            lineHeight: 1.1, 
            maxWidth: '960px',
            color: '#ffffff',
            margin: '0 0 22px',
            position: 'relative',
            zIndex: 1
          }}
        >
          Build and run your <br />
          <FlipFadeText words={["custom ER:LC bot", "support ticket desk", "live session engine", "staff shift auditor"]} />
        </h1>

        <p 
          style={{ 
            fontSize: '17px', 
            lineHeight: 1.6, 
            color: '#94a3b8', 
            maxWidth: '680px',
            margin: '0 0 36px',
            position: 'relative',
            zIndex: 1 
          }}
        >
          The dedicated no-code bot workshop for Emergency Response: Liberty County. 
          Deploy high-fidelity ticket panels, live in-game server telemetry, and staff management directly into your community Discord.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '50px', position: 'relative', zIndex: 1 }}>
          {user ? (
            <button onClick={onEnterDashboard} className="btn-primary font-mono" style={{ padding: '12px 24px', fontSize: '14px' }}>
              LAUNCH DASHBOARD
              <ArrowRight size={16} />
            </button>
          ) : (
            <a href="/auth/discord/login" className="btn-primary font-mono" style={{ padding: '12px 24px', fontSize: '14px' }}>
              CONNECT WITH DISCORD
              <ArrowRight size={16} />
            </a>
          )}
          <button 
            onClick={onEnterDashboard} 
            className="btn-secondary font-mono" 
            style={{ padding: '12px 22px', fontSize: '14px' }}
          >
            VIEW COMMAND MANAGER
          </button>
        </div>

        {/* 2D/3D Tilted Showcase of Realistic ER:LC Embed Panels from User Reference Images */}
        <div style={{ width: '100%', marginBottom: '60px', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '14px' }}>
            <span className="font-mono text-xs text-[#64748b] tracking-wider uppercase">
              HIGH-FIDELITY EMBED PANELS & DISPATCH MENUS
            </span>
          </div>
          <TiltedShowcase />
        </div>

        {/* Stats Counter Row */}
        <div 
          style={{
            width: '100%',
            maxWidth: '920px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            padding: '24px 28px',
            background: '#0d1017',
            border: '1px solid #1c2233',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
          }}
        >
          <div>
            <div className="text-3xl font-extrabold text-white">
              <StatsCounter target={18} suffix="+" />
            </div>
            <div className="text-xs text-[#64748b] font-medium mt-1">Slash Commands</div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white">
              <StatsCounter target={100} suffix="%" />
            </div>
            <div className="text-xs text-[#64748b] font-medium mt-1">Custom Branding</div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white">
              <StatsCounter target={30} suffix="s" />
            </div>
            <div className="text-xs text-[#64748b] font-medium mt-1">Telemetry Polling Rate</div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white">
              <StatsCounter target={24} suffix="/7" />
            </div>
            <div className="text-xs text-[#64748b] font-medium mt-1">Hosted Cloud Runtime</div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section style={{ borderTop: '1px solid #151824', padding: '80px 24px', background: '#0a0c12' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: '12px', color: '#2E90FA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MODULAR PLATFORM
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '6px' }}>
              Built specifically for modern ER:LC servers.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Server size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>01. Real-Time Overview</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Track live bot uptime, server members, ER:LC player count and queue, CPU/memory diagnostics, and run instant restart routines.
              </p>
            </div>

            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Bot size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>02. Bot Builder Workshop</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Set custom bot names, avatars, activity status, signature colors, and welcome/goodbye embeds with live Diskhook preview.
              </p>
            </div>

            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Terminal size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>03. Command Manager</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Configure individual command permissions, role gates, execution cooldowns, shortcuts/aliases, and custom response templates.
              </p>
            </div>

            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Boxes size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>04. Module Library</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                One-click activation for ER:LC live queries, SSU sessions, staff shift tracking, moderation logs, ticket channels, and in-game command relays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section style={{ borderTop: '1px solid #151824', background: '#080a0e' }}>
        <Faq />
      </section>

      {/* Footer */}
      <footer 
        style={{ 
          marginTop: 'auto', 
          borderTop: '1px solid #141722', 
          padding: '24px 36px', 
          background: '#07080b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CivLinkLogo size={20} showText={true} />
          <span>•</span>
          <span className="font-mono">civlink.xyz</span>
          <span>•</span>
          <span>Dedicated ER:LC Community Infrastructure</span>
        </div>

        <div style={{ display: 'flex', gap: '18px' }}>
          <button 
            onClick={() => onOpenLegal('terms')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Terms of Service
          </button>
          <button 
            onClick={() => onOpenLegal('privacy')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
}
