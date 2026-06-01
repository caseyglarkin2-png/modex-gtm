import './print.css';
import { notFound } from 'next/navigation';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';
import { DemoSurface } from '@/components/demo/demo-surface';
import IndustryFlickBar from '@/components/demo/industry-flick-bar';
import { MicrositeViewEvent } from '@/components/demo/microsite-view-event';
import { RelatedIndustries } from '@/components/demo/related-industries';
import { getIndustryFromSlug } from '@/lib/demo/industry-tags';
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
  /**
   * Sprint 2.5 — set to `gallery` when the prospect arrived from
   * the /demo industry-template gallery (vs a personalized email link).
   * Triggers anonymized template framing in DemoSurface.
   */
  from?: string;
  /** Demo-mode flag, preserved through cross-microsite links. */
  demo?: string;
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

/** First sentence of a blob, for social descriptions (I.T1). */
function firstSentence(s?: string): string | null {
  if (!s) return null;
  const m = s.match(/^[\s\S]*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { account } = await params;
  const pack = await loadPack(account);
  if (!pack) return { title: 'Network not found · YardFlow' };

  const { displayName, siteCount } = pack.account;
  const title = `${displayName} · yard network · YardFlow`;
  // I.T1 — lead the social description with the dossier intro's first
  // sentence when present (richer than the generic line); fall back
  // otherwise.
  const lead = firstSentence(pack.account.dossierIntro);
  const description = lead
    ? `${lead} ${siteCount} facilities audited from public satellite imagery.`
    : `${siteCount} ${displayName} facilities, mapped from public satellite imagery. Real geofences, real archetype mix — see your yard the way YardFlow sees it.`;

  // Canonical / OG URLs route to yardflow.ai/demo/<slug>, not modex-gtm,
  // so prospects who share a link land on the canonical domain and
  // the browser origin matches /roi for the D8.1 localStorage handoff.
  return buildPublicShareMetadata({
    title,
    description,
    pathname: `/demo/${account}`,
    // E.T6 — use the microsite's own neon/satellite OG card rather than
    // borrowing the /for memo card, so shared /demo links preview with
    // the audited-network treatment.
    imagePath: `/demo/${account}/opengraph-image`,
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
  const initialView: 'atlas' | 'sim' | 'replay' =
    sp.view === 'sim' ? 'sim' : sp.view === 'replay' ? 'replay' : 'atlas';
  // Sprint 2.5 — anonymized template framing flag. When set, the
  // DemoSurface renders the page as a "sample template for [Industry]"
  // rather than as the prospect's personalized memo extension.
  const fromGallery = sp.from === 'gallery';

  // Resolve the Account.name for engagement tracking (FK on
  // MicrositeEngagement.account_name → Account.name). The microsite
  // account registry is the source of truth; if there's no microsite
  // entry for this slug we fall back to the pack's display name (will
  // 404 the FK silently — that's a backfill task, not a render block).
  const micrositeData = getAccountMicrositeData(account);
  const accountName = micrositeData?.accountName ?? pack.account.displayName;

  // Satellite-zoom hero: use the gallery thumb for the account if it
  // exists (the 11 industry anchors have these at zoom 17; the other
  // ~32 accounts don't yet). Falls back to undefined so DemoSurface
  // skips the hero section gracefully.
  const thumbDiskPath = path.join(process.cwd(), 'public', 'gallery-thumbs', `${account}.png`);
  const featuredSiteThumbSrc = existsSync(thumbDiskPath)
    ? `/gallery-thumbs/${account}.png`
    : undefined;

  // I.T5 — JSON-LD Dataset schema for the audited network.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${pack.account.displayName} yard network audit`,
    description:
      firstSentence(pack.account.dossierIntro) ??
      `${pack.account.siteCount} ${pack.account.displayName} facilities modeled from public satellite imagery.`,
    creator: { '@type': 'Organization', name: 'YardFlow by FreightRoll' },
    datePublished: pack.builtAt,
    spatialCoverage: 'United States',
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Server-rendered static object; safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MicrositeTracker
        accountName={accountName}
        accountSlug={account}
        path={`/demo/${account}`}
        variantSlug={fromGallery ? 'gallery-pack-view' : undefined}
      />
      <MicrositeViewEvent anchorSlug={account} archetype={getIndustryFromSlug(account)?.archetype ?? null} />
      <DemoSurface
        pack={pack}
        mode="standalone"
        initialSiteId={initialSiteId}
        autoPlay={autoPlay}
        initialView={initialView}
        fromGallery={fromGallery}
        featuredSiteThumbSrc={featuredSiteThumbSrc}
      />
      {/* L.T2 — related-industries rail (server component). */}
      <RelatedIndustries
        currentSlug={account}
        currentArchetype={pack.account.archetype}
        currentDockDoors={pack.network.totals.dockDoors}
        demoSuffix={sp.demo && ['1', 'true', 'yes'].includes(String(sp.demo).toLowerCase()) ? '&demo=1' : ''}
      />
      {/* G7 — Industry flick bar. Self-suppresses if the slug isn't
          one of the 11 gallery anchors. */}
      <IndustryFlickBar currentSlug={account} />
    </>
  );
}
