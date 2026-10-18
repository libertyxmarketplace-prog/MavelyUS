import { useState } from 'react';
import { Send, Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { sendDiscordEmbed } from '@/lib/api';

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface DiskHookEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  authorName?: string;
  authorIcon?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIcon?: string;
  includeTimestamp?: boolean;
  fields: EmbedField[];
}

export interface DiskHookBuilderProps {
  guildId: string;
  channels: Array<{ id: string; name: string; type: string | number }>;
  defaultChannelId?: string;
  onSavedToConfig?: (channelId: string, bannerUrl?: string) => void;
}

const PRESET_COLORS = [
  { name: 'Mavely Mint', hex: '#2ecc71' },
  { name: 'Discord Blurple', hex: '#5865f2' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Amber Alert', hex: '#f59e0b' },
  { name: 'Enforcement Red', hex: '#ef4444' },
  { name: 'Slate Dark', hex: '#2b2d31' },
];

const TEMPLATES: Record<string, Partial<DiskHookEmbed>> = {
  handbook: {
    title: '📘 Emergency Response: Liberty County Staff Handbook',
    description: 'Welcome to the official staff protocols and procedural guidelines. All duty staff are required to review this document and adhere to our server code of conduct at all times.',
    color: '#2ecc71',
    authorName: 'Department Command & Operations',
    authorIcon: '/mavely-mark.png',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    footerText: 'Mavely Operations Suite • Staff Handbook',
    includeTimestamp: true,
    fields: [
      { name: '1. Professional Demeanor', value: 'Treat all citizens, suspects, and fellow first responders with mutual respect at all times.', inline: true },
      { name: '2. Priority Calls', value: 'Respond promptly to panic buttons, 911 dispatch, and tactical VC prompts.', inline: true },
      { name: '3. Radio Protocol', value: 'Use standardized 10-codes on duty and keep radio frequencies clear of unnecessary chatter.', inline: false },
      { name: '4. Chain of Command', value: 'Escalate severe disputes or administrative infractions to Shift Supervisors.', inline: true },
      { name: '5. Activity Minimums', value: 'Maintain at least 100 messages and 2 patrol shift hours weekly to remain in good standing.', inline: true }
    ]
  },
  pursuit: {
    title: '🚨 High-Speed Pursuit & PIT Maneuver Guidelines',
    description: 'Mandatory standard operating procedures for peace officers engaging in high-speed vehicular pursuits within Liberty County.',
    color: '#06b6d4',
    authorName: 'State Patrol & Traffic Division',
    authorIcon: '/mavely-mark.png',
    imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80',
    footerText: 'Tactical Vehicle Interception Policy',
    includeTimestamp: true,
    fields: [
      { name: 'Pursuit Vehicle Limit', value: 'Maximum 3 law enforcement vehicles permitted behind the primary suspect unless authorized.', inline: true },
      { name: 'PIT Maneuver Authorization', value: 'Permitted only below 65 MPH and outside high-density pedestrian areas.', inline: true },
      { name: 'Air Support & Spikes', value: 'Spike strips must be deployed with a minimum 15-second clear advance radio callout.', inline: false },
      { name: 'Termination Criteria', value: 'Pursuits must be terminated if civilian risk outweighs apprehension benefit.', inline: false }
    ]
  },
  strikes: {
    title: '⚖️ Staff Moderation Matrix & Strike Escalation Policy',
    description: 'Official disciplinary consequences for staff policy violations and inactivity.',
    color: '#ef4444',
    authorName: 'Internal Affairs & Moderation Board',
    authorIcon: '/mavely-mark.png',
    footerText: 'Disciplinary Matrix • Strictly Enforced',
    includeTimestamp: true,
    fields: [
      { name: 'Strike 1 (Verbal Notice)', value: 'Minor FailRP or radio misuse. Recorded in private staff logs.', inline: true },
      { name: 'Strike 2 (Role Suspension)', value: '7-day suspension from server moderation duties and shift hosting.', inline: true },
      { name: 'Strike 3 (Demotion / Removal)', value: 'Immediate automatic demotion to prior rank or complete staff team removal.', inline: false }
    ]
  },
  modcall: {
    title: '🛡️ In-Game Moderator Call Protocol (FailRP & RDM)',
    description: 'Procedures for investigating player reports, reviewing clipping proofs, and issuing server actions.',
    color: '#f59e0b',
    authorName: 'Server Administration Team',
    authorIcon: '/mavely-mark.png',
    footerText: 'In-Game Support Protocol',
    includeTimestamp: true,
    fields: [
      { name: 'Teleport Protocol', value: 'Always complete ongoing roleplays before bringing reported suspects to a staff sit.', inline: true },
      { name: 'Evidence Requirement', value: 'No permanent punishment may be issued without clear video or transcript evidence.', inline: true },
      { name: 'New Life Rule (NLR)', value: 'Players killed must not return to the same RP scene or remember events for 15 minutes.', inline: false }
    ]
  },
  loa: {
    title: '⏳ Staff Leave of Absence (LOA) Protocol',
    description: 'Guidelines on submitting temporary leave, role suspension, and return deadlines.',
    color: '#8b5cf6',
    authorName: 'Human Resources & Moderation Lineage',
    authorIcon: '/mavely-mark.png',
    footerText: 'Automated LOA Manager',
    includeTimestamp: true,
    fields: [
      { name: 'Maximum Duration', value: '14 consecutive days without High Command review.', inline: true },
      { name: 'How to Submit', value: 'Use `/loa request` in Discord with your start and return dates.', inline: true },
      { name: 'Activity Exemption', value: 'Approved LOA exempts staff from weekly message and shift quotas.', inline: false }
    ]
  }
};

export function DiskHookBuilder({
  guildId,
  channels,
  defaultChannelId,
  onSavedToConfig
}: DiskHookBuilderProps) {
  const [targetType, setTargetType] = useState<'channel' | 'webhook'>('channel');
  const [targetChannelId, setTargetChannelId] = useState(defaultChannelId || (channels[0]?.id || ''));
  const [webhookUrl, setWebhookUrl] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const [embed, setEmbed] = useState<DiskHookEmbed>({
    title: '📘 ER:LC Community Staff Handbook & Protocols',
    description: 'Welcome to our server documentation hub. Read the procedural guidelines below before reporting on-duty.',
    url: '',
    color: '#2ecc71',
    authorName: 'Staff Administration Command',
    authorIcon: '/mavely-mark.png',
    authorUrl: '',
    thumbnailUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    footerText: 'Mavely Staff Hub • Official Guidelines',
    footerIcon: '/mavely-mark.png',
    includeTimestamp: true,
    fields: [
      { name: '10-Code Standards', value: '10-4 (Ack), 10-7 (Out of Service), 10-8 (In Service), 10-99 (Officer in Distress).', inline: true },
      { name: 'Radio Discipline', value: 'Keep voice channels free of background chatter during priority pursuits.', inline: true },
    ]
  });

  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddField = () => {
    setEmbed(prev => ({
      ...prev,
      fields: [...prev.fields, { name: 'New Field', value: 'Field description or protocol instructions.', inline: true }]
    }));
  };

  const handleUpdateField = (index: number, updates: Partial<EmbedField>) => {
    setEmbed(prev => {
      const next = [...prev.fields];
      next[index] = { ...next[index], ...updates };
      return { ...prev, fields: next };
    });
  };

  const handleRemoveField = (index: number) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleLoadTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (t) {
      setEmbed(prev => ({ ...prev, ...t }));
      setStatusMessage({ type: 'success', text: `Loaded "${t.title?.slice(0, 30)}..." template!` });
    }
  };

  const handleSendToDiscord = async () => {
    setSending(true);
    setStatusMessage(null);
    try {
      const payloadEmbed: any = {
        title: embed.title || undefined,
        description: embed.description || undefined,
        url: embed.url || undefined,
        color: embed.color ? parseInt(embed.color.replace('#', ''), 16) : undefined,
        timestamp: embed.includeTimestamp ? new Date().toISOString() : undefined,
      };

      if (embed.authorName) {
        payloadEmbed.author = {
          name: embed.authorName,
          icon_url: embed.authorIcon || undefined,
          url: embed.authorUrl || undefined
        };
      }

      if (embed.thumbnailUrl) {
        payloadEmbed.thumbnail = { url: embed.thumbnailUrl };
      }

      if (embed.imageUrl) {
        payloadEmbed.image = { url: embed.imageUrl };
      }

      if (embed.footerText) {
        payloadEmbed.footer = {
          text: embed.footerText,
          icon_url: embed.footerIcon || undefined
        };
      }

      if (embed.fields.length > 0) {
        payloadEmbed.fields = embed.fields.map(f => ({
          name: f.name,
          value: f.value,
          inline: Boolean(f.inline)
        }));
      }

      const res = await sendDiscordEmbed(guildId, {
        channelId: targetType === 'channel' ? targetChannelId : undefined,
        webhookUrl: targetType === 'webhook' ? webhookUrl : undefined,
        embed: payloadEmbed,
        content: messageContent || undefined
      });

      setStatusMessage({ type: 'success', text: res.message || 'Embed dispatched to Discord successfully!' });

      if (onSavedToConfig && targetChannelId) {
        onSavedToConfig(targetChannelId, embed.imageUrl);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send embed to Discord.' });
    } finally {
      setSending(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(embed, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Templates */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.08] bg-[#12141c]/90">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/20 text-[10px]">
              DiskHook Studio
            </Badge>
            <h3 className="text-base font-bold text-white font-display">Staff Documentation &amp; Embed Builder</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Build pixel-perfect Discord handbook embeds, deploy via webhooks or bot channels, and attach banners with live preview.
          </p>
        </div>

        {/* Quick Templates */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Templates:</span>
          <button
            type="button"
            onClick={() => handleLoadTemplate('handbook')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            Handbook
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('pursuit')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            Pursuits
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('strikes')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            Strikes &amp; Demotion
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('modcall')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            Mod Calls
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('loa')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            LOA Rules
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* 2-Column Split: Form Editor (Left) & Live Discord Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Input Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Dispatch Destination */}
          <Card className="p-5 rounded-2xl border-white/[0.08] bg-[#12141c]/90 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">1. Destination</h4>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTargetType('channel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  targetType === 'channel'
                    ? 'bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/40'
                    : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                Discord Channel
              </button>
              <button
                type="button"
                onClick={() => setTargetType('webhook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  targetType === 'webhook'
                    ? 'bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/40'
                    : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                Discord Webhook URL
              </button>
            </div>

            {targetType === 'channel' ? (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Select Target Channel</Label>
                <select
                  value={targetChannelId}
                  onChange={(e) => setTargetChannelId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white focus:outline-none focus:border-white/25"
                >
                  {channels.length > 0 ? (
                    channels.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#181a24] text-white">
                        #{c.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled className="bg-[#181a24] text-zinc-500">
                      No channels synced yet (ensure bot is in server)
                    </option>
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Discord Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="h-10 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Message Content (Optional text above embed)</Label>
              <Input
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="@everyone @here Staff Protocol Deployment"
                className="h-10 text-xs bg-white/[0.04] border-white/10 text-white"
              />
            </div>
          </Card>

          {/* Embed Author & Colors */}
          <Card className="p-5 rounded-2xl border-white/[0.08] bg-[#12141c]/90 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">2. Author &amp; Theme Color</h4>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Accent Border Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setEmbed(prev => ({ ...prev, color: c.hex }))}
                    className={`size-6 rounded-full border-2 transition-transform ${
                      embed.color === c.hex ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <Input
                  value={embed.color}
                  onChange={(e) => setEmbed(prev => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-24 text-xs font-mono bg-white/[0.04] border-white/10 ml-2 text-white"
                  placeholder="#2ecc71"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Author Name</Label>
                <Input
                  value={embed.authorName}
                  onChange={(e) => setEmbed(prev => ({ ...prev, authorName: e.target.value }))}
                  placeholder="Staff Command"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Author Icon URL</Label>
                <Input
                  value={embed.authorIcon}
                  onChange={(e) => setEmbed(prev => ({ ...prev, authorIcon: e.target.value }))}
                  placeholder="https://.../icon.png"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
            </div>
          </Card>

          {/* Embed Content */}
          <Card className="p-5 rounded-2xl border-white/[0.08] bg-[#12141c]/90 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">3. Title &amp; Description</h4>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Embed Title</Label>
              <Input
                value={embed.title}
                onChange={(e) => setEmbed(prev => ({ ...prev, title: e.target.value }))}
                placeholder="📘 Official Server Handbook"
                className="h-10 text-xs bg-white/[0.04] border-white/10 text-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Description (Supports Discord Markdown)</Label>
              <Textarea
                rows={4}
                value={embed.description}
                onChange={(e) => setEmbed(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Write your handbook rules and operational procedures here..."
                className="text-xs bg-white/[0.04] border-white/10 text-white resize-y font-mono leading-relaxed"
              />
            </div>

            {/* Media URLs: Banner & Thumbnail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Banner Image URL (Large bottom image)</Label>
                <Input
                  value={embed.imageUrl}
                  onChange={(e) => setEmbed(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://.../banner.png"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Thumbnail URL (Corner image)</Label>
                <Input
                  value={embed.thumbnailUrl}
                  onChange={(e) => setEmbed(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://.../thumbnail.png"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
            </div>
          </Card>

          {/* Embed Fields (DiskHook interactive field builder) */}
          <Card className="p-5 rounded-2xl border-white/[0.08] bg-[#12141c]/90 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                4. Fields ({embed.fields.length})
              </h4>
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-[#2ecc71]/15 text-[#2ecc71] hover:bg-[#2ecc71]/25 border border-[#2ecc71]/30 transition-colors font-semibold"
              >
                <Plus className="size-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3">
              {embed.fields.map((field, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-white/[0.06] bg-black/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={field.name}
                      onChange={(e) => handleUpdateField(idx, { name: e.target.value })}
                      placeholder="Field Name"
                      className="h-8 text-xs font-semibold bg-white/[0.04] border-white/10 text-white"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.inline}
                          onChange={(e) => handleUpdateField(idx, { inline: e.target.checked })}
                          className="rounded border-white/20 bg-black/40 text-[#2ecc71] focus:ring-0"
                        />
                        <span>Inline</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    rows={2}
                    value={field.value}
                    onChange={(e) => handleUpdateField(idx, { value: e.target.value })}
                    placeholder="Field Value / Guidelines"
                    className="text-xs bg-white/[0.04] border-white/10 text-white resize-y leading-relaxed font-mono"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Footer & Timestamp */}
          <Card className="p-5 rounded-2xl border-white/[0.08] bg-[#12141c]/90 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">5. Footer &amp; Time</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Footer Text</Label>
                <Input
                  value={embed.footerText}
                  onChange={(e) => setEmbed(prev => ({ ...prev, footerText: e.target.value }))}
                  placeholder="Official Handbook"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Footer Icon URL</Label>
                <Input
                  value={embed.footerIcon}
                  onChange={(e) => setEmbed(prev => ({ ...prev, footerIcon: e.target.value }))}
                  placeholder="https://.../icon.png"
                  className="h-9 text-xs bg-white/[0.04] border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-300">Include Current Timestamp</span>
              <Switch
                checked={embed.includeTimestamp}
                onCheckedChange={(checked) => setEmbed(prev => ({ ...prev, includeTimestamp: checked }))}
              />
            </div>
          </Card>

          {/* Dispatch Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSendToDiscord}
              disabled={sending}
              className="flex-1 h-12 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] hover:opacity-95 text-black font-bold text-sm rounded-xl shadow-lg shadow-[#2ecc71]/15"
            >
              <Send className="size-4 mr-2" />
              <span>{sending ? 'Dispatching Embed...' : 'Send Embed to Discord'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyJson}
              className="h-12 px-4 rounded-xl border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs"
            >
              {copied ? <Check className="size-4 text-emerald-400 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Live Discord Client Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Discord Preview</span>
            <span className="text-[10px] text-zinc-500 font-mono">Dark Mode v10</span>
          </div>

          {/* Discord Mock Message Window */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#313338] p-4 text-white shadow-2xl font-sans text-left space-y-2 select-none">
            {/* Discord Message Header: Avatar + Bot Username + Timestamp */}
            <div className="flex items-center gap-3">
              <img src="/mavely-mark.png" alt="Bot" className="size-10 rounded-full bg-[#1e1f22] p-1 object-contain" />
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
                  Mavely
                </span>
                <span className="rounded bg-[#5865F2] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  APP
                </span>
                <span className="text-[11px] text-[#949ba4] font-normal ml-1">
                  Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Optional message content */}
            {messageContent && (
              <p className="text-xs text-[#dbdee1] pl-13 pb-1 leading-snug">
                {messageContent}
              </p>
            )}

            {/* Embed Card Container */}
            <div className="ml-13 relative rounded-lg bg-[#2b2d31] p-4 border-l-4 space-y-3 max-w-md shadow-md"
              style={{ borderLeftColor: embed.color || '#2ecc71' }}>
              
              {/* Top Row: Author & Thumbnail */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {embed.authorName && (
                    <div className="flex items-center gap-2">
                      {embed.authorIcon && (
                        <img src={embed.authorIcon} alt="" className="size-4 rounded-full object-cover" />
                      )}
                      <span className="text-xs font-semibold text-white/90">
                        {embed.authorName}
                      </span>
                    </div>
                  )}

                  {embed.title && (
                    <h5 className="font-bold text-sm text-[#00a8fc] hover:underline cursor-pointer">
                      {embed.title}
                    </h5>
                  )}
                </div>

                {embed.thumbnailUrl && (
                  <img src={embed.thumbnailUrl} alt="" className="size-14 rounded-lg object-cover shrink-0 bg-black/20" />
                )}
              </div>

              {/* Description */}
              {embed.description && (
                <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap font-normal">
                  {embed.description}
                </p>
              )}

              {/* Dynamic Fields Grid */}
              {embed.fields.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {embed.fields.map((f, i) => (
                    <div key={i} className={f.inline ? 'col-span-1 space-y-0.5' : 'col-span-2 space-y-0.5'}>
                      <span className="text-[11px] font-bold text-white block">
                        {f.name}
                      </span>
                      <span className="text-xs text-[#dbdee1] block leading-snug">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Large Bottom Image / Banner */}
              {embed.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-white/5 bg-black/30 mt-2">
                  <img src={embed.imageUrl} alt="Embed Banner" className="w-full max-h-56 object-cover" />
                </div>
              )}

              {/* Footer & Timestamp */}
              {(embed.footerText || embed.includeTimestamp) && (
                <div className="flex items-center gap-1.5 pt-2 text-[10px] text-[#949ba4] font-medium border-t border-white/[0.04]">
                  {embed.footerIcon && (
                    <img src={embed.footerIcon} alt="" className="size-3.5 rounded-full object-cover" />
                  )}
                  {embed.footerText && <span>{embed.footerText}</span>}
                  {embed.footerText && embed.includeTimestamp && <span>•</span>}
                  {embed.includeTimestamp && <span>Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.06] bg-black/20 text-xs text-zinc-400 text-center">
            💡 Changes in the editor reflect live in the preview. Click <strong className="text-white">Send Embed</strong> to dispatch directly to Discord!
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiskHookBuilder;
