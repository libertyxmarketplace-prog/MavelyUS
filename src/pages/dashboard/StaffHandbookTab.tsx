import { useState } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  Check,
  X,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChannelSelect } from '@/components/DiscordResourceSelectors';
import { DataImportTab } from './DataImportTab';
import type {
  DiscordGuild,
  WorkspaceCustomizations,
  GuildResources,
  StaffLoaRequest,
  StaffInfraction
} from '@/types';

interface StaffHandbookTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  resources: GuildResources;
  onChangeConfig: (updated: Partial<WorkspaceCustomizations>) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEFAULT_LOAS: StaffLoaRequest[] = [
  {
    id: 'loa-1',
    staffId: '849182390123910231',
    staffTag: 'OfficerMiller#2091',
    reason: 'College midterms and examination schedule',
    startDate: '2026-10-18',
    endDate: '2026-10-25',
    status: 'pending'
  },
  {
    id: 'loa-2',
    staffId: '662819283712893812',
    staffTag: 'SgtReynolds#1029',
    reason: 'Family emergency and vacation trip',
    startDate: '2026-10-14',
    endDate: '2026-10-21',
    status: 'approved'
  }
];

const DEFAULT_INFRACTIONS: StaffInfraction[] = [
  {
    id: 'inf-1',
    staffId: '448192839182736451',
    staffTag: 'CadetParker#4412',
    type: 'strike',
    reason: 'Failure to meet weekly 120-minute voice channel quota without approved LOA',
    issuedBy: 'Management Watchdog',
    timestamp: 'Yesterday at 11:30 PM'
  },
  {
    id: 'inf-2',
    staffId: '331829384756192837',
    staffTag: 'OfficerJohnson#9021',
    type: 'warn',
    reason: 'Unprofessional dispatch communication during active pursuit code 3',
    issuedBy: 'Lt. Vance',
    timestamp: '3 days ago'
  }
];

export function StaffHandbookTab({
  guild: _guild,
  config,
  resources,
  onChangeConfig,
  addToast
}: StaffHandbookTabProps) {
  const [loaRequests, setLoaRequests] = useState<StaffLoaRequest[]>(
    config.staffLoaRequests && config.staffLoaRequests.length > 0
      ? config.staffLoaRequests
      : DEFAULT_LOAS
  );

  const [infractions, setInfractions] = useState<StaffInfraction[]>(
    config.staffInfractions && config.staffInfractions.length > 0
      ? config.staffInfractions
      : DEFAULT_INFRACTIONS
  );

  // New Infraction Modal / Form State
  const [infStaffTag, setInfStaffTag] = useState('');
  const [infType, setInfType] = useState<'warn' | 'strike' | 'demote'>('strike');
  const [infReason, setInfReason] = useState('');
  const [showImporter, setShowImporter] = useState(false);

  const quotaMinutes = config.quotaRequirement || '120';
  const strikeThreshold = config.infractionStrikeThreshold || '3';

  const handleLoaAction = (id: string, action: 'approved' | 'denied') => {
    const updated = loaRequests.map((l) => (l.id === id ? { ...l, status: action } : l));
    setLoaRequests(updated);
    onChangeConfig({ staffLoaRequests: updated });
    addToast(
      action === 'approved' ? 'success' : 'info',
      `LOA ${action === 'approved' ? 'Approved' : 'Denied'}`,
      `Staff member marked as ${action === 'approved' ? 'Temporary Quota Exempt' : 'Active Duty'}.`
    );
  };

  const handleIssueInfraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infStaffTag.trim() || !infReason.trim()) {
      addToast('warning', 'Missing Details', 'Please input staff username and justification reason.');
      return;
    }
    const next: StaffInfraction = {
      id: `inf-${Date.now()}`,
      staffId: `user-${Date.now()}`,
      staffTag: infStaffTag.trim(),
      type: infType,
      reason: infReason.trim(),
      issuedBy: 'Dashboard Admin',
      timestamp: 'Just now'
    };
    const updated = [next, ...infractions];
    setInfractions(updated);
    onChangeConfig({ staffInfractions: updated });
    setInfStaffTag('');
    setInfReason('');
    addToast('success', 'Infraction Issued', `Logged disciplinary action /${infType} to audit log.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Shield className="size-4 text-zinc-300" />
              Staff Handbook, Quotas &amp; Disciplinary Tracker
            </h2>
            <Badge className="bg-zinc-800 text-zinc-300 border-white/[0.08] text-[10px] font-mono">
              AUTOMATED COMPLIANCE
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Enforce voice activity quotas, manage Leave of Absence approvals, and log infractions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImporter(!showImporter)}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 h-8 gap-1.5 shrink-0"
        >
          <FileSpreadsheet className="size-3.5 text-emerald-400" />
          <span>{showImporter ? 'Close Importer' : 'Import Roster CSV'}</span>
        </Button>
      </div>

      {/* Conditionally rendered Data Import wizard */}
      {showImporter && (
        <DataImportTab
          workspace={null}
          onImportSuccess={(count) => {
            addToast('success', 'Roster Data Imported', `Successfully processed ${count} records.`);
          }}
        />
      )}

      {/* Quota & Discipline Configuration Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly Voice Quota */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Weekly Patrol Quota</span>
              <Clock className="size-3.5 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={30}
                max={1440}
                value={quotaMinutes}
                onChange={(e) => onChangeConfig({ quotaRequirement: e.target.value })}
                className="h-8 font-mono text-xs bg-black/40 border-white/10 w-24 text-white"
              />
              <span className="text-xs text-zinc-400">minutes / week</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Minimum active minutes in mapped patrol voice channels required from on-duty officers.
            </p>
          </CardContent>
        </Card>

        {/* Quota Log Channel */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Quota Telemetry Channel</span>
              <Activity className="size-3.5 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <ChannelSelect
              channels={resources.channels}
              value={config.quotaChannelId || ''}
              onChange={(val) => onChangeConfig({ quotaChannelId: val })}
              placeholder="Select #quota-logs"
            />
            <p className="text-[11px] text-zinc-400">
              Weekly report generated Sunday at midnight with officer compliance percentages.
            </p>
          </CardContent>
        </Card>

        {/* Strike Threshold */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Auto Demote Threshold</span>
              <AlertTriangle className="size-3.5 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={strikeThreshold}
                onChange={(e) => onChangeConfig({ infractionStrikeThreshold: e.target.value })}
                className="h-8 font-mono text-xs bg-black/40 border-white/10 w-20 text-white"
              />
              <span className="text-xs text-zinc-400">strikes = auto demote</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Staff members hitting {strikeThreshold} active strikes are automatically stripped of command roles.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave of Absence (LOA) Manager */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-zinc-300" />
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Leave of Absence (LOA) Queue
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Command: /loa request
            </span>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Management review portal. Approved members receive temporary exemption from weekly patrol quotas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[11px] text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Justification Reason</th>
                  <th className="px-4 py-3">Exemption Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Management Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loaRequests.map((loa) => (
                  <tr key={loa.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{loa.staffTag}</div>
                      <div className="font-mono text-[11px] text-zinc-400">{loa.staffId}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                      {loa.reason}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300 text-[11px]">
                      {loa.startDate} to {loa.endDate}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={loa.status === 'approved' ? 'default' : loa.status === 'denied' ? 'destructive' : 'outline'}
                        className={
                          loa.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono'
                            : loa.status === 'denied'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-mono'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] font-mono'
                        }
                      >
                        {loa.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {loa.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoaAction(loa.id, 'approved')}
                            className="h-7 px-2.5 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-md"
                          >
                            <Check className="size-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoaAction(loa.id, 'denied')}
                            className="h-7 px-2.5 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 rounded-md"
                          >
                            <X className="size-3 mr-1" />
                            Deny
                          </Button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Disciplinary Infractions Log & Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Infraction Card */}
        <div className="lg:col-span-5">
          <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Issue Disciplinary Sanction
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Direct slash command dispatcher: /warn, /strike, /demote.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleIssueInfraction} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Staff Tag / Roblox Username</Label>
                  <Input
                    placeholder="e.g. OfficerDavis#4819"
                    value={infStaffTag}
                    onChange={(e) => setInfStaffTag(e.target.value)}
                    className="h-8 text-xs bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Sanction Severity</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['warn', 'strike', 'demote'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInfType(type)}
                        className={`h-8 rounded-md text-xs font-mono uppercase transition-colors border ${
                          infType === type
                            ? 'bg-white/15 border-white/20 text-white font-semibold'
                            : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        /{type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Sanction Justification</Label>
                  <Textarea
                    rows={3}
                    placeholder="Provide incident log, violation policy, and link to evidence..."
                    value={infReason}
                    onChange={(e) => setInfReason(e.target.value)}
                    className="text-xs bg-black/40 border-white/10 text-white resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md h-8"
                >
                  Post Sanction to Audit Log
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Infraction History Table */}
        <div className="lg:col-span-7">
          <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight text-white">
                  Infraction Audit History
                </CardTitle>
                <span className="font-mono text-[11px] text-zinc-400">
                  Total: {infractions.length} Records
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[11px] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Staff Target</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Violation Reason</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {infractions.map((inf) => (
                      <tr key={inf.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{inf.staffTag}</div>
                          <div className="font-mono text-[10px] text-zinc-500">By: {inf.issuedBy}</div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <Badge
                            variant={inf.type === 'demote' ? 'destructive' : 'outline'}
                            className={
                              inf.type === 'demote'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px]'
                                : inf.type === 'strike'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]'
                                : 'bg-zinc-800 text-zinc-300 border-white/[0.06] text-[10px]'
                            }
                          >
                            /{inf.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                          {inf.reason}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-400 text-[11px]">
                          {inf.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
