import fs from 'fs';

const filePath = 'index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change line 3419: isStringSelectMenu -> isAnySelectMenu
content = content.replace(
  '/* 2. CATEGORY SELECT MENU (TICKET CREATION MODAL TRIGGER)                */\n    if (interaction.isStringSelectMenu()) {',
  '/* 2. CATEGORY SELECT MENU (TICKET CREATION MODAL TRIGGER)                */\n    if (interaction.isAnySelectMenu()) {'
);

// 2. Fix cfg_role_admin_
content = content.replace(
  `      // /config Admin Role Select Menu
      if (interaction.customId.startsWith('cfg_role_admin_')) {
        const botId = interaction.customId.replace('cfg_role_admin_', '');
        const selectedRoleId = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'adminRoleId', selectedRoleId);
        updateBotCustomization(botId, 'staffRoleIds', [selectedRoleId]);
        const payload = buildConfigPanelPayload(botId, 1, false);
        return interaction.update(payload).catch(() => null);
      }`,
  `      // /config Admin Role Select Menu
      if (interaction.customId.startsWith('cfg_role_admin_')) {
        const botId = interaction.customId.replace('cfg_role_admin_', '');
        const selectedRoleId = interaction.values?.[0] || '';
        updateBotCustomization(botId, 'adminRoleId', selectedRoleId);
        updateBotCustomization(botId, 'staffRoleIds', [selectedRoleId]);
        const payload = buildConfigPanelPayload(botId, 1, false, interaction.guild);
        return interaction.update(payload).catch(async () => interaction.editReply(payload).catch(() => null));
      }`
);

// 3. Fix native selects: update calls
const nativeSelects = [
  { id: 'cfg_chan_ticketspawn_', page: 2 },
  { id: 'cfg_chan_transcripts_', page: 2 },
  { id: 'cfg_role_claim_', page: 2 },
  { id: 'cfg_chan_session_', page: 4 },
  { id: 'cfg_role_host_', page: 4 },
  { id: 'cfg_role_notif_', page: 4 },
  { id: 'cfg_chan_appreview_', page: 5 },
  { id: 'cfg_chan_appresults_', page: 5 },
  { id: 'cfg_chan_staffdocs_', page: 6 },
  { id: 'cfg_chan_infractions_', page: 7 },
  { id: 'cfg_chan_promotions_', page: 7 },
  { id: 'cfg_role_supervisor_', page: 7 }
];

for (const sel of nativeSelects) {
  const oldPat = new RegExp(
    `const payload = buildConfigPanelPayload\\(botId, ${sel.page}, false\\);\\s*return interaction\\.update\\(payload\\)\\.catch\\(\\(\\) => null\\);`
  );
  const newRepl = `const payload = buildConfigPanelPayload(botId, ${sel.page}, false, interaction.guild);\n        return interaction.update(payload).catch(async () => interaction.editReply(payload).catch(() => null));`;
  content = content.replace(oldPat, newRepl);
}

// 4. Fix cfg_menu_modules_
content = content.replace(
  `      // /config Modules Select Menu
      if (interaction.customId.startsWith('cfg_menu_modules_')) {
        const botId = interaction.customId.replace('cfg_menu_modules_', '');
        const value = interaction.values?.[0];
        if (!value) return;

        if (value.startsWith('nav_page_')) {
          const targetPage = parseInt(value.replace('nav_page_', ''), 10) || 1;
          const payload = buildConfigPanelPayload(botId, targetPage, false, interaction.guild);
          return interaction.update(payload).catch(() => null);
        }

        if (value === 'ask_ai') {
          return interaction.showModal(buildAskAiModal(botId)).catch(() => null);
        }

        const actionModal = buildConfigActionModal(botId, value);
        if (actionModal) {
          return interaction.showModal(actionModal).catch(() => null);
        }
      }`,
  `      // /config Modules Select Menu
      if (interaction.customId.startsWith('cfg_menu_modules_')) {
        const botId = interaction.customId.replace('cfg_menu_modules_', '');
        const value = interaction.values?.[0];
        if (!value) return;

        if (value.startsWith('nav_page_')) {
          const targetPage = parseInt(value.replace('nav_page_', ''), 10) || 1;
          const payload = buildConfigPanelPayload(botId, targetPage, false, interaction.guild);
          return interaction.update(payload).catch(async () => interaction.editReply(payload).catch(() => null));
        }

        if (value === 'ask_ai') {
          return interaction.showModal(buildAskAiModal(botId)).catch(async () => {
            return interaction.reply({ content: 'Could not open AI Assistant modal.', ephemeral: true }).catch(() => null);
          });
        }

        const actionModal = buildConfigActionModal(botId, value);
        if (actionModal) {
          return interaction.showModal(actionModal).catch(async () => {
            return interaction.reply({ content: 'Could not open module modal.', ephemeral: true }).catch(() => null);
          });
        }
        return interaction.reply({ content: \`Module "\${value}" is currently unavailable.\`, ephemeral: true }).catch(() => null);
      }`
);

// 5. Fix cfg_index_
content = content.replace(
  `      // /config per-page index dropdown (opens the matching modal directly)
      if (interaction.customId.startsWith('cfg_index_')) {
        const botId = interaction.customId.replace('cfg_index_', '').replace(/_(\\d+)$/, '');
        const action = interaction.values?.[0];
        if (!action) return;
        if (action === 'ask_ai') {
          return interaction.showModal(buildAskAiModal(botId)).catch(() => null);
        }
        if (action === 'reset_banners') {
          for (const key of [
            'topBannerUrl', 'bottomBannerUrl',
            'sessionTopBannerUrl', 'sessionShutdownBannerUrl', 'sessionBottomBannerUrl'
          ]) updateBotCustomization(botId, key, null);
          await interaction.deferUpdate().catch(() => null);
          const payload = buildConfigPanelPayload(botId, 3, false);
          return interaction.editReply(payload).catch(() => null);
        }
        const actionModal = buildConfigActionModal(botId, action);
        if (actionModal) {
          return interaction.showModal(actionModal).catch(err => {
            if (err.code !== 40060 && err.code !== 10062) {
              console.warn(\`[CONFIG INDEX] showModal error (\${action}):\`, err.message);
            }
          });
        }
      }`,
  `      // /config per-page index dropdown (opens the matching modal directly)
      if (interaction.customId.startsWith('cfg_index_')) {
        const botId = interaction.customId.replace('cfg_index_', '').replace(/_(\\d+)$/, '');
        const action = interaction.values?.[0];
        if (!action) return;
        if (action === 'ask_ai') {
          return interaction.showModal(buildAskAiModal(botId)).catch(async () => {
            return interaction.reply({ content: 'Could not open AI modal.', ephemeral: true }).catch(() => null);
          });
        }
        if (action === 'reset_banners') {
          for (const key of [
            'topBannerUrl', 'bottomBannerUrl',
            'sessionTopBannerUrl', 'sessionShutdownBannerUrl', 'sessionBottomBannerUrl'
          ]) updateBotCustomization(botId, key, null);
          await interaction.deferUpdate().catch(() => null);
          const payload = buildConfigPanelPayload(botId, 3, false, interaction.guild);
          return interaction.editReply(payload).catch(() => null);
        }
        const actionModal = buildConfigActionModal(botId, action);
        if (actionModal) {
          return interaction.showModal(actionModal).catch(err => {
            console.warn(\`[CONFIG INDEX] showModal error (\${action}):\`, err.message);
            return interaction.reply({ content: \`Could not open settings modal: \${err.message}\`, ephemeral: true }).catch(() => null);
          });
        }
        return interaction.reply({ content: \`Settings for "\${action}" are currently unavailable.\`, ephemeral: true }).catch(() => null);
      }`
);

// 6. Fix cfg_btn_skip_setup_
content = content.replace(
  `      if (interaction.customId.startsWith('cfg_btn_skip_setup_')) {
        const botId = interaction.customId.replace('cfg_btn_skip_setup_', '');
        const payload = buildConfigPanelPayload(botId, 1, false);
        return interaction.update(payload).catch(() => null);
      }`,
  `      if (interaction.customId.startsWith('cfg_btn_skip_setup_')) {
        const botId = interaction.customId.replace('cfg_btn_skip_setup_', '');
        const payload = buildConfigPanelPayload(botId, 1, false, interaction.guild);
        return interaction.update(payload).catch(async () => interaction.editReply(payload).catch(() => null));
      }`
);

// 7. Fix cfg_modal_initial_setup_ to assign ownerUserId and interaction.guild
content = content.replace(
  `        if (erlcApiKey) updates.erlcApiKey = erlcApiKey;
        if (interaction.guild?.id) updates.guildId = interaction.guild.id;

        updateBotInstance(botId, updates);`,
  `        if (erlcApiKey) updates.erlcApiKey = erlcApiKey;
        if (interaction.guild?.id) updates.guildId = interaction.guild.id;
        if (interaction.user?.id) updates.ownerUserId = interaction.user.id;

        updateBotInstance(botId, updates);`
);

// 8. Replace all remaining buildConfigPanelPayload(botId, N, false) with interaction.guild properly
content = content.replace(/buildConfigPanelPayload\(botId,\s*(\d+),\s*false\)/g, (match, p1) => {
  return `buildConfigPanelPayload(botId, ${p1}, false, interaction.guild)`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('index.js successfully patched!');
