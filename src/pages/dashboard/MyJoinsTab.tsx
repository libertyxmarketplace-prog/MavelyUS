import { useState, useEffect } from 'react';
import { ShieldCheck, Check, ExternalLink, Compass, Clock, UserX, AlertTriangle, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type PromotedServer } from './EarnCoinsTab';

interface MyJoinsTabProps {
  onNavigateTab?: (tab: string) => void;
  addToast?: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function MyJoinsTab({ onNavigateTab, addToast }: MyJoinsTabProps) {
  const [joinedServers, setJoinedServers] = useState<PromotedServer[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    try {
      const savedServers: PromotedServer[] = JSON.parse(localStorage.getItem('civlink_promoted_servers') || '[]');
      const savedJoins: Record<string, boolean> = JSON.parse(localStorage.getItem('civlink_joined_servers') || '{}');

      const userJoined = savedServers.filter((s) => savedJoins[s.id]);
      setJoinedServers(userJoined);
    } catch (e) {
      console.warn('Error reading joins:', e);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reciprocal Clawback Simulation (Directly tests the J4J penalty & kick mechanic)
  const handleTestLeaveServer = (server: PromotedServer) => {
    const savedJoins: Record<string, boolean> = JSON.parse(localStorage.getItem('civlink_joined_servers') || '{}');
    delete savedJoins[server.id];
    localStorage.setItem('civlink_joined_servers', JSON.stringify(savedJoins));

    // Deduct credits
    const penalty = server.rewardCoins || 1;
    const currentBalance = parseInt(localStorage.getItem('civlink_credits_balance') || '0', 10);
    const newBalance = Math.max(0, currentBalance - penalty);
    localStorage.setItem('civlink_credits_balance', newBalance.toString());

    // Record clawback transaction in ledger
    const clawbackTx = {
      id: `tx_${Date.now()}`,
      type: 'spend',
      title: `72h Retention Clawback (Left ${server.name})`,
      amount: `-${penalty} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'revoked',
    };
    const savedTxs = JSON.parse(localStorage.getItem('civlink_transactions') || '[]');
    localStorage.setItem('civlink_transactions', JSON.stringify([clawbackTx, ...savedTxs]));

    setJoinedServers((prev) => prev.filter((s) => s.id !== server.id));
    window.dispatchEvent(new Event('civlink_credits_updated'));

    addToast?.(
      'error',
      'Reciprocal Penalty Enforced',
      `Left ${server.name} before 72 hours. -${penalty} credit clawed back from treasury and reciprocal bot kick triggered.`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Overview Card */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
                <ShieldCheck className="size-4" />
                <span>Reciprocal J4J Engine</span>
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-tight">
                My Verified Joins & 72h Retention Tracker
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              72h Retention Tracker
            </Badge>
          </div>

          <CardDescription className="text-xs text-slate-400 leading-relaxed pt-1">
            Stay in joined servers for at least 72 hours to secure your points. If you leave early, the bot automatically removes your credits and triggers reciprocal removal.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {joinedServers.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#11141c] p-10 text-center space-y-3">
              <div className="size-12 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Compass className="size-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No Active Memberships Recorded</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  You have not joined any community campaigns yet. Visit Earn Credits to discover partner servers and claim bounties.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => onNavigateTab?.('earn')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-8 px-4 rounded-lg shadow-sm"
                >
                  Browse Earn Credits Directory
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {joinedServers.map((server) => {
                const bounty = server.rewardCoins || 1;
                const joinTimestamp = server.createdAt || now - 3600000;
                const lockExpires = joinTimestamp + 72 * 3600 * 1000;
                const msLeft = Math.max(0, lockExpires - now);
                const hoursLeft = Math.floor(msLeft / (1000 * 3600));
                const minsLeft = Math.floor((msLeft % (1000 * 3600)) / (1000 * 60));

                return (
                  <div
                    key={server.id}
                    className="p-4 rounded-xl border border-white/[0.08] bg-[#11141c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {server.icon ? (
                        <img
                          src={server.icon}
                          alt={server.name}
                          className="size-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-xl bg-[#5865F2] flex items-center justify-center font-bold text-white text-base shrink-0">
                          {server.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{server.name}</span>
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                            <Check className="size-2.5 mr-1" />
                            Verified Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-amber-400">
                            <Coins className="size-3" />
                            <span>+{bounty} Credit</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="size-3" />
                            <span>Lock remaining: {hoursLeft}h {minsLeft}m</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {server.inviteUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(server.inviteUrl, '_blank', 'noopener,noreferrer')}
                          className="h-8 text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 rounded-lg"
                        >
                          <span>Open Server</span>
                          <ExternalLink className="size-3 ml-1.5 text-slate-400" />
                        </Button>
                      ) : null}

                      {/* Test Clawback Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestLeaveServer(server)}
                        className="h-8 text-xs border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg"
                        title="Simulate leaving server to verify penalty deduction"
                      >
                        <UserX className="size-3 mr-1 text-rose-400" />
                        <span>Test Leave (Clawback)</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* J4J Rule Notice */}
          <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#11141c] flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Reciprocal Membership Protocol:</strong> When you join a community, you earn growth credits. If you leave their server within 72 hours, Mavely automatically recovers the rewarded credits from your balance and informs the partner server bot.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyJoinsTab;
