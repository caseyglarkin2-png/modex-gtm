/**
 * R63-A S11: there was no way to finish the day: Kroger's meeting card had no way to record the preparation, Work never
 * said done, and the tomorrow preview's header still said "need you today". A meeting card now has "Prepared" (recorded
 * with the outcomes; the meeting then leaves what needs you and is listed under Done today), Work says "Done for today"
 * when nothing needs you, and the preview speaks of tomorrow.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));
vi.mock('@/components/gap/refresh-now', () => ({ refreshNow: vi.fn(), RefreshNudge: () => null }));
import { WorkList } from '@/components/gap/work-list';
import { meetingKeyOf, workDay, type WorkInput } from '@/lib/gap/work/list';
import { loadPreparedMeetings, recordWorkOutcome } from '@/lib/gap/work/outcome';
import { loadCompletedToday } from '@/lib/gap/work/day-load';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-07T22:00:00Z');
const KROGER = 'Kroger Scratch Co r63';
const MEETING = { accountName: KROGER, at: '2026-10-08T14:00:00.000Z', what: 'Columbus yard walk with Ben', meetingId: 11, dealId: null };
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, meetings: [MEETING], ...over });

describe('R63-A S11: the day can finish', () => {
  it('a meeting marked prepared leaves what needs you and is listed under Done today; Work then reaches done', async () => {
    const before = workDay(base());
    expect(before.counts.needsYou).toBe(1);
    const db = ledgerDb({ accounts: [KROGER] }, NOW);
    const r = await recordWorkOutcome(db.client(), { accountName: KROGER, kind: 'prepared', meeting: { key: meetingKeyOf(MEETING), at: MEETING.at, what: MEETING.what }, actor: 'casey@freightroll.com', now: NOW });
    expect(r.ok).toBe(true);
    const prepared = await loadPreparedMeetings(db.client(), [KROGER], NOW);
    expect([...prepared]).toEqual(['meeting:11']);
    const after = workDay(base({ preparedMeetings: prepared }));
    expect(after.counts.needsYou).toBe(0);
    const done = await loadCompletedToday(db.client(), new Date(NOW.getTime() + 60_000));
    expect(done.map((d) => [d.kind, d.line])).toEqual([['done', 'Prepared: Columbus yard walk with Ben.']]);
    render(<WorkList cards={after.cards} counts={after.counts} />);
    expect(screen.getByTestId('work-needs-you')).toHaveTextContent('Done for today: nothing needs you.');
  });

  it('the meeting card offers Prepared, which records it', async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const day = workDay(base());
    render(<WorkList cards={day.cards} counts={day.counts} />);
    fireEvent.click(screen.getByTestId('meeting-prepared'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ accountName: KROGER, kind: 'prepared', meeting: { key: 'meeting:11', at: MEETING.at, what: MEETING.what } });
    vi.unstubAllGlobals();
  });

  it('a prepared meeting never masks the account\'s own outcome; the preview speaks of tomorrow', async () => {
    const db = ledgerDb({ accounts: [KROGER] }, NOW);
    await recordWorkOutcome(db.client(), { accountName: KROGER, kind: 'skipped', actor: 'casey@freightroll.com', now: NOW });
    await recordWorkOutcome(db.client(), { accountName: KROGER, kind: 'prepared', meeting: { key: 'meeting:11', at: MEETING.at, what: MEETING.what }, actor: 'casey@freightroll.com', now: NOW });
    const { loadWorkOutcomes } = await import('@/lib/gap/work/outcome');
    expect((await loadWorkOutcomes(db.client(), [KROGER], NOW)).get(KROGER)?.kind).toBe('skipped');
    const day = workDay(base());
    render(<WorkList when="tomorrow" cards={day.cards} counts={day.counts} />);
    expect(screen.getByTestId('work-needs-you')).toHaveTextContent('1 account will need you tomorrow, in order');
    expect(screen.queryByTestId('meeting-prepared')).toBeNull();
  });
});
