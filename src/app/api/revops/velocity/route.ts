import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { computePipelineVelocity } from '@/lib/revops/velocity';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/revops/velocity — HONEST funnel-velocity, read-only.
 *
 * Metric source: HubSpot's native `dealstage` property-change history
 * (propertiesWithHistory). This is the ONLY real time-in-stage source in the
 * system — the local Account.pipeline_stage is a single overwritten column with no
 * history. Do NOT read this as local time-in-stage.
 *
 * Returns per-stage average/median dwell (days) and directed stage-to-stage move
 * counts over a bounded, recent slice of deals. Fail-soft: HubSpot hiccups surface
 * as `warnings`, never a 500.
 *
 * Auth: same cron-secret gate as the rest of RevOps (Bearer or ?secret=), because
 * it exposes pipeline shape. Query params:
 *   ?lookbackDays= (default 180, max 3650)
 *   ?maxDeals=     (default 300, max 1000)
 *   ?pipeline=     (default 'default'; pass 'all' for every pipeline)
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const lookbackParam = Number(url.searchParams.get('lookbackDays'));
  const maxParam = Number(url.searchParams.get('maxDeals'));
  const pipelineParam = url.searchParams.get('pipeline');

  try {
    const result = await computePipelineVelocity({
      lookbackDays: Number.isFinite(lookbackParam) && lookbackParam > 0 ? lookbackParam : undefined,
      maxDeals: Number.isFinite(maxParam) && maxParam > 0 ? maxParam : undefined,
      pipelineId: pipelineParam === 'all' ? null : pipelineParam || undefined,
    });
    return NextResponse.json({ metric: 'HubSpot deal-stage history velocity', ...result });
  } catch (error) {
    // computePipelineVelocity is fail-soft, but guard the surface anyway.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
