import fs from 'fs';

// 1. Fix configPanel.js
let cfg = fs.readFileSync('configPanel.js', 'utf8');

const targetInitialSetup = `export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('Initial Setup')
    .setDescription(
      '> Connect your Discord bot token and ER:LC server key to activate your instance.\\n\\n' +
      '**Credentials**\\n' +
      \`\${hasToken ? EMOJIS.CHECK : EMOJIS.CROSS} Bot Token: \${hasToken ? 'Connected' : 'Not Configured'}\\n\` +
      \`\${hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\`
    )
    .setThumbnail('https://cdn.discordapp.com/avatars/1552165138017165372/9c397e6df530a28a6208310c9c3491a2.png?size=256')
    .setFooter({ text: 'Initial Setup' });

  const buttons = [
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success)
  ];

  const row = new ActionRowBuilder().addComponents(buttons);

  return {
    embeds: [embed],
    components: [row],
    attachments: [],
    flags: 64
  };
}`;

const startMarker = 'export function buildInitialSetupPayload(botId, bot) {';
const endMarker = '  return {\r\n    embeds: [embed],\r\n    components: [row],\r\n    attachments: [],\r\n    flags: 64\r\n  };\r\n}';
const endMarkerLF = '  return {\n    embeds: [embed],\n    components: [row],\n    attachments: [],\n    flags: 64\n  };\n}';

const sIdx = cfg.indexOf(startMarker);
let eIdx = cfg.indexOf(endMarker);
let len = endMarker.length;
if (eIdx === -1) {
  eIdx = cfg.indexOf(endMarkerLF);
  len = endMarkerLF.length;
}

if (sIdx !== -1 && eIdx !== -1) {
  cfg = cfg.substring(0, sIdx) + targetInitialSetup + cfg.substring(eIdx + len);
  console.log('Restored buildInitialSetupPayload to match user screenshot exactly.');
} else {
  console.error('Failed to locate buildInitialSetupPayload in configPanel.js');
  process.exit(1);
}

// Restore Page 1 row 1 to original (no invite button)
const oldPage1Row1Regex = /\/\/ Row 1: Credentials & Server Details & Invite[\s\S]*?rows\.push\(new ActionRowBuilder\(\)\.addComponents\(r1Buttons\)\);/;
const cleanPage1Row1 = `// Row 1: Credentials (Green) & Server Details (Gray) Buttons
      rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
          .setLabel('Setup Credentials')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(\`cfg_btn_servercore_\${botId}\`)
          .setLabel('Server Details')
          .setStyle(ButtonStyle.Secondary)
      ));`;

cfg = cfg.replace(oldPage1Row1Regex, cleanPage1Row1);

// Also restore Page 1 credentials text
cfg = cfg.replace(
  /const tokenText = isOnline \? 'Connected' : \(hasToken \? \(isInvalid \? 'Offline \(Verification Failed\)' : 'Connecting\.\.\.'\) : 'Not Configured'\);/,
  "const tokenText = hasToken ? 'Connected' : 'Not Configured';"
);

fs.writeFileSync('configPanel.js', cfg, 'utf8');
console.log('Cleaned configPanel.js');

// 2. Fix index.js (hasToken definitions)
let idx = fs.readFileSync('index.js', 'utf8');

// Line 2110: define hasToken properly
idx = idx.replace(
  /const isOnline = targetBot\.status === 'active' && Boolean\(targetBot\.token && targetBot\.token\.trim\(\)\.length > 0\);\r?\n\s*const hasApiKey = Boolean\(targetBot\.erlcApiKey && targetBot\.erlcApiKey\.trim\(\)\.length > 0\);\r?\n\s*const isSetupComplete = targetBot\.setupCompleted \|\| \(hasToken && hasApiKey\) \|\| \(isOnline && hasApiKey\);/,
  `const hasToken = Boolean(targetBot.token && targetBot.token.trim().length > 0);
        const hasApiKey = Boolean(targetBot.erlcApiKey && targetBot.erlcApiKey.trim().length > 0);
        const isSetupComplete = Boolean(targetBot.setupCompleted || (hasToken && hasApiKey));`
);

// Line 3983: define hasToken properly
idx = idx.replace(
  /const currentBot = getBotInstance\(botId\);\r?\n\s*const isOnline = currentBot\?\.status === 'active';\r?\n\s*const hasApiKey = Boolean\(currentBot\?\.erlcApiKey && currentBot\.erlcApiKey\.trim\(\)\.length > 0\);\r?\n\s*const payload = \(hasToken && hasApiKey\)/,
  `const currentBot = getBotInstance(botId);
        const hasToken = Boolean(currentBot?.token && currentBot.token.trim().length > 0);
        const hasApiKey = Boolean(currentBot?.erlcApiKey && currentBot.erlcApiKey.trim().length > 0);
        const payload = (hasToken && hasApiKey)`
);

fs.writeFileSync('index.js', idx, 'utf8');
console.log('Cleaned index.js');
