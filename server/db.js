import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import session from 'express-session';

const DIR = path.resolve(process.cwd(), 'server', 'data');
const FILE = path.join(DIR, 'db.json');
fs.mkdirSync(DIR, { recursive: true });

let state = { users: {}, sessions: {} };
try {
  state = { users: {}, sessions: {}, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch {
  // first run
}

let timer = null;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
}
export function flush() {
  clearTimeout(timer);
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(state));
  fs.renameSync(FILE + '.tmp', FILE);
}

export function getUser(id) {
  return state.users[id] || null;
}

export function upsertUser(id, profile) {
  const user = (state.users[id] ||= { id, createdAt: Date.now(), bot: null });
  user.profile = profile;
  user.updatedAt = Date.now();
  save();
  return user;
}

export function allUsers() {
  return Object.values(state.users);
}

// Secrets (bot tokens, PRC keys) are encrypted at rest with a key derived from SESSION_SECRET.
const key = () => crypto.createHash('sha256').update(process.env.SESSION_SECRET || 'civlink-dev-secret').digest();

export function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload) {
  if (!payload) return '';
  try {
    const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

// Persists login sessions so restarting the server does not log everyone out.
export class FileSessionStore extends session.Store {
  get(sid, cb) {
    const s = state.sessions[sid];
    if (!s) return cb(null, null);
    if (s.cookie?.expires && new Date(s.cookie.expires) < new Date()) {
      delete state.sessions[sid];
      save();
      return cb(null, null);
    }
    cb(null, s);
  }
  set(sid, sess, cb) {
    state.sessions[sid] = JSON.parse(JSON.stringify(sess));
    save();
    cb?.(null);
  }
  destroy(sid, cb) {
    delete state.sessions[sid];
    save();
    cb?.(null);
  }
  touch(sid, sess, cb) {
    if (state.sessions[sid]) state.sessions[sid].cookie = sess.cookie;
    save();
    cb?.(null);
  }
}
