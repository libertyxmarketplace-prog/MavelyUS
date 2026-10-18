import React from 'react';

interface DiscordMarkdownProps {
  content: string;
  className?: string;
}

export function DiscordMarkdown({ content, className = '' }: DiscordMarkdownProps) {
  if (!content) return null;

  // Split content by line
  const lines = content.split('\n');

  return (
    <div className={`space-y-1 text-[13px] leading-relaxed text-[#dbdee1] ${className}`}>
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return (
            <h5 key={idx} className="font-bold text-xs text-white mt-1.5 mb-0.5">
              {renderInline(line.slice(4))}
            </h5>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h4 key={idx} className="font-bold text-[14px] text-white mt-2 mb-0.5">
              {renderInline(line.slice(3))}
            </h4>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-bold text-[16px] text-white mt-2 mb-1">
              {renderInline(line.slice(2))}
            </h3>
          );
        }
        // Subtext (-# text)
        if (line.startsWith('-# ')) {
          return (
            <p key={idx} className="text-[11px] text-[#949ba4] my-0.5">
              {renderInline(line.slice(3))}
            </p>
          );
        }
        // Blockquote (> text)
        if (line.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-[3px] border-[#4e5058] pl-2.5 my-1 text-[#b5bac1]">
              {renderInline(line.slice(2))}
            </div>
          );
        }
        // Empty line
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        // Regular paragraph with inline markdown
        return (
          <p key={idx} className="my-0.5">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Parse inline elements: bold (**), italics (*), underline (__), strikethrough (~~), code (`)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  const patterns = [
    { regex: /^\*\*(.+?)\*\*/, render: (m: string) => <strong key={keyCounter++} className="font-bold text-white">{renderInline(m)}</strong> },
    { regex: /^\*(.+?)\*/, render: (m: string) => <em key={keyCounter++} className="italic text-[#e0e1e5]">{renderInline(m)}</em> },
    { regex: /^__(.+?)__/, render: (m: string) => <u key={keyCounter++} className="underline text-[#e0e1e5]">{renderInline(m)}</u> },
    { regex: /^~~(.+?)~~/, render: (m: string) => <del key={keyCounter++} className="line-through text-zinc-500">{renderInline(m)}</del> },
    { regex: /^`([^`]+)`/, render: (m: string) => <code key={keyCounter++} className="bg-[#1e1f22] text-[#e0e1e5] text-[12px] px-1 py-0.5 rounded font-mono border border-white/5">{m}</code> },
    { regex: /^\[([^\]]+)\]\(([^)]+)\)/, render: (label: string, url?: string) => <a key={keyCounter++} href={url} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">{label}</a> }
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const p of patterns) {
      const match = remaining.match(p.regex);
      if (match) {
        matched = true;
        if (p.regex.source.includes('\\[')) {
          parts.push(p.render(match[1], match[2]));
        } else {
          parts.push(p.render(match[1]));
        }
        remaining = remaining.slice(match[0].length);
        break;
      }
    }

    if (!matched) {
      // Find index of next markdown character
      const nextSpecial = remaining.search(/[\*_~`\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special character didn't match pattern, push it literally
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
  }

  return parts;
}
