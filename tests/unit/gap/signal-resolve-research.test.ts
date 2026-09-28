/**
 * GAP Signal Intelligence B: resolution retry, story clustering, signal ->
 * research, honest settling, and promotion ONLY after verification through the
 * canonical Pounce path.
 */
import { describe, expect, it, vi } from 'vitest';
import { sameEvent, clusterSignal } from '@/lib/gap/signals/cluster';
import { factMatchesSignal, settleSignals, signalCandidates, signalFocus } from '@/lib/gap/signals/research';
import { promoteSignal } from '@/lib/gap/signals/promote';
import { processSignals } from '@/lib/gap/signals/process';
import { runBackgroundResearch, selectBackgroundTargets, compareTargets } from '@/lib/gap/research/background';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const row = (o: Record<string, unknown>) => ({ id: 'x', url: null, title: null, account_name: 'PepsiCo', published_at: new Date('2026-09-20T00:00:00Z'), created_at: new Date('2026-09-20T00:00:00Z'), event_id: null, ...o });

describe('story clustering', () => {
  it('syndicated copies of one story (same slug, different outlets) are one event', () => {
    expect(sameEvent(row({ id: 'a', url: 'https://supplychaindive.com/news/pepsico-expanding-autonomous-truck-use-in-its-supply-chain/822403/' }), row({ id: 'b', url: 'https://truckingdive.com/news/pepsico-expanding-autonomous-truck-use-in-its-supply-chain/822728/' }))).toBe(true);
  });

  it('the same event told in different words (high title overlap) clusters; a different event at the same account does not', () => {
    const a = row({ id: 'a', title: 'PepsiCo expands Gatik autonomous freight deployment across Texas and Arizona' });
    expect(sameEvent(a, row({ id: 'b', title: 'Gatik autonomous freight deployment expands across Texas and Arizona for PepsiCo' }))).toBe(true);
    expect(sameEvent(a, row({ id: 'c', title: 'PepsiCo to close Frito-Lay plant in Ohio' }))).toBe(false);
  });

  it('never across accounts or far-apart dates', () => {
    const a = row({ id: 'a', title: 'opens new distribution center in Dallas Texas region' });
    expect(sameEvent(a, row({ id: 'b', account_name: 'General Mills', title: 'opens new distribution center in Dallas Texas region' }))).toBe(false);
    expect(sameEvent(a, row({ id: 'c', title: 'opens new distribution center in Dallas Texas region', published_at: new Date('2026-08-01T00:00:00Z') }))).toBe(false);
  });

  it('clusterSignal points a new source at the earlier event and keeps both rows', async () => {
    const rows = [row({ id: 'early', url: 'https://a.com/news/pepsico-expanding-autonomous-truck-use-in-its-supply-chain/1', event_id: 'early' }), row({ id: 'late', url: 'https://b.com/news/pepsico-expanding-autonomous-truck-use-in-its-supply-chain/2', event_id: 'late' })];
    const update = vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows.find((r) => r.id === where.id)!, data));
    const prisma = { gapSignal: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id)), findMany: vi.fn(async () => rows.filter((r) => r.id === 'early')), update } };
    expect(await clusterSignal(prisma, 'late')).toBe('early');
    expect(rows.map((r) => r.event_id)).toEqual(['early', 'early']);
  });
});

describe('signal -> research', () => {
  const sig = { id: 's1', url: 'https://pepsico.com/newsroom/gatik', title: 'PepsiCo and Gatik expand autonomous freight to 250 retail locations', published_at: new Date('2026-06-08T00:00:00Z'), source_class: 'news', resolution_basis: 'company_newsroom', event_id: 's1' };

  it('proposes physical-network sentences from the signal page itself, dated by the page, marked primary on the newsroom', async () => {
    const html = '<p>PepsiCo will open a new distribution center in Dallas, Texas in 2027 to serve 250 retail locations.</p><p>We love our fans.</p>';
    const r = await signalCandidates([sig], { fetchHtml: async () => html });
    expect(r.candidates.length).toBeGreaterThanOrEqual(1);
    expect(r.candidates[0]).toMatchObject({ provider: 'signal', url: sig.url, publishedAt: sig.published_at, sourceType: 'public_primary' });
    expect(r.pages.get(sig.url)).toContain('new distribution center in Dallas');
    expect(signalFocus([sig])).toMatch(/PRIMARY source/);
  });

  it('an unreadable page proposes nothing (research still runs its other providers)', async () => {
    const r = await signalCandidates([sig], { fetchHtml: async () => { throw new Error('fetch 403'); } });
    expect(r.candidates).toEqual([]);
    expect(r.note).toMatch(/unreadable/);
  });

  it('a fact matches the signal only from its own page or by 3+ of the story\'s specific words; an unrelated fact never does', () => {
    expect(factMatchesSignal({ url: 'https://www.pepsico.com/newsroom/gatik/?utm_source=x', excerpt: 'anything' }, sig, 'PepsiCo')).toBe(true);
    expect(factMatchesSignal({ url: 'https://reuters.com/x', excerpt: 'PepsiCo and Gatik will expand autonomous freight to more retail locations.' }, sig, 'PepsiCo')).toBe(true);
    expect(factMatchesSignal({ url: 'https://reuters.com/y', excerpt: 'PepsiCo will close its Frito-Lay plant in Ohio next year.' }, sig, 'PepsiCo')).toBe(false);
  });

  it('settles each signal honestly: fact_found, contradiction, or no_usable_fact', async () => {
    const rows: Record<string, Record<string, unknown>> = { s1: { metadata: {} }, s2: { metadata: {} } };
    const prisma = { gapSignal: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows[where.id]), update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows[where.id], data)) } };
    const result = { runId: 'run-1', outcome: 'evidence_found' as const, facts: [{ signalId: 'f1', evidenceRecordId: 'e1', excerpt: 'x', url: sig.url, title: 't', publishedAt: '', retrievedAt: '', provider: 'signal' as const, type: 'news' as never, change: 'expansion' as never, fresh: true }], rejected: [], conflicts: [], notes: [] };
    const other = { ...sig, id: 's2', url: 'https://x.com/other', title: 'PepsiCo appoints new CFO' };
    const out = await settleSignals(prisma, { signals: [sig, other], accountName: 'PepsiCo', result, now: NOW });
    expect(out).toEqual([{ id: 's1', status: 'fact_found', matched: ['f1'] }, { id: 's2', status: 'no_usable_fact', matched: [] }]);
    expect((rows.s2.metadata as { research: { otherVerifiedFacts: number } }).research.otherVerifiedFacts).toBe(1);
    const conflicted = await settleSignals(prisma, { signals: [sig], accountName: 'PepsiCo', result: { ...result, conflicts: [{ site: 'Dallas', signalIds: ['f1'] }] }, now: NOW });
    expect(conflicted[0].status).toBe('contradiction');
  });
});

describe('promotion: only a verified, resolved signal, only through the canonical Pounce path', () => {
  const base = { id: 's1', url: 'https://pepsico.com/newsroom/gatik', title: 'PepsiCo and Gatik expand autonomous freight', account_name: 'PepsiCo', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, published_at: new Date('2026-06-08T00:00:00Z') };
  const db = (o: Record<string, unknown>) => {
    const r = { ...base, ...o };
    return { r, prisma: { gapSignal: { findUnique: vi.fn(async () => r), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(r, data)) }, pounceTrigger: { findUnique: vi.fn(async () => ({ id: 77 })) } } };
  };

  it('a raw (unverified), ambiguous or ignored signal is never promoted and never touches the spine', async () => {
    const ingest = vi.fn();
    for (const [o, reason] of [[{ research_status: 'queued' }, 'not_verified'], [{ research_status: 'none' }, 'not_verified'], [{ resolution: 'ambiguous', account_name: null }, 'not_resolved'], [{ feedback: 'irrelevant' }, 'ignored'], [{ promoted_trigger_id: 5 }, 'already_promoted']] as const) {
      const { prisma } = db(o);
      expect(await promoteSignal(prisma, 's1', { ingest })).toEqual({ ok: false, reason });
    }
    expect(ingest).not.toHaveBeenCalled();
  });

  it('a verified signal enters ingestTriggers with honestly derived fields and records its trigger', async () => {
    const ingest = vi.fn(async () => ({ received: 1, created: 1, duplicate: 0, pinged: 0, stamped: 0 }));
    const { prisma, r } = db({});
    expect(await promoteSignal(prisma, 's1', { ingest })).toEqual({ ok: true, triggerId: 77, created: true });
    expect(ingest).toHaveBeenCalledWith([expect.objectContaining({ accountName: 'PepsiCo', url: base.url, title: base.title, source: 'web', categories: expect.arrayContaining(['autonomy']), publishedAt: '2026-06-08T00:00:00.000Z' })]);
    expect(r.promoted_trigger_id).toBe(77);
  });
});

describe('the processing pass', () => {
  it('retries an unreadable page and resolves the account from its title; follows up a shared link', async () => {
    const stuck = { id: 's1', url: 'https://supplychaindive.com/news/x', title: null, origin: 'casey_share', account_hint: null, metadata: { metaAttempts: 1, metaError: 'private host' } };
    const update = vi.fn(async () => ({}));
    const prisma = {
      gapSignal: { findMany: vi.fn().mockResolvedValueOnce([stuck]).mockResolvedValueOnce([]).mockResolvedValueOnce([]), update },
      account: { findMany: vi.fn(async () => [{ name: 'General Mills' }]) },
      gapAccountAlias: { findMany: vi.fn(async () => []) },
      canonicalAccountLink: { findMany: vi.fn(async () => []) },
    };
    const r = await processSignals(prisma, { now: NOW }, { fetchHtml: async () => '<meta property="og:title" content="General Mills plans supply chain revamp"><meta property="article:published_time" content="2026-07-02">' });
    expect(r).toMatchObject({ retried: 1, resolvedOnRetry: 1 });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ account_name: 'General Mills', resolution: 'resolved', research_status: 'queued', title: 'General Mills plans supply chain revamp' }) }));
  });

  it('a new source with no metadata key yet IS clustered (regression: a JSON-path NOT filter skipped it)', async () => {
    const rows = [
      { id: 'a', url: 'https://a.com/news/acme-opens-dallas-distribution-center-with-automated-yard/1', title: 't', account_name: 'PepsiCo', published_at: NOW, created_at: NOW, event_id: 'a', metadata: null },
      { id: 'b', url: 'https://b.com/news/acme-opens-dallas-distribution-center-with-automated-yard/2', title: 't', account_name: 'PepsiCo', published_at: NOW, created_at: NOW, event_id: 'b', metadata: { clustered: true } },
    ];
    const update = vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows.find((r) => r.id === where.id)!, data));
    const prisma = {
      gapSignal: {
        findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => ('resolution' in where && where.resolution === 'needs_account' ? [] : 'research_status' in where ? [] : 'account_name' in where && typeof where.account_name === 'string' ? rows.filter((r) => r.id === 'b') : rows)),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id)),
        update,
      },
    };
    const r = await processSignals(prisma, { now: NOW });
    expect(r).toMatchObject({ clustered: 1, joinedEvents: 1 });
    expect(rows[0].event_id).toBe('b');
  });

  it('gives up on a page after 3 attempts', async () => {
    const prisma = { gapSignal: { findMany: vi.fn().mockResolvedValueOnce([{ id: 's1', url: 'https://x.com/a', title: null, origin: 'casey_share', account_hint: null, metadata: { metaAttempts: 3 } }]).mockResolvedValue([]), update: vi.fn() } };
    const fetchHtml = vi.fn();
    expect((await processSignals(prisma, { now: NOW }, { fetchHtml })).retried).toBe(0);
    expect(fetchHtml).not.toHaveBeenCalled();
  });
});

describe('background research follows up queued signals', () => {
  const emptyDeps = { loadGroups: async () => [], listQueue: async () => ({ asOf: null, items: [], truncated: false }) };
  const prismaWith = (signals: unknown[], extra: Record<string, unknown> = {}) => ({
    pounceTrigger: { findMany: vi.fn(async () => []) },
    prospectingHypothesis: { findMany: vi.fn(async () => []) },
    account: { findMany: vi.fn(async () => [{ name: 'PepsiCo', tier: 'Tier 2' }]), findFirst: vi.fn() },
    gapSignal: { findMany: vi.fn(async () => signals), updateMany: vi.fn(async () => ({})), update: vi.fn(async () => ({})), findUnique: vi.fn(async () => ({ metadata: {} })) },
    researchRun: { findFirst: vi.fn(async () => ({ created_at: new Date(NOW.getTime() - 3_600_000) })) },
    gapAuditEvent: { create: vi.fn(async () => ({})) },
    ...extra,
  });

  it('a Casey-shared signal ranks right after research blocking people, before triggers and expiry', async () => {
    const t = await selectBackgroundTargets(prismaWith([{ id: 's1', account_name: 'PepsiCo', origin: 'casey_share', title: 'PepsiCo expands Gatik', created_at: NOW, published_at: null }]), NOW, emptyDeps);
    expect(t).toEqual([expect.objectContaining({ accountName: 'PepsiCo', reason: 'shared_signal', signalIds: ['s1'], triggerTitle: 'PepsiCo expands Gatik' })]);
    const mk = (reason: string) => ({ accountName: reason, reason, peopleBlocked: 0, triggerAt: null, triggerTitle: null, expiresAt: null, tier: null, oldestWorkAt: null, problemFamily: null }) as never;
    expect(['expiring_evidence', 'fresh_trigger', 'shared_signal', 'research_work'].map(mk).sort(compareTargets).map((x: { reason: string }) => x.reason)).toEqual(['research_work', 'shared_signal', 'fresh_trigger', 'expiring_evidence']);
  });

  it('a queued signal is researched despite the account cooldown, with its page as a candidate source, and settled; research never touches a hypothesis', async () => {
    const sigRow = { id: 's1', url: 'https://pepsico.com/n', title: 'PepsiCo expands Gatik', published_at: NOW, source_class: 'news', resolution_basis: 'company_newsroom', event_id: 's1', metadata: {} };
    const prisma = prismaWith([{ id: 's1', account_name: 'PepsiCo', origin: 'casey_share', title: 'PepsiCo expands Gatik', created_at: NOW, published_at: null }]);
    prisma.gapSignal.findMany = vi.fn().mockResolvedValueOnce([{ id: 's1', account_name: 'PepsiCo', origin: 'casey_share', title: 'PepsiCo expands Gatik', created_at: NOW, published_at: null }]).mockResolvedValueOnce([sigRow]);
    const research = vi.fn(async (_p: unknown, input: { focus?: string }, deps: { extra?: unknown }) => {
      expect(input.focus).toMatch(/PRIMARY source/);
      expect(typeof deps.extra).toBe('function');
      return { runId: 'r1', outcome: 'insufficient_evidence' as const, facts: [], rejected: [], conflicts: [], notes: [] };
    });
    const r = await runBackgroundResearch(prisma, { now: NOW }, { ...emptyDeps, research: research as never });
    expect(r.researched).toHaveLength(1);
    expect(prisma.gapSignal.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['s1'] } }, data: { research_status: 'researching' } });
    expect(prisma.gapSignal.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1' }, data: expect.objectContaining({ research_status: 'no_usable_fact', research_run_id: 'r1' }) }));
  });

  it('a failed research run puts the signal back in the queue (never stuck researching), then settles after 3 failures', async () => {
    const sigRow = { id: 's1', url: 'https://pepsico.com/n', title: 'x', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1', metadata: { researchAttempts: 2 } };
    const prisma = prismaWith([]);
    prisma.gapSignal.findMany = vi.fn().mockResolvedValueOnce([{ id: 's1', account_name: 'PepsiCo', origin: 'casey_share', title: 'x', created_at: NOW, published_at: null }]).mockResolvedValueOnce([sigRow]);
    await runBackgroundResearch(prisma, { now: NOW }, { ...emptyDeps, research: (async () => { throw new Error('gemini 503'); }) as never });
    expect(prisma.gapSignal.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { research_status: 'no_usable_fact', metadata: { researchAttempts: 3, researchError: 'gemini 503' } } });
  });
});
