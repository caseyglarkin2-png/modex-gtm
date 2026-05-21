import { describe, expect, it } from 'vitest';
import { DemoPackSchema, parseDemoPack, type DemoPack } from '@/lib/demo/pack-schema';

/**
 * D0.4 — DemoPack schema contract test.
 *
 * Locks the cross-repo data contract that `scripts/yard-audit/build-demo-pack.ts`
 * emits and `/demo/[account]` consumes. The fixture below is a minimal but
 * spec-complete pack (one site, one archetype) — if a field changes in the
 * schema, this test forces a corresponding fixture update and surfaces the
 * break before a pack ever ships.
 */

function makeMinimalPack(): DemoPack {
  return {
    schemaVersion: '1',
    builtAt: '2026-05-20T00:00:00.000Z',
    account: {
      slug: 'mondelez-international',
      displayName: 'Mondelez International',
      archetype: 'cpg',
      siteCount: 1,
      coverageNote: {
        auditedCount: 22,
        estimatedFootprint: 26,
        droppedStubCount: 0,
        capHit: false,
        note: 'Audited 22 of an estimated 26 NA plants. The 4 not shown are co-manufacturer sites.',
      },
      featuredSiteId: '01-nabisco-richmond-biscuit-bakery',
    },
    research: {
      mandate: 'Vision 2030 — net revenue growth and margin expansion via portfolio reshape.',
      pillars: ['Biscuit', 'Chocolate', 'Gum & Candy', 'Acquisition Integration'],
    },
    network: {
      bbox: [-77.36, 37.49, -77.34, 37.5],
      archetypeMix: { '#6': 1 },
      totals: {
        dockDoors: 40,
        trailerCapacity: 90,
        gates: 1,
        railServed: 0,
        acres: 84,
      },
      sites: [
        {
          id: '01-nabisco-richmond-biscuit-bakery',
          name: 'Nabisco Richmond Biscuit Bakery - Richmond VA',
          type: 'Manufacturing - biscuit/cookie bakery',
          archetype: '#6',
          archetypeName: 'Gate + GS (not BU sens.) + campus',
          confidence: 'high',
          uncertainFields: ['scale', 'exitLanes'],
          center: { lat: 37.496, lng: -77.354 },
          geofences: {
            perimeter: { south: 37.4928, west: -77.3572, north: 37.4983, east: -77.3507 },
            truckGate: { south: 37.4944, west: -77.3554, north: 37.4949, east: -77.3547 },
            dropYards: [
              { south: 37.4946, west: -77.3564, north: 37.4972, east: -77.3551 },
            ],
            dockAprons: [
              { south: 37.495, west: -77.3548, north: 37.496, east: -77.352 },
            ],
            staging: { south: 37.4938, west: -77.3546, north: 37.4949, east: -77.3536 },
          },
          yardMetrics: {
            dockDoorCount: 40,
            trailersVisible: 55,
            trailerParkingCapacity: 90,
            truckGateCount: 1,
            buildingCount: 3,
            siteAreaAcres: 84,
            railServed: false,
          },
          classification: {
            truckGate: true,
            guardShack: true,
            remoteGs: false,
            preGateStaging: false,
            postGateStaging: true,
            drivewayLong: true,
            drivewayShort: false,
            backupSensitive: false,
            entryExitTogether: true,
            entryExitSeparate: false,
            entryLanes: 1,
            exitLanes: 1,
            fastLaneOpportunity: true,
            dockDoors: '25-50',
            dropArea: '50+',
            shipRcvSeparate: false,
            urbanRural: 'Urban',
            connectivityIssue: false,
            multipleFacilities: true,
            scale: false,
            dropYard: true,
            multiStep: false,
          },
          mapsUrl: 'https://www.google.com/maps/@37.4960,-77.3540,400m/data=!3m1!1e3',
        },
      ],
    },
  };
}

describe('DemoPackSchema', () => {
  it('parses a minimal, spec-complete pack', () => {
    const pack = makeMinimalPack();
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('rejects a slug that is not kebab-case', () => {
    const pack = makeMinimalPack();
    pack.account.slug = 'Mondelez_International';
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('rejects a site id that does not match NN-<slug>', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.id = 'nabisco-richmond'; // missing NN prefix
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range latitude', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.center.lat = 99;
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown archetype id', () => {
    const pack = makeMinimalPack();
    // @ts-expect-error — deliberately invalid for the test
    pack.network.sites[0]!.archetype = '#11';
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('rejects a dock-door band outside the Kraft-baseline enum', () => {
    const pack = makeMinimalPack();
    // @ts-expect-error — deliberately invalid for the test
    pack.network.sites[0]!.classification.dockDoors = '100+';
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('accepts NONE bands for non-logistics sites (offices, bulk mills)', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.classification.dockDoors = 'NONE';
    pack.network.sites[0]!.classification.dropArea = 'NONE';
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('accepts null entryLanes/exitLanes for sites without truck lanes', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.classification.entryLanes = null;
    pack.network.sites[0]!.classification.exitLanes = null;
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('accepts fully-null yardMetrics for brokerage-only outposts', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.yardMetrics = {
      dockDoorCount: null,
      trailersVisible: null,
      trailerParkingCapacity: null,
      truckGateCount: null,
      buildingCount: null,
      siteAreaAcres: null,
      railServed: null,
    };
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('allows research to be null when no clawd record exists', () => {
    const pack = makeMinimalPack();
    pack.research = null;
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('allows truckGate and staging to be null (open #3 No-Gate sites)', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.geofences.truckGate = null;
    pack.network.sites[0]!.geofences.staging = null;
    pack.network.sites[0]!.classification.truckGate = false;
    pack.network.sites[0]!.classification.guardShack = false;
    pack.network.sites[0]!.archetype = '#3';
    pack.network.sites[0]!.archetypeName = 'No Gate / No GS';
    expect(() => parseDemoPack(pack)).not.toThrow();
  });

  it('requires at least one site in the network', () => {
    const pack = makeMinimalPack();
    pack.network.sites = [];
    const result = DemoPackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('accepts an optional scenario block (D3 will populate)', () => {
    const pack = makeMinimalPack();
    pack.network.sites[0]!.scenario = {
      archetypeId: '#6',
      totalBaselineMs: 47 * 60 * 1000,
      totalYnsMs: 9 * 60 * 1000,
      steps: [
        {
          step: 'Arrive at gate',
          geofenceTarget: 'truckGate',
          durationMs: 120_000,
          narrationKey: 'gate.arrive',
          baselineWaitMs: 600_000,
          ynsWaitMs: 60_000,
        },
      ],
    };
    expect(() => parseDemoPack(pack)).not.toThrow();
  });
});
