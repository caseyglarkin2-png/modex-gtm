/**
 * The APP-WIDE daily send ceiling for modex-gtm.
 *
 * WHY THIS EXISTS (2026-08-02). modex-gtm had no daily cap, no hourly cap and
 * no send quota of any kind. Seven application paths reach the Gmail wire call
 * and none of them counted a thing: perform-send (manual /discovery + the
 * clawd-driven draft queue), send-bulk (whose recipients array had .min(1) and
 * no .max()), process-send-jobs, monday-bump, the engagement thread reply, the
 * daily digest, and the admin gmail-token probe.
 *
 * A `daily_cap` already existed and was DEAD CODE at send time - defined in
 * src/lib/revops/send-strategy.ts, validated as form input, persisted onto
 * SendJob.send_strategy, and read back only to pull `.workflow` for EmailLog
 * metadata. Configuration that looks like a guard is worse than no guard: it is
 * what an operator reads and believes.
 *
 * APP-WIDE, NOT PER-MAILBOX. This said "the mailbox daily ceiling for
 * casey@freightroll.com" and that was false. sendViaGmail supports per-identity
 * sending and it is live: src/lib/queue/send-deps.ts resolves a draft owner's
 * own refresh token and sends as that owner, so Jake's sends land on the same
 * counter. EmailLog has no from/sender column, so a per-identity count is not
 * expressible today. Consequence to know: 200 sends by another identity will
 * block Casey's mailbox, which has sent nothing. Making this genuinely
 * per-mailbox needs a `from_email` column stamped by every writer.
 *
 * WHAT IT COUNTS. EmailLog rows for the current UTC day, EXCLUDING statuses
 * that never left the mailbox. send-bulk writes a row for every result -
 * `status: fulfilled ? 'sent' : 'failed'` - so counting rows blindly meant the
 * cap counted its OWN refusals: refuse 95, log 95 'failed', and the counter
 * ratchets up without a single message going out. Bounces still count; a bounce
 * did leave.
 *
 * FAILS CLOSED, unlike every other guard here. recipient-guard fails open so a
 * DB hiccup never blocks a legitimate reply. That reasoning inverts for a
 * volume ceiling on a domain recovering from a reputation burn: an unreadable
 * ledger means the day's volume is unknown, and unknown is not zero. The
 * marginal blast radius is nil - all seven paths already require Prisma
 * upstream of the wire (loadThread, the digest's own counts, the admin probe's
 * token read), so a total outage stops them before they reach here.
 */
import { prisma } from '@/lib/prisma';

/** Conservative default. */
export const DEFAULT_DAILY_CAP = 200;

/** The literal opt-out. A switch that accepts "true"/"1"/"yes" gets flipped by
 *  accident; requiring this exact phrase makes disabling the ceiling something
 *  somebody typed out in full. */
export const DISABLE_PHRASE = 'i-accept-an-uncapped-mailbox';

/** Statuses that did NOT put a message on the wire. See the docstring: without
 *  this the gate counts its own rejections. */
const NON_SEND_STATUSES = ['failed', 'skipped'];

/** How long a counted total may be reused before re-reading the ledger.
 *  Bounds query pressure (there is one index-less scan per read) while keeping
 *  the number fresh enough for a ceiling measured in hundreds per day. */
const MEMO_MS = 5_000;

export class DailyCapExceededError extends Error {
  readonly sentToday: number;
  readonly cap: number;
  readonly unreadable: boolean;
  constructor(sentToday: number, cap: number, unreadable = false) {
    super(
      unreadable
        ? 'Daily send ceiling: the send ledger could not be read, so today\'s ' +
          'volume is unknown. Refusing to send. (Cause logged server-side.)'
        : `Daily send ceiling reached: ${sentToday}/${cap} sends today. ` +
          'Raise EMAIL_DAILY_CAP AND REDEPLOY, or wait for the UTC day to roll.'
    );
    this.name = 'DailyCapExceededError';
    this.sentToday = sentToday;
    this.cap = cap;
    this.unreadable = unreadable;
  }
}

/**
 * The ceiling.
 *
 * Read from process.env on every call, which costs nothing - but do NOT read
 * that as "changeable without a redeploy". Vercel snapshots env at deploy time
 * (the repo's own CLAUDE.md records this), so editing EMAIL_DAILY_CAP in the
 * dashboard does nothing to the running deployment until it is redeployed. The
 * error message says so, because telling an operator mid-incident to raise a
 * variable that will appear to do nothing is worse than saying nothing.
 *
 * A malformed value falls back rather than disabling the gate. Floored at 1: a
 * cap of 0 would refuse everything, which reads as an outage rather than a
 * misconfiguration. Turning the ceiling off is what DISABLE_PHRASE is for.
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

/** Midnight UTC today. UTC on purpose: clawd's counters use the UTC day, and
 *  two systems capping one mailbox on different day boundaries would disagree
 *  for hours every day. */
export function utcMidnight(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * In-process tally.
 *
 * TWO JOBS. It bounds how often the ledger is scanned, and - more importantly -
 * it makes concurrent sends inside one invocation see each other. sendBulk
 * fires Promise.allSettled over every payload at once and send-bulk writes its
 * EmailLog rows only AFTER the whole batch resolves, so without a local tally a
 * 1,000-recipient request had all 1,000 checks read the same pre-batch total
 * and every one of them passed. The reservation below makes that batch stop at
 * the cap.
 *
 * Reserved optimistically: the tally increments before the wire, so a send that
 * then fails has still consumed a slot. That is the conservative direction for
 * a ceiling.
 */
let memo: { day: number; count: number; at: number } | null = null;

/** A single in-flight refresh, shared by every concurrent caller.
 *
 *  Without this the tally does not actually serialise anything. Fifty
 *  concurrent sends all find the memo stale, all start their own count(), and
 *  all await - so all fifty read the same pre-batch total and all fifty pass
 *  before any of them increments. The await between the read and the
 *  reservation IS the race. Sharing one promise means the ledger is read once
 *  and every caller resumes against the same tally, after which the
 *  check-and-reserve below runs with no await in between. */
let refreshing: Promise<void> | null = null;

/** Test seam. */
export function __resetDailyCapMemo(): void {
  memo = null;
  refreshing = null;
}

async function refreshTally(day: number, cap: number): Promise<void> {
  let counted: number;
  try {
    counted = await prisma.emailLog.count({
      where: {
        sent_at: { gte: new Date(day) },
        NOT: { status: { in: NON_SEND_STATUSES } },
      },
    });
  } catch (err) {
    // FAIL CLOSED, and log the cause rather than returning it: the Prisma
    // error names the datasource host, and this message reaches API clients.
    console.error('[daily-cap] send ledger unreadable, refusing send:', err);
    throw new DailyCapExceededError(-1, cap, true);
  }
  memo = { day, count: counted, at: Date.now() };
}

export async function assertUnderDailyCap(): Promise<void> {
  if (dailyCapDisabled()) return;
  const cap = dailySendCap();
  const day = utcMidnight().getTime();

  if (!memo || memo.day !== day || Date.now() - memo.at > MEMO_MS) {
    if (!refreshing) {
      refreshing = refreshTally(day, cap).finally(() => {
        refreshing = null;
      });
    }
    await refreshing;
  }

  // No await between here and the increment: concurrent callers that resumed
  // from the same refresh now reserve in turn rather than all reading a stale
  // total.
  if (!memo) throw new DailyCapExceededError(-1, cap, true);
  if (memo.count >= cap) throw new DailyCapExceededError(memo.count, cap);
  memo.count += 1;
}
