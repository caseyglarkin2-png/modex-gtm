import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { DISCOVERY_ACCOUNTS_PER_RUN, runDiscovery } from '@/lib/gap/signals/discovery';
import { GROUNDED_ACCOUNTS_PER_RUN, runGroundedDiscovery } from '@/lib/gap/signals/grounded-discovery';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-signal-discovery';
const CRON_PATH = '/api/cron/gap-signal-discovery';
const CRON_SCHEDULE = '15 */2 * * *';

/**
 * GET /api/cron/gap-signal-discovery   (GAP Signal Intelligence C)
 *
 * Bounded, rotating discovery over the watched priority accounts: a few
 * high-value questions per account (Google News RSS, zero cost), captured as
 * SIGNALS through the one intake path. Strong operational stories are queued
 * for evidence research; nothing is promoted, linked, drafted or sent here.
 * Auth first, then GAP_OS_ENABLED + GAP_BACKGROUND_RESEARCH_ENABLED. `?accounts=N` (1..40).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled('GAP_BACKGROUND_RESEARCH_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const n = Number(new URL(request.url).searchParams.get('accounts'));
  try {
    // Stabilization D: the grounded source-class question first (bounded), then news with the time that is left.
    const grounded = await runGroundedDiscovery(prisma, { now: new Date(), accounts: GROUNDED_ACCOUNTS_PER_RUN, timeBudgetMs: 90_000 }).catch((e: unknown) => ({ accounts: [], skipped: [], error: e instanceof Error ? e.message : String(e) }));
    const left = Math.max(30_000, 260_000 - (Date.now() - startedAt));
    const report = await runDiscovery(prisma, { now: new Date(), accounts: Number.isInteger(n) && n > 0 ? n : DISCOVERY_ACCOUNTS_PER_RUN, timeBudgetMs: Math.min(200_000, left) });
    const captured = report.accounts.reduce((a, x) => a + x.captured, 0);
    const queued = report.accounts.reduce((a, x) => a + x.queued, 0);
    const groundedCaptured = grounded.accounts.reduce((a, x) => a + x.captured, 0);
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${report.accounts.length} of ${report.universe} watched accounts asked; ${captured} new news signals, ${queued} queued for research; ${report.skipped.length} skipped (time); grounded source classes: ${grounded.accounts.map((a) => `${a.accountName} ${a.error ? `error (${a.error.slice(0, 60)})` : `${a.captured} new`}`).join(', ') || 'none'} (${groundedCaptured} new)`,
      stats: { ...(report as unknown as Record<string, unknown>), grounded } as unknown as Record<string, unknown>,
    }).catch(() => undefined);
    return NextResponse.json({ ...report, grounded });
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
