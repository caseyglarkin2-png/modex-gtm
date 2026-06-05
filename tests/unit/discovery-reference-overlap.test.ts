import { describe, expect, it } from 'vitest';
import { referenceOverlap, REFERENCE_OVERLAP_MI } from '@/lib/discovery/reference-sites';

describe('referenceOverlap', () => {
  it('flags a prospect essentially on top of a live reference site', () => {
    const o = referenceOverlap({ nearestPrimoName: 'US DC NFI - Breinigsville', nearestPrimoDistance: 0.1 });
    expect(o).not.toBeNull();
    expect(o?.distanceMiles).toBe(0.1);
    expect(o?.site?.city).toBe('Breinigsville');
  });

  it('returns null for a normal, clearly-distinct prospect', () => {
    expect(referenceOverlap({ nearestPrimoName: 'US DC NFI - Breinigsville', nearestPrimoDistance: 2.7 })).toBeNull();
  });

  it('flags overlap even when the site name does not resolve (site = null)', () => {
    const o = referenceOverlap({ nearestPrimoName: 'Unknown', nearestPrimoDistance: 0.2 });
    expect(o).not.toBeNull();
    expect(o?.site).toBeNull();
  });

  it('uses a sub-mile threshold', () => {
    expect(REFERENCE_OVERLAP_MI).toBeLessThan(1);
    expect(referenceOverlap({ nearestPrimoName: 'x', nearestPrimoDistance: REFERENCE_OVERLAP_MI })).toBeNull();
  });
});
