/**
 * The operator contact audit is a VIEW over the brief's buyer map and the Apollo projection (no second authority),
 * and the staging filter only lets a sourced, unknown direct operator through (Casey reviews and promotes).
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { operatorAudit, stageableResearch } from '@/lib/gap/people/operator-audit';
import { parseResearchedContacts } from '@/lib/discovery/research';

const NOW = new Date('2026-10-04T15:00:00Z');
const persona = (id: number, name: string, title: string, location: string | null = null) => ({ id, name, title, location, doNotContact: false, hasEmail: true, emailStatus: 'valid' });
const hs = (people: Array<{ id: string; name: string; title: string; location?: string | null }>) => ({ truncated: false, people: people.map((p) => ({ location: null, hasEmail: true, optedOut: false, ...p })) });
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'PepsiCo', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['pepsico.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null, hubspotPeople: hs([]),
  ...over,
});

describe('operatorAudit (a view, never a second authority)', () => {
  it('PepsiCo pattern: the operator leads, Michelle is the sponsor, the division is read from the title', () => {
    const i = inputs({
      personas: [persona(3, 'Michelle Schlie', 'Vice President Supply Chain', 'Overland Park, Kansas, United States')],
      hubspotPeople: hs([
        { id: '1', name: 'Himanshu Gupta', title: 'Director of Transportation' },
        { id: '2', name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', location: 'Orlando, Florida, United States' },
        { id: '3', name: 'Tess Tech', title: 'Director, Transportation Systems (TMS)' },
        { id: '4', name: 'Pat Proc', title: 'Senior Director of Transportation Procurement' },
      ]),
    });
    const a = operatorAudit(buildAccountBrief(i, NOW), i);
    expect(a.counts).toEqual({ gap: 1, hubspot: 4, hubspotTruncated: false, staged: 0 });
    expect(a.direct).toMatchObject({ name: 'Isaac Scott', source: 'HubSpot', geo: 'US', division: 'Frito-Lay' });
    expect(a.operators.map((o) => o.name)).toEqual(['Isaac Scott', 'Himanshu Gupta']);
    expect(a.alternate?.name).toBe('Himanshu Gupta');
    expect(a.sponsor?.name).toBe('Michelle Schlie');
    expect(a.tech?.name).toBe('Tess Tech');
    expect(a.top.map((t) => t.name)).not.toContain('Pat Proc');
    expect(a.missing).toEqual([]);
    // The owner's HubSpot record has an email: add them, never spend a credit to re-find it.
    expect(a.apollo).toEqual([]);
    expect(a.apolloNote).toBe('Isaac Scott already has an email in HubSpot: add them as a GAP contact (no credit needed).');
  });
  it('no operator on record: says what is missing and proposes FIND_OWNER (Casey decides)', () => {
    const i = inputs({ personas: [persona(1, 'Mitch Asher', 'VP Global Supply Chain')] });
    const a = operatorAudit(buildAccountBrief(i, NOW), i);
    expect(a.direct).toBeNull();
    expect(a.sponsor?.name).toBe('Mitch Asher');
    expect(a.missing[0]).toBe('Direct transportation / logistics / fleet operator (cold WHO): research required');
    expect(a.apollo.map((x) => x.kind)).toEqual(['FIND_OWNER']);
  });
  it('a staged operator candidate is named, and Apollo is not needed', () => {
    const i = inputs({ personas: [persona(1, 'Mitch Asher', 'VP Global Supply Chain')], candidates: [{ id: 9, name: 'Jarrod Black', title: 'Director, Logistics', state: 'staged', seenAt: NOW.toISOString() }] as never });
    const a = operatorAudit(buildAccountBrief(i, NOW), i);
    expect(a.stagedOperator).toBe('Jarrod Black, Director, Logistics');
    expect(a.apollo).toEqual([]);
    expect(a.apolloNote).toMatch(/^Review the staged contact candidate Jarrod Black/);
  });
});

describe('stageableResearch: only a sourced, unknown direct operator is staged', () => {
  const found = parseResearchedContacts(JSON.stringify([
    { name: 'Jarrod Black', title: 'Director, Logistics', sourceUrl: 'https://x.example/1' },
    { name: 'Mitch Asher', title: 'VP Global Supply Chain', sourceUrl: 'https://x.example/2' },
    { name: 'Derek Hung', title: 'VP Global Transportation and Compliance', sourceUrl: 'https://x.example/3' },
    { name: 'No Source', title: 'Director of Transportation' },
  ]));
  it('drops sponsors, unsourced people and anyone already known at the account', () => {
    expect(stageableResearch(found, ['jarrod  black']).map((f) => f.name)).toEqual(['Derek Hung']);
    expect(stageableResearch(found, []).map((f) => f.name)).toEqual(['Jarrod Black', 'Derek Hung']);
  });
});
