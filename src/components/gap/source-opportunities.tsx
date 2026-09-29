/**
 * OPPORTUNITIES WORTH YOUR ATTENTION (Universal Work Intake): what a source
 * yielded, person by person, never generated emails. Fact-led ones carry the
 * verified fact and go through the normal gates; relationship- and
 * referral-led ones are never drafted by GAP. REVIEW opens the account's
 * section in Research, where the existing Use / Draft thesis actions live.
 * Voice: no em dashes.
 */
import Link from 'next/link';
import type { Opportunity } from '@/lib/gap/intake/opportunities';
import { SourceMemberActions } from './source-member-actions';

const APPROACH_LABEL: Record<Opportunity['approach'], string> = { fact_led: 'Fact-led', relationship_led: 'Relationship-led', referral_led: 'Referral-led', follow_up: 'Follow-up', hold: 'Not now' };

function Line({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-2 text-xs sm:grid-cols-[8rem_1fr]" data-testid={testId}>
      <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function SourceOpportunities({ items }: { items: Opportunity[] }) {
  if (!items.length) {
    return <p className="text-sm italic text-[var(--muted-foreground)]" data-testid="opportunities-empty">No opportunities yet. GAP qualifies accounts and researches them in the background; verified facts turn people into opportunities here.</p>;
  }
  return (
    <ul className="space-y-3" data-testid="opportunities">
      {items.map((o) => (
        <li key={o.memberId} className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid="opportunity" data-approach={o.approach}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              {o.person.name ?? '(no name)'}
              {o.person.title ? <span className="font-normal text-[var(--muted-foreground)]"> · {o.person.title}</span> : null}
            </p>
            <span className={`rounded px-1.5 py-0.5 text-xs ${o.approach === 'fact_led' ? 'bg-emerald-600/10 text-emerald-800' : 'bg-[var(--muted)]'}`}>{APPROACH_LABEL[o.approach]}</span>
          </div>
          <dl className="space-y-1">
            <Line label="Account">{o.account}</Line>
            <Line label="Source">
              {o.source.relationshipContext ?? o.source.name}
              {o.source.note ? <span className="text-[var(--muted-foreground)]"> · your note: {o.source.note.split('\n').pop()}</span> : null}
            </Line>
            <Line label="Why this account" testId="opportunity-fact">
              {o.fact ? (
                <>
                  &ldquo;{o.fact.quote}&rdquo; <span className="text-[var(--muted-foreground)]">({o.fact.chain})</span>
                </>
              ) : (
                <span className="text-[var(--muted-foreground)]">No verified fact yet.</span>
              )}
            </Line>
            <Line label="Thesis">{o.thesis ? <span>{o.thesis.summary} <span className="text-[var(--muted-foreground)]">(inference)</span></span> : <span className="text-[var(--muted-foreground)]">None yet.</span>}</Line>
            <Line label="Why this person">{o.whyPerson ?? <span className="text-[var(--muted-foreground)]">Title does not say; your judgment.</span>}</Line>
            <Line label="Approach" testId="opportunity-approach">{o.suggestedApproach}</Line>
            {o.learn ? <Line label="Learn">{o.learn}</Line> : null}
            {o.wrongIf ? <Line label="Wrong if">{o.wrongIf}</Line> : null}
            <Line label="Safety" testId="opportunity-safety">
              <span className={o.safety.state === 'caution' ? 'text-amber-700' : ''}>{o.safety.lines.join(' ')}</span>
            </Line>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={o.reviewHref} className="min-h-[36px] rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)]" data-testid="opportunity-review">
              Review
            </Link>
            <SourceMemberActions memberId={o.memberId} status={o.status} canResearch />
          </div>
        </li>
      ))}
    </ul>
  );
}
