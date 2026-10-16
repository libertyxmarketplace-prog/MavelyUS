import React, { useState, useRef } from 'react';

const EMBED_CARDS = [
  {
    id: 'support',
    name: 'Support Desk',
    image: '/embeds/orlando-support.png'
  },
  {
    id: 'assistance',
    name: 'Assistance',
    image: '/embeds/alabama-assistance.png'
  },
  {
    id: 'applications',
    name: 'Applications',
    image: '/embeds/staff-applications.png'
  },
  {
    id: 'promotion',
    name: 'Promotions',
    image: '/embeds/promotion-notice.png'
  }
];

export function TiltedShowcase() {
  const [activeId, setActiveId] = useState('support');
  const [rotate, setRotate] = useState({ x: 4, y: -6 });
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

    const rotX = ((y - centerY) / centerY) * -7;
    const rotY = ((x - centerX) / centerX) * 9;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 4, y: -6 });
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      
      {/* 4 Clean Tabs in a Single Horizontal Row (Zero wrap, zero glow) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] select-none">
        {EMBED_CARDS.map((card) => {
          const isActive = card.id === activeId;
          return (
            <button
              key={card.id}
              onClick={() => setActiveId(card.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer outline-none border ${
                isActive 
                  ? 'bg-white/[0.12] text-white border-white/20 shadow-sm' 
                  : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              {card.name}
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
          justifyContent: 'center'
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
            maxWidth: '520px',
            transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.015 : 1})`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transformStyle: 'preserve-3d',
            borderRadius: '16px',
            padding: '6px',
            background: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            userSelect: 'none'
          }}
        >
          {/* Actual Discord Embed Image — 100% Fidelity */}
          <div className="rounded-xl overflow-hidden bg-[#2b2d31]">
            <img
              src={activeCard.image}
              alt={activeCard.name}
              className="w-full h-auto block rounded-xl"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

export default TiltedShowcase;
