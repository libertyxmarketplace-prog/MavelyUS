import { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Users,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReferralsTabProps {
  currentGuildId?: string;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function ReferralsTab({ currentGuildId, addToast }: ReferralsTabProps) {
  const [copied, setCopied] = useState(false);
  const [referredCount] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_referrals_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [earnedCredits] = useState<number>(() => {
    const saved = localStorage.getItem('civlink_referrals_earned');
    return saved ? parseInt(saved, 10) : 0;
  });

  const refLink = `${window.location.origin}/invite?ref=${currentGuildId || 'community'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('success', 'Referral Link Copied', 'Share this link to earn +15 credits per registered community.');
  };

  const handleCopyDiscordMessage = () => {
    const text = `Join Mavely and boost your Discord server with verified members! Claim free growth credits here: ${refLink}`;
    navigator.clipboard.writeText(text);
    addToast('success', 'Message Template Copied', 'Discord invite message copied to clipboard.');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Referred Communities</span>
            <div className="flex items-center gap-2 text-2xl font-bold text-white font-mono">
              <Users className="size-5 text-cyan-400" />
              <span>{referredCount} Servers</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real-time invite tracking</span>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Credits Earned via Referrals</span>
            <div className="flex items-center gap-2 text-2xl font-bold text-amber-400 font-mono">
              <Gift className="size-5" />
              <span>{earnedCredits} Credits</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Deposited into community treasury</span>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Bounty Per Referral</span>
            <div className="flex items-center gap-2 text-2xl font-bold text-emerald-400 font-mono">
              <Sparkles className="size-5" />
              <span>+15 Credits</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Instant automated payout</span>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Studio Card with ShadCN DropdownMenu */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
                <Share2 className="size-4" />
                <span>Invite Community Owners</span>
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-tight">
                Your Unique Server Referral Link
              </CardTitle>
            </div>

            {/* ShadCN DropdownMenu for quick actions */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 h-8 px-2.5 rounded-lg"
                  >
                    <MoreVertical className="size-3.5 mr-1" />
                    <span>Options</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#161a24]/95 backdrop-blur-2xl shadow-2xl">
                <DropdownMenuLabel className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Referral Actions
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleCopyLink} className="text-xs py-2 cursor-pointer gap-2 hover:bg-white/[0.04]">
                  <Copy className="size-3.5 text-slate-400" />
                  <span>Copy Direct URL</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyDiscordMessage} className="text-xs py-2 cursor-pointer gap-2 hover:bg-white/[0.04]">
                  <MessageSquare className="size-3.5 text-cyan-400" />
                  <span>Copy Discord Message</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => window.open(refLink, '_blank', 'noopener,noreferrer')}
                  className="text-xs py-2 cursor-pointer gap-2 hover:bg-white/[0.04]"
                >
                  <ExternalLink className="size-3.5 text-emerald-400" />
                  <span>Test Referral Page</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardDescription className="text-xs text-slate-400 leading-relaxed pt-1">
            Share this link with Discord server owners and community leaders. When they invite Mavely and register their server, you both receive +15 free growth credits.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Link Box */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <Input
              readOnly
              value={refLink}
              className="text-xs bg-[#11141c] border-white/[0.09] text-slate-200 font-mono h-10 rounded-lg flex-1 focus:border-white/20 select-all"
            />
            <Button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-10 px-5 rounded-lg shadow-sm shrink-0 transition-colors"
            >
              {copied ? <Check className="size-3.5 mr-1.5 text-white" /> : <Copy className="size-3.5 mr-1.5" />}
              {copied ? 'Copied Link' : 'Copy Referral Link'}
            </Button>
          </div>

          {/* 3 Steps Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#11141c] space-y-1">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-1.5 py-0">
                STEP 1
              </Badge>
              <h4 className="text-xs font-semibold text-white pt-1">Send Invite to Owners</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Send your unique link to Discord server owners or community admins.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#11141c] space-y-1">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono px-1.5 py-0">
                STEP 2
              </Badge>
              <h4 className="text-xs font-semibold text-white pt-1">They Add Mavely Bot</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The owner invites Mavely to their Discord server and configures their community.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#11141c] space-y-1">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-mono px-1.5 py-0">
                STEP 3
              </Badge>
              <h4 className="text-xs font-semibold text-white pt-1">Both Get +15 Credits</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                As soon as their workspace verifies, +15 credits are instantly awarded to both servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralsTab;
