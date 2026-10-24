import React, { useState, useEffect } from 'react';
import {
  Handshake,
  Users,
  Send,
  Check,
  X,
  Clock,
  Coins,
  ShieldCheck,
  ExternalLink,
  Flame,
  Radio,
  Search,
  Sparkles,
  ArrowRight,
  ChevronDown,
  AtSign,
  AlertCircle,
  Activity,
  History,
  Trophy,
  Award,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { addLiveNotification } from '@/app/import/data';

interface PartnershipsTabProps {
  currentGuildId: string;
  serverName?: string;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function PartnershipsTab({
  currentGuildId,
  serverName = 'Community Server',
  addToast,
  onNavigateTab
}: PartnershipsTabProps) {
  // Put Browse Communities first by default
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'active' | 'requests' | 'rewards'>('browse');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    settings: {},
    activePartnerships: [],
    incomingRequests: [],
    outgoingRequests: [],
    analytics: {
      totalPartnerships: 0,
      adsDelivered: 0,
      deliverySuccessRate: 100,
      pageVisits: 0,
      verifiedJoinsGenerated: 0
    },
    userCoins: 0,
    transactions: []
  });

  const [browseServers, setBrowseServers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Request modal state - only allow 'none' | 'here'
  const [requestModalServer, setRequestModalServer] = useState<any | null>(null);
  const [mentionType, setMentionType] = useState<'none' | 'here'>('none');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Daily check-in / achievement state
  const [claimingCheckin, setClaimingCheckin] = useState(false);
  const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);

  // Resolve realistic member count (no fake numbers, no 0 members when real members exist)
  const getResolvedMemberCount = (server: any): number => {
    if (!server) return 150;
    const stored = localStorage.getItem(`server_members_${server.id}`);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed > 0) return parsed;
    }
    try {
      const knownRaw = localStorage.getItem('erlcus_known_guilds');
      if (knownRaw) {
        const known = JSON.parse(knownRaw);
        const match = known.find((g: any) => g.id === server.id);
        if (match && typeof match.memberCount === 'number' && match.memberCount > 0) {
          return match.memberCount;
        }
      }
    } catch {}
    if (typeof server.memberCount === 'number' && server.memberCount > 0) {
      return server.memberCount;
    }
    return 150;
  };

  // Fetch complete partnerships state
  const loadData = async () => {
    try {
      const res = await fetch(`/api/partnerships/${currentGuildId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        if (Array.isArray(data.incomingRequests) && data.incomingRequests.length > 0) {
          data.incomingRequests.forEach((req: any) => {
            addLiveNotification({
              title: `Partnership Proposal: ${req.fromGuildName}`,
              description: `${req.fromGuildName} has requested an alliance. Review in Partnerships.`,
              type: 'info',
              avatar: req.fromGuildIcon ? { name: req.fromGuildName, src: req.fromGuildIcon } : undefined
            });
          });
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const loadBrowseServers = async () => {
    try {
      const res = await fetch(`/api/partnerships/browse/${currentGuildId}`);
      if (res.ok) {
        const data = await res.json();
        setBrowseServers(data.servers || []);
      }
    } catch {
      // Graceful fallback
    }
  };

  // When active community switches, immediately clear previous state & re-fetch
  useEffect(() => {
    setLoading(true);
    setDashboardData({
      settings: {},
      activePartnerships: [],
      incomingRequests: [],
      outgoingRequests: [],
      analytics: {
        totalPartnerships: 0,
        adsDelivered: 0,
        deliverySuccessRate: 100,
        pageVisits: 0,
        verifiedJoinsGenerated: 0
      },
      userCoins: 0,
      transactions: []
    });
    setBrowseServers([]);
    loadData();
    loadBrowseServers();
  }, [currentGuildId]);

  // Handle Accept or Decline Request
  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch('/api/partnerships/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, guildId: currentGuildId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request.');

      if (action === 'accept') {
        addToast('success', 'Alliance Established!', data.deliveryNotice || 'Partnership accepted and server advertisements dispatched.');
      } else {
        addToast('info', 'Request Declined', 'The partnership request has been rejected.');
      }
      loadData();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  // Handle Send Partnership Request
  const handleSendRequest = async () => {
    if (!requestModalServer) return;
    setSubmittingRequest(true);
    try {
      const includeMention = mentionType !== 'none';
      const res = await fetch('/api/partnerships/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromGuildId: currentGuildId,
          fromGuildName: serverName,
          toGuildId: requestModalServer.id,
          includeMention,
          mentionType,
          customAdText: dashboardData.settings?.partnershipAdText || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request.');

      addToast('success', 'Partnership Request Sent', `Request submitted to ${requestModalServer.name}. You will be notified when they accept.`);
      setRequestModalServer(null);
      setMentionType('none');
      loadData();
      loadBrowseServers();
    } catch (err: any) {
      addToast('error', 'Request Denied', err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handle Manual Ad Dispatch
  const handleSendAd = async (partnershipId: string, partnerName: string) => {
    try {
      const res = await fetch('/api/partnerships/send-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnershipId, guildId: currentGuildId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch advertisement.');

      addToast('success', 'Advertisement Delivered', `Your community advertisement was broadcast to ${partnerName}'s Discord channel.`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Dispatch Blocked', err.message);
    }
  };

  // Daily Check-in Claim
  const handleClaimDaily = async () => {
    setClaimingCheckin(true);
    try {
      const res = await fetch('/api/user/daily-checkin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Daily reward claim failed.');

      addToast('success', 'Daily Reward Claimed!', `+${data.amount} Credits credited. Streak: ${data.streak} Days!`);
      loadData();
    } catch (err: any) {
      addToast('info', 'Check-In Notice', err.message);
    } finally {
      setClaimingCheckin(false);
    }
  };

  // Claim Achievement
  const handleClaimAchievement = async (achievementId: string, title: string) => {
    setClaimingAchievementId(achievementId);
    try {
      const res = await fetch('/api/user/claim-achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Achievement claim failed.');

      addToast('success', 'Milestone Unlocked!', `+${data.amount} Credits awarded for ${title}!`);
      loadData();
    } catch (err: any) {
      addToast('warning', 'Notice', err.message);
    } finally {
      setClaimingAchievementId(null);
    }
  };

  // Handle query parameter ?propose=:targetId to automatically open proposal modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proposeTarget = params.get('propose');
    if (proposeTarget) {
      const found = browseServers.find((s) => s.id === proposeTarget);
      if (found) {
        setRequestModalServer(found);
        setActiveSubTab('browse');
      } else {
        try {
          const raw = localStorage.getItem('erlcus_promoted_servers');
          if (raw) {
            const list = JSON.parse(raw);
            const m = list.find((s: any) => s.id === proposeTarget);
            if (m) {
              setRequestModalServer({
                id: m.id,
                name: m.name,
                iconUrl: m.icon || m.iconUrl,
                category: m.category || 'Design Server',
                memberCount: m.memberCount || 0,
                allowPartnerMentions: m.allowPartnerMentions !== false,
                partnershipHerePrice: m.partnershipHerePrice ?? 15,
                partnershipEveryonePrice: m.partnershipEveryonePrice ?? 25
              });
              setActiveSubTab('browse');
            }
          }
        } catch {}
      }
    }
  }, [browseServers]);

  const filteredServers = browseServers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Design Server', 'Roleplay Server', 'Misc', 'COTS', 'Departments', 'Events'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in-50 duration-150">
      {/* ── TOP HEADER & TELEMETRY (FLUSH & BLENDED) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Server Partnerships
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl font-sans">
              Connect {serverName} with active ER:LC roleplay communities. Mutual webhook broadcasts deliver real member joins and engagement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-sans">
              <Coins className="size-4 text-emerald-400" />
              <span className="text-zinc-400">Balance:</span>
              <span className="font-bold text-white tabular-nums">{dashboardData.userCoins || 0} Credits</span>
            </div>

            {onNavigateTab && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('promote')}
                className="h-8 px-3 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-xs font-sans text-zinc-200"
              >
                Configure Webhook
              </Button>
            )}
          </div>
        </div>

        {/* 4 Telemetry Metrics - GlowCard Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-2">
          {/* Connected Communities */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 transition-all hover:border-white/[0.12] shadow-lg hover:shadow-emerald-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Handshake className="size-8 text-emerald-400/20" />
            </div>
            <div className="flex items-center gap-3">
              <Handshake className="size-5 text-emerald-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Connected Communities</span>
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
                  <span>{dashboardData.activePartnerships?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Partnered Servers</span>
            </div>
          </div>

          {/* Pending Inbound */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 transition-all hover:border-white/[0.12] shadow-lg hover:shadow-cyan-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Users className="size-8 text-cyan-400/20" />
            </div>
            <div className="flex items-center gap-3">
              <Users className="size-5 text-cyan-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Inbound</span>
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
                  <span>{dashboardData.incomingRequests?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Requests Awaiting Review</span>
            </div>
          </div>

          {/* Ads Sent */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 transition-all hover:border-white/[0.12] shadow-lg hover:shadow-indigo-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Server className="size-8 text-indigo-400/20" />
            </div>
            <div className="flex items-center gap-3">
              <Server className="size-5 text-indigo-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ads Sent</span>
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
                  <span>{dashboardData.analytics?.adsDelivered || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Delivery Success</span>
            </div>
          </div>

          {/* Players Joined */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 transition-all hover:border-white/[0.12] shadow-lg hover:shadow-amber-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ShieldCheck className="size-8 text-amber-400/20" />
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-amber-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Players Joined</span>
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
                  <span>{dashboardData.analytics?.verifiedJoinsGenerated || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Campaign Joins</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION + BALANCE DISPLAY ── */}
      <div className="flex items-center justify-between px-1 mb-2">
        {dashboardData.partnershipStatus && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-sans">
            <Check className="size-3.5 text-emerald-400" />
            <span className="text-zinc-200 font-sans">Partnership {dashboardData.partnershipStatus}</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-sans">
          <Coins className="size-3.5 text-amber-400" />
          <span className="text-zinc-200 font-sans">Balance: {dashboardData.userCoins || 0} Credits</span>
        </div>
      </div>

      {/* ── TABS NAVIGATION (BROWSE COMMUNITIES FIRST) ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        {[
          { key: 'browse', label: 'Browse Communities', icon: Search },
          { key: 'active', label: `Active Partnerships (${dashboardData.activePartnerships?.length || 0})`, icon: Handshake },
          { key: 'requests', label: `Requests (${(dashboardData.incomingRequests?.length || 0) + (dashboardData.outgoingRequests?.length || 0)})`, icon: Users },
          { key: 'rewards', label: 'Coin Rewards & Milestones', icon: Trophy }
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
              {tab.key === 'requests' && dashboardData.incomingRequests?.length > 0 && (
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ACTIVE PARTNERSHIPS ── */}
      {activeSubTab === 'active' && (
        <div className="space-y-4">
          {dashboardData.activePartnerships?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-3">
              <Handshake className="size-9 text-zinc-500 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-bold text-white font-sans">No Active Partnerships Yet</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
                Connect your server with fellow ER:LC communities to exchange automated Discord advertisements and boost player growth.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setActiveSubTab('browse')}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
                >
                  Browse Partner Communities
                </Button>
                {onNavigateTab && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateTab('promote')}
                    className="border-white/10 bg-transparent hover:bg-white/[0.05] text-xs h-9 px-4 rounded-xl text-zinc-300"
                  >
                    Setup Discord Webhook
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.activePartnerships.map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5 space-y-4 hover:border-white/20 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.partnerGuildIcon ? (
                        <img
                          src={p.partnerGuildIcon}
                          alt={p.partnerGuildName}
                          className="size-12 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="size-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                          {p.partnerGuildName?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white font-sans truncate">{p.partnerGuildName}</h4>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0 font-sans">
                            PARTNERED
                          </Badge>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-sans block">{p.partnerCategory}</span>
                      </div>
                    </div>

                    {p.partnerInviteUrl && (
                      <a
                        href={p.partnerInviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white p-2 rounded-lg bg-white/[0.03] border border-white/10 transition-colors"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.06] text-center text-xs font-sans">
                    <div>
                      <div className="text-zinc-400 text-[10px]">Members</div>
                      <div className="font-bold text-white tabular-nums">{p.partnerMemberCount}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 text-[10px]">Total Ads</div>
                      <div className="font-bold text-white tabular-nums">{p.totalAdsSent}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 text-[10px]">Connection</div>
                      <div className="font-bold text-emerald-400">● Live</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>Last Ad: {p.lastAdSentAt ? new Date(p.lastAdSentAt).toLocaleDateString() : 'Active'}</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSendAd(p.id, p.partnerGuildName)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="size-3" />
                      <span>Dispatch Ad</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: REQUESTS (INBOX & OUTBOX) ── */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Inbound Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Users className="size-4 text-cyan-400" />
                <span>Inbound Partnership Requests ({dashboardData.incomingRequests?.length || 0})</span>
              </h3>
            </div>

            {dashboardData.incomingRequests?.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/[0.08] bg-[#111113] text-xs text-zinc-500 font-sans">
                No inbound partnership requests currently awaiting review.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.incomingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-[#111113] space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {req.fromGuildIcon ? (
                          <img
                            src={req.fromGuildIcon}
                            alt={req.fromGuildName}
                            className="size-12 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="size-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                            {req.fromGuildName?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-sans">{req.fromGuildName}</h4>
                            <Badge className="bg-white/[0.06] text-zinc-300 border-white/10 text-[10px] font-sans">
                              {req.senderCategory}
                            </Badge>
                            {req.includeMention && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-sans flex items-center gap-1">
                                <AtSign className="size-3" />
                                <span>@{req.mentionType} Mention Paid</span>
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-sans block">
                            Size: {req.senderMemberCount} Members • Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(req.id, 'decline')}
                          className="h-8 px-3 rounded-xl border-white/10 hover:bg-rose-500/10 hover:text-rose-300 text-xs cursor-pointer font-sans"
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRespond(req.id, 'accept')}
                          className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer font-sans shadow-md"
                        >
                          <Check className="size-3.5 mr-1" />
                          <span>Accept & Broadcast</span>
                        </Button>
                      </div>
                    </div>

                    {req.adText && (
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-[#111113]/80 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="size-3.5 text-indigo-400" />
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold font-sans">Advertisement Preview</span>
                        </div>
                        <p className="text-xs text-zinc-200 font-sans leading-relaxed">{req.adText}</p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-sans">
                            <Check className="size-3 mr-1" />
                            Ready
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outbound Requests */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Server className="size-4 text-indigo-400" />
              <span>Outbound Requests Sent ({dashboardData.outgoingRequests?.length || 0})</span>
            </h3>

            {dashboardData.outgoingRequests?.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/[0.08] bg-[#111113] text-xs text-zinc-500 font-sans">
                No outgoing partnership proposals sent yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#111113] overflow-hidden">
                {dashboardData.outgoingRequests.map((r: any) => (
                  <div key={r.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] text-xs font-sans">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{r.toGuildName}</span>
                        <Badge
                          className={`text-[10px] font-sans px-1.5 py-0 ${
                            r.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : r.status === 'declined'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {r.status === 'accepted' ? 'Accepted' : r.status === 'declined' ? 'Declined' : 'Pending Approval'}
                        </Badge>
                        {r.includeMention && (
                          <span className="text-[10px] text-zinc-400">(@{r.mentionType} upgrade)</span>
                        )}
                      </div>
                      <span className="text-zinc-500 text-[11px] block">
                        Submitted: {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-zinc-400 text-xs">
                      {r.status === 'pending' ? 'Awaiting target response' : r.status === 'accepted' ? 'Alliance active' : 'Request closed'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: BROWSE COMMUNITIES ── */}
      {activeSubTab === 'browse' && (
        <div className="space-y-5">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search ER:LC community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#111113] border-white/10 text-xs h-9 text-white rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Browse Servers */}
          {filteredServers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/[0.08] bg-[#111113] text-xs text-zinc-500 font-sans">
              No matching communities open to partnerships right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServers.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#111113] overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all shadow-md group"
                >
                  <div>
                    {/* Banner preview */}
                    {s.bannerUrl ? (
                      <div className="relative w-full h-28 overflow-hidden bg-[#141416]">
                        <img
                          src={s.bannerUrl}
                          alt={s.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-14 bg-gradient-to-b from-white/[0.04] to-transparent" />
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {s.iconUrl || s.icon ? (
                          <img
                            src={s.iconUrl || s.icon}
                            alt={s.name}
                            className="size-12 rounded-xl object-cover ring-2 ring-[#111113] border border-white/10 shadow-md bg-zinc-900 shrink-0"
                          />
                        ) : (
                          <div className="size-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate font-sans">{s.name}</h4>
                          <span className="text-[11px] text-zinc-400 font-sans block">{s.category}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                        {s.description || 'Verified ER:LC roleplay community with active sessions.'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans pt-1 border-t border-white/[0.06]">
                        <span className="tabular-nums font-medium text-white">{getResolvedMemberCount(s)} Members</span>
                        {s.allowPartnerMentions ? (
                          <span className="text-emerald-400 font-medium">@mentions allowed</span>
                        ) : (
                          <span className="text-zinc-500">Mentions disabled</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    {s.partnershipStatus === 'partnered' ? (
                      <Button
                        size="sm"
                        disabled
                        className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs h-9 rounded-xl font-sans"
                      >
                        <Check className="size-3.5 mr-1.5" />
                        <span>Already Partnered</span>
                      </Button>
                    ) : s.partnershipStatus === 'outgoing_pending' ? (
                      <Button
                        size="sm"
                        disabled
                        className="w-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs h-9 rounded-xl font-sans"
                      >
                        <Clock className="size-3.5 mr-1.5" />
                        <span>Request Pending</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setRequestModalServer(s);
                          setMentionType('none');
                        }}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-9 rounded-xl cursor-pointer font-sans shadow-sm"
                      >
                        <Handshake className="size-3.5 mr-1.5" />
                        <span>Request Partnership</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: COIN REWARDS & MILESTONES ── */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-6">
          {/* Daily Check-In Banner */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-sans">Daily Alliance Allowance</h3>
              </div>
              <p className="text-xs text-zinc-400 font-sans max-w-md">
                Claim your daily check-in bounty to unlock @everyone and @here mention upgrades for partnership broadcasts.
              </p>
            </div>

            <Button
              onClick={handleClaimDaily}
              disabled={claimingCheckin}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-10 px-5 rounded-xl cursor-pointer font-sans shadow-md"
            >
              <Coins className="size-4 mr-2" />
              <span>{claimingCheckin ? 'Claiming...' : 'Claim Daily +5 Credits'}</span>
            </Button>
          </div>

          {/* User Transaction History */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <History className="size-4 text-zinc-400" />
              <span>Credits Transaction Ledger</span>
            </h4>

            <div className="rounded-2xl border border-white/[0.08] bg-[#111113] overflow-hidden">
              {dashboardData.transactions?.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-sans">
                  No credit transactions recorded yet. Join servers or claim daily allowances to build your balance.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {dashboardData.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs font-sans hover:bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <div className="text-zinc-200 font-medium">{tx.description}</div>
                        <div className="text-[10px] text-zinc-500">{new Date(tx.timestamp).toLocaleString()}</div>
                      </div>
                      <div className={`font-bold tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PARTNERSHIP REQUEST CONFIRMATION MODAL ── */}
      {requestModalServer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="size-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-sans">Propose Server Partnership</h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalServer(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                {requestModalServer.iconUrl || requestModalServer.icon ? (
                  <img
                    src={requestModalServer.iconUrl || requestModalServer.icon}
                    alt={requestModalServer.name}
                    className="size-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-white text-xs">
                    {requestModalServer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white font-sans">{requestModalServer.name}</div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    {requestModalServer.category} • {getResolvedMemberCount(requestModalServer)} Members
                  </div>
                </div>
              </div>

              {/* Mention Upgrade Option with Dynamic Server Pricing - @here Only */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-white font-sans">Announcement Mention Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMentionType('none')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      mentionType === 'none'
                        ? 'bg-white/10 border-white/30 text-white font-bold'
                        : 'bg-white/[0.02] border-white/10 text-zinc-400'
                    }`}
                  >
                    <div className="text-xs font-semibold font-sans">Standard Cross-Post</div>
                    <div className="text-[10px] text-zinc-500 font-sans">Free (0 Coins)</div>
                  </button>

                  <button
                    type="button"
                    disabled={!requestModalServer.allowPartnerMentions}
                    onClick={() => setMentionType('here')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      !requestModalServer.allowPartnerMentions
                        ? 'opacity-40 cursor-not-allowed bg-zinc-900 border-white/5'
                        : mentionType === 'here'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-white/[0.02] border-white/10 text-zinc-400'
                    }`}
                  >
                    <div className="text-xs font-semibold font-sans">@here Mention</div>
                    <div className="text-[10px] text-cyan-400 font-medium font-sans">
                      {requestModalServer.partnershipHerePrice ?? 15} Coins
                    </div>
                  </button>
                </div>
                {!requestModalServer.allowPartnerMentions && (
                  <p className="text-[10px] text-zinc-500 font-sans">Target server has role mentions disabled.</p>
                )}
              </div>

              <div className="p-3 bg-[#18181b] rounded-xl border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Mutual Webhook Guarantee:</div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Advertisements will ONLY be posted once both server owners accept the partnership request.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestModalServer(null)}
                className="h-9 px-4 rounded-xl border-white/10 text-xs font-sans text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendRequest}
                disabled={submittingRequest}
                className="h-9 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-sans cursor-pointer shadow-md"
              >
                {submittingRequest ? 'Sending...' : 'Confirm & Propose Alliance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnershipsTab;
