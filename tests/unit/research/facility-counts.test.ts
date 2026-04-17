import { describe, expect, it } from 'vitest';
import {
  buildFacilityFactMap,
  buildFacilityResearchQueries,
  detectFacilityCountSource,
  resolveFacilityCountLabel,
  type FacilityFactRecord,
} from '@/lib/research/facility-counts';

describe('facility count research workflow helpers', () => {
  it('builds google queries that include the parent brand alias when needed', () => {
    const queries = buildFacilityResearchQueries({
      name: 'Frito-Lay',
      parentBrand: 'PepsiCo',
      priorityBand: 'B',
      tier: 'Tier 2',
    });

    expect(queries).toHaveLength(6);
    expect(queries[0].query).toContain('"Frito-Lay"');
    expect(queries[0].query).toContain('"PepsiCo"');
    expect(queries[0].googleUrl).toContain('https://www.google.com/search?q=');
  });

  it('prefers dedicated facility facts over dossier, account json, and heuristics', () => {
    const factMap = buildFacilityFactMap([
      {
        account: 'General Mills',
        facilityCount: '53',
        scope: 'North America',
        status: 'verified',
        confidence: 'official',
        summary: 'Verified through company footprint page and annual report.',
        updatedAt: '2026-04-07',
        sources: [{ label: 'Company footprint page' }],
      } satisfies FacilityFactRecord,
    ]);

    const facilityFact = factMap.get('generalmills');
    expect(
      resolveFacilityCountLabel({
        accountName: 'General Mills',
        facilityFact,
        dossierFacilityCount: '50+',
        accountFacilityCount: '40+',
        icpFit: 5,
      }),
    ).toBe('53');
    expect(
      detectFacilityCountSource({
        accountName: 'General Mills',
        facilityFact,
        dossierFacilityCount: '50+',
        accountFacilityCount: '40+',
        icpFit: 5,
      }),
    ).toBe('facility-facts');
  });

  it('falls back to heuristics only when no researched or authored count exists', () => {
    expect(
      resolveFacilityCountLabel({
        accountName: 'Unknown Account',
        icpFit: 5,
      }),
    ).toBe('20+');
    expect(
      detectFacilityCountSource({
        accountName: 'Unknown Account',
        icpFit: 2,
      }),
    ).toBe('heuristic');
  });
});
