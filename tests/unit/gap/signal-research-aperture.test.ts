/**
 * GAP Signal Intelligence D: research aperture. Proactive backlog over the
 * watched priority universe (never researched first, then the oldest; open-deal
 * accounts left out; recently researched skipped), and the cooldown bypass is
 * Casey's alone (a discovered story respects the account cooldown).
 */
import { describe, expect, it, vi } from 'vitest';
import { runBackgroundResearch, selectBackgroundTargets, BACKLOG_STALE_MS } from '@/lib/gap/research/background';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const queueItem = (account: string, ruleId: string) => ({ id: `d-${account}`, ruleId, account: { name: account }, action: 'nurture', lane: 'work_queue', createdAt: NOW, persona: { id: 1 }, hypothesis: null });

function db(o: { runs?: Array<{ account_name: string; created_at: Date | null }>; signals?: unknown[]; lastRun?: Date | null } = {}) {
  return {
    pounceTrigger: { findMany: vi.fn(async () => []) },
    prospectingHypothesis: { findMany: vi.fn(async () => []) },
    account: { findMany: vi.fn(async ({ where }: { where: { name: { in: string[] } } }) => where.name.in.map((name) => ({ name, tier: name === 'Tier1 Co' ? 'Tier 1' : 'Tier 2' }))), findFirst: vi.fn() },
    gapSignal: { findMany: vi.fn(async () => o.signals ?? []), updateMany: vi.fn(async () => ({})), update: vi.fn(async () => ({})), findUnique: vi.fn(async () => ({ metadata: {} })) },
    researchRun: {
      groupBy: vi.fn(async () => (o.runs ?? []).map((r) => ({ account_name: r.account_name, _max: { created_at: r.created_at } }))),
      findFirst: vi.fn(async () => (o.lastRun ? { created_at: o.lastRun } : null)),
    },
    gapAuditEvent: { create: vi.fn(async () => ({})) },
  };
}

describe('proactive backlog', () => {
  const watch = async () => [{ accountName: 'Never Co' }, { accountName: 'Old Co' }, { accountName: 'Fresh Co' }, { accountName: 'Deal Co' }, { accountName: 'Tier1 Co' }];
  const deps = { loadGroups: async () => [], listQueue: async () => ({ asOf: null, items: [queueItem('Deal Co', 'active_opportunity')], truncated: false }), watch };

  it('watched accounts not researched in 7 days, never first then oldest (tier first); recent ones and open-deal accounts left out', async () => {
    const t = await selectBackgroundTargets(
      db({ runs: [{ account_name: 'Old Co', created_at: new Date(NOW.getTime() - 20 * 86_400_000) }, { account_name: 'Fresh Co', created_at: new Date(NOW.getTime() - 2 * 86_400_000) }, { account_name: 'Tier1 Co', created_at: new Date(NOW.getTime() - BACKLOG_STALE_MS - 1) }] }),
      NOW,
      deps as never,
    );
    expect(t.map((x) => [x.accountName, x.reason])).toEqual([
      ['Tier1 Co', 'priority_backlog'],
      ['Never Co', 'priority_backlog'],
      ['Old Co', 'priority_backlog'],
    ]);
  });

  it('the backlog ranks after every other kind of research work', async () => {
    const t = await selectBackgroundTargets(db({ signals: [{ id: 's1', account_name: 'Shared Co', origin: 'casey_share', title: 'x', created_at: NOW, published_at: null }] }), NOW, { ...deps, watch: async () => [{ accountName: 'Never Co' }] } as never);
    expect(t.map((x) => x.reason)).toEqual(['shared_signal', 'priority_backlog']);
  });
});

describe('the cooldown bypass is Casey\'s alone', () => {
  const deps = { loadGroups: async () => [], listQueue: async () => ({ asOf: null, items: [], truncated: false }), watch: async () => [] };
  const research = vi.fn(async () => ({ runId: 'r', outcome: 'insufficient_evidence' as const, facts: [], rejected: [], conflicts: [], notes: [] }));

  it('a discovered story (published before the last research) waits out the cooldown', async () => {
    research.mockClear();
    const p = db({ lastRun: new Date(NOW.getTime() - 3_600_000), signals: [{ id: 's1', account_name: 'Acme', origin: 'discovery', title: 'Acme opens DC', created_at: new Date(NOW.getTime() - 5 * 3_600_000), published_at: new Date(NOW.getTime() - 5 * 3_600_000) }] });
    const r = await runBackgroundResearch(p, { now: NOW }, { ...deps, research: research as never } as never);
    expect(research).not.toHaveBeenCalled();
    expect(r.skipped[0].reason).toMatch(/^researched_recently/);
  });

  it('a story Casey shared is followed up right away', async () => {
    research.mockClear();
    const p = db({ lastRun: new Date(NOW.getTime() - 3_600_000), signals: [{ id: 's1', account_name: 'Acme', origin: 'casey_share', title: 'Acme opens DC', created_at: new Date(NOW.getTime() - 5 * 3_600_000), published_at: new Date(NOW.getTime() - 5 * 3_600_000) }] });
    // Published and captured BEFORE the last research: only Casey's "follow this up" bypasses the cooldown.
    p.gapSignal.findMany = vi.fn().mockResolvedValueOnce([{ id: 's1', account_name: 'Acme', origin: 'casey_share', title: 'Acme opens DC', created_at: new Date(NOW.getTime() - 5 * 3_600_000), published_at: new Date(NOW.getTime() - 5 * 3_600_000) }]).mockResolvedValueOnce([{ id: 's1', url: 'https://x.com/a', title: 'Acme opens DC', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1', metadata: {} }]);
    await runBackgroundResearch(p, { now: NOW }, { ...deps, research: research as never } as never);
    expect(research).toHaveBeenCalledTimes(1);
  });
});
