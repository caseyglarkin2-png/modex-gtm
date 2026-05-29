/**
 * Sprint 2.5 — Industry anchor map for the /demo gallery.
 *
 * Each entry pins ONE demo pack as the visual representative of an
 * industry segment. Selection criteria (per docs/modex-gtm-marketing-
 * inventory.md §2): depth-of-audit (audited count + cap-hit), global
 * footprint set so /roi extrapolation reads honestly, recognizable
 * brand for the gallery card, and network-shape variety across the
 * picks (warehouse vs campus vs drayage vs rail-served).
 *
 * The gallery surfaces these in the order declared below. To collapse
 * to 8 tiles, drop frito-lay, kimberly-clark, and georgia-pacific
 * (lowest visual differentiation from their adjacent picks).
 *
 * Industry IDs are stable: they appear in the localStorage hand-off,
 * tracker events, and the /roi?industry= URL param. Renaming an id
 * breaks attribution joins downstream.
 */
/**
 * G0.T12 / G5.T1 — Archetype enum.
 *
 * Five top-level archetype buckets used by the gallery filter rail
 * (Sprint G5) and the archetype-mix chart palette (Sprint G1.B1).
 * Casing locked: lowercase + hyphen-free, except `3pl` which carries
 * the numeric prefix verbatim because the industry calls it "3PL".
 */
export type Archetype = 'cpg' | 'logistics' | 'manufacturing' | 'retail' | '3pl';

export const ARCHETYPE_LABELS_TOP: Record<Archetype, string> = {
  cpg: 'CPG',
  logistics: 'Logistics',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  '3pl': '3PL',
};

export interface IndustryAnchor {
  /** Stable id; appears in tracking + URL params. */
  id: string;
  /** Human-readable label for tile copy + CTA strings. */
  label: string;
  /** Pack slug — must exist at public/demo-packs/<slug>.json. */
  slug: string;
  /** One-liner shown under the tile headline (industry framing, not pack-specific). */
  blurb: string;
  /** Top-level archetype for the gallery filter rail (G5). Optional only
   *  for backward compatibility with older consumers; the gallery
   *  filter falls back to "All" when missing. */
  archetype?: Archetype;
}

export const INDUSTRY_ANCHORS: IndustryAnchor[] = [
  {
    id: 'beverage',
    label: 'Beverage',
    slug: 'coca-cola',
    blurb: 'Bottlers, brewers, and distributors. High-velocity dock cycles, mixed truckload + parcel out.',
    archetype: 'cpg',
  },
  {
    id: 'cpg-food',
    label: 'CPG · Food',
    slug: 'mondelez-international',
    blurb: 'Plants and DCs feeding retail, grocery, and foodservice. Drop-yard heavy, peak-load sensitive.',
    archetype: 'cpg',
  },
  {
    id: 'cpg-snacks',
    label: 'CPG · Snacks',
    slug: 'frito-lay',
    blurb: 'Rail-served snack networks. Tight on-time-delivery windows, regional DC sprawl.',
    archetype: 'cpg',
  },
  {
    id: 'cpg-paper',
    label: 'CPG · Personal Care & Paper',
    slug: 'kimberly-clark',
    blurb: 'Large per-site footprints, mixed inbound rail + outbound truckload, multi-shift gate ops.',
    archetype: 'cpg',
  },
  {
    id: '3pl',
    label: '3PL · Warehousing',
    slug: 'gxo',
    blurb: 'Dense warehouse networks running for multiple shippers. The canonical "warehouse archetype" template.',
    archetype: '3pl',
  },
  {
    id: 'oem-automotive',
    label: 'OEM · Automotive',
    slug: 'ford',
    blurb: 'Rail-served truck and engine plants, supplier inbound, vehicle staging yards.',
    archetype: 'manufacturing',
  },
  {
    id: 'manufacturing-heavy',
    label: 'Manufacturing · Heavy Equipment',
    slug: 'caterpillar',
    blurb: 'Remote check-in archetypes, big-piece outbound, mixed inbound parts staging.',
    archetype: 'manufacturing',
  },
  {
    id: 'building-materials',
    label: 'Building Materials & Paper',
    slug: 'georgia-pacific',
    blurb: 'Pulp mills + lumber + container plants. Rail-served at scale, hazmat zones, gate-controlled.',
    archetype: 'manufacturing',
  },
  {
    id: 'retail',
    label: 'Retail · Big-Box DC',
    slug: 'the-home-depot',
    blurb: 'Massive RDCs feeding store networks. Hundreds of docks per facility, dwell-time the KPI.',
    archetype: 'retail',
  },
  {
    id: 'grocer-distributor',
    label: 'Grocer · Distributor',
    slug: 'performance-food-group',
    blurb: 'Foodservice distribution networks. Multi-temp, multi-shift, route-driven dispatch.',
    archetype: 'retail',
  },
  {
    id: 'logistics-carrier',
    label: 'Logistics · Parcel & LTL',
    slug: 'fedex',
    blurb: 'Hubs and terminals. The biggest networks in the dataset, thousands of docks and trailers.',
    archetype: 'logistics',
  },
];

const ANCHOR_BY_SLUG = new Map(INDUSTRY_ANCHORS.map((a) => [a.slug, a]));
const ANCHOR_BY_ID = new Map(INDUSTRY_ANCHORS.map((a) => [a.id, a]));

/** Reverse lookup: given a pack slug, return its industry anchor (or null). */
export function getIndustryFromSlug(slug: string): IndustryAnchor | null {
  return ANCHOR_BY_SLUG.get(slug) ?? null;
}

/** Forward lookup: given an industry id, return its anchor (or null). */
export function getIndustryById(id: string): IndustryAnchor | null {
  return ANCHOR_BY_ID.get(id) ?? null;
}
