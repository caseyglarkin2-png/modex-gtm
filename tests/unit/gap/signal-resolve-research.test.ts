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
import { signalStatus } from '@/lib/gap/signals/intake';

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

  it('quality review: six outlets rewriting one story are one event; a different story that week is not', () => {
    const titles = [
      'Amazon Picks U.S. Site for New Plant Producing Robotics Components',
      'Amazon Plans $100M Indiana Manufacturing Plant to Support Robotics Network',
      'Amazon’s New Indiana Facility Will Manufacture Robotics for Fulfillment Centers Nationwide',
      'Amazon invests over $100 million in high-tech manufacturing plant in Greenwood to double robotics capacity',
      'Amazon to invest more than $100M in robotics manufacturing facility',
      'Amazon Robotics Plant Coming to Greenwood, Indiana',
    ].map((title, i) => row({ id: `a${i}`, title, account_name: 'Amazon' }));
    const pairs = titles.flatMap((a, i) => titles.slice(i + 1).map((b) => sameEvent(a, b)));
    // Five of the six connect (transitively one event). "Picks U.S. Site for New Plant Producing Robotics
    // Components" shares one specific word with the rest: conservative clustering leaves it apart.
    expect(titles.slice(1).every((a) => titles.slice(1).some((b) => a !== b && sameEvent(a, b)))).toBe(true);
    expect(pairs.filter(Boolean).length).toBeGreaterThanOrEqual(5);
    expect(sameEvent(titles[0], row({ id: 'x', title: 'Amazon closes Port St. Lucie fulfillment center today, hundreds impacted by layoffs', account_name: 'Amazon' }))).toBe(false);
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
    const rows: Record<string, Record<string, unknown>> = { s1: { metadata: {}, account_name: 'PepsiCo', research_status: 'researching' }, s2: { metadata: {}, account_name: 'PepsiCo', research_status: 'researching' } };
    const prisma = { gapSignal: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows[where.id]), update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows[where.id], data)) } };
    const result = { runId: 'run-1', outcome: 'evidence_found' as const, facts: [{ signalId: 'f1', evidenceRecordId: 'e1', excerpt: 'x', url: sig.url, title: 't', publishedAt: '', retrievedAt: '', provider: 'signal' as const, type: 'news' as never, change: 'expansion' as never, fresh: true }], rejected: [], conflicts: [], notes: [] };
    const other = { ...sig, id: 's2', url: 'https://x.com/other', title: 'PepsiCo appoints new CFO' };
    const out = await settleSignals(prisma, { signals: [sig, other], accountName: 'PepsiCo', result, now: NOW });
    expect(out).toEqual([{ id: 's1', status: 'fact_found', matched: ['f1'] }, { id: 's2', status: 'no_usable_fact', matched: [] }]);
    expect((rows.s2.metadata as { research: { otherVerifiedFacts: number } }).research.otherVerifiedFacts).toBe(1);
    rows.s1.research_status = 'researching';
    const conflicted = await settleSignals(prisma, { signals: [sig], accountName: 'PepsiCo', result: { ...result, conflicts: [{ site: 'Dallas', signalIds: ['f1'] }] }, now: NOW });
    expect(conflicted[0].status).toBe('contradiction');
  });
});

describe('promotion: only a verified, resolved signal, only through the canonical Pounce path', () => {
  const base = { id: 's1', url: 'https://pepsico.com/newsroom/gatik', title: 'PepsiCo and Gatik expand autonomous freight', account_name: 'PepsiCo', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, published_at: new Date('2026-06-08T00:00:00Z') };
  const db = (o: Record<string, unknown>) => {
    const r = { ...base, ...o };
    return { r, prisma: { gapSignal: { findUnique: vi.fn(async () => r), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(r, data)) }, pounceTrigger: { findUnique: vi.fn(async () => ({ id: 77 })), findMany: vi.fn(async () => [] as unknown[]) } } };
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
    expect(await promoteSignal(prisma, 's1', { ingest, now: new Date('2026-06-10T00:00:00Z') })).toEqual({ ok: true, triggerId: 77, created: true });
    expect(ingest).toHaveBeenCalledWith([expect.objectContaining({ accountName: 'PepsiCo', url: base.url, title: base.title, source: 'web', categories: expect.arrayContaining(['autonomy']), publishedAt: '2026-06-08T00:00:00.000Z' })]);
    expect(r.promoted_trigger_id).toBe(77);
  });
});

describe('dogfood fix: an old story is never a new trigger; the same story links to its trigger', () => {
  const base = { id: 's1', url: 'https://supplychaindive.com/x', title: 'PepsiCo expanding autonomous truck use in its supply chain', account_name: 'PepsiCo', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, event_id: null, published_at: new Date('2026-06-11T00:00:00Z'), metadata: {} };
  const mk = (triggers: unknown[]) => {
    const r = { ...base };
    return { r, prisma: { gapSignal: { findUnique: vi.fn(async () => r), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(r, data)) }, pounceTrigger: { findUnique: vi.fn(), findMany: vi.fn(async () => triggers) } } };
  };

  it('a verified story from June is not promoted in September (it stays verified evidence)', async () => {
    const ingest = vi.fn();
    const { prisma } = mk([]);
    expect(await promoteSignal(prisma, 's1', { ingest, now: new Date('2026-09-28T00:00:00Z') })).toEqual({ ok: false, reason: 'not_recent' });
    expect(ingest).not.toHaveBeenCalled();
  });

  it('a story already a trigger on the account (another outlet) links to it: no second Slack ping, no second HubSpot note', async () => {
    const ingest = vi.fn();
    const { prisma, r } = mk([{ id: 16, title: 'PepsiCo expanding autonomous truck use across its supply chain with Gatik', published_at: new Date('2026-06-09T00:00:00Z'), first_seen_at: new Date('2026-07-03T00:00:00Z') }]);
    expect(await promoteSignal(prisma, 's1', { ingest, now: new Date('2026-06-12T00:00:00Z') })).toEqual({ ok: true, triggerId: 16, created: false });
    expect(ingest).not.toHaveBeenCalled();
    expect(r.promoted_trigger_id).toBe(16);
  });
});

describe('the processing pass', () => {
  it('retries an unreadable page and resolves the account from its title; follows up a shared link', async () => {
    const stuck = { id: 's1', url: 'https://supplychaindive.com/news/x', title: null, origin: 'casey_share', account_hint: null, metadata: { metaAttempts: 1, metaError: 'private host' } };
    const update = vi.fn(async () => ({}));
    const prisma = {
      gapSignal: { findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => (where.resolution === 'needs_account' ? [stuck] : [])), update, updateMany: update },
      account: { findMany: vi.fn(async () => [{ name: 'General Mills' }]) },
      gapAccountAlias: { findMany: vi.fn(async () => []) },
      canonicalAccountLink: { findMany: vi.fn(async () => []) },
    };
    const r = await processSignals(prisma, { now: NOW }, { fetchHtml: async () => '<meta property="og:title" content="General Mills plans supply chain revamp"><meta property="article:published_time" content="2026-07-02">' });
    expect(r).toMatchObject({ retried: 1, resolvedOnRetry: 1 });
    // Conditional: only a row still needing an account is overwritten (Casey's own assignment wins).
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1', resolution: 'needs_account' }, data: expect.objectContaining({ account_name: 'General Mills', resolution: 'resolved', research_status: 'queued', title: 'General Mills plans supply chain revamp' }) }));
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
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    };
    const r = await processSignals(prisma, { now: NOW });
    expect(r).toMatchObject({ clustered: 1, joinedEvents: 1 });
    expect(rows[0].event_id).toBe('b');
  });

  it('gives up on a page after 3 attempts', async () => {
    const update = vi.fn(async () => ({}));
    const stale = [{ id: 'r1', metadata: {} }, { id: 'r2', metadata: { researchAttempts: 2 } }];
    const prisma = {
      gapSignal: {
        findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
          where.resolution === 'needs_account' ? [{ id: 's1', url: 'https://x.com/a', title: null, origin: 'casey_share', account_hint: null, metadata: { metaAttempts: 3 } }] : where.research_status === 'researching' ? stale : [],
        ),
        update,
      },
    };
    const fetchHtml = vi.fn();
    const r = await processSignals(prisma, { now: NOW }, { fetchHtml });
    expect(r.retried).toBe(0);
    expect(fetchHtml).not.toHaveBeenCalled();
    // A run that died mid-flight never leaves a signal "researching"; each requeue counts, the third settles it.
    expect(r.requeued).toBe(2);
    expect(update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { research_status: 'queued', metadata: { researchAttempts: 1, researchError: 'research run did not finish (timed out)' } } });
    // Batch item 10 (R25): the third failed attempt is the dead letter, never "no usable fact".
    expect(update).toHaveBeenCalledWith({ where: { id: 'r2' }, data: { research_status: 'research_failed', metadata: { researchAttempts: 3, researchError: 'research run did not finish (timed out)', deadLetteredAt: NOW.toISOString() } } });
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
    expect(prisma.gapSignal.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['s1'] }, research_status: 'queued', account_name: 'PepsiCo' }, data: { research_status: 'researching' } });
    expect(prisma.gapSignal.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1' }, data: expect.objectContaining({ research_status: 'no_usable_fact', research_run_id: 'r1' }) }));
  });

  it('a failed research run puts the signal back in the queue (never stuck researching), then settles after 3 failures', async () => {
    const sigRow = { id: 's1', url: 'https://pepsico.com/n', title: 'x', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1', metadata: { researchAttempts: 2 } };
    const prisma = prismaWith([]);
    prisma.gapSignal.findMany = vi.fn().mockResolvedValueOnce([{ id: 's1', account_name: 'PepsiCo', origin: 'casey_share', title: 'x', created_at: NOW, published_at: null }]).mockResolvedValueOnce([sigRow]);
    await runBackgroundResearch(prisma, { now: NOW }, { ...emptyDeps, research: (async () => { throw new Error('gemini 503'); }) as never });
    // Batch item 10 (R25): three failures are a dead letter with its own status, never "no usable fact".
    expect(prisma.gapSignal.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { research_status: 'research_failed', metadata: { researchAttempts: 3, researchError: 'gemini 503', deadLetteredAt: NOW.toISOString() } } });
  });
});

describe('review B P1s', () => {
  const sig = { id: 's1', url: 'https://news.example/acme-invests', title: 'Acme invests $50 million in new distribution center in Reno', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1' };

  it('an unrelated fact sharing only generic words (or a different kind of change) never marks the signal', () => {
    expect(factMatchesSignal({ url: 'https://x.com/1', excerpt: 'Acme will close its Memphis distribution center, a $20 million facility.' }, sig, 'Acme')).toBe(false);
    expect(factMatchesSignal({ url: 'https://x.com/2', excerpt: 'Acme opened a new distribution center in Reno, Nevada, a $50 million investment.' }, sig, 'Acme')).toBe(true);
  });

  it('same direction but only generic words shared: not the same story', () => {
    expect(factMatchesSignal({ url: 'https://x.com/3', excerpt: 'Acme will open a new $30 million distribution center in Ohio.' }, sig, 'Acme')).toBe(false);
  });

  it('opposite direction at the same place: not the same story', () => {
    const opening = { ...sig, title: 'Acme opens Reno Nevada distribution center' };
    expect(factMatchesSignal({ url: 'https://x.com/4', excerpt: 'Acme will close its Reno, Nevada distribution center next year.' }, opening, 'Acme')).toBe(false);
    expect(factMatchesSignal({ url: 'https://x.com/5', excerpt: 'Acme will open its Reno, Nevada distribution center next year.' }, opening, 'Acme')).toBe(true);
  });

  it('a stale verified fact is never FACT READY (so it can never be promoted as a fresh trigger)', async () => {
    const rows: Record<string, Record<string, unknown>> = { s1: { metadata: {} } };
    const prisma = { gapSignal: { findUnique: vi.fn(async () => rows.s1), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(rows.s1, data)) } };
    const stale = { signalId: 'f1', evidenceRecordId: 'e1', excerpt: 'x', url: sig.url, title: 't', publishedAt: '2023-01-01', retrievedAt: '', provider: 'signal' as const, type: 'news' as never, change: 'opening' as never, fresh: false };
    const out = await settleSignals(prisma, { signals: [sig], accountName: 'Acme', result: { runId: 'r', outcome: 'insufficient_evidence', facts: [stale], rejected: [], conflicts: [], notes: [] }, now: NOW });
    expect(out[0].status).toBe('no_usable_fact');
    expect((rows.s1.metadata as { research: { staleMatches: number } }).research.staleMatches).toBe(1);
  });

  // Batch item 10 (R25): a run whose provider did not answer settled every signal as "no usable fact".
  it('a run whose provider did not answer is a failed attempt (requeued, then the dead letter), never "no usable fact"; the dead letter has its own label', async () => {
    const rows: Record<string, Record<string, unknown>> = { s1: { metadata: {}, research_status: 'researching', account_name: 'Acme' } };
    const prisma = { gapSignal: { findUnique: vi.fn(async () => rows.s1), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(rows.s1, data)) } };
    const down = { runId: 'r', outcome: 'provider_unavailable' as const, facts: [], rejected: [], conflicts: [], notes: [] };
    expect((await settleSignals(prisma, { signals: [sig], accountName: 'Acme', result: down as never, now: NOW }))[0].status).toBe('queued');
    expect(rows.s1).toMatchObject({ research_status: 'queued', metadata: { researchAttempts: 1, researchError: 'the research provider did not answer' } });
    rows.s1.research_status = 'researching';
    rows.s1.metadata = { researchAttempts: 2 };
    expect((await settleSignals(prisma, { signals: [sig], accountName: 'Acme', result: down as never, now: NOW }))[0].status).toBe('research_failed');
    expect(rows.s1).toMatchObject({ research_status: 'research_failed', metadata: { researchAttempts: 3, deadLetteredAt: NOW.toISOString() } });
    expect(signalStatus({ url: sig.url, resolution: 'resolved', research_status: 'research_failed', feedback: null })).toEqual({ status: 'Research failed', detail: 'Research failed three times (the provider did not answer, or the run did not finish). This is not "nothing usable": press Research to try again.' });
    expect(signalStatus({ url: sig.url, resolution: 'resolved', research_status: 'no_usable_fact', feedback: null }).status).toBe('Nothing usable');
  });

  it('one event is promoted once, whichever source verified', async () => {
    const r = { id: 's2', url: 'https://b.com/x', title: 'Acme opens Reno distribution center', account_name: 'Acme', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, published_at: NOW, event_id: 'e1' };
    const ingest = vi.fn();
    const prisma = { gapSignal: { findUnique: vi.fn(async () => r), findFirst: vi.fn(async () => ({ id: 's1' })), update: vi.fn() }, pounceTrigger: { findUnique: vi.fn() } };
    expect(await promoteSignal(prisma, 's2', { ingest })).toEqual({ ok: false, reason: 'already_promoted' });
    expect(ingest).not.toHaveBeenCalled();
  });
});

describe('final review P0/P1s', () => {
  it('a settle never lands on a signal reassigned (or un-resolved) while research ran', async () => {
    const rows: Record<string, Record<string, unknown>> = { s1: { metadata: {}, account_name: 'Frito-Lay', research_status: 'researching' } };
    const prisma = { gapSignal: { findUnique: vi.fn(async () => rows.s1), update: vi.fn() } };
    const sig = { id: 's1', url: 'https://x.com/a', title: 'PepsiCo opens Reno Nevada DC', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1' };
    const fact = { signalId: 'f1', evidenceRecordId: 'e1', excerpt: 'x', url: 'https://x.com/a', title: 't', publishedAt: '', retrievedAt: '', provider: 'signal' as const, type: 'news' as never, change: 'opening' as never, fresh: true };
    const out = await settleSignals(prisma, { signals: [sig], accountName: 'PepsiCo', result: { runId: 'r', outcome: 'evidence_found', facts: [fact], rejected: [], conflicts: [], notes: [] }, now: NOW });
    expect(out[0].status).toBe('no_usable_fact');
    expect(prisma.gapSignal.update).not.toHaveBeenCalled();
  });

  it('only the verified excerpt credits a fact: an echoed provider title never does', () => {
    const sig = { id: 's1', url: 'https://x.com/a', title: 'Acme to build automated cold storage DC in Fort Worth', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: 's1' };
    expect(factMatchesSignal({ url: 'https://y.com/b', excerpt: 'Acme opened a new distribution center in Reno.', title: 'Acme to build automated cold storage DC in Fort Worth' }, sig, 'Acme')).toBe(false);
  });

  it('signal pages are read within a budget (a run never reads unbounded pages)', async () => {
    const sigs = [1, 2, 3, 4, 5].map((i) => ({ id: `s${i}`, url: `https://x.com/${i}`, title: 't', published_at: NOW, source_class: 'news', resolution_basis: null, event_id: `s${i}` }));
    const fetchHtml = vi.fn(async () => '<p>Acme will open a new distribution center in Reno.</p>');
    const r = await signalCandidates(sigs, { fetchHtml });
    expect(fetchHtml).toHaveBeenCalledTimes(3);
    expect(r.note).toMatch(/page budget/);
  });
});

