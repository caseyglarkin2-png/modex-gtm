import { describe, expect, it } from 'vitest';
import { buildOutreach } from '@/lib/discovery/outreach';
import type { CuratedRow } from '@/lib/discovery/types';

function mkRow(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'PepsiCo Mt Creek', address: '', cityState: 'Dallas, TX', lat: 32, lng: -96, placeId: 'x',
    icpScore: 90, tier: 'A', verticalMatch: 25, enterpriseScale: 25, networkComplexity: 25,
    primoProximity: 0, corridorDensity: 0, placeTypeBonus: 0, isExistingAccount: false,
    nearestPrimoName: 'US PL Dallas 2 Factory', nearestPrimoDistance: 0.7, corridor: 'Dallas, TX',
    discoveredVia: [], excluded: false, segment: 'shipper', confidence: 'high', mergedCount: 0, ...p,
  };
}

describe('buildOutreach', () => {
  it('near a reference: references their facility, ships the proof image, no em dash', () => {
    const o = buildOutreach(mkRow({}), 'Salvador');
    expect(o.body).toContain('Hi Salvador,');
    expect(o.body).toContain('your facility in Dallas, TX');
    expect(o.subject).toContain('0.7 mi');
    expect(o.imageUrl).toMatch(/allentown-yard-proof\.jpg$/);
    expect(o.body).not.toContain('—');
    expect(o.subject).not.toContain('—');
  });

  it('far from any reference: corridor angle, no image, no em dash', () => {
    const o = buildOutreach(mkRow({ nearestPrimoDistance: 220, corridor: 'Atlanta, GA' }), 'Dana');
    expect(o.body).toContain('Atlanta, GA');
    expect(o.imageUrl).toBeUndefined();
    expect(o.body).not.toContain('—');
  });

  it('falls back to a neutral greeting without a first name', () => {
    expect(buildOutreach(mkRow({}), undefined).body).toContain('Hi there,');
  });
});
