import { promises as fs } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';
import { buildPublicShareMetadata } from '@/lib/microsites/share';

/**
 * I.T7 — Side-by-side anchor compare view at /demo/compare?a=<slug>&b=<slug>.
 *
 * Server component. Loads two demo packs and renders their audited
 * networks column-by-column: footprint, dock doors, trailer spots, rail,
 * acreage, and the three surprising findings each. Defaults to two CPG
 * anchors when params are missing. Stacks on mobile.
 */

const DEFAULT_A = 'coca-cola';
const DEFAULT_B = 'frito-lay';

interface SearchParams {
  a?: string;
  b?: string;
}

async function loadPack(slug: string): Promise<DemoPack | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicShareMetadata({
    title: 'Compare audited networks · YardFlow',
    description: 'Two audited yard networks side by side: footprint, dock doors, trailer spots, and the surprising findings from each.',
    pathname: '/demo/compare',
    imagePath: '/opengraph-image',
    imageAlt: 'YardFlow network comparison',
    noIndex: true,
  });
}

const MICROSITE_BASE = process.env.NEXT_PUBLIC_MICROSITE_BASE_URL || 'https://yardflow.ai';

function readSlug(value: string | undefined, fallback: string): string {
  return (value ?? fallback).toLowerCase().trim() || fallback;
}

function footprint(pack: DemoPack): number {
  const cov = pack.account.coverageNote;
  return cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? pack.account.siteCount;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const slugA = readSlug(sp.a, DEFAULT_A);
  const slugB = readSlug(sp.b, DEFAULT_B);
  const [packA, packB] = await Promise.all([loadPack(slugA), loadPack(slugB)]);

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-16 text-white max-[480px]:px-[18px]">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.30em] text-[#00B4FF]/85">
          Network comparison
        </div>
        <h1 className="text-[clamp(30px,5vw,48px)] font-black leading-[1.05] tracking-[-0.03em]">
          Two audited networks, side by side.
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] leading-[1.55] text-white/65">
          Same rubric, same satellite imagery, same modeled geofences.{' '}
          <Link href="/demo" className="text-[#00B4FF] underline underline-offset-4">
            Back to all industries
          </Link>
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <CompareColumn pack={packA} slug={slugA} />
          <CompareColumn pack={packB} slug={slugB} />
        </div>
      </div>
    </main>
  );
}

function CompareColumn({ pack, slug }: { pack: DemoPack | null; slug: string }) {
  if (!pack) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-white/10 p-6 text-center text-white/55">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">Not found</p>
          <p className="mt-2 text-[14px]">No audited network for &ldquo;{slug}&rdquo;.</p>
        </div>
      </div>
    );
  }

  const { displayName, archetype } = pack.account;
  const { dockDoors, trailerCapacity, railServed, acres } = pack.network.totals;
  const findings = pack.account.surprisingFindings ?? [];
  const metrics: Array<{ label: string; value: string }> = [
    { label: 'Facilities', value: footprint(pack).toLocaleString() },
    { label: 'Dock doors', value: dockDoors.toLocaleString() },
    { label: 'Trailer spots', value: trailerCapacity.toLocaleString() },
    { label: 'Rail-served', value: railServed.toLocaleString() },
    { label: 'Acres', value: Math.round(acres).toLocaleString() },
  ];

  return (
    <section
      className="flex flex-col gap-5 rounded-[16px] border border-[#00B4FF]/[0.16] p-6"
      style={{ background: 'linear-gradient(180deg, rgba(17,19,24,0.92), rgba(10,12,16,0.92))' }}
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/80">{archetype}</div>
        <h2 className="mt-1 text-[22px] font-bold tracking-[-0.01em]">{displayName}</h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#00B4FF]/[0.10] pt-5">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-[3px]">
            <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/45">{m.label}</dt>
            <dd className="font-mono text-[24px] font-bold leading-none tabular-nums text-white">{m.value}</dd>
          </div>
        ))}
      </dl>

      {findings.length > 0 ? (
        <ul className="flex flex-col gap-2 border-t border-[#00B4FF]/[0.10] pt-5">
          {findings.map((f, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-[1.5] text-white/75">
              <span className="text-[#00B4FF]" aria-hidden>›</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <a
          href={`${MICROSITE_BASE}/roi?source=demo-compare&pack=${encodeURIComponent(slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          data-ms-cta-id={`compare-run-roi-${slug}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-3 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22]"
        >
          Run {displayName.split(' ')[0]} ROI →
        </a>
        <Link
          href={`/demo/${slug}?from=gallery`}
          data-ms-cta-id={`compare-view-template-${slug}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] border border-white/15 px-3 text-[13px] font-semibold text-white/85 transition-all hover:border-[#00B4FF]/55 hover:text-white"
        >
          View template →
        </Link>
      </div>
    </section>
  );
}
