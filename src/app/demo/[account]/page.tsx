import { notFound } from 'next/navigation';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';
import { DemoSurface } from '@/components/demo/demo-surface';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { buildPublicShareMetadata } from '@/lib/microsites/share';

/**
 * D2.1 — The canonical demo route: `/demo/<account>`.
 *
 * Server component. Reads `public/demo-packs/<slug>.json` directly off disk
 * (validated at build time, so reads are cheap), returns 404 if the slug
 * has no pack, hands the validated DemoPack to the client surface.
 *
 * Public via the middleware `demo` matcher exclusion (D2.7). Surfaced from
 * `yardflow.ai/demo/<slug>` via a flow-state-site vercel rewrite, same
 * trick as `/for/<slug>` (M1.2).
 */

interface Params {
  account: string;
}

interface SearchParams {
  /** D3.4 — deep-link to a specific facility detail view. */
  site?: string;
  /** D3.4 — auto-open the driver journey replay on load when `play=1`. */
  play?: string;
  /** D4.5 — deep-link directly to the network simulator tab. */
  view?: string;
}

async function loadPack(slug: string): Promise<DemoPack | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    // Either the file is missing (most common: unknown slug) or it failed
    // schema validation (would mean our build process shipped bad data —
    // never expected to reach a user, but we 404 gracefully if it ever does).
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { account } = await params;
  const pack = await loadPack(account);
  if (!pack) return { title: 'Network not found · YardFlow' };

  const { displayName, siteCount } = pack.account;
  const title = `${displayName} · yard network · YardFlow`;
  const description = `${siteCount} ${displayName} facilities, mapped from public satellite imagery. Real geofences, real archetype mix — see your yard the way YardFlow sees it.`;

  // Canonical / OG URLs route to yardflow.ai/demo/<slug>, not modex-gtm,
  // so prospects who share a link land on the canonical domain and
  // the browser origin matches /roi for the D8.1 localStorage handoff.
  return buildPublicShareMetadata({
    title,
    description,
    pathname: `/demo/${account}`,
    imagePath: `/for/${account}/opengraph-image`,
    imageAlt: `${displayName} yard network — YardFlow YNS analysis`,
  });
}

export default async function DemoAccountPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ account }, sp] = await Promise.all([params, searchParams]);
  const pack = await loadPack(account);
  if (!pack) notFound();

  // Resolve the initial site: explicit ?site= wins, else the pack's
  // featured site (largest archetype cluster), else nothing selected.
  const requestedSiteId = sp.site && pack.network.sites.find((s) => s.id === sp.site) ? sp.site : null;
  const initialSiteId = requestedSiteId ?? pack.account.featuredSiteId ?? null;
  const autoPlay = sp.play === '1';
  const initialView: 'atlas' | 'sim' = sp.view === 'sim' ? 'sim' : 'atlas';

  // Resolve the Account.name for engagement tracking (FK on
  // MicrositeEngagement.account_name → Account.name). The microsite
  // account registry is the source of truth; if there's no microsite
  // entry for this slug we fall back to the pack's display name (will
  // 404 the FK silently — that's a backfill task, not a render block).
  const micrositeData = getAccountMicrositeData(account);
  const accountName = micrositeData?.accountName ?? pack.account.displayName;

  return (
    <>
      <MicrositeTracker
        accountName={accountName}
        accountSlug={account}
        path={`/demo/${account}`}
      />
      <DemoSurface
        pack={pack}
        mode="standalone"
        initialSiteId={initialSiteId}
        autoPlay={autoPlay}
        initialView={initialView}
      />
    </>
  );
}
