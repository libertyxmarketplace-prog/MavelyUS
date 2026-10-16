import React, { useState, useRef } from 'react';
import { Layers, Sparkles, ExternalLink, ChevronRight } from 'lucide-react';

const EMBED_CARDS = [
  {
    id: 'support',
    name: 'Orlando Support',
    subtitle: 'Ticket Desk & Moderation Policy',
    tag: 'TICKETING',
    image: '/embeds/orlando-support.png'
  },
  {
    id: 'assistance',
    name: 'Alabama Assistance',
    subtitle: 'Live Dropdown Category Portal',
    tag: 'SUPPORT PORTAL',
    image: '/embeds/alabama-assistance.png'
  },
  {
    id: 'applications',
    name: 'Staff Applications',
    subtitle: 'Department Recruiting & Anti-AI Policy',
    tag: 'APPLICATIONS',
    image: '/embeds/staff-applications.png'
  },
  {
    id: 'promotion',
    name: 'Promotion Notice',
    subtitle: 'Official Rank Commendation Dispatch',
    tag: 'LOGGING & AUDIT',
    image: '/embeds/promotion-notice.png'
  }
];

export function TiltedShowcase() {
  const [activeId, setActiveId] = useState('support');
  const [rotate, setRotate] = useState({ x: 5, y: -8 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const activeCard = EMBED_CARDS.find((c) => c.id === activeId) || EMBED_CARDS[0];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt angles based on mouse
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 12;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth return to subtle natural 3D tilt
    setRotate({ x: 5, y: -7 });
  };

  return (
    <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {/* Panel Switcher Selector */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px',
          background: '#0a0d14',
          border: '1px solid #1a2030',
          borderRadius: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {EMBED_CARDS.map((card) => {
          const isActive = card.id === activeId;
          return (
            <button
              key={card.id}
              onClick={() => setActiveId(card.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                borderRadius: '7px',
                transition: 'all 0.18s ease',
                background: isActive ? '#141c2c' : 'transparent',
                color: isActive ? '#38bdf8' : '#64748b',
                border: isActive ? '1px solid #2b3b58' : '1px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(46, 144, 250, 0.2)' : 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#64748b';
              }}
            >
              <span>{card.name}</span>
              {isActive && (
                <span 
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: 700, 
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    background: 'rgba(56, 189, 248, 0.15)', 
                    color: '#38bdf8',
                    letterSpacing: '0.04em'
                  }}
                >
                  {card.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2D/3D Tilted Perspective Canvas */}
      <div
        style={{
          perspective: '1200px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 0 20px'
        }}
      >
        <div
          ref={cardRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.02 : 1})`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.45s ease',
            transformStyle: 'preserve-3d',
            borderRadius: '16px',
            padding: '8px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: isHovered
              ? '0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 45px rgba(46, 144, 250, 0.28)'
              : '0 25px 50px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(46, 144, 250, 0.16)',
            cursor: 'default',
            userSelect: 'none'
          }}
        >
          {/* Subtle Ambient Light Ring */}
          <div 
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, transparent 50%, rgba(30, 58, 138, 0.2) 100%)',
              zIndex: -1,
              filter: 'blur(8px)',
              pointerEvents: 'none'
            }}
          />

          {/* Actual Discord Embed Image — Clean, 100% Fidelity, No Mock HTML */}
          <div 
            style={{ 
              borderRadius: '12px', 
              overflow: 'hidden', 
              background: '#2b2d31',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <img
              src={activeCard.image}
              alt={activeCard.name}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '12px'
              }}
            />
          </div>

          {/* Dynamic Light Sheen overlay on hover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '16px',
              pointerEvents: 'none',
              background: 'linear-gradient(115deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(255,255,255,0.02) 100%)',
              mixBlendMode: 'overlay'
            }}
          />
        </div>
      </div>

      {/* Quick Visual Thumbnail Strip */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '560px'
        }}
      >
        {EMBED_CARDS.map((card) => {
          const isActive = card.id === activeId;
          return (
            <button
              key={card.id}
              onClick={() => setActiveId(card.id)}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: isActive ? '2px solid #38bdf8' : '1px solid #1e2433',
                background: '#0f1219',
                padding: '2px',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                opacity: isActive ? 1 : 0.65,
                transform: isActive ? 'scale(1.03)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.opacity = '0.65';
              }}
            >
              <img
                src={card.image}
                alt={card.name}
                style={{
                  width: '100%',
                  height: '48px',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                  borderRadius: '5px'
                }}
              />
              <div 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isActive ? '#38bdf8' : '#94a3b8', 
                  padding: '4px 2px 2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {card.name.replace('Orlando ', '').replace('Alabama ', '').replace('Staff ', '')}
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
