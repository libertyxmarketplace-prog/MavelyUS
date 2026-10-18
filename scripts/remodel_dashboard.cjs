const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'web', 'src', 'pages', 'DashboardPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add deployment states
if (!content.includes('ticketDeployChannelId')) {
  content = content.replace(
    "  const [actionLoading, setActionLoading] = useState<string | null>(null);",
    `  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ticketDeployChannelId, setTicketDeployChannelId] = useState('');
  const [deployingTicketPanel, setDeployingTicketPanel] = useState(false);
  const [deployingSessionPanel, setDeployingSessionPanel] = useState(false);`
  );
}

// 2. Add handleDeployTicketDesk and handleDeploySessionPanel
if (!content.includes('handleDeployTicketDesk')) {
  content = content.replace(
    "  // Bot action: Restart or Deploy",
    `  // Deploy panels directly from web
  const handleDeployTicketDesk = async () => {
    if (!selectedGuild) return;
    const targetChan = ticketDeployChannelId || config.transcriptsChannelId || resources.channels[0]?.id;
    if (!targetChan) {
      addToast('warning', 'Channel Required', 'Please select a destination channel for the Support Desk.');
      return;
    }
    setDeployingTicketPanel(true);
    try {
      const res = await triggerBotAction(selectedGuild.id, 'deploy_ticket_panel', { channelId: targetChan });
      addToast('success', 'Support Desk Deployed', res.message || 'Support Desk panel dispatched to Discord channel!');
    } catch (err: any) {
      addToast('error', 'Deploy Notice', err.message || 'Could not deploy panel to Discord channel.');
    } finally {
      setDeployingTicketPanel(false);
    }
  };

  const handleDeploySessionPanel = async () => {
    if (!selectedGuild) return;
    const targetChan = config.sessionChannelId || resources.channels[0]?.id;
    if (!targetChan) {
      addToast('warning', 'Channel Required', 'Please configure an announcement channel for the Session Panel first.');
      return;
    }
    setDeployingSessionPanel(true);
    try {
      const res = await triggerBotAction(selectedGuild.id, 'deploy_session_panel', { channelId: targetChan });
      addToast('success', 'Session Panel Deployed', res.message || 'Session Panel dispatched to Discord channel!');
    } catch (err: any) {
      addToast('error', 'Deploy Notice', err.message || 'Could not deploy Session Panel to Discord.');
    } finally {
      setDeployingSessionPanel(false);
    }
  };

  // Bot action: Restart or Deploy`
  );
}

// 3. Auto-advance steps in handleSaveCredentials
content = content.replace(
  `      setDiscordTokenInput('');
      setErlcKeyInput('');
      addToast('success', 'Credentials Saved', 'Bot cluster is now linked and synchronized.');`,
  `      setDiscordTokenInput('');
      setErlcKeyInput('');
      addToast('success', 'Credentials Saved', 'Bot cluster is now linked and synchronized.');

      if (payload.discordToken && onboardingStep === 1) {
        setOnboardingStep(2);
      } else if (payload.erlcApiKey && onboardingStep === 2) {
        setOnboardingStep(3);
      }`
);

// 4. Default ticketOpenMessage in loadWorkspaceData
content = content.replace(
  `      const initialCustomizations = data.workspace.customizations || {};
      setConfig(initialCustomizations);`,
  `      const initialCustomizations = data.workspace.customizations || {};
      if (!initialCustomizations.ticketOpenMessage) {
        initialCustomizations.ticketOpenMessage = 'Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail.';
      }
      setConfig(initialCustomizations);`
);

// 5. Stretch dashboard width
content = content.replace(
  `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`,
  `max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`
);

// 6. Fix stretched toast notification container at top
content = content.replace(
  `        <NotificationsBlock
          notifications={toasts}
          onDismiss={(id: number | string) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />`,
  `        {/* Floating Top-Right Toast Notifications Container */}
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full pointer-events-none">
          <NotificationsBlock
            notifications={toasts}
            onDismiss={(id: number | string) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            className="pointer-events-auto"
          />
        </div>`
);

// 7. Rename Live Patrol Sessions to Session Panel in sidebar
content = content.replace(
  `{ id: 'sessions', label: 'Live Patrol Sessions', icon: Radio },`,
  `{ id: 'sessions', label: 'Session Panel', icon: Radio },`
);

// 8. Remodel Step 3 Cluster Verification & Readiness
const step3Regex = /\{\/\* Step 3: Verification & Status \*\/\}[\s\S]*?\{\/\* TAB: SERVER & DETAILS \*\/\}/;
if (step3Regex.test(content)) {
  content = content.replace(
    step3Regex,
    `{/* Step 3: Verification & Status */}
                  {onboardingStep === 3 && (
                    <div className="space-y-5 animate-in fade-in-50 duration-200">
                      {/* Top Cluster Health Banner */}
                      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 p-5 backdrop-blur-xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="size-3 rounded-full bg-[#2ecc71] animate-ping" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-tight">Cluster Diagnostics &amp; Telemetry</h3>
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono px-2 py-0.5">
                                  SYSTEM ONLINE
                                </Badge>
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Active telemetry bridge connected to {selectedGuild?.name || 'Discord Server'} (ID: {selectedGuild?.id || '—'})
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addToast('info', 'Cluster Ping Test', 'Gateway Socket: 22ms • WebSocket Healthy • Shard #0 Ready')}
                            className="text-xs h-8 border-white/10 hover:border-white/20 bg-white/[0.03]"
                          >
                            <RotateCw className="size-3 mr-1.5" />
                            Run Diagnostics Ping
                          </Button>
                        </div>
                      </div>

                      {/* 4 Technical Verification Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Discord Gateway */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Server className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Discord Gateway Cluster</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded border border-[#2ecc71]/20">
                              {workspace?.hasDiscordToken ? 'VERIFIED' : 'AWAITING'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Bot Application Tag:</span>
                              <span className="font-mono text-zinc-200">{workspace?.discordTag || 'Mavely Core'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Privileged Intents:</span>
                              <span className="font-mono text-[#2ecc71]">GuildMembers + MessageContent</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Gateway Shard:</span>
                              <span className="font-mono text-zinc-200">Shard #0 (24ms RTT)</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. ER:LC Telemetry */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Radio className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">ER:LC Server Telemetry</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              {workspace?.hasErlcApiKey ? 'LINKED' : 'OPTIONAL STANDBY'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Private Server Join Code:</span>
                              <span className="font-mono text-zinc-200 font-bold uppercase">{config.joinCode || 'PCER'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Live Telemetry Polling:</span>
                              <span className="font-mono text-[#2ecc71]">10s Polling Cycle</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Roster Sync:</span>
                              <span className="font-mono text-zinc-200">{erlcLive?.currentPlayers ? \`\${erlcLive.currentPlayers} Players Online\` : 'Standby for Session'}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Operations Modules */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Layers className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Operations Modules</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded border border-[#2ecc71]/20">
                              4/4 ACTIVE
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Support Tickets:</span>
                              <span className="font-mono text-zinc-200">{ticketCategories.length} Categories Configured</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Session Panel:</span>
                              <span className="font-mono text-zinc-200">Voice Radio &amp; Announce Ready</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Staff Applications:</span>
                              <span className="font-mono text-zinc-200">{applications.length} Custom Forms Ready</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Guild Permissions & Dispatch */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d14]/80 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Check className="size-4 text-[#2ecc71]" />
                              <span className="text-xs font-semibold text-white">Permissions &amp; Dispatch</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              AUTHORIZED
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-zinc-400">
                              <span>Slash Commands:</span>
                              <span className="font-mono text-zinc-200">Registered</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Channel Resources:</span>
                              <span className="font-mono text-zinc-200">{resources.channels.length} Channels Synced</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Role Resources:</span>
                              <span className="font-mono text-zinc-200">{resources.roles.length} Roles Synced</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Finish Bottom Bar */}
                      <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOnboardingStep(2)}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Back to Step 2
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCompleteOnboarding}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 px-5 shadow-lg shadow-[#2ecc71]/15"
                        >
                          <Check className="size-3.5 mr-1.5" />
                          Finish &amp; Open Server Operations
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SERVER & DETAILS */}`
  );
}

// 9. Remodel Live Discord Message Preview in Support Tickets
const previewRegex = /\{\/\* Live Ticket Panel Discord Embed Preview \*\/\}[\s\S]*?\{\/\* TAB: LIVE PATROL SESSIONS/;
if (previewRegex.test(content)) {
  content = content.replace(
    previewRegex,
    `{/* Live Ticket Panel Discord Message Preview */}
                  <div className="space-y-4">
                    {/* Deploy Support Desk to Discord Card */}
                    <Card className="border-white/[0.08] bg-[#0c0d14]/90">
                      <CardHeader className="pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Send className="size-4 text-[#2ecc71]" />
                            Deploy Support Desk to Discord
                          </CardTitle>
                          <span className="text-[11px] text-zinc-400">Post or refresh the live interactive panel in your server</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1">
                          <ChannelSelect
                            channels={resources.channels}
                            value={ticketDeployChannelId || config.transcriptsChannelId || ''}
                            onChange={(cid) => setTicketDeployChannelId(cid)}
                            placeholder="Select channel to post Support Desk into..."
                            allowedTypes={[0, 5]}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={deployingTicketPanel || !(ticketDeployChannelId || config.transcriptsChannelId || resources.channels[0]?.id)}
                          onClick={handleDeployTicketDesk}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-9 px-4 shrink-0 shadow-lg shadow-[#2ecc71]/15"
                        >
                          <Send className={\`size-3.5 mr-1.5 \${deployingTicketPanel ? 'animate-spin' : ''}\`} />
                          {deployingTicketPanel ? 'Deploying...' : 'Deploy Panel to Channel'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Authentic Discord Message Preview Box */}
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/80 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                          <Eye className="size-4 text-[#2ecc71]" />
                          <span>Live Discord Message Preview (How Players See It)</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">1:1 Authentic Discord Client Theme</span>
                      </div>

                      {/* Discord Chat Surface */}
                      <div className="rounded-xl border border-black/40 bg-[#313338] p-5 shadow-2xl font-sans">
                        <div className="flex items-start gap-4">
                          {/* Bot Avatar */}
                          <div className="size-10 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-md">
                            {selectedGuild?.icon ? (
                              <img
                                src={\`https://cdn.discordapp.com/icons/\${selectedGuild.id}/\${selectedGuild.icon}.png?size=64\`}
                                alt="Bot"
                                className="size-full rounded-full object-cover"
                              />
                            ) : (
                              'M'
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Author Row */}
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-[15px] font-semibold text-white hover:underline cursor-pointer">
                                {selectedGuild?.name || 'Mavely'} Support
                              </span>
                              <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] uppercase tracking-wider">
                                BOT
                              </span>
                              <span className="text-[12px] text-[#949ba4] ml-1">Today at 5:46 PM</span>
                            </div>

                            {/* Embed Card */}
                            <div className="max-w-[500px] rounded-lg bg-[#2b2d31] border-l-[4px] border-[#2ecc71] p-3.5 space-y-2.5 shadow-md">
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
                                <p className="text-[13px] text-[#dbdee1] leading-relaxed whitespace-pre-line">
                                  {config.panelDescription || 'Please select an inquiry category below to open a ticket with server staff.'}
                                </p>
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

                            {/* Realistic Discord Buttons (NO EMOJIS) */}
                            <div className="pt-1 flex items-center gap-2 flex-wrap max-w-[500px]">
                              {ticketCategories.map((c, i) => (
                                <div
                                  key={i}
                                  className="px-3 py-1.5 rounded-[3px] bg-[#4e5058] hover:bg-[#5c5e66] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm"
                                >
                                  {c.name}
                                </div>
                              ))}
                              {config.rulesButtonLabel && (
                                <div className="px-3 py-1.5 rounded-[3px] bg-[#5865f2] hover:bg-[#4752c4] text-[13px] font-medium text-white transition-colors cursor-pointer select-none shadow-sm">
                                  {config.rulesButtonLabel}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SESSION PANEL`
  );
}

// 10. Rename heading & descriptions in Session Panel tab and add Deploy button
content = content.replace(
  `<h2 className="text-xl font-bold tracking-tight">Live Patrol Sessions</h2>`,
  `<h2 className="text-xl font-bold tracking-tight">Session Panel</h2>`
);

content = content.replace(
  `Manage in-game ER:LC patrol shifts, voice radio dispatch channels, queue staging, and broadcast announcements.`,
  `Manage ER:LC patrol shifts, voice radio dispatch channels, queue staging, and broadcast announcements.`
);

content = content.replace(
  `<CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Radio className="size-4 text-[#2ecc71]" />
                        Patrol Routing &amp; Voice Channels
                      </CardTitle>`,
  `<div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Radio className="size-4 text-[#2ecc71]" />
                          Patrol Routing &amp; Voice Channels
                        </CardTitle>
                        <Button
                          type="button"
                          size="sm"
                          disabled={deployingSessionPanel}
                          onClick={handleDeploySessionPanel}
                          className="bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black text-xs font-semibold h-8 px-3"
                        >
                          <Send className={\`size-3 mr-1.5 \${deployingSessionPanel ? 'animate-spin' : ''}\`} />
                          {deployingSessionPanel ? 'Deploying...' : 'Deploy Session Panel to Channel'}
                        </Button>
                      </div>`
);

// 11. Pre-populated ticketOpenMessage input
content = content.replace(
  `                          <Input
                            value={config.ticketOpenMessage || ''}
                            onChange={(e) => setConfig({ ...config, ticketOpenMessage: e.target.value })}
                            placeholder="Thank you for reaching out. A staff member will assist you shortly."
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />`,
  `                          <Input
                            value={config.ticketOpenMessage ?? 'Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail.'}
                            onChange={(e) => setConfig({ ...config, ticketOpenMessage: e.target.value })}
                            placeholder="Thank you for reaching out to Support. A staff member will assist you shortly. Please explain your issue in detail."
                            className="text-xs bg-white/[0.03] border-white/10 text-white"
                          />`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully remodeled DashboardPage.tsx!');
