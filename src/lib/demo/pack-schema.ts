/**
 * Demo Pack schema — the contract between the yard-audit data substrate
 * (`output/yard-audits/<slug>/`) and the YNS Live Demo surfaces
 * (`/demo/[account]`, microsite embeds, `/YNS` hub link, cold-email deep links).
 *
 * One pack per account. Every demo surface reads the SAME pack. This file
 * is the only place the demo contract is defined; if you change a field
 * here, you change every consumer.
 *
 * Source-of-truth flow (D1 sprint):
 *   roster.json + sites/NN-*.json + dossiers/NN-*.md  (modex-gtm/output/yard-audits)
 *     ──build-demo-pack.ts──▶  public/demo-packs/<slug>.json   (DemoPack — this schema)
 *     ──fetch-demo-tiles.ts──▶  public/demo-packs/tiles/<slug>/<id>-z{17,18}.jpg
 *     ──merge-clawd-research.ts──▶  attaches `research` field from
 *                                   clawd-control-plane/artifacts/yardflow/account_research.json
 */

import { z } from 'zod';

// ── Primitives ──────────────────────────────────────────────────────────────

const LatLng = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});
export type LatLng = z.infer<typeof LatLng>;

/** Axis-aligned bounding box in lat/lng. Matches `geofences.*` rectangles. */
const Bbox = z.object({
  south: z.number().gte(-90).lte(90),
  west: z.number().gte(-180).lte(180),
  north: z.number().gte(-90).lte(90),
  east: z.number().gte(-180).lte(180),
});
export type Bbox = z.infer<typeof Bbox>;

/** [west, south, east, north] — the GeoJSON / Mapbox-style network bbox order. */
const BboxTuple = z.tuple([z.number(), z.number(), z.number(), z.number()]);
export type BboxTuple = z.infer<typeof BboxTuple>;

const Confidence = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof Confidence>;

const ArchetypeId = z.enum(['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10']);
export type ArchetypeId = z.infer<typeof ArchetypeId>;

const UrbanRural = z.enum(['Urban', 'Rural']);

/**
 * Band labels mirror the Kraft Location Breakdown schema
 * (`scripts/yard-audit/schema.json`). `'NONE'` is added for facilities that
 * legitimately have no docks or drop area — corporate offices, R&D campuses,
 * and bulk-only mills the auditor flagged outside the trailer-logistics
 * archetype set.
 */
const DockBand = z.enum(['NONE', '0-10', '10-25', '25-50', '50+']);
const DropBand = z.enum(['NONE', '0-10', '10-25', '25-50', '50+']);

// ── Site-level shapes ───────────────────────────────────────────────────────

/**
 * The five geofence layers per site, mirroring the yard-audit JSON output.
 * `staging` and `dropYards` may be absent on open sites (#3 No Gate / No GS).
 */
const SiteGeofences = z.object({
  perimeter: Bbox,
  truckGate: Bbox.nullable(),
  dropYards: z.array(Bbox),
  dockAprons: z.array(Bbox),
  staging: Bbox.nullable(),
});
export type SiteGeofences = z.infer<typeof SiteGeofences>;

// All counts nullable: non-logistics sites (office HQs, value-added
// centers inside OEM plants, brokerage outposts) legitimately have no
// docks / no trailer parking / no gate. The auditor leaves these null
// rather than zero so "unknown but probably some" stays distinct from
// "definitely none". Demo surfaces render `—` for null.
const YardMetrics = z.object({
  dockDoorCount: z.number().int().nonnegative().nullable(),
  trailersVisible: z.number().int().nonnegative().nullable(),
  trailerParkingCapacity: z.number().int().nonnegative().nullable(),
  truckGateCount: z.number().int().nonnegative().nullable(),
  buildingCount: z.number().int().nonnegative().nullable(),
  siteAreaAcres: z.number().nonnegative().nullable(),
  railServed: z.boolean().nullable(),
});
export type YardMetrics = z.infer<typeof YardMetrics>;

/** The 22-field gate/dock/yard classification (Kraft-baseline parity). */
const Classification = z.object({
  truckGate: z.boolean(),
  guardShack: z.boolean(),
  remoteGs: z.boolean(),
  preGateStaging: z.boolean(),
  postGateStaging: z.boolean(),
  drivewayLong: z.boolean(),
  drivewayShort: z.boolean(),
  backupSensitive: z.boolean(),
  entryExitTogether: z.boolean(),
  entryExitSeparate: z.boolean(),
  // Nullable: 99 / 867 audited sites are office HQs, plants without truck
  // gates, or VACs inside OEM plants — no countable lanes. Null means
  // "not applicable", not "unknown".
  entryLanes: z.number().int().nonnegative().nullable(),
  exitLanes: z.number().int().nonnegative().nullable(),
  fastLaneOpportunity: z.boolean(),
  dockDoors: DockBand,
  dropArea: DropBand,
  shipRcvSeparate: z.boolean(),
  urbanRural: UrbanRural,
  connectivityIssue: z.boolean(),
  multipleFacilities: z.boolean(),
  scale: z.boolean(),
  dropYard: z.boolean(),
  multiStep: z.boolean(),
});
export type Classification = z.infer<typeof Classification>;

/**
 * A single scenario step — one move the driver/spotter makes through the
 * real geofence geometry. Targets resolve client-side to a geofence
 * rectangle on the site map. Populated in D3 (`scripts/.../scenarios.ts`).
 */
const ScenarioStep = z.object({
  step: z.string(),
  geofenceTarget: z.enum(['truckGate', 'dropYard', 'dockApron', 'staging', 'exit']),
  /** Index when target is `dropYard` or `dockApron` (which can be arrays). */
  targetIndex: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().positive(),
  /** Key into a per-archetype narration table; one line per step. */
  narrationKey: z.string(),
  /** Optional waitMs delta when comparing baseline vs YNS. */
  baselineWaitMs: z.number().int().nonnegative().optional(),
  ynsWaitMs: z.number().int().nonnegative().optional(),
});
export type ScenarioStep = z.infer<typeof ScenarioStep>;

const SiteScenario = z.object({
  archetypeId: ArchetypeId,
  steps: z.array(ScenarioStep).min(1),
  totalBaselineMs: z.number().int().nonnegative(),
  totalYnsMs: z.number().int().nonnegative(),
});
export type SiteScenario = z.infer<typeof SiteScenario>;

/** A pre-fetched satellite tile served from /public/demo-packs/tiles/... */
const Tile = z.object({
  url: z.string(),
  /** Zoom level the tile was captured at (Google Static Maps z param). */
  zoom: z.number().int().min(0).max(22),
  /** Tile center; may equal site.center or be offset. */
  center: LatLng,
  /** Pixel dimensions. Static Maps default 640×640. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Tile = z.infer<typeof Tile>;

const Site = z.object({
  /** Stable per-site id matching the `sites/NN-<slug>.json` filename stem. */
  id: z.string().regex(/^\d{2}-[a-z0-9-]+$/, 'site id must match NN-<slug>'),
  name: z.string().min(1),
  type: z.string().min(1),
  archetype: ArchetypeId,
  archetypeName: z.string().min(1),
  confidence: Confidence,
  uncertainFields: z.array(z.string()).default([]),
  center: LatLng,
  geofences: SiteGeofences,
  yardMetrics: YardMetrics,
  classification: Classification,
  scenario: SiteScenario.optional(),
  /** First 2 paragraphs of the dossier markdown, plain text. */
  dossierExcerpt: z.string().optional(),
  mapsUrl: z.string().url(),
  /** Pre-fetched satellite tiles keyed by zoom (typically '17' and '18'). */
  tiles: z.record(z.string(), Tile).optional(),
  /** Notes the audit agent flagged for field correction. */
  fieldNotes: z.record(z.string(), z.string()).optional(),
});
export type Site = z.infer<typeof Site>;

// ── Account-level shapes ────────────────────────────────────────────────────

/**
 * High-level account archetype for the demo header. NOT the same as the
 * #1–#10 yard archetype; this categorizes the company itself.
 */
const AccountArchetype = z.enum([
  'manufacturer',
  'cpg',
  'retailer',
  'grocer-distributor',
  '3pl',
  'oem-automotive',
  'beverage',
  'logistics-carrier',
]);
export type AccountArchetype = z.infer<typeof AccountArchetype>;

/**
 * Honesty note rendered as a `<CoverageHonesty>` banner when our audited
 * site count is below the estimated true network footprint. We never
 * silently under-claim — if we have 30 and they have 70, we say so.
 *
 * `auditedCount` is the count of fully-mapped sites shipped in the pack.
 * `droppedStubCount` is sites in the roster we couldn't resolve to public
 * coords/imagery; they're noted in the banner but not on the map.
 */
const CoverageNote = z.object({
  auditedCount: z.number().int().positive(),
  /** Best estimate of the account's in-scope footprint (e.g. "26 NA plants"). */
  estimatedFootprint: z.number().int().positive().nullable(),
  /**
   * Estimated total facility count worldwide. Often much larger than
   * `estimatedFootprint` for multinationals (Mondelez ~160 globally vs.
   * 26 NA; Coca-Cola ~250 bottlers globally vs. ~80 NA). Used by the
   * demo header to be honest about scope. Optional — accounts that are
   * NA-only (e.g. regional 3PLs, US-only retailers) won't have this.
   */
  totalGlobalFootprint: z.number().int().positive().nullable().optional(),
  /** Geographic scope of the audit (e.g. "NA", "global"). Optional. */
  auditedScope: z.string().optional(),
  /**
   * Number of facilities estimated to be running on a LEGACY YMS today
   * (CHEP, SAP, Manhattan, in-house, etc.). This is the bucket YardFlow
   * displaces — NOT a count of YardFlow deployments (which is always 0
   * on a demo, since these are prospects). Pre-fills the V2 ROI
   * calculator's `facilitiesWithYms` ask. Optional; when null, the
   * RoiCtaButton uses a vertical-based heuristic.
   */
  legacyYmsFacilityCount: z.number().int().nonnegative().nullable().optional(),
  droppedStubCount: z.number().int().nonnegative().default(0),
  capHit: z.boolean(),
  note: z.string(),
});
export type CoverageNote = z.infer<typeof CoverageNote>;

/** Clawd-control-plane account research sidecar. Shape is loose by design. */
const AccountResearch = z
  .object({
    mandate: z.string().optional(),
    pillars: z.array(z.string()).optional(),
    recentNews: z.array(z.object({ headline: z.string(), url: z.string().url().optional(), date: z.string().optional() })).optional(),
    keyContacts: z.array(z.object({ name: z.string(), title: z.string().optional() })).optional(),
  })
  .passthrough()
  .nullable();
export type AccountResearch = z.infer<typeof AccountResearch>;

const NetworkTotals = z.object({
  dockDoors: z.number().int().nonnegative(),
  trailerCapacity: z.number().int().nonnegative(),
  gates: z.number().int().nonnegative(),
  railServed: z.number().int().nonnegative(),
  acres: z.number().nonnegative(),
});

// zod 4: `z.record(enum, V)` requires ALL enum keys. We want "some-or-none",
// so use `partialRecord`. Archetypes a network doesn't have are simply absent.
const ArchetypeMix = z.partialRecord(ArchetypeId, z.number().int().nonnegative());

const Network = z.object({
  /** [west, south, east, north] — fit-bounds for the network-wide map. */
  bbox: BboxTuple,
  archetypeMix: ArchetypeMix,
  totals: NetworkTotals,
  sites: z.array(Site).min(1),
});
export type Network = z.infer<typeof Network>;

// ── Pack root ───────────────────────────────────────────────────────────────

export const DemoPackSchema = z.object({
  /** Schema version. Bump when the contract changes. */
  schemaVersion: z.literal('1'),
  /** ISO date the pack was built. */
  builtAt: z.string().datetime(),
  account: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
    displayName: z.string().min(1),
    archetype: AccountArchetype,
    siteCount: z.number().int().positive(),
    coverageNote: CoverageNote.nullable(),
    /**
     * The site we want a prospect to land on first when they hit
     * /demo/<slug> with no `?site=` param, or when a microsite CTA
     * deep-links into the simulator. Picked at build time as the
     * largest-archetype-cluster representative. Optional for
     * backward compat — older packs may not have it.
     */
    featuredSiteId: z.string().regex(/^\d{2}-[a-z0-9-]+$/).optional(),
    /**
     * B.T1 — Editorial intro for the network, rendered at the top of
     * the microsite. 2-3 sentences. Names the industry, cites at least
     * one specific number, ends with a forward statement about what
     * YardFlow changes for this industry. Authored in voice-CI-clean
     * prose: no em dashes, no filler phrases. Optional for backward
     * compatibility; the microsite renders nothing if absent.
     */
    dossierIntro: z.string().max(800).optional(),
    /**
     * B.T6 — Three surprising findings derived from the actual audit
     * data, each a single quantified sentence. Rendered as a card row
     * above the network atlas tabs. Optional; the SurprisingFindings
     * component returns null if missing or fewer than 3 items.
     */
    surprisingFindings: z.array(z.string().max(160)).max(3).optional(),
    /**
     * D.T3 — Per-industry ROI defaults. Seeds the V2 calculator's
     * "average margin per shipment" ask with an industry-representative
     * value so a prefilled run lands on a realistic number instead of
     * the generic $1,000 fallback. Optional for backward compat; the
     * calculator falls back to 1000 when absent.
     */
    roiDefaults: z
      .object({
        averageMarginPerShipment: z.number().positive(),
      })
      .optional(),
    /**
     * I.T6 — optional 60-second teardown video (path under /public or an
     * absolute URL). When present, the microsite renders a lazy player;
     * absent packs render nothing. Videos are produced out-of-band.
     */
    teardownVideoSrc: z.string().optional(),
  }),
  research: AccountResearch,
  network: Network,
});

export type DemoPack = z.infer<typeof DemoPackSchema>;

/**
 * Parse-or-throw helper for build-time pack generation. Use this in
 * `scripts/yard-audit/build-demo-pack.ts` so an invalid pack fails the
 * build instead of shipping silently. For runtime reads on the demo
 * surfaces, prefer `DemoPackSchema.safeParse` so we can render a graceful
 * fallback instead of a 500.
 */
export function parseDemoPack(input: unknown): DemoPack {
  return DemoPackSchema.parse(input);
}
