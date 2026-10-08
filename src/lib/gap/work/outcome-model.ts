/**
 * WORK OUTCOMES, the client-safe model (R14; split out 2026-10-07 for the production build): the kinds, the shape and
 * the seller line. `work/outcome.ts` (server only) records and loads them; the Work list (a client component) reads
 * only this module, so the server path (the commitments ledger, the sequence steps hashing with node:crypto) never
 * reaches the browser bundle.
 */

export const WORK_OUTCOME = 'account.work_outcome' as const;
export type WorkOutcomeKind = 'skipped' | 'snoozed' | 'logged';
export const OUTCOME_REASON_MAX = 240;
/** A snooze may not run past this. */
export const SNOOZE_MAX_DAYS = 90;

export interface WorkOutcome {
  accountName: string;
  kind: WorkOutcomeKind;
  reason: string | null;
  /** When the card returns (ISO). */
  until: string;
  by: string;
  at: string;
}

/** The seller line: "Snoozed until Oct 9 (travel), you, Oct 6." */
export function outcomeLine(o: WorkOutcome, now: Date = new Date()): string {
  const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const who = /^casey@/i.test(o.by) ? 'you' : o.by;
  const head = o.kind === 'snoozed' ? `Snoozed until ${day(o.until)}` : o.kind === 'skipped' ? 'Skipped for today' : `Logged outside GAP${o.reason ? '' : ', back tomorrow'}`;
  const reason = o.reason ? ` (${o.reason})` : '';
  const when = new Date(o.at).toDateString() === now.toDateString() ? 'today' : day(o.at);
  return `${head}${reason}, ${who}, ${when}.`;
}
