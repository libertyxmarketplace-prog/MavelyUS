import React, { useState } from 'react';
import {
  Shield,
  BookOpen,
  Search,
  Radio,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Send,
  Sparkles,
  BookmarkCheck,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PolicyRule {
  id: string;
  code: string;
  title: string;
  severity: 'critical' | 'mandatory' | 'guideline';
  summary: string;
  allowed: string[];
  prohibited: string[];
  penalty: string;
}

interface HandbookCategory {
  id: string;
  name: string;
  shortDesc: string;
  icon: React.ElementType;
  badge: string;
  accent: string;
  rules: PolicyRule[];
}

const HANDBOOK_DATA: HandbookCategory[] = [
  {
    id: 'conduct',
    name: 'Code of Conduct',
    shortDesc: 'Professionalism, maturity, and impartial moderation standards.',
    icon: Shield,
    badge: 'Core Policy',
    accent: '#2ecc71',
    rules: [
      {
        id: 'rule-101',
        code: 'SEC-101',
        title: 'Maturity & Impartial Conflict Resolution',
        severity: 'critical',
        summary: 'Staff members must remain neutral in disputes and never show favoritism toward faction members or friends.',
        allowed: [
          'De-escalating heated arguments calmly using ticket channels.',
          'Requesting a secondary supervisor review if personally involved in a situation.'
        ],
        prohibited: [
          'Engaging in flame wars or insulting members in public Discord or in-game channels.',
          'Using administrator permissions to overturn punishments of personal associates.'
        ],
        penalty: 'Strike 2 penalty + 14-day supervisor suspension.'
      },
      {
        id: 'rule-102',
        code: 'SEC-102',
        title: 'Confidentiality & Staff Channel Privacy',
        severity: 'critical',
        summary: 'Under no circumstances may staff internal logs, blacklist entries, or private discussions be leaked outside authorized channels.',
        allowed: [
          'Sharing approved summary notices in official announcements channels.',
          'Exporting encrypted ticket transcripts for administrative appeals.'
        ],
        prohibited: [
          'Screenshots of staff-only chat, moderator voice channels, or strike registries.',
          'Alerting flagged players before a sting or sting patrol session.'
        ],
        penalty: 'Immediate termination + permanent staff blacklist.'
      }
    ]
  },
  {
    id: 'pursuits',
    name: 'Pursuits & Vehicle Interventions',
    shortDesc: 'Authorized PIT maneuvers, spike deployment speeds, and lethal force thresholds.',
    icon: Car,
    badge: 'In-Game Law',
    accent: '#e74c3c',
    rules: [
      {
        id: 'rule-201',
        code: 'TAC-201',
        title: 'Precision Immobilization Technique (PIT) Protocol',
        severity: 'mandatory',
        summary: 'PIT maneuvers may only be executed after primary supervisor approval and when road conditions permit safe tactical contact.',
        allowed: [
          'PIT maneuvers under 45 MPH on wide multi-lane highways.',
          'Rolling roadblocks with 2+ marked units.'
        ],
        prohibited: [
          'PIT maneuvers inside congested civilian city centers or residential neighborhoods.',
          'Ramming vehicles at excessive speed (>60 MPH) or off cliffs/bridges.'
        ],
        penalty: 'Department verbal counseling + in-game pursuit driving suspension.'
      },
      {
        id: 'rule-202',
        code: 'TAC-202',
        title: 'Tire Deflation Devices (Spike Strips)',
        severity: 'guideline',
        summary: 'Deploy spikes ahead of suspect vehicle vector with adequate clearance for trailing patrol cruisers.',
        allowed: [
          'Pre-positioning spike strips at highway bottlenecks or bridge choke points.',
          'Broadcasting 10-33 radio clearance before deployment.'
        ],
        prohibited: [
          'Spiking motorcycles or ATVs (violates ER:LC lethal force rules).',
          'Deploying spikes within 50 feet of civilian fuel pumps or intersections.'
        ],
        penalty: 'Formal reprimand on moderator profile.'
      }
    ]
  },
  {
    id: 'radiocodes',
    name: '10-Codes & Radio Transmission',
    shortDesc: 'Standard PRC dispatch codes, emergency priority traffic, and mic etiquette.',
    icon: Radio,
    badge: 'Comms Spec',
    accent: '#3498db',
    rules: [
      {
        id: 'rule-301',
        code: 'COM-301',
        title: 'Priority Traffic Clearances (10-33)',
        severity: 'critical',
        summary: '10-33 signifies emergency in progress; all routine transmissions must cease immediately until 10-99 code-4 is announced.',
        allowed: [
          'Calling 10-33 during active firearm discharge, officer down, or major robbery.',
          'Monitoring dispatch tone while remaining silent on the voice channel.'
        ],
        prohibited: [
          'Mic-spamming, soundboards, or routine status updates during 10-33 emergencies.',
          'Disregarding dispatcher instructions to hold open frequency.'
        ],
        penalty: 'Temporary radio server mute + strike 1.'
      },
      {
        id: 'rule-302',
        code: 'COM-302',
        title: 'Status Codes Dictionary',
        severity: 'guideline',
        summary: '10-4 (Acknowledged), 10-7 (Out of Service), 10-8 (In Service / Available), 10-20 (Current Location).',
        allowed: [
          'Using concise 10-codes to keep voice channels uncluttered.',
          'Updating location every 5 minutes during high-speed pursuits.'
        ],
        prohibited: [
          'Using slang or obscure custom codes not registered in server policy handbook.'
        ],
        penalty: 'Refresher training in communications.'
      }
    ]
  },
  {
    id: 'escalation',
    name: 'Moderation Escalation Matrix',
    shortDesc: 'Automated strike penalties, infraction tiers, and probation procedures.',
    icon: AlertTriangle,
    badge: 'Sanctions',
    accent: '#f39c12',
    rules: [
      {
        id: 'rule-401',
        code: 'SAN-401',
        title: 'Tiered Discipline Hierarchy',
        severity: 'mandatory',
        summary: 'Tier 1: Documented Warning -> Tier 2: 1 Strike + 7-Day Demotion -> Tier 3: 2 Strikes -> Tier 4: Dismissal.',
        allowed: [
          'Issuing verbal advisories for minor first-time misunderstandings.',
          'Filing formal `/infraction` logs with screenshot evidence.'
        ],
        prohibited: [
          'Skipping escalation steps without High Command signoff.',
          'Issuing strikes without logged proof attached to Mavely dashboard.'
        ],
        penalty: 'Administrative review of staff action privileges.'
      }
    ]
  },
  {
    id: 'shifts',
    name: 'Activity & Shift Quotas',
    shortDesc: 'Weekly minimum patrol hours, ticket quotas, and inactivity notice policies.',
    icon: Clock,
    badge: 'Operations',
    accent: '#9b59b6',
    rules: [
      {
        id: 'rule-501',
        code: 'OPS-501',
        title: 'Weekly Minimum Activity Requirement',
        severity: 'mandatory',
        summary: 'Active staff must log a minimum of 3 hours in patrol sessions or resolve at least 5 support tickets per billing week.',
        allowed: [
          'Filing an LOA (Leave of Absence) request up to 14 days in advance via dashboard.',
          'Co-hosting server community roleplay events for double shift credit.'
        ],
        prohibited: [
          'AFK farming time in voice channels or on-duty without actively moderating.',
          'Logging on just before weekly reset to ping tickets without responding.'
        ],
        penalty: 'Automated inactivity flag + removal from weekly bonus pool.'
      }
    ]
  }
];

export function StaffHandbookHub({ onDeploy }: { onDeploy?: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('conduct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule-101');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeCategory = HANDBOOK_DATA.find((c) => c.id === selectedCategory) || HANDBOOK_DATA[0];

  // Filter rules based on search
  const filteredRules = activeCategory.rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRule =
    activeCategory.rules.find((r) => r.id === selectedRuleId) || activeCategory.rules[0] || null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* 21st.dev Style Header with Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#2ecc71]/10 text-[#2ecc71]">
              <BookOpen className="size-3.5" />
            </span>
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-zinc-400">
              Interactive Documentation Engine
            </span>
            <Badge variant="outline" className="border-[#2ecc71]/30 bg-[#2ecc71]/10 text-[#2ecc71] text-[10px]">
              Live v2.4
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            Staff Handbook &amp; Operations Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synchronize official rules, pursuit policies, and 10-codes directly to your server Discord channel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy('https://mavely.gg/docs/handbook', 'Handbook Link')}
            className="border-white/10 bg-white/[0.03] text-xs text-white/80 hover:text-white hover:bg-white/[0.06]"
          >
            <Copy className="size-3.5 mr-1.5" />
            <span>{copiedCode === 'Handbook Link' ? 'Copied Link!' : 'Copy Link'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onDeploy) onDeploy();
              toast.success('Handbook dispatched to Discord #staff-handbook channel!');
            }}
            className="bg-[#2ecc71] hover:bg-[#27ae60] text-black font-semibold text-xs transition-all shadow-md shadow-[#2ecc71]/20"
          >
            <Send className="size-3.5 mr-1.5" />
            <span>Deploy to Discord</span>
          </Button>
        </div>
      </div>

      {/* Category Navigation Pills (21st.dev Tabbed Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {HANDBOOK_DATA.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedRuleId(cat.rules[0]?.id || '');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-white/[0.08] text-white border-white/20 shadow-sm'
                  : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon
                className="size-3.5"
                style={{ color: isActive ? cat.accent : undefined }}
              />
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
                {cat.rules.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Split View: Rules Explorer on Left + Live Discord Embed Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Search + Interactive Rule List & Deep Dive Card */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="size-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCategory.name} clauses, 10-codes, or keywords...`}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#2ecc71]/50 focus:bg-white/[0.04] transition-all outline-none"
            />
          </div>

          {/* Rules Accordion / Cards */}
          <div className="space-y-2.5">
            {filteredRules.map((rule) => {
              const isSelected = rule.id === selectedRuleId;
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2ecc71]/40 bg-[#2ecc71]/[0.04] shadow-lg shadow-[#2ecc71]/5'
                      : 'border-white/[0.06] bg-[#121316]/70 hover:border-white/15 hover:bg-[#121316]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#2ecc71] px-1.5 py-0.5 rounded bg-[#2ecc71]/10">
                          {rule.code}
                        </span>
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {rule.title}
                        </h4>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                            rule.severity === 'critical'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : rule.severity === 'mandatory'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                        {rule.summary}
                      </p>
                    </div>
                    <ChevronRight
                      className={`size-4 transition-transform shrink-0 mt-1 ${
                        isSelected ? 'rotate-90 text-[#2ecc71]' : 'text-zinc-500'
                      }`}
                    />
                  </div>

                  {/* Expanded Detail Panel */}
                  {isSelected && (
                    <div className="mt-4 pt-3.5 border-t border-white/[0.08] space-y-3.5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="size-3.5" />
                            <span>Authorized Procedure</span>
                          </div>
                          <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                            {rule.allowed.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                            <XCircle className="size-3.5" />
                            <span>Prohibited Violation</span>
                          </div>
                          <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                            {rule.prohibited.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-300">Sanction:</span>
                          <span className="text-amber-400/90 font-mono text-[11px]">{rule.penalty}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(`**[${rule.code}] ${rule.title}**\n> ${rule.summary}\n*Sanction:* ${rule.penalty}`, rule.code);
                          }}
                          className="flex items-center gap-1 text-[11px] text-[#2ecc71] hover:underline"
                        >
                          <Copy className="size-3" />
                          <span>Copy Discord Quote</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="p-8 text-center rounded-xl border border-white/[0.06] bg-white/[0.01]">
                <p className="text-xs text-zinc-400">No handbook clauses matched &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Authentic Discord Rich Embed Simulator (21st.dev Style) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-medium text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="size-3 text-[#2ecc71]" />
              <span>Discord Live Simulator</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">#staff-handbook</span>
          </div>

          {/* Discord Message Shell */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#1e1f22] p-4 text-white shadow-2xl space-y-3">
            {/* Discord Post Header */}
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-[#232428] flex items-center justify-center p-1.5 shrink-0 ring-1 ring-white/10">
                <img src="/mavely-mark.png" alt="Mavely" className="size-full object-contain" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Mavely</span>
                  <span className="rounded bg-[#5865F2] px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                    APP
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">Today at 2:00 PM</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Official community staff documentation and directives have been updated.
                </p>
              </div>
            </div>

            {/* Discord Rich Embed */}
            <div className="ml-12 border-l-4 border-[#2ecc71] bg-[#2b2d31] rounded-r-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#2ecc71] uppercase">
                  {activeCategory.name}
                </span>
                <span className="text-[9px] text-zinc-400">Mavely Operations Suite</span>
              </div>

              <h4 className="text-xs font-bold text-white tracking-tight">
                {activeRule ? `${activeRule.code}: ${activeRule.title}` : activeCategory.name}
              </h4>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {activeRule?.summary || activeCategory.shortDesc}
              </p>

              {activeRule && (
                <div className="space-y-1.5 pt-1 text-[10px]">
                  <div className="bg-black/20 rounded p-1.5 text-zinc-300">
                    <span className="text-emerald-400 font-semibold block mb-0.5">✓ Allowed:</span>
                    {activeRule.allowed[0]}
                  </div>
                  <div className="bg-black/20 rounded p-1.5 text-zinc-300">
                    <span className="text-rose-400 font-semibold block mb-0.5">✕ Prohibited:</span>
                    {activeRule.prohibited[0]}
                  </div>
                </div>
              )}

              {/* Embed Footer */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-400">
                <span>Sanction: {activeRule?.penalty || 'Administrative Review'}</span>
                <span>Click dropdown below to switch</span>
              </div>
            </div>

            {/* Interactive Discord Select Menu Simulator */}
            <div className="ml-12 space-y-2">
              <div className="w-full rounded-md bg-[#2b2d31] border border-black/30 px-3 py-2 text-xs flex items-center justify-between text-zinc-300 cursor-pointer hover:bg-[#323439] transition-colors">
                <span className="flex items-center gap-2">
                  <FileText className="size-3.5 text-zinc-400" />
                  <span>{activeRule?.title || 'Select policy topic...'}</span>
                </span>
                <ChevronRight className="size-3.5 text-zinc-400 rotate-90" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success('Rule acknowledged and recorded in audit log!')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-[#4752c4] hover:bg-[#3c45a5] text-white py-1.5 text-[11px] font-medium transition-colors"
                >
                  <BookmarkCheck className="size-3" />
                  <span>Acknowledge Policy</span>
                </button>
                <button
                  onClick={() => handleCopy(`https://mavely.gg/handbook/${activeRule?.id}`, 'Rule Link')}
                  className="rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2.5 py-1.5 text-[11px] transition-colors"
                  title="Share"
                >
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffHandbookHub;
