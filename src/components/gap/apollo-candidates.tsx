/**
 * APOLLO CANDIDATES in RESEARCH NEXT (Casey, 2026-10-03): what GAP would look up in Apollo, why, and what decision it
 * could change. Read-only: there is no button here that calls Apollo. Casey decides, and spends, outside GAP or through
 * an action Casey starts. Cost is UNKNOWN until run (Apollo does not quote it in advance).
 */
import type { ApolloCandidateView } from '@/lib/gap/people/apollo-candidates';

export function ApolloCandidatesView({ view }: { view: ApolloCandidateView }) {
  return (
    <section id="apollo-candidates" className="space-y-2" data-testid="apollo-candidates">
      <h2 className="text-lg font-semibold">Apollo lookups to consider</h2>
      <p className="text-xs text-[var(--muted-foreground)]">Casey decides. GAP never spends Apollo credits on its own; nothing here runs a lookup.</p>
      {view.candidates.length ? (
        <ul className="space-y-2">
          {view.candidates.map((c) => (
            <li key={c.key} className="rounded-md border border-[var(--border)] p-3 text-sm" data-testid="apollo-candidate" data-key={c.key}>
              <p className="font-medium">{c.target}</p>
              <dl className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[9rem_1fr]">
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Missing</dt>
                <dd>{c.missing}</dd>
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Why it matters</dt>
                <dd>{c.whyItMatters}</dd>
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Could change</dt>
                <dd>{c.decision}</dd>
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Possible match</dt>
                <dd>{c.possibleMatch ?? 'None on record'}</dd>
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Credit cost</dt>
                <dd>Unknown until run</dd>
                <dt className="text-xs font-semibold text-[var(--muted-foreground)]">Checked first</dt>
                <dd>{c.checkedFirst.join(', ')}</dd>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" data-testid="apollo-none">{view.notNeeded ?? 'No Apollo lookup would change WHO or NEXT here.'}</p>
      )}
      {view.candidates.length && view.notNeeded ? <p className="text-sm">{view.notNeeded}</p> : null}
      {view.unknownIsFine ? <p className="text-sm text-[var(--muted-foreground)]">{view.unknownIsFine}</p> : null}
    </section>
  );
}
