import { prisma } from '@/lib/prisma';

/**
 * Per-day idempotency guard for send-triggering crons.
 *
 * A nudged or retried dispatch (Vercel occasionally double-fires a schedule, and
 * a manual trigger can race the scheduled one) must never re-send the same batch.
 * We claim a dated run-key in SystemConfig with an atomic create: the `key` column
 * is the primary key, so a second create for the same day loses on a unique
 * constraint and the caller no-ops instead of dispatching again.
 *
 * Usage in a send path:
 *
 *   const claim = await claimDailyRun('dispatch-daily');
 *   if (!claim.claimed) return NextResponse.json({ skipped: true, reason: claim.reason });
 *   try {
 *     await dispatch();
 *   } catch (e) {
 *     await releaseDailyRun('dispatch-daily'); // let a retry proceed
 *     throw e;
 *   }
 *
 * Fail-closed: if the claim write errors for any reason other than "already
 * claimed", we still report not-claimed so the run skips rather than risking a
 * double-send. These crons are env-gated and idempotency beats a missed run.
 */

function runKey(name: string, day: string): string {
  return `cron-run:${name}:${day}`;
}

/** UTC calendar day, e.g. 2026-07-24. */
export function utcDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface ClaimResult {
  claimed: boolean;
  reason?: string;
  key: string;
}

/**
 * Atomically claim today's run for `name`. Returns `claimed: true` exactly once
 * per UTC day; every subsequent call the same day returns `claimed: false` with
 * reason `already-ran-today`.
 */
export async function claimDailyRun(name: string, now: Date = new Date()): Promise<ClaimResult> {
  const day = utcDayKey(now);
  const key = runKey(name, day);
  try {
    await prisma.systemConfig.create({
      data: { key, value: JSON.stringify({ claimedAt: now.toISOString() }) },
    });
    return { claimed: true, key };
  } catch (err: unknown) {
    // Prisma P2002 = unique constraint (the row already exists = already ran).
    const code = (err as { code?: string } | null)?.code;
    if (code === 'P2002') {
      return { claimed: false, reason: 'already-ran-today', key };
    }
    return { claimed: false, reason: 'idempotency-claim-error', key };
  }
}

/**
 * Release today's claim for `name` so a later scheduled run or retry can proceed.
 * Call this only after a dispatch FAILS, so a successful send stays de-duplicated.
 */
export async function releaseDailyRun(name: string, now: Date = new Date()): Promise<void> {
  const key = runKey(name, utcDayKey(now));
  await prisma.systemConfig.delete({ where: { key } }).catch(() => undefined);
}