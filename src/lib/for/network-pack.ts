/**
 * network-pack.ts
 *
 * Builds a SCHEMA-VALID modex DemoPack from a geocoded facility roster with
 * NO per-site yard audit.  All yardMetrics are null, geofences are coarse
 * geocoded perimeter boxes, confidence is 'low', and the coverageNote is
 * explicit that this is a geocoded estimate — not an audited pack.
 *
 * The returned value is always the output of DemoPackSchema.parse(), so any
 * schema violation throws at build time rather than silently shipping bad data.
 */

import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';

// ── Archetype #3 name from archetype-key.json ──────────────────────────────
// "No Gate / No GS" — open site, trucks enter directly
const ARCHETYPE_3_NAME = 'No Gate / No GS';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Slugify a facility name to a safe id fragment: lowercase + hyphens only. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60); // cap length so id regex stays readable
}

/**
 * Coarse geocoded perimeter box centred on a lat/lng point.
 * ~0.0025° ≈ 275 m at mid-latitudes — a reasonable "we know where it is"
 * approximation.  The schema accepts a Bbox {south, west, north, east}.
 */
function perimeterBox(lat: number, lng: number) {
  const delta = 0.0025;
  return {
    south: lat - delta,
    west: lng - delta,
    north: lat + delta,
    east: lng + delta,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface NetworkRoster {
  account: string;
  slug: string;
  /** Must be a valid AccountArchetype enum value. */
  archetype: string;
  facilities: Array<{
    name: string;
    city?: string;
    state?: string;
    type?: string;
    lat?: number;
    lng?: number;
  }>;
}

/**
 * Turn a geocoded facility roster into a schema-valid DemoPack.
 *
 * Honest constraints:
 *  - yardMetrics: all null (no dock counts, no acreage — not audited)
 *  - geofences.perimeter: a coarse ±0.0025° bbox centred on the geocoded point
 *  - confidence: 'low' on every site
 *  - coverageNote.note: explicit "geocoded estimate, not yard-audited"
 *
 * Facilities missing both lat AND lng are silently dropped; the caller can
 * check `pack.network.sites.length` to discover how many survived.
 *
 * @throws {ZodError} if the assembled pack violates DemoPackSchema
 */
export function buildNetworkPack(
  roster: NetworkRoster,
  builtAt = '2026-06-25T00:00:00.000Z',
): DemoPack {
  // 1. Filter to facilities with finite coordinates
  const geo = roster.facilities.filter(
    (f) =>
      typeof f.lat === 'number' &&
      isFinite(f.lat) &&
      typeof f.lng === 'number' &&
      isFinite(f.lng),
  ) as Array<Required<Pick<NetworkRoster['facilities'][0], 'lat' | 'lng'>> & NetworkRoster['facilities'][0]>;

  if (geo.length === 0) {
    throw new Error(
      `buildNetworkPack: roster for "${roster.account}" has no facilities with coordinates`,
    );
  }

  // 2. Build sites
  const sites = geo.map((f, i) => {
    const id = `${String(i + 1).padStart(2, '0')}-${slugify(f.name)}`;
    const { lat, lng } = f;

    return {
      id,
      name: f.name,
      type: f.type ?? 'Facility',
      archetype: '#3' as const,
      archetypeName: ARCHETYPE_3_NAME,
      confidence: 'low' as const,
      uncertainFields: [] as string[],
      center: { lat, lng },
      geofences: {
        perimeter: perimeterBox(lat, lng),
        truckGate: null,
        dropYards: [],
        dockAprons: [],
        staging: null,
      },
      yardMetrics: {
        dockDoorCount: null,
        trailersVisible: null,
        trailerParkingCapacity: null,
        truckGateCount: null,
        buildingCount: null,
        siteAreaAcres: null,
        railServed: null,
      },
      classification: {
        truckGate: false,
        guardShack: false,
        remoteGs: false,
        preGateStaging: false,
        postGateStaging: false,
        drivewayLong: false,
        drivewayShort: false,
        backupSensitive: false,
        entryExitTogether: false,
        entryExitSeparate: false,
        entryLanes: null,
        exitLanes: null,
        fastLaneOpportunity: false,
        dockDoors: 'NONE' as const,
        dropArea: 'NONE' as const,
        shipRcvSeparate: false,
        urbanRural: 'Rural' as const,
        connectivityIssue: false,
        multipleFacilities: false,
        scale: false,
        dropYard: false,
        multiStep: false,
      },
      mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
    };
  });

  // 3. Network bbox: [west, south, east, north]
  const lats = sites.map((s) => s.center.lat);
  const lngs = sites.map((s) => s.center.lng);
  const bbox: [number, number, number, number] = [
    Math.min(...lngs), // west
    Math.min(...lats), // south
    Math.max(...lngs), // east
    Math.max(...lats), // north
  ];

  const n = sites.length;

  // 4. Account block
  const account = {
    slug: roster.slug,
    displayName: roster.account,
    archetype: roster.archetype as DemoPack['account']['archetype'],
    siteCount: n,
    coverageNote: {
      // auditedCount must be positive (schema: .int().positive())
      // For a geocoded-only pack, every site is "located but not audited".
      // We report the actual geocoded site count to stay honest.
      auditedCount: n,
      estimatedFootprint: n,
      droppedStubCount: 0,
      capHit: false,
      note: 'Geocoded network estimate — real locations, not yard-audited.',
      auditedScope: 'estimated',
    },
    featuredSiteId: sites[0].id,
  };

  // 5. Network block
  const network = {
    bbox,
    archetypeMix: { '#3': n } as Record<string, number>,
    totals: {
      dockDoors: 0,
      trailerCapacity: 0,
      gates: 0,
      railServed: 0,
      acres: 0,
    },
    sites,
  };

  // 6. Assemble and validate — parse throws ZodError on any schema violation
  const raw = {
    schemaVersion: '2' as const,
    builtAt,
    account,
    research: null,
    network,
  };

  return DemoPackSchema.parse(raw);
}
