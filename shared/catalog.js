// Shared between the API server, the bot runtime and the web UI.
// Everything the dashboard lets a user configure is defined here.

export const MODULES = [
  {
    id: 'core',
    name: 'Core',
    category: 'Essentials',
    version: '1.0.0',
    tier: 'free',
    required: true,
    summary: 'A latency check and a help menu that lists your enabled commands.',
    description:
      'Always installed. Gives your bot /ping and a /help menu that only shows the commands you have turned on.',
    requirements: [],
    settings: [],
  },
  {
    id: 'erlc',
    name: 'ER:LC Server Info',
    category: 'ER:LC',
    version: '1.0.0',
    tier: 'free',
    summary: 'Player count, queue, staff in game and join code from the PRC API.',
    description:
      'Reads your private server through the official PRC server API so members can check who is in game and how long the queue is without joining.',
    requirements: ['ER:LC server key'],
    settings: [],
  },
  {
    id: 'sessions',
    name: 'Sessions',
    category: 'ER:LC',
    version: '1.0.0',
    tier: 'free',
    summary: 'Session startup, shutdown and vote announcements with a role ping.',
    description:
      'Staff post startup and shutdown announcements, or open a vote that announces the session on its own once enough members vote.',
    requirements: ['Announcement channel'],
    settings: [
      { key: 'channelId', type: 'channel', label: 'Announcement channel' },
      { key: 'pingRoleId', type: 'role', label: 'Role to ping' },
      { key: 'voteThreshold', type: 'number', label: 'Votes needed to start', default: 5, min: 1, max: 50 },
    ],
  },
  {
    id: 'shifts',
    name: 'Shifts',
    category: 'Staff',
    version: '1.0.0',
    tier: 'free',
    summary: 'Clock in and out, with a leaderboard of time on duty.',
    description:
      'Staff run /shift start and /shift end. Time is tracked per member and the dashboard shows who is on duty right now.',
    requirements: [],
    settings: [{ key: 'logChannelId', type: 'channel', label: 'Shift log channel' }],
  },
  {
    id: 'moderation',
    name: 'Moderation',
    category: 'Staff',
    version: '1.0.0',
    tier: 'free',
    summary: 'Warn, timeout, kick and ban with logged reasons.',
    description:
      'Every action is stored with the moderator and reason, and posted to your log channel if you set one.',
    requirements: ['Bot role placed above the members it moderates'],
    settings: [{ key: 'logChannelId', type: 'channel', label: 'Moderation log channel' }],
  },
  {
    id: 'tickets',
    name: 'Tickets',
    category: 'Support',
    version: '1.0.0',
    tier: 'free',
    summary: 'A button panel that opens private support channels.',
    description:
      'Members press a button to open a private channel with your support team. The dashboard shows tickets still waiting on a staff reply.',
    requirements: ['Manage Channels permission'],
    settings: [
      { key: 'categoryId', type: 'category', label: 'Ticket category' },
      { key: 'supportRoleId', type: 'role', label: 'Support role' },
    ],
  },
  {
    id: 'welcome',
    name: 'Welcome and Goodbye',
    category: 'Community',
    version: '1.0.0',
    tier: 'free',
    summary: 'Greet new members and post when someone leaves.',
    description:
      'Messages are written in the Bot Builder with a live preview. Uses the same embed style as the rest of your bot.',
    requirements: ['Server Members Intent enabled in the Discord Developer Portal'],
    configuredIn: 'builder',
    settings: [],
  },
  {
    id: 'erlc_logs',
    name: 'ER:LC Log Relay',
    category: 'ER:LC',
    version: '1.0.0',
    tier: 'premium',
    summary: 'Mirror join, kill, command and mod call logs into Discord.',
    description:
      'Checks your server every 30 seconds and posts new log entries to the channels you choose. Leave a channel empty to skip that log.',
    requirements: ['ER:LC server key'],
    settings: [
      { key: 'joinChannelId', type: 'channel', label: 'Join logs' },
      { key: 'killChannelId', type: 'channel', label: 'Kill logs' },
      { key: 'commandChannelId', type: 'channel', label: 'Command logs' },
      { key: 'modcallChannelId', type: 'channel', label: 'Mod calls' },
    ],
  },
  {
    id: 'remote',
    name: 'Remote Commands',
    category: 'ER:LC',
    version: '1.0.0',
    tier: 'premium',
    summary: 'Run in-game commands like :h and :pm from Discord.',
    description:
      'Staff run /erlc-run to send a command to your server. Every use is logged with who ran it.',
    requirements: ['ER:LC server key', 'Staff role set in Settings'],
    settings: [{ key: 'logChannelId', type: 'channel', label: 'Remote command log channel' }],
  },
];

const O = { SUB: 1, STRING: 3, INTEGER: 4, USER: 6 };

export const COMMANDS = {
  ping: {
    module: 'core',
    description: 'Check the bot latency',
    responses: {
      default: { label: 'Reply', title: 'Pong', description: 'Gateway latency is **{latency}ms**.', vars: ['latency'] },
    },
  },
  help: {
    module: 'core',
    description: 'List the commands you can use',
    options: [{ type: O.STRING, name: 'command', description: 'Show one command', autocomplete: true }],
    responses: {
      default: { label: 'Reply', title: '{bot} commands', description: '{list}', vars: ['bot', 'list'] },
    },
  },
  server: {
    module: 'erlc',
    description: 'Show the ER:LC server status',
    responses: {
      default: {
        label: 'Reply',
        title: '{name}',
        description: '**{players}/{maxPlayers}** in game, **{queue}** in queue.\nJoin code: **{joinKey}**',
        vars: ['name', 'players', 'maxPlayers', 'queue', 'joinKey'],
      },
    },
  },
  players: {
    module: 'erlc',
    description: 'List the players in the ER:LC server',
    options: [{ type: O.STRING, name: 'team', description: 'Filter by team', autocomplete: true }],
    responses: {
      default: { label: 'Reply', title: 'Players in game ({count})', description: '{list}', vars: ['count', 'list', 'team'] },
    },
  },
  queue: {
    module: 'erlc',
    description: 'Show how many players are in the queue',
    responses: {
      default: { label: 'Reply', title: 'Server queue', description: '**{queue}** waiting to join.', vars: ['queue'] },
    },
  },
  staffonline: {
    module: 'erlc',
    description: 'Show staff who are in game right now',
    responses: {
      default: { label: 'Reply', title: 'Staff in game ({count})', description: '{list}', vars: ['count', 'list'] },
    },
  },
  ssu: {
    module: 'sessions',
    staffDefault: true,
    description: 'Announce a session startup',
    responses: {
      default: {
        label: 'Announcement',
        title: 'Session startup',
        description: 'A session is starting on **{server}**.\nJoin code: **{joinKey}**\nHosted by {host}',
        vars: ['server', 'joinKey', 'host'],
      },
    },
  },
  ssd: {
    module: 'sessions',
    staffDefault: true,
    description: 'Announce a session shutdown',
    responses: {
      default: {
        label: 'Announcement',
        title: 'Session shutdown',
        description: 'The session has ended after {duration}. Thanks for playing.',
        vars: ['duration', 'host'],
      },
    },
  },
  ssuvote: {
    module: 'sessions',
    staffDefault: true,
    description: 'Open a vote to start a session',
    responses: {
      default: {
        label: 'Vote message',
        title: 'Session vote',
        description: 'Press the button if you can join. The session starts at **{threshold}** votes.',
        vars: ['threshold', 'host'],
      },
    },
  },
  shift: {
    module: 'shifts',
    staffDefault: true,
    description: 'Clock in, clock out and view shift time',
    options: [
      { type: O.SUB, name: 'start', description: 'Clock in' },
      { type: O.SUB, name: 'end', description: 'Clock out' },
      { type: O.SUB, name: 'status', description: 'See your time on duty' },
      { type: O.SUB, name: 'leaderboard', description: 'Staff ranked by time on duty' },
    ],
    responses: {
      start: { label: 'Shift started', title: 'Shift started', description: '{user} is now on duty.', vars: ['user'] },
      end: { label: 'Shift ended', title: 'Shift ended', description: '{user} was on duty for **{duration}**.', vars: ['user', 'duration'] },
      status: { label: 'Status', title: 'Shift status', description: 'Current shift: **{current}**\nTotal: **{total}**', vars: ['current', 'total'] },
      leaderboard: { label: 'Leaderboard', title: 'Shift leaderboard', description: '{list}', vars: ['list'] },
    },
  },
  warn: {
    module: 'moderation',
    staffDefault: true,
    description: 'Warn a member',
    options: [
      { type: O.USER, name: 'member', description: 'Member to warn', required: true },
      { type: O.STRING, name: 'reason', description: 'Reason', required: true },
    ],
    responses: {
      default: { label: 'Reply', title: 'Member warned', description: '{member} was warned.\nReason: {reason}', vars: ['member', 'moderator', 'reason', 'count'] },
    },
  },
  warnings: {
    module: 'moderation',
    staffDefault: true,
    description: 'List the warnings for a member',
    options: [{ type: O.USER, name: 'member', description: 'Member to look up', required: true }],
    responses: {
      default: { label: 'Reply', title: 'Warnings for {username}', description: '{list}', vars: ['username', 'count', 'list'] },
    },
  },
  timeout: {
    module: 'moderation',
    staffDefault: true,
    description: 'Timeout a member',
    options: [
      { type: O.USER, name: 'member', description: 'Member to timeout', required: true },
      { type: O.INTEGER, name: 'minutes', description: 'Length in minutes', required: true, min_value: 1, max_value: 40320 },
      { type: O.STRING, name: 'reason', description: 'Reason' },
    ],
    responses: {
      default: { label: 'Reply', title: 'Member timed out', description: '{member} was timed out for {minutes} minutes.\nReason: {reason}', vars: ['member', 'minutes', 'reason', 'moderator'] },
    },
  },
  kick: {
    module: 'moderation',
    staffDefault: true,
    description: 'Kick a member',
    options: [
      { type: O.USER, name: 'member', description: 'Member to kick', required: true },
      { type: O.STRING, name: 'reason', description: 'Reason' },
    ],
    responses: {
      default: { label: 'Reply', title: 'Member kicked', description: '{member} was kicked.\nReason: {reason}', vars: ['member', 'reason', 'moderator'] },
    },
  },
  ban: {
    module: 'moderation',
    staffDefault: true,
    description: 'Ban a member',
    options: [
      { type: O.USER, name: 'member', description: 'Member to ban', required: true },
      { type: O.STRING, name: 'reason', description: 'Reason' },
    ],
    responses: {
      default: { label: 'Reply', title: 'Member banned', description: '{member} was banned.\nReason: {reason}', vars: ['member', 'reason', 'moderator'] },
    },
  },
  ticketpanel: {
    module: 'tickets',
    staffDefault: true,
    description: 'Post the ticket panel in this channel',
    responses: {
      default: { label: 'Panel', title: 'Support', description: 'Press the button below to open a private ticket with our staff team.', vars: [] },
    },
  },
  close: {
    module: 'tickets',
    description: 'Close the current ticket',
    responses: {
      default: { label: 'Reply', title: 'Ticket closed', description: 'Closed by {user}. This channel will be deleted in 5 seconds.', vars: ['user'] },
    },
  },
  'erlc-run': {
    module: 'remote',
    staffDefault: true,
    description: 'Run a command on the ER:LC server',
    options: [{ type: O.STRING, name: 'command', description: 'For example :h Restart in 5 minutes', required: true }],
    responses: {
      default: { label: 'Reply', title: 'Command sent', description: '`{command}` was sent to the server.', vars: ['command', 'user'] },
    },
  },
};

export const DEFAULT_INSTALLED = ['core', 'erlc', 'sessions', 'shifts', 'moderation'];

export const PRESENCE_TYPES = ['Playing', 'Watching', 'Listening', 'Competing', 'Custom'];

export function defaultModuleState(id, installed = DEFAULT_INSTALLED.includes(id)) {
  const mod = MODULES.find((m) => m.id === id);
  const settings = {};
  for (const s of mod?.settings || []) settings[s.key] = s.default ?? (s.type === 'number' ? 0 : '');
  return { installed: mod?.required ? true : installed, enabled: mod?.required ? true : installed, settings };
}

export function defaultCommandState(name) {
  return {
    enabled: true,
    roles: [],
    channels: [],
    cooldown: 0,
    staffOnly: !!COMMANDS[name]?.staffDefault,
    aliases: [],
    responses: {},
  };
}

export const DEFAULT_WELCOME = {
  enabled: false,
  channelId: '',
  title: 'Welcome to {server}',
  description: 'Hey {user}, glad you made it. You are member **#{memberCount}**.',
  image: '',
};

export const DEFAULT_GOODBYE = {
  enabled: false,
  channelId: '',
  title: '',
  description: '**{username}** left the server.',
  image: '',
};

export const DEFAULT_STYLE = {
  color: '#2E90FA',
  footerText: '',
  footerIcon: '',
  timestamp: true,
  thumbnail: 'none',
};

export function defaultConfig() {
  const modules = {};
  for (const m of MODULES) modules[m.id] = defaultModuleState(m.id);
  const commands = {};
  for (const name of Object.keys(COMMANDS)) commands[name] = defaultCommandState(name);
  return {
    guildId: '',
    staffRoleIds: [],
    presence: { status: 'online', activityType: 'Watching', activityText: 'ER:LC' },
    style: { ...DEFAULT_STYLE },
    modules,
    commands,
    welcome: { ...DEFAULT_WELCOME },
    goodbye: { ...DEFAULT_GOODBYE },
  };
}

const isStr = (v) => typeof v === 'string';
const str = (v, max = 2000) => (isStr(v) ? v.slice(0, max) : '');
const snowflake = (v) => (isStr(v) && /^\d{15,25}$/.test(v) ? v : '');
const snowflakes = (v) => (Array.isArray(v) ? [...new Set(v.map(snowflake).filter(Boolean))].slice(0, 50) : []);
const hex = (v, fb) => (isStr(v) && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : fb);
export const COMMAND_NAME_RE = /^[a-z0-9_-]{1,32}$/;

// Takes any input (saved config, imported file, request body) and returns a valid config.
export function normalizeConfig(input) {
  const base = defaultConfig();
  const src = input && typeof input === 'object' ? input : {};
  const out = base;
  out.guildId = snowflake(src.guildId);
  out.staffRoleIds = snowflakes(src.staffRoleIds);

  const p = src.presence || {};
  out.presence = {
    status: ['online', 'idle', 'dnd', 'invisible'].includes(p.status) ? p.status : 'online',
    activityType: PRESENCE_TYPES.includes(p.activityType) ? p.activityType : 'Watching',
    activityText: str(p.activityText, 128),
  };

  const s = src.style || {};
  out.style = {
    color: hex(s.color, DEFAULT_STYLE.color),
    footerText: str(s.footerText, 2048),
    footerIcon: /^https:\/\//.test(s.footerIcon || '') ? str(s.footerIcon, 500) : '',
    timestamp: s.timestamp !== false,
    thumbnail: ['none', 'bot', 'server'].includes(s.thumbnail) ? s.thumbnail : 'none',
  };

  for (const m of MODULES) {
    const given = src.modules?.[m.id];
    if (!given) continue;
    const mod = out.modules[m.id];
    mod.installed = m.required ? true : !!given.installed;
    mod.enabled = m.required ? true : mod.installed && !!given.enabled;
    for (const set of m.settings) {
      const v = given.settings?.[set.key];
      if (set.type === 'number') {
        const n = Number(v);
        mod.settings[set.key] = Number.isFinite(n) ? Math.min(set.max ?? 1e9, Math.max(set.min ?? 0, Math.round(n))) : set.default ?? 0;
      } else {
        mod.settings[set.key] = snowflake(v);
      }
    }
  }

  const taken = new Set(Object.keys(COMMANDS));
  for (const name of Object.keys(COMMANDS)) {
    const given = src.commands?.[name];
    if (!given) continue;
    const c = out.commands[name];
    c.enabled = given.enabled !== false;
    c.roles = snowflakes(given.roles);
    c.channels = snowflakes(given.channels);
    c.cooldown = Math.min(86400, Math.max(0, Math.round(Number(given.cooldown) || 0)));
    c.staffOnly = !!given.staffOnly;
    c.aliases = (Array.isArray(given.aliases) ? given.aliases : [])
      .map((a) => String(a).toLowerCase().trim())
      .filter((a) => COMMAND_NAME_RE.test(a) && !taken.has(a) && (taken.add(a), true))
      .slice(0, 5);
    const responses = {};
    for (const key of Object.keys(COMMANDS[name].responses)) {
      const r = given.responses?.[key];
      if (r && (isStr(r.title) || isStr(r.description))) {
        responses[key] = { title: str(r.title, 256), description: str(r.description, 4000) };
      }
    }
    c.responses = responses;
  }

  for (const kind of ['welcome', 'goodbye']) {
    const g = src[kind] || {};
    const d = kind === 'welcome' ? DEFAULT_WELCOME : DEFAULT_GOODBYE;
    out[kind] = {
      enabled: !!g.enabled,
      channelId: snowflake(g.channelId),
      title: isStr(g.title) ? str(g.title, 256) : d.title,
      description: isStr(g.description) ? str(g.description, 4000) : d.description,
      image: /^https:\/\//.test(g.image || '') ? str(g.image, 500) : '',
    };
  }
  return out;
}

export function isModuleOn(config, id) {
  const m = config?.modules?.[id];
  return !!(m && m.installed && m.enabled);
}

export function renderTemplate(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (match, key) =>
    vars && vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match
  );
}

export function getResponseTemplate(config, name, key = 'default') {
  const def = COMMANDS[name]?.responses?.[key] || { title: '', description: '' };
  const custom = config?.commands?.[name]?.responses?.[key];
  return {
    title: custom?.title ?? def.title,
    description: custom?.description ?? def.description,
  };
}

// Builds a Discord API embed object. Used by the bot and by every preview on the site.
export function buildEmbed({ style, template, vars, botAvatar, guildIcon, fields, image, thumbnail }) {
  const st = style || DEFAULT_STYLE;
  const embed = { color: parseInt((st.color || '#2E90FA').slice(1), 16) };
  const title = renderTemplate(template?.title, vars).trim();
  const description = renderTemplate(template?.description, vars).trim();
  if (title) embed.title = title.slice(0, 256);
  if (description) embed.description = description.slice(0, 4096);
  if (fields?.length) embed.fields = fields.slice(0, 25);
  const thumb = thumbnail || (st.thumbnail === 'bot' ? botAvatar : st.thumbnail === 'server' ? guildIcon : null);
  if (thumb) embed.thumbnail = { url: thumb };
  if (image) embed.image = { url: image };
  const footerText = renderTemplate(st.footerText, vars).trim();
  if (footerText) embed.footer = { text: footerText.slice(0, 2048), ...(st.footerIcon ? { icon_url: st.footerIcon } : {}) };
  if (st.timestamp) embed.timestamp = new Date().toISOString();
  return embed;
}

export const INVITE_PERMISSIONS = '1099511876630';
