import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { claimDailyRun, releaseDailyRun } from '@/lib/cron-idempotency';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import {
  DEFAULT_LOOKBACK_DAYS,
  DEFAULT_MAX_ACCOUNTS,
  runHypothesize,
} from '@/lib/gap/hypothesis/hypothesize';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-hypothesize';
const CRON_PATH = '/api/cron/gap-hypothesize';
// Not in vercel.json until the Sprint 2 review. Manual trigger only for any
// holder of CRON_SECRET; the string mirrors cron-monitor's convention for
// routes that exist but are not scheduled.
const CRON_SCHEDULE = 'unregistered (manual only)';

const MAX_LOOKBACK_DAYS = 365;
const MAX_ACCOUNTS_CAP = 500;

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * GAP hypothesize cron (S1-T12): pounce triggers to registered signals to
 * draft hypotheses, one run per UTC day.
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the GAP
 *   flags. A scheduled run with the feature off answers 200 with the skip
 *   payload so the schedule never reads as an outage.
 * - mode: Vercel-SCHEDULED invocations (Bearer auth, no explicit mode) apply.
 *   Manual calls default to dry run; pass ?mode=apply to write. ?dryRun=1
 *   forces a dry run in every case. Same convention as /api/cron/qualification.
 * - Idempotency: an apply run claims the day via claimDailyRun. A dry run
 *   writes no hypothesis, so it does not claim (a manual rehearsal must not
 *   block the real run). ?force=1 bypasses the claim; the secret already
 *   matched by then, so only a holder of CRON_SECRET can force.
 * - lookbackDays (default 30, 1..365) and maxAccounts (default 50, 1..500)
 *   are query-tunable.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const modeParam = url.searchParams.get('mode');
  const isScheduled = (request.headers.get('authorization') ?? '').startsWith('Bearer ') && !modeParam;
  const dryRun = url.searchParams.get('dryRun') === '1' || (modeParam !== 'apply' && !isScheduled);
  const mode = dryRun ? 'dryrun' : 'apply';
  const force = url.searchParams.get('force') === '1';
  const lookbackDays = clampInt(url.searchParams.get('lookbackDays'), DEFAULT_LOOKBACK_DAYS, 1, MAX_LOOKBACK_DAYS);
  const maxAccounts = clampInt(url.searchParams.get('maxAccounts'), DEFAULT_MAX_ACCOUNTS, 1, MAX_ACCOUNTS_CAP);
  const now = new Date();

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(
      () => undefined,
    );
    return NextResponse.json(skip);
  }

  let claimed = false;
  if (!dryRun && !force) {
    const claim = await claimDailyRun(CRON_NAME, now);
    if (!claim.claimed) {
      const reason = claim.reason ?? 'not-claimed';
      await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
      return NextResponse.json({ skipped: true, reason });
    }
    claimed = true;
  }

  try {
    const report = await runHypothesize(prisma, { now, lookbackDays, maxAccounts, dryRun });

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message:
        `${mode}: ${report.accountsScanned} accounts, ${report.triggersSeen} triggers, ` +
        `${report.signals.created} new signals, ${report.candidates} candidates, ${report.proposed} proposed`,
      stats: { mode, lookbackDays, maxAccounts, ...report },
    }).catch(() => undefined);

    return NextResponse.json({ ...report, mode });
  } catch (error) {
    if (claimed) await releaseDailyRun(CRON_NAME, now).catch(() => undefined);
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
