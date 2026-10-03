/**
 * Click-test P0s (content trust, 2026-10-03), pinned on production row shapes:
 *   - an internal "Agent Action" log ending in a production smoke test was Dannon's "last touch"
 *   - page views and CTA clicks (private engagement) were listed as history
 *   - the only buyer reply at GXO was buried, HTML-escaped, in BRIEF
 *   - a passed close date read as live deal state
 *   - GAP's own first touch did not count as a touch (double-touch risk at Kroger)
 */
import { describe, expect, it } from 'vitest';
import { activityKind, decodeEntities, projectEngagement, projectHistory, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';

const NOW = new Date('2026-10-03T12:00:00Z');
const act = (activity_type: string, outcome: string, at: string) => ({ activity_type, outcome, notes: null, next_step: null, activity_date: at, created_at: at });

describe('what an activity row is', () => {
  it('system, private, reply, seller', () => {
    expect(activityKind({ activity_type: 'Agent Action', outcome: 'content context: Danone' })).toBe('system');
    expect(activityKind({ activity_type: 'Agent Workflow', outcome: 'x' })).toBe('system');
    expect(activityKind({ activity_type: 'Email', outcome: 'Latest send: Production final DB+HubSpot smoke - one-pager 195' })).toBe('system');
    expect(activityKind({ activity_type: 'Page View', outcome: '/for/dannon' })).toBe('private');
    expect(activityKind({ activity_type: 'Microsite CTA Click', outcome: 'book' })).toBe('private');
    expect(activityKind({ activity_type: 'reply_received', outcome: 'Reply from Avinash Rao' })).toBe('reply');
    expect(activityKind({ activity_type: 'Phone Call', outcome: 'Talked to the DC manager' })).toBe('seller');
    expect(decodeEntities('we&#39;re good, Casey &amp; Jake')).toBe("we're good, Casey & Jake");
  });
  it('history keeps seller touches and replies only; smoke emails are dropped', () => {
    const h = projectHistory({
      activities: [
        act('Agent Action', 'content context: Danone: no email-truth stage yet | Latest send: Production final DB+HubSpot smoke', '2026-10-02'),
        act('Page View', '/for/dannon', '2026-09-30'),
        act('reply_received', 'Reply from Avinash Rao <avinash.rao@gxo.com>: Good afternoon Casey &amp; Jake, I apologize in advance', '2026-05-27'),
        act('Phone Call', 'Talked to the DC manager', '2026-05-01'),
      ],
      emails: [{ to_email: 'qa@yardflow.ai', subject: 'Production final DB+HubSpot smoke', sent_at: '2026-10-01', reply_count: 0 }],
      meetings: [], captures: [], outcomes: [], sends: [], now: NOW,
    });
    expect(h.map((x) => x.kind)).toEqual(['reply', 'activity']);
    expect(h[0].text).toBe('Reply from Avinash Rao: Good afternoon Casey & Jake, I apologize in advance');
    expect(JSON.stringify(h)).not.toMatch(/Agent Action|smoke|Page View|&amp;/);
  });
});

describe('WHY NOW relevance and repetition (click test P1)', () => {
  const f = (id: string, quote: string, publishedAt: string) => ({ id, quote, url: `https://news.example/${id}`, title: 't', publishedAt, expiresAt: '2027-06-01T00:00:00Z', continuity: 'event' as const, currentness: null });
  const base = (facts: ReturnType<typeof f>[]): AccountInputs => ({
    account: { name: 'General Mills', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '1' },
    aliases: [], domains: [], siblings: [], watched: false, watchReasons: [], facts, signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  });
  const ctx: AccountContext = { relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null };
  it('a sale abroad never leads WHY NOW while a US network change exists; it shows only when nothing better does', () => {
    const brazil = f('br', 'General Mills agreed to sell our business in Brazil to Cafe Tres Coracoes S.A.', '2026-09-25T00:00:00Z');
    const network = f('nw', 'General Mills will consolidate its US distribution network and open a new distribution center in Ohio.', '2026-09-10T00:00:00Z');
    const i = base([brazil, network]);
    const v = projectNow(buildAccountBrief(i, NOW), ctx, i, NOW);
    expect(v.whyNow.map((l) => l.text).join(' ')).toMatch(/distribution center in Ohio/);
    expect(v.whyNow.map((l) => l.text).join(' ')).not.toMatch(/Brazil/);
    const only = base([brazil]);
    expect(projectNow(buildAccountBrief(only, NOW), ctx, only, NOW).whyNow.map((l) => l.text).join(' ')).toMatch(/Brazil/);
  });
  it('the same quote under different fact rows is ONE idea across WHY NOW and KNOW', () => {
    const q = 'General Mills will open a new distribution center in Ohio.';
    const i = base([f('a', q, '2026-09-10T00:00:00Z'), f('b', q, '2026-09-11T00:00:00Z'), f('c', q, '2026-09-12T00:00:00Z')]);
    const v = projectNow(buildAccountBrief(i, NOW), ctx, i, NOW);
    expect([...v.whyNow, ...v.know].filter((l) => /distribution center in Ohio/.test(l.text))).toHaveLength(1);
  });
});

describe('NOW: last touch, latest reply, deal close date', () => {
  const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
    account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '1' },
    aliases: [], domains: [], siblings: [], watched: false, watchReasons: [], facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null, ...over,
  });
  const ctx = (history: AccountContext['history']): AccountContext => ({ relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history, assets: [], legacyNote: null });
  const v = (i: AccountInputs, history: AccountContext['history'] = []) => projectNow(buildAccountBrief(i, NOW), ctx(history), i, NOW);

  it('the latest buyer reply is on NOW, dated, however old', () => {
    const r = v(inputs(), [{ at: '2026-05-27T16:48:44Z', kind: 'reply', visibility: 'seller', text: 'Reply from Avinash Rao: I apologize in advance' }]);
    expect(r.lastReply).toBe('Latest buyer reply May 27, 2026 (128 days ago): Avinash Rao: I apologize in advance');
    expect(v(inputs()).lastReply).toBeNull();
  });
  it('GAP\'s own first touch counts as the last touch when it is newer than the email log', () => {
    const r = v(inputs({ firstTouches: [{ recipient: 'joey.maggard@kroger.com', sentAt: '2026-09-25T15:00:00Z', state: 'sent' }] }), [{ at: '2026-03-30T00:00:00Z', kind: 'email_sent', visibility: 'seller', text: 'Email to ryan.verbecken' }]);
    expect(r.lastTouch).toBe('Last touch Sep 25, 2026 (7 days ago): GAP first touch to joey.maggard@kroger.com');
  });
  it('a close date that has passed says so instead of reading as live', () => {
    const deal = { name: 'YardFlow - Kroger', stage: 'appointmentscheduled', amount: null, closeDate: '2026-09-30T00:00:00Z', nextStep: null };
    expect(v(inputs({ opportunity: { status: 'ACTIVE', detail: '', deals: [deal] } })).stateLine).toMatch(/close date Sep 30, 2026 has passed: update the deal/);
    expect(v(inputs({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ ...deal, closeDate: '2026-12-15T00:00:00Z' }] } })).stateLine).toMatch(/closes Dec 15, 2026/);
  });
});
