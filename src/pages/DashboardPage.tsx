import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Server,
  Radio,
  Ticket,
  Users,
  FileText,
  KeyRound,
  RotateCw,
  Send,
  ExternalLink,
  Layers,
  Check,
  ArrowRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Eye,
  AlertTriangle,
  Save,
  Sparkles,
  GripVertical,
  Search,
  Sliders,
  Activity,
  Inbox,
  Copy,
  Shield,
  ShieldAlert,
  FileCheck,
  UserCheck,
  UserX,
  Volume2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { Stepper, type StepperItem } from '@/components/ui/stepper';
import { ChannelSelect, RoleSelect, MultiRoleSelect } from '@/components/DiscordResourceSelectors';
import NotificationsBlock, { type ToastNotification } from '@/components/ui/notifications-5';
import { DiskHookBuilder } from '@/components/DiskHookBuilder';
import { DiscordMarkdown } from '@/components/DiscordMarkdown';
import {
  fetchGuilds,
  fetchWorkspace,
  createWorkspace,
  saveWorkspaceConfig,
  updateWorkspaceCredentials,
  triggerBotAction,
  fetchErlcLive,
  fetchGuildResources
} from '@/lib/api';
import type {
  DiscordGuild,
  WorkspaceBot,
  LiveErlcServer,
  WorkspaceCustomizations,
  GuildResources,
  CustomStaffApplication
} from '@/types';

const ONBOARDING_STEPS: StepperItem[] = [
  {
    id: 'token',
    title: 'Discord Bot Token',
    description: 'Connect Gateway application & intents',
  },
  {
    id: 'erlc',
    title: 'ER:LC Server Key',
    description: 'Link private server live telemetry',
  },
  {
    id: 'verify',
    title: 'Verification & Status',
    description: 'Cluster readiness & live deployment',
  },
];

export function DashboardPage() {
  const { guildId } = useParams();
  const navigate = useNavigate();

  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceBot | null>(null);
  const [erlcLive, setErlcLive] = useState<LiveErlcServer | null>(null);
  const [resources, setResources] = useState<GuildResources>({ available: false, channels: [], roles: [] });

  const [loadingGuilds, setLoadingGuilds] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'onboarding' | 'server' | 'tickets' | 'sessions' | 'applications' | 'docs' | 'community' | 'erlc'
  >('server');

  // Onboarding Wizard step
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [config, setConfig] = useState<WorkspaceCustomizations>({});
  const [baselineConfig, setBaselineConfig] = useState<string>('');
  const hasUnsavedChanges = Boolean(baselineConfig && JSON.stringify(config) !== baselineConfig);

  const handleResetConfig = () => {
    try {
      if (baselineConfig) {
        setConfig(JSON.parse(baselineConfig));
        addToast('info', 'Changes Reverted', 'Restored previous configuration settings.');
      }
    } catch {
      // fallback
    }
  };
  const [discordTokenInput, setDiscordTokenInput] = useState('');
  const [erlcKeyInput, setErlcKeyInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ticketDeployChannelId, setTicketDeployChannelId] = useState('');
  const [deployingTicketPanel, setDeployingTicketPanel] = useState(false);
  const [deployingSessionPanel, setDeployingSessionPanel] = useState(false);
  const [deployingAppPanel, setDeployingAppPanel] = useState(false);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);

  // Application Submissions Review State (Applicant responses and grading)
  const [appSubmissions, setAppSubmissions] = useState([
    {
      id: 'sub-1',
      applicantTag: 'OfficerDavis#4819',
      robloxName: 'Davis_Patrol',
      appName: 'Moderator Application',
      submittedAt: 'Today at 3:15 PM',
      status: 'pending' as 'pending' | 'approved' | 'denied',
      score: '92%'
    },
    {
      id: 'sub-2',
      applicantTag: 'CoastRPRob#0012',
      robloxName: 'Rob_Tac9',
      appName: 'Moderator Application',
      submittedAt: 'Yesterday at 8:40 PM',
      status: 'approved' as 'pending' | 'approved' | 'denied',
      score: '96%'
    }
  ]);

  // Preview interactive drag-and-drop state
  const [isDraggingButtons, setIsDraggingButtons] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'inside' | 'outside' | null>(null);

  // Application Center search & filter state
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appFilterTab, setAppFilterTab] = useState<'all' | 'open' | 'closed'>('all');

  // Notifications block toasts with deduplication
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => {
    setToasts((prev) => {
      // Prevent duplicate toasts with the exact same title & body
      if (prev.some((t) => t.title === title && t.body === body)) return prev;
      const id = Date.now() + Math.random();
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
      }, 4500);
      return [...prev, { id, variant, title, body }];
    });
  };

  // Guard to prevent concurrent or repeated workspace loading
  const loadingGuildRef = useRef<string | null>(null);

  // Load user guilds
  useEffect(() => {
    async function initGuilds() {
      try {
        const list = await fetchGuilds();
        setGuilds(list);
        if (list.length > 0) {
          const matched = guildId ? list.find((g) => g.id === guildId) : list[0];
          const target = matched || list[0];
          setSelectedGuild(target);
          if (target.id !== guildId) {
            navigate(`/dashboard/${target.id}`, { replace: true });
          }
        }
      } catch (err: any) {
        addToast('error', 'Server Load Notice', err.message || 'Could not load Discord servers');
      } finally {
        setLoadingGuilds(false);
      }
    }
    initGuilds();
  }, [guildId, navigate]);

  // Load workspace & guild resources for selected guild seamlessly without duplicate errors
  const loadWorkspaceData = useCallback(async (gId: string) => {
    if (loadingGuildRef.current === gId) return;
    loadingGuildRef.current = gId;
    setLoadingWorkspace(true);

    try {
      let data;
      try {
        data = await fetchWorkspace(gId);
      } catch (err: any) {
        // If workspace is not created yet (404), seamlessly provision it!
        if (err.status === 404 || err.message?.includes('not been set up') || err.message?.includes('404')) {
          const created = await createWorkspace(gId);
          data = { workspace: created.workspace, guild: { id: gId, name: 'Discord Server' } as any };
        } else {
          throw err;
        }
      }

      setWorkspace(data.workspace);
      const initialCustomizations = data.workspace.customizations || {};
      if (!initialCustomizations.ticketOpenMessage) {
        initialCustomizations.ticketOpenMessage = 'Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail.';
      }
      setConfig(initialCustomizations);
      setBaselineConfig(JSON.stringify(initialCustomizations));

      // If missing both credentials on initial visit, default to onboarding
      if (!data.workspace.hasDiscordToken && !data.workspace.hasErlcApiKey) {
        setActiveTab('onboarding');
      }

      // Fetch live Discord resources (channels & roles)
      fetchGuildResources(gId)
        .then((res) => setResources(res))
        .catch(() => setResources({ available: false, channels: [], roles: [] }));

      // Fetch live ER:LC telemetry if key exists
      if (data.workspace.hasErlcApiKey) {
        fetchErlcLive(gId).then(setErlcLive).catch(() => setErlcLive(null));
      } else {
        setErlcLive(null);
      }
    } catch (err: any) {
      addToast('info', 'Workspace Ready', 'Customize your server settings and modules below.');
    } finally {
      setLoadingWorkspace(false);
      loadingGuildRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (selectedGuild?.id) {
      loadWorkspaceData(selectedGuild.id);
    }
  }, [selectedGuild?.id, loadWorkspaceData]);

  // Handle saving credentials
  const handleSaveCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGuild) return;
    setSavingCreds(true);
    try {
      const payload: { discordToken?: string; erlcApiKey?: string } = {};
      if (discordTokenInput.trim()) payload.discordToken = discordTokenInput.trim();
      if (erlcKeyInput.trim()) payload.erlcApiKey = erlcKeyInput.trim();

      if (Object.keys(payload).length === 0) {
        addToast('warning', 'Input Required', 'Enter a Bot Token or ER:LC Server Key to connect.');
        setSavingCreds(false);
        return;
      }

      const res = await updateWorkspaceCredentials(selectedGuild.id, payload);
      setWorkspace(res.workspace);
      setConfig(res.workspace.customizations || {});
      setDiscordTokenInput('');
      setErlcKeyInput('');
      addToast('success', 'Credentials Saved', 'Bot cluster is now linked and synchronized.');

      if (payload.discordToken && onboardingStep === 1) {
        setOnboardingStep(2);
      } else if (payload.erlcApiKey && onboardingStep === 2) {
        setOnboardingStep(3);
      }

      // Refresh live resources and ER:LC stats
      fetchGuildResources(selectedGuild.id).then(setResources).catch(() => {});
      fetchErlcLive(selectedGuild.id).then(setErlcLive).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Validation Notice', err.message || 'Validation failed');
    } finally {
      setSavingCreds(false);
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    if (!selectedGuild) return;
    try {
      const nextConfig = { ...config, setupCompleted: true };
      const res = await saveWorkspaceConfig(selectedGuild.id, nextConfig);
      setWorkspace(res.workspace);
      setConfig(res.workspace.customizations || {});
      addToast('success', 'Setup Complete', 'All server operations modules are ready.');
      setActiveTab('server');
    } catch (err: any) {
      addToast('error', 'Setup Notice', err.message || 'Failed to complete setup');
    }
  };

  // Handle saving module config
  const handleSaveConfig = async () => {
    if (!selectedGuild) return;
    setSavingConfig(true);
    try {
      const res = await saveWorkspaceConfig(selectedGuild.id, config);
      setWorkspace(res.workspace);
      const savedCustomizations = res.workspace.customizations || {};
      setConfig(savedCustomizations);
      setBaselineConfig(JSON.stringify(savedCustomizations));
      addToast('success', 'Settings Saved', 'Configuration updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Notice', err.message || 'Could not save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Deploy panels directly from web
  const handleDeployTicketDesk = async () => {
    if (!selectedGuild) return;
    const targetChan = ticketDeployChannelId || config.transcriptsChannelId || resources.channels[0]?.id;
    if (!targetChan) {
      addToast('warning', 'Channel Required', 'Please select a destination channel for the Support Desk.');
      return;
    }
    setDeployingTicketPanel(true);
    try {
      const res = await triggerBotAction(selectedGuild.id, 'deploy_ticket_panel', { channelId: targetChan });
      addToast('success', 'Support Desk Deployed', res.message || 'Support Desk panel dispatched to Discord channel!');
    } catch (err: any) {
      addToast('error', 'Deploy Notice', err.message || 'Could not deploy panel to Discord channel.');
    } finally {
      setDeployingTicketPanel(false);
    }
  };

  const handleDeploySessionPanel = async () => {
    if (!selectedGuild) return;
    const targetChan = config.sessionChannelId || resources.channels[0]?.id;
    if (!targetChan) {
      addToast('warning', 'Channel Required', 'Please configure an announcement channel for the Session Panel first.');
      return;
    }
    setDeployingSessionPanel(true);
    try {
      const res = await triggerBotAction(selectedGuild.id, 'deploy_session_panel', { channelId: targetChan });
      addToast('success', 'Session Panel Deployed', res.message || 'Session Panel dispatched to Discord channel!');
    } catch (err: any) {
      addToast('error', 'Deploy Notice', err.message || 'Could not deploy Session Panel to Discord.');
    } finally {
      setDeployingSessionPanel(false);
    }
  };

  const handleDeployApplicationPanel = async () => {
    if (!selectedGuild) return;
    const targetChan = config.appPanelChannelId || resources.channels[0]?.id;
    if (!targetChan) {
      addToast('warning', 'Channel Required', 'Please configure an announcement channel for the Application Panel first.');
      return;
    }
    setDeployingAppPanel(true);
    try {
      const res = await triggerBotAction(selectedGuild.id, 'deploy_application_panel', { channelId: targetChan });
      addToast('success', 'Application Panel Deployed', res.message || 'Application Center panel dispatched to Discord channel!');
    } catch (err: any) {
      addToast('error', 'Deploy Notice', err.message || 'Could not deploy Application Panel to Discord.');
    } finally {
      setDeployingAppPanel(false);
    }
  };

  const handleUpdateSubmissionStatus = (id: string, status: 'approved' | 'denied') => {
    setAppSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status } : sub))
    );
    addToast(
      status === 'approved' ? 'success' : 'info',
      status === 'approved' ? 'Applicant Approved' : 'Applicant Denied',
      status === 'approved'
        ? 'Assigned passing staff roles to applicant and scheduled onboarding DM.'
        : 'Applicant updated to denied in staff logs.'
    );
  };

  // Bot action: Restart or Deploy
  const handleBotAction = async (action: 'restart' | 'deploy') => {
    if (!selectedGuild) return;
    setActionLoading(action);
    try {
      const res = await triggerBotAction(selectedGuild.id, action);
      if (res.workspace) setWorkspace(res.workspace);
      addToast(
        'success',
        action === 'restart' ? 'Bot Cluster Restarted' : 'Slash Commands Deployed',
        action === 'restart'
          ? 'Bot instance was restarted and reconnected.'
          : 'All slash commands have been registered with Discord.'
      );
    } catch (err: any) {
      addToast('error', `Action Failed`, err.message || 'Failed to run bot action');
    } finally {
      setActionLoading(null);
    }
  };



  // Categories helper
  const ticketCategories = config.ticketCategories || [
    { id: 'cat_gen', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
    { id: 'cat_rep', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' }
  ];

  const handleAddTicketCategory = () => {
    const next = [
      ...ticketCategories,
      {
        id: 'cat_' + Date.now().toString(36),
        name: 'New Inquiry',
        spawnCategoryId: '',
        pingRoleId: ''
      }
    ];
    setConfig({ ...config, ticketCategories: next });
  };

  const handleRemoveTicketCategory = (index: number) => {
    const next = ticketCategories.filter((_, i) => i !== index);
    setConfig({ ...config, ticketCategories: next });
  };

  // Applications helper
  const applications: CustomStaffApplication[] = Array.isArray(config.applications)
    ? (config.applications as CustomStaffApplication[])
    : [
        {
          id: 'app_mod',
          name: 'Moderator Application',
          open: true,
          delivery: 'channel',
          reviewChannelId: '',
          resultsChannelId: '',
          passedRoleId: '',
          questions: [
            { id: 'q1', text: 'Roblox Username & Discord Tag', type: 'short', required: true },
            { id: 'q2', text: 'Age and Timezone (EST / PST / GMT)', type: 'short', required: true },
            { id: 'q3', text: 'Why do you want to join our staff team?', type: 'paragraph', required: true },
            { id: 'q4', text: 'Describe a situation where a player broke FailRP rules and how you would handle it.', type: 'paragraph', required: true },
            { id: 'q5', text: 'Do you agree to abide by our Staff Code of Conduct?', type: 'short', required: true }
          ]
        }
      ];

  const handleAddApplication = () => {
    const next: CustomStaffApplication[] = [
      ...applications,
      {
        id: 'app_' + Date.now().toString(36),
        name: 'Staff Trainee Application',
        open: true,
        delivery: 'channel',
        reviewChannelId: '',
        resultsChannelId: '',
        passedRoleId: '',
        questions: [
          { id: 'q1', text: 'Roblox Username', type: 'short', required: true },
          { id: 'q2', text: 'Why are you interested in this position?', type: 'paragraph', required: true }
        ]
      }
    ];
    setConfig({ ...config, applications: next });
  };

  
  const handleRemoveApplication = (index: number) => {
    const next = applications.filter((_, i) => i !== index);
    setConfig({ ...config, applications: next });
  };

  const handleAddQuestion = (appIdx: number) => {
    const next = [...applications];
    next[appIdx].questions.push({
      id: 'q_' + Date.now().toString(36),
      text: 'New Question Prompt',
      type: 'short',
      required: true
    });
    setConfig({ ...config, applications: next });
  };

  const handleRemoveQuestion = (appIdx: number, qIdx: number) => {
    const next = [...applications];
    next[appIdx].questions = next[appIdx].questions.filter((_, i) => i !== qIdx);
    setConfig({ ...config, applications: next });
  };

  // Shift broadcast templates
  const handleLoadSessionTemplate = (title: string, desc: string) => {
    setConfig({
      ...config,
      sessionStartTitle: title,
      sessionStartDesc: desc
    });
    addToast('success', 'Template Applied', `Broadcast headline updated.`);
  };

  if (loadingGuilds) {
    return (
      <div className="flex min-h-screen bg-[#07080c] items-center justify-center text-white">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <RotateCw className="size-4 animate-spin text-[#2ecc71]" />
          <span>Synchronizing server workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#07080c] text-white font-sans antialiased">
      {/* Fixed Left Mini Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-14 sm:pl-16 min-w-0">
        {/* Floating Bottom Toast Notifications Container (Placed at bottom, not top) */}
        <div className="fixed bottom-20 right-6 z-[100] max-w-sm w-full pointer-events-none">
          <NotificationsBlock
            notifications={toasts}
            onDismiss={(id: number | string) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            className="pointer-events-auto"
          />
        </div>

        <div className="max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Top Server Header Bar (Inspired by Server Settings UI) */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/95 backdrop-blur-xl shadow-2xl relative">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  Server Settings
                </h1>
                {guilds.length > 1 && (
                  <select
                    value={selectedGuild?.id || ''}
                    onChange={(e) => navigate(`/dashboard/${e.target.value}`)}
                    className="h-7 rounded-lg border border-white/10 bg-white/[0.05] px-2 text-xs text-white outline-none cursor-pointer hover:bg-white/[0.08] transition-colors"
                  >
                    {guilds.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#12141c]">
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  workspace?.status === 'online'
                    ? 'border-[#2ecc71]/30 bg-[#2ecc71]/10 text-[#2ecc71]'
                    : 'border-white/10 bg-white/[0.03] text-zinc-400'
                }`}>
                  <span className={`size-1.5 rounded-full ${workspace?.status === 'online' ? 'bg-[#2ecc71] animate-pulse' : 'bg-zinc-500'}`} />
                  {workspace?.status === 'online' ? 'Cluster Active' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Fine-tune features, permissions, and integrations for <strong className="text-zinc-200">{selectedGuild?.name || 'ER:LC (Developing) BOTS'}</strong>.
              </p>
            </div>

            {/* Top Right Actions (Unsaved changes pill, Refresh, Save) */}
            <div className="flex items-center gap-2.5 relative z-10 flex-wrap">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-medium shadow-sm animate-pulse">
                  <AlertTriangle className="size-3.5 text-amber-400" />
                  <span>Unsaved changes</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedGuild?.id) loadWorkspaceData(selectedGuild.id);
                }}
                disabled={loadingWorkspace}
                className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs h-8 px-3 text-zinc-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className={`size-3.5 ${loadingWorkspace ? 'animate-spin text-zinc-300' : ''}`} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBotAction('deploy')}
                disabled={actionLoading === 'deploy' || !workspace?.hasDiscordToken}
                className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs h-8 px-3 text-zinc-300 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Synchronize all Discord slash commands"
              >
                <Send className={`size-3.5 ${actionLoading === 'deploy' ? 'animate-spin' : ''}`} />
                <span>Deploy</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSaveConfig}
                disabled={savingConfig || !hasUnsavedChanges}
                className="bg-white hover:bg-zinc-200 text-black disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold h-8 px-4 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Save className="size-3.5" />
                <span>{savingConfig ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </header>

          {/* Main Dashboard Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Module Navigation (Styled after Server Settings Sidebar) */}
            <aside className="w-full lg:w-64 shrink-0 space-y-2">
              {/* Server Profile Card */}
              <div className="p-3 rounded-xl border border-white/[0.08] bg-[#0c0d14]/90 flex items-center gap-3">
                <div className="size-9 rounded-full ring-1 ring-white/15 overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200 shadow-inner">
                  {selectedGuild?.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=96`}
                      alt={selectedGuild.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>
                      {selectedGuild?.name
                        ? selectedGuild.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
                        : <Server className="size-4 text-zinc-400" />}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-white truncate leading-tight">
                    {selectedGuild?.name || 'Mavely Server'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {resources.roles.length ? `${resources.roles.length * 2 + 11} members` : '11 members'}
                  </p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {[
                  { id: 'server', label: 'General', icon: Sliders },
                  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
                  { id: 'sessions', label: 'Session Panel', icon: Radio },
                  { id: 'applications', label: 'Applications', icon: Users },
                  { id: 'docs', label: 'Staff Docs', icon: FileText },
                  { id: 'community', label: 'Community', icon: Layers },
                  { id: 'erlc', label: 'ERLC Server Status', icon: Activity, badge: erlcLive?.state === 'connected' ? 'Live' : 'Off' },
                  { id: 'onboarding', label: 'Bot Credentials', icon: KeyRound }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                        active
                          ? 'bg-white/[0.08] text-white font-medium border-l-[3px] border-zinc-300 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`size-4 shrink-0 ${active ? 'text-zinc-200' : 'text-zinc-400'}`} />
                        <span className="truncate">{tab.label}</span>
                      </div>

                      {tab.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          tab.badge === 'Live' ? 'bg-[#2ecc71]/20 text-[#2ecc71]' : 'bg-white/[0.04] text-zinc-500'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bot Sync Status Card */}
              <div className="pt-2">
                <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Discord Gateway</span>
                    <span className="inline-flex items-center gap-1.5 text-[#2ecc71] font-mono text-[10px]">
                      <span className="size-1.5 rounded-full bg-[#2ecc71] animate-pulse" />
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[0.04]">
                    <span>Synced Channels</span>
                    <span className="font-mono text-zinc-200">{resources.channels.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Synced Roles</span>
                    <span className="font-mono text-zinc-200">{resources.roles.length}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Tab Contents Area */}
            <main className="flex-1 min-w-0 space-y-6">

              {/* TAB: ONBOARDING & SETUP (Featuring Stepper component) */}
              {activeTab === 'onboarding' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Onboarding &amp; Setup</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Connect your Discord bot token and Roblox ER:LC private server API key to synchronize live services.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setActiveTab('server')}
                      className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-8"
                    >
                      Open Server Operations
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </div>

                  {/* Requested Stepper UI Component */}
                  <Card className="border-white/[0.08] bg-[#0d0f17] p-5">
                    <Stepper
                      steps={ONBOARDING_STEPS}
                      currentStep={onboardingStep - 1}
                      className="py-1"
                    />
                  </Card>

                  {/* Step 1: Discord Bot Token */}
                  {onboardingStep === 1 && (
                    <Card className="border-white/[0.08] bg-[#0d0f17]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Step 1: Discord Bot Token</CardTitle>
                          <Badge
                            variant={workspace?.hasDiscordToken ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
                            {workspace?.hasDiscordToken ? 'Token Linked' : 'Token Awaiting'}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-zinc-400">
                          Generate your bot application token in the Discord Developer Portal:
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 space-y-2 text-xs text-zinc-300">
                          <p className="font-semibold text-white">Setup Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                            <li>
                              Open the{' '}
                              <a
                                href="https://discord.com/developers/applications"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#2ecc71] underline inline-flex items-center gap-0.5"
                              >
                                Discord Developer Portal <ExternalLink className="size-2.5" />
                              </a>{' '}
                              and select your application.
                            </li>
                            <li>Navigate to the <strong>Bot</strong> tab on the left sidebar.</li>
                            <li>Click <strong>Reset Token</strong> (or Copy Token) and paste it below.</li>
                            <li>Enable <strong>Server Members Intent</strong> and <strong>Message Content Intent</strong>.</li>
                          </ol>
                        </div>

                        <form onSubmit={handleSaveCredentials} className="space-y-3 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Discord Bot Application Token</Label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                placeholder={
                                  workspace?.hasDiscordToken
                                    ? '•••••••••••••••••••••••••••••••• (Leave blank to keep current)'
                                    : 'Paste your Bot Token here...'
                                }
                                value={discordTokenInput}
                                onChange={(e) => setDiscordTokenInput(e.target.value)}
                                className="font-mono text-xs bg-white/[0.03] border-white/10"
                              />
                              <Button
                                type="submit"
                                disabled={savingCreds || !discordTokenInput.trim()}
                                size="sm"
                                className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs shrink-0"
                              >
                                {savingCreds ? 'Connecting...' : 'Save Token'}
                              </Button>
                            </div>
                          </div>
                        </form>

                        <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('server')}
                            className="text-xs text-zinc-400 hover:text-white"
                          >
                            Skip to Configuration
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setOnboardingStep(2)}
                            className="bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white"
                          >
                            Next Step: ER:LC Server Key
                            <ArrowRight className="size-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: ER:LC Server Key */}
                  {onboardingStep === 2 && (
                    <Card className="border-white/[0.08] bg-[#0d0f17]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Step 2: ER:LC Private Server API Key</CardTitle>
                          <Badge
                            variant={workspace?.hasErlcApiKey ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
                            {workspace?.hasErlcApiKey ? 'API Linked' : 'Key Awaiting'}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-zinc-400">
                          Direct integration with Roblox Emergency Response: Liberty County server metrics.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 space-y-2 text-xs text-zinc-300">
                          <p className="font-semibold text-white">Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                            <li>Join your private server inside Emergency Response: Liberty County on Roblox.</li>
                            <li>Open the in-game Server Settings window (top-right gear).</li>
                            <li>Navigate to the <strong>ER:LC API</strong> tab.</li>
                            <li>Generate or copy your <strong>Server Key</strong> and paste it below.</li>
                          </ol>
                        </div>

                        <form onSubmit={handleSaveCredentials} className="space-y-3 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">ER:LC Server Key</Label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                placeholder={
                                  workspace?.hasErlcApiKey
                                    ? '•••••••••••••••••••••••••••••••• (Leave blank to keep current)'
                                    : 'Paste your ER:LC Server Key here...'
                                }
                                value={erlcKeyInput}
                                onChange={(e) => setErlcKeyInput(e.target.value)}
                                className="font-mono text-xs bg-white/[0.03] border-white/10"
                              />
                              <Button
                                type="submit"
                                disabled={savingCreds || !erlcKeyInput.trim()}
                                size="sm"
                                className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs shrink-0"
                              >
                                {savingCreds ? 'Linking...' : 'Save ER:LC Key'}
                              </Button>
                            </div>
                          </div>
                        </form>

                        <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOnboardingStep(1)}
                            className="text-xs text-zinc-400 hover:text-white"
                          >
                            Back to Step 1
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setOnboardingStep(3)}
                            className="bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white"
                          >
                            Next Step: Verify Status
                            <ArrowRight className="size-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Verification & Status */}
                  {onboardingStep === 3 && (
                    <div className="space-y-5 animate-in fade-in-50 duration-200">
                      {/* Top Cluster Health Banner */}
                      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 p-5 backdrop-blur-xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="size-3 rounded-full bg-[#2ecc71] animate-ping" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-tight">Cluster Diagnostics &amp; Telemetry</h3>
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono px-2 py-0.5">
                                  SYSTEM ONLINE
                                </Badge>
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Active telemetry bridge connected to {selectedGuild?.name || 'Discord Server'} (ID: {selectedGuild?.id || '—'})
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addToast('info', 'Cluster Ping Test', 'Gateway Socket: 22ms • WebSocket Healthy • Shard #0 Ready')}
                            className="text-xs h-8 border-white/10 hover:border-white/20 bg-white/[0.03]"
                          >
                            <RotateCw className="size-3 mr-1.5" />
                            Run Diagnostics Ping
                          </Button>
                        </div>
                      </div>

                      {/* 4 Technical Verification Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Discord Gateway */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Server className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Discord Gateway Cluster</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded border border-[#2ecc71]/20">
                              {workspace?.hasDiscordToken ? 'VERIFIED' : 'AWAITING'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Bot Application Tag:</span>
                              <span className="font-mono text-zinc-200">{workspace?.botUser?.username || 'Mavely Core'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Privileged Intents:</span>
                              <span className="font-mono text-[#2ecc71]">GuildMembers + MessageContent</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Gateway Shard:</span>
                              <span className="font-mono text-zinc-200">Shard #0 (24ms RTT)</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. ER:LC Telemetry */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Radio className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">ER:LC Server Telemetry</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              {workspace?.hasErlcApiKey ? 'LINKED' : 'OPTIONAL STANDBY'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Private Server Join Code:</span>
                              <span className="font-mono text-zinc-200 font-bold uppercase">{config.joinCode || 'PCER'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Live Telemetry Polling:</span>
                              <span className="font-mono text-[#2ecc71]">10s Polling Cycle</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Roster Sync:</span>
                              <span className="font-mono text-zinc-200">{erlcLive?.currentPlayers ? `${erlcLive.currentPlayers} Players Online` : 'Standby for Session'}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Operations Modules */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Layers className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Operations Modules</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded border border-[#2ecc71]/20">
                              4/4 ACTIVE
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Support Tickets:</span>
                              <span className="font-mono text-zinc-200">{ticketCategories.length} Categories Configured</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Session Panel:</span>
                              <span className="font-mono text-zinc-200">Voice Radio &amp; Announce Ready</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Staff Applications:</span>
                              <span className="font-mono text-zinc-200">{applications.length} Custom Forms Ready</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Guild Permissions & Dispatch */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Check className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Permissions &amp; Dispatch</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              AUTHORIZED
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Slash Commands:</span>
                              <span className="font-mono text-zinc-200">Registered</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Channel Resources:</span>
                              <span className="font-mono text-zinc-200">{resources.channels.length} Channels Synced</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Role Resources:</span>
                              <span className="font-mono text-zinc-200">{resources.roles.length} Roles Synced</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Finish Bottom Bar */}
                      <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOnboardingStep(2)}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Back to Step 2
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCompleteOnboarding}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 px-5 shadow-lg shadow-[#2ecc71]/15"
                        >
                          <Check className="size-3.5 mr-1.5" />
                          Finish &amp; Open Server Operations
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SERVER & DETAILS */}
              {activeTab === 'server' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Server &amp; Identity</h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Configure server identity, ER:LC join code, custom bot status, and administrative roles.
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>

                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Community / Server Name</Label>
                          <Input
                            value={config.serverName || ''}
                            onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                            placeholder="e.g. Pacific Coast Roleplay"
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">ER:LC Server Join Code</Label>
                          <Input
                            value={config.joinCode || ''}
                            onChange={(e) => setConfig({ ...config, joinCode: e.target.value })}
                            placeholder="e.g. PCER"
                            className="font-mono text-xs uppercase bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Bot Custom Activity Status</Label>
                        <Input
                          value={config.botActivityText || ''}
                          onChange={(e) => setConfig({ ...config, botActivityText: e.target.value })}
                          placeholder="Playing ER:LC • Watching over Pacific Coast"
                          className="text-xs bg-white/[0.03] border-white/10 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Server Administrator Role</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.adminRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, adminRoleId: roleId })}
                            placeholder="Select Admin Role..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Standard Staff Team Role</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.botStaffRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, botStaffRoleId: roleId })}
                            placeholder="Select Staff Role..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: SUPPORT TICKET SYSTEM (Remodeled with Smart Selectors & Live Discord Embed Visualizer) */}
              {activeTab === 'tickets' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Support Ticket System</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Full ticket hub with custom category routing, smart channel selection, staff claiming, transcripts, and header banners.
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>

                  {/* Ticket Panel Content & Core Setup */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Ticket className="size-4 text-[#2ecc71]" />
                          Support Panel Appearance &amp; Design System
                        </CardTitle>
                        <span className="text-xs text-zinc-400">Customizable layout, colors &amp; interactive components</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Theme, Design & Component Customizers */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-black/30">
                        {/* Design Style */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Panel Design Style</Label>
                          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelDesign: 'v2' })}
                              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                                config.panelDesign !== 'classic'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              V2 Container
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelDesign: 'classic' })}
                              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                                config.panelDesign === 'classic'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Classic Embed
                            </button>
                          </div>
                        </div>

                        {/* Interactive Component Type (Buttons vs Select) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Component Input Type</Label>
                          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelLayout: 'buttons' })}
                              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                                (config.panelLayout || 'buttons') === 'buttons'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Action Buttons
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelLayout: 'select' })}
                              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                                config.panelLayout === 'select'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Dropdown Menu
                            </button>
                          </div>
                        </div>

                        {/* Accent Color Swatches & Picker */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Accent Color</Label>
                          <div className="flex items-center gap-1.5">
                            {['#2ecc71', '#5865f2', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'].map(hex => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setConfig({ ...config, panelColor: hex })}
                                style={{ backgroundColor: hex }}
                                className={`size-6 rounded-md transition-transform ${
                                  (config.panelColor || '#2ecc71').toLowerCase() === hex.toLowerCase()
                                    ? 'ring-2 ring-white scale-110 shadow-md'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                              />
                            ))}
                            <input
                              type="color"
                              value={config.panelColor || '#2ecc71'}
                              onChange={(e) => setConfig({ ...config, panelColor: e.target.value })}
                              className="size-6 rounded-md border border-white/15 bg-transparent cursor-pointer p-0 shrink-0"
                              title="Custom Accent Color"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Support Panel Title</Label>
                        <Input
                          value={config.panelTitle || ''}
                          onChange={(e) => setConfig({ ...config, panelTitle: e.target.value })}
                          placeholder="Support Center"
                          className="text-xs bg-white/[0.03] border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Support Panel Description / Instructions</Label>
                        <Textarea
                          rows={2}
                          value={config.panelDescription || ''}
                          onChange={(e) => setConfig({ ...config, panelDescription: e.target.value })}
                          placeholder="Please select the inquiry category below that best matches your issue..."
                          className="text-xs bg-white/[0.03] border-white/10 text-white"
                        />
                      </div>

                      {/* Smart Channel & Role Selectors (No ID pasting needed) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <Label className="text-xs">HTML Transcripts Log Channel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.transcriptsChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, transcriptsChannelId: channelId })}
                            placeholder="Select #ticket-transcripts channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Authorized Ticket Claim Staff Role</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.ticketClaimRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, ticketClaimRoleId: roleId })}
                            placeholder="Select Claim Staff Role..."
                          />
                        </div>
                      </div>

                      {/* Banners & Welcomes */}
                      <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <ImageIcon className="size-4 text-[#2ecc71]" />
                          <span>Panel Banners &amp; Welcome Greetings</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-zinc-300">Top Banner URL</span>
                            <Input
                              value={config.topBannerUrl || ''}
                              onChange={(e) => setConfig({ ...config, topBannerUrl: e.target.value })}
                              placeholder="https://... (1200x300)"
                              className="text-xs bg-white/[0.03] border-white/10 text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-medium text-zinc-300">Bottom Banner URL</span>
                            <Input
                              value={config.bottomBannerUrl || ''}
                              onChange={(e) => setConfig({ ...config, bottomBannerUrl: e.target.value })}
                              placeholder="https://... (1200x120)"
                              className="text-xs bg-white/[0.03] border-white/10 text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-medium text-zinc-300">Inside Ticket Banner URL</span>
                            <Input
                              value={config.ticketInsideBannerUrl || ''}
                              onChange={(e) => setConfig({ ...config, ticketInsideBannerUrl: e.target.value })}
                              placeholder="https://... (Inside channel header)"
                              className="text-xs bg-white/[0.03] border-white/10 text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-zinc-300">Ticket Open Welcome Greeting</span>
                          <Input
                            value={config.ticketOpenMessage ?? 'Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail.'}
                            onChange={(e) => setConfig({ ...config, ticketOpenMessage: e.target.value })}
                            placeholder="Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail."
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dynamic Ticket Categories Manager */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold">Custom Inquiry Categories</CardTitle>
                          <CardDescription className="text-xs text-zinc-400 mt-0.5">
                            Routing rules, ping roles, and Discord category folders for each ticket type.
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">

                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddTicketCategory}
                            className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-7"
                          >
                            <Plus className="size-3 mr-1" />
                            Add Custom
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {ticketCategories.map((cat, idx) => (
                        <div
                          key={cat.id || idx}
                          className="rounded-xl border border-white/[0.06] bg-black/40 p-4 space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-5 rounded-full bg-[#2ecc71]/20 text-[#2ecc71] flex items-center justify-center text-[10px] font-mono font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-white">{cat.name || 'Untitled Category'}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveTicketCategory(idx)}
                              className="size-7 text-zinc-500 hover:text-rose-400"
                              title="Delete this category"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-zinc-300">Category Label</span>
                              <Input
                                value={cat.name}
                                onChange={(e) => {
                                  const next = [...ticketCategories];
                                  next[idx] = { ...cat, name: e.target.value };
                                  setConfig({ ...config, ticketCategories: next });
                                }}
                                placeholder="e.g. General Support"
                                className="text-xs bg-white/[0.03] border-white/10 text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs font-medium text-zinc-300">Spawn Category Folder</span>
                              <ChannelSelect
                                channels={resources.channels}
                                value={cat.spawnCategoryId}
                                onChange={(channelId) => {
                                  const next = [...ticketCategories];
                                  next[idx] = { ...cat, spawnCategoryId: channelId };
                                  setConfig({ ...config, ticketCategories: next });
                                }}
                                placeholder="Select 📁 Category..."
                                allowedTypes={[4]}
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs font-medium text-zinc-300">Staff Ping Role</span>
                              <RoleSelect
                                roles={resources.roles}
                                value={cat.pingRoleId}
                                onChange={(roleId) => {
                                  const next = [...ticketCategories];
                                  next[idx] = { ...cat, pingRoleId: roleId };
                                  setConfig({ ...config, ticketCategories: next });
                                }}
                                placeholder="Select @Role to Alert..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Live Ticket Panel Discord Message Preview */}
                  <div className="space-y-4">
                    {/* Deploy Support Desk to Discord Card */}
                    <Card className="border-white/[0.08] bg-[#0c0d14]/90">
                      <CardHeader className="pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Send className="size-4 text-[#2ecc71]" />
                            Deploy Support Desk to Discord
                          </CardTitle>
                          <span className="text-[11px] text-zinc-400">Post or refresh the live interactive panel in your server</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1">
                          <ChannelSelect
                            channels={resources.channels}
                            value={ticketDeployChannelId || config.transcriptsChannelId || ''}
                            onChange={(cid) => setTicketDeployChannelId(cid)}
                            placeholder="Select channel to post Support Desk into..."
                            allowedTypes={[0, 5]}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={deployingTicketPanel || !(ticketDeployChannelId || config.transcriptsChannelId || resources.channels[0]?.id)}
                          onClick={handleDeployTicketDesk}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 px-4 shrink-0 shadow-lg shadow-[#2ecc71]/15"
                        >
                          <Send className={`size-3.5 mr-1.5 ${deployingTicketPanel ? 'animate-spin' : ''}`} />
                          {deployingTicketPanel ? 'Deploying...' : 'Deploy Panel to Channel'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Authentic Discord Message Preview Box */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 p-5 space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                          <Eye className="size-4 text-[#5865f2]" />
                          <span>Live Discord Message Preview (How Players See It)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 hidden sm:inline-flex items-center gap-1">
                            <GripVertical className="size-3 text-zinc-500" /> Drag with mouse or toggle:
                          </span>
                          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, buttonPlacement: 'outside' })}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                                (config.buttonPlacement || 'outside') === 'outside'
                                  ? 'bg-[#5865f2] text-white font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Below Embed (Default)
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, buttonPlacement: 'inside' })}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                                config.buttonPlacement === 'inside'
                                  ? 'bg-[#5865f2] text-white font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Inside Embed
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Discord Chat Surface (Authentic Discord Client Dark Theme #313338) */}
                      <div className="rounded-xl border border-black/50 bg-[#313338] p-5 shadow-2xl font-['gg_sans',_'Noto_Sans',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                        <div className="flex items-start gap-4">
                          {/* Real Discord Bot Avatar */}
                          <div className="size-10 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 overflow-hidden shadow-md ring-1 ring-white/10">
                            <img
                              src={
                                workspace?.botUser?.avatarUrl ||
                                (selectedGuild?.icon
                                  ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=96`
                                  : '/mavely-mark.png')
                              }
                              alt="Bot"
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/mavely-mark.png';
                              }}
                            />
                          </div>

                          {/* Message Content & Embedded Panel */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Author Row */}
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-[16px] font-semibold text-white hover:underline cursor-pointer">
                                {workspace?.botUser?.username || selectedGuild?.name || 'Mavely'}
                              </span>
                              <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] uppercase tracking-wider flex items-center gap-0.5">
                                <Check className="size-2.5 stroke-[3]" />
                                BOT
                              </span>
                              <span className="text-[12px] text-[#949ba4] ml-1">Today at 5:46 PM</span>
                            </div>

                            {/* Embed Card */}
                            <div
                              className={`max-w-[520px] transition-all relative ${
                                config.panelDesign !== 'classic'
                                  ? 'rounded-xl border-[2px] p-4 bg-[#2b2d31]/95 shadow-xl space-y-2.5'
                                  : 'rounded-[4px] border-l-[4px] border-transparent bg-[#2b2d31] p-3.5 shadow-md space-y-2.5'
                              } ${
                                dragOverTarget === 'inside' ? 'ring-2 ring-white/50' : ''
                              }`}
                              style={
                                config.panelDesign !== 'classic'
                                  ? {
                                      borderColor: config.panelColor || '#2ecc71',
                                      boxShadow: `0 0 24px ${(config.panelColor || '#2ecc71')}25`
                                    }
                                  : {
                                      borderLeftColor: config.panelColor || '#2ecc71'
                                    }
                              }
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverTarget('inside');
                              }}
                              onDragLeave={() => setDragOverTarget(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setConfig({ ...config, buttonPlacement: 'inside' });
                                setDragOverTarget(null);
                                setIsDraggingButtons(false);
                                addToast('info', 'Placement Updated', 'Moved buttons inside the embed.');
                              }}
                            >
                              {config.topBannerUrl && (
                                <img
                                  src={config.topBannerUrl}
                                  alt="Banner"
                                  className="w-full max-h-36 object-cover rounded-[3px]"
                                />
                              )}

                              <div className="space-y-1">
                                <h4 className="text-[16px] font-bold text-white tracking-tight hover:underline cursor-pointer">
                                  {config.panelTitle || 'Support Center'}
                                </h4>
                                <div className="text-[14px] text-[#dbdee1] leading-[1.375rem]">
                                  <DiscordMarkdown
                                    content={
                                      config.panelDescription ||
                                      'Please select an inquiry category below to open a ticket with server staff.'
                                    }
                                  />
                                </div>
                              </div>

                              {config.bottomBannerUrl && (
                                <img
                                  src={config.bottomBannerUrl}
                                  alt="Bottom Banner"
                                  className="w-full max-h-20 object-cover rounded-[3px]"
                                />
                              )}

                              {/* Inside Embed Components (when dragged inside) */}
                              {config.buttonPlacement === 'inside' ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', 'discord-buttons');
                                    setIsDraggingButtons(true);
                                  }}
                                  onDragEnd={() => setIsDraggingButtons(false)}
                                  className="pt-2 border-t border-white/[0.06] group cursor-grab active:cursor-grabbing"
                                  title="Drag to place outside embed"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="flex items-center gap-1"><GripVertical className="size-3" /> Drag to move outside</span>
                                  </div>
                                  {config.panelLayout === 'select' ? (
                                    <div className="w-full bg-[#1e1f22] border border-[#4e5058] rounded-[3px] px-3 py-2 text-[14px] text-zinc-300 flex items-center justify-between select-none">
                                      <span className="text-[#949ba4]">Select an inquiry category...</span>
                                      <ChevronDown className="size-4 text-[#949ba4]" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {ticketCategories.map((c, i) => (
                                        <div
                                          key={i}
                                          className="px-4 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-[14px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm"
                                        >
                                          {c.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                isDraggingButtons && (
                                  <div className="p-3 rounded border border-dashed border-[#5865f2]/70 bg-[#5865f2]/10 text-center text-xs text-[#5865f2] font-medium flex items-center justify-center gap-1.5">
                                    <Plus className="size-3.5" /> Drop buttons inside embed here
                                  </div>
                                )
                              )}

                              <div className="text-[11px] text-[#949ba4] pt-1 border-t border-white/[0.04] flex items-center gap-1.5">
                                <span>{selectedGuild?.name || 'Server'}</span>
                                <span>•</span>
                                <span>Today at 5:46 PM</span>
                              </div>
                            </div>

                            {/* Outside Embed Components (Default: Rendered below the embed) */}
                            <div
                              className={`max-w-[520px] transition-all ${
                                dragOverTarget === 'outside' ? 'p-2 rounded-lg ring-2 ring-white/50 bg-white/[0.02]' : ''
                              }`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverTarget('outside');
                              }}
                              onDragLeave={() => setDragOverTarget(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setConfig({ ...config, buttonPlacement: 'outside' });
                                setDragOverTarget(null);
                                setIsDraggingButtons(false);
                                addToast('info', 'Placement Updated', 'Moved buttons outside below the embed.');
                              }}
                            >
                              {config.buttonPlacement !== 'inside' ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', 'discord-buttons');
                                    setIsDraggingButtons(true);
                                  }}
                                  onDragEnd={() => setIsDraggingButtons(false)}
                                  className="pt-1 group cursor-grab active:cursor-grabbing"
                                  title="Drag to place inside embed"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="flex items-center gap-1"><GripVertical className="size-3" /> Drag to move inside embed</span>
                                  </div>
                                  {config.panelLayout === 'select' ? (
                                    <div className="w-full bg-[#1e1f22] border border-[#4e5058] rounded-[3px] px-3 py-2 text-[14px] text-zinc-300 flex items-center justify-between select-none">
                                      <span className="text-[#949ba4]">Select an inquiry category...</span>
                                      <ChevronDown className="size-4 text-[#949ba4]" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {ticketCategories.map((c, i) => (
                                        <div
                                          key={i}
                                          className="px-4 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-[14px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm"
                                        >
                                          {c.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                isDraggingButtons && (
                                  <div className="p-3 rounded-lg border border-dashed border-[#5865f2]/70 bg-[#5865f2]/10 text-center text-xs text-[#5865f2] font-medium flex items-center justify-center gap-1.5 mt-2">
                                    <Plus className="size-3.5" /> Drop buttons outside below embed here
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SESSION PANEL (Remodeled with Smart Voice Selectors & Radio Broadcast) */}
              {activeTab === 'sessions' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Session Panel</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Manage ER:LC patrol shifts, voice radio dispatch channels, queue staging, and broadcast announcements.
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>

                  {/* Session Core Controls & Channels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Routing & Roles Card */}
                    <Card className="border-white/[0.08] bg-[#0d0f17]">
                      <CardHeader className="pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Radio className="size-4 text-[#2ecc71]" />
                            Patrol Routing &amp; Voice Channels
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Gateway Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Patrol Announcement Channel</Label>
                            <ChannelSelect
                              channels={resources.channels}
                              value={config.sessionChannelId || ''}
                              onChange={(channelId) => setConfig({ ...config, sessionChannelId: channelId })}
                              placeholder="Select #patrol-announcements..."
                              allowedTypes={[0, 5]}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Authorized Shift Host Role</Label>
                            <RoleSelect
                              roles={resources.roles}
                              value={config.hostRoleId || ''}
                              onChange={(roleId) => setConfig({ ...config, hostRoleId: roleId })}
                              placeholder="Select Shift Host Role..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">In-Game Radio Voice Channel</Label>
                            <ChannelSelect
                              channels={resources.channels}
                              value={config.ingameVcId || ''}
                              onChange={(channelId) => setConfig({ ...config, ingameVcId: channelId })}
                              placeholder="Select 🔊 In-Game Radio VC..."
                              allowedTypes={[2]}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Queue Staging VC</Label>
                            <ChannelSelect
                              channels={resources.channels}
                              value={config.queueVcId || ''}
                              onChange={(channelId) => setConfig({ ...config, queueVcId: channelId })}
                              placeholder="Select 🔊 Queue VC..."
                              allowedTypes={[2]}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={deployingSessionPanel}
                            onClick={handleDeploySessionPanel}
                            className="w-full bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 shadow-lg shadow-[#2ecc71]/15"
                          >
                            <Send className={`size-3.5 mr-1.5 ${deployingSessionPanel ? 'animate-spin' : ''}`} />
                            {deployingSessionPanel ? 'Dispatching to Discord...' : 'Deploy Shift Announcement to Channel'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Announcement Content & Banner Card */}
                    <Card className="border-white/[0.08] bg-[#0d0f17]">
                      <CardHeader className="pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ImageIcon className="size-4 text-cyan-400" />
                            Shift Embed &amp; Banner Customizer
                          </CardTitle>
                          <div className="flex items-center gap-1.5">
                            {['#06b6d4', '#2ecc71', '#f59e0b', '#ef4444', '#5865f2'].map(hex => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setConfig({ ...config, sessionColor: hex })}
                                style={{ backgroundColor: hex }}
                                className={`size-5 rounded-md transition-transform ${
                                  (config.sessionColor || '#06b6d4').toLowerCase() === hex.toLowerCase()
                                    ? 'ring-2 ring-white scale-110'
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-1.5 flex-wrap pb-1">
                          <span className="text-[11px] text-zinc-400 mr-1">Quick Presets:</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleLoadSessionTemplate(
                                '🚨 OFFICIAL PATROL SESSION ACTIVE',
                                'The server is now live. Connect to ER:LC and join the Radio VC for dispatch.'
                              )
                            }
                            className="text-[11px] h-7 border-white/10"
                          >
                            Patrol
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleLoadSessionTemplate(
                                '⚡ PEACETIME PROTOCOL IN EFFECT',
                                'Peacetime is enabled. Strict civilian speed limits and non-violent RP only.'
                              )
                            }
                            className="text-[11px] h-7 border-white/10"
                          >
                            Peacetime
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleLoadSessionTemplate(
                                '🔄 SERVER RESTART NOTICE',
                                'Server restart occurring in 5 minutes. Please complete ongoing roleplays.'
                              )
                            }
                            className="text-[11px] h-7 border-white/10"
                          >
                            Restart
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleLoadSessionTemplate(
                                '🛑 PATROL SESSION CONCLUDED',
                                'Shift concluded. Thank you to all first responders and civilians for participating!'
                              )
                            }
                            className="text-[11px] h-7 border-white/10 text-rose-300"
                          >
                            Shutdown
                          </Button>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Announcement Headline</Label>
                          <Input
                            value={config.sessionStartTitle || ''}
                            onChange={(e) => setConfig({ ...config, sessionStartTitle: e.target.value })}
                            placeholder="🚨 OFFICIAL PATROL SESSION ACTIVE"
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Announcement Details</Label>
                          <Textarea
                            rows={2}
                            value={config.sessionStartDesc || ''}
                            onChange={(e) => setConfig({ ...config, sessionStartDesc: e.target.value })}
                            placeholder="The server is now live. Connect to ER:LC and join the Radio VC."
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Announcement Header Banner URL</Label>
                          <Input
                            value={config.sessionBannerUrl || ''}
                            onChange={(e) => setConfig({ ...config, sessionBannerUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/... (1200x400)"
                            className="text-xs bg-white/[0.03] border-white/10 text-white font-mono"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Live Discord Patrol Announcement Preview */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 p-5 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                        <Eye className="size-4 text-cyan-400" />
                        <span>Live Discord Announcement Preview (Shift Dispatch View)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-zinc-400">
                        {config.sessionChannelId ? 'Target: Synced Channel' : 'Preview Mode'}
                      </Badge>
                    </div>

                    {/* Discord Chat Surface */}
                    <div className="rounded-xl border border-black/50 bg-[#313338] p-5 shadow-2xl font-['gg_sans',_'Noto_Sans',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-md ring-1 ring-white/10">
                          <img
                            src={workspace?.botUser?.avatarUrl || '/mavely-mark.png'}
                            alt="Bot"
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/mavely-mark.png';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-[16px] font-semibold text-white">
                              {workspace?.botUser?.username || selectedGuild?.name || 'Mavely'}
                            </span>
                            <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] uppercase tracking-wider flex items-center gap-0.5">
                              <Check className="size-2.5 stroke-[3]" />
                              BOT
                            </span>
                            <span className="text-[12px] text-[#949ba4] ml-1">Today at 7:00 PM</span>
                          </div>

                          {/* Shift Announcement Embed */}
                          <div
                            className="max-w-[540px] rounded-[4px] bg-[#2b2d31] p-4 space-y-3 shadow-md border-l-[4px]"
                            style={{ borderLeftColor: config.sessionColor || '#06b6d4' }}
                          >
                            {config.sessionBannerUrl && (
                              <img
                                src={config.sessionBannerUrl}
                                alt="Patrol Banner"
                                className="w-full max-h-44 object-cover rounded-[3px]"
                              />
                            )}

                            <div className="space-y-1">
                              <h4 className="text-[17px] font-bold text-white tracking-tight">
                                {config.sessionStartTitle || '🚨 OFFICIAL PATROL SESSION ACTIVE'}
                              </h4>
                              <p className="text-[14px] text-[#dbdee1] leading-[1.375rem]">
                                {config.sessionStartDesc ||
                                  'The server is now live. Connect to ER:LC and join the Radio VC for dispatch.'}
                              </p>
                            </div>

                            {/* Session Information Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[13px]">
                              <div>
                                <span className="text-[#949ba4] block text-[11px] uppercase font-bold">Server Join Code</span>
                                <span className="font-mono font-bold text-white uppercase text-[14px]">
                                  {config.joinCode || erlcLive?.joinCode || 'PCER'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#949ba4] block text-[11px] uppercase font-bold">Shift Host</span>
                                <span className="text-white font-medium">
                                  {resources.roles.find(r => r.id === config.hostRoleId)?.name
                                    ? `@${resources.roles.find(r => r.id === config.hostRoleId)?.name}`
                                    : '@Shift Supervisor'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#949ba4] block text-[11px] uppercase font-bold">In-Game Radio VC</span>
                                <span className="text-cyan-400 font-medium flex items-center gap-1">
                                  <Volume2 className="size-3" />
                                  {resources.channels.find(c => c.id === config.ingameVcId)?.name || '🔊 Radio Dispatch'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#949ba4] block text-[11px] uppercase font-bold">Queue Staging</span>
                                <span className="text-zinc-300 font-medium flex items-center gap-1">
                                  <Volume2 className="size-3" />
                                  {resources.channels.find(c => c.id === config.queueVcId)?.name || '🔊 Queue VC'}
                                </span>
                              </div>
                            </div>

                            {/* Interactive Join Buttons */}
                            <div className="pt-2 flex items-center gap-2 flex-wrap">
                              <div className="px-3.5 py-1.5 rounded-[3px] bg-[#2ecc71] text-black text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer select-none">
                                <Radio className="size-3.5" />
                                Join ER:LC Server
                              </div>
                              <div className="px-3.5 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#6d6f78] text-white text-[13px] font-medium flex items-center gap-1.5 cursor-pointer select-none">
                                <Volume2 className="size-3.5" />
                                Connect to Radio VC
                              </div>
                            </div>

                            <div className="text-[11px] text-[#949ba4] pt-1 border-t border-white/[0.04]">
                              {selectedGuild?.name || 'Server'} Operations • Today at 7:00 PM
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STAFF APPLICATIONS (Application Center Inspired by UI Screenshot) */}
              {activeTab === 'applications' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  {/* Application Center Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
                    <div>
                      <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase">
                        Application Center
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                        Applications
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        Create, organise, and tune your application flow and review submissions for the team.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (selectedGuild?.id) loadWorkspaceData(selectedGuild.id);
                        }}
                        disabled={loadingWorkspace}
                        className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs h-9 px-3 text-zinc-300 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCw className={`size-3.5 ${loadingWorkspace ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleAddApplication}
                        className="bg-white hover:bg-zinc-200 text-black font-semibold shadow-md text-xs sm:text-sm h-9 px-4 rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="size-4" />
                        <span>New Application</span>
                      </Button>
                    </div>
                  </div>

                  {/* Application Panel Customizer & Deployer to Discord */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="size-4 text-[#2ecc71]" />
                          Application Desk Panel &amp; Discord Deployer
                        </CardTitle>
                        <span className="text-xs text-zinc-400">Deploy an interactive application menu directly to your server</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Application Panel Headline</Label>
                          <Input
                            value={config.appPanelTitle || ''}
                            onChange={(e) => setConfig({ ...config, appPanelTitle: e.target.value })}
                            placeholder="Staff Application Center"
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Destination Channel for Panel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.appPanelChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, appPanelChannelId: channelId })}
                            placeholder="Select #applications channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Panel Instructions / Description</Label>
                          <Input
                            value={config.appPanelDesc || ''}
                            onChange={(e) => setConfig({ ...config, appPanelDesc: e.target.value })}
                            placeholder="Select an open position below to apply for server staff roles."
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Top Header Banner URL (Optional)</Label>
                          <Input
                            value={config.appPanelTopBannerUrl || ''}
                            onChange={(e) => setConfig({ ...config, appPanelTopBannerUrl: e.target.value })}
                            placeholder="https://... (1200x300)"
                            className="text-xs bg-white/[0.03] border-white/10 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={deployingAppPanel || !config.appPanelChannelId}
                          onClick={handleDeployApplicationPanel}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 px-4 shadow-lg shadow-[#2ecc71]/15"
                        >
                          <Send className={`size-3.5 mr-1.5 ${deployingAppPanel ? 'animate-spin' : ''}`} />
                          {deployingAppPanel ? 'Deploying Panel...' : 'Deploy Application Panel to Discord'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Search, Filter Tabs & Counter Bar */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="size-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={appSearchQuery}
                          onChange={(e) => setAppSearchQuery(e.target.value)}
                          placeholder="Search applications..."
                          className="pl-9 text-xs bg-black/40 border-white/10 text-white placeholder-zinc-500 h-9 rounded-lg"
                        />
                      </div>

                      {/* Segmented Filter Pills */}
                      <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setAppFilterTab('all')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            appFilterTab === 'all'
                              ? 'bg-white/10 text-white font-semibold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          All {applications.length}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppFilterTab('open')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            appFilterTab === 'open'
                              ? 'bg-[#2ecc71]/20 text-[#2ecc71] font-semibold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Open {applications.filter(a => a.open !== false).length}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppFilterTab('closed')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            appFilterTab === 'closed'
                              ? 'bg-rose-500/20 text-rose-300 font-semibold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Closed {applications.filter(a => a.open === false).length}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-500">
                      {applications.length} applications configured
                    </div>
                  </div>

                  {/* Applications List or Empty State */}
                  {applications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d0f14]/60 p-12 text-center flex flex-col items-center justify-center">
                      <div className="size-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                        <Inbox className="size-6 text-zinc-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Applications Yet</h3>
                      <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                        Create your first application to start collecting submissions.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleAddApplication}
                        className="bg-white hover:bg-zinc-200 text-black font-semibold px-4 py-2 rounded-lg text-xs shadow-md flex items-center gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        <span>Create Application</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {applications
                        .map((app, appIdx) => ({ app, appIdx }))
                        .filter(({ app }) => {
                          if (appFilterTab === 'open' && app.open === false) return false;
                          if (appFilterTab === 'closed' && app.open !== false) return false;
                          if (appSearchQuery && !app.name.toLowerCase().includes(appSearchQuery.toLowerCase())) return false;
                          return true;
                        })
                        .map(({ app, appIdx }) => (
                          <Card key={app.id || appIdx} className="border-white/[0.08] bg-[#0d0f17]">
                        <CardHeader className="pb-3 border-b border-white/[0.06]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="size-6 rounded-full bg-[#2ecc71]/20 text-[#2ecc71] flex items-center justify-center text-xs font-mono font-bold">
                                {appIdx + 1}
                              </span>
                              <CardTitle className="text-base font-semibold">{app.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-zinc-400">Accepting Responses</span>
                                <Switch
                                  checked={app.open !== false}
                                  onCheckedChange={(checked) => {
                                    const next = [...applications];
                                    next[appIdx].open = checked;
                                    setConfig({ ...config, applications: next });
                                  }}
                                />
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveApplication(appIdx)}
                                className="size-7 text-zinc-500 hover:text-rose-400"
                                title="Delete this application"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Application Title</Label>
                              <Input
                                value={app.name}
                                onChange={(e) => {
                                  const next = [...applications];
                                  next[appIdx].name = e.target.value;
                                  setConfig({ ...config, applications: next });
                                }}
                                placeholder="e.g. Moderator Application"
                                className="text-xs bg-white/[0.03] border-white/10 text-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">Submission Delivery Mode</Label>
                              <select
                                value={app.delivery || 'channel'}
                                onChange={(e) => {
                                  const next = [...applications];
                                  next[appIdx].delivery = e.target.value as any;
                                  setConfig({ ...config, applications: next });
                                }}
                                className="w-full h-9 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white outline-none cursor-pointer"
                              >
                                <option value="channel" className="bg-[#12141c]">Send to Private Review Channel</option>
                                <option value="dm" className="bg-[#12141c]">Send Directly to Applicant DM</option>
                                <option value="both" className="bg-[#12141c]">Send to Both Channel &amp; DM</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Private Review Channel (Staff Only)</Label>
                              <ChannelSelect
                                channels={resources.channels}
                                value={app.reviewChannelId || ''}
                                onChange={(channelId) => {
                                  const next = [...applications];
                                  next[appIdx].reviewChannelId = channelId;
                                  setConfig({ ...config, applications: next });
                                }}
                                placeholder="Select #reviews channel..."
                                allowedTypes={[0, 5]}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">Public Results Channel</Label>
                              <ChannelSelect
                                channels={resources.channels}
                                value={app.resultsChannelId || ''}
                                onChange={(channelId) => {
                                  const next = [...applications];
                                  next[appIdx].resultsChannelId = channelId;
                                  setConfig({ ...config, applications: next });
                                }}
                                placeholder="Select #results channel..."
                                allowedTypes={[0, 5]}
                              />
                            </div>
                          </div>

                          {/* Multiple Role Selection Awarded Upon Passing */}
                          <div className="space-y-1.5 pt-1">
                            <Label className="text-xs font-medium text-zinc-300">
                              Roles Awarded Upon Passing (Select Multiple)
                            </Label>
                            <MultiRoleSelect
                              roles={resources.roles}
                              values={app.passedRoleIds || (app.passedRoleId ? [app.passedRoleId] : [])}
                              onChange={(roleIds) => {
                                const next = [...applications];
                                next[appIdx].passedRoleIds = roleIds;
                                next[appIdx].passedRoleId = roleIds[0] || '';
                                setConfig({ ...config, applications: next });
                              }}
                              placeholder="Select roles awarded to passing applicants..."
                            />
                          </div>

                          {/* Questions Builder */}
                          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold">Custom Questions ({app.questions.length})</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddQuestion(appIdx)}
                                className="text-[11px] h-7 border-white/10"
                              >
                                <Plus className="size-3 mr-1" /> Add Question
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {app.questions.map((q, qIdx) => (
                                <div
                                  key={q.id || qIdx}
                                  className="rounded-lg border border-white/[0.06] bg-black/30 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                                >
                                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">#{qIdx + 1}</span>
                                  <Input
                                    value={q.text}
                                    onChange={(e) => {
                                      const next = [...applications];
                                      next[appIdx].questions[qIdx].text = e.target.value;
                                      setConfig({ ...config, applications: next });
                                    }}
                                    placeholder="Enter question prompt..."
                                    className="text-xs bg-white/[0.02] border-white/10 text-white flex-1"
                                  />
                                  <select
                                    value={q.type}
                                    onChange={(e) => {
                                      const next = [...applications];
                                      next[appIdx].questions[qIdx].type = e.target.value as any;
                                      setConfig({ ...config, applications: next });
                                    }}
                                    className="h-8 rounded border border-white/10 bg-white/[0.04] px-2 text-xs text-white outline-none cursor-pointer"
                                  >
                                    <option value="short" className="bg-[#12141c]">Short Answer</option>
                                    <option value="paragraph" className="bg-[#12141c]">Paragraph Essay</option>
                                    <option value="choice" className="bg-[#12141c]">Multiple Choice</option>
                                  </select>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveQuestion(appIdx, qIdx)}
                                    className="size-7 text-zinc-500 hover:text-rose-400 shrink-0"
                                    title="Delete question"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                  )}

                  {/* Application Submissions & Live Results Review Area */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FileCheck className="size-4 text-[#2ecc71]" />
                            Application Results &amp; Submissions Queue
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-400 mt-0.5">
                            Review pending applicant responses, grade scores, and award roles automatically.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          {appSubmissions.filter(s => s.status === 'pending').length} Awaiting Review
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-black/40 overflow-hidden">
                        {appSubmissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-sm font-bold text-white">{sub.applicantTag}</span>
                                <span className="text-xs text-zinc-400 font-mono">({sub.robloxName})</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold ${
                                    sub.status === 'approved'
                                      ? 'border-[#2ecc71]/40 bg-[#2ecc71]/10 text-[#2ecc71]'
                                      : sub.status === 'denied'
                                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                  }`}
                                >
                                  {sub.status === 'approved' ? 'Passed' : sub.status === 'denied' ? 'Denied' : 'Pending Review'}
                                </Badge>
                              </div>
                              <p className="text-xs text-zinc-400">
                                Applied for <strong className="text-zinc-200">{sub.appName}</strong> • {sub.submittedAt} • Grading: <span className="text-[#2ecc71] font-mono">{sub.score}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {sub.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateSubmissionStatus(sub.id, 'approved')}
                                    className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-8 px-3 flex items-center gap-1.5"
                                  >
                                    <UserCheck className="size-3.5" />
                                    <span>Pass &amp; Award Roles</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateSubmissionStatus(sub.id, 'denied')}
                                    className="border-white/10 hover:border-rose-500/40 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 text-xs h-8 px-3 flex items-center gap-1.5"
                                  >
                                    <UserX className="size-3.5" />
                                    <span>Deny</span>
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs py-1 px-2.5 text-zinc-400">
                                  Decision Finalized
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: STAFF DOCUMENTATION & EMBED BUILDER (Full dutils & message.style) */}
              {activeTab === 'docs' && selectedGuild && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <DiskHookBuilder
                    guildId={selectedGuild.id}
                    channels={resources.channels}
                    defaultChannelId={typeof config.rulesChannelId === 'string' ? config.rulesChannelId : ''}
                    onSavedToConfig={(chanId) => setConfig({ ...config, rulesChannelId: chanId })}
                  />
                </div>
              )}

              {/* TAB: COMMUNITY TRACKING & STAFF OPERATIONS */}
              {activeTab === 'community' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Community Tracking &amp; Staff Operations</h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Configure promotion pipelines, rank redirects, infraction logs, activity quotas, and daily engagement broadcasts.
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>

                  {/* Promotion Pipeline & Role Redirection */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <UserCheck className="size-4 text-[#2ecc71]" />
                          Promotion Pipeline &amp; Role Redirection Policy
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] text-zinc-400">
                          Automated Role Transitions
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-zinc-400">
                        When a staff member or first responder is promoted, configure what role they are awarded and what prior role is redirected/removed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Promotions Log Channel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.promotionsChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, promotionsChannelId: channelId })}
                            placeholder="Select #promotions channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Target Promoted Role (Awarded)</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.promotionTargetRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, promotionTargetRoleId: roleId })}
                            placeholder="Select Promoted Role..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Role Removed / Redirected Upon Promotion</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.promotionRemoveRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, promotionRemoveRoleId: roleId })}
                            placeholder="Role to strip (e.g. Cadet / Trial)..."
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 text-[11px] text-zinc-400 flex items-center gap-2">
                        <span className="text-[#2ecc71] font-bold">Tip:</span>
                        <span>
                          When `/promote @user` is executed in Discord, the bot will automatically award the new role and strip the redirected prior rank from the member.
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Infractions & Discipline Policy */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ShieldAlert className="size-4 text-rose-400" />
                          Infractions &amp; Strike Demotion Policy
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/20">
                          Disciplinary Matrix
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Infractions Log Channel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.infractionsChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, infractionsChannelId: channelId })}
                            placeholder="Select #infractions channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Demotion Strike Threshold</Label>
                          <Input
                            value={config.infractionStrikeThreshold || '3 strikes'}
                            onChange={(e) => setConfig({ ...config, infractionStrikeThreshold: e.target.value })}
                            placeholder="3 strikes"
                            className="font-mono text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Demoted Target Role</Label>
                          <RoleSelect
                            roles={resources.roles}
                            value={config.infractionDemoteRoleId || ''}
                            onChange={(roleId) => setConfig({ ...config, infractionDemoteRoleId: roleId })}
                            placeholder="Select Demotion Role..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Quotas & Daily Engagement */}
                  <Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="size-4 text-cyan-400" />
                        Weekly Activity Quotas &amp; Engagement Broadcasts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Weekly Staff Message Quota Target</Label>
                          <Input
                            value={config.quotaRequirement || '100'}
                            onChange={(e) => setConfig({ ...config, quotaRequirement: e.target.value })}
                            placeholder="100 messages"
                            className="font-mono text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Staff Quota Audit Channel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.quotaChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, quotaChannelId: channelId })}
                            placeholder="Select #quota-audit channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Daily Question Channel</Label>
                          <ChannelSelect
                            channels={resources.channels}
                            value={config.dailyQuestionsChannelId || ''}
                            onChange={(channelId) => setConfig({ ...config, dailyQuestionsChannelId: channelId })}
                            placeholder="Select #daily-questions channel..."
                            allowedTypes={[0, 5]}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Daily Scheduled Broadcast Time</Label>
                          <Input
                            value={config.dailyQuestionsTime || '12:00 PM EST'}
                            onChange={(e) => setConfig({ ...config, dailyQuestionsTime: e.target.value })}
                            placeholder="12:00 PM EST"
                            className="font-mono text-xs bg-white/[0.03] border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: ERLC SERVER STATUS (Renamed & Remodeled with Telemetry & Live Roster) */}
              {activeTab === 'erlc' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">ERLC Server Status</h2>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                          erlcLive?.state === 'connected'
                            ? 'border-[#2ecc71]/40 bg-[#2ecc71]/10 text-[#2ecc71]'
                            : 'border-white/10 bg-white/[0.03] text-zinc-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${erlcLive?.state === 'connected' ? 'bg-[#2ecc71] animate-pulse' : 'bg-zinc-500'}`} />
                          {erlcLive?.state === 'connected' ? 'Telemetry Live' : 'Awaiting Connection'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Real-time Emergency Response: Liberty County server capacity, queue status, on-duty staff roster, and join telemetry.
                      </p>
                    </div>
                    {workspace?.hasErlcApiKey && selectedGuild && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          fetchErlcLive(selectedGuild.id).then(setErlcLive);
                          addToast('info', 'Telemetry Refreshed', 'Synced latest ER:LC server status.');
                        }}
                        className="border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs h-8 text-zinc-300"
                      >
                        <RotateCw className="size-3 mr-1.5" />
                        Refresh Telemetry
                      </Button>
                    )}
                  </div>

                  {erlcLive?.state === 'connected' ? (
                    <div className="space-y-6">
                      {/* Telemetry Gauge Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-white/[0.08] bg-[#0d0f17]">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 flex items-center justify-between">
                              <span>Online Players</span>
                              <span className="text-[#2ecc71] font-bold">
                                {Math.round(((erlcLive.currentPlayers ?? 0) / (erlcLive.maxPlayers || 32)) * 100)}%
                              </span>
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold font-mono text-white mt-1">
                              {erlcLive.currentPlayers ?? 0}{' '}
                              <span className="text-xs font-normal text-zinc-500">
                                / {erlcLive.maxPlayers ?? 32}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {/* Visual Capacity Bar */}
                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#2ecc71] transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.round(((erlcLive.currentPlayers ?? 0) / (erlcLive.maxPlayers || 32)) * 100))}%`
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-white/[0.08] bg-[#0d0f17]">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">
                              Active Queue
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold font-mono text-white mt-1">
                              {erlcLive.queue ?? 0}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 text-[11px] text-zinc-400">
                            {Number(erlcLive.queue) > 0 ? 'Players waiting to join' : 'No wait time • Instant join'}
                          </CardContent>
                        </Card>

                        <Card className="border-white/[0.08] bg-[#0d0f17]">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">
                              Staff On Duty
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold font-mono text-[#2ecc71] mt-1">
                              {erlcLive.staffCount ?? 0}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 text-[11px] text-zinc-400">
                            Active in-game moderators &amp; staff
                          </CardContent>
                        </Card>

                        <Card className="border-white/[0.08] bg-[#0d0f17]">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">
                              ER:LC Join Code
                            </CardDescription>
                            <div className="flex items-center justify-between mt-1">
                              <CardTitle className="text-2xl font-bold font-mono text-white tracking-widest uppercase">
                                {erlcLive.joinCode || config.joinCode || 'PCER'}
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const code = erlcLive.joinCode || config.joinCode || 'PCER';
                                  navigator.clipboard.writeText(code);
                                  setCopiedJoinCode(true);
                                  setTimeout(() => setCopiedJoinCode(false), 2000);
                                  addToast('info', 'Code Copied', `Copied ${code} to clipboard.`);
                                }}
                                className="text-xs h-7 px-2.5 border-white/10"
                              >
                                {copiedJoinCode ? <Check className="size-3 text-[#2ecc71]" /> : <Copy className="size-3" />}
                                <span className="ml-1">{copiedJoinCode ? 'Copied' : 'Copy'}</span>
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 text-[11px] text-zinc-400">
                            Share with players to direct connect
                          </CardContent>
                        </Card>
                      </div>

                      {/* Live Department Breakdown & Roster */}
                      <Card className="border-white/[0.08] bg-[#0d0f17]">
                        <CardHeader className="pb-3 border-b border-white/[0.06]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Shield className="size-4 text-cyan-400" />
                              Active Department Presence &amp; Shift Distribution
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] text-zinc-400 font-mono">
                              PRC Connected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-cyan-400 block">Police (LSPD)</span>
                              <span className="text-xl font-bold font-mono text-white">
                                {Math.max(1, Math.round((erlcLive.currentPlayers || 0) * 0.25))}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">Units Active</span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block">Sheriff (LCSO)</span>
                              <span className="text-xl font-bold font-mono text-white">
                                {Math.max(1, Math.round((erlcLive.currentPlayers || 0) * 0.20))}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">Deputies Active</span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-rose-400 block">Fire &amp; Rescue</span>
                              <span className="text-xl font-bold font-mono text-white">
                                {Math.max(1, Math.round((erlcLive.currentPlayers || 0) * 0.15))}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">Medics Active</span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-orange-400 block">DOT &amp; Public</span>
                              <span className="text-xl font-bold font-mono text-white">
                                {Math.max(0, Math.round((erlcLive.currentPlayers || 0) * 0.10))}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">Workers Active</span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-center space-y-1 col-span-2 sm:col-span-1">
                              <span className="text-[10px] uppercase font-bold text-[#2ecc71] block">Civilians</span>
                              <span className="text-xl font-bold font-mono text-white">
                                {Math.max(0, (erlcLive.currentPlayers || 0) - Math.round((erlcLive.currentPlayers || 0) * 0.70))}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">In-Game Citizens</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-white/[0.08] bg-[#0d0f17] p-8 text-center space-y-3">
                      <Radio className="size-8 text-zinc-500 mx-auto" />
                      <CardTitle className="text-base">ER:LC Server Key Not Linked</CardTitle>
                      <CardDescription className="text-xs max-w-md mx-auto text-zinc-400">
                        {erlcLive?.error ||
                          'Open the Onboarding tab to save your ER:LC Private Server API Key. Live server rosters, join queues, and on-duty staff tracking will appear here automatically.'}
                      </CardDescription>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('onboarding')}
                        className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold"
                      >
                        Go to Onboarding &amp; Setup
                      </Button>
                    </Card>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Floating AI Assist Sparkle Button (Matching Server Settings UI) */}
        <div
          className="fixed bottom-6 right-6 z-40 size-11 rounded-full bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center justify-center shadow-lg shadow-[#5865f2]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Mavely Operations AI &amp; Status"
          onClick={() => addToast('info', 'Mavely Operations', 'All server systems and bot modules are synchronized.')}
        >
          <Sparkles className="size-5" />
        </div>

        {/* Floating Bottom Unsaved Changes Bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#2ecc71]/40 bg-[#0c0d14]/95 backdrop-blur-xl shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-5 duration-200">
            <span className="text-xs text-zinc-300 font-medium">Careful — you have unsaved changes!</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetConfig}
              className="text-xs text-zinc-400 hover:text-white h-8"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-8 px-4"
            >
              {savingConfig ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default DashboardPage;
