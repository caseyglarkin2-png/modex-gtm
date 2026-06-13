import { NextRequest, NextResponse } from 'next/server';
import { latestForAccount } from '@/lib/pounce/ranked';

export const dynamic = 'force-dynamic';

/**
 * The Pounce Spine — latest trigger for one account, the source for the /for
 * LIVE SIGNAL ribbon (Flow-State- fetches this server-side, holding the token,
 * so it never reaches the browser). Auth: x-pounce-token. Param: ?slug=.
 */
export async function GET(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }
  const trigger = await latestForAccount(slug);
  return NextResponse.json({ ok: true, slug, trigger });
}
