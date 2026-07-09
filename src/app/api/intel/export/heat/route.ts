import { NextResponse } from 'next/server';
import { isAuthorizedIntelExport } from '@/lib/intel/export/auth';
import { assembleHeatExport } from '@/lib/revops/heat/assemble';

/**
 * Read-only heat ranking for clawd's morning brief.
 *
 *   GET /api/intel/export/heat?limit=<=50
 *   Header: x-queue-secret: <QUEUE_AGENT_SECRET>  (Bearer of the same secret ok)
 *
 * Static segment wins over the [stream] sibling, so this rides the same URL
 * family and the same auth as the other intel exports. The payload declares
 * which heat components the server cannot assemble (componentsOmitted) — the
 * ranking is a floor from live signals, never a fabricated full score.
 *
 * READ-ONLY: zero HubSpot writes on this path; the heat writer stays gated
 * behind HEAT_WRITE_ENABLED=1 + --apply in scripts/heat.
 * Fail-soft: any assembly error returns 200 with an empty accounts array so
 * the brief composer never crashes on our account.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedIntelExport(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get('limit') ?? '25', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 25;

  try {
    const payload = await assembleHeatExport(limit);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      accounts: [],
      computedAt: new Date().toISOString(),
      componentsOmitted: ['deck', 'mql'],
      candidateCount: 0,
      error: 'assembly_failed',
    });
  }
}
