import fs from 'fs';

let content = fs.readFileSync('index.js', 'utf8');

// 1. Guard customer bots from silently hanging on blocked commands or cfg_ interactions
const oldGuard = `    // Guard customer bots from handling master bot commands and config UI
    if (!isMasterBot) {
      if (interaction.isChatInputCommand() && CUSTOMER_BLOCKED_COMMANDS.includes(interaction.commandName)) {
        return;
      }
      const cid = interaction.customId || '';
      if (cid.startsWith('cfg_')) {
        return;
      }
    }`;

const newGuard = `    // Guard customer bots from handling master bot commands and config UI
    if (!isMasterBot) {
      if (interaction.isChatInputCommand() && CUSTOMER_BLOCKED_COMMANDS.includes(interaction.commandName)) {
        return interaction.reply({
          content: \`\${EMOJIS.CROSS} \\\`/\${interaction.commandName}\\\` is managed by the main **Mavely** bot. Please run it with Mavely.\`,
          flags: 64
        }).catch(() => null);
      }
      const cid = interaction.customId || '';
      if (cid.startsWith('cfg_')) {
        return interaction.reply({
          content: \`\${EMOJIS.CROSS} Configuration interactions are handled by the main **Mavely** bot.\`,
          flags: 64
        }).catch(() => null);
      }
    }`;

if (content.includes(oldGuard)) {
  content = content.replace(oldGuard, newGuard);
  console.log('Updated customer bot guard');
} else {
  console.warn('Could not find oldGuard');
}

// 2. Add select menu handlers right after cfg_role_admin_
const targetRoleAdmin = `        updateBotCustomization(botId, 'staffRoleIds', [selectedRoleId]);
        const payload = buildConfigPanelPayload(botId, 1, false);
        return interaction.update(payload).catch(() => null);
      }`;

const selectMenuHandlers = `        updateBotCustomization(botId, 'staffRoleIds', [selectedRoleId]);
        const payload = buildConfigPanelPayload(botId, 1, false);
        return interaction.update(payload).catch(() => null);
      }

      // /config Native Select Menu Handlers (Instant save, no manual ID typing)
      if (interaction.customId.startsWith('cfg_chan_transcripts_')) {
        const botId = interaction.customId.replace('cfg_chan_transcripts_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'transcriptsChannelId', val);
        const payload = buildConfigPanelPayload(botId, 2, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_role_claim_')) {
        const botId = interaction.customId.replace('cfg_role_claim_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'ticketClaimRoleId', val);
        const payload = buildConfigPanelPayload(botId, 2, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_session_')) {
        const botId = interaction.customId.replace('cfg_chan_session_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'sessionChannelId', val);
        const payload = buildConfigPanelPayload(botId, 4, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_role_host_')) {
        const botId = interaction.customId.replace('cfg_role_host_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'hostRoleId', val);
        const payload = buildConfigPanelPayload(botId, 4, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_role_notif_')) {
        const botId = interaction.customId.replace('cfg_role_notif_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'notificationRoleId', val);
        const payload = buildConfigPanelPayload(botId, 4, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_appreview_')) {
        const botId = interaction.customId.replace('cfg_chan_appreview_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'reviewChannelId', val);
        const payload = buildConfigPanelPayload(botId, 5, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_appresults_')) {
        const botId = interaction.customId.replace('cfg_chan_appresults_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'resultsChannelId', val);
        const payload = buildConfigPanelPayload(botId, 5, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_staffdocs_')) {
        const botId = interaction.customId.replace('cfg_chan_staffdocs_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'staffDocsChannelId', val);
        const payload = buildConfigPanelPayload(botId, 6, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_infractions_')) {
        const botId = interaction.customId.replace('cfg_chan_infractions_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'infractionsChannelId', val);
        const payload = buildConfigPanelPayload(botId, 7, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_chan_promotions_')) {
        const botId = interaction.customId.replace('cfg_chan_promotions_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'promotionsChannelId', val);
        const payload = buildConfigPanelPayload(botId, 7, false);
        return interaction.update(payload).catch(() => null);
      }

      if (interaction.customId.startsWith('cfg_role_supervisor_')) {
        const botId = interaction.customId.replace('cfg_role_supervisor_', '');
        const val = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'infractionStaffRoleId', val);
        const payload = buildConfigPanelPayload(botId, 7, false);
        return interaction.update(payload).catch(() => null);
      }`;

if (content.includes(targetRoleAdmin)) {
  content = content.replace(targetRoleAdmin, selectMenuHandlers);
  console.log('Added selectMenuHandlers');
} else {
  console.warn('Could not find targetRoleAdmin');
}

// 3. Make sure master bot never dispatches session completion host DMs
const oldHostDm = `          // Send redesigned DM to the host with action buttons inside the card
          try {
            const voteOwnerClient = interaction.client || client;
            const host = await voteOwnerClient.users.fetch(vote.hostId);
            const hostPayload = buildHostVoteCompletedPayload(vote);
            await host.send(hostPayload).catch(async (v2Err) => {`;

const newHostDm = `          // Send redesigned DM to the host - only via customer bot, never master Mavely
          try {
            const customerBot = getBotInstanceForGuild(interaction.guild?.id);
            const customerClient = customerBot ? activeCustomerClients.get(customerBot.botId) : null;
            const dispatchClient = customerClient || (!isMasterBot ? interaction.client : null);
            if (dispatchClient) {
              const host = await dispatchClient.users.fetch(vote.hostId).catch(() => null);
              if (host) {
                const hostPayload = buildHostVoteCompletedPayload(vote);
                await host.send(hostPayload).catch(async (v2Err) => {`;

if (content.includes(oldHostDm)) {
  content = content.replace(oldHostDm, newHostDm);
  // Also close the extra if
  content = content.replace(`                new ButtonBuilder()
                  .setCustomId(\`vote_host_postpone_\${vote.id}\`)
                  .setLabel('Postpone Session')
                  .setStyle(ButtonStyle.Secondary)
              );
              await host.send({ embeds: [fallbackEmbed], components: [fallbackRow] }).catch(() => null);
            });
          } catch (dmErr) {`, `                new ButtonBuilder()
                  .setCustomId(\`vote_host_postpone_\${vote.id}\`)
                  .setLabel('Postpone Session')
                  .setStyle(ButtonStyle.Secondary)
              );
              await host.send({ embeds: [fallbackEmbed], components: [fallbackRow] }).catch(() => null);
            });
              }
            }
          } catch (dmErr) {`);
  console.log('Updated session host DM logic');
} else {
  console.warn('Could not find oldHostDm');
}

fs.writeFileSync('index.js', content, 'utf8');
console.log('Successfully updated index.js!');
