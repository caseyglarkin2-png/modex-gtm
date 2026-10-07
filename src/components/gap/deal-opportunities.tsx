/**
 * THE OPPORTUNITIES AT AN ACCOUNT (GAP OS execution recovery, R50): each open HubSpot deal with ITS OWN obligations,
 * confirmed buyer words, contacts and HubSpot next step; account-level work in its own labeled group; work scoped to
 * something that is not an open deal here listed with its label. Presentational (the obligation actions are the
 * shared client control). Later Sprint 5 parts (meeting prep, the plan, the next artifact, the CRM proposals) render
 * inside a deal through `slots`.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { KIND_TEXT } from '@/lib/gap/work/commitment-model';
import type { OpportunitiesView, ScopedCommitment, ScopedNeed } from '@/lib/gap/deals/opportunities';
import { ObligationActions } from './obligation-actions';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : null);
const NEED_WORD: Record<string, string> = { current_state: 'How it runs today', business_problem: 'Problem', root_cause: 'Why it happens', impact: 'Impact', metric: 'A number they gave', priority: 'Priority', future_state: 'What good looks like', constraint: 'Requirement', objection: 'Objection' };

function Obligations({ items, testid }: { items: ScopedCommitment[]; testid: string }) {
  if (items.length === 0) return <p className="text-xs text-[var(--muted-foreground)]">No open obligations.</p>;
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.commitmentId} className="text-sm" data-testid={testid} data-commitment-id={c.commitmentId} data-phase={c.phase}>
          <p className="font-medium">
            <span className="mr-1 text-xs font-normal text-[var(--muted-foreground)]">{KIND_TEXT[c.kind]}:</span>
            {c.title}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {c.line}
            {c.scope.basis !== 'recorded' ? <span data-testid="obligation-scope"> {c.scope.label}.</span> : null}
          </p>
          {c.basis ? <p className="break-words text-xs italic text-[var(--muted-foreground)]">{c.basis}</p> : null}
          <ObligationActions commitmentId={c.commitmentId} proofNeeded={c.detail?.proofNeeded ?? null} />
        </li>
      ))}
    </ul>
  );
}

function Needs({ items, testid }: { items: ScopedNeed[]; testid: string }) {
  if (items.length === 0) return <p className="text-xs text-[var(--muted-foreground)]">Nothing confirmed from the buyer yet.</p>;
  return (
    <ul className="space-y-1">
      {items.map((b) => (
        <li key={b.id} className="text-sm" data-testid={testid}>
          <span className="mr-1 text-xs font-semibold text-[var(--muted-foreground)]">{NEED_WORD[b.type] ?? b.type}:</span>
          <q className="italic">{b.quote}</q>
          <span className="block text-xs text-[var(--muted-foreground)]">
            Buyer confirmed · {b.who} · {day(b.at)}
            {b.scope.basis === 'contact' ? ` · ${b.scope.label}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DealOpportunities({ view, slots = {} }: { view: OpportunitiesView; slots?: Record<string, ReactNode> }) {
  return (
    <section id="deal-workspace" className="space-y-3 rounded-md border border-[var(--border)] p-3 sm:p-4" data-testid="deal-opportunities" aria-labelledby="deal-opportunities-heading">
      <div>
        <h2 id="deal-opportunities-heading" className="text-base font-semibold">
          {view.deals.length === 1 ? 'The open deal' : `${view.deals.length} open deals`} at {view.accountName}
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="deal-cold-line">{view.cold}</p>
      </div>
      {view.deals.map((d) => (
        <article key={d.dealId} id={`deal-${d.dealId}`} className="space-y-2 border-t border-[var(--border)] pt-3" data-testid="deal-opportunity" data-deal-id={d.dealId}>
          <h3 className="text-sm font-semibold" data-testid="deal-name">
            {d.name ?? 'An unnamed HubSpot deal'}
            <span className="ml-1 font-normal text-[var(--muted-foreground)]">· {d.stage ?? 'stage not given'}</span>
          </h3>
          <p className="text-xs" data-testid="deal-next-step">
            {d.nextStep ? <>HubSpot next step: {d.nextStep}</> : <span className="text-[var(--muted-foreground)]">HubSpot holds no next step on this deal.</span>}
            {d.closeDate ? <span className="text-[var(--muted-foreground)]"> · close date {day(d.closeDate)}</span> : null}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]" data-testid="deal-contacts">
            {d.contacts.length ? `On the deal: ${d.contacts.map((c) => `${c.name}${c.title ? ` (${c.title})` : ''}`).join(', ')}` : 'Nobody GAP holds is a contact on this deal.'}
            {d.otherContacts > 0 ? ` and ${d.otherContacts} more HubSpot contact${d.otherContacts === 1 ? '' : 's'}` : ''}
          </p>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">This deal&apos;s obligations</h4>
            {/* R52: the plan's milestones are listed in the plan, never twice. */}
            <Obligations items={d.commitments.filter((c) => c.source.kind !== 'plan')} testid="deal-obligation" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">What they said on this deal</h4>
            <Needs items={d.needs} testid="deal-need" />
          </div>
          {slots[d.dealId] ?? null}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {d.actions.map((a) => (
              <li key={a.label}>
                {a.external ? (
                  <a href={a.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline sm:min-h-9">{a.label}</a>
                ) : (
                  <Link href={a.href} className="inline-flex min-h-11 items-center underline sm:min-h-9" data-testid="deal-action">{a.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
      {view.accountLevel.commitments.length || view.accountLevel.needs.length ? (
        <div className="space-y-2 border-t border-[var(--border)] pt-3" data-testid="deal-account-level">
          <h3 className="text-sm font-semibold">Account-level (not tied to one deal)</h3>
          {view.accountLevel.commitments.length ? <Obligations items={view.accountLevel.commitments} testid="account-level-obligation" /> : null}
          {view.accountLevel.needs.length ? <Needs items={view.accountLevel.needs} testid="account-level-need" /> : null}
        </div>
      ) : null}
      {view.elsewhere.commitments.length || view.elsewhere.needs.length ? (
        <div className="space-y-2 border-t border-[var(--border)] pt-3" data-testid="deal-elsewhere">
          <h3 className="text-sm font-semibold">Scoped elsewhere</h3>
          <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
            {view.elsewhere.commitments.map((c) => (
              <li key={c.commitmentId}>{c.scope.label}: {c.title} ({c.line.replace(/\.$/, '')})</li>
            ))}
            {view.elsewhere.needs.map((b) => (
              <li key={b.id}>{b.scope.label}: &ldquo;{b.quote}&rdquo; ({b.who})</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
