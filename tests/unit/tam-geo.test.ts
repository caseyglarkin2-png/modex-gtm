// tests/unit/tam-geo.test.ts
import { describe, expect, it } from 'vitest';
import { slugify } from '../../scripts/intel/tam-geo/slugify';
import type { LedgerRow, Status } from '../../scripts/intel/tam-geo/ledger';
import { scoreAccount } from '../../scripts/intel/tam-geo/score';

describe('slugify', () => {
  it('is deterministic, kebab, ascii', () => {
    expect(slugify('The Boston Beer Company, Inc.')).toBe('the-boston-beer-company-inc');
    expect(slugify('J.B. Hunt Transport')).toBe('j-b-hunt-transport');
  });

  it('status type covers the pipeline', () => {
    const statuses: Status[] = ['pending', 'roster', 'geocoded', 'scored', 'stamped', 'error'];
    expect(statuses.length).toBe(6);
  });

  it('scores proximity from the nearest facility and blends the stamped fit', () => {
    // a facility ~0mi from a reference site -> proximity ~100
    const ref = [{ lat: 40.5333, lng: -75.6333 }]; // Allentown Primo
    const r = scoreAccount(
      { facilities: [{ lat: 40.5333, lng: -75.6333 }, { lat: 34.0, lng: -118.0 }] },
      ref, 70, [],
    );
    expect(r.nearest_distance_mi).toBeLessThan(1);
    expect(r.proximity_score).toBeGreaterThan(95);
    // composite = 0.55*prox + 0.30*fit + 0.15*density, scaled 0-100
    expect(r.composite_score).toBeGreaterThan(70);
  });
});
