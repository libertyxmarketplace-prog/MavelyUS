// Client for the PRC (Police Roleplay Community) ER:LC server API.
// Docs: https://apidocs.policeroleplay.community
const BASE = 'https://api.policeroleplay.community/v1';
const cache = new Map();

export async function prc(key, path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Server-Key': key,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      res.status === 403
        ? 'The ER:LC server key was rejected. Check it in Settings.'
        : res.status === 429
          ? 'The PRC API is rate limiting requests. Try again in a few seconds.'
          : (data && data.message) || `PRC API returned ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Short cache so the dashboard and commands do not burn through PRC rate limits.
export async function prcCached(key, path, ttl = 15000) {
  const id = key + path;
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  const data = await prc(key, path);
  cache.set(id, { at: Date.now(), data });
  return data;
}

export function parsePlayer(value) {
  const [name, id] = String(value || '').split(':');
  return { name: name || 'Unknown', id: id || '' };
}
