/**
 * R51 (GAP OS execution recovery): meetings are prepared from the current conversation. Every line carries its trust
 * word; confirmed needs are ONLY the buyer's confirmed words (scoped to the deal plus the labeled account-level ones);
 * the working thesis is a guess to test, never a finding; public news comes after the buyer's words and never stands
 * in for them; a canceled meeting prepares nothing and Work stops asking for it; a moved meeting is read at its new
 * time; the Work card carries the prepared starting point and opens the full preparation on the deal brief.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { meetingDeal, meetingInstant, meetingState, prepareMeeting, type PrepInput } from '@/lib/gap/deals/meeting-prep';
import { openQuestionsFor, unknownSectionsOfTypes } from '@/lib/gap/deals/deal-brief';
import { loadMeetingRows, loadMeetingStartingPoints } from '@/lib/gap/work/day-load';
import { workDay } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { MeetingPrepView } from '@/components/gap/meeting-prep';
import { ledgerDb } from './fixtures/ledger-db';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z'); // Tue Oct 6, 3 pm New York
const TOMORROW_10 = '2026-10-07T14:00:00.000Z'; // Wed Oct 7, 10 am New York
const ACCOUNT = 'Kroger Scratch Co';

const base = (over: Partial<PrepInput> = {}): PrepInput => ({
  meeting: { id: 11, at: TOMORROW_10, status: 'Scheduled', objective: 'Columbus yard walk with Ben', attendees: 'Ben Scratch, Dee', dealId: '70002', createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z' },
  now: NOW,
  deal: { id: '70002', name: 'Kroger Columbus DC', contacts: [{ name: 'Ben Scratch', title: 'Director, Columbus DC' }, { name: 'Eve Scratch', title: 'Site Safety Lead' }] },
  people: [{ name: 'Ben Scratch', title: 'Director, Columbus DC' }, { name: 'Ann Scratch', title: 'VP Supply Chain Operations' }],
  commitments: [
    { title: 'Send Ben the dock door map', kind: 'deliverable', status: 'open', line: 'Due tomorrow.', createdAt: '2026-10-02T12:00:00.000Z', updatedAt: '2026-10-05T12:00:00.000Z', person: { name: 'Ben Scratch' }, scopeLabel: 'Deal: Kroger Columbus DC' },
    { title: 'Book the walk', kind: 'deal_step', status: 'done', line: 'Done Oct 2.', createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-02T12:00:00.000Z', person: null, scopeLabel: 'Deal: Kroger Columbus DC' },
  ],
  needs: [
    { type: 'business_problem', quote: 'Trailers sit two hours at Columbus before a door opens.', who: 'Ben Scratch', at: '2026-10-03T15:00:00.000Z', scopeLabel: 'Deal: Kroger Columbus DC (through Ben Scratch)' },
    { type: 'current_state', quote: 'Every DC still checks trailers in on paper.', who: 'Cal Scratch', at: '2026-10-04T15:00:00.000Z', scopeLabel: 'account-level' },
  ],
  unknownQuestions: openQuestionsFor(unknownSectionsOfTypes(['business_problem', 'current_state'])),
  learningObjective: null,
  guesses: ['My guess is that the Columbus gate is where production capacity is lost.'],
  publicFacts: [{ quote: 'Kroger is automating its Ohio distribution center.', title: 'Kroger automates Ohio DC', url: 'https://news.example.com/kroger', publishedAt: '2026-09-10T00:00:00.000Z' }],
  materials: [{ label: 'Kroger demo pack', href: '/demo/kroger' }],
  ...over,
});

describe('a meeting prepared from the current conversation (R51)', () => {
  it('objective, attendees with roles, the last commitment, confirmed needs, open questions, the guess, public context and materials, each with its trust word', () => {
    const p = prepareMeeting(base());
    expect(p.state).toBe('upcoming');
    expect(p.headline).toBe('Meeting Wed, Oct 7, 10:00 AM: Columbus yard walk with Ben');
    expect(p.objective).toEqual({ text: 'Columbus yard walk with Ben', trust: 'Recorded', source: 'the meeting on record' });
    expect(p.attendees.map((a) => [a.text, a.trust])).toEqual([
      ['Ben Scratch, Director, Columbus DC', 'Recorded'],
      ['Dee (no role on record)', 'Recorded'],
      ['Eve Scratch, Site Safety Lead (a contact on the deal; not named on the meeting)', 'HubSpot'],
    ]);
    expect(p.lastCommitment).toMatchObject({ text: 'Send Ben the dock door map (Due tomorrow)', trust: 'Recorded' });
    expect(p.confirmedNeeds.map((n) => [n.trust, n.text])).toEqual([
      ['Buyer confirmed', 'Problem: "Trailers sit two hours at Columbus before a door opens."'],
      ['Buyer confirmed', 'How it runs today: "Every DC still checks trailers in on paper."'],
    ]);
    expect(p.confirmedNeeds[1].source).toMatch(/account-level/);
    expect(p.openQuestions[0]).toEqual({ text: 'Learn why it happens: what causes the waiting, in their words.', trust: 'To learn' });
    expect(p.toTest).toEqual([{ text: 'My guess is that the Columbus gate is where production capacity is lost.', trust: 'Our guess', source: 'the working thesis: ask, never assert' }]);
    expect(p.publicContext[0]).toMatchObject({ trust: 'Public source', href: 'https://news.example.com/kroger' });
    expect(p.publicContext[0].source).toMatch(/public, not the buyer's words/);
    expect(p.materials).toEqual([{ text: 'Kroger demo pack', trust: 'Ours', href: '/demo/kroger' }]);
    expect(p.startingPoint).toBe('Objective: Columbus yard walk with Ben. First to learn: Learn why it happens: what causes the waiting, in their words. Last commitment: Send Ben the dock door map. 2 confirmed needs on record.');
    // Every line says what it rests on.
    for (const l of [p.objective, ...p.attendees, p.lastCommitment!, ...p.confirmedNeeds, ...p.openQuestions, ...p.toTest, ...p.publicContext, ...p.materials]) expect(l.trust).toBeTruthy();
  });

  it('no speculative pain as a finding, and public news never stands in for the buyer: with nothing confirmed the needs are empty, the guess stays a guess, the news stays public', () => {
    const p = prepareMeeting(base({ needs: [], unknownQuestions: openQuestionsFor(unknownSectionsOfTypes([])) }));
    expect(p.confirmedNeeds).toEqual([]);
    expect(p.confirmedNeeds.some((n) => /guess|automating/i.test(n.text))).toBe(false);
    expect(p.toTest.map((t) => t.trust)).toEqual(['Our guess']);
    expect(p.publicContext.map((t) => t.trust)).toEqual(['Public source']);
    expect(p.openQuestions[0].text).toBe('Learn the problem in their words: what breaks in their yards, and how often?');
    expect(p.startingPoint).toMatch(/Nothing confirmed from the buyer yet\.$/);
  });

  it('no objective on the row: the first open question is SUGGESTED (and the seller\'s own objective leads when set)', () => {
    expect(prepareMeeting(base({ meeting: { ...base().meeting, objective: null } })).objective).toMatchObject({ trust: 'Suggested', text: 'Learn why it happens: what causes the waiting, in their words.' });
    const own = prepareMeeting(base({ meeting: { ...base().meeting, objective: null }, learningObjective: 'Learn who signs off on a pilot at Columbus.' }));
    expect(own.objective.text).toBe('Learn who signs off on a pilot at Columbus.');
    expect(own.openQuestions[0]).toEqual({ text: 'Learn who signs off on a pilot at Columbus.', trust: 'To learn', source: 'your learning objective' });
  });

  it('a canceled meeting prepares nothing; the row\'s date and time are the truth (a moved meeting reads at its new time)', () => {
    const c = prepareMeeting(base({ meeting: { ...base().meeting, status: 'Canceled' } }));
    expect(c.state).toBe('canceled');
    expect(c.headline).toBe('Canceled: Columbus yard walk with Ben (was Oct 7). Nothing to prepare unless it is rebooked.');
    expect(c.startingPoint).toBe(c.headline);
    expect(meetingInstant(new Date('2026-10-07T00:00:00Z'), '10:00 AM')?.toISOString()).toBe(TOMORROW_10);
    expect(meetingInstant(new Date('2026-10-09T00:00:00Z'), '2:30 PM')?.toISOString()).toBe('2026-10-09T18:30:00.000Z');
    expect(meetingInstant(new Date('2026-10-07T00:00:00Z'), null)?.toISOString()).toBe('2026-10-07T13:00:00.000Z');
    expect(meetingState({ at: '2026-10-06T18:30:00.000Z', status: 'Scheduled' }, NOW)).toBe('upcoming');
    expect(meetingState({ at: '2026-10-05T18:30:00.000Z', status: 'Scheduled' }, NOW)).toBe('past');
  });

  it('a meeting belongs to its row\'s deal, else to the one deal whose contact is named, else to the account', () => {
    const deals = [{ id: '70001', contacts: [{ name: 'Ann Scratch' }] }, { id: '70002', contacts: [{ name: 'Ben Scratch' }] }];
    expect(meetingDeal({ dealId: '70001', attendees: 'Ben Scratch' }, deals)?.id).toBe('70001');
    expect(meetingDeal({ dealId: null, attendees: 'Ben' }, deals)?.id).toBe('70002');
    expect(meetingDeal({ dealId: null, attendees: 'Ann Scratch and Ben Scratch' }, deals)).toBeNull();
    expect(meetingDeal({ dealId: '69999', attendees: 'Ann' }, deals)).toBeNull();
  });

  it('the view tags every line and a canceled meeting shows only that it was canceled', () => {
    const { unmount } = render(<MeetingPrepView prep={prepareMeeting(base())} />);
    const s = screen.getByTestId('meeting-prep');
    expect(s.getAttribute('id')).toBe('meeting-11');
    expect(within(screen.getByTestId('prep-needs')).getAllByTestId('prep-trust').map((t) => t.textContent)).toEqual(['Buyer confirmed', 'Buyer confirmed']);
    expect(within(screen.getByTestId('prep-to-test')).getByTestId('prep-trust').textContent).toBe('Our guess');
    expect(within(screen.getByTestId('prep-public')).getByTestId('prep-trust').textContent).toBe('Public source');
    unmount();
    render(<MeetingPrepView prep={prepareMeeting(base({ meeting: { ...base().meeting, status: 'Canceled' } }))} />);
    expect(screen.getByTestId('meeting-prep').getAttribute('data-state')).toBe('canceled');
    expect(screen.queryByTestId('prep-needs')).toBeNull();
  });
});

describe('Work follows the calendar (R51)', () => {
  const prepareCommitment: Commitment = { commitmentId: 'disposition:d1', accountName: ACCOUNT, kind: 'prepare_meeting', title: 'Prepare the meeting with Ann', basis: null, owner: 'casey', dueAt: '2026-10-06T13:00:00.000Z', person: { personaId: 1, name: 'Ann Scratch', email: 'ann@kroger.example.com' }, dealId: null, threadId: null, status: 'open', snoozeUntil: null, dependency: null, proof: null, reason: null, source: { kind: 'disposition', id: 'd1' }, detail: null, createdAt: '2026-10-05T12:00:00.000Z', createdBy: 'casey', updatedAt: '2026-10-05T12:00:00.000Z', updatedBy: 'casey' };
  const input = (over: Partial<Parameters<typeof workDay>[0]> = {}) => workDay({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [{ accountName: ACCOUNT, deals: [{ id: '70002', name: 'Kroger Columbus DC', stage: 'Qualified to buy' }] }] }, held: new Map(), ...over });

  it('a meeting within 24 hours is an obligation with its prepared starting point, opening the preparation on the deal brief', () => {
    const d = input({ meetings: [{ accountName: ACCOUNT, at: TOMORROW_10, what: 'Columbus yard walk with Ben', meetingId: 11, dealId: '70002' }], meetingPreps: new Map([[11, { prep: 'Objective: Columbus yard walk with Ben.', href: '/gap/accounts/kroger-scratch-co?view=brief#meeting-11' }]]) });
    const o = d.cards.find((c) => c.accountName === ACCOUNT)?.obligations?.find((x) => x.kind === 'meeting');
    expect(o).toMatchObject({ title: 'Meeting tomorrow 10:00 AM: Columbus yard walk with Ben', prep: 'Objective: Columbus yard walk with Ben.', href: '/gap/accounts/kroger-scratch-co?view=brief#meeting-11', label: 'Prepare the meeting', scope: 'Deal: Kroger Columbus DC' });
  });

  it('a moved meeting is read at its new time: moved past 24 hours it is no longer due today', () => {
    const d = input({ meetings: [{ accountName: ACCOUNT, at: '2026-10-09T14:00:00.000Z', what: 'Columbus yard walk with Ben', meetingId: 11 }] });
    expect(d.cards.find((c) => c.accountName === ACCOUNT)?.obligations?.some((x) => x.kind === 'meeting') ?? false).toBe(false);
  });

  it('a canceled meeting is said once in Waiting and its open preparation waits until it is rebooked; a rebooked one is due again', () => {
    const canceled = input({ commitments: [prepareCommitment], canceledMeetings: [{ accountName: ACCOUNT, at: TOMORROW_10, what: 'Pilot scope call', meetingId: 12 }] });
    expect(canceled.cards.find((c) => c.accountName === ACCOUNT)?.obligations?.some((x) => x.kind === 'prepare_meeting') ?? false).toBe(false);
    expect(canceled.waiting.map((w) => w.line)).toEqual([
      'The meeting on the calendar was canceled (Oct 7 10:00 AM): nothing to prepare until it is rebooked.',
      'Canceled: nothing to prepare unless it is rebooked.',
    ]);
    const rebooked = input({ commitments: [prepareCommitment], canceledMeetings: [{ accountName: ACCOUNT, at: TOMORROW_10, what: 'Pilot scope call', meetingId: 12 }], meetings: [{ accountName: ACCOUNT, at: '2026-10-07T18:00:00.000Z', what: 'Pilot scope call', meetingId: 13 }] });
    expect(rebooked.cards.find((c) => c.accountName === ACCOUNT)?.obligations?.map((x) => x.kind).sort()).toEqual(['meeting', 'prepare_meeting']);
    expect(rebooked.waiting).toEqual([]);
  });

  it('the day loader returns canceled rows marked, and the starting point reads the meeting\'s own deal and confirmed words', async () => {
    const db = ledgerDb({
      accounts: [ACCOUNT],
      meetings: [
        { id: 11, account_name: ACCOUNT, meeting_status: 'Scheduled', meeting_date: new Date('2026-10-07T00:00:00Z'), meeting_time: '10:00 AM', objective: 'Columbus yard walk with Ben', persona: 'Ben Scratch', hubspot_deal_id: '70002', created_at: new Date('2026-10-01T12:00:00Z'), updated_at: new Date('2026-10-01T12:00:00Z') },
        { id: 12, account_name: ACCOUNT, meeting_status: 'Canceled', meeting_date: new Date('2026-10-07T00:00:00Z'), meeting_time: '2:00 PM', objective: 'Pilot scope call', persona: 'Ann Scratch', hubspot_deal_id: '70001', created_at: new Date('2026-10-01T12:00:00Z'), updated_at: new Date('2026-10-05T12:00:00Z') },
      ],
      bids: [
        { id: 'b1', account_name: ACCOUNT, type: 'business_problem', raw_buyer_language: 'Trailers sit two hours at Columbus.', contact_email: 'ben@kroger.example.com', human_confirmed: true, supersedes_id: null, confirmed_at: new Date('2026-10-03T15:00:00Z'), captured_at: new Date('2026-10-03T15:00:00Z'), metadata: { scope: { dealId: '70002' } } },
        { id: 'b2', account_name: ACCOUNT, type: 'root_cause', raw_buyer_language: 'The pilot gate has one guard.', contact_email: 'ann@kroger.example.com', human_confirmed: true, supersedes_id: null, confirmed_at: new Date('2026-10-03T15:00:00Z'), captured_at: new Date('2026-10-03T15:00:00Z'), metadata: { scope: { dealId: '70001' } } },
      ],
    });
    const rows = await loadMeetingRows(db.client(), NOW);
    expect(rows.map((r) => [r.meetingId, r.canceled, r.at, r.dealId])).toEqual([
      [11, false, TOMORROW_10, '70002'],
      [12, true, '2026-10-07T18:00:00.000Z', '70001'],
    ]);
    const starts = await loadMeetingStartingPoints(db.client(), rows, [], NOW);
    expect([...starts.keys()]).toEqual([11]);
    // The Columbus meeting reads Columbus's problem, never the pilot deal's root cause.
    expect(starts.get(11)).toEqual({ prep: 'Objective: Columbus yard walk with Ben. First to learn: Learn how their yards run today: how trailers are checked in, found and moved. 1 confirmed need on record.', href: '/gap/accounts/kroger-scratch-co?view=brief#meeting-11' });
  });
});
