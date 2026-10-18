import { useState } from 'react';
import {
  ExternalLink,
  Layers,
  Check,
  Tag,
  ShieldCheck,
  Eye,
  Rocket,
  X,
  Plus,
  Globe,
  Lock,
  Bot,
  UserCheck,
  Flame,
  ShieldAlert,
  Users,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsyncButton } from '@/components/ui/async-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Select, {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/indevui-select';
import type { DiscordGuild, WorkspaceCustomizations } from '@/types';
import type { PromotedServer } from './EarnCoinsTab';

interface PromoteTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  onChangeConfig: (patch: Partial<WorkspaceCustomizations>) => void;
  onSaveConfig: () => Promise<void>;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export const COMMUNITY_CATEGORIES = [
  'Roleplay',
  'Gaming',
  'Giveaways',
  'Community',
  'Design',
  'Development',
  'Support',
  'Bots',
  'Art',
  'Hosting',
  'Misc',
];

const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'International / Multilingual',
];

export function PromoteTab({
  guild,
  config,
  onChangeConfig,
  onSaveConfig,
  addToast,
}: PromoteTabProps) {
  const serverName = guild?.name || 'Community Discord Server';
  const serverIconUrl = guild?.iconUrl || (guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null);

  // Sub-tabs: 'listing' (Community Listing Setup) vs 'security' (Anti-Churn & Raid Shield Settings)
  const [activeSubTab, setActiveSubTab] = useState<'listing' | 'security'>('listing');

  const [description, setDescription] = useState(
    config.serverDescription || 'Welcome to our Discord community! Join active voice chats, participate in events, and connect with verified members.'
  );

  // Invite URL left blank by default
  const [inviteUrl, setInviteUrl] = useState(config.inviteUrl || '');

  // Multi-category selection (Max 3 as requested)
  const initialCategories = (config.serverCategory || 'Roleplay')
    .split(',')
    .map((c: string) => c.trim())
    .filter((c: string) => COMMUNITY_CATEGORIES.includes(c));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories.length > 0 ? initialCategories.slice(0, 3) : ['Roleplay', 'Community']
  );
  const [bannerUrl, setBannerUrl] = useState(
    config.serverBannerUrl || config.bannerUrl || ''
  );
  const [language, setLanguage] = useState(config.serverLanguage || 'English (US)');

  // Fixed 1 credit bounty
  const coinsBounty = 1;
  const [isLive, setIsLive] = useState(config.j4jEnabled !== false);

  // Tag Chips (Max 6 as requested)
  const initialTags = (config.serverTags || 'community, gaming, roleplay')
    .split(',')
    .map((t: string) => t.trim().toLowerCase())
    .filter(Boolean);
  const [tags, setTags] = useState<string[]>(initialTags.slice(0, 6));
  const [tagInput, setTagInput] = useState('');

  // Shield Security Toggles - Directly wired to real backend config fields
  const [minAccountAge, setMinAccountAge] = useState(
    config.j4jMinAccountAgeDays !== undefined ? config.j4jMinAccountAgeDays > 0 : true
  );
  const [requireAvatar, setRequireAvatar] = useState(
    config.j4jRequireAvatar !== false
  );

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        addToast('info', 'Category Selection', 'Please keep at least one category selected.');
        return;
      }
      const next = selectedCategories.filter((c) => c !== cat);
      setSelectedCategories(next);
      onChangeConfig({ serverCategory: next.join(', ') });
    } else {
      if (selectedCategories.length >= 3) {
        addToast('warning', 'Limit Reached', 'You can select up to 3 community categories.');
        return;
      }
      const next = [...selectedCategories, cat];
      setSelectedCategories(next);
      onChangeConfig({ serverCategory: next.join(', ') });
    }
  };

  const handleAddTag = (raw: string) => {
    const cleaned = raw.trim().toLowerCase().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      if (tags.length >= 6) {
        addToast('warning', 'Limit Reached', 'You can add a maximum of 6 tags.');
        return;
      }
      const updated = [...tags, cleaned];
      setTags(updated);
      onChangeConfig({ serverTags: updated.join(', ') });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    onChangeConfig({ serverTags: updated.join(', ') });
  };

  const handlePublishListing = async () => {
    if (!inviteUrl.trim() || (!inviteUrl.includes('discord.gg') && !inviteUrl.includes('discord.com/invite'))) {
      addToast('warning', 'Valid Invite Required', 'Please enter a valid permanent Discord invite link.');
      return;
    }
    if (!description.trim()) {
      addToast('warning', 'Description Required', 'Please provide a community description.');
      return;
    }
    if (selectedCategories.length === 0) {
      addToast('warning', 'Category Required', 'Please select at least one community category.');
      return;
    }

    // Save directly to workspace config (persisted to bot database via backend)
    onChangeConfig({
      serverDescription: description,
      serverTags: tags.join(', '),
      inviteUrl,
      serverCategory: selectedCategories.join(', '),
      serverLanguage: language,
      serverBannerUrl: bannerUrl,
      bannerUrl,
      coinsPerJoin: coinsBounty,
      j4jEnabled: isLive,
      j4jMinAccountAgeDays: minAccountAge ? 7 : 0,
      j4jRequireAvatar: requireAvatar,
      j4jBlockChurn: true,
    });

    try {
      await onSaveConfig();
    } catch (err: any) {
      console.warn('Workspace config save notice:', err);
    }

    // Persist real listing in localStorage
    const newListing: PromotedServer = {
      id: guild?.id || `srv_${Date.now()}`,
      name: serverName,
      icon: serverIconUrl,
      bannerUrl: bannerUrl || undefined,
      category: selectedCategories[0] || 'Community',
      categories: selectedCategories,
      language,
      description,
      tags: tags.length > 0 ? tags : ['community'],
      rewardCoins: coinsBounty,
      inviteUrl,
      verified: true,
      createdAt: Date.now(),
      memberCount: guild?.approximateMemberCount || 1,
      views: 1,
      rating: 5.0,
    };

    const existing: PromotedServer[] = JSON.parse(localStorage.getItem('civlink_promoted_servers') || '[]');
    const cleanedExisting = existing.filter((s) => !s.id.startsWith('srv_partner_') && s.id !== newListing.id);
    const updated = isLive ? [newListing, ...cleanedExisting] : cleanedExisting;

    localStorage.setItem('civlink_promoted_servers', JSON.stringify(updated));
    window.dispatchEvent(new Event('civlink_credits_updated'));

    addToast(
      'success',
      'Promotion Published',
      isLive ? 'Your server is now active in the global directory!' : 'Server promotion saved in draft mode.'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header Bar: Clean & Minimal */}
      <div className="rounded-2xl border border-white/[0.09] bg-[#161a24] p-5.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {serverIconUrl ? (
            <img src={serverIconUrl} alt={serverName} className="size-12 rounded-xl object-cover border-2 border-white/[0.12] shadow-md shrink-0" />
          ) : (
            <div className="size-12 rounded-xl bg-slate-800 border-2 border-white/[0.12] flex items-center justify-center font-bold text-white text-base shadow-md shrink-0">
              {serverName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white tracking-tight">{serverName}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Bounty: +1 Credit per verified join · 72h retention lock active
            </p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Sub-tab navigation */}
          <div className="flex items-center p-1 rounded-xl border border-white/[0.09] bg-[#11141c]">
            <button
              type="button"
              onClick={() => setActiveSubTab('listing')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'listing'
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Listing Setup
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('security')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'security'
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Anti-Raid Shield</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const nextState = !isLive;
              setIsLive(nextState);
              onChangeConfig({ j4jEnabled: nextState });
              addToast('info', 'Status Toggled', nextState ? 'Listing set to Active.' : 'Listing paused.');
            }}
            className="text-xs border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.16] text-slate-200 h-9 rounded-xl transition-all"
          >
            {isLive ? 'Pause Campaign' : 'Make Active'}
          </Button>

          <AsyncButton
            loadingText="Saving…"
            onClick={handlePublishListing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          >
            <Rocket className="size-3.5 mr-1.5" />
            Save & Publish
          </AsyncButton>
        </div>
      </div>

      {/* Main Studio Grid: Form / Settings (7 cols) + Live CADLY-Style Card Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {activeSubTab === 'listing' ? (
            <>
              {/* Section 1: Community Links & Category */}
              <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <CardHeader className="pb-3.5 border-b border-white/[0.06]">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="size-4 text-emerald-400" />
                    <span>1. Community Discovery Details</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Configure your permanent Discord invite, primary community categories, and language.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Discord Permanent Invite Link */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                        Discord Permanent Invite Link <span className="text-rose-400">*</span>
                      </label>
                      {inviteUrl.trim() ? (
                        <button
                          type="button"
                          onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')}
                          className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 font-mono transition-colors"
                        >
                          <span>Test link</span>
                          <ExternalLink className="size-2.5" />
                        </button>
                      ) : null}
                    </div>
                    <Input
                      value={inviteUrl}
                      onChange={(e) => {
                        setInviteUrl(e.target.value);
                        onChangeConfig({ inviteUrl: e.target.value });
                      }}
                      placeholder="https://discord.gg/your-invite"
                      className="text-xs bg-[#11141c] border-white/[0.09] text-slate-100 font-sans tracking-wide placeholder:text-slate-600 h-9 rounded-lg focus:border-white/20"
                    />
                    <span className="text-[11px] text-slate-500 font-sans block">
                      Ensure the invite is set to &quot;Never expire&quot; and &quot;No member limit&quot;.
                    </span>
                  </div>

                  {/* Multi-Category Selection (Direct Clickable Chips, Max 3) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                        Community Categories <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {selectedCategories.length}/3 selected
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-white/[0.08] bg-[#11141c]">
                      {COMMUNITY_CATEGORIES.map((cat) => {
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm'
                                : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>{cat}</span>
                            {isChecked && <Check className="size-3 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Community Language (Clean Radix Select matching staff review channel) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                      Primary Community Language
                    </label>
                    <Select
                      value={language}
                      onValueChange={(val) => {
                        setLanguage(val);
                        onChangeConfig({ serverLanguage: val });
                      }}
                    >
                      <SelectTrigger className="w-full bg-[#11141c] border-white/[0.08] text-slate-200 text-xs h-10 rounded-lg focus:border-white/20">
                        <div className="flex items-center gap-2">
                          <Globe className="size-4 text-emerald-400 shrink-0" />
                          <SelectValue placeholder="Select primary language..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#161a24] border-white/[0.1] text-white shadow-2xl max-h-72">
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang} className="text-xs hover:bg-white/[0.06] cursor-pointer">
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Directory Card Banner Image URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                        Directory Card Banner Image
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">PNG / JPG / WebP URL</span>
                    </div>
                    <div className="relative">
                      <Input
                        value={bannerUrl}
                        onChange={(e) => {
                          setBannerUrl(e.target.value);
                          onChangeConfig({ serverBannerUrl: e.target.value, bannerUrl: e.target.value });
                        }}
                        placeholder="https://example.com/banner.png (Optional)"
                        className="text-xs bg-[#11141c] border-white/[0.09] text-slate-200 h-10 rounded-lg pr-8 focus:border-white/20"
                      />
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setBannerUrl('');
                            onChangeConfig({ serverBannerUrl: '', bannerUrl: '' });
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Paste a direct image link for your card header. If left blank, it defaults to neutral slate or your server banner.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Community Pitch & Search Tags (Max 6) */}
              <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <CardHeader className="pb-3.5 border-b border-white/[0.06]">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Tag className="size-4 text-cyan-400" />
                    <span>2. Community Pitch & Search Tags</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Highlight what makes your server unique to convert viewers into permanent members.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Description Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                        Community Description
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {description.length} / 280 characters
                      </span>
                    </div>
                    <Textarea
                      value={description}
                      maxLength={280}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        onChangeConfig({ serverDescription: e.target.value });
                      }}
                      rows={3}
                      placeholder="Describe your server's features, regular events, roleplay branches, or community perks..."
                      className="text-xs bg-[#11141c] border-white/[0.09] text-slate-200 leading-relaxed rounded-lg resize-none focus:border-white/20"
                    />
                  </div>

                  {/* Tag Chips (Max 6 as requested) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                        Search Tags
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {tags.length}/6 tags
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">#</span>
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              handleAddTag(tagInput);
                            }
                          }}
                          placeholder="Add custom tag (max 6) and press Enter..."
                          className="pl-7 text-xs bg-[#11141c] border-white/[0.09] text-slate-200 font-mono h-9 rounded-lg focus:border-white/20"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddTag(tagInput)}
                        className="h-9 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 text-xs rounded-lg transition-colors"
                      >
                        <Plus className="size-3.5 mr-1" />
                        Add Tag
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-white/[0.05] border border-white/10 px-2.5 py-1 rounded-md font-mono"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Remodeled Security & Anti-Raid Shield Settings Card */
            <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in-50 duration-200">
              <CardHeader className="pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <ShieldAlert className="size-4 text-emerald-400" />
                    <span>Mavely Security & Anti-Raid Shield</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2.5 py-0.5 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Protection Active</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Automated security protocols to protect your community treasury from alt accounts and immediate churn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-4 text-xs">
                {/* Protocol 1: 72h Retention Clawback Lock */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#11141c] flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="size-4 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">72-Hour Credit Retention Guarantee</span>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono">
                          ENFORCED
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        If an account leaves your Discord server within 72 hours of claiming a bounty, the awarded credits are automatically revoked.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Protocol 2: Live Bot Guild Presence Scanner */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#11141c] flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="size-4 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Mavely Bot Guild Presence Scanner</span>
                        <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-mono">
                          CONTINUOUS
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The bot dynamically inspects guild member presence to confirm the user is actively present in your server.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Protocol 3: Alt Account Filter */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#11141c] flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <UserCheck className="size-4 text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-white block">Filter Fresh Accounts (&lt;7 Days Old)</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Rejects newly registered or throwaway Discord accounts from claiming your community&apos;s bounties.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !minAccountAge;
                      setMinAccountAge(next);
                      onChangeConfig({ j4jMinAccountAgeDays: next ? 7 : 0 });
                      addToast('info', 'Security Updated', next ? 'Fresh account filter enabled (>7 days required).' : 'Fresh account filter disabled.');
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      minAccountAge ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        minAccountAge ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Protocol 4: Require Verified Avatar */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#11141c] flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="size-4 text-purple-400" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-white block">Require Verified Discord Avatar</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Filters out default grey placeholder avatars to protect your member list from automated bot farms.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !requireAvatar;
                      setRequireAvatar(next);
                      onChangeConfig({ j4jRequireAvatar: next });
                      addToast('info', 'Security Updated', next ? 'Avatar requirement enabled.' : 'Avatar requirement disabled.');
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requireAvatar ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        requireAvatar ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Directory Preview */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="size-3.5 text-slate-400" />
              <span>LIVE DIRECTORY CARD PREVIEW</span>
            </span>
            <span className="text-[10px] text-slate-500">Live preview</span>
          </div>

          {/* Elevated Server Card */}
          <div className="w-full max-w-[360px] rounded-2xl border border-white/[0.08] bg-[#161a24] overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col transition-all">
            {/* Top Wide Banner */}
            <div className="relative w-full h-28 bg-[#1f2433] overflow-hidden flex items-center justify-center">
              {bannerUrl || config.serverBannerUrl ? (
                <img
                  src={bannerUrl || config.serverBannerUrl}
                  alt={serverName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-[#161a24]/90 via-[#1f2433]/40 to-transparent" />
              )}
              {/* Verified Community Badge Overlay */}
              <div className="absolute top-2.5 right-2.5">
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-950/70 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2 py-0.5 h-5 rounded-md flex items-center gap-1 shadow-sm">
                  <Check className="size-2.5" />
                  <span>VERIFIED</span>
                </Badge>
              </div>
            </div>

            {/* Content Container with Overlapping Server Icon */}
            <div className="px-4 pt-0 pb-4 space-y-3 relative">
              {/* Overlapping Icon row */}
              <div className="flex items-end justify-between -mt-6 relative z-10 pr-2">
                {serverIconUrl ? (
                  <img
                    src={serverIconUrl}
                    alt={serverName}
                    className="size-13 rounded-2xl object-cover border-[3.5px] border-[#161a24] shadow-md bg-zinc-900"
                  />
                ) : (
                  <div className="size-13 rounded-2xl bg-[#5865F2] flex items-center justify-center font-bold text-white text-base border-[3.5px] border-[#161a24] shadow-md">
                    {serverName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white tracking-tight truncate">
                  {serverName}
                </h4>

                {/* Selected categories */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {selectedCategories.map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="text-[9px] px-2 py-0.5 h-4.5 border-white/[0.08] bg-white/[0.04] text-slate-300 font-sans"
                    >
                      {c}
                    </Badge>
                  ))}
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-400 font-sans">{language}</span>
                </div>
              </div>

              {/* Community Metrics: Members, Views, Stars */}
              <div className="flex items-center gap-2 pt-0.5 pb-0.5 text-[11px] font-mono">
                <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
                  <Users className="size-3 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200">{(guild?.approximateMemberCount || 1240).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500">members</span>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
                  <Eye className="size-3 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-slate-200">198</span>
                  <span className="text-[10px] text-slate-500">views</span>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
                  <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-200">5.0</span>
                </div>
              </div>

              {/* Community Description */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-sans">
                {description}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-slate-400 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5 font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 flex flex-wrap items-center gap-2 border-t border-white/[0.06]">
                <Button
                  size="sm"
                  className="bg-white hover:bg-slate-200 text-slate-900 font-semibold text-xs h-8 px-3.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Join Server</span>
                  <span>→</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs h-8 px-3 rounded-lg transition-all flex items-center gap-1"
                >
                  <ExternalLink className="size-3" />
                  <span>Open Page</span>
                </Button>

                <div className="ms-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 text-[10px] font-sans">
                  <Flame className="size-3 text-amber-400" />
                  <span className="font-semibold text-slate-200">Bump</span>
                  <span className="text-slate-500">22 in 48h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromoteTab;
