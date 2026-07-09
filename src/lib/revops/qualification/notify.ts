/**
 * SQL promotion notifications — fires a single Slack alert to #yardflow-intent
 * whenever the qualification engine promotes contacts to SQL for the first time.
 *
 * buildSqlAlert is a pure function (no network calls) so it can be tested in
 * isolation. notifyNewSqls wraps it with the actual Slack send.
 */
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import type { VerdictDiff } from './types';

const MAX_LINES = 15;

/**
 * Build a single Slack message summarising all genuine SQL promotions in a run.
 * "Genuine" means newVerdict === 'sql' AND currentVerdict !== 'sql'.
 * Returns null if there are no such promotions (caller should skip the send).
 */
export function buildSqlAlert(rows: VerdictDiff[]): string | null {
  const promoted = rows.filter(
    (r) => r.newVerdict === 'sql' && r.currentVerdict !== 'sql',
  );
  if (promoted.length === 0) return null;

  const header = `🔥 ${promoted.length} new SQL(s) at TAM accounts`;
  const visible = promoted.slice(0, MAX_LINES);
  const overflow = promoted.length - visible.length;

  const lines = visible.map(
    (r) =>
      `• ${r.name || r.email} @ ${r.companyName} (Tier ${r.tamTier || '?'}) — ${r.reason}`,
  );

  if (overflow > 0) {
    lines.push(`…and ${overflow} more`);
  }

  return [header, ...lines].join('\n');
}

/**
 * Send a Slack alert for any genuine SQL promotions in the diff.
 * Returns false (no-op) when there are no promotions or SLACK_WEBHOOK_URL is unset.
 */
export async function notifyNewSqls(rows: VerdictDiff[]): Promise<boolean> {
  const msg = buildSqlAlert(rows);
  if (!msg) return false;
  return sendSlackNotification(msg);
}

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
 * Build the daily qualification health post for #yardflow-intent. Pure.
 * Sent only on days with news (changes, new SQLs, or warnings) — see
 * notifyDailyStats.
 */
export function buildDailyStats(s: DailyStatsInput): string {
  const window = s.scope === 'incremental' ? ` (last ${s.sinceHours ?? '?'}h)` : ' (full sweep)';
  const lines = [
    `📊 Daily qualification run${window}`,
    `• Evaluated ${s.contacts} contacts at TAM accounts: ${s.counts.sql} sql / ${s.counts.mql} mql / ${s.counts.none} none`,
    `• ${s.changes} verdict change(s), ${s.applied} written, ${s.promoted} lifecycle promotion(s)`,
    s.newSqls > 0 ? `• 🔥 ${s.newSqls} NEW SQL(s) — details above` : '• No new SQLs today',
  ];
  for (const w of s.warnings.slice(0, 3)) lines.push(`• ⚠️ ${w}`);
  return lines.join('\n');
}

/**
 * Post the daily stats summary. Returns false when SLACK_WEBHOOK_URL is unset.
 *
 * Delta-gated as of 2026-07-09 (the A+ Slack pass): a zero-change day posts
 * nothing. The channel's contract is "only messages Casey would act on"; cron
 * health is visible in Vercel, so a quiet-day heartbeat is noise, not signal.
 */
export async function notifyDailyStats(s: DailyStatsInput): Promise<boolean> {
  const hasNews = s.changes > 0 || s.newSqls > 0 || s.warnings.length > 0;
  if (!hasNews) return false;
  return sendSlackNotification(buildDailyStats(s));
}
