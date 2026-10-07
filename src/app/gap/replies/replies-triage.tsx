'use client';

/**
 * Reply triage client (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Fetches GET /api/gap/replies (state filter, cursor paging) through the
 * GAP API client, renders <ReplyList>, and opens <DispositionForm> inline
 * for the clicked reply with its ids prefilled: hypothesisId, personaId,
 * contactEmail, channel `email`, source `{ kind, id }` from the reply. On a
 * 201 the row leaves the undispositioned list.
 *
 * In the cockpit REPLIES lane (`inCockpit`, 2026-09-26): the first waiting
 * reply opens on its own, the state filter is hidden (the lane IS the waiting
 * list), and a recorded disposition refreshes the page so the counts follow.
 *
 * On an account page (`account`, R60): only that account's waiting replies, the first open, no filter; a recorded
 * reply refreshes the page so NEXT, the hold and Work follow, and the seller never leaves the account to record it.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { defaultGapApiClient, type GapApiClient, type ReplyItem, type RepliesState } from '@/lib/gap/ui/gap-api-client';
import { DispositionForm } from '@/components/gap/disposition-form';
import { ReplyList } from '@/components/gap/reply-list';
import { detectNamed } from '@/lib/gap/replies/prepare';
import { parseDuePhrase } from '@/lib/gap/work/dates';
import { refreshNow } from '@/components/gap/refresh-now';

const SELECT_CLASS = 'h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm shadow-sm';

export function RepliesTriage({ client = defaultGapApiClient, inCockpit = false, account = null }: { client?: GapApiClient; inCockpit?: boolean; account?: string | null }) {
  // On an account page the list behaves like the cockpit's: the waiting replies, the first open, a refresh on record.
  const inPlace = inCockpit || !!account;
  const router = useRouter();
  const [state, setState] = useState<RepliesState>('undispositioned');
  const [items, setItems] = useState<ReplyItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFirst = useCallback(
    async (nextState: RepliesState) => {
      setLoading(true);
      setError(null);
      const page = await client.listReplies({ state: nextState, ...(account ? { account } : {}) });
      if (page.ok) {
        setItems(page.data.items);
        setNextCursor(page.data.nextCursor);
        if (inPlace && page.data.items[0]) setExpandedId((current) => current ?? page.data.items[0].id);
      } else {
        setError(page.error);
        setItems([]);
        setNextCursor(null);
      }
      setLoading(false);
    },
    [client, inPlace, account],
  );

  useEffect(() => {
    void loadFirst(state);
  }, [state, loadFirst]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const page = await client.listReplies({ state, cursor: nextCursor, ...(account ? { account } : {}) });
    if (page.ok) {
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.data.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.data.nextCursor);
    } else {
      setError(page.error);
    }
    setLoadingMore(false);
  }

  return (
    <div className="space-y-4">
      {inPlace ? null : (
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
          Show
          <select aria-label="Reply state filter" className={SELECT_CLASS} value={state} onChange={(event) => setState(event.target.value as RepliesState)}>
            <option value="undispositioned">waiting for a disposition</option>
            <option value="all">all replies</option>
          </select>
        </label>
        <p data-testid="replies-summary" className="text-xs text-[var(--muted-foreground)]">
          {loading ? 'loading' : `${items.length} loaded${nextCursor ? ', more available' : ''}`}
        </p>
      </div>
      )}

      <ReplyList
        items={items}
        expandedId={expandedId}
        loading={loading}
        error={error}
        {...(account ? { emptyText: `Nothing from ${account} is waiting to be recorded.` } : {})}
        onToggle={(item) => setExpandedId((current) => (current === item.id ? null : item.id))}
        renderExpanded={(item) => (
          <DispositionForm
            mode="reply"
            client={client}
            prefill={{
              hypothesisId: item.hypothesisId,
              personaId: item.personaId,
              contactEmail: item.contactEmail,
              channel: 'email',
              source: { kind: item.source.kind, id: item.source.id },
              problemFamily: item.hypothesisTitle ?? null,
              aiSuggestionId: item.suggestion?.id ?? null,
              // R42: who their words name and the day they name, read from the message; the seller confirms or corrects.
              referralHint: detectNamed(item.snippet),
              // Batch item 8: the day is read from when they wrote it, never from today.
              resumeHint: parseDuePhrase(item.snippet, item.receivedAt ? new Date(item.receivedAt) : new Date())?.day ?? null,
            }}
            suggestion={item.suggestion ?? null}
            onSubmitted={() => {
              if (state === 'undispositioned') {
                const rest = items.filter((row) => row.id !== item.id);
                setItems(rest);
                // In the cockpit (and on an account page) the next waiting reply opens on its own.
                setExpandedId(inPlace && rest[0] ? rest[0].id : null);
              }
              if (inPlace) refreshNow(router);
            }}
          />
        )}
      />

      {nextCursor ? (
        <Button type="button" variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}
