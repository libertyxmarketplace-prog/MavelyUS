import React, { useState } from 'react';
import {
  Rocket,
  ShieldCheck,
  ExternalLink,
  Plus,
  X,
  Eye,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  ShieldAlert,
  Sparkles,
  Upload,
  Clock,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { DiscordGuild, WorkspaceCustomizations } from '@/types';

interface PromoteTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  onChangeConfig: (updates: Partial<WorkspaceCustomizations>) => void;
  onSaveConfig: () => Promise<void>;
  onNavigateTab?: (tab: string) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

// Strictly ordered user-specified categories
const CATEGORIES = [
  'Design Server',
  'Roleplay Server',
  'Misc',
  'Bots',
  'Departments',
  'Events'
];

export function PromoteTab({
  guild,
  config,
  onChangeConfig,
  onSaveConfig,
  onNavigateTab,
  addToast
}: PromoteTabProps) {
  const guildId = guild?.id || '1530147023754367006';
  const serverName = guild?.name || config.serverName || 'Community Server';
  const serverIconUrl = guild?.iconUrl || (guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null) || config.serverIconUrl;

  const [description, setDescription] = useState(config.serverDescription || '');

  const [inviteUrl, setInviteUrl] = useState(config.inviteUrl || '');
  const [joinCode, setJoinCode] = useState(config.joinCode || '');
  const [bannerUrl, setBannerUrl] = useState(config.serverBannerUrl || config.bannerUrl || '');
  const [selectedCategory, setSelectedCategory] = useState(config.serverCategory || 'Design Server');

  const [tags, setTags] = useState<string[]>(() => {
    if (config.serverTags) {
      return config.serverTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    }
    return ['roleplay', 'design', 'community'];
  });
  const [newTagInput, setNewTagInput] = useState('');

  // Anti-Raid Security modal state
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [minAge, setMinAge] = useState(config.j4jMinAccountAgeDays !== undefined ? config.j4jMinAccountAgeDays > 0 : true);
  const [requireAvatar, setRequireAvatar] = useState(config.j4jRequireAvatar !== false);
  const [blockChurn, setBlockChurn] = useState(config.j4jBlockChurn !== false);

  const [saving, setSaving] = useState(false);

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      if (tags.length >= 6) {
        addToast('warning', 'Limit Reached', 'You can add up to 6 community tags.');
        return;
      }
      const updated = [...tags, clean];
      setTags(updated);
      onChangeConfig({ serverTags: updated.join(', ') });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    onChangeConfig({ serverTags: updated.join(', ') });
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      onChangeConfig({
        serverDescription: description,
        inviteUrl: inviteUrl.trim(),
        joinCode: joinCode.trim(),
        serverBannerUrl: bannerUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        serverCategory: selectedCategory,
        serverTags: tags.join(', '),
        j4jMinAccountAgeDays: minAge ? 7 : 0,
        j4jRequireAvatar: requireAvatar,
        j4jBlockChurn: blockChurn
      });
      await onSaveConfig();

      // Sync into local directory so Earn Credits tab auto-updates immediately
      try {
        const existingRaw = localStorage.getItem('erlcus_promoted_servers');
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const index = existingList.findIndex((s: any) => s.id === guildId);
        const myPromotedServer = {
          id: guildId,
          name: serverName,
          icon: serverIconUrl,
          category: selectedCategory,
          categories: [selectedCategory],
          language: 'English',
          description: description.trim(),
          tags: tags,
          rewardCoins: config.coinsPerJoin || 2,
          inviteUrl: inviteUrl.trim(),
          bannerUrl: bannerUrl.trim(),
          memberCount: Number((guild as any)?.memberCount || (guild as any)?.approximateMemberCount || 0),
          createdAt: Date.now()
        };
        if (index >= 0) {
          existingList[index] = { ...existingList[index], ...myPromotedServer };
        } else {
          existingList.unshift(myPromotedServer);
        }
        localStorage.setItem('erlcus_promoted_servers', JSON.stringify(existingList));
        window.dispatchEvent(new Event('erlcus_promotions_updated'));
      } catch (e) {
        console.warn('Could not sync local directory:', e);
      }

      addToast('success', 'Published', 'Your server promotion details have been saved.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save promotion settings.');
    } finally {
      setSaving(false);
    }
  };

  // ONLY show a banner preview if explicitly provided by the user
  const hasUserBanner = Boolean(bannerUrl.trim());

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-200 pb-12">
      {/* ── TOP ACTION BAR (Clean & Flush) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Promote Server
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Customize your public listing, invite link, and categories.
          </p>
        </div>

        {/* Action Buttons: Anti-Raid Security + Save & Publish */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSecurityModalOpen(true)}
            className="text-xs border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 h-9 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Anti-Raid Defense</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {[minAge, requireAvatar, blockChurn].filter(Boolean).length}/3 Active
            </span>
          </Button>

          {onNavigateTab && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigateTab('details')}
              className="text-xs border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="size-3.5 text-zinc-400" />
              <span>Details Page</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <Rocket className="size-3.5" />
            <span>{saving ? 'Publishing…' : 'Save & Publish'}</span>
          </Button>
        </div>
      </div>

      {/* ── MAIN FLUSH GRID (No Bulky Background Rectangles) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) - Completely flush, no heavy nested cards */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Community Links & Banner */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="size-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Community Links & Banner</h3>
            </div>

            <div className="space-y-4 pt-1">
              {/* Discord Invite URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Discord Invite Link <span className="text-rose-400">*</span>
                  </label>
                  {inviteUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Test link</span>
                      <ExternalLink className="size-2.5" />
                    </button>
                  )}
                </div>
                <Input
                  value={inviteUrl}
                  onChange={(e) => {
                    setInviteUrl(e.target.value);
                    onChangeConfig({ inviteUrl: e.target.value });
                  }}
                  placeholder="https://discord.gg/your-invite"
                  className="text-xs bg-white/[0.04] border-white/10 font-mono text-white h-9 rounded-xl focus:border-emerald-500/60"
                />
              </div>

              {/* ER:LC Server Join Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    ER:LC Server Join Code <span className="text-zinc-500 font-normal">(Optional in-game code)</span>
                  </label>
                </div>
                <Input
                  value={joinCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setJoinCode(val);
                    onChangeConfig({ joinCode: val });
                  }}
                  placeholder="e.g. LCSP, PATROL-1, or private server code"
                  className="text-xs bg-white/[0.04] border-white/10 font-mono text-white h-9 rounded-xl focus:border-emerald-500/60 uppercase"
                />
                <span className="text-[11px] text-zinc-500 block">
                  Players can copy your ER:LC code directly from Server Details to connect in-game.
                </span>
              </div>

              {/* Server Banner (URL or Image Upload) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Custom Banner <span className="text-zinc-500 font-normal">(Optional upload or image URL)</span>
                  </label>
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl('');
                        onChangeConfig({ serverBannerUrl: '', bannerUrl: '' });
                      }}
                      className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      Remove banner
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={bannerUrl.startsWith('data:') ? 'Custom image uploaded' : bannerUrl}
                    onChange={(e) => {
                      setBannerUrl(e.target.value);
                      onChangeConfig({ serverBannerUrl: e.target.value, bannerUrl: e.target.value });
                    }}
                    placeholder="https://example.com/banner.png or click upload"
                    className="text-xs bg-white/[0.04] border-white/10 font-mono text-white h-9 rounded-xl focus:border-emerald-500/60 flex-1"
                  />
                  <input
                    type="file"
                    id="promote-banner-file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) {
                          setBannerUrl(res);
                          onChangeConfig({ serverBannerUrl: res, bannerUrl: res });
                          addToast('success', 'Banner Uploaded', 'Custom image loaded into directory preview.');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="promote-banner-file"
                    className="h-9 px-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Upload className="size-3.5 text-zinc-400" />
                    <span>Upload</span>
                  </label>
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  PNG, JPG or WebP recommended (1200x400). Leave blank if you don't want a banner.
                </span>
              </div>

              {/* Primary Category (Strictly ordered per user prompt) */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  Primary Community Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        onChangeConfig({ serverCategory: cat });
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                        selectedCategory === cat
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold shadow-sm'
                          : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Section 2: Server Description & Discovery Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Server Description & Tags</h3>
            </div>

            <div className="space-y-4 pt-1">
              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-zinc-300">Public Description</label>
                  <span className="text-[11px] text-zinc-500 font-mono">{description.length}/400</span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  maxLength={400}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    onChangeConfig({ serverDescription: e.target.value });
                  }}
                  className="w-full text-xs text-white bg-white/[0.04] border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-500/60 leading-relaxed font-sans"
                  placeholder="Tell users what makes your community unique..."
                />
              </div>

              {/* Tag Chips */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  Tags (Max 6)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-mono"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}

                  {tags.length < 6 && (
                    <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Add tag..."
                        className="h-8 text-xs bg-white/[0.03] border-white/10 text-white w-28 rounded-xl font-mono focus:border-emerald-500/60"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs bg-white/10 hover:bg-white/15 text-white rounded-xl cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Directory Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="space-y-3">
            <span className="text-xs font-mono font-semibold text-zinc-400 tracking-wider uppercase block">
              LIVE DIRECTORY PREVIEW
            </span>

            {/* Clean Discord Server Card - NO UNWANTED BANNER! */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
              {/* ONLY render banner if explicitly provided by user */}
              {hasUserBanner && (
                <div className="relative h-28 w-full overflow-hidden bg-zinc-900 border-b border-white/10">
                  <img
                    src={bannerUrl}
                    alt="Server Banner"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] to-transparent" />
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  {serverIconUrl ? (
                    <img
                      src={serverIconUrl}
                      alt={serverName}
                      className="size-12 rounded-xl object-cover border border-white/15 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="size-12 rounded-xl bg-[#313338] flex items-center justify-center font-bold text-white text-base border border-white/15 shrink-0 shadow-md">
                      {serverName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{serverName}</h4>
                    <span className="text-xs text-emerald-400 font-medium">{selectedCategory}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans line-clamp-3">
                  {description || 'No description provided yet.'}
                </p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] text-zinc-400 border border-white/5">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono">ERLC.US Server Directory</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (inviteUrl.trim()) {
                        window.open(inviteUrl.trim(), '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="h-8 px-4 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Join Server
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADVANCED ANTI-RAID & CHURN SECURITY MODAL ── */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c0e17] p-6 shadow-2xl space-y-5 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Anti-Raid & Churn Defense
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Gateway Shield
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Autonomous filtering rules to safeguard your bounty treasury from farm bots and raid swarms.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="size-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Live Threat Gauge Bar */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-200">Active Defense Shield Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {[minAge, requireAvatar, blockChurn].filter(Boolean).length}/3 Modules Active
                  </span>
                  {[minAge, requireAvatar, blockChurn].filter(Boolean).length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinAge(true);
                        setRequireAvatar(true);
                        setBlockChurn(true);
                        onChangeConfig({
                          j4jMinAccountAgeDays: 7,
                          j4jRequireAvatar: true,
                          j4jBlockChurn: true
                        });
                        try {
                          localStorage.setItem(`erlcus_antiraid_minage_${guildId}`, 'true');
                          localStorage.setItem(`erlcus_antiraid_avatar_${guildId}`, 'true');
                          localStorage.setItem(`erlcus_antiraid_churn_${guildId}`, 'true');
                        } catch {}
                      }}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline cursor-pointer ml-1"
                    >
                      Enable All
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented Defense Bar */}
              <div className="grid grid-cols-3 gap-1.5 h-2">
                <div className={`rounded-full transition-colors ${minAge ? 'bg-emerald-500' : 'bg-white/10'}`} />
                <div className={`rounded-full transition-colors ${requireAvatar ? 'bg-emerald-500' : 'bg-white/10'}`} />
                <div className={`rounded-full transition-colors ${blockChurn ? 'bg-emerald-500' : 'bg-white/10'}`} />
              </div>

              <p className="text-[11px] text-zinc-400">
                {[minAge, requireAvatar, blockChurn].filter(Boolean).length === 3
                  ? 'Maximum protection engaged. All suspicious join events and alt accounts will be rejected.'
                  : [minAge, requireAvatar, blockChurn].filter(Boolean).length === 2
                  ? 'High protection active. Turn on the remaining filter for full automated coverage.'
                  : [minAge, requireAvatar, blockChurn].filter(Boolean).length === 1
                  ? 'Basic shield active. Enable avatar and age verification to prevent bot raids.'
                  : 'Shields offline. Your community is open to all accounts without verification.'}
              </p>
            </div>

            {/* Defense Modules Cards */}
            <div className="space-y-2.5">
              {/* Rule 1: Account Age */}
              <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                minAge ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-white/5 bg-white/[0.02]'
              }`}>
                <div className="flex items-start gap-3 pr-4">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    minAge ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-400 border border-white/5'
                  }`}>
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">7+ Day Account Age Minimum</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                        minAge ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-white/5'
                      }`}>
                        {minAge ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      Instantly blocks newly registered throwaway Discord accounts from claiming bounties.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={minAge}
                  onCheckedChange={(c) => {
                    setMinAge(c);
                    onChangeConfig({ j4jMinAccountAgeDays: c ? 7 : 0 });
                    try {
                      localStorage.setItem(`erlcus_antiraid_minage_${guildId}`, c ? 'true' : 'false');
                    } catch {}
                  }}
                />
              </div>

              {/* Rule 2: Custom Avatar */}
              <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                requireAvatar ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-white/5 bg-white/[0.02]'
              }`}>
                <div className="flex items-start gap-3 pr-4">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    requireAvatar ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-400 border border-white/5'
                  }`}>
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Custom Avatar Verification</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                        requireAvatar ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-white/5'
                      }`}>
                        {requireAvatar ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      Rejects default Discord avatars to filter out automated headless script armies.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={requireAvatar}
                  onCheckedChange={(c) => {
                    setRequireAvatar(c);
                    onChangeConfig({ j4jRequireAvatar: c });
                    try {
                      localStorage.setItem(`erlcus_antiraid_avatar_${guildId}`, c ? 'true' : 'false');
                    } catch {}
                  }}
                />
              </div>

              {/* Rule 3: Anti-Churn */}
              <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                blockChurn ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-white/5 bg-white/[0.02]'
              }`}>
                <div className="flex items-start gap-3 pr-4">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    blockChurn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-400 border border-white/5'
                  }`}>
                    <RotateCcw className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">72-Hour Anti-Churn Retention</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                        blockChurn ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-white/5'
                      }`}>
                        {blockChurn ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      Auto-revokes earned bounty credits if a user leaves your server within 72 hours of joining.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={blockChurn}
                  onCheckedChange={(c) => {
                    setBlockChurn(c);
                    onChangeConfig({ j4jBlockChurn: c });
                    try {
                      localStorage.setItem(`erlcus_antiraid_churn_${guildId}`, c ? 'true' : 'false');
                    } catch {}
                  }}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Rules apply to every directory join
              </span>
              <Button
                type="button"
                onClick={() => {
                  setSecurityModalOpen(false);
                  addToast('success', 'Shield Rules Updated', 'Anti-Raid and Churn defense configurations applied.');
                }}
                className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
              >
                Apply Defense Rules
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoteTab;
