import { NextResponse } from 'next/server';
import { generatePageRow, type SpearOverride } from '@/lib/for/generate';
import type { ForSnapshot } from '@/lib/for/snapshot';
import { getForPage, upsertForPage } from '@/lib/for/store';
import { revalidateForPage } from '@/lib/for/revalidate';
import { buildResearchSnapshot, researchTierSpear } from '@/lib/for/research-tier';
import { buildNetworkPack } from '@/lib/for/network-pack';
import { geocodeFacilities } from '@/lib/for/geocode';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SITE = process.env.FLOW_STATE_URL || 'https://yardflow.ai';

function authed(req: Request): boolean {
  const token = process.env.POUNCE_INGEST_TOKEN;
  return !!token && req.headers.get('x-pounce-token') === token;
}

/**
 * Post-generate validation: confirm the row actually landed in the store as
 * 'live' AND that the public /for URL renders (Flow-State- dynamic render →
 * modex pack read). Fail-open by design — a validation failure returns
 * `validated: false` on a 200 response, it never fails the generation. A
 * draft-status generation is reported unvalidated (drafts are deliberately
 * not publicly rendered, so there is nothing to assert against).
 */
async function validateGenerated(slug: string, status: 'draft' | 'live', url: string): Promise<boolean> {
  if (status !== 'live') return false;
  try {
    const stored = await getForPage(slug);
    if (!stored || stored.status !== 'live') return false;
  } catch {
    return false;
  }
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: { accept: 'text/html' },
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface Body { slug?: string; override?: SpearOverride; status?: 'draft' | 'live'; account?: { displayName?: string; archetype?: string }; facilityCount?: number; forceCount?: boolean; facilities?: Array<{ name: string; city?: string; state?: string; type?: string; lat?: number; lng?: number }>; }

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  try {
    // forceCount is an explicit operator override of the modeled facility count;
    // it only takes effect in the research-tier branch, so skip the audited
    // generatePageRow path when it is set (otherwise an account that already has
    // a stored pack would take the audited path and silently ignore forceCount).
    if (body.forceCount && body.facilityCount && body.account?.displayName && body.account?.archetype) {
      throw new Error('no demo pack: forceCount routes to research-tier');
    }
    const row = await generatePageRow(body.slug, { override: body.override, status: body.status ?? 'live' });
    await upsertForPage(row);
    await revalidateForPage(body.slug);
    const snap = row.snap as ForSnapshot;
    const url = `${SITE.replace(/\/$/, '')}/for/${body.slug}`;
    const validated = await validateGenerated(body.slug, row.status, url);
    return NextResponse.json({
      ok: true, slug: body.slug, status: row.status, validated,
      url,
      demoUrl: `${SITE.replace(/\/$/, '')}/demo/${body.slug}`,
      annualValueLabel: snap.annualValueLabel, totalFacilities: snap.totalFacilities,
    });
  } catch (e) {
    const msg = (e as Error).message;
    const acct = body.account;
    if (/no demo pack/i.test(msg) && body.facilityCount && acct?.displayName && acct?.archetype) {
      const existing = await getForPage(body.slug);
      const pinned = (existing?.snap as ForSnapshot | undefined)?.totalFacilities;
      const count = (typeof pinned === 'number' && pinned > 0 && !body.forceCount) ? pinned : body.facilityCount;
      const snap = buildResearchSnapshot(body.slug, { displayName: acct.displayName, archetype: acct.archetype }, count);
      const override = body.override ?? researchTierSpear(acct.displayName, snap, acct.archetype);
      let demoPack = null;
      if (Array.isArray(body.facilities) && body.facilities.length) {
        try {
          const geocoded = await geocodeFacilities(body.facilities);
          if (geocoded.some((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng))) {
            demoPack = buildNetworkPack({ account: acct.displayName, slug: body.slug, archetype: acct.archetype, facilities: geocoded }, new Date().toISOString());
          }
        } catch { demoPack = null; }
      }
      const row = {
        slug: body.slug,
        status: (body.status ?? 'live') as 'draft' | 'live',
        pack: { account: { slug: body.slug, displayName: acct.displayName, archetype: acct.archetype, coverageNote: { auditedScope: 'estimated' } } },
        snap,
        override,
        geo: null,
        demoPack,
      };
      await upsertForPage(row);
      await revalidateForPage(body.slug);
      const url = `${SITE.replace(/\/$/, '')}/for/${body.slug}`;
      const validated = await validateGenerated(body.slug, row.status, url);
      return NextResponse.json({ ok: true, slug: body.slug, status: row.status, validated, tier: demoPack ? 'research+network' : 'research', url, annualValueLabel: snap.annualValueLabel, totalFacilities: snap.totalFacilities, perSiteLabel: snap.perSiteImpliedLabel, paybackMonths: snap.paybackAllSavingsMonths });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
