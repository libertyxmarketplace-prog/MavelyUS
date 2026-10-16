import { Client, GatewayIntentBits, REST, Routes, ActivityType, Events } from 'discord.js';
import * as db from './db.js';
import { prc, parsePlayer } from './erlc.js';
import { COMMANDS, isModuleOn, normalizeConfig, buildEmbed, renderTemplate } from '../shared/catalog.js';
import { handlers, handleButton, handleAutocomplete, makeEmbed } from './handlers.js';

const EPHEMERAL = 64;
const instances = new Map();

export function getInstance(userId) {
  let inst = instances.get(userId);
  if (!inst) {
    inst = new BotInstance(userId);
    instances.set(userId, inst);
  }
  return inst;
}

export function ensureBotRecord(user) {
  user.bot ||= {};
  const b = user.bot;
  b.config = normalizeConfig(b.config);
  b.state ||= {};
  b.state.shifts ||= {};
  b.state.shiftTotals ||= {};
  b.state.tickets ||= {};
  b.state.warnings ||= {};
  if (b.state.session === undefined) b.state.session = null;
  b.stats ||= { commands: {} };
  b.errors ||= [];
  return b;
}

const ACTIVITY = {
  Playing: ActivityType.Playing,
  Watching: ActivityType.Watching,
  Listening: ActivityType.Listening,
  Competing: ActivityType.Competing,
  Custom: ActivityType.Custom,
};

class BotInstance {
  constructor(userId) {
    this.userId = userId;
    this.client = null;
    this.status = 'offline';
    this.startedAt = null;
    this.lastError = null;
    this.activity = [];
    this.cooldowns = new Map();
    this.votes = new Map();
    this.relayTimer = null;
    this.relayCursor = {};
  }

  get record() {
    return db.getUser(this.userId)?.bot || null;
  }

  get config() {
    return this.record?.config;
  }

  log(type, message) {
    this.activity.unshift({ type, message: String(message).slice(0, 300), at: Date.now() });
    if (this.activity.length > 80) this.activity.length = 80;
  }

  error(source, err) {
    const entry = { source, message: String(err?.message || err).slice(0, 400), at: Date.now() };
    const rec = this.record;
    if (rec) {
      rec.errors = [entry, ...(rec.errors || [])].slice(0, 100);
      db.save();
    }
    this.log('error', `${source}: ${entry.message}`);
  }

  intents() {
    const c = this.config;
    const list = [GatewayIntentBits.Guilds];
    if (isModuleOn(c, 'welcome')) list.push(GatewayIntentBits.GuildMembers);
    if (isModuleOn(c, 'tickets')) list.push(GatewayIntentBits.GuildMessages);
    return list;
  }

  async start() {
    if (this.client) return;
    const token = db.decrypt(this.record?.tokenEnc);
    if (!token) throw new Error('Add your bot token in Settings first.');
    this.status = 'starting';
    this.lastError = null;
    const client = new Client({ intents: this.intents() });
    this.client = client;

    client.once(Events.ClientReady, async () => {
      this.status = 'online';
      this.startedAt = Date.now();
      this.log('info', `Logged in as ${client.user.tag}`);
      this.applyPresence();
      await this.registerCommands().catch((e) => this.error('Command sync', e));
      this.startRelay();
    });
    client.on(Events.InteractionCreate, (i) => this.onInteraction(i).catch((e) => this.error('Interaction', e)));
    client.on(Events.GuildMemberAdd, (m) => this.onMember(m, 'welcome').catch((e) => this.error('Welcome', e)));
    client.on(Events.GuildMemberRemove, (m) => this.onMember(m, 'goodbye').catch((e) => this.error('Goodbye', e)));
    client.on(Events.MessageCreate, (msg) => this.onMessage(msg));
    client.on(Events.Error, (e) => this.error('Gateway', e));
    client.on(Events.ShardDisconnect, () => {
      if (this.client === client) this.log('warn', 'Gateway disconnected, reconnecting');
    });
    client.on(Events.ShardResume, () => this.log('info', 'Gateway connection resumed'));

    try {
      await client.login(token);
    } catch (e) {
      this.client = null;
      client.destroy().catch(() => {});
      this.status = 'error';
      const msg = /disallowed intents/i.test(e.message)
        ? 'Discord rejected the gateway intents. Turn on Server Members Intent in the Developer Portal under Bot, or disable the Welcome module.'
        : /invalid token|TokenInvalid/i.test(e.message + e.code)
          ? 'Discord rejected the bot token. Paste a fresh token in Settings.'
          : e.message;
      this.lastError = msg;
      this.error('Login', msg);
      throw new Error(msg);
    }
    this.record.autoStart = true;
    db.save();
  }

  async stop({ manual = true } = {}) {
    clearInterval(this.relayTimer);
    this.relayTimer = null;
    const client = this.client;
    this.client = null;
    this.status = 'offline';
    this.startedAt = null;
    if (client) await client.destroy().catch(() => {});
    if (manual && this.record) {
      this.record.autoStart = false;
      db.save();
    }
    this.log('info', 'Bot stopped');
  }

  async restart() {
    await this.stop({ manual: false });
    await this.start();
  }

  // Called after config changes so a running bot picks them up without a restart.
  async applyConfig(previous) {
    if (!this.client || this.status !== 'online') return;
    const intentsBefore = previous ? [isModuleOn(previous, 'welcome'), isModuleOn(previous, 'tickets')].join() : '';
    const intentsNow = [isModuleOn(this.config, 'welcome'), isModuleOn(this.config, 'tickets')].join();
    if (previous && intentsBefore !== intentsNow) {
      this.log('info', 'Modules changed the required intents, restarting');
      return this.restart();
    }
    this.applyPresence();
    await this.registerCommands();
    clearInterval(this.relayTimer);
    this.startRelay();
  }

  applyPresence() {
    const p = this.config.presence;
    const text = p.activityText?.trim();
    const activities = text
      ? [p.activityType === 'Custom' ? { name: 'Custom Status', state: text, type: ActivityType.Custom } : { name: text, type: ACTIVITY[p.activityType] }]
      : [];
    this.client?.user?.setPresence({ status: p.status, activities });
  }

  async registerCommands() {
    const c = this.config;
    if (!c.guildId) {
      this.log('warn', 'No server selected, slash commands were not registered');
      return 0;
    }
    const body = [];
    for (const [name, def] of Object.entries(COMMANDS)) {
      if (!isModuleOn(c, def.module) || !c.commands[name]?.enabled) continue;
      const data = { name, description: def.description, options: def.options || [], dm_permission: false };
      body.push(data);
      for (const alias of c.commands[name].aliases) {
        body.push({ ...data, name: alias, description: `${def.description} (alias of /${name})`.slice(0, 100) });
      }
    }
    const rest = new REST().setToken(db.decrypt(this.record.tokenEnc));
    await rest.put(Routes.applicationGuildCommands(this.client.application.id, c.guildId), { body });
    this.log('info', `Synced ${body.length} slash commands`);
    return body.length;
  }

  resolveName(called) {
    if (COMMANDS[called]) return called;
    for (const [name, cc] of Object.entries(this.config.commands)) if (cc.aliases.includes(called)) return name;
    return null;
  }

  track(name, failed) {
    const stats = (this.record.stats.commands[name] ||= { count: 0, failures: 0, lastUsed: 0 });
    if (failed) stats.failures += 1;
    else {
      stats.count += 1;
      stats.lastUsed = Date.now();
    }
    db.save();
  }

  async onInteraction(i) {
    if (i.guildId && this.config.guildId && i.guildId !== this.config.guildId) return;
    if (i.isAutocomplete()) return handleAutocomplete(this, i, this.resolveName(i.commandName));
    if (i.isButton() && i.customId.startsWith('civ:')) {
      return handleButton(this, i).catch(async (e) => {
        this.error('Button', e);
        const payload = { content: `Something went wrong: ${e.message}`, flags: EPHEMERAL };
        if (i.deferred || i.replied) await i.editReply({ content: payload.content }).catch(() => {});
        else await i.reply(payload).catch(() => {});
      });
    }
    if (!i.isChatInputCommand()) return;

    const name = this.resolveName(i.commandName);
    const def = COMMANDS[name];
    const c = this.config;
    const cc = c.commands[name];
    const deny = (content) => i.reply({ content, flags: EPHEMERAL });

    if (!def || !cc?.enabled || !isModuleOn(c, def.module)) return deny('This command is turned off.');
    if (cc.channels.length && !cc.channels.includes(i.channelId)) {
      return deny(`Use this command in ${cc.channels.map((id) => `<#${id}>`).join(', ')}.`);
    }
    const roleIds = i.member?.roles?.cache ? [...i.member.roles.cache.keys()] : i.member?.roles || [];
    const isAdmin = i.memberPermissions?.has('Administrator');
    if (cc.staffOnly && !isAdmin && !c.staffRoleIds.some((r) => roleIds.includes(r))) return deny('This command is for staff only.');
    if (cc.roles.length && !isAdmin && !cc.roles.some((r) => roleIds.includes(r))) return deny('You do not have a role that can use this command.');
    if (cc.cooldown > 0) {
      const key = `${name}:${i.user.id}`;
      const until = this.cooldowns.get(key) || 0;
      if (until > Date.now()) return deny(`Slow down. Try again <t:${Math.ceil(until / 1000)}:R>.`);
      this.cooldowns.set(key, Date.now() + cc.cooldown * 1000);
    }

    const ctx = {
      i,
      bot: this,
      config: c,
      record: this.record,
      defer: (ephemeral = false) => (i.deferred || i.replied ? null : i.deferReply(ephemeral ? { flags: EPHEMERAL } : {})),
      reply: (payload) => {
        if (i.deferred || i.replied) {
          const { flags, ...rest } = payload;
          return i.editReply(rest);
        }
        return i.reply(payload);
      },
      respond: (key, vars, extra = {}) => {
        const embed = makeEmbed(this, name, key, vars, extra, i.guild);
        const payload = { embeds: [embed], components: extra.components, allowedMentions: { parse: [] } };
        if (i.deferred || i.replied) return i.editReply(payload);
        return i.reply({ ...payload, ...(extra.ephemeral ? { flags: EPHEMERAL } : {}) });
      },
    };

    try {
      await handlers[name](ctx);
      this.track(name, false);
      this.log('command', `/${i.commandName} used by ${i.user.username}`);
    } catch (e) {
      this.track(name, true);
      this.error(`/${name}`, e);
      const content = `Something went wrong: ${e.message}`;
      if (i.deferred || i.replied) await i.editReply({ content, embeds: [], components: [] }).catch(() => {});
      else await i.reply({ content, flags: EPHEMERAL }).catch(() => {});
    }
  }

  async onMember(member, kind) {
    const c = this.config;
    const cfg = c[kind];
    if (!isModuleOn(c, 'welcome') || !cfg.enabled || !cfg.channelId || member.guild.id !== c.guildId) return;
    const channel = await member.guild.channels.fetch(cfg.channelId).catch(() => null);
    if (!channel?.isTextBased()) throw new Error(`Cannot post in channel ${cfg.channelId}`);
    const vars = {
      user: `<@${member.id}>`,
      username: member.user.username,
      server: member.guild.name,
      memberCount: member.guild.memberCount.toLocaleString('en-US'),
    };
    const embed = buildEmbed({
      style: c.style,
      template: { title: cfg.title, description: cfg.description },
      vars,
      botAvatar: this.client.user.displayAvatarURL({ size: 256 }),
      guildIcon: member.guild.iconURL({ size: 256 }),
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      image: cfg.image || undefined,
    });
    await channel.send({ embeds: [embed], allowedMentions: { users: kind === 'welcome' ? [member.id] : [] } });
    this.log('info', `${kind === 'welcome' ? 'Welcomed' : 'Said goodbye to'} ${member.user.username}`);
  }

  onMessage(msg) {
    if (msg.author.bot || !isModuleOn(this.config, 'tickets')) return;
    const ticket = this.record.state.tickets[msg.channelId];
    if (!ticket) return;
    ticket.awaiting = msg.author.id === ticket.openerId;
    ticket.lastMessageAt = Date.now();
    db.save();
  }

  startRelay() {
    if (!isModuleOn(this.config, 'erlc_logs')) return;
    const key = db.decrypt(this.record.erlcKeyEnc);
    if (!key) return this.log('warn', 'Log relay is on but no ER:LC key is set');
    const run = () => this.relayTick(key).catch((e) => this.error('Log relay', e));
    run();
    this.relayTimer = setInterval(run, 30000);
  }

  async relayTick(key) {
    const s = this.config.modules.erlc_logs.settings;
    const feeds = [
      ['join', s.joinChannelId, '/server/joinlogs', (e) => `${e.Join ? 'Joined' : 'Left'}: **${parsePlayer(e.Player).name}**`],
      ['kill', s.killChannelId, '/server/killlogs', (e) => `**${parsePlayer(e.Killer).name}** killed **${parsePlayer(e.Killed).name}**`],
      ['command', s.commandChannelId, '/server/commandlogs', (e) => `**${parsePlayer(e.Player).name}** ran \`${e.Command}\``],
      ['modcall', s.modcallChannelId, '/server/modcalls', (e) => `**${parsePlayer(e.Caller).name}** called a moderator${e.Moderator ? `, answered by **${parsePlayer(e.Moderator).name}**` : ''}`],
    ];
    for (const [type, channelId, path, line] of feeds) {
      if (!channelId) continue;
      const entries = (await prc(key, path)) || [];
      const newest = entries.reduce((m, e) => Math.max(m, e.Timestamp || 0), 0);
      const cursor = this.relayCursor[type];
      this.relayCursor[type] = Math.max(cursor || 0, newest);
      if (cursor === undefined) continue; // first run only sets the baseline
      const fresh = entries.filter((e) => e.Timestamp > cursor).sort((a, b) => a.Timestamp - b.Timestamp);
      if (!fresh.length) continue;
      const channel = await this.client.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) throw new Error(`Cannot post ${type} logs in channel ${channelId}`);
      const lines = fresh.map((e) => `<t:${e.Timestamp}:T> ${line(e)}`).join('\n');
      await channel.send({
        embeds: [buildEmbed({ style: this.config.style, template: { title: `ER:LC ${type} logs`, description: lines.slice(0, 4000) }, vars: {} })],
        allowedMentions: { parse: [] },
      });
    }
  }

  snapshot() {
    return {
      status: this.status,
      startedAt: this.startedAt,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
      lastError: this.lastError,
      latency: this.client && this.status === 'online' ? Math.round(this.client.ws.ping) : null,
    };
  }
}

export { renderTemplate };

export async function autoStartAll() {
  for (const user of db.allUsers()) {
    if (!user.bot?.autoStart || !user.bot?.tokenEnc) continue;
    ensureBotRecord(user);
    getInstance(user.id)
      .start()
      .catch(() => {});
  }
}
