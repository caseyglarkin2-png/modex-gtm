/**
 * Qualification run reporting.
 *
 * The per-SQL identity ping was REMOVED on 2026-07-30 (Casey's call). It posted
 * one line per promoted contact — name or raw email, company, tier, and the
 * engine's reason string — to #yardflow-intent. Two problems:
 *
 *   1. It is not actionable. Knowing that a person crossed an internal scoring
 *      threshold does not tell you what to do next. Casey's words: "dont really
 *      want to see reporting on who the sql's are but want to see what we sent
 *      them, how we are nurturing them".
 *   2. It was the loudest recurring source in the channel, so it trained the
 *      reader to skim past everything, including the pounce triggers that ARE
 *      actionable.
 *
 * The replacement is NOT a different Slack message. It is the nurture ledger in
 * the war-room morning brief — sent yesterday, who replied, what is queued next,
 * what is going cold at 14 days — because that is where send history actually
 * lives. VerdictDiff (see ./types) carries no send or touch fields at all, so no
 * message built from it could ever answer "what did we send them".
 *
 * The aggregate count survives in buildDailyStats, which now goes to the ops
 * channel. A count is a health metric; a roster of names is a to-do list nobody
 * agreed to.
 */
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';

export interface DailyStatsInput {
  scope: string;
  sinceHours?: number;
  contacts: number;
  counts: { none: number; mql: number; sql: number };
  changes: number;
  applied: number;
  promoted: number;
  newSqls: number;
  warnings: string[];
}

/**
 * Build the daily qualification health post. Pure.
 * Sent only on days with news (changes, new SQLs, or warnings) — see
 * notifyDailyStats.
 */
export function buildDailyStats(s: DailyStatsInput): string {
  const window = s.scope === 'incremental' ? ` (last ${s.sinceHours ?? '?'}h)` : ' (full sweep)';
  const lines = [
    `📊 Daily qualification run${window}`,
    `• Evaluated ${s.contacts} contacts at TAM accounts: ${s.counts.sql} sql / ${s.counts.mql} mql / ${s.counts.none} none`,
    `• ${s.changes} verdict change(s), ${s.applied} written, ${s.promoted} lifecycle promotion(s)`,
    // Count only, no roster. Said "details above" until 2026-07-30, when the
    // per-SQL identity ping it referred to was deleted; the names now live in
    // the war-room morning brief alongside what was actually sent to them.
    s.newSqls > 0
      ? `• ${s.newSqls} new SQL(s) — see the morning brief for who and what we sent them`
      : '• No new SQLs today',
  ];
  for (const w of s.warnings.slice(0, 3)) lines.push(`• ⚠️ ${w}`);
  return lines.join('\n');
}

/**
 * Post the daily stats summary to the OPS channel. Returns false when no ops
 * webhook is configured.
 *
 * Delta-gated as of 2026-07-09 (the A+ Slack pass): a zero-change day posts
 * nothing.
 *
 * Routed to 'ops' on 2026-07-30. This is the engine reporting on its own run:
 * counts evaluated, verdicts written, warnings. Useful, but it is not a thing to
 * act on, and it fired near-daily, which is exactly the traffic that taught the
 * reader to skim #yardflow-intent.
 */
export async function notifyDailyStats(s: DailyStatsInput): Promise<boolean> {
  const hasNews = s.changes > 0 || s.newSqls > 0 || s.warnings.length > 0;
  if (!hasNews) return false;
  return sendSlackNotification(buildDailyStats(s), 'ops');
}
