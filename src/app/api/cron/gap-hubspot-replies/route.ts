import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { claimDailyRun, releaseDailyRun } from '@/lib/cron-idempotency';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import {
  DEFAULT_LIMIT,
  pollHubSpotReplies,
  searchIncomingEmailsFromHubSpot,
} from '@/lib/gap/replies/hubspot-poller';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-hubspot-replies';
const CRON_PATH = '/api/cron/gap-hubspot-replies';
// Not in vercel.json until the Sprint 2 review. Manual trigger only for any
// holder of CRON_SECRET; the string mirrors cron-monitor's convention for
// routes that exist but are not scheduled.
const CRON_SCHEDULE = 'unregistered (manual only)';

const MAX_LIMIT = 500;

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseSince(raw: string | null): Date | null {
  if (raw === null || raw.trim() === '') return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * GAP HubSpot reply poller cron (S2-T9): reads INCOMING_EMAIL engagements off
 * HubSpot and lands the human ones as local inbound messages. READ-ONLY toward
 * HubSpot; the only HubSpot call is the emails object search.
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the GAP
 *   flags. A scheduled run with the feature off answers 200 with the skip
 *   payload so the schedule never reads as an outage. Gated on
 *   GAP_ROUTING_ENABLED because routing is the consumer of what this writes.
 * - mode: Vercel-SCHEDULED invocations (Bearer auth, no explicit mode) apply.
 *   Manual calls default to dry run; pass ?mode=apply to write. ?dryRun=1
 *   forces a dry run in every case. Same convention as gap-hypothesize.
 * - Idempotency: an apply run claims the day via claimDailyRun. A dry run
 *   writes nothing, so it does not claim. ?force=1 bypasses the claim; the
 *   secret already matched by then, so only a holder of CRON_SECRET can force.
 * - limit (default 200, 1..500) caps engagements read per run; since (ISO)
 *   overrides the stored watermark for a backfill or a rehearsal.
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
  const limit = clampInt(url.searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const since = parseSince(url.searchParams.get('since'));
  const now = new Date();

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
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
    const report = await pollHubSpotReplies(
      prisma,
      { now, since, dryRun, limit },
      { searchIncomingEmails: (args) => searchIncomingEmailsFromHubSpot(args) },
    );

    const filteredTotal = Object.values(report.filtered).reduce((sum, n) => sum + n, 0);
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message:
        `${mode}: ${report.seen} inbound since ${report.since}, ${report.created} new, ` +
        `${report.existing} existing, ${filteredTotal} filtered, ${report.unknownSender} unknown sender`,
      stats: { mode, limit, ...report },
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
