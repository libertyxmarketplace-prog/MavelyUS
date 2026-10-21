import { useState, useEffect } from 'react';
import {
  Check,
  Radio,
  Flame,
  Users,
  Sparkles,
  Bot,
  HelpCircle,
  Coins,
  Globe,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Award,
  Layers,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransferTabProps {
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function TransferTab({ addToast }: TransferTabProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [creditsBalance, setCreditsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_credits_balance');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [autoBumpEnabled, setAutoBumpEnabled] = useState<boolean>(() => {
    return localStorage.getItem('civlink_autobump_enabled') === 'true';
  });

  const [purchasedPlan, setPurchasedPlan] = useState<string>(() => {
    return localStorage.getItem('civlink_active_plan') || 'free';
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('civlink_credits_balance');
      if (saved) setCreditsBalance(parseInt(saved, 10));
    };
    window.addEventListener('civlink_credits_updated', handleUpdate);
    return () => window.removeEventListener('civlink_credits_updated', handleUpdate);
  }, []);

  const handleToggleAutoBump = () => {
    const next = !autoBumpEnabled;
    setAutoBumpEnabled(next);
    localStorage.setItem('civlink_autobump_enabled', next ? 'true' : 'false');
    addToast(
      'info',
      next ? 'Auto-Bump Engine Active' : 'Auto-Bump Engine Paused',
      next
        ? 'Mavely bot will automatically bump your community every 2 hours to keep you near the top of the directory.'
        : 'Automated bumpers paused. You can still manually /bump from the directory or Discord.'
    );
  };

  const handleSelectPlan = (planId: string, planName: string, creditBonus: number) => {
    setPurchasedPlan(planId);
    localStorage.setItem('civlink_active_plan', planId);

    if (creditBonus > 0) {
      const newBal = creditsBalance + creditBonus;
      setCreditsBalance(newBal);
      localStorage.setItem('civlink_credits_balance', newBal.toString());
      window.dispatchEvent(new Event('civlink_credits_updated'));
    }

    addToast(
      'success',
      `${planName} Plan Active`,
      creditBonus > 0
        ? `Upgraded to ${planName}! +${creditBonus} Credits credited to your community balance.`
        : `Your community is active on the ${planName} plan.`
    );
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in-50 duration-200 pb-16">
      {/* ── AMBIENT BACKGROUND GLOW ── */}
      <div className="relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />
      </div>

      {/* ── TREASURY COMMAND BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#131722] to-[#0d1017] p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                CREDITS & COMMUNITY TREASURY
              </span>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Community Treasury & Growth Engine
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Power your Emergency Response: Liberty County server with credit bounties, automated bump cycles, and high-visibility directory placement.
            </p>
          </div>

          {/* Balance Spotlight & Auto-Bump Switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
            {/* Balance Pill */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="size-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">Available Treasury</span>
                <div className="text-xl font-black font-mono text-amber-400 flex items-baseline gap-1">
                  <span>+{creditsBalance}</span>
                  <span className="text-xs font-sans font-medium text-amber-400/80">Credits</span>
                </div>
              </div>
            </div>

            {/* Auto-Bump Switch Card */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <Radio className={`size-3.5 ${autoBumpEnabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                  <span className="text-xs font-bold text-white">Auto-Bump Engine</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 block">
                  {autoBumpEnabled ? 'Active (Every 2 Hours)' : 'Manual Bump Only'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoBump}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  autoBumpEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                    autoBumpEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHAT CAN YOU DO WITH CREDITS? (Actionable & High-End Vibra Grid) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Community Credit Capabilities</h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            6 Growth Systems Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="size-4" />
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px] font-mono">
                BOUNTY
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">Member Join Bounties</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deposit credits to reward authenticated players when they join your community through the global directory.
            </p>
            <div className="pt-1 text-[11px] font-mono text-emerald-400">
              Configurable: +2 to +10 Credits / Join
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="size-4" />
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5 text-[10px] font-mono">
                DISCOVERY
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">Instant Directory Bumping</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Elevate your server instantly to the #1 top spot in the directory to capture active roleplayers and patrol units.
            </p>
            <div className="pt-1 text-[11px] font-mono text-amber-400">
              1-Hour Cooldown Cycle (0 Credits)
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bot className="size-4" />
              </div>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5 text-[10px] font-mono">
                AUTOMATION
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">24/7 Auto-Bump Engine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hands-free background bumper keeping your community continually elevated without manual slash commands.
            </p>
            <div className="pt-1 text-[11px] font-mono text-indigo-400">
              Included with Plus & Ultra Tiers
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="size-4" />
              </div>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/5 text-[10px] font-mono">
                SPOTLIGHT
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">Featured Directory Spotlight</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Prominently highlight your community card with glowing aura, verified badge, and priority category ranking.
            </p>
            <div className="pt-1 text-[11px] font-mono text-cyan-400">
              Top Category Placement
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Globe className="size-4" />
              </div>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5 text-[10px] font-mono">
                BRANDING
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">Custom Banners & Department Tags</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload custom high-resolution community banners, department logos, and custom tags for instant player discovery.
            </p>
            <div className="pt-1 text-[11px] font-mono text-purple-400">
              100% Free for all communities
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldCheck className="size-4" />
              </div>
              <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/5 text-[10px] font-mono">
                ANTI-RAID
              </Badge>
            </div>
            <h3 className="text-xs font-bold text-white">Anti-Churn & Alt Protection</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforce 72-hour retention verification checks and auto-reclaim credits if users immediately leave your community.
            </p>
            <div className="pt-1 text-[11px] font-mono text-rose-400">
              Automated Retention Protection
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMUNITY UPGRADE PLANS (Vibra UI 3-Tier Grid) ── */}
      <section className="space-y-6 pt-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 relative z-10 border-b border-white/5 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-zinc-400">
              <Sparkles className="size-3 text-emerald-400" />
              <span>SUBSCRIPTION PLANS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Community Growth Upgrades
            </h2>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Select the plan that matches your community scale. Cancel anytime with zero lock-in.
            </p>
          </div>

          {/* Segmented Period Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#0d1017] border border-white/10 self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                !isAnnual
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                isAnnual
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <span>Annually</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 3-Tier Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-stretch">
          {/* Tier 1: Free Starter */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-7 hover:border-white/20 transition-all duration-300">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Starter Tier</span>
                <h3 className="text-lg font-bold text-white tracking-tight">Free</h3>
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[32px]">
                  Essential discovery tools to showcase your community with zero fees.
                </p>
              </div>

              <div className="flex items-baseline gap-1 py-1 font-mono">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-zinc-500 font-sans">/ forever</span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('free', 'Free', 0)}
                className="w-full h-10 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {purchasedPlan === 'free' ? 'Current Active Tier' : 'Select Free'}
              </button>

              <div className="border-t border-white/5 pt-5 space-y-3 text-xs text-zinc-300">
                {[
                  'Custom server banner & community icon',
                  'Public community directory profile',
                  'Manual /bump command (1-hour cooldown)',
                  'Custom community tags & category select',
                  'Anti-alt security verification shield',
                  'Daily streak credit rewards'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="text-zinc-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tier 2: Community Plus (Popular with Spotlight Glow) */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.08] via-white/[0.02] to-transparent p-7 relative hover:border-emerald-500/70 transition-all duration-300 shadow-2xl shadow-emerald-500/10">
            <div className="absolute -top-3 right-6">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-black tracking-wider uppercase shadow-md shadow-emerald-500/30">
                RECOMMENDED
              </span>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">Growth Booster</span>
                <h3 className="text-lg font-bold text-white tracking-tight">Community Plus</h3>
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[32px]">
                  Boost member growth with monthly credit bounties and automated bumping.
                </p>
              </div>

              <div className="flex items-baseline gap-1 py-1 font-mono">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? '$3.19' : '$3.99'}
                </span>
                <span className="text-xs text-zinc-400 font-sans">/ month</span>
              </div>

              <Button
                onClick={() => handleSelectPlan('plus', 'Community Plus', 250)}
                className="w-full h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-98"
              >
                {purchasedPlan === 'plus' ? 'Active Plan' : 'Upgrade to Plus (+250 Credits)'}
              </Button>

              <div className="border-t border-emerald-500/20 pt-5 space-y-3 text-xs text-zinc-200">
                {[
                  'Includes everything in Free',
                  '+250 Credits deposited monthly',
                  '2-Hour Auto-Bump Automation',
                  'Priority directory search placement',
                  'Verified server checkmark badge',
                  'Discord bot priority gateway routing'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="text-zinc-200 font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tier 3: Server Ultra */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-7 hover:border-white/20 transition-all duration-300">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">Premier Power</span>
                <h3 className="text-lg font-bold text-white tracking-tight">Server Ultra</h3>
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[32px]">
                  Maximum exposure with featured spotlight and massive monthly treasury drops.
                </p>
              </div>

              <div className="flex items-baseline gap-1 py-1 font-mono">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? '$7.19' : '$8.99'}
                </span>
                <span className="text-xs text-zinc-400 font-sans">/ month</span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('ultra', 'Server Ultra', 750)}
                className="w-full h-10 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {purchasedPlan === 'ultra' ? 'Active Plan' : 'Upgrade to Ultra (+750 Credits)'}
              </button>

              <div className="border-t border-white/5 pt-5 space-y-3 text-xs text-zinc-300">
                {[
                  'Includes everything in Community Plus',
                  '+750 Credits deposited monthly',
                  'Featured Discovery Spotlight badge',
                  'Continuous 2-Hour Auto-Bump 24/7',
                  'Priority member join bounty queue',
                  'VIP Dedicated Developer Support'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="text-zinc-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TransferTab;
