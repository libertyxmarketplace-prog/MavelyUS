import { useState } from 'react';
import {
  Ticket,
  Send,
  Sliders,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChannelSelect, RoleSelect } from '@/components/DiscordResourceSelectors';
import type { DiscordGuild, WorkspaceCustomizations, GuildResources, TicketCategoryConfig } from '@/types';

interface TicketsTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  resources: GuildResources;
  onChangeConfig: (updated: Partial<WorkspaceCustomizations>) => void;
  onDeployTicketPanel: (channelId: string) => void;
  deploying: boolean;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEFAULT_5_SLOTS: TicketCategoryConfig[] = [
  {
    id: 'general',
    name: 'General Support',
    description: 'Assistance with community rules, Discord roles, and server inquiries.',
    spawnCategoryId: '',
    pingRoleId: '',
    claimRoleId: '',
    initialInstructions: 'A staff member will be with you shortly. Please explain your question clearly.'
  },
  {
    id: 'high-rank',
    name: 'High Rank & Management',
    description: 'Private escalation to server leadership, department heads, and ownership.',
    spawnCategoryId: '',
    pingRoleId: '',
    claimRoleId: '',
    initialInstructions: 'This ticket is restricted to Management. Do not ping High Ranks repeatedly.'
  },
  {
    id: 'player-report',
    name: 'Player & Civilian Report',
    description: 'Report FRP, RDM, VDM, or server rule violations with video/screenshot evidence.',
    spawnCategoryId: '',
    pingRoleId: '',
    claimRoleId: '',
    initialInstructions: 'Provide the Roblox username of the accused player, timestamp, and video proof link.'
  },
  {
    id: 'appeals',
    name: 'Sanction & Ban Appeals',
    description: 'Submit an appeal for moderation warnings, strikes, kicks, or server bans.',
    spawnCategoryId: '',
    pingRoleId: '',
    claimRoleId: '',
    initialInstructions: 'Explain why your sanction should be reviewed or overturned. Honesty is required.'
  },
  {
    id: 'inquiries',
    name: 'Department Inquiries',
    description: 'Questions regarding LEO, SAFD, DOT, and dispatch agency recruitment.',
    spawnCategoryId: '',
    pingRoleId: '',
    claimRoleId: '',
    initialInstructions: 'Department supervisors will assist you. Check our handbook for standard requirements.'
  }
];

export function TicketsTab({
  guild: _guild,
  config,
  resources,
  onChangeConfig,
  onDeployTicketPanel,
  deploying,
  addToast
}: TicketsTabProps) {
  const categories: TicketCategoryConfig[] =
    config.ticketCategories && config.ticketCategories.length > 0
      ? config.ticketCategories
      : DEFAULT_5_SLOTS;

  const [deployChannelId, setDeployChannelId] = useState(
    config.transcriptsChannelId || config.ticketCategoryId || ''
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const activeCategory = categories[activeCategoryIndex] || categories[0];

  const handleUpdateCategory = (index: number, patch: Partial<TicketCategoryConfig>) => {
    const updated = categories.map((cat, i) => (i === index ? { ...cat, ...patch } : cat));
    onChangeConfig({ ticketCategories: updated });
  };

  const handleDeploy = () => {
    if (!deployChannelId) {
      addToast('warning', 'Select Channel', 'Please select a Discord destination channel for the ticket desk.');
      return;
    }
    onDeployTicketPanel(deployChannelId);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Ticket className="size-4 text-zinc-300" />
              5-Slot Support Ticket Engine
            </h2>
            <Badge className="bg-zinc-800 text-zinc-300 border-white/[0.08] text-[10px] font-mono">
              STAFF LOCK-ON-CLAIM
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Dedicated multi-category desk with automated role pings, category spawn isolation, and HTML transcript archiving.
          </p>
        </div>

        {/* Deploy Ticket Panel Action */}
        <div className="flex items-center gap-2">
          <div className="w-52">
            <ChannelSelect
              channels={resources.channels}
              value={deployChannelId}
              onChange={setDeployChannelId}
              placeholder="Deploy Channel (#tickets)"
            />
          </div>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying || !deployChannelId}
            className="h-9 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md shrink-0"
          >
            <Send className={`size-3.5 mr-1.5 ${deploying ? 'animate-spin' : ''}`} />
            Deploy to Discord
          </Button>
        </div>
      </div>

      {/* Global Lifecycle Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spawn Category */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Global Tickets Category</span>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <ChannelSelect
              channels={resources.channels}
              value={config.ticketCategoryId || ''}
              onChange={(val) => onChangeConfig({ ticketCategoryId: val })}
              placeholder="Select Category (Discord Parent ID)"
            />
            <p className="text-[11px] text-zinc-400">
              New ticket channels spawn under this Discord channel category by default.
            </p>
          </CardContent>
        </Card>

        {/* Transcripts Channel */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-mono uppercase text-zinc-400">HTML Transcripts Log</span>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <ChannelSelect
              channels={resources.channels}
              value={config.transcriptsChannelId || ''}
              onChange={(val) => onChangeConfig({ transcriptsChannelId: val })}
              placeholder="Select #transcripts channel"
            />
            <p className="text-[11px] text-zinc-400">
              Full HTML export with attachments and timestamps posted upon ticket closure.
            </p>
          </CardContent>
        </Card>

        {/* Support Staff Role */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Default Staff Ping Role</span>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <RoleSelect
              roles={resources.roles}
              value={config.ticketPingRoleId || ''}
              onChange={(val) => onChangeConfig({ ticketPingRoleId: val })}
              placeholder="Select Support Team Role"
            />
            <p className="text-[11px] text-zinc-400">
              Pinged automatically when a user opens any non-escalated support request.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5-Slot Ticket Engine Category Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 Slot Selector Tabs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono uppercase text-zinc-400 px-1">Configured Desk Slots (5/5)</div>
          <div className="space-y-1.5">
            {categories.slice(0, 5).map((cat, idx) => (
              <button
                key={cat.id || idx}
                onClick={() => setActiveCategoryIndex(idx)}
                className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors border ${
                  activeCategoryIndex === idx
                    ? 'bg-white/[0.08] border-white/20 text-white font-medium'
                    : 'bg-[#11141c] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                    <span className="font-mono text-zinc-500">#{idx + 1}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {cat.description || 'No description configured'}
                  </div>
                </div>
                <Badge className="bg-black/40 text-zinc-400 border-white/[0.06] text-[10px] font-mono shrink-0">
                  SLOT {idx + 1}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Slot Detail Editor */}
        <div className="lg:col-span-8">
          <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-zinc-300" />
                  <CardTitle className="text-sm font-semibold tracking-tight text-white">
                    Slot {activeCategoryIndex + 1} Parameters: {activeCategory?.name}
                  </CardTitle>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">
                  ID: {activeCategory?.id || 'slot'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Category Display Name</Label>
                  <Input
                    value={activeCategory?.name || ''}
                    onChange={(e) => handleUpdateCategory(activeCategoryIndex, { name: e.target.value })}
                    className="h-8 font-medium text-xs bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Category Description</Label>
                  <Input
                    value={activeCategory?.description || ''}
                    onChange={(e) => handleUpdateCategory(activeCategoryIndex, { description: e.target.value })}
                    className="h-8 text-xs bg-black/40 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Isolated Spawn Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Dedicated Spawn Category</Label>
                  <ChannelSelect
                    channels={resources.channels}
                    value={activeCategory?.spawnCategoryId || ''}
                    onChange={(val) => handleUpdateCategory(activeCategoryIndex, { spawnCategoryId: val })}
                    placeholder="Use Global Category"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Spawns under this Discord parent category.
                  </p>
                </div>

                {/* Specific Ping Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Slot Ping Role</Label>
                  <RoleSelect
                    roles={resources.roles}
                    value={activeCategory?.pingRoleId || ''}
                    onChange={(val) => handleUpdateCategory(activeCategoryIndex, { pingRoleId: val })}
                    placeholder="Use Global Staff"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Pinged exclusively when this slot is created.
                  </p>
                </div>

                {/* Specific Claim Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Restricted Claim Role</Label>
                  <RoleSelect
                    roles={resources.roles}
                    value={activeCategory?.claimRoleId || ''}
                    onChange={(val) => handleUpdateCategory(activeCategoryIndex, { claimRoleId: val })}
                    placeholder="Any Staff Role"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Only members with this role can claim the ticket.
                  </p>
                </div>
              </div>

              {/* Custom Initial Embed Instructions */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs text-zinc-300">Initial Greeting &amp; Guidance Instructions</Label>
                <Textarea
                  rows={3}
                  value={activeCategory?.initialInstructions || ''}
                  onChange={(e) => handleUpdateCategory(activeCategoryIndex, { initialInstructions: e.target.value })}
                  placeholder="Explain required proof, formats, and behavior guidelines..."
                  className="text-xs bg-black/40 border-white/10 text-white resize-none font-mono"
                />
                <p className="text-[11px] text-zinc-400">
                  Rendered in the initial embed inside the ticket channel when the user opens this slot.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Discord Live Embed Preview */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-zinc-300" />
            <CardTitle className="text-sm font-semibold tracking-tight text-white">
              Live Discord Embed Preview
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Real-time rendering of the ticket desk message as viewed by server members in Discord.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-xl mx-auto rounded-md bg-[#2b2d31] p-4 text-white shadow-2xl border-l-4 border-l-emerald-500 font-sans space-y-3">
            <div className="text-[11px] text-zinc-400 font-medium">
              Mavely Operations - Support Desk
            </div>
            <div className="text-base font-bold text-white">
              {config.panelTitle || 'Community Support & Escalation Desk'}
            </div>
            <div className="text-xs text-zinc-300 leading-relaxed">
              {config.panelDescription ||
                'Select the appropriate department below to open a private ticket with our staff team. Please have relevant screenshots or Roblox usernames ready.'}
            </div>

            {/* Simulated Buttons */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.slice(0, 5).map((cat, idx) => (
                <button
                  key={cat.id || idx}
                  type="button"
                  className="px-3 py-2 rounded-md bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold text-center truncate transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ticket className="size-3 shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
