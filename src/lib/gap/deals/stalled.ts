/**
 * STALLED DEAL WORK (GAP OS execution recovery, R55, 2026-10-06). Pure and client-safe.
 *
 * Suggestions derived only from what is on record: an obligation on the deal that is overdue (the seller's, or a
 * buyer's promise that did not arrive), HubSpot's own last activity on the deal, and a close date that passed while
 * the deal is still open. No probability, no score, no invented risk: each line says the fact and the move.
 */
import { dayLabel, nyDay } from '../work/dates';

export const STALE_ACTIVITY_DAYS = 21;
export const OVERDUE_GRACE_DAYS = 2;
const DAY_MS = 86_400_000;

/** A date HubSpot stores as UTC midnight is that calendar day (never the New York evening before); else New York. */
const calendarDay = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? d.toISOString().slice(0, 10) : nyDay(d);
};

export interface StalledInput {
  now: Date;
  deal: { name: string | null; lastActivityAt: string | null; closeDate: string | null; contact?: string | null };
  /** The deal's open obligations (status and due time as stored). */
  commitments: ReadonlyArray<{ title: string; kind: string; status: string; dueAt: string | null; person: { name: string | null; email: string | null } | null }>;
}

export function stalledSignals(i: StalledInput): string[] {
  const out: string[] = [];
  const nowMs = i.now.getTime();
  for (const c of i.commitments) {
    if (c.status === 'done' || c.status === 'skipped' || c.status === 'snoozed' || !c.dueAt) continue;
    const due = new Date(c.dueAt).getTime();
    if (!(nowMs - due > OVERDUE_GRACE_DAYS * DAY_MS)) continue;
    const when = dayLabel(nyDay(c.dueAt), i.now);
    if (c.kind === 'buyer_promise') out.push(`${c.person?.name ?? c.person?.email ?? 'They'} promised "${c.title}" by ${when}; nothing has arrived. Chase it or record what changed.`);
    else out.push(`"${c.title}" is overdue since ${when}. Do it, or tell them the new date.`);
  }
  if (i.deal.lastActivityAt) {
    const days = Math.floor((nowMs - new Date(i.deal.lastActivityAt).getTime()) / DAY_MS);
    if (days >= STALE_ACTIVITY_DAYS) out.push(`No activity on the deal in HubSpot since ${dayLabel(calendarDay(i.deal.lastActivityAt), i.now)} (${days} days). Agree the next step${i.deal.contact ? ` with ${i.deal.contact}` : ''}, or close it out.`);
  }
  if (i.deal.closeDate && new Date(i.deal.closeDate).getTime() < nowMs - DAY_MS) {
    out.push(`The close date (${dayLabel(calendarDay(i.deal.closeDate), i.now)}) has passed and the deal is still open. Confirm the real date${i.deal.contact ? ` with ${i.deal.contact}` : ''}.`);
  }
  return out;
}
