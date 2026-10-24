import React, { useState } from 'react';
import {
  Bot,
  ExternalLink,
  Check,
  Copy,
  Terminal,
  Key,
  ShieldCheck,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBotInviteUrl, updateWorkspaceCredentials } from '@/lib/api';
import type { DiscordGuild, WorkspaceBot, WorkspaceCustomizations } from '@/types';

interface BotManagementTabProps {
  guild: DiscordGuild | null;
  workspace: WorkspaceBot | null;
  config: WorkspaceCustomizations;
  onChangeConfig: (updates: Partial<WorkspaceCustomizations>) => void;
  onSaveConfig: () => Promise<void>;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function BotManagementTab({
  guild,
  workspace,
  config,
  onChangeConfig,
  onSaveConfig,
  addToast
}: BotManagementTabProps) {
  const guildId = guild?.id || '1530147023754367006';
  const serverName = guild?.name || config.serverName || 'Community Server';

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const botInviteUrl = getBotInviteUrl(guildId);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      addToast('warning', 'Missing Key', 'Please enter your ER:LC private server API key.');
      return;
    }
    setSavingKey(true);
    try {
      await updateWorkspaceCredentials(guildId, { erlcApiKey: apiKeyInput.trim() });
      addToast('success', 'API Key Saved', 'ER:LC API credentials updated and securely stored.');
      setApiKeyInput('');
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not save API key.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(botInviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
    addToast('success', 'Invite Link Copied', 'Bot authorization URL copied to clipboard.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── BOT STATUS HEADER (Clean, flush, no harsh rectangular card behind icon) ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Bot className="size-6 text-white shrink-0" />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Bot Integration & Gateway
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] font-sans text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Gateway Connected</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Discord slash commands, automated bump announcements, and ER:LC server sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyInvite}
              className="text-xs border-white/10 bg-[#272727] hover:bg-[#323232] text-zinc-300 h-9 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              {copiedInvite ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-zinc-400" />}
              <span>{copiedInvite ? 'Copied' : 'Copy Invite'}</span>
            </Button>

            <Button
              type="button"
              onClick={() => window.open(botInviteUrl, '_blank', 'noopener,noreferrer')}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <span>Add to Discord</span>
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── ER:LC IN-GAME API CREDENTIALS ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-white">ER:LC Private Server API Key</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Provide your Emergency Response: Liberty County server API key to enable live member tracking and real-time player counts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <Input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Paste your ER:LC private server API key..."
            className="h-10 text-xs bg-[#141416] border-white/10 text-white rounded-xl font-mono focus:border-emerald-500/50 flex-1"
          />
          <Button
            type="button"
            disabled={savingKey}
            onClick={handleSaveApiKey}
            className="h-10 px-5 text-xs font-semibold bg-[#272727] hover:bg-[#323232] text-white border border-white/10 rounded-xl cursor-pointer transition-all"
          >
            {savingKey ? 'Verifying...' : 'Save Key'}
          </Button>
        </div>
      </div>

      {/* ── AVAILABLE SLASH COMMANDS REFERENCE ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-white">Active Discord Slash Commands</h3>
          </div>
          <p className="text-xs text-zinc-400">Available commands enabled in your community server.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
            <span className="font-mono font-bold text-white block">/bump</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Bumps your community to the top spot in the Mavely public server directory and posts thank-you confirmation.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
            <span className="font-mono font-bold text-white block">/claim</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Claims earned credit bounties for joining verified partner communities from the growth exchange.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
            <span className="font-mono font-bold text-white block">/shift</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Start, pause, or end an ER:LC patrol shift with automated callsign and radio frequency tracking.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
            <span className="font-mono font-bold text-white block">/verify</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Links Roblox account username and numeric ID to Discord identity for roster sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BotManagementTab;
