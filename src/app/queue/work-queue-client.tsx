'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queueAll, queueRemove, type QueuedCapture } from '@/lib/offline-queue';
import { getMyWorkItems, type WorkQueueItem, type WorkQueueTabId, workQueueTabs } from '@/lib/work-queue';
import { AlertTriangle, ArrowRight, CheckCheck, Clock, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type WorkQueueClientProps = {
  defaultTab: WorkQueueTabId;
  initialItems: WorkQueueItem[];
};

function toSeverityTone(severity: WorkQueueItem['severity']) {
  if (severity === 'high') return 'text-red-600';
  if (severity === 'medium') return 'text-amber-600';
  return 'text-muted-foreground';
}

function localCaptureToItem(capture: QueuedCapture): WorkQueueItem {
  const accountName = capture.account || 'Unknown account';
  const accountSlug = accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const heatScore = capture.heat_score ?? 0;
  return {
    id: `local-capture-${capture._id}`,
    itemType: 'capture',
    sourceId: capture._id,
    accountName,
    accountSlug,
    title: 'Offline capture pending sync',
    detail: `${capture.contact || 'Contact TBD'} · Heat ${heatScore}/20`,
    dueAt: capture.due_date ? new Date(capture.due_date) : undefined,
    createdAt: new Date(capture._queuedAt ?? Date.now()),
    statusLabel: capture.status ?? 'Open',
    severity: heatScore >= 16 ? 'high' : heatScore >= 12 ? 'medium' : 'low',
    sourceTab: 'captures',
    quickActions: {
      completeKey: `local-capture-${capture._id}-complete`,
      snoozeKey: `local-capture-${capture._id}-snooze`,
      accountHref: `/accounts/${accountSlug}`,
    },
  };
}

export function WorkQueueClient({ defaultTab, initialItems }: WorkQueueClientProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [localCaptureItems, setLocalCaptureItems] = useState<WorkQueueItem[]>([]);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);

  useEffect(() => {
    const local = queueAll().filter((entry) => !entry._synced).map(localCaptureToItem);
    setLocalCaptureItems(local);
  }, []);

  const items = useMemo(() => (
    [...initialItems, ...localCaptureItems]
      .filter((item) => !completed.has(item.id))
      .filter((item) => !snoozed.has(item.id))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  ), [completed, initialItems, localCaptureItems, snoozed]);

  const tabItems = {
    'my-work': getMyWorkItems(items),
    'follow-ups': items.filter((item) => item.sourceTab === 'follow-ups'),
    captures: items.filter((item) => item.sourceTab === 'captures'),
    approvals: items.filter((item) => item.sourceTab === 'approvals'),
    'system-jobs': items.filter((item) => item.sourceTab === 'system-jobs'),
    'stuck-failed': items.filter((item) => item.sourceTab === 'stuck-failed' || (item.sourceTab === 'system-jobs' && item.severity === 'high')),
  } satisfies Record<WorkQueueTabId, WorkQueueItem[]>;

  const metrics = {
    total: items.length,
    myWork: tabItems['my-work'].length,
    followUps: tabItems['follow-ups'].length,
    captures: tabItems.captures.length,
    system: tabItems['system-jobs'].length,
    stuckFailed: tabItems['stuck-failed'].length,
  };

  function markComplete(item: WorkQueueItem) {
    setCompleted((prev) => new Set(prev).add(item.id));
    if (item.id.startsWith('local-capture-')) {
      const localId = item.sourceId;
      queueRemove(localId);
      setLocalCaptureItems((prev) => prev.filter((entry) => entry.sourceId !== localId));
    }
    toast.success(`Completed: ${item.title}`);
  }

  function toggleSnooze(item: WorkQueueItem) {
    setSnoozed((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        toast(`Unsnoozed: ${item.title}`);
      } else {
        next.add(item.id);
        toast(`Snoozed: ${item.title}`);
      }
      return next;
    });
  }

  async function retryItem(item: WorkQueueItem) {
    const retry = item.quickActions.retry;
    if (!retry) return;

    setRetryingKey(item.id);
    try {
      const endpoint = retry.kind === 'generation'
        ? `/api/ai/generation-jobs/${retry.id}/retry`
        : `/api/email/send-jobs/${retry.id}/retry-failed`;
      const response = await fetch(endpoint, { method: 'POST' });
      const payload = (await response.json().catch(() => ({ error: 'Unknown retry error' }))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Retry failed');
      toast.success('Retry queued');
      setCompleted((prev) => new Set(prev).add(item.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setRetryingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Work Queue' }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Queue</h1>
          <p className="text-sm text-muted-foreground">
            Unified executable work across follow-ups, captures, approvals, and system jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/capture">
            <Button size="sm" className="gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              Quick Capture
            </Button>
          </Link>
          <Link href="/queue/generations">
            <Button variant="outline" size="sm" className="gap-1.5">
              Legacy Generation Queue
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <QueueMetricCard label="Total" value={metrics.total} />
        <QueueMetricCard label="My Work" value={metrics.myWork} />
        <QueueMetricCard label="Follow-ups" value={metrics.followUps} tone={metrics.followUps > 0 ? 'text-amber-600' : 'text-foreground'} />
        <QueueMetricCard label="Captures" value={metrics.captures} />
        <QueueMetricCard label="System Jobs" value={metrics.system} />
        <QueueMetricCard label="Stuck/Failed" value={metrics.stuckFailed} tone={metrics.stuckFailed > 0 ? 'text-red-600' : 'text-foreground'} />
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {workQueueTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {workQueueTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-3">
            {tabItems[tab.id].length === 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tab.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{tab.purpose}</CardContent>
              </Card>
            ) : (
              tabItems[tab.id].map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {[
                            item.accountName,
                            item.campaignName,
                            item.dueAt ? `Due ${item.dueAt.toLocaleDateString()}` : undefined,
                            item.createdAt.toLocaleString(),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.severity === 'high' ? 'destructive' : 'outline'}>{item.statusLabel}</Badge>
                        <Badge variant="outline" className={toSeverityTone(item.severity)}>{item.itemType}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markComplete(item)}>
                        <CheckCheck className="h-3.5 w-3.5" /> Complete
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toggleSnooze(item)}>
                        <Clock className="h-3.5 w-3.5" /> Snooze
                      </Button>
                      {item.quickActions.retry ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => retryItem(item)}
                          disabled={retryingKey === item.id}
                        >
                          {retryingKey === item.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Retry
                        </Button>
                      ) : null}
                      {item.quickActions.accountHref ? (
                        <Link href={item.quickActions.accountHref}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            Open Account <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : null}
                      {item.quickActions.campaignHref ? (
                        <Link href={item.quickActions.campaignHref}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            Open Campaign <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardContent className="flex items-start gap-2 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Engagement signals now create follow-up activities that land in Work Queue / Follow-ups.
        </CardContent>
      </Card>
    </div>
  );
}

function QueueMetricCard({ label, value, tone = 'text-foreground' }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
