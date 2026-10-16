import React, { useState, useRef } from 'react';
import { Search, X, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BeamSearch({
  placeholder = "Search commands, modules, guides...",
  onSearch,
  className
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    setValue("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full max-w-[340px]", className)}>
      {/* Outer Search Container */}
      <div 
        className={cn(
          "relative flex h-10 w-full items-center gap-2.5 rounded-lg border bg-[#0d1017] px-3 transition-all duration-200",
          focused 
            ? "border-[#2E90FA]/60 bg-[#10141f] shadow-[0_0_15px_rgba(46,144,250,0.18)]" 
            : "border-[#1e2433] hover:border-[#2a3449]"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[#64748b]" />
        
        <input
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            onSearch?.(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#f8fafc] outline-none placeholder:text-[#64748b]"
        />

        {value ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={handleClear}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[#64748b] hover:bg-[#1a202c] hover:text-[#e2e8f0]"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="rounded border border-[#1e2538] bg-[#141824] px-1.5 py-0.5 font-mono text-[10px] text-[#64748b]">
            ⌘K
          </kbd>
        )}

        {/* Traveling Beam line along bottom edge when focused or active */}
        {focused && (
          <div 
            style={{
              position: 'absolute',
              bottom: '-1px',
              left: 0,
              right: 0,
              height: '2px',
              borderRadius: '0 0 8px 8px',
              background: 'linear-gradient(90deg, transparent, #2E90FA, #38bdf8, #60a5fa, transparent)',
              animation: 'beamTravel 2.4s linear infinite',
              filter: 'drop-shadow(0 0 6px rgba(46,144,250,0.8))'
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes beamTravel {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
}

export function NotificationBell({ count = 1 }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e2433] bg-[#0d1017] text-[#94a3b8] transition-all hover:border-[#2a3449] hover:text-white"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2E90FA] text-[9px] font-bold text-white shadow-[0_0_8px_rgba(46,144,250,0.8)]">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-lg border border-[#22293b] bg-[#10131c] p-3 shadow-2xl z-50 text-left"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1c2232] mb-2">
            <span className="text-xs font-semibold uppercase font-mono text-[#94a3b8]">System Alerts</span>
            <span className="text-[10px] text-[#10b981]">Engine v1.4.2</span>
          </div>
          <div className="text-xs text-[#cbd5e1] leading-relaxed">
            🟢 Discord OAuth2 client secret configured. Ready to authenticate server administrators.
          </div>
        </div>
      )}
    </div>
  );
}
