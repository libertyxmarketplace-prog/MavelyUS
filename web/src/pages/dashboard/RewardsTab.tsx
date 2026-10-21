import { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  Flame,
  Coins,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AsyncButton } from '@/components/ui/async-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STREAK_TIERS = [
  { day: 1, reward: 2, label: 'Day 1' },
  { day: 2, reward: 2, label: 'Day 2' },
  { day: 3, reward: 2, label: 'Day 3' },
  { day: 4, reward: 2, label: 'Day 4' },
  { day: 5, reward: 3, label: 'Day 5' },
  { day: 6, reward: 3, label: 'Day 6' },
  { day: 7, reward: 5, label: 'Day 7' },
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function RewardsTab({ addToast }: { addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void }) {
  const [streakDays, setStreakDays] = useState<number>(0);
  const [lastCheckin, setLastCheckin] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const loadLogs = () => {
    try {
      const savedTxs = JSON.parse(localStorage.getItem('civlink_transactions') || '[]');
      const rewardsOnly = savedTxs.filter((tx: any) => tx.type === 'reward').slice(0, 5);
      setRecentLogs(rewardsOnly);
    } catch {
      setRecentLogs([]);
    }
  };

  useEffect(() => {
    const savedStreak = localStorage.getItem('civlink_streak_days');
    const savedTimestamp = localStorage.getItem('civlink_last_checkin');

    const streakNum = savedStreak ? parseInt(savedStreak, 10) : 0;
    const timeNum = savedTimestamp ? parseInt(savedTimestamp, 10) : 0;

    if (timeNum > 0 && Date.now() - timeNum > FORTY_EIGHT_HOURS_MS) {
      setStreakDays(0);
      localStorage.setItem('civlink_streak_days', '0');
    } else {
      setStreakDays(streakNum);
    }
    setLastCheckin(timeNum);
    loadLogs();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeSinceLast = lastCheckin > 0 ? now - lastCheckin : Infinity;
  const canClaim = lastCheckin === 0 || timeSinceLast >= TWENTY_FOUR_HOURS_MS;

  const msRemaining = canClaim ? 0 : TWENTY_FOUR_HOURS_MS - timeSinceLast;
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60)).toString().padStart(2, '0');
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  const secondsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

  const currentDayIndex = streakDays % 7;
  const nextTier = STREAK_TIERS[currentDayIndex];

  const handleClaim = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newStreak = streakDays + 1;
    const rewardAmount = nextTier.reward;

    const currentBalance = parseInt(localStorage.getItem('civlink_credits_balance') || '0', 10);
    const updatedBalance = currentBalance + rewardAmount;

    localStorage.setItem('civlink_credits_balance', updatedBalance.toString());
    localStorage.setItem('civlink_streak_days', newStreak.toString());
    localStorage.setItem('civlink_last_checkin', Date.now().toString());

    // Record clean ledger entry
    const newTx = {
      id: `tx_${Date.now()}`,
      type: 'reward',
      title: `Day ${nextTier.day} Daily Check-In`,
      amount: `+${rewardAmount} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };
    const savedTxs = JSON.parse(localStorage.getItem('civlink_transactions') || '[]');
    localStorage.setItem('civlink_transactions', JSON.stringify([newTx, ...savedTxs]));

    setStreakDays(newStreak);
    setLastCheckin(Date.now());
    loadLogs();
    window.dispatchEvent(new Event('civlink_credits_updated'));

    addToast('success', 'Daily Reward Claimed', `+${rewardAmount} credits added to your balance. Current streak: ${newStreak} day${newStreak === 1 ? '' : 's'}!`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── TOP HEADER (Flush & Clean) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
              COMMUNITY REWARD SYSTEM
            </span>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Daily Check-In & Streak Rewards
          </h2>
          <p className="text-xs text-zinc-400">
            Check in every 24 hours to earn free community credits. Keep your daily streak alive to earn escalating streak bonuses.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
            <Flame className="size-4 text-rose-400" />
            <span className="text-zinc-400">Current Streak:</span>
            <span className="text-white font-bold">{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CHECK-IN CARD (Blends with page) ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
        <div className="px-6 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <Coins className="size-3.5 text-amber-400" />
            <span className="uppercase tracking-wider">Day {nextTier.day} Check-In Reward</span>
          </div>
          <div className="flex items-center gap-2">
            {canClaim ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Available Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-zinc-400 bg-white/[0.03] px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/5">
                <Clock className="size-3" />
                Next Check-In Cooldown
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
                +{nextTier.reward}
              </span>
              <span className="text-lg font-semibold text-amber-400 font-mono uppercase tracking-wider">
                Credits
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              {canClaim
                ? 'Your daily check-in reward is ready! Claim now to deposit credits into your community balance and extend your streak.'
                : `You already checked in today! Check back in ${hoursRemaining}h ${minutesRemaining}m to claim your next bonus.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            {canClaim ? (
              <AsyncButton
                onClick={handleClaim}
                loadingText="Claiming Reward..."
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-11 px-7 rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="size-4 text-emerald-200" />
                <span>Claim Daily Bonus (+{nextTier.reward} Credits)</span>
              </AsyncButton>
            ) : (
              <div className="flex items-center gap-2 py-2 px-1 text-zinc-300 font-mono text-xs">
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span>Claimed for Today · Next bonus in {hoursRemaining}h {minutesRemaining}m</span>
              </div>
            )}
          </div>
        </div>

        {/* Cooldown Status Progress Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-zinc-500" />
            <span className="font-mono text-[11px]">
              {lastCheckin > 0
                ? `Last claimed: ${new Date(lastCheckin).toLocaleString()}`
                : 'No check-in recorded yet'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
            <span>Streak Reset Window:</span>
            <span className="text-amber-400">48h after last claim</span>
          </div>
        </div>
      </div>

      {/* ── 7-DAY STREAK CADENCE (Clean, Minimal, No Line Cutting Across) ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="size-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">7-Day Consecutive Streak Bonuses</h3>
              <p className="text-xs text-zinc-400">Daily check-in progression with escalating credit rewards</p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-mono bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg">
            {streakDays % 7} / 7 Days Active
          </span>
        </div>

        {/* 7 Clean Streak Day Cards (No Line Across) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {STREAK_TIERS.map((tier) => {
            const isCompleted = streakDays > 0 && currentDayIndex >= tier.day;
            const isCurrent = currentDayIndex + 1 === tier.day;
            const isGrand = tier.day === 7;

            return (
              <div
                key={tier.day}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-left ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-sm'
                    : isCompleted
                    ? 'border-white/10 bg-white/[0.02]'
                    : 'border-white/5 bg-transparent opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Day {tier.day}
                  </span>
                  {isCompleted ? (
                    <Check className="size-3 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-400">
                      TODAY
                    </span>
                  ) : isGrand ? (
                    <Sparkles className="size-3 text-amber-400" />
                  ) : null}
                </div>

                <div className="space-y-0.5">
                  <div className="text-base font-bold font-mono text-white flex items-baseline gap-1">
                    <span>+{tier.reward}</span>
                    <span className="text-[10px] text-amber-400 font-sans font-medium uppercase">
                      Credits
                    </span>
                  </div>

                  {isGrand ? (
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                      Grand Bonus
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-500 block">
                      {isCompleted ? 'Completed' : isCurrent ? 'Available' : 'Upcoming'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT REWARDS ACTIVITY LOG ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Recent Rewards History</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {recentLogs.length} Logged Entries
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Coins className="size-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-mono">No check-in history logged yet.</p>
              <p className="text-[11px] text-zinc-500">Claim your daily check-in above to begin building your streak log.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 text-xs font-mono">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">{log.title}</span>
                      <span className="text-[11px] text-zinc-400 block">{log.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{log.amount}</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RewardsTab;
