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
  Layers,
  Database,
  FolderTree,
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { StaffHandbookHub } from '@/components/StaffHandbookHub';
import { Badge } from '@/components/ui/badge';
import FeaturesBlock from '@/components/ui/features-4';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketDeskStatus, setTicketDeskStatus] = useState<'online' | 'busy' | 'closed'>('online');
  const [ticketSearch, setTicketSearch] = useState('');

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

            {/* TAB: Support Tickets (Redesigned Website Version) */}
            {activeTab === 'tickets' && (
              <div className="space-y-10 animate-in fade-in-50 duration-200">
                {/* Header & Badges */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold tracking-wider text-emerald-400 uppercase">
                      Mavely Engine
                    </span>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]">
                      discord.js v14 ESM
                    </Badge>
                    <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-zinc-300 text-[10px]">
                      Live Panel Sync
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px]">
                      HTML Transcripts
                    </Badge>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Discord Ticket System
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    A production-ready, modern Discord Ticket System built with <strong className="text-white">discord.js v14</strong> (ESM), local JSON file persistence, live auto-updating panels, interactive modals, responsive control panels, and standalone styled HTML transcripts with retroactive reason editing.
                  </p>
                </div>

                {/* Interactive Operational Desk Simulator & Live Preview */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/95 p-6 sm:p-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        <Activity className="size-4 text-emerald-400" />
                        <span>Live Operational Desk Simulator</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Test how the operational desk status synchronizes across all active Discord panels in real time.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setTicketDeskStatus('online')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          ticketDeskStatus === 'online'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTicketDeskStatus('busy')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          ticketDeskStatus === 'busy'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="size-2 rounded-full bg-amber-400" />
                        <span>Busy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTicketDeskStatus('closed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          ticketDeskStatus === 'closed'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="size-2 rounded-full bg-rose-400" />
                        <span>Closed</span>
                      </button>
                    </div>
                  </div>

                  {/* Simulated Discord Embed Preview */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>PREVIEW • #support-tickets</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <RefreshCw className="size-3 text-emerald-400 animate-spin" /> Auto-Synced Live
                      </span>
                    </div>

                    <div className="rounded-lg border-l-4 border-emerald-500 bg-[#16181e] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Mavely Support Desk</span>
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ticketDeskStatus === 'online'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticketDeskStatus === 'busy'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          Desk {ticketDeskStatus}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Need assistance from the management team or community staff? Select a topic from the menu below to open a private ticket.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/5 space-y-1">
                          <span className="text-[11px] font-semibold text-white block">📁 General Support</span>
                          <span className="text-[10px] text-zinc-400">ID: 1548331057911173140</span>
                        </div>
                        <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/5 space-y-1">
                          <span className="text-[11px] font-semibold text-white block">🛡️ Management Support</span>
                          <span className="text-[10px] text-zinc-400">ID: 1548330987128229989</span>
                        </div>
                        <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/5 space-y-1">
                          <span className="text-[11px] font-semibold text-white block">🤝 Partnerships &amp; Affiliates</span>
                          <span className="text-[10px] text-zinc-400">ID: 1550260772230139954</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="w-full h-9 rounded-md bg-[#2b2d31] border border-white/10 px-3 flex items-center justify-between text-xs text-zinc-300">
                          <span>Select a category to open a ticket...</span>
                          <ChevronRight className="size-4 text-zinc-500 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🚀 Quick Setup & Installation */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Zap className="size-4 text-amber-400" />
                      <span>Quick Setup &amp; Installation</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Follow these 5 streamlined steps to get your ticket system up and running in minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Step 1 */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs">
                          1
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Install Dependencies</h4>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Open PowerShell or your terminal in the project directory and install the required discord.js and Node modules:
                      </p>
                      <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0d0e11] px-4 py-2.5 font-mono text-xs text-zinc-300">
                        <code>npm install</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('npm install')}
                          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy command"
                        >
                          {copiedCmd === 'npm install' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs">
                          2
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configure Environment Variables (.env)</h4>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Create or open <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">.env</code> and fill in your Discord credentials. Adding your <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">GUILD_ID</code> ensures instant slash command registration:
                      </p>
                      <div className="relative rounded-lg border border-white/[0.08] bg-[#0d0e11] p-3.5 font-mono text-xs text-zinc-300 space-y-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard('DISCORD_TOKEN=your_bot_token_here\nCLIENT_ID=your_bot_client_id_here\nGUILD_ID=your_discord_server_id_here')}
                          className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy .env template"
                        >
                          {copiedCmd?.includes('DISCORD_TOKEN') ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                        </button>
                        <div className="text-zinc-500"># Discord Bot Credentials</div>
                        <div><span className="text-emerald-400">DISCORD_TOKEN</span>=your_bot_token_here</div>
                        <div><span className="text-emerald-400">CLIENT_ID</span>=your_bot_client_id_here</div>
                        <div><span className="text-emerald-400">GUILD_ID</span>=your_discord_server_id_here <span className="text-zinc-500"># Instant slash commands</span></div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs">
                          3
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Customize Config (config.js)</h4>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Open <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">config.js</code> to adjust your banner, transcript channel, staff roles, and pre-configured categories:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400" /> BANNER_URL
                          </span>
                          <span className="text-[11px] text-zinc-400 block">Pre-configured to your custom LIBERTX banner.</span>
                        </div>
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400" /> TRANSCRIPTS_CHANNEL_ID
                          </span>
                          <span className="text-[11px] text-zinc-400 block">Channel ID where HTML transcripts and logs are dispatched.</span>
                        </div>
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400" /> STAFF_ROLE_IDS
                          </span>
                          <span className="text-[11px] text-zinc-400 block">Array of Role IDs permitted to view, claim, and close tickets.</span>
                        </div>
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400" /> CATEGORIES
                          </span>
                          <span className="text-[11px] text-zinc-400 block">General Support, Management Support, Partnerships &amp; Affiliates.</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 & 5 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs">
                            4
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Deploy Slash Commands</h4>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Register all slash commands with Discord:
                        </p>
                        <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0d0e11] px-4 py-2 font-mono text-xs text-zinc-300">
                          <code>npm run deploy</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('npm run deploy')}
                            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy command"
                          >
                            {copiedCmd === 'npm run deploy' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs">
                            5
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Start the Bot</h4>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Launch the live bot engine:
                        </p>
                        <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0d0e11] px-4 py-2 font-mono text-xs text-zinc-300">
                          <code>npm start</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('npm start')}
                            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy command"
                          >
                            {copiedCmd === 'npm start' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🛠️ Slash Commands Reference Table */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                        <Terminal className="size-4 text-cyan-400" />
                        <span>Slash Commands Reference</span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Full command directory for ticket creation, claim assignment, live status, and member access.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-zinc-500" />
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Filter commands..."
                        className="h-8 w-48 sm:w-56 rounded-lg border border-white/[0.08] bg-[#0d0e11] pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-mono text-[11px]">
                            <th className="py-3 px-4 font-semibold">Command</th>
                            <th className="py-3 px-4 font-semibold">Description</th>
                            <th className="py-3 px-4 font-semibold">Permission</th>
                            <th className="py-3 px-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {[
                            { cmd: '/ticket panel [channel]', desc: 'Sends the main ticket panel to a channel and registers it for live auto-updating.', perm: 'Staff / Admin' },
                            { cmd: '/ticket status <online|busy|closed>', desc: 'Changes live operational desk status and refreshes all active panels in real-time.', perm: 'Staff / Admin' },
                            { cmd: '/ticket category <category> <enable|disable>', desc: 'Toggles individual categories on/off and updates all live panels in real-time.', perm: 'Staff / Admin' },
                            { cmd: '/ticket close [reason]', desc: 'Initiates ticket archive, generates HTML transcript, DMs author, and logs to transcripts channel.', perm: 'Staff / Author' },
                            { cmd: '/ticket claim', desc: 'Assigns the ticket to you and updates the ticket control panel.', perm: 'Staff' },
                            { cmd: '/ticket unclaim', desc: 'Releases the ticket back to the staff queue.', perm: 'Staff' },
                            { cmd: '/ticket add <user>', desc: 'Grants a user access to the ticket channel.', perm: 'Staff' },
                            { cmd: '/ticket remove <user>', desc: "Revokes a user's access to the ticket channel.", perm: 'Staff' },
                            { cmd: '/ticket rename <name>', desc: 'Renames the ticket channel.', perm: 'Staff' }
                          ]
                            .filter(item => ticketSearch === '' || item.cmd.toLowerCase().includes(ticketSearch.toLowerCase()) || item.desc.toLowerCase().includes(ticketSearch.toLowerCase()))
                            .map((row) => (
                              <tr key={row.cmd} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                                  {row.cmd}
                                </td>
                                <td className="py-3 px-4 text-zinc-300">
                                  {row.desc}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    row.perm.includes('Admin')
                                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                      : row.perm.includes('Author')
                                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                      : 'bg-zinc-800 text-zinc-300 border border-white/10'
                                  }`}>
                                    {row.perm}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(row.cmd.split(' ')[0] + ' ' + (row.cmd.split(' ')[1] || ''))}
                                    className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                    title="Copy command base"
                                  >
                                    {copiedCmd === row.cmd.split(' ')[0] + ' ' + (row.cmd.split(' ')[1] || '') ? (
                                      <Check className="size-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="size-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 📂 Architecture & Persistence */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Database className="size-4 text-purple-400" />
                      <span>Architecture &amp; Local Persistence</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Data is stored locally under the <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">data/</code> directory with atomic writes so nothing breaks across bot restarts:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono">
                        <FolderTree className="size-4 text-emerald-400" />
                        <span>data/tickets.json</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Stores active tickets metadata, participant IDs, channel associations, and historical archive records for retroactive reason edits.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono">
                        <FolderTree className="size-4 text-amber-400" />
                        <span>data/ticket_desk.json</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Tracks current desk status (<code className="text-emerald-400">online</code>, <code className="text-amber-400">busy</code>, <code className="text-rose-400">closed</code>) and the list of currently disabled categories.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono">
                        <FolderTree className="size-4 text-cyan-400" />
                        <span>data/ticket_panels.json</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        List of all posted panel messages (<code className="text-zinc-300">channelId</code>, <code className="text-zinc-300">messageId</code>) for real-time live synchronization whenever status or categories change.
                      </p>
                    </div>
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
