const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'web', 'src', 'pages', 'DashboardPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add DiscordMarkdown import and ChevronDown import
if (!content.includes('DiscordMarkdown')) {
  content = content.replace(
    "import { DiskHookBuilder } from '@/components/DiskHookBuilder';",
    "import { DiskHookBuilder } from '@/components/DiskHookBuilder';\nimport { DiscordMarkdown } from '@/components/DiscordMarkdown';\nimport { ChevronDown } from 'lucide-react';"
  );
}

// 2. Remove + Report and + Staff buttons
content = content.replace(
  `                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddPresetCategory('Player Report')}
                            className="text-[11px] h-7 border-white/10"
                          >
                            + Report
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddPresetCategory('Staff Inquiry')}
                            className="text-[11px] h-7 border-white/10"
                          >
                            + Staff
                          </Button>`,
  ``
);

// 3. Replace uppercase font-mono labels everywhere with clean modern text-xs font-medium text-zinc-300
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Category Label<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Category Label</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Spawn Folder Category<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Spawn Category Folder</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Staff Ping Role<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Staff Ping Role</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Top Banner URL<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Top Banner URL</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Bottom Banner URL<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Bottom Banner URL</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Inside Ticket Banner URL<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Inside Ticket Banner URL</span>`
);
content = content.replace(
  /<span className="text-\[10px\] text-zinc-400 uppercase font-mono">Ticket Open Welcome Greeting<\/span>/g,
  `<span className="text-xs font-medium text-zinc-300">Ticket Open Welcome Greeting</span>`
);

// 4. Add Panel Appearance Customizers (Color, V2/Classic, Buttons/Select) in Tickets tab
const appearanceTarget = `<Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Ticket className="size-4 text-[#2ecc71]" />
                        Support Panel Appearance &amp; Dispatch
                      </CardTitle>
                    </CardHeader>`;

const appearanceReplacement = `<Card className="border-white/[0.08] bg-[#0d0f17]">
                    <CardHeader className="pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Ticket className="size-4 text-[#2ecc71]" />
                          Support Panel Appearance &amp; Design System
                        </CardTitle>
                        <span className="text-xs text-zinc-400">Customizable layout, colors &amp; interactive components</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Theme, Design & Component Customizers */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-black/30">
                        {/* Design Style */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Panel Design Style</Label>
                          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelDesign: 'v2' })}
                              className={\`flex-1 py-1 text-[11px] font-medium rounded-md transition-all \${
                                config.panelDesign !== 'classic'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }\`}
                            >
                              V2 Container
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelDesign: 'classic' })}
                              className={\`flex-1 py-1 text-[11px] font-medium rounded-md transition-all \${
                                config.panelDesign === 'classic'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }\`}
                            >
                              Classic Embed
                            </button>
                          </div>
                        </div>

                        {/* Interactive Component Type (Buttons vs Select) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Component Input Type</Label>
                          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelLayout: 'buttons' })}
                              className={\`flex-1 py-1 text-[11px] font-medium rounded-md transition-all \${
                                (config.panelLayout || 'buttons') === 'buttons'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }\`}
                            >
                              Action Buttons
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, panelLayout: 'select' })}
                              className={\`flex-1 py-1 text-[11px] font-medium rounded-md transition-all \${
                                config.panelLayout === 'select'
                                  ? 'bg-[#2ecc71] text-black font-semibold shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }\`}
                            >
                              Dropdown Menu
                            </button>
                          </div>
                        </div>

                        {/* Accent Color Swatches & Picker */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-300">Accent Color</Label>
                          <div className="flex items-center gap-1.5">
                            {['#2ecc71', '#5865f2', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'].map(hex => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setConfig({ ...config, panelColor: hex })}
                                style={{ backgroundColor: hex }}
                                className={\`size-6 rounded-md transition-transform \${
                                  (config.panelColor || '#2ecc71').toLowerCase() === hex.toLowerCase()
                                    ? 'ring-2 ring-white scale-110 shadow-md'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }\`}
                              />
                            ))}
                            <input
                              type="color"
                              value={config.panelColor || '#2ecc71'}
                              onChange={(e) => setConfig({ ...config, panelColor: e.target.value })}
                              className="size-6 rounded-md border border-white/15 bg-transparent cursor-pointer p-0 shrink-0"
                              title="Custom Accent Color"
                            />
                          </div>
                        </div>
                      </div>`;

if (content.includes(appearanceTarget)) {
  content = content.replace(appearanceTarget, appearanceReplacement);
}

// 5. Replace preview block using string markers
const previewStartMarker = '{/* Authentic Discord Message Preview Box */}';
const previewEndMarker = '{/* TAB: SESSION PANEL';

const pStartIndex = content.indexOf(previewStartMarker);
const pEndIndex = content.indexOf(previewEndMarker);

if (pStartIndex !== -1 && pEndIndex !== -1) {
  const replacement = `{/* Authentic Discord Message Preview Box */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/80 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                          <Eye className="size-4 text-[#2ecc71]" />
                          <span>Live Discord Message Preview (How Players See It)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400 bg-white/[0.03]">
                            {(config.panelDesign || 'v2').toUpperCase()} MODE
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400 bg-white/[0.03]">
                            {(config.panelLayout || 'buttons').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Discord Chat Surface (Authentic Discord Client Dark Theme #313338) */}
                      <div className="rounded-xl border border-black/40 bg-[#313338] p-5 shadow-2xl font-sans">
                        <div className="flex items-start gap-4">
                          {/* Real Discord Bot Avatar */}
                          <div className="size-10 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 overflow-hidden shadow-md ring-1 ring-white/10">
                            <img
                              src={
                                workspace?.botUser?.avatarUrl ||
                                (selectedGuild?.icon
                                  ? \`https://cdn.discordapp.com/icons/\${selectedGuild.id}/\${selectedGuild.icon}.png?size=96\`
                                  : '/mavely-mark.png')
                              }
                              alt="Bot"
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/mavely-mark.png';
                              }}
                            />
                          </div>

                          {/* Message Content & Embedded Panel */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Author Row */}
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-[15px] font-semibold text-white hover:underline cursor-pointer">
                                {workspace?.botUser?.username || selectedGuild?.name || 'Mavely'} Support
                              </span>
                              <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] uppercase tracking-wider">
                                BOT
                              </span>
                              <span className="text-[12px] text-[#949ba4] ml-1">Today at 5:46 PM</span>
                            </div>

                            {/* Panel Container (V2 or Classic Embed) */}
                            {config.panelDesign === 'classic' ? (
                              /* Classic Left-Border Discord Embed */
                              <div
                                className="max-w-[500px] rounded-lg bg-[#2b2d31] p-3.5 space-y-2.5 shadow-md border-l-[4px]"
                                style={{ borderColor: config.panelColor || '#2ecc71' }}
                              >
                                {config.topBannerUrl && (
                                  <img
                                    src={config.topBannerUrl}
                                    alt="Banner"
                                    className="w-full max-h-36 object-cover rounded-[4px]"
                                  />
                                )}

                                <div className="space-y-1">
                                  <h4 className="text-[15px] font-bold text-white tracking-tight">
                                    {config.panelTitle || 'Support Center'}
                                  </h4>
                                  <DiscordMarkdown
                                    content={
                                      config.panelDescription ||
                                      'Please select an inquiry category below to open a ticket with server staff.'
                                    }
                                  />
                                </div>

                                {config.bottomBannerUrl && (
                                  <img
                                    src={config.bottomBannerUrl}
                                    alt="Bottom Banner"
                                    className="w-full max-h-20 object-cover rounded-[4px]"
                                  />
                                )}

                                <div className="text-[11px] text-[#949ba4] pt-1 border-t border-white/[0.04]">
                                  {selectedGuild?.name || 'Server'} • Today at 5:46 PM
                                </div>
                              </div>
                            ) : (
                              /* Components V2 Card Container */
                              <div
                                className="max-w-[500px] rounded-2xl bg-[#2b2d31] border border-white/[0.08] p-4 space-y-3 shadow-lg"
                                style={{ borderTop: \`3px solid \${config.panelColor || '#2ecc71'}\` }}
                              >
                                {config.topBannerUrl && (
                                  <img
                                    src={config.topBannerUrl}
                                    alt="Banner"
                                    className="w-full max-h-36 object-cover rounded-xl"
                                  />
                                )}

                                <div className="space-y-1.5">
                                  <h4 className="text-[16px] font-bold text-white tracking-tight">
                                    {config.panelTitle || 'Support Center'}
                                  </h4>
                                  <DiscordMarkdown
                                    content={
                                      config.panelDescription ||
                                      'Please select an inquiry category below to open a ticket with server staff.'
                                    }
                                  />
                                </div>

                                {config.bottomBannerUrl && (
                                  <img
                                    src={config.bottomBannerUrl}
                                    alt="Bottom Banner"
                                    className="w-full max-h-20 object-cover rounded-xl"
                                  />
                                )}

                                {/* Interactive Section: Rendered inside container if V2 */}
                                <div className="pt-1">
                                  {config.panelLayout === 'select' ? (
                                    /* Discord Dropdown Select Menu */
                                    <div className="w-full bg-[#1e1f22] border border-[#232428] rounded-[4px] px-3 py-2 text-[13px] text-zinc-300 flex items-center justify-between cursor-pointer hover:border-[#35373c] select-none transition-colors">
                                      <span className="text-zinc-400">Select an inquiry category...</span>
                                      <ChevronDown className="size-4 text-zinc-400" />
                                    </div>
                                  ) : (
                                    /* Discord Buttons Row (NO EMOJIS) */
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {ticketCategories.map((c, i) => (
                                        <div
                                          key={i}
                                          className="px-3.5 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#5c5e66] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm"
                                        >
                                          {c.name}
                                        </div>
                                      ))}
                                      {config.rulesButtonLabel && (
                                        <div className="px-3.5 py-1.5 rounded-[3px] bg-[#5865f2] hover:bg-[#4752c4] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm">
                                          {config.rulesButtonLabel}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* If Classic Embed, buttons or select menu render below the embed box */}
                            {config.panelDesign === 'classic' && (
                              <div className="pt-1 max-w-[500px]">
                                {config.panelLayout === 'select' ? (
                                  <div className="w-full bg-[#1e1f22] border border-[#232428] rounded-[4px] px-3 py-2 text-[13px] text-zinc-300 flex items-center justify-between cursor-pointer hover:border-[#35373c] select-none transition-colors">
                                    <span className="text-zinc-400">Select an inquiry category...</span>
                                    <ChevronDown className="size-4 text-zinc-400" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {ticketCategories.map((c, i) => (
                                      <div
                                        key={i}
                                        className="px-3.5 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#5c5e66] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm"
                                      >
                                        {c.name}
                                      </div>
                                    ))}
                                    {config.rulesButtonLabel && (
                                      <div className="px-3.5 py-1.5 rounded-[3px] bg-[#5865f2] hover:bg-[#4752c4] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm">
                                        {config.rulesButtonLabel}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              `;
  content = content.slice(0, pStartIndex) + replacement + content.slice(pEndIndex);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully upgraded DashboardPage.tsx with panel customizers, markdown and fonts!');
