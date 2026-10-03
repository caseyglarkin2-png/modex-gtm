/**
 * V2 OPERATING UNITS: at PepsiCo the yard decision belongs to a division. A division is named only when a title, a
 * site name or a family account says so; an email domain never assigns one. "Which division owns the yard decision"
 * is the first unknown, NOW says it, and the audited network shows which divisions it covers (Frito-Lay: none).
 */
import { describe, expect, it } from 'vitest';
import { divisionOf, divisionsFor, sitesByDivision } from '@/lib/gap/people/division';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectNow } from '@/lib/gap/context/now';
import { projectEngagement, projectRelationship } from '@/lib/gap/context/context';

const NOW = new Date('2026-10-03T12:00:00Z');

describe('divisionOf', () => {
  it('names a division only from the text itself', () => {
    expect(divisionOf('PepsiCo', 'senior vice president chief supply chain officer na - beverages')).toBe('PBNA');
    expect(divisionOf('PepsiCo', 'PBNA - Cheverly MD')).toBe('PBNA');
    expect(divisionOf('PepsiCo', 'Gatorade - Tolleson AZ')).toBe('Gatorade');
    expect(divisionOf('PepsiCo', 'Quaker Oats - Danville IL')).toBe('Quaker');
    expect(divisionOf('PepsiCo', 'Director, Frito-Lay Transportation')).toBe('Frito-Lay');
    expect(divisionOf('PepsiCo', 'vice president supply chain')).toBeNull();
    expect(divisionOf('PepsiCo', 'jane@pepsico.com')).toBeNull();
    expect(divisionOf('PepsiCo', 'Quaker Houghton lubricants')).toBeNull();
    expect(divisionOf('Kroger', 'na - beverages')).toBeNull();
    expect(divisionsFor('Kroger')).toBeNull();
  });
  it('counts audited sites by division and names the divisions with none', () => {
    const r = sitesByDivision('PepsiCo', ['PBNA - A', 'PBNA - B', 'Gatorade - C', 'Quaker - D', 'PepsiCo Brookshire mixing center']);
    expect(r).toEqual({ counts: [['PBNA', 2], ['Quaker', 1], ['Gatorade', 1]], unnamed: 1, missing: ['Frito-Lay', 'PepsiCo Foods North America'] });
  });
});

describe('PepsiCo brief and NOW', () => {
  const site = (id: string, name: string) => ({ id, name, type: 'DC', archetype: 'a', archetypeName: 'DC', yardMetrics: { dockDoorCount: 20, trailersVisible: 10, trailerParkingCapacity: null, truckGateCount: 1, railServed: false }, classification: { dropYard: true, guardShack: true, truckGate: true, preGateStaging: false, fastLaneOpportunity: false, dockDoors: '', dropArea: '' }, verification: { verdict: 'confirmed' as const, operator: 'self' as const, tenancy: 'owned' as const, citations: [{ url: 'https://x.example', date: '2026-05-01' }], imageryDate: '2026-05-01', verifiedAt: '2026-05-01' } });
  const inputs = (name: string): AccountInputs => ({
    account: { name, tier: 'Tier 1', priorityBand: 'A', vertical: 'beverage', parentBrand: null, hubspotCompanyId: '1' },
    aliases: [], domains: ['pepsico.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [
      { id: 1, name: 'adel ghanem', title: 'vice president supply chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 2, name: 'cs officer', title: 'senior vice president chief supply chain officer na - beverages', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    ],
    candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] }, microsite: null, facilityFact: null, roi: null,
    pack: { builtAt: '2026-05-01', account: { networkCount: null }, network: { sites: [site('s1', 'PBNA - Cheverly MD'), site('s2', 'Gatorade - Tolleson AZ')] } } as never,
    family: { parentName: null, members: [{ accountName: 'Frito-Lay', relation: 'subsidiary', source: 'parent_brand' }], related: [], separate: null, hold: null },
  });
  const ctx = { relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null };

  it('the brief names the evidenced divisions and the open question; the site count shows the gap', () => {
    const b = buildAccountBrief(inputs('PepsiCo'), NOW);
    expect(b.division).toEqual({ evidenced: ['PBNA', 'Frito-Lay', 'Gatorade'], question: 'Which division owns the yard decision: PBNA, Frito-Lay or Gatorade? Each runs its own supply chain.' });
    expect(b.sections.footprint.unknowns[0]).toBe('Which division owns the yard decision');
    // First even when other unknowns are already on the list (no audited sites at all).
    const bare = buildAccountBrief({ ...inputs('PepsiCo'), pack: null }, NOW);
    expect(bare.sections.footprint.unknowns.slice(0, 2)).toEqual(['Which division owns the yard decision', 'Audited sites (ownership, types, locations)']);
    expect(b.sections.footprint.statements.map((s) => s.text).join('\n')).toMatch(/Audited sites by division \(from the site names\): PBNA 1, Gatorade 1\. No Frito-Lay, Quaker or PepsiCo Foods North America site audited/);
    expect(b.people.lanes.flatMap((l) => l.people).find((p) => p.name === 'cs officer')?.division).toBe('PBNA');
    expect(b.people.lanes.flatMap((l) => l.people).find((p) => p.name === 'adel ghanem')?.division).toBeNull();
  });
  it('NOW says the operating unit is unknown, and Listen reads it; a single-unit account says nothing', () => {
    const i = inputs('PepsiCo');
    const v = projectNow(buildAccountBrief(i, NOW), ctx, i, NOW);
    expect(v.unit).toBe('Division: unknown. Which division owns the yard decision: PBNA, Frito-Lay or Gatorade? Each runs its own supply chain.');
    expect(v.listen).toContain('Division: unknown.');
    const k = inputs('Kroger');
    expect(projectNow(buildAccountBrief(k, NOW), ctx, k, NOW).unit).toBeNull();
  });
});
