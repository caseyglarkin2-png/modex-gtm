'use client';

/**
 * THE MUTUAL ACTION PLAN for one deal (GAP OS execution recovery, R52): the agreed milestones (who, when, the buyer's
 * agreement always said, what it follows and what proves it) and GAP's proposals for the standard steps, reviewed in
 * ONE press: each the seller decides is agreed (with the seller's edits) or declined, and the rest stay proposed. A
 * proposal is never Work until it is agreed; an unknown date or person stays unknown and creates no task; the buyer's
 * agreement is recorded only when the seller names who and when. Posts to `POST /api/gap/deals/plan`, then the page
 * reloads.
 *
 * R63-B S10: every proposal arrived pre-agreed (checked) under "Proposed by GAP, not agreed by anyone yet", and the
 * button read "Record the plan (5 agreed, 0 declined)". Proposed stays proposed: nothing is decided until the seller
 * chooses Agree or Decline on it, the button counts only those choices, and only those are recorded.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { milestoneLine, type Milestone } from '@/lib/gap/deals/action-plan';
import { ObligationActions, postJson } from './obligation-actions';
import { refreshNow } from '@/components/gap/refresh-now';

const INPUT = 'min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:min-h-9';
const PRIMARY = 'inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60';
const CHOICE = 'inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm sm:min-h-9';

/** The seller's answer on one proposal: nothing until they choose. */
type Choice = 'undecided' | 'agree' | 'decline';
const CHOICES: ReadonlyArray<{ value: Choice; label: string }> = [
  { value: 'undecided', label: 'Not decided' },
  { value: 'agree', label: 'Agree' },
  { value: 'decline', label: 'Decline' },
];

/** The review button in words: only what the seller chose is counted. */
export function planReviewLabel(agreed: number, declined: number, undecided: number): string {
  if (agreed + declined === 0) return 'Record the plan (choose Agree or Decline on a step first)';
  return `Record the plan (${agreed} agreed, ${declined} declined${undecided ? `, ${undecided} still proposed` : ''})`;
}

interface Draft {
  choice: Choice;
  title: string;
  dueDay: string;
  side: '' | 'buyer' | 'seller';
  name: string;
  agreedBy: string;
  agreedOn: string;
}

export function DealPlan({ accountName, dealId, plan }: { accountName: string; dealId: string; plan: Milestone[] }) {
  const router = useRouter();
  const proposed = plan.filter((m) => m.state === 'proposed');
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(proposed.map((m) => [m.step, { choice: 'undecided' as Choice, title: m.title, dueDay: '', side: '', name: '', agreedBy: '', agreedOn: '' }])));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const set = (step: string, over: Partial<Draft>) => setDrafts((d) => ({ ...d, [step]: { ...d[step], ...over } }));
  const agreedCount = proposed.filter((m) => drafts[m.step]?.choice === 'agree').length;
  const declinedCount = proposed.filter((m) => drafts[m.step]?.choice === 'decline').length;
  const undecided = proposed.length - agreedCount - declinedCount;

  async function review() {
    // Only what the seller chose is recorded; a proposal left undecided stays proposed.
    const items = proposed.flatMap((m) => {
      const d = drafts[m.step];
      if (d.choice === 'agree') return [{ step: m.step, decision: 'agree', title: d.title.trim() || m.title, ...(d.dueDay ? { dueDay: d.dueDay } : {}), ...(d.side ? { responsible: { side: d.side, name: d.name.trim() || null } } : {}), ...(d.agreedBy.trim() && d.agreedOn ? { buyerAgreed: { by: d.agreedBy.trim(), on: d.agreedOn } } : {}) }];
      if (d.choice === 'decline') return [{ step: m.step, decision: 'decline' }];
      return [];
    });
    if (!items.length) return;
    setBusy(true);
    setStatus(null);
    const r = await postJson('/api/gap/deals/plan', { op: 'review', accountName, dealId, items });
    setBusy(false);
    if (!r.ok) {
      setStatus(`Not recorded: ${r.error}.`);
      return;
    }
    setStatus(`Recorded: ${agreedCount} agreed, ${declinedCount} declined${undecided ? `; ${undecided} still proposed` : ''}.`);
    refreshNow(router);
  }

  const agreed = plan.filter((m) => m.state === 'agreed');
  const declined = plan.filter((m) => m.state === 'declined');
  return (
    <div className="space-y-2" data-testid="deal-plan" data-deal-id={dealId}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">The plan with them</h4>
      {agreed.length ? (
        <ul className="space-y-1">
          {agreed.map((m) => (
            <li key={m.step} className="text-sm" data-testid="plan-milestone" data-step={m.step} data-phase={m.phase ?? ''}>
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-[var(--muted-foreground)]" data-testid="plan-milestone-line">{milestoneLine(m)}</p>
              {m.phase !== 'done' && m.phase !== 'skipped' ? <ObligationActions commitmentId={m.commitmentId} proofNeeded={m.proof} /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]">No milestone agreed yet.</p>
      )}
      {proposed.length ? (
        <div className="space-y-2 rounded-md border border-dashed border-[var(--border)] p-2" data-testid="deal-plan-review">
          <p className="text-xs text-[var(--muted-foreground)]">
            Proposed by GAP, not agreed by anyone yet. Agree to what fits (edit it first if you like), decline what does not, and leave the rest proposed. Leave a date or a person empty when it is not known: nothing asks you to fill it in, and the buyer&apos;s agreement stays &quot;not recorded&quot; until you say who agreed.
          </p>
          {proposed.map((m) => {
            const d = drafts[m.step];
            return (
              <fieldset key={m.step} className="space-y-1 border-t border-[var(--border)] pt-2" data-testid="plan-proposal" data-step={m.step}>
                <legend className="sr-only">{m.title}</legend>
                <input className={`${INPUT} w-full min-w-0`} value={d.title} maxLength={200} onChange={(e) => set(m.step, { title: e.target.value })} aria-label="Milestone" data-testid="plan-title" />
                <div role="radiogroup" aria-label={`Your answer on ${m.title}`} className="flex flex-wrap items-center gap-x-3" data-testid="plan-choice">
                  {CHOICES.map((c) => (
                    <label key={c.value} className={CHOICE}>
                      <input type="radio" className="h-6 w-6" name={`plan-${dealId}-${m.step}`} value={c.value} checked={d.choice === c.value} onChange={() => set(m.step, { choice: c.value })} data-testid={`plan-${c.value}`} />
                      {c.label}
                    </label>
                  ))}
                </div>
                {d.choice === 'agree' ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="flex items-center gap-1">Due <input type="date" className={INPUT} value={d.dueDay} onChange={(e) => set(m.step, { dueDay: e.target.value })} data-testid="plan-due" /></label>
                    <label className="flex items-center gap-1">
                      Who
                      <select className={INPUT} value={d.side} onChange={(e) => set(m.step, { side: e.target.value as Draft['side'] })} data-testid="plan-side">
                        <option value="">not set</option>
                        <option value="seller">You</option>
                        <option value="buyer">Their side</option>
                      </select>
                    </label>
                    {d.side ? <input className={INPUT} placeholder="Name (optional)" value={d.name} maxLength={120} onChange={(e) => set(m.step, { name: e.target.value })} aria-label="Responsible person" data-testid="plan-name" /> : null}
                    <label className="flex items-center gap-1">Buyer agreed: <input className={INPUT} placeholder="who" value={d.agreedBy} maxLength={120} onChange={(e) => set(m.step, { agreedBy: e.target.value })} aria-label="Who on their side agreed" data-testid="plan-agreed-by" /></label>
                    {d.agreedBy.trim() ? <input type="date" className={INPUT} value={d.agreedOn} onChange={(e) => set(m.step, { agreedOn: e.target.value })} aria-label="The day they agreed" data-testid="plan-agreed-on" /> : null}
                    <span className="text-[var(--muted-foreground)]">Proof: {m.proof}.</span>
                  </div>
                ) : d.choice === 'decline' ? (
                  <p className="text-xs text-[var(--muted-foreground)]">Declined: not proposed again.</p>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">Stays proposed until you decide.</p>
                )}
              </fieldset>
            );
          })}
          <button type="button" className={PRIMARY} disabled={busy || agreedCount + declinedCount === 0} onClick={() => void review()} data-testid="plan-review-submit">
            {planReviewLabel(agreedCount, declinedCount, undecided)}
          </button>
        </div>
      ) : null}
      {declined.length ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="plan-declined">Declined: {declined.map((m) => m.title.split(':')[0]).join(', ')}.</p> : null}
      {status ? <p role="status" className="text-xs" data-testid="plan-status">{status}</p> : null}
    </div>
  );
}
