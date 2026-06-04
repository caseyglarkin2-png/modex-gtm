import { describe, expect, it } from 'vitest';
import { loadLatestScored, toProspectRow, getDiscoverySummary, filterProspects, extractCityState } from '@/lib/discovery/data';

describe('discovery data layer', () => {
  const output = loadLatestScored();

  it('loads the SAMPLE scored file', () => {
    expect(output).not.toBeNull();
    expect(output!.prospects.length).toBeGreaterThan(0);
    expect(output!.corridors.length).toBeGreaterThan(0);
  });

  it('ScoredOutput has expected top-level fields', () => {
    expect(output!.generatedAt).toBeTruthy();
    expect(typeof output!.totalDiscoveries).toBe('number');
    expect(typeof output!.tierA).toBe('number');
    expect(output!.tierA + output!.tierB + output!.tierC + output!.tierD).toBe(output!.prospects.length);
  });

  it('toProspectRow produces valid rows', () => {
    const row = toProspectRow(output!.prospects[0]);
    expect(row.name).toBeTruthy();
    expect(row.tier).toMatch(/^[ABCD]$/);
    expect(typeof row.icpScore).toBe('number');
    expect(typeof row.verticalMatch).toBe('number');
    expect(typeof row.enterpriseScale).toBe('number');
    expect(row.cityState).toBeTruthy();
  });

  it('extractCityState parses address', () => {
    expect(extractCityState('123 Main St, Dallas, TX 75201')).toBe('Dallas, TX');
    expect(extractCityState('unknown')).toBe('unknown');
  });

  it('getDiscoverySummary returns correct counts', () => {
    const summary = getDiscoverySummary(output!);
    expect(summary.tierACount).toBe(output!.tierA);
    expect(summary.totalNetNew).toBe(output!.netNewProspects);
    expect(summary.corridorCount).toBe(output!.corridors.length);
    expect(summary.generatedAt).toBe(output!.generatedAt);
  });

  it('filterProspects filters by tier', () => {
    const rows = output!.prospects.map(toProspectRow);
    const tierA = filterProspects(rows, { tier: 'A' });
    expect(tierA.every((r) => r.tier === 'A')).toBe(true);
    expect(tierA.length).toBe(output!.tierA);
  });

  it('filterProspects filters by search query', () => {
    const rows = output!.prospects.map(toProspectRow);
    const first = rows[0];
    const filtered = filterProspects(rows, { q: first.name.slice(0, 5) });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some((r) => r.name === first.name)).toBe(true);
  });
});
