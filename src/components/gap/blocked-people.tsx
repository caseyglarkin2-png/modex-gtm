'use client';

/**
 * GAP contacts marked do not contact on an account's NOW view (WHO truth maintenance, 2026-10-05): said plainly,
 * never silently skipped, with the legacy suppression review one click away. UX-04: ONE line with the count and ONE
 * disclosure ("Review N flags"), instead of a link per person (five 16 px links on FedEx). The review itself decides
 * what, if anything, may be cleared; a real unsubscribe or opt-out is never cleared. Voice: no em dashes.
 */
import { useState } from 'react';
import { LegacySuppressionReview } from './legacy-suppression-review';

export function BlockedPeople({ accountName, people }: { accountName: string; people: Array<{ name: string; title: string | null; personaId: number }> }) {
  const [open, setOpen] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const n = people.length;
  return (
    <div className="mt-2 text-xs" data-testid="now-blocked">
      <p className="text-[var(--muted-foreground)]">
        Not contacted (do not contact): {n === 1 ? people[0].name : `${n} people`}.{' '}
        <button type="button" className="inline-flex min-h-6 items-center underline" aria-expanded={open} aria-controls="now-blocked-list" onClick={() => setOpen((v) => !v)} data-testid="now-review-flags">
          {open ? 'Hide the flags' : n === 1 ? 'Review the flag' : `Review ${n} flags`}
        </button>
      </p>
      <div id="now-blocked-list" hidden={!open}>
        {open ? (
          <>
            <p className="mt-1 text-[var(--muted-foreground)]">Each flag can be reviewed; a real unsubscribe or opt-out is never cleared.</p>
            <ul className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
              {people.map((b) => (
                <li key={b.personaId}>
                  <button type="button" className="inline-flex min-h-6 items-center underline" onClick={() => setReviewing((v) => (v === b.personaId ? null : b.personaId))} data-testid="now-review-suppression" data-persona={b.personaId}>
                    {reviewing === b.personaId ? `Hide the review for ${b.name}` : `${b.name}${b.title ? `, ${b.title}` : ''}`}
                  </button>
                </li>
              ))}
            </ul>
            {reviewing !== null ? <LegacySuppressionReview personaId={reviewing} name={people.find((b) => b.personaId === reviewing)?.name ?? ''} accountName={accountName} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
