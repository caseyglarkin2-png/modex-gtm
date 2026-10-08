/**
 * THE DAILY SCORECARD (X13, GAP OS sales execution engine, 2026-10-08). Pure.
 *
 * Casey asked GAP to "help me record a certain number of activity everyday". Today's counts come from the same ledger
 * read the Today panel makes (work/day-load.ts loadCompletedToday), where each done item carries the ACTIVITY it counts
 * as; the targets come from the seller settings (work/settings.ts). Navigation counts nothing; a set-aside counts
 * nothing; a seller's Done by word counts, as the Today panel already shows it. The scorecard sets the count beside
 * the target with the gap, and says plainly when no target is set.
 */
import { TARGET_KINDS, type TargetKind } from './settings';
import type { DoneItem } from './today';

export const TARGET_LABELS: Record<TargetKind, string> = {
  first_touches: 'First touches',
  follow_ups: 'Follow-ups',
  calls: 'Calls',
  replies_handled: 'Replies handled',
  deal_steps: 'Deal steps',
  meetings_booked: 'Meetings booked',
};

/** The lowercase words for a remaining count ("4 first touches"). */
export const TARGET_WORDS: Record<TargetKind, [string, string]> = {
  first_touches: ['first touch', 'first touches'],
  follow_ups: ['follow-up', 'follow-ups'],
  calls: ['call', 'calls'],
  replies_handled: ['reply handled', 'replies handled'],
  deal_steps: ['deal step', 'deal steps'],
  meetings_booked: ['meeting booked', 'meetings booked'],
};

export interface ScorecardRow {
  kind: TargetKind;
  label: string;
  count: number;
  target: number | null;
  /** How many more to reach the target today; null without a target; 0 when met. */
  remaining: number | null;
}

export function scorecard(done: readonly DoneItem[], targets: Partial<Record<TargetKind, number>>): ScorecardRow[] {
  const counts = new Map<TargetKind, number>();
  for (const d of done) {
    if (d.kind === 'set_aside' || !d.activity) continue;
    counts.set(d.activity, (counts.get(d.activity) ?? 0) + 1);
  }
  return TARGET_KINDS.map((kind) => {
    const count = counts.get(kind) ?? 0;
    const target = typeof targets[kind] === 'number' ? (targets[kind] as number) : null;
    return { kind, label: TARGET_LABELS[kind], count, target, remaining: target === null ? null : Math.max(0, target - count) };
  });
}

/** "4 first touches and 2 calls to go", or null when every target is met or none is set. */
export function remainingLine(rows: readonly ScorecardRow[]): string | null {
  const parts = rows.filter((r) => r.remaining !== null && r.remaining > 0).map((r) => `${r.remaining} ${TARGET_WORDS[r.kind][r.remaining === 1 ? 0 : 1]}`);
  if (!parts.length) return null;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `${list} to go`;
}
