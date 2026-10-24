import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function BannedPage() {
  const [banDetails, setBanDetails] = useState<{ reason: string; date: string }>(() => {
    try {
      const stored = localStorage.getItem('erlcus_current_user_ban');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      reason: 'Administrative restriction applied due to policy or telemetry violation.',
      date: new Date().toLocaleDateString(),
    };
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12 select-none">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto animate-in fade-in-50 duration-300">
        {/* Massive 403 Headline */}
        <h1 className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tight text-white leading-none">
          403
        </h1>

        {/* Clean Subtitle & Description */}
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-6">
          Account Suspended
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed max-w-md">
          Your account has been restricted from accessing the Mavely platform by a network administrator.
        </p>

        {/* Ban Details Pill */}
        <div className="mt-6 px-4 py-3 rounded-2xl bg-[#121214] border border-white/[0.08] text-left w-full space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <ShieldAlert className="size-3.5" />
            <span>Administrative Notice</span>
          </div>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed">
            {banDetails.reason}
          </p>
          <span className="text-[10px] text-zinc-500 font-mono block pt-1">
            Enforced on: {banDetails.date}
          </span>
        </div>

        {/* Pill Buttons */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            Go home
          </Link>
          <a
            href="https://discord.gg/invite"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#18181b] text-white border border-zinc-800 font-semibold text-xs sm:text-sm hover:bg-zinc-800 transition-all active:scale-95"
          >
            Appeal suspension
          </a>
        </div>
      </div>
    </div>
  );
}

export default BannedPage;
