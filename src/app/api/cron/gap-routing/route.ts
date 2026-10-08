import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { claimDailyRun, releaseDailyRun } from '@/lib/cron-idempotency';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { DEFAULT_MAX_PAIRS, createHubSpotSnapshotProvider, resolveRoutableHypothesisScope, runRouting } from '@/lib/gap/routing/run';
import { hubspotReads } from '@/lib/gap/routing/interactive';
import { createClawdSuppressionReader } from '@/lib/gap/routing/suppression-read';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-routing';
const CRON_PATH = '/api/cron/gap-routing';
/** Weekdays 10:30 UTC (6:30 am New York): before the morning briefing, after the overnight research. */
const CRON_SCHEDULE = '30 10 * * 1-5';
const ACTOR = 'cron:gap-routing';

/**
 * GET /api/cron/gap-routing   (X02, GAP OS sales execution engine, 2026-10-08)
 *
 * Routing on a schedule. The same apply-mode pass the lane's "Run routing"
 * button runs (POST /api/gap/routing/run?mode=apply with the routable
 * hypothesis scope), once per UTC day under the daily claim, so the day's
 * recommendations are never days old when the briefing reads them. Automatic,
 * reversible, INTERNAL preparation under the execution-recovery amendment 1:
 * it writes routing decisions (cards) only; it never drafts, enrolls, sends or
 * writes HubSpot (two HubSpot READS per account, as the route).
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the flags
 *   (GAP_OS_ENABLED + GAP_ROUTING_ENABLED + GAP_ROUTING_CRON_ENABLED). Off
 *   answers 200 with the skip payload so a schedule never reads as an outage.
 * - The daily claim is taken BEFORE the scope read; an empty or too-large
 *   scope and a failed run release it so a later run that day can proceed.
 *   A successful run keeps it: Vercel double-fires occasionally.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  const now = new Date();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_ROUTING_CRON_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }

  const claim = await claimDailyRun(CRON_NAME, now);
  if (!claim.claimed) {
    const reason = claim.reason ?? 'not_claimed';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
  }

  const skipWith = async (payload: Record<string, unknown>) => {
    await releaseDailyRun(CRON_NAME, now);
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: String(payload.reason) }).catch(() => undefined);
    return NextResponse.json({ skipped: true, ...payload });
  };

  try {
    const scope = await resolveRoutableHypothesisScope(prisma);
    if ('tooLarge' in scope) return await skipWith({ reason: 'routable_scope_too_large', accountCount: scope.accountCount, cap: scope.cap });
    if (scope.accountNames.length === 0) return await skipWith({ reason: 'no_routable_hypotheses' });

    const report = await runRouting(
      prisma,
      { now, actor: ACTOR, dryRun: false, maxPairs: DEFAULT_MAX_PAIRS, accountNames: scope.accountNames },
      {
        suppression: createClawdSuppressionReader(),
        hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
      },
    );
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${report.accountsScanned} accounts, ${report.decisions} recommendations, ${report.failed.length} failed`,
      stats: report as unknown as Record<string, unknown>,
    }).catch(() => undefined);
    return NextResponse.json(report);
  } catch (error) {
    await releaseDailyRun(CRON_NAME, now).catch(() => undefined);
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
