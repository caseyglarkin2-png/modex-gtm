import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { DemoPackSchema } from '@/lib/demo/pack-schema';

/**
 * L.T2 — Related-industries rail. Server component (does fs reads), so it
 * renders from the microsite page, not inside the client DemoSurface.
 *
 * Picks 3 related audited networks: same pack archetype first, ordered by
 * closest network size (dock doors); backfills with nearest-size accounts
 * from any archetype if fewer than 3 in-archetype peers exist. Never
 * links to the current slug. No microsite is a dead-end.
 */

interface RelatedSummary {
  slug: string;
  displayName: string;
  archetype: string;
  dockDoors: number;
  siteCount: number;
  hasThumb: boolean;
}

async function loadAllSummaries(): Promise<RelatedSummary[]> {
  const dir = path.join(process.cwd(), 'public', 'demo-packs');
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const slugs = entries.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  const out = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const raw = await fs.readFile(path.join(dir, `${slug}.json`), 'utf8');
        const parsed = DemoPackSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return null;
        const p = parsed.data;
        return {
          slug: p.account.slug,
          displayName: p.account.displayName,
          archetype: p.account.archetype,
          dockDoors: p.network.totals.dockDoors,
          siteCount: p.account.siteCount,
          hasThumb: existsSync(path.join(process.cwd(), 'public', 'gallery-thumbs', `${slug}.png`)),
        } as RelatedSummary;
      } catch {
        return null;
      }
    }),
  );
  return out.filter((s): s is RelatedSummary => s !== null);
}

function pickRelated(
  all: RelatedSummary[],
  currentSlug: string,
  currentArchetype: string,
  currentDockDoors: number,
): RelatedSummary[] {
  const others = all.filter((s) => s.slug !== currentSlug);
  const byCloseSize = (a: RelatedSummary, b: RelatedSummary) =>
    Math.abs(a.dockDoors - currentDockDoors) - Math.abs(b.dockDoors - currentDockDoors);
  const sameArch = others.filter((s) => s.archetype === currentArchetype).sort(byCloseSize);
  const picked = [...sameArch];
  if (picked.length < 3) {
    const have = new Set(picked.map((s) => s.slug));
    const backfill = others.filter((s) => !have.has(s.slug)).sort(byCloseSize);
    picked.push(...backfill);
  }
  return picked.slice(0, 3);
}

export async function RelatedIndustries({
  currentSlug,
  currentArchetype,
  currentDockDoors,
  demoSuffix = '',
}: {
  currentSlug: string;
  currentArchetype: string;
  currentDockDoors: number;
  demoSuffix?: string;
}) {
  const all = await loadAllSummaries();
  const related = pickRelated(all, currentSlug, currentArchetype, currentDockDoors);
  if (related.length === 0) return null;

  return (
    <section
      data-related-industries
      className="mx-auto w-full max-w-5xl px-5 pb-16 pt-4"
      aria-label="More audited networks"
    >
      <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00B4FF]/85">
        More audited networks
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {related.map((r) => (
          <Link
            key={r.slug}
            href={`/demo/${r.slug}?source=related-rail&from=${currentSlug}${demoSuffix}`}
            data-ms-cta-id={`related-${r.slug}`}
            className="group flex flex-col gap-2 rounded-[12px] border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-[#00B4FF]/45 hover:bg-white/[0.05] hover:shadow-[0_0_24px_rgba(0,180,255,0.15)]"
          >
            {r.hasThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/gallery-thumbs/${r.slug}.png`}
                alt=""
                width={320}
                height={180}
                loading="lazy"
                className="aspect-[16/9] w-full rounded-[8px] object-cover"
              />
            ) : null}
            <span className="text-[14px] font-semibold text-white transition-colors group-hover:text-[#00B4FF]">
              {r.displayName}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/45">
              {r.dockDoors.toLocaleString()} dock doors · {r.siteCount.toLocaleString()} sites
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
