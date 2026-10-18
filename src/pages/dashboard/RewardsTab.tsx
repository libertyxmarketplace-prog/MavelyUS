import { useState, useEffect } from 'react';
import {
  Flame,
  Check,
  Coins,
  Clock,
  ShieldCheck,
  Sparkles,
  Trophy,
  RotateCcw,
  Gift,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsyncButton } from '@/components/ui/async-button';
import { Badge } from '@/components/ui/badge';

// User requirement: 2 credits every day (Days 1-6), Day 7 is 5 credits, then auto-restarts
const STREAK_TIERS = [
  { day: 1, reward: 2, label: 'Day 1 Check-In', perk: '+2 Bounty Credits' },
  { day: 2, reward: 2, label: 'Day 2 Streak', perk: '+2 Bounty Credits' },
  { day: 3, reward: 2, label: 'Day 3 Momentum', perk: '+2 Bounty Credits' },
  { day: 4, reward: 2, label: 'Day 4 Consistent', perk: '+2 Bounty Credits' },
  { day: 5, reward: 2, label: 'Day 5 Power', perk: '+2 Bounty Credits' },
  { day: 6, reward: 2, label: 'Day 6 Champion', perk: '+2 Bounty Credits' },
  { day: 7, reward: 5, label: 'Grand Milestone', perk: '+5 Credits Bonus' },
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function RewardsTab({ addToast }: { addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void }) {
  const [streakDays, setStreakDays] = useState<number>(0);
  const [lastCheckin, setLastCheckin] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());

  // Load actual stored streak tracking
  useEffect(() => {
    const savedStreak = localStorage.getItem('civlink_streak_days');
    const savedTimestamp = localStorage.getItem('civlink_last_checkin');

    const streakNum = savedStreak ? parseInt(savedStreak, 10) : 0;
    const timeNum = savedTimestamp ? parseInt(savedTimestamp, 10) : 0;

    // Check if streak broke (>48 hours)
    if (timeNum > 0 && Date.now() - timeNum > FORTY_EIGHT_HOURS_MS) {
      setStreakDays(0);
      localStorage.setItem('civlink_streak_days', '0');
    } else {
      setStreakDays(streakNum);
    }
    setLastCheckin(timeNum);
  }, []);

  // Live timer tick for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeSinceLast = lastCheckin > 0 ? now - lastCheckin : Infinity;
  const canClaim = lastCheckin === 0 || timeSinceLast >= TWENTY_FOUR_HOURS_MS;

  const msRemaining = canClaim ? 0 : TWENTY_FOUR_HOURS_MS - timeSinceLast;
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000);

  // Active day index (0 to 6). After Day 7 (index 6), it automatically loops back to 0 (Day 1)
  const currentDayIndex = streakDays % 7;
  const nextTier = STREAK_TIERS[currentDayIndex];

  const handleClaim = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newStreak = streakDays + 1;
    const rewardAmount = nextTier.reward;

    const currentBalance = parseInt(localStorage.getItem('civlink_credits_balance') || '0', 10);
    const updatedBalance = currentBalance + rewardAmount;

    localStorage.setItem('civlink_credits_balance', updatedBalance.toString());
    localStorage.setItem('civlink_streak_days', newStreak.toString());
    localStorage.setItem('civlink_last_checkin', Date.now().toString());

    // Record ledger entry
    const newTx = {
      id: `tx_${Date.now()}`,
      type: 'reward',
      title: `Day ${nextTier.day} Daily Check-In (+${rewardAmount} Credits)`,
      amount: `+${rewardAmount} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };
    const savedTxs = JSON.parse(localStorage.getItem('civlink_transactions') || '[]');
    localStorage.setItem('civlink_transactions', JSON.stringify([newTx, ...savedTxs]));

    setStreakDays(newStreak);
    setLastCheckin(Date.now());

    window.dispatchEvent(new Event('civlink_credits_updated'));

    const isResetCycle = nextTier.day === 7;
    addToast(
      'success',
      `+${rewardAmount} Credits Claimed!`,
      isResetCycle
        ? `Day 7 Milestone unlocked! 5 credits deposited into your treasury. The cycle now restarts for Day 1.`
        : `Day ${nextTier.day} check-in recorded (+${rewardAmount} credits). Streak is now at ${newStreak} consecutive days!`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Hero Streak Progression Showcase */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#161a24] via-[#12151d] to-[#0c0e14] p-6 sm:p-8 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        {/* Background glow highlights */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500/15 border-amber-500/30 text-amber-300 font-mono text-xs px-3 py-1 flex items-center gap-1.5">
                <Flame className="size-3.5 text-amber-400" />
                <span>ACTIVE STREAK: {streakDays} DAYS</span>
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-300 font-mono text-xs px-2.5 py-1 flex items-center gap-1">
                <RotateCcw className="size-3 text-slate-400" />
                <span>Auto-Loops Weekly</span>
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Daily Check-In & Streak Rewards
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Check in every 24 hours to fuel your community treasury. Earn 2 credits daily from Days 1 through 6, then score a jackpot of 5 credits on Day 7!
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Discord ID Verified</span>
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-cyan-400" />
                <span>24h Cooldown Protection</span>
              </span>
            </div>
          </div>

          {/* Quick Bounty Claim Terminal */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#1a1f2c]/80 backdrop-blur-xl p-5 shrink-0 flex flex-col justify-between gap-4 min-w-[280px] sm:min-w-[320px] shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Next Available Bounty</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                Day {currentDayIndex + 1} of 7
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                +{nextTier.reward}
              </span>
              <span className="text-sm font-semibold text-amber-400 font-mono">CREDITS</span>
            </div>

            {canClaim ? (
              <AsyncButton
                loadingText="Claiming Bounty…"
                onClick={handleClaim}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold h-10 px-5 rounded-xl shadow-lg transition-all hover:shadow-amber-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                <span>Claim Day {nextTier.day} Reward</span>
              </AsyncButton>
            ) : (
              <div className="space-y-2">
                <Button
                  disabled
                  className="w-full bg-white/[0.06] text-slate-400 text-xs font-medium h-10 px-4 rounded-xl cursor-not-allowed border border-white/[0.08] flex items-center justify-center gap-2"
                >
                  <Check className="size-4 text-emerald-400" />
                  <span>Already Claimed Today</span>
                </Button>
                <div className="text-center">
                  <span className="text-[11px] font-mono text-slate-400">
                    Next unlock in: <strong className="text-white">{hoursRemaining}h {minutesRemaining}m {secondsRemaining}s</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Progressive Capsule Track */}
      <Card className="border-white/[0.09] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                <span>Weekly Reward Progression Matrix</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Maintain an unbroken daily streak. Days 1 through 6 award 2 credits each. Day 7 unlocks the 5-credit milestone.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span>{streakDays} Days Logged</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Days 1-6 Strip + Day 7 Milestone Vault */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5">
            {STREAK_TIERS.map((tier, idx) => {
              const isPastClaimed = streakDays > 0 && idx < currentDayIndex;
              const isCurrentDay = idx === currentDayIndex;
              const isReady = isCurrentDay && canClaim;
              const isCompletedToday = isCurrentDay && !canClaim;
              const isDay7 = tier.day === 7;

              if (isDay7) {
                return (
                  <div
                    key={tier.day}
                    className={`col-span-1 md:col-span-2 relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between border transition-all ${
                      isPastClaimed || isCompletedToday
                        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-[#151c24] to-[#11141c]'
                        : isReady
                        ? 'border-amber-400/60 bg-gradient-to-br from-amber-950/40 via-[#1e1b18] to-[#161a24] shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)]'
                        : 'border-white/[0.12] bg-gradient-to-br from-[#1a1f2c] via-[#141822] to-[#10131a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                        <Trophy className="size-3.5 text-amber-400" />
                        <span>DAY 7 MILESTONE</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                        GRAND REWARD
                      </span>
                    </div>

                    <div className="my-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Coins className="size-6 text-amber-400" />
                        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                          +{tier.reward}
                        </span>
                        <span className="text-xs font-bold text-amber-400 font-mono">CREDITS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Complete your 7-day streak to claim the grand weekly treasury chest.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                      {isPastClaimed || isCompletedToday ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                          <Check className="size-3.5" />
                          <span>Milestone Claimed</span>
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 font-bold animate-pulse">
                          <Sparkles className="size-3.5" />
                          <span>Ready to Unlock</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>Unlocks on Day 7</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400">
                        Auto-Restarts
                      </span>
                    </div>
                  </div>
                );
              }

              // Days 1 through 6
              return (
                <div
                  key={tier.day}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                    isPastClaimed || isCompletedToday
                      ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                      : isReady
                      ? 'border-amber-500/50 bg-amber-500/[0.1] shadow-md shadow-amber-500/5'
                      : 'border-white/[0.08] bg-[#11141c]/80 hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      DAY {tier.day}
                    </span>
                    {isPastClaimed || isCompletedToday ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : isReady ? (
                      <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-slate-600" />
                    )}
                  </div>

                  <div className="my-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Coins className={`size-4 ${isReady ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-mono font-extrabold text-lg text-white">
                        +{tier.reward}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      {tier.label}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.06]">
                    {isPastClaimed || isCompletedToday ? (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold block text-center">
                        Claimed
                      </span>
                    ) : isReady ? (
                      <span className="text-[11px] font-mono text-amber-400 font-bold block text-center">
                        Ready
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500 block text-center">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info & Treasury Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/[0.06]">
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#11141c]/50 flex items-start gap-3">
              <Gift className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">17 Weekly Total Credits</h4>
                <p className="text-[11px] text-slate-400">Complete an entire week to accumulate 17 verified treasury credits.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#11141c]/50 flex items-start gap-3">
              <Clock className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">48h Break Protection</h4>
                <p className="text-[11px] text-slate-400">If you miss a single day, you have up to 48 hours to claim before your streak resets.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#11141c]/50 flex items-start gap-3">
              <ArrowRight className="size-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">Instant Directory Fuel</h4>
                <p className="text-[11px] text-slate-400">Use your credits directly in Promote Server to attract verified Discord members.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RewardsTab;
