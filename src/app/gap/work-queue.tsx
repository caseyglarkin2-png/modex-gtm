'use client';

/**
 * Work queue (GAP Prospecting OS, Sprint 2, S2-T11).
 *
 * Three tabs. "Queue" fetches GET /api/gap/queue with the action and lane
 * filters, renders each decision as a <DecisionCard>, and appends the next
 * page through `nextCursor`. Acting posts to
 * POST /api/gap/decisions/{id}/act and updates the card in place; a 409
 * shows "already acted" inline on that card. "In flight" is a note, not a
 * lane: the router stores skips, not decisions, for prospects already in a
 * sequence, so there is nothing to list here yet. "Enroll rows" fetches the
 * markdown from GET /api/gap/queue/enroll-rows?format=md and shows it in a
 * <pre> with a guarded Copy button.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTING_ACTIONS, ROUTING_LANES } from '@/lib/gap/taxonomy';
import { DecisionCard, type QueueItem } from '@/components/gap/decision-card';

interface QueueResponse {
  runId: string | null;
  items: QueueItem[];
  nextCursor: string | null;
}

const SELECT_CLASS = 'h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm shadow-sm';

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    // keep the HTTP status as the reason
  }
  return `HTTP ${res.status}`;
}

function queueUrl(action: string, lane: string, cursor: string | null): string {
  const params = new URLSearchParams();
  if (action) params.set('action', action);
  if (lane) params.set('lane', lane);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `/api/gap/queue?${query}` : '/api/gap/queue';
}

async function fetchQueue(action: string, lane: string, cursor: string | null): Promise<QueueResponse> {
  const res = await fetch(queueUrl(action, lane, cursor), { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as Partial<QueueResponse>;
  return {
    runId: typeof body.runId === 'string' ? body.runId : null,
    items: Array.isArray(body.items) ? body.items : [],
    nextCursor: typeof body.nextCursor === 'string' && body.nextCursor.length > 0 ? body.nextCursor : null,
  };
}

// ---------------------------------------------------------------------------
// Queue tab
// ---------------------------------------------------------------------------

function QueueTab() {
  const [action, setAction] = useState('');
  const [lane, setLane] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [actErrors, setActErrors] = useState<Record<string, string>>({});

  const loadFirst = useCallback(async (nextAction: string, nextLane: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchQueue(nextAction, nextLane, null);
      setRunId(page.runId);
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'load_failed');
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirst(action, lane);
  }, [action, lane, loadFirst]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchQueue(action, lane, nextCursor);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'load_failed');
    } finally {
      setLoadingMore(false);
    }
  }

  async function act(item: QueueItem, humanAction: string) {
    setActing(item.id);
    setActErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    try {
      const res = await fetch(`/api/gap/decisions/${encodeURIComponent(item.id)}/act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: humanAction }),
      });
      if (res.status === 409) {
        setActErrors((current) => ({ ...current, [item.id]: 'already acted' }));
        return;
      }
      if (!res.ok) {
        setActErrors((current) => ({ ...current, [item.id]: `Refused: ${res.status}` }));
        return;
      }
      const at = new Date().toISOString();
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, humanAction, humanActionAt: at } : row)),
      );
    } catch (caught) {
      setActErrors((current) => ({ ...current, [item.id]: caught instanceof Error ? caught.message : 'network_error' }));
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
          Action
          <select aria-label="Action filter" className={SELECT_CLASS} value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">all actions</option>
            {ROUTING_ACTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
          Lane
          <select aria-label="Lane filter" className={SELECT_CLASS} value={lane} onChange={(event) => setLane(event.target.value)}>
            <option value="">all lanes</option>
            {ROUTING_LANES.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <p data-testid="queue-summary" className="text-xs text-[var(--muted-foreground)]">
          {runId ? (
            <>
              run <code className="font-mono">{runId}</code>, {items.length} loaded{nextCursor ? ', more available' : ''}
            </>
          ) : loading ? (
            'loading'
          ) : (
            'no run yet'
          )}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--destructive)]">
          Could not load the queue: <code className="font-mono">{error}</code>
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">Loading decisions...</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">No decisions in the latest run. Run routing from the cron or the API.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <DecisionCard
              key={item.id}
              item={item}
              acting={acting === item.id}
              actError={actErrors[item.id] ?? null}
              onAct={(humanAction) => void act(item, humanAction)}
            />
          ))}
        </div>
      )}

      {nextCursor ? (
        <Button type="button" variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// In flight tab
// ---------------------------------------------------------------------------

function InFlightTab() {
  return (
    <div className="space-y-2 text-sm">
      <p>In-flight prospects are excluded from routing (rule R2). The router records them as skips, not decisions, so there is no list to show here.</p>
      <p className="text-[var(--muted-foreground)]">
        See the{' '}
        <Link href="/queue" className="text-[var(--primary)] hover:underline">
          Draft Queue
        </Link>{' '}
        for drafts in flight and{' '}
        <Link href="/gap/hypotheses" className="text-[var(--primary)] hover:underline">
          Hypotheses
        </Link>{' '}
        for active enrollments.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enroll rows tab
// ---------------------------------------------------------------------------

function EnrollRowsTab() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'unavailable'>('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gap/queue/enroll-rows?format=md', { cache: 'no-store' });
        if (!res.ok) throw new Error(await readError(res));
        const text = await res.text();
        if (!cancelled) setMarkdown(text);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'load_failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function copy() {
    if (markdown === null) return;
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      setCopied('unavailable');
      return;
    }
    try {
      await clipboard.writeText(markdown);
      setCopied('copied');
    } catch {
      setCopied('unavailable');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={markdown === null} onClick={() => void copy()}>
          Copy
        </Button>
        {copied === 'copied' ? <span className="text-xs text-[var(--muted-foreground)]">Copied</span> : null}
        {copied === 'unavailable' ? <span className="text-xs text-[var(--destructive)]">Clipboard unavailable, select the text instead</span> : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--destructive)]">
          Could not load enroll rows: <code className="font-mono">{error}</code>
        </p>
      ) : markdown === null ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">Loading enroll rows...</p>
      ) : markdown.trim().length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">No enroll rows in the latest run.</p>
      ) : (
        <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--muted)]/60 p-4 text-xs leading-5">{markdown}</pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function WorkQueue() {
  return (
    <Tabs defaultValue="queue">
      <TabsList aria-label="Work queue sections">
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="in-flight">In flight</TabsTrigger>
        <TabsTrigger value="enroll-rows">Enroll rows</TabsTrigger>
      </TabsList>
      <TabsContent value="queue">
        <QueueTab />
      </TabsContent>
      <TabsContent value="in-flight">
        <InFlightTab />
      </TabsContent>
      <TabsContent value="enroll-rows">
        <EnrollRowsTab />
      </TabsContent>
    </Tabs>
  );
}
