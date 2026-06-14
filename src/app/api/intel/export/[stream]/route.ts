import { NextResponse } from 'next/server';
import { isAuthorizedIntelExport } from '@/lib/intel/export/auth';
import { exportStream, clampLimit } from '@/lib/intel/export/streams';

/**
 * Read-only intel export for clawd's canonical ledger.
 *
 *   GET /api/intel/export/<stream>?since=<ISO8601>&cursor=<opaque>&limit=<=500
 *   Header: x-queue-secret: <QUEUE_AGENT_SECRET>   (Bearer of the same secret also accepted)
 *
 * Five streams: replies | email_events | engagements | captures | outcomes.
 * Keyset pagination on (occurred_at, id); stable per-record idempotency_key.
 * Fail-soft: never 5xx — on any error returns 200 with an empty envelope so a
 * bad batch never wedges the poller. Unknown stream -> 200 empty envelope.
 *
 * Read-only: no writes, no app-behavior change. (Contract:
 * docs/superpowers/specs/2026-06-13-modex-intel-export-contract.md)
 */

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stream: string }> },
): Promise<Response> {
  if (!isAuthorizedIntelExport(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { stream } = await params;
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const cursor = url.searchParams.get('cursor');
  const limit = clampLimit(url.searchParams.get('limit'));

  const envelope = await exportStream({ stream, since, cursor, limit });
  return NextResponse.json(envelope);
}
