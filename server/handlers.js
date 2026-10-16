import { ChannelType, PermissionFlagsBits } from 'discord.js';
import * as db from './db.js';
import { prc, prcCached, parsePlayer } from './erlc.js';
import { COMMANDS, isModuleOn, getResponseTemplate, buildEmbed } from '../shared/catalog.js';

const EPHEMERAL = 64;
const TEAMS = ['Civilian', 'Police', 'Sheriff', 'Fire', 'DOT', 'Jail'];

export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function clip(text, max = 3900) {
  return text.length > max ? text.slice(0, max - 20) + '\n...and more' : text;
}

function erlcKey(bot) {
  const key = db.decrypt(bot.record?.erlcKeyEnc);
  if (!key) throw new Error('No ER:LC server key is set. Add one in Settings on the CivLink dashboard.');
  return key;
}

export function enabledCommands(config) {
  return Object.keys(COMMANDS).filter((n) => isModuleOn(config, COMMANDS[n].module) && config.commands[n]?.enabled);
}

export function makeEmbed(bot, name, key, vars, extra = {}, guild = null) {
  return buildEmbed({
    style: bot.config.style,
    template: getResponseTemplate(bot.config, name, key),
    vars,
    botAvatar: bot.client?.user?.displayAvatarURL({ size: 256 }),
    guildIcon: guild?.iconURL?.({ size: 256 }) || null,
    fields: extra.fields,
    image: extra.image,
    thumbnail: extra.thumbnail,
  });
}

async function sendTo(bot, channelId, payload) {
  if (!channelId) return null;
  const channel = await bot.client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) throw new Error(`The bot cannot see channel ${channelId}. Check the channel and its permissions.`);
  return channel.send(payload);
}

async function postSessionStart(bot, guild, hostId) {
  const settings = bot.config.modules.sessions.settings;
  if (!settings.channelId) throw new Error('Set an announcement channel for the Sessions module first.');
  let joinKey = 'Not set';
  let serverName = guild?.name || 'the server';
  const key = db.decrypt(bot.record?.erlcKeyEnc);
  if (key) {
    try {
      const s = await prcCached(key, '/server', 5000);
      joinKey = s.JoinKey;
      serverName = s.Name;
    } catch {
      // announcement still goes out without the join code
    }
  }
  const embed = makeEmbed(bot, 'ssu', 'default', { server: serverName, joinKey, host: `<@${hostId}>` }, {}, guild);
  const ping = settings.pingRoleId;
  await sendTo(bot, settings.channelId, {
    content: ping ? `<@&${ping}>` : undefined,
    embeds: [embed],
    allowedMentions: { roles: ping ? [ping] : [], users: [] },
  });
  bot.record.state.session = { startedAt: Date.now(), hostId };
  db.save();
  bot.log('info', `Session started by ${hostId}`);
}

async function modLog(bot, guild, title, lines) {
  const channelId = bot.config.modules.moderation.settings.logChannelId;
  if (!channelId) return;
  await sendTo(bot, channelId, {
    embeds: [buildEmbed({ style: bot.config.style, template: { title, description: lines.join('\n') }, vars: {} })],
    allowedMentions: { parse: [] },
  }).catch((e) => bot.error('Moderation log', e));
}

export const handlers = {
  async ping(ctx) {
    await ctx.respond('default', { latency: Math.max(0, Math.round(ctx.bot.client.ws.ping)) });
  },

  async help(ctx) {
    const list = enabledCommands(ctx.config);
    const one = ctx.i.options.getString('command');
    const botName = ctx.bot.client.user.username;
    if (one) {
      if (!list.includes(one)) return ctx.reply({ content: 'That command is not available.', flags: EPHEMERAL });
      const aliases = ctx.config.commands[one].aliases;
      return ctx.respond('default', {
        bot: botName,
        list: `**/${one}**\n${COMMANDS[one].description}${aliases.length ? `\nAliases: ${aliases.map((a) => `/${a}`).join(', ')}` : ''}`,
      });
    }
    await ctx.respond('default', { bot: botName, list: list.map((n) => `**/${n}** ${COMMANDS[n].description}`).join('\n') });
  },

  async server(ctx) {
    await ctx.defer();
    const key = erlcKey(ctx.bot);
    const [s, q] = await Promise.all([prcCached(key, '/server'), prcCached(key, '/server/queue')]);
    await ctx.respond('default', {
      name: s.Name,
      players: s.CurrentPlayers,
      maxPlayers: s.MaxPlayers,
      queue: q.length,
      joinKey: s.JoinKey,
    });
  },

  async players(ctx) {
    await ctx.defer();
    const key = erlcKey(ctx.bot);
    const team = ctx.i.options.getString('team');
    let players = await prcCached(key, '/server/players');
    if (team) players = players.filter((p) => p.Team?.toLowerCase() === team.toLowerCase());
    const list = players.length
      ? players.map((p) => `${parsePlayer(p.Player).name}${p.Callsign ? ` (${p.Callsign})` : ''} ${p.Team ? `· ${p.Team}` : ''}`).join('\n')
      : 'Nobody matches.';
    await ctx.respond('default', { count: players.length, list: clip(list), team: team || 'All' });
  },

  async queue(ctx) {
    await ctx.defer();
    const q = await prcCached(erlcKey(ctx.bot), '/server/queue');
    await ctx.respond('default', { queue: q.length });
  },

  async staffonline(ctx) {
    await ctx.defer();
    const players = await prcCached(erlcKey(ctx.bot), '/server/players');
    const staff = players.filter((p) => p.Permission && p.Permission !== 'Normal');
    const list = staff.length ? staff.map((p) => `${parsePlayer(p.Player).name} · ${p.Permission}`).join('\n') : 'No staff in game.';
    await ctx.respond('default', { count: staff.length, list: clip(list) });
  },

  async ssu(ctx) {
    await ctx.defer(true);
    await postSessionStart(ctx.bot, ctx.i.guild, ctx.i.user.id);
    await ctx.reply({ content: 'Session startup posted.' });
  },

  async ssd(ctx) {
    await ctx.defer(true);
    const settings = ctx.config.modules.sessions.settings;
    if (!settings.channelId) throw new Error('Set an announcement channel for the Sessions module first.');
    const session = ctx.record.state.session;
    const duration = session ? formatDuration(Date.now() - session.startedAt) : 'an unknown time';
    await sendTo(ctx.bot, settings.channelId, {
      embeds: [makeEmbed(ctx.bot, 'ssd', 'default', { duration, host: `<@${ctx.i.user.id}>` }, {}, ctx.i.guild)],
      allowedMentions: { parse: [] },
    });
    ctx.record.state.session = null;
    db.save();
    await ctx.reply({ content: 'Session shutdown posted.' });
  },

  async ssuvote(ctx) {
    const settings = ctx.config.modules.sessions.settings;
    const threshold = settings.voteThreshold || 5;
    await ctx.respond(
      'default',
      { threshold, host: `<@${ctx.i.user.id}>` },
      { components: [voteRow(0, threshold, false)] }
    );
    const message = await ctx.i.fetchReply();
    ctx.bot.votes.set(message.id, { voters: new Set(), threshold, hostId: ctx.i.user.id, done: false });
  },

  async shift(ctx) {
    const sub = ctx.i.options.getSubcommand();
    const state = ctx.record.state;
    const uid = ctx.i.user.id;
    const logChannel = ctx.config.modules.shifts.settings.logChannelId;
    if (sub === 'start') {
      if (state.shifts[uid]) return ctx.reply({ content: 'You are already on shift.', flags: EPHEMERAL });
      state.shifts[uid] = { start: Date.now() };
      db.save();
      ctx.bot.log('info', `${ctx.i.user.username} started a shift`);
      await ctx.respond('start', { user: `<@${uid}>` });
      if (logChannel) {
        await sendTo(ctx.bot, logChannel, { embeds: [makeEmbed(ctx.bot, 'shift', 'start', { user: `<@${uid}>` })], allowedMentions: { parse: [] } }).catch((e) => ctx.bot.error('Shift log', e));
      }
    } else if (sub === 'end') {
      const active = state.shifts[uid];
      if (!active) return ctx.reply({ content: 'You are not on shift.', flags: EPHEMERAL });
      const ms = Date.now() - active.start;
      delete state.shifts[uid];
      state.shiftTotals[uid] = (state.shiftTotals[uid] || 0) + ms;
      db.save();
      ctx.bot.log('info', `${ctx.i.user.username} ended a shift (${formatDuration(ms)})`);
      const vars = { user: `<@${uid}>`, duration: formatDuration(ms) };
      await ctx.respond('end', vars);
      if (logChannel) {
        await sendTo(ctx.bot, logChannel, { embeds: [makeEmbed(ctx.bot, 'shift', 'end', vars)], allowedMentions: { parse: [] } }).catch((e) => ctx.bot.error('Shift log', e));
      }
    } else if (sub === 'status') {
      const active = state.shifts[uid];
      const current = active ? formatDuration(Date.now() - active.start) : 'Not on shift';
      const total = formatDuration((state.shiftTotals[uid] || 0) + (active ? Date.now() - active.start : 0));
      await ctx.respond('status', { current, total }, { ephemeral: true });
    } else {
      const rows = Object.entries(state.shiftTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([id, ms], n) => `**${n + 1}.** <@${id}> ${formatDuration(ms)}`);
      await ctx.respond('leaderboard', { list: rows.length ? rows.join('\n') : 'No shifts logged yet.' });
    }
  },

  async warn(ctx) {
    const user = ctx.i.options.getUser('member', true);
    const reason = ctx.i.options.getString('reason', true);
    const list = (ctx.record.state.warnings[user.id] ||= []);
    list.push({ reason, by: ctx.i.user.id, at: Date.now() });
    db.save();
    const vars = { member: `<@${user.id}>`, moderator: `<@${ctx.i.user.id}>`, reason, count: list.length };
    await ctx.respond('default', vars);
    await modLog(ctx.bot, ctx.i.guild, 'Warning', [`Member: <@${user.id}>`, `Moderator: <@${ctx.i.user.id}>`, `Reason: ${reason}`, `Total warnings: ${list.length}`]);
  },

  async warnings(ctx) {
    const user = ctx.i.options.getUser('member', true);
    const list = ctx.record.state.warnings[user.id] || [];
    const lines = list.slice(-15).map((w, n) => `**${n + 1}.** ${w.reason} · <@${w.by}> · <t:${Math.floor(w.at / 1000)}:R>`);
    await ctx.respond('default', { username: user.username, count: list.length, list: lines.length ? lines.join('\n') : 'No warnings.' });
  },

  async timeout(ctx) {
    const member = ctx.i.options.getMember('member');
    if (!member) throw new Error('That user is not in this server.');
    const minutes = ctx.i.options.getInteger('minutes', true);
    const reason = ctx.i.options.getString('reason') || 'No reason given';
    await member.timeout(minutes * 60000, reason);
    await ctx.respond('default', { member: `<@${member.id}>`, minutes, reason, moderator: `<@${ctx.i.user.id}>` });
    await modLog(ctx.bot, ctx.i.guild, 'Timeout', [`Member: <@${member.id}>`, `Moderator: <@${ctx.i.user.id}>`, `Length: ${minutes} minutes`, `Reason: ${reason}`]);
  },

  async kick(ctx) {
    const member = ctx.i.options.getMember('member');
    if (!member) throw new Error('That user is not in this server.');
    const reason = ctx.i.options.getString('reason') || 'No reason given';
    await member.kick(reason);
    await ctx.respond('default', { member: `<@${member.id}>`, reason, moderator: `<@${ctx.i.user.id}>` });
    await modLog(ctx.bot, ctx.i.guild, 'Kick', [`Member: <@${member.id}>`, `Moderator: <@${ctx.i.user.id}>`, `Reason: ${reason}`]);
  },

  async ban(ctx) {
    const user = ctx.i.options.getUser('member', true);
    const reason = ctx.i.options.getString('reason') || 'No reason given';
    await ctx.i.guild.members.ban(user, { reason });
    await ctx.respond('default', { member: `<@${user.id}>`, reason, moderator: `<@${ctx.i.user.id}>` });
    await modLog(ctx.bot, ctx.i.guild, 'Ban', [`Member: <@${user.id}>`, `Moderator: <@${ctx.i.user.id}>`, `Reason: ${reason}`]);
  },

  async ticketpanel(ctx) {
    const embed = makeEmbed(ctx.bot, 'ticketpanel', 'default', {}, {}, ctx.i.guild);
    await ctx.i.channel.send({
      embeds: [embed],
      components: [{ type: 1, components: [{ type: 2, style: 1, label: 'Open a ticket', custom_id: 'civ:ticket:open' }] }],
    });
    await ctx.reply({ content: 'Ticket panel posted.', flags: EPHEMERAL });
  },

  async close(ctx) {
    await closeTicket(ctx.bot, ctx.i, (key, vars) => ctx.respond(key, vars));
  },

  async 'erlc-run'(ctx) {
    await ctx.defer();
    const command = ctx.i.options.getString('command', true).trim();
    if (!command.startsWith(':')) throw new Error('ER:LC commands start with a colon, for example :h Hello.');
    await prc(erlcKey(ctx.bot), '/server/command', { method: 'POST', body: { command } });
    ctx.bot.log('info', `${ctx.i.user.username} ran ${command}`);
    await ctx.respond('default', { command, user: `<@${ctx.i.user.id}>` });
    const logChannel = ctx.config.modules.remote.settings.logChannelId;
    if (logChannel) {
      await sendTo(ctx.bot, logChannel, {
        embeds: [buildEmbed({ style: ctx.config.style, template: { title: 'Remote command', description: `<@${ctx.i.user.id}> ran \`${command}\`` }, vars: {} })],
        allowedMentions: { parse: [] },
      }).catch((e) => ctx.bot.error('Remote log', e));
    }
  },
};

function voteRow(count, threshold, disabled) {
  return {
    type: 1,
    components: [{ type: 2, style: 3, label: `Vote (${count}/${threshold})`, custom_id: 'civ:vote', disabled }],
  };
}

async function closeTicket(bot, i, respond) {
  const ticket = bot.record.state.tickets[i.channelId];
  if (!ticket) return i.reply({ content: 'This is not a ticket channel.', flags: EPHEMERAL });
  await respond('default', { user: `<@${i.user.id}>` });
  delete bot.record.state.tickets[i.channelId];
  db.save();
  bot.log('info', `Ticket closed by ${i.user.username}`);
  setTimeout(() => i.channel?.delete('Ticket closed').catch((e) => bot.error('Ticket delete', e)), 5000);
}

export async function handleButton(bot, i) {
  if (i.customId === 'civ:vote') {
    const vote = bot.votes.get(i.message.id);
    if (!vote || vote.done) return i.reply({ content: 'This vote is no longer active.', flags: EPHEMERAL });
    if (vote.voters.has(i.user.id)) vote.voters.delete(i.user.id);
    else vote.voters.add(i.user.id);
    const reached = vote.voters.size >= vote.threshold;
    await i.update({ components: [voteRow(vote.voters.size, vote.threshold, reached)] });
    if (reached) {
      vote.done = true;
      await postSessionStart(bot, i.guild, vote.hostId).catch((e) => bot.error('Session vote', e));
    }
    return;
  }

  if (i.customId === 'civ:ticket:open') {
    const settings = bot.config.modules.tickets.settings;
    const existing = Object.entries(bot.record.state.tickets).find(([, t]) => t.openerId === i.user.id);
    if (existing) return i.reply({ content: `You already have a ticket open: <#${existing[0]}>`, flags: EPHEMERAL });
    await i.deferReply({ flags: EPHEMERAL });
    const view = PermissionFlagsBits.ViewChannel;
    const send = PermissionFlagsBits.SendMessages;
    const history = PermissionFlagsBits.ReadMessageHistory;
    const overwrites = [
      { id: i.guild.roles.everyone.id, deny: [view] },
      { id: i.user.id, allow: [view, send, history] },
      { id: bot.client.user.id, allow: [view, send, history, PermissionFlagsBits.ManageChannels] },
    ];
    if (settings.supportRoleId) overwrites.push({ id: settings.supportRoleId, allow: [view, send, history] });
    const channel = await i.guild.channels.create({
      name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || 'ticket',
      type: ChannelType.GuildText,
      parent: settings.categoryId || undefined,
      permissionOverwrites: overwrites,
    });
    bot.record.state.tickets[channel.id] = { openerId: i.user.id, createdAt: Date.now(), awaiting: true };
    db.save();
    await channel.send({
      content: `<@${i.user.id}>${settings.supportRoleId ? ` <@&${settings.supportRoleId}>` : ''}`,
      embeds: [buildEmbed({ style: bot.config.style, template: { title: 'Ticket opened', description: 'Describe what you need and a staff member will reply here.' }, vars: {} })],
      components: [{ type: 1, components: [{ type: 2, style: 4, label: 'Close ticket', custom_id: 'civ:ticket:close' }] }],
      allowedMentions: { users: [i.user.id], roles: settings.supportRoleId ? [settings.supportRoleId] : [] },
    });
    bot.log('info', `Ticket opened by ${i.user.username}`);
    return i.editReply({ content: `Your ticket is open: <#${channel.id}>` });
  }

  if (i.customId === 'civ:ticket:close') {
    return closeTicket(bot, i, async (key, vars) => {
      await i.reply({ embeds: [makeEmbed(bot, 'close', key, vars, {}, i.guild)], allowedMentions: { parse: [] } });
    });
  }
}

export async function handleAutocomplete(bot, i, name) {
  const focused = String(i.options.getFocused() || '').toLowerCase();
  let choices = [];
  if (name === 'help') choices = enabledCommands(bot.config);
  if (name === 'players') choices = TEAMS;
  await i.respond(
    choices
      .filter((c) => c.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((c) => ({ name: c, value: c }))
  );
}
