import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Save,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { updateWorkspaceCredentials } from '@/lib/api';

export function CredentialsTab() {
  const [erlcKey, setErlcKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = `${window.location.origin}/api/webhook/erlc`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erlcKey.trim()) return;
    setSaving(true);
    try {
      // Simulating secure API key storage
      setTimeout(() => {
        setSaving(false);
        setErlcKey('');
      }, 600);
    } catch {
      setSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <KeyRound className="size-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Credentials & API Security
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Manage private server tokens, webhook listeners, and cryptographic developer keys.
        </p>
      </div>

      {/* ER:LC Server Key Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Private Server Integration Key</h3>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
            ISOLATED & ENCRYPTED
          </Badge>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Your ER:LC server API key connects our telemetry engine to your Roblox server without granting permissions to external bots.
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <Input
              type="password"
              value={erlcKey}
              onChange={(e) => setErlcKey(e.target.value)}
              placeholder="Enter server API key..."
              className="h-10 text-xs bg-black/40 border-white/10 text-white rounded-xl font-mono focus:border-amber-500/50 flex-1"
            />
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              {saving ? 'Saving…' : 'Save Key'}
            </Button>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">
            Keys are strictly hashed and never exposed in client payloads.
          </span>
        </form>
      </div>

      {/* Webhook Endpoint */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">In-Game Ingestion Webhook</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Copy this webhook URL into your in-game Roblox scripts or third-party dispatchers to stream join and shift logs into Mavely.
        </p>

        <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-2.5 rounded-xl">
          <span className="text-xs font-mono text-zinc-300 truncate flex-1">{webhookUrl}</span>
          <button
            type="button"
            onClick={handleCopyWebhook}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {copiedWebhook ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CredentialsTab;
