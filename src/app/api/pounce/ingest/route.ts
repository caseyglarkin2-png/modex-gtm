import { NextRequest, NextResponse } from 'next/server';
import { ingestTriggers, type RawTrigger } from '@/lib/pounce/ingest';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The Pounce Spine — HTTP ingest. External sources (the local X-rig scan,
 * clawd, any future producer) POST their scored triggers here. Auth is a
 * shared bearer token in the `x-pounce-token` header (POUNCE_INGEST_TOKEN).
 * Dedupe + Slack + HubSpot all happen once inside ingestTriggers().
 *
 * Body: { triggers: RawTrigger[], ping?: boolean }
 */
export async function POST(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { triggers?: RawTrigger[]; ping?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const triggers = Array.isArray(body.triggers) ? body.triggers : [];
  // Minimal shape guard — drop anything missing the load-bearing fields.
  const clean = triggers.filter(
    (t) => t && t.url && t.accountSlug && t.accountName && typeof t.score === 'number',
  );
  if (clean.length === 0) {
    return NextResponse.json({ ok: true, received: 0, created: 0, duplicate: 0, pinged: 0, stamped: 0 });
  }
  const result = await ingestTriggers(clean, { ping: body.ping !== false });
  return NextResponse.json({ ok: true, ...result });
}
