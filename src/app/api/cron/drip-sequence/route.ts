import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { runCampaignDripCheck } from '@/lib/campaigns/drip';
import { DRIP_SEQUENCE_ENABLED } from '@/lib/feature-flags';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  secret: z.string().min(1),
});

const CRON_NAME = 'drip-sequence';
const CRON_PATH = '/api/cron/drip-sequence';
const CRON_SCHEDULE = '0 13 * * *';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ secret: searchParams.get('secret') ?? '' });

  if (!parsed.success || parsed.data.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  if (!DRIP_SEQUENCE_ENABLED) {
    await markCronSkipped(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      reason: 'DRIP_SEQUENCE_ENABLED is false',
    }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason: 'DRIP_SEQUENCE_ENABLED is false' });
  }

  try {
    const summary = await runCampaignDripCheck();

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Checked ${summary.campaignsChecked} campaigns and queued ${summary.activitiesCreated} follow-up tasks.`,
      stats: { ...summary },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    Sentry.captureException(error);

    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);

    return NextResponse.json(
      { error: 'Campaign drip check failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
