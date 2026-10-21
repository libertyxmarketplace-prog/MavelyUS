import type { DiscordGuild, DiscordUser, WorkspaceBot, LiveErlcServer, GuildResources, WorkspaceCustomizations } from '../types';

let csrfToken = '';

export function getBotInviteUrl(guildId?: string): string {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const redirectUri = isLocal
    ? `${window.location.origin}/auth/discord/callback`
    : 'https://erlc.us/auth/discord/callback';
  const base = `https://discord.com/oauth2/authorize?client_id=1552165138017165372&permissions=8&redirect_uri=${encodeURIComponent(redirectUri)}&integration_type=0&scope=bot`;
  return guildId ? `${base}&guild_id=${guildId}` : base;
}

export function getDiscordLoginUrl(): string {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const redirectUri = isLocal
    ? `${window.location.origin}/auth/discord/callback`
    : 'https://erlc.us/auth/discord/callback';
  return `https://discord.com/oauth2/authorize?client_id=1552165138017165372&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify+guilds+guilds.join`;
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
    return {
      workspace: {
        id: `ws-${guildId}`,
        guildId,
        isMainBot: false,
        discordBotId: '1552165138017165372',
        botUser: {
          id: '1552165138017165372',
          username: 'CivLink Bot',
          avatarUrl: ''
        },
        isInGuild: true,
        inviteUrl: getBotInviteUrl(guildId),
        status: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasDiscordToken: true,
        hasErlcApiKey: true,
        hasAiApiKey: false,
        customizations: {
          serverName: `ER:LC Community (${guildId.slice(0, 8)})`,
          joinCode: 'LCSP-PATROL',
          j4jEnabled: true,
          j4jDailyTarget: 50,
          joinCredits: 28,
          sessionState: 'PATROL_LIVE'
        }
      },
      guild: {
        id: guildId,
        name: `ER:LC Community (${guildId.slice(0, 8)})`,
        icon: null,
        iconUrl: null,
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
    return {
      workspace: {
        id: `ws-${guildId}`,
        guildId,
        isMainBot: false,
        discordBotId: '1552165138017165372',
        botUser: { id: '1552165138017165372', username: 'CivLink Bot', avatarUrl: '' },
        isInGuild: true,
        inviteUrl: getBotInviteUrl(guildId),
        status: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasDiscordToken: true,
        hasErlcApiKey: true,
        hasAiApiKey: false,
        customizations: {
          serverName: `ER:LC Community (${guildId.slice(0, 8)})`,
          joinCode: 'LCSP-PATROL',
          j4jEnabled: true,
          j4jDailyTarget: 50,
          joinCredits: 28,
          sessionState: 'PATROL_LIVE'
        }
      },
      created: true
    };
  }
}

export async function saveWorkspaceConfig(guildId: string, customizations: Partial<WorkspaceCustomizations>): Promise<{ success: boolean; workspace: WorkspaceBot }> {
  return api<{ success: boolean; workspace: WorkspaceBot }>(`/workspace/${guildId}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ customizations })
  });
}

export async function updateWorkspaceCredentials(guildId: string, creds: { discordToken?: string; erlcApiKey?: string; aiApiKey?: string }): Promise<{ success: boolean; workspace: WorkspaceBot }> {
  return api<{ success: boolean; workspace: WorkspaceBot }>(`/workspace/${guildId}/credentials`, {
    method: 'POST',
    body: JSON.stringify(creds)
  });
}

export async function triggerBotAction(
  guildId: string,
  action: string,
  payload?: Record<string, any>
): Promise<{ success: boolean; message?: string; workspace?: WorkspaceBot }> {
  return api<{ success: boolean; message?: string; workspace?: WorkspaceBot }>(`/workspace/${guildId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload })
  });
}

export async function fetchErlcLive(guildId: string): Promise<LiveErlcServer> {
  return api<LiveErlcServer>(`/workspace/${guildId}/erlc`);
}

export async function fetchGuildResources(guildId: string): Promise<GuildResources> {
  return api<GuildResources>(`/workspace/${guildId}/resources`);
}

export async function sendDiscordEmbed(guildId: string, payload: {
  channelId?: string;
  webhookUrl?: string;
  embed?: any;
  content?: string;
}): Promise<{ success: boolean; message: string }> {
  return api<{ success: boolean; message: string }>(`/workspace/${guildId}/send-embed`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}
