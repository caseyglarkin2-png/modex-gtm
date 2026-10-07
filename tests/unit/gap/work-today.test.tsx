/**
 * R45 (GAP OS execution recovery): close the day and retain tomorrow. The Today summary is derived from actual state
 * (done today from the ledger, owed to buyers, waiting on them, due tomorrow) with no storage of its own; the
 * workspace's actionable result is the card's action (a lane card never competes); a mixed session read again "the
 * next day" keeps every date (New York), shows no phantom Done and omits no task.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todaySummary } from '@/lib/gap/work/today';
import { loadCompletedToday } from '@/lib/gap/work/day-load';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { nyDay, nyDayAt } from '@/lib/gap/work/dates';
import { WorkToday } from '@/components/gap/work-today';
import { DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';
import { ledgerDb } from './fixtures/ledger-db';

const LATE = new Date('2026-10-07T03:30:00Z'); // Tue Oct 6, 11:30 pm New York (already Wednesday in UTC)
let n = 0;
const commit = (accountName: string, kind: Commitment['kind'], title: string, over: Partial<Commitment> = {}): Commitment => ({
  commitmentId: `seller:${(n += 1)}`,
  accountName,
  kind,
  title,
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: null,
  person: null,
  dealId: null,
  threadId: null,
  status: 'open',
  snoozeUntil: null,
  dependency: null,
  proof: null,
  reason: null,
  source: { kind: 'seller', id: String(n) },
  detail: null,
  createdAt: '2026-10-06T14:00:00Z',
  createdBy: 'casey@freightroll.com',
  updatedAt: '2026-10-06T14:00:00Z',
  updatedBy: 'casey@freightroll.com',
  ...over,
});
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: LATE, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), ...over });

describe('the Today summary (R45)', () => {
  it('done is today only (New York); owed lists every open buyer obligation; waiting is what waits on them; tomorrow is what becomes due tomorrow and is not due today', () => {
    const cs = [
      commit('Pepsi Scratch Co', 'deliverable', 'Send the dock schedule template', { dueAt: nyDayAt('2026-10-07').toISOString() }),
      commit('Nfi Scratch Co', 'answer_request', "Answer Ann's request", { dueAt: '2026-10-06T14:00:00Z' }),
      commit('Fedex Scratch Co', 'follow_up', 'Follow up with Glen', { status: 'waiting', dependency: "Glen's reply", dueAt: nyDayAt('2026-10-12').toISOString(), source: { kind: 'send', id: 'k' } }),
      commit('Tyson Scratch Co', 'reminder', 'Back to Tyson Scratch Co', { status: 'snoozed', snoozeUntil: nyDayAt('2026-10-07').toISOString(), dueAt: nyDayAt('2026-10-07').toISOString() }),
      commit('Done Co', 'deliverable', 'Already sent', { status: 'done', proof: { kind: 'seller', id: null, note: null, at: '2026-10-06T15:00:00Z', by: 'x' } }),
    ];
    const day = workDay(base({ commitments: cs }));
    const t = todaySummary({
      now: LATE,
      commitments: cs,
      waiting: day.waiting,
      meetings: [{ accountName: 'Dannon Scratch Co', at: '2026-10-07T14:00:00Z', what: 'Pilot scoping' }],
      done: [
        { at: '2026-10-06T15:00:00Z', accountName: 'Done Co', line: 'Done: Already sent.' },
        { at: '2026-10-05T15:00:00Z', accountName: 'Old Co', line: 'Done: something yesterday.' },
        { at: '2026-10-07T03:00:00Z', accountName: 'Late Co', line: 'Sent touch 1 to a@late.example.com.' },
      ],
    });
    expect(t.day).toBe('2026-10-06');
    // 11 pm New York is still Oct 6: the 03:00 UTC send is today's; yesterday's is never today's Done.
    expect(t.done.map((d) => d.accountName)).toEqual(['Done Co', 'Late Co']);
    expect(t.owed.map((o) => o.title)).toEqual(["Answer Ann's request", 'Send the dock schedule template']);
    expect(t.waiting.map((w) => w.title)).toEqual(['Follow up with Glen']);
    expect(t.tomorrow.map((x) => [x.accountName, x.line])).toEqual([
      ['Pepsi Scratch Co', 'Due tomorrow.'],
      ['Tyson Scratch Co', 'Back tomorrow.'],
      ['Dannon Scratch Co', 'Prepare it today or first thing.'],
    ]);
  });

  it('renders each group with its count equal to its list', () => {
    render(<WorkToday today={{ day: '2026-10-06', done: [{ at: '2026-10-06T15:00:00Z', accountName: 'Done Co', line: 'Done: Already sent.' }], owed: [{ commitmentId: 'a', accountName: 'Pepsi Scratch Co', title: 'Send the template', line: 'Due tomorrow.' }], waiting: [], tomorrow: [{ key: 'm', accountName: 'Dannon Scratch Co', title: 'Meeting at 10:00 AM: Pilot scoping', line: 'Prepare it today or first thing.' }] }} />);
    expect(screen.getByTestId('work-today')).toHaveTextContent('Today, Tue, Oct 6');
    for (const [id, count] of [['today-done', 1], ['today-owed', 1], ['today-waiting', 0], ['today-tomorrow', 1]] as const) {
      expect(screen.getByTestId(id)).toHaveAttribute('data-count', String(count));
      expect(screen.getByTestId(id).querySelectorAll('li')).toHaveLength(count);
    }
  });

  it('done today is read from the ledger, never stored: a send, a recorded answer, an obligation done, a note, an outcome; yesterday\'s rows are not today\'s', async () => {
    const at = (iso: string) => new Date(iso);
    const d = ledgerDb({
      audit: [
        { id: 'a1', kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec', created_at: at('2026-10-06T15:00:00Z'), payload: { accountName: 'Fedex Scratch Co', recipient: 'glen@fedex.example.com', stepIndex: 0 } },
        { id: 'a2', kind: 'disposition.recorded', subject_type: 'disposition', subject_id: 'd1', created_at: at('2026-10-06T16:00:00Z'), payload: { accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', responseClass: 'request_information', humanConfirmed: true } },
        { id: 'a3', kind: 'disposition.recorded', subject_type: 'disposition', subject_id: 'd2', created_at: at('2026-10-06T16:30:00Z'), payload: { accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', responseClass: 'timing', humanConfirmed: false } },
        { id: 'a4', kind: 'account.commitment', subject_type: 'account', subject_id: 'Pepsi Scratch Co', created_at: at('2026-10-06T17:00:00Z'), payload: { commitmentId: 'c', op: 'status', commitment: { accountName: 'Pepsi Scratch Co', title: 'Send the template', status: 'done' } } },
        { id: 'a5', kind: 'capture.note', subject_type: 'capture', subject_id: 'n1', created_at: at('2026-10-06T18:00:00Z'), payload: { accountName: 'Pepsi Scratch Co', context: 'call' } },
        { id: 'a6', kind: 'account.work_outcome', subject_type: 'account', subject_id: 'Tyson Scratch Co', created_at: at('2026-10-06T19:00:00Z'), payload: { kind: 'snoozed', until: '2026-10-08T13:00:00Z' } },
        { id: 'a0', kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec0', created_at: at('2026-10-05T15:00:00Z'), payload: { accountName: 'Old Co', recipient: 'x@old.example.com', stepIndex: 0 } },
      ],
    });
    const done = await loadCompletedToday(d.client(), LATE);
    expect(done.map((x) => [x.accountName, x.line])).toEqual([
      ['Fedex Scratch Co', 'Sent touch 1 to glen@fedex.example.com.'],
      ['Nfi Scratch Co', "Recorded ann@nfi.example.com's answer (request information)."],
      ['Pepsi Scratch Co', 'Done: Send the template.'],
      ['Pepsi Scratch Co', 'Saved a note (call).'],
      ['Tyson Scratch Co', 'Snoozed until Oct 8.'],
    ]);
  });
});

describe('done today keeps the latest completions on a busy day (R42b gate finding)', () => {
  it('more than 500 ledger rows today: the newest completion still shows (the oldest drop), in order; a reply answered from GAP counts', async () => {
    const at = (ms: number) => new Date(Date.parse('2026-10-06T12:00:00Z') + ms);
    const busy = Array.from({ length: 520 }, (_, k) => ({ id: `b${String(k).padStart(4, '0')}`, kind: 'account.commitment', subject_type: 'account', subject_id: 'Busy Co', created_at: at(k * 1000), payload: { commitmentId: `c${k}`, op: 'create', commitment: { accountName: 'Busy Co', status: 'open', title: 'x' } } }));
    const d = ledgerDb({
      audit: [
        ...busy,
        { id: 'z1', kind: 'execution.reply_sent', subject_type: 'inbound_message', subject_id: 'msg-1', created_at: at(600_000), payload: { accountName: 'Nfi Scratch Co', recipient: 'ann@nfi.example.com' } },
        { id: 'z2', kind: 'account.work_outcome', subject_type: 'account', subject_id: 'Tyson Scratch Co', created_at: at(601_000), payload: { kind: 'snoozed', until: '2026-10-08T13:00:00Z' } },
      ],
    });
    const done = await loadCompletedToday(d.client(), LATE);
    expect(done.map((x) => [x.accountName, x.line])).toEqual([
      ['Nfi Scratch Co', 'Answered ann@nfi.example.com in their thread.'],
      ['Tyson Scratch Co', 'Snoozed until Oct 8.'],
    ]);
  });
});

describe('the actionable result is the card\'s action (R45)', () => {
  it('where the lane mapping would offer an action the workspace does not allow, the card offers none: the lane card never competes', () => {
    const summary = (actionable?: unknown) => new Map([['Heb Scratch Co', { accountName: 'Heb Scratch Co', state: 'follow_up_due' as const, stateLine: 'Follow up due: Dakota, due Oct 6', person: null, blocker: null, coldTouchAllowed: false, nextText: 'Send the next touch to Dakota (due Oct 6).', at: '2026-10-06T14:59:00Z', ...(actionable === undefined ? {} : { actionable: actionable as never }) }]]);
    const input = (actionable?: unknown) => base({ now: new Date('2026-10-06T15:00:00Z'), candidates: [{ lane: 'follow_up', accountName: 'Heb Scratch Co', title: 'Follow up with Dakota', detail: 'x', href: '/gap?lane=follow_up&open=d9', sortKey: [0] }], summaries: summary(actionable) });
    expect(workDay(input({ intent: 'follow_up', allowed: null, preparation: 'ready', completion: 'touch_sent', hypothesisId: null })).cards[0].next).toBeNull();
    // A summary from before the actionable result keeps the old mapping (the follow-up page).
    expect(workDay(input()).cards[0].next).toEqual({ label: 'Open the follow-up', href: '/gap/accounts/heb-scratch-co' });
  });
  it('Work no longer renders the legacy NEXT UP list beside the Work list', async () => {
    const { readFileSync } = await import('node:fs');
    const page = readFileSync('src/app/gap/page.tsx', 'utf8');
    expect(page).not.toMatch(/<NextUp\b/);
    expect(page).not.toMatch(/pickNextUpV2/);
  });

  it('a fresh summary whose actionable result allows nothing leaves the card with no action; a summary that predates it falls back to the lane mapping', () => {
    const input = (actionable: unknown) => base({ now: new Date('2026-10-06T15:00:00Z'), candidates: [{ lane: 'ready', accountName: 'Fedex Scratch Co', title: 'Contact Glen', detail: 'x', href: '/gap?lane=ready&open=d1', sortKey: [0] }], summaries: new Map([['Fedex Scratch Co', { accountName: 'Fedex Scratch Co', state: 'held' as const, stateLine: 'Held: a draft is outstanding', person: null, blocker: 'A GAP draft is outstanding.', coldTouchAllowed: false, nextText: 'Send or discard the draft.', at: '2026-10-06T14:59:00Z', ...(actionable === undefined ? {} : { actionable: actionable as never }) }]]) });
    expect(workDay(input({ intent: 'hold', allowed: null, preparation: 'none', completion: 'hold_lifted', hypothesisId: null })).cards[0].next).toBeNull();
    expect(workDay(input({ intent: 'hold', allowed: { label: 'Open the draft', href: '#outstanding-draft' }, preparation: 'none', completion: 'hold_lifted', hypothesisId: null })).cards[0].next).toEqual({ label: 'Open the draft', href: '/gap/accounts/fedex-scratch-co#outstanding-draft' });
    // Predates R10: the lane mapping says what a held account allows (nothing).
    expect(workDay(input(undefined)).cards[0].next).toBeNull();
  });
});

describe('a mixed session resumes the next day (R45, pure)', () => {
  it('the dated obligation keeps its New York day, the snooze stays away until its day, the meeting is tomorrow\'s work, the reply still waits, nothing is phantom Done and nothing is omitted', () => {
    const cs = [
      commit('Pepsi Scratch Co', 'deliverable', 'Send the dock schedule template', { dueAt: nyDayAt('2026-10-09').toISOString(), basis: 'Tom: "by Friday"' }),
      commit('Fedex Scratch Co', 'follow_up', 'Follow up with Glen', { status: 'waiting', dependency: "Glen's reply", dueAt: nyDayAt('2026-10-12').toISOString(), source: { kind: 'send', id: 'k' } }),
      commit('Tyson Scratch Co', 'reminder', 'Back to Tyson Scratch Co', { status: 'snoozed', snoozeUntil: nyDayAt('2026-10-08').toISOString(), dueAt: nyDayAt('2026-10-08').toISOString(), source: { kind: 'snooze', id: 'o1' } }),
    ];
    const replies = [{ accountName: 'Mills Scratch Co', contactEmail: 'jo@mills.example.com', subject: 'Re', snippet: 'Can you send the comparison? Thursday works.', receivedAt: '2026-10-06T20:00:00Z', id: 'm1' }];
    const meetings = [{ accountName: 'Dannon Scratch Co', at: '2026-10-07T14:00:00Z', what: 'Pilot scoping' }];
    const outcomes = new Map([['Tyson Scratch Co', { accountName: 'Tyson Scratch Co', kind: 'snoozed' as const, reason: null, until: nyDayAt('2026-10-08').toISOString(), by: 'casey@freightroll.com', at: '2026-10-06T19:00:00Z' }]]);
    const at = (now: Date) => workDay(base({ now, commitments: cs, replies, meetings, outcomes: new Map([...outcomes].filter(([, o]) => new Date(o.until).getTime() > now.getTime())) }));
    const nextMorning = new Date(LATE.getTime() + 86_400_000); // Wed Oct 7, 11:30 pm New York
    for (const [label, day] of [['today', at(LATE)], ['next day', at(nextMorning)]] as const) {
      const seen = [...day.cards.flatMap((c) => (c.obligations ?? []).filter((o) => o.commitmentId).map((o) => o.commitmentId)), ...day.waiting.map((w) => w.commitmentId).filter(Boolean), ...day.snoozed.map((s) => s.key)];
      const accountsSnoozed = new Set(day.snoozed.map((s) => s.accountName));
      for (const c of cs) {
        const visible = seen.includes(c.commitmentId) || accountsSnoozed.has(c.accountName);
        expect(visible, `${label}: ${c.title} silently omitted`).toBe(true);
      }
      expect(day.cards.find((c) => c.accountName === 'Mills Scratch Co')?.stateKind, label).toBe('replied');
      expect(day.cards.some((c) => c.accountName === 'Tyson Scratch Co'), `${label}: the snooze came back early`).toBe(false);
    }
    const tomorrow = at(nextMorning);
    // The Friday obligation is still Friday (no shift), not done, not due yet on Wednesday.
    expect(tomorrow.waiting.find((w) => w.accountName === 'Pepsi Scratch Co')).toMatchObject({ dueDay: '2026-10-09', line: 'Due Oct 9.' });
    expect(nyDay(cs[0].dueAt!)).toBe('2026-10-09');
    // The meeting is within 24 hours of the next morning's read only on its day.
    const morningOfMeeting = workDay(base({ now: new Date('2026-10-07T12:00:00Z'), commitments: cs, replies, meetings }));
    expect(morningOfMeeting.cards.find((c) => c.accountName === 'Dannon Scratch Co')?.obligations?.[0]).toMatchObject({ kind: 'meeting', title: 'Meeting today 10:00 AM: Pilot scoping' });
  });
});
