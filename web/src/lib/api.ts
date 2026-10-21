import type { DiscordGuild, DiscordUser, WorkspaceBot, LiveErlcServer, WorkspaceCustomizations } from '../types';

let csrfToken = '';

export function getDiscordLoginUrl(): string {
  // The backend builds the Discord authorize URL so the OAuth state and server-membership check apply.
  return '/api/auth/discord/start?returnTo=%2Fdashboard';
}

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export async function api<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include'
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // If CSRF expired or token missing, refresh once and retry automatically
    if (response.status === 403 && !isRetry && path !== '/auth/me') {
      try {
        const authData = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json());
        if (authData?.csrfToken) {
          setCsrfToken(authData.csrfToken);
          return api<T>(path, init, true);
        }
      } catch {}
    }
    const error: any = new Error(payload.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload as T;
}

export async function fetchAuthMe(): Promise<{ user: DiscordUser | null; csrfToken: string; guilds: DiscordGuild[] }> {
  const data = await api<{ user: DiscordUser | null; csrfToken: string; guilds: DiscordGuild[] }>('/auth/me');
  if (data.csrfToken) {
    setCsrfToken(data.csrfToken);
  }
  return data;
}

export async function fetchGuilds(refresh = false): Promise<DiscordGuild[]> {
  try {
    const data = await api<{ servers: DiscordGuild[] }>(`/servers${refresh ? '?refresh=1' : ''}`);
    if (data.servers && Array.isArray(data.servers)) return data.servers;
  } catch {
    // No servers or network offline
  }
  return [];
}

export async function fetchWorkspace(guildId: string): Promise<{ workspace: WorkspaceBot; guild: DiscordGuild }> {
  try {
    return await api<{ workspace: WorkspaceBot; guild: DiscordGuild }>(`/workspace/${guildId}`);
  } catch {
    const cachedName = localStorage.getItem(`server_name_${guildId}`) || 'Discord Server';
    const cachedIcon = localStorage.getItem(`server_icon_${guildId}`);
    return {
      workspace: {
        id: `ws-${guildId}`,
        guildId,
        isMainBot: false,
        discordBotId: '1552165138017165372',
        botUser: {
          id: '1552165138017165372',
          username: 'Mavely Bot',
          avatarUrl: ''
        },
        isInGuild: true,
        inviteUrl: getBotInviteUrl(guildId),
        status: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasErlcApiKey: false,
        customizations: {
          serverName: cachedName,
          joinCode: '',
          j4jEnabled: true,
          j4jDailyTarget: 50,
          joinCredits: 28,
          sessionState: 'PATROL_LIVE'
        }
      },      guild: {
        id: guildId,
        name: cachedName,
        icon: null,
        iconUrl: cachedIcon,
        owner: true
      }
    };
  }
}

export async function createWorkspace(guildId: string): Promise<{ workspace: WorkspaceBot; created: boolean }> {
  try {
    return await api<{ workspace: WorkspaceBot; created: boolean }>('/workspace', {
      method: 'POST',
      body: JSON.stringify({ guildId })
    });
  } catch {
    const cachedName = localStorage.getItem(`server_name_${guildId}`) || 'Discord Server';
    const cachedIcon = localStorage.getItem(`server_icon_${guildId}`);
    return {
      workspace: {
        id: `ws-${guildId}`,
        guildId,
        isMainBot: false,
        discordBotId: '1552165138017165372',
        botUser: { id: '1552165138017165372', username: 'Mavely Bot', avatarUrl: '' },
        isInGuild: true,
        inviteUrl: getBotInviteUrl(guildId),
        status: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasErlcApiKey: false,
        customizations: {
          serverName: cachedName,
          joinCode: '',
          j4jEnabled: true,
          j4jDailyTarget: 50,
          joinCredits: 28,
          sessionState: 'PATROL_LIVE'
        }
      },
      guild: {
        id: guildId,
        name: cachedName,
        icon: null,
        iconUrl: cachedIcon,
        owner: true
      }
    };
  }
}

export async function saveWorkspaceConfig(guildId: string, customizations: Partial<WorkspaceCustomizations>): Promise<{ success: boolean; workspace: WorkspaceBot }> {
  return api<{ success: boolean; workspace: WorkspaceBot }>(`/workspace/${guildId}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ customizations })
  });
}

export async function updateWorkspaceCredentials(guildId: string, creds: { erlcApiKey: string }): Promise<{ success: boolean; workspace: WorkspaceBot }> {
  return api<{ success: boolean; workspace: WorkspaceBot }>(`/workspace/${guildId}/credentials`, {
    method: 'POST',
    body: JSON.stringify(creds)
  });
}

export async function fetchErlcLive(guildId: string): Promise<LiveErlcServer> {
  return api<LiveErlcServer>(`/workspace/${guildId}/erlc`);
}

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}
