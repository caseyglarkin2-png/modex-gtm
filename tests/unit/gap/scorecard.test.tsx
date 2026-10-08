/**
 * X13 (GAP OS sales execution engine, 2026-10-08): the daily scorecard. Casey asked GAP to "help me record a certain
 * number of activity everyday". The counts come from the ledger (what GAP proved or the seller recorded today, the same
 * read the Today panel makes), never from navigation; each done item carries the ACTIVITY it counts as (first touch,
 * follow-up, reply handled, call, deal step, meeting booked); the scorecard sets today's count beside the target from
 * the seller settings and says plainly when no target is set. Self-reported items (a seller's Done by word) count,
 * labelled as such; a set-aside never counts. Pinned: the tagging per ledger kind; the pure scorecard rows; the Today
 * panel renders the scorecard with counts, targets and the gap.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loadCompletedToday } from '@/lib/gap/work/day-load';
import { scorecard, TARGET_LABELS, type ScorecardRow } from '@/lib/gap/work/scorecard';
import { WorkToday } from '@/components/gap/work-today';
import { DIRECT_SENT, DRAFT_SENT, MANUAL_SENT, REPLY_SENT } from '@/lib/gap/execution/draft-ledger';
import { COMMITMENT_EVENT } from '@/lib/gap/work/commitment-model';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-08T20:00:00Z');
const at = (s: string) => new Date(s);

describe('X13: loadCompletedToday tags each done item with the activity it counts as', () => {
  it('first touches, follow-ups, replies handled, calls, deal steps and meetings booked; a note and a set-aside count as nothing', async () => {
    const d = ledgerDb({
      accounts: ['Fedex Scratch Co', 'Kroger Scratch Co'],
      audit: [
        { id: 'a1', kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec1', created_at: at('2026-10-08T14:00:00Z'), payload: { accountName: 'Fedex Scratch Co', recipient: 'glen@fedex.example.com', stepIndex: 0 } },
        { id: 'a2', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec2', created_at: at('2026-10-08T14:05:00Z'), payload: { accountName: 'Kroger Scratch Co', recipient: 'ann@kroger.example.com', stepIndex: 1 } },
        { id: 'a3', kind: DRAFT_SENT, subject_type: 'routing_decision', subject_id: 'dec3', created_at: at('2026-10-08T14:06:00Z'), payload: { stepIndex: 0 } },
        { id: 'a4', kind: REPLY_SENT, subject_type: 'inbound_message', subject_id: 'msg1', created_at: at('2026-10-08T14:10:00Z'), payload: { accountName: 'Kroger Scratch Co', recipient: 'ann@kroger.example.com' } },
        { id: 'a5', kind: 'disposition.recorded', subject_type: 'conversation_disposition', subject_id: 'd1', created_at: at('2026-10-08T14:20:00Z'), payload: { accountName: 'Kroger Scratch Co', contactEmail: 'ben@kroger.example.com', channel: 'call', responseClass: 'problem_confirmed', humanConfirmed: true } },
        { id: 'a6', kind: 'disposition.recorded', subject_type: 'conversation_disposition', subject_id: 'd2', created_at: at('2026-10-08T14:25:00Z'), payload: { accountName: 'Kroger Scratch Co', contactEmail: 'ann@kroger.example.com', channel: 'email', responseClass: 'meeting_accepted', humanConfirmed: true } },
        { id: 'a7', kind: 'disposition.recorded', subject_type: 'conversation_disposition', subject_id: 'd3', created_at: at('2026-10-08T14:26:00Z'), payload: { accountName: 'Fedex Scratch Co', contactEmail: 'glen@fedex.example.com', channel: 'email', responseClass: 'request_information', humanConfirmed: true } },
        { id: 'a8', kind: COMMITMENT_EVENT, subject_type: 'account', subject_id: 'Kroger Scratch Co', created_at: at('2026-10-08T14:30:00Z'), payload: { commitmentId: 'c1', op: 'status', commitment: { commitmentId: 'c1', accountName: 'Kroger Scratch Co', kind: 'deal_step', title: 'Confirm the pilot site', status: 'done', proof: { kind: 'seller', note: 'confirmed on the call' } } } },
        { id: 'a9', kind: COMMITMENT_EVENT, subject_type: 'account', subject_id: 'Kroger Scratch Co', created_at: at('2026-10-08T14:31:00Z'), payload: { commitmentId: 'c2', op: 'status', commitment: { commitmentId: 'c2', accountName: 'Kroger Scratch Co', kind: 'deliverable', title: 'Send the template', status: 'done', proof: { kind: 'seller', note: 'sent' } } } },
        { id: 'a10', kind: 'capture.note', subject_type: 'account', subject_id: 'Fedex Scratch Co', created_at: at('2026-10-08T14:40:00Z'), payload: { accountName: 'Fedex Scratch Co', context: 'call' } },
        { id: 'a11', kind: 'account.work_outcome', subject_type: 'account', subject_id: 'Fedex Scratch Co', created_at: at('2026-10-08T14:50:00Z'), payload: { kind: 'skipped' } },
      ],
    }, NOW);
    const done = await loadCompletedToday(d.client(), NOW);
    const tags = done.map((x) => [x.line.slice(0, 22), x.activity ?? null, x.kind ?? 'done']);
    expect(tags).toEqual([
      ['Sent touch 1 to glen@f', 'first_touches', 'done'],
      ['Sent touch 2 to ann@kr', 'follow_ups', 'done'],
      ['A GAP draft was sent f', 'first_touches', 'done'],
      ['Answered ann@kroger.ex', 'replies_handled', 'done'],
      ["Recorded ben@kroger.ex", 'calls', 'done'],
      ["Recorded ann@kroger.ex", 'meetings_booked', 'done'],
      ["Recorded glen@fedex.ex", 'replies_handled', 'done'],
      ['Done: Confirm the pilo', 'deal_steps', 'done'],
      ['Done: Send the templat', null, 'done'],
      ['Saved a note (call).', null, 'done'],
      ['Set aside for today.', null, 'set_aside'],
    ]);
  });
});

describe('X13: scorecard (pure)', () => {
  const done = [
    { at: '2026-10-08T14:00:00Z', accountName: 'A', line: 'x', activity: 'first_touches' as const },
    { at: '2026-10-08T14:01:00Z', accountName: 'A', line: 'x', activity: 'first_touches' as const },
    { at: '2026-10-08T14:02:00Z', accountName: 'B', line: 'x', activity: 'calls' as const },
    { at: '2026-10-08T14:03:00Z', accountName: 'B', line: 'x', kind: 'set_aside' as const, activity: 'calls' as const },
    { at: '2026-10-08T14:04:00Z', accountName: 'B', line: 'x' },
  ];
  it('counts done items per activity, never a set-aside, and sets the target beside each with the gap', () => {
    const rows = scorecard(done, { first_touches: 5, calls: 3 });
    expect(rows.map((r) => [r.kind, r.count, r.target, r.remaining])).toEqual([
      ['first_touches', 2, 5, 3],
      ['follow_ups', 0, null, null],
      ['calls', 1, 3, 2],
      ['replies_handled', 0, null, null],
      ['deal_steps', 0, null, null],
      ['meetings_booked', 0, null, null],
    ]);
    expect(rows[0].label).toBe(TARGET_LABELS.first_touches);
    expect(scorecard([], {}).every((r: ScorecardRow) => r.count === 0 && r.target === null)).toBe(true);
  });
});

describe('X13: the Today panel renders the scorecard', () => {
  const base = { day: '2026-10-08', done: [] as never[], setAside: [], owed: [], waiting: [], tomorrow: [] };
  it('shows each activity with its count against the target, the gap in words, and a Settings link when no target is set', () => {
    render(<WorkToday today={{ ...base, done: [{ at: '2026-10-08T14:00:00Z', accountName: 'A', line: 'Sent touch 1 to Glen.', activity: 'first_touches' }, { at: '2026-10-08T14:02:00Z', accountName: 'B', line: 'Recorded a call.', activity: 'calls' }] }} targets={{ first_touches: 5, calls: 3 }} />);
    const card = screen.getByTestId('scorecard');
    expect(card.textContent).toContain('First touches 1 of 5');
    expect(card.textContent).toContain('Calls 1 of 3');
    expect(card.textContent).toContain('4 first touches and 2 calls to go');
    expect(screen.getByTestId('scorecard-follow_ups').textContent).toContain('Follow-ups 0');
  });
  it('with no targets at all it says so once and links to Settings; counts still show', () => {
    render(<WorkToday today={{ ...base, done: [{ at: '2026-10-08T14:00:00Z', accountName: 'A', line: 'x', activity: 'follow_ups' }] }} targets={{}} />);
    const card = screen.getByTestId('scorecard');
    expect(card.textContent).toContain('Follow-ups 1');
    expect(card.textContent).toMatch(/No daily targets set/);
    expect(screen.getByRole('link', { name: /Set targets/ })).toHaveAttribute('href', '/gap/settings');
  });
});
