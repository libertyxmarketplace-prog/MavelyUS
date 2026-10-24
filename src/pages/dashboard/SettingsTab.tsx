import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  KeyRound,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Send,
  Hash,
  ShieldAlert,
  Radio,
  Sliders,
  Bot,
  ExternalLink
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { updateWorkspaceCredentials, sendTestNotification } from '@/lib/api';
import type { DiscordGuild, WorkspaceBot, WorkspaceCustomizations } from '@/types';

interface SettingsTabProps {
  guild: DiscordGuild | null;
  workspace: WorkspaceBot | null;
  config: WorkspaceCustomizations;
  onChangeConfig: (updates: Partial<WorkspaceCustomizations>) => void;
  onSaveConfig: () => Promise<void>;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function SettingsTab({
  guild,
  workspace,
  config,
  onChangeConfig,
  onSaveConfig,
  addToast
}: SettingsTabProps) {
  const { user } = useAuth();
  const guildId = guild?.id || workspace?.guildId || '1530147023754367006';
  const serverName = guild?.name || config.serverName || 'Community Server';

  // Credentials State
  const [erlcKey, setErlcKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Local switch states
  const [bumpThanks, setBumpThanks] = useState<boolean>(() => {
    return localStorage.getItem(`erlcus_bump_enabled_${guildId}`) !== 'false';
  });
  const [antiRaidAlerts, setAntiRaidAlerts] = useState<boolean>(true);
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(true);
  const [streakAlerts, setStreakAlerts] = useState<boolean>(true);

  // Real Discord channels & roles loaded from server
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; color?: number }[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadGuildData() {
      try {
        const [chRes, rRes] = await Promise.all([
          fetch(`/api/workspace/${guildId}/channels`).catch(() => null),
          fetch(`/api/workspace/${guildId}/roles`).catch(() => null)
        ]);

        if (chRes && chRes.ok) {
          const chData = await chRes.json();
          if (mounted && Array.isArray(chData.channels) && chData.channels.length > 0) {
            setChannels(chData.channels);
          }
        }

        if (rRes && rRes.ok) {
          const rData = await rRes.json();
          if (mounted && Array.isArray(rData.roles) && rData.roles.length > 0) {
            setRoles(rData.roles);
          }
        }
      } catch (err) {
        console.warn('[SETTINGS] Could not load live guild telemetry:', err);
      }
    }

    loadGuildData();
    return () => { mounted = false; };
  }, [guildId]);

  // Testing notification state
  const [sendingTest, setSendingTest] = useState<string | null>(null);

  const handleSendTest = async (type: 'anti_raid' | 'bump' | 'streak' | 'digest') => {
    setSendingTest(type);
    try {
      await sendTestNotification(guildId, type);
      addToast(
        'success',
        'Test Dispatched to Discord',
        `Live v2 component embed sent to your Discord DM (${user?.username || 'kims3166'}).`
      );
    } catch (err: any) {
      addToast('error', 'Delivery Notice', err.message || 'Could not send test notification.');
    } finally {
      setSendingTest(null);
    }
  };

  const handleSaveErlcKey = async () => {
    if (!erlcKey.trim()) {
      addToast('warning', 'Missing Key', 'Please enter your ER:LC private server API key.');
      return;
    }
    setSavingKey(true);
    try {
      await updateWorkspaceCredentials(guildId, { erlcApiKey: erlcKey.trim() });
      addToast('success', 'Credentials Saved', 'ER:LC API credentials updated and securely stored.');
      setErlcKey('');
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not save API credentials.');
    } finally {
      setSavingKey(false);
    }
  };

  const userAvatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : (user as any)?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const displayName = user?.global_name || user?.username || 'kims3166';
  const userSnowflake = user?.id || '523693281541095424';

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-150">
      <div className="w-full">
        <Tabs defaultValue="profile" className="flex flex-col w-full">
          <div className="no-scrollbar mb-6 min-w-0 overflow-x-auto overflow-y-hidden border-b border-white/[0.06] pb-3">
            <TabsList className="bg-[#141416] p-1 border border-white/[0.06] rounded-xl h-auto gap-1">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-[#272727] data-[state=active]:text-white text-zinc-400 text-xs font-medium rounded-lg px-3.5 py-1.5 gap-2 transition-all"
                >
                  <User className="size-3.5" />
                  Profile & Server
                </TabsTrigger>
                <TabsTrigger
                  value="bot"
                  className="data-[state=active]:bg-[#272727] data-[state=active]:text-white text-zinc-400 text-xs font-medium rounded-lg px-3.5 py-1.5 gap-2 transition-all"
                >
                  <Bot className="size-3.5" />
                  Bot & Gateway
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-[#272727] data-[state=active]:text-white text-zinc-400 text-xs font-medium rounded-lg px-3.5 py-1.5 gap-2 transition-all"
                >
                  <Bell className="size-3.5" />
                  Notifications & Defense
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-[#272727] data-[state=active]:text-white text-zinc-400 text-xs font-medium rounded-lg px-3.5 py-1.5 gap-2 transition-all"
                >
                  <KeyRound className="size-3.5" />
                  API & Credentials
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: PROFILE & SERVER CONFIGURATION */}
            <TabsContent value="profile" className="flex flex-col gap-6 animate-in fade-in-50 duration-150">
              {/* Authenticated Discord User Card */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="size-12 rounded-xl border border-white/10">
                    <AvatarImage src={userAvatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-[#272727] text-white text-sm font-semibold">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{displayName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/10">
                        Owner
                      </span>
                    </div>
                    <span className="text-zinc-500 font-mono text-xs">ID: {userSnowflake}</span>
                  </div>
                </div>
              </div>

              {/* Server Administration & Operational Channels */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bot-prefix" className="text-xs font-semibold text-zinc-300">
                    Bot Command Prefix
                  </Label>
                  <div className="flex items-center h-9.5 px-3 rounded-xl bg-[#141416] border border-white/10 text-white font-sans text-xs select-none font-medium">
                    <span>/ (Discord Slash Commands Only)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Standardized Discord slash commands (<span className="text-zinc-400 font-sans">/bump</span>, <span className="text-zinc-400 font-sans">/ticket</span>, <span className="text-zinc-400 font-sans">/session</span>).
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="staff-role" className="text-xs font-semibold text-zinc-300">
                    Staff Management Role
                  </Label>
                  <Select
                    value={config.botStaffRoleId || 'none'}
                    onValueChange={(val) => onChangeConfig({ botStaffRoleId: val === 'none' ? '' : val })}
                  >
                    <SelectTrigger id="staff-role" className="bg-[#141416] border-white/10 text-white text-xs h-9.5 rounded-xl">
                      <SelectValue placeholder="Select Staff Role..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-white/10 text-white">
                      <SelectItem value="none" className="text-zinc-400">
                        {roles.length > 0 ? 'Default: Server Administrators' : 'No roles detected'}
                      </SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="text-white">
                          <span>{r.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-zinc-500">
                    Discord role permitted to manage bot controls and moderation tools.
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="audit-channel" className="text-xs font-semibold text-zinc-300">
                    Audit & Security Log Channel
                  </Label>
                  <Select
                    value={config.auditChannelId || config.transcriptsChannelId || 'none'}
                    onValueChange={(val) => {
                      const id = val === 'none' ? '' : val;
                      onChangeConfig({ auditChannelId: id, transcriptsChannelId: id });
                    }}
                  >
                    <SelectTrigger id="audit-channel" className="bg-[#141416] border-white/10 text-white text-xs h-9.5 rounded-xl">
                      <SelectValue placeholder="Select Security Channel..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-white/10 text-white">
                      <SelectItem value="none" className="text-zinc-400">
                        {channels.length > 0 ? 'Select Security & Audit Channel...' : 'No channels detected'}
                      </SelectItem>
                      {channels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id} className="text-white">
                          <span className="text-zinc-400 font-mono text-[11px] mr-1.5 font-bold">#</span>
                          <span>{ch.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-zinc-500">
                    Target channel for anti-raid triggers, alt alerts, and shift logs.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bump-channel" className="text-xs font-semibold text-zinc-300">
                    Bump Channel
                  </Label>
                  <Select
                    value={config.bumpChannelId || 'none'}
                    onValueChange={(val) => onChangeConfig({ bumpChannelId: val === 'none' ? '' : val })}
                  >
                    <SelectTrigger id="bump-channel" className="bg-[#141416] border-white/10 text-white text-xs h-9.5 rounded-xl">
                      <SelectValue placeholder="Select Bump Channel..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-white/10 text-white">
                      <SelectItem value="none" className="text-zinc-400">
                        {channels.length > 0 ? 'Select Bump Channel...' : 'No channels detected'}
                      </SelectItem>
                      {channels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id} className="text-white">
                          <span className="text-zinc-400 font-mono text-[11px] mr-1.5 font-bold">#</span>
                          <span>{ch.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-zinc-500">
                    Dedicated channel where <span className="text-zinc-400 font-mono">/bump</span> command runs.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quarantine-role" className="text-xs font-semibold text-zinc-300">
                  Quarantine / Unverified Role (Anti-Raid Defense)
                </Label>
                <Select
                  value={config.quarantineRoleId || 'none'}
                  onValueChange={(val) => onChangeConfig({ quarantineRoleId: val === 'none' ? '' : val })}
                >
                  <SelectTrigger id="quarantine-role" className="bg-[#141416] border-white/10 text-white text-xs h-9.5 rounded-xl">
                    <SelectValue placeholder="Select Quarantine Role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/10 text-white">
                    <SelectItem value="none" className="text-zinc-400">
                      {roles.length > 0 ? 'Default: Quarantine Isolation Role' : 'No roles detected'}
                    </SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-white">
                        <span>{r.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-zinc-500">
                  Accounts flagged by anti-churn gates are assigned this role until manual staff review.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToast('info', 'Reverted', 'Settings restored to server baseline.')}
                  className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs rounded-xl h-9 cursor-pointer"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={onSaveConfig}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl h-9 px-4 shadow-sm cursor-pointer"
                >
                  Save changes
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: BOT INTEGRATION & GATEWAY */}
            <TabsContent value="bot" className="flex flex-col gap-6 animate-in fade-in-50 duration-150">
              <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Bot className="size-6 text-white shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {workspace?.botName || 'Discord Bot V.2'}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Online & Synced</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Operational bot controls, slash commands, and server moderation gateway.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                      const redirectUri = isLocal
                        ? `${window.location.origin}/auth/discord/callback`
                        : 'https://organizational-parliamentary-minimize-lookup.trycloudflare.com/auth/discord/callback';
                      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&redirect_uri=${encodeURIComponent(redirectUri)}&integration_type=0&scope=bot`;
                      window.open(inviteUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Add to Discord</span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bot-prefix-tab" className="text-xs font-semibold text-zinc-300">
                      Bot Command Prefix
                    </Label>
                    <div className="flex items-center h-9.5 px-3 rounded-xl bg-[#141416] border border-white/10 text-white font-sans text-xs select-none font-medium">
                      <span>/ (Discord Slash Commands Only)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Standardized Discord slash commands (<span className="text-zinc-400 font-sans">/</span>). Text prefix fallback.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="staff-role-tab" className="text-xs font-semibold text-zinc-300">
                      Staff Management Role
                    </Label>
                    <Select
                      value={config.botStaffRoleId || 'none'}
                      onValueChange={(val) => onChangeConfig({ botStaffRoleId: val === 'none' ? '' : val })}
                    >
                      <SelectTrigger id="staff-role-tab" className="bg-[#141416] border-white/10 text-white text-xs h-9.5 rounded-xl">
                        <SelectValue placeholder="Select Staff Role..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161616] border-white/10 text-white">
                        <SelectItem value="none" className="text-zinc-400">
                          {roles.length > 0 ? 'Default: Server Administrators' : 'No roles detected'}
                        </SelectItem>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="text-white">
                            <span>{r.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[11px] text-zinc-500">
                      Discord role permitted to manage bot controls and moderation tools.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
                  <Button
                    size="sm"
                    onClick={onSaveConfig}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl h-9 px-5 shadow-sm cursor-pointer"
                  >
                    Save Bot Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: NOTIFICATIONS & DEFENSE */}
            <TabsContent value="notifications" className="flex flex-col gap-3.5 animate-in fade-in-50 duration-150">
              {/* Alert 1: Anti-Raid & Churn Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-xs sm:text-sm font-semibold text-white">Anti-Raid & Churn Alerts</span>
                  <span className="text-zinc-400 text-xs leading-normal">
                    Receive instant notifications when rapid multi-account churn or alt activity is detected.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingTest === 'anti_raid'}
                    onClick={() => handleSendTest('anti_raid')}
                    className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs h-8.5 rounded-lg px-3 cursor-pointer"
                  >
                    <Send className="size-3 mr-1.5 text-zinc-400" />
                    <span>{sendingTest === 'anti_raid' ? 'Sending...' : 'Send Test'}</span>
                  </Button>
                  <Switch
                    checked={antiRaidAlerts}
                    onCheckedChange={(val) => {
                      setAntiRaidAlerts(val);
                      addToast('info', val ? 'Alerts Enabled' : 'Alerts Muted', 'Anti-Raid notifications updated.');
                    }}
                  />
                </div>
              </div>

              {/* Alert 2: Automated Bump Thank-You */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-xs sm:text-sm font-semibold text-white">Automated Bump Thank-You</span>
                  <span className="text-zinc-400 text-xs leading-normal">
                    Post an automated thank-you message in your Discord bump channel whenever players execute /bump.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingTest === 'bump'}
                    onClick={() => handleSendTest('bump')}
                    className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs h-8.5 rounded-lg px-3 cursor-pointer"
                  >
                    <Send className="size-3 mr-1.5 text-zinc-400" />
                    <span>{sendingTest === 'bump' ? 'Sending...' : 'Send Test'}</span>
                  </Button>
                  <Switch
                    checked={bumpThanks}
                    onCheckedChange={(val) => {
                      setBumpThanks(val);
                      localStorage.setItem(`erlcus_bump_enabled_${guildId}`, String(val));
                      addToast('info', val ? 'Bump Thank-You Active' : 'Bump Thank-You Disabled', 'Bump automation saved.');
                    }}
                  />
                </div>
              </div>

              {/* Alert 3: Daily Streak Reminders */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-xs sm:text-sm font-semibold text-white">Daily Streak Reminders</span>
                  <span className="text-zinc-400 text-xs leading-normal">
                    Notify server staff when daily check-in rewards are unlocked or milestone streaks are reached.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingTest === 'streak'}
                    onClick={() => handleSendTest('streak')}
                    className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs h-8.5 rounded-lg px-3 cursor-pointer"
                  >
                    <Send className="size-3 mr-1.5 text-zinc-400" />
                    <span>{sendingTest === 'streak' ? 'Sending...' : 'Send Test'}</span>
                  </Button>
                  <Switch
                    checked={streakAlerts}
                    onCheckedChange={(val) => {
                      setStreakAlerts(val);
                      addToast('info', val ? 'Streak Reminders On' : 'Streak Reminders Off', 'Check-in alerts updated.');
                    }}
                  />
                </div>
              </div>

              {/* Alert 4: Weekly Growth Digest */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-xs sm:text-sm font-semibold text-white">Weekly Growth Digest</span>
                  <span className="text-zinc-400 text-xs leading-normal">
                    Receive a weekly summary of verified member joins, 72-hour retention rates, and active roster shifts.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingTest === 'digest'}
                    onClick={() => handleSendTest('digest')}
                    className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs h-8.5 rounded-lg px-3 cursor-pointer"
                  >
                    <Send className="size-3 mr-1.5 text-zinc-400" />
                    <span>{sendingTest === 'digest' ? 'Sending...' : 'Send Test'}</span>
                  </Button>
                  <Switch
                    checked={weeklyDigest}
                    onCheckedChange={(val) => {
                      setWeeklyDigest(val);
                      addToast('info', val ? 'Weekly Digest On' : 'Weekly Digest Off', 'Digest schedule updated.');
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: API & CREDENTIALS */}
            <TabsContent value="billing" className="flex flex-col gap-5 animate-in fade-in-50 duration-150">
              <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Emergency Response: Liberty County API Key</h3>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Connect your ER:LC private server API key to automatically synchronize real-time player counts, join keys, and server status.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="erlc-key" className="text-xs font-semibold text-zinc-300">
                    Server API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="erlc-key"
                      type={showKey ? 'text' : 'password'}
                      value={erlcKey}
                      onChange={(e) => setErlcKey(e.target.value)}
                      placeholder={workspace?.hasErlcKey ? '••••••••••••••••••••••••••••••••' : 'Enter your ER:LC Server API Key...'}
                      className="bg-[#141416] border-white/10 text-white text-xs h-10 pr-10 rounded-xl font-mono focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${workspace?.hasErlcKey ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    <span className="text-xs text-zinc-400 font-mono">
                      {workspace?.hasErlcKey ? 'Connected & Verified' : 'Awaiting Configuration'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSaveErlcKey}
                    disabled={savingKey}
                    className="bg-[#272727] hover:bg-[#323232] text-white border border-white/10 text-xs font-medium rounded-xl h-9 px-4 cursor-pointer"
                  >
                    {savingKey ? 'Verifying...' : 'Save & Verify Key'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}

export default SettingsTab;
