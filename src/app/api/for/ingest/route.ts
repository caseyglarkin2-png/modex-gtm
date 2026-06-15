import { NextRequest, NextResponse } from 'next/server';
import { upsertForPage, type ForPageRow } from '@/lib/for/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * No-deploy page store — write path. The generator / clawd POST a fully
 * assembled page row here. Auth: x-pounce-token (the shared spine token).
 * Body: { row: ForPageRow }.
 */
export async function POST(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { row?: Partial<ForPageRow> };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const r = body.row;
  if (!r || !r.slug || !r.pack || !r.snap || !r.override) {
    return NextResponse.json({ error: 'row.slug, pack, snap, override required' }, { status: 400 });
  }
  await upsertForPage({
    slug: r.slug, status: r.status === 'live' ? 'live' : 'draft',
    pack: r.pack, snap: r.snap, override: r.override, geo: r.geo ?? null, demoPack: r.demoPack ?? null,
  });
  return NextResponse.json({ ok: true, slug: r.slug, status: r.status === 'live' ? 'live' : 'draft' });
}
