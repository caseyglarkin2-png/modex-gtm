'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMobileCaptures } from '@/lib/data';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Smartphone, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type Capture = ReturnType<typeof getMobileCaptures>[number] & { _idx: number };

const allCaptures = getMobileCaptures();

export default function QueuePage() {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<number>>(new Set());

  const captures: Capture[] = allCaptures
    .map((c, i) => ({ ...c, _idx: i }))
    .filter((c) => c.account && !doneIds.has(c._idx))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  function markDone(idx: number, label: string) {
    setDoneIds((prev) => new Set(prev).add(idx));
    toast.success(`Done: ${label}`);
  }

  function snooze(idx: number, label: string) {
    setSnoozedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) { next.delete(idx); toast(`Unsnoozed: ${label}`); }
      else { next.add(idx); toast(`Snoozed: ${label}`); }
      return next;
    });
  }

  const columns: Column<Capture>[] = [
    {
      key: 'account', label: 'Account', sortable: true,
      render: (c) => (
        <Link
          href={`/accounts/${slugify(c.account)}`}
          className="font-medium text-[var(--primary)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {c.account}
        </Link>
      ),
    },
    { key: 'contact', label: 'Contact', sortable: true },
    { key: 'due_date', label: 'Due', sortable: true, className: 'hidden sm:table-cell' },
    {
      key: 'heat_score', label: 'Heat', sortable: true,
      render: (c) => (
        <span className={`font-bold ${(c.heat_score ?? 0) >= 16 ? 'text-red-600' : (c.heat_score ?? 0) >= 12 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'}`}>
          {c.heat_score}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={c.status} />
          {snoozedIds.has(c._idx) && <Badge variant="outline" className="text-xs">Snoozed</Badge>}
        </div>
      ),
    },
    { key: 'notes', label: 'Notes', className: 'hidden md:table-cell max-w-48 truncate text-xs' },
    {
      key: '_idx', label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost" size="sm"
            className="h-7 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => markDone(c._idx, `${c.contact} @ ${c.account}`)}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Done
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => snooze(c._idx, `${c.contact} @ ${c.account}`)}
          >
            <Clock className="h-3.5 w-3.5" /> Snooze
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-7 gap-1 text-xs hidden lg:inline-flex"
            onClick={() => router.push(`/accounts/${slugify(c.account)}`)}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Account
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jake Queue</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Follow-up queue from mobile captures — open items sorted by due date.
        </p>
      </div>

      {captures.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Queue Empty"
          description="Mobile captures will appear here once created."
          action={
            <Link href="/capture" className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
              <Smartphone className="h-4 w-4" /> New Capture
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={captures}
          searchKey="account"
          searchPlaceholder="Search queue..."
        />
      )}
    </div>
  );
}
