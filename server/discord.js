const API = 'https://discord.com/api/v10';

export async function discordApi(path, { token, bearer, method = 'GET', body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bot ${token}`;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  let payload;
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(API + path, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const detail = data?.errors ? ` ${JSON.stringify(data.errors).slice(0, 300)}` : '';
    const err = new Error((data?.message || data?.error_description || `Discord API returned ${res.status}`) + detail);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function avatarUrl(user, size = 128) {
  if (!user) return null;
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function guildIconUrl(guild, size = 128) {
  if (!guild?.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
}

// Application flags tell us which privileged intents are enabled in the Developer Portal.
export const APP_FLAGS = {
  GATEWAY_PRESENCE: 1 << 12,
  GATEWAY_PRESENCE_LIMITED: 1 << 13,
  GATEWAY_GUILD_MEMBERS: 1 << 14,
  GATEWAY_GUILD_MEMBERS_LIMITED: 1 << 15,
  GATEWAY_MESSAGE_CONTENT: 1 << 18,
  GATEWAY_MESSAGE_CONTENT_LIMITED: 1 << 19,
};

export function hasMembersIntent(flags = 0) {
  return !!(flags & APP_FLAGS.GATEWAY_GUILD_MEMBERS || flags & APP_FLAGS.GATEWAY_GUILD_MEMBERS_LIMITED);
}
