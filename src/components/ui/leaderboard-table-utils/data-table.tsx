"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  sortable?: boolean;
  numeric?: boolean;
  align?: "left" | "center" | "right";
  width?: number | string;
  hideBelow?: "sm" | "md" | "lg";
  value?: (row: T) => any;
  cell: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowId: (row: T) => string;
  rowLabel?: (row: T) => string;
  caption?: string;
  variant?: "panel" | "striped";
  title?: string;
  defaultSort?: { columnId: string; direction: "asc" | "desc" };
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
}

export function DataTable<T>({
  data,
  columns,
  rowId,
  caption,
  variant = "panel",
  title,
  defaultSort,
  searchPlaceholder = "Search leaderboard...",
  searchFilter,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState<string | undefined>(
    defaultSort?.columnId
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    defaultSort?.direction || "asc"
  );

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (search.trim() && searchFilter) {
      result = result.filter((row) => searchFilter(row, search.trim().toLowerCase()));
    }

    if (sortColumn) {
      const col = columns.find((c) => c.id === sortColumn);
      if (col && col.value) {
        result.sort((a, b) => {
          const valA = col.value!(a);
          const valB = col.value!(b);
          if (valA === valB) return 0;
          if (valA == null) return 1;
          if (valB == null) return -1;

          if (typeof valA === "number" && typeof valB === "number") {
            return sortDirection === "asc" ? valA - valB : valB - valA;
          }

          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return sortDirection === "asc"
            ? strA.localeCompare(strB)
            : strB.localeCompare(strA);
        });
      }
    }

    return result;
  }, [data, search, searchFilter, sortColumn, sortDirection, columns]);

  return (
    <div className="w-full space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {title && (
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
            {caption && <p className="text-xs text-zinc-400">{caption}</p>}
          </div>
        )}

        <div className="relative min-w-[220px] max-w-xs ml-auto">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-8.5 pl-8 pr-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#141416]/50">
                {columns.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right" || col.numeric
                      ? "text-right"
                      : "text-left";

                  const hideClass =
                    col.hideBelow === "sm"
                      ? "hidden sm:table-cell"
                      : col.hideBelow === "md"
                      ? "hidden md:table-cell"
                      : col.hideBelow === "lg"
                      ? "hidden lg:table-cell"
                      : "";

                  return (
                    <th
                      key={col.id}
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(
                        "py-3 px-4 font-semibold text-zinc-400 select-none",
                        alignClass,
                        hideClass
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-medium",
                            alignClass === "text-right" && "ml-auto",
                            alignClass === "text-center" && "mx-auto"
                          )}
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="size-3 text-white" />
                            ) : (
                              <ArrowDown className="size-3 text-white" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 text-zinc-600 opacity-60" />
                          )}
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-zinc-500 text-xs"
                  >
                    No participants found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  const key = rowId(row);
                  const isStriped = variant === "striped" && index % 2 === 1;

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "transition-colors hover:bg-white/[0.02]",
                        isStriped && "bg-white/[0.01]"
                      )}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right" || col.numeric
                            ? "text-right"
                            : "text-left";

                        const hideClass =
                          col.hideBelow === "sm"
                            ? "hidden sm:table-cell"
                            : col.hideBelow === "md"
                            ? "hidden md:table-cell"
                            : col.hideBelow === "lg"
                            ? "hidden lg:table-cell"
                            : "";

                        return (
                          <td
                            key={col.id}
                            className={cn("py-3.5 px-4 text-zinc-300", alignClass, hideClass)}
                          >
                            {col.cell(row)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
