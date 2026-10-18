'use client';

import {
  Check,
  Ellipsis,
  LayoutDashboard,
  Megaphone,
  Coins,
  Flame,
  Trophy,
  Users,
  Activity,
  FileSpreadsheet,
  Key,
  GitBranch,
  Radio,
  LifeBuoy,
  FileText,
  Shield,
  Bot,
  TrendingUp,
  Home,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Logo } from '@/components/library/logo';

import {
  ArrowDown01Icon,
  BuildingIcon,
  HelpIcon,
  SettingsIcon,
} from '@/components/library/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { NavConfig } from '@/lib/nav-config';
import type { AppShellUser, AppShellWorkspace } from './index';

const menuButtonBaseClassName =
  'h-11 gap-3 rounded-2xl border border-transparent px-3.5 font-semibold text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06] data-active:border-white/[0.08] data-active:bg-[#12151f] data-active:text-white [&_svg]:size-5 [&_svg]:text-slate-400 data-active:[&_svg]:text-white';

const sidebarMenuButtonClassName = cn(
  menuButtonBaseClassName,
  'group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:!p-0',
);

const sidebarMenuSubButtonClassName = cn(
  menuButtonBaseClassName,
  '[&_svg]:text-foreground [&_svg]:!text-foreground data-active:[&_svg]:text-primary data-active:[&_svg]:!text-primary',
);

const subItemsMenuContentClassName = 'z-100 w-52 p-1.5 shadow-lg';

const bottomNavItemClassName = cn(
  buttonVariants({ variant: 'ghost' }),
  'text-foreground hover:text-primary h-full flex-1 px-0 hover:bg-transparent rounded-none',
);

const moreNavItemClassName = cn(
  menuButtonBaseClassName,
  'flex items-center text-sm',
);

export type NavigationItem = {
  section: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
};

export type AppShellSidebarProps = {
  nav: NavConfig;
  activeHref?: string;
  onSearch?: () => void;
  workspaces?: AppShellWorkspace[];
  workspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
  side?: 'left' | 'right';
  user?: AppShellUser;
  onSignOut?: () => void;
};

export function DashboardSidebar({
  nav,
  activeHref,
  workspaces,
  workspaceId,
  onWorkspaceChange,
  side = 'left',
  user,
  onSignOut,
}: AppShellSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();

  const currentGuildId = workspaceId || (workspaces && workspaces[0]?.id) || '1232495211490443284';
  const currentWorkspace = workspaces?.find((w) => w.id === currentGuildId) || workspaces?.[0];

  // Derive active section & subsection from activeHref or location.pathname
  const path = activeHref || location.pathname;
  const { activeSection, activeSubsection } = useMemo(() => {
    if (path.includes('/promote')) return { activeSection: 'growth', activeSubsection: 'promote' };
    if (path.includes('/earn')) return { activeSection: 'growth', activeSubsection: 'earn' };
    if (path.includes('/rewards')) return { activeSection: 'growth', activeSubsection: 'rewards' };
    if (path.includes('/leaderboard')) return { activeSection: 'growth', activeSubsection: 'leaderboard' };
    if (path.includes('/joins')) return { activeSection: 'growth', activeSubsection: 'joins' };
    if (path.includes('/uptime')) return { activeSection: 'system', activeSubsection: 'uptime' };
    if (path.includes('/import')) return { activeSection: 'system', activeSubsection: 'import' };
    if (path.includes('/credentials')) return { activeSection: 'system', activeSubsection: 'credentials' };
    if (path.includes('/changelog')) return { activeSection: 'system', activeSubsection: 'changelog' };
    if (path.includes('/patrol')) return { activeSection: 'custom-bot', activeSubsection: 'patrol' };
    if (path.includes('/tickets')) return { activeSection: 'custom-bot', activeSubsection: 'tickets' };
    if (path.includes('/staff-apps')) return { activeSection: 'custom-bot', activeSubsection: 'staff-apps' };
    if (path.includes('/staff-handbook')) return { activeSection: 'custom-bot', activeSubsection: 'staff-handbook' };
    return { activeSection: 'overview', activeSubsection: undefined };
  }, [path]);

  // Primary navigation items containing user's full routes
  const primaryNavigation: NavigationItem[] = useMemo(() => [
    {
      section: 'overview',
      label: 'Overview',
      href: `/dashboard/${currentGuildId}`,
      icon: LayoutDashboard,
    },
    {
      section: 'growth',
      label: 'Community Growth',
      href: `/dashboard/${currentGuildId}/promote`,
      icon: TrendingUp,
      subItems: [
        { label: 'Promote Server', href: `/dashboard/${currentGuildId}/promote`, icon: Megaphone },
        { label: 'Earn Credits', href: `/dashboard/${currentGuildId}/earn`, icon: Coins },
        { label: 'Streak Rewards', href: `/dashboard/${currentGuildId}/rewards`, icon: Flame },
        { label: 'Leaderboard', href: `/dashboard/${currentGuildId}/leaderboard`, icon: Trophy },
        { label: 'My Joins', href: `/dashboard/${currentGuildId}/joins`, icon: Users },
      ],
    },
    {
      section: 'system',
      label: 'System & Status',
      href: `/dashboard/${currentGuildId}/uptime`,
      icon: Activity,
      subItems: [
        { label: 'System Telemetry', href: `/dashboard/${currentGuildId}/uptime`, icon: Activity },
        { label: 'Roster & Data Import', href: `/dashboard/${currentGuildId}/import`, icon: FileSpreadsheet },
        { label: 'Credentials & API', href: `/dashboard/${currentGuildId}/credentials`, icon: Key },
        { label: 'Changelog', href: `/dashboard/${currentGuildId}/changelog`, icon: GitBranch },
      ],
    },
    {
      section: 'custom-bot',
      label: 'Custom Bot',
      href: `/dashboard/${currentGuildId}/patrol`,
      icon: Bot,
      subItems: [
        { label: 'Patrol Sessions & Radio', href: `/dashboard/${currentGuildId}/patrol`, icon: Radio },
        { label: 'Support & Tickets', href: `/dashboard/${currentGuildId}/tickets`, icon: LifeBuoy },
        { label: 'Staff Applications', href: `/dashboard/${currentGuildId}/staff-apps`, icon: FileText },
        { label: 'Staff Handbook & LOA', href: `/dashboard/${currentGuildId}/staff-handbook`, icon: Shield },
      ],
    },
  ], [currentGuildId]);

  // Mobile navigation lists
  const mobilePrimaryNavigation = primaryNavigation.slice(0, 2);
  const mobileMoreNavigation = useMemo(() => [
    { label: 'Overview', href: `/dashboard/${currentGuildId}`, icon: LayoutDashboard },
    { label: 'Promote Server', href: `/dashboard/${currentGuildId}/promote`, icon: Megaphone },
    { label: 'Earn Credits', href: `/dashboard/${currentGuildId}/earn`, icon: Coins },
    { label: 'Streak Rewards', href: `/dashboard/${currentGuildId}/rewards`, icon: Flame },
    { label: 'Leaderboard', href: `/dashboard/${currentGuildId}/leaderboard`, icon: Trophy },
    { label: 'My Joins', href: `/dashboard/${currentGuildId}/joins`, icon: Users },
    { label: 'System Telemetry', href: `/dashboard/${currentGuildId}/uptime`, icon: Activity },
    { label: 'Roster & Data Import', href: `/dashboard/${currentGuildId}/import`, icon: FileSpreadsheet },
    { label: 'Credentials & API', href: `/dashboard/${currentGuildId}/credentials`, icon: Key },
    { label: 'Changelog', href: `/dashboard/${currentGuildId}/changelog`, icon: GitBranch },
    { label: 'Patrol Sessions & Radio', href: `/dashboard/${currentGuildId}/patrol`, icon: Radio },
    { label: 'Support & Tickets', href: `/dashboard/${currentGuildId}/tickets`, icon: LifeBuoy },
    { label: 'Staff Applications', href: `/dashboard/${currentGuildId}/staff-apps`, icon: FileText },
    { label: 'Staff Handbook & LOA', href: `/dashboard/${currentGuildId}/staff-handbook`, icon: Shield },
  ], [currentGuildId]);

  return (
    <>
      <Sidebar collapsible="offcanvas" className="w-64 shrink-0 bg-sidebar border-r border-border/40" side={side}>
        {/* Top Header: Discord Server Switcher (Matching Image 1) */}
        <SidebarHeader className="p-3 border-b border-border/40 bg-sidebar">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-auto w-full justify-between p-2.5 rounded-2xl border border-white/[0.08] bg-[#12151f] hover:bg-white/[0.06] transition-all cursor-pointer min-w-0 text-left',
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="bg-[#1a1e2b] flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-white/10 ring-1 ring-white/5">
                  {currentWorkspace?.iconUrl ? (
                    <img src={currentWorkspace.iconUrl} alt={currentWorkspace.name} className="size-8 rounded-lg object-cover" />
                  ) : (
                    <BuildingIcon className="size-4 text-emerald-400" />
                  )}
                </span>
                <span className="min-w-0 text-left">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase tracking-wider font-semibold">
                    ACTIVE SERVER
                  </span>
                  <span className="block truncate text-xs font-semibold text-white">
                    {currentWorkspace?.name || 'Select Server'}
                  </span>
                </span>
              </span>
              <ChevronDown className="text-slate-400 size-4 ml-1 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="z-50 w-64 rounded-2xl p-1.5 shadow-2xl border border-white/10 bg-[#0d0f17]/95 backdrop-blur-xl"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-mono font-semibold text-zinc-400 tracking-wider uppercase">
                  Select Server
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {workspaces?.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => onWorkspaceChange?.(ws.id)}
                    className={cn(
                      'justify-between rounded-xl px-2.5 py-2 cursor-pointer transition-colors text-xs',
                      ws.id === currentWorkspace?.id
                        ? 'text-emerald-400 font-semibold bg-emerald-500/10'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ws.iconUrl ? (
                        <img src={ws.iconUrl} alt={ws.name} className="size-6 rounded-md object-cover" />
                      ) : (
                        <div className="size-6 rounded-md bg-white/10 text-white text-[10px] flex items-center justify-center font-bold">
                          {ws.initial}
                        </div>
                      )}
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {ws.id === currentWorkspace?.id && (
                      <Check className="text-emerald-400 size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        {/* Navigation Content */}
        <SidebarContent className="px-3 pt-3 pb-3 bg-sidebar flex flex-col gap-1.5 overflow-y-auto">
          <SidebarMenu className="gap-1.5">
            {primaryNavigation.map((item) => (
              <SidebarNavigationItem
                key={item.section}
                active={item.section === activeSection}
                item={item}
                activeSubsection={activeSubsection}
                onNavigate={(href) => navigate(href)}
              />
            ))}
          </SidebarMenu>
        </SidebarContent>

        {/* User Profile Card docked at bottom */}
        {user && (
          <SidebarFooter className="p-3 border-t border-border/40 bg-sidebar">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-white/[0.08] bg-[#12151f] hover:bg-white/[0.06] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-8 rounded-full object-cover shrink-0 border border-white/10 ring-2 ring-emerald-500/60"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 ring-2 ring-emerald-500/60 flex items-center justify-center text-xs font-bold shrink-0">
                      {user.initials || user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                    <span className="text-[11px] text-slate-400 truncate font-mono">
                      {user.handle || (user.username ? `@${user.username}` : `@${user.name}`)}
                    </span>
                  </div>
                </div>
                <ChevronUp className="text-slate-400 size-4 ml-1.5 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 p-2 shadow-2xl z-50 rounded-2xl border border-white/10 bg-[#0d0f17]/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="size-9 rounded-full object-cover ring-2 ring-emerald-500/30" />
                    ) : (
                      <div className="size-9 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30">
                        {user.initials || 'ME'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold block truncate text-white">{user.name}</span>
                      <span className="text-xs text-zinc-400 block truncate font-mono">
                        {user.handle || (user.username ? `@${user.username}` : (user.email?.startsWith('@') ? user.email : `@${user.email?.split('@')[0] || user.name}`))}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 my-1" />

                {/* Help & Support */}
                <DropdownMenuItem
                  onClick={() => window.open('https://discord.gg/mZcp3VBtBq', '_blank')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <HelpIcon className="size-4 text-emerald-400" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                {/* Add Bot to Server */}
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&integration_type=0&scope=bot%20applications.commands&guild_id=${currentGuildId}`,
                      '_blank',
                    )
                  }
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <SettingsIcon className="size-4 text-emerald-400" />
                  <span>Add Bot to Server</span>
                </DropdownMenuItem>

                {/* Back to Home */}
                <DropdownMenuItem
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <Home className="size-4 text-zinc-400" />
                  <span>Back to Home</span>
                </DropdownMenuItem>

                {/* Sign Out */}
                {onSignOut && (
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                  >
                    <LogOut className="size-4 text-rose-400" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      <MobileBottomNavigation
        activeSection={activeSection}
        activeSubsection={activeSubsection}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={onWorkspaceChange}
        primaryItems={mobilePrimaryNavigation}
        moreItems={mobileMoreNavigation}
        onNavigate={(href) => navigate(href)}
        onSignOut={onSignOut}
      />
    </>
  );
}

function MobileBottomNavigation({
  activeSection,
  activeSubsection,
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  primaryItems,
  moreItems,
  onNavigate,
  onSignOut,
}: {
  activeSection: string;
  activeSubsection?: string;
  workspaces?: AppShellWorkspace[];
  currentWorkspace?: AppShellWorkspace;
  onWorkspaceChange?: (id: string) => void;
  primaryItems: NavigationItem[];
  moreItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  onNavigate: (href: string) => void;
  onSignOut?: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => activeSubsection ? item.href.endsWith(`/${activeSubsection}`) : false);

  return (
    <div className="bg-sidebar fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t px-2 md:hidden">
      {primaryItems.map((item) => {
        const active = item.section === activeSection;
        const activeSubItem =
          active && activeSubsection
            ? item.subItems?.find((subItem) =>
              subItem.href.endsWith(`/${activeSubsection}`),
            )
            : undefined;
        const Icon = activeSubItem?.icon ?? item.icon;
        const label = activeSubItem?.label ?? item.label;

        if (item.subItems?.length) {
          return (
            <DropdownMenu key={item.section}>
              <DropdownMenuTrigger
                aria-label={label}
                className={cn(
                  bottomNavItemClassName,
                  active && 'text-primary font-medium',
                )}
              >
                <Icon className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="center"
                sideOffset={8}
                className={subItemsMenuContentClassName}
              >
                <NavigationSubItemsMenu
                  item={item}
                  isSubItemActive={(href) =>
                    active && href.endsWith(`/${activeSubsection}`)
                  }
                  onSelect={(href) => onNavigate(href)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <button
            key={item.section}
            type="button"
            aria-label={item.label}
            onClick={() => onNavigate(item.href)}
            className={cn(
              bottomNavItemClassName,
              active && 'text-primary font-medium',
            )}
          >
            <Icon className="size-5" />
          </button>
        );
      })}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger
          aria-label="More navigation"
          className={cn(
            bottomNavItemClassName,
            moreActive && 'text-primary font-medium',
          )}
        >
          <Ellipsis className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85dvh] gap-1.5 rounded-t-3xl px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden overflow-y-auto"
        >
          <div className="bg-border mx-auto h-1 w-10 rounded-full mb-2" />
          <SheetHeader className="px-0 pt-0 pb-1">
            <SheetTitle className="text-lg font-semibold">More Menu</SheetTitle>
          </SheetHeader>

          {/* Server Switcher in Mobile Sheet */}
          {workspaces && workspaces.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-auto w-full justify-between py-2 border border-white/[0.08] bg-muted/40 rounded-xl mb-2',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="bg-foreground text-background dark:bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    {currentWorkspace?.iconUrl ? (
                      <img src={currentWorkspace.iconUrl} alt={currentWorkspace.name} className="size-8 rounded-md object-cover" />
                    ) : (
                      <BuildingIcon className="size-5 text-emerald-400" />
                    )}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="text-muted-foreground block text-xs font-normal">
                      Discord Server
                    </span>
                    <span className="block truncate text-sm font-semibold">
                      {currentWorkspace?.name || 'Select Server'}
                    </span>
                  </span>
                </span>
                <ArrowDown01Icon className="text-muted-foreground size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                sideOffset={8}
                className="z-70 w-[calc(100vw-2rem)] max-w-sm rounded-xl p-2 shadow-lg"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5 font-semibold tracking-wider uppercase text-xs">
                    Select Server
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workspaces.map((organization) => (
                    <DropdownMenuItem
                      key={organization.id}
                      onClick={() => onWorkspaceChange?.(organization.id)}
                      className={cn(
                        'justify-between rounded-lg px-2 py-2.5 cursor-pointer',
                        organization.id === currentWorkspace?.id
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {organization.iconUrl ? (
                          <img src={organization.iconUrl} alt={organization.name} className="size-6 rounded-md object-cover" />
                        ) : (
                          <div className="size-6 rounded-md bg-white/10 text-white text-[10px] flex items-center justify-center font-bold">
                            {organization.initial}
                          </div>
                        )}
                        <span>{organization.name}</span>
                      </div>
                      {organization.id === currentWorkspace?.id && (
                        <Check className="text-primary size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <nav aria-label="More navigation" className="flex flex-col gap-1.5">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = item.href.endsWith(`/${activeSubsection}`);

              return (
                <button
                  key={item.href}
                  type="button"
                  data-active={active || undefined}
                  onClick={() => {
                    onNavigate(item.href);
                    setMoreOpen(false);
                  }}
                  className={cn(moreNavItemClassName, 'w-full text-left')}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <a
              href="https://discord.gg/mZcp3VBtBq"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMoreOpen(false)}
              className={moreNavItemClassName}
            >
              <HelpIcon />
              <span>Help & Support</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMoreOpen(false);
              }}
              className={moreNavItemClassName}
            >
              <SettingsIcon />
              <span>Settings</span>
            </a>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSignOut();
                }}
                className={cn(moreNavItemClassName, 'text-rose-400')}
              >
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type SidebarNavigationItemProps = {
  active: boolean;
  activeSubsection?: string;
  item: NavigationItem;
};

function SidebarNavigationItem({
  active,
  activeSubsection,
  item,
  onNavigate,
}: SidebarNavigationItemProps & { onNavigate: (href: string) => void }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [open, setOpen] = useState(active);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subItems = item.subItems;
  const hasSubItems = Boolean(subItems?.length);
  const showSubItems = !collapsed && open && hasSubItems;

  const activeChild = activeSubsection
    ? subItems?.find((subItem) => subItem.href.endsWith(`/${activeSubsection}`))
    : undefined;
  const DisplayedIcon = active && activeChild ? activeChild.icon : item.icon;
  const displayedLabel = active && activeChild ? activeChild.label : item.label;
  const activeChildHref = activeChild?.href;
  const isActiveSubItem = (href: string) => active && href === activeChildHref;

  function toggleOpen() {
    setOpen((currentOpen) => !currentOpen);
  }

  function openFlyout() {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
    }
    setFlyoutOpen(true);
  }

  function scheduleFlyoutClose() {
    flyoutCloseTimer.current = setTimeout(() => {
      setFlyoutOpen(false);
    }, 120);
  }

  return (
    <SidebarMenuItem>
      {collapsed && hasSubItems ? (
        <DropdownMenu
          modal={false}
          open={flyoutOpen}
          onOpenChange={setFlyoutOpen}
        >
          <DropdownMenuTrigger
            aria-label={displayedLabel}
            data-active={active || undefined}
            onPointerEnter={openFlyout}
            onPointerLeave={scheduleFlyoutClose}
            className={cn(sidebarMenuButtonClassName, 'flex w-full items-center cursor-pointer')}
          >
            <DisplayedIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            onPointerEnter={openFlyout}
            onPointerLeave={scheduleFlyoutClose}
            className={subItemsMenuContentClassName}
          >
            <NavigationSubItemsMenu
              item={item}
              isSubItemActive={isActiveSubItem}
              onSelect={onNavigate}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : hasSubItems ? (
        <SidebarMenuButton
          isActive={active}
          onClick={toggleOpen}
          className={cn(sidebarMenuButtonClassName, 'cursor-pointer')}
        >
          <DisplayedIcon />
          {!collapsed && (
            <>
              <span>{displayedLabel}</span>
              <ChevronDown
                className={cn(
                  'pointer-events-none ml-auto size-4 transition-transform text-slate-400',
                  open && 'rotate-180',
                )}
              />
            </>
          )}
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          isActive={active}
          tooltip={displayedLabel}
          className={cn(sidebarMenuButtonClassName, 'cursor-pointer')}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(item.href);
          }}
        >
          <DisplayedIcon />
          {!collapsed && <span>{displayedLabel}</span>}
        </SidebarMenuButton>
      )}

      {showSubItems ? (
        <SidebarMenuSub>
          {subItems?.map((subItem) => {
            const SubIcon = subItem.icon;
            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  isActive={isActiveSubItem(subItem.href)}
                  className={cn(sidebarMenuSubButtonClassName, 'cursor-pointer')}
                  href={subItem.href}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(subItem.href);
                  }}
                >
                  <SubIcon />
                  <span>{subItem.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

function NavigationSubItemsMenu({
  item,
  isSubItemActive,
  onSelect,
}: {
  item: NavigationItem;
  isSubItemActive: (href: string) => boolean;
  onSelect?: (href: string) => void;
}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="px-2 py-1 font-semibold tracking-wider uppercase text-[11px] text-muted-foreground">
        {item.label}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {item.subItems?.map((subItem) => {
        const SubIcon = subItem.icon;

        return (
          <DropdownMenuItem
            key={subItem.href}
            data-active={isSubItemActive(subItem.href) || undefined}
            onClick={(event) => {
              event.preventDefault();
              onSelect?.(subItem.href);
            }}
            className={cn(
              sidebarMenuSubButtonClassName,
              'h-10 gap-2.5 px-3 focus:bg-muted focus:text-foreground data-active:focus:bg-card data-active:focus:text-primary cursor-pointer',
            )}
          >
            <SubIcon />
            <span>{subItem.label}</span>
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}

export { DashboardSidebar as AppShellSidebar };
