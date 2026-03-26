"use client";

import * as React from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!search || !searchKey) return data;
    const lower = search.toLowerCase();
    return data.filter((item) => {
      const val = (item as Record<string, unknown>)[searchKey];
      return typeof val === "string" && val.toLowerCase().includes(lower);
    });
  }, [data, search, searchKey]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Reset focus when filtered results change
  React.useEffect(() => {
    setFocusedIndex(null);
  }, [search, sortKey, sortDir]);

  // Keyboard navigation: j/k move focus, Enter selects
  React.useEffect(() => {
    if (!onRowClick) return;
    function onKeyDown(e: KeyboardEvent) {
      // Only activate when table is in/near focus, not when user is typing in an input
      const active = document.activeElement;
      const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (isInput && active !== tableRef.current) return;
      if (!tableRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? 0 : Math.min(i + 1, sorted.length - 1)));
        tableRef.current?.focus();
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? 0 : Math.max(i - 1, 0)));
        tableRef.current?.focus();
      } else if (e.key === 'Enter' && focusedIndex !== null && onRowClick) {
        e.preventDefault();
        onRowClick(sorted[focusedIndex]);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onRowClick, sorted, focusedIndex]);

  return (
    <div className={cn("space-y-4", className)}>
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div ref={tableRef} tabIndex={onRowClick ? 0 : undefined} role="region" aria-label="Data table" className={cn("overflow-x-auto rounded-lg border border-[var(--border)] outline-none")} onFocus={() => { if (onRowClick && focusedIndex === null && sorted.length > 0) setFocusedIndex(0); }}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && "cursor-pointer select-none hover:text-[var(--foreground)]",
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown className={cn("h-3.5 w-3.5", sortKey === col.key ? "opacity-100" : "opacity-40")} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[var(--muted-foreground)]">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((item, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    focusedIndex === i && "bg-[var(--accent)] outline outline-2 outline-[var(--primary)]"
                  )}
                  onClick={onRowClick ? () => { setFocusedIndex(i); onRowClick(item); } : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as React.ReactNode) ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {sorted.length} of {data.length} results
      </p>
    </div>
  );
}
