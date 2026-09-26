'use client';

/**
 * The cockpit's card lanes: RESEARCH, READY and FOLLOW UP (Sprint 2 S2-T11;
 * reduced 2026-09-26).
 *
 * Fetches GET /api/gap/queue (each person's current card), keeps the cards in
 * `sellerLane` (sellerLaneOf, the same function the cockpit counts with) and
 * renders each as a <DecisionCard>. The card named by `openId` renders the
 * server-built action pack (`openPanel`) inline, so READY -> SEND EMAIL ->
 * CONFIRM + SEND never leaves /gap.
 *
 * RESEARCH groups repeated work: cards at one account missing the same
 * evidence (same rule, same hypothesis) collapse into one group with one
 * FIND EVIDENCE action; the proposal it produces covers every person in the
 * group, so the result comes back to REVIEW as one shared thesis.
 *
 * Removed 2026-09-26: the "In flight" and "Enroll rows" tabs (a paragraph and
 * a markdown dump for a retired manual loop; GET /api/gap/queue/enroll-rows
 * stays for agents) and the action/lane enum filters.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DecisionCard, type QueueItem } from '@/components/gap/decision-card';
import { ResearchOutcomeContext, ResearchOutcomeView, ResearchThis, type Decided } from '@/components/gap/research-this';
import { RESEARCHABLE_RULES, cardReadiness, sellerLaneOf, type SellerLane } from '@/lib/gap/routing/card-readiness';

interface QueueResponse {
  /** Newest routing among the current cards; null only when nothing was ever routed. */
  asOf: string | null;
  items: QueueItem[];
  nextCursor: string | null;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    // keep the HTTP status as the reason
  }
  return `HTTP ${res.status}`;
}

/** The server answers a refusal with `{error: "<code>"}`; Casey never reasons from a bare status. */
const ACT_ERROR_TEXT: Record<string, string> = {
  invalid_body: 'Invalid action',
  already_acted: 'Already recorded',
  not_found: 'Not found',
  unauthenticated: 'Not signed in',
};

async function fetchQueue(cursor: string | null): Promise<QueueResponse> {
  const res = await fetch(cursor ? `/api/gap/queue?cursor=${encodeURIComponent(cursor)}` : '/api/gap/queue', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as Partial<QueueResponse>;
  return {
    asOf: typeof body.asOf === 'string' ? body.asOf : null,
    items: Array.isArray(body.items) ? body.items : [],
    nextCursor: typeof body.nextCursor === 'string' && body.nextCursor.length > 0 ? body.nextCursor : null,
  };
}

/** RESEARCH cards that share one missing piece of evidence at one account: one group, one action. */
export function groupResearch<T extends Pick<QueueItem, 'id' | 'ruleId' | 'touch' | 'account' | 'hypothesis'>>(items: readonly T[]): Array<{ key: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const shared = RESEARCHABLE_RULES.has(item.ruleId) && !item.touch;
    const key = shared ? `${item.account.name}|${item.ruleId}|${item.hypothesis?.id ?? ''}` : `one|${item.id}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].map(([key, g]) => ({ key, items: g }));
}

function ResearchGroup({ items, renderCard }: { items: QueueItem[]; renderCard: (item: QueueItem) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const first = items[0];
  const personaIds = items.map((i) => i.persona.id).filter((id): id is number => typeof id === 'number');
  const what =
    first.ruleId === 'no_hypothesis'
      ? `No thesis covers these people at ${first.account.name} yet, so there is nothing to contact them about.`
      : first.ruleId === 'evidence_thin'
        ? `The ${first.account.name} thesis rests only on an automated keyword hit. It needs one sourced, quoted fact about a site, dock or yard change.`
        : `The ${first.account.name} thesis rests on stale evidence.`;
  const readiness = cardReadiness({ ...first, action: String(first.action), touch: first.touch ?? null });
  return (
    <article data-testid="research-group" className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm shadow-sm">
      <div>
        <p className="text-base font-semibold">{first.account.name}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {items.length} people affected · {first.ruleId === 'no_hypothesis' ? 'no thesis yet' : first.ruleId === 'evidence_thin' ? 'single keyword hit' : 'stale evidence'}
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{items.map((i) => i.persona.displayName ?? i.persona.email ?? 'unknown').join(', ')}</p>
      </div>
      <p className="text-xs">{what}</p>
      {readiness.state === 'missing_prerequisite' && readiness.warning ? <p className="text-xs text-amber-700">{readiness.warning.title}</p> : null}
      <ResearchThis decisionId={first.id} personaIds={personaIds} />
      <button type="button" className="text-xs underline" onClick={() => setOpen(!open)}>
        {open ? 'Hide each person' : 'Show each person'}
      </button>
      {open ? <div className="space-y-3">{items.map(renderCard)}</div> : null}
    </article>
  );
}

export interface WorkQueueProps {
  /** Changes when a routing run lands, so the list refetches with no page reload. */
  reloadKey?: string | number;
  sellerLane?: SellerLane | null;
  /** The card whose action pack is open, and that pack (server-rendered on /gap). */
  openId?: string | null;
  openPanel?: ReactNode;
  closeHref?: string;
}

export function WorkQueue({ reloadKey, sellerLane = null, openId = null, openPanel = null, closeHref = '/gap' }: WorkQueueProps) {
  const [asOf, setAsOf] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Array<{ key: string; decided: Decided }>>([]);
  const reportOutcome = useCallback((o: { key: string; decided: Decided }) => setOutcomes((cur) => [o, ...cur.filter((x) => x.key !== o.key)]), []);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [actErrors, setActErrors] = useState<Record<string, string>>({});

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchQueue(null);
      setAsOf(page.asOf);
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
    void loadFirst();
    // reloadKey has no other use: a routing run changes it and the lane refetches.
  }, [reloadKey, loadFirst]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchQueue(nextCursor);
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
      if (!res.ok) {
        const code = await readError(res);
        setActErrors((current) => ({ ...current, [item.id]: ACT_ERROR_TEXT[code] ?? code }));
        return;
      }
      const at = new Date().toISOString();
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, humanAction, humanActionAt: at } : row)));
    } catch (caught) {
      setActErrors((current) => ({ ...current, [item.id]: caught instanceof Error ? caught.message : 'network_error' }));
    } finally {
      setActing(null);
    }
  }

  // The open card stays visible even after acting on it moves it to another lane (success never hides the result).
  const shown = sellerLane ? items.filter((item) => sellerLaneOf(item) === sellerLane || item.id === openId) : items;
  const renderCard = (item: QueueItem) => (
    <DecisionCard
      key={item.id}
      item={item}
      acting={acting === item.id}
      actError={actErrors[item.id] ?? null}
      onAct={(humanAction) => void act(item, humanAction)}
      expanded={item.id === openId ? openPanel : null}
      closeHref={closeHref}
    />
  );

  return (
    <ResearchOutcomeContext.Provider value={reportOutcome}>
      <div className="space-y-4">
        {outcomes.map((o) => (
          <div key={o.key} data-testid="research-outcome">
            <ResearchOutcomeView decided={o.decided} />
          </div>
        ))}
        {error ? (
          <p role="alert" className="text-sm text-[var(--destructive)]">
            Could not load the cards: <code className="font-mono">{error}</code>
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm italic text-[var(--muted-foreground)]">Loading...</p>
        ) : shown.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm italic text-[var(--muted-foreground)]">{asOf ? 'Nothing in this lane right now.' : 'No routing run yet.'}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              GAP routes on its own when you approve and use a thesis. Routing creates recommendations only; it does not contact anyone.
            </p>
          </div>
        ) : sellerLane === 'research' ? (
          <div className="space-y-3">
            {groupResearch(shown).map((g) => (g.items.length > 1 ? <ResearchGroup key={g.key} items={g.items} renderCard={renderCard} /> : renderCard(g.items[0])))}
          </div>
        ) : (
          <div className="space-y-3">{shown.map(renderCard)}</div>
        )}

        {nextCursor ? (
          <Button type="button" variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        ) : null}
      </div>
    </ResearchOutcomeContext.Provider>
  );
}
