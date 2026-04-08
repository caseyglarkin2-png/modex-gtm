import { describe, expect, it } from 'vitest';
import {
  getFacilityFact,
  getFacilityCountLabel,
  parseFacilityCountLowerBound,
} from '@/lib/research/facility-fact-registry';

describe('facility fact registry', () => {
  it('parses lower-bound counts from exact and plus-style labels', () => {
    expect(parseFacilityCountLowerBound('13')).toBe(13);
    expect(parseFacilityCountLowerBound('70+')).toBe(70);
    expect(parseFacilityCountLowerBound('1,200+')).toBe(1200);
    expect(parseFacilityCountLowerBound(undefined)).toBeUndefined();
  });

  it('loads flagship fact entries from the facility fact source of truth', () => {
    expect(getFacilityFact('Dannon')?.facilityCount).toBe('13');
    expect(getFacilityFact('AB InBev')?.facilityCount).toBe('100');
    expect(getFacilityCountLabel('General Mills', 'fallback')).toBe('41');
    expect(getFacilityCountLabel('Unknown Account', 'fallback')).toBe('fallback');
  });
});