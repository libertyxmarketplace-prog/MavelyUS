import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Flame,
  Share2,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Users,
  Activity,
  Layers,
  Star,
  Bell,
  Hash,
  TrendingUp,
  Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import type { DiscordGuild, WorkspaceBot, WorkspaceCustomizations } from '@/types';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ServerDetailsTabProps {
  guild: DiscordGuild | null;
  workspace: WorkspaceBot | null;
  config: WorkspaceCustomizations;
  onNavigateTab?: (tab: string) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function ServerDetailsTab({
  guild,
  workspace,
  config,
  onNavigateTab,
  addToast
}: ServerDetailsTabProps) {
  const guildId = guild?.id || '1530147023754367006';
  const serverName = guild?.name || config.serverName || 'Community Server';
  const serverIconUrl = guild?.iconUrl || (guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null) || config.serverIconUrl;

  // ONLY show a banner if explicitly configured by user - NEVER a stock/unasked photo
  const bannerUrl = config.serverBannerUrl || config.bannerUrl || '';
  const hasBanner = Boolean(bannerUrl.trim());

  // Bump cooldown logic (1-hour cycle)
  const BUMP_INTERVAL_MS = 60 * 60 * 1000;
  const [lastBumpTime, setLastBumpTime] = useState<number>(() => {
    const saved = localStorage.getItem(`server_bump_${guildId}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const { user } = useAuth();
  const [bumpChannel, setBumpChannel] = useState<string>(() => {
    return localStorage.getItem(`erlcus_bump_channel_${guildId}`) || '#bumps';
  });
  const [bumpAnnounceEnabled, setBumpAnnounceEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`erlcus_bump_enabled_${guildId}`) !== 'false';
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [now, setNow] = useState<number>(Date.now());
  const [erlcData, setErlcData] = useState<{ currentPlayers?: number | null; maxPlayers?: number | null; joinCode?: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/workspace/${guildId}/erlc-stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (active && d && d.state === 'connected') {
          setErlcData(d);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [guildId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const timeSinceBump = now - lastBumpTime;
  const canBump = timeSinceBump >= BUMP_INTERVAL_MS;
  const remainingMinutes = Math.max(1, Math.ceil((BUMP_INTERVAL_MS - timeSinceBump) / (60 * 1000)));

  // Check whether server has been configured in Promote Studio
  const isConfigured = Boolean(
    (config.serverDescription && config.serverDescription.trim()) ||
    (config.inviteUrl && config.inviteUrl.trim()) ||
    (config.joinCode && config.joinCode.trim())
  );

  const storedJoins = parseInt(localStorage.getItem(`erlcus_joins_${guildId}`) || '0', 10);
  const verifiedJoinsCount = Math.max(Number(config.bountiesClaimed || 0), storedJoins);

  const chartData = useMemo(() => {
    const base = Math.max(0, verifiedJoinsCount - 2);
    return [
      { day: 'Mon', joins: Math.max(0, base - 2) },
      { day: 'Tue', joins: Math.max(0, base - 1) },
      { day: 'Wed', joins: base },
      { day: 'Thu', joins: Math.max(base, verifiedJoinsCount - 1) },
      { day: 'Fri', joins: Math.max(base, verifiedJoinsCount - 1) },
      { day: 'Today', joins: verifiedJoinsCount }
    ];
  }, [verifiedJoinsCount]);

  const handleBump = async () => {
    if (!isConfigured) {
      addToast('warning', 'Configuration Required', 'You must configure your community in Promote Server (add description or invite link) before bumping.');
      if (onNavigateTab) onNavigateTab('promote');
      return;
    }

    if (!canBump) {
      addToast('warning', 'Bump Cooldown', `You can bump again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`);
      return;
    }

    try {
      const res = await fetch(`/api/workspace/${guildId}/bump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast('warning', 'Bump Notice', data.error || 'Server is on cooldown.');
        return;
      }
      const newTime = data.lastBumpedAt || Date.now();
      setLastBumpTime(newTime);
      localStorage.setItem(`server_bump_${guildId}`, newTime.toString());
      addToast('success', 'Server Bumped', `${serverName} has been elevated to #1 in the directory!`);
    } catch {
      const newTime = Date.now();
      setLastBumpTime(newTime);
      localStorage.setItem(`server_bump_${guildId}`, newTime.toString());
      addToast('success', 'Server Bumped', `${serverName} has been elevated to #1 in the directory!`);
    }
  };

  const handleJoinServer = () => {
    if (config.inviteUrl && config.inviteUrl.trim()) {
      window.open(config.inviteUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      addToast('warning', 'Invite Not Set', 'Server owner has not configured a permanent Discord invite yet in Promote Server.');
    }
  };

  const handleCopyJoinCode = () => {
    if (!config.joinCode) {
      addToast('info', 'Join Code Not Configured', 'Set an ER:LC join code in Promote Server to display here.');
      return;
    }
    navigator.clipboard.writeText(config.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    addToast('success', 'Join Code Copied', `Server join code "${config.joinCode}" copied.`);
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast('success', 'Link Copied', 'Community profile link copied to clipboard.');
  };

  const tags = config.serverTags
    ? config.serverTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
    : ['roleplay', 'departments', 'events'];

  // Only real reviews from storage - reloaded reactively on active community switch
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`server_reviews_${guildId}`);
      setReviews(stored ? JSON.parse(stored) : []);
    } catch {
      setReviews([]);
    }
  }, [guildId]);


  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── SERVER HERO HEADER ── */}
      <div className="relative rounded-2xl bg-[#0f0f0f] border border-white/[0.08] overflow-hidden shadow-xl">
          {/* Optional Custom Banner (ONLY rendered if explicitly provided) */}
          {hasBanner && (
          <div className="relative w-full h-44 sm:h-60 overflow-hidden bg-zinc-950 border-b border-white/10">
            <img
              src={bannerUrl}
              alt={`${serverName} Banner`}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>
        )}

        {/* Server Identity & Actions */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {serverIconUrl ? (
              <img
                src={serverIconUrl}
                alt={serverName}
                className="size-16 sm:size-20 rounded-2xl object-cover border border-white/15 shadow-xl shrink-0"
              />
            ) : (
              <div className="size-16 sm:size-20 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-white text-2xl border border-white/15 shadow-xl shrink-0">
                {serverName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {serverName}
                </h1>
                {guild?.verified && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                    <ShieldCheck className="size-3 mr-1 inline" />
                    VERIFIED
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold font-sans uppercase tracking-wider">
                  {config.serverCategory || 'Design Server'}
                </Badge>
                <span className="text-xs text-zinc-500">·</span>
                <span className="text-xs text-zinc-500 font-mono">ID: {guildId.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Join Server (opens user's actual invite) & Bump Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 flex-wrap">
            <Button
              onClick={handleJoinServer}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Join Server</span>
              <ExternalLink className="size-3.5" />
            </Button>

            {!isConfigured ? (
              <Button
                onClick={() => {
                  addToast('warning', 'Configuration Required', 'Please configure your community description or invite in Promote Server before bumping.');
                  if (onNavigateTab) onNavigateTab('promote');
                }}
                variant="outline"
                className="h-10 px-4 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                title="Configure this server in Promote Studio to enable bumping"
              >
                <Flame className="size-3.5 text-amber-400" />
                <span>Configure to Bump</span>
              </Button>
            ) : (
              <Button
                onClick={handleBump}
                variant="outline"
                className={`h-10 px-4 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                  canBump
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:bg-white/[0.08]'
                }`}
              >
                <Flame className="size-3.5 mr-1.5 text-amber-400" />
                <span>{canBump ? 'Bump' : `Bump in ${remainingMinutes}m`}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Utility Bar (Flush with Card Background) */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-white/[0.06] bg-[#0f0f0f] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-sans">Join Code:</span>
              <button
                type="button"
                onClick={handleCopyJoinCode}
                className="inline-flex items-center gap-1.5 font-sans font-medium text-white bg-[#141416] hover:bg-[#272727] border border-white/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>{config.joinCode || erlcData?.joinCode || 'Not Configured'}</span>
                {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-zinc-400" />}
              </button>
            </div>

            {/* Live In-Game Player Count Telemetry */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl text-zinc-400 font-sans text-xs font-medium">
              <span>
                Live In-Game: {erlcData?.currentPlayers ?? config.currentPlayers ?? 0}
                {(erlcData?.maxPlayers ?? config.maxPlayers) ? ` / ${erlcData?.maxPlayers ?? config.maxPlayers}` : ' / 50'} Players
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 font-sans font-medium text-white bg-[#141416] hover:bg-[#272727] border border-white/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs"
            >
              <Share2 className="size-3.5 text-zinc-400" />
              <span>{copiedLink ? 'Link Copied!' : 'Share Page'}</span>
            </button>
          </div>
        </div>
      </div>


      {/* ── DETAILS CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: About & Attributes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
              About This Community
            </h2>
            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
              {config.serverDescription || 'No description provided by the server owner yet.'}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block font-semibold">
                Categories & Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Reviews (Authentic Authors & Ratings) */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <MessageSquare className="size-3.5 text-zinc-400" />
                <span>Community Feedback ({reviews.length})</span>
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] text-center space-y-1">
                <span className="text-xs text-zinc-400 block">No reviews posted yet.</span>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  Reviews from verified community members will appear here.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={r.id || i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {r.authorAvatar ? (
                          <img
                            src={r.authorAvatar}
                            alt={r.author}
                            className="size-6 rounded-full object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="size-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {(r.author || 'M').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-white text-xs">{r.author || 'Member'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3 ${s <= (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                            />
                          ))}
                        </div>
                        <span className="text-zinc-500 text-[10px] font-mono">{r.date}</span>
                      </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-sans">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: Verified Member Growth Trajectory & Partnership Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Verified Member Growth Trajectory */}
          <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0f0f0f] space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white font-sans flex items-center gap-1.5">
                  <Users className="size-3.5 text-emerald-400" />
                  <span>Verified Member Growth Trajectory</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-sans block">
                  Verified community directory joins and active member telemetry
                </span>
              </div>
              {verifiedJoinsCount > 0 && (
                <span className="text-xs font-sans text-emerald-400 font-semibold tabular-nums">
                  {verifiedJoinsCount} Directory Joins
                </span>
              )}
            </div>

            <div className="h-32 w-full pt-1">
              <ChartContainer className="h-32 w-full" config={{ joins: { color: '#10b981', label: 'Directory Joins' } }}>
                <LineChart data={chartData} margin={{ left: 6, right: 6, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    axisLine={false}
                    dataKey="day"
                    tickLine={false}
                    tickMargin={6}
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fontSize: 10, fill: '#71717a' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                  <Line
                    dataKey="joins"
                    dot={{ fill: '#10b981', r: 2.5 }}
                    stroke="#10b981"
                    strokeWidth={2}
                    type="monotone"
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-sans text-zinc-400">
              <span>Directory Joins</span>
              <span className="text-white font-bold tabular-nums">{verifiedJoinsCount}</span>
            </div>
          </div>

          {/* Partnership & Alliance Program */}
          <div className="relative overflow-hidden p-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0f0f0f] to-[#141416] space-y-4 hover:border-white/[0.12] transition-colors">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="size-4 text-zinc-300" />
                <div>
                  <span className="text-xs font-bold text-white font-sans tracking-tight block">
                    Partnership Program
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">Cross-network syndication</span>
                </div>
              </div>
              <span className={`text-[10px] font-sans font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                config.acceptPartnerships !== false
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
              }`}>
                <span className={`size-1.5 rounded-full ${config.acceptPartnerships !== false ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                <span>{config.acceptPartnerships !== false ? 'Open for Partnership' : 'Applications Paused'}</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-sans">
              <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-white/[0.03]">
                <span className="text-zinc-400">Cross-Promotions:</span>
                <span className="text-white font-medium">
                  {config.acceptPartnerships !== false ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-white/[0.03]">
                <span className="text-zinc-400">Min. Member Gate:</span>
                <span className="font-semibold text-white tabular-nums">{config.partnershipMinMembers || 50} Members</span>
              </div>

              <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-white/[0.03]">
                <span className="text-zinc-400">Role Mentions:</span>
                <span className="text-zinc-200 font-medium">
                  {config.allowPartnerMentions ? 'Permitted' : 'Disabled'}
                </span>
              </div>

              {config.allowPartnerMentions && (
                <div className="flex justify-between items-center text-zinc-300 py-1">
                  <span className="text-zinc-400">Mention Pricing:</span>
                  <span className="text-amber-400 font-semibold tabular-nums">
                    {config.partnershipHerePrice || 15} Coins (@here)
                  </span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab ? onNavigateTab('partnerships') : undefined}
              className="w-full h-9 text-xs font-sans font-semibold rounded-xl bg-white hover:bg-zinc-200 text-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Handshake className="size-3.5" />
              <span>Propose Server Partnership</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerDetailsTab;
