import { describe, expect, it } from 'vitest';
import {
  proximityComponent,
  fitComponent,
  densityComponent,
  compositeScore,
  rankWorklist,
  WEIGHT_PRESETS,
  DEFAULT_WEIGHTS,
  normalizeWeights,
} from '@/lib/discovery/scoring';
import type { CuratedRow } from '@/lib/discovery/types';

function mkRow(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'Acme Co',
    address: '1 Main St, Springfield, IL 62701, USA',
    cityState: 'Springfield, IL',
    lat: 40,
    lng: -75,
    placeId: Math.random().toString(36).slice(2),
    icpScore: 50,
    tier: 'B',
    verticalMatch: 25,
    enterpriseScale: 25,
    networkComplexity: 25,
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
    confidence: 'high',
    mergedCount: 0,
    ...p,
  };
}

describe('proximityComponent', () => {
  it('is 1 at the reference and decays monotonically with distance', () => {
    expect(proximityComponent(0)).toBeCloseTo(1, 5);
    const d = [0, 5, 10, 25, 50, 100, 300].map(proximityComponent);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThan(d[i - 1]);
  });

  it('stays within [0, 1]', () => {
    for (const dist of [0, 1, 7, 23, 80, 500, 5000]) {
      const v = proximityComponent(dist);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is continuous — a closer site scores strictly higher than a slightly farther one', () => {
    expect(proximityComponent(2.7)).toBeGreaterThan(proximityComponent(2.8));
  });
});

describe('fitComponent / densityComponent', () => {
  it('normalizes the engine sub-scores to [0,1]', () => {
    expect(fitComponent(mkRow({ verticalMatch: 25, enterpriseScale: 25, networkComplexity: 25 }))).toBeCloseTo(1, 5);
    expect(fitComponent(mkRow({ verticalMatch: 0, enterpriseScale: 0, networkComplexity: 0 }))).toBe(0);
    expect(densityComponent(mkRow({ corridorDensity: 5 }))).toBeCloseTo(1, 5);
  });
});

describe('compositeScore — proximity-led', () => {
  it('ranks a near prospect above an equally-fit far one under the default weights', () => {
    const near = mkRow({ nearestPrimoDistance: 2.7 });
    const far = mkRow({ nearestPrimoDistance: 220 });
    expect(compositeScore(near, DEFAULT_WEIGHTS)).toBeGreaterThan(compositeScore(far, DEFAULT_WEIGHTS));
  });

  it('returns a 0..100 number', () => {
    const s = compositeScore(mkRow({}), DEFAULT_WEIGHTS);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe('rankWorklist', () => {
  it('does not saturate — the top of a realistic set has distinct scores', () => {
    // 30 max-fit rows that differ only by distance: the old engine put them all at 100.
    const rows = Array.from({ length: 30 }, (_, i) =>
      mkRow({ name: `Site ${i}`, nearestPrimoDistance: i * 3 + 1, corridorDensity: 3 }),
    );
    const ranked = rankWorklist(rows, DEFAULT_WEIGHTS);
    const top = ranked.slice(0, 10).map((r) => r.worklistScore);
    const distinct = new Set(top.map((s) => s.toFixed(2)));
    expect(distinct.size).toBe(top.length); // every top score distinct
  });

  it('sorts by worklistScore descending', () => {
    const rows = [
      mkRow({ name: 'far', nearestPrimoDistance: 200 }),
      mkRow({ name: 'near', nearestPrimoDistance: 3 }),
      mkRow({ name: 'mid', nearestPrimoDistance: 40 }),
    ];
    const ranked = rankWorklist(rows, DEFAULT_WEIGHTS);
    expect(ranked.map((r) => r.name)).toEqual(['near', 'mid', 'far']);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].worklistScore).toBeLessThanOrEqual(ranked[i - 1].worklistScore);
    }
  });

  it('breaks exact composite ties by nearest-distance ascending', () => {
    // Two rows with identical components except distance would only tie if the
    // proximity weight were zero; force that with a fit-only weighting.
    const a = mkRow({ name: 'a', nearestPrimoDistance: 80 });
    const b = mkRow({ name: 'b', nearestPrimoDistance: 5 });
    const fitOnly = normalizeWeights({ proximity: 0, fit: 1, density: 0 });
    const ranked = rankWorklist([a, b], fitOnly);
    expect(ranked[0].name).toBe('b'); // closer wins the tie
  });
});

describe('re-weightable', () => {
  it('proximity-led vs fit-led produce different orderings', () => {
    const bigFar = mkRow({ name: 'bigFar', verticalMatch: 25, enterpriseScale: 25, networkComplexity: 25, nearestPrimoDistance: 150 });
    const smallNear = mkRow({ name: 'smallNear', verticalMatch: 10, enterpriseScale: 5, networkComplexity: 5, nearestPrimoDistance: 2 });
    const proxLed = rankWorklist([bigFar, smallNear], WEIGHT_PRESETS['proximity-led']).map((r) => r.name);
    const fitLed = rankWorklist([bigFar, smallNear], WEIGHT_PRESETS['fit-led']).map((r) => r.name);
    expect(proxLed[0]).toBe('smallNear');
    expect(fitLed[0]).toBe('bigFar');
  });
});
