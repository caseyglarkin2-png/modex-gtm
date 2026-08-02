/**
 * The mailbox daily ceiling for casey@freightroll.com.
 *
 * WHY THIS EXISTS (2026-08-02). modex-gtm had no daily cap, no hourly cap and
 * no mailbox quota of any kind. Seven application paths reach the Gmail wire
 * call and none of them counted a thing:
 *
 *   perform-send.ts:253 (manual /discovery + the clawd-driven draft queue),
 *   send-bulk/route.ts:208 (recipients array has .min(1) and NO .max()),
 *   process-send-jobs/route.ts:98, monday-bump/route.ts:213,
 *   engagement/thread/[id]/reply/route.ts:57, cron/daily-digest/route.ts:420,
 *   admin/gmail-token/route.ts:44.
 *
 * A `daily_cap` already existed and was DEAD CODE at send time. Defined in
 * src/lib/revops/send-strategy.ts with presets safe 120 / balanced 240 /
 * aggressive 400, validated as form input, persisted onto
 * SendJob.send_strategy - and the one place it is read back
 * (process-send-jobs/route.ts:119) destructures the strategy only to pull
 * `.workflow` for EmailLog metadata. It was configuration that looked like a
 * guard, which is worse than no guard: it is what an operator reads and
 * believes.
 *
 * The only true ceiling here is per-RECIPIENT (recipient-guard.ts, 8 sends /
 * 30 days). That is not a mailbox cap - a thousand distinct recipients is a
 * thousand sends without ever touching it - and it fails open and exempts
 * freightroll.com / yardflow.ai / dwtb.dev outright.
 *
 * THE POINT. clawd bounds this same mailbox at 40/day (the cold outreach
 * motion, OUTREACH_MAX_PER_DAY) and 200/day (V2_HARD_DAILY_CAP, the mailbox).
 * Both numbers are fiction while a second system sends into the same inbox
 * uncounted. The two systems also write to different Postgres instances -
 * modex's email_logs on `trolley`, clawd's outreach_sends on `zephyr` - so
 * neither can see the other's volume. This closes modex's half of that gap.
 * Making the count AUTHORITATIVE across both systems is the next phase; this
 * is the ceiling that stops modex being unbounded in the meantime.
 *
 * FAILS CLOSED, deliberately, and unlike every other guard in this directory.
 * recipient-guard fails open because blocking a legitimate reply on a DB
 * hiccup is the worse error there. The opposite is true of a volume ceiling on
 * a domain recovering from a reputation burn: if we cannot prove how much has
 * already gone out today, "unknown" is not "zero".
 */
import { prisma } from '@/lib/prisma';

/** Conservative default. Matches clawd's V2_HARD_DAILY_CAP for the same
 *  mailbox, so the two systems state the same mailbox ceiling even before the
 *  counter is shared. */
export const DEFAULT_DAILY_CAP = 200;

/** The literal opt-out. A kill switch that accepts "true"/"1"/"yes" gets
 *  flipped by accident and by people who think they are silencing a warning;
 *  requiring this exact phrase means disabling the ceiling is a decision
 *  somebody typed out in full. */
export const DISABLE_PHRASE = 'i-accept-an-uncapped-mailbox';

export class DailyCapExceededError extends Error {
  readonly sentToday: number;
  readonly cap: number;
  constructor(sentToday: number, cap: number, detail?: string) {
    super(
      `Daily mailbox cap reached: ${sentToday}/${cap} sends today` +
        (detail ? ` (${detail})` : '') +
        '. Raise EMAIL_DAILY_CAP or wait for the UTC day to roll.'
    );
    this.name = 'DailyCapExceededError';
    this.sentToday = sentToday;
    this.cap = cap;
  }
}

/**
 * The ceiling, read LIVE on every call so it can be lowered mid-incident
 * without a redeploy.
 *
 * A malformed value falls back to the default rather than disabling the gate,
 * and the floor is 1: a cap of 0 or negative would refuse every send, which an
 * operator reads as an outage rather than as a misconfiguration. Turning the
 * ceiling off is what DISABLE_PHRASE is for.
 */
export function dailySendCap(): number {
  const raw = (process.env.EMAIL_DAILY_CAP ?? '').trim();
  if (!raw) return DEFAULT_DAILY_CAP;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_DAILY_CAP;
  return Math.max(1, Math.floor(n));
}

export function dailyCapDisabled(): boolean {
  return (process.env.EMAIL_DAILY_CAP_DISABLED ?? '').trim() === DISABLE_PHRASE;
}

/** Midnight UTC today. UTC on purpose: clawd's counters use the UTC day too,
 *  and two systems capping one mailbox on different day boundaries would
 *  disagree for hours every day. */
function utcMidnight(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Throws DailyCapExceededError if this send would exceed the mailbox ceiling.
 * Call it at the wire, not at the route: seven paths reach the transport and
 * more will be added.
 */
export async function assertUnderDailyCap(): Promise<void> {
  if (dailyCapDisabled()) return;
  const cap = dailySendCap();

  let sentToday: number;
  try {
    sentToday = await prisma.emailLog.count({
      where: { sent_at: { gte: utcMidnight() } },
    });
  } catch (err) {
    // FAIL CLOSED. See the module docstring: an unreadable ledger means the
    // day's volume is unknown, and a recovering domain does not get the
    // benefit of the doubt.
    throw new DailyCapExceededError(
      -1,
      cap,
      `send ledger unreadable: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (sentToday >= cap) throw new DailyCapExceededError(sentToday, cap);
}
