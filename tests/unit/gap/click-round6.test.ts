/**
 * Click test round 6 (2026-10-03, trust + phone on 55a5ab48):
 *   - PepsiCo: NEXT opened a first-touch card for an adjacent operator (VP Supply Chain, ownership not stated) while
 *     the page named a transportation owner as the better fit. Casey's order puts the lane before readiness: the owner
 *     leads (add them from HubSpot, then touch them); the ready card is the stated alternative, never hidden.
 *   - GXO: "Open replies" opened an empty lane; the ASK was a generic discovery question while a reply waited.
 *   - a stock piece ("After 3.4% Gain -- GF Value $6") passed the market filter.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';

const NOW = new Date('2026-10-03T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'approved', observation: fact.quote, problem: 'My guess is arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: 'No queue.', primarySignalId: 'f1' };
const michelle = { id: 3, name: 'Michelle Schlie', title: 'Vice President Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const hubspotPeople = { truncated: false, people: [{ id: '9', name: 'Isaac Scott', title: 'Sr Director of Transportation', location: 'Plano, Texas, United States', hasEmail: true, optedOut: false }] };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp] as never, bids: [], personas: [michelle], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null, hubspotPeople,
  ...over,
});
const ctx = (activities: Parameters<typeof projectHistory>[0]['activities'] = []): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW), history: projectHistory({ activities, emails: [], meetings: [], captures: [], outcomes: [], sends: [], now: NOW }), assets: [], legacyNote: null,
});
const READY = { name: 'Michelle Schlie', title: 'Vice President Supply Chain', href: '/gap?lane=ready&open=c1', headline: 'x' };

describe('the transportation owner leads; the ready card is the stated alternative', () => {
  it('NEXT adds the owner first, WHO is the owner, the ready person is the alternate', () => {
    const i = inputs();
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW, { ready: READY });
    expect(v.next.text).toBe('Add Isaac Scott (Sr Director of Transportation) from HubSpot as a GAP contact, then first-touch them: the transportation owner on record. Ready now instead: the first-touch card for Michelle Schlie (ask who owns the yards).');
    expect(v.who).toMatchObject({ name: 'Isaac Scott', inHubSpotOnly: true });
    expect(v.alternate).toEqual({ name: 'Michelle Schlie', title: 'Vice President Supply Chain', why: 'Ready now: a first-touch card exists. Ask who owns the yards.' });
    expect(v.ownerFirst).toEqual({ owner: 'Isaac Scott', ready: 'Michelle Schlie' });
    expect(v.betterFit).toBeNull();
  });
  it('a ready card for the owner themself is NEXT, unchanged', () => {
    const isaac = { id: 4, name: 'Isaac Scott', title: 'Sr Director of Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
    const i = inputs({ personas: [isaac], hubspotPeople: null });
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW, { ready: { ...READY, name: 'Isaac Scott', title: isaac.title } });
    expect(v.next.text).toMatch(/^Review the thesis, then open the first-touch card for Isaac Scott/);
    expect(v.ownerFirst).toBeNull();
  });
});

describe('two transportation owners', () => {
  it('a ready card for one transportation owner stays NEXT; the other is the better fit beside it', () => {
    const dana = { id: 5, name: 'Dana Trans', title: 'Transportation Manager', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
    const i = inputs({ personas: [dana] });
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW, { ready: { ...READY, name: 'Dana Trans', title: dana.title } });
    expect(v.next.text).toMatch(/^Review the thesis, then open the first-touch card for Dana Trans/);
    expect(v.ownerFirst).toBeNull();
    expect(v.betterFit).toMatch(/^Better fit on record: Isaac Scott/);
  });
});

describe('an unanswered reply', () => {
  it('names the thread for the Gmail link and asks no discovery question meanwhile', () => {
    const i = inputs({ hubspotPeople: null, hypotheses: [] });
    const v = projectNow(buildAccountBrief(i, NOW), ctx([{ activity_type: 'reply_received', outcome: 'Reply from Avinash Rao <a@acmefoods.com>: Thanks, see below.', notes: null, next_step: null, activity_date: '2026-05-27T16:48:44Z', created_at: '2026-05-27T16:48:44Z' }]), i, NOW);
    expect(v.replyThread).toBe('Avinash Rao');
    expect(v.ask).toBeNull();
  });
});

describe('market pieces are never WHY NOW', () => {
  it('a "% Gain -- GF Value" piece and a stock quote page are dropped', () => {
    const sig = (id: string, title: string) => ({ id, title, url: `https://x.example/${id}`, publishedAt: '2026-09-30T00:00:00Z', researchStatus: 'queued', note: null, capturedAt: '2026-09-30T00:00:00Z' });
    const i = inputs({ hubspotPeople: null, signals: [sig('s1', 'A Look at Acme Foods Inc (ACME) After 3.4% Gain -- GF Value $6'), sig('s2', 'Acme Foods Stock Price, News, Quote & History')] });
    const v = projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW);
    expect(v.whyNow.map((l) => l.text).join(' ')).not.toMatch(/GF Value|Quote & History/);
  });
});

describe('labels are not part of the idea', () => {
  it('the live PepsiCo Gatik pair (labelled ONGOING CONDITION / RECENT EVENT) is one idea', async () => {
    const { sameIdea } = await import('@/lib/gap/context/same-idea');
    const a = 'ONGOING CONDITION: June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo’s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date. (current as of 2026-08-25)';
    const b = 'RECENT EVENT: This agreement builds on PepsiCo’s experience running one of North America’s largest private fleets and brings Gatik’s autonomous freight capabilities into real, day-to-day supply chain operations.';
    expect(sameIdea(a, b, 'PepsiCo')).toBe(true);
  });
});
