import type { DiscordGuild, DiscordUser, WorkspaceBot, LiveErlcServer, GuildResources, WorkspaceCustomizations } from '../types';

let csrfToken = '';

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    credentials: 'same-origin'
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
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
  const data = await api<{ servers: DiscordGuild[] }>(`/servers${refresh ? '?refresh=1' : ''}`);
  return data.servers || [];
}

export async function fetchWorkspace(guildId: string): Promise<{ workspace: WorkspaceBot; guild: DiscordGuild }> {
  return api<{ workspace: WorkspaceBot; guild: DiscordGuild }>(`/workspace/${guildId}`);
}

export async function createWorkspace(guildId: string): Promise<{ workspace: WorkspaceBot; created: boolean }> {
  return api<{ workspace: WorkspaceBot; created: boolean }>('/workspace', {
    method: 'POST',
    body: JSON.stringify({ guildId })
  });
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
