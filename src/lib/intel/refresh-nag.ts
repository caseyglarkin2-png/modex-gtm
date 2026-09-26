/**
 * The refresh-intel cron's nag policy, kept out of the Next route module
 * (a route file may export only its handlers and route config; exporting a
 * helper from it breaks `next build`). Pure so it is tested without a
 * database or a Slack webhook.
 */

export const STALE_DAYS = 14;

/**
 * How long to stay quiet after nagging, and how much older the bundles must get
 * before the nag is allowed to repeat sooner than that.
 *
 * Before 2026-07-30 this route held no state whatsoever. `generatedAt` comes from
 * a checked-in JSON file, so once it aged past 14 days the route posted the same
 * message to Slack EVERY MONDAY, forever, and the only way to stop it was a code
 * commit plus a deploy. That is a guaranteed permanent weekly nag, and it was a
 * large share of the recurring traffic that made #yardflow-intent unreadable.
 *
 * A staleness reminder is worth sending once. Sending it 40 times teaches the
 * reader that the channel repeats itself, which costs more than the reminder is
 * worth.
 */
const RENAG_AFTER_DAYS = 28;
const RENAG_ON_WORSENING_DAYS = 30;

export interface NagState {
  nagAgeDays: number;
  nagAt: string;
}

export function shouldNag(
  ageDays: number,
  prev: NagState | null,
  nowMs: number,
): { nag: boolean; reason: string } {
  if (ageDays < STALE_DAYS) return { nag: false, reason: 'fresh' };
  if (!prev) return { nag: true, reason: 'first-nag' };

  const daysSinceNag = Math.floor((nowMs - new Date(prev.nagAt).getTime()) / 86_400_000);
  if (Number.isNaN(daysSinceNag)) return { nag: true, reason: 'unreadable-timestamp' };
  if (daysSinceNag >= RENAG_AFTER_DAYS) {
    return { nag: true, reason: `quiet-for-${daysSinceNag}d` };
  }
  if (ageDays - prev.nagAgeDays >= RENAG_ON_WORSENING_DAYS) {
    return { nag: true, reason: `worsened-by-${ageDays - prev.nagAgeDays}d` };
  }
  return { nag: false, reason: `already-nagged-${daysSinceNag}d-ago` };
}
