/**
 * Cohort planning (2026-09-28): qualify ACCOUNTS once, then apply the account
 * state to every person there; a person-level stop (do not contact, identity)
 * wins. Transparent states with reasons, no score. 400 people at 170 accounts
 * never means 400 research jobs: research targets are ACCOUNTS.
 */
import { describe, expect, it, vi } from 'vitest';
import { planWorkSources, qualifyAccount, type AccountFacts } from '@/lib/gap/intake/plan';

const NOW = new Date('2026-09-28T15:00:00Z');
const fact = (over: Partial<AccountFacts> = {}): AccountFacts => ({ accountName: 'Acme Foods', watched: true, opportunity: 'CLEAR', liveFacts: 0, bestFactReason: null, theses: [], lastResearchAt: null, ...over });

describe('qualifyAccount: one transparent state per account', () => {
  it('outside the watched universe: NOT ICP (no deal lookup, no research spend)', () => {
    expect(qualifyAccount(fact({ watched: false }), NOW)).toEqual({ state: 'not_icp', reason: 'not in the watched universe (tier / priority band / thesis / watchlist)' });
  });
  it('an open HubSpot deal: IN DEAL; deal status unknown: OPPORTUNITY UNKNOWN (never cold)', () => {
    expect(qualifyAccount(fact({ opportunity: 'ACTIVE' }), NOW).state).toBe('in_deal');
    expect(qualifyAccount(fact({ opportunity: 'UNKNOWN' }), NOW).state).toBe('opportunity_unknown');
  });
  it('a live verified fact: EVIDENCE READY, with the fact kind as the reason', () => {
    expect(qualifyAccount(fact({ liveFacts: 2, bestFactReason: 'a physical network transformation' }), NOW)).toEqual({ state: 'evidence_ready', reason: '2 verified facts; best: a physical network transformation' });
  });
  it('a live fact and every thesis there approved and in use: ALREADY COVERED', () => {
    expect(qualifyAccount(fact({ liveFacts: 1, theses: [{ useLabel: null }] }), NOW).state).toBe('already_covered');
    expect(qualifyAccount(fact({ liveFacts: 1, theses: [{ useLabel: 'USE & CREATE REVISION' }] }), NOW).state).toBe('evidence_ready');
  });
  it('no live fact: RESEARCH, saying when it was last researched', () => {
    expect(qualifyAccount(fact(), NOW)).toEqual({ state: 'research', reason: 'no live verified fact; never researched' });
    expect(qualifyAccount(fact({ lastResearchAt: new Date('2026-09-27T10:00:00Z') }), NOW).reason).toBe('no live verified fact; last researched 2026-09-27');
  });
});

function db(members: any[], personas: any[] = []) {
  const updates: any[] = [];
  const prisma: any = {
    gapWorkSource: { findMany: vi.fn(async () => [{ id: 's1', intent: 'research', status: 'active' }]) },
    gapWorkSourceMember: {
      findMany: vi.fn(async () => members),
      update: vi.fn(async ({ where, data }: any) => { updates.push({ id: where.id, ...data }); Object.assign(members.find((m) => m.id === where.id), data); }),
    },
    persona: { findMany: vi.fn(async () => personas) },
    researchRun: { groupBy: vi.fn(async () => []) },
    gapAuditEvent: { create: vi.fn(async () => ({})) },
  };
  return { prisma, updates };
}
const m = (id: string, over: Record<string, unknown>) => ({ id, work_source_id: 's1', kind: 'person', status: 'active', resolution: 'resolved', account_name: 'Acme Foods', persona_id: null, qualification: null, qualification_reason: null, ...over });

describe('planWorkSources', () => {
  it('researches ACCOUNTS once: 5 people at 2 accounts = 2 account lookups, each person gets its account state', async () => {
    const members = [m('a', {}), m('b', {}), m('c', {}), m('d', { account_name: 'Globex' }), m('e', { account_name: 'Globex' })];
    const { prisma } = db(members);
    const opportunity = vi.fn(async () => ({ status: 'CLEAR' as const, companyIds: [] }));
    const r = await planWorkSources(prisma, { now: NOW, actor: 'gap-plan' }, { watch: async () => [{ accountName: 'Acme Foods' }, { accountName: 'Globex' }], opportunity, inbox: async () => [], reresolve: async () => 0 });
    expect(opportunity).toHaveBeenCalledTimes(2);
    expect(r.accounts).toBe(2);
    expect(members.map((x) => x.qualification)).toEqual(['research', 'research', 'research', 'research', 'research']);
    expect(r.researchAccounts.sort()).toEqual(['Acme Foods', 'Globex']);
  });

  it('person-level stops win: do not contact, ambiguous identity (human review), unresolved (needs identity)', async () => {
    const members = [m('dnc', { persona_id: 7 }), m('amb', { resolution: 'ambiguous', account_name: null }), m('unr', { resolution: 'unresolved', account_name: null })];
    const { prisma } = db(members, [{ id: 7, do_not_contact: true, email_status: 'valid' }]);
    await planWorkSources(prisma, { now: NOW, actor: 'gap-plan' }, { watch: async () => [{ accountName: 'Acme Foods' }], opportunity: async () => ({ status: 'CLEAR' as const, companyIds: [] }), inbox: async () => [], reresolve: async () => 0 });
    expect(members.map((x) => [x.id, x.qualification])).toEqual([['dnc', 'do_not_contact'], ['amb', 'human_review'], ['unr', 'needs_identity']]);
  });

  it('a deal lookup only for watched accounts; a not-ICP account costs no HubSpot call', async () => {
    const members = [m('a', { account_name: 'Tiny Co' })];
    const { prisma } = db(members);
    const opportunity = vi.fn(async () => ({ status: 'CLEAR' as const, companyIds: [] }));
    await planWorkSources(prisma, { now: NOW, actor: 'gap-plan' }, { watch: async () => [], opportunity, inbox: async () => [], reresolve: async () => 0 });
    expect(opportunity).not.toHaveBeenCalled();
    expect(members[0].qualification).toBe('not_icp');
  });

  it('ignored and not-now members are left alone; unchanged states are not rewritten', async () => {
    const members = [m('ig', { status: 'ignored' }), m('same', { qualification: 'research', qualification_reason: 'no live verified fact; never researched' })];
    const { prisma, updates } = db(members);
    await planWorkSources(prisma, { now: NOW, actor: 'gap-plan' }, { watch: async () => [{ accountName: 'Acme Foods' }], opportunity: async () => ({ status: 'CLEAR' as const, companyIds: [] }), inbox: async () => [], reresolve: async () => 0 });
    expect(members[0].qualification).toBeNull();
    expect(updates).toEqual([]);
  });

  it('evidence already in the inbox makes the account EVIDENCE READY without new research', async () => {
    const members = [m('a', {})];
    const { prisma } = db(members);
    const inbox = async () => [{ accountName: 'Acme Foods', ready: [{ relevance: { reason: 'a distribution, warehouse, plant or yard change' } }, {}], bestSignalId: 'x', theses: [] }] as never;
    const r = await planWorkSources(prisma, { now: NOW, actor: 'gap-plan' }, { watch: async () => [{ accountName: 'Acme Foods' }], opportunity: async () => ({ status: 'CLEAR' as const, companyIds: [] }), inbox, reresolve: async () => 0 });
    expect(members[0]).toMatchObject({ qualification: 'evidence_ready', qualification_reason: '2 verified facts; best: a distribution, warehouse, plant or yard change' });
    expect(r.researchAccounts).toEqual([]);
  });

  it('respects the account budget: accounts past it stay unplanned this run (never guessed)', async () => {
    const members = [m('a', {}), m('b', { account_name: 'Globex' })];
    const { prisma } = db(members);
    const r = await planWorkSources(prisma, { now: NOW, actor: 'gap-plan', maxAccounts: 1 }, { watch: async () => [{ accountName: 'Acme Foods' }, { accountName: 'Globex' }], opportunity: async () => ({ status: 'CLEAR' as const, companyIds: [] }), inbox: async () => [], reresolve: async () => 0 });
    expect(r.accounts).toBe(1);
    expect(r.deferredAccounts).toBe(1);
    expect(members.filter((x) => x.qualification).length).toBe(1);
  });
});
