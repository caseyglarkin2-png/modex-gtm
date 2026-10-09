/**
 * X01 (GAP OS sales execution engine, 2026-10-08): ONE day builder. The Work page and the briefing cron call the
 * same `loadWorkDay`, so a briefing can never describe a second, inconsistent list (the mandate's section 5). Pinned:
 * the page builds no day of its own (no `loadCockpit`, no `workDay(` call in the page source); the loader reads the
 * preview clock (tomorrow 8 am New York) for everything time-dependent while the sweeps and the closure reconcile run
 * at the real time only, and never under a lane or a preview; the day it returns is what `workDay` built.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  workDay: vi.fn(),
  sweepClosedDeals: vi.fn(async () => null),
  loadWorkCommitments: vi.fn(async () => []),
  loadCompletedToday: vi.fn(async () => []),
  loadCockpit: vi.fn(),
  loadPursued: vi.fn(async () => [] as unknown[]),
}));

vi.mock('@/lib/gap/work/list', () => ({ workDay: h.workDay }));
vi.mock('@/lib/gap/deals/closure', () => ({ sweepClosedDeals: h.sweepClosedDeals, loadRecordedClosures: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/day-load', () => ({
  loadCompletedToday: h.loadCompletedToday,
  loadMeetingRows: vi.fn(async () => []),
  loadMeetingStartingPoints: vi.fn(async () => new Map()),
  loadWorkCommitments: h.loadWorkCommitments,
  resolveMeetingDeals: vi.fn(async (_p: unknown, rows: unknown[]) => rows),
}));
vi.mock('@/lib/gap/work/cockpit-read', () => ({ loadCockpit: h.loadCockpit }));
vi.mock('@/lib/gap/work/cache', () => ({ cachedRead: vi.fn(async (_k: string, read: () => Promise<unknown>) => ({ value: await read(), at: '2026-10-08T12:00:00.000Z', fromCache: false })), agoText: () => 'just now' }));
vi.mock('@/lib/gap/pursuit/summary', () => ({ loadPursuitSummaries: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/outcome', () => ({ loadWorkOutcomes: vi.fn(async () => new Map()), loadPreparedMeetings: vi.fn(async () => new Set()) }));
vi.mock('@/lib/gap/work/recorded-replies', () => ({
  loadRecordedReplyIds: vi.fn(async () => new Set()),
  loadAnswersOwed: vi.fn(async () => []),
  withoutRecordedReplies: vi.fn((replies: unknown[], summaries: unknown) => ({ replies, summaries })),
}));
vi.mock('@/lib/gap/work/priority', () => ({ loadAccountPriorities: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/intel', () => ({ loadPursued: h.loadPursued }));
vi.mock('@/lib/gap/execution/follow-up-load', () => ({ loadFollowUpPlans: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/opportunity/active-opportunity', () => ({ resolveAccountOpportunity: vi.fn() }));

import { loadWorkDay } from '@/lib/gap/work/load-day';
import { nyDay, nyDayAt, addDays } from '@/lib/gap/work/dates';

const cockpit = () => ({
  counts: { review: 0, research: 0, ready: 0, followUp: 0, replies: { count: 0, atLeast: false }, deals: { count: 0, unresolved: 0, checkedAt: '2026-10-08T12:00:00.000Z' } },
  inDeals: { status: 'complete', count: 0, accounts: [], unresolved: [], checkedAt: '2026-10-08T12:00:00.000Z', openDeals: 0 },
  workInput: { candidates: [], dbState: new Map(), inMotion: new Map(), replies: [], mailbox: null, motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), opportunityHolds: new Map(), conversations: new Map() },
  workAccounts: [],
  groups: [],
  readyOneOffIds: [],
  researchGroups: [],
  reviewWaiting: { hypothesisIds: [], personaIds: [] },
  motion: { motions: [], heldCardIds: [], thesisHeldCardIds: [] },
  inbox: [],
  queueAsOf: null,
  unrouted: 0,
  routing: { canRun: false, routableHypotheses: 0, routableAccounts: 0 },
});

const DAY = { cards: [{ accountName: 'PepsiCo' }], waiting: [], snoozed: [], counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } };

describe('X01: the page builds no day of its own', () => {
  const page = readFileSync(join(process.cwd(), 'src/app/gap/page.tsx'), 'utf8');
  it('imports loadWorkDay from the shared loader', () => {
    expect(page).toMatch(/import \{[^}]*\bloadWorkDay\b[^}]*\} from '@\/lib\/gap\/work\/load-day'/);
  });
  it('defines no loadCockpit and calls no workDay itself', () => {
    expect(page).not.toMatch(/function loadCockpit\b/);
    expect(page).not.toMatch(/\bworkDay\(/);
    expect(page).not.toMatch(/\bsweepClosedDeals\(/);
  });
});

describe('X01: loadWorkDay, the one day builder', () => {
  beforeEach(() => {
    h.workDay.mockReset();
    h.workDay.mockReturnValue(DAY);
    h.sweepClosedDeals.mockClear();
    h.loadWorkCommitments.mockClear();
    h.loadCompletedToday.mockClear();
    h.loadCockpit.mockReset();
    h.loadCockpit.mockResolvedValue(cockpit());
  });

  it('builds today at the real time: the closure sweep and the commitments sweep run, the day is what workDay built', async () => {
    const realNow = new Date('2026-10-08T14:00:00Z');
    const out = await loadWorkDay({}, { lane: false, preview: false, fresh: false, now: realNow });
    expect(out.day).toBe(DAY);
    expect(out.cards).toEqual(DAY.cards);
    expect(out.now.toISOString()).toBe(realNow.toISOString());
    expect(h.sweepClosedDeals).toHaveBeenCalledTimes(1);
    expect(h.loadWorkCommitments).toHaveBeenCalledWith({}, realNow, expect.objectContaining({ replies: [] }));
    expect(h.workDay.mock.calls[0][0].now.toISOString()).toBe(realNow.toISOString());
    expect(h.loadCompletedToday).toHaveBeenCalledWith({}, realNow);
    expect(out.today.done).toEqual([]);
  });

  it('seller acceptance follow-up: the prepared angles ride into workDay as evidence by account (ready, placed; the newest decision wins; a lane reads none)', async () => {
    const kenco = { key: 'person:dave.kiesling@kencogroup.com', taskId: 't1', kind: 'person', writer: { email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling' }, title: 'Dave Kiesling wrote to us', accountName: 'Kenco', accountHint: null, decision: 'pursue', decidedAt: '2026-10-09T00:32:00Z', status: 'ready', error: null, angle: { whyItMatters: 'Kenco runs a network of yards where the gate is the bottleneck.', starters: ['Ask about the Chattanooga gate.'], roles: [], accounts: ['Kenco'], peopleNamed: [] } };
    const unplaced = { ...kenco, key: 'person:someone@gmail.com', taskId: 't2', accountName: null, writer: { email: 'someone@gmail.com', name: null } };
    const older = { ...kenco, taskId: 't0', decidedAt: '2026-10-08T00:00:00Z', angle: { ...kenco.angle, whyItMatters: 'an older angle' } };
    const running = { ...kenco, taskId: 't3', accountName: 'Kroger', status: 'in_progress', angle: null };
    h.loadPursued.mockResolvedValue([kenco, older, unplaced, running]);
    const realNow = new Date('2026-10-09T14:00:00Z');
    await loadWorkDay({}, { lane: false, preview: false, fresh: false, now: realNow });
    const input = h.workDay.mock.calls.at(-1)?.[0] as { preparedAngles: Map<string, { who: string; line: string }> };
    expect([...input.preparedAngles.keys()], 'only the ready, placed angle counts; the newest wins').toEqual(['Kenco']);
    expect(input.preparedAngles.get('Kenco')).toEqual({ who: 'Dave Kiesling', line: 'GAP prepared an angle for Dave Kiesling: Kenco runs a network of yards where the gate is the bottleneck.' });
    h.loadPursued.mockClear();
    await loadWorkDay({}, { lane: true, preview: false, fresh: false, now: realNow });
    expect(h.loadPursued, 'a lane reads no pursued items').not.toHaveBeenCalled();
    expect((h.workDay.mock.calls.at(-1)?.[0] as { preparedAngles: Map<string, unknown> }).preparedAngles.size).toBe(0);
  });

  it('a preview reads tomorrow 8 am New York for the day and never sweeps; done today is empty', async () => {
    const realNow = new Date('2026-10-08T14:00:00Z');
    const out = await loadWorkDay({}, { lane: false, preview: true, fresh: false, now: realNow });
    const expected = nyDayAt(addDays(nyDay(realNow), 1), 8);
    expect(out.now.toISOString()).toBe(expected.toISOString());
    expect(out.realNow.toISOString()).toBe(realNow.toISOString());
    expect(h.workDay.mock.calls[0][0].now.toISOString()).toBe(expected.toISOString());
    expect(h.sweepClosedDeals).not.toHaveBeenCalled();
    expect(h.loadCompletedToday).not.toHaveBeenCalled();
    // The sweep writes at the real time only: the commitments read is at the real time, the phases at the preview time.
    expect(h.loadWorkCommitments).toHaveBeenCalledWith({}, realNow, expect.anything());
  });

  it('under an analyst lane: no sweep, no commitments, no done read (the lanes are the analyst view, not the day)', async () => {
    const out = await loadWorkDay({}, { lane: true, preview: false, fresh: true, now: new Date('2026-10-08T14:00:00Z') });
    expect(h.sweepClosedDeals).not.toHaveBeenCalled();
    expect(h.loadWorkCommitments).not.toHaveBeenCalled();
    expect(h.loadCompletedToday).not.toHaveBeenCalled();
    expect(out.data.counts.ready).toBe(0);
    expect(out.read.fromCache).toBe(false);
  });
});
