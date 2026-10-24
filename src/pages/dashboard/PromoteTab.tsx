import React, { useState, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  ExternalLink,
  Check,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  ShieldAlert,
  Clock,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Users,
  AlertCircle,
  Plus,
  X,
  Upload,
  KeyRound,
  Handshake,
  Radio,
  Send,
  AtSign,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { promoteServerToDirectory } from '@/lib/api';
import type { DiscordGuild, WorkspaceCustomizations } from '@/types';

interface PromoteTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  onChangeConfig: (updates: Partial<WorkspaceCustomizations>) => void;
  onSaveConfig: () => Promise<void>;
  onNavigateTab?: (tab: string) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
  initialSubTab?: 'listing' | 'roster';
}

const CATEGORIES = [
  'Design Server',
  'Roleplay Server',
  'Misc',
  'Bots',
  'Departments',
  'Events'
];

const STEPS = [
  'Directory Listing',
  'Anti-Raid Defense',
  'Review & Publish'
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

  const sessionDraftKey = `erlcus_promote_draft_${guildId}`;

  // Load session draft if present (preserves state across page refreshes, resets when user leaves session)
  const getInitialDraft = () => {
    try {
      const raw = sessionStorage.getItem(sessionDraftKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };
  const draft = getInitialDraft();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    return draft?.currentStep ?? 0;
  });

  const [description, setDescription] = useState<string>(() => draft?.description ?? config.serverDescription ?? '');
  const [inviteUrl, setInviteUrl] = useState<string>(() => draft?.inviteUrl ?? config.inviteUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState<string>(() => draft?.bannerUrl ?? config.serverBannerUrl ?? config.bannerUrl ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => draft?.selectedCategory ?? config.serverCategory ?? 'Design Server');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerDisplayText, setBannerDisplayText] = useState<string>(() => {
    if (bannerUrl?.startsWith('data:image/')) return 'Uploaded PNG Banner - Accepted';
    return bannerUrl || '';
  });
  const [erlcApiKey, setErlcApiKey] = useState<string>(() => draft?.erlcApiKey ?? config.erlcApiKey ?? '');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Server Partnerships Setup
  const [acceptPartnerships, setAcceptPartnerships] = useState<boolean>(() => config.acceptPartnerships !== false);
  const [partnershipWebhookUrl, setPartnershipWebhookUrl] = useState<string>(() => config.partnershipWebhookUrl ?? '');
  const [partnershipAdText, setPartnershipAdText] = useState<string>(() => config.partnershipAdText ?? '');
  const [allowPartnerMentions, setAllowPartnerMentions] = useState<boolean>(() => config.allowPartnerMentions === true);
  const [partnershipMinMembers, setPartnershipMinMembers] = useState<number>(() => Number(config.partnershipMinMembers || 50));
  const [partnershipHerePrice, setPartnershipHerePrice] = useState<number>(() => Number(config.partnershipHerePrice !== undefined ? config.partnershipHerePrice : 15));
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);

  // Community Tags: user can type whatever tag they want, up to 3 tags
  const [tags, setTags] = useState<string[]>(() => {
    if (draft?.tags && Array.isArray(draft.tags)) return draft.tags;
    if (config.serverTags) {
      const parsed = config.serverTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      if (parsed.length > 0) return parsed.slice(0, 3);
    }
    return [];
  });
  const [tagInput, setTagInput] = useState('');

  // Anti-Raid Defense switches
  const [minAge, setMinAge] = useState<boolean>(() => draft?.minAge ?? (config.j4jMinAccountAgeDays !== undefined ? config.j4jMinAccountAgeDays > 0 : true));
  const [requireAvatar, setRequireAvatar] = useState<boolean>(() => draft?.requireAvatar ?? (config.j4jRequireAvatar !== false));
  const [sybilShield, setSybilShield] = useState<boolean>(true);
  const [velocityLimiter, setVelocityLimiter] = useState<boolean>(() => draft?.velocityLimiter ?? (config.j4jBlockChurn !== false));

  const [saving, setSaving] = useState(false);

  // When config resets to baseline (e.g. "Changes Reverted" triggered from header)
  useEffect(() => {
    setDescription(config.serverDescription ?? '');
    setInviteUrl(config.inviteUrl ?? '');
    const bUrl = config.serverBannerUrl ?? config.bannerUrl ?? '';
    setBannerUrl(bUrl);
    setBannerDisplayText(bUrl?.startsWith('data:image/') ? 'Uploaded PNG Banner - Accepted' : bUrl || '');
    setSelectedCategory(config.serverCategory ?? 'Design Server');
    setErlcApiKey(config.erlcApiKey ?? '');
    setAcceptPartnerships(config.acceptPartnerships !== false);
    setPartnershipWebhookUrl(config.partnershipWebhookUrl ?? '');
    setPartnershipAdText(config.partnershipAdText ?? '');
    setAllowPartnerMentions(config.allowPartnerMentions === true);
    setPartnershipMinMembers(Number(config.partnershipMinMembers || 50));
    setPartnershipHerePrice(Number(config.partnershipHerePrice !== undefined ? config.partnershipHerePrice : 15));
    if (config.serverTags) {
      const parsed = config.serverTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      setTags(parsed.slice(0, 3));
    } else {
      setTags([]);
    }
    setIsDirty(false);
    try {
      sessionStorage.removeItem(sessionDraftKey);
    } catch {}
  }, [config.serverDescription, config.inviteUrl, config.serverBannerUrl, config.bannerUrl, config.serverCategory, config.serverTags, config.erlcApiKey, config.acceptPartnerships, config.partnershipWebhookUrl, config.partnershipAdText, config.allowPartnerMentions, config.partnershipMinMembers, config.partnershipHerePrice]);

  // Warn user before navigating away if they have unsaved directory changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'image/gif') {
      setBannerError('Animated GIFs are not permitted as server banners.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setBannerError('File must be an image (PNG recommended).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerUrl(result);
      setBannerDisplayText(`Uploaded Image (${file.name || 'banner.png'}) - Accepted`);
      setBannerError(null);
      setIsDirty(true);
      onChangeConfig({ serverBannerUrl: result });
      addToast('success', 'Banner Accepted', 'PNG banner image loaded successfully.');
    };
    reader.readAsDataURL(file);
  };

  // Sync draft to sessionStorage on changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        sessionDraftKey,
        JSON.stringify({
          currentStep,
          description,
          inviteUrl,
          bannerUrl,
          selectedCategory,
          tags,
          erlcApiKey,
          minAge,
          requireAvatar,
          sybilShield,
          velocityLimiter
        })
      );
    } catch {}
  }, [sessionDraftKey, currentStep, description, inviteUrl, bannerUrl, selectedCategory, tags, minAge, requireAvatar, sybilShield, velocityLimiter]);

  // Handle Banner URL change with strict GIF prohibition
  const handleBannerChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.toLowerCase().includes('.gif')) {
      setBannerError('GIFs and animated banners are not supported. Please use a PNG, JPG, or Discord attachment URL.');
      return;
    }
    setBannerError(null);
    setBannerUrl(trimmed);
    onChangeConfig({ serverBannerUrl: trimmed, bannerUrl: trimmed });
  };

  // Add custom tag typed by user
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (tags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      addToast('info', 'Tag Exists', 'This tag is already added.');
      setTagInput('');
      return;
    }
    if (tags.length >= 3) {
      addToast('warning', 'Limit Reached', 'You can add up to 3 community tags. Remove one first.');
      return;
    }
    const updated = [...tags, clean];
    setTags(updated);
    setTagInput('');
    onChangeConfig({ serverTags: updated.join(', ') });
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    onChangeConfig({ serverTags: updated.join(', ') });
  };

  const handleSaveAndPublish = async () => {
    if (tags.length === 0) {
      addToast('warning', 'Tags Required', 'Please add at least 1 community tag before publishing.');
      setCurrentStep(0);
      return;
    }

    setSaving(true);
    try {
      onChangeConfig({
        serverDescription: description,
        inviteUrl: inviteUrl.trim(),
        serverBannerUrl: bannerUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        serverCategory: selectedCategory,
        serverTags: tags.join(', '),
        erlcApiKey: erlcApiKey.trim(),
        acceptPartnerships,
        partnershipWebhookUrl: partnershipWebhookUrl.trim(),
        partnershipAdText: partnershipAdText.trim(),
        allowPartnerMentions,
        partnershipMinMembers,
        partnershipHerePrice,
        j4jMinAccountAgeDays: minAge ? 7 : 0,
        j4jRequireAvatar: requireAvatar,
        j4jBlockChurn: velocityLimiter
      });
      await onSaveConfig();

      const resolvedMembers = Number(guild?.memberCount || (guild as any)?.approximate_member_count || localStorage.getItem(`server_members_${guildId}`) || 150);

      // Sync into directory
      const myPromotedServer = {
        id: guildId,
        name: serverName,
        icon: guild?.icon || null,
        category: selectedCategory,
        language: 'English',
        description: description.trim() || 'Active ER:LC roleplay community with daily sessions and verified shifts.',
        tags: tags,
        rewardCoins: config.coinsPerJoin || 2,
        inviteUrl: inviteUrl.trim(),
        verified: Boolean((guild as any)?.verified),
        bannerUrl: bannerUrl.trim(),
        serverBannerUrl: bannerUrl.trim(),
        memberCount: resolvedMembers > 0 ? resolvedMembers : 150,
        lastBumpedAt: Date.now()
      };

      await promoteServerToDirectory(myPromotedServer).catch(() => {});

      // Clear draft since it is successfully saved and published
      try {
        sessionStorage.removeItem(sessionDraftKey);
      } catch {}

      addToast('success', 'Published to Directory', `${serverName} is now live and discoverable in the public directory.`);
      if (onNavigateTab) onNavigateTab('details');
    } catch (err: any) {
      addToast('error', 'Publish Failed', err.message || 'Could not publish server to directory.');
    } finally {
      setSaving(false);
    }
  };

  const hasUserBanner = Boolean(
    bannerUrl && 
    !bannerError && 
    (/^https?:\/\//i.test(bannerUrl) || bannerUrl.startsWith('data:image/'))
  );

  const handleTestWebhook = async () => {
    if (!partnershipWebhookUrl.trim()) {
      addToast('warning', 'Webhook Required', 'Please enter a Discord Webhook URL before testing.');
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/partnerships/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: partnershipWebhookUrl.trim(), guildName: serverName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test webhook.');
      addToast('success', 'Webhook Verified', 'Test announcement successfully sent to your Discord channel!');
    } catch (err: any) {
      addToast('error', 'Webhook Error', err.message || 'Could not verify Discord webhook.');
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in-50 duration-150">
      {/* ── TOP HEADER & STEPPER ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Promote Server Studio
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Publish {serverName} to the global directory with custom tags and anti-raid protection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('details')}
                className="text-xs bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 h-8.5 rounded-xl cursor-pointer"
              >
                <Eye className="size-3.5 mr-1 text-zinc-400" />
                <span>Details Page</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveAndPublish}
              disabled={saving}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-8.5 px-3.5 rounded-xl shadow-sm cursor-pointer"
            >
              {saving ? 'Publishing...' : 'Save & Publish'}
            </Button>
          </div>
        </div>

        {/* 21st.dev Stepper Bar */}
        <div className="pt-2 border-t border-white/[0.06]">
          <Stepper value={currentStep} onValueChange={setCurrentStep} linear={false} label="Promotion Flow">
            {STEPS.map((title, idx) => (
              <StepperItem key={title} step={idx}>
                <StepperTrigger className="hover:opacity-90">
                  <StepperIndicator />
                  <StepperTitle>{title}</StepperTitle>
                </StepperTrigger>
                {idx < STEPS.length - 1 ? <StepperSeparator /> : null}
              </StepperItem>
            ))}
          </Stepper>
        </div>
      </div>

      {/* ── STEP 0: DIRECTORY LISTING ── */}
      {currentStep === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 animate-in fade-in-50 duration-150">
          {/* Left Inputs: Flush and blended directly into page background */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Category Selector */}
            <div className="space-y-2.5 pb-5 border-b border-white/[0.06]">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Community Category</label>
                <p className="text-[11px] text-zinc-400">
                  Select where your server appears in the global discovery directory.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        onChangeConfig({ serverCategory: cat });
                      }}
                      className={`h-9 px-3 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer truncate ${
                        active
                          ? 'bg-[#272727] text-white border-white/20 shadow-sm'
                          : 'bg-[#141416] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-[#1a1a1e]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Server Description */}
            <div className="space-y-2.5 pb-5 border-b border-white/[0.06]">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Server Description</label>
                <p className="text-[11px] text-zinc-400">
                  Highlight your daily ER:LC sessions, custom liveries, active departments, and member perks.
                </p>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  onChangeConfig({ serverDescription: e.target.value });
                }}
                placeholder="Welcome to our ER:LC Roleplay Community! We host daily realistic sessions, active civilian operations, and custom liveries..."
                className="w-full p-3.5 bg-[#141416] border border-white/10 text-white text-xs rounded-xl focus:outline-none focus:border-emerald-500/50 resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Permanent Invite URL */}
            <div className="space-y-2.5 pb-5 border-b border-white/[0.06]">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Permanent Discord Invite Link</label>
                <p className="text-[11px] text-zinc-400">
                  Real Discord invite used by players to join your community.
                </p>
              </div>
              <div className="relative">
                <LinkIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={inviteUrl}
                  onChange={(e) => {
                    setInviteUrl(e.target.value);
                    onChangeConfig({ inviteUrl: e.target.value });
                  }}
                  placeholder="https://discord.gg/your-invite"
                  className="h-10 pl-9 text-xs bg-[#141416] border-white/10 text-white rounded-xl font-mono focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Custom Banner URL & PNG File Upload */}
            <div className="space-y-2.5 pb-5 border-b border-white/[0.06]">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white">Custom Server Banner</label>
                <p className="text-[11px] text-zinc-400">
                  Select a PNG banner file or paste an image URL for your Server Details and directory card.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={bannerDisplayText}
                    onChange={(e) => {
                      setBannerDisplayText(e.target.value);
                      handleBannerChange(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Paste banner URL or upload PNG below..."
                    className={`h-10 pl-9 text-xs bg-[#141416] border-white/10 text-white rounded-xl font-mono focus:border-white/20 ${
                      bannerError ? 'border-rose-500/60' : ''
                    }`}
                  />
                </div>
                <label className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#272727] hover:bg-[#323232] text-xs text-white border border-white/10 font-medium cursor-pointer transition-colors shrink-0">
                  <Upload className="size-3.5 text-zinc-300" />
                  <span>Upload PNG</span>
                  <input
                    type="file"
                    accept=".png,image/png,image/jpeg,image/webp"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {bannerError && (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs pt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{bannerError}</span>
                </div>
              )}
            </div>

            {/* Custom ER:LC API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5 font-sans">
                  <KeyRound className="size-3.5 text-emerald-400" />
                  <span>ER:LC Server API Key</span>
                  <span className="text-[10px] text-zinc-500 font-normal">(Optional)</span>
                </label>
              </div>
              <Input
                type="password"
                value={erlcApiKey}
                onChange={(e) => {
                  setErlcApiKey(e.target.value);
                  setIsDirty(true);
                  onChangeConfig({ erlcApiKey: e.target.value });
                }}
                placeholder="Enter your custom ER:LC Private Server API Key..."
                className="h-10 text-xs bg-[#141416] border-white/10 text-white rounded-xl focus:border-white/20 font-mono"
              />
              <p className="text-[11px] text-zinc-500 font-sans">
                Optional: Syncs live in-game player telemetry, session status, and server join codes directly to your directory listing.
              </p>
            </div>

            {/* ── SERVER PARTNERSHIPS & CROSS-PROMOTION SETUP (BLENDED) ── */}
            <div className="space-y-4 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Handshake className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight font-sans">Server Partnership Setup</h4>
                    <p className="text-[11px] text-zinc-400 font-sans">Automated mutual cross-promotions with verified ER:LC communities.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-sans">{acceptPartnerships ? 'Open' : 'Paused'}</span>
                  <Switch
                    checked={acceptPartnerships}
                    onCheckedChange={(checked) => {
                      setAcceptPartnerships(checked);
                      setIsDirty(true);
                      onChangeConfig({ acceptPartnerships: checked });
                    }}
                  />
                </div>
              </div>

              {acceptPartnerships && (
                <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
                  {/* Webhook URL with Test Button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white font-sans flex items-center gap-1.5">
                        <Radio className="size-3.5 text-emerald-400" />
                        <span>Discord Partnership Webhook URL</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook || !partnershipWebhookUrl.trim()}
                        className="text-[11px] font-sans font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-40 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Send className="size-3" />
                        <span>{testingWebhook ? 'Testing...' : 'Test Webhook'}</span>
                      </button>
                    </div>
                    <Input
                      value={partnershipWebhookUrl}
                      onChange={(e) => {
                        setPartnershipWebhookUrl(e.target.value);
                        setIsDirty(true);
                        onChangeConfig({ partnershipWebhookUrl: e.target.value });
                      }}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="h-10 text-xs bg-[#141416] border-white/10 text-white rounded-xl font-mono focus:border-emerald-500/50"
                    />
                    <p className="text-[10px] text-zinc-500 font-sans">
                      Paste the webhook URL of the Discord channel where accepted partner advertisements will be posted. Kept private and never shared publicly.
                    </p>
                  </div>

                  {/* Partnership Advertisement Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white font-sans">
                      Server Advertisement Text / Memo
                    </label>
                    <textarea
                      rows={3}
                      value={partnershipAdText}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/@(everyone|here)/gi, '');
                        setPartnershipAdText(sanitized);
                        setIsDirty(true);
                        onChangeConfig({ partnershipAdText: sanitized });
                      }}
                      placeholder="Custom advertisement sent to partner Discord channels when a partnership is accepted..."
                      className="w-full p-3 bg-[#141416] border border-white/10 text-white text-xs rounded-xl focus:outline-none focus:border-emerald-500/50 resize-y font-sans leading-relaxed"
                    />
                    <p className="text-[10px] text-zinc-500 font-sans">
                      Leave empty to default to standard description. Role pings (@everyone / @here) are automatically stripped.
                    </p>
                  </div>

                  {/* Mentions Toggle & Min Member Gate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white flex items-center gap-1">
                          <AtSign className="size-3 text-cyan-400" />
                          <span>Allow Role Mentions</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">Permit @everyone / @here for coin bounties</p>
                      </div>
                      <Switch
                        checked={allowPartnerMentions}
                        onCheckedChange={(checked) => {
                          setAllowPartnerMentions(checked);
                          setIsDirty(true);
                          onChangeConfig({ allowPartnerMentions: checked });
                        }}
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">Min. Member Gate</div>
                        <p className="text-[10px] text-zinc-400">Required community size to request partnership</p>
                      </div>
                      <Input
                        type="number"
                        value={partnershipMinMembers}
                        onChange={(e) => {
                          setPartnershipMinMembers(Number(e.target.value));
                          setIsDirty(true);
                          onChangeConfig({ partnershipMinMembers: Number(e.target.value) });
                        }}
                        className="w-20 h-8 text-xs bg-[#141416] border-white/10 text-white rounded-lg font-sans tabular-nums text-center"
                      />
                    </div>
                  </div>

                  {/* Configurable @here Mention Price */}
                  {allowPartnerMentions && (
                    <div className="pt-1 animate-in fade-in-50 duration-150">
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-white">@here Mention Price</div>
                          <p className="text-[10px] text-zinc-400">Coins required for partner @here announcement</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={partnershipHerePrice}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setPartnershipHerePrice(val);
                              setIsDirty(true);
                              onChangeConfig({ partnershipHerePrice: val });
                            }}
                            className="w-20 h-8 text-xs bg-[#141416] border-white/10 text-white rounded-lg font-sans tabular-nums text-center"
                          />
                          <span className="text-[11px] text-zinc-400 font-sans">Coins</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Community Discovery Tags: Freeform User-Typed Tags */}
            <div className="space-y-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-white">Community Tags</label>
                  <p className="text-[11px] text-zinc-400">
                    Type whatever tags you want (up to 3 tags).
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {tags.length} / 3 Tags Added
                </span>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272727] text-white border border-white/10 text-xs font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input for adding freeform tag */}
              {tags.length < 3 && (
                <form onSubmit={handleAddTag} className="flex gap-2 pt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Type tag name and press Enter..."
                    className="h-9.5 text-xs bg-[#141416] border-white/10 text-white rounded-xl focus:border-emerald-500/50"
                  />
                  <Button
                    type="submit"
                    className="bg-[#272727] hover:bg-[#323232] text-white border border-white/10 text-xs rounded-xl h-9.5 px-3.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="size-3.5 mr-1" />
                    <span>Add</span>
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Right Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-semibold text-white">Directory Card Preview</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Live Preview
                </span>
              </div>

              {/* Directory Card Preview */}
              <div className="rounded-2xl border border-white/10 bg-[#111113] overflow-hidden shadow-xl">
                {hasUserBanner ? (
                  <div className="relative w-full h-32 overflow-hidden bg-[#111113] shrink-0">
                    <img
                      src={bannerUrl}
                      alt={serverName}
                      className="w-full h-full object-cover object-center"
                      style={{
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-16 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0" />
                )}

                <div className={`p-4 space-y-3 ${hasUserBanner ? '-mt-8 relative z-10' : ''}`}>
                  <div className="flex items-center gap-3">
                    {serverIconUrl ? (
                      <img src={serverIconUrl} alt={serverName} className="size-14 rounded-2xl object-cover ring-4 ring-[#111113] border border-white/10 shadow-xl bg-zinc-900 shrink-0" />
                    ) : (
                      <div className="size-14 rounded-2xl bg-zinc-900 ring-4 ring-[#111113] border border-white/10 flex items-center justify-center font-bold text-white text-base shadow-xl shrink-0">
                        {serverName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate font-sans">{serverName}</h4>
                      <span className="text-[11px] text-zinc-400 font-medium block font-sans">{selectedCategory}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                    {description.trim() || 'No description configured yet. Enter your community overview on the left.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">Member Reward: +{config.coinsPerJoin || 2} Credits</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>Join Community</span>
                      <ExternalLink className="size-3" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-[#272727] hover:bg-[#323232] text-white border border-white/10 text-xs rounded-xl h-9.5 flex items-center justify-center gap-2 cursor-pointer font-medium"
                >
                  <span>Continue to Anti-Raid Defense</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: ANTI-RAID DEFENSE ── */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Anti-Raid Defense</h3>
            <p className="text-xs text-zinc-400">
              Protect your community growth campaigns from botting, alt accounts, and rapid credit churn.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4.5">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-xs sm:text-sm font-semibold text-white">Discord Account Age (Minimum 7 Days)</span>
                <span className="text-zinc-400 text-xs">
                  Accounts created less than 7 days ago cannot claim join rewards or register into your community.
                </span>
              </div>
              <Switch checked={minAge} onCheckedChange={(v) => { setMinAge(v); setIsDirty(true); }} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4.5">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-xs sm:text-sm font-semibold text-white">Require Custom Profile Picture</span>
                <span className="text-zinc-400 text-xs">
                  Blocks default Discord avatar accounts to defend against throwaway alts and spam accounts.
                </span>
              </div>
              <Switch checked={requireAvatar} onCheckedChange={(v) => { setRequireAvatar(v); setIsDirty(true); }} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4.5">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-xs sm:text-sm font-semibold text-white">Anti-Alt & Bot Raid Protection</span>
                <span className="text-zinc-400 text-xs">
                  Automated gate for disposable accounts and token farms before any community credits or invites disburse.
                </span>
              </div>
              <Switch checked={sybilShield} onCheckedChange={(v) => { setSybilShield(v); setIsDirty(true); }} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4.5">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-xs sm:text-sm font-semibold text-white">Join Velocity Rate Limiter</span>
                <span className="text-zinc-400 text-xs">
                  Slows down sudden join bursts (&gt;5 joins in 60s) to shield your server from organized raids.
                </span>
              </div>
              <Switch checked={velocityLimiter} onCheckedChange={(v) => { setVelocityLimiter(v); setIsDirty(true); }} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(0)}
              className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs rounded-xl h-9 px-4 cursor-pointer"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              <span>Back to Listing</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="bg-[#272727] hover:bg-[#323232] text-white border border-white/10 text-xs rounded-xl h-9 px-5 cursor-pointer font-medium"
            >
              <span>Continue to Review</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: REVIEW & PUBLISH ── */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Directory Listing Verification</h3>
            <p className="text-xs text-zinc-400">
              Verify your directory parameters before making your listing live to all ER:LC roleplayers.
            </p>
          </div>

          {/* Executive Verification Card */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f]">
            {bannerUrl ? (
              <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-[#0a0a0c] border-b border-white/[0.08]">
                <img
                  src={bannerUrl}
                  alt={serverName}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/80 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : null}

            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.06]">
                {serverIconUrl ? (
                  <img
                    src={serverIconUrl}
                    alt={serverName}
                    className="size-12 rounded-xl object-cover border border-white/10 bg-[#141416]"
                  />
                ) : (
                  <div className="size-12 rounded-xl bg-[#272727] flex items-center justify-center text-white font-bold text-base border border-white/10">
                    {serverName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{serverName}</h4>
                  <span className="text-xs text-zinc-400 font-medium">{selectedCategory}</span>
                </div>
              </div>

              {/* Parameter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
                  <span className="text-zinc-400 text-[11px] block">Target Community</span>
                  <span className="font-semibold text-white block truncate">{serverName}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
                  <span className="text-zinc-400 text-[11px] block">Community Category</span>
                  <span className="font-semibold text-white block">{selectedCategory}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1.5 sm:col-span-2">
                  <span className="text-zinc-400 text-[11px] block">
                    Community Tags ({tags.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.length > 0 ? (
                      tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg bg-[#272727] text-white border border-white/10 text-[11px] font-medium">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 italic text-[11px]">None specified</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
                  <span className="text-zinc-400 text-[11px] block">Permanent Discord Invite</span>
                  <span className="font-mono text-zinc-300 block truncate">
                    {inviteUrl || 'Not configured'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1">
                  <span className="text-zinc-400 text-[11px] block">Member Join Incentive</span>
                  <span className="font-mono text-white font-semibold block">
                    +{config.coinsPerJoin || 2} Credits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#141416] space-y-1.5 sm:col-span-2">
                  <span className="text-zinc-400 text-[11px] block">Active Defenses</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      minAge && '7-Day Account Age',
                      requireAvatar && 'Avatar Required',
                      sybilShield && 'Anti-Alt Gate',
                      velocityLimiter && 'Raid Join Throttling'
                    ].filter(Boolean).map((d) => (
                      <span key={d as string} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300 text-[11px] font-medium">
                        <ShieldCheck className="size-3 text-emerald-400" />
                        <span>{d}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="bg-[#272727] hover:bg-[#323232] text-zinc-300 border-white/10 text-xs rounded-xl h-9 px-4 cursor-pointer"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              <span>Back to Defense</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAndPublish}
              disabled={saving}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl h-9.5 px-6 shadow-sm cursor-pointer transition-all"
            >
              {saving ? 'Publishing...' : 'Save & Publish Listing'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoteTab;
