// @vitest-environment node
/**
 * Knowledge program C2 (2026-10-09): the day loader folds the vault's notes into the account summaries the ranking
 * reads (`WorkInput.knowledge`), through an INJECTED reader of Builder A's shape (`deps.knowledge`, the lead wires the
 * real `knowledgeForAccount`). Pinned: the fold (a conversation is a meeting note or a raw Fireflies capture not after
 * `now`; the next action, its due day and the last touch come from the newest account note's frontmatter); the wiring
 * (the reader is called once per day account with the limit, its summaries ride into workDay; no reader, a lane or a
 * reader that throws is no knowledge, never a failed day).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  workDay: vi.fn(),
  loadCockpit: vi.fn(),
  loadWorkCommitments: vi.fn(async () => [] as unknown[]),
}));

vi.mock('@/lib/gap/work/list', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/work/list')>()), workDay: h.workDay }));
vi.mock('@/lib/gap/deals/closure', () => ({ sweepClosedDeals: vi.fn(async () => null), loadRecordedClosures: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/day-load', () => ({
  loadCompletedToday: vi.fn(async () => []),
  loadMeetingRows: vi.fn(async () => []),
  loadMeetingStartingPoints: vi.fn(async () => new Map()),
  loadWorkCommitments: h.loadWorkCommitments,
  resolveMeetingDeals: vi.fn(async (_p: unknown, rows: unknown[]) => rows),
}));
vi.mock('@/lib/gap/work/cockpit-read', () => ({ loadCockpit: h.loadCockpit }));
vi.mock('@/lib/gap/work/cache', () => ({ cachedRead: vi.fn(async (_k: string, read: () => Promise<unknown>) => ({ value: await read(), at: '2026-10-09T12:00:00.000Z', fromCache: false })), agoText: () => 'just now' }));
vi.mock('@/lib/gap/pursuit/summary', () => ({ loadPursuitSummaries: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/outcome', () => ({ loadWorkOutcomes: vi.fn(async () => new Map()), loadPreparedMeetings: vi.fn(async () => new Set()) }));
vi.mock('@/lib/gap/work/recorded-replies', () => ({
  loadRecordedReplyIds: vi.fn(async () => new Set()),
  loadAnswersOwed: vi.fn(async () => []),
  withoutRecordedReplies: vi.fn((replies: unknown[], summaries: unknown) => ({ replies, summaries })),
}));
vi.mock('@/lib/gap/work/priority', () => ({ loadAccountPriorities: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/work/intel', () => ({ loadPursued: vi.fn(async () => []) }));
vi.mock('@/lib/gap/execution/follow-up-load', () => ({ loadFollowUpPlans: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/opportunity/active-opportunity', () => ({ resolveAccountOpportunity: vi.fn() }));

import { accountKnowledgeOf, KNOWLEDGE_NOTES_LIMIT, knowledgeByAccount, loadWorkDay, type KnowledgeNoteLike } from '@/lib/gap/work/load-day';

const NOW = new Date('2026-10-09T15:00:00Z');
const cockpit = (workAccounts: string[]) => ({
  counts: { review: 0, research: 0, ready: 0, followUp: 0, replies: { count: 0, atLeast: false }, deals: { count: 0, unresolved: 0, checkedAt: '2026-10-09T12:00:00.000Z' } },
  inDeals: { status: 'complete', count: 0, accounts: [], unresolved: [], checkedAt: '2026-10-09T12:00:00.000Z', openDeals: 0 },
  workInput: { candidates: [], dbState: new Map(), inMotion: new Map(), replies: [], mailbox: null, motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), opportunityHolds: new Map(), conversations: new Map() },
  workAccounts,
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
const DAY = { cards: [], waiting: [], snoozed: [], counts: { needsYou: 0, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } };

const note = (over: Partial<KnowledgeNoteLike> & { kind: KnowledgeNoteLike['kind'] }): KnowledgeNoteLike => ({ path: `30_Accounts/${over.kind}.md`, account_name: 'Kenco', note_date: '2026-10-01T00:00:00Z', title: null, frontmatter: null, source: null, people: [], ...over });
const KENCO_NOTES: KnowledgeNoteLike[] = [
  note({ kind: 'account', path: '30_Accounts/Kenco.md', note_date: '2026-10-09T12:00:00Z', frontmatter: { next_action: 'Regroup with Craig the week of Oct 12', next_action_due: '2026-10-15', heat: 'warm', last_touched: '2026-10-09' } }),
  note({ kind: 'meeting', path: '40_Meetings/2026-10-14 Kenco regroup.md', note_date: '2026-10-14T18:00:00Z', source: 'calendar-prep', title: 'Kenco regroup (prep)' }),
  note({ kind: 'meeting', path: '40_Meetings/2026-09-16 Kenco discovery.md', note_date: '2026-09-16T18:00:00Z', source: 'fireflies', people: ['dave.kiesling@kencogroup.com'] }),
  note({ kind: 'raw', path: '90_Raw/fireflies/2026-08-20 Kenco intro.md', note_date: '2026-08-20T17:00:00Z', source: 'fireflies' }),
  note({ kind: 'raw', path: '90_Raw/other/2026-09-30 clipping.md', note_date: '2026-09-30T17:00:00Z', source: 'librarian' }),
  note({ kind: 'person', path: '20_People/Dave Kiesling.md', note_date: '2026-09-17T00:00:00Z' }),
];

describe('C2: accountKnowledgeOf, the fold', () => {
  it('conversations are the meeting notes and the raw Fireflies captures not after now; the account note gives the next action, its due day and the last touch', () => {
    expect(accountKnowledgeOf(KENCO_NOTES, NOW)).toEqual({ lastConversationAt: '2026-09-16T18:00:00.000Z', conversations: 2, nextAction: 'Regroup with Craig the week of Oct 12', nextActionDue: '2026-10-15', lastTouched: '2026-10-09T00:00:00.000Z' });
    expect(accountKnowledgeOf([], NOW), 'no notes is null').toBeNull();
    // Only meetings, no account note: the next action is none; a Date in the frontmatter reads as a New York day.
    expect(accountKnowledgeOf(KENCO_NOTES.slice(1, 3), NOW)).toEqual({ lastConversationAt: '2026-09-16T18:00:00.000Z', conversations: 1, nextAction: null, nextActionDue: null, lastTouched: null });
    const dated = accountKnowledgeOf([note({ kind: 'account', frontmatter: { next_action: 'Call Craig', next_action_due: new Date('2026-10-15T23:30:00Z'), last_touched: new Date('2026-10-09T12:00:00Z') } })], NOW);
    expect(dated).toEqual({ lastConversationAt: null, conversations: 0, nextAction: 'Call Craig', nextActionDue: '2026-10-15', lastTouched: '2026-10-09T12:00:00.000Z' });
    // The newest account note wins; an unreadable due day is none.
    const two = accountKnowledgeOf([note({ kind: 'account', note_date: '2026-09-01T00:00:00Z', frontmatter: { next_action: 'old', next_action_due: 'soon' } }), note({ kind: 'account', note_date: '2026-10-01T00:00:00Z', frontmatter: { next_action: 'new', next_action_due: 'someday' } })], NOW);
    expect(two).toMatchObject({ nextAction: 'new', nextActionDue: null });
  });

  it('knowledgeByAccount reads each account once with the limit and keeps the accounts that fold; a reader that throws for one account loses only that one', async () => {
    const reader = vi.fn(async (_p: unknown, name: string) => {
      if (name === 'Broken Co') throw new Error('table missing');
      return name === 'Kenco' ? KENCO_NOTES : [];
    });
    const out = await knowledgeByAccount({}, ['Kenco', 'Empty Co', 'Broken Co', 'Kenco'], reader, NOW);
    expect([...out.keys()]).toEqual(['Kenco']);
    expect(reader).toHaveBeenCalledTimes(3);
    expect(reader).toHaveBeenCalledWith({}, 'Kenco', { limit: KNOWLEDGE_NOTES_LIMIT });
  });
});

describe('C2: loadWorkDay wires the injected reader into workDay', () => {
  beforeEach(() => {
    h.workDay.mockReset();
    h.workDay.mockReturnValue(DAY);
    h.loadCockpit.mockReset();
    h.loadCockpit.mockResolvedValue(cockpit(['Kenco', 'PepsiCo']));
    h.loadWorkCommitments.mockReset();
    h.loadWorkCommitments.mockResolvedValue([{ accountName: 'Kroger', commitmentId: 'c1', status: 'open' }] as unknown[]);
  });

  it('the summaries ride into workDay by account; the reader is called for the day accounts and the obligation accounts', async () => {
    const reader = vi.fn(async (_p: unknown, name: string) => (name === 'Kenco' ? KENCO_NOTES : []));
    await loadWorkDay({}, { lane: false, preview: false, fresh: false, now: NOW }, { knowledge: reader });
    const input = h.workDay.mock.calls.at(-1)?.[0] as { knowledge: Map<string, unknown> };
    expect([...input.knowledge.keys()]).toEqual(['Kenco']);
    expect(input.knowledge.get('Kenco')).toMatchObject({ lastConversationAt: '2026-09-16T18:00:00.000Z', conversations: 2, nextAction: 'Regroup with Craig the week of Oct 12', nextActionDue: '2026-10-15' });
    expect(reader.mock.calls.map((c) => c[1]).sort()).toEqual(['Kenco', 'Kroger', 'PepsiCo']);
  });

  it('no reader, a lane, or a reader that throws: the day is built with no knowledge and never fails', async () => {
    await loadWorkDay({}, { lane: false, preview: false, fresh: false, now: NOW });
    expect((h.workDay.mock.calls.at(-1)?.[0] as { knowledge: Map<string, unknown> }).knowledge.size, 'no reader').toBe(0);
    const reader = vi.fn(async () => KENCO_NOTES);
    await loadWorkDay({}, { lane: true, preview: false, fresh: false, now: NOW }, { knowledge: reader });
    expect(reader, 'a lane reads no knowledge').not.toHaveBeenCalled();
    expect((h.workDay.mock.calls.at(-1)?.[0] as { knowledge: Map<string, unknown> }).knowledge.size).toBe(0);
    const broken = vi.fn(async () => {
      throw new Error('knowledge table not migrated');
    });
    const out = await loadWorkDay({}, { lane: false, preview: false, fresh: false, now: NOW }, { knowledge: broken });
    expect(out.day).toBe(DAY);
    expect((h.workDay.mock.calls.at(-1)?.[0] as { knowledge: Map<string, unknown> }).knowledge.size).toBe(0);
  });
});
