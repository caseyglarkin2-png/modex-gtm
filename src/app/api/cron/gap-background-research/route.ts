import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { BACKGROUND_DEFAULT_CAP, runBackgroundResearch } from '@/lib/gap/research/background';
import { planWorkSources } from '@/lib/gap/intake/plan';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-background-research';
const CRON_PATH = '/api/cron/gap-background-research';
// Signal Intelligence D: hourly, a few accounts each run (the per-run cap and 120s budget are unchanged).
const CRON_SCHEDULE = '40 * * * *';

/**
 * GET /api/cron/gap-background-research   (Phase 2 B1)
 *
 * Prepares the Verified Evidence Inbox before Casey opens the app: bounded,
 * deterministic evidence research over the accounts where evidence would
 * unblock the most work (src/lib/gap/research/background.ts). Research ONLY:
 * it never creates, approves, activates or links a hypothesis and never
 * routes, drafts, enrolls or sends.
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the flags
 *   (GAP_OS_ENABLED + GAP_BACKGROUND_RESEARCH_ENABLED). Off answers 200 with
 *   the skip payload so a schedule never reads as an outage.
 * - `?cap=N` (1..10) overrides the per-run account cap (default 3).
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
  const capParam = Number(new URL(request.url).searchParams.get('cap'));
  const cap = Number.isInteger(capParam) && capParam > 0 ? capParam : BACKGROUND_DEFAULT_CAP;
  try {
    // Universal Work Intake: qualify the accounts work sources brought in (account by account, bounded), so the
    // research below can pick the ones that need it. Planning failure never blocks research.
    const plan = await planWorkSources(prisma, { now: new Date(), actor: 'gap-background-plan', maxAccounts: 40, timeBudgetMs: 60_000 }).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
    const report = { ...(await runBackgroundResearch(prisma, { now: new Date(), cap })), plan };
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${report.researched.length} researched (${report.researched.map((r) => `${r.accountName}: ${r.outcome}, ${r.freshFacts} fresh`).join('; ') || 'none'}); ${report.skipped.length} skipped; ${report.failed.length} failed`,
      stats: report as unknown as Record<string, unknown>,
    }).catch(() => undefined);
    return NextResponse.json(report);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
