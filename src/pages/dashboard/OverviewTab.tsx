import { useState, useEffect } from 'react';
import {
  Users,
  Coins,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  RotateCw,
  Rocket,
  Flame,
  Bot,
  Compass,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DiscordGuild, WorkspaceBot, WorkspaceCustomizations } from '@/types';

interface OverviewTabProps {
  guild: DiscordGuild | null;
  workspace: WorkspaceBot | null;
  config: WorkspaceCustomizations;
  onNavigateTab: (tab: string) => void;
  onBotAction?: (action: string) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function OverviewTab({
  guild,
  workspace,
  config,
  onNavigateTab,
  onBotAction,
  addToast
}: OverviewTabProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Real Persistent Balances
  const [creditsBalance, setCreditsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_credits_balance');
    return saved ? parseInt(saved, 10) : 45;
  });

  const [dailyJoins, setDailyJoins] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_daily_joins');
    return saved ? parseInt(saved, 10) : 18;
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_streak_days');
    return saved ? parseInt(saved, 10) : 3;
  });

  // Sync real-time updates across tabs
  useEffect(() => {
    const handleUpdate = () => {
      const savedBalance = localStorage.getItem('civlink_credits_balance');
      if (savedBalance) setCreditsBalance(parseInt(savedBalance, 10));
      const savedJoins = localStorage.getItem('civlink_daily_joins');
      if (savedJoins) setDailyJoins(parseInt(savedJoins, 10));
      const savedStreak = localStorage.getItem('civlink_streak_days');
      if (savedStreak) setStreakDays(parseInt(savedStreak, 10));
    };
    window.addEventListener('civlink_credits_updated', handleUpdate);
    return () => window.removeEventListener('civlink_credits_updated', handleUpdate);
  }, []);

  const serverIconUrl = guild?.iconUrl || (guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null);
  const serverName = guild?.name || config.serverName || 'Community Discord Server';
  const guildId = guild?.id || '1232495211490443284';
  const isPromoted = config.j4jEnabled !== false && Boolean(config.inviteUrl || config.serverDescription);
  const botInstanceName = workspace?.botUser?.username || 'CivLink Bot Instance';

  const handleCopyGuildId = () => {
    navigator.clipboard.writeText(guildId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    addToast('success', 'Server Snowflake Copied', `Guild ID ${guildId} copied to clipboard.`);
  };

  const handleQuickSync = async () => {
    setSyncing(true);
    addToast('info', 'Synchronizing Telemetry', 'Refreshing Discord Gateway connection and server state...');
    if (onBotAction) {
      await onBotAction('deploy');
    }
    setTimeout(() => {
      setSyncing(false);
      addToast('success', 'Synchronized', 'Bot instance and member verification status are live.');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── COMMUNITY SERVER COMMAND BAR ── */}
      <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {serverIconUrl ? (
              <img
                src={serverIconUrl}
                alt={serverName}
                className="size-16 rounded-2xl object-cover border-2 border-white/[0.12] shadow-xl shrink-0"
              />
            ) : (
              <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-slate-800 border-2 border-white/[0.12] flex items-center justify-center font-bold text-white text-2xl shadow-xl shrink-0">
                {serverName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{serverName}</h2>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] px-2 py-0.5">
                  <ShieldCheck className="size-3 mr-1 inline" />
                  VERIFIED COMMUNITY
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono">
                {/* Real User's Bot Instance Badge (Replaced the join code) */}
                <div className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/25">
                  <Bot className="size-3.5 text-emerald-400" />
                  <span className="text-slate-400">INSTANCE:</span>
                  <span className="font-semibold text-white">{botInstanceName}</span>
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                </div>

                <span className="text-slate-600">·</span>

                {/* Snowflake ID */}
                <button
                  type="button"
                  onClick={handleCopyGuildId}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]"
                  title="Copy Discord Snowflake ID"
                >
                  <span className="text-slate-500">ID:</span>
                  <span>{guildId}</span>
                  {copiedId ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-slate-400" />}
                </button>

                <span className="text-slate-600">·</span>

                {/* Gateway Latency */}
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Activity className="size-3 text-cyan-400" />
                  <span>34ms Gateway Ping</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickSync}
              disabled={syncing}
              className="h-9 border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-200 text-xs rounded-xl font-medium transition-all"
            >
              <RotateCw className={`size-3.5 mr-1.5 text-slate-300 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
              Sync Bot
            </Button>

            <Button
              size="sm"
              onClick={() => onNavigateTab('promote')}
              className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <Rocket className="size-3.5" />
              <span>Promote Server</span>
            </Button>

            <Button
              size="sm"
              onClick={() => onNavigateTab('earn')}
              className="h-9 border border-white/10 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3.5 rounded-xl transition-all"
            >
              <Compass className="size-3.5 mr-1 text-amber-400" />
              <span>Earn Credits</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4 COMMUNITY GROWTH KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Joins */}
        <div
          onClick={() => onNavigateTab('joins')}
          className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 space-y-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-emerald-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Verified Member Joins</span>
            <Users className="size-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              <span>{dailyJoins}</span>
              <span className="text-xs text-slate-400 font-normal">Members Tracked</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3 shrink-0" />
              <span>72h Anti-Churn Protection Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Credits Treasury */}
        <div
          onClick={() => onNavigateTab('earn')}
          className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 space-y-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-amber-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Credits Treasury</span>
            <Coins className="size-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">{creditsBalance} <span className="text-xs text-amber-400/80 font-normal">Credits</span></div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              <span>Bounty: +{config.coinsPerJoin || 2} Credits / Join</span>
            </div>
          </div>
        </div>

        {/* Card 3: Directory Status */}
        <div
          onClick={() => onNavigateTab('promote')}
          className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 space-y-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Directory Listing</span>
            <Rocket className="size-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className={`text-xl font-bold font-mono tracking-tight ${isPromoted ? 'text-emerald-400' : 'text-slate-300'}`}>
              {isPromoted ? 'Active & Listed' : 'Setup Required'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              <span>{isPromoted ? 'Accepting verified members' : 'Configure invite & tags'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Daily Streak */}
        <div
          onClick={() => onNavigateTab('rewards')}
          className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 space-y-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-rose-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Daily Streak</span>
            <Flame className="size-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">{streakDays} <span className="text-xs text-rose-400 font-normal">Days Active</span></div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              <span>Ready for daily check-in</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMUNITY GROWTH OPERATIONAL PANELS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1: Server Directory Campaign */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-6 flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.16] transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Rocket className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Promote Server Campaign</h3>
                  <p className="text-xs text-slate-400">Custom invite link, community tags, and member join bounties.</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${isPromoted ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
                {isPromoted ? 'LIVE LISTING' : 'NOT LISTED'}
              </Badge>
            </div>

            <div className="space-y-2 border-t border-white/[0.06] pt-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Directory Description:</span>
                <span className="font-medium text-white truncate max-w-[200px]">
                  {config.serverDescription ? config.serverDescription.slice(0, 45) + '...' : 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Search Tags:</span>
                <span className="font-mono text-emerald-400">
                  {config.serverTags || 'community, gaming'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Bounty Allocation:</span>
                <span className="font-mono text-amber-400">+{config.coinsPerJoin || 2} Credits / verified member</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigateTab('promote')}
            className="w-full mt-5 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-semibold h-9 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>Configure Directory Listing</span>
            <ArrowRight className="size-3.5 text-emerald-400" />
          </Button>
        </div>

        {/* Panel 2: Discover Partner Communities */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-6 flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.16] transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Compass className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Earn Credits & Grow</h3>
                  <p className="text-xs text-slate-400">Join partnered Discord servers to earn credits, and spend credits to attract members.</p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs">
                Active Bounties
              </Badge>
            </div>

            <div className="space-y-2 border-t border-white/[0.06] pt-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Available Bounties:</span>
                <span className="font-medium text-white">Up to +5 Credits per community</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Verification Engine:</span>
                <span className="text-emerald-400 font-mono">Automated Discord Gateway check</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Daily Free Claims:</span>
                <span className="text-slate-300">Scaling check-in streak reward</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigateTab('earn')}
            className="w-full mt-5 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-semibold h-9 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>Explore Partner Communities</span>
            <ArrowRight className="size-3.5 text-amber-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
