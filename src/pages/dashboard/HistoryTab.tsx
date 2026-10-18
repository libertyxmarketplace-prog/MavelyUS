import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Coins,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface JoinedMemberRecord {
  id: string;
  username: string;
  avatarUrl?: string;
  serverName: string;
  serverId?: string;
  rewardCoins: number;
  joinedAt: number | string;
  status: 'active' | 'settled';
}

export function HistoryTab() {
  const [memberJoins, setMemberJoins] = useState<JoinedMemberRecord[]>([]);
  const [search, setSearch] = useState('');

  // Load real member joins from localStorage only (NO fake seeds)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('civlink_my_joins_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy dummy records
          const realOnly = parsed.filter(
            (m: any) =>
              m.username &&
              !['Vanguard_Pilot', 'Apex_Shooter', 'Officer_Dan', 'Sierra_Echo'].includes(m.username)
          );
          setMemberJoins(
            realOnly.map((m: any) => ({
              id: m.id || `usr_${Date.now()}`,
              username: m.username,
              avatarUrl: m.avatarUrl || m.iconUrl,
              serverName: m.serverName || 'Community Server',
              rewardCoins: m.rewardCoins || 1,
              joinedAt: m.joinedAt || Date.now(),
              status: m.status || 'active',
            }))
          );
          return;
        }
      }
      // If none or empty, strictly keep empty array
      setMemberJoins([]);
    } catch (e) {
      console.warn('Error reading member joins:', e);
      setMemberJoins([]);
    }
  }, []);

  const filteredJoins = useMemo(() => {
    return memberJoins.filter((m) => {
      const q = search.toLowerCase();
      return (
        m.username.toLowerCase().includes(q) ||
        m.serverName.toLowerCase().includes(q)
      );
    });
  }, [memberJoins, search]);

  const totalBounties = useMemo(() => {
    return memberJoins.reduce((acc, cur) => acc + (cur.rewardCoins || 1), 0);
  }, [memberJoins]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Stats Row: Simple, real, clean */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Verified Member Joins
            </span>
            <div className="flex items-center gap-2 text-2xl font-bold text-white font-mono">
              <Users className="size-5 text-emerald-400" />
              <span>{memberJoins.length}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real Discord users</span>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Directory Status
            </span>
            <div className="flex items-center gap-2 text-2xl font-bold text-emerald-400 font-mono">
              <CheckCircle2 className="size-5" />
              <span>Active</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Listening for joins</span>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Bounties Awarded
            </span>
            <div className="flex items-center gap-2 text-2xl font-bold text-amber-400 font-mono">
              <Coins className="size-5" />
              <span>+{totalBounties} Credits</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Claimed by real members</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Members List Card */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
                <Users className="size-4" />
                <span>Verified Joins</span>
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-tight mt-0.5">
                Member Joins & Activity
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Live log of Discord members who joined your server through Mavely campaigns and directory listings.
              </CardDescription>
            </div>

            {/* Filter Search */}
            {memberJoins.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username..."
                  className="pl-8 text-xs bg-[#11141c] border-white/[0.09] text-slate-200 h-9 rounded-lg focus:border-white/20"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredJoins.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Compass className="size-7 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No Member Joins Recorded Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Member joins from your active campaigns and directory promotions will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredJoins.map((member) => {
                const dateObj = typeof member.joinedAt === 'number' ? new Date(member.joinedAt) : new Date(member.joinedAt);

                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* User Avatar + Username */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.username}
                          className="size-10 rounded-full object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-xs shrink-0 font-mono">
                          {member.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {member.username.startsWith('@') ? member.username : `@${member.username}`}
                          </span>
                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <span>Joined {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges & Bounty */}
                    <div className="flex items-center gap-3 justify-end shrink-0">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Verified Member</span>
                      </Badge>

                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <Coins className="size-3" />
                        <span>+{member.rewardCoins || 1} Credit</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HistoryTab;
