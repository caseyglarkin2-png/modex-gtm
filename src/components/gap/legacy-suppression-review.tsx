'use client';

/**
 * LEGACY SUPPRESSION REVIEW, the seller's view (WHO truth, 2026-10-05). Reads the review on mount and shows WHY
 * this person is blocked (the lines and every source with its verdict), WHAT WOULD HAVE TO BE TRUE to clear it,
 * the later deliveries to the same address, and the human decisions on record. The CLEAR LEGACY LOCAL FLAG button
 * exists only when the review allows it (LEGACY_CONFLICT); the click opens an inline confirmation naming exactly
 * what it touches, and the confirm POSTs. Nothing is ever cleared without that click. Voice: no em dashes.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SuppressionReview } from '@/lib/gap/suppression/legacy-review';
import { CLASS_COPY, CLEAR_CONFIRMATION, clearOutcomeSentence, SOURCE_LABEL, VERDICT_LABEL } from '@/lib/gap/suppression/legacy-review-copy';

const day = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '');

const verdictClass: Record<SuppressionReview['sources'][number]['verdict'], string> = {
  hit: 'text-[var(--destructive)]',
  clear: 'text-emerald-700 dark:text-emerald-400',
  unknown: 'text-amber-700 dark:text-amber-400',
  not_read: 'text-[var(--muted-foreground)]',
};

export function LegacySuppressionReview({ personaId, name, accountName, onCleared }: { personaId: number; name: string; accountName: string; onCleared?: () => void }) {
  const [review, setReview] = useState<SuppressionReview | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);

  const path = `/api/gap/personas/${personaId}/suppression-review`;

  const read = useCallback(async () => {
    setLoading(true);
    setReadError(null);
    try {
      const res = await fetch(path, { cache: 'no-store' });
      const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setReview(null);
        setReadError(String(b.error ?? res.status).replace(/_/g, ' '));
        return;
      }
      setReview(b as unknown as SuppressionReview);
    } catch (e) {
      setReview(null);
      setReadError(e instanceof Error ? e.message : 'network error');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void read();
  }, [read]);

  async function confirmClear() {
    if (!review?.email) return;
    setBusy(true);
    setOutcome(null);
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmed: true, expectedEmail: review.email }) });
      const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok && b.ok === true) {
        setOutcome({ ok: true, text: clearOutcomeSentence({ ok: true, name, email: review.email }) });
        setConfirming(false);
        onCleared?.();
      } else {
        setOutcome({ ok: false, text: clearOutcomeSentence({ ok: false, reason: String(b.reason ?? res.status), detail: String(b.detail ?? b.error ?? '') }) });
        setConfirming(false);
      }
      await read();
    } catch (e) {
      setOutcome({ ok: false, text: `Kept blocked: ${e instanceof Error ? e.message : 'network error'}.` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-[var(--border)] p-3 text-xs" data-testid="suppression-review" data-persona={personaId}>
      <p className="font-medium">
        Suppression review: {name} at {accountName}
      </p>
      {loading && !review ? <p className="text-[var(--muted-foreground)]">Reading every plane for {name}...</p> : null}
      {readError ? (
        <p role="alert" className="text-[var(--destructive)]">
          The review could not be read ({readError}). Nothing is cleared without it.
        </p>
      ) : null}
      {review ? (
        <>
          <p data-testid="suppression-class">
            <span className="font-medium">{CLASS_COPY[review.class].title}.</span> {CLASS_COPY[review.class].body}
          </p>

          <section>
            <p className="font-medium">Why this person is blocked</p>
            {review.whyBlocked.length ? (
              <ul className="list-disc space-y-0.5 pl-4" data-testid="suppression-why">
                {review.whyBlocked.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted-foreground)]" data-testid="suppression-why">
                Nothing blocks {name}.
              </p>
            )}
            <table className="mt-1 w-full border-collapse text-left">
              <thead>
                <tr className="text-[var(--muted-foreground)]">
                  <th className="border-b border-[var(--border)] py-0.5 pr-2 font-normal">Source</th>
                  <th className="border-b border-[var(--border)] py-0.5 pr-2 font-normal">Verdict</th>
                  <th className="border-b border-[var(--border)] py-0.5 font-normal">Detail</th>
                </tr>
              </thead>
              <tbody>
                {review.sources.map((s) => (
                  <tr key={s.source} className="align-top">
                    <td className="py-0.5 pr-2">{SOURCE_LABEL[s.source]}</td>
                    <td className={`py-0.5 pr-2 whitespace-nowrap ${verdictClass[s.verdict]}`}>
                      {VERDICT_LABEL[s.verdict]}
                      {s.verdict === 'hit' && s.hard ? ' (hard)' : ''}
                    </td>
                    <td className="py-0.5 text-[var(--muted-foreground)]">
                      {s.detail}
                      {s.at ? ` (${day(s.at)})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <p className="font-medium">What would have to be true to clear it</p>
            {review.whatWouldClear.length ? (
              <ul className="list-disc space-y-0.5 pl-4">
                {review.whatWouldClear.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted-foreground)]">Nothing. There is no block to clear.</p>
            )}
          </section>

          {review.lastBounceAt ? (
            <section>
              <p className="font-medium">Delivered to the same address after the last bounce ({day(review.lastBounceAt)})</p>
              {review.laterDeliveries.length ? (
                <ul className="list-disc space-y-0.5 pl-4">
                  {review.laterDeliveries.map((d, i) => (
                    <li key={i}>
                      {day(d.at)}: {d.status}
                      {d.subject ? `, "${d.subject}"` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--muted-foreground)]">No delivery to this address is on record after the last bounce.</p>
              )}
            </section>
          ) : null}

          {review.humanDecisions.length ? (
            <section>
              <p className="font-medium">Human decisions on record</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {review.humanDecisions.map((d, i) => (
                  <li key={i}>
                    {day(d.at)}: {d.kind.replace(/^[a-z]+\./, '').replace(/_/g, ' ')} by {d.actor}
                    {d.note ? ` (${d.note})` : ''}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {review.clear.allowed ? (
            confirming ? (
              <div className="space-y-1 rounded-md border border-[var(--primary)] p-2" data-testid="suppression-confirm">
                <p className="font-medium">{CLEAR_CONFIRMATION}</p>
                <p className="text-[var(--muted-foreground)]">Touches: {review.clear.touches.join(', ')}. Audited under your session. The send-time gate still re-reads every plane before any email.</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={busy} onClick={() => void confirmClear()} data-testid="suppression-confirm-button">
                    {busy ? 'Clearing...' : 'Confirm clear'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)} data-testid="suppression-cancel">
                    Keep blocked
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[var(--muted-foreground)]">{review.clear.why}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)} data-testid="suppression-clear">
                  Clear legacy local flag
                </Button>
              </div>
            )
          ) : (
            <p className="text-[var(--muted-foreground)]">{review.clear.why}</p>
          )}
        </>
      ) : null}

      {outcome ? (
        <p role={outcome.ok ? 'status' : 'alert'} className={outcome.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'} data-testid="suppression-outcome">
          {outcome.text}
        </p>
      ) : null}
    </div>
  );
}
