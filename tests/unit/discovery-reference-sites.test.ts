import { describe, expect, it } from 'vitest';
import { REFERENCE_SITES, PROXIMITY_RING_MILES } from '@/lib/discovery/reference-sites';

describe('reference sites', () => {
  it('pins all 24 Primo sites with valid continental-US coordinates', () => {
    expect(REFERENCE_SITES.length).toBe(24);
    for (const s of REFERENCE_SITES) {
      expect(s.name).toBeTruthy();
      expect(s.status).toBe('live');
      expect(s.lat).toBeGreaterThan(24);
      expect(s.lat).toBeLessThan(50);
      expect(s.lng).toBeGreaterThan(-125);
      expect(s.lng).toBeLessThan(-66);
    }
  });

  it('proximity rings align to the engine scoring bands (5/25/50 mi)', () => {
    expect([...PROXIMITY_RING_MILES]).toEqual([5, 25, 50]);
  });
});
