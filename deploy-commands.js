import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import { CONFIG } from './config.js';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in your .env file!");
  process.exit(1);
}

export const panelCommand = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Open the unified LIBERTX V2 Panel Menu to deploy server panels')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt =>
    opt
      .setName('channel')
      .setDescription('Channel to dispatch panels to (defaults to current channel)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

const commands = [
  panelCommand,
  new SlashCommandBuilder()
    .setName('bump')
    .setDescription('Bump this Discord community to #1 in the directory (1 hour cooldown)'),
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('LIBERTX Ticket System management commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    // 1. /ticket close [reason]
    .addSubcommand(sub =>
      sub
        .setName('close')
        .setDescription('Close the current ticket and archive transcript')
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason for closing the ticket')
            .setRequired(false)
        )
    )
    // 3. /ticket claim
    .addSubcommand(sub =>
      sub
        .setName('claim')
        .setDescription('Claim this ticket as the assigned staff handler')
    )
    // 4. /ticket unclaim
    .addSubcommand(sub =>
      sub
        .setName('unclaim')
        .setDescription('Unclaim this ticket and return it to awaiting staff')
    )
    // 5. /ticket add <user>
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a user to the current ticket channel')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to add to the ticket')
            .setRequired(true)
        )
    )
    // 6. /ticket remove <user>
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a user from the current ticket channel')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to remove from the ticket')
            .setRequired(true)
        )
    )
    // 7. /ticket rename <name>
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('Rename the ticket channel')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('New name for the ticket channel (without ticket- prefix)')
            .setRequired(true)
        )
    )
    // 8. /ticket status <online|busy|closed>
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Change the support desk operational status')
        .addStringOption(opt =>
          opt
            .setName('status')
            .setDescription('Select status')
            .setRequired(true)
            .addChoices(
              { name: 'Online - Actively responding', value: 'online' },
              { name: 'Busy - Slower response times', value: 'busy' },
              { name: 'Closed - Desk currently offline', value: 'closed' }
            )
        )
    )
    // 9. /ticket category <category> <state>
    .addSubcommand(sub =>
      sub
        .setName('category')
        .setDescription('Toggle individual category availability')
        .addStringOption(opt =>
          opt
            .setName('category')
            .setDescription('Category to toggle')
            .setRequired(true)
            .addChoices(
              ...CONFIG.CATEGORIES.map(c => ({
                name: c.label,
                value: c.id
              }))
            )
        )
        .addStringOption(opt =>
          opt
            .setName('state')
            .setDescription('Enable or disable this category')
            .setRequired(true)
            .addChoices(
              { name: 'Enable / Available', value: 'enable' },
              { name: 'Disable / Unavailable', value: 'disable' }
            )
        )
    ),
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the current ticket channel')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to add to the ticket')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from the current ticket channel')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to remove from the ticket')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('session')
    .setDescription('ER:LC Session operations and status management')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Announce the startup of a session')
        .addStringOption(opt =>
          opt
            .setName('code')
            .setDescription('Server join code (defaults to configured code)')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel to post the startup announcement into')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('vote')
        .setDescription('Start an official ER:LC Session Vote')
        .addIntegerOption(opt =>
          opt
            .setName('required')
            .setDescription('Number of votes required')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('duration')
            .setDescription('Session vote duration timeframe')
            .setRequired(true)
            .addChoices(
              { name: '30 Minutes', value: '30m' },
              { name: '1 Hour', value: '1h' },
              { name: '2 Hours', value: '2h' },
              { name: '3 Hours', value: '3h' },
              { name: '5 Hours', value: '5h' },
              { name: '12 Hours', value: '12h' },
              { name: '24 Hours', value: '24h' }
            )
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Role to ping for this vote (defaults to Session Notification)')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel to send the vote to (defaults to current channel)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('shutdown')
        .setDescription('Shut down the active session and post the session ended panel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel to post the session ended panel into (defaults to #sessions)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    ),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a message as the bot without showing author')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('The message text to send')
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to send the message into (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage community giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(opt =>
          opt
            .setName('prize')
            .setDescription('What is being given away')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('duration')
            .setDescription('Duration of the giveaway (e.g. 30s, 10m, 1h, 1d)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('winners')
            .setDescription('Number of winners (default: 1)')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel to host the giveaway in (default: current channel)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Role to ping for this giveaway (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('End an active giveaway')
        .addStringOption(opt =>
          opt
            .setName('giveaway')
            .setDescription('Giveaway message ID or prize keyword (leave empty for latest active)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reroll')
        .setDescription('Reroll new winner(s) for a concluded giveaway')
        .addStringOption(opt =>
          opt
            .setName('giveaway')
            .setDescription('Giveaway message ID or prize keyword (leave empty for latest concluded)')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt
            .setName('winners')
            .setDescription('Number of winners to reroll (default: 1)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        )
    ),
  new SlashCommandBuilder()
    .setName('application')
    .setDescription('LIBERTX Staff Application System')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('setreview')
        .setDescription('Set the channel where submitted applications are sent for review')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel for staff application reviews')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('setresults')
        .setDescription('Set the channel where accepted/denied application results are announced')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel for public staff application results')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),
  new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Display the server interactive command directory'),
  new SlashCommandBuilder()
    .setName('media')
    .setDescription('Publish a showcase media post with credit and notification ping')
    .addAttachmentOption(opt =>
      opt
        .setName('image')
        .setDescription('Upload the media image or video')
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt
        .setName('credit')
        .setDescription('Credit a user for the photo (defaults to yourself)')
        .setRequired(false)
    )
    .addRoleOption(opt =>
      opt
        .setName('ping')
        .setDescription('Role to ping for this media post (optional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('title')
        .setDescription('Add a showcase title (optional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('caption')
        .setDescription('Add a caption or description (optional)')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to post the media into (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Announce an official staff member rank promotion')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('Staff member being promoted')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('New Discord staff role to award to the member')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('rank')
        .setDescription('New staff rank / title (if not selecting a role)')
        .setRequired(false)
    )
    .addRoleOption(opt =>
      opt
        .setName('old_role')
        .setDescription('Previous staff role to remove (optional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('old_rank')
        .setDescription('Previous rank / title (optional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('reason')
        .setDescription('Merits or reason for promotion (optional)')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to post announcement into (defaults to #promotions or current)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('infract')
    .setDescription('Issue and log an official staff disciplinary infraction')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('Staff member receiving the infraction')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('type')
        .setDescription('Infraction classification level')
        .setRequired(true)
        .addChoices(
          { name: 'Written Warning', value: 'Written Warning' },
          { name: 'Strike 1', value: 'Strike 1' },
          { name: 'Strike 2', value: 'Strike 2' },
          { name: 'Strike 3', value: 'Strike 3' },
          { name: 'Demotion', value: 'Demotion' },
          { name: 'Suspension', value: 'Suspension' }
        )
    )
    .addStringOption(opt =>
      opt
        .setName('reason')
        .setDescription('Violation reason or policy broken')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('proof')
        .setDescription('Link to evidence clip or case documentation (optional)')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to post infraction into (defaults to #infractions or current)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Submit an official Leave of Absence request')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(sub =>
      sub
        .setName('request')
        .setDescription('Submit a Leave of Absence request for management review')
        .addStringOption(opt =>
          opt
            .setName('start')
            .setDescription('Start date or timeframe (e.g. today, 2026-09-20)')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('end')
            .setDescription('End date or duration (e.g. 5 days, 1 week, 2026-09-27)')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason for your leave of absence')
            .setRequired(true)
        )
    ),
  new SlashCommandBuilder()
    .setName('retrigger')
    .setDescription('Restart your bot instance and refresh every connected system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map(cmd => cmd.toJSON());

export const adminOnlyCommands = [
  new SlashCommandBuilder()
    .setName('retrigger')
    .setDescription('Retrigger, refresh, or reboot a customer bot instance (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Bot Identification Number to retrigger (e.g. BOT-1049)')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('banbot')
    .setDescription('Ban and lock a customer bot instance (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Bot Identification Number to ban')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('unbanbot')
    .setDescription('Unban and restore a customer bot instance (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Bot Identification Number to unban')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('listbots')
    .setDescription('List all customer bot instances, status, and Bot IDs (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('createbot')
    .setDescription('Generate a new bot instance and Bot Identification Number (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('Customer Discord user to assign the bot instance to')
        .setRequired(false)
    )
].map(cmd => cmd.toJSON());

// Feature commands for customer bots (NO banbot, NO createbot, etc.)
export const customerCommands = commands;

// Slim LIBERTX-only commands: just /config, /banbot, and /createbot
export const libertyxMasterCommands = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Open the interactive bot configuration control panel')
    .addIntegerOption(opt =>
      opt
        .setName('page')
        .setDescription('Page number to open directly (1 to 8)')
        .setMinValue(1)
        .setMaxValue(8)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Specific Bot Identification Number to configure')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('banbot')
    .setDescription('Ban and lock a customer bot instance (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Bot Identification Number to ban')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('createbot')
    .setDescription('Generate a new bot instance and Bot Identification Number (Owner Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('Customer Discord user to assign the bot instance to')
        .setRequired(false)
    ),
].map(cmd => cmd.toJSON());

export const configOnlyCommand = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure your bot instance, credentials, and settings')
    .addIntegerOption(opt =>
      opt
        .setName('page')
        .setDescription('Page number to open directly (1 to 8)')
        .setMinValue(1)
        .setMaxValue(8)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('bot_id')
        .setDescription('Specific Bot ID to configure (e.g. LC-74921)')
        .setRequired(false)
    )
].map(cmd => cmd.toJSON());

// Full command suite including panel, ticket, session, applications, and admin tools (deduplicated)
const rawCommands = [...customerCommands, ...configOnlyCommand, ...adminOnlyCommands];
const seenNames = new Set();
export const allCommands = [];
for (const cmd of rawCommands) {
  if (!seenNames.has(cmd.name)) {
    seenNames.add(cmd.name);
    allCommands.push(cmd);
  }
}
export const masterCommands = allCommands;

export async function deployCommands(customToken = null, customClientId = null, customGuildId = null, setupOnly = false, isMaster = false) {
  const token = customToken || process.env.DISCORD_TOKEN;
  const clientId = customClientId || process.env.CLIENT_ID;

  if (!token || !clientId) {
    console.error("Missing DISCORD_TOKEN or CLIENT_ID!");
    throw new Error("Missing DISCORD_TOKEN or CLIENT_ID!");
  }

  const restClient = new REST({ version: '10' }).setToken(token);
  const isActuallyMaster = isMaster || (String(clientId) === String(process.env.CLIENT_ID));
  const cmds = setupOnly ? configOnlyCommand : allCommands;

  try {
    if (isActuallyMaster) {
      // Master Bot commands (/config, /banbot, /createbot, etc.)
      if (customGuildId && customGuildId.trim() !== '') {
        const targetGuild = customGuildId.trim();
        console.log(`[DEPLOY] Registering ${cmds.length} GUILD slash commands for Master Client: ${clientId} in Guild: ${targetGuild}...`);
        await restClient.put(
          Routes.applicationGuildCommands(clientId, targetGuild),
          { body: cmds }
        );

        // Mirror into every other guild the bot is already in (instant availability everywhere)
        let mirrorCount = 1;
        try {
          const botGuilds = await restClient.get(Routes.userGuilds());
          for (const g of botGuilds) {
            if (g.id === targetGuild) continue;
            try {
              await restClient.put(Routes.applicationGuildCommands(clientId, g.id), { body: cmds });
              mirrorCount++;
            } catch {}
          }
        } catch {}

        // Clear GLOBAL commands — otherwise Discord lists every command twice (guild + global)
        try {
          await restClient.put(Routes.applicationCommands(clientId), { body: [] });
        } catch {}

        console.log(`[DEPLOY] Successfully registered ${cmds.length} guild slash commands in ${mirrorCount} guild(s) and cleared duplicate global commands.`);
      } else {
        console.log(`[DEPLOY] Registering ${cmds.length} GLOBAL slash commands for Master Client: ${clientId}...`);
        await restClient.put(
          Routes.applicationCommands(clientId),
          { body: cmds }
        );
        // Clear guild duplicates in the configured GUILD_ID (if any) so nothing is listed twice
        if (process.env.GUILD_ID && process.env.GUILD_ID.trim() !== '') {
          try {
            await restClient.put(
              Routes.applicationGuildCommands(clientId, process.env.GUILD_ID.trim()),
              { body: [] }
            );
          } catch {}
        }
        console.log(`[DEPLOY] Successfully registered ${cmds.length} global slash commands for Master Client (zero duplicates)!`);
      }
    } else {
      if (customGuildId && customGuildId.trim() !== '') {
        // Direct Guild Registration for customer bots — instant availability in their server
        console.log(`[DEPLOY] Registering ${cmds.length} GUILD commands for Customer Client ${clientId} in Guild: ${customGuildId}...`);
        await restClient.put(
          Routes.applicationGuildCommands(clientId, customGuildId.trim()),
          { body: cmds }
        );
        // Clear global commands for customer bot to prevent duplicate listings in Discord
        try {
          await restClient.put(
            Routes.applicationCommands(clientId),
            { body: [] }
          );
        } catch {}
        console.log(`[DEPLOY] Successfully deployed ${cmds.length} INSTANT guild commands in Guild: ${customGuildId}!`);
      } else {
        console.log(`[DEPLOY] Registering ${cmds.length} GLOBAL slash commands for Client: ${clientId}...`);
        await restClient.put(
          Routes.applicationCommands(clientId),
          { body: cmds }
        );
        console.log(`[DEPLOY] Successfully registered ${cmds.length} global slash commands across all servers!`);
      }
    }
  } catch (error) {
    console.error('[DEPLOY] Error deploying slash commands:', error);
    throw error;
  }
}

// Auto-run if executed directly via `node deploy-commands.js`
// Guild-first: register GUILD commands (instant) when GUILD_ID is set, otherwise fall back to global.
// Never register both scopes at once — Discord would list every command twice.
if (process.argv[1]?.endsWith('deploy-commands.js')) {
  (async () => {
    const guildId = process.env.GUILD_ID && process.env.GUILD_ID.trim() !== '' ? process.env.GUILD_ID.trim() : null;
    await deployCommands(null, null, guildId, false, true);
  })();
}
