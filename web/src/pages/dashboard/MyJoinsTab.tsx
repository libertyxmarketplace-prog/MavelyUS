import { useState, useEffect } from 'react';
import { Check, ExternalLink, Compass, UserX, AlertCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { type PromotedServer } from './EarnCoinsTab';

interface MyJoinsTabProps {
  onNavigateTab?: (tab: string) => void;
  addToast?: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function MyJoinsTab({ onNavigateTab, addToast }: MyJoinsTabProps) {
  const [joinedServers, setJoinedServers] = useState<PromotedServer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    try {
      const savedServers: PromotedServer[] = JSON.parse(localStorage.getItem('erlcus_promoted_servers') || '[]');
      const savedJoins: Record<string, boolean> = JSON.parse(localStorage.getItem('erlcus_joined_servers') || '{}');

      const userJoined = savedServers.filter((s) => savedJoins[s.id]);
      setJoinedServers(userJoined);
    } catch (e) {
      console.warn('Error reading joins:', e);
    }
  }, []);

  const handleLeaveServer = (server: PromotedServer) => {
    const savedJoins: Record<string, boolean> = JSON.parse(localStorage.getItem('erlcus_joined_servers') || '{}');
    delete savedJoins[server.id];
    localStorage.setItem('erlcus_joined_servers', JSON.stringify(savedJoins));

    // Deduct credits
    const penalty = server.rewardCoins || 1;
    const currentBalance = parseInt(localStorage.getItem('erlcus_credits_balance') || '0', 10);
    const newBalance = Math.max(0, currentBalance - penalty);
    localStorage.setItem('erlcus_credits_balance', newBalance.toString());

    // Decrement verified joins count immediately
    const currentJoins = parseInt(localStorage.getItem('erlcus_daily_joins') || '0', 10);
    const newJoins = Math.max(0, currentJoins - 1);
    localStorage.setItem('erlcus_daily_joins', newJoins.toString());

    // Record clawback transaction in ledger
    const clawbackTx = {
      id: `tx_${Date.now()}`,
      type: 'spend',
      title: `Membership Left (${server.name})`,
      amount: `-${penalty} Credits`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'revoked',
    };
    const savedTxs = JSON.parse(localStorage.getItem('erlcus_transactions') || '[]');
    localStorage.setItem('erlcus_transactions', JSON.stringify([clawbackTx, ...savedTxs]));

    setJoinedServers((prev) => prev.filter((s) => s.id !== server.id));
    window.dispatchEvent(new Event('erlcus_credits_updated'));

    addToast?.(
      'info',
      'Left Server',
      `You left ${server.name}. -${penalty} credit removed and verified joins updated.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* Header (Clean & Flush) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Joined Communities
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Servers you joined through ERLC.US directory campaigns. Leaving a server removes bounty credits and updates your verified joins count.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-white font-semibold">
            {joinedServers.length} {joinedServers.length === 1 ? 'Server' : 'Servers'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {joinedServers.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center space-y-4">
            <div className="size-12 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <Compass className="size-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">No Active Memberships Recorded</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                You have not joined any community campaigns yet. Explore the directory to discover servers and claim bounties.
              </p>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => onNavigateTab?.('earn')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-8.5 px-4 rounded-xl shadow-sm cursor-pointer"
              >
                Browse Directory
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {joinedServers
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((server) => {
                const bounty = server.rewardCoins || 1;

                return (
                  <div
                    key={server.id}
                    className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
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

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{server.name}</span>
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                            <Check className="size-2.5 mr-1" />
                            Joined
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                          <span className="text-amber-400">+{bounty} Credits</span>
                          {server.memberCount && server.memberCount > 1 ? (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="flex items-center gap-1 text-zinc-400">
                                <Users className="size-3 text-zinc-500" />
                                <span>{server.memberCount.toLocaleString()} members</span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {server.inviteUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(server.inviteUrl, '_blank', 'noopener,noreferrer')}
                          className="h-8 text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 rounded-xl cursor-pointer"
                        >
                          <span>Open Server</span>
                          <ExternalLink className="size-3 ml-1.5 text-zinc-400" />
                        </Button>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeaveServer(server)}
                        className="h-8 text-xs border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl cursor-pointer"
                      >
                        <UserX className="size-3 mr-1 text-rose-400" />
                        <span>Leave</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

            {/* Pagination Controls */}
            <div className="pt-4 flex justify-center">
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
                  {Array.from({ length: Math.max(1, Math.ceil(joinedServers.length / itemsPerPage)) }, (_, idx) => (
                    <PaginationItem key={idx + 1}>
                      <PaginationLink
                        isActive={currentPage === idx + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(idx + 1);
                        }}
                        className="cursor-pointer"
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {Math.ceil(joinedServers.length / itemsPerPage) > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        const total = Math.max(1, Math.ceil(joinedServers.length / itemsPerPage));
                        if (currentPage < total) setCurrentPage((p) => p + 1);
                      }}
                      className={currentPage >= Math.max(1, Math.ceil(joinedServers.length / itemsPerPage)) ? "pointer-events-none opacity-40 cursor-default" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {/* Informational Notice */}
        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
          <AlertCircle className="size-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            Leaving a community campaign will deduct the earned bounty credits from your treasury and adjust your verified joins telemetry.
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyJoinsTab;
