import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronStarted, markCronSuccess, markCronFailure } from '@/lib/cron-monitor';
import { ensureQualificationProperties } from '@/lib/hubspot/properties';
import { evaluateQualification } from '@/lib/revops/qualification/evaluate';
import { applyVerdicts } from '@/lib/revops/qualification/apply';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'qualification';
const CRON_PATH = '/api/cron/qualification';
const CRON_SCHEDULE = '0 11 * * *';

/**
 * MQL/SQL qualification engine.
 * - mode=dryrun (default): evaluate the TAM, return counts + a sample of changed rows. Writes nothing.
 * - mode=apply: also write yardflow_qual_verdict to changed contacts (advisory field; native
 *   workflows do the lifecycle actuation). The verdict write has no CRM side effects on its own.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') === 'apply' ? 'apply' : 'dryrun';

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    await ensureQualificationProperties();
    const result = await evaluateQualification();
    const changedRows = result.diff.filter((d) => d.changed);

    const applied = mode === 'apply' ? await applyVerdicts(changedRows) : { updated: 0 };

    const stats = {
      mode,
      companies: result.companies,
      contacts: result.contacts,
      counts: result.counts,
      changes: result.changes,
      applied: applied.updated,
      warnings: result.warnings.length,
    };
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${mode}: ${result.changes} changes (${result.counts.mql} mql / ${result.counts.sql} sql), applied ${applied.updated}`,
      stats,
    }).catch(() => undefined);

    return NextResponse.json({
      ...stats,
      evaluatedAt: result.evaluatedAt,
      sample: changedRows.slice(0, 50),
      warningSample: result.warnings.slice(0, 20),
    });
  } catch (error) {
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
