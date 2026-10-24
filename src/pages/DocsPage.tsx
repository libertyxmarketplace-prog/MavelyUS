import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Activity,
  Shield,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  LayoutDashboard
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const navSections = [
    {
      title: 'Getting Started',
      items: [
        { id: 'getting-started', label: 'Overview', icon: BookOpen },
        { id: 'erlc-api-setup', label: 'Connecting ER:LC API', icon: Activity },
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
                placeholder="Search the docs..."
                className="h-8 w-60 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none transition-all"
              />
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <span>Back to Home</span>
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
                      Getting Started
                    </span>
                    <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-zinc-300 text-[10px]">
                      Web Dashboard
                    </Badge>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Overview
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Mavely is a web dashboard for Emergency Response: Liberty County communities. Sign in with Discord, pick a server you manage, and keep its details, directory listing and ER:LC server link in one place.
                  </p>
                </div>

                {/* Key Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <LayoutDashboard className="size-4 text-purple-400" />
                      <span>One Dashboard Per Server</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Every Discord server you can manage shows up after you sign in. Settings are saved per server.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-5 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Layers className="size-4 text-cyan-400" />
                      <span>Directory &amp; Growth</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      List your community in the public directory, bump it, and track growth from the dashboard.
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
                        <h4 className="font-semibold text-white">Choose Your Server</h4>
                        <p className="text-zinc-400 mt-0.5">
                          Pick a server where you have Manage Server permission and fill in its details.
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
                    Link your private Roblox server to your dashboard to display real-time player counts, queue status, active join codes, and on-duty police rosters.
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
          </main>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;
