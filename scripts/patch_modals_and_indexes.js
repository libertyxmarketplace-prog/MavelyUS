import fs from 'fs';

// 1. Update configPanel.js modals
let cfg = fs.readFileSync('configPanel.js', 'utf8');

// buildServerCoreModal update
cfg = cfg.replace(
  `  const nameInput = new TextInputBuilder()
    .setCustomId('serverName')
    .setLabel('In-Game Server Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Liberty County Roleplay')
    .setRequired(false);
  if (cust.serverName?.trim()) nameInput.setValue(cust.serverName.trim());

  const joinInput = new TextInputBuilder()
    .setCustomId('joinCode')
    .setLabel('Server Join Code')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. LCRP')
    .setRequired(false);
  if (cust.joinCode?.trim()) joinInput.setValue(cust.joinCode.trim());

  const activityInput = new TextInputBuilder()
    .setCustomId('botActivityText')
    .setLabel('Bot Status Activity (replaces ER:LC)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Liberty County (Default: ER:LC)')
    .setRequired(false);
  if (cust.botActivityText?.trim()) activityInput.setValue(cust.botActivityText.trim());`,
  `  const autoName = cust.serverName?.trim() || 'Orlando Roleplay I Strict I Liveries';
  const autoJoin = cust.joinCode?.trim() || 'ORLERLC';

  const nameInput = new TextInputBuilder()
    .setCustomId('serverName')
    .setLabel('In-Game Server Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Orlando Roleplay')
    .setRequired(false);
  nameInput.setValue(autoName);

  const joinInput = new TextInputBuilder()
    .setCustomId('joinCode')
    .setLabel('Server Join Code')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. ORLERLC')
    .setRequired(false);
  joinInput.setValue(autoJoin);

  const activityInput = new TextInputBuilder()
    .setCustomId('botActivityText')
    .setLabel('Bot Status Activity (Custom Presence)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(\`e.g. \${autoName} | Code: \${autoJoin}\`)
    .setRequired(false);
  if (cust.botActivityText?.trim()) activityInput.setValue(cust.botActivityText.trim());`
);

// buildTicketCategoryNamesModal update
cfg = cfg.replace(
  `export function buildTicketCategoryNamesModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatnames_\${botId}\`)
    .setTitle('Ticket Category Names (1-5)');

  for (let i = 1; i <= 5; i++) {
    const existing = currentCats[i - 1]?.name || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_name_\${i}\`)
      .setLabel(\`Category \${i} Name (Leave empty to disable)\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(i === 1 ? 'General Support' : i === 2 ? 'High Rank' : \`Category \${i}\`)
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`,
  `export function buildTicketCategoryNamesModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatnames_\${botId}\`)
    .setTitle('Rename Categories (Blank = Remove)');

  for (let i = 1; i <= 5; i++) {
    const existing = currentCats[i - 1]?.name || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_name_\${i}\`)
      .setLabel(\`Category \${i} Name (Leave empty to remove)\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(i === 1 ? 'General Support' : i === 2 ? 'High Rank' : \`Category \${i} (Optional)\`)
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`
);

// buildTicketCategorySpawnsModal update
cfg = cfg.replace(
  `export function buildTicketCategorySpawnsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatspawns_\${botId}\`)
    .setTitle('Category Spawn Channels');

  for (let i = 1; i <= 5; i++) {
    const catName = currentCats[i - 1]?.name || \`Category \${i}\`;
    const existing = currentCats[i - 1]?.spawnCategoryId || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_spawn_\${i}\`)
      .setLabel(\`\${catName.slice(0, 20)} Category ID\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Discord Category ID where ticket opens')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`,
  `export function buildTicketCategorySpawnsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const allCats = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
    ? cust.ticketCategories
    : [{ id: 'cat_1', name: 'General Support', spawnCategoryId: cust.ticketSpawnCategoryId || '' }];
  const activeCats = allCats.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
  const displayCats = activeCats.length > 0 ? activeCats : allCats.slice(0, 1);

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatspawns_\${botId}\`)
    .setTitle('Category Spawn Channels');

  for (let i = 0; i < displayCats.length && i < 5; i++) {
    const cat = displayCats[i];
    const catName = cat.name || \`Category \${i + 1}\`;
    const existing = cat.spawnCategoryId || cust.ticketSpawnCategoryId || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_spawn_\${i + 1}\`)
      .setLabel(\`\${catName.slice(0, 20)} Spawn Category ID\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Discord Category ID or Channel ID')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`
);

// buildTicketCategoryPingsModal update
cfg = cfg.replace(
  `export function buildTicketCategoryPingsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatpings_\${botId}\`)
    .setTitle('Category Alert Roles');

  for (let i = 1; i <= 5; i++) {
    const catName = currentCats[i - 1]?.name || \`Category \${i}\`;
    const existing = currentCats[i - 1]?.pingRoleId || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_ping_\${i}\`)
      .setLabel(\`\${catName.slice(0, 20)} Role ID\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Staff Role ID to ping when opened')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`,
  `export function buildTicketCategoryPingsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const allCats = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
    ? cust.ticketCategories
    : [{ id: 'cat_1', name: 'General Support', pingRoleId: '' }];
  const activeCats = allCats.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
  const displayCats = activeCats.length > 0 ? activeCats : allCats.slice(0, 1);

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_ticketcatpings_\${botId}\`)
    .setTitle('Category Alert Roles');

  for (let i = 0; i < displayCats.length && i < 5; i++) {
    const cat = displayCats[i];
    const catName = cat.name || \`Category \${i + 1}\`;
    const existing = cat.pingRoleId || '';
    const input = new TextInputBuilder()
      .setCustomId(\`cat_ping_\${i + 1}\`)
      .setLabel(\`\${catName.slice(0, 20)} Role ID\`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Staff Role ID to ping when opened')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}`
);

fs.writeFileSync('configPanel.js', cfg, 'utf8');
console.log('configPanel.js modals updated!');

// 2. Update index.js
let idx = fs.readFileSync('index.js', 'utf8');

// Add ActivityType to imports if not already imported
if (!idx.includes('ActivityType,')) {
  idx = idx.replace('Events\n} from \'discord.js\';', 'Events,\n  ActivityType\n} from \'discord.js\';');
}

// Update native select page numbers:
// session: 4 -> 3
idx = idx.replace(/buildConfigPanelPayload\(botId,\s*4,\s*false,\s*interaction\.guild\)/g, 'buildConfigPanelPayload(botId, 3, false, interaction.guild)');
// apps: 5 -> 4
idx = idx.replace(/buildConfigPanelPayload\(botId,\s*5,\s*false,\s*interaction\.guild\)/g, 'buildConfigPanelPayload(botId, 4, false, interaction.guild)');
// docs: 6 -> 5
idx = idx.replace(/buildConfigPanelPayload\(botId,\s*6,\s*false,\s*interaction\.guild\)/g, 'buildConfigPanelPayload(botId, 5, false, interaction.guild)');
// community: 7 -> 6
idx = idx.replace(/buildConfigPanelPayload\(botId,\s*7,\s*false,\s*interaction\.guild\)/g, 'buildConfigPanelPayload(botId, 6, false, interaction.guild)');
// ai: 8 -> 7
idx = idx.replace(/buildConfigPanelPayload\(botId,\s*8,\s*false,\s*interaction\.guild\)/g, 'buildConfigPanelPayload(botId, 7, false, interaction.guild)');

// Fix cfg_modal_servercore_ presence updating
idx = idx.replace(
  `        updateBotCustomization(botId, 'serverName', serverName);
        updateBotCustomization(botId, 'joinCode', joinCode);
        if (botActivityText !== undefined) {
          updateBotCustomization(botId, 'botActivityText', botActivityText);
          const custClient = activeCustomerClients.get(botId);
          if (custClient?.user) {
            try {
              custClient.user.setPresence({
                activities: [{ name: botActivityText.trim() || 'ER:LC', type: ActivityType.Watching }],
                status: 'online'
              });
            } catch {}
          }
        }`,
  `        if (serverName) updateBotCustomization(botId, 'serverName', serverName);
        if (joinCode) updateBotCustomization(botId, 'joinCode', joinCode);
        if (botActivityText !== undefined) {
          updateBotCustomization(botId, 'botActivityText', botActivityText);
          const custClient = activeCustomerClients.get(botId);
          if (custClient?.user) {
            try {
              const defaultPromo = serverName ? \`\${serverName} | Code: \${joinCode || 'Join'}\` : 'Orlando Roleplay | Join Now';
              const finalActivity = botActivityText.trim() || defaultPromo;
              custClient.user.setPresence({
                activities: [{ name: finalActivity, type: ActivityType.Watching }],
                status: 'online'
              });
            } catch (pErr) {
              console.warn('[SET PRESENCE WARN]:', pErr.message);
            }
          }
        }`
);

// Fix cfg_modal_ticketcatnames_ to remove empty categories
idx = idx.replace(
  `        const newCats = [];
        for (let i = 1; i <= 5; i++) {
          const rawName = getModalVal(\`cat_name_\${i}\`);
          if (rawName) {
            const existing = currentCats[i - 1] || {};
            newCats.push({
              id: existing.id || \`cat_\${i}\`,
              name: rawName,
              spawnCategoryId: existing.spawnCategoryId || '',
              pingRoleId: existing.pingRoleId || ''
            });
          }
        }
        if (newCats.length > 0) {
          updateBotCustomization(botId, 'ticketCategories', newCats);
        }`,
  `        const newCats = [];
        for (let i = 1; i <= 5; i++) {
          const rawName = getModalVal(\`cat_name_\${i}\`);
          if (rawName && rawName.trim().length > 0) {
            const existing = currentCats[i - 1] || {};
            newCats.push({
              id: existing.id || \`cat_\${i}\`,
              name: rawName.trim(),
              spawnCategoryId: existing.spawnCategoryId || '',
              pingRoleId: existing.pingRoleId || ''
            });
          }
        }
        updateBotCustomization(botId, 'ticketCategories', newCats);`
);

// Fix cfg_modal_ticketbanners_ return page (2 instead of 3)
idx = idx.replace(
  `const payload = buildConfigPanelPayload(botId, 3, false, interaction.guild);
        return interaction.editReply(payload).catch(() => null);
      }

      // Configuration Support Text & Rules Modal Submit (Page 2)`,
  `const payload = buildConfigPanelPayload(botId, 2, false, interaction.guild);
        return interaction.editReply(payload).catch(() => null);
      }

      // Configuration Support Text & Rules Modal Submit (Page 2)`
);

// Fix cfg_modal_text_ return page (2 instead of 3)
idx = idx.replace(
  `const payload = buildConfigPanelPayload(botId, 3, false, interaction.guild);
        return interaction.editReply(payload).catch(() => null);
      }

      // Configuration Session Channels Modal Submit`,
  `const payload = buildConfigPanelPayload(botId, 2, false, interaction.guild);
        return interaction.editReply(payload).catch(() => null);
      }

      // Configuration Session Channels Modal Submit`
);

fs.writeFileSync('index.js', idx, 'utf8');
console.log('index.js updated successfully!');
