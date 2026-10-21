import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ExternalLink } from 'lucide-react';
import sunsetBg from '@/assets/erlc_sunset.png';
import erlcusLogo from '@/assets/erlcus_logo.png';

export function HomePage() {
  useEffect(() => {
    document.title = 'ERLC.US - Coming Soon';
  }, []);

  // 15 days countdown target
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 19,
    minutes: 16,
    seconds: 57,
  });

  useEffect(() => {
    // Target date set to 12 days, 19 hours from reference
    const targetDate = new Date(Date.now() + (12 * 86400 + 19 * 3600 + 16 * 60 + 57) * 1000).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      {/* Heavy Blurred Background with Sunset & Water Tower */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat z-0 scale-105 filter blur-3xl opacity-35"
        style={{
          backgroundImage: `url(${sunsetBg})`,
        }}
      />
      <div className="fixed inset-0 bg-[#050608]/85 backdrop-blur-[100px] z-0 pointer-events-none" />

      {/* Top Header Bar: Server / Brand Logo on the side at the top */}
      <header className="relative z-20 w-full px-6 sm:px-12 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={erlcusLogo}
            alt="ERLC.US"
            className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-tight">ERLC.US</span>
            <span className="text-[10px] text-zinc-400 font-mono">Community Platform</span>
          </div>
        </div>

        {/* Direct link to dashboard */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-xs font-semibold text-zinc-200 transition-all active:scale-95 shadow-sm"
        >
          <LayoutGrid className="size-3.5 text-zinc-400" />
          <span>Launch Dashboard</span>
        </Link>
      </header>

      {/* Center Countdown Container (Matching user image 2 exactly) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in-50 duration-500">
          {/* Big Bold Clean Countdown Digits */}
          <div className="grid grid-cols-4 gap-4 sm:gap-10 items-center justify-center">
            {/* Days */}
            <div className="flex flex-col items-center">
              <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight tabular-nums font-sans">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 font-sans lowercase mt-2 tracking-wide">
                days
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight tabular-nums font-sans">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 font-sans lowercase mt-2 tracking-wide">
                hours
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight tabular-nums font-sans">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 font-sans lowercase mt-2 tracking-wide">
                min
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight tabular-nums font-sans">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 font-sans lowercase mt-2 tracking-wide">
                sec
              </span>
            </div>
          </div>

          {/* Subtext matching user specification */}
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
            We&apos;re working hard to bring you exciting new features. See you in 15 days!
          </p>
        </div>
      </main>

      {/* Clean Footer Bar */}
      <footer className="relative z-20 w-full px-6 sm:px-12 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
        <div>
          <span>ERLC.US Systems · Reciprocal Discord Community Growth</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/1530147023754367006/earn" className="hover:text-zinc-300 transition-colors">
            Browse Directory
          </Link>
          <span>·</span>
          <a
            href="/docs"
            className="hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Help & Support</span>
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
