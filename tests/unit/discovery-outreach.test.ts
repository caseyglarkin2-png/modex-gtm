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

  describe('angle override (additive)', () => {
    it('omitting the angle is byte-identical to the default near path', () => {
      const a = buildOutreach(mkRow({}), 'Sal', 'VP Ops');
      const b = buildOutreach(mkRow({}), 'Sal', 'VP Ops', undefined);
      expect(b).toEqual(a);
    });

    it('a non-proximity angle swaps subject + opener and drops the proximity proof image', () => {
      const o = buildOutreach(mkRow({}), 'Sal', undefined, 'network');
      expect(o.subject).toBe('One live view across your yards');
      expect(o.body).toContain('every yard on one live map');
      expect(o.imageUrl).toBeUndefined(); // proof image is proximity-only
      // The frame around the opener is preserved.
      expect(o.body).toContain('Hi Sal,');
      expect(o.body).toContain('15 minutes');
      expect(o.body).toContain('Best,');
      expect(o.body).not.toContain('—');
    });

    it('the proximity angle keeps the proof image when near a reference', () => {
      const o = buildOutreach(mkRow({}), 'Sal', undefined, 'proximity');
      expect(o.imageUrl).toMatch(/allentown-yard-proof\.jpg$/);
    });

    it('the efficiency angle is a capability framing with no proof image', () => {
      const o = buildOutreach(mkRow({}), 'Sal', undefined, 'efficiency');
      expect(o.subject).toBe('Stop losing trailers in your own yard');
      expect(o.imageUrl).toBeUndefined();
    });
  });
});
