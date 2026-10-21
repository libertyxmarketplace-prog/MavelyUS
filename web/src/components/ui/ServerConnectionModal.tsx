import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Zap,
  ShieldCheck,
  ExternalLink,
  Check,
  RotateCw,
  Sparkles,
  ArrowRight,
  KeyRound,
  Server
} from 'lucide-react';
import { getBotInviteUrl } from '@/lib/api';

interface ServerConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
  serverName: string;
  serverIconUrl: string | null;
  isBotConnected: boolean;
  onStandaloneSetup: () => void;
  onVerifyConnection: () => Promise<void>;
  checkingConnection: boolean;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function ServerConnectionModal({
  open,
  onOpenChange,
  guildId,
  serverName,
  serverIconUrl,
  isBotConnected,
  onStandaloneSetup,
  onVerifyConnection,
  checkingConnection,
  addToast,
}: ServerConnectionModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'bot' | 'standalone'>('bot');
  const [showCustomToken, setShowCustomToken] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);

  const inviteUrl = getBotInviteUrl(guildId);

  const handleSaveCustomToken = async () => {
    if (!customToken.trim()) {
      addToast('warning', 'Token Required', 'Please enter a valid Discord bot token.');
      return;
    }
    setSavingToken(true);
    try {
      const res = await fetch(`/api/bots/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save bot token');
      }
      addToast('success', 'Bot Token Linked', 'Custom bot token saved and initialized successfully.');
      onOpenChange(false);
    } catch (err: any) {
      addToast('error', 'Token Error', err.message || 'Could not validate bot token.');
    } finally {
      setSavingToken(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0e111a] border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            {serverIconUrl ? (
              <img
                src={serverIconUrl}
                alt={serverName}
                className="size-12 rounded-2xl object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white border border-white/10 shrink-0">
                {serverName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Connect & Configure Server
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-sans">
                Choose how you want to set up and manage <span className="text-white font-medium">{serverName}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Two Setup Method Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Method 1: Connect Bot */}
          <div
            onClick={() => setSelectedMethod('bot')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-4 ${
              selectedMethod === 'bot'
                ? 'border-indigo-500/80 bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.18)]'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Bot className="size-5" />
                </div>
                <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 text-[10px] bg-indigo-500/10">
                  FULL AUTOMATION
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Connect Discord Bot</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Invite Mavely Bot to automate ticket desks, patrol voice channels, LOA tracking, and staff recruitment.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Automated Discord ticket panels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Real-time in-game patrol frequency sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Live staff recruitment review system</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>{isBotConnected ? 'Bot Connected' : 'Invite & Link'}</span>
              <ArrowRight className="size-3.5" />
            </div>
          </div>

          {/* Method 2: Setup Without Bot */}
          <div
            onClick={() => setSelectedMethod('standalone')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-4 ${
              selectedMethod === 'standalone'
                ? 'border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Zap className="size-5" />
                </div>
                <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px] bg-amber-500/10">
                  SOON
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Setup Without Bot (Soon)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Configure your community listing, custom banners, ER:LC join codes, and preview panels immediately.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Public discovery listing & bump engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Custom banners, lore & tags customization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Connect Discord bot whenever you're ready</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Setup Workspace</span>
              <ArrowRight className="size-3.5" />
            </div>
          </div>
        </div>

        {/* Action Panel based on selection */}
        {selectedMethod === 'bot' ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-left w-full sm:w-auto">
                <span className="text-xs font-semibold text-white block">Official Bot Guild Installation</span>
                <span className="text-[11px] text-zinc-400 font-sans">
                  Direct Discord authorization with Administrator & slash commands scope.
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer w-full sm:w-auto"
                >
                  <Bot className="size-3.5" />
                  <span>Authorize Bot</span>
                  <ExternalLink className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onVerifyConnection}
                  disabled={checkingConnection}
                  className="border-white/10 hover:bg-white/5 text-zinc-200 text-xs h-9 px-3.5 rounded-xl cursor-pointer"
                >
                  <RotateCw className={`size-3 mr-1.5 ${checkingConnection ? 'animate-spin' : ''}`} />
                  <span>Verify</span>
                </Button>
              </div>
            </div>

            {/* Custom Token Toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCustomToken(!showCustomToken)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="size-3.5 text-indigo-400" />
                <span>Need to connect a custom Discord bot token? {showCustomToken ? 'Hide' : 'Show'}</span>
              </button>

              {showCustomToken && (
                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3 animate-in fade-in-50 duration-150">
                  <span className="text-xs font-semibold text-white block">Custom Discord Bot Token</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={customToken}
                      onChange={(e) => setCustomToken(e.target.value)}
                      placeholder="Paste your Discord Bot Token..."
                      className="text-xs bg-black/40 border-white/10 font-mono h-9 rounded-xl focus:border-indigo-500"
                    />
                    <Button
                      onClick={handleSaveCustomToken}
                      disabled={savingToken}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 rounded-xl shrink-0 cursor-pointer"
                    >
                      {savingToken ? 'Saving…' : 'Save Token'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Ready to configure without bot</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                Instant Access
              </Badge>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              You can start configuring your community right now! Customize your server details, ER:LC join code, public directory banner, application forms, and ticket rules without adding the bot.
            </p>
            <div className="pt-1 flex items-center justify-end">
              <Button
                onClick={() => {
                  onStandaloneSetup();
                  onOpenChange(false);
                  addToast('success', 'Standalone Setup Active', 'You can now customize all server settings.');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-5 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="size-3.5 mr-1.5" />
                <span>Open Server Configuration</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
