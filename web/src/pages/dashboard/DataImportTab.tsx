import React, { useState, useId } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Copy,
  Check,
  Table,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkspaceBot } from '@/types';

// ==========================================
// CSV SCANNER & PARSER (RFC 4180 Compliant)
// ==========================================
export type CsvTable = { columns: string[]; rows: string[][] };

function scanCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char !== '"') {
        field += char;
        continue;
      }
      if (text[index + 1] === '"') {
        field += '"';
        index += 1;
        continue;
      }
      quoted = false;
      continue;
    }

    if (char === '"' && field === '') {
      quoted = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const isBlankRow = (row: string[]) => row.every((cell) => cell.trim() === '');

export function parseCsv(text: string): CsvTable {
  const scanned = scanCsv(text.replace(/^\uFEFF/, '')).filter((row) => !isBlankRow(row));
  if (scanned.length === 0) return { columns: [], rows: [] };

  const columns = scanned[0].map((cell) => cell.trim());
  const rows = scanned.slice(1).map((row) =>
    row.length >= columns.length
      ? row
      : [...row, ...Array.from({ length: columns.length - row.length }, () => '')]
  );

  return { columns, rows };
}

// ==========================================
// TARGET FIELDS SCHEMA FOR ER:LC DASHBOARD
// ==========================================
export type FieldKey =
  | 'username'
  | 'robloxId'
  | 'discordId'
  | 'department'
  | 'rank'
  | 'callsign'
  | 'weeklyQuota'
  | 'status';

export interface ImportField {
  key: FieldKey;
  label: string;
  required: boolean;
  hint: string;
  aliases: string[];
}

export const DEPARTMENTS = ['Police', 'Sheriff', 'Fire & Rescue', 'DOT', 'Staff', 'Civilian'] as const;

export const FIELDS: ImportField[] = [
  {
    key: 'username',
    label: 'Username / Name',
    required: true,
    hint: 'Roblox account username or staff display name',
    aliases: ['name', 'username', 'robloxusername', 'user', 'fullname', 'member', 'officer'],
  },
  {
    key: 'robloxId',
    label: 'Roblox ID',
    required: true,
    hint: 'Numeric Roblox user ID',
    aliases: ['robloxid', 'userid', 'rbxid', 'accountid', 'id'],
  },
  {
    key: 'discordId',
    label: 'Discord ID',
    required: false,
    hint: '17 to 20 digit snowflake ID',
    aliases: ['discordid', 'discord', 'snowflake', 'discordtag'],
  },
  {
    key: 'department',
    label: 'Department',
    required: true,
    hint: 'Police, Sheriff, Fire & Rescue, DOT, Staff',
    aliases: ['dept', 'department', 'division', 'agency', 'branch'],
  },
  {
    key: 'rank',
    label: 'Rank / Tier',
    required: false,
    hint: 'Cadet, Officer, Sergeant, Lieutenant, Chief, Admin',
    aliases: ['rank', 'tier', 'role', 'title', 'position'],
  },
  {
    key: 'callsign',
    label: 'Callsign / Unit #',
    required: false,
    hint: 'Radio designation (e.g., 1-ADAM-12 or 402)',
    aliases: ['callsign', 'unit', 'badge', 'badgenumber', 'unitnumber'],
  },
  {
    key: 'weeklyQuota',
    label: 'Weekly Quota (Hours)',
    required: false,
    hint: 'Target on-duty hours per week (e.g. 5 or 10)',
    aliases: ['quota', 'hours', 'targethours', 'weeklyquota', 'shifts'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    hint: 'Active, LOA, or Suspended',
    aliases: ['status', 'state', 'activity', 'onleave'],
  },
];

export const UNMAPPED = '';

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export function autoMatch(column: string): FieldKey | null {
  const key = normalise(column);
  if (key === '') return null;
  const hit = FIELDS.find(
    (field) => normalise(field.label) === key || field.aliases.includes(key)
  );
  return hit?.key ?? null;
}

export function initialMapping(columns: string[]): Record<number, FieldKey | null> {
  const taken = new Set<FieldKey>();
  return Object.fromEntries(
    columns.map((column, index) => {
      const match = autoMatch(column);
      if (!match || taken.has(match)) return [index, null];
      taken.add(match);
      return [index, match];
    })
  );
}

// Sample CSV for rapid 1-click testing
export const SAMPLE_ERLC_ROSTER_CSV = `Roblox Username,Roblox ID,Discord ID,Department,Rank,Callsign,Weekly Quota,Status
CaptainSterling,48291041,123456789012345678,Police,Captain,1-LINCOLN-01,12,Active
DeputyVance,91048201,390291048291029482,Sheriff,Senior Deputy,2-ADAM-24,8,Active
MedicRiley,104820194,204918204918204918,Fire & Rescue,Lieutenant,MEDIC-4,10,Active
ChiefMiller,39104820,491029482019482019,Police,Chief of Police,1-COMMAND-01,15,Active
OfficerDave,84029184,849102948102948102,Police,Officer II,1-ADAM-14,6,Active
TrooperJax,,948102948102948102,Police,State Trooper,3-VICTOR-08,8,Active
DispatcherSara,91029481,,Staff,Lead Dispatcher,DISPATCH-1,5,Active
InvalidDeptUser,71029481,102948102948102948,BurgerKing,Cashier,BK-1,0,Active
`;

export type Mapping = Record<number, FieldKey | null>;

export interface PreviewRow {
  line: number;
  values: Record<string, string>;
}

export interface ImportRefusal {
  line: number;
  message: string;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  total: number;
  refusals: ImportRefusal[];
}

export interface DataImportTabProps {
  workspace: WorkspaceBot | null;
  onImportSuccess?: (count: number) => void;
}

export function DataImportTab({ workspace: _workspace, onImportSuccess }: DataImportTabProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [table, setTable] = useState<CsvTable | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const fileInputId = useId();

  const STEPS = [
    { num: '01', title: 'File Upload', desc: 'Select or drag CSV' },
    { num: '02', title: 'Map Fields', desc: 'Align CSV columns' },
    { num: '03', title: 'Data Preview', desc: 'Verify initial rows' },
    { num: '04', title: 'Sync & Diagnostics', desc: 'Validation breakdown' },
  ];

  function loadCsvText(name: string, text: string) {
    const parsed = parseCsv(text);
    if (parsed.columns.length === 0) {
      setError(`${name} has no valid header row. Please verify your file.`);
      return;
    }
    setError(null);
    setFileName(name);
    setTable(parsed);
    setMapping(initialMapping(parsed.columns));
    setStep(1);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadCsvText(file.name, (event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadCsvText(file.name, (event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  }

  function restart() {
    setStep(0);
    setFileName(null);
    setTable(null);
    setMapping({});
    setSummary(null);
    setError(null);
  }

  function downloadSampleTemplate() {
    const blob = new Blob([SAMPLE_ERLC_ROSTER_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erlc_staff_roster_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Row Mapping logic
  const mapRows = (tbl: CsvTable, map: Mapping): PreviewRow[] => {
    const pairs = Object.entries(map)
      .filter(([, field]) => field !== null)
      .map(([index, field]) => [Number(index), field as FieldKey] as const);

    return tbl.rows.map((row, index) => ({
      line: index + 2, // Line 1 is header
      values: Object.fromEntries(pairs.map(([col, fld]) => [fld, (row[col] || '').trim()])),
    }));
  };

  const rows: PreviewRow[] = table ? mapRows(table, mapping) : [];

  const missingRequired = (): string[] => {
    const taken = new Set(Object.values(mapping).filter(Boolean));
    return FIELDS.filter((f) => f.required && !taken.has(f.key)).map((f) => f.label);
  };

  const missingList = missingRequired();

  // Execution & Validation Engine
  function runBatchImport() {
    if (!rows.length) return;

    const refusals: ImportRefusal[] = [];
    let imported = 0;

    rows.forEach((row) => {
      const v = row.values;
      const username = v.username || '';
      const robloxId = v.robloxId || '';
      const department = v.department || '';

      if (!username) {
        refusals.push({ line: row.line, message: 'Username / Name cannot be empty.' });
        return;
      }
      if (!robloxId) {
        refusals.push({ line: row.line, message: 'Roblox ID is missing or empty.' });
        return;
      }
      if (robloxId && !/^\d+$/.test(robloxId)) {
        refusals.push({ line: row.line, message: `Roblox ID "${robloxId}" must contain only digits.` });
        return;
      }
      if (!department) {
        refusals.push({ line: row.line, message: 'Department is required.' });
        return;
      }
      if (
        department &&
        !DEPARTMENTS.some((d) => d.toLowerCase() === department.toLowerCase())
      ) {
        refusals.push({
          line: row.line,
          message: `Department "${department}" is not recognized. Allowed: ${DEPARTMENTS.join(', ')}.`,
        });
        return;
      }

      imported += 1;
    });

    const sum: ImportSummary = {
      imported,
      skipped: refusals.length,
      total: rows.length,
      refusals,
    };

    setSummary(sum);
    setStep(3);
    if (onImportSuccess) {
      onImportSuccess(imported);
    }
  }

  function downloadJsonData() {
    if (!rows.length) return;
    const blob = new Blob([JSON.stringify(rows.map((r) => r.values), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName?.replace(/\.[^/.]+$/, '') || 'erlc_roster'}_imported.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyJsonToClipboard() {
    if (!rows.length) return;
    navigator.clipboard.writeText(JSON.stringify(rows.map((r) => r.values), null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="size-6 text-emerald-400" />
              <span>Server Data & Roster Import</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Bulk-intake ER:LC staff rosters, Discord member IDs, department callsigns, and weekly quotas with instant CSV validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSampleTemplate}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white h-9 px-3.5 rounded-xl gap-1.5 transition-all"
          >
            <Download className="size-3.5 text-emerald-400" />
            <span>Sample CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCsvText('sample-erlc-roster.csv', SAMPLE_ERLC_ROSTER_CSV)}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white h-9 px-3.5 rounded-xl gap-1.5 transition-all"
          >
            <Table className="size-3.5 text-cyan-400" />
            <span>Load Demo Data</span>
          </Button>

          {step > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={restart}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white h-9 px-3.5 rounded-xl gap-1.5 transition-all"
            >
              <RotateCcw className="size-3.5 text-slate-400" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {STEPS.map((s, idx) => {
          const isActive = step === idx;
          const isPassed = step > idx;
          return (
            <div
              key={s.num}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'border-white/30 bg-[#12131c] shadow-sm'
                  : isPassed
                  ? 'border-emerald-500/20 bg-[#0a0f12] text-zinc-300'
                  : 'border-white/[0.08] bg-[#11141c] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
                  {isPassed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Done
                    </span>
                  ) : (
                    <span>Step {s.num}</span>
                  )}
                </span>
                {isActive && (
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="text-xs font-bold text-white truncate">{s.title}</div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* STEP 0: FILE DROPZONE */}
      {step === 0 && (
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-white/10 hover:border-white/20 bg-black/20'
            }`}
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="size-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-300">
              <UploadCloud className="size-6 text-zinc-200" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Select or Drop your CSV file here
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed mb-4">
              Exported spreadsheet from Google Sheets, Microsoft Excel, or your Roblox CAD/MDT. Must include a header row with column designations.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/10 hover:bg-white/15 text-xs text-white h-8 px-4"
            >
              Browse Files
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span>Need a formatted file to test?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadCsvText('sample-erlc-roster.csv', SAMPLE_ERLC_ROSTER_CSV)}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 px-2.5"
            >
              Load Sample ER:LC Roster (8 rows)
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 1: COLUMN MAPPING */}
      {step === 1 && table && (
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-zinc-400" />
                <span>Map Columns to ERLC.US Attributes</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                File: <strong className="text-zinc-200">{fileName}</strong> ({table.columns.length} columns, {table.rows.length} data rows)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={restart}
                className="border-white/10 text-xs h-8 text-zinc-300"
              >
                Change File
              </Button>
              <Button
                size="sm"
                disabled={missingList.length > 0}
                onClick={() => setStep(2)}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-8 px-4 disabled:opacity-40"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Column Rows */}
          <div className="space-y-2">
            {table.columns.map((column, index) => {
              const current = mapping[index] ?? null;
              const field = FIELDS.find((f) => f.key === current);
              const sampleVal = table.rows[0]?.[index]?.trim() || '';

              return (
                <div
                  key={`${column}-${index}`}
                  className="p-3 rounded-lg border border-white/[0.06] bg-[#070709]/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {column || `Column ${index + 1}`}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-1.5 py-0.2 rounded">
                        Col {index + 1}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-1">
                      Row 1 sample: <span className="font-mono text-zinc-300">{sampleVal || '(empty)'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1 shrink-0">
                    <select
                      aria-label={`${column} maps to`}
                      value={current ?? UNMAPPED}
                      onChange={(e) => {
                        const val = e.target.value === UNMAPPED ? null : (e.target.value as FieldKey);
                        setMapping((prev) => ({ ...prev, [index]: val }));
                      }}
                      className="bg-[#12131c] border border-white/15 rounded-md text-xs text-white h-8 px-2.5 w-52 focus:outline-none focus:border-white/30"
                    >
                      <option value={UNMAPPED}>Do not import (Ignore)</option>
                      {FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} {f.required ? '*(Required)' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-zinc-400">
                      {field ? field.hint : 'This column will be omitted.'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Status footer */}
          <div className="pt-2 flex items-center justify-between text-xs">
            {missingList.length === 0 ? (
              <div className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>All required fields are mapped and ready.</span>
              </div>
            ) : (
              <div className="text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                <span>Required fields still unmapped: <strong>{missingList.join(', ')}</strong></span>
              </div>
            )}

            <Button
              size="sm"
              disabled={missingList.length > 0}
              onClick={() => setStep(2)}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-8 px-4 disabled:opacity-40"
            >
              <span>Continue to Preview</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: PREVIEW */}
      {step === 2 && table && (
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Table className="size-4 text-zinc-400" />
                <span>Preview Mapped Data</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Showing the first {Math.min(rows.length, 5)} rows of {rows.length} total rows parsed.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="border-white/10 text-xs h-8 text-zinc-300"
              >
                <ArrowLeft className="size-3.5 mr-1.5" />
                <span>Back to Mapping</span>
              </Button>
              <Button
                size="sm"
                onClick={runBatchImport}
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold h-8 px-4 shadow-sm"
              >
                <span>Confirm &amp; Import ({rows.length} Rows)</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#12131c] border-b border-white/[0.08] text-zinc-300 font-mono text-[11px]">
                  <th className="py-2.5 px-3 w-16">Line #</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="py-2.5 px-3 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] bg-[#070709]">
                {rows.slice(0, 5).map((row) => (
                  <tr key={row.line} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">{row.line}</td>
                    {FIELDS.map((f) => {
                      const val = row.values[f.key];
                      return (
                        <td key={f.key} className="py-2 px-3 whitespace-nowrap">
                          {val ? (
                            <span className="text-zinc-200">{val}</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
            <span>Validation engine ready. Clean rows will be committed to cluster storage.</span>
            <Button
              size="sm"
              onClick={runBatchImport}
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold h-8 px-5"
            >
              <span>Execute Import</span>
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: SUMMARY & REFUSALS */}
      {step === 3 && summary && (
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Import Operation Completed</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Processed {summary.total} records from {fileName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadJsonData}
                className="border-white/10 text-xs h-8 text-zinc-200"
              >
                <Download className="size-3.5 mr-1.5 text-zinc-400" />
                <span>Download JSON</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={copyJsonToClipboard}
                className="border-white/10 text-xs h-8 text-zinc-200"
              >
                {copiedJson ? (
                  <>
                    <Check className="size-3.5 mr-1.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1.5 text-zinc-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={restart}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold h-8 px-3"
              >
                <span>Import Another</span>
              </Button>
            </div>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-white/[0.08] bg-[#070709]">
              <div className="text-[11px] text-zinc-400 font-mono">TOTAL ROWS</div>
              <div className="text-2xl font-bold text-white mt-1">{summary.total}</div>
            </div>

            <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-[11px] text-emerald-400 font-mono font-semibold">SUCCESSFULLY IMPORTED</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.imported}</div>
            </div>

            <div className={`p-4 rounded-lg border ${summary.skipped > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.08] bg-[#070709]'}`}>
              <div className="text-[11px] text-zinc-400 font-mono">REFUSED / SKIPPED</div>
              <div className={`text-2xl font-bold mt-1 ${summary.skipped > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {summary.skipped}
              </div>
            </div>
          </div>

          {/* Refusal Breakdown List */}
          {summary.refusals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <AlertTriangle className="size-4" />
                <span>Refused Rows Diagnostic Log ({summary.refusals.length} entries)</span>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#070709] divide-y divide-white/[0.06] max-h-60 overflow-y-auto">
                {summary.refusals.map((r, i) => (
                  <div key={i} className="p-2.5 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                        Line {r.line}
                      </span>
                      <span className="text-zinc-200">{r.message}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-500/20 text-amber-400 text-[10px]">
                      Skipped
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.skipped === 0 && (
            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
              <div>
                <strong>Zero validation refusals!</strong> Every row in <span className="font-mono text-white">{fileName}</span> conformed strictly to the schema and has been staged into memory.
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
