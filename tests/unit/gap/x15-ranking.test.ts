/**
 * X15 (GAP OS sales execution engine, 2026-10-08): two ranking repairs the live Work page showed on 2026-10-08. (a) The
 * day led with untriaged replies from June and August: an untriaged reply older than REPLY_TRIAGE_DAYS no longer leads
 * the day; it ranks as admin ("An old reply to triage"), still listed, never hidden; a fresh reply and a recorded reply
 * whose answer is owed keep the reply tier. (c) Eight in-deal cards all said "the close date has passed, confirm the
 * real date": when HubSpot carries the deal's next step, the card leads with it and the hygiene line comes second.
 */
import { describe, expect, it } from 'vitest';
import { REPLY_TRIAGE_DAYS, workDay, type WorkInput } from '@/lib/gap/work/list';

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
