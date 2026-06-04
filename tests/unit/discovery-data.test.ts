import { describe, expect, it } from 'vitest';
import { loadLatestScored, toProspectRow, getDiscoverySummary, filterProspects, extractCityState, formatDiscoveredVia } from '@/lib/discovery/data';

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

  it('filterProspects filters by corridor', () => {
    const rows = output!.prospects.map(toProspectRow);
    const corridor = rows[0].corridor;
    const filtered = filterProspects(rows, { corridor });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.corridor === corridor)).toBe(true);
  });

  it('filterProspects filters by minScore', () => {
    const rows = output!.prospects.map(toProspectRow);
    const filtered = filterProspects(rows, { minScore: 70 });
    expect(filtered.every((r) => r.icpScore >= 70)).toBe(true);
    // Composes with tier filter.
    const both = filterProspects(rows, { minScore: 70, tier: 'A' });
    expect(both.every((r) => r.icpScore >= 70 && r.tier === 'A')).toBe(true);
  });

  it('formatDiscoveredVia renders object anchors and dedups', () => {
    expect(
      formatDiscoveredVia([
        { anchor: 'Breinigsville PA', keyword: 'cold storage', distanceMiles: 2.7 },
        { anchor: 'Breinigsville PA', keyword: 'warehouse', distanceMiles: 3.1 },
        { anchor: 'Ontario CA', keyword: 'dc', distanceMiles: 1.0 },
      ]),
    ).toBe('Breinigsville PA, Ontario CA');
    // Tolerates plain strings (older/seed data) and never yields [object Object].
    expect(formatDiscoveredVia(['corridor-seed'])).toBe('corridor-seed');
    expect(formatDiscoveredVia([])).toBe('');
  });
});
