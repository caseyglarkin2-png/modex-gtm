/**
 * Seller acceptance A1 (2026-10-09). Casey, on the October 9 plan that led with two Southern Glazer's and two Swire
 * items derived from out-of-office auto-replies: "An expired out-of-office notice is availability information, not
 * evidence of buying intent or an automatic top priority." The reminder GAP derives from such a notice stays snoozed
 * until its return day; on or after that day it is never a due obligation, a follow-up item or a Waiting row: it rides
 * on the account's card as availability, and an account with nothing else is parked under research. The row is
 * untouched. The C27 fold (a reminder into the follow-up on the same person) is unchanged.
 */
import { describe, expect, it } from 'vitest';
import { isAvailabilityReminder, needsYouCard, workDay, type WorkInput } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { nyDayAt } from '@/lib/gap/work/dates';

const NOW = new Date('2026-10-09T15:00:00Z'); // Fri Oct 9, 11 am New York
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), ...over });
let seq = 0;
const commit = (accountName: string, kind: Commitment['kind'], title: string, over: Partial<Commitment> = {}): Commitment => ({
  commitmentId: `c:${(seq += 1)}`,
  accountName,
  kind,
  title,
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: NOW.toISOString(),
  person: null,
  dealId: null,
  threadId: null,
  status: 'open',
  snoozeUntil: null,
  dependency: null,
  proof: null,
  reason: null,
  source: { kind: 'seller', id: String(seq) },
  detail: null,
  createdAt: '2026-05-12T14:00:00Z',
  createdBy: 'casey@freightroll.com',
  updatedAt: '2026-05-12T14:00:00Z',
  updatedBy: 'casey@freightroll.com',
  ...over,
});
const DIEGO = { personaId: null, name: 'Diego Fonseca', email: 'diego@sgws-shape.example.com' };
/** The row commitments.ts syncReturnRemindersFromReplies writes for a notice naming a return day. */
const ooo = (accountName: string, backDay: string, over: Partial<Commitment> = {}): Commitment =>
  commit(accountName, 'reminder', 'Follow up with Diego Fonseca when they are back', {
    status: 'snoozed',
    snoozeUntil: nyDayAt(backDay).toISOString(),
    dueAt: nyDayAt(backDay).toISOString(),
    basis: 'Out of office: "I am out of office, returning on 05/26. For urgent matters contact my colleague."',
    person: DIEGO,
    source: { kind: 'reply', id: `ooo:${DIEGO.email}:${backDay}` },
    ...over,
  });

describe('isAvailabilityReminder', () => {
  it('is the reminder derived from an out-of-office notice (kind reminder, source reply, basis "Out of office"), nothing else', () => {
    expect(isAvailabilityReminder(ooo('A', '2026-05-26'))).toBe(true);
    expect(isAvailabilityReminder(ooo('A', '2026-05-26', { basis: 'out of office: "Back Monday"' }))).toBe(true);
    expect(isAvailabilityReminder(ooo('A', '2026-05-26', { basis: 'Jo: "not now, try me in October"' }))).toBe(false);
    expect(isAvailabilityReminder(ooo('A', '2026-05-26', { source: { kind: 'disposition', id: 'd' } }))).toBe(false);
    expect(isAvailabilityReminder(ooo('A', '2026-05-26', { kind: 'follow_up' }))).toBe(false);
    expect(isAvailabilityReminder(ooo('A', '2026-05-26', { basis: null }))).toBe(false);
  });
});

describe('A1: an expired out-of-office notice is availability, never an obligation', () => {
  it('an account with nothing else is PARKED: a research card that says the date, never "needs you", never an obligation, never Waiting; the row is untouched', () => {
    const row = ooo("Southern Glazer's Shape Co", '2026-05-26');
    const before = JSON.stringify(row);
    const day = workDay(base({ commitments: [row] }));
    expect(JSON.stringify(row)).toBe(before);
    expect(day.cards.map((c) => [c.accountName, c.tier, c.stateKind, c.lane])).toEqual([["Southern Glazer's Shape Co", 'research', 'research', 'research']]);
    const card = day.cards[0];
    expect(card.state).toBe('Back since May 26 (out-of-office notice); nothing prepared yet');
    expect(card.why).toBe('No supported angle yet: GAP researches it; it returns when there is one.');
    expect(card.person).toEqual({ name: 'Diego Fonseca', title: null });
    expect(card.availability).toEqual({ who: 'Diego Fonseca', email: DIEGO.email, returnedDay: '2026-05-26', line: 'Diego Fonseca returned May 26 (their out-of-office notice); no reply from them since.' });
    expect(card.obligations).toEqual([]);
    expect(card.rankWhy).toBe('Research; Diego Fonseca is back from an out-of-office notice (May 26): availability, not a priority.');
    expect(needsYouCard(card)).toBe(false);
    expect(day.waiting).toEqual([]);
    expect(day.snoozed).toEqual([]);
    expect(day.counts).toEqual({ needsYou: 0, parked: 1, obligationsDue: 0, waiting: 0, snoozed: 0, availability: 1 });
  });

  it('an account with other work carries the availability on that card: the card keeps its own tier and its own place', () => {
    const day = workDay(base({ commitments: [ooo('Ready Co', '2026-05-26')], dbState: new Map([['Ready Co', { sendable: true, chosen: { name: 'Karen Darling', title: null } }], ['Other Co', { sendable: true, chosen: { name: 'Sam Ortiz', title: null } }]]) }));
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([['Other Co', 'ready'], ['Ready Co', 'ready']]);
    const ready = day.cards.find((c) => c.accountName === 'Ready Co')!;
    expect(ready.availability?.line).toBe('Diego Fonseca returned May 26 (their out-of-office notice); no reply from them since.');
    expect(ready.obligations).toEqual([]);
    expect(ready.rankWhy).toBe('A prepared first touch; Diego Fonseca is back from an out-of-office notice (May 26): availability, not a priority. Ranked here: a first touch prepared.');
    expect(day.cards.find((c) => c.accountName === 'Other Co')!.availability).toBeUndefined();
    expect(day.counts).toMatchObject({ needsYou: 2, parked: 0, obligationsDue: 0, waiting: 0, availability: 1 });
  });

  it('before the return day it is snoozed as before (the footer, with its date); on the return day it is "Back today"; a notice whose person wrote since says so', () => {
    const future = workDay(base({ commitments: [ooo('Swire Shape Co', '2026-10-20')] }));
    expect(future.cards).toEqual([]);
    expect(future.snoozed.map((s) => [s.accountName, s.line])).toEqual([['Swire Shape Co', 'Follow up with Diego Fonseca when they are back: Scheduled for Oct 20.']]);
    expect(future.counts).toMatchObject({ snoozed: 1, availability: 0 });
    const today = workDay(base({ commitments: [ooo('Today Co', '2026-10-09')] }));
    expect(today.cards.map((c) => [c.accountName, c.tier, c.state])).toEqual([['Today Co', 'research', 'Back today (out-of-office notice); nothing prepared yet']]);
    expect(today.cards[0].availability?.line).toBe('Diego Fonseca returned today (their out-of-office notice); no reply from them since.');
    // They wrote after the notice: the reply is the card (reply tier); the availability says they wrote.
    const wrote = workDay(base({ commitments: [ooo('Wrote Co', '2026-10-20')], replies: [{ accountName: 'Wrote Co', contactEmail: DIEGO.email, subject: 'Re: yards', snippet: 'Back early, can we talk Thursday?', receivedAt: '2026-10-08T12:00:00Z' }] }));
    expect(wrote.cards.map((c) => [c.accountName, c.tier, c.stateKind])).toEqual([['Wrote Co', 'reply', 'replied']]);
    expect(wrote.cards[0].obligations).toEqual([]);
    expect(wrote.cards[0].availability?.line).toBe(`Diego Fonseca is out until Oct 20 (their out-of-office notice); they wrote since: ${DIEGO.email} replied Oct 8.`);
  });

  it('C27 unchanged: the reminder folds into the follow-up waiting on the same person; the follow-up is the obligation and no availability is carried twice', () => {
    const followUp = commit('Fold Co', 'follow_up', 'Follow up with Diego Fonseca', { status: 'waiting', dependency: "Diego's reply", dueAt: nyDayAt('2026-10-08').toISOString(), person: { ...DIEGO, personaId: 9 }, source: { kind: 'send', id: 'k' } });
    const day = workDay(base({ commitments: [followUp, ooo('Fold Co', '2026-05-26')] }));
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([['Fold Co', 'follow_up']]);
    expect(day.cards[0].obligations?.map((o) => o.commitmentId)).toEqual([followUp.commitmentId]);
    expect(day.cards[0].availability).toBeUndefined();
    expect(day.counts).toMatchObject({ obligationsDue: 1, availability: 0 });
    // Two notices at one account: the card carries the latest return; both are counted.
    const two = workDay(base({ commitments: [ooo('Two Co', '2026-05-26'), ooo('Two Co', '2026-09-01', { person: { personaId: null, name: 'Ana Ruiz', email: 'ana@two.example.com' }, source: { kind: 'reply', id: 'ooo:ana@two.example.com:2026-09-01' } })] }));
    expect(two.cards[0].availability?.who).toBe('Ana Ruiz');
    expect(two.cards[0].state).toBe('Back since Sep 1 (out-of-office notice); nothing prepared yet');
    expect(two.counts.availability).toBe(2);
  });
});
