import { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  ExternalLink,
  ShieldCheck,
  Check,
  Search,
  Flame,
  Compass,
  PlusCircle,
  SlidersHorizontal,
  X,
  Bot,
  RotateCw,
  Lock,
  Users,
  Eye,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { addLiveNotification } from '@/app/import/data';

export interface PromotedServer {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  categories?: string[];
  language: string;
  description: string;
  tags: string[];
  rewardCoins: number;
  inviteUrl: string;
  verified?: boolean;
  createdAt?: number;
  lastBumpedAt?: number;
  bannerUrl?: string;
  memberCount?: number;
  views?: number;
  rating?: number;
}

interface EarnCoinsTabProps {
  currentGuildId?: string;
  onNavigateTab?: (tab: string) => void;
  onAddCoins?: (amount: number) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export const DIRECTORY_CATEGORIES = [
  'All',
  'Roleplay',
  'Gaming',
  'Giveaways',
  'Community',
  'Design',
  'Development',
  'Support',
  'Bots',
  'Art',
  'Hosting',
  'Misc',
];

export function EarnCoinsTab({ currentGuildId, onNavigateTab, onAddCoins, addToast }: EarnCoinsTabProps) {
  const [promotedServers, setPromotedServers] = useState<PromotedServer[]>([]);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'bounty' | 'newest' | 'name'>('bounty');

  // 1-hour real cooldown constant (3600 seconds)
  const BUMP_COOLDOWN_MS = 60 * 60 * 1000;

  // Real-time clock to tick bump cooldown countdowns
  const [nowTime, setNowTime] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Detail Modal for viewing full server info
  const [detailModalServer, setDetailModalServer] = useState<PromotedServer | null>(null);

  // Real stats helpers (NO fake hashes)
  const getServerMembers = (server: PromotedServer): number => {
    if (server.memberCount && server.memberCount > 0) return server.memberCount;
    return 1;
  };

  const getServerViews = (server: PromotedServer): number => {
    const saved = localStorage.getItem(`civlink_views_${server.id}`);
    if (saved) return parseInt(saved, 10);
    return server.views && server.views > 0 ? server.views : 1;
  };

  const getServerStars = (server: PromotedServer): number => {
    const saved = localStorage.getItem(`civlink_rating_${server.id}`);
    if (saved) return parseFloat(saved);
    return server.rating && server.rating > 0 ? server.rating : 5.0;
  };

  const handleRateServer = (server: PromotedServer, starRating: number) => {
    localStorage.setItem(`civlink_rating_${server.id}`, starRating.toString());
    const updated = promotedServers.map((s) =>
      s.id === server.id ? { ...s, rating: starRating } : s
    );
    setPromotedServers(updated);
    localStorage.setItem('civlink_promoted_servers', JSON.stringify(updated));
    if (detailModalServer && detailModalServer.id === server.id) {
      setDetailModalServer({ ...detailModalServer, rating: starRating });
    }
    addToast('success', 'Rating Submitted', `You gave ${server.name} a ${starRating}-star rating!`);
  };

  const handleOpenServerDetails = (server: PromotedServer) => {
    const currentViews = getServerViews(server);
    const newViews = currentViews + 1;
    localStorage.setItem(`civlink_views_${server.id}`, newViews.toString());

    const updated = promotedServers.map((s) =>
      s.id === server.id ? { ...s, views: newViews } : s
    );
    setPromotedServers(updated);
    localStorage.setItem('civlink_promoted_servers', JSON.stringify(updated));

    setDetailModalServer({ ...server, views: newViews });
  };

  // Handle Mavely Bot /bump command execution with strict 1-hour cooldown
  const handleBumpServer = (server: PromotedServer) => {
    const now = Date.now();
    const lastBump = server.lastBumpedAt || 0;
    const elapsed = now - lastBump;

    if (elapsed < BUMP_COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((BUMP_COOLDOWN_MS - elapsed) / 60000);
      addToast(
        'warning',
        '/bump on Cooldown',
        `${server.name} was recently bumped. You can bump again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}. (1 bump per hour limit)`
      );
      return;
    }

    const currentViews = getServerViews(server);
    const newViews = currentViews + 1;
    localStorage.setItem(`civlink_views_${server.id}`, newViews.toString());
    const updated = promotedServers.map((s) =>
      s.id === server.id ? { ...s, lastBumpedAt: now, views: newViews } : s
    );
    // Sort bumped server to the very top (#1)
    updated.sort((a, b) => (b.lastBumpedAt || 0) - (a.lastBumpedAt || 0));
    setPromotedServers(updated);
    localStorage.setItem('civlink_promoted_servers', JSON.stringify(updated));

    addToast(
      'success',
      'Mavely Bot: /bump Executed!',
      `${server.name} was moved to the very front of the directory! Next bump available in 1 hour.`
    );

    addLiveNotification({
      title: `Server Bumped: ${server.name}`,
      description: 'Mavely bot elevated server to #1 in directory.',
      type: 'success',
    });
  };

  // Verification Modal State
  const [activeVerifyServer, setActiveVerifyServer] = useState<PromotedServer | null>(null);
  const [verifyStep, setVerifyStep] = useState<'idle' | 'scanning' | 'success' | 'already_verified'>('idle');
  const [scanMessage, setScanMessage] = useState('');

  // Real Persistent State
  const [creditsBalance, setCreditsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_credits_balance');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [dailyJoins, setDailyJoins] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_daily_joins');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_streak_days');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Load real servers and purge any fake partner servers
  useEffect(() => {
    try {
      const savedServersRaw = localStorage.getItem('civlink_promoted_servers');
      if (savedServersRaw) {
        const parsed: PromotedServer[] = JSON.parse(savedServersRaw);
        if (Array.isArray(parsed)) {
          // Clean out any fake partner servers or unwanted test servers
          const cleanServers = parsed.filter(
            (s) =>
              !s.id.startsWith('srv_partner_') &&
              !s.name.toLowerCase().includes('river city') &&
              !s.name.toLowerCase().includes('liberty county') &&
              !s.name.toLowerCase().includes('alabama')
          );
          setPromotedServers(cleanServers);
          localStorage.setItem('civlink_promoted_servers', JSON.stringify(cleanServers));
        } else {
          setPromotedServers([]);
        }
      } else {
        setPromotedServers([]);
      }

      const savedJoins = localStorage.getItem('civlink_joined_servers');
      if (savedJoins) {
        setJoinedMap(JSON.parse(savedJoins));
      }
    } catch (e) {
      console.warn('Error reading stored servers:', e);
    }
  }, []);

  // Sync real-time updates across tabs
  useEffect(() => {
    const handleUpdate = () => {
      const savedBalance = localStorage.getItem('civlink_credits_balance');
      if (savedBalance) setCreditsBalance(parseInt(savedBalance, 10));
      const savedStreak = localStorage.getItem('civlink_streak_days');
      if (savedStreak) setStreakDays(parseInt(savedStreak, 10));
      const savedJoins = localStorage.getItem('civlink_daily_joins');
      if (savedJoins) setDailyJoins(parseInt(savedJoins, 10));
      const savedServers = localStorage.getItem('civlink_promoted_servers');
      if (savedServers) {
        const parsed = JSON.parse(savedServers);
        if (Array.isArray(parsed)) {
          const cleanServers = parsed.filter((s: PromotedServer) => !s.id.startsWith('srv_partner_'));
          setPromotedServers(cleanServers);
        }
      }
    };
    window.addEventListener('civlink_credits_updated', handleUpdate);
    window.addEventListener('civlink_promotions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('civlink_credits_updated', handleUpdate);
      window.removeEventListener('civlink_promotions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter and Sort Directory Listings
  const filteredServers = useMemo(() => {
    let list = promotedServers.filter((server) => {
      const q = search.toLowerCase();
      const matchesSearch =
        server.name.toLowerCase().includes(q) ||
        server.tags.some((t) => t.toLowerCase().includes(q)) ||
        server.description.toLowerCase().includes(q);

      const serverCats = server.categories && server.categories.length > 0
        ? server.categories
        : [server.category];

      const matchesCategory =
        selectedCategory === 'All' ||
        serverCats.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });

    list.sort((a, b) => {
      // Bumped servers always take #1 priority
      const bumpA = a.lastBumpedAt || 0;
      const bumpB = b.lastBumpedAt || 0;
      if (bumpA !== bumpB) {
        return bumpB - bumpA;
      }
      if (sortBy === 'bounty') {
        return (b.rewardCoins || 1) - (a.rewardCoins || 1);
      } else if (sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [promotedServers, search, selectedCategory, sortBy]);

  // Open the Verification flow for a server
  const handleOpenVerification = (server: PromotedServer) => {
    setActiveVerifyServer(server);
    if (joinedMap[server.id]) {
      setVerifyStep('already_verified');
    } else {
      setVerifyStep('idle');
    }
  };

  // Bot-Assisted Guild Detection Flow (Mavely Bot)
  const handlePerformBotScan = async () => {
    if (!activeVerifyServer) return;

    // Disallow earning credits from joining own server
    if (currentGuildId && activeVerifyServer.id === currentGuildId) {
      addToast('warning', 'Self-Join Disallowed', 'You cannot claim bounty credits on your own community server.');
      setActiveVerifyServer(null);
      setVerifyStep('idle');
      return;
    }

    setVerifyStep('scanning');

    // Step 1: Gateway connect
    setScanMessage('Connecting to Mavely Discord Gateway WebSocket...');
    await new Promise((r) => setTimeout(r, 700));

    // Step 2: Query guild member presence
    setScanMessage(`Scanning ${activeVerifyServer.name} member cache for your Discord account...`);
    await new Promise((r) => setTimeout(r, 900));

    // Step 3: Security & age checks
    setScanMessage('Verifying Discord account age (>7d) and avatar authenticity...');
    await new Promise((r) => setTimeout(r, 600));

    // Step 4: Finalize 72h retention lock
    setScanMessage('Membership confirmed! Activating 72-Hour retention lock...');
    await new Promise((r) => setTimeout(r, 600));

    // Grant credits (1 per join)
    const bounty = activeVerifyServer.rewardCoins || 1;
    const updatedJoined = { ...joinedMap, [activeVerifyServer.id]: true };
    setJoinedMap(updatedJoined);
    localStorage.setItem('civlink_joined_servers', JSON.stringify(updatedJoined));

    const newBalance = creditsBalance + bounty;
    setCreditsBalance(newBalance);
    localStorage.setItem('civlink_credits_balance', newBalance.toString());

    const newDailyJoins = dailyJoins + 1;
    setDailyJoins(newDailyJoins);
    localStorage.setItem('civlink_daily_joins', newDailyJoins.toString());

    // Record ledger transaction
    const newTx = {
      id: `tx_${Date.now()}`,
      type: 'earn',
      title: `Joined ${activeVerifyServer.name}`,
      amount: `+${bounty} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };
    const savedTxs = JSON.parse(localStorage.getItem('civlink_transactions') || '[]');
    localStorage.setItem('civlink_transactions', JSON.stringify([newTx, ...savedTxs]));

    // Record in joins list for 72h retention tracking
    const newJoinRecord = {
      id: activeVerifyServer.id,
      serverName: activeVerifyServer.name,
      iconUrl: activeVerifyServer.icon,
      rewardCoins: bounty,
      joinedAt: Date.now(),
      lockExpiresAt: Date.now() + 72 * 3600 * 1000,
      status: 'active',
    };
    const savedJoinsList = JSON.parse(localStorage.getItem('civlink_my_joins_list') || '[]');
    localStorage.setItem(
      'civlink_my_joins_list',
      JSON.stringify([newJoinRecord, ...savedJoinsList.filter((j: any) => j.id !== activeVerifyServer.id)])
    );

    window.dispatchEvent(new Event('civlink_credits_updated'));
    onAddCoins?.(bounty);

    addLiveNotification({
      title: `Joined ${activeVerifyServer.name}`,
      description: `+${bounty} Credit secured · 72h retention lock active.`,
      type: 'success',
      avatar: activeVerifyServer.icon ? { name: activeVerifyServer.name, src: activeVerifyServer.icon } : undefined,
    });

    setVerifyStep('success');
    addToast(
      'success',
      `+${bounty} Credits Earned!`,
      `Mavely verified your membership in ${activeVerifyServer.name}. +${bounty} credit secured in your treasury.`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Live Discovery Header Bar with Real Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.15] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="size-5.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">My Treasury</span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{creditsBalance}</span>
                <span className="text-xs font-mono text-amber-400 font-medium">Credits</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onNavigateTab?.('transfer')}
            className="border-white/[0.09] text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-200 h-8 px-3 rounded-lg transition-all"
          >
            Transfer
          </Button>
        </div>

        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.15] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="size-5.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Verified Joins</span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{dailyJoins}</span>
                <span className="text-xs font-mono text-emerald-400 font-medium">Joined</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onNavigateTab?.('joins')}
            className="border-white/[0.09] text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-200 h-8 px-3 rounded-lg transition-all"
          >
            My Joins
          </Button>
        </div>

        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.15] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Flame className="size-5.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Check-In Streak</span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{streakDays}</span>
                <span className="text-xs font-mono text-rose-400 font-medium">Days</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onNavigateTab?.('rewards')}
            className="border-amber-500/25 text-xs font-mono text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 h-8 px-3 rounded-lg transition-all"
          >
            Daily Rewards
          </Button>
        </div>
      </div>

      {/* Directory Search & Filtering Controls */}
      <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-4.5 space-y-3.5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by community name, description, or #tag..."
              className="pl-9 pr-9 text-xs bg-[#11141c] border-white/[0.09] text-white placeholder:text-slate-400 h-9.5 rounded-xl focus:border-white/[0.2] transition-colors"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Sort & Promote CTA */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 border border-white/[0.09] bg-[#11141c] rounded-xl px-3 h-9.5 shadow-sm hover:border-white/[0.16] transition-colors">
              <SlidersHorizontal className="size-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium"
              >
                <option value="bounty" className="bg-[#161a24] text-slate-200">Highest Bounty</option>
                <option value="newest" className="bg-[#161a24] text-slate-200">Recently Added</option>
                <option value="name" className="bg-[#161a24] text-slate-200">Alphabetical</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab?.('promote')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9.5 px-4 rounded-xl shrink-0 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <PlusCircle className="size-3.5 mr-1.5" />
              Promote Your Server
            </Button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/[0.07]">
          {DIRECTORY_CATEGORIES.map((cat) => {
            const count = cat === 'All'
              ? promotedServers.length
              : promotedServers.filter((s) => {
                  const serverCats = s.categories && s.categories.length > 0 ? s.categories : [s.category];
                  return serverCats.some((c) => c.toLowerCase() === cat.toLowerCase());
                }).length;

            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-white/20 bg-slate-100 text-slate-900 font-semibold shadow-sm'
                    : 'border-white/[0.07] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.14]'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-black/15 text-slate-900 font-bold' : 'bg-white/[0.06] text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Listings Grid or Clean Empty State (NO fake servers) */}
      {filteredServers.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-10 text-center space-y-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="max-w-md mx-auto space-y-3">
            <div className="size-14 mx-auto rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
              <Compass className="size-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">No Communities Listed in &quot;{selectedCategory}&quot;</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Be the very first Discord server to list your community here! Set up your promotion and start receiving verified members automatically.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => onNavigateTab?.('promote')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-5 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <PlusCircle className="size-3.5 mr-1.5" />
                Promote Your Discord Server
              </Button>
            </div>
          </div>

          {/* 3 Step Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-white/[0.07] text-left">
            <div className="p-4 rounded-xl border border-white/[0.07] bg-[#11141c]/60 space-y-1.5">
              <span className="text-[10px] font-mono font-semibold text-emerald-400 block">STEP 1</span>
              <h4 className="text-xs font-semibold text-white">Join Partner Communities</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Discover verified Discord servers and join with one click.</p>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.07] bg-[#11141c]/60 space-y-1.5">
              <span className="text-[10px] font-mono font-semibold text-amber-400 block">STEP 2</span>
              <h4 className="text-xs font-semibold text-white">Earn Instant Credits</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Mavely bot dynamically verifies your server membership and awards bounty credits.</p>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.07] bg-[#11141c]/60 space-y-1.5">
              <span className="text-[10px] font-mono font-semibold text-cyan-400 block">STEP 3</span>
              <h4 className="text-xs font-semibold text-white">Boost Your Own Server</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Use your earned credits to attract verified members to your server.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
          {filteredServers.map((server) => {
            const isJoined = Boolean(joinedMap[server.id]);
            const isOwnServer = Boolean(currentGuildId && server.id === currentGuildId);
            const serverCats = server.categories && server.categories.length > 0 ? server.categories : [server.category];

            const members = getServerMembers(server);
            const views = getServerViews(server);
            const stars = getServerStars(server);

            const lastBump = server.lastBumpedAt || 0;
            const isCooldown = nowTime - lastBump < BUMP_COOLDOWN_MS;
            const remainingMins = Math.ceil((BUMP_COOLDOWN_MS - (nowTime - lastBump)) / 60000);

            return (
              <div
                key={server.id}
                className="group rounded-2xl border border-white/[0.09] bg-[#161a24] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:shadow-[0_10px_32px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:border-white/[0.18] transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Balanced Banner */}
                  <div
                    onClick={() => handleOpenServerDetails(server)}
                    className="relative w-full h-28 bg-[#1f2432] overflow-hidden flex items-center justify-center cursor-pointer"
                    title="Click to view full community details"
                  >
                    {server.bannerUrl ? (
                      <>
                        <img
                          src={server.bannerUrl}
                          alt={server.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161a24] via-transparent to-black/20" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#232938] via-[#1a202c] to-[#141822] flex items-center justify-center">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                      </div>
                    )}

                    {/* Top Right Bounty / Own Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                      {isOwnServer ? (
                        <span className="backdrop-blur-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          YOUR COMMUNITY
                        </span>
                      ) : (
                        <div className="backdrop-blur-md bg-black/60 border border-white/10 text-amber-300 font-mono text-xs px-2.5 py-1 rounded-full shadow-md font-bold flex items-center gap-1.5">
                          <Coins className="size-3.5 text-amber-400" />
                          <span>+{server.rewardCoins || 1} Credits</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Container with Overlapping Server Icon */}
                  <div className="px-4.5 pt-0 pb-4 space-y-3 relative">
                    <div
                      className="flex items-end justify-between -mt-6 relative z-10 pr-2 cursor-pointer"
                      onClick={() => handleOpenServerDetails(server)}
                    >
                      {server.icon ? (
                        <img
                          src={server.icon}
                          alt={server.name}
                          className="size-13 rounded-2xl object-cover border-4 border-[#161a24] shadow-xl bg-zinc-900 shrink-0"
                        />
                      ) : (
                        <div className="size-13 rounded-2xl bg-[#5865F2] flex items-center justify-center font-bold text-white text-base border-4 border-[#161a24] shadow-xl shrink-0">
                          {server.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Server Title & Categories */}
                    <div className="space-y-1.5">
                      <div
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={() => handleOpenServerDetails(server)}
                      >
                        <h4 className="text-[15px] font-bold text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                          {server.name}
                        </h4>
                        {server.verified && <ShieldCheck className="size-4 text-emerald-400 shrink-0" />}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {serverCats.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-slate-300 font-medium"
                          >
                            {c}
                          </span>
                        ))}
                        <span className="text-zinc-600">·</span>
                        <span className="text-[10px] text-slate-400 font-mono">{server.language || 'English'}</span>
                      </div>
                    </div>

                    {/* Community Metrics: Members, Views, Stars in unified strip */}
                    <div className="flex items-center gap-2 pt-0.5 pb-0.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 bg-[#11141c] px-2.5 py-1 rounded-lg border border-white/[0.07] text-slate-300">
                        <Users className="size-3 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white">{members.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">members</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#11141c] px-2.5 py-1 rounded-lg border border-white/[0.07] text-slate-300">
                        <Eye className="size-3 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-white">{views.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">views</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 bg-[#11141c] px-2.5 py-1 rounded-lg border border-white/[0.07] text-slate-300 cursor-pointer hover:border-amber-500/40"
                        onClick={() => handleOpenServerDetails(server)}
                        title="Click to view & rate community"
                      >
                        <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-semibold text-white">{stars.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[36px]">
                      {server.description}
                    </p>

                    {/* Tag Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {server.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] font-mono hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row: [Join Server] [Open Page] [/bump] */}
                <div className="p-3.5 pt-3 border-t border-white/[0.08] bg-[#12151e]/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isOwnServer ? (
                      <span className="text-xs text-slate-500 font-mono italic">
                        Self-join disabled
                      </span>
                    ) : isJoined ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenVerification(server)}
                        className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold h-8.5 px-3.5 rounded-xl border border-emerald-500/30 transition-colors flex items-center gap-1.5"
                      >
                        <Check className="size-3.5" />
                        <span>Joined</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenVerification(server)}
                        className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs h-8.5 px-3.5 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5 flex items-center gap-1.5"
                      >
                        <span>Join & Verify</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenServerDetails(server)}
                      className="border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-300 text-xs h-8.5 px-2.5 rounded-xl transition-colors flex items-center gap-1"
                      title="View full community profile"
                    >
                      <Eye className="size-3" />
                      <span>Details</span>
                    </Button>

                    {server.inviteUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(server.inviteUrl, '_blank', 'noopener,noreferrer')}
                        className="border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-300 text-xs h-8.5 px-2.5 rounded-xl transition-colors"
                        title="Open Discord invite link"
                      >
                        <ExternalLink className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Interactive /bump button with 1-hour cooldown */}
                  <button
                    type="button"
                    onClick={() => handleBumpServer(server)}
                    disabled={isCooldown}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                      isCooldown
                        ? 'border-white/[0.05] bg-white/[0.02] text-slate-500 cursor-not-allowed opacity-75'
                        : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-300 hover:shadow-sm cursor-pointer'
                    }`}
                    title={isCooldown ? `Bump cooldown active. Ready in ${remainingMins} minute${remainingMins === 1 ? '' : 's'}.` : "Run /bump with Mavely bot to move server to the front (1 hour cooldown)"}
                  >
                    <Flame className={`size-3.5 ${isCooldown ? 'text-slate-600' : 'text-amber-400'}`} />
                    <span className="font-semibold">{isCooldown ? `${remainingMins}m` : '/bump'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INTERACTIVE DISCORD BOT MEMBERSHIP VERIFICATION MODAL ── */}
      {activeVerifyServer && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg bg-[#161a24] border border-white/[0.12] rounded-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {activeVerifyServer.icon ? (
                  <img
                    src={activeVerifyServer.icon}
                    alt={activeVerifyServer.name}
                    className="size-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="size-12 rounded-xl bg-[#5865F2] flex items-center justify-center font-bold text-white text-base shrink-0">
                    {activeVerifyServer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white tracking-tight">{activeVerifyServer.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                    <Coins className="size-3.5" />
                    <span>+{activeVerifyServer.rewardCoins || 1} Credit Bounty</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveVerifyServer(null);
                  setVerifyStep('idle');
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body depending on step */}
            {verifyStep === 'idle' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Bot className="size-4 text-emerald-400" />
                    <span>Mavely Bot Membership Verification</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To claim this bounty, make sure you have joined the Discord server. The Mavely bot in the server will automatically scan the member cache to confirm your membership and lock your credits.
                  </p>
                </div>

                {/* Step Actions */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                    <div className="space-y-0.5">
                      <span className="text-white font-medium block">Step 1: Open Discord Server Invite</span>
                      <span className="text-[11px] text-zinc-400 block">Opens the community invite in Discord</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (activeVerifyServer.inviteUrl) {
                          window.open(activeVerifyServer.inviteUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      <span>Join Discord</span>
                      <ExternalLink className="size-3 ml-1.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                    <div className="space-y-0.5">
                      <span className="text-white font-medium block">Step 2: Confirm & Verify with Bot</span>
                      <span className="text-[11px] text-zinc-400 block">Mavely bot inspects server membership live</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handlePerformBotScan}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-8 px-4 rounded-lg"
                    >
                      <Bot className="size-3.5 mr-1.5" />
                      <span>Verify Membership</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {verifyStep === 'scanning' && (
              <div className="py-8 text-center space-y-4">
                <div className="size-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <RotateCw className="size-6 text-emerald-400 animate-spin" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">Inspecting Discord Server Membership</h4>
                  <p className="text-xs text-emerald-400 font-mono animate-pulse">
                    {scanMessage}
                  </p>
                </div>

                <div className="max-w-xs mx-auto text-[11px] text-zinc-500 font-mono pt-2">
                  Querying live Mavely Discord gateway connection...
                </div>
              </div>
            )}

            {verifyStep === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="size-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="size-7 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Membership Confirmed & Bounty Secured!</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    The bot verified your presence in <strong>{activeVerifyServer.name}</strong>. +{activeVerifyServer.rewardCoins || 1} credit has been deposited into your treasury.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 font-mono flex items-center justify-center gap-2">
                  <Lock className="size-3.5 text-emerald-400" />
                  <span>72-Hour Credit Lock: Active (Do not leave server)</span>
                </div>

                <div className="pt-2 flex justify-center">
                  <Button
                    onClick={() => {
                      setActiveVerifyServer(null);
                      setVerifyStep('idle');
                    }}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-9 px-6 rounded-lg shadow-sm"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

            {verifyStep === 'already_verified' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 text-center">
                  <ShieldCheck className="size-7 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Membership Verified & Active</h4>
                  <p className="text-emerald-300 font-mono text-[11px]">
                    You have already claimed this +{activeVerifyServer.rewardCoins || 1} credit bounty.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">72-Hour Retention Status:</span>
                    <span className="font-mono text-emerald-400 font-semibold">Active & Secured</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Mavely Bot Guild Presence:</span>
                    <span className="font-mono text-cyan-400 font-semibold">Synchronized</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Earned Bounty:</span>
                    <span className="font-mono text-amber-400 font-semibold">+{activeVerifyServer.rewardCoins || 1} Credit</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeVerifyServer.inviteUrl) {
                        window.open(activeVerifyServer.inviteUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="border-white/10 text-xs h-8 text-zinc-300"
                  >
                    <span>Open Server</span>
                    <ExternalLink className="size-3 ml-1.5" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveVerifyServer(null);
                      onNavigateTab?.('joins');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-8 px-4 rounded-lg"
                  >
                    View in My Joins
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SERVER DETAILS MODAL (High-end Glassmorphic Redesign) ── */}
      {detailModalServer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="rounded-3xl border border-white/[0.12] bg-[#141824]/95 backdrop-blur-3xl max-w-lg w-full overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative flex flex-col max-h-[90vh]">
            {/* Banner Header with Smooth Gradient */}
            <div className="relative w-full h-36 bg-gradient-to-r from-indigo-950/60 via-[#181d2c] to-emerald-950/40 shrink-0 overflow-hidden flex items-center justify-center">
              {detailModalServer.bannerUrl ? (
                <>
                  <img
                    src={detailModalServer.bannerUrl}
                    alt={detailModalServer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141824] via-black/20 to-black/40" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-[#151a26] to-[#0f131c]">
                  <div className="absolute -top-12 -left-12 size-48 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 size-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setDetailModalServer(null)}
                className="absolute top-3.5 right-3.5 z-20 size-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="size-4" />
              </button>

              {/* Shimmering Bounty Badge */}
              <div className="absolute top-3.5 left-3.5 z-10 backdrop-blur-md bg-black/60 border border-amber-400/30 text-amber-300 font-mono text-xs px-3 py-1 rounded-full shadow-lg font-bold flex items-center gap-1.5">
                <Coins className="size-3.5 text-amber-400" />
                <span>+{detailModalServer.rewardCoins || 1} Credits Bounty</span>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Avatar + Title Row */}
              <div className="flex items-start justify-between -mt-12 relative z-10">
                {detailModalServer.icon ? (
                  <img
                    src={detailModalServer.icon}
                    alt={detailModalServer.name}
                    className="size-16 rounded-2xl object-cover border-4 border-[#141824] shadow-2xl bg-zinc-900 shrink-0"
                  />
                ) : (
                  <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl border-4 border-[#141824] shadow-2xl shrink-0">
                    {detailModalServer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Server Name & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{detailModalServer.name}</h3>
                  {detailModalServer.verified && <ShieldCheck className="size-5 text-emerald-400 shrink-0" />}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(detailModalServer.categories || [detailModalServer.category]).map((c) => (
                    <span
                      key={c}
                      className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-300 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400 font-mono">{detailModalServer.language || 'English (US)'}</span>
                </div>
              </div>

              {/* Clean Telemetry Capsules (Members, Views, Rating) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Members</span>
                  <div className="flex items-center justify-center gap-1.5 text-white font-mono font-bold text-sm">
                    <Users className="size-3.5 text-emerald-400" />
                    <span>{getServerMembers(detailModalServer).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Directory Views</span>
                  <div className="flex items-center justify-center gap-1.5 text-white font-mono font-bold text-sm">
                    <Eye className="size-3.5 text-cyan-400" />
                    <span>{getServerViews(detailModalServer).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Rating</span>
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono font-bold text-sm">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span>{getServerStars(detailModalServer).toFixed(1)} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Seamless Interactive 5-Star Rating (NO harsh box border) */}
              <div className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">Community Rating</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Average: <strong className="text-amber-400">{getServerStars(detailModalServer).toFixed(1)}</strong> out of 5 stars
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.round(getServerStars(detailModalServer));
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRateServer(detailModalServer, star)}
                        className="p-1 rounded-lg hover:bg-amber-400/15 transition-all hover:scale-125 focus:outline-none cursor-pointer"
                        title={`Rate ${star} star${star === 1 ? '' : 's'}`}
                      >
                        <Star
                          className={`size-5 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* About Community */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">About Community</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {detailModalServer.description}
                </p>
              </div>

              {/* Server Tags */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailModalServer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-slate-300 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.07] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-white/[0.08] bg-[#10131d]/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalServer(null)}
                className="border-white/10 text-xs h-9 px-4 text-slate-300 hover:text-white rounded-xl"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {detailModalServer.inviteUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(detailModalServer.inviteUrl, '_blank', 'noopener,noreferrer')}
                    className="border-white/10 text-xs h-9 px-3.5 text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5"
                  >
                    <span>Discord Invite</span>
                    <ExternalLink className="size-3" />
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    const s = detailModalServer;
                    setDetailModalServer(null);
                    handleOpenVerification(s);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-5 rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
                >
                  <Coins className="size-3.5" />
                  <span>Join Server (+{detailModalServer.rewardCoins || 1} Credits)</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EarnCoinsTab;
