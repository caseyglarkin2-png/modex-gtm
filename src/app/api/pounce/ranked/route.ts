import { NextRequest, NextResponse } from 'next/server';
import { rankAccounts } from '@/lib/pounce/ranked';

export const dynamic = 'force-dynamic';

/**
 * The Pounce Spine — read side. Accounts ranked by recency-weighted trigger
 * heat, for clawd to prioritize its enrichment/outreach queue by trigger-fit.
 * Auth: x-pounce-token (same shared token as ingest). Params: ?days=30
 * &minScore=6 &limit=50.
 */
export async function GET(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const ranked = await rankAccounts({
    days: sp.get('days') ? Number(sp.get('days')) : undefined,
    minScore: sp.get('minScore') ? Number(sp.get('minScore')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  });
  return NextResponse.json({ ok: true, count: ranked.length, accounts: ranked });
}
