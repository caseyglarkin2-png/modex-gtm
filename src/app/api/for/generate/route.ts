import { NextResponse } from 'next/server';
import { generatePageRow, type SpearOverride } from '@/lib/for/generate';
import { upsertForPage } from '@/lib/for/store';
import { revalidateForPage } from '@/lib/for/revalidate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SITE = process.env.FLOW_STATE_URL || 'https://yardflow.ai';

function authed(req: Request): boolean {
  const token = process.env.POUNCE_INGEST_TOKEN;
  return !!token && req.headers.get('x-pounce-token') === token;
}

interface Body { slug?: string; override?: SpearOverride; status?: 'draft' | 'live'; }

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  try {
    const row = await generatePageRow(body.slug, { override: body.override, status: body.status ?? 'live' });
    await upsertForPage(row);
    await revalidateForPage(body.slug);
    const snap = row.snap as { annualValueLabel?: string; totalFacilities?: number };
    return NextResponse.json({
      ok: true, slug: body.slug, status: row.status,
      url: `${SITE.replace(/\/$/, '')}/for/${body.slug}`,
      demoUrl: `${SITE.replace(/\/$/, '')}/demo/${body.slug}`,
      annualValueLabel: snap.annualValueLabel, totalFacilities: snap.totalFacilities,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
