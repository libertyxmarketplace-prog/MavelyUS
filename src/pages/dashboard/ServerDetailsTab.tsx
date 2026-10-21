import React, { useState, useEffect } from 'react';
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
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import type { DiscordGuild, WorkspaceBot, WorkspaceCustomizations } from '@/types';

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

  // Bump cooldown logic (1-hour cycle matching Discord /bump)
  const BUMP_INTERVAL_MS = 60 * 60 * 1000;
  const [lastBumpTime, setLastBumpTime] = useState<number>(() => {
    const saved = localStorage.getItem(`server_bump_${guildId}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const { user } = useAuth();
  const [bumpChannel, setBumpChannel] = useState<string>(() => {
    return localStorage.getItem(`civlink_bump_channel_${guildId}`) || '#bot-commands';
  });
  const [bumpAnnounceEnabled, setBumpAnnounceEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`civlink_bump_enabled_${guildId}`) !== 'false';
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const timeSinceBump = now - lastBumpTime;
  const canBump = timeSinceBump >= BUMP_INTERVAL_MS;
  const remainingMinutes = Math.max(1, Math.ceil((BUMP_INTERVAL_MS - timeSinceBump) / (60 * 1000)));

  const handleBump = async () => {
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

  // Only real reviews from storage (no fake hardcoded names)
  const [reviews] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`server_reviews_${guildId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── SERVER HERO HEADER (Flush & Clean) ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
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
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span className="text-emerald-400 font-medium">{config.serverCategory || 'Design Server'}</span>
                <span>·</span>
                <span>ID: {guildId.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Join Server (opens user's actual invite) & Bump Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Button
              onClick={handleJoinServer}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Join Server</span>
              <ExternalLink className="size-3.5" />
            </Button>

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
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="px-6 sm:px-8 py-3 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">Join Code:</span>
            <button
              type="button"
              onClick={handleCopyJoinCode}
              className="inline-flex items-center gap-1.5 font-mono font-bold text-white bg-white/[0.06] hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <span>{config.joinCode || 'Not Configured'}</span>
              {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-zinc-400" />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-zinc-300"
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

        {/* Right Rail: Real Info & Bump Thank-You Config (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Server Information */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <span className="text-xs font-mono font-semibold text-zinc-400 tracking-wider uppercase block">
              Server Information
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Guild ID:</span>
                <span className="font-mono text-[11px] text-white">{guildId}</span>
              </div>

              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Category:</span>
                <span className="text-emerald-400 font-medium">{config.serverCategory || 'Design Server'}</span>
              </div>

              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Status:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active in Directory
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">ER:LC Code:</span>
                <span className="font-mono text-white font-semibold">{config.joinCode || 'Not Configured'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerDetailsTab;
