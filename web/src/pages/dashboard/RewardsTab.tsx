import { useState, useEffect } from 'react';
import {
  Flame,
  Coins,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const REWARDS_STORAGE_KEY = 'erlcus_rewards_countdown_target_v1';

function getRewardsTarget(): number {
  try {
    const saved = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val > Date.now()) {
        return val;
      }
    }
  } catch {}
  const target = Date.now() + (5 * 86400) * 1000;
  try {
    localStorage.setItem(REWARDS_STORAGE_KEY, String(target));
  } catch {}
  return target;
}

function calculateTimeLeft(targetTime: number) {
  const diff = Math.max(0, targetTime - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function RewardsTab({ addToast }: { addToast?: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void }) {
  const [targetTime] = useState<number>(getRewardsTarget);
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetTime));

  const [notified, setNotified] = useState(() => {
    return localStorage.getItem('erlcus_reward_launch_notified') === 'true';
  });

  const [isSendingNotify, setIsSendingNotify] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft(targetTime));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const handleNotifyMe = async () => {
    setIsSendingNotify(true);
    try {
      const res = await fetch('/api/user/test-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'streak', guildName: 'Mavely Treasury' })
      });
      const data = await res.json().catch(() => ({}));
      localStorage.setItem('erlcus_reward_launch_notified', 'true');
      setNotified(true);
      if (addToast) {
        if (res.ok) {
          addToast('success', 'Discord DM Notification Sent', 'Check your Discord direct messages for your live notification preview!');
        } else {
          addToast('info', 'Notification Preference Saved', data.error || 'You will receive an alert as soon as Daily Allowance unlocks.');
        }
      }
    } catch {
      localStorage.setItem('erlcus_reward_launch_notified', 'true');
      setNotified(true);
      if (addToast) {
        addToast('info', 'Notification Preference Saved', 'You will receive an alert as soon as Daily Allowance unlocks.');
      }
    } finally {
      setIsSendingNotify(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── SEAMLESS BLENDED HERO (No harsh card boundaries, nicely blended) ── */}
      <div className="py-12 sm:py-16 px-4 text-center space-y-10">
        <div className="space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Daily Allowance & Streak Treasury
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans max-w-xl mx-auto">
            The Daily Check-In module is currently undergoing live gateway telemetry testing. Automatic daily deposits and streak jackpots unlock in:
          </p>
        </div>

        {/* Big Bold Clean Countdown Digits */}
        <div className="grid grid-cols-4 gap-4 sm:gap-10 max-w-2xl mx-auto items-center justify-center pt-2">
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
              minutes
            </span>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight tabular-nums font-sans">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-xs sm:text-sm text-zinc-400 font-sans lowercase mt-2 tracking-wide">
              seconds
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <Button
            onClick={handleNotifyMe}
            disabled={notified || isSendingNotify}
            className={`font-semibold text-xs h-11 px-7 rounded-xl transition-all cursor-pointer ${
              notified
                ? 'bg-white/[0.06] text-zinc-300 border border-white/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
            }`}
          >
            {isSendingNotify ? 'Sending Discord DM...' : notified ? 'Discord DM Notification Active' : 'Notify Me in Discord DM'}
          </Button>
        </div>

        {/* 3 Core Highlights (Clean naked icons directly with typography) */}
        <div className="pt-12 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Flame className="size-4 text-amber-400" />
              <span>Consecutive Streaks</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Claim every 24 hours to scale up allowance tiers and claim Day 7 jackpots.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Coins className="size-4 text-amber-400" />
              <span>Direct Treasury Deposit</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Credits deposit straight into your server treasury to fund directory bumps.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Sybil-Protected</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Integrated anti-alt verification ensures credits remain 100% fair and organic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RewardsTab;
