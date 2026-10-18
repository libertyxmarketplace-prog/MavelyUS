import fs from 'fs';

// 1. Update configPanel.js
let cfg = fs.readFileSync('configPanel.js', 'utf8');

// Update TOTAL_PAGES and PAGE_META
cfg = cfg.replace(
  `export const TOTAL_PAGES = 8;

export const PAGE_META = [
  { id: 1, tab: 'Permissions', title: 'PERMISSIONS & ACCESS' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES' },
  { id: 3, tab: 'Appearance', title: 'TICKET APPEARANCE' },
  { id: 4, tab: 'Sessions', title: 'LIVE SESSIONS' },
  { id: 5, tab: 'Applications', title: 'STAFF APPLICATIONS' },
  { id: 6, tab: 'Docs', title: 'STAFF DOCUMENTATION' },
  { id: 7, tab: 'Community', title: 'COMMUNITY & TRACKING' },
  { id: 8, tab: 'AI', title: 'MAVELY AI ASSISTANT' }
];`,
  `export const TOTAL_PAGES = 7;

export const PAGE_META = [
  { id: 1, tab: 'Permissions', title: 'PERMISSIONS & ACCESS' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES & APPEARANCE' },
  { id: 3, tab: 'Sessions', title: 'LIVE SESSIONS' },
  { id: 4, tab: 'Applications', title: 'STAFF APPLICATIONS' },
  { id: 5, tab: 'Docs', title: 'STAFF DOCUMENTATION' },
  { id: 6, tab: 'Community', title: 'COMMUNITY & TRACKING' },
  { id: 7, tab: 'AI', title: 'MAVELY AI ASSISTANT' }
];`
);

// Update buildModulesDropdown
cfg = cfg.replace(
  `function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(\`cfg_menu_modules_\${botId}\`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Permissions & Access', value: 'nav_page_1', description: 'Staff and administrator permissions' },
        { label: 'Ticket Categories', value: 'nav_page_2', description: 'Support desk categories and claiming' },
        { label: 'Ticket Appearance', value: 'nav_page_3', description: 'Panel headline, rules button, and banners' },
        { label: 'Live Sessions', value: 'nav_page_4', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_5', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_6', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_7', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_8', description: 'Automated configuration with AI' }
      ])
  );
}`,
  `function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(\`cfg_menu_modules_\${botId}\`)
      .setPlaceholder('Jump to Module')
      .addOptions([
        { label: 'Permissions & Access', value: 'nav_page_1', description: 'Staff and administrator permissions' },
        { label: 'Ticket System & Appearance', value: 'nav_page_2', description: 'Categories, routing, and panel styling' },
        { label: 'Live Sessions', value: 'nav_page_3', description: 'ER:LC patrol announcements and radios' },
        { label: 'Staff Applications', value: 'nav_page_4', description: 'Recruitment intake and review channels' },
        { label: 'Staff Documentation', value: 'nav_page_5', description: 'Staff handbook and policies hub' },
        { label: 'Community Tracking', value: 'nav_page_6', description: 'Infractions, promotions, forums, questions' },
        { label: 'AI Assistant', value: 'nav_page_7', description: 'Automated configuration with AI' }
      ])
  );
}`
);

// Page 1: Bot Presence default text
cfg = cfg.replace(
  `const actText = cust.botActivityText?.trim() || 'ER:LC';`,
  `const defaultPromo = cust.serverName ? \`\${cust.serverName} | Code: \${cust.joinCode || 'Join'}\` : 'Orlando Roleplay | Join Now';
      const actText = cust.botActivityText?.trim() || defaultPromo;`
);

fs.writeFileSync('configPanel.js', cfg, 'utf8');
console.log('configPanel.js meta and modules updated!');
