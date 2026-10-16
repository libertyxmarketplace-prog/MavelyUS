import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GIVEAWAYS_FILE = path.join(__dirname, 'data', 'giveaways.json');

export const GIVEAWAY_EMOJI = '<:giveaway:1549989440234066000>';
export const GIVEAWAY_EMOJI_OBJ = { id: '1549989440234066000', name: 'giveaway' };

function readJsonFile(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

export function loadGiveaways() {
  return readJsonFile(GIVEAWAYS_FILE, { giveaways: {} });
}

export function saveGiveaways(data) {
  writeJsonFile(GIVEAWAYS_FILE, data);
}

export function getGiveaway(id) {
  const store = loadGiveaways();
  return store.giveaways[id] || null;
}

export function saveGiveaway(giveaway) {
  const store = loadGiveaways();
  store.giveaways[giveaway.id] = giveaway;
  saveGiveaways(store);
}

/**
 * Parses user input durations like "30s", "10m", "1h", "2d" into milliseconds.
 */
export function parseDuration(str) {
  if (!str) return null;
  const match = str.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

/**
 * Builds the chill, clean Giveaway Card with custom emoji and entry button.
 */
export function buildGiveawayCard(giveaway, hasEnded = false) {
  giveaway.entries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
  const endsTimestamp = Math.floor(giveaway.endsAt / 1000);
  const entryCount = giveaway.entries.length;
  const gid = giveaway.id || 'msg';

  let contentText = '';
  if (hasEnded) {
    const winnerText = giveaway.winners && giveaway.winners.length > 0
      ? giveaway.winners.map(id => `<@${id}>`).join(', ')
      : 'No valid entrants';

    contentText = [
      `### ${GIVEAWAY_EMOJI} ${giveaway.prize} (Ended)`,
      `> This giveaway has officially concluded.`,
      '',
      `• **Winners**: ${winnerText}`,
      `• **Hosted by**: <@${giveaway.hostId}>`,
      `• **Total Entries**: \`${entryCount}\``,
      `• **Ended**: <t:${endsTimestamp}:R>`
    ].join('\n');
  } else {
    contentText = [
      `### ${GIVEAWAY_EMOJI} ${giveaway.prize}`,
      `> Click the button below to participate in this giveaway!`,
      '',
      `• **Ends**: <t:${endsTimestamp}:R> (<t:${endsTimestamp}:f>)`,
      `• **Hosted by**: <@${giveaway.hostId}>`,
      `• **Winners**: \`${giveaway.winnerCount}\``,
      `• **Entries**: \`${entryCount}\``
    ].join('\n');
  }

  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container without accent_color (clean neutral border)
        components: [
          {
            type: 10,
            content: contentText
          },
          {
            type: 1, // Action Row
            components: [
              {
                type: 2,
                style: hasEnded ? 2 : 1, // Primary if active, Secondary if ended
                label: hasEnded ? 'Giveaway Ended' : 'Enter Giveaway',
                emoji: GIVEAWAY_EMOJI_OBJ,
                custom_id: `giveaway_enter_${gid}`,
                disabled: hasEnded
              },
              {
                type: 2,
                style: 2, // Secondary Gray Pill
                label: `${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'}`,
                disabled: true,
                custom_id: `giveaway_pill_${gid}`
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Randomly picks N winners from the giveaway entrants list.
 */
export function pickWinners(giveaway, count = null) {
  const winnerCount = count || giveaway.winnerCount || 1;
  const pool = [...(giveaway.entries || [])];
  if (pool.length === 0) return [];

  const winners = [];
  const needed = Math.min(winnerCount, pool.length);

  for (let i = 0; i < needed; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    winners.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return winners;
}

/**
 * Ends a giveaway, updates the message, announces winners, and persists state.
 */
export async function endGiveaway(client, giveawayId) {
  const store = loadGiveaways();
  const giveaway = store.giveaways[giveawayId];
  if (!giveaway || giveaway.ended) return null;

  giveaway.ended = true;
  giveaway.winners = pickWinners(giveaway);
  store.giveaways[giveawayId] = giveaway;
  saveGiveaways(store);

  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
      const msg = await channel.messages.fetch(giveaway.id).catch(() => null);
      if (msg) {
        await msg.edit(buildGiveawayCard(giveaway, true)).catch(() => null);
      }

      if (giveaway.winners.length > 0) {
        const winnerPings = giveaway.winners.map(id => `<@${id}>`).join(', ');
        await channel.send({
          content: `Congratulations ${winnerPings}! You won **${giveaway.prize}**! ${GIVEAWAY_EMOJI}`
        }).catch(() => null);

        // Send direct message notification to each winner
        for (const winnerId of giveaway.winners) {
          try {
            const user = await client.users.fetch(winnerId).catch(() => null);
            if (user) {
              await user.send({
                content: `🎉 Congratulations <@${winnerId}>! You have won the giveaway for **${giveaway.prize}** in **LIBERTX**! ${GIVEAWAY_EMOJI}\n> • **Prize:** **${giveaway.prize}**\n> • **Host:** <@${giveaway.hostId}>\n> Please open a ticket or reach out to <@${giveaway.hostId}> to claim your prize!`
              }).catch(() => null);
            }
          } catch (dmErr) {
            console.warn(`Could not DM giveaway winner ${winnerId}:`, dmErr.message);
          }
        }
      } else {
        await channel.send({
          content: `The giveaway for **${giveaway.prize}** has ended with no valid entrants.`
        }).catch(() => null);
      }
    }
  } catch (err) {
    console.error(`Failed to conclude giveaway ${giveawayId}:`, err);
  }

  return giveaway;
}

/**
 * Rerolls one or more winners for an already ended giveaway.
 */
export async function rerollGiveaway(client, giveawayId, count = 1) {
  const store = loadGiveaways();
  const giveaway = store.giveaways[giveawayId];
  if (!giveaway) throw new Error('Giveaway not found.');
  if (!giveaway.ended) throw new Error('Cannot reroll a giveaway that is still active.');
  if (!giveaway.entries || giveaway.entries.length === 0) throw new Error('No entrants participated in this giveaway.');

  const newWinners = pickWinners(giveaway, count);
  giveaway.winners = newWinners;
  store.giveaways[giveawayId] = giveaway;
  saveGiveaways(store);

  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
      const msg = await channel.messages.fetch(giveaway.id).catch(() => null);
      if (msg) {
        await msg.edit(buildGiveawayCard(giveaway, true)).catch(() => null);
      }

      const winnerPings = newWinners.map(id => `<@${id}>`).join(', ');
      await channel.send({
        content: `New winner selected for **${giveaway.prize}**: ${winnerPings}! ${GIVEAWAY_EMOJI}`
      }).catch(() => null);

      // Send direct message notification to each reroll winner
      for (const winnerId of newWinners) {
        try {
          const user = await client.users.fetch(winnerId).catch(() => null);
          if (user) {
            await user.send({
              content: `🎉 Congratulations <@${winnerId}>! You were selected as the new winner for **${giveaway.prize}** in **LIBERTX**! ${GIVEAWAY_EMOJI}\n> • **Prize:** **${giveaway.prize}**\n> • **Host:** <@${giveaway.hostId}>\n> Please open a ticket or reach out to <@${giveaway.hostId}> to claim your prize!`
            }).catch(() => null);
          }
        } catch (dmErr) {
          console.warn(`Could not DM reroll winner ${winnerId}:`, dmErr.message);
        }
      }
    }
  } catch (err) {
    console.error(`Failed to reroll giveaway ${giveawayId}:`, err);
  }

  return newWinners;
}

/**
 * Checks all active giveaways and concludes any whose time has expired.
 */
export async function checkActiveGiveaways(client) {
  const store = loadGiveaways();
  const now = Date.now();

  for (const [id, giveaway] of Object.entries(store.giveaways || {})) {
    if (!giveaway.ended && now >= giveaway.endsAt) {
      await endGiveaway(client, id);
    }
  }
}

/**
 * Finds an active giveaway by message ID, prize keyword, or channel's newest.
 */
export function findActiveGiveaway(query = null, channelId = null) {
  const store = loadGiveaways();
  const all = Object.values(store.giveaways || {});

  // 1. Direct ID match
  if (query && store.giveaways[query] && !store.giveaways[query].ended) {
    return store.giveaways[query];
  }

  // 2. Keyword match in active giveaways
  if (query) {
    const q = query.toLowerCase().trim();
    const match = all.find(g => !g.ended && g.prize.toLowerCase().includes(q));
    if (match) return match;
  }

  // 3. Most recent active giveaway in the specified channel
  if (channelId) {
    const inChannel = all.filter(g => !g.ended && g.channelId === channelId);
    if (inChannel.length > 0) {
      return inChannel.sort((a, b) => b.startedAt - a.startedAt)[0];
    }
  }

  // 4. Fallback: most recent active anywhere
  const activeAll = all.filter(g => !g.ended);
  if (activeAll.length > 0) {
    return activeAll.sort((a, b) => b.startedAt - a.startedAt)[0];
  }

  return null;
}

/**
 * Finds a concluded giveaway by message ID, prize keyword, or channel's newest.
 */
export function findConcludedGiveaway(query = null, channelId = null) {
  const store = loadGiveaways();
  const all = Object.values(store.giveaways || {});

  // 1. Direct ID match
  if (query && store.giveaways[query] && store.giveaways[query].ended) {
    return store.giveaways[query];
  }

  // 2. Keyword match in ended giveaways
  if (query) {
    const q = query.toLowerCase().trim();
    const match = all.find(g => g.ended && g.prize.toLowerCase().includes(q));
    if (match) return match;
  }

  // 3. Most recent ended giveaway in the specified channel
  if (channelId) {
    const inChannel = all.filter(g => g.ended && g.channelId === channelId);
    if (inChannel.length > 0) {
      return inChannel.sort((a, b) => (b.endsAt || b.startedAt) - (a.endsAt || a.startedAt))[0];
    }
  }

  // 4. Fallback: most recent ended anywhere
  const endedAll = all.filter(g => g.ended);
  if (endedAll.length > 0) {
    return endedAll.sort((a, b) => (b.endsAt || b.startedAt) - (a.endsAt || a.startedAt))[0];
  }

  return null;
}

/**
 * Extracts text recursively from Discord message components.
 */
function extractTextFromComponents(components) {
  let text = '';
  if (!Array.isArray(components)) return text;
  for (const comp of components) {
    if (comp.content) text += '\n' + comp.content;
    if (Array.isArray(comp.components)) {
      text += '\n' + extractTextFromComponents(comp.components);
    }
  }
  return text;
}

/**
 * Recovers or reconstructs a giveaway record directly from an active Discord message.
 */
export function recoverGiveawayFromMessage(message) {
  if (!message) return null;
  const store = loadGiveaways();
  if (store.giveaways && store.giveaways[message.id]) {
    return store.giveaways[message.id];
  }
  if (Array.isArray(message.embeds)) {
    for (const em of message.embeds) {
      if (em.title) text += '\n' + em.title;
      if (em.description) text += '\n' + em.description;
      if (Array.isArray(em.fields)) {
        for (const f of em.fields) {
          text += '\n' + f.name + ': ' + f.value;
        }
      }
    }
  }

  // Parse prize from ### <:Giveaway:...> prize or ### prize
  let prize = 'Giveaway';
  const prizeMatch = text.match(/###\s*(?:<:[^>]+>)?\s*([^\n\r(]+)/);
  if (prizeMatch && prizeMatch[1].trim()) {
    prize = prizeMatch[1].replace(/\(Ended\)/i, '').trim();
  }

  // Parse hostId from <@123456789>
  let hostId = message.author?.id || 'Unknown';
  const hostMatch = text.match(/Hosted by\*\*:\s*<@!?(\d+)>/i);
  if (hostMatch) {
    hostId = hostMatch[1];
  }

  // Parse endsAt timestamp from <t:1234567890:...>
  let endsAt = Date.now() + 60 * 60 * 1000;
  const endsMatch = text.match(/Ends\*\*:\s*<t:(\d+):/i);
  if (endsMatch) {
    endsAt = parseInt(endsMatch[1], 10) * 1000;
  }

  // Parse winnerCount from `1`
  let winnerCount = 1;
  const winnerMatch = text.match(/Winners\*\*:\s*`(\d+)`/i);
  if (winnerMatch) {
    winnerCount = Math.max(1, parseInt(winnerMatch[1], 10) || 1);
  }

  const isEnded = text.toLowerCase().includes('(ended)') || Date.now() >= endsAt;

  const giveaway = {
    id: message.id,
    channelId: message.channelId || message.channel?.id,
    guildId: message.guildId || message.guild?.id,
    prize: prize,
    hostId: hostId,
    winnerCount: winnerCount,
    entries: [],
    startedAt: message.createdTimestamp || Date.now(),
    endsAt: endsAt,
    ended: isEnded,
    winners: []
  };

  saveGiveaway(giveaway);
  return giveaway;
}


