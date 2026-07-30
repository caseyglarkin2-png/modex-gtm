import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronStarted, markCronSuccess, markCronFailure } from '@/lib/cron-monitor';
import { ensureQualificationProperties } from '@/lib/hubspot/properties';
import { evaluateQualification } from '@/lib/revops/qualification/evaluate';
import { evaluateIncremental, resolveSinceHours } from '@/lib/revops/qualification/incremental';
import { applyVerdicts } from '@/lib/revops/qualification/apply';
import { notifyDailyStats } from '@/lib/revops/qualification/notify';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'qualification';
const CRON_PATH = '/api/cron/qualification';
const CRON_SCHEDULE = '30 11 * * *';

/**
 * MQL/SQL qualification engine.
 * - scope=incremental (default): evaluate only contacts/companies modified in the lookback
 *   window (?sinceHours=, default 26). Fits the 300s serverless budget — this is what the
 *   daily Vercel cron runs. scope=full walks the whole TAM (LOCAL USE ONLY: ~40min, will
 *   time out on Vercel — use scripts/tam/backfill-qualification.mjs instead).
 * - mode=dryrun: counts + sample, writes nothing. mode=apply: writes yardflow_qual_verdict
 *   and posts new SQLs to #yardflow-intent. Vercel-SCHEDULED invocations (Bearer auth, no
 *   explicit mode param) default to apply; manual ?secret= calls default to dryrun.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const isScheduled =
    (request.headers.get('authorization') ?? '').startsWith('Bearer ') &&
    !url.searchParams.get('mode');
  const mode = url.searchParams.get('mode') === 'apply' || isScheduled ? 'apply' : 'dryrun';
  const scope = url.searchParams.get('scope') === 'full' ? 'full' : 'incremental';
  const sinceHours = resolveSinceHours(url.searchParams.get('sinceHours'));

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    await ensureQualificationProperties();
    const result =
      scope === 'full' ? await evaluateQualification() : await evaluateIncremental(sinceHours);
    const changedRows = result.diff.filter((d) => d.changed);

    const applied =
      mode === 'apply' ? await applyVerdicts(changedRows) : { updated: 0, promoted: 0 };
    const newSqls = changedRows.filter(
      (d) => d.newVerdict === 'sql' && d.currentVerdict !== 'sql',
    ).length;
    if (mode === 'apply') {
      // notifyNewSqls (the per-SQL identity roster) was removed 2026-07-30. The
      // aggregate count still rides along in notifyDailyStats below; the names and
      // the nurture history go to the war-room morning brief instead.
      await notifyDailyStats({
        scope,
        sinceHours: scope === 'incremental' ? sinceHours : undefined,
        contacts: result.contacts,
        counts: result.counts,
        changes: result.changes,
        applied: applied.updated,
        promoted: applied.promoted,
        newSqls,
        warnings: result.warnings,
      }).catch(() => undefined);
    }

    const stats = {
      mode,
      scope,
      sinceHours: scope === 'incremental' ? sinceHours : undefined,
      companies: result.companies,
      contacts: result.contacts,
      counts: result.counts,
      changes: result.changes,
      applied: applied.updated,
      promoted: applied.promoted,
      warnings: result.warnings.length,
    };
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${mode}/${scope}: ${result.changes} changes (${result.counts.mql} mql / ${result.counts.sql} sql), applied ${applied.updated}`,
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
