import { describe, expect, it } from 'vitest';
import {
  classifySegment,
  assessConfidence,
  isGrainArtifact,
  dedupeByGrain,
  curate,
  normalizeSiteName,
} from '@/lib/discovery/curate';
import type { ProspectRow } from '@/lib/discovery/types';

/** Build a ProspectRow with sensible defaults; override what a test cares about. */
function mkRow(p: Partial<ProspectRow>): ProspectRow {
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
    ...p,
  };
}

describe('classifySegment', () => {
  it('tags parcel/last-mile facilities as parcel', () => {
    expect(classifySegment(mkRow({ name: 'Amazon Delivery Station DPA5' }))).toBe('parcel');
    expect(classifySegment(mkRow({ name: 'FedEx Ground Sortation Center' }))).toBe('parcel');
  });

  it('tags asset carriers as carrier', () => {
    expect(classifySegment(mkRow({ name: 'J.B. Hunt Transport Services' }))).toBe('carrier');
    expect(classifySegment(mkRow({ name: 'Old Dominion Freight Line' }))).toBe('carrier');
    expect(classifySegment(mkRow({ name: 'Ryder Truck Rental' }))).toBe('carrier');
  });

  it('tags logistics/3PL providers as 3pl', () => {
    expect(classifySegment(mkRow({ name: 'NFI Logistics Distribution Center' }))).toBe('3pl');
    expect(classifySegment(mkRow({ name: 'GXO Logistics' }))).toBe('3pl');
  });

  it('defaults real shipper facilities to shipper', () => {
    expect(classifySegment(mkRow({ name: 'Nestle Distribution Center' }))).toBe('shipper');
    expect(classifySegment(mkRow({ name: 'Frito-Lay Manufacturing Plant' }))).toBe('shipper');
  });
});

describe('assessConfidence', () => {
  it('is high for a facility-named, brand-backed row', () => {
    expect(
      assessConfidence(mkRow({ name: 'Nestle Distribution Center', enterpriseScale: 25, networkComplexity: 25 })),
    ).toBe('high');
  });

  it('is low when neither a facility name nor enterprise signal is present', () => {
    expect(
      assessConfidence(mkRow({ name: 'Bobs Quick Mart', enterpriseScale: 0, networkComplexity: 0 })),
    ).toBe('low');
  });

  it('is medium for a facility name without an enterprise signal', () => {
    expect(
      assessConfidence(mkRow({ name: 'Generic Warehouse', enterpriseScale: 0, networkComplexity: 0 })),
    ).toBe('medium');
  });
});

describe('isGrainArtifact', () => {
  it('flags truck-entrance and gate names', () => {
    expect(isGrainArtifact('Nestle Distribution Center (Truck Entrance)')).toBe(true);
    expect(isGrainArtifact('Target DC - Gate 4')).toBe(true);
    expect(isGrainArtifact('Walmart DC Truck Gate')).toBe(true);
  });

  it('does not flag a normal facility name', () => {
    expect(isGrainArtifact('Nestle Distribution Center')).toBe(false);
  });
});

describe('dedupeByGrain', () => {
  it('drops a truck-entrance artifact that sits next to its real site', () => {
    const site = mkRow({ name: 'Nestle Distribution Center', lat: 40.5, lng: -75.6, icpScore: 100 });
    const gate = mkRow({
      name: 'Nestle Distribution Center (Truck Entrance)',
      lat: 40.5008,
      lng: -75.6, // ~0.06 mi away
      icpScore: 100,
    });
    const out = dedupeByGrain([gate, site]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Nestle Distribution Center');
    expect(out[0].mergedCount).toBe(1);
  });

  it('keeps two genuinely different companies at the same address', () => {
    const a = mkRow({ name: 'Nestle Distribution Center', lat: 40.5, lng: -75.6 });
    const b = mkRow({ name: 'Coca-Cola Bottling Plant', lat: 40.5008, lng: -75.6 });
    const out = dedupeByGrain([a, b]);
    expect(out).toHaveLength(2);
  });

  it('leaves no two rows sharing a site name within the merge radius', () => {
    const rows = [
      mkRow({ name: 'Sysco Foodservice', lat: 41.0, lng: -74.0, icpScore: 90 }),
      mkRow({ name: 'Sysco Foodservice', lat: 41.0005, lng: -74.0, icpScore: 80 }), // dup, ~0.03 mi
      mkRow({ name: 'Sysco Foodservice', lat: 42.0, lng: -73.0, icpScore: 85 }), // far → distinct
    ];
    const out = dedupeByGrain(rows);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const sameName = normalizeSiteName(out[i].name) === normalizeSiteName(out[j].name);
        const near = haversineMi(out[i].lat, out[i].lng, out[j].lat, out[j].lng) <= 0.15;
        expect(sameName && near).toBe(false);
      }
    }
    expect(out).toHaveLength(2);
  });
});

describe('curate', () => {
  it('enriches every row with a segment and confidence', () => {
    const rows = [
      mkRow({ name: 'Nestle Distribution Center', enterpriseScale: 25 }),
      mkRow({ name: 'Amazon Delivery Station DPA5' }),
    ];
    const out = curate(rows);
    for (const r of out) {
      expect(r.segment).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(r.confidence);
    }
    const parcel = out.find((r) => r.name.includes('Amazon Delivery'));
    expect(parcel?.segment).toBe('parcel');
  });
});

// Local haversine for the invariant assertion (mirrors the lib's).
function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
