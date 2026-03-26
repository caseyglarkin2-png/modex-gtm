'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMobileCaptures } from '@/lib/data';
import { queueAll, queueRemove, type QueuedCapture } from '@/lib/offline-queue';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Smartphone, CheckCheck, Clock, ExternalLink, CloudOff } from 'lucide-react';
import { toast } from 'sonner';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type QueueItem = {
  _idx: number;
  _localId?: string;
  _synced?: boolean;
  account: string;
  contact: string;
  due_date?: string;
  heat_score?: number;
  status: string;
  notes?: string;
};

const staticCaptures = getMobileCaptures();

export default function QueuePage() {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState<Set<number | string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<number | string>>(new Set());
  const [localCaptures, setLocalCaptures] = useState<QueuedCapture[]>([]);

  useEffect(() => {
    setLocalCaptures(queueAll());
  }, []);

  // Build combined list: static + local-only
  const staticItems: QueueItem[] = staticCaptures
    .filter((c) => c.account)
    .map((c, i) => ({ _idx: i, account: c.account, contact: c.contact ?? '', due_date: c.due_date, heat_score: c.heat_score, status: c.status ?? 'Open', notes: c.notes }));

  const localItems: QueueItem[] = localCaptures
    .filter((c) => !c._synced)
    .map((c, i) => ({ _idx: 10000 + i, _localId: c._id, _synced: c._synced, account: c.account, contact: c.contact, due_date: c.due_date, heat_score: c.heat_score, status: c.status ?? 'Open', notes: c.notes }));

  const allItems: QueueItem[] = [...staticItems, ...localItems]
    .filter((c) => !doneIds.has(c._localId ?? c._idx))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  function markDone(item: QueueItem) {
    const key = item._localId ?? item._idx;
    setDoneIds((prev) => new Set(prev).add(key));
    if (item._localId) queueRemove(item._localId);
    toast.success(`Done: ${item.contact} @ ${item.account}`);
  }

  function snooze(item: QueueItem) {
    const key = item._localId ?? item._idx;
    setSnoozedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); toast(`Unsnoozed: ${item.account}`); }
      else { next.add(key); toast(`Snoozed: ${item.account}`); }
      return next;
    });
  }

  const columns: Column<QueueItem>[] = [
    {
      key: 'account', label: 'Account', sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/accounts/${slugify(c.account)}`} className="font-medium text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>{c.account}</Link>
          {c._localId && !c._synced && <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-300"><CloudOff className="h-2.5 w-2.5" /> local</Badge>}
        </div>
      ),
    },
    { key: 'contact', label: 'Contact', sortable: true },
    { key: 'due_date', label: 'Due', sortable: true, className: 'hidden sm:table-cell' },
    {
      key: 'heat_score', label: 'Heat', sortable: true,
      render: (c) => <span className={`font-bold ${(c.heat_score ?? 0) >= 16 ? 'text-red-600' : (c.heat_score ?? 0) >= 12 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'}`}>{c.heat_score ?? '—'}</span>,
    },
    { key: 'status', label: 'Status', sortable: true, render: (c) => <StatusBadge status={c.status} /> },
    { key: 'notes', label: 'Notes', className: 'hidden md:table-cell max-w-48 truncate text-xs' },
    {
      key: '_idx', label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => markDone(c)}>
            <CheckCheck className="h-3.5 w-3.5" /> Done
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => snooze(c)}>
            <Clock className="h-3.5 w-3.5" /> Snooze
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs hidden lg:inline-flex" onClick={() => router.push(`/accounts/${slugify(c.account)}`)}>
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
        <p className="text-sm text-[var(--muted-foreground)]">Follow-up queue. Local captures sync automatically when online.</p>
      </div>
      {allItems.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Queue Empty" description="Mobile captures will appear here once created." action={<Link href="/capture" className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"><Smartphone className="h-4 w-4" /> New Capture</Link>} />
      ) : (
        <DataTable columns={columns} data={allItems} searchKey="account" searchPlaceholder="Search queue..." />
      )}
    </div>
  );
}
