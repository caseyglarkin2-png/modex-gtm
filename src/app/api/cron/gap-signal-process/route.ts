import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { processSignals } from '@/lib/gap/signals/process';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-signal-process';
const CRON_PATH = '/api/cron/gap-signal-process';
const CRON_SCHEDULE = '*/30 * * * *';

/**
 * GET /api/cron/gap-signal-process   (GAP Signal Intelligence B)
 *
 * One bounded pass over captured signals: retry pages that could not be read
 * at capture (so the account can resolve), cluster sources of one event, and
 * promote signals whose story research VERIFIED into the canonical Pounce
 * spine. It never researches (background research does), never links evidence,
 * never touches a hypothesis, never drafts, enrolls or sends.
 * Auth first, then GAP_OS_ENABLED + GAP_ROUTING_ENABLED (off answers 200 with the skip payload).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  try {
    const report = await processSignals(prisma, { now: new Date() });
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${report.retried} retried (${report.resolvedOnRetry} resolved); ${report.clustered} clustered (${report.joinedEvents} joined an event); ${report.promoted} promoted; ${report.errors.length} errors`,
      stats: report as unknown as Record<string, unknown>,
    }).catch(() => undefined);
    return NextResponse.json(report);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
