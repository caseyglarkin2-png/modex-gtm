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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/breadcrumb';
import { ClipboardList, Smartphone, CheckCheck, Clock, ExternalLink, CloudOff, Flame, CalendarClock, Inbox } from 'lucide-react';
import { toast } from 'sonner';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseDueDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  const staticItems: QueueItem[] = staticCaptures
    .filter((c) => c.account)
    .map((c, i) => ({ _idx: i, account: c.account, contact: c.contact ?? '', due_date: c.due_date, heat_score: c.heat_score, status: c.status ?? 'Open', notes: c.notes }));

  const localItems: QueueItem[] = localCaptures
    .filter((c) => !c._synced)
    .map((c, i) => ({ _idx: 10000 + i, _localId: c._id, _synced: c._synced, account: c.account, contact: c.contact, due_date: c.due_date, heat_score: c.heat_score, status: c.status ?? 'Open', notes: c.notes }));

  const allItems: QueueItem[] = [...staticItems, ...localItems]
    .filter((c) => !doneIds.has(c._localId ?? c._idx))
    .sort((a, b) => {
      const left = parseDueDate(a.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const right = parseDueDate(b.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return (b.heat_score ?? 0) - (a.heat_score ?? 0);
    });

  const activeItems = allItems.filter((item) => !snoozedIds.has(item._localId ?? item._idx));
  const today = startOfDay(new Date());
  const endOfToday = endOfDay(today);
  const endOfWeek = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));
  const overdueItems = activeItems.filter((item) => {
    const due = parseDueDate(item.due_date);
    return due ? due.getTime() < today.getTime() : false;
  });
  const dueTodayItems = activeItems.filter((item) => {
    const due = parseDueDate(item.due_date);
    return due ? due.getTime() >= today.getTime() && due.getTime() <= endOfToday.getTime() : false;
  });
  const thisWeekItems = activeItems.filter((item) => {
    const due = parseDueDate(item.due_date);
    return due ? due.getTime() >= today.getTime() && due.getTime() <= endOfWeek.getTime() : false;
  });
  const hotItems = activeItems.filter((item) => (item.heat_score ?? 0) >= 16);

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
      if (next.has(key)) {
        next.delete(key);
        toast(`Unsnoozed: ${item.account}`);
      } else {
        next.add(key);
        toast(`Snoozed: ${item.account}`);
      }
      return next;
    });
  }

  const columns: Column<QueueItem>[] = [
    {
      key: 'account', label: 'Account', sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/accounts/${slugify(c.account)}`} className="font-medium text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>{c.account}</Link>
          {c._localId && !c._synced && <Badge variant="outline" className="gap-1 border-amber-300 text-[10px] text-amber-600"><CloudOff className="h-2.5 w-2.5" /> local</Badge>}
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
    { key: 'notes', label: 'Notes', className: 'hidden max-w-48 truncate text-xs md:table-cell' },
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
          <Button variant="ghost" size="sm" className="hidden h-7 gap-1 text-xs lg:inline-flex" onClick={() => router.push(`/accounts/${slugify(c.account)}`)}>
            <ExternalLink className="h-3.5 w-3.5" /> Account
          </Button>
        </div>
      ),
    },
  ];

  const sprintItems = [...activeItems].sort((left, right) => {
    const leftOverdue = overdueItems.some((item) => item._idx === left._idx) ? 0 : 1;
    const rightOverdue = overdueItems.some((item) => item._idx === right._idx) ? 0 : 1;
    if (leftOverdue !== rightOverdue) return leftOverdue - rightOverdue;
    return (right.heat_score ?? 0) - (left.heat_score ?? 0);
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Jake Queue' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jake Queue</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Follow-up queue. Local captures sync automatically when online.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <QueueMetricCard label="Ready to work" value={activeItems.length} tone={activeItems.length > 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'} />
        <QueueMetricCard label="Overdue" value={overdueItems.length} tone={overdueItems.length > 0 ? 'text-rose-600' : 'text-[var(--foreground)]'} />
        <QueueMetricCard label="Due today" value={dueTodayItems.length} tone={dueTodayItems.length > 0 ? 'text-amber-600' : 'text-[var(--foreground)]'} />
        <QueueMetricCard label="Hot leads" value={hotItems.length} tone={hotItems.length > 0 ? 'text-red-600' : 'text-[var(--foreground)]'} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Follow-Up Sprint Board</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Inbox className="h-3 w-3" /> {localItems.length} local capture{localItems.length === 1 ? '' : 's'}
              </Badge>
              <Link href="/capture">
                <Button size="sm" className="gap-1">
                  <Smartphone className="h-3.5 w-3.5" /> New Capture
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sprintItems.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No follow-ups are queued yet. Capture the next booth conversation or add a local note from the floor to start the sprint.
            </p>
          ) : (
            <div className="space-y-2">
              {sprintItems.map((item) => {
                const due = parseDueDate(item.due_date);
                const isOverdue = due ? due.getTime() < today.getTime() : false;
                const isToday = due ? due.getTime() >= today.getTime() && due.getTime() <= endOfToday.getTime() : false;

                return (
                  <div key={`${item._localId ?? item._idx}-${item.account}`} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/accounts/${slugify(item.account)}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                          {item.account}
                        </Link>
                        <StatusBadge status={item.status} />
                        {isOverdue ? <Badge variant="destructive">Overdue</Badge> : isToday ? <Badge variant="outline" className="text-amber-700">Due today</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.contact || 'Contact TBD'} · {item.due_date || 'No due date set'}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.notes || 'Needs follow-up note and next step.'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Flame className="h-3 w-3" /> Heat {item.heat_score ?? 0}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => snooze(item)}>Snooze</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 grid gap-2 text-xs text-[var(--muted-foreground)] sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]"><CalendarClock className="h-3.5 w-3.5" /> This week</span>
              <p className="mt-1">{thisWeekItems.length} follow-up{thisWeekItems.length === 1 ? '' : 's'} due in the next 7 days.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <span className="font-medium text-[var(--foreground)]">Snoozed</span>
              <p className="mt-1">{snoozedIds.size} item{snoozedIds.size === 1 ? '' : 's'} temporarily parked.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <span className="font-medium text-[var(--foreground)]">Offline-safe</span>
              <p className="mt-1">Local captures stay in queue until sync is confirmed.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {allItems.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Queue Empty" description="Mobile captures will appear here once created." action={<Link href="/capture" className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"><Smartphone className="h-4 w-4" /> New Capture</Link>} />
      ) : (
        <DataTable columns={columns} data={allItems} searchKey="account" searchPlaceholder="Search queue..." />
      )}
    </div>
  );
}

function QueueMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
