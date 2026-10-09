// @vitest-environment node
/**
 * C27 and C28 (GAP OS commercial context and execution audit, 2026-10-08): obligations are one per durable origin, and
 * return dates say what they are.
 *   C27  the Work list folded a reminder into a follow-up only when the titles matched after a "Reminder: " strip and
 *        the person had an address (list.ts:668). Now the fold is by relationship (account, deal, person by address,
 *        persona or name) and by derivation (a reminder naming the commitment it came from), never by title; two
 *        promises to one person stay two; the same origin recorded twice renders once; the plan keeps one item per
 *        durable object.
 *   C28  a snoozed reminder whose day had passed said "Back today" whatever the day (May 26 read on October 8), and a
 *        date-only value read as UTC midnight (the evening before in New York). Now: due today, overdue since,
 *        returned on, scheduled for; date-only values are New York days; DST and New York midnight hold.
 */
import { describe, expect, it } from 'vitest';
import { describeReturn, foldsInto, obligationOriginKey, obligationPersonKey, withInstantDates, workDay, type WorkInput } from '@/lib/gap/work/list';
import { commitmentPhase, type Commitment } from '@/lib/gap/work/commitment-model';
import { itemsForDay } from '@/lib/gap/work/plan';
import { nyDay, nyDayAt } from '@/lib/gap/work/dates';

const NOW = new Date('2026-10-08T16:00:00Z'); // Thu Oct 8, noon New York
const base: Omit<WorkInput, 'replies'> = { now: NOW, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, dbState: new Map(), inMotion: new Map(), mailbox: null, opportunityHolds: new Map(), conversations: new Map() };
const diego = { personaId: 9, name: 'Diego Fonseca', email: 'diego@sgws.example.com' };
const c = (over: Partial<Commitment> & { commitmentId: string }): Commitment => ({ accountName: 'Southern Glazer', kind: 'follow_up', title: 'Follow up with Diego Fonseca', basis: null, owner: 'casey', dueAt: '2026-10-08T13:00:00.000Z', person: diego, dealId: null, dependency: null, status: 'open', snoozeUntil: null, source: { kind: 'send', id: over.commitmentId }, proof: null, reason: null, detail: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', updatedBy: 'casey', ...over } as Commitment);
const day = (commitments: Commitment[], now = NOW) => workDay({ ...base, now, replies: [], commitments });
const obligationsOf = (commitments: Commitment[], account = 'Southern Glazer') => day(commitments).cards.find((x) => x.accountName === account)?.obligations?.map((o) => o.commitmentId) ?? [];

describe('C27: one obligation per durable origin', () => {
  it("Diego's follow-up plus its derived reminder renders once, the follow-up standing, whatever the reminder is titled", () => {
    const fu = c({ commitmentId: 'c-fu', source: { kind: 'send', id: 'dec-1:0' } });
    const rem = c({ commitmentId: 'c-rem', kind: 'reminder', title: 'Come back to Diego: they said not now', source: { kind: 'reply', id: 'ooo:diego@sgws.example.com:2026-10-08' } });
    expect(obligationsOf([fu, rem])).toEqual(['c-fu']);
    expect(obligationsOf([rem, fu])).toEqual(['c-fu']);
    expect(foldsInto(rem, [fu])?.commitmentId).toBe('c-fu');
    expect(foldsInto(fu, [rem])).toBeNull();
  });

  it('repeat with a missing address: the person matches by persona, then by name; and with an alternate title', () => {
    const fu = c({ commitmentId: 'c-fu', person: { personaId: 9, name: 'Diego Fonseca', email: null } });
    const remPersona = c({ commitmentId: 'c-rem', kind: 'reminder', title: 'Reminder: ping Diego', person: { personaId: 9, name: null, email: null }, source: { kind: 'disposition', id: 'd-7' } });
    expect(obligationsOf([fu, remPersona])).toEqual(['c-fu']);
    const fuName = c({ commitmentId: 'c-fu2', person: { personaId: null, name: 'Diego  Fonseca', email: null } });
    const remName = c({ commitmentId: 'c-rem2', kind: 'reminder', title: 'Back to Diego', person: { personaId: null, name: 'diego fonseca', email: null }, source: { kind: 'reply', id: 'ooo:x' } });
    expect(obligationsOf([fuName, remName])).toEqual(['c-fu2']);
    expect(obligationPersonKey(fuName)).toBe('name:diego fonseca');
    expect(obligationPersonKey(c({ commitmentId: 'x', person: null }))).toBeNull();
    // A reminder about nobody folds into nothing.
    const remNobody = c({ commitmentId: 'c-rem3', kind: 'reminder', title: 'Back to Southern Glazer', person: null, source: { kind: 'snooze', id: 'o1' } });
    expect(obligationsOf([fu, remNobody]).sort()).toEqual(['c-fu', 'c-rem3']);
  });

  it('a reminder that names the commitment it derives from folds by id, even across kinds and people', () => {
    const task = c({ commitmentId: 'c-task', kind: 'task', title: 'Send the dock template', person: null });
    const rem = c({ commitmentId: 'c-rem', kind: 'reminder', title: 'Reminder: the dock template', person: null, source: { kind: 'seller', id: 'n1' }, detail: { derivedFrom: 'c-task' } as never });
    expect(obligationsOf([task, rem])).toEqual(['c-task']);
    const remBySource = c({ commitmentId: 'c-rem2', kind: 'reminder', title: 'x', person: null, source: { kind: 'seller', id: 'c-task' } });
    expect(obligationsOf([task, remBySource])).toEqual(['c-task']);
  });

  it('two different promises to one person remain two; a reminder and a done follow-up stay the reminder; the same origin twice renders once', () => {
    const deliverable = c({ commitmentId: 'c-del', kind: 'deliverable', title: 'Send Diego the dock schedule template', source: { kind: 'bid', id: 'b1' } });
    const promise = c({ commitmentId: 'c-prom', kind: 'buyer_promise', title: 'Diego sends the site list', status: 'waiting', source: { kind: 'bid', id: 'b2' } });
    const fu = c({ commitmentId: 'c-fu' });
    expect(obligationsOf([deliverable, promise, fu]).sort()).toEqual(['c-del', 'c-fu', 'c-prom']);
    const done = c({ commitmentId: 'c-fu-done', status: 'done', proof: { kind: 'ledger', id: 'e', note: null, at: NOW.toISOString(), by: 'casey' } });
    const rem = c({ commitmentId: 'c-rem', kind: 'reminder', title: 'Follow up with Diego when they are back', source: { kind: 'reply', id: 'ooo:1' } });
    expect(obligationsOf([done, rem])).toEqual(['c-rem']);
    const twice = c({ commitmentId: 'c-dup', kind: 'deliverable', title: 'Send Diego the dock schedule template (again)', source: { kind: 'bid', id: 'b1' } });
    expect(obligationsOf([deliverable, twice])).toEqual(['c-del']);
    expect(obligationOriginKey(deliverable)).toBe(obligationOriginKey(twice));
    expect(obligationOriginKey(deliverable)).not.toBe(obligationOriginKey(c({ ...deliverable, commitmentId: 'c-other-deal', dealId: '77' })));
  });

  it('the plan keeps one item per durable object: a commitment reached through two cards is one item', () => {
    const fu = c({ commitmentId: 'c-fu' });
    const d = day([fu]);
    const card = d.cards.find((x) => x.accountName === 'Southern Glazer')!;
    const twoCards = { ...d, cards: [card, { ...card, accountName: 'Southern Glazer', stateKind: 'in_deal' as const, tier: 'deal' as const }] };
    const items = itemsForDay(twoCards, nyDay(NOW));
    expect(items.filter((it) => it.refs.commitmentId === 'c-fu')).toHaveLength(1);
  });
});

describe('C28: return dates say what they are', () => {
  const snoozedUntil = (until: string, id = 'c-rem') => c({ commitmentId: id, kind: 'reminder', title: 'Follow up with Diego Fonseca when they are back', status: 'snoozed', snoozeUntil: until, dueAt: until, source: { kind: 'reply', id: `ooo:${until}` } });
  const line = (x: Commitment, now = NOW) => {
    const n = withInstantDates(x);
    return describeReturn(n, commitmentPhase(n, now), now);
  };

  it('May 26 and June 16 read on October 8 say returned on that day and overdue since, never back today', () => {
    expect(line(snoozedUntil('2026-05-26T13:00:00.000Z'))).toBe('Returned on May 26; overdue since then.');
    expect(line(snoozedUntil('2026-06-16T13:00:00.000Z'))).toBe('Returned on Jun 16; overdue since then.');
    expect(line(snoozedUntil('2026-10-08T13:00:00.000Z'))).toBe('Back today (snoozed until today).');
    expect(line(snoozedUntil('2026-10-14T13:00:00.000Z'))).toBe('Scheduled for Oct 14.');
    const d = day([snoozedUntil('2026-05-26T13:00:00.000Z')]);
    expect(d.cards.find((x) => x.accountName === 'Southern Glazer')!.obligations![0].line).toBe('Returned on May 26; overdue since then.');
    expect(d.snoozed.find((s) => s.key === 'c-rem')).toBeUndefined();
  });

  it('open and waiting obligations: due today, overdue since, scheduled for; follow-ups and promises keep their words', () => {
    expect(line(c({ commitmentId: 'c-t', kind: 'task', title: 'Send the deck', dueAt: '2026-10-08T13:00:00.000Z' }))).toBe('Due today.');
    expect(line(c({ commitmentId: 'c-t', kind: 'task', title: 'Send the deck', dueAt: '2026-06-16T13:00:00.000Z' }))).toBe('Overdue since Jun 16.');
    expect(line(c({ commitmentId: 'c-t', kind: 'task', title: 'Send the deck', dueAt: '2026-10-20T13:00:00.000Z', status: 'waiting', dependency: 'the legal review' }))).toBe('Scheduled for Oct 20; waiting on the legal review.');
    expect(line(c({ commitmentId: 'c-fu', dueAt: '2026-06-16T13:00:00.000Z', status: 'waiting' }))).toBe('Follow-up due since Jun 16: no reply from Diego Fonseca.');
    expect(line(c({ commitmentId: 'c-p', kind: 'buyer_promise', dueAt: '2026-06-16T13:00:00.000Z', status: 'waiting' }))).toMatch(/promised it by Jun 16; it has not arrived/);
  });

  it('a date-only value is a New York day at the due hour, never UTC midnight: May 26 stays May 26 and a date due tomorrow is not due tonight', () => {
    const fixed = withInstantDates(c({ commitmentId: 'c-d', kind: 'task', dueAt: '2026-05-26' as never, snoozeUntil: '2026-05-26' as never }));
    expect(fixed.dueAt).toBe(nyDayAt('2026-05-26').toISOString());
    expect(nyDay(fixed.dueAt!)).toBe('2026-05-26');
    expect(nyDay('2026-05-26')).toBe('2026-05-25'); // the trap the normalization removes
    const unchanged = c({ commitmentId: 'c-i', dueAt: '2026-10-08T13:00:00.000Z' });
    expect(withInstantDates(unchanged)).toBe(unchanged);
    // Wednesday Oct 7, 11:30 pm New York: a task due "2026-10-08" is due tomorrow, not tonight.
    const lateWed = new Date('2026-10-08T03:30:00Z');
    expect(line(c({ commitmentId: 'c-d', kind: 'task', title: 'Send the deck', dueAt: '2026-10-08' as never }), lateWed)).toBe('Due tomorrow.');
    // Thursday Oct 8, 12:30 am New York: now it is due today.
    expect(line(c({ commitmentId: 'c-d', kind: 'task', title: 'Send the deck', dueAt: '2026-10-08' as never }), new Date('2026-10-08T04:30:00Z'))).toBe('Due today.');
    // A snoozed date-only reminder read in the New York evening of the day before says scheduled for tomorrow, not back today.
    expect(line(snoozedUntil('2026-10-08' as never), lateWed)).toBe('Scheduled for tomorrow.');
  });

  it('daylight saving: the Sunday the clocks fall back (Nov 1, 2026) and the morning after keep the New York day', () => {
    const due = c({ commitmentId: 'c-d', kind: 'task', title: 'Send the deck', dueAt: '2026-11-02' as never });
    // Sunday Nov 1, 11:30 pm EST (UTC-5 after the change): Nov 2 is tomorrow.
    expect(line(due, new Date('2026-11-02T04:30:00Z'))).toBe('Due tomorrow.');
    // Monday Nov 2, 12:30 am EST: due today.
    expect(line(due, new Date('2026-11-02T05:30:00Z'))).toBe('Due today.');
    // A reminder snoozed until Nov 1 (the DST day itself), read on Nov 2: returned on Nov 1.
    expect(line(snoozedUntil('2026-11-01' as never), new Date('2026-11-02T17:00:00Z'))).toBe('Returned yesterday; overdue since then.');
    expect(withInstantDates(snoozedUntil('2026-11-01' as never)).snoozeUntil).toBe(nyDayAt('2026-11-01').toISOString());
    expect(nyDay(nyDayAt('2026-11-01'))).toBe('2026-11-01');
  });
});
