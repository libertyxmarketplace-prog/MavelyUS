import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellRing, Sparkles, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComingSoonTabProps {
  title: string;
  subtitle?: string;
  category?: string;
  features?: string[];
  onBackToOverview: () => void;
  addToast?: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function ComingSoonTab({
  title,
  subtitle = 'Live Emergency Response: Liberty County in-game patrol tracking, voice radio frequencies, and CAD server integration.',
  category = 'ER:LC Operations',
  features = [
    'Automated in-game patrol start/end logging and duty time tracking',
    'Live radio channel voice link and dispatcher status',
    'Server player activity and duty-time leaderboards'
  ],
  onBackToOverview,
  addToast
}: ComingSoonTabProps) {
  // Target date set to 14 days, 18 hours, 41 mins, 18 secs from now
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 18,
    minutes: 41,
    seconds: 18
  });

  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const targetDate = new Date(Date.now() + (14 * 86400 + 18 * 3600 + 41 * 60 + 18) * 1000).getTime();

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

  const handleNotifyToggle = () => {
    setSubscribed(!subscribed);
    if (!subscribed) {
      addToast?.('success', 'Launch Notification Set', `You will receive a notification when ${title} launches.`);
    } else {
      addToast?.('info', 'Notification Removed', 'Notification preference cleared.');
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto py-8 sm:py-16 px-4 animate-in fade-in-50 duration-300">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToOverview}
          className="h-8 border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs gap-1.5 transition-all"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Overview</span>
        </Button>
      </div>

      {/* Main Content: NO heavy card/embed box, ultra-clean futuristic layout */}
      <div className="text-center space-y-8 relative">
        {/* Subtle atmospheric ambient glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        {/* Category Pill */}
        <div className="flex items-center justify-center">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px] px-3.5 py-1 tracking-wider uppercase flex items-center gap-2 rounded-full"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{category.toUpperCase()} · COMING SOON</span>
          </Badge>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {subtitle}
          </p>
        </div>

        {/* Clean Glowing Floating Countdown (NO heavy box embed) */}
        <div className="grid grid-cols-4 gap-3 sm:gap-5 py-4 max-w-md mx-auto items-center">
          {/* Days */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums font-mono">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono lowercase mt-1">
              days
            </span>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono lowercase mt-1">
              hours
            </span>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono lowercase mt-1">
              min
            </span>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 tracking-tight tabular-nums font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-emerald-400/80 font-mono lowercase mt-1">
              sec
            </span>
          </div>
        </div>

        {/* What to expect on launch feature list */}
        {features.length > 0 && (
          <div className="max-w-md mx-auto text-left pt-2 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              What to expect on launch:
            </span>
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Sparkles className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleNotifyToggle}
            className={`h-11 px-6 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 ${
              subscribed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-950 font-bold'
            }`}
          >
            {subscribed ? <BellRing className="size-4" /> : <Bell className="size-4" />}
            <span>{subscribed ? 'Notification Active' : 'Notify Me on Release'}</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onBackToOverview}
            className="h-11 px-6 rounded-xl text-xs font-medium border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 flex items-center gap-2"
          >
            <Compass className="size-4 text-emerald-400" />
            <span>Explore Growth Directory</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ComingSoonTab;
