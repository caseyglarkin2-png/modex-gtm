/**
 * APOLLO CANDIDATES (Casey, 2026-10-03): GAP never spends Apollo credits on its own. Where an Apollo lookup could
 * change WHO or NEXT, GAP proposes it (what is missing, why it matters, what decision it could change, any possible
 * match already on record, cost UNKNOWN) and Casey decides. GAP checks what it already has first, never proposes for
 * geography alone (it cannot outrank operating ownership), and the same unresolved gap is one request, not five.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { apolloCandidates } from '@/lib/gap/people/apollo-candidates';

const NOW = new Date('2026-10-03T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const persona = (id: number, name: string, title: string | null, over: Record<string, unknown> = {}) => ({ id, name, title, doNotContact: false, hasEmail: true, emailStatus: 'valid', ...over });
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [persona(1, 'Sam Chain', 'VP Supply Chain')], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  hubspotPeople: { truncated: false, people: [] },
  ...over,
});
const run = (over: Partial<AccountInputs> = {}) => { const i = inputs(over); return apolloCandidates(buildAccountBrief(i, NOW), i); };

describe('find the transportation operating owner', () => {
  it('no operator on record: one FIND_OWNER request, with the possible match, the decision it could change and cost UNKNOWN', () => {
    const r = run();
    expect(r.candidates).toHaveLength(1);
    expect(r.candidates[0]).toEqual({
      key: 'Acme Foods|FIND_OWNER|north-america-transportation-operating-owner',
      account: 'Acme Foods',
      kind: 'FIND_OWNER',
      target: 'The North America transportation operating owner at Acme Foods (a search, not a known person)',
      missing: 'Who runs transportation operations across the network: nobody on record has a transportation operating title.',
      whyItMatters: 'WHO is the person accountable for freight execution across the network; without them the first touch goes to an adjacent role or nowhere.',
      decision: 'WHO and the first touch',
      possibleMatch: 'Sam Chain, VP Supply Chain (adjacent operator, on record)',
      creditCost: 'UNKNOWN',
      checkedFirst: ['GAP contacts (1)', 'HubSpot contacts (0)', 'staged contact candidates (0)', 'relationships (0)'],
    });
    expect(r.unknownIsFine).toBe('Until Casey decides, WHO stays unknown: GAP does not guess and does not spend.');
  });
  it('a staged candidate that already reads as the owner is reviewed first: no Apollo request', () => {
    const r = run({ candidates: [{ id: 7, name: 'Tom Trucks', title: 'Director of Transportation', state: 'staged' }] });
    expect(r.candidates).toEqual([]);
    expect(r.notNeeded).toBe('Review the staged contact candidate Tom Trucks (Director of Transportation) first: already found, no credit needed.');
  });
  it('an owner already on record (GAP or HubSpot): no FIND_OWNER', () => {
    expect(run({ personas: [persona(2, 'Dana Trans', 'Director of Transportation')] }).candidates.filter((c) => c.kind === 'FIND_OWNER')).toEqual([]);
    const hubspotPeople = { truncated: false, people: [{ id: '9', name: 'Isaac Scott', title: 'Sr Director of Transportation', location: null, hasEmail: true, optedOut: false }] };
    expect(run({ hubspotPeople }).candidates.filter((c) => c.kind === 'FIND_OWNER')).toEqual([]);
  });
  it('a live deal, a buyer thread or an intro-only account: Apollo would not change NEXT, so nothing is proposed', () => {
    expect(run({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: 'd1', name: 'Acme - Pilot', stage: 'Discovery' }] } as never }).candidates).toEqual([]);
    expect(run({ conversation: { who: 'Pat Buyer', responseClass: 'interested', at: '2026-09-30T00:00:00Z' } }).candidates).toEqual([]);
  });
});

describe('fill a gap on the person WHO already names', () => {
  it('the owner on record has no email: FIND_EMAIL for that person', () => {
    const r = run({ personas: [persona(2, 'Dana Trans', 'Director of Transportation', { hasEmail: false })] });
    expect(r.candidates.map((c) => [c.kind, c.target, c.decision])).toEqual([['FIND_EMAIL', 'Dana Trans, Director of Transportation', 'Whether the first touch can go to the owner by email']]);
  });
  it('a prior Apollo result for that person: never spend again', () => {
    const r = run({ personas: [persona(2, 'Dana Trans', 'Director of Transportation', { hasEmail: false, apolloEnrichedAt: '2026-06-01T00:00:00Z' })] });
    expect(r.candidates).toEqual([]);
    expect(r.notNeeded).toBe('Dana Trans already has an Apollo result (Jun 1, 2026): no credit spent twice.');
  });
  it('someone Casey met with no title: CONFIRM_TITLE, since it decides whether they lead WHO', () => {
    const memberships = [{ sourceName: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Inland26 contact', personName: 'Ryan Heman', title: null, company: 'Acme Foods' }];
    const r = run({ facts: [], memberships, personas: [persona(2, 'Rick Barrett', 'Director of Transportation')] });
    expect(r.candidates.map((c) => [c.kind, c.target])).toEqual([['CONFIRM_TITLE', 'Ryan Heman (Acme Foods; met at Inland26 · Chicago)']]);
    expect(r.candidates[0].decision).toBe('Whether Ryan Heman leads WHO, or Rick Barrett does');
  });
  it('a title already on record for the same name: no request', () => {
    const memberships = [{ sourceName: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'x', personName: 'Ryan Heman', title: null, company: 'Acme Foods' }];
    expect(run({ facts: [], memberships, personas: [persona(3, 'Ryan Heman', 'Transportation Manager')] }).candidates.filter((c) => c.kind === 'CONFIRM_TITLE')).toEqual([]);
  });
});

describe('never for geography alone; idempotent', () => {
  it('an owner with an unknown location is not a reason to spend', () => {
    expect(run({ personas: [persona(2, 'Dana Trans', 'Director of Transportation')] }).candidates).toEqual([]);
  });
  it('evaluating the same account twice gives the same keys, once each', () => {
    const a = run().candidates.map((c) => c.key);
    expect(run().candidates.map((c) => c.key)).toEqual(a);
    expect(new Set(a).size).toBe(a.length);
  });
});

describe('HubSpot is checked before any credit is proposed (review SF4)', () => {
  it('HubSpot unread for a linked company: no FIND_OWNER, and the page says check HubSpot first', () => {
    const r = run({ hubspotPeople: null });
    expect(r.candidates).toEqual([]);
    expect(r.notNeeded).toBe('HubSpot contacts could not be read just now: check HubSpot for the transportation owner first (no Apollo lookup proposed until it is read).');
  });
  it('no HubSpot company at all: the proposal stands and says so', () => {
    const r = run({ hubspotPeople: null, account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: null } });
    expect(r.candidates[0]?.checkedFirst).toContain('HubSpot contacts (no HubSpot company)');
  });
});

describe('names are said the way NOW says them', () => {
  it('a lowercase CRM name is title-cased in the decision and target', () => {
    const memberships = [{ sourceName: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'x', personName: 'ryan heman', title: null, company: 'Acme Foods' }];
    const r = run({ facts: [], memberships, personas: [persona(2, 'rick barrett', 'director of transportation')] });
    expect(r.candidates[0].decision).toBe('Whether Ryan Heman leads WHO, or Rick Barrett does');
    expect(r.candidates[0].target).toBe('Ryan Heman (Acme Foods; met at Inland26 · Chicago)');
  });
});
