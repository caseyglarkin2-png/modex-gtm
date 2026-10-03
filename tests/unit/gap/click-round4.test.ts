/**
 * Click test round 4 (2026-10-03, trust + phone re-test of production 4518814a / a507551f):
 *   - GXO: the only live buyer thread (an unanswered reply) showed twice, cut mid-word, and NEXT still said "work
 *     the deal": an unanswered reply is the next thing, its writer is WHO, and it shows once, marked as a snippet
 *   - Kroger: "Last touch Sep 25 (GAP first touch)" next to "RELATIONSHIP Last email Mar 30": one answer
 *   - PepsiCo: Isaac Scott as both "Better fit" and "Alternate"; Sources named a different likely owner
 *   - the same event twice in different words (Giant Eagle "we announced" / "the Company announced"; Gatik)
 *   - an unverified plant in Kazakhstan and stock-price pieces as WHY NOW
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { sameIdea } from '@/lib/gap/context/same-idea';

const NOW = new Date('2026-10-03T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const person = { id: 1, name: 'Lukasz Wojcik', title: 'Regional Operations Manager', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [person], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: 'd1', name: 'Acme - Pilot', stage: 'Discovery' }] } as never, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const replyRow = (at: string, outcome: string) => ({ activity_type: 'reply_received', outcome, notes: null, next_step: null, activity_date: at, created_at: at });
const ctxWith = (x: { activities?: Parameters<typeof projectHistory>[0]['activities']; emails?: Array<{ to_email: string; subject: string; sent_at: string; reply_count: number }> } = {}): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: x.emails ?? [], now: NOW }),
  engagement: projectEngagement([], NOW),
  history: projectHistory({ activities: x.activities ?? [], emails: x.emails ?? [], meetings: [], captures: [], outcomes: [], sends: [], now: NOW }),
  assets: [], legacyNote: null,
});
const view = (over: Partial<AccountInputs>, ctx: AccountContext) => { const i = inputs(over); return projectNow(buildAccountBrief(i, NOW), ctx, i, NOW); };

const CUT = 'Reply from Avinash Rao <avinash.rao@acmefoods.com>: Good afternoon Casey &amp; Jake, I apologize in advance but below is the message I just got from Mik';

describe('an unanswered buyer reply is the next thing', () => {
  it('NEXT answers it, WHO is its writer, it shows once, and a cut-off snippet says so', () => {
    const v = view({}, ctxWith({ activities: [replyRow('2026-05-27T16:48:44Z', CUT)], emails: [{ to_email: 'avinash.rao@acmefoods.com', subject: 'Pilot', sent_at: '2026-05-20T10:00:00Z', reply_count: 0 }] }));
    expect(v.next.source).toBe('conversation');
    expect(v.next.text).toBe('Answer Avinash Rao\'s reply of May 27, 2026 (unanswered for 128 days): read the full thread in Gmail, then reply in it.');
    expect(v.who).toMatchObject({ name: 'Avinash Rao' });
    expect(v.who!.why).toMatch(/^They wrote last/);
    expect(v.lastTouch).toBe('Last touch May 27, 2026 (128 days ago): their reply, below.');
    expect(v.lastReply).toBe('Latest buyer reply May 27, 2026 (128 days ago): Avinash Rao: Good afternoon Casey & Jake, I apologize in advance but below is the message I just got from… (snippet: the full reply is in Gmail)');
  });
  it('a reply already answered by a later send is history, not NEXT', () => {
    const v = view({}, ctxWith({ activities: [replyRow('2026-05-27T16:48:44Z', 'Reply from Avinash Rao <avinash.rao@acmefoods.com>: Thanks, talk soon.')], emails: [{ to_email: 'avinash.rao@acmefoods.com', subject: 'Re: Pilot', sent_at: '2026-06-02T10:00:00Z', reply_count: 0 }] }));
    expect(v.next.source).not.toBe('conversation');
    expect(v.who?.name).toBe('Lukasz Wojcik');
  });
});

describe('one last-touch answer', () => {
  it('NOW never shows an older "Last email" beside a newer last touch', () => {
    const ctx = ctxWith({ emails: [{ to_email: 'ryan@acmefoods.com', subject: 'Hello', sent_at: '2026-03-30T10:00:00Z', reply_count: 0 }] });
    const v = view({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, firstTouches: [{ recipient: 'joey@acmefoods.com', sentAt: '2026-09-25T10:00:00Z', state: 'released' }] as never }, ctx);
    expect(v.lastTouch).toMatch(/^Last touch Sep 25, 2026/);
    expect(v.relationship ?? '').not.toMatch(/Last email/);
  });
});

describe('the same idea in different words is shown once', () => {
  it('two extractions of one merger, and two lines about one partner, are the same idea; two different sites are not', () => {
    expect(sameIdea('On July 1, 2026, we announced that we had entered into an agreement and plan of merger pursuant to which we will acquire Giant Eagle, Inc. ("Giant Eagle").', 'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. ("Giant Eagle").', 'Kroger')).toBe(true);
    expect(sameIdea('June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo\'s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date.', 'This agreement builds on PepsiCo\'s experience running one of North America\'s largest private fleets and brings Gatik\'s autonomous freight capabilities into real, day-to-day supply chain operations.', 'PepsiCo')).toBe(true);
    expect(sameIdea('Acme Foods will open a new distribution center in Reno in 2027.', 'Acme Foods will close its plant in Dallas, Texas next year.', 'Acme Foods')).toBe(false);
    expect(sameIdea('Acme Foods will open a new distribution center in Reno in 2027.', 'Acme Foods will open a new distribution center in Dallas in 2027.', 'Acme Foods')).toBe(false);
  });
  it('WHY NOW shows a merger once when two filings say it two ways', () => {
    const a = { ...fact, id: 'g1', quote: 'On July 1, 2026, we announced that we had entered into an agreement and plan of merger pursuant to which we will acquire Giant Eagle, Inc. ("Giant Eagle").', publishedAt: '2026-09-01T00:00:00Z' };
    const b = { ...a, id: 'g2', quote: 'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. ("Giant Eagle").' };
    const v = view({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, facts: [a, b] }, ctxWith());
    expect([...v.whyNow, ...v.know].filter((l) => /Giant Eagle/.test(l.text))).toHaveLength(1);
  });
});

describe('WHY NOW signals are about their US network', () => {
  it('drops an unverified plant abroad and a stock-price piece', () => {
    const sig = (id: string, title: string) => ({ id, title, url: `https://x.example/${id}`, publishedAt: '2026-09-30T00:00:00Z', researchStatus: 'queued', note: null, capturedAt: '2026-09-30T00:00:00Z' });
    const v = view({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, signals: [sig('s1', 'Carlsberg, Acme Foods open $344M beverage plant in Kazakhstan'), sig('s2', 'Acme Foods (ACME) Could Be 4% Above Fair Value As Deal Lifts Growth Hopes')] }, ctxWith());
    expect(v.whyNow.map((l) => l.text).join(' ')).not.toMatch(/Kazakhstan|Fair Value/);
  });
});

describe('BRIEF and Sources tell the NOW story', () => {
  it('BRIEF shows a merger once when two filings say it two ways', async () => {
    const { projectBrief } = await import('@/lib/gap/context/brief');
    const a = { ...fact, id: 'g1', quote: 'On July 1, 2026, we announced that we had entered into an agreement and plan of merger pursuant to which we will acquire Giant Eagle, Inc. ("Giant Eagle").', publishedAt: '2026-09-01T00:00:00Z' };
    const b = { ...a, id: 'g2', quote: 'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. ("Giant Eagle").' };
    const i = inputs({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, facts: [a, b] });
    expect(JSON.stringify(projectBrief(buildAccountBrief(i, NOW), ctxWith(), i, NOW)).match(/acquire Giant Eagle/g)?.length).toBe(1);
  });
  it('the Sources glance names the buyer map\'s best operator, not an older pick, and never says "None recorded" for relationship', () => {
    const hubspotPeople = { truncated: false, people: [{ id: '9', name: 'Isaac Scott', title: 'Sr Director of Transportation', location: 'Plano, Texas, United States', hasEmail: true, optedOut: false }] };
    const g = buildAccountBrief(inputs({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, personas: [{ ...person, name: 'jeremy johnson', title: 'Logistics Manager' }], hubspotPeople }), NOW).glance;
    expect(g.likelyOwner).toBe('Isaac Scott, Sr Director of Transportation (LIKELY; ownership never assumed; in HubSpot, not yet a GAP contact)');
    expect(g.relationship).not.toBe('None recorded');
  });
});

describe('one line per person on NOW', () => {
  it('the better fit is never also the alternate (PepsiCo: Isaac Scott twice)', () => {
    const michelle = { id: 3, name: 'Michelle Schlie', title: 'Vice President Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
    const hubspotPeople = { truncated: false, people: [{ id: '9', name: 'Isaac Scott', title: 'Sr Director of Transportation', location: 'Plano, Texas, United States', hasEmail: true, optedOut: false }] };
    const i = inputs({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, personas: [michelle], hubspotPeople, hypotheses: [{ id: 'h1', status: 'approved', observation: fact.quote, problem: 'My guess is arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: 'No queue.', primarySignalId: 'f1' }] as never });
    const v = projectNow(buildAccountBrief(i, NOW), ctxWith(), i, NOW, { ready: { name: 'Michelle Schlie', title: 'Vice President Supply Chain', href: '/gap?lane=ready&open=c1', headline: 'x' } });
    // Round 6: the owner leads and the ready person is the alternate; each named once.
    const named = [v.who?.name, v.alternate?.name, v.betterFit].filter(Boolean).join(' | ');
    expect(named.match(/Isaac Scott/g)).toHaveLength(1);
    expect(named.match(/Michelle Schlie/g)).toHaveLength(1);
  });
});
