import { useState, useEffect } from 'react';
import { Check, ArrowRight, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      next ? 'Auto-Bump Bot Enabled' : 'Auto-Bump Bot Paused',
      next
        ? 'Mavely bot will automatically /bump your community every 2 hours to keep you at the top.'
        : 'Automated bumpers paused. You can still manually /bump from the directory.'
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
      `${planName} Plan Activated`,
      creditBonus > 0
        ? `Upgraded to ${planName}! +${creditBonus} Credits credited to your community treasury.`
        : `Your community is active on the ${planName} plan.`
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Top Banner: Growth Treasury & Auto-Bump Switch */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Zap className="size-6 text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Community Growth Treasury</h3>
              <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-300 font-mono text-[10px]">
                {purchasedPlan.toUpperCase()} TIER
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Available Balance: <span className="text-amber-400 font-bold">+{creditsBalance} Credits</span> · Ready for member bounties
            </p>
          </div>
        </div>

        {/* Auto-Bump Bot Switch */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.08] bg-[#11141c]">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <Radio className={`size-3.5 ${autoBumpEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold text-white">Auto-Bump Bot</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              {autoBumpEnabled ? 'Running every 2h' : 'Manual only'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleAutoBump}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              autoBumpEnabled ? 'bg-emerald-500' : 'bg-slate-700'
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

      {/* Pricing Section (Exact requested component structure) */}
      <section className="relative w-full rounded-2xl border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] py-12 px-6 sm:px-8 font-sans text-white">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="mb-3 max-w-2xl text-balance text-3xl font-medium tracking-tighter text-white sm:text-4xl md:text-5xl">
              Predictable pricing. <br className="hidden sm:block" />
              <span className="text-slate-400">Infinite scale.</span>
            </h2>
            <p className="max-w-xl text-balance text-sm text-slate-400 sm:text-base">
              Start for free, then pay only for what you use. No hidden fees, no complex tier structures. Just pure community growth.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center gap-3">
              <span className={cn("text-sm font-medium", !isAnnual ? "text-white" : "text-slate-500")}>Monthly</span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-white/[0.12] transition-colors hover:bg-white/[0.2]"
                aria-label="Toggle billing cycle"
              >
                <div
                  className={cn(
                    "absolute h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out",
                    isAnnual ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className={cn("flex items-center gap-2 text-sm font-medium", isAnnual ? "text-white" : "text-slate-500")}>
                Annually
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Developer Tier */}
            <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#11141c] p-7 transition-colors hover:border-white/[0.15]">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white">Starter</h3>
                <p className="mt-2 text-sm text-slate-400">Perfect for side projects and evaluating the platform.</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-medium tracking-tighter">$0</span>
                <span className="text-sm font-medium text-slate-500">/ forever</span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('free', 'Starter', 0)}
                className="mb-8 flex h-10 w-full items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-sm font-medium transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                {purchasedPlan === 'free' ? 'Current Plan' : 'Start for free'}
              </button>

              <div className="mb-6 h-px w-full bg-white/[0.08]" />

              <ul className="flex flex-col gap-3.5 text-sm text-slate-300">
                {[
                  "Standard directory listing",
                  "Manual /bump command",
                  "Verified member verification",
                  "Discord community support",
                  "1 week log retention"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tier (Highlighted) */}
            <div className="relative flex flex-col rounded-xl border border-emerald-500/40 bg-[#131722] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              {/* Top Highlight Accent */}
              <div className="absolute inset-x-0 top-0 h-[2px] w-full bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Production</h3>
                  <p className="mt-2 text-sm text-slate-400">For scalable communities and active servers.</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Most Popular
                </span>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-medium tracking-tighter">
                  ${isAnnual ? "23" : "29"}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  / server / mo
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('pro', 'Production', 175)}
                className="mb-8 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-slate-900 transition-all hover:bg-slate-200 active:scale-[0.98]"
              >
                {purchasedPlan === 'pro' ? 'Current Active Plan' : 'Upgrade to Pro'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mb-6 h-px w-full bg-white/[0.08]" />

              <ul className="flex flex-col gap-3.5 text-sm text-slate-300">
                {[
                  "+175 Monthly Directory Credits",
                  "Automated 2-Hour Auto-Bump Power",
                  "Glowing green directory card accent",
                  "7-day featured carousel spot",
                  "Priority anti-raid member shield",
                  "30 day audit retention"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise Tier */}
            <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#11141c] p-7 transition-colors hover:border-white/[0.15]">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white">Enterprise</h3>
                <p className="mt-2 text-sm text-slate-400">Custom growth setup for large partner networks.</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-medium tracking-tighter">Custom</span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('enterprise', 'Enterprise', 500)}
                className="mb-8 flex h-10 w-full items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-sm font-medium transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Contact Sales
              </button>

              <div className="mb-6 h-px w-full bg-white/[0.08]" />

              <ul className="flex flex-col gap-3.5 text-sm text-slate-300">
                {[
                  "Unlimited credit allocations",
                  "Permanent automated bumper slot",
                  "Guaranteed top 3 sticky placement",
                  "24/7 dedicated support SLA",
                  "Verified gold crown in directory",
                  "Infinite audit log retention"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Usage Note */}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="flex h-2 w-2 rounded-full bg-neutral-700" />
            Need more credits? Extra growth credits can also be earned freely by joining partner communities in the directory.
          </div>
        </div>
      </section>
    </div>
  );
}

export default TransferTab;
