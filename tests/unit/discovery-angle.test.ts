import { describe, expect, it } from 'vitest';
import { generateAngle, facilityNoun } from '@/lib/discovery/angle';
import type { CuratedRow } from '@/lib/discovery/types';

function mkRow(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'Acme Co',
    address: '1 Main St, Springfield, IL 62701, USA',
    cityState: 'Springfield, IL',
    lat: 40,
    lng: -75,
    placeId: 'x',
    icpScore: 80,
    tier: 'A',
    verticalMatch: 25,
    enterpriseScale: 25,
    networkComplexity: 25,
    primoProximity: 0,
    corridorDensity: 0,
    placeTypeBonus: 0,
    isExistingAccount: false,
    nearestPrimoName: 'US DC NFI - Breinigsville',
    nearestPrimoDistance: 2.7,
    corridor: 'Allentown, PA',
    discoveredVia: [],
    excluded: false,
    segment: 'shipper',
    confidence: 'high',
    mergedCount: 0,
    ...p,
  };
}

describe('facilityNoun', () => {
  it('reads the facility type from the name', () => {
    expect(facilityNoun('Nestle Distribution Center')).toBe('DC');
    expect(facilityNoun('Acme Cold Storage Warehouse')).toBe('warehouse');
    expect(facilityNoun('Frito-Lay Manufacturing Plant')).toBe('plant');
    expect(facilityNoun('Some Random Place')).toBe('facility');
  });
});

describe('generateAngle', () => {
  it('leads with proximity proof when a reference site is near', () => {
    const a = generateAngle(mkRow({ name: 'Nestle Distribution Center', nearestPrimoDistance: 2.7 }));
    expect(a).toMatch(/2\.7 mi/);
    expect(a).toMatch(/DC/);
    expect(a.toLowerCase()).toContain('yardflow');
  });

  it('never uses an em dash (Casey style preference) in either branch', () => {
    expect(generateAngle(mkRow({ nearestPrimoDistance: 2.7 }))).not.toContain('—');
    expect(generateAngle(mkRow({ nearestPrimoDistance: 220, corridor: 'Dallas, TX' }))).not.toContain('—');
  });

  it('names the nearest reference site city/state when it resolves', () => {
    // nearestPrimoName 'US DC NFI - Breinigsville' resolves to Breinigsville, PA
    const a = generateAngle(mkRow({ name: 'Nestle Distribution Center', nearestPrimoDistance: 2.7 }));
    expect(a).toContain('Breinigsville, PA');
  });

  it('falls back to a generic proximity line when the site name does not resolve', () => {
    const a = generateAngle(mkRow({ nearestPrimoName: 'Some Unknown Site', nearestPrimoDistance: 3 }));
    expect(a.toLowerCase()).toContain('yardflow');
    expect(a).toMatch(/3\.0 mi/);
    expect(a).not.toContain('undefined');
    expect(a).not.toContain(', ,'); // no empty "in" clause artifact
  });

  it('falls back to a fit/corridor angle when no reference is near', () => {
    const a = generateAngle(mkRow({ nearestPrimoDistance: 220, corridor: 'Dallas, TX' }));
    expect(a).toContain('Dallas, TX');
    expect(a).not.toMatch(/220 mi from/);
  });

  it('is a non-empty single line', () => {
    const a = generateAngle(mkRow({}));
    expect(a.length).toBeGreaterThan(10);
    expect(a).not.toContain('\n');
  });
});
