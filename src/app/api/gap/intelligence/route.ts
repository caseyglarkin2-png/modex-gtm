/**
 * GET /api/gap/intelligence?cursor=&limit=&producer=&origin=&kind=&account=&decided=&archive=&since=   (IW05)
 *
 * The complete retained intelligence, paged deterministically (src/lib/gap/signals/intelligence-browse.ts): every
 * signal and every Pounce trigger GAP holds, with the filters the browse page offers. Session only (no token path);
 * the GAP_ROUTING_ENABLED gate like the signal inbox. Read only: nothing here decides, drafts, posts or writes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { BrowseCursorError, browseIntelligence } from '@/lib/gap/signals/intelligence-browse';
import { parseBrowseQuery } from '@/lib/gap/signals/intelligence-query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = parseBrowseQuery(request.nextUrl.searchParams);
  if (!parsed.ok) return NextResponse.json({ error: 'invalid_query', field: parsed.field }, { status: 400 });
  try {
    const result = await browseIntelligence(prisma, { now: new Date(), limit: parsed.query.limit, cursor: parsed.query.cursor, filters: parsed.query.filters });
    return NextResponse.json(result, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    if (e instanceof BrowseCursorError) return NextResponse.json({ error: 'invalid_cursor' }, { status: 400 });
    throw e;
  }
}
