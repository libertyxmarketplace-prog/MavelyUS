import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AsyncButton } from '@/components/ui/async-button';
import NotificationsBlock, { type ToastNotification } from '@/components/ui/notifications-5';
import {
  fetchGuilds,
  fetchWorkspace,
  saveWorkspaceConfig
} from '@/lib/api';
import type {
  DiscordGuild,
  WorkspaceBot,
  WorkspaceCustomizations
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
import { DataImportTab } from './dashboard/DataImportTab';
import { PromoteTab } from './dashboard/PromoteTab';
import { EarnCoinsTab } from './dashboard/EarnCoinsTab';
import { RewardsTab } from './dashboard/RewardsTab';
import { ReferralsTab } from './dashboard/ReferralsTab';
import { LeaderboardTab } from './dashboard/LeaderboardTab';
import { MyJoinsTab } from './dashboard/MyJoinsTab';
import { HistoryTab } from './dashboard/HistoryTab';
import { TransferTab } from './dashboard/TransferTab';
import { UptimeTab } from './dashboard/UptimeTab';
import { ChangelogTab } from './dashboard/ChangelogTab';
import { ServerDetailsTab } from './dashboard/ServerDetailsTab';

export function DashboardPage() {
  const { guildId, tab } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);

  // Active Guild Snowflake ID
  const currentGuildId = guildId || selectedGuild?.id || '1530147023754367006';

  const [workspace, setWorkspace] = useState<WorkspaceBot | null>(null);

  const [_loadingGuilds, setLoadingGuilds] = useState(true);
  // Form Configuration State & Baseline Tracking for Unsaved Changes
  const [config, setConfig] = useState<WorkspaceCustomizations>({});
  const [baselineConfig, setBaselineConfig] = useState<string>('');
  const hasUnsavedChanges = Boolean(baselineConfig && JSON.stringify(config) !== baselineConfig);

  // Dynamic Live Notifications State (No fake static text)
  const [notificationsList, setNotificationsList] = useState(() => shellNotifications());

  useEffect(() => {
    const handleNotifUpdate = () => {
      setNotificationsList(shellNotifications());
    };
    window.addEventListener('erlcus_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('erlcus_notifications_updated', handleNotifUpdate);
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

  // Synchronize document title
  useEffect(() => {
    const serverName = selectedGuild?.name || 'Community Server';
    document.title = `ERLC.US - ${serverName} Dashboard`;
  }, [selectedGuild]);

  // Load user guilds with persistent multi-server cache and icon preservation
  useEffect(() => {
    async function initGuilds() {
      try {
        let list = await fetchGuilds();
        list = list.filter((g) => g && g.name && !g.name.includes('Orlando') && !g.name.includes('Strict'));

        // Restore any previously known Discord servers from localStorage
        const storedRaw = localStorage.getItem('erlcus_known_guilds');
        let storedList: DiscordGuild[] = [];
        if (storedRaw) {
          try {
            storedList = JSON.parse(storedRaw);
            storedList = storedList.filter((g) => g && g.name && !g.name.includes('Orlando') && !g.name.includes('Strict'));
          } catch {}
        }

        // Cache and preserve all Discord icons and server names
        list = list.map((g) => {
          const cachedIcon = localStorage.getItem(`server_icon_${g.id}`);
          const rawCachedName = localStorage.getItem(`server_name_${g.id}`);
          const validCachedName = rawCachedName && !rawCachedName.startsWith('Community (') && !rawCachedName.startsWith('ER:LC Community') ? rawCachedName : null;
          const validApiName = g.name && !g.name.startsWith('Community (') && !g.name.startsWith('ER:LC Community') ? g.name : null;
          const iconUrl = g.iconUrl || cachedIcon || (g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null);
          const name = validApiName || validCachedName || g.name || 'Discord Server';
          if (iconUrl) localStorage.setItem(`server_icon_${g.id}`, iconUrl);
          if (validApiName) localStorage.setItem(`server_name_${g.id}`, validApiName);
          return {
            ...g,
            name,
            iconUrl
          };
        });

        // Merge stored list so switching servers NEVER removes previously viewed servers
        for (const sg of storedList) {
          if (!list.some((g) => g.id === sg.id)) {
            const cachedIcon = localStorage.getItem(`server_icon_${sg.id}`) || sg.iconUrl;
            const rawCachedName = localStorage.getItem(`server_name_${sg.id}`);
            const validCachedName = rawCachedName && !rawCachedName.startsWith('Community (') && !rawCachedName.startsWith('ER:LC Community') ? rawCachedName : null;
            const validSgName = sg.name && !sg.name.startsWith('Community (') && !sg.name.startsWith('ER:LC Community') ? sg.name : null;
            list.push({
              ...sg,
              name: validSgName || validCachedName || sg.name || 'Discord Server',
              iconUrl: cachedIcon || null
            });
          }
        }

        if (currentGuildId && !list.some((g) => g.id === currentGuildId)) {
          const cachedIcon = localStorage.getItem(`server_icon_${currentGuildId}`);
          const rawCachedName = localStorage.getItem(`server_name_${currentGuildId}`);
          const validCachedName = rawCachedName && !rawCachedName.startsWith('Community (') && !rawCachedName.startsWith('ER:LC Community') ? rawCachedName : null;
          const directGuild: DiscordGuild = {
            id: currentGuildId,
            name: validCachedName || 'Discord Server',
            icon: null,
            iconUrl: cachedIcon || null,
            owner: true,
            hasWorkspace: true,
            configured: true,
          };
          list = [directGuild, ...list];
        }

        try {
          localStorage.setItem('erlcus_known_guilds', JSON.stringify(list));
        } catch {}

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

  // Load workspace details for selected server with instant name/icon sync
  const loadWorkspaceData = useCallback(async (targetId: string) => {
    try {
      const data = await fetchWorkspace(targetId);
      setWorkspace(data.workspace);
      if (data?.workspace?.customizations) {
        setConfig(data.workspace.customizations);
        setBaselineConfig(JSON.stringify(data.workspace.customizations));
        if (data.workspace.customizations.serverIconUrl) {
          localStorage.setItem(`server_icon_${targetId}`, data.workspace.customizations.serverIconUrl);
          setGuilds((prev) => {
            const updated = prev.map((g) => g.id === targetId ? { ...g, iconUrl: g.iconUrl || data.workspace.customizations.serverIconUrl } : g);
            try { localStorage.setItem('erlcus_known_guilds', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      }
      if (data?.guild) {
        if (data.guild.iconUrl) {
          localStorage.setItem(`server_icon_${targetId}`, data.guild.iconUrl);
        }
        if (data.guild.name) {
          localStorage.setItem(`server_name_${targetId}`, data.guild.name);
        }
        if (data.guild.memberCount || (data.guild as any).approximateMemberCount) {
          const mCount = data.guild.memberCount || (data.guild as any).approximateMemberCount;
          localStorage.setItem(`server_members_${targetId}`, mCount.toString());
        }
        setGuilds((prev) => {
          const updated = prev.map((g) => g.id === targetId ? {
            ...g,
            name: data.guild.name || g.name,
            iconUrl: data.guild.iconUrl || g.iconUrl,
            memberCount: data.guild.memberCount || g.memberCount
          } : g);
          try { localStorage.setItem('erlcus_known_guilds', JSON.stringify(updated)); } catch {}
          return updated;
        });

        try {
          const promoRaw = localStorage.getItem('erlcus_promoted_servers');
          if (promoRaw) {
            const list = JSON.parse(promoRaw);
            const idx = list.findIndex((s: any) => s.id === targetId);
            if (idx >= 0) {
              list[idx].name = data.guild.name || list[idx].name;
              list[idx].icon = data.guild.iconUrl || list[idx].icon;
              const count = data.guild.memberCount || (data.guild as any).approximateMemberCount;
              if (typeof count === 'number' && count > 0) list[idx].memberCount = count;
              localStorage.setItem('erlcus_promoted_servers', JSON.stringify(list));
              window.dispatchEvent(new Event('erlcus_promotions_updated'));
            }
          }
        } catch {}
      }
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
      const nextTab = tab ? `/${tab}` : '';
      navigate(`/dashboard/${newGuildId}${nextTab}`);
    }
  };

  // Save Config handler with AsyncButton
  const handleSaveConfig = async () => {
    try {
      await saveWorkspaceConfig(currentGuildId, config);
      setBaselineConfig(JSON.stringify(config));
      addToast('success', 'Changes Saved', 'Your server settings were saved.');
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

  // Construct workspaces dropdown list for the Server Switcher button (real Discord server icons)
  const workspacesConfig = useMemo(() => {
    return {
      current: currentGuildId,
      items: guilds.map((g) => {
        const cachedIcon = localStorage.getItem(`server_icon_${g.id}`);
        const iconUrl = g.iconUrl || cachedIcon || (g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null);
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
          { title: 'Server Details', href: `/dashboard/${currentGuildId}/details`, icon: 'eye' },
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
          { title: 'Changelog', href: `/dashboard/${currentGuildId}/changelog`, icon: 'list' },
        ],
      },
    ],
    footer: [
      {
        title: 'Help & Support',
        href: '/docs',
        icon: 'life-buoy',
      },
    ],
  }), [selectedGuild, currentGuildId, workspace]);

  const activeTabKey = tab || 'overview';
  const activeHref = activeTabKey === 'overview'
    ? `/dashboard/${currentGuildId}`
    : `/dashboard/${currentGuildId}/${activeTabKey}`;

  const serverName = selectedGuild?.name || 'Community Discord Server';

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
          meta={
            <div className="flex items-center gap-3">
              <span>{lastUpdated()}</span>
              <span>·</span>
              <span className="font-mono text-zinc-400">{selectedGuild?.id || currentGuildId}</span>
            </div>
          }
        />
      )}





      {activeTabKey === 'import' && (
        <PageHeader
          title="Server Data & Roster Import"
          description="Import staff rosters and member spreadsheets."
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

      {activeTabKey === 'details' && (
        <PageHeader
          title="Server Details & Public Directory"
          description="Live community showcase, 5-star verified reviews, bump accelerator, and member activity telemetry."
          meta="Live Community Hub"
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
          description="30-day continuous health check for ERLC.US API gateway, verification workers, and audit database"
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

        {/* ── ACTIVE CONTENT MODULE ── */}
        <main className="space-y-6 min-w-0">
          {activeTabKey === 'overview' && (
            <OverviewTab
              guild={selectedGuild}
              workspace={workspace}
              config={config}
              onNavigateTab={(t) => navigate(`/dashboard/${currentGuildId}/${t}`)}
              addToast={addToast}
            />
          )}

          {activeTabKey === 'details' && (
            <ServerDetailsTab
              guild={selectedGuild}
              workspace={workspace}
              config={config}
              onNavigateTab={(t) => navigate(`/dashboard/${currentGuildId}/${t}`)}
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

        </main>
      </div>

    </AppShell>
  );
}

export default DashboardPage;
