import fs from 'fs';

// 1. Update configPanel.js
let cfg = fs.readFileSync('configPanel.js', 'utf8');

const startMarker = 'export function buildInitialSetupPayload(botId, bot) {';
const endMarker = '  return {\r\n    embeds: [embed],\r\n    components: [row],\r\n    attachments: [],\r\n    flags: 64\r\n  };\r\n}';
const endMarkerLF = '  return {\n    embeds: [embed],\n    components: [row],\n    attachments: [],\n    flags: 64\n  };\n}';

const newFn = `export function buildInitialSetupPayload(botId, bot) {
  const isOnline = bot?.status === 'active' && Boolean(bot?.token && bot.token.trim().length > 0);
  const isInvalid = bot?.status === 'invalid_token';
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);
  const hasCredentials = hasToken && hasApiKey;

  let tokenStatusText = 'Not Configured';
  let tokenMark = EMOJIS.CROSS;
  if (isOnline) {
    tokenStatusText = 'Connected';
    tokenMark = EMOJIS.CHECK;
  } else if (hasToken) {
    tokenStatusText = isInvalid ? 'Offline (Verification Failed)' : 'Connecting...';
    tokenMark = EMOJIS.CROSS;
  }

  const descLines = [
    '> Connect your Discord bot token and ER:LC server key to activate your instance.'
  ];

  if (isInvalid) {
    descLines.push('', '> **Notice**: Discord could not verify this bot token. You can update your token anytime using the button below.');
  }

  descLines.push(
    '',
    '**Credentials**',
    \`\${tokenMark} Bot Token: \${tokenStatusText}\`,
    \`\${hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\`
  );

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('Initial Setup')
    .setDescription(descLines.join('\\n'))
    .setThumbnail('https://cdn.discordapp.com/avatars/1552165138017165372/9c397e6df530a28a6208310c9c3491a2.png?size=256')
    .setFooter({ text: 'Initial Setup' });

  let derivedClientId = bot?.discordBotId;
  if (!derivedClientId && bot?.token) {
    try {
      const raw = Buffer.from(bot.token.split('.')[0], 'base64').toString('utf-8');
      if (/^\\d{17,20}$/.test(raw)) derivedClientId = raw;
    } catch {}
  }

  const buttons = [
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
      .setLabel(hasToken ? 'Update Credentials' : 'Setup Credentials')
      .setStyle(ButtonStyle.Success)
  ];

  if (derivedClientId) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(\`https://discord.com/oauth2/authorize?client_id=\${derivedClientId}&permissions=8&scope=bot%20applications.commands\`)
    );
  }

  if (hasCredentials || isOnline) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(\`cfg_btn_skip_setup_\${botId}\`)
        .setLabel('Open Config Panel')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  const row = new ActionRowBuilder().addComponents(buttons);

  return {
    embeds: [embed],
    components: [row],
    attachments: [],
    flags: 64
  };
}`;

const sIdx = cfg.indexOf(startMarker);
let eIdx = cfg.indexOf(endMarker);
let len = endMarker.length;
if (eIdx === -1) {
  eIdx = cfg.indexOf(endMarkerLF);
  len = endMarkerLF.length;
}

if (sIdx !== -1 && eIdx !== -1) {
  cfg = cfg.substring(0, sIdx) + newFn + cfg.substring(eIdx + len);
  console.log('Updated buildInitialSetupPayload in configPanel.js');
} else {
  console.error('Could not locate markers in configPanel.js');
  process.exit(1);
}

// Update Page 1 tokenText in configPanel.js
cfg = cfg.replace(
  "const tokenText = isOnline ? 'Connected' : (isInvalid ? 'Invalid Token (Reset in Dev Portal)' : 'Not Configured');",
  "const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);\n      const tokenText = isOnline ? 'Connected' : (hasToken ? (isInvalid ? 'Offline (Verification Failed)' : 'Connecting...') : 'Not Configured');"
);

fs.writeFileSync('configPanel.js', cfg, 'utf8');
console.log('Updated configPanel.js');

// 2. Update index.js so users with credentials can freely access the config panel
let idx = fs.readFileSync('index.js', 'utf8');

// Replace /config check
idx = idx.replace(
  "const isSetupComplete = targetBot.setupCompleted && isOnline && hasApiKey;",
  "const isSetupComplete = targetBot.setupCompleted || (hasToken && hasApiKey) || (isOnline && hasApiKey);"
);

// Replace modal submit payload check
idx = idx.replace(
  "const payload = (isOnline && hasApiKey)\r\n          ? buildConfigPanelPayload(botId, 1, false, interaction.guild)\r\n          : buildInitialSetupPayload(botId, currentBot);",
  "const payload = (hasToken && hasApiKey)\r\n          ? buildConfigPanelPayload(botId, 1, false, interaction.guild)\r\n          : buildInitialSetupPayload(botId, currentBot);"
);
idx = idx.replace(
  "const payload = (isOnline && hasApiKey)\n          ? buildConfigPanelPayload(botId, 1, false, interaction.guild)\n          : buildInitialSetupPayload(botId, currentBot);",
  "const payload = (hasToken && hasApiKey)\n          ? buildConfigPanelPayload(botId, 1, false, interaction.guild)\n          : buildInitialSetupPayload(botId, currentBot);"
);

fs.writeFileSync('index.js', idx, 'utf8');
console.log('Updated index.js');
