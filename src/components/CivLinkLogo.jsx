import React from 'react';

export function CivLinkIcon({ size = 28, className = "", glow = true }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 36 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: glow ? 'drop-shadow(0 0 6px rgba(56, 161, 255, 0.75)) drop-shadow(0 0 14px rgba(46, 144, 250, 0.45))' : 'none'
      }}
    >
      {/* Outer Circuit Bracket 'E' */}
      <path 
        d="M 27 9 H 14 C 9.58 9 6 12.58 6 17 V 19 C 6 23.42 9.58 27 14 27 H 27" 
        stroke="#38A1FF" 
        strokeWidth="3.4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Inner Node Line */}
      <path 
        d="M 10 18 H 19.5" 
        stroke="#38A1FF" 
        strokeWidth="3.4" 
        strokeLinecap="round"
      />
      {/* Circuit Terminal Node */}
      <circle cx="22.5" cy="18" r="2.8" fill="#38A1FF" />
    </svg>
  );
}

export function CivLinkLogo({ size = 32, showText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <CivLinkIcon size={size} />
      {showText && (
        <span 
          style={{ 
            fontFamily: 'var(--font-sans)', 
            fontWeight: 800, 
            fontSize: `${size * 0.72}px`, 
            letterSpacing: '-0.03em',
            color: '#38A1FF',
            textShadow: '0 0 16px rgba(56, 161, 255, 0.4)'
          }}
        >
          CivLink
        </span>
      )}
    </div>
  );
}

export default CivLinkIcon;
