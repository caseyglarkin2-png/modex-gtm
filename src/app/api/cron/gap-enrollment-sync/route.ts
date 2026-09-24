import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { claimDailyRun, releaseDailyRun } from '@/lib/cron-idempotency';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { runEnrollmentSync, type ReadContactsDeps } from '@/lib/gap/sequence/external-sync';
import { builtSequences, readManifest, readRoster, type Top100RosterPerson } from '@/lib/gap/top100/reader';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-enrollment-sync';
const CRON_PATH = '/api/cron/gap-enrollment-sync';
// Not in vercel.json until the Sprint 2 review. Manual trigger only for any
// holder of CRON_SECRET; the string mirrors cron-monitor's convention for
// routes that exist but are not scheduled.
const CRON_SCHEDULE = 'unregistered (manual only)';

/**
 * The one HubSpot call this route makes: CRM v3 contacts batch READ
 * (`client.crm.contacts.batchApi.read`), the SDK form of the lane's
 * `/crm/v3/objects/contacts/batch/read` call. It reads properties and never
 * writes; there is no write path anywhere in this route or the sync module.
 */
const hubspotReadContacts: ReadContactsDeps['readContacts'] = async (ids, properties) => {
  const client = getHubSpotClient();
  const res = await withHubSpotRetry(
    () =>
      client.crm.contacts.batchApi.read({
        inputs: ids.map((id) => ({ id })),
        properties,
        propertiesWithHistory: [],
      }),
    `gap-enrollment-sync batch read (${ids.length})`,
  );
  return (res.results ?? []).map((r) => ({ id: String(r.id), properties: r.properties ?? {} }));
};

/** Load the manifest and every built account's roster from the lane directory. Missing rosters are left out and reported by the sync. */
function loadLane(dir: string) {
  const manifest = readManifest(readFileSync(join(dir, 'run_manifest.json'), 'utf8'));
  const rosters: Record<string, Top100RosterPerson[]> = {};
  for (const acct of builtSequences(manifest)) {
    try {
      rosters[acct.key] = readRoster(readFileSync(join(dir, 'data', 'roster', `${acct.key}.json`), 'utf8')).people;
    } catch {
      // absent roster: the sync reports it under rostersMissing
    }
  }
  return { manifest, rosters };
}

/**
 * GAP enrollment-truth sync cron (S2-T4): families from the Top100 manifest,
 * legacy enrollments from a READ-only HubSpot readback. Ledger only; nothing
 * here enrolls, unenrolls or writes to HubSpot.
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the GAP
 *   flags. A scheduled run with the feature off answers 200 with the skip
 *   payload so the schedule never reads as an outage.
 * - mode (N9): dry run unless ?mode=apply, for every caller including a
 *   Vercel schedule or an agent Bearer call. ?dryRun=1 forces a dry run in
 *   every case. Same convention as POST /api/gap/routing/run.
 * - Inputs: GAP_TOP100_DIR names the lane checkout (run_manifest.json and
 *   data/roster/<key>.json). Unset answers 200 skipped before any claim or
 *   HubSpot read, as does a missing HUBSPOT_ACCESS_TOKEN.
 * - Idempotency: an apply run claims the day via claimDailyRun. A dry run
 *   writes nothing, so it does not claim. ?force=1 bypasses the claim; the
 *   secret already matched by then, so only a holder of CRON_SECRET can force.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  // N9: dry run unless ?mode=apply, the same convention as POST
  // /api/gap/routing/run. A Bearer call without the mode (a Vercel schedule,
  // an agent) rehearses; when this route is scheduled, vercel.json must carry
  // ?mode=apply on the path. ?dryRun=1 wins in every case.
  const apply = url.searchParams.get('mode') === 'apply';
  const dryRun = url.searchParams.get('dryRun') === '1' || !apply;
  const mode = dryRun ? 'dryrun' : 'apply';
  const force = url.searchParams.get('force') === '1';
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

  const laneDir = (process.env.GAP_TOP100_DIR ?? '').trim();
  if (!laneDir) {
    const reason = 'GAP_TOP100_DIR unset';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
  }
  if (!isHubSpotConfigured()) {
    const reason = 'HUBSPOT_ACCESS_TOKEN unset';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
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
    const { manifest, rosters } = loadLane(laneDir);
    const report = await runEnrollmentSync(
      prisma,
      {
        manifest,
        rosters,
        now,
        dryRun,
        program: manifest.runId || 'top100',
        portal: manifest.portal,
        actor: CRON_NAME,
      },
      { readContacts: hubspotReadContacts },
    );

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message:
        `${mode}: families ${report.families.created} new / ${report.families.existing} existing, ` +
        `${report.contactsRead} contacts read, enrollments ${report.enrollments.created} new / ` +
        `${report.enrollments.updated} updated / ${report.enrollments.unchanged} unchanged, ` +
        `${report.reported.other_sequence} in other sequences`,
      stats: { mode, ...report },
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
