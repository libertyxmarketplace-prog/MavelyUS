import { useState } from 'react';
import {
  FileCheck,
  Send,
  Plus,
  Trash2,
  Check,
  X,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChannelSelect, RoleSelect } from '@/components/DiscordResourceSelectors';
import type {
  DiscordGuild,
  WorkspaceCustomizations,
  GuildResources,
  CustomStaffApplication,
  ApplicationQuestion
} from '@/types';

interface StaffApplicationsTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  resources: GuildResources;
  onChangeConfig: (updated: Partial<WorkspaceCustomizations>) => void;
  onDeployAppPanel: (channelId: string) => void;
  deploying: boolean;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEFAULT_APPLICATIONS: CustomStaffApplication[] = [
  {
    id: 'app-mod',
    name: 'Staff Moderator Application',
    open: true,
    delivery: 'channel',
    reviewChannelId: '',
    resultsChannelId: '',
    passedRoleId: '',
    questions: [
      { id: 'q1', text: 'What is your Roblox username and Discord tag?', type: 'short', required: true },
      { id: 'q2', text: 'How many hours per week can you actively patrol in ER:LC voice channels?', type: 'short', required: true },
      { id: 'q3', text: 'Define FRP, RDM, and VDM with a concrete scenario for each.', type: 'paragraph', required: true },
      { id: 'q4', text: 'How would you handle a player disputing a moderation strike in public chat?', type: 'paragraph', required: true }
    ]
  }
];

export function StaffApplicationsTab({
  guild: _guild,
  config,
  resources,
  onChangeConfig,
  onDeployAppPanel,
  deploying,
  addToast
}: StaffApplicationsTabProps) {
  const applications: CustomStaffApplication[] =
    config.applications && config.applications.length > 0
      ? config.applications
      : DEFAULT_APPLICATIONS;

  const [selectedAppIdx, setSelectedAppIdx] = useState(0);
  const [deployChannelId, setDeployChannelId] = useState(config.appPanelChannelId || '');
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for candidate submissions review
  const [submissions, setSubmissions] = useState([
    {
      id: 'sub-1',
      applicantTag: 'OfficerDavis#4819',
      robloxName: 'Davis_Patrol',
      appName: 'Staff Moderator Application',
      submittedAt: 'Today at 3:15 PM',
      status: 'pending' as 'pending' | 'approved' | 'denied',
      score: '94%'
    },
    {
      id: 'sub-2',
      applicantTag: 'CoastRPRob#0012',
      robloxName: 'Rob_Tac9',
      appName: 'Staff Moderator Application',
      submittedAt: 'Yesterday at 8:40 PM',
      status: 'approved' as 'pending' | 'approved' | 'denied',
      score: '96%'
    },
    {
      id: 'sub-3',
      applicantTag: 'speedy_patrol_user',
      robloxName: 'Speedy_99',
      appName: 'Staff Moderator Application',
      submittedAt: '2 days ago',
      status: 'denied' as 'pending' | 'approved' | 'denied',
      score: '62%'
    }
  ]);

  const currentApp = applications[selectedAppIdx] || applications[0];

  const handleUpdateCurrentApp = (patch: Partial<CustomStaffApplication>) => {
    const updated = applications.map((app, i) => (i === selectedAppIdx ? { ...app, ...patch } : app));
    onChangeConfig({ applications: updated });
  };

  const handleAddQuestion = () => {
    const nextQ: ApplicationQuestion = {
      id: `q-${Date.now()}`,
      text: 'New Question Prompt',
      type: 'short',
      required: true
    };
    handleUpdateCurrentApp({ questions: [...(currentApp.questions || []), nextQ] });
    addToast('success', 'Question Added', 'Added a new question to the application quiz form.');
  };

  const handleRemoveQuestion = (qIdx: number) => {
    const updated = currentApp.questions.filter((_, i) => i !== qIdx);
    handleUpdateCurrentApp({ questions: updated });
  };

  const handleUpdateQuestion = (qIdx: number, patch: Partial<ApplicationQuestion>) => {
    const updated = currentApp.questions.map((q, i) => (i === qIdx ? { ...q, ...patch } : q));
    handleUpdateCurrentApp({ questions: updated });
  };

  const handleReviewSubmission = (id: string, action: 'approve' | 'deny') => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, status: action === 'approve' ? 'approved' : 'denied' } : sub
      )
    );
    if (action === 'approve') {
      addToast(
        'success',
        'Applicant Approved',
        `Granted role @${currentApp.passedRoleId || 'Staff'} and posted acceptance notice to results channel.`
      );
    } else {
      addToast('info', 'Applicant Denied', 'Marked application as denied.');
    }
  };

  const handleDeploy = () => {
    if (!deployChannelId) {
      addToast('warning', 'Select Channel', 'Please choose a destination channel for the application panel.');
      return;
    }
    onDeployAppPanel(deployChannelId);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (submissionsFilter !== 'all' && sub.status !== submissionsFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.applicantTag.toLowerCase().includes(q) ||
        sub.robloxName.toLowerCase().includes(q) ||
        sub.appName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <FileCheck className="size-4 text-zinc-300" />
              Interactive Staff Quiz Applications
            </h2>
            <Badge className="bg-zinc-800 text-zinc-300 border-white/[0.08] text-[10px] font-mono">
              ROLE REWARDS ON APPROVAL
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Multi-step modal quizzes with interactive staff grading buttons <code className="font-mono text-zinc-300">[Approve]</code> and <code className="font-mono text-zinc-300">[Deny]</code>.
          </p>
        </div>

        {/* Deploy Panel Action */}
        <div className="flex items-center gap-2">
          <div className="w-52">
            <ChannelSelect
              channels={resources.channels}
              value={deployChannelId}
              onChange={setDeployChannelId}
              placeholder="Application Channel"
            />
          </div>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying || !deployChannelId}
            className="h-9 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md shrink-0"
          >
            <Send className={`size-3.5 mr-1.5 ${deploying ? 'animate-spin' : ''}`} />
            Deploy App Panel
          </Button>
        </div>
      </div>

      {/* Application Quiz Builder & Channels */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Application Quiz Form Configuration
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Configure review channel, results channel, and automated staff role assignment.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {applications.length > 1 && (
                <div className="flex gap-1 bg-black/40 p-0.5 rounded-md border border-white/10">
                  {applications.map((app, idx) => (
                    <button
                      key={app.id || idx}
                      onClick={() => setSelectedAppIdx(idx)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        selectedAppIdx === idx ? 'bg-white/15 text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {app.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="app-open-toggle" className="text-xs text-zinc-300 cursor-pointer">
                  Recruitment Open
                </Label>
                <Switch
                  id="app-open-toggle"
                  checked={currentApp?.open !== false}
                  onCheckedChange={(checked) => handleUpdateCurrentApp({ open: checked })}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Application Title</Label>
              <Input
                value={currentApp?.name || ''}
                onChange={(e) => handleUpdateCurrentApp({ name: e.target.value })}
                className="h-8 font-medium text-xs bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Passed Role Reward</Label>
              <RoleSelect
                roles={resources.roles}
                value={currentApp?.passedRoleId || ''}
                onChange={(val) => handleUpdateCurrentApp({ passedRoleId: val })}
                placeholder="Select Granted Staff Role"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Private Staff Review Channel</Label>
              <ChannelSelect
                channels={resources.channels}
                value={currentApp?.reviewChannelId || ''}
                onChange={(val) => handleUpdateCurrentApp({ reviewChannelId: val })}
                placeholder="Select #staff-reviews channel"
              />
              <p className="text-[11px] text-zinc-400">
                Staff receive submission cards with [Approve] and [Deny] action buttons here.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Public Results Announcement Channel</Label>
              <ChannelSelect
                channels={resources.channels}
                value={currentApp?.resultsChannelId || ''}
                onChange={(val) => handleUpdateCurrentApp({ resultsChannelId: val })}
                placeholder="Select #application-results channel"
              />
              <p className="text-[11px] text-zinc-400">
                Acceptance notices and welcome messages post automatically upon approval.
              </p>
            </div>
          </div>

          {/* Dynamic Question Builder */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Quiz Questions ({currentApp?.questions?.length || 0})</div>
                <div className="text-[11px] text-zinc-400">Interactive prompts answered by candidates.</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="h-8 px-3 text-xs border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-md"
              >
                <Plus className="size-3.5 mr-1" />
                Add Question
              </Button>
            </div>

            <div className="space-y-2">
              {(currentApp?.questions || []).map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="p-3 rounded-md border border-white/[0.06] bg-black/40 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <span className="font-mono text-xs text-zinc-500 shrink-0">#{qIdx + 1}</span>
                  <Input
                    value={q.text}
                    onChange={(e) => handleUpdateQuestion(qIdx, { text: e.target.value })}
                    className="h-8 text-xs bg-white/[0.03] border-white/10 text-white flex-1"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => handleUpdateQuestion(qIdx, { type: e.target.value as any })}
                    className="h-8 rounded-md border border-white/10 bg-white/[0.05] px-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="short" className="bg-[#12141c]">Short Answer</option>
                    <option value="paragraph" className="bg-[#12141c]">Paragraph Text</option>
                    <option value="choice" className="bg-[#12141c]">Multiple Choice</option>
                  </select>

                  <div className="flex items-center gap-2 shrink-0">
                    <Label className="text-[11px] text-zinc-400 cursor-pointer">Required</Label>
                    <Switch
                      checked={q.required}
                      onCheckedChange={(checked) => handleUpdateQuestion(qIdx, { required: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="size-7 p-0 text-zinc-400 hover:text-rose-400 rounded-md"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Submissions Review Inbox */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Candidate Submissions Review Inbox
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Staff grading portal. Review candidate scores and approve or deny submissions.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Filter candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 text-xs bg-black/40 border-white/10 text-white"
                />
              </div>
              <div className="flex rounded-md border border-white/10 bg-black/40 p-0.5 text-xs">
                {(['all', 'pending', 'approved', 'denied'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSubmissionsFilter(tab)}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                      submissionsFilter === tab
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[11px] text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Applicant &amp; Roblox</th>
                  <th className="px-4 py-3">Applied Form</th>
                  <th className="px-4 py-3">Auto Quiz Score</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{sub.robloxName}</div>
                      <div className="font-mono text-[11px] text-zinc-400">{sub.applicantTag}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">
                      {sub.appName}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {sub.score}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                      {sub.submittedAt}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={sub.status === 'approved' ? 'default' : sub.status === 'denied' ? 'destructive' : 'outline'}
                        className={
                          sub.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono'
                            : sub.status === 'denied'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-mono'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] font-mono'
                        }
                      >
                        {sub.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sub.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewSubmission(sub.id, 'approve')}
                            className="h-7 px-2.5 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-md"
                          >
                            <Check className="size-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewSubmission(sub.id, 'deny')}
                            className="h-7 px-2.5 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 rounded-md"
                          >
                            <X className="size-3 mr-1" />
                            Deny
                          </Button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500">Graded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
