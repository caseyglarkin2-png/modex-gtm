import { describe, expect, it } from 'vitest';
import { buildAccountTags } from '@/lib/research/account-tags';

describe('buildAccountTags', () => {
  const base = {
    name: 'AB InBev',
    vertical: 'Food & Beverage',
    signal_type: 'Past attendee list',
    primo_angle: 'Primo proof lands',
    tier: 'Tier 1',
    priority_band: 'A',
  };

  it('includes facility fact when present', () => {
    const tags = buildAccountTags(base);
    const facility = tags.find((t) => t.label === 'Facility Count');
    expect(facility).toBeDefined();
  });

  it('omits facility tag when fact is missing', () => {
    const tags = buildAccountTags({ ...base, name: 'Nonexistent Co' });
    const facility = tags.find((t) => t.label === 'Facility Count');
    expect(facility).toBeUndefined();
  });
});
