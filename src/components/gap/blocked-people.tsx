'use client';

/**
 * GAP contacts marked do not contact on an account's NOW view (WHO truth maintenance, 2026-10-05): said plainly,
 * never silently skipped, with the legacy suppression review one click away. The review itself decides what, if
 * anything, may be cleared; a real unsubscribe or opt-out is never cleared. Voice: no em dashes.
 */
import { useState } from 'react';
import { LegacySuppressionReview } from './legacy-suppression-review';

export function BlockedPeople({ accountName, people }: { accountName: string; people: Array<{ name: string; title: string | null; personaId: number }> }) {
  const [reviewing, setReviewing] = useState<number | null>(null);
  return (
    <div className="mt-2 text-xs" data-testid="now-blocked">
      <p className="text-[var(--muted-foreground)]">
        Not contacted (do not contact): {people.map((b) => b.name).join(', ')}. Each flag can be reviewed; a real unsubscribe or opt-out is never cleared.
      </p>
      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
        {people.map((b) => (
          <button key={b.personaId} type="button" className="inline-flex min-h-6 items-center underline" onClick={() => setReviewing((v) => (v === b.personaId ? null : b.personaId))} data-testid="now-review-suppression" data-persona={b.personaId}>
            {reviewing === b.personaId ? `Hide the review for ${b.name}` : `Review the flag on ${b.name}`}
          </button>
        ))}
      </div>
      {reviewing !== null ? <LegacySuppressionReview personaId={reviewing} name={people.find((b) => b.personaId === reviewing)?.name ?? ''} accountName={accountName} /> : null}
    </div>
  );
}
