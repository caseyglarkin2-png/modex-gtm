import { describe, expect, it } from 'vitest';
import { filterProspects } from '@/lib/discovery/filters';
import type { CuratedRow } from '@/lib/discovery/types';

function mkCurated(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'Acme Co',
    address: '1 Main St, Springfield, IL 62701, USA',
    cityState: 'Springfield, IL',
    lat: 40,
    lng: -75,
    placeId: Math.random().toString(36).slice(2),
    icpScore: 50,
    tier: 'B',
    verticalMatch: 0,
    enterpriseScale: 0,
    networkComplexity: 0,
    primoProximity: 0,
    corridorDensity: 0,
    placeTypeBonus: 0,
    isExistingAccount: false,
    nearestPrimoName: 'US PL Allentown Factory',
    nearestPrimoDistance: 100,
    corridor: 'Springfield, IL',
    discoveredVia: [],
    excluded: false,
    segment: 'shipper',
    confidence: 'medium',
    mergedCount: 0,
    ...p,
  };
}

describe('filterProspects — segment & confidence', () => {
  const rows = [
    mkCurated({ name: 'Shipper DC', segment: 'shipper' }),
    mkCurated({ name: 'Carrier Co', segment: 'carrier' }),
    mkCurated({ name: 'Amazon Delivery Station', segment: 'parcel' }),
    mkCurated({ name: 'Low Conf', segment: 'shipper', confidence: 'low' }),
  ];

  it('drops parcel rows when excludeParcel is set', () => {
    const out = filterProspects(rows, { excludeParcel: true });
    expect(out.some((r) => r.segment === 'parcel')).toBe(false);
    expect(out).toHaveLength(3);
  });

  it('still shows parcel when the segment filter explicitly selects parcel', () => {
    const out = filterProspects(rows, { excludeParcel: true, segment: 'parcel' });
    expect(out).toHaveLength(1);
    expect(out[0].segment).toBe('parcel');
  });

  it('filters to a single segment', () => {
    const out = filterProspects(rows, { segment: 'carrier' });
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Carrier Co');
  });

  it('applies a minimum confidence threshold', () => {
    const out = filterProspects(rows, { minConfidence: 'medium' });
    expect(out.some((r) => r.confidence === 'low')).toBe(false);
    expect(out).toHaveLength(3);
  });
});

describe('filterProspects — daily slice (tiers + maxDistance)', () => {
  const rows = [
    mkCurated({ name: 'A near', tier: 'A', nearestPrimoDistance: 5 }),
    mkCurated({ name: 'B near', tier: 'B', nearestPrimoDistance: 20 }),
    mkCurated({ name: 'A far', tier: 'A', nearestPrimoDistance: 200 }),
    mkCurated({ name: 'C near', tier: 'C', nearestPrimoDistance: 5 }),
  ];

  it('keeps only the listed tiers', () => {
    const out = filterProspects(rows, { tiers: ['A', 'B'] });
    expect(out.map((r) => r.name).sort()).toEqual(['A far', 'A near', 'B near']);
  });

  it('keeps only rows within maxDistance of a reference', () => {
    const out = filterProspects(rows, { maxDistance: 25 });
    expect(out.some((r) => r.name === 'A far')).toBe(false);
    expect(out).toHaveLength(3);
  });

  it('composes tiers + maxDistance into the sellable slice', () => {
    const out = filterProspects(rows, { tiers: ['A', 'B'], maxDistance: 25 });
    expect(out.map((r) => r.name).sort()).toEqual(['A near', 'B near']);
  });
});

describe('filterProspects — needsContacts', () => {
  const rows = [
    mkCurated({ name: 'Covered', contactCount: 3 }),
    mkCurated({ name: 'Zero', contactCount: 0 }),
    mkCurated({ name: 'Unknown' }),
  ];

  it('keeps only rows with no known contacts, treating undefined as 0', () => {
    const out = filterProspects(rows, { needsContacts: true });
    expect(out.map((r) => r.name).sort()).toEqual(['Unknown', 'Zero']);
  });

  it('is a no-op when the flag is off', () => {
    expect(filterProspects(rows, { needsContacts: false })).toHaveLength(3);
    expect(filterProspects(rows, {})).toHaveLength(3);
  });

  it('composes with other predicates', () => {
    const mixed = [
      mkCurated({ name: 'A no contacts', tier: 'A', contactCount: 0 }),
      mkCurated({ name: 'A covered', tier: 'A', contactCount: 2 }),
      mkCurated({ name: 'C no contacts', tier: 'C', contactCount: 0 }),
    ];
    const out = filterProspects(mixed, { tier: 'A', needsContacts: true });
    expect(out.map((r) => r.name)).toEqual(['A no contacts']);
  });
});
