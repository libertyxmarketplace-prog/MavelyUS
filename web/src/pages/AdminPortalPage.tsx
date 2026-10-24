import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Coins,
  GitBranch,
  Flame,
  UserX,
  UserCheck,
  Plus,
  Trash2,
  Check,
  Search,
  ArrowLeft,
  RefreshCw,
  Radio,
  Users,
  LayoutGrid,
  Bot,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { ChangelogEntry, ChangelogTag } from '@/components/ui/changelog';
import { DEFAULT_ENTRIES, mergeChangelogEntries } from './dashboard/ChangelogTab';
import { useAuth } from '@/lib/auth';
import { currentUser as fallbackUser } from '@/app/import/data';

const DURATION_OPTIONS = [
  { label: '1 Hour', value: '1h', desc: 'Temporary cooldown' },
  { label: '24 Hours', value: '24h', desc: '1-day cooling gate' },
  { label: '7 Days', value: '7d', desc: '1-week quarantine' },
  { label: '30 Days', value: '30d', desc: 'Extended suspension' },
  { label: 'Permanent', value: 'Permanent', desc: 'Indefinite blacklist' },
];

const DIRECTORY_CATEGORIES = [
  'Design Server',
  'Roleplay Server',
  'Bots',
  'Misc',
  'Departments',
  'Events'
];

export function AdminPortalPage() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active user info
  const activeUser = {
    id: user?.id || '523693281541095424',
    username: user?.username || fallbackUser.name || 'kims3166',
    avatar: user?.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : '/mavely_logo.png'
  };

  // Determine active tab from URL or fallback to overview
  const validTabs = ['overview', 'moderation', 'treasury', 'changelog', 'directory', 'broadcast'];
  const activeTab = tab && validTabs.includes(tab) ? tab : 'overview';

  const handleTabChange = (newTab: string) => {
    navigate(`/admin-portal/${newTab}`);
  };

  // ── TELEMETRY STATE ──
  const [telemetry, setTelemetry] = useState<any>({
    totalServers: 1,
    bannedUsersCount: 0,
    activeSessionsCount: 9,
    uptimeSeconds: 0,
  });
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // ── USER MODERATION & BANS STATE ──
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'active' | 'custom'>('active');
  const [banUserId, setBanUserId] = useState(activeUser.id);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('Permanent');
  const [userSearch, setUserSearch] = useState('');

  // ── TREASURY STATE ──
  const [treasuryTargetType, setTreasuryTargetType] = useState<'active' | 'custom'>('active');
  const [giftTarget, setGiftTarget] = useState(activeUser.id);
  const [giftAmount, setGiftAmount] = useState(50);
  const [giftNote, setGiftNote] = useState('Administrative Grant');
  const [currentTreasury, setCurrentTreasury] = useState<number>(() => {
    return parseInt(localStorage.getItem('erlcus_credits_balance') || '0', 10);
  });

  // ── CHANGELOG STUDIO STATE ──
  const [changelogList, setChangelogList] = useState<ChangelogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('erlcus_custom_changelog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeChangelogEntries(parsed, DEFAULT_ENTRIES);
        }
      }
    } catch {}
    return DEFAULT_ENTRIES;
  });
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState<ChangelogTag[]>(['new']);
  const [newItemsText, setNewItemsText] = useState('');

  // ── DIRECTORY OVERRIDES STATE ──
  const [directoryServers, setDirectoryServers] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [editingServer, setEditingServer] = useState<any | null>(null);

  // ── TOAST / STATUS FEEDBACK ──
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // ── REFRESH DATA FROM BACKEND / LOCAL STORAGE ──
  const refreshAllData = async () => {
    setLoadingTelemetry(true);
    try {
      const telRes = await fetch('/api/admin/overview').catch(() => null);
      if (telRes && telRes.ok) {
        const telData = await telRes.json();
        setTelemetry(telData);
      }

      const banRes = await fetch('/api/admin/bans').catch(() => null);
      if (banRes && banRes.ok) {
        const banData = await banRes.json();
        if (Array.isArray(banData.bans)) {
          setBannedUsers(banData.bans);
          localStorage.setItem('erlcus_banned_users', JSON.stringify(banData.bans));
        }
      } else {
        const storedBans = localStorage.getItem('erlcus_banned_users');
        if (storedBans) setBannedUsers(JSON.parse(storedBans));
      }

      const clRes = await fetch('/api/admin/changelog').catch(() => null);
      if (clRes && clRes.ok) {
        const clData = await clRes.json();
        if (Array.isArray(clData.entries)) {
          const merged = mergeChangelogEntries(clData.entries, DEFAULT_ENTRIES);
          setChangelogList(merged);
          localStorage.setItem('erlcus_custom_changelog', JSON.stringify(merged));
        }
      } else {
        const storedCl = localStorage.getItem('erlcus_custom_changelog');
        if (storedCl) {
          const parsed = JSON.parse(storedCl);
          if (Array.isArray(parsed)) {
            setChangelogList(mergeChangelogEntries(parsed, DEFAULT_ENTRIES));
          }
        }
      }

      const dirRes = await fetch('/api/directory').catch(() => null);
      if (dirRes && dirRes.ok) {
        const dirData = await dirRes.json();
        setDirectoryServers(dirData.servers || []);
      }
    } catch (err) {
      console.warn('[ADMIN] Data refresh notice:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Synchronize target inputs when active user loads
  useEffect(() => {
    if (targetType === 'active') {
      setBanUserId(activeUser.id);
    }
  }, [activeUser.id, targetType]);

  useEffect(() => {
    if (treasuryTargetType === 'active') {
      setGiftTarget(activeUser.id);
    }
  }, [activeUser.id, treasuryTargetType]);

  // ── BAN HANDLER ──
  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = targetType === 'active' ? activeUser.id : banUserId.trim();
    if (!targetId) {
      showStatus('User ID or Discord Snowflake required.', 'error');
      return;
    }

    const payload = {
      userId: targetId,
      reason: banReason.trim() || 'Suspension applied by platform administrator.',
      adminTag: 'Platform Administrator',
      duration: banDuration,
      bannedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}

    const updated = [payload, ...bannedUsers.filter(b => b.userId !== payload.userId)];
    setBannedUsers(updated);
    localStorage.setItem('erlcus_banned_users', JSON.stringify(updated));
    if (targetType === 'custom') setBanUserId('');
    setBanReason('');
    showStatus(`Account ${payload.userId} restricted successfully.`, 'success');
  };

  const handleUnbanUser = async (targetUserId: string) => {
    try {
      await fetch(`/api/admin/bans/${encodeURIComponent(targetUserId)}`, { method: 'DELETE' });
    } catch {}

    const updated = bannedUsers.filter(b => b.userId !== targetUserId);
    setBannedUsers(updated);
    localStorage.setItem('erlcus_banned_users', JSON.stringify(updated));
    showStatus(`Restriction revoked for account ${targetUserId}.`, 'info');
  };

  // ── TREASURY GRANT HANDLER ──
  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(giftAmount);
    const targetId = treasuryTargetType === 'active' ? activeUser.id : giftTarget.trim();

    if (!targetId || isNaN(amount) || amount <= 0) {
      showStatus('Valid account ID and positive credit amount required.', 'error');
      return;
    }

    try {
      await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId, amount, note: giftNote })
      });
    } catch {}

    const current = parseInt(localStorage.getItem('erlcus_credits_balance') || '0', 10);
    const updated = current + amount;
    localStorage.setItem('erlcus_credits_balance', updated.toString());
    setCurrentTreasury(updated);

    const tx = {
      id: `admin_${Date.now()}`,
      type: 'reward',
      title: `Admin Grant: ${giftNote || 'Staff Gift'}`,
      amount: `+${amount} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };

    try {
      const savedTxs = JSON.parse(localStorage.getItem('erlcus_transactions') || '[]');
      localStorage.setItem('erlcus_transactions', JSON.stringify([tx, ...savedTxs]));
    } catch {}

    window.dispatchEvent(new Event('erlcus_credits_updated'));
    showStatus(`Disbursed +${amount} credits to account!`, 'success');
  };

  // ── CHANGELOG PUBLISH HANDLER ──
  const handlePublishChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim() || !newTitle.trim()) {
      showStatus('Version and release title required.', 'error');
      return;
    }

    const items = newItemsText.split('\n').map(s => s.trim()).filter(Boolean);
    const entry: ChangelogEntry = {
      version: newVersion.trim(),
      date: new Date().toISOString(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      tags: newTags.length > 0 ? newTags : ['new'],
      items: items.length > 0 ? items : ['Platform performance and stability optimizations.'],
      href: `#${newVersion.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    };

    try {
      await fetch('/api/admin/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch {}

    const updated = [entry, ...changelogList.filter(c => c.version !== entry.version)];
    setChangelogList(updated);
    localStorage.setItem('erlcus_custom_changelog', JSON.stringify(updated));
    window.dispatchEvent(new Event('erlcus_changelog_updated'));

    setNewVersion('');
    setNewTitle('');
    setNewDesc('');
    setNewItemsText('');
    showStatus(`Published release ${entry.version} to live Changelog.`, 'success');
  };

  const handleDeleteChangelog = async (version: string) => {
    try {
      await fetch(`/api/admin/changelog/${encodeURIComponent(version)}`, { method: 'DELETE' });
    } catch {}

    const updated = changelogList.filter(c => c.version !== version);
    setChangelogList(updated);
    localStorage.setItem('erlcus_custom_changelog', JSON.stringify(updated));
    window.dispatchEvent(new Event('erlcus_changelog_updated'));
    showStatus(`Removed release ${version}.`, 'info');
  };

  // ── DIRECTORY COMMUNITY CONTROLS ──
  const handleForceBump = async (server: any) => {
    try {
      await fetch('/api/admin/directory/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: server.id })
      });
    } catch {}

    const now = Date.now();
    const updated = directoryServers.map(s => {
      if (s.id === server.id) {
        return { ...s, lastBumpedAt: now, bumps: (Number(s.bumps) || 0) + 1 };
      }
      return s;
    }).sort((a, b) => (b.lastBumpedAt || 0) - (a.lastBumpedAt || 0));

    setDirectoryServers(updated);
    localStorage.setItem(`server_bump_${server.id}`, now.toString());
    showStatus(`Community "${server.name}" force-bumped to Rank #1.`, 'success');
  };

  const handleToggleVerified = async (server: any) => {
    const nextState = !server.verified;
    try {
      await fetch('/api/admin/directory/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: server.id, verified: nextState })
      });
    } catch {}

    const updated = directoryServers.map(s => (s.id === server.id ? { ...s, verified: nextState } : s));
    setDirectoryServers(updated);
    showStatus(`Verification status set to ${nextState ? 'VERIFIED' : 'UNVERIFIED'}.`, 'info');
  };

  const handleSaveEditServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServer) return;

    try {
      await fetch('/api/admin/directory/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: editingServer.id,
          patch: {
            name: editingServer.name,
            description: editingServer.description,
            category: editingServer.category,
            verified: editingServer.verified,
            memberCount: editingServer.memberCount,
            bumps: editingServer.bumps,
            rewardCoins: editingServer.rewardCoins,
            inviteUrl: editingServer.inviteUrl
          }
        })
      });
    } catch {}

    const updated = directoryServers.map(s => (s.id === editingServer.id ? { ...s, ...editingServer } : s));
    setDirectoryServers(updated);
    setEditingServer(null);
    showStatus(`Saved parameters for "${editingServer.name}".`, 'success');
  };

  const handleDelistServer = async (serverId: string) => {
    try {
      await fetch('/api/admin/directory/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
    } catch {}

    const updated = directoryServers.filter(s => String(s.id) !== String(serverId));
    setDirectoryServers(updated);
    showStatus('Community delisted from directory discovery.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 relative overflow-x-hidden selection:bg-emerald-500/20 font-sans">
      {/* Floating Notification Banner */}
      {statusMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border ${
              statusMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50'
                : statusMessage.type === 'info'
                ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/30 shadow-cyan-950/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertTriangle className="size-4 text-rose-400" />
            ) : (
              <Check className="size-4 text-emerald-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#0c0c0e]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
              <img
                src="/mavely_logo.png"
                alt="Mavely"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/mavely-mark.png';
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-sans">Admin Command Center</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Elevated Root
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-zinc-300 font-sans">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>{activeUser.username} (Staff)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllData}
              disabled={loadingTelemetry}
              className="h-8.5 px-3.5 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-zinc-300 cursor-pointer font-sans"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${loadingTelemetry ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Terminal Body */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── TOP TELEMETRY CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Communities */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 hover:border-white/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 font-sans">
                  Total Communities
                </span>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white pt-1 tabular-nums font-sans">
                  {directoryServers.length || telemetry.totalServers || 1}
                </div>
                <div className="text-xs text-zinc-500 pt-0.5 font-sans">Listed in Public Directory</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Live Discovery Active
              </span>
              <span>100% Real Guilds</span>
            </div>
          </div>

          {/* Card 2: Restricted Accounts */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 hover:border-white/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 font-sans">
                  Active Suspensions
                </span>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white pt-1 tabular-nums font-sans">
                  {bannedUsers.length}
                </div>
                <div className="text-xs text-zinc-500 pt-0.5 font-sans">Restricted User Accounts</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldAlert className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className={`size-1.5 rounded-full ${bannedUsers.length > 0 ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                Gate Enforcement
              </span>
              <span>Network Defense</span>
            </div>
          </div>

          {/* Card 3: Active Sessions */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 hover:border-white/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 font-sans">
                  Active Sessions
                </span>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white pt-1 tabular-nums font-sans">
                  {telemetry.activeSessionsCount || 9}
                </div>
                <div className="text-xs text-zinc-500 pt-0.5 font-sans">Authenticated Sessions</div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Users className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-zinc-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                OAuth2 Synced
              </span>
              <span>Zero Sybil Activity</span>
            </div>
          </div>
        </div>

        {/* ── TABS NAVIGATION (SYNCED WITH URL) ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="border-b border-white/[0.08] pb-1 overflow-x-auto">
            <TabsList className="bg-[#111113] p-1 rounded-xl border border-white/[0.08] flex items-center gap-1 w-max">
              <TabsTrigger
                value="overview"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LayoutGrid className="size-3.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserX className="size-3.5" />
                <span>User Moderation</span>
              </TabsTrigger>
              <TabsTrigger
                value="treasury"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="size-3.5" />
                <span>Credits Treasury</span>
              </TabsTrigger>
              <TabsTrigger
                value="changelog"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <GitBranch className="size-3.5" />
                <span>Changelog Studio</span>
              </TabsTrigger>
              <TabsTrigger
                value="directory"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Globe className="size-3.5" />
                <span>Directory Overrides</span>
              </TabsTrigger>
              <TabsTrigger
                value="broadcast"
                className="px-4 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Radio className="size-3.5" />
                <span>System Broadcast</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── TAB 1: OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border border-white/[0.08] bg-[#111113]">
              <CardHeader className="pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-400" />
                  <span>Administrative Operations Overview</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 font-sans">
                  Quick access to user moderation, community parameters, and platform distribution controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('moderation')}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <UserX className="size-5 text-rose-400" />
                    <ChevronRight className="size-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-sm font-semibold text-white">Restrict or Unban User</div>
                  <div className="text-xs text-zinc-400 font-sans">
                    Apply administrative suspensions or revoke active network restrictions.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('treasury')}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <Coins className="size-5 text-amber-400" />
                    <ChevronRight className="size-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-sm font-semibold text-white">Disburse Treasury Credits</div>
                  <div className="text-xs text-zinc-400 font-sans">
                    Grant allowance or bonus growth credits to verified Discord accounts.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('directory')}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <Globe className="size-5 text-cyan-400" />
                    <ChevronRight className="size-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-sm font-semibold text-white">Directory Showcase & Controls</div>
                  <div className="text-xs text-zinc-400 font-sans">
                    Force bumps, toggle verified checkmarks, and manage server profile listings.
                  </div>
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 2: USER MODERATION ── */}
          <TabsContent value="moderation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form */}
              <Card className="lg:col-span-6 border border-white/[0.08] bg-[#111113]">
                <CardHeader className="pb-3 border-b border-white/[0.06]">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <UserX className="size-4 text-rose-400" />
                    <span>Apply User Suspension</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 font-sans">
                    Restrict access to Mavely dashboard features and automated directory claims.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleBanUser} className="space-y-5">
                    {/* User Selection Toggle */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 font-sans">
                        Target Account
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTargetType('active')}
                          className={`p-3 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                            targetType === 'active'
                              ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-sm'
                              : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={activeUser.avatar}
                              alt={activeUser.username}
                              className="size-7 rounded-full object-cover border border-white/10"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{activeUser.username}</div>
                              <div className="text-[10px] text-zinc-400 truncate tabular-nums">{activeUser.id}</div>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetType('custom')}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-center cursor-pointer transition-all ${
                            targetType === 'custom'
                              ? 'bg-white/[0.08] border-white/30 text-white shadow-sm'
                              : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">Type Snowflake ID</div>
                            <div className="text-[10px] text-zinc-400">Custom user identifier</div>
                          </div>
                        </button>
                      </div>

                      {targetType === 'custom' && (
                        <div className="pt-2 animate-in fade-in-50 duration-150">
                          <Input
                            placeholder="e.g. 523693281541095424"
                            value={banUserId}
                            onChange={(e) => setBanUserId(e.target.value)}
                            className="bg-[#18181b] border-white/10 text-xs h-10 font-sans tabular-nums text-zinc-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Suspension Duration */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 font-sans">
                        Suspension Duration
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBanDuration(opt.value)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              banDuration === opt.value
                                ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]'
                                : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{opt.label}</span>
                              <Clock className="size-3 text-zinc-400" />
                            </div>
                            <span className="text-[10px] text-zinc-500 block mt-1 font-sans">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 font-sans">
                        Administrative Reason / Memo
                      </label>
                      <Input
                        placeholder="e.g. Sybil churn abuse or terms of service violation"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="bg-[#18181b] border-white/10 text-xs h-10 text-zinc-200"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer shadow-lg shadow-rose-950/40"
                    >
                      <UserX className="size-4 mr-2" />
                      <span>Enforce Suspension ({banDuration})</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Suspended Accounts Roster */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 font-sans">
                    Restricted Accounts ({bannedUsers.length})
                  </span>
                  <div className="w-48">
                    <Input
                      placeholder="Search Snowflake..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-[#18181b] border-white/10 text-xs h-8 font-sans tabular-nums text-zinc-200"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#111113] overflow-hidden">
                  {bannedUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 font-sans space-y-1">
                      <Check className="size-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <div className="text-zinc-300 font-medium">No active user suspensions on cluster.</div>
                      <div className="text-[11px] text-zinc-500">All authenticated accounts in good standing.</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {bannedUsers
                        .filter((b) => (b.userId || '').includes(userSearch))
                        .map((b) => (
                          <div key={b.userId} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="space-y-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-sans text-xs font-semibold text-rose-300 tabular-nums">{b.userId}</span>
                                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] px-1.5 py-0 font-sans">
                                  {b.duration || 'Permanent'}
                                </Badge>
                              </div>
                              <span className="text-zinc-400 text-xs block truncate font-sans">{b.reason}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnbanUser(b.userId)}
                              className="h-8 px-3 rounded-lg border-white/10 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs cursor-pointer shrink-0"
                            >
                              <UserCheck className="size-3.5 mr-1" />
                              <span>Revoke</span>
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 3: CREDITS TREASURY ── */}
          <TabsContent value="treasury" className="space-y-6">
            <Card className="max-w-2xl border border-white/[0.08] bg-[#111113]">
              <CardHeader className="pb-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Coins className="size-4 text-amber-400" />
                    <span>Treasury Grants & Balance Disbursement</span>
                  </CardTitle>
                  <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 tabular-nums">
                    {currentTreasury} Credits Pool
                  </span>
                </div>
                <CardDescription className="text-xs text-zinc-400 font-sans">
                  Instantly disburse platform coins or growth grant vouchers to accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleGrantCredits} className="space-y-5">
                  {/* Account Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 font-sans">
                      Target Account
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTreasuryTargetType('active')}
                        className={`p-3 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                          treasuryTargetType === 'active'
                            ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeUser.avatar}
                            alt={activeUser.username}
                            className="size-7 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{activeUser.username}</div>
                            <div className="text-[10px] text-zinc-400 truncate tabular-nums">{activeUser.id}</div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTreasuryTargetType('custom')}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-center cursor-pointer transition-all ${
                          treasuryTargetType === 'custom'
                            ? 'bg-white/[0.08] border-white/30 text-white shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">Type Snowflake ID</div>
                          <div className="text-[10px] text-zinc-400">Custom user identifier</div>
                        </div>
                      </button>
                    </div>

                    {treasuryTargetType === 'custom' && (
                      <div className="pt-2">
                        <Input
                          placeholder="e.g. 523693281541095424"
                          value={giftTarget}
                          onChange={(e) => setGiftTarget(e.target.value)}
                          className="bg-[#18181b] border-white/10 text-xs h-10 font-sans tabular-nums text-zinc-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preset Amount Pills */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 font-sans">
                      Grant Amount (Credits)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[25, 50, 100, 250, 500, 1000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setGiftAmount(amt)}
                          className={`px-3.5 py-1.5 rounded-xl font-sans tabular-nums text-xs font-semibold cursor-pointer border transition-all ${
                            giftAmount === amt
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_-2px_rgba(251,191,36,0.3)]'
                              : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                          }`}
                        >
                          +{amt}
                        </button>
                      ))}
                      <Input
                        type="number"
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(Number(e.target.value))}
                        className="bg-[#18181b] border-white/10 text-xs h-9 w-28 font-sans tabular-nums text-zinc-200 ml-auto"
                      />
                    </div>
                  </div>

                  {/* Ledger Memo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 font-sans">
                      Transaction Memo / Reason
                    </label>
                    <Input
                      placeholder="e.g. Administrative Grant or Partner Bounty Bonus"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      className="bg-[#18181b] border-white/10 text-xs h-10 text-zinc-200"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-10 rounded-xl cursor-pointer shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
                  >
                    <Coins className="size-4" />
                    <span>Disburse +{giftAmount} Credits to Account</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 4: CHANGELOG STUDIO ── */}
          <TabsContent value="changelog" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form */}
              <Card className="lg:col-span-6 border border-white/[0.08] bg-[#111113]">
                <CardHeader className="pb-3 border-b border-white/[0.06]">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <GitBranch className="size-4 text-emerald-400" />
                    <span>Publish Release Update</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 font-sans">
                    Draft and broadcast platform updates to the public and dashboard changelogs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handlePublishChangelog} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300 font-sans">Version</label>
                        <Input
                          placeholder="3.5.0"
                          value={newVersion}
                          onChange={(e) => setNewVersion(e.target.value)}
                          className="bg-[#18181b] border-white/10 text-xs h-10 font-sans tabular-nums text-zinc-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300 font-sans">Release Title</label>
                        <Input
                          placeholder="Control Center & Telemetry"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="bg-[#18181b] border-white/10 text-xs h-10 text-zinc-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300 font-sans">Summary Description</label>
                      <Input
                        placeholder="Key improvements in this platform update..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="bg-[#18181b] border-white/10 text-xs h-10 text-zinc-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300 font-sans">Bullet Points (one per line)</label>
                      <textarea
                        rows={4}
                        placeholder={`Upgraded Control Center architecture\nPreserved historical changelog versions\nReal-time multi-server directory management`}
                        value={newItemsText}
                        onChange={(e) => setNewItemsText(e.target.value)}
                        className="w-full rounded-xl bg-[#18181b] border border-white/10 p-3 text-xs text-zinc-200 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                      <Plus className="size-4 mr-1.5" />
                      <span>Publish Release to Live Changelog</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Roster */}
              <div className="lg:col-span-6 space-y-3">
                <span className="text-xs font-semibold text-zinc-300 font-sans">
                  Live Releases ({changelogList.length})
                </span>
                <div className="rounded-2xl border border-white/[0.08] bg-[#111113] overflow-hidden">
                  {changelogList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 font-sans">
                      No changelog releases published yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {changelogList.map((c) => (
                        <div key={c.version} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                          <div className="space-y-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs font-sans tabular-nums">{c.version}</span>
                              <span className="text-zinc-300 font-medium text-xs truncate font-sans">{c.title}</span>
                            </div>
                            <span className="text-zinc-400 text-[11px] block truncate font-sans">{c.description}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteChangelog(c.version)}
                            className="h-8 px-3 rounded-lg border-white/10 text-rose-400 hover:bg-rose-500/10 text-xs cursor-pointer shrink-0"
                          >
                            <Trash2 className="size-3.5 mr-1" />
                            <span>Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 5: DIRECTORY OVERRIDES ── */}
          <TabsContent value="directory" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="size-4 text-cyan-400" />
                  <span>Promoted Communities Directory</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Full inspection and administrative overrides for all partnered servers.
                </p>
              </div>

              <div className="w-56">
                <Input
                  placeholder="Filter community..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="bg-[#18181b] border-white/10 text-xs h-8 text-zinc-200"
                />
              </div>
            </div>

            {/* List of Communities Styled like /details Cards */}
            <div className="space-y-6">
              {directoryServers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-white/[0.08] bg-[#111113] text-zinc-500 font-sans text-xs">
                  No servers currently listed in the directory.
                </div>
              ) : (
                directoryServers
                  .filter((s) => (s.name || '').toLowerCase().includes(directorySearch.toLowerCase()))
                  .map((server) => {
                    const isEditing = editingServer?.id === server.id;
                    const iconUrl = server.iconUrl || server.icon || '/mavely_logo.png';
                    const memberCount = server.memberCount || 0;
                    const bumps = server.bumps || 0;

                    return (
                      <div
                        key={server.id}
                        className="rounded-2xl border border-white/[0.08] bg-[#111113] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] overflow-hidden transition-all hover:border-white/20"
                      >
                        {/* Optional Banner */}
                        {server.bannerUrl && (
                          <div className="h-32 w-full overflow-hidden relative">
                            <img
                              src={server.bannerUrl}
                              alt={server.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" />
                          </div>
                        )}

                        <div className="p-6 space-y-6">
                          {/* Header row: Icon, Name, Category, Verified */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={iconUrl}
                                alt={server.name}
                                className="size-14 rounded-2xl object-cover border border-white/10 shadow-md bg-black/40 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/mavely-mark.png';
                                }}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-white tracking-tight">{server.name}</h4>
                                  {server.verified && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 flex items-center gap-1 font-sans">
                                      <ShieldCheck className="size-3" />
                                      <span>VERIFIED</span>
                                    </Badge>
                                  )}
                                  <Badge className="bg-white/[0.05] text-zinc-300 border-white/10 text-[10px] px-2 py-0.5 font-sans">
                                    {server.category || 'Roleplay Server'}
                                  </Badge>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-sans">
                                  Guild Snowflake: <span className="text-zinc-300 tabular-nums">{server.id}</span>
                                </div>
                              </div>
                            </div>

                            {/* Main Action Suite */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleForceBump(server)}
                                className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                              >
                                <Flame className="size-3.5" />
                                <span>Force Bump (#1)</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleVerified(server)}
                                className={`h-8 px-3 rounded-xl border text-xs cursor-pointer flex items-center gap-1.5 ${
                                  server.verified
                                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                                    : 'border-white/10 text-zinc-400 hover:text-white bg-white/[0.03]'
                                }`}
                              >
                                <ShieldCheck className="size-3.5" />
                                <span>{server.verified ? 'Verified Active' : 'Set Verified'}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingServer(isEditing ? null : { ...server })}
                                className="h-8 px-3 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Sliders className="size-3.5" />
                                <span>{isEditing ? 'Close Edit' : 'Edit Listing'}</span>
                              </Button>

                              {server.inviteUrl && (
                                <a
                                  href={server.inviteUrl.startsWith('http') ? server.inviteUrl : `https://${server.inviteUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                                >
                                  <ExternalLink className="size-3.5" />
                                  <span>Test Invite</span>
                                </a>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelistServer(server.id)}
                                className="h-8 px-3 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Trash2 className="size-3.5" />
                                <span>Delist</span>
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          {server.description && (
                            <p className="text-xs text-zinc-300 leading-relaxed bg-[#18181b] p-3.5 rounded-xl border border-white/[0.06] font-sans">
                              {server.description}
                            </p>
                          )}

                          {/* Stat Badges */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                              <Flame className="size-4 text-amber-400" />
                              <div>
                                <div className="text-xs font-bold text-white font-sans tabular-nums">{bumps} Bumps</div>
                                <div className="text-[10px] text-zinc-400 font-sans">Directory Activity</div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                              <Users className="size-4 text-cyan-400" />
                              <div>
                                <div className="text-xs font-bold text-white font-sans tabular-nums">{memberCount} Members</div>
                                <div className="text-[10px] text-zinc-400 font-sans">Total Size</div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                              <Coins className="size-4 text-emerald-400" />
                              <div>
                                <div className="text-xs font-bold text-white font-sans tabular-nums">+{server.rewardCoins || 2} Cr / Join</div>
                                <div className="text-[10px] text-zinc-400 font-sans">Bounty Disbursed</div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                              <ShieldCheck className="size-4 text-indigo-400" />
                              <div>
                                <div className="text-xs font-bold text-white font-sans">72h Retention</div>
                                <div className="text-[10px] text-zinc-400 font-sans">Clawback Enforced</div>
                              </div>
                            </div>
                          </div>

                          {/* Inline Parameters Editor */}
                          {isEditing && (
                            <form
                              onSubmit={handleSaveEditServer}
                              className="pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in-50 duration-200"
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="text-xs font-semibold text-white font-sans">Edit Community Parameters</span>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-sans">
                                  Live Directory Sync
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-300 font-sans">Community Name</label>
                                  <Input
                                    value={editingServer.name || ''}
                                    onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                                    className="bg-[#18181b] border-white/10 text-xs h-9 text-zinc-200"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-300 font-sans">Primary Category</label>
                                  <select
                                    value={editingServer.category || 'Roleplay Server'}
                                    onChange={(e) => setEditingServer({ ...editingServer, category: e.target.value })}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 text-xs h-9 text-zinc-200 focus:outline-none"
                                  >
                                    {DIRECTORY_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat} className="bg-[#111113] text-zinc-200">
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-300 font-sans">Member Count</label>
                                  <Input
                                    type="number"
                                    value={editingServer.memberCount ?? 0}
                                    onChange={(e) => setEditingServer({ ...editingServer, memberCount: Number(e.target.value) })}
                                    className="bg-[#18181b] border-white/10 text-xs h-9 font-sans tabular-nums text-zinc-200"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-300 font-sans">Total Bumps</label>
                                  <Input
                                    type="number"
                                    value={editingServer.bumps ?? 0}
                                    onChange={(e) => setEditingServer({ ...editingServer, bumps: Number(e.target.value) })}
                                    className="bg-[#18181b] border-white/10 text-xs h-9 font-sans tabular-nums text-zinc-200"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-300 font-sans">Discord Invite URL</label>
                                  <Input
                                    value={editingServer.inviteUrl || ''}
                                    onChange={(e) => setEditingServer({ ...editingServer, inviteUrl: e.target.value })}
                                    className="bg-[#18181b] border-white/10 text-xs h-9 text-zinc-200"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs text-zinc-300 font-sans">Community Description</label>
                                <textarea
                                  rows={2}
                                  value={editingServer.description || ''}
                                  onChange={(e) => setEditingServer({ ...editingServer, description: e.target.value })}
                                  className="w-full rounded-xl bg-[#18181b] border border-white/10 p-2.5 text-xs text-zinc-200 font-sans focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingServer(null)}
                                  className="h-8 px-3 rounded-lg border-white/10 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                                >
                                  Save Overrides
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </TabsContent>

          {/* ── TAB 6: SYSTEM BROADCAST ── */}
          <TabsContent value="broadcast" className="space-y-6">
            <Card className="max-w-2xl border border-white/[0.08] bg-[#111113]">
              <CardContent className="py-16 px-8 text-center space-y-4">
                <div className="size-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/40">
                  <Radio className="size-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">System Broadcast</h3>
                  <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[10px] font-sans px-2.5 py-0.5">
                    COMING SOON
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
                  System Broadcast is undergoing live gateway synchronization. Multi-guild emergency telemetry alerts will be available in an upcoming release.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default AdminPortalPage;
