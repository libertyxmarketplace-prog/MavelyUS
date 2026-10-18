import { useState } from 'react';
import {
  Radio,
  Send,
  Plus,
  Trash2,
  Volume2,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChannelSelect, RoleSelect } from '@/components/DiscordResourceSelectors';
import type { DiscordGuild, WorkspaceCustomizations, GuildResources, RadioFrequency } from '@/types';

interface PatrolSessionsTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  resources: GuildResources;
  onChangeConfig: (updated: Partial<WorkspaceCustomizations>) => void;
  onDeploySessionPanel: (channelId: string) => void;
  deploying: boolean;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEFAULT_FREQUENCIES: RadioFrequency[] = [
  { id: 'rf-1', frequency: '142.85 MHz', name: 'TAC 1 - Primary Patrol', channelId: '', roleId: '' },
  { id: 'rf-2', frequency: '154.20 MHz', name: 'DISPATCH - Central Communications', channelId: '', roleId: '' },
  { id: 'rf-3', frequency: '155.47 MHz', name: 'STATEWIDE - Multi-Agency Tactical', channelId: '', roleId: '' },
  { id: 'rf-4', frequency: '151.10 MHz', name: 'SUPERVISOR - Command & Staff', channelId: '', roleId: '' }
];

export function PatrolSessionsTab({
  guild: _guild,
  config,
  resources,
  onChangeConfig,
  onDeploySessionPanel,
  deploying,
  addToast
}: PatrolSessionsTabProps) {
  const [deployChannelId, setDeployChannelId] = useState(config.sessionChannelId || '');
  const [newFreqNum, setNewFreqNum] = useState('');
  const [newFreqName, setNewFreqName] = useState('');

  const sessionState = config.sessionState || 'OFFLINE';
  const quorum = config.sessionQuorumVotes ?? 8;
  const frequencies: RadioFrequency[] =
    config.radioFrequencies && config.radioFrequencies.length > 0
      ? config.radioFrequencies
      : DEFAULT_FREQUENCIES;

  const handleStateChange = (nextState: 'OFFLINE' | 'VOTE_ACTIVE' | 'PATROL_LIVE' | 'CONCLUDED') => {
    onChangeConfig({ sessionState: nextState });
    addToast('info', 'Session State Updated', `Patrol session state switched to ${nextState}.`);
  };

  const handleAddFrequency = () => {
    if (!newFreqNum.trim() || !newFreqName.trim()) {
      addToast('warning', 'Missing Fields', 'Please input frequency digits and channel title.');
      return;
    }
    const next: RadioFrequency = {
      id: `rf-${Date.now()}`,
      frequency: newFreqNum.trim(),
      name: newFreqName.trim(),
      channelId: '',
      roleId: ''
    };
    onChangeConfig({ radioFrequencies: [...frequencies, next] });
    setNewFreqNum('');
    setNewFreqName('');
    addToast('success', 'Frequency Added', `Registered frequency ${next.frequency}.`);
  };

  const handleRemoveFrequency = (id: string) => {
    const updated = frequencies.filter((f) => f.id !== id);
    onChangeConfig({ radioFrequencies: updated });
  };

  const handleUpdateFrequency = (id: string, patch: Partial<RadioFrequency>) => {
    const updated = frequencies.map((f) => (f.id === id ? { ...f, ...patch } : f));
    onChangeConfig({ radioFrequencies: updated });
  };

  const handleDeploy = () => {
    if (!deployChannelId) {
      addToast('warning', 'Select Channel', 'Please choose a destination channel for the SSU panel.');
      return;
    }
    onDeploySessionPanel(deployChannelId);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Radio className="size-4 text-zinc-300" />
              Server Startup (SSU) &amp; Radio Patrol Sessions
            </h2>
            <Badge
              className={
                sessionState === 'PATROL_LIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono'
                  : sessionState === 'VOTE_ACTIVE'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono'
                  : 'bg-zinc-800 text-zinc-400 border-white/[0.08] text-[10px] font-mono'
              }
            >
              STATE: {sessionState}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Lifecycle supervisor: <code className="font-mono text-zinc-300">OFFLINE</code> &rarr; <code className="font-mono text-zinc-300">VOTE_ACTIVE</code> &rarr; <code className="font-mono text-zinc-300">PATROL_LIVE</code> &rarr; <code className="font-mono text-zinc-300">CONCLUDED</code>.
          </p>
        </div>

        {/* Deploy Session Panel Action */}
        <div className="flex items-center gap-2">
          <div className="w-52">
            <ChannelSelect
              channels={resources.channels}
              value={deployChannelId}
              onChange={setDeployChannelId}
              placeholder="Announcement Channel"
            />
          </div>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying || !deployChannelId}
            className="h-9 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md shrink-0"
          >
            <Send className={`size-3.5 mr-1.5 ${deploying ? 'animate-spin' : ''}`} />
            Deploy SSU Panel
          </Button>
        </div>
      </div>

      {/* Session State Lifecycle Buttons */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-zinc-300" />
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Live Session Lifecycle Controller
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Slash Command: /session start
            </span>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Control the patrol state broadcasted to Discord and synchronized with voice channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'OFFLINE' as const, label: 'Offline / Standby', desc: 'No active session' },
              { id: 'VOTE_ACTIVE' as const, label: 'Vote Active', desc: 'SSU quorum voting' },
              { id: 'PATROL_LIVE' as const, label: 'Patrol Live', desc: 'Officers on duty' },
              { id: 'CONCLUDED' as const, label: 'Concluded', desc: 'Debrief / logs saved' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => handleStateChange(st.id)}
                className={`p-3 rounded-md text-left transition-colors border ${
                  sessionState === st.id
                    ? 'bg-white/[0.08] border-white/20 text-white font-medium'
                    : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="text-xs font-semibold">{st.label}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{st.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.04] text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-zinc-300">Vote Quorum Requirement:</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quorum}
                onChange={(e) => onChangeConfig({ sessionQuorumVotes: parseInt(e.target.value) || 8 })}
                className="h-8 w-20 font-mono text-xs bg-black/40 border-white/10 text-white"
              />
              <span className="text-[11px] text-zinc-400">votes required to launch patrol</span>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Auto-pings notification role once quorum threshold is reached.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Channel Synchronization */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-zinc-300" />
            <CardTitle className="text-sm font-semibold tracking-tight text-white">
              Voice Channel &amp; Role Synchronization
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Configure automated voice channels and role pings for active patrol sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Notification Ping Role</Label>
              <RoleSelect
                roles={resources.roles}
                value={config.notificationRoleId || ''}
                onChange={(val) => onChangeConfig({ notificationRoleId: val })}
                placeholder="Select Notification Role"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Authorized Host Role</Label>
              <RoleSelect
                roles={resources.roles}
                value={config.hostRoleId || ''}
                onChange={(val) => onChangeConfig({ hostRoleId: val })}
                placeholder="Select Host Staff Role"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">In-Game Voice Channel</Label>
              <ChannelSelect
                channels={resources.channels}
                value={config.ingameVcId || ''}
                onChange={(val) => onChangeConfig({ ingameVcId: val })}
                placeholder="Select In-Game VC"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Waiting Queue Voice Channel</Label>
              <ChannelSelect
                channels={resources.channels}
                value={config.queueVcId || ''}
                onChange={(val) => onChangeConfig({ queueVcId: val })}
                placeholder="Select Queue VC"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radio Frequency Voice Channel Sync */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold tracking-tight text-white">
                  Radio Frequency Patrol Voice Channels
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Dynamic frequency assignments. Automatically moves or routes on-duty officers between channels.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/[0.06]">
              <Label htmlFor="radio-autosync" className="text-xs text-zinc-300 cursor-pointer">
                Auto-Sync Officers
              </Label>
              <Switch
                id="radio-autosync"
                checked={config.radioAutoSync !== false}
                onCheckedChange={(checked) => onChangeConfig({ radioAutoSync: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Frequencies Table */}
          <div className="overflow-x-auto border border-white/[0.06] rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[11px] text-zinc-400">
                <tr>
                  <th className="px-3 py-2.5">Frequency</th>
                  <th className="px-3 py-2.5">Designation Title</th>
                  <th className="px-3 py-2.5">Mapped Discord VC</th>
                  <th className="px-3 py-2.5">Restricted Role (Optional)</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {frequencies.map((freq) => (
                  <tr key={freq.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2 font-mono font-semibold text-emerald-400">
                      {freq.frequency}
                    </td>
                    <td className="px-3 py-2 text-white font-medium">
                      {freq.name}
                    </td>
                    <td className="px-3 py-2 w-48">
                      <ChannelSelect
                        channels={resources.channels}
                        value={freq.channelId}
                        onChange={(val) => handleUpdateFrequency(freq.id, { channelId: val })}
                        placeholder="Map Voice Channel"
                      />
                    </td>
                    <td className="px-3 py-2 w-48">
                      <RoleSelect
                        roles={resources.roles}
                        value={freq.roleId || ''}
                        onChange={(val) => handleUpdateFrequency(freq.id, { roleId: val })}
                        placeholder="Any Duty Officer"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFrequency(freq.id)}
                        className="size-7 p-0 text-zinc-400 hover:text-rose-400 rounded-md"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Frequency Form */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Input
              placeholder="e.g. 142.85 MHz"
              value={newFreqNum}
              onChange={(e) => setNewFreqNum(e.target.value)}
              className="h-8 font-mono text-xs bg-black/40 border-white/10 text-white sm:w-44"
            />
            <Input
              placeholder="Channel Title (e.g. TAC 1 - Pursuit Primary)"
              value={newFreqName}
              onChange={(e) => setNewFreqName(e.target.value)}
              className="h-8 text-xs bg-black/40 border-white/10 text-white flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddFrequency}
              className="h-8 px-3 text-xs border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white shrink-0 rounded-md"
            >
              <Plus className="size-3.5 mr-1" />
              Add Frequency
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
