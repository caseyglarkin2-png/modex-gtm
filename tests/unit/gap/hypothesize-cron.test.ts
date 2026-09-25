import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import type { BuildCandidate, BuildInput, BuildResult } from '@/lib/gap/hypothesis/build';
import type { HypothesizeReport } from '@/lib/gap/hypothesis/hypothesize';
import type { IdentityInput, ResolveIdentityResult } from '@/lib/gap/identity/resolve';
import { HYPOTHESIS_TERMINAL_STATUSES } from '@/lib/gap/taxonomy';

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
const { runHypothesize, personaKeyFor, pounceSourceRef } = jobModule;
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
  const loadIdentityContext = asyncSpy(async () => ({
    accountsByHubspotCompanyId: new Map(),
    verifiedDomainToAccounts: new Map(),
    aliasToAccounts: new Map(),
    accountNames: [],
  }));
  // Default: identity passthrough (every raw trigger name resolves to
  // itself via the normalized tier), so the existing behavioral tests below
  // need not know about 6A. Tests that exercise identity resolution itself
  // override resolveIdentity per case.
  const resolveIdentity = vi.fn((_ctx: unknown, input: IdentityInput): ResolveIdentityResult => ({
    ok: true,
    accountName: (input.rawName ?? '').trim(),
    via: 'normalized',
    confidence: 100,
  }));
  const registerAlias = asyncSpy(async () => ({ created: true, id: 'alias_new' }));
  const audit = asyncSpy(async () => ({ stored: true, reviewQueued: false }));
  return { registerSignal, proposeHypothesis, buildCandidates, loadIdentityContext, resolveIdentity, registerAlias, audit };
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
      sourceRef: expect.stringMatching(/^pounce:Acme Logistics:1:hidden_capacity:[0-9a-f]{12}$/),
      createdBy: 'cron:gap-hypothesize',
      metadata: { builder: { builder: 'gap-builder-v1', familyHits: { hidden_capacity: 1 } }, source: 'pounce' },
    });
    expect(report.proposed).toBe(1);
    expect(report.candidates).toBe(1);
  });

  it('gives every proposal a deterministic sourceRef that is stable across runs and changes only with the signal set', async () => {
    const deps1 = makeDeps([candidate({ signalIds: ['sig_101', 'sig_102'] })]);
    const deps2 = makeDeps([candidate({ signalIds: ['sig_102', 'sig_101'] })]);
    await runHypothesize(makePrisma({ triggers: [trigger()], personas: [persona()] }), { now: NOW }, deps1);
    await runHypothesize(makePrisma({ triggers: [trigger()], personas: [persona()] }), { now: new Date(NOW.getTime() + DAY_MS) }, deps2);

    const ref1 = deps1.proposeHypothesis.mock.calls[0][1].sourceRef;
    const ref2 = deps2.proposeHypothesis.mock.calls[0][1].sourceRef;
    expect(ref1).toBe(ref2);
    expect(ref1).toBe(pounceSourceRef(ACCOUNT, 1, 'hidden_capacity', ['sig_101', 'sig_102']));
    expect(ref1).toMatch(/^pounce:Acme Logistics:1:hidden_capacity:[0-9a-f]{12}$/);

    // A new signal, a different persona or a different family each yield a different ref.
    expect(pounceSourceRef(ACCOUNT, 1, 'hidden_capacity', ['sig_101', 'sig_102', 'sig_103'])).not.toBe(ref1);
    expect(pounceSourceRef(ACCOUNT, 2, 'hidden_capacity', ['sig_101', 'sig_102'])).not.toBe(ref1);
    expect(pounceSourceRef(ACCOUNT, 1, 'driver_gate_scale', ['sig_101', 'sig_102'])).not.toBe(ref1);
  });

  it('counts a duplicate_source_ref refusal as existing, not refused: the day-two re-run is a no-op', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate()]);
    deps.proposeHypothesis.mockResolvedValueOnce({ ok: false, reason: 'duplicate_source_ref', existingId: 'hyp_old' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.proposed).toBe(0);
    expect(report.existing).toBe(1);
    expect(report.refused).toEqual({});
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
      status: { in: ['draft', 'review_required', 'approved', 'active', ...HYPOTHESIS_TERMINAL_STATUSES] },
    });
    expect(prisma.prospectingHypothesis.findMany.mock.calls[0][0].select).toMatchObject({
      status: true,
      signals: { select: { signal_id: true } },
    });
  });

  it('an open row with the same family and no persona (an import draft) blocks every persona', async () => {
    const prisma = makePrisma({
      triggers: [trigger()],
      personas: [persona({ id: 1 }), persona({ id: 2, email: 'two@acme.example' })],
      open: [{ primary_persona_id: null, problem_family: 'hidden_capacity', status: 'draft' }],
    });
    const deps = makeDeps([candidate({ personaId: 1 }), candidate({ personaId: 2 }), candidate({ personaId: 2, problemFamily: 'driver_gate_scale' })]);

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.skippedOpen).toBe(2);
    expect(report.proposed).toBe(1);
    expect(deps.proposeHypothesis.mock.calls[0][1].problemFamily).toBe('driver_gate_scale');
  });

  it('skips a candidate whose (persona, family) has a terminal hypothesis linked to a superset of its signals', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 101 }), trigger({ id: 102, title: 'Acme adds automation to Ohio DC', categories: ['autonomy'] })],
      personas: [persona()],
      open: [
        // Withdrawn on the same two signals: the equal case blocks.
        { primary_persona_id: 1, problem_family: 'hidden_capacity', status: 'rejected', signals: [{ signal_id: 'sig_101' }, { signal_id: 'sig_102' }] },
        // Resolved on a strict superset: still blocks (nothing new since).
        { primary_persona_id: 1, problem_family: 'driver_gate_scale', status: 'confirmed', signals: [{ signal_id: 'sig_101' }, { signal_id: 'sig_102' }, { signal_id: 'sig_099' }] },
        // Expired on a strict subset: the candidate carries a new signal, so it goes through.
        { primary_persona_id: 1, problem_family: 'yard_state_integrity', status: 'expired', signals: [{ signal_id: 'sig_101' }] },
        // A terminal row for another persona never blocks this one.
        { primary_persona_id: 2, problem_family: 'cost_to_ship', status: 'unresolved', signals: [{ signal_id: 'sig_101' }, { signal_id: 'sig_102' }] },
      ],
    });
    const deps = makeDeps([
      candidate({ problemFamily: 'hidden_capacity', signalIds: ['sig_101', 'sig_102'] }),
      candidate({ problemFamily: 'driver_gate_scale', signalIds: ['sig_101', 'sig_102'] }),
      candidate({ problemFamily: 'yard_state_integrity', signalIds: ['sig_101', 'sig_102'] }),
      candidate({ problemFamily: 'cost_to_ship', signalIds: ['sig_101', 'sig_102'] }),
    ]);

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.skippedResolved).toBe(2);
    expect(report.skippedOpen).toBe(0);
    expect(report.proposed).toBe(2);
    expect(deps.proposeHypothesis.mock.calls.map((call) => call[1].problemFamily)).toEqual(['yard_state_integrity', 'cost_to_ship']);
  });

  it('a throwing account is counted and named, and the run continues to the next account', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 1, account_name: 'Ghost Freight', score: 9 }), trigger({ id: 2, account_name: 'Beta', score: 7 })],
      personas: [persona({ account_name: 'Beta' })],
    });
    const deps = makeDeps([candidate({ accountName: 'Beta' })]);
    class ForeignKeyViolation extends Error {
      constructor() {
        super('Foreign key constraint violated: prospecting_signals_account_name_fkey');
        this.name = 'PrismaClientKnownRequestError';
      }
    }
    deps.registerSignal.mockImplementationOnce(async () => {
      throw new ForeignKeyViolation();
    });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.errors).toEqual(['Ghost Freight']);
    expect(report.refused).toEqual({ PrismaClientKnownRequestError: 1 });
    expect(report.accountsScanned).toBe(2);
    expect(deps.buildCandidates).toHaveBeenCalledTimes(1);
    expect(deps.buildCandidates.mock.calls[0][0].accountName).toBe('Beta');
    expect(report.proposed).toBe(1);
  });

  it('a plain Error from an account is keyed account_error', async () => {
    const prisma = makePrisma({ triggers: [trigger()], personas: [persona()] });
    const deps = makeDeps([candidate()]);
    deps.registerSignal.mockRejectedValueOnce(new Error('boom'));

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.refused).toEqual({ account_error: 1 });
    expect(report.errors).toEqual([ACCOUNT]);
    expect(report.proposed).toBe(0);
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
    deps.proposeHypothesis.mockResolvedValueOnce({ ok: false, reason: 'observation_uncited' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.proposed).toBe(0);
    expect(report.existing).toBe(0);
    expect(report.refused).toEqual({ observation_uncited: 1 });
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
      identity: { resolved: 1, aliasesRegistered: 0, conflicts: 0, refused: {} },
      signals: { created: 1, existing: 0, refused: 0 },
      candidates: 1,
      proposed: 1,
      existing: 0,
      skippedOpen: 0,
      skippedResolved: 0,
      refused: {},
      buildSkipped: {},
      errors: [],
      dryRun: false,
    });
  });
});

// ---------------------------------------------------------------------------
// 6A: identity resolution wired into the job. Sprint 1-5 tests above exercise
// hypothesizeAccount's own logic with a passthrough resolver; these exercise
// runHypothesize's NEW pre-grouping resolution step itself: refusal is
// counted and skips the trigger (never reaches registerSignal, so it can
// never throw the FK violation the old raw-name grouping could), a tier
// conflict is audited, and a normalized-tier resolution is cached as an alias.
// ---------------------------------------------------------------------------

describe('runHypothesize identity resolution (6A)', () => {
  it('the headline acceptance case: "Niagara Bottling, Llc" resolves and is grouped under the canonical account, never thrown as an FK violation', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 201, account_name: 'Niagara Bottling, Llc' })],
      personas: [persona({ account_name: 'Niagara Bottling' })],
    });
    const deps = makeDeps([candidate({ accountName: 'Niagara Bottling' })]);
    deps.resolveIdentity.mockReturnValue({
      ok: true,
      accountName: 'Niagara Bottling',
      via: 'normalized',
      confidence: 70,
    });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.identity).toEqual({ resolved: 1, aliasesRegistered: 1, conflicts: 0, refused: {} });
    expect(report.errors).toEqual([]);
    expect(deps.registerSignal.mock.calls[0][1]).toMatchObject({ accountName: 'Niagara Bottling' });
    expect(deps.buildCandidates.mock.calls[0][0].accountName).toBe('Niagara Bottling');
    expect(deps.registerAlias).toHaveBeenCalledWith(prisma, {
      alias: 'Niagara Bottling, Llc',
      accountName: 'Niagara Bottling',
      source: 'hypothesize_cron',
      createdBy: 'cron:gap-hypothesize',
    });
  });

  it('a genuinely unknown company is refused unresolved_company, skipped, and never reaches registerSignal', async () => {
    const prisma = makePrisma({ triggers: [trigger({ id: 202, account_name: 'Nobody Has Heard Of This Co' })] });
    const deps = makeDeps();
    deps.resolveIdentity.mockReturnValue({ ok: false, reason: 'unresolved_company' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.identity).toEqual({ resolved: 0, aliasesRegistered: 0, conflicts: 0, refused: { unresolved_company: 1 } });
    expect(report.accountsScanned).toBe(0);
    expect(report.errors).toEqual([]);
    expect(deps.registerSignal).not.toHaveBeenCalled();
  });

  it('an ambiguous collision is refused ambiguous_identity and skipped', async () => {
    const prisma = makePrisma({ triggers: [trigger({ id: 203, account_name: 'Acme Corp' })] });
    const deps = makeDeps();
    deps.resolveIdentity.mockReturnValue({ ok: false, reason: 'ambiguous_identity' });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.identity.refused).toEqual({ ambiguous_identity: 1 });
    expect(deps.registerSignal).not.toHaveBeenCalled();
  });

  it('a company-id/domain conflict with a name-derived candidate is audited, never silently dropped, and the higher tier still wins', async () => {
    const prisma = makePrisma({
      triggers: [trigger({ id: 204, account_name: 'Wrong Guess Inc', hubspot_company_id: 'hs-real' })],
      personas: [persona({ account_name: 'Real Account' })],
    });
    const deps = makeDeps([candidate({ accountName: 'Real Account' })]);
    deps.resolveIdentity.mockReturnValue({
      ok: true,
      accountName: 'Real Account',
      via: 'hubspot_company_id',
      confidence: 100,
      conflict: { via: 'normalized', accountName: 'Wrong Guess Inc' },
    });

    const report = await runHypothesize(prisma, { now: NOW }, deps);

    expect(report.identity.conflicts).toBe(1);
    expect(deps.audit).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        kind: 'identity.conflict',
        subjectType: 'pounce_trigger',
        subjectId: '204',
        payload: expect.objectContaining({
          rawName: 'Wrong Guess Inc',
          resolvedVia: 'hubspot_company_id',
          resolvedAccountName: 'Real Account',
          conflictVia: 'normalized',
          conflictAccountName: 'Wrong Guess Inc',
        }),
      }),
    );
    // The higher tier's answer is what gets used, not the conflicting one.
    expect(deps.buildCandidates.mock.calls[0][0].accountName).toBe('Real Account');
    // A hubspot_company_id resolution is not the normalized fallback tier, so it is not cached as an alias.
    expect(deps.registerAlias).not.toHaveBeenCalled();
  });

  it('dryRun still resolves identity and counts it, but registers no alias', async () => {
    const prisma = makePrisma({ triggers: [trigger({ id: 205, account_name: 'Niagara Bottling, Llc' })] });
    const deps = makeDeps([]);
    deps.resolveIdentity.mockReturnValue({ ok: true, accountName: 'Niagara Bottling', via: 'normalized', confidence: 70 });

    const report = await runHypothesize(prisma, { now: NOW, dryRun: true }, deps);

    expect(report.identity.resolved).toBe(1);
    expect(report.dryRun).toBe(true);
    expect(deps.registerAlias).not.toHaveBeenCalled();
  });

  it('an exact-name resolution is not re-cached as an alias (the raw name already equals the canonical one)', async () => {
    const prisma = makePrisma({ triggers: [trigger({ id: 206, account_name: ACCOUNT })], personas: [persona()] });
    const deps = makeDeps([candidate()]);
    deps.resolveIdentity.mockReturnValue({ ok: true, accountName: ACCOUNT, via: 'normalized', confidence: 100 });

    await runHypothesize(prisma, { now: NOW }, deps);

    expect(deps.registerAlias).not.toHaveBeenCalled();
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
  identity: { resolved: 2, aliasesRegistered: 0, conflicts: 0, refused: {} },
  signals: { created: 2, existing: 0, refused: 0 },
  candidates: 1,
  proposed: 1,
  existing: 0,
  skippedOpen: 0,
  skippedResolved: 0,
  refused: {},
  buildSkipped: {},
  errors: [],
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
