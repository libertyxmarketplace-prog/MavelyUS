import React from 'react';
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
  Sliders 
} from 'lucide-react';
import { CivLinkLogo } from '../components/CivLinkLogo';
import { DiscordEmbedPreview } from '../components/DiscordEmbedPreview';

export function HomeView({ onEnterDashboard, user, onOpenLegal }) {
  const previewVars = {
    server: 'Liberty County State RP',
    players: '28',
    maxPlayers: '35',
    queue: '3',
    joinKey: 'liberty-702',
    name: 'Liberty County State RP'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid #161923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          background: 'rgba(8, 9, 13, 0.85)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <CivLinkLogo size={28} showText={true} />
          <span className="badge badge-zinc" style={{ fontSize: '10px' }}>ENGINE v1.4</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => onOpenLegal('terms')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Terms of Service
          </button>
          <button 
            onClick={() => onOpenLegal('privacy')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
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
      </header>

      {/* Hero Section (Inspired by greed.best / vex.cat aesthetics) */}
      <section 
        style={{ 
          padding: '90px 24px 60px', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          width: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Subtle top spotlight effect */}
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            width: '600px',
            height: '240px',
            background: 'radial-gradient(ellipse at center, rgba(46, 144, 250, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#121520', border: '1px solid #1f2536', borderRadius: '4px', marginBottom: '24px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em' }}>
            CUSTOM DISCORD BOT BUILDER FOR ROBLOX ER:LC
          </span>
        </div>

        <h1 
          style={{ 
            fontSize: '52px', 
            fontWeight: 800, 
            letterSpacing: '-0.035em', 
            lineHeight: 1.12, 
            maxWidth: '920px',
            color: '#ffffff',
            margin: '0 0 20px'
          }}
        >
          Build and run your own custom <span style={{ color: '#2E90FA' }}>ER:LC Discord bot</span>.
        </h1>

        <p 
          style={{ 
            fontSize: '17px', 
            lineHeight: 1.6, 
            color: '#94a3b8', 
            maxWidth: '680px',
            margin: '0 0 36px' 
          }}
        >
          A no-code bot workshop designed for Emergency Response: Liberty County server owners. 
          Manage slash commands, live in-game server data, shift logs, and custom embed styles from one clean control panel.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px' }}>
          {user ? (
            <button onClick={onEnterDashboard} className="btn-primary font-mono" style={{ padding: '12px 24px', fontSize: '14px' }}>
              GO TO BOT DASHBOARD
              <ArrowRight size={16} />
            </button>
          ) : (
            <a href="/auth/discord/login" className="btn-primary font-mono" style={{ padding: '12px 24px', fontSize: '14px' }}>
              CONNECT DISCORD & BUILD BOT
              <ArrowRight size={16} />
            </a>
          )}
          <button 
            onClick={onEnterDashboard} 
            className="btn-secondary font-mono" 
            style={{ padding: '12px 22px', fontSize: '14px' }}
          >
            EXPLORE MODULES & COMMANDS
          </button>
        </div>

        {/* Live Interactive Embed Demonstration */}
        <div style={{ width: '100%', maxWidth: '720px', textAlign: 'left', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
            <span className="font-mono" style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Diskhook Embed Engine Preview
            </span>
            <span className="badge badge-emerald">OUTPUT /SERVER</span>
          </div>
          <DiscordEmbedPreview 
            title="{name}"
            description="**{players}/{maxPlayers}** players in game, **{queue}** waiting in queue.
Join code: **{joinKey}**"
            vars={previewVars}
            style={{ color: '#2E90FA', footerText: 'CivLink Real-Time Telemetry' }}
            botUser={{ username: 'CivLink Assistant' }}
          />
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section style={{ borderTop: '1px solid #151824', padding: '80px 24px', background: '#0a0c12' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: '12px', color: '#2E90FA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ENGINE CAPABILITIES
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '6px' }}>
              Everything your ER:LC community needs in one bot.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {/* Pillar 1 */}
            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Server size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>01. Real-Time Overview</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Track live bot uptime, Discord guild member count, ER:LC in-game server players, queue counts, host CPU/memory, and run instant diagnostic checks.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Bot size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>02. Bot Builder</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Customize your bot's name, avatar, presence status, embed theme colors, and welcome/goodbye messages with live Diskhook-grade previews.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Terminal size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>03. Command Manager</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Toggle individual slash commands, restrict by channels or staff roles, configure custom cooldowns, rewrite response templates, and track execution stats.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="card-shell" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#161a26', border: '1px solid #232a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E90FA' }}>
                <Boxes size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>04. Module Library</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>
                Install and configure individual functional modules in one click: ER:LC telemetry, sessions & SSU voting, staff shifts, moderation logs, tickets, and log relays.
              </p>
            </div>
          </div>
        </div>
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

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => onOpenLegal('terms')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            Terms of Service
          </button>
          <button onClick={() => onOpenLegal('privacy')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
}
