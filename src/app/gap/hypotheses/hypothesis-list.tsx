'use client';

/**
 * Hypothesis list (GAP Prospecting OS, Sprint 1, S1-T13).
 *
 * A table of hypotheses with a status filter (plain links, `?status=`), and
 * the drawer state. Clicking a row fetches the full row (signals + events)
 * from GET /api/gap/hypotheses/{id} and opens <HypothesisDrawer>. After a
 * transition the row is refetched so the drawer shows the new status and
 * the server page is refreshed so the table catches up.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HYPOTHESIS_STATUSES } from '@/lib/gap/taxonomy';
import {
  HypothesisDrawer,
  HypothesisStatusBadge,
  formatWhen,
  type HypothesisRow,
  type TransitionResponse,
} from '@/components/gap/hypothesis-drawer';

export interface HypothesisListProps {
  items: HypothesisRow[];
  status?: string | null;
  /** The status filter belongs to the full list (/gap/hypotheses); the cockpit REVIEW lane hides it. */
  showFilter?: boolean;
}

async function fetchRow(id: string): Promise<HypothesisRow> {
  const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === 'string') reason = body.error;
    } catch {
      // keep the HTTP status as the reason
    }
    throw new Error(reason);
  }
  return (await res.json()) as HypothesisRow;
}

export function HypothesisList({ items, status, showFilter = true }: HypothesisListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<HypothesisRow | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function open(row: HypothesisRow, index: number) {
    setOpening(row.id);
    setLoadError(null);
    setSelectedIndex(index);
    try {
      setSelected(await fetchRow(row.id));
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : 'load_failed');
      setSelected(row);
    } finally {
      setOpening(null);
    }
  }

  async function afterTransition(_result: TransitionResponse | null) {
    if (selected) {
      try {
        setSelected(await fetchRow(selected.id));
      } catch {
        // The drawer keeps the pre-transition row; the refresh below re-renders the table.
      }
    }
    router.refresh();
  }

  function moveTo(index: number) {
    if (index < 0 || index >= items.length) return;
    void open(items[index], index);
  }

  // Task 8: a subtle "same account, N hypotheses" cue, never a silent dedupe or a persona picked for Casey.
  const accountCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of items) counts.set(row.account_name, (counts.get(row.account_name) ?? 0) + 1);
    return counts;
  }, [items]);

  // "Review next" targets the first item still needing a decision (draft or review_required), falling back to the first item.
  const nextToReviewIndex = useMemo(() => {
    const index = items.findIndex((row) => row.status === 'draft' || row.status === 'review_required');
    return index === -1 ? 0 : index;
  }, [items]);

  return (
    <div className="space-y-4">
      {showFilter ? (
      <nav aria-label="Status filter" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/gap/hypotheses"
          className={`rounded-md border px-2.5 py-1 ${!status ? 'border-[var(--primary)] font-medium' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}
        >
          all
        </Link>
        {HYPOTHESIS_STATUSES.map((option) => (
          <Link
            key={option}
            href={`/gap/hypotheses?status=${option}`}
            className={`rounded-md border px-2.5 py-1 ${status === option ? 'border-[var(--primary)] font-medium' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}
          >
            {option.replace(/_/g, ' ')}
          </Link>
        ))}
      </nav>
      ) : null}

      {loadError ? (
        <p role="alert" className="text-sm text-[var(--destructive)]">
          Could not load the full row: <code className="font-mono">{loadError}</code>
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">No hypotheses{status ? ` in ${status.replace(/_/g, ' ')}` : ''}.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]">
              {items.length} hypothesis{items.length === 1 ? '' : 'es'}
            </p>
            <Button type="button" size="sm" onClick={() => moveTo(nextToReviewIndex)}>
              Review next
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">Signals</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, index) => {
                const signalCount = Array.isArray(row.signals) ? row.signals.length : null;
                const siblingCount = accountCounts.get(row.account_name) ?? 1;
                return (
                  <TableRow
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${row.account_name} ${row.problem_family}`}
                    className="cursor-pointer"
                    onClick={() => void open(row, index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void open(row, index);
                      }
                    }}
                  >
                    <TableCell className="font-medium">
                      {row.account_name}
                      {siblingCount > 1 ? (
                        <Badge variant="outline" className="ml-2 align-middle text-[10px]" title="Same account, multiple hypotheses (likely one per persona)">
                          {siblingCount}x this account
                        </Badge>
                      ) : null}
                      {opening === row.id ? <span className="ml-2 text-xs text-[var(--muted-foreground)]">opening...</span> : null}
                    </TableCell>
                    <TableCell>{row.problem_family.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{row.persona.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <HypothesisStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">{row.confidence}%</TableCell>
                    <TableCell className="text-right">
                      {signalCount === null ? <Badge variant="outline">open to see</Badge> : signalCount}
                    </TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{formatWhen(row.updated_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}

      {selected ? (
        <HypothesisDrawer
          hypothesis={selected}
          onClose={() => setSelected(null)}
          onTransition={(result) => void afterTransition(result)}
          onChanged={() => void afterTransition(null)}
          onPrevious={() => moveTo((selectedIndex ?? 0) - 1)}
          onNext={() => moveTo((selectedIndex ?? 0) + 1)}
          hasPrevious={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < items.length - 1}
        />
      ) : null}
    </div>
  );
}
