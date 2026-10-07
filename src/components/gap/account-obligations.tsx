/**
 * THE ACCOUNT'S OBLIGATIONS (GAP OS execution recovery, R40 / R42), on the account page right after NEXT: every open
 * commitment at this account, each on its own row (two due obligations stay two), with its phase, the person, the
 * words it rests on, where it runs, and Done / Snooze / Skip. A referral shows the person they named, "named by" the
 * person who named them, with no cold action (the seller decides how to approach them). Presentational; the actions
 * are the shared client control.
 */
import Link from 'next/link';
import { KIND_TEXT, type Commitment, type PhaseRead } from '@/lib/gap/work/commitment-model';
import { ObligationActions } from './obligation-actions';

const ORDER: Record<PhaseRead['phase'], number> = { due: 0, blocked: 1, upcoming: 2, waiting: 3, snoozed: 4, done: 5, skipped: 6 };

export function AccountObligations({ items }: { items: Array<Commitment & PhaseRead & { /** R50: "Deal: X" or "account-level", when the account has open deals. */ scopeLabel?: string | null }> }) {
  const open = items.filter((c) => c.phase !== 'done' && c.phase !== 'skipped').sort((a, b) => ORDER[a.phase] - ORDER[b.phase] || String(a.dueAt ?? '').localeCompare(String(b.dueAt ?? '')));
  if (open.length === 0) return null;
  return (
    <section className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid="account-obligations" aria-labelledby="account-obligations-heading">
      <h2 id="account-obligations-heading" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Obligations here ({open.length})
      </h2>
      <ul className="space-y-2">
        {open.map((c) => (
          <li key={c.commitmentId} className="text-sm" data-testid="account-obligation" data-kind={c.kind} data-phase={c.phase}>
            <p className="font-medium">
              <span className="mr-1 text-xs font-normal text-[var(--muted-foreground)]">{KIND_TEXT[c.kind]}:</span>
              {c.title}
            </p>
            {c.scopeLabel ? <p className="text-xs font-semibold text-[var(--muted-foreground)]" data-testid="obligation-scope">{c.scopeLabel}</p> : null}
            <p className="text-xs text-[var(--muted-foreground)]">
              {c.line}
              {c.kind === 'referral' ? ' No cold email to them; you decide how to approach them.' : ''}
            </p>
            {c.basis ? <p className="break-words text-xs italic text-[var(--muted-foreground)]">{c.basis}</p> : null}
            {c.kind === 'referral' ? (
              <Link href="#people-stack-heading" className="inline-flex min-h-11 items-center text-xs underline sm:min-h-9">See the people here</Link>
            ) : null}
            <ObligationActions commitmentId={c.commitmentId} />
          </li>
        ))}
      </ul>
    </section>
  );
}
