const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'web', 'src', 'pages', 'DashboardPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Remove handleLoadApplicationTemplate
const templateRegex = /const handleLoadApplicationTemplate = \([\s\S]*?\n  \};\n/;
if (templateRegex.test(content)) {
  content = content.replace(templateRegex, '');
}

// 2. Remove unused old dutils states and handler
content = content.replace(
  /  \/\/ Documentation \/ dutils states[\s\S]*?const handleSendDocumentationDiscord = async \(\) => \{[\s\S]*?\n  \};\n/,
  ''
);

// 3. Replace TAB: STAFF DOCUMENTATION & DUTILS with DiskHookBuilder
const docsSectionRegex = /\{\/\* TAB: STAFF DOCUMENTATION & DUTILS \*\/\}[\s\S]*?\{\/\* TAB: COMMUNITY TRACKING \*\/\}/;
if (docsSectionRegex.test(content)) {
  content = content.replace(
    docsSectionRegex,
    `{/* TAB: STAFF DOCUMENTATION & EMBED BUILDER (Full dutils & message.style) */}
              {activeTab === 'docs' && selectedGuild && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <DiskHookBuilder
                    guildId={selectedGuild.id}
                    channels={resources.channels}
                    defaultChannelId={typeof config.rulesChannelId === 'string' ? config.rulesChannelId : ''}
                    onSavedToConfig={(chanId) => setConfig({ ...config, rulesChannelId: chanId })}
                  />
                </div>
              )}

              {/* TAB: COMMUNITY TRACKING */}`
  );
}

// 4. Ensure per-tab save buttons only show when hasUnsavedChanges
// In server tab:
content = content.replace(
  `                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4"
                    >
                      {savingConfig ? 'Saving...' : 'Save Changes'}
                    </Button>`,
  `                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}`
);

// In tickets tab:
content = content.replace(
  `                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4"
                    >
                      {savingConfig ? 'Saving...' : 'Save Changes'}
                    </Button>`,
  `                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}`
);

// In sessions tab:
content = content.replace(
  `                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4"
                    >
                      {savingConfig ? 'Saving...' : 'Save Changes'}
                    </Button>`,
  `                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}`
);

// In community tab:
content = content.replace(
  `                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4"
                    >
                      {savingConfig ? 'Saving...' : 'Save Changes'}
                    </Button>`,
  `                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-[#2ecc71] text-black hover:bg-[#2ecc71]/90 text-xs font-semibold h-9 px-4 shadow-md shadow-[#2ecc71]/15"
                      >
                        {savingConfig ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully completed full patch of DashboardPage.tsx!');
