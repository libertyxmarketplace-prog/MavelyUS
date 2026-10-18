import fs from 'fs';

let code = fs.readFileSync('configPanel.js', 'utf8');

// Replace case 2 and case 3 with combined case 2, and shift 4->3, 5->4, 6->5, 7->6, 8->7
const oldPages2and3 = `    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: TICKET CATEGORIES
    // ══════════════════════════════════════════════════════════════════════
    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const categories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      const spawnCatId = cust.ticketSpawnCategoryId || categories[0]?.spawnCategoryId;
      const spawnMark = spawnCatId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const transMark = cust.transcriptsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const claimMark = cust.ticketClaimRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Support desk routing, category channels, and appearance styling.\\n\\n' +
        '**Ticket Routing & Access**\\n' +
        \`\${spawnMark} Spawn Category: \${chanRef(spawnCatId)}\\n\` +
        \`\${transMark} Transcripts: \${chanRef(cust.transcriptsChannelId)}\\n\` +
        \`\${claimMark} Claim Role: \${roleRef(cust.ticketClaimRoleId)}\\n\\n\` +
        '**Categories**\\n' +
        \`1. \${categories[0]?.name || 'General Support'}\\n\` +
        \`2. \${categories[1]?.name || 'High Rank'}\\n\` +
        \`3. \${categories[2]?.name || 'Player Report'}\\n\` +
        \`4. \${categories[3]?.name || 'Appeals'}\\n\` +
        \`5. \${categories[4]?.name || 'Other'}\\n\\n\` +
        '**Assistant**\\n' +
        'Need help? Click the **Helper** button below for guidance.'
      );

      // Row 1: Category Spawn Channel (Select category/channel directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_ticketspawn_\${botId}\`)
          .setPlaceholder('Select Ticket Spawn Category / Channel')
          .setChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText)
      ));

      // Row 2: Transcripts Channel (Select text channel directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_transcripts_\${botId}\`)
          .setPlaceholder('Select Transcripts Channel')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      ));

      // Row 3: Ticket Claim Role (Select role directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_claim_\${botId}\`)
          .setPlaceholder('Select Ticket Claim Role')
      ));

      // Row 4: Appearance & Category Options (Appearance integrated right here)
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_2\`)
          .setPlaceholder('Appearance & Category Settings')
          .addOptions([
            { label: 'Rename Category Slots', value: 'edit_ticket_catnames', description: 'Customize category display names' },
            { label: 'Panel Headline & Description', value: 'edit_ticket_text', description: 'Customize ticket center title and text' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set artwork image links' },
            { label: 'Rules Button & Greeting', value: 'edit_rules_greeting', description: 'Rules modal and greeting text' },
            { label: 'Staff Notification Pings', value: 'edit_ticket_catpings', description: 'Roles alerted when opened' },
            { label: 'Reset to Defaults', value: 'reset_ticket_categories', description: 'Restore default categories & style' }
          ])
      ));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: TICKET APPEARANCE
    // ══════════════════════════════════════════════════════════════════════
    case 3: {
      embed.setDescription(
        '> Customize ticket panel display, rules button, and banner artwork.\\n\\n' +
        '**Panel Display**\\n' +
        \`Title: \${cust.panelTitle || 'Mavely Support'}\\n\` +
        \`Rules Button: \${cust.showRulesButton !== false ? 'Enabled' : 'Disabled'}\\n\` +
        \`Rules Content: \${cust.rulesDescription ? 'Custom' : 'Standard'}\\n\` +
        \`Greeting Message: \${cust.ticketOpenMessage ? 'Custom' : 'Standard'}\\n\\n\` +
        '**Artwork**\\n' +
        \`Top Banner: \${cust.topBannerUrl ? 'Custom' : 'Default'}\\n\` +
        \`Bottom Accent: \${cust.bottomBannerUrl ? 'Custom' : 'Default'}\`
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_3\`)
          .setPlaceholder('Appearance Settings')
          .addOptions([
            { label: 'Panel Headline Text', value: 'edit_ticket_text', description: 'Customize ticket center title and welcome text' },
            { label: 'Rules & Greeting', value: 'edit_rules_greeting', description: 'Rules button label and guidance modal' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set artwork image links' },
            { label: 'Reset Banners', value: 'reset_banners', description: 'Restore default Mavely graphics' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 3));
      break;
    }`;

const newPage2 = `    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: TICKET CATEGORIES & APPEARANCE
    // ══════════════════════════════════════════════════════════════════════
    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const rawCategories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      // Filter out any removed / blank categories
      const categories = rawCategories.filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0);
      const displayCats = categories.length > 0 ? categories : defaultCategories.slice(0, 1);

      const spawnCatId = cust.ticketSpawnCategoryId || displayCats[0]?.spawnCategoryId;
      const spawnMark = spawnCatId ? EMOJIS.CHECK : EMOJIS.CROSS;

      const catsList = displayCats
        .map((c, i) => \`\${i + 1}. **\${c.name}** \${c.spawnCategoryId ? \`→ <#\${c.spawnCategoryId}>\` : ''}\`)
        .join('\\n');

      const bannerStatus = cust.topBannerUrl ? 'Custom' : 'Not Set (Optional)';
      const insideStatus = cust.ticketInsideBannerUrl ? 'Custom' : 'Not Set (Optional)';
      const rulesStatus = cust.showRulesButton !== false ? (cust.rulesButtonLabel || 'Server Guidelines') : 'Disabled';

      embed.setDescription(
        '> Support desk routing, category channels, and appearance styling.\\n\\n' +
        '**Ticket Routing**\\n' +
        \`\${spawnMark} Spawn Category: \${chanRef(spawnCatId)}\\n\\n\` +
        '**Active Categories**\\n' +
        \`\${catsList}\\n\\n\` +
        '**Panel Appearance**\\n' +
        \`Title: \${cust.panelTitle || 'Support'}\\n\` +
        \`Top Banner: \${bannerStatus}\\n\` +
        \`Header Banner: \${insideStatus}\\n\` +
        \`Rules Button: \${rulesStatus}\\n\\n\` +
        '**Assistant**\\n' +
        'Need help? Click the **Helper** button below for guidance.'
      );

      // Row 1: Category Spawn Channel (Native Channel Select Menu)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_ticketspawn_\${botId}\`)
          .setPlaceholder('Select Ticket Spawn Category / Channel')
          .setChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText)
      ));

      // Row 2: Appearance & Category Settings dropdown
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_2\`)
          .setPlaceholder('Appearance & Category Settings')
          .addOptions([
            { label: 'Rename & Remove Categories', value: 'edit_ticket_catnames', description: 'Customize category names (leave blank to remove)' },
            { label: 'Category Spawn Channels', value: 'edit_ticket_catspawns', description: 'Configure spawn channels for active categories' },
            { label: 'Panel Headline & Description', value: 'edit_ticket_text', description: 'Customize title and ticket center description' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set panel top banner and inside header (optional)' },
            { label: 'Rules Button & Greeting', value: 'edit_rules_greeting', description: 'Rules button label and greeting message' },
            { label: 'Staff Notification Pings', value: 'edit_ticket_catpings', description: 'Roles alerted when tickets open' },
            { label: 'Reset to Defaults', value: 'reset_ticket_categories', description: 'Restore default categories & style' }
          ])
      ));

      // Row 3: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 4: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }`;

code = code.replace(oldPages2and3, newPage2);

// Update page numbers for remaining pages:
// 4 -> 3
code = code.replace('// PAGE 4: LIVE SESSIONS\n    // ══════════════════════════════════════════════════════════════════════\n    case 4: {', '// PAGE 3: LIVE SESSIONS\n    // ══════════════════════════════════════════════════════════════════════\n    case 3: {');
code = code.replace('rows.push(buildNavButtonRow(botId, 4));', 'rows.push(buildNavButtonRow(botId, 3));');

// 5 -> 4
code = code.replace('// PAGE 5: STAFF APPLICATIONS\n    // ══════════════════════════════════════════════════════════════════════\n    case 5: {', '// PAGE 4: STAFF APPLICATIONS\n    // ══════════════════════════════════════════════════════════════════════\n    case 4: {');
code = code.replace('rows.push(buildNavButtonRow(botId, 5));', 'rows.push(buildNavButtonRow(botId, 4));');

// 6 -> 5
code = code.replace('// PAGE 6: STAFF DOCUMENTATION\n    // ══════════════════════════════════════════════════════════════════════\n    case 6: {', '// PAGE 5: STAFF DOCUMENTATION\n    // ══════════════════════════════════════════════════════════════════════\n    case 5: {');
code = code.replace('rows.push(buildNavButtonRow(botId, 6));', 'rows.push(buildNavButtonRow(botId, 5));');

// 7 -> 6
code = code.replace('// PAGE 7: COMMUNITY & TRACKING\n    // ══════════════════════════════════════════════════════════════════════\n    case 7: {', '// PAGE 6: COMMUNITY & TRACKING\n    // ══════════════════════════════════════════════════════════════════════\n    case 6: {');
code = code.replace('rows.push(buildNavButtonRow(botId, 7));', 'rows.push(buildNavButtonRow(botId, 6));');

// 8 -> 7
code = code.replace('// PAGE 8: MAVELY AI ASSISTANT\n    // ══════════════════════════════════════════════════════════════════════\n    case 8: {', '// PAGE 7: MAVELY AI ASSISTANT\n    // ══════════════════════════════════════════════════════════════════════\n    case 7: {');
code = code.replace('rows.push(buildNavButtonRow(botId, 8));', 'rows.push(buildNavButtonRow(botId, 7));');

fs.writeFileSync('configPanel.js', code, 'utf8');
console.log('Pages merged and renumbered in configPanel.js successfully!');
