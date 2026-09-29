/**
 * Work sources feed the ONE research worker (background.ts), account by
 * account: an account the cohort planner marked `research` becomes a target
 * once however many people there are; RESEARCH MORE ranks with a story Casey
 * shared and bypasses the cooldown, then is served; a WATCH source never
 * spends research.
 */
import { describe, expect, it, vi } from 'vitest';
import { runBackgroundResearch, selectBackgroundTargets } from '@/lib/gap/research/background';

const NOW = new Date('2026-09-28T15:00:00Z');

function db(members: Array<{ account_name: string; status: string; kind: string; intent?: string }>, extra: Record<string, unknown> = {}) {
  const prisma: any = {
    pounceTrigger: { findMany: vi.fn(async () => [{ account_name: 'Trigger Co', title: 'Trigger Co opens a DC', first_seen_at: new Date('2026-09-27'), published_at: new Date('2026-09-27') }]) },
    account: {
      findFirst: vi.fn(async ({ where }: any) => ({ name: where.name.equals })),
      findMany: vi.fn(async () => []),
    },
    prospectingHypothesis: { findMany: vi.fn(async () => []) },
    // The where clause is honored: only research members of non-watch active sources.
    gapWorkSourceMember: {
      findMany: vi.fn(async ({ where }: any) =>
        members.filter((m: any) => {
          const q = m.qualification ?? 'research';
          const statusOk = typeof where.status === 'string' ? m.status === where.status : where.status.in.includes(m.status);
          const qualOk = typeof where.qualification === 'string' ? q === where.qualification : !where.qualification.notIn.includes(q);
          const intentOk = !where.work_source.intent || (m.intent ?? 'research') !== where.work_source.intent.not;
          return statusOk && qualOk && intentOk;
        })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    researchRun: { groupBy: vi.fn(async () => []), findFirst: vi.fn(async () => ({ created_at: new Date('2026-09-28T10:00:00Z') })) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })) },
    ...extra,
  };
  return prisma;
}
const deps = { loadGroups: async () => [], listQueue: async () => ({ items: [] }) as never, watch: async () => [] };

describe('work-source accounts in the research selector', () => {
  it('one target per ACCOUNT (people counted), after fresh triggers', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'active', kind: 'person' }, { account_name: 'Acme Foods', status: 'active', kind: 'person' }, { account_name: 'Acme Foods', status: 'active', kind: 'person' }]);
    const t = await selectBackgroundTargets(prisma, NOW, deps);
    expect(t.map((x) => [x.accountName, x.reason, x.peopleBlocked])).toEqual([['Trigger Co', 'fresh_trigger', 0], ['Acme Foods', 'work_source', 3]]);
  });

  it('RESEARCH MORE ranks with a story Casey shared (above triggers) and is followed up despite the cooldown', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'research_requested', kind: 'person' }]);
    const t = await selectBackgroundTargets(prisma, NOW, deps);
    expect(t[0]).toMatchObject({ accountName: 'Acme Foods', reason: 'requested_research', sharedByCasey: true });
  });

  it('a WATCH source never spends research', async () => {
    const prisma = db([{ account_name: 'Watch Co', status: 'active', kind: 'person', intent: 'watch' }]);
    const t = await selectBackgroundTargets(prisma, NOW, deps);
    expect(t.map((x) => x.accountName)).not.toContain('Watch Co');
  });

  it('the requested research is served once the run researched the account (back to active)', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'research_requested', kind: 'person' }]);
    prisma.pounceTrigger.findMany = vi.fn(async () => []);
    const research = vi.fn(async () => ({ runId: 'r1', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [], notes: [] }));
    const r = await runBackgroundResearch(prisma, { now: NOW, cap: 1 }, { ...deps, research: research as never });
    expect(research).toHaveBeenCalledTimes(1); // researched although the account ran 5 hours ago (Casey asked)
    expect(r.researched[0]).toMatchObject({ accountName: 'Acme Foods', reason: 'requested_research' });
    expect(prisma.gapWorkSourceMember.updateMany).toHaveBeenCalledWith({ where: { account_name: 'Acme Foods', status: 'research_requested' }, data: { status: 'active' } });
  });

  it('an ordinary work-source account respects the 3-day cooldown', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'active', kind: 'person' }]);
    prisma.pounceTrigger.findMany = vi.fn(async () => []);
    const research = vi.fn();
    const r = await runBackgroundResearch(prisma, { now: NOW, cap: 1 }, { ...deps, research: research as never });
    expect(research).not.toHaveBeenCalled();
    expect(r.skipped[0].reason).toMatch(/^researched_recently:/);
  });
});

describe('Release B review fixes', () => {
  it('a request at an account that ALSO has a higher-ranked reason is still served (never an hourly cooldown bypass)', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'research_requested', kind: 'person' }]);
    prisma.pounceTrigger.findMany = vi.fn(async () => []);
    const research = vi.fn(async () => ({ runId: 'r1', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [], notes: [] }));
    const groups = async () => [{ fingerprint: 'f', accountName: 'Acme Foods', problemFamily: 'hidden_capacity', members: [{ id: 'h', status: 'draft', next: 'find_evidence' }] }] as never;
    const r = await runBackgroundResearch(prisma, { now: NOW, cap: 1 }, { ...deps, loadGroups: groups, research: research as never });
    expect(r.researched[0].reason).toBe('research_work');
    expect(prisma.gapWorkSourceMember.updateMany).toHaveBeenCalledWith({ where: { account_name: 'Acme Foods', status: 'research_requested' }, data: { status: 'active' } });
  });

  it('a request whose research FAILS is served too (Casey can ask again; no hourly retry forever)', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'research_requested', kind: 'person' }]);
    prisma.pounceTrigger.findMany = vi.fn(async () => []);
    const research = vi.fn(async () => { throw new Error('provider down'); });
    const r = await runBackgroundResearch(prisma, { now: NOW, cap: 1 }, { ...deps, research: research as never });
    expect(r.failed).toHaveLength(1);
    expect(prisma.gapWorkSourceMember.updateMany).toHaveBeenCalledWith({ where: { account_name: 'Acme Foods', status: 'research_requested' }, data: { status: 'active' } });
  });

  it('RESEARCH MORE on an evidence-ready person is honored (Casey asked), except at a deal or do-not-contact', async () => {
    const prisma = db([{ account_name: 'Acme Foods', status: 'research_requested', kind: 'person' }]);
    await selectBackgroundTargets(prisma, NOW, deps);
    const where = prisma.gapWorkSourceMember.findMany.mock.calls.map((c: any) => c[0].where);
    expect(where).toContainEqual(expect.objectContaining({ status: 'research_requested', qualification: { notIn: ['in_deal', 'do_not_contact'] } }));
  });
});
