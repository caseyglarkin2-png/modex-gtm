import { describe, expect, it } from 'vitest';
import { REFERENCE_SITES, PROXIMITY_RING_MILES } from '@/lib/discovery/reference-sites';

describe('reference sites', () => {
  // Was "all 24 Primo sites with valid continental-US coordinates". Commit
  // 68ee6eaa deliberately synced this list 24 -> 27 against Casey's site
  // spreadsheet, the authoritative source, and 3 of the 27 are Canadian
  // (Guelph ON, Hope BC, Chilliwack BC). So both halves of the old assertion
  // had gone stale: the count AND the claim that every site is US.
  //
  // The count stays pinned on purpose — this list is the SINGLE SOURCE OF TRUTH
  // that three scripts import after they drifted from copy-paste, so a silent
  // change to it is exactly what this test is for. Bounds widened to North
  // America, which is what the data actually is, not loosened to whatever
  // happens to pass: 49.383 is the northernmost real site (Hope BC) and the
  // ceiling is 60, well inside "not a typo'd hemisphere".
  it('pins all 27 Primo reference sites with valid North American coordinates', () => {
    expect(REFERENCE_SITES.length).toBe(27);
    for (const s of REFERENCE_SITES) {
      expect(s.name, s.city).toBeTruthy();
      expect(s.status, s.city).toBe('live');
      expect(s.lat, s.city).toBeGreaterThan(24);
      expect(s.lat, s.city).toBeLessThan(60);
      expect(s.lng, s.city).toBeGreaterThan(-125);
      expect(s.lng, s.city).toBeLessThan(-66);
    }
  });

  it('still holds the documented US/Canada split (24 US + 3 Canada)', () => {
    const CA = new Set(['ON', 'BC', 'QC', 'AB', 'MB', 'NS', 'NB', 'SK']);
    const canadian = REFERENCE_SITES.filter((s) => CA.has(s.state));
    expect(canadian).toHaveLength(3);
    expect(REFERENCE_SITES.length - canadian.length).toBe(24);
  });

  it('proximity rings align to the engine scoring bands (5/25/50 mi)', () => {
    expect([...PROXIMITY_RING_MILES]).toEqual([5, 25, 50]);
  });
});
