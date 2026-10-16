import React, { useState, useRef } from 'react';

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
    tag: 'PORTAL',
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
    tag: 'AUDIT',
    image: '/embeds/promotion-notice.png'
  }
];

export function TiltedShowcase() {
  const [activeId, setActiveId] = useState('support');
  const [rotate, setRotate] = useState({ x: 5, y: -7 });
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

    const rotX = ((y - centerY) / centerY) * -8;
    const rotY = ((x - centerX) / centerX) * 10;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 5, y: -7 });
  };

  return (
    <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {/* Panel Switcher Selector — ZERO GLOW, clean matte buttons */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                borderRadius: '7px',
                transition: 'all 0.15s ease',
                background: isActive ? '#1c202a' : 'transparent',
                color: isActive ? '#ffffff' : '#71717a',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid transparent',
                boxShadow: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#d4d4d8';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#71717a';
              }}
            >
              <span>{card.name}</span>
              {isActive && (
                <span 
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: 600, 
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    color: '#a1a1aa',
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

      {/* 2D/3D Tilted Perspective Canvas — ZERO GLOW, realistic depth */}
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
            transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.01 : 1})`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transformStyle: 'preserve-3d',
            borderRadius: '14px',
            padding: '6px',
            background: '#12141a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            cursor: 'default',
            userSelect: 'none'
          }}
        >
          {/* Actual Discord Embed Image */}
          <div 
            style={{ 
              borderRadius: '10px', 
              overflow: 'hidden', 
              background: '#2b2d31'
            }}
          >
            <img
              src={activeCard.image}
              alt={activeCard.name}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '10px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Visual Thumbnail Strip — ZERO GLOW */}
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
                border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                background: '#0d0f14',
                padding: '2px',
                transition: 'all 0.15s ease',
                boxShadow: 'none',
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                cursor: 'pointer',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.opacity = '0.6';
              }}
            >
              <img
                src={card.image}
                alt={card.name}
                style={{
                  width: '100%',
                  height: '46px',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                  borderRadius: '5px'
                }}
              />
              <div 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 500, 
                  color: isActive ? '#ffffff' : '#71717a', 
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

export default TiltedShowcase;
