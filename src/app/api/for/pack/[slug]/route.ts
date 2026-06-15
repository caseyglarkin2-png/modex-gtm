import { NextRequest, NextResponse } from 'next/server';
import { getForPage } from '@/lib/for/store';

export const dynamic = 'force-dynamic';

/**
 * No-deploy page store — read path. Flow-State /for and modex /demo fetch the
 * row server-side (token held server-side, never in the browser). Auth:
 * x-pounce-token. 404 when the slug has no live row.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await params;
  const row = await getForPage(slug);
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, row });
}
