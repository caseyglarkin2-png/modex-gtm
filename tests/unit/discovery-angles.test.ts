import { describe, expect, it } from 'vitest';
import {
  buildAngleStack,
  assignCommitteeAngles,
  ANGLE_NETWORK_MIN,
  ANGLE_SCALE_MIN,
  type AngleKey,
} from '@/lib/discovery/angles';
import type { CuratedRow } from '@/lib/discovery/types';

function mkRow(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'PepsiCo Mt Creek DC', address: '', cityState: 'Dallas, TX', lat: 32, lng: -96, placeId: 'x',
    icpScore: 90, tier: 'A', verticalMatch: 25, enterpriseScale: 25, networkComplexity: 25,
    primoProximity: 0, corridorDensity: 0, placeTypeBonus: 0, isExistingAccount: false,
    nearestPrimoName: 'US PL Dallas 2 Factory', nearestPrimoDistance: 0.7, corridor: 'Dallas, TX',
    discoveredVia: [], excluded: false, segment: 'shipper', confidence: 'high', mergedCount: 0, ...p,
  };
}

const NO_DASH = (s: string) => {
  expect(s).not.toContain('—'); // em dash
  expect(s).not.toContain('–'); // en dash
};

describe('buildAngleStack', () => {
  it('always includes corridor and efficiency, so every prospect has at least two angles', () => {
    const stack = buildAngleStack(mkRow({ nearestPrimoDistance: 500, networkComplexity: 0, enterpriseScale: 0 }));
    expect(stack.map((a) => a.key)).toEqual(['corridor', 'efficiency']);
  });

  it('leads with proximity when near a reference', () => {
    const stack = buildAngleStack(mkRow({}));
    expect(stack[0].key).toBe('proximity');
    expect(stack[0].opener).toContain('0.7 mi');
  });

  it('includes network and scale only when the backing score clears the threshold', () => {
    const high = buildAngleStack(mkRow({ networkComplexity: ANGLE_NETWORK_MIN, enterpriseScale: ANGLE_SCALE_MIN }));
    expect(high.map((a) => a.key)).toContain('network');
    expect(high.map((a) => a.key)).toContain('scale');

    const low = buildAngleStack(mkRow({ nearestPrimoDistance: 500, networkComplexity: ANGLE_NETWORK_MIN - 1, enterpriseScale: ANGLE_SCALE_MIN - 1 }));
    expect(low.map((a) => a.key)).not.toContain('network');
    expect(low.map((a) => a.key)).not.toContain('scale');
  });

  it('names the live reference city in the proximity opener when it resolves', () => {
    const stack = buildAngleStack(mkRow({ nearestPrimoName: 'US PL Allentown Factory', nearestPrimoDistance: 2.7 }));
    const prox = stack.find((a) => a.key === 'proximity');
    expect(prox?.opener).toMatch(/Allentown|PA/);
  });

  it('marks proximity/network/scale/corridor as backed and efficiency as a capability framing', () => {
    const stack = buildAngleStack(mkRow({}));
    expect(stack.find((a) => a.key === 'proximity')?.backed).toBe(true);
    expect(stack.find((a) => a.key === 'corridor')?.backed).toBe(true);
    expect(stack.find((a) => a.key === 'efficiency')?.backed).toBe(false);
  });

  it('produces unique keys and dash-free copy', () => {
    const stack = buildAngleStack(mkRow({}));
    const keys = stack.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const a of stack) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.opener.length).toBeGreaterThan(0);
      expect(a.subject.length).toBeGreaterThan(0);
      NO_DASH(a.opener);
      NO_DASH(a.subject);
    }
  });
});

describe('assignCommitteeAngles', () => {
  it('gives each committee member a distinct angle while the stack lasts', () => {
    const row = mkRow({}); // full stack: proximity, network, scale, corridor, efficiency
    const keys = assignCommitteeAngles(row, 5);
    expect(keys).toHaveLength(5);
    expect(new Set(keys).size).toBe(5);
  });

  it('round-robins (repeats) once the committee is larger than the stack', () => {
    const row = mkRow({ nearestPrimoDistance: 500, networkComplexity: 0, enterpriseScale: 0 }); // stack = [corridor, efficiency]
    const keys = assignCommitteeAngles(row, 5);
    expect(keys).toEqual(['corridor', 'efficiency', 'corridor', 'efficiency', 'corridor']);
  });

  it('only assigns angles that are available for the row', () => {
    const row = mkRow({ nearestPrimoDistance: 500, networkComplexity: 0, enterpriseScale: 0 });
    const available = new Set<AngleKey>(buildAngleStack(row).map((a) => a.key));
    for (const k of assignCommitteeAngles(row, 6)) expect(available.has(k)).toBe(true);
  });

  it('returns an empty array for a zero-size committee', () => {
    expect(assignCommitteeAngles(mkRow({}), 0)).toEqual([]);
  });
});
