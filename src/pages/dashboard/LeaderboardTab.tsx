"use client";

import * as React from "react";
import {
  Trophy,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Hash
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/leaderboard-table-utils/data-table";

export interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  category: string;
  bumps: number;
  verifiedJoins: number;
  joinCode?: string;
  inviteUrl?: string;
}

const MEDAL: Record<number, string> = {
  1: "bg-amber-400/10 text-amber-300 ring-amber-300/30 border border-amber-400/30",
  2: "bg-zinc-100/10 text-zinc-200 ring-white/20 border border-white/20",
  3: "bg-orange-400/10 text-orange-300 ring-orange-400/30 border border-orange-400/30",
};

const columns: DataTableColumn<LeaderboardItem>[] = [
  {
    id: "rank",
    header: "#",
    sortable: true,
    numeric: true,
    align: "center",
    width: 60,
    value: (row) => row.rank,
    cell: (row) =>
      row.rank <= 3 ? (
        <span
          className={`inline-flex size-6.5 items-center justify-center rounded-full text-xs font-bold ${MEDAL[row.rank]}`}
        >
          {row.rank}
        </span>
      ) : (
        <span className="tabular-nums font-mono text-xs text-zinc-500">
          {row.rank}
        </span>
      ),
  },
  {
    id: "name",
    header: "Community / Leader",
    sortable: true,
    value: (row) => row.name,
    cell: (row) => (
      <span className="flex items-center gap-3">
        <img
          src={row.avatar}
          alt={row.name}
          loading="lazy"
          className="size-8 shrink-0 rounded-xl object-cover border border-white/10 bg-[#141416]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://cdn.discordapp.com/embed/avatars/0.png";
          }}
        />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-white text-xs">
            {row.name}
          </span>
        </span>
      </span>
    ),
  },
  {
    id: "category",
    header: "Category",
    sortable: true,
    hideBelow: "sm",
    value: (row) => row.category,
    cell: (row) => (
      <span className="text-[11px] text-zinc-400 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] font-medium">
        {row.category}
      </span>
    ),
  },
  {
    id: "bumps",
    header: "Total Bumps",
    sortable: true,
    numeric: true,
    value: (row) => row.bumps,
    cell: (row) => (
      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300 font-mono text-xs">
        <Flame className="size-3.5 text-amber-400" />
        {row.bumps.toLocaleString("en-US")}
      </span>
    ),
  },
  {
    id: "verifiedJoins",
    header: "Verified Joins",
    sortable: true,
    numeric: true,
    hideBelow: "sm",
    value: (row) => row.verifiedJoins,
    cell: (row) => (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 font-mono text-xs">
        <Check className="size-3.5 text-emerald-400" />
        {row.verifiedJoins.toLocaleString("en-US")}
      </span>
    ),
  },
  {
    id: "joinCode",
    header: "ER:LC Code",
    hideBelow: "md",
    value: (row) => row.joinCode,
    cell: (row) =>
      row.joinCode ? (
        <span className="font-mono text-[11px] text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
          {row.joinCode}
        </span>
      ) : (
        <span className="text-zinc-600 font-mono text-xs">—</span>
      ),
  },
  {
    id: "action",
    header: "",
    align: "right",
    width: 90,
    cell: (row) =>
      row.inviteUrl ? (
        <a
          href={row.inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-xl shadow-sm transition-all"
        >
          <span>Join</span>
          <ArrowUpRight className="size-3" />
        </a>
      ) : null,
  },
];

export function LeaderboardTab() {
  const [items, setItems] = React.useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch real directory servers and compute real ranks ordered by most bumps
  React.useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/directory", { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          const servers = Array.isArray(data.servers) ? data.servers : [];

          if (servers.length > 0) {
            // Sort servers strictly by most bumps first, then verified joins
            const sorted = [...servers].sort((a: any, b: any) => {
              const bumpsA = Number(a.bumps || 0);
              const bumpsB = Number(b.bumps || 0);
              if (bumpsB !== bumpsA) return bumpsB - bumpsA;
              const joinsA = Number(a.bountiesClaimed || a.memberCount || 0);
              const joinsB = Number(b.bountiesClaimed || b.memberCount || 0);
              return joinsB - joinsA;
            });

            const mapped: LeaderboardItem[] = sorted.map((s: any, idx: number) => {
              const bumps = Number(s.bumps || 0);
              const joins = Number(s.bountiesClaimed || s.memberCount || 0);

              return {
                id: String(s.id || idx),
                rank: idx + 1,
                name: s.name || `Community #${idx + 1}`,
                avatar:
                  s.iconUrl ||
                  s.icon ||
                  "https://cdn.discordapp.com/embed/avatars/0.png",
                category: s.category || "Roleplay Server",
                bumps,
                verifiedJoins: joins,
                joinCode: s.joinCode || undefined,
                inviteUrl: s.inviteUrl || undefined,
              };
            });

            if (mounted) setItems(mapped);
          } else {
            if (mounted) setItems([]);
          }
        }
      } catch (err) {
        console.warn("[LEADERBOARD] Could not fetch live directory:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Community Growth Leaderboard
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Real community rankings ordered by directory bumps and verified member activity.
          </p>
        </div>
      </div>

      {/* ── GLOBAL COMMUNITY RANKINGS DATA TABLE ── */}
      <div className="space-y-4">
        <DataTable
          data={items}
          columns={columns}
          rowId={(row) => row.id}
          rowLabel={(row) => row.name}
          title="Global Directory Rankings"
          caption="Verified server standings ordered by total bumps and community joins."
          searchPlaceholder="Search communities by name or category..."
          searchFilter={(row, q) =>
            row.name.toLowerCase().includes(q) ||
            row.category.toLowerCase().includes(q)
          }
          defaultSort={{ columnId: "rank", direction: "asc" }}
        />
      </div>
    </div>
  );
}

export default LeaderboardTab;
