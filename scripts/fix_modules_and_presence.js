import fs from 'fs';

// 1. Update configPanel.js
let cfg = fs.readFileSync('configPanel.js', 'utf8');

// A. Update buildModulesDropdown to include Credentials & Setup and Server Details
const oldModulesDropdown = `function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(\`cfg_menu_modules_\${botId}\`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Credentials & Setup', value: 'nav_page_1', description: 'Bot credentials and permissions' },
        { label: 'Ticket System & Appearance', value: 'nav_page_2', description: 'Categories, routing, and panel styling' },
        { label: 'Live Sessions', value: 'nav_page_3', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_4', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_5', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_6', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_7', description: 'Automated configuration with AI' }
      ])
  );
}`;

const newModulesDropdown = `function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(\`cfg_menu_modules_\${botId}\`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Credentials & Setup', value: 'edit_credentials', description: 'Configure bot token and ER:LC API key' },
        { label: 'Server Details', value: 'edit_servercore', description: 'Server name, join code, and custom presence' },
        { label: 'Ticket System & Appearance', value: 'nav_page_2', description: 'Categories, routing, and panel styling' },
        { label: 'Live Sessions', value: 'nav_page_3', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_4', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_5', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_6', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_7', description: 'Automated configuration with AI' }
      ])
  );
}`;

cfg = cfg.replace(oldModulesDropdown, newModulesDropdown);

// B. Remove Row 1 buttons from Page 1 and clean up presence display
const oldPage1 = `      const defaultPromo = cust.serverName ? \`\${cust.serverName} | Code: \${cust.joinCode || 'Join'}\` : 'Orlando Roleplay | Join Now';
      const actText = cust.botActivityText?.trim() || defaultPromo;

      embed.setDescription(
        '> Connect your Discord bot token and ER:LC server key to activate your instance, and manage community access.\\n\\n' +
        '**Credentials**\\n' +
        \`\${tokenMark} Bot Token: \${tokenText}\\n\` +
        \`\${apiKeyMark} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\\n\\n\` +
        '**Permissions**\\n' +
        \`\${staffMark} Staff Role: \${staffDisplay}\\n\` +
        \`\${adminMark} Admin Role: \${adminDisplay}\\n\\n\` +
        '**In-Game Server**\\n' +
        \`╭ Community Name: \${cust.serverName?.trim() || 'Orlando Roleplay'}\\n\` +
        \`├ Join Code: \${cust.joinCode?.trim() || 'ORLERLC'}\\n\` +
        \`╰ Presence: Watching \${actText}\`
      );

      // Row 1: Credentials (Green) & Server Details (Gray) Buttons
      rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
          .setLabel('Setup Credentials')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(\`cfg_btn_servercore_\${botId}\`)
          .setLabel('Server Details')
          .setStyle(ButtonStyle.Secondary)
      ));

      // Row 2: Staff Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_staff_\${botId}\`)
          .setPlaceholder('Select Staff Role')
      ));

      // Row 3: Admin Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_admin_\${botId}\`)
          .setPlaceholder('Select Admin Role')
      ));

      // Row 4: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 1));`;

const newPage1 = `      const defaultPromo = cust.serverName ? \`\${cust.serverName} | Code: \${cust.joinCode || 'Join'}\` : 'Our Community';
      const actText = cust.botActivityText?.trim() || defaultPromo;

      embed.setDescription(
        '> Connect your Discord bot token and ER:LC server key to activate your instance, and manage community access.\\n\\n' +
        '**Credentials**\\n' +
        \`\${tokenMark} Bot Token: \${tokenText}\\n\` +
        \`\${apiKeyMark} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\\n\\n\` +
        '**Permissions**\\n' +
        \`\${staffMark} Staff Role: \${staffDisplay}\\n\` +
        \`\${adminMark} Admin Role: \${adminDisplay}\\n\\n\` +
        '**In-Game Server**\\n' +
        \`╭ Community Name: \${cust.serverName?.trim() || 'Not Configured'}\\n\` +
        \`├ Join Code: \${cust.joinCode?.trim() || 'Not Configured'}\\n\` +
        \`╰ Presence: Watching \${actText}\`
      );

      // Row 1: Staff Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_staff_\${botId}\`)
          .setPlaceholder('Select Staff Role')
      ));

      // Row 2: Admin Role (Select from Discord roles directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_admin_\${botId}\`)
          .setPlaceholder('Select Admin Role')
      ));

      // Row 3: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 4: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 1));`;

cfg = cfg.replace(oldPage1, newPage1);

// C. Update buildServerCoreModal to properly prefill and remove hardcoded defaults
const oldServerCoreModal = `export function buildServerCoreModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_servercore_\${botId}\`)
    .setTitle('Server Identity & Join Code');

  const autoName = cust.serverName?.trim() || 'Orlando Roleplay I Strict I Liveries';
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
  if (cust.botActivityText?.trim()) activityInput.setValue(cust.botActivityText.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(joinInput),
    new ActionRowBuilder().addComponents(activityInput)
  );

  return modal;
}`;

const newServerCoreModal = `export function buildServerCoreModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(\`cfg_modal_servercore_\${botId}\`)
    .setTitle('Server Identity & Join Code');

  const currentName = cust.serverName?.trim() || '';
  const currentJoin = cust.joinCode?.trim() || '';
  const currentActivity = cust.botActivityText?.trim() || '';

  const nameInput = new TextInputBuilder()
    .setCustomId('serverName')
    .setLabel('In-Game Server Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. My Community')
    .setRequired(false);
  if (currentName) nameInput.setValue(currentName);

  const joinInput = new TextInputBuilder()
    .setCustomId('joinCode')
    .setLabel('Server Join Code')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. JOINCODE')
    .setRequired(false);
  if (currentJoin) joinInput.setValue(currentJoin);

  const activityInput = new TextInputBuilder()
    .setCustomId('botActivityText')
    .setLabel('Bot Status Activity (Custom Presence)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Patrolling | Code: JOINCODE')
    .setRequired(false);
  if (currentActivity) activityInput.setValue(currentActivity);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(joinInput),
    new ActionRowBuilder().addComponents(activityInput)
  );

  return modal;
}`;

cfg = cfg.replace(oldServerCoreModal, newServerCoreModal);
fs.writeFileSync('configPanel.js', cfg, 'utf8');
console.log('Updated configPanel.js successfully!');

// 2. Update customerBotRunner.js to fetch fresh customizations on startup and ready
let cbr = fs.readFileSync('customerBotRunner.js', 'utf8');

cbr = cbr.replace(
  `  const defaultPromo = bot.customizations?.serverName\r\n    ? \`\${bot.customizations.serverName} | Code: \${bot.customizations.joinCode || 'Join'}\`\r\n    : 'Orlando Roleplay | Join Now';\r\n  const actName = (bot.customizations?.botActivityText && bot.customizations.botActivityText.trim()) || defaultPromo;`,
  `  const freshBot = getBotInstance(bot.botId) || bot;
  const freshCust = freshBot.customizations || {};
  const defaultPromo = freshCust.serverName
    ? \`\${freshCust.serverName} | Code: \${freshCust.joinCode || 'Join'}\`
    : 'Our Community';
  const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;`
);

cbr = cbr.replace(
  `  const defaultPromo = bot.customizations?.serverName\n    ? \`\${bot.customizations.serverName} | Code: \${bot.customizations.joinCode || 'Join'}\`\n    : 'Orlando Roleplay | Join Now';\n  const actName = (bot.customizations?.botActivityText && bot.customizations.botActivityText.trim()) || defaultPromo;`,
  `  const freshBot = getBotInstance(bot.botId) || bot;
  const freshCust = freshBot.customizations || {};
  const defaultPromo = freshCust.serverName
    ? \`\${freshCust.serverName} | Code: \${freshCust.joinCode || 'Join'}\`
    : 'Our Community';
  const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;`
);

cbr = cbr.replace(
  `        const defaultPromo = bot.customizations?.serverName\r\n          ? \`\${bot.customizations.serverName} | Code: \${bot.customizations.joinCode || 'Join'}\`\r\n          : 'Orlando Roleplay | Join Now';\r\n        const actName = (bot.customizations?.botActivityText && bot.customizations.botActivityText.trim()) || defaultPromo;`,
  `        const freshBot = getBotInstance(bot.botId) || bot;
        const freshCust = freshBot.customizations || {};
        const defaultPromo = freshCust.serverName
          ? \`\${freshCust.serverName} | Code: \${freshCust.joinCode || 'Join'}\`
          : 'Our Community';
        const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;`
);

cbr = cbr.replace(
  `        const defaultPromo = bot.customizations?.serverName\n          ? \`\${bot.customizations.serverName} | Code: \${bot.customizations.joinCode || 'Join'}\`\n          : 'Orlando Roleplay | Join Now';\n        const actName = (bot.customizations?.botActivityText && bot.customizations.botActivityText.trim()) || defaultPromo;`,
  `        const freshBot = getBotInstance(bot.botId) || bot;
        const freshCust = freshBot.customizations || {};
        const defaultPromo = freshCust.serverName
          ? \`\${freshCust.serverName} | Code: \${freshCust.joinCode || 'Join'}\`
          : 'Our Community';
        const actName = (freshCust.botActivityText && freshCust.botActivityText.trim()) || defaultPromo;`
);

fs.writeFileSync('customerBotRunner.js', cbr, 'utf8');
console.log('Updated customerBotRunner.js successfully!');

// 3. Update index.js
let idx = fs.readFileSync('index.js', 'utf8');

// A. Map edit_credentials to buildInitialSetupModal in buildConfigActionModal
idx = idx.replace(
  "case 'edit_credentials': return buildCredentialsModal(botId);",
  "case 'edit_credentials': return buildInitialSetupModal(botId);"
);

// B. Update presence application in cfg_modal_servercore_
idx = idx.replace(
  `        if (botActivityText !== undefined) {
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
  `        updateBotCustomization(botId, 'botActivityText', botActivityText);
        const custClient = activeCustomerClients.get(botId);
        if (custClient?.user) {
          try {
            const finalActivity = botActivityText?.trim() || (serverName ? \`\${serverName} | Code: \${joinCode || 'Join'}\` : 'Our Community');
            custClient.user.setPresence({
              activities: [{ name: finalActivity, type: ActivityType.Watching }],
              status: 'online'
            });
            console.log(\`[CUSTOMER BOT \${botId}] Presence updated to: Watching \${finalActivity}\`);
          } catch (pErr) {
            console.warn(\`[CUSTOMER BOT \${botId}] Error updating presence:\`, pErr.message);
          }
        }`
);

fs.writeFileSync('index.js', idx, 'utf8');
console.log('Updated index.js successfully!');
