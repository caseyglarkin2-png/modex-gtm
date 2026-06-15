import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildSnapshot, type ForSnapshot } from './snapshot';
import { buildHeroMap } from './hero-map';
import type { ForPageRow } from './store';

/** The per-account spear: the only hand/agent-authored part of a /for page. */
export interface SpearOverride {
  heroHook?: string;
  problemHook: string;
  problemHighlights?: string[];
  pilot: { site: string; body: string };
  proofCloser?: string;
  metaDescription?: string;
}

/** Load a committed demo pack off disk, or null if the slug has none yet. */
export async function loadDemoPack(slug: string): Promise<any | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

/** A real site name from the pack: the featured site, else the first mapped. */
function pilotSiteName(pack: any): string {
  const sites = pack.network?.sites ?? [];
  const featured = pack.account?.featuredSiteId && sites.find((s: any) => s.id === pack.account.featuredSiteId);
  return (featured?.name || sites[0]?.name || `${pack.account?.displayName ?? 'the'} flagship site`).trim();
}

/**
 * Deterministic baseline spear, built straight from the audit numbers. Honest
 * and data-driven (nothing fabricated), and follows the writing law: no em
 * dashes, "Yards" plural, none of the banned terms. This is the FIRST-PASS
 * spear that ships the moment a page is generated, so the link works now. The
 * A+ creative hook (a sharp heroHook + a tighter problemHook tied to a live
 * trigger) is authored separately by clawd or an agent and POSTed over this
 * same row to upgrade it in place. That authoring is the one piece kept out of
 * this deterministic path on purpose.
 */
export function templateOverride(pack: any, snap: ForSnapshot): SpearOverride {
  const name = pack.account?.displayName ?? snap.slug;
  const audited = snap.siloTax.auditedCount;
  const docks = pack.network?.totals?.dockDoors ?? 0;
  const trailers = pack.network?.totals?.trailerCapacity ?? 0;
  const dropReady = snap.siloTax.dropReady;
  const site = pilotSiteName(pack);

  const dockClause = docks > 0 ? `${docks.toLocaleString()} dock doors` : 'the docks';
  const trailerClause = trailers > 0 ? ` and ${trailers.toLocaleString()} trailer positions` : '';

  return {
    problemHook: `Across the ${audited} ${name} sites we mapped, ${dockClause}${trailerClause} still run on guard shacks, radios, and clipboards.`,
    problemHighlights: ['guard shacks, radios, and clipboards'],
    pilot: {
      site,
      body: `Nothing gets ripped out to start. Begin at one site, prove it in 60 days, then standardize across the network on proven economics. ${dropReady} of your ${audited} audited sites already run drop yards, where the 48 to 24 minute turn win lands first.`,
    },
  };
}

/**
 * Assemble a complete, ready-to-serve ForPageRow from an audited demo pack.
 * Fully deterministic by default: the snapshot (same ROI engine as /demo), the
 * hero geo, and the data-driven baseline spear. Pass `override` to inject an
 * authored A+ spear (clawd / an agent); either way the row ships LIVE, so the
 * link works immediately and an authored spear upgrades it in place on the next
 * POST. `pack` skips the disk read (the Slack flow / caller already has it).
 */
export async function generatePageRow(
  slug: string,
  opts: { pack?: any; override?: SpearOverride; status?: 'draft' | 'live' } = {},
): Promise<ForPageRow> {
  const demoPack = opts.pack ?? (await loadDemoPack(slug));
  if (!demoPack) throw new Error(`generatePageRow: no demo pack for "${slug}" — build the audit first`);

  const snap = buildSnapshot(demoPack);
  // Geo is best-effort: the projection reads a us-atlas JSON that a serverless
  // route's file-tracing can miss. If it fails, the page still ships (the hero
  // falls back to the assetless panel) rather than failing the whole generate.
  let geo: ReturnType<typeof buildHeroMap> | null = null;
  try { geo = buildHeroMap(demoPack); } catch { geo = null; }
  const override = opts.override ?? templateOverride(demoPack, snap);

  // Flow-State's render only reads pack.account.*; strip the heavy network to
  // keep the row small. The full pack rides along as demoPack for /demo.
  const leanPack = { account: demoPack.account };

  return { slug, status: opts.status ?? 'live', pack: leanPack, snap, override, geo, demoPack };
}
