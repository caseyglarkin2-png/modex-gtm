import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import type { BuildCandidate, BuildInput, BuildResult } from '@/lib/gap/hypothesis/build';
import type { HypothesizeReport } from '@/lib/gap/hypothesis/hypothesize';

// ---------------------------------------------------------------------------
// Module mocks (hoisted). The route tests need runHypothesize, the cron
// helpers and prisma under control; the job tests import the real job via
// vi.importActual below so the same file can exercise both layers.
// ---------------------------------------------------------------------------

const mockedRun = vi.fn<(...args: any[]) => Promise<HypothesizeReport>>();
const mockedClaim = vi.fn<(...args: any[]) => Promise<{ claimed: boolean; reason?: string; key: string }>>();
const mockedRelease = vi.fn<(...args: any[]) => Promise<void>>(async () => undefined);
const mockedStarted = vi.fn(async () => undefined);
const mockedSuccess = vi.fn(async () => undefined);
const mockedSkipped = vi.fn(async () => undefined);
const mockedFailure = vi.fn(async () => undefined);

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-idempotency', () => ({
  claimDailyRun: mockedClaim,
  releaseDailyRun: mockedRelease,
}));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedStarted,
  markCronSuccess: mockedSuccess,
  markCronSkipped: mockedSkipped,
  markCronFailure: mockedFailure,
}));
vi.mock('@/lib/gap/hypothesis/hypothesize', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/hypothesis/hypothesize')>();
  return { ...actual, runHypothesize: mockedRun };
});

const jobModule = await vi.importActual<typeof import('@/lib/gap/hypothesis/hypothesize')>(
  '@/lib/gap/hypothesis/hypothesize',
);
const { runHypothesize, personaKeyFor } = jobModule;
const { GET } = await import('@/app/api/cron/gap-hypothesize/route');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-09-23T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const ACCOUNT = 'Acme Logistics';

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function trigger(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 101,
    url_hash: 'h101',
    account_slug: 'acme-logistics',
    account_name: ACCOUNT,
    title: 'Acme opens second distribution center in Ohio',
    url: 'https://example.com/acme-ohio',
    source: 'news',
    score: 8,
    categories: ['expansion'],
    published_at: new Date(NOW.getTime() - 3 * DAY_MS),
    first_seen_at: new Date(NOW.getTime() - 2 * DAY_MS),
    hubspot_company_id: 'hs-acme',
    dismissed: false,
    ...overrides,
  };
}

function persona(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    account_name: ACCOUNT,
    name: 'Pat Plant',
    title: 'Plant Manager',
    persona_lane: null,
    function: null,
    seniority: 'Manager',
    email: 'pat@acme.example',
    email_valid: true,
    do_not_contact: false,
    is_contact_ready: true,
    ...overrides,
  };
}

function candidate(overrides: Partial<BuildCandidate> = {}): BuildCandidate {
  return {
    accountName: ACCOUNT,
    personaId: 1,
    persona: 'site_ops',
    problemFamily: 'hidden_capacity',
    secondaryFamilies: [],
    observation: 'Acme opens second distribution center in Ohio [S:sig_101].',
    problemHypothesis: 'My guess is that physical handoffs constrain production capacity at Acme Logistics.',
    rootCauseHypotheses: ['Gate waiting'],
    impactHypotheses: ['Fewer turns'],
    whyNow: 'Signals observed 3 days ago: Acme opens second distribution center in Ohio',
    falsificationQuestions: ['How many trailers are waiting at the gate at your busiest hour?'],
    whatANoMeans: 'If gate and dock handoffs are already measured and slack, this family is closed.',
    signalIds: ['sig_101'],
    primarySignalId: 'sig_101',
    confidence: 42,
    expiresAt: new Date(NOW.getTime() + 30 * DAY_MS),
    provenance: { builder: 'gap-builder-v1', familyHits: { hidden_capacity: 1 } },
    ...overrides,
  };
}

/** Hand-rolled prisma covering exactly the delegates the job reads. */
function makePrisma(rows: { triggers?: unknown[]; personas?: unknown[]; open?: unknown[] } = {}) {
  return {
    pounceTrigger: { findMany: asyncSpy(async () => rows.triggers ?? []) },
    persona: { findMany: asyncSpy(async () => rows.personas ?? []) },
    prospectingHypothesis: { findMany: asyncSpy(async () => rows.open ?? []) },
  };
}

function makeDeps(candidates: BuildCandidate[] = [candidate()], skipped: BuildResult['skipped'] = []) {
  let nextId = 0;
  const registerSignal = asyncSpy(async (_prisma: unknown, input: { sourceId: string }) => ({
    created: true,
    id: `sig_${input.sourceId}`,
  }));
  const proposeHypothesis = asyncSpy(async () => ({ ok: true as const, id: `hyp_${++nextId}`, status: 'draft' as const }));
  const buildCandidates = vi.fn<(input: BuildInput) => BuildResult>(() => ({ candidates, skipped }));
  return { registerSignal, proposeHypothesis, buildCandidates };
}

// ---------------------------------------------------------------------------
// The job
// ---------------------------------------------------------------------------

describe('runHypothesize (job)', () => {
  it('registers every non-dismissed trigger in the window as a signal, one registerSignal call per trigger', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 101 }), trigger({ id: 102, title: 'Acme adds automation to Ohio DC', categories: ['autonomy'] })],
      personas: [persona()],
    });
    const deps = makeDeps();

    const report = await runHypothesize(prisma, { now: NOW, lookbackDays: 30 }, deps);

    expect(deps.registerSignal).toHaveBeenCalledTimes(2);
    expect(deps.registerSignal.mock.calls[0][1]).toMatchObject({
      sourceKind: 'pounce_trigger',
      sourceId: '101',
      accountName: ACCOUNT,
      registeredBy: 'cron:gap-hypothesize',
    });
    expect(deps.registerSignal.mock.calls[1][1]).toMatchObject({ sourceKind: 'pounce_trigger', sourceId: '102' });
    expect(report.triggersSeen).toBe(2);
    expect(report.accountsScanned).toBe(1);
    expect(report.signals).toEqual({ created: 2, existing: 0, refused: 0 });

    // The window and the dismissed filter reach the query.
    const where = prisma.pounceTrigger.findMany.mock.calls[0][0].where;
    expect(where.dismissed).toBe(false);
    expect(where.first_seen_at.gte.toISOString()).toBe(new Date(NOW.getTime() - 30 * DAY_MS).toISOString());
  });

  it('hands the builder the registered signal ids and the contact-ready personas with a mapped persona key', async () => {
    const prisma = makePrisma({
      triggers: [trigger()],
      personas: [persona({ id: 1, title: 'Plant Manager' }), persona({ id: 2, title: 'VP Supply Chain', email: 'vp@acme.example' })],
    });
    const deps = makeDeps();

    await runHypothesize(prisma, { now: NOW }, deps);

    const input = deps.buildCandidates.mock.calls[0][0];
    expect(input.accountName).toBe(ACCOUNT);
    expect(input.now).toBe(NOW);
    expect(input.signals).toHaveLength(1);
    expect(input.signals[0]).toMatchObject({
      id: 'sig_101',
      type: 'new_site',
      title: 'Acme opens second distribution center in Ohio',
      evidenceUrl: 'https://example.com/acme-ohio',
      confidence: 80,
      pounceCategories: ['expansion'],
    });
    expect(input.personas).toEqual([
      { id: 1, personaKey: 'site_ops', name: 'Pat Plant', title: 'Plant Manager', doNotContact: false, emailValid: true },
      { id: 2, personaKey: 'supply_chain', name: 'Pat Plant', title: 'VP Supply Chain', doNotContact: false, emailValid: true },
    ]);

    const personaWhere = prisma.persona.findMany.mock.calls[0][0].where;
    expect(personaWhere).toMatchObject({ account_name: ACCOUNT, is_contact_ready: true, do_not_contact: false });
  });

  it('proposes each candidate as a draft with the cron actor and pounce provenance', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate()]);

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(deps.proposeHypothesis).toHaveBeenCalledTimes(1);
    expect(deps.proposeHypothesis.mock.calls[0][0]).toBe(prisma);
    expect(deps.proposeHypothesis.mock.calls[0][1]).toMatchObject({
      accountName: ACCOUNT,
      primaryPersonaId: 1,
      persona: 'site_ops',
      problemFamily: 'hidden_capacity',
      signalIds: ['sig_101'],
      primarySignalId: 'sig_101',
      sourceRef: null,
      createdBy: 'cron:gap-hypothesize',
      metadata: { builder: { builder: 'gap-builder-v1', familyHits: { hidden_capacity: 1 } }, source: 'pounce' },
    });
    expect(report.proposed).toBe(1);
    expect(report.candidates).toBe(1);
  });

  it('skips a candidate whose (persona, family) already has an open hypothesis and never proposes it', async () => {
    const prisma = makePrisma({
      triggers: [trigger()],
      personas: [persona()],
      open: [{ primary_persona_id: 1, problem_family: 'hidden_capacity', status: 'review_required' }],
    });
    const deps = makeDeps([candidate(), candidate({ problemFamily: 'driver_gate_scale' })]);

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.skippedOpen).toBe(1);
    expect(report.proposed).toBe(1);
    expect(deps.proposeHypothesis).toHaveBeenCalledTimes(1);
    expect(deps.proposeHypothesis.mock.calls[0][1].problemFamily).toBe('driver_gate_scale');

    const openWhere = prisma.prospectingHypothesis.findMany.mock.calls[0][0].where;
    expect(openWhere).toMatchObject({
      account_name: ACCOUNT,
      status: { in: ['draft', 'review_required', 'approved', 'active'] },
    });
  });

  it('dryRun counts everything but never calls proposeHypothesis', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate(), candidate({ problemFamily: 'driver_gate_scale' })]);

    const report = await runHypothesize(prisma, { now: NOW, dryRun: true }, deps);

    expect(deps.proposeHypothesis).not.toHaveBeenCalled();
    expect(report.dryRun).toBe(true);
    expect(report.candidates).toBe(2);
    expect(report.proposed).toBe(0);
    expect(report.signals.created).toBe(1);
  });

  it('counts a refused propose under its reason', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate()]);
    deps.proposeHypothesis.mockResolvedValueOnce({ ok: false, reason: 'duplicate_source_ref', existingId: 'hyp_old' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.proposed).toBe(0);
    expect(report.refused).toEqual({ duplicate_source_ref: 1 });
  });

  it('counts adapter refusals and build skips by reason, and existing signals separately from created', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 101 }), trigger({ id: 102, url: '   ' })],
      personas: [persona()],
    });
    const deps = makeDeps([], [{ personaId: 1, reason: 'persona_not_relevant' }, { signalId: 'sig_101', reason: 'signal_expired' }, { personaId: 1, reason: 'persona_not_relevant' }]);
    deps.registerSignal.mockResolvedValueOnce({ created: false, id: 'sig_101' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.signals).toEqual({ created: 0, existing: 1, refused: 1 });
    expect(report.buildSkipped).toEqual({ persona_not_relevant: 2, signal_expired: 1 });
    expect(report.candidates).toBe(0);
  });

  it('caps distinct accounts at maxAccounts, keeping the highest-scoring accounts', async () => {
    const prisma = makePrisma({
      triggers: [
        trigger({ id: 1, account_name: 'Alpha', score: 9 }),
        trigger({ id: 2, account_name: 'Beta', score: 7 }),
        trigger({ id: 3, account_name: 'Alpha', score: 5 }),
        trigger({ id: 4, account_name: 'Gamma', score: 3 }),
      ],
      personas: [],
    });
    const deps = makeDeps([]);

    const report = await runHypothesize(prisma, { now: NOW, maxAccounts: 2 }, deps);

    expect(report.accountsScanned).toBe(2);
    expect(report.triggersSeen).toBe(3);
    expect(deps.buildCandidates.mock.calls.map((call) => call[0].accountName)).toEqual(['Alpha', 'Beta']);
    expect(prisma.pounceTrigger.findMany.mock.calls[0][0].orderBy).toEqual([{ score: 'desc' }, { first_seen_at: 'desc' }]);
  });

  it('returns the exact report shape', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate()]);

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report).toEqual({
      accountsScanned: 1,
      triggersSeen: 1,
      signals: { created: 1, existing: 0, refused: 0 },
      candidates: 1,
      proposed: 1,
      skippedOpen: 0,
      refused: {},
      buildSkipped: {},
      dryRun: false,
    });
  });
});

describe('personaKeyFor', () => {
  it('maps lane or title keywords onto the nine personas, defaulting to executive_ops', () => {
    expect(personaKeyFor(null, 'SVP, Purchasing & Supply Chain')).toBe('supply_chain');
    expect(personaKeyFor('Logistics', 'Director')).toBe('transportation');
    expect(personaKeyFor(null, 'Director of Transportation')).toBe('transportation');
    expect(personaKeyFor(null, 'Plant Manager')).toBe('site_ops');
    expect(personaKeyFor(null, 'VP Operations')).toBe('site_ops');
    expect(personaKeyFor(null, 'VP Manufacturing')).toBe('site_ops');
    expect(personaKeyFor(null, 'Head of Automation Engineering')).toBe('automation');
    expect(personaKeyFor(null, 'CIO')).toBe('technology');
    expect(personaKeyFor(null, 'VP IT Infrastructure')).toBe('technology');
    expect(personaKeyFor(null, 'CFO')).toBe('finance_procurement');
    expect(personaKeyFor(null, 'Chief Procurement Officer')).toBe('finance_procurement');
    expect(personaKeyFor(null, 'VP Distribution')).toBe('distribution');
    expect(personaKeyFor(null, 'Warehouse Director')).toBe('distribution');
    expect(personaKeyFor(null, 'DC General Manager')).toBe('distribution');
    expect(personaKeyFor(null, 'Director of Security')).toBe('security');
    expect(personaKeyFor(null, 'Chief Executive Officer')).toBe('executive_ops');
    expect(personaKeyFor(null, null)).toBe('executive_ops');
  });

  it('does not read the letters "it" or "dc" inside a word as a function', () => {
    expect(personaKeyFor(null, 'Chief Editor of Fitness')).toBe('executive_ops');
    expect(personaKeyFor(null, 'Head of Broadcast')).toBe('executive_ops');
  });
});

// ---------------------------------------------------------------------------
// The route
// ---------------------------------------------------------------------------

const REPORT: HypothesizeReport = {
  accountsScanned: 1,
  triggersSeen: 2,
  signals: { created: 2, existing: 0, refused: 0 },
  candidates: 1,
  proposed: 1,
  skippedOpen: 0,
  refused: {},
  buildSkipped: {},
  dryRun: false,
};

function makeReq(opts: { headers?: Record<string, string>; url?: string } = {}) {
  return new NextRequest(opts.url ?? 'http://localhost/api/cron/gap-hypothesize', {
    method: 'GET',
    headers: opts.headers ?? {},
  });
}

describe('GET /api/cron/gap-hypothesize (route)', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'shh';
    process.env.GAP_OS_ENABLED = '1';
    process.env.GAP_HYPOTHESIS_ENABLED = '1';
    mockedClaim.mockResolvedValue({ claimed: true, key: 'cron-run:gap-hypothesize:2026-09-23' });
    mockedRun.mockResolvedValue(REPORT);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('rejects an unauthenticated call with 401 and runs nothing', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockedRun).not.toHaveBeenCalled();
    expect(mockedStarted).not.toHaveBeenCalled();
  });

  it('answers 200 with the skip payload when GAP_OS_ENABLED is off and never runs the job', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedRun).not.toHaveBeenCalled();
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedSkipped).toHaveBeenCalledTimes(1);
  });

  it('names GAP_HYPOTHESIS_ENABLED when only that flag is off', async () => {
    process.env.GAP_HYPOTHESIS_ENABLED = '0';
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_HYPOTHESIS_ENABLED=false' });
    expect(mockedRun).not.toHaveBeenCalled();
  });

  it('a scheduled Bearer call claims the day, runs for real and returns the report', async () => {
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...REPORT, mode: 'apply' });
    expect(mockedClaim).toHaveBeenCalledWith('gap-hypothesize', expect.any(Date));
    expect(mockedRun).toHaveBeenCalledTimes(1);
    expect(mockedRun.mock.calls[0][0]).toEqual({ __tag: 'route-prisma' });
    expect(mockedRun.mock.calls[0][1]).toMatchObject({ dryRun: false, lookbackDays: 30, maxAccounts: 50 });
    expect(mockedSuccess).toHaveBeenCalledTimes(1);
  });

  it('a manual ?secret= call defaults to dry run and does not consume the daily claim', async () => {
    mockedRun.mockResolvedValue({ ...REPORT, proposed: 0, dryRun: true });
    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?secret=shh' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'dryrun', dryRun: true });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedRun.mock.calls[0][1]).toMatchObject({ dryRun: true });
  });

  it('?dryRun=1 forces a dry run even on a scheduled call', async () => {
    await GET(makeReq({ headers: { authorization: 'Bearer shh' }, url: 'http://localhost/api/cron/gap-hypothesize?dryRun=1' }));
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedRun.mock.calls[0][1]).toMatchObject({ dryRun: true });
  });

  it('a manual ?mode=apply call is idempotent per day: a second call the same day skips', async () => {
    mockedClaim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?secret=shh&mode=apply' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'already-ran-today' });
    expect(mockedRun).not.toHaveBeenCalled();
  });

  it('?force=1 bypasses the daily claim only after the secret matched', async () => {
    mockedClaim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const denied = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?force=1&mode=apply' }));
    expect(denied.status).toBe(401);
    expect(mockedRun).not.toHaveBeenCalled();

    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?secret=shh&force=1&mode=apply' }));
    expect(res.status).toBe(200);
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedRun).toHaveBeenCalledTimes(1);
    expect(mockedRun.mock.calls[0][1]).toMatchObject({ dryRun: false });
  });

  it('passes lookbackDays and maxAccounts through from the query, clamped to sane bounds', async () => {
    await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?secret=shh&lookbackDays=7&maxAccounts=5' }));
    expect(mockedRun.mock.calls[0][1]).toMatchObject({ lookbackDays: 7, maxAccounts: 5 });
    await GET(makeReq({ url: 'http://localhost/api/cron/gap-hypothesize?secret=shh&lookbackDays=0&maxAccounts=99999' }));
    expect(mockedRun.mock.calls[1][1]).toMatchObject({ lookbackDays: 1, maxAccounts: 500 });
  });

  it('releases the daily claim and answers 500 when the job throws', async () => {
    mockedRun.mockRejectedValueOnce(new Error('db down'));
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'db down' });
    expect(mockedRelease).toHaveBeenCalledWith('gap-hypothesize', expect.any(Date));
    expect(mockedFailure).toHaveBeenCalledTimes(1);
  });
});
