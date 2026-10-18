import React from 'react';
import { renderTemplate } from '../../shared/catalog.js';

export function DiscordEmbedPreview({
  botUser = null,
  style = {},
  title = '',
  description = '',
  fields = [],
  footerText = '',
  footerIcon = '',
  thumbnail = '',
  image = '',
  timestamp = true,
  vars = {},
  customColor = null
}) {
  const color = customColor || style.color || '#2E90FA';
  const botName = botUser?.username || 'CivLink Bot';
  const botAvatar = botUser?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const renderedTitle = renderTemplate(title, vars);
  const renderedDesc = renderTemplate(description, vars);
  const renderedFooter = renderTemplate(footerText || style.footerText, vars);

  return (
    <div 
      style={{
        background: '#313338',
        borderRadius: '8px',
        padding: '16px',
        color: '#dbdee1',
        fontFamily: "'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '14px',
        lineHeight: '1.375',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        border: '1px solid #232428'
      }}
    >
      {/* Bot message header in Discord */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <img 
          src={botAvatar} 
          alt={botName} 
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontWeight: 600, color: '#f2f3f5', fontSize: '15px' }}>{botName}</span>
          <span 
            style={{ 
              background: '#5865f2', 
              color: '#ffffff', 
              fontSize: '10px', 
              fontWeight: 700, 
              padding: '1px 4px', 
              borderRadius: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            APP
          </span>
          <span style={{ fontSize: '11px', color: '#949ba4', marginLeft: '4px' }}>
            Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Embedded message box */}
      <div style={{ marginLeft: '52px', maxWidth: '520px' }}>
        <div 
          style={{
            background: '#2b2d31',
            borderLeft: `4px solid ${color}`,
            borderRadius: '4px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative'
          }}
        >
          {/* Top thumbnail if present */}
          {thumbnail && (
            <img 
              src={thumbnail} 
              alt="Thumbnail" 
              style={{ position: 'absolute', top: '12px', right: '16px', width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} 
            />
          )}

          {/* Embed Title */}
          {renderedTitle && (
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff', paddingRight: thumbnail ? '70px' : '0' }}>
              {renderedTitle}
            </div>
          )}

          {/* Embed Description */}
          {renderedDesc && (
            <div 
              style={{ 
                fontSize: '13px', 
                color: '#dbdee1', 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.45,
                paddingRight: thumbnail ? '70px' : '0' 
              }}
            >
              {renderedDesc}
            </div>
          )}

          {/* Embed Fields */}
          {fields && fields.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '4px' }}>
              {fields.map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f2f3f5' }}>{f.name}</div>
                  <div style={{ fontSize: '12px', color: '#dbdee1', marginTop: '2px' }}>{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Big embed image */}
          {image && (
            <img 
              src={image} 
              alt="Attachment" 
              style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '4px', marginTop: '6px' }} 
            />
          )}

          {/* Embed Footer */}
          {(renderedFooter || timestamp) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px', color: '#949ba4' }}>
              {footerIcon && (
                <img src={footerIcon} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
              )}
              {renderedFooter && <span>{renderedFooter}</span>}
              {renderedFooter && timestamp && <span>•</span>}
              {timestamp && <span>Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
