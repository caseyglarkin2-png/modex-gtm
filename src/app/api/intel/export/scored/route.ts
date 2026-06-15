import { NextResponse } from 'next/server';
import { isAuthorizedIntelExport } from '@/lib/intel/export/auth';
import { listScored } from '@/lib/intel/export/scored';
export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedIntelExport(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const n = Number.parseInt(url.searchParams.get('limit') ?? '300', 10);
  const limit = !Number.isFinite(n) || n <= 0 ? 300 : Math.min(n, 500);
  try { return NextResponse.json(listScored(url.searchParams.get('cursor'), limit)); }
  catch (e) { console.warn('[scored]', e); return NextResponse.json({ items: [], nextCursor: null, total: 0 }); }
}
