import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  X,
  FileText,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { WorkspaceCustomizations } from '@/types';

export interface RosterMember {
  id: string;
  username: string;
  robloxId: string;
  discordId?: string;
  department: string;
  rank?: string;
  callsign?: string;
  status: 'Active' | 'LOA' | 'Suspended';
  addedAt: number;
}

interface RosterImportSectionProps {
  guildId: string;
  serverName: string;
  config: WorkspaceCustomizations;
  onChangeConfig: (updates: Partial<WorkspaceCustomizations>) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEPARTMENTS = [
  'Police',
  'Sheriff',
  'Fire & Rescue',
  'DOT',
  'Staff',
  'Civilian'
];

export function RosterImportSection({
  guildId,
  serverName,
  config,
  onChangeConfig,
  addToast
}: RosterImportSectionProps) {
  // ─── ROSTER STATE & PERSISTENCE ──────────────────────────────────────────
  const [members, setMembers] = useState<RosterMember[]>(() => {
    try {
      const stored = localStorage.getItem(`erlcus_roster_${guildId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // If config has stored roster, restore it
    if ((config as any)?.rosterData && Array.isArray((config as any)?.rosterData)) {
      return (config as any)?.rosterData;
    }
    return [];
  });

  // Sync to localStorage
  const saveMembers = (updated: RosterMember[]) => {
    setMembers(updated);
    try {
      localStorage.setItem(`erlcus_roster_${guildId}`, JSON.stringify(updated));
      onChangeConfig?.({ rosterData: updated } as any);
    } catch (err) {
      console.warn('Could not persist roster to storage:', err);
    }
  };

  // ─── IMPORT MODES & PARSER STATE ────────────────────────────────────────
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Omit<RosterMember, 'id' | 'addedAt'>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── FILTER & SEARCH ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // ─── MANUAL ADD MEMBER MODAL ───────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRobloxId, setNewRobloxId] = useState('');
  const [newDiscordId, setNewDiscordId] = useState('');
  const [newDepartment, setNewDepartment] = useState('Police');
  const [newRank, setNewRank] = useState('Officer');
  const [newCallsign, setNewCallsign] = useState('');

  // ─── CSV / TEXT SIMPLE PARSER ─────────────────────────────────────────
  const parseRowsFromText = (rawText: string) => {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedPreview([]);
      return;
    }

    // Check if first row is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('name') ||
      firstLineLower.includes('user') ||
      firstLineLower.includes('roblox') ||
      firstLineLower.includes('dept');

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const detected: Omit<RosterMember, 'id' | 'addedAt'>[] = [];

    for (const line of dataLines) {
      // Split by comma, tab, or semicolon
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0]) {
        const username = parts[0];
        const robloxId = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : `${Math.floor(1000000 + Math.random() * 9000000)}`;
        const department = parts[2] || 'Police';
        const rank = parts[3] || 'Member';
        const callsign = parts[4] || '';
        const discordId = parts[5] || '';

        detected.push({
          username,
          robloxId,
          discordId,
          department,
          rank,
          callsign,
          status: 'Active'
        });
      }
    }

    setParsedPreview(detected);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      parseRowsFromText(text);
      addToast('info', 'File Scanned', `Parsed ${file.name}. Review preview below.`);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;

    const newEntries: RosterMember[] = parsedPreview.map((item, idx) => ({
      ...item,
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: Date.now()
    }));

    // Merge without duplicates by robloxId or username
    const merged = [...members];
    let addedCount = 0;

    for (const entry of newEntries) {
      const exists = merged.some(
        (m) =>
          m.username.toLowerCase() === entry.username.toLowerCase() ||
          (m.robloxId && m.robloxId === entry.robloxId)
      );
      if (!exists) {
        merged.push(entry);
        addedCount++;
      }
    }

    saveMembers(merged);
    setParsedPreview([]);
    setPasteText('');
    addToast('success', 'Roster Imported', `Successfully imported ${addedCount} member${addedCount === 1 ? '' : 's'} into community roster.`);
  };

  const handleAddSingleMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      addToast('warning', 'Missing Username', 'Roblox username is required.');
      return;
    }

    const member: RosterMember = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: newUsername.trim(),
      robloxId: newRobloxId.trim() || `${Math.floor(1000000 + Math.random() * 9000000)}`,
      discordId: newDiscordId.trim(),
      department: newDepartment,
      rank: newRank.trim() || 'Officer',
      callsign: newCallsign.trim(),
      status: 'Active',
      addedAt: Date.now()
    };

    saveMembers([member, ...members]);
    setShowAddModal(false);
    setNewUsername('');
    setNewRobloxId('');
    setNewDiscordId('');
    setNewCallsign('');
    addToast('success', 'Member Added', `${member.username} added to ${member.department} roster.`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
    addToast('info', 'Member Removed', `${name} removed from roster.`);
  };

  const handleClearRoster = () => {
    if (confirm('Are you sure you want to clear all members from this community roster?')) {
      saveMembers([]);
      addToast('info', 'Roster Cleared', 'All roster records have been removed.');
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'Username,RobloxID,Department,Rank,Callsign,DiscordID\n' +
        'OfficerJohn,4928104,Police,Sergeant,1-ADAM-12,123456789012345678\n' +
        'ChiefMiller,8910234,Police,Chief,1-COMMAND,234567890123456789\n' +
        'DeputyVance,3819201,Sheriff,Deputy,2-LINCOLN-4,345678901234567890\n' +
        'FireChiefSam,7812903,Fire & Rescue,Captain,ENGINE-1,456789012345678901\n' +
        'RoadTechDave,6718293,DOT,Inspector,TRUCK-3,567890123456789012'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${serverName.toLowerCase().replace(/\s+/g, '_')}_sample_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Template Downloaded', 'Sample CSV template downloaded.');
  };

  const handleExportCsv = () => {
    if (members.length === 0) {
      addToast('warning', 'Empty Roster', 'No roster data to export.');
      return;
    }
    const headers = ['Username', 'RobloxID', 'DiscordID', 'Department', 'Rank', 'Callsign', 'Status'];
    const rows = members.map((m) => [
      `"${m.username}"`,
      `"${m.robloxId}"`,
      `"${m.discordId || ''}"`,
      `"${m.department}"`,
      `"${m.rank || ''}"`,
      `"${m.callsign || ''}"`,
      `"${m.status}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent([headers.join(','), ...rows.map((r) => r.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${serverName.toLowerCase().replace(/\s+/g, '_')}_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', `Exported ${members.length} members to CSV.`);
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      m.robloxId.includes(searchQuery.trim()) ||
      (m.callsign && m.callsign.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (m.rank && m.rank.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    const matchesDept = selectedDept === 'All' || m.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* ── STATS SUMMARY BAR (21st.dev style flush cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Total Roster Members
            </span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {members.length}
            </span>
          </div>
          <Users className="size-5 text-emerald-400 shrink-0" />
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Active Departments
            </span>
            <span className="text-xl font-bold font-mono text-indigo-400 mt-0.5 block">
              {new Set(members.map((m) => m.department)).size}
            </span>
          </div>
          <Shield className="size-5 text-indigo-400 shrink-0" />
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Verified Records
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {members.filter((m) => m.robloxId).length}
            </span>
          </div>
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
        </div>
      </div>

      {/* ── SIMPLE IMPORT WORKFLOW (21st.dev Style, Not Vibe-Coded) ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UploadCloud className="size-4 text-emerald-400" />
              <span>Import Community Roster</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload a CSV spreadsheet or paste member records directly. Columns are detected automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            >
              <Download className="size-3 text-zinc-400" />
              <span>Sample CSV</span>
            </button>

            {/* Mode switch */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('upload')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                  importMode === 'upload' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => setImportMode('paste')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                  importMode === 'paste' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Quick Paste
              </button>
            </div>
          </div>
        </div>

        {/* Mode 1: File Dropzone */}
        {importMode === 'upload' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-white/15 hover:border-emerald-500/40 bg-white/[0.01] hover:bg-white/[0.03]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="size-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-300">
              <UploadCloud className="size-5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-white block">
              Click to browse or drop your CSV file here
            </span>
            <span className="text-[11px] text-zinc-500 mt-1 block font-mono">
              Accepts .csv or text files with Name, Roblox ID, Department, Rank
            </span>
          </div>
        )}

        {/* Mode 2: Quick Paste */}
        {importMode === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                parseRowsFromText(e.target.value);
              }}
              rows={5}
              placeholder={`Paste roster rows (e.g. Username, RobloxID, Department, Rank):\nOfficerJohn, 4829103, Police, Sergeant\nDeputyVance, 3918201, Sheriff, Deputy`}
              className="w-full text-xs font-mono bg-black/50 border border-white/15 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-y"
            />
            <span className="text-[11px] text-zinc-500 font-mono block">
              Tip: Copy any spreadsheet columns and paste directly above.
            </span>
          </div>
        )}

        {/* Parsed Preview Table if rows detected */}
        {parsedPreview.length > 0 && (
          <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  {parsedPreview.length} member{parsedPreview.length === 1 ? '' : 's'} ready to import
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParsedPreview([]);
                    setPasteText('');
                  }}
                  className="h-8 px-3 text-xs border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmImport}
                  className="h-8 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  Import {parsedPreview.length} Members
                </Button>
              </div>
            </div>

            {/* Quick Preview rows */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-zinc-400">
                    <th className="py-2 px-3">Username</th>
                    <th className="py-2 px-3">Roblox ID</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Callsign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {parsedPreview.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-1.5 px-3 font-semibold text-white">{row.username}</td>
                      <td className="py-1.5 px-3 font-mono text-zinc-400">{row.robloxId}</td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 text-[10px] font-medium">
                          {row.department}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-zinc-300">{row.rank || '-'}</td>
                      <td className="py-1.5 px-3 font-mono text-zinc-400">{row.callsign || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedPreview.length > 5 && (
                <div className="p-2 text-center text-[11px] text-zinc-500 font-mono bg-white/[0.01]">
                  + {parsedPreview.length - 5} more members queued
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIVE ROSTER DIRECTORY ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="size-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Active Community Roster</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300">
              {filteredMembers.length} of {members.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="h-8 px-3 text-xs border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] cursor-pointer rounded-lg flex items-center gap-1.5"
            >
              <UserPlus className="size-3 text-emerald-400" />
              <span>Add Member</span>
            </Button>

            {members.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="h-8 px-3 text-xs border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white cursor-pointer rounded-lg flex items-center gap-1.5"
                >
                  <Download className="size-3" />
                  <span>Export</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearRoster}
                  className="h-8 px-3 text-xs border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-lg flex items-center gap-1.5"
                >
                  <Trash2 className="size-3" />
                  <span>Clear</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', ...DEPARTMENTS].map((dept) => {
              const count = dept === 'All' ? members.length : members.filter((m) => m.department === dept).length;
              const isSelected = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-semibold'
                      : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{dept}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-emerald-500/20 text-emerald-200' : 'text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members or unit..."
              className="h-8 pl-8 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Table View */}
        {filteredMembers.length === 0 ? (
          <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] text-center space-y-1">
            <span className="text-xs text-zinc-400 block font-medium">No roster members found</span>
            <span className="text-[11px] text-zinc-600 block font-mono">
              {searchQuery ? 'Try adjusting your search query or filter.' : 'Upload a CSV or paste member records above to populate your roster.'}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-zinc-400">
                    <th className="py-2.5 px-3.5">Member</th>
                    <th className="py-2.5 px-3.5">Roblox ID</th>
                    <th className="py-2.5 px-3.5">Department</th>
                    <th className="py-2.5 px-3.5">Rank</th>
                    <th className="py-2.5 px-3.5">Callsign</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-6 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                            {member.username.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">{member.username}</span>
                            {member.discordId && (
                              <span className="text-[10px] text-zinc-500 font-mono block">Discord: {member.discordId}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-zinc-300">
                        {member.robloxId}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.03] text-zinc-300 text-[11px] font-medium">
                          {member.department}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-zinc-300 font-medium">
                        {member.rank || 'Officer'}
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-zinc-400">
                        {member.callsign || '-'}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          {member.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.username)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="Remove from roster"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MANUAL ADD MEMBER MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#161616] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="size-4 text-emerald-400" />
                <span>Add Member to Roster</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingleMember} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">
                  Roblox Username <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. OfficerJohn"
                  required
                  className="h-9 bg-black/40 border-white/10 text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Roblox ID</label>
                  <Input
                    value={newRobloxId}
                    onChange={(e) => setNewRobloxId(e.target.value)}
                    placeholder="e.g. 4829103"
                    className="h-9 bg-black/40 border-white/10 text-white rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-zinc-900 text-white">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Rank / Role</label>
                  <Input
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    placeholder="e.g. Sergeant"
                    className="h-9 bg-black/40 border-white/10 text-white rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Callsign / Unit</label>
                  <Input
                    value={newCallsign}
                    onChange={(e) => setNewCallsign(e.target.value)}
                    placeholder="e.g. 1-ADAM-12"
                    className="h-9 bg-black/40 border-white/10 text-white rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Discord Snowflake ID (Optional)</label>
                <Input
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  className="h-9 bg-black/40 border-white/10 text-white rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 text-xs border-white/10 bg-white/[0.04] text-zinc-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl"
                >
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
