/**
 * Phase 2 B1: background evidence research. Deterministic priority, bounded,
 * idempotent, retry-safe, and it NEVER touches hypotheses, routing, drafts,
 * enrollment or outbound: a write-recording database proves only research
 * tables (and the audit log) are written.
 */
import { describe, expect, it, vi } from 'vitest';
import { BACKGROUND_ACTOR, compareTargets, runBackgroundResearch, selectBackgroundTargets, type BackgroundTarget } from '@/lib/gap/research/background';
import type { Candidate } from '@/lib/gap/research/providers';

const NOW = new Date('2026-09-28T10:40:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const target = (over: Partial<BackgroundTarget>): BackgroundTarget => ({
  accountName: 'X', reason: 'fresh_trigger', peopleBlocked: 0, triggerAt: null, triggerTitle: null, expiresAt: null, tier: null, oldestWorkAt: null, problemFamily: null, ...over,
});

describe('compareTargets: deterministic priority, no score', () => {
  it('research work beats a fresh trigger beats expiring evidence; then people unblocked, freshness, expiry, tier, oldest work, name', () => {
    const list = [
      target({ accountName: 'Exp', reason: 'expiring_evidence', expiresAt: daysAgo(-5).toISOString() }),
      target({ accountName: 'Trig-old', reason: 'fresh_trigger', triggerAt: daysAgo(9).toISOString() }),
      target({ accountName: 'Trig-new', reason: 'fresh_trigger', triggerAt: daysAgo(1).toISOString() }),
      target({ accountName: 'Work-2', reason: 'research_work', peopleBlocked: 2 }),
      target({ accountName: 'Work-5', reason: 'research_work', peopleBlocked: 5 }),
      target({ accountName: 'Work-2-tier1', reason: 'research_work', peopleBlocked: 2, tier: 'Tier 1' }),
    ];
    expect([...list].sort(compareTargets).map((t) => t.accountName)).toEqual(['Work-5', 'Work-2-tier1', 'Work-2', 'Trig-new', 'Trig-old', 'Exp']);
  });
});

/** A database that records every write by model.method and serves just what background research reads. */
function recordingDb(opts: { triggers?: any[]; accounts?: string[]; lastRunAt?: Record<string, Date>; hypotheses?: any[] } = {}) {
  const writes: string[] = [];
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  const records: any[] = [];
  const signals: any[] = [];
  const runs: any[] = [];
  const handler = (model: string, impl: Record<string, (...a: any[]) => any>) =>
    new Proxy(impl, {
      get(t, method: string) {
        if (method in t) {
          return (...a: any[]) => {
            if (/^(create|update|upsert|delete)/.test(method)) writes.push(`${model}.${method}`);
            return t[method](...a);
          };
        }
        return (...a: any[]) => {
          if (/^(create|update|upsert|delete)/.test(method)) writes.push(`${model}.${method}`);
          throw new Error(`unexpected ${model}.${method}(${JSON.stringify(a).slice(0, 80)})`);
        };
      },
    });
  const accounts = opts.accounts ?? ['PepsiCo'];
  const prisma: any = {
    pounceTrigger: handler('pounceTrigger', { findMany: async () => opts.triggers ?? [] }),
    account: handler('account', {
      findFirst: async ({ where }: any) => {
        const hit = accounts.find((a) => a.toLowerCase() === String(where.name.equals).toLowerCase());
        return hit ? { name: hit } : null;
      },
      findMany: async () => accounts.map((name) => ({ name, tier: 'Tier 1' })),
    }),
    prospectingHypothesis: handler('prospectingHypothesis', { findMany: async () => opts.hypotheses ?? [] }),
    researchRun: handler('researchRun', {
      findFirst: async ({ where }: any) => (opts.lastRunAt?.[where.account_name] ? { created_at: opts.lastRunAt[where.account_name] } : null),
      create: async ({ data }: any) => { const r = { id: id('run'), ...data }; runs.push(r); return { id: r.id }; },
      update: async ({ where, data }: any) => Object.assign(runs.find((r) => r.id === where.id), data),
    }),
    evidenceRecord: handler('evidenceRecord', {
      upsert: async ({ where, create }: any) => {
        const k = where.account_name_claim_hash_source_url_observed_at;
        let r = records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url);
        if (!r) { r = { id: id('ev'), ...create }; records.push(r); }
        return r;
      },
      findUnique: async ({ where }: any) => { const k = where.account_name_claim_hash_source_url_observed_at; return records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url) ?? null; },
    }),
    prospectingSignal: handler('prospectingSignal', {
      findUnique: async ({ where }: any) => signals.find((s) => s.source_kind === where.source_kind_source_id.source_kind && s.source_id === where.source_kind_source_id.source_id) ?? null,
      create: async ({ data }: any) => { const s = { id: id('sig'), ...data }; signals.push(s); return s; },
      // evidence continuity reads the account's facts (a read, not a write)
      findMany: async ({ where }: any) => signals.filter((s) => s.account_name === where.account_name && s.source_kind === where.source_kind),
    }),
    gapAuditEvent: handler('gapAuditEvent', { create: async () => ({ id: id('a') }) }),
    // Anything else touched at all is a failure (hypotheses written, routing, drafts, enrollment, sends).
    hypothesisSignal: handler('hypothesisSignal', {}),
    hypothesisEvent: handler('hypothesisEvent', {}),
    routingDecision: handler('routingDecision', {}),
    sequenceEnrollment: handler('sequenceEnrollment', {}),
    emailLog: handler('emailLog', {}),
    draftQueueItem: handler('draftQueueItem', {}),
  };
  return { prisma, writes, signals, runs };
}

const noGroups = async () => [] as never;
const noQueue = async () => ({ asOf: null, items: [], truncated: false });
const FACT = 'PepsiCo will expand its autonomous freight program to a new distribution center in Texas this year.';
const webFact = (): Candidate => ({ provider: 'web', url: 'https://news.example/pep', title: 'PepsiCo expands', publishedAt: new Date('2026-09-20'), excerpt: FACT, sourceType: 'public_secondary' });
const research = (candidates: Candidate[]) => ({
  edgar: async () => ({ candidates: [], note: 'no cik' }),
  web: async () => ({ candidates, note: 'test' }),
  fetchText: async () => `PepsiCo news. ${FACT}`,
});

describe('runBackgroundResearch', () => {
  it('a fresh PepsiCo trigger becomes a VERIFIED candidate fact without anyone clicking, and writes ONLY research tables', async () => {
    const db = recordingDb({ triggers: [{ account_name: 'PEPSICO', title: 'PepsiCo expands autonomous freight', first_seen_at: daysAgo(1), published_at: daysAgo(1) }] });
    const r = await runBackgroundResearch(db.prisma, { now: NOW }, { ...research([webFact()]), loadGroups: noGroups, listQueue: noQueue });
    expect(r.researched).toEqual([expect.objectContaining({ accountName: 'PepsiCo', reason: 'fresh_trigger', outcome: 'evidence_found', freshFacts: 1 })]);
    expect(db.signals[0]).toMatchObject({ source_kind: 'evidence_record', evidence_text: FACT, registered_by: BACKGROUND_ACTOR, metadata: expect.objectContaining({ verified: 'excerpt_found_at_source' }) });
    // Safety proof: zero hypothesis, routing, draft, enrollment or outbound writes.
    expect(new Set(db.writes)).toEqual(new Set(['researchRun.create', 'researchRun.update', 'evidenceRecord.upsert', 'prospectingSignal.create', 'gapAuditEvent.create']));
    expect(db.runs[0].provider_status).toMatchObject({ purpose: 'gap_background_research', targetReason: 'fresh_trigger', triggerTitle: 'PepsiCo expands autonomous freight' });
  });

  it('when nothing verifies, the account gets an explicit answer (insufficient evidence + rejected reasons), still no other writes', async () => {
    const db = recordingDb({ triggers: [{ account_name: 'PepsiCo', title: 't', first_seen_at: daysAgo(1), published_at: null }] });
    const r = await runBackgroundResearch(db.prisma, { now: NOW }, { ...research([{ ...webFact(), excerpt: 'PepsiCo will open a brand new distribution center in Ohio next spring.' }]), loadGroups: noGroups, listQueue: noQueue });
    expect(r.researched[0]).toMatchObject({ outcome: 'insufficient_evidence', facts: 0, rejected: 1 });
    expect(db.writes.every((w) => /^(researchRun|evidenceRecord|prospectingSignal|gapAuditEvent)\./.test(w))).toBe(true);
    expect(db.runs[0].provider_status.result.rejected[0]).toMatchObject({ reason: 'reanchor_too_weak' });
  });

  it('idempotent: an account researched within the cooldown is skipped unless a newer trigger arrived', async () => {
    const trig = { account_name: 'PepsiCo', title: 't', first_seen_at: daysAgo(1), published_at: daysAgo(1) };
    const recent = recordingDb({ triggers: [trig], lastRunAt: { PepsiCo: new Date(NOW.getTime() - 3_600_000) } });
    const r1 = await runBackgroundResearch(recent.prisma, { now: NOW }, { ...research([webFact()]), loadGroups: noGroups, listQueue: noQueue });
    expect(r1.researched).toHaveLength(0);
    expect(r1.skipped[0].reason).toMatch(/^researched_recently:/);
    const older = recordingDb({ triggers: [trig], lastRunAt: { PepsiCo: daysAgo(2) } });
    const r2 = await runBackgroundResearch(older.prisma, { now: NOW }, { ...research([webFact()]), loadGroups: noGroups, listQueue: noQueue });
    expect(r2.researched).toHaveLength(1);
  });

  it('bounded and retry-safe: the cap holds, a failing account is recorded and the next one still runs', async () => {
    const names = ['A Co', 'B Co', 'C Co', 'D Co', 'E Co'];
    const db = recordingDb({ accounts: names, triggers: names.map((a, i) => ({ account_name: a, title: a, first_seen_at: daysAgo(i + 1), published_at: daysAgo(i + 1) })) });
    const calls: string[] = [];
    const r = await runBackgroundResearch(db.prisma, { now: NOW, cap: 3 }, {
      loadGroups: noGroups,
      listQueue: noQueue,
      research: (async (_p: unknown, input: { accountName: string }) => {
        calls.push(input.accountName);
        if (input.accountName === 'A Co') throw new Error('provider down');
        return { runId: 'r', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [], notes: [] };
      }) as never,
    });
    expect(calls).toEqual(['A Co', 'B Co', 'C Co']);
    expect(r.failed).toEqual([{ accountName: 'A Co', error: 'provider down' }]);
    expect(r.researched.map((x) => x.accountName)).toEqual(['B Co', 'C Co']);
    expect(r.skipped.filter((s) => s.reason === 'cap_reached').map((s) => s.accountName)).toEqual(['D Co', 'E Co']);
  });

  it('vendor and competitor noise (a trigger with no modex account) is never researched', async () => {
    const db = recordingDb({ accounts: ['PepsiCo'], triggers: [{ account_name: 'Eaigle', title: 'vendor news', first_seen_at: daysAgo(1), published_at: null }] });
    const targets = await selectBackgroundTargets(db.prisma, NOW, { loadGroups: noGroups, listQueue: noQueue });
    expect(targets).toEqual([]);
  });

  it('research work blocking people outranks a fresh trigger', async () => {
    const db = recordingDb({ accounts: ['PepsiCo', 'Kroger'], triggers: [{ account_name: 'Kroger', title: 't', first_seen_at: daysAgo(1), published_at: null }] });
    const groups = async () => [{ fingerprint: 'f'.repeat(64), accountName: 'PepsiCo', problemFamily: 'hidden_capacity', members: [1, 2, 3].map((i) => ({ id: `h${i}`, next: 'find_evidence', problem_family: 'hidden_capacity' })) }] as never;
    const targets = await selectBackgroundTargets(db.prisma, NOW, { loadGroups: groups, listQueue: noQueue });
    expect(targets.map((t) => [t.accountName, t.reason, t.peopleBlocked])).toEqual([
      ['PepsiCo', 'research_work', 3],
      ['Kroger', 'fresh_trigger', 0],
    ]);
  });
});

vi.mock('@/lib/gap/hypothesis/thesis-groups', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/hypothesis/thesis-groups')>()), splitThesisWork: (g: any[]) => ({ reviewGroups: [], readyOneOffIds: [], researchGroups: g }) }));
