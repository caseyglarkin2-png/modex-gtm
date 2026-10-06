/**
 * TODAY (GAP OS execution recovery, R45, 2026-10-06). Pure and client-safe: the small summary on Work that closes the
 * day and keeps tomorrow, derived from actual state with NO new storage:
 *
 *   done       what was completed TODAY (New York day), from the ledger and the dispositions: sends GAP proved,
 *              answers recorded, obligations done or skipped, notes saved, the seller's outcomes
 *   owed       the buyer obligations still open (promised to a buyer, asked by a buyer, a meeting to prepare, a deal
 *              step, a buyer's promise to chase), whatever their day
 *   waiting    what waits on the buyer (follow-ups not due, a buyer's promise not due, a first touch out)
 *   tomorrow   what becomes due tomorrow that is not due today (an obligation's day, a snooze coming back, a meeting
 *              on tomorrow's calendar)
 *
 * The phase of every obligation is read with the same New York rule Work uses (commitment-model.ts), so the summary,
 * Work today and Work tomorrow can never disagree about a date. Pinned by tests/unit/gap/work-today.test.ts.
 */
import { commitmentPhase, isBuyerCommitment, TERMINAL_STATUSES, type BuyerMoveSince, type Commitment } from './commitment-model';
import { addDays, nyDay, nyDayAt } from './dates';
import type { WaitingItem } from './list';

export interface DoneItem {
  at: string;
  accountName: string | null;
  line: string;
}

export interface TodaySummary {
  /** The New York day the summary is for. */
  day: string;
  done: DoneItem[];
  owed: Array<{ commitmentId: string; accountName: string; title: string; line: string }>;
  waiting: Array<{ key: string; accountName: string; title: string; line: string }>;
  tomorrow: Array<{ key: string; accountName: string; title: string; line: string }>;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

export function todaySummary(i: {
  now: Date;
  commitments: readonly Commitment[];
  done: readonly DoneItem[];
  waiting: readonly WaitingItem[];
  meetings?: ReadonlyArray<{ accountName: string; at: string; what: string }>;
  moved?: BuyerMoveSince;
}): TodaySummary {
  const today = nyDay(i.now);
  const tomorrowDay = addDays(today, 1);
  // The last minute of tomorrow (New York): what is due, or back from a snooze, at any time tomorrow, read with the
  // same rule as Work.
  const tomorrowMorning = new Date(nyDayAt(addDays(tomorrowDay, 1), 0).getTime() - 60_000);
  const open = i.commitments.filter((c) => !TERMINAL_STATUSES.includes(c.status));
  const owed = open
    .filter(isBuyerCommitment)
    .map((c) => ({ c, p: commitmentPhase(c, i.now, i.moved) }))
    .sort((a, b) => String(a.c.dueAt ?? '9999').localeCompare(String(b.c.dueAt ?? '9999')))
    .map(({ c, p }) => ({ commitmentId: c.commitmentId, accountName: c.accountName, title: c.title, line: p.line }));
  const tomorrow: TodaySummary['tomorrow'] = [];
  for (const c of open) {
    const nowPhase = commitmentPhase(c, i.now, i.moved).phase;
    if (nowPhase === 'due' || nowPhase === 'blocked') continue;
    const then = commitmentPhase(c, tomorrowMorning, i.moved);
    if (then.phase === 'due') tomorrow.push({ key: c.commitmentId, accountName: c.accountName, title: c.title, line: c.status === 'snoozed' ? 'Back tomorrow.' : c.kind === 'follow_up' ? 'Follow-up due tomorrow.' : c.kind === 'buyer_promise' ? 'Their promised day is tomorrow.' : 'Due tomorrow.' });
  }
  for (const m of i.meetings ?? []) {
    if (nyDay(m.at) !== tomorrowDay) continue;
    tomorrow.push({ key: `meeting:${m.accountName}:${m.at}`, accountName: m.accountName, title: `Meeting at ${time(m.at)}: ${m.what}`, line: 'Prepare it today or first thing.' });
  }
  const waiting = i.waiting.filter((w) => w.kind === 'follow_up' || w.kind === 'buyer_promise' || w.kind === 'motion').map((w) => ({ key: w.key, accountName: w.accountName, title: w.title, line: w.line }));
  const done = i.done.filter((d) => nyDay(d.at) === today).sort((a, b) => a.at.localeCompare(b.at));
  return { day: today, done, owed, waiting, tomorrow };
}
