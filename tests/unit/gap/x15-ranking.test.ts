/**
 * X15 (GAP OS sales execution engine, 2026-10-08): two ranking repairs the live Work page showed on 2026-10-08. (a) The
 * day led with untriaged replies from June and August: an untriaged reply older than REPLY_TRIAGE_DAYS no longer leads
 * the day; it ranks as admin ("An old reply to triage"), still listed, never hidden; a fresh reply and a recorded reply
 * whose answer is owed keep the reply tier. (c) Eight in-deal cards all said "the close date has passed, confirm the
 * real date": when HubSpot carries the deal's next step, the card leads with it and the hygiene line comes second.
 */
import { describe, expect, it } from 'vitest';
import { DEAL_HYGIENE_RANK, REPLY_TRIAGE_DAYS, TIER_RANK, workDay, type WorkInput } from '@/lib/gap/work/list';

const NOW = new Date('2026-10-08T16:00:00Z');
const base: Omit<WorkInput, 'replies' | 'summaries'> & { summaries?: WorkInput['summaries'] } = { now: NOW, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, dbState: new Map(), inMotion: new Map(), mailbox: null, opportunityHolds: new Map(), conversations: new Map() };
const reply = (accountName: string, receivedAt: string, over: Record<string, unknown> = {}) => ({ accountName, contactEmail: `p@${accountName.toLowerCase().replace(/\s+/g, '-')}.example.com`, fromName: 'A Person', subject: 'Re: yards', snippet: 'Hi Casey, send me some info and I will take a look.', receivedAt, id: `m-${accountName}`, threadId: `t-${accountName}`, ...over });

describe('X15a: an old untriaged reply no longer leads the day', () => {
  it('a reply older than the triage window ranks as admin with the age said; a fresh one keeps the reply tier; both stay listed', () => {
    const day = workDay({ ...base, replies: [reply('Boston Beer', '2026-06-02T11:44:00Z'), reply('Fresh Co', '2026-10-07T12:00:00Z')] } as WorkInput);
    const old = day.cards.find((c) => c.accountName === 'Boston Beer')!;
    const fresh = day.cards.find((c) => c.accountName === 'Fresh Co')!;
    expect(fresh.tier).toBe('reply');
    expect(old.tier).toBe('admin');
    expect(old.rankWhy).toMatch(/An old reply to triage \(128 days\)/);
    expect(old.stateKind).toBe('replied');
    expect(day.cards.indexOf(fresh)).toBeLessThan(day.cards.indexOf(old));
    expect(day.counts.needsYou).toBe(2);
    expect(REPLY_TRIAGE_DAYS).toBe(14);
  });

  it('a recorded reply whose answer is owed keeps the reply tier whatever its age (the answer is prepared and owed)', () => {
    const day = workDay({ ...base, replies: [reply('Nfi', '2026-06-02T11:44:00Z', { recorded: true })] } as WorkInput);
    expect(day.cards[0]).toMatchObject({ accountName: 'Nfi', tier: 'reply', answerOwed: true });
  });
});

describe('X15c: a deal card leads with the next step HubSpot carries', () => {
  it('with a next step the card says it first and the hygiene line second; without one the stalled line leads as before', () => {
    const inDeals: WorkInput['inDeals'] = {
      status: 'complete',
      accounts: [
        { accountName: 'Kroger', deals: [{ id: '1', name: 'YardFlow - Kroger', stage: 'Appointment scheduled', lastActivityAt: '2026-09-08T00:00:00Z', closeDate: '2026-09-30', nextStep: 'Send the pilot scope to Ann by Friday' }] },
        { accountName: 'GXO', deals: [{ id: '2', name: 'GXO - Enterprise', stage: 'Qualified to buy', lastActivityAt: '2026-09-08T00:00:00Z', closeDate: '2026-09-30', nextStep: null }] },
      ],
    };
    const day = workDay({ ...base, inDeals, replies: [] } as WorkInput);
    const kroger = day.cards.find((c) => c.accountName === 'Kroger')!;
    const gxo = day.cards.find((c) => c.accountName === 'GXO')!;
    expect(kroger.tier).toBe('deal');
    expect(kroger.why).toMatch(/^Next step on the deal: Send the pilot scope to Ann by Friday\./);
    expect(kroger.rankWhy).toMatch(/^The deal's next step: Send the pilot scope to Ann by Friday/);
    expect(kroger.rankWhy).toMatch(/stalled/i);
    expect(kroger.dealNextStep).toBe('Send the pilot scope to Ann by Friday');
    expect(gxo.why).toMatch(/^Open HubSpot deal:/);
    expect(gxo.rankWhy).toMatch(/^A stalled deal:/);
  });
});

describe('X17: the deal next step is deal work, on NOW', () => {
  it('an in-deal card with a next step needs you (tier deal, never held), its move names the step and its action is the step; without a step and not stalled it stays held', () => {
    const inDeals: WorkInput['inDeals'] = {
      status: 'complete',
      accounts: [
        { accountName: 'Kroger', deals: [{ id: '1', name: 'YardFlow - Kroger', stage: 'Appointment scheduled', lastActivityAt: '2026-10-07T00:00:00Z', closeDate: '2026-12-30', nextStep: 'Send the pilot scope to Ann by Friday.' }] },
        { accountName: 'GXO', deals: [{ id: '2', name: 'GXO - Enterprise', stage: 'Qualified to buy', lastActivityAt: '2026-10-07T00:00:00Z', closeDate: '2026-12-30', nextStep: null }] },
      ],
    };
    const day = workDay({ ...base, inDeals, replies: [] } as WorkInput);
    const kroger = day.cards.find((c) => c.accountName === 'Kroger')!;
    const gxo = day.cards.find((c) => c.accountName === 'GXO')!;
    expect(kroger.tier).toBe('deal');
    expect(kroger.stalled ?? []).toEqual([]);
    expect(kroger.move).toBe('Next step on the deal: Send the pilot scope to Ann by Friday');
    expect(kroger.next).toEqual({ label: 'Next step: Send the pilot scope to Ann by Friday', href: expect.stringContaining('?view=brief') });
    expect(kroger.rankWhy).toMatch(/^The deal's next step: Send the pilot scope to Ann by Friday/);
    expect(kroger.rankWhy).not.toMatch(/stalled/i);
    expect(gxo.tier).toBe('held');
    expect(gxo.move).toBeUndefined();
    expect(day.counts.needsYou).toBe(1);
    expect(day.cards.indexOf(kroger)).toBeLessThan(day.cards.indexOf(gxo));
  });
});

describe('I04 / I05: a hygiene-only deal card ranks after new conversations; a deal with a due commitment keeps its place; a return is one item', () => {
  it('a ready first touch leads a stalled deal with no obligation and no next step; a deal with a due commitment still leads the first touch (the review, finding 3)', () => {
    expect(TIER_RANK.deal).toBeLessThan(TIER_RANK.follow_up);
    expect(DEAL_HYGIENE_RANK).toBeGreaterThan(TIER_RANK.ready);
    const owed = { commitmentId: 'c-deal', accountName: 'GXO', kind: 'deal_step', title: 'Send the pilot success criteria', basis: null, owner: 'casey', dueAt: '2026-10-08T13:00:00.000Z', person: null, dealId: '2', dependency: null, status: 'open', snoozeUntil: null, source: { kind: 'plan', id: 'plan:2:pilot' }, proof: null, reason: null, detail: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', updatedBy: 'casey' };
    const withOwed: WorkInput['inDeals'] = { status: 'complete', accounts: [{ accountName: 'GXO', deals: [{ id: '2', name: 'GXO - Enterprise', stage: 'Qualified to buy', lastActivityAt: '2026-10-07T00:00:00Z', closeDate: '2026-12-30', nextStep: null }] }] };
    const owedDay = workDay({ ...base, inDeals: withOwed, dbState: new Map([['PepsiCo', { chosen: { personaId: 7, name: 'Tom K', title: 'Director', email: 't@pepsico.com' }, sendable: true } as never]]), replies: [], commitments: [owed] as never } as WorkInput);
    const owedNames = owedDay.cards.map((c) => c.accountName);
    expect(owedNames.indexOf('GXO')).toBeLessThan(owedNames.indexOf('PepsiCo'));
    const inDeals: WorkInput['inDeals'] = { status: 'complete', accounts: [{ accountName: 'Boston Beer', deals: [{ id: '1', name: 'YardFlow - Boston Beer', stage: 'Appointment scheduled', lastActivityAt: '2026-09-08T00:00:00Z', closeDate: '2026-09-30', nextStep: null }] }] };
    const dbState: WorkInput['dbState'] = new Map([['PepsiCo', { chosen: { personaId: 7, name: 'Tom K', title: 'Director', email: 't@pepsico.com' }, sendable: true } as never]]);
    const day = workDay({ ...base, inDeals, dbState, replies: [] } as WorkInput);
    const names = day.cards.map((c) => c.accountName);
    expect(names.indexOf('PepsiCo')).toBeLessThan(names.indexOf('Boston Beer'));
    expect(day.cards.find((c) => c.accountName === 'PepsiCo')!.tier).toBe('ready');
    expect(day.cards.find((c) => c.accountName === 'Boston Beer')!.tier).toBe('deal');
  });

  it('a reminder to follow up when someone is back and the follow-up waiting on the same person are one obligation', () => {
    const person = { personaId: 9, name: 'Diego Fonseca', email: 'diego@sgws.example.com' };
    const mk = (id: string, kind: 'follow_up' | 'reminder', title: string) => ({ commitmentId: id, accountName: 'Southern Glazer', kind, title, basis: null, owner: 'casey', dueAt: '2026-10-08T13:00:00.000Z', person, dealId: null, dependency: null, status: 'open', snoozeUntil: null, source: { kind: 'reply', id: id }, proof: null, reason: null, detail: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', updatedBy: 'casey' });
    const commitments = [mk('c-fu', 'follow_up', 'Follow up with Diego Fonseca when they are back'), mk('c-rem', 'reminder', 'Follow up with Diego Fonseca when they are back')] as never;
    const day = workDay({ ...base, replies: [], commitments } as WorkInput);
    const card = day.cards.find((c) => c.accountName === 'Southern Glazer')!;
    expect(card.obligations!.map((o) => o.commitmentId)).toEqual(['c-fu']);
  });
});
