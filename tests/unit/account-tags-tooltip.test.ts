import { describe, expect, it, vi } from 'vitest';
import { buildAccountTags } from '@/lib/research/account-tags';

vi.mock('@/lib/research/facility-fact-registry', () => ({
  getFacilityFact: (name: string) => name === 'Acme' ? { facilityCount: '24', scope: 'US distribution' } : null,
}));

describe('buildAccountTags — source field (S1-T5)', () => {
  it('marks each tag with a source string for tooltip rendering', () => {
    const tags = buildAccountTags({
      name: 'Acme',
      vertical: 'CPG',
      signal_type: 'logistics',
      primo_angle: 'gate-to-dock variance',
      tier: 'Tier 1',
      priority_band: 'A',
    });
    const sources = tags.map((t) => t.source);
    expect(sources).toEqual(expect.arrayContaining([
      'Facility research workbench',
      'Account record (vertical)',
      'Account record (curated by ops)',
      'Account record (priority tiering)',
    ]));
    // Every tag has a non-empty source
    for (const tag of tags) {
      expect(tag.source.length).toBeGreaterThan(0);
    }
  });

  it('omits the facility tag when no facility fact exists', () => {
    const tags = buildAccountTags({
      name: 'Unknown Co',
      vertical: 'CPG',
      signal_type: null,
      primo_angle: null,
      tier: 'Tier 3',
      priority_band: 'D',
    });
    expect(tags.find((t) => t.label === 'Facility Count')).toBeUndefined();
    // Curated-by-ops tags get the curated-by-ops source even when value is N/A
    const signalTag = tags.find((t) => t.label === 'Signal');
    expect(signalTag?.source).toBe('Account record (curated by ops)');
  });
});
