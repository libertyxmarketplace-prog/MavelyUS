import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Ticket,
  Radio,
  Users,
  Activity,
  FileText,
  Shield,
  Terminal,
  Search,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Bot,
  Layers
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { StaffHandbookHub } from '@/components/StaffHandbookHub';
import { Badge } from '@/components/ui/badge';
import FeaturesBlock from '@/components/ui/features-4';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const navSections = [
    {
      title: 'Getting Started',
      items: [
        { id: 'getting-started', label: 'Overview & Architecture', icon: BookOpen },
        { id: 'capabilities', label: 'Core Bot Systems', icon: Layers },
        { id: 'discord-auth', label: 'Discord Permissions', icon: Shield },
        { id: 'erlc-api-setup', label: 'Connecting ER:LC API', icon: Activity },
      ]
    },
    {
      title: 'Core Systems',
      items: [
        { id: 'tickets', label: 'Support Tickets', icon: Ticket },
        { id: 'sessions', label: 'Patrol Shifts & Radios', icon: Radio },
        { id: 'applications', label: 'Staff Applications', icon: Users },
        { id: 'handbook', label: 'Staff Documentation', icon: FileText },
        { id: 'customer-bots', label: 'Whitelabel Custom Bots', icon: Bot },
      ]
    },
    {
      title: 'Commands',
      items: [
        { id: 'slash-commands', label: 'Command Directory', icon: Terminal },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-white flex font-sans selection:bg-brand/30 selection:text-white relative overflow-hidden">
      {/* Subtle soft ambient glow lighting */}
      <div className="pointer-events-none absolute top-12 right-1/4 w-[520px] h-[340px] bg-emerald-500/[0.03] rounded-full blur-[110px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-[500px] h-[380px] bg-cyan-500/[0.025] rounded-full blur-[120px]" />

      {/* Far-Left Dock Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 pl-14 sm:pl-16 flex flex-col min-w-0 relative z-10">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 h-14 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="size-3 text-zinc-600" />
            <span className="text-xs font-semibold text-white">Documentation</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search systems, commands..."
                className="h-8 w-60 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none transition-all"
              />
            </div>
            <a
              href="https://discord.gg/UCqXrvHFqh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <span>Discord Support</span>
              <ExternalLink className="size-3 text-zinc-500" />
            </a>
          </div>
        </header>

        {/* Docs Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto flex">
          {/* Docs Sidebar Navigation - Clean Neutral Hover (No bright green) */}
          <aside className="w-64 border-r border-white/[0.06] p-6 hidden md:block shrink-0">
            <nav className="space-y-6">
              {navSections.map((sec, i) => (
                <div key={i} className="space-y-2">
                  <h5 className="text-[11px] font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase">
                    {sec.title}
                  </h5>
                  <ul className="space-y-1">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left outline-none ${
                              active
                                ? 'bg-white/[0.08] text-white font-semibold border border-white/10 shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <Icon className={`size-4 ${active ? 'text-white' : 'text-zinc-500'}`} />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Docs Content Area */}
          <main className="flex-1 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-10">
            {/* TAB: Getting Started */}
            {activeTab === 'getting-started' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                      Architecture &amp; Setup
                    </span>
                    <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-zinc-300 text-[10px]">
                      Whitelabel Bot Runtime
                    </Badge>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Overview &amp; Custom Bot Engine
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Mavely is not just another generic public bot. Instead, it allows Emergency Response: Liberty County server owners to run their <strong className="text-white">own custom bot application</strong> with custom avatar, custom branding, and custom name — while running on Mavely&apos;s battle-tested infrastructure.
                  </p>
                </div>

                {/* Key Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Bot className="size-4 text-purple-400" />
                      <span>Your Community&apos;s Identity</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Supply your own Discord bot token from the Developer Portal. Your members interact directly with your server&apos;s name and avatar.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Layers className="size-4 text-cyan-400" />
                      <span>Preloaded Operations Suite</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Support tickets, patrol session embeds, staff quizzes, LOA management, and live PRC radar come ready out of the box.
                    </p>
                  </div>
                </div>

                {/* 3-Step Setup */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white font-display">Quick Start Workflow</h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-start gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/[0.06] text-white font-bold font-mono text-[11px] shrink-0">
                        1
                      </span>
                      <div>
                        <h4 className="font-semibold text-white">Log in with Discord</h4>
                        <p className="text-zinc-400 mt-0.5">
                          Authenticate via Discord OAuth to automatically discover your managed servers and active roles.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/[0.06] text-white font-bold font-mono text-[11px] shrink-0">
                        2
                      </span>
                      <div>
                        <h4 className="font-semibold text-white">Configure Your Bot Token or Use Managed Bot</h4>
                        <p className="text-zinc-400 mt-0.5">
                          In the dashboard credentials tab, paste your community&apos;s bot token to bring your personal bot online instantly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/[0.06] text-white font-bold font-mono text-[11px] shrink-0">
                        3
                      </span>
                      <div>
                        <h4 className="font-semibold text-white">Connect ER:LC Server Key</h4>
                        <p className="text-zinc-400 mt-0.5">
                          Paste your private server API key to activate live player rosters, shift radar, and automated player tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Command Bar */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-white">Primary Configuration Command</span>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0d0e11] px-4 py-3 font-mono text-xs text-zinc-300">
                    <span className="text-white font-bold">/config</span>
                    <button
                      onClick={() => copyToClipboard('/config')}
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd === '/config' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Core Bot Systems (FeaturesBlock) */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <FeaturesBlock
                  eyebrow="Core Architecture"
                  title="All 10 Bot Systems"
                  description="Detailed specifications for each modular subsystem running on the Mavely engine."
                  className="px-0 py-2"
                />
              </div>
            )}

            {/* TAB: Discord Permissions */}
            {activeTab === 'discord-auth' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Security &amp; Gateway
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Discord Bot Permissions
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Ensure your custom bot possesses the necessary privileged gateway intents and permissions to create ticket rooms, strip roles during leave, and sync voice channels.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white font-display">Required Privileged Gateway Intents</h3>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Server Members Intent:</strong> Required to sync staff roles, grant applicant pass roles, and track on-duty moderators.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Message Content Intent:</strong> Required to compile ticket transcripts and log weekly message quota activity.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white font-display">Bot Role Hierarchy Rule</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Discord enforces strict role hierarchy. Your bot&apos;s role must be positioned <strong className="text-white">above</strong> the staff and member roles it manages (e.g., above Moderator, Trainee, Officer) in Server Settings &gt; Roles.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: ER:LC API Key */}
            {activeTab === 'erlc-api-setup' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    In-Game Telemetry
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Connecting ER:LC API Key
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Link your private Roblox server directly to your custom bot to display real-time player counts, queue status, active join codes, and on-duty police rosters.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white font-display">How to Extract Your Server Key</h3>
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-zinc-300">
                    <li>Launch <strong className="text-white">Emergency Response: Liberty County</strong> on Roblox.</li>
                    <li>Enter your Private Server and open the <strong className="text-white">Server Settings</strong> menu (Server Owner or Co-Owner).</li>
                    <li>Navigate to the <strong className="text-white">API / Developer</strong> tab.</li>
                    <li>Generate your Server Key and copy it to your clipboard.</li>
                    <li>Paste it into your Mavely Dashboard under <strong className="text-white">Server Telemetry</strong> and click Save.</li>
                  </ol>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Shield className="size-3.5" />
                    <span>Security Notice</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Never share your private server key in public channels. Your key is securely encrypted at rest and only used to query the official Police Roleplay Community (PRC) API.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: Support Tickets */}
            {activeTab === 'tickets' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Operations Module
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Support Ticket System
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Deploy interactive dropdowns and multi-category panels with automatic claim locks, category spawn routing, and full HTML transcripts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-4 space-y-2">
                    <h4 className="font-semibold text-white">5 Customizable Categories</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      General Support, Player Reports, Staff Reports, Department Transfers, and Custom Partnerships.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-4 space-y-2">
                    <h4 className="font-semibold text-white">HTML Transcript Engine</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Automatically archives message history, image attachments, and timestamps to the configured transcript channel.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-white">Deploy Ticket Panel Command</span>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0d0e11] px-4 py-3 font-mono text-xs text-zinc-300">
                    <span className="text-white font-bold">/ticket panel</span>
                    <button
                      onClick={() => copyToClipboard('/ticket panel')}
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd === '/ticket panel' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Patrol Shifts */}
            {activeTab === 'sessions' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Roleplay Operations
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Patrol Sessions &amp; Voice Radios
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Automate server shifts with startup and shutdown embeds, schedule roleplay votes, and sync in-game radio frequencies with voice channels.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-3 text-xs text-zinc-300">
                  <h4 className="font-semibold text-white">Shift Automation Workflow</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                    <li>Hosts execute <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-mono">/session startup</code> with join code and host ping.</li>
                    <li>Mavely opens the designated Tactical Radio VC and pings on-duty emergency responders.</li>
                    <li>Session shutdown logs the session duration, peak player count, and host stats.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: Staff Applications */}
            {activeTab === 'applications' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Recruitment Suite
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Staff Applications &amp; Scenarios
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Build interactive in-game scenario quizzes and Discord application reviews with automated pass/fail role assignments.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-3 text-xs text-zinc-300">
                  <h4 className="font-semibold text-white">Application Pipeline</h4>
                  <p className="text-zinc-400 leading-relaxed">
                    Applicants open a private quiz channel, answer scenario questions with timer locks, and submissions are forwarded to your staff review channel with instant <span className="text-emerald-400 font-semibold">Accept</span> and <span className="text-rose-400 font-semibold">Deny</span> buttons.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: Staff Handbook */}
            {activeTab === 'handbook' && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <StaffHandbookHub />
              </div>
            )}

            {/* TAB: Whitelabel Custom Bots */}
            {activeTab === 'customer-bots' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Whitelabel Engine
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Multi-Tenant Custom Bot Setup
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Deploy your community&apos;s own custom bot token. Your members will see your custom bot in your member list, with all Mavely commands and tickets running through it.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 space-y-4 text-xs text-zinc-300">
                  <h4 className="font-semibold text-white">Step-by-Step Custom Bot Deployment</h4>
                  <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                    <li>Visit the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-white underline underline-offset-2">Discord Developer Portal</a>.</li>
                    <li>Click <strong className="text-white">New Application</strong> and give your bot your community&apos;s name and logo.</li>
                    <li>Navigate to the <strong className="text-white">Bot</strong> tab and click <strong className="text-white">Reset Token</strong>.</li>
                    <li>Enable <strong className="text-white">Server Members Intent</strong> and <strong className="text-white">Message Content Intent</strong>.</li>
                    <li>Open Mavely Dashboard &gt; <strong className="text-white">Credentials</strong> &gt; Paste your bot token.</li>
                    <li>Your custom bot will come online within seconds and deploy all commands!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB: Slash Commands */}
            {activeTab === 'slash-commands' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                    Command Reference
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Slash Command Directory
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    All slash commands registered by Mavely and customer bots. Click any command to copy it.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { cmd: '/config', desc: 'Opens the interactive 8-page server configuration panel.' },
                    { cmd: '/ticket panel', desc: 'Deploys the interactive 5-category support ticket creation panel.' },
                    { cmd: '/session startup', desc: 'Broadcasts server patrol shift embeds with join keys and timestamps.' },
                    { cmd: '/session shutdown', desc: 'Closes active patrol session and records attendance.' },
                    { cmd: '/prc status', desc: 'Fetches real-time server player roster and queue telemetry from ER:LC.' },
                    { cmd: '/handbook deploy', desc: 'Deploys the interactive staff conduct and 10-codes directory to Discord.' },
                    { cmd: '/infraction add', desc: 'Logs a staff or member disciplinary action with strike tiers.' },
                    { cmd: '/loa request', desc: 'Submits a Leave of Absence request and temporarily suspends duty roles.' },
                    { cmd: '/giveaway start', desc: 'Initiates a role-weighted community prize giveaway.' },
                  ].map((c) => (
                    <div
                      key={c.cmd}
                      onClick={() => copyToClipboard(c.cmd)}
                      className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-3.5 flex items-center justify-between cursor-pointer hover:border-white/20 hover:bg-[#121316] transition-all group select-none"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-white text-xs flex items-center gap-2">
                          <span>{c.cmd}</span>
                          <span className="text-[10px] text-zinc-500 font-sans font-normal">slash command</span>
                        </div>
                        <div className="text-zinc-400 text-[11px]">{c.desc}</div>
                      </div>

                      <div className="text-zinc-500 group-hover:text-white transition-colors">
                        {copiedCmd === c.cmd ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;
