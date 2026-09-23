'use client';

/**
 * Reply triage client (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Fetches GET /api/gap/replies (state filter, cursor paging) through the
 * GAP API client, renders <ReplyList>, and opens <DispositionForm> inline
 * for the clicked reply with its ids prefilled: hypothesisId, personaId,
 * contactEmail, channel `email`, source `{ kind, id }` from the reply. On a
 * 201 the row leaves the undispositioned list.
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { defaultGapApiClient, type GapApiClient, type ReplyItem, type RepliesState } from '@/lib/gap/ui/gap-api-client';
import { DispositionForm } from '@/components/gap/disposition-form';
import { ReplyList } from '@/components/gap/reply-list';

const SELECT_CLASS = 'h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm shadow-sm';

export function RepliesTriage({ client = defaultGapApiClient }: { client?: GapApiClient }) {
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
      const page = await client.listReplies({ state: nextState });
      if (page.ok) {
        setItems(page.data.items);
        setNextCursor(page.data.nextCursor);
      } else {
        setError(page.error);
        setItems([]);
        setNextCursor(null);
      }
      setLoading(false);
    },
    [client],
  );

  useEffect(() => {
    void loadFirst(state);
  }, [state, loadFirst]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const page = await client.listReplies({ state, cursor: nextCursor });
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

      <ReplyList
        items={items}
        expandedId={expandedId}
        loading={loading}
        error={error}
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
            }}
            suggestion={item.suggestion ?? null}
            onSubmitted={() => {
              if (state === 'undispositioned') {
                setItems((current) => current.filter((row) => row.id !== item.id));
                setExpandedId(null);
              }
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
