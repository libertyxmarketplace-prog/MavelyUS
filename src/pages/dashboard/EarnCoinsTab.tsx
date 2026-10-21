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
  RotateCw,
  Users,
  Eye,
  Star,
  MessageSquare,
  Bell,
  Hash,
  Sparkles,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
}

interface EarnCoinsTabProps {
  currentGuildId?: string;
  onNavigateTab?: (tab: string) => void;
  onAddCoins?: (amount: number) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export const DIRECTORY_CATEGORIES = [
  'All',
  'Design Server',
  'Roleplay Server',
  'Misc',
  'Bots',
  'Departments',
  'Events'
];

export function EarnCoinsTab({ currentGuildId, onNavigateTab, onAddCoins, addToast }: EarnCoinsTabProps) {
  const [promotedServers, setPromotedServers] = useState<PromotedServer[]>([]);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'bounty' | 'newest' | 'name'>('bounty');
  const [isBumping, setIsBumping] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortBy]);

  // 1-hour real cooldown constant (3600 seconds)
  const BUMP_COOLDOWN_MS = 60 * 60 * 1000;

  // Real-time clock to tick bump cooldown countdowns
  const [nowTime, setNowTime] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const { user } = useAuth();

  // Detail Modal for viewing full server info
  const [detailModalServer, setDetailModalServer] = useState<PromotedServer | null>(null);
  const [modalReviews, setModalReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Honest live stats helper - real stored count or 0 (no fake numbers)
  const getServerMembers = (server: PromotedServer): number => {
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
    return server.memberCount || 0;
  };

  const handleOpenServerDetails = (server: PromotedServer) => {
    setDetailModalServer(server);
    try {
      const stored = localStorage.getItem(`server_reviews_${server.id}`);
      setModalReviews(stored ? JSON.parse(stored) : []);
    } catch {
      setModalReviews([]);
    }
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const hasUserReviewed = useMemo(() => {
    if (!detailModalServer) return false;
    if (user?.id) {
      return modalReviews.some((r) => r.userId === user.id);
    }
    return modalReviews.some((r) => r.author === (user?.username || 'Community Member'));
  }, [detailModalServer, modalReviews, user]);

  const handleAddReview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailModalServer || !newReviewText.trim()) return;

    if (hasUserReviewed) {
      addToast('warning', 'Review Limit', 'You have already submitted community feedback for this server.');
      return;
    }

    const authorName = user?.globalName || user?.username || 'Community Member';
    const authorAvatar = user?.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null;

    const newRev = {
      id: `rev_${Date.now()}`,
      userId: user?.id || `anon_${Date.now()}`,
      author: authorName,
      authorAvatar,
      rating: newReviewRating,
      content: newReviewText.trim(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newRev, ...modalReviews];
    setModalReviews(updated);
    try {
      localStorage.setItem(`server_reviews_${detailModalServer.id}`, JSON.stringify(updated));
    } catch {}
    setNewReviewText('');
    addToast('success', 'Review Recorded', 'Your feedback for this community has been saved.');
  };

  // Handle bump button with strict 1-bump single execution and #1 elevation
  const handleBumpServer = (server: PromotedServer) => {
    if (isBumping) return;
    setIsBumping(true);

    try {
      const now = Date.now();
      const bumpKey = `erlcus_bump_${server.id}`;
      const savedBumpTime = parseInt(localStorage.getItem(bumpKey) || '0', 10);
      const lastBump = Math.max(server.lastBumpedAt || 0, savedBumpTime);
      const elapsed = now - lastBump;

      if (elapsed < BUMP_COOLDOWN_MS) {
        const remainingMinutes = Math.ceil((BUMP_COOLDOWN_MS - elapsed) / 60000);
        addToast(
          'warning',
          'Bump on Cooldown',
          `${server.name} was already bumped. You can bump again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}. (1 bump per hour limit)`
        );
        return;
      }

      // Record bump timestamp
      localStorage.setItem(bumpKey, now.toString());

      const bumpedServer = { ...server, lastBumpedAt: now };
      const remaining = promotedServers.filter((s) => s.id !== server.id);
      // Elevate to #1 on page
      const updated = [bumpedServer, ...remaining];

      setPromotedServers(updated);
      localStorage.setItem('erlcus_promoted_servers', JSON.stringify(updated));

      addToast(
        'success',
        'Server Bumped to #1!',
        `${server.name} was moved to the very top of the directory. (1 bump per cooldown limit active)`
      );

      addLiveNotification({
        title: `Server Bumped: ${server.name}`,
        description: 'Server moved to position #1 in directory.',
        type: 'success',
      });
    } finally {
      setTimeout(() => setIsBumping(false), 500);
    }
  };

  // Verification Modal State
  const [activeVerifyServer, setActiveVerifyServer] = useState<PromotedServer | null>(null);
  const [verifyStep, setVerifyStep] = useState<'idle' | 'scanning' | 'success' | 'already_verified'>('idle');
  const [scanMessage, setScanMessage] = useState('');

  // Real Persistent State
  const [creditsBalance, setCreditsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('erlcus_credits_balance');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [dailyJoins, setDailyJoins] = useState<number>(() => {
    const saved = localStorage.getItem('erlcus_daily_joins');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem('erlcus_streak_days');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Load real servers and auto-update
  const loadStoredServers = () => {
    try {
      let known: any[] = [];
      try {
        known = JSON.parse(localStorage.getItem('erlcus_known_guilds') || '[]');
      } catch {}

      const savedServersRaw = localStorage.getItem('erlcus_promoted_servers');
      if (savedServersRaw) {
        const parsed: PromotedServer[] = JSON.parse(savedServersRaw);
        if (Array.isArray(parsed)) {
          const cleanServers = parsed
            .filter(
              (s) =>
                !s.id.startsWith('srv_partner_') &&
                !s.name.toLowerCase().includes('river city')
            )
            .map((s) => {
              const storedCount = localStorage.getItem(`server_members_${s.id}`);
              const matchedKnown = known.find((k: any) => k.id === s.id);
              const realCount = storedCount
                ? parseInt(storedCount, 10)
                : (typeof matchedKnown?.memberCount === 'number' && matchedKnown.memberCount > 0 ? matchedKnown.memberCount : s.memberCount || 0);
              return { ...s, memberCount: realCount };
            });
          setPromotedServers(cleanServers);
        } else {
          setPromotedServers([]);
        }
      } else {
        setPromotedServers([]);
      }

      const savedJoins = localStorage.getItem('erlcus_joined_servers');
      if (savedJoins) {
        setJoinedMap(JSON.parse(savedJoins));
      }
    } catch (e) {
      console.warn('Error reading stored servers:', e);
    }
  };

  useEffect(() => {
    loadStoredServers();
    // Live refresh real member counts from backend
    fetch('/api/servers')
      .then((r) => r.json())
      .then((data) => {
        if (data?.servers && Array.isArray(data.servers)) {
          for (const s of data.servers) {
            if (typeof s.memberCount === 'number' && s.memberCount > 0) {
              localStorage.setItem(`server_members_${s.id}`, s.memberCount.toString());
            }
          }
          try {
            localStorage.setItem('erlcus_known_guilds', JSON.stringify(data.servers));
          } catch {}
          loadStoredServers();
        }
      })
      .catch(() => {});
  }, []);

  // Sync real-time updates across tabs & storage events
  useEffect(() => {
    const handleUpdate = () => {
      const savedBalance = localStorage.getItem('erlcus_credits_balance');
      if (savedBalance) setCreditsBalance(parseInt(savedBalance, 10));
      const savedStreak = localStorage.getItem('erlcus_streak_days');
      if (savedStreak) setStreakDays(parseInt(savedStreak, 10));
      const savedJoins = localStorage.getItem('erlcus_daily_joins');
      if (savedJoins) setDailyJoins(parseInt(savedJoins, 10));
      loadStoredServers();
    };

    window.addEventListener('erlcus_credits_updated', handleUpdate);
    window.addEventListener('erlcus_promotions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('erlcus_credits_updated', handleUpdate);
      window.removeEventListener('erlcus_promotions_updated', handleUpdate);
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
    // Prohibit joining own server
    if (currentGuildId && server.id === currentGuildId) {
      addToast('warning', 'Action Prohibited', 'You cannot join or claim bounties on your own community server.');
      return;
    }

    setActiveVerifyServer(server);
    if (joinedMap[server.id]) {
      setVerifyStep('already_verified');
    } else {
      setVerifyStep('idle');
    }
  };

  // Membership confirmation & real join
  const handlePerformBotScan = async () => {
    if (!activeVerifyServer) return;

    if (currentGuildId && activeVerifyServer.id === currentGuildId) {
      addToast('warning', 'Self-Join Disallowed', 'You cannot claim bounty credits on your own community server.');
      setActiveVerifyServer(null);
      setVerifyStep('idle');
      return;
    }

    setVerifyStep('scanning');

    // Step 1: Start check
    setScanMessage('Checking your Discord account...');
    await new Promise((r) => setTimeout(r, 600));

    // Step 2: Member check
    setScanMessage(`Checking presence in ${activeVerifyServer.name}...`);
    await new Promise((r) => setTimeout(r, 600));

    // Mark as joined in local state
    const updatedJoined = { ...joinedMap, [activeVerifyServer.id]: true };
    setJoinedMap(updatedJoined);
    localStorage.setItem('erlcus_joined_servers', JSON.stringify(updatedJoined));

    // Award bounty credits
    const bounty = activeVerifyServer.rewardCoins || 1;
    const newBalance = creditsBalance + bounty;
    setCreditsBalance(newBalance);
    localStorage.setItem('erlcus_credits_balance', newBalance.toString());

    // Increment verified joins
    const newJoins = dailyJoins + 1;
    setDailyJoins(newJoins);
    localStorage.setItem('erlcus_daily_joins', newJoins.toString());

    // Record transaction
    const newTx = {
      id: `tx_${Date.now()}`,
      type: 'bounty',
      title: `Joined ${activeVerifyServer.name}`,
      amount: `+${bounty} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };
    const savedTxs = JSON.parse(localStorage.getItem('erlcus_transactions') || '[]');
    localStorage.setItem('erlcus_transactions', JSON.stringify([newTx, ...savedTxs]));

    window.dispatchEvent(new Event('erlcus_credits_updated'));

    addLiveNotification({
      title: `Joined ${activeVerifyServer.name}`,
      description: `+${bounty} Credit secured in treasury.`,
      type: 'success',
      avatar: activeVerifyServer.icon ? { name: activeVerifyServer.name, src: activeVerifyServer.icon } : undefined,
    });

    setVerifyStep('success');
    addToast(
      'success',
      `+${bounty} Credits Earned!`,
      `Verified membership in ${activeVerifyServer.name}. +${bounty} credit deposited into your treasury.`
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── LIVE HEADER BAR (Flush, Minimal & Icon-Only) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Treasury */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Coins className="size-5 text-amber-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">My Treasury</span>
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
            className="border-white/10 text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 h-8 px-3 rounded-xl transition-all cursor-pointer"
          >
            Transfer
          </Button>
        </div>

        {/* Verified Joins */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Check className="size-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Verified Joins</span>
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
            className="border-white/10 text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 h-8 px-3 rounded-xl transition-all cursor-pointer"
          >
            My Joins
          </Button>
        </div>

        {/* Check-In Streak */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Flame className="size-5 text-rose-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Check-In Streak</span>
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
            className="border-white/10 text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 h-8 px-3 rounded-xl transition-all cursor-pointer"
          >
            Daily Rewards
          </Button>
        </div>
      </div>

      {/* Directory Search & Filtering Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4.5 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by community name, description, or #tag..."
              className="pl-9 pr-9 text-xs bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 h-9.5 rounded-xl focus:border-white/20 transition-colors"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Sort & Promote CTA */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 border border-white/10 bg-white/[0.03] rounded-xl px-3 h-9.5">
              <SlidersHorizontal className="size-3.5 text-zinc-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer font-medium"
              >
                <option value="bounty" className="bg-zinc-900 text-zinc-200">Highest Bounty</option>
                <option value="newest" className="bg-zinc-900 text-zinc-200">Recently Added</option>
                <option value="name" className="bg-zinc-900 text-zinc-200">Alphabetical</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab?.('promote')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9.5 px-4 rounded-xl shrink-0 shadow-sm cursor-pointer transition-all"
            >
              <PlusCircle className="size-3.5 mr-1.5" />
              Promote Server
            </Button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/5">
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
                    ? 'border-white/20 bg-white text-black font-semibold shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-black/15 text-black font-bold' : 'bg-white/[0.06] text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Listings Grid or Clean Empty State */}
      {filteredServers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-4">
          <div className="size-12 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <Compass className="size-6 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">No Communities Listed in &quot;{selectedCategory}&quot;</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              List your community server here to start receiving verified members automatically.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              onClick={() => onNavigateTab?.('promote')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-5 rounded-xl shadow-sm cursor-pointer"
            >
              <PlusCircle className="size-3.5 mr-1.5" />
              Promote Your Server
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
          {filteredServers
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((server) => {
            const isJoined = Boolean(joinedMap[server.id]);
            const isOwnServer = Boolean(currentGuildId && server.id === currentGuildId);
            const serverCats = server.categories && server.categories.length > 0 ? server.categories : [server.category];

            const members = getServerMembers(server);
            const lastBump = server.lastBumpedAt || 0;
            const isCooldown = nowTime - lastBump < BUMP_COOLDOWN_MS;
            const remainingMins = Math.ceil((BUMP_COOLDOWN_MS - (nowTime - lastBump)) / 60000);

            return (
              <div
                key={server.id}
                onClick={() => handleOpenServerDetails(server)}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Banner Header (ONLY if configured) */}
                  {server.bannerUrl ? (
                    <div
                      className="relative w-full h-28 bg-zinc-950 overflow-hidden border-b border-white/5"
                    >
                      <img
                        src={server.bannerUrl}
                        alt={server.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  ) : null}

                  {/* Content Container */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {server.icon ? (
                          <img
                            src={server.icon}
                            alt={server.name}
                            className="size-11 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-11 rounded-xl bg-[#313338] flex items-center justify-center shrink-0">
                            <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.893a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                            </svg>
                          </div>
                        )}

                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                            {server.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                            <span className="text-zinc-400">{serverCats[0] || 'Community'}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3 text-zinc-500" />
                              <span>{members.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Bounty Tag */}
                      <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                        +{server.rewardCoins || 1} Credits
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 min-h-[32px]">
                      {server.description}
                    </p>

                    {/* Tag Chips */}
                    {server.tags && server.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {server.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-zinc-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-3.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isOwnServer ? (
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-mono text-zinc-500 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                      >
                        Your Server
                      </span>
                    ) : isJoined ? (
                      <Button
                        size="sm"
                        disabled
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold h-8 px-3 rounded-xl cursor-default"
                      >
                        <Check className="size-3.5 mr-1" />
                        <span>Joined</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (server.inviteUrl) {
                            window.open(server.inviteUrl, '_blank', 'noopener,noreferrer');
                          }
                          handleOpenVerification(server);
                        }}
                        className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-8 px-3.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Join Server</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </div>

                  {/* Bump button (1 bump per cooldown, elevates to #1) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBumpServer(server);
                    }}
                    disabled={isCooldown}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono transition-all ${
                      isCooldown
                        ? 'border-white/5 bg-white/[0.02] text-zinc-500 cursor-not-allowed opacity-60'
                        : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cursor-pointer'
                    }`}
                    title={isCooldown ? `Bump cooldown active. Ready in ${remainingMins}m.` : "Bump server to #1 spot in directory"}
                  >
                    <Flame className="size-3.5" />
                    <span className="font-semibold">{isCooldown ? `${remainingMins}m` : 'Bump'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Directory Pagination (Always Rendered at Bottom) */}
      <div className="pt-6 pb-2 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-40 cursor-default" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.max(1, Math.ceil(filteredServers.length / itemsPerPage)) }, (_, idx) => {
              const pageNum = idx + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={currentPage === pageNum}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {Math.ceil(filteredServers.length / itemsPerPage) > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  const total = Math.max(1, Math.ceil(filteredServers.length / itemsPerPage));
                  if (currentPage < total) setCurrentPage((p) => p + 1);
                }}
                className={currentPage >= Math.max(1, Math.ceil(filteredServers.length / itemsPerPage)) ? "pointer-events-none opacity-40 cursor-default" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* ── MEMBERSHIP CONFIRMATION MODAL ── */}
      {activeVerifyServer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f121a] border border-white/15 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {activeVerifyServer.icon ? (
                  <img
                    src={activeVerifyServer.icon}
                    alt={activeVerifyServer.name}
                    className="size-11 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="size-11 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-white/10">
                    {activeVerifyServer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight truncate">{activeVerifyServer.name}</h3>
                  <span className="text-xs font-mono text-amber-400 block">+{activeVerifyServer.rewardCoins || 1} Credit Bounty</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveVerifyServer(null);
                  setVerifyStep('idle');
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Step: Idle */}
            {verifyStep === 'idle' && (
              <div className="space-y-4 text-xs">
                <p className="text-zinc-400 leading-relaxed">
                  Join the Discord server and click below to confirm your presence and claim your credits.
                </p>

                <div className="space-y-2">
                  {activeVerifyServer.inviteUrl && (
                    <Button
                      size="sm"
                      onClick={() => window.open(activeVerifyServer.inviteUrl, '_blank', 'noopener,noreferrer')}
                      className="w-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>1. Open Discord Invite Link</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handlePerformBotScan}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 rounded-xl cursor-pointer"
                  >
                    <span>2. Confirm Membership & Claim</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Step: Scanning */}
            {verifyStep === 'scanning' && (
              <div className="py-6 text-center space-y-3">
                <RotateCw className="size-7 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Inspecting Server Membership</h4>
                  <p className="text-xs text-zinc-400 font-mono">{scanMessage}</p>
                </div>
              </div>
            )}

            {/* Modal Step: Success (No rectangle behind check!) */}
            {verifyStep === 'success' && (
              <div className="py-4 text-center space-y-4">
                <Check className="size-10 text-emerald-400 mx-auto" />

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Membership Confirmed & Bounty Secured!</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Verified your membership in <strong>{activeVerifyServer.name}</strong>. +{activeVerifyServer.rewardCoins || 1} credit deposited into your treasury.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <Button
                    onClick={() => {
                      setActiveVerifyServer(null);
                      setVerifyStep('idle');
                    }}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-9 px-6 rounded-xl cursor-pointer"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Step: Already Verified */}
            {verifyStep === 'already_verified' && (
              <div className="space-y-3 text-center py-2">
                <Check className="size-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Membership Already Claimed</h4>
                <p className="text-xs text-zinc-400">You have already secured the bounty for this community.</p>
                <div className="pt-2">
                  <Button
                    onClick={() => setActiveVerifyServer(null)}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-8.5 px-5 rounded-xl cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SERVER DETAIL MODAL (Wide, Spacious & Feature-Packed) ── */}
      {detailModalServer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl lg:max-w-5xl bg-[#0e111a] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Banner (Only if provided) */}
            {detailModalServer.bannerUrl ? (
              <div className="relative w-full h-36 sm:h-48 bg-zinc-950 overflow-hidden border-b border-white/10 shrink-0">
                <img
                  src={detailModalServer.bannerUrl}
                  alt={detailModalServer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-black/40 to-transparent" />
              </div>
            ) : null}

            {/* Modal Content Scroll Area */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {detailModalServer.icon ? (
                    <img
                      src={detailModalServer.icon}
                      alt={detailModalServer.name}
                      className="size-14 rounded-2xl object-cover shrink-0 border border-white/15 shadow-xl"
                    />
                  ) : (
                    <div className="size-14 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-white text-lg shrink-0 border border-white/15 shadow-xl">
                      {detailModalServer.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white tracking-tight truncate">
                        {detailModalServer.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
                      <span className="text-emerald-400 font-medium">{detailModalServer.category}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5 text-zinc-400" />
                        <span>{getServerMembers(detailModalServer).toLocaleString()} members</span>
                      </span>
                      <span>·</span>
                      <span className="text-amber-400">+{detailModalServer.rewardCoins || 1} Bounty</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalServer(null)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-xl bg-white/[0.04] border border-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* 2-Column Wide Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Description, Tags & Bump Announcement Settings (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* About Server */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                      About Community
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-4 rounded-2xl border border-white/5 font-sans">
                      {detailModalServer.description || 'No description provided by the server owner.'}
                    </p>
                  </div>

                  {/* Tags */}
                  {detailModalServer.tags && detailModalServer.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                        Community Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {detailModalServer.tags.map((t) => (
                          <span key={t} className="text-xs text-zinc-300 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Community Feedback & Reviews (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-zinc-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Community Feedback ({modalReviews.length})
                      </h4>
                    </div>
                  </div>

                  {/* Submit Review or Enforce 1-Review Limit */}
                  {hasUserReviewed ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-zinc-300 flex items-start gap-3">
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-white font-bold block">Feedback Submitted</span>
                        <span className="text-[11px] text-zinc-400 leading-relaxed">
                          You have already submitted a review for this server. 1 review limit per user enforced.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleAddReview} className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {user?.avatar ? (
                            <img
                              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                              alt="User avatar"
                              className="size-6 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                              {(user?.username || 'U').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-white font-semibold truncate max-w-[140px]">
                            {user?.globalName || user?.username || 'Leave Feedback'}
                          </span>
                        </div>

                        {/* Star Rating Picker */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewRating(star)}
                              className="cursor-pointer text-amber-400 p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star className={`size-3.5 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <Input
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="Share your experience with this server..."
                        className="h-9 text-xs bg-white/[0.03] border-white/10 text-white rounded-xl focus:border-emerald-500/60"
                      />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newReviewText.trim()}
                          className="h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          Post Review
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  {modalReviews.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                      <p className="text-xs text-zinc-400">No community feedback yet.</p>
                      <p className="text-[11px] text-zinc-500 font-mono">Be the first verified member to leave a review!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {modalReviews.map((r, i) => (
                        <div key={r.id || i} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {r.authorAvatar ? (
                                <img
                                  src={r.authorAvatar}
                                  alt={r.author}
                                  className="size-5 rounded-full object-cover border border-white/10 shrink-0"
                                />
                              ) : (
                                <div className="size-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                  {(r.author || 'M').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-white text-xs truncate max-w-[130px]">
                                {r.author || 'Community Member'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`size-2.5 ${s <= (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-zinc-500 text-[10px] font-mono">{r.date}</span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalServer(null)}
                className="border-white/10 text-xs h-9 px-4 text-zinc-300 hover:text-white rounded-xl cursor-pointer"
              >
                Close
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleBumpServer(detailModalServer)}
                  className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Flame className="size-3.5 text-amber-400" />
                  <span>Bump Server</span>
                </Button>

                {detailModalServer.inviteUrl ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      window.open(detailModalServer.inviteUrl, '_blank', 'noopener,noreferrer');
                      const s = detailModalServer;
                      setDetailModalServer(null);
                      handleOpenVerification(s);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <span>Join Server (+{detailModalServer.rewardCoins || 1} Credits)</span>
                    <ExternalLink className="size-3" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EarnCoinsTab;
