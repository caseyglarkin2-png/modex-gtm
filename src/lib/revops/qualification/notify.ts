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
