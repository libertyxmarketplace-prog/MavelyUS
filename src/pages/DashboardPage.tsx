import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Save,
  AlertTriangle,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AsyncButton } from '@/components/ui/async-button';
import { Badge } from '@/components/ui/badge';
import NotificationsBlock, { type ToastNotification } from '@/components/ui/notifications-5';
import {
  fetchGuilds,
  fetchWorkspace,
  saveWorkspaceConfig,
  triggerBotAction,
  fetchGuildResources
} from '@/lib/api';
import type {
  DiscordGuild,
  WorkspaceBot,
  WorkspaceCustomizations,
  GuildResources
} from '@/types';
import { useAuth } from '@/lib/auth';

// AppShell & Vibra UI Architecture
import { AppShell } from '@/components/ui/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { currentUser, lastUpdated, shellNotifications } from '@/app/import/data';
import { REFERENCE_DATE } from '@/lib/sample-data';
import { type NavConfig } from '@/lib/nav-config';

// Tab Modules
import { OverviewTab } from './dashboard/OverviewTab';
import { ComingSoonTab } from './dashboard/ComingSoonTab';
import { DataImportTab } from './dashboard/DataImportTab';
import { PromoteTab } from './dashboard/PromoteTab';
import { EarnCoinsTab } from './dashboard/EarnCoinsTab';
import { RewardsTab } from './dashboard/RewardsTab';
import { ReferralsTab } from './dashboard/ReferralsTab';
import { LeaderboardTab } from './dashboard/LeaderboardTab';
import { MyJoinsTab } from './dashboard/MyJoinsTab';
import { HistoryTab } from './dashboard/HistoryTab';
import { TransferTab } from './dashboard/TransferTab';
import { CredentialsTab } from './dashboard/CredentialsTab';
import { UptimeTab } from './dashboard/UptimeTab';
import { ChangelogTab } from './dashboard/ChangelogTab';

export function DashboardPage() {
  const { guildId, tab } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceBot | null>(null);
  const [_resources, setResources] = useState<GuildResources>({ available: false, channels: [], roles: [] });

  const [_loadingGuilds, setLoadingGuilds] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [demoBypass, setDemoBypass] = useState(false);

  // Form Configuration State & Baseline Tracking for Unsaved Changes
  const [config, setConfig] = useState<WorkspaceCustomizations>({});
  const [baselineConfig, setBaselineConfig] = useState<string>('');
  const hasUnsavedChanges = Boolean(baselineConfig && JSON.stringify(config) !== baselineConfig);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dynamic Live Notifications State (No fake static text)
  const [notificationsList, setNotificationsList] = useState(() => shellNotifications());

  useEffect(() => {
    const handleNotifUpdate = () => {
      setNotificationsList(shellNotifications());
    };
    window.addEventListener('civlink_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('civlink_notifications_updated', handleNotifUpdate);
  }, []);

  // Notifications Block Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => {
    setToasts((prev) => {
      if (prev.some((t) => t.title === title && t.body === body)) return prev;
      const id = Date.now() + Math.random();
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
      }, 4500);
      return [...prev, { id, variant, title, body }];
    });
  };

  // Active Guild Snowflake ID
  const currentGuildId = guildId || selectedGuild?.id || '1232495211490443284';

  // Synchronize document title
  useEffect(() => {
    const serverName = selectedGuild?.name || 'Community Server';
    document.title = `Mavely - ${serverName} Dashboard`;
  }, [selectedGuild]);

  // Load user guilds
  useEffect(() => {
    async function initGuilds() {
      try {
        let list = await fetchGuilds();
        if (currentGuildId && !list.some((g) => g.id === currentGuildId)) {
          const directGuild: DiscordGuild = {
            id: currentGuildId,
            name: `Community (${currentGuildId.slice(0, 6)})`,
            icon: null,
            iconUrl: null,
            owner: true,
            hasWorkspace: true,
            configured: true,
          };
          list = [directGuild, ...list];
        }
        setGuilds(list);

        const matched = list.find((g) => g.id === currentGuildId) || list[0] || null;
        setSelectedGuild(matched);
      } catch (err) {
        console.warn('Failed to load user guilds:', err);
      } finally {
        setLoadingGuilds(false);
      }
    }
    initGuilds();
  }, [currentGuildId]);

  // Load workspace details for selected server
  const loadWorkspaceData = useCallback(async (targetId: string) => {
    try {
      const data = await fetchWorkspace(targetId);
      setWorkspace(data.workspace);
      if (data?.workspace?.customizations) {
        setConfig(data.workspace.customizations);
        setBaselineConfig(JSON.stringify(data.workspace.customizations));
      }
      const resData = await fetchGuildResources(targetId).catch(() => null);
      if (resData) setResources(resData);
    } catch (err: any) {
      console.warn('Workspace data fetch notice:', err.message);
    }
  }, []);

  useEffect(() => {
    if (currentGuildId) {
      loadWorkspaceData(currentGuildId);
    }
  }, [currentGuildId, loadWorkspaceData]);

  // Server switch handler
  const handleSelectGuild = (newGuildId: string) => {
    const found = guilds.find((g) => g.id === newGuildId);
    if (found) {
      setSelectedGuild(found);
      setDemoBypass(false);
      const nextTab = tab ? `/${tab}` : '';
      navigate(`/dashboard/${newGuildId}${nextTab}`);
    }
  };

  // Bot action triggers
  const handleBotAction = async (action: string, payload?: Record<string, any>) => {
    setActionLoading(action);
    try {
      await triggerBotAction(currentGuildId, action, payload);
      addToast(
        'success',
        action === 'deploy' ? 'Commands Synchronized' : action === 'restart' ? 'Gateway Restarted' : 'Action Executed',
        'Operation executed successfully with Discord API.'
      );
      await loadWorkspaceData(currentGuildId);
    } catch (err: any) {
      addToast('error', 'Execution Notice', err.message || 'Operation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Save Config handler with AsyncButton
  const handleSaveConfig = async () => {
    try {
      await saveWorkspaceConfig(currentGuildId, config);
      setBaselineConfig(JSON.stringify(config));
      addToast('success', 'Changes Saved', 'All workspace parameters synchronized with the bot.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save parameters.');
    }
  };

  // Reset unsaved config changes
  const handleResetConfig = () => {
    if (baselineConfig) {
      try {
        setConfig(JSON.parse(baselineConfig));
        addToast('info', 'Changes Reverted', 'Restored uncommitted adjustments to baseline.');
      } catch {
        // Ignore JSON parse errors
      }
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSaveConfig();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, config]);

  // Construct AppShell user object
  const userProfile = useMemo(() => {
    return currentUser(auth?.user);
  }, [auth?.user]);

  // Determine whether the bot is in the selected server
  const isPrimaryServer = currentGuildId === '1232495211490443284' || currentGuildId === '1530147023754367006';
  const isBotInGuild = demoBypass || (workspace ? (workspace.isInGuild !== false && workspace.status !== 'unconfigured') : isPrimaryServer);

  // Construct workspaces dropdown list for the Server Switcher button (real Discord server icons)
  const workspacesConfig = useMemo(() => {
    return {
      current: currentGuildId,
      items: guilds.map((g) => {
        const iconUrl = g.iconUrl || (g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null);
        return {
          id: g.id,
          name: g.name,
          initial: g.name.slice(0, 2).toUpperCase(),
          iconUrl,
        };
      }),
    };
  }, [guilds, currentGuildId]);

  // Clean Community Growth Navigation Config
  const nav: NavConfig = useMemo(() => ({
    brand: {
      name: selectedGuild?.name || workspace?.customizations?.serverName || 'Community Server',
      initial: (selectedGuild?.name || workspace?.customizations?.serverName || 'CS').slice(0, 2).toUpperCase(),
      href: `/dashboard/${currentGuildId}`,
      caption: 'ER:LC Operations',
    },
    groups: [
      {
        label: 'Community Growth',
        items: [
          { title: 'Overview', href: `/dashboard/${currentGuildId}`, icon: 'layout-dashboard' },
          { title: 'Promote Server', href: `/dashboard/${currentGuildId}/promote`, icon: 'megaphone' },
          { title: 'Earn Credits', href: `/dashboard/${currentGuildId}/earn`, icon: 'coins' },
          { title: 'Streak Rewards', href: `/dashboard/${currentGuildId}/rewards`, icon: 'sparkles' },
          { title: 'Leaderboard', href: `/dashboard/${currentGuildId}/leaderboard`, icon: 'chart-line' },
          { title: 'My Joins', href: `/dashboard/${currentGuildId}/joins`, icon: 'users' },
        ],
      },
      {
        label: 'System & Status',
        items: [
          { title: 'System Telemetry', href: `/dashboard/${currentGuildId}/uptime`, icon: 'activity' },
          { title: 'Roster & Data Import', href: `/dashboard/${currentGuildId}/import`, icon: 'folder' },
          { title: 'Credentials & API', href: `/dashboard/${currentGuildId}/credentials`, icon: 'key' },
          { title: 'Changelog', href: `/dashboard/${currentGuildId}/changelog`, icon: 'list' },
        ],
      },
      {
        label: 'Custom Bot',
        items: [
          { title: 'Patrol Sessions & Radio', href: `/dashboard/${currentGuildId}/patrol`, icon: 'audio-lines' },
          { title: 'Support & Tickets', href: `/dashboard/${currentGuildId}/tickets`, icon: 'life-buoy' },
          { title: 'Staff Applications', href: `/dashboard/${currentGuildId}/staff-apps`, icon: 'file-text' },
          { title: 'Staff Handbook & LOA', href: `/dashboard/${currentGuildId}/staff-handbook`, icon: 'shield' },
        ],
      },
    ],
    footer: [
      {
        title: 'Add Bot to Server',
        href: `https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&integration_type=0&scope=bot%20applications.commands&guild_id=${currentGuildId}`,
        icon: 'bot',
        external: true,
      },
      {
        title: 'Support Server',
        href: 'https://discord.gg/mZcp3VBtBq',
        icon: 'life-buoy',
        external: true,
      },
    ],
  }), [selectedGuild, currentGuildId, workspace]);

  const activeTabKey = tab || 'overview';
  const activeHref = activeTabKey === 'overview'
    ? `/dashboard/${currentGuildId}`
    : `/dashboard/${currentGuildId}/${activeTabKey}`;

  const serverName = selectedGuild?.name || 'Community Discord Server';
  const serverIconUrl = selectedGuild?.iconUrl || (selectedGuild?.icon ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png` : null);
  const botInviteUrl = `https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&integration_type=0&scope=bot%20applications.commands&guild_id=${currentGuildId}`;

  const handleCheckConnection = async () => {
    setCheckingConnection(true);
    addToast('info', 'Checking Connection', `Verifying Mavely presence in ${serverName}...`);
    try {
      await loadWorkspaceData(currentGuildId);
      await fetchGuilds(true);
      await new Promise((r) => setTimeout(r, 1000));
      addToast('success', 'Connection Checked', 'Guild status refreshed from Discord API.');
    } catch {
      addToast('warning', 'Notice', 'Could not reach Discord gateway. You may continue to explore.');
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.logout();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    window.location.assign('/');
  };

  return (
    <AppShell
      nav={nav}
      activeHref={activeHref}
      workspaces={workspacesConfig}
      onWorkspaceChange={handleSelectGuild}
      user={userProfile}
      notifications={notificationsList}
      now={REFERENCE_DATE}
      onSignOut={handleSignOut}
    >
      {/* Dynamic PageHeader */}
      {activeTabKey === 'overview' && (
        <PageHeader
          title={serverName}
          description="Real-time member growth, community treasury balance, and directory status"
          badge={
            !isBotInGuild ? (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[10px]"
              >
                INVITE REQUIRED
              </Badge>
            ) : undefined
          }
          meta={
            <div className="flex items-center gap-3">
              <span>{lastUpdated()}</span>
              <span>·</span>
              <span className="font-mono text-zinc-400">{selectedGuild?.id || currentGuildId}</span>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBotAction('deploy')}
                disabled={actionLoading === 'deploy'}
                className="h-8 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs rounded-lg"
              >
                <RotateCw className={`size-3 mr-1.5 ${actionLoading === 'deploy' ? 'animate-spin' : ''}`} />
                Sync Bot
              </Button>
            </div>
          }
        />
      )}

      {activeTabKey === 'patrol' && (
        <PageHeader
          title="Patrol Sessions & Radio Channels"
          description="Manage active ER:LC patrol shifts, voice channel frequency sync, and patrol announcements."
          meta="Live Patrol Dispatch"
        />
      )}

      {activeTabKey === 'tickets' && (
        <PageHeader
          title="Support Tickets & Player Reports"
          description="Configure multi-category ticket panels, staff claim roles, and transcript logs."
          meta="5 Categories Configured"
        />
      )}

      {activeTabKey === 'staff-apps' && (
        <PageHeader
          title="Staff Applications & Recruitment"
          description="Design custom application forms, review pipelines, and automated role grants."
          meta="Active Review Pipeline"
        />
      )}

      {activeTabKey === 'staff-handbook' && (
        <PageHeader
          title="Staff Handbook, Quotas & LOA"
          description="Manage staff leave of absence requests, disciplinary infraction logs, and server shift quotas."
          meta="Shift Regulations"
        />
      )}

      {activeTabKey === 'import' && (
        <PageHeader
          title="Server Data & Roster Import"
          description="Import staff rosters, member spreadsheets, and previous bot configurations."
          meta="RFC 4180 CSV / JSON"
        />
      )}

      {activeTabKey === 'earn' && (
        <PageHeader
          title="Earn Growth Credits"
          description="Discover partnered Discord communities, join them to earn instant credits, and spend credits to attract members to your own server."
          meta="Instant Verification"
        />
      )}

      {activeTabKey === 'promote' && (
        <PageHeader
          title="Promote Server"
          description="Publish your Discord community in the global directory with custom reward bounties, tags, and automated retention protection."
          meta="Anti-Alt Shield Active"
        />
      )}

      {activeTabKey === 'rewards' && (
        <PageHeader
          title="Daily Check-In & Streak Rewards"
          description="Check in once every 24 hours without breaking your streak to claim escalating credit bounties and mystery jackpot drops."
          meta="Daily Reset at 00:00 UTC"
        />
      )}

      {activeTabKey === 'referrals' && (
        <PageHeader
          title="Invite Community Owners"
          description="Earn +15 credits whenever an active Discord server owner registers their community using your link."
          meta="Unlimited Referrals"
        />
      )}

      {activeTabKey === 'leaderboard' && (
        <PageHeader
          title="Community Growth Leaderboard"
          description="The fastest-growing Discord communities ranked by verified 30-day member joins and campaign activity."
          meta="Global Rankings"
        />
      )}

      {activeTabKey === 'joins' && (
        <PageHeader
          title="My Joins"
          description="Manage your verified server memberships and track your 72-hour credit retention status."
          meta="Active Memberships"
        />
      )}

      {activeTabKey === 'history' && (
        <PageHeader
          title="Member Joins & Activity"
          description="Verified Discord member joins, 72-hour retention status, and earned bounties."
          meta="Verified Joins"
        />
      )}

      {activeTabKey === 'transfer' && (
        <PageHeader
          title="Growth Store & Boosts"
          description="Purchase server growth boost packs, automated bumper slots, and community perks."
          meta="Community Perks & Store"
        />
      )}

      {activeTabKey === 'uptime' && (
        <PageHeader
          title="System Uptime & Cluster Reliability"
          description="30-day continuous health check for Mavely API gateway, verification workers, and audit database"
          meta="99.98% overall uptime"
        />
      )}

      {activeTabKey === 'changelog' && (
        <PageHeader
          title="Changelog"
          description="Release history, platform updates, and anti-alt engine upgrades"
          meta="Version 3.0.0"
        />
      )}

      {activeTabKey === 'credentials' && (
        <PageHeader
          title="Credentials & API"
          description="Manage Discord bot token, community webhook endpoints, and API security keys"
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Floating Bottom Toast Notifications */}
        <div className="fixed bottom-20 right-6 z-[100] max-w-sm w-full pointer-events-none">
          <NotificationsBlock
            notifications={toasts}
            onDismiss={(id: number | string) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            className="pointer-events-auto"
          />
        </div>

        {/* Floating Unsaved Changes Action Bar (Fixed Bottom Center) using AsyncButton */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className="bg-[#161a24]/95 border border-white/[0.12] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <AlertTriangle className="size-4 text-amber-400" />
                <span>You have unsaved changes</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetConfig}
                  className="h-7 px-3 text-xs border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-md"
                >
                  Reset
                </Button>
                <AsyncButton
                  size="sm"
                  loadingText="Saving…"
                  onClick={handleSaveConfig}
                  className="h-7 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md shadow-sm"
                >
                  <Save className="size-3.5 mr-1" />
                  Save Changes
                </AsyncButton>
              </div>

              <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 pl-1 border-l border-white/10">
                Ctrl+S
              </span>
            </div>
          </div>
        )}

        {/* ── NON-BLOCKING BOT INVITE ALERT (IF NOT YET IN GUILD) ── */}
        {!isBotInGuild && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {serverIconUrl ? (
                <img src={serverIconUrl} alt={serverName} className="size-10 rounded-xl object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Bot className="size-5" />
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Bot Setup Recommended for {serverName}</h3>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-[10px]">
                    SETUP REQUIRED
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Invite Mavely to deploy ticket desks, dispatch radio sessions, and synchronize Discord roles automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => window.open(botInviteUrl, '_blank', 'noopener,noreferrer')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Bot className="size-3.5" />
                <span>Invite Mavely</span>
                <ExternalLink className="size-3" />
              </Button>
              <AsyncButton
                size="sm"
                variant="outline"
                loadingText="Verifying…"
                onClick={handleCheckConnection}
                disabled={checkingConnection}
                className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs h-9 px-3.5 rounded-xl font-medium"
              >
                <RotateCw className={`size-3 mr-1.5 ${checkingConnection ? 'animate-spin' : ''}`} />
                <span>Verify</span>
              </AsyncButton>
            </div>
          </div>
        )}

        {/* ── ACTIVE CONTENT MODULE ── */}
        <main className="space-y-6 min-w-0">
          {activeTabKey === 'overview' && (
            <OverviewTab
              guild={selectedGuild}
              workspace={workspace}
              config={config}
              onNavigateTab={(t) => navigate(`/dashboard/${currentGuildId}/${t}`)}
              onBotAction={handleBotAction}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'patrol' && (
            <ComingSoonTab
              title="Patrol Sessions & In-Game Radio"
              subtitle="Live Emergency Response: Liberty County in-game patrol tracking, voice radio frequencies, and CAD server integration."
              category="ER:LC Operations"
              features={[
                'Automated in-game patrol start/end logging and duty time tracking',
                'Live radio channel voice link and dispatcher status',
                'Server player activity and duty-time leaderboards'
              ]}
              onBackToOverview={() => navigate(`/dashboard/${currentGuildId}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'tickets' && (
            <ComingSoonTab
              title="Support Desk & Ticket Engine"
              subtitle="Automated Discord support ticket desks, category routing, staff assignment, and HTML transcript archiving."
              category="Community Support"
              features={[
                'One-click interactive Discord ticket creation panels',
                'Role-restricted staff ticket channels with claim workflow',
                'Full web HTML transcript generation and archival'
              ]}
              onBackToOverview={() => navigate(`/dashboard/${currentGuildId}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'staff-apps' && (
            <ComingSoonTab
              title="Staff Application & Interview Hub"
              subtitle="Discord modal applications, automated staff review channels, upvote/downvote scoring, and role elevation."
              category="Staff Operations"
              features={[
                'Discord modal popups with customizable application questions',
                'Private staff review channel with accept/deny voting buttons',
                'Automated acceptance DMs and Discord role granting'
              ]}
              onBackToOverview={() => navigate(`/dashboard/${currentGuildId}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'staff-handbook' && (
            <ComingSoonTab
              title="Staff Handbook & Leave of Absence (LOA)"
              subtitle="Staff policies, disciplinary guidelines, and automated Leave of Absence request review workflow."
              category="Staff Operations"
              features={[
                'Dynamic server handbook documentation and rule indexes',
                'Leave of Absence request form with date range picker',
                'Automatic temporary LOA role toggle and activity exemption'
              ]}
              onBackToOverview={() => navigate(`/dashboard/${currentGuildId}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'import' && (
            <DataImportTab
              workspace={workspace}
              onImportSuccess={() => addToast('success', 'Roster Synchronized', 'Imported data saved.')}
            />
          )}

          {activeTabKey === 'promote' && (
            <PromoteTab
              guild={selectedGuild}
              config={config}
              onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
              onSaveConfig={handleSaveConfig}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'earn' && (
            <EarnCoinsTab
              currentGuildId={currentGuildId}
              onNavigateTab={(t) => navigate(`/dashboard/${currentGuildId}/${t}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'rewards' && (
            <RewardsTab addToast={addToast} />
          )}

          {activeTabKey === 'referrals' && (
            <ReferralsTab currentGuildId={currentGuildId} addToast={addToast} />
          )}

          {activeTabKey === 'leaderboard' && (
            <LeaderboardTab />
          )}

          {activeTabKey === 'joins' && (
            <MyJoinsTab onNavigateTab={(t) => navigate(`/dashboard/${currentGuildId}/${t}`)} addToast={addToast} />
          )}

          {activeTabKey === 'history' && (
            <HistoryTab />
          )}

          {activeTabKey === 'transfer' && (
            <TransferTab addToast={addToast} />
          )}

          {activeTabKey === 'uptime' && (
            <UptimeTab addToast={addToast} />
          )}

          {activeTabKey === 'changelog' && (
            <ChangelogTab />
          )}

          {activeTabKey === 'credentials' && (
            <CredentialsTab />
          )}
        </main>
      </div>
    </AppShell>
  );
}

export default DashboardPage;
