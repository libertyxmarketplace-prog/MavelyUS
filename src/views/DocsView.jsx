import React, { useState } from 'react';
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
  Layers,
  Sparkles,
  ArrowRight,
  Code
} from 'lucide-react';

export function DocsView({ onBackHome, onEnterDashboard }) {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const navSections = [
    {
      title: 'Getting Started',
      items: [
        { id: 'getting-started', label: 'Overview & Architecture', icon: BookOpen },
        { id: 'discord-auth', label: 'Discord Bot & OAuth2', icon: Shield },
        { id: 'erlc-api-setup', label: 'Connecting ER:LC API Key', icon: Activity },
      ]
    },
    {
      title: 'Core Systems',
      items: [
        { id: 'tickets', label: 'Support Ticket Panels', icon: Ticket },
        { id: 'sessions', label: 'Patrol Shifts & Radios', icon: Radio },
        { id: 'applications', label: 'Staff Applications', icon: Users },
        { id: 'customer-bots', label: 'Custom Bot Branding', icon: Bot },
      ]
    },
    {
      title: 'Commands',
      items: [
        { id: 'slash-commands', label: 'Command Directory', icon: Terminal },
      ]
    }
  ];

  const commandsList = [
    { cmd: '/ticket panel deploy', desc: 'Deploy high-fidelity interactive ticket selection panel to configured channel' },
    { cmd: '/ticket close [reason]', desc: 'Archive active support ticket with HTML transcript generation' },
    { cmd: '/session start [role]', desc: 'Open an official server patrol session with dynamic voice radio bridge' },
    { cmd: '/session end', desc: 'Conclude patrol session and calculate individual staff shift logs' },
    { cmd: '/apply open [dept]', desc: 'Launch department application dispatch menu with anti-AI screening' },
    { cmd: '/erlc status', desc: 'Query live player count, queue telemetry, and server join code directly from PRC API' },
    { cmd: '/erlc command [string]', desc: 'Execute in-game console command (/m, /h, /kick, /ban) directly from Discord' },
    { cmd: '/bot restart', desc: 'Trigger hot cloud restart of your community dedicated bot runner' },
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackHome}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </button>
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
              placeholder="Search guides, commands..."
              className="h-8 w-60 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={onEnterDashboard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black font-semibold px-3 py-1.5 text-xs hover:bg-zinc-200 transition-all"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      </header>

      {/* Docs Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
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
                              ? 'bg-white/[0.08] text-white'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon className="size-4 shrink-0 text-zinc-400" />
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-3xl space-y-8">
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Overview & Architecture
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  How CivLink Works
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  CivLink is an all-in-one operations platform built specifically for Roblox Emergency Response: Liberty County (ER:LC) roleplay communities. Unlike shared public bots, CivLink runs your own dedicated bot identity directly linked to your server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Bot className="size-4 text-emerald-400" />
                    <span>Dedicated Bot Runner</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Runs your Discord bot token in an isolated cloud runtime with zero downtime and automatic gateway reconnection.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Activity className="size-4 text-sky-400" />
                    <span>Real-Time PRC API Telemetry</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Polls server players, queue counts, in-game command logs, and killfeeds every 30 seconds straight into your Discord staff audit logs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discord-auth' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Discord Setup
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Discord Bot & OAuth2 Integration
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Connect your bot token and OAuth2 application to allow server staff to log in and manage tickets, shifts, and bot commands.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Required Bot Gateway Intents</h3>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Guilds (`GatewayIntentBits.Guilds`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Guild Messages (`GatewayIntentBits.GuildMessages`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Message Content Intent (Enabled in Discord Developer Portal)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'erlc-api-setup' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Roblox Integration
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Connecting ER:LC Server API Key
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Obtain your Private Server Server-Key from the ER:LC in-game server settings (PRC API). Once added, your bot can execute in-game moderation and track queue telemetry.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-zinc-300 space-y-2">
                <div className="font-semibold text-white">How to locate your key:</div>
                <p>1. Join your ER:LC private server in Roblox.</p>
                <p>2. Open Private Server Settings from the main menu.</p>
                <p>3. Copy the Server-Key string and paste it into CivLink Dashboard &gt; Settings.</p>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Ticket Desk
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Support Ticket Panels
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Create high-fidelity embed panels with category dropdowns and action buttons for General Support, Internal Affairs, High Rank Support, and Partnership requests.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Shift Logging
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Patrol Shifts & Radio Operations
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Automatically track when staff members go on-duty, calculate shift durations, and audit radio channels for Law Enforcement, Fire & Rescue, and Dispatch.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Recruiting
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Staff Applications & Anti-AI Blacklist
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Deploy interactive application menus straight to user DMs. Applications include built-in AI detection notices and automated role assignment upon approval.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'customer-bots' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Whitelabel
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Whitelabel Custom Branding
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Upload your community banner, avatar, custom status, and bot name. Your players only see your community brand.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'slash-commands' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                  Command Directory
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">
                  Available Slash Commands
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                  Commands built directly into your bot instance. Click any command to copy it.
                </p>
              </div>

              <div className="space-y-3">
                {commandsList.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => copyToClipboard(c.cmd)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-2">
                        <span>{c.cmd}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{c.desc}</div>
                    </div>
                    <button className="text-zinc-500 group-hover:text-white transition-colors">
                      {copiedCmd === c.cmd ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DocsView;
