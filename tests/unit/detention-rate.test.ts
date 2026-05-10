import { describe, expect, it } from 'vitest';
import {
  DETENTION_ASSUMPTIONS,
  computeDetentionPerSecond,
} from '@/lib/microsites/detention-rate';

describe('DETENTION_ASSUMPTIONS', () => {
  it('exports the public ATA-sourced figures so callers can inspect / cite them', () => {
    expect(DETENTION_ASSUMPTIONS.dwellHours).toBe(1.5);
    expect(DETENTION_ASSUMPTIONS.dollarsPerHour).toBe(100);
    expect(DETENTION_ASSUMPTIONS.movesPerFacilityPerDay).toBe(8);
    expect(DETENTION_ASSUMPTIONS.workdaysPerMonth).toBe(22);
  });
});

describe('computeDetentionPerSecond', () => {
  it('returns ~0.132 for a 13-facility footprint (Dannon-shaped)', () => {
    const perSecond = computeDetentionPerSecond(13);
    expect(perSecond).toBeGreaterThan(0.13);
    expect(perSecond).toBeLessThan(0.14);
  });

  it('scales linearly with facility count', () => {
    const oneFacility = computeDetentionPerSecond(1);
    const tenFacilities = computeDetentionPerSecond(10);
    expect(tenFacilities).toBeCloseTo(oneFacility * 10, 6);
  });

  it('returns 0 when facilityCount is 0 (chip will read $0.00 and tick no further)', () => {
    expect(computeDetentionPerSecond(0)).toBe(0);
  });
});
