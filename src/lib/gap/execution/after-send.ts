/**
 * AFTER THE SEND, IN WORDS (R63-A S10, 2026-10-07). Pure.
 *
 * After one send to Glen the email page said "Every touch in this sequence has been sent." and "Sequence complete" for
 * a single-touch family, while Work held a follow-up for Oct 13. The family's template steps are not the whole of what
 * happens next: the send's own follow-up obligation (work/commitments.ts, the sweep) is. This says the touch sent and
 * the follow-up day, from that obligation when it is on record, else by the sweep's own rule (followUpDue), and "no
 * follow-up is open" only when the obligation was closed.
 */
import { addBusinessDays } from '../sequence/business-days';
import { SEED_DELAYS_BUSINESS_DAYS } from '../sequences/families';
import { nyDay, nyDayAt } from '../work/dates';
import { TERMINAL_STATUSES, type Commitment } from '../work/commitment-model';

const DAY_MS = 86_400_000;

/** The follow-up day after a send: the next step's delay, else the seed follow-up delay (the Work sweep's rule). */
export function followUpDue(sentAt: string | Date, next?: { delay?: { value: number; unit: string } }): Date {
  const at = new Date(sentAt);
  const due = next?.delay ? (next.delay.unit === 'calendar_days' ? new Date(at.getTime() + next.delay.value * DAY_MS) : addBusinessDays(at, next.delay.value)) : addBusinessDays(at, SEED_DELAYS_BUSINESS_DAYS[1]);
  return nyDayAt(nyDay(due));
}

export type FollowUpRead = { state: 'open'; dueAt: string } | { state: 'closed' } | null;

/** The send's follow-up obligation for this routing decision: open (with its day), closed, or not on record yet (null). */
export function followUpFor(commitments: readonly Commitment[], decisionId: string): FollowUpRead {
  const mine = commitments.filter((c) => c.kind === 'follow_up' && c.detail?.decisionId === decisionId);
  const open = mine.filter((c) => !TERMINAL_STATUSES.includes(c.status) && !!c.dueAt).sort((a, b) => String(b.dueAt).localeCompare(String(a.dueAt)))[0];
  if (open) return { state: 'open', dueAt: String(open.dueAt) };
  return mine.length ? { state: 'closed' } : null;
}

const md = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/** The blocked line under the email and the status line in the sequence section, after the family's last step. */
export function afterSendWords(x: { sent: ReadonlyArray<{ stepIndex: number; sentAt: string }>; followUp: FollowUpRead }): { blocked: string; status: string } {
  const last = [...x.sent].sort((a, b) => a.stepIndex - b.stepIndex).at(-1);
  if (!last) return { blocked: 'Nothing more to send from this card.', status: 'Nothing more to send from this card.' };
  const dueAt = x.followUp?.state === 'open' ? x.followUp.dueAt : x.followUp === null ? followUpDue(last.sentAt).toISOString() : null;
  const touch = `Touch ${last.stepIndex + 1} sent`;
  return dueAt
    ? { blocked: `${touch}; the follow-up is on ${md(dueAt)}.`, status: `The follow-up is on ${md(dueAt)}.` }
    : { blocked: `${touch}; no follow-up is open.`, status: 'No follow-up is open.' };
}
