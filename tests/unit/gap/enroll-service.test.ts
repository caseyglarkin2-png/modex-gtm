/**
 * S3-T12: the enroll service. Hand-rolled prisma with a write counter over
 * every delegate, so "shadow creates nothing" is a structural assertion,
 * not a belief. `enroll` / `recordExternalEnrollment`, `audit` and the
 * canonical autonomy reader are module mocks so the call shapes and their
 * ORDER are asserted, never re-implemented.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedAudit, mockedEnroll, mockedRecord, mockedAutonomyHalted, mockedCompile, mockedMaterialize } = vi.hoisted(() => ({
  mockedAudit: vi.fn<(...args: any[]) => Promise<{ stored: boolean; reviewQueued: boolean }>>(async () => ({
    stored: true,
    reviewQueued: false,
  })),
  mockedEnroll: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedRecord: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedAutonomyHalted: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedCompile: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedMaterialize: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/gap/audit', () => ({ audit: mockedAudit }));
// The real module stays underneath (isSuppressed is exercised for real); only the two writers are mocked.
vi.mock('@/lib/gap/sequence/enrollment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/gap/sequence/enrollment')>()),
  enroll: mockedEnroll,
  recordExternalEnrollment: mockedRecord,
}));
vi.mock('@/lib/email/autonomy-gate', () => ({ autonomyHalted: mockedAutonomyHalted }));
vi.mock('@/lib/gap/compiler/compile', () => ({ compile: mockedCompile }));
vi.mock('@/lib/gap/sequences/service', () => ({ materializeSequence: mockedMaterialize }));

import {
  checkEvidenceFreshness,
  enrollFromDecision,
  evidenceRefsFromSignals,
  verifyCompiles,
  type EnrollDeps,
  type EnrollFromDecisionInput,
} from '@/lib/gap/enroll/service';
import { staticSuppressionReader } from '@/lib/gap/routing/suppression-read';

/** R3-10: the service reads the cross-plane contract before the target; every case injects a CLEAR reader unless it tests the read. */
const SUPPRESSION_CLEAR = staticSuppressionReader('clear');

const CRITIC_STUB = { score: vi.fn(async () => ({ ok: true as const, verdict: 'pass' as const, score: 100, findings: [] })) };
const ITEM_COMPILE_PASS = { id: 'cmp_item', verdict: 'pass', checks: [], critic: { ok: true, verdict: 'pass', score: 100, findings: [] } };

const NOW = new Date('2026-09-23T15:00:00.000Z');
const WRITE_METHODS = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'] as const;

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const STEPS = {
  schema: 'steps.v2',
  steps: [
    {
      index: 0,
      delay: { value: 0, unit: 'business_days' },
      purpose: 'intrigue',
      productProofAllowed: false,
      requiredEvidenceTypes: [],
      claimsUsed: [],
      templates: {
        subjectTemplate: 'Gate clerks at {{account}}',
        bodyTemplate: 'Hi {{first_name}},\n\nYour Ohio DC posted three gate-clerk roles.\n\nCasey',
        hubspotTemplateId: null,
      },
    },
    {
      index: 1,
      delay: { value: 3, unit: 'business_days' },
      purpose: 'root_cause',
      productProofAllowed: false,
      requiredEvidenceTypes: [],
      claimsUsed: [],
      templates: { subjectTemplate: 'Re: gate clerks', bodyTemplate: 'One more thing.', hubspotTemplateId: null },
    },
  ],
};

function compileRow(id: string, stepIndex: number, verdict: string, createdAt = '2026-09-22T00:00:00.000Z', versionId = 'v1', hypothesisId: string | null = 'H1') {
  return { id, sequence_version_id: versionId, step_index: stepIndex, verdict, created_at: new Date(createdAt), hypothesis_id: hypothesisId };
}

const PASSING_COMPILES = [compileRow('c0', 0, 'pass'), compileRow('c1', 1, 'pass')];

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    account: { name: 'Acme Logistics', hubspotCompanyId: '111' },
    persona: {
      id: 7,
      email: 'jane.doe@acme-logistics.com',
      hubspotContactId: '222',
      top100: { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: '333', sequenceName: 'Acme v1' },
    },
    target: 'hubspot_native',
    preferredSender: 'casey@yardflow.ai',
    ...overrides,
  };
}

function makePrisma(
  opts: { compiles?: any[]; decision?: any; version?: any; persona?: any; hypothesis?: any; account?: any; lastDisposition?: any } = {},
) {
  const p = {
    // B6 (Opus adversarial review, 2026-09-24): the active-opportunity guard.
    // Defaults to "nothing active" so every existing test is unaffected;
    // opts.account / opts.lastDisposition let a test assert the refusal.
    account: {
      findUnique: asyncSpy(async () => (opts.account === undefined ? { pipeline_stage: null } : opts.account)),
    },
    conversationDisposition: {
      findFirst: asyncSpy(async () => (opts.lastDisposition === undefined ? null : opts.lastDisposition)),
    },
    sequenceVersion: {
      findUnique: asyncSpy(async () =>
        opts.version === undefined ? { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps: STEPS } : opts.version,
      ),
    },
    gapCompile: { findMany: asyncSpy(async () => opts.compiles ?? PASSING_COMPILES) },
    sendApprovalRequest: { findFirst: asyncSpy(async () => null) },
    unsubscribedEmail: { findUnique: asyncSpy(async () => null) },
    prospectingHypothesis: {
      findUnique: asyncSpy(async () =>
        opts.hypothesis === undefined ? { id: 'H1', status: 'approved', account_name: 'Acme Logistics' } : opts.hypothesis,
      ),
    },
    persona: {
      findUnique: asyncSpy(async () =>
        opts.persona === undefined
          ? {
              id: 7,
              name: 'Jane Doe',
              email: 'Jane.Doe@Acme-Logistics.com',
              account_name: 'Acme Logistics',
              hubspot_contact_id: '222',
              do_not_contact: false,
              email_status: 'verified',
            }
          : opts.persona,
      ),
    },
    routingDecision: {
      findUnique: asyncSpy(async () => (opts.decision === undefined ? decisionRow() : opts.decision)),
      findFirst: asyncSpy(async () => (opts.decision === undefined ? decisionRow() : opts.decision)),
      create: asyncSpy(),
      update: asyncSpy(),
    },
    draftQueueItem: { create: asyncSpy(), updateMany: asyncSpy(async () => ({ count: 1 })) },
    sequenceEnrollment: { create: asyncSpy(), updateMany: asyncSpy() },
    gapAuditEvent: { create: asyncSpy() },
    $transaction: vi.fn(),
  };
  return p;
}

function decisionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dec_1',
    run_id: 'run_1',
    action: 'enroll_gap_sequence',
    lane: 'work_queue',
    rule_id: 'enroll',
    priority: 80,
    explain: {},
    inputs_snapshot: snapshot(),
    ...overrides,
  };
}

/** Every write-shaped call on every delegate of the mock, by name. */
function writes(prisma: Record<string, any>): string[] {
  const out: string[] = [];
  for (const [delegate, api] of Object.entries(prisma)) {
    if (!api || typeof api !== 'object') continue;
    for (const m of WRITE_METHODS) {
      const fn = api[m];
      if (fn && typeof fn.mock === 'object' && fn.mock.calls.length > 0) out.push(`${delegate}.${m}x${fn.mock.calls.length}`);
    }
  }
  if (prisma.$transaction?.mock?.calls.length > 0) out.push(`$transactionx${prisma.$transaction.mock.calls.length}`);
  return out;
}

function input(overrides: Partial<EnrollFromDecisionInput> = {}): EnrollFromDecisionInput {
  return {
    decisionId: 'dec_1',
    hypothesisId: 'H1',
    personaId: 7,
    sequenceVersionId: 'v1',
    compileIds: ['c0', 'c1'],
    actor: 'casey@freightroll.com',
    actorKind: 'human',
    mode: 'shadow',
    now: NOW,
    ...overrides,
  };
}

function deps(overrides: Partial<EnrollDeps> = {}): EnrollDeps & { addOne: ReturnType<typeof asyncSpy>; autonomy: ReturnType<typeof vi.fn> } {
  return {
    autonomy: vi.fn(async () => ({ halted: false })),
    addOne: asyncSpy(async () => ({ ok: true, id: 4242 })),
    critic: CRITIC_STUB,
    suppression: SUPPRESSION_CLEAR,
    ...overrides,
  } as any;
}

function refusedPredicates(): string[] {
  return mockedAudit.mock.calls.filter((c) => c[1]?.kind === 'enroll.refused').map((c) => c[1].payload.predicate);
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {
    GAP_OS_ENABLED: process.env.GAP_OS_ENABLED,
    GAP_AUTO_ENROLL_ENABLED: process.env.GAP_AUTO_ENROLL_ENABLED,
    GAP_MESSAGE_COMPILER_ENABLED: process.env.GAP_MESSAGE_COMPILER_ENABLED,
    OUTREACH_PAUSED: process.env.OUTREACH_PAUSED,
  };
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_MESSAGE_COMPILER_ENABLED = 'true';
  delete process.env.GAP_AUTO_ENROLL_ENABLED;
  delete process.env.OUTREACH_PAUSED;
  mockedAudit.mockClear();
  mockedEnroll.mockReset();
  mockedRecord.mockReset();
  mockedAutonomyHalted.mockReset();
  mockedEnroll.mockResolvedValue({ ok: true, id: 'enr_1', isTest: false, frozen: true });
  mockedRecord.mockResolvedValue({ ok: true, id: 'ext_1', isTest: false, frozen: true });
  mockedCompile.mockReset();
  mockedCompile.mockResolvedValue(ITEM_COMPILE_PASS);
  mockedMaterialize.mockReset();
  mockedMaterialize.mockResolvedValue({ ok: true, sequenceId: 77, name: 'Fam v1', existing: true, steps: [] });
});

afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

// ---------------------------------------------------------------------------
// Guard order
// ---------------------------------------------------------------------------

describe('enrollFromDecision guards, in order', () => {
  it('gap_disabled when GAP_OS_ENABLED is off, before any read', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r).toEqual({ ok: false, reason: 'gap_disabled' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['gap_disabled']);
  });

  it('enroll_disabled for a live enroll from an agent while GAP_AUTO_ENROLL_ENABLED is off', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live', actor: 'cron', actorKind: 'agent' }), deps());
    expect(r).toEqual({ ok: false, reason: 'enroll_disabled' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['enroll_disabled']);
  });

  it('an agent may enroll live once GAP_AUTO_ENROLL_ENABLED is on', async () => {
    process.env.GAP_AUTO_ENROLL_ENABLED = 'true';
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live', actor: 'cron', actorKind: 'agent' }), deps());
    expect(r.ok).toBe(true);
  });

  it('a human may enroll live through the UI with the auto-enroll flag off (the flag gates the machine)', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r.ok).toBe(true);
    expect(refusedPredicates()).toEqual([]);
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24). Spec section 10 names
   * OUTREACH_PAUSED as a reused kill switch checked at enroll, alongside
   * the autonomy halt; no code read it. OUTREACH_PAUSED's established
   * meaning elsewhere (feature-flags.ts) is "automation only, not a
   * deliberate operator action", so this is scoped like GAP_AUTO_ENROLL_
   * ENABLED just above it: a machine actor only. Mutate the check away and
   * this goes RED.
   */
  it('OUTREACH_PAUSED refuses a live enroll from an agent, even with GAP_AUTO_ENROLL_ENABLED on', async () => {
    process.env.GAP_AUTO_ENROLL_ENABLED = 'true';
    process.env.OUTREACH_PAUSED = 'true';
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live', actor: 'cron', actorKind: 'agent' }), deps());
    expect(r).toEqual({ ok: false, reason: 'outreach_paused' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['outreach_paused']);
  });

  it('OUTREACH_PAUSED never blocks a human enrolling live through the UI (a deliberate operator action)', async () => {
    process.env.OUTREACH_PAUSED = 'true';
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r.ok).toBe(true);
  });

  it('OUTREACH_PAUSED never blocks shadow mode', async () => {
    process.env.OUTREACH_PAUSED = 'true';
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow', actor: 'cron', actorKind: 'agent' }), deps());
    expect(r.ok).toBe(true);
  });

  it('shadow from an agent is allowed with the flag off', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow', actor: 'cron', actorKind: 'agent' }), deps());
    expect(r.ok).toBe(true);
  });

  /**
   * B6 (Opus adversarial review, 2026-09-24). Before this fix, enroll had no
   * active-opportunity check at all: a meeting-stage account or a booked
   * meeting still enrolled into a cold GAP sequence. This is a FRESH read
   * (prisma.account / prisma.conversationDisposition), not the routing
   * decision's snapshot, so it still refuses even when the decision being
   * acted on predates the opportunity opening. Mutate the guard away and
   * these go RED.
   */
  it('active_opportunity refuses enrollment when the account is at the meeting pipeline stage', async () => {
    const prisma = makePrisma({ account: { pipeline_stage: 'meeting' } });
    const r = await enrollFromDecision(prisma, input(), deps());
    expect(r).toEqual({ ok: false, reason: 'active_opportunity' });
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.sequenceEnrollment.create).not.toHaveBeenCalled();
  });

  it('active_opportunity refuses enrollment on a confirmed meeting_accepted disposition within cooldown', async () => {
    const prisma = makePrisma({ lastDisposition: { response_class: 'meeting_accepted', created_at: NOW } });
    const r = await enrollFromDecision(prisma, input(), deps());
    expect(r).toEqual({ ok: false, reason: 'active_opportunity' });
  });

  it('active_opportunity control: an early pipeline stage and no positive disposition still enroll normally', async () => {
    const prisma = makePrisma({ account: { pipeline_stage: 'contacted' } });
    const r = await enrollFromDecision(prisma, input(), deps());
    expect(r.ok).toBe(true);
  });

  it('version_not_found, then version_retired', async () => {
    expect(await enrollFromDecision(makePrisma({ version: null }), input(), deps())).toEqual({ ok: false, reason: 'version_not_found' });
    expect(
      await enrollFromDecision(
        makePrisma({ version: { id: 'v1', family_id: 'fam_1', version: 1, status: 'retired', steps: STEPS } }),
        input(),
        deps(),
      ),
    ).toEqual({ ok: false, reason: 'version_retired' });
  });

  it('compile_not_found:<id> for an unknown compile id, compile_wrong_version:<id> for another version', async () => {
    expect(await enrollFromDecision(makePrisma({ compiles: [compileRow('c0', 0, 'pass')] }), input(), deps())).toEqual({
      ok: false,
      reason: 'compile_not_found:c1',
    });
    expect(
      await enrollFromDecision(
        makePrisma({ compiles: [compileRow('c0', 0, 'pass'), compileRow('c1', 1, 'pass', '2026-09-22T00:00:00.000Z', 'v9')] }),
        input(),
        deps(),
      ),
    ).toEqual({ ok: false, reason: 'compile_wrong_version:c1' });
  });

  it('R3-3: a compile row bound to another hypothesis refuses compile_wrong_hypothesis:<id> in every mode', async () => {
    const compiles = [compileRow('c0', 0, 'pass'), compileRow('c1', 1, 'pass', '2026-09-22T00:00:00.000Z', 'v1', 'H_other')];
    for (const mode of ['shadow', 'live'] as const) {
      const prisma = makePrisma({ compiles });
      const r = await enrollFromDecision(prisma, input({ mode }), deps());
      expect(r).toEqual({ ok: false, reason: 'compile_wrong_hypothesis:c1' });
      expect(prisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
    }
    expect(refusedPredicates()).toEqual(['compile_wrong_hypothesis:c1', 'compile_wrong_hypothesis:c1']);
    // The select carries hypothesis_id so the rule reads the column, never the snapshot.
    const prisma = makePrisma({ compiles });
    await enrollFromDecision(prisma, input(), deps());
    expect(prisma.gapCompile.findMany.mock.calls[0][0].select).toMatchObject({ hypothesis_id: true });
  });

  it('R3-3: a template-level row (hypothesis_id null) is accepted for SHADOW only; live refuses compile_template_only:<id> (verifyCompiles owns the rule)', async () => {
    const compiles = [compileRow('c0', 0, 'pass', '2026-09-22T00:00:00.000Z', 'v1', null), compileRow('c1', 1, 'pass')];
    expect((await enrollFromDecision(makePrisma({ compiles }), input({ mode: 'shadow' }), deps())).ok).toBe(true);
    expect(await enrollFromDecision(makePrisma({ compiles }), input({ mode: 'live' }), deps())).toEqual({ ok: false, reason: 'compile_template_only:c0' });
    const prisma = makePrisma();
    expect(await verifyCompiles(prisma, 2, compiles)).toBe('compile_template_only:c0');
    expect(await verifyCompiles(prisma, 2, compiles, { allowTemplateRows: true })).toBeNull();
  });

  it('compile_not_passed:<stepIndex> names the first step without a passing newest compile', async () => {
    const prisma = makePrisma({ compiles: [compileRow('c0', 0, 'pass')] });
    const r = await enrollFromDecision(prisma, input({ compileIds: ['c0'] }), deps());
    expect(r).toEqual({ ok: false, reason: 'compile_not_passed:1' });
    expect(refusedPredicates()).toEqual(['compile_not_passed:1']);
  });

  it('the NEWEST compile per step decides: an older pass under a newer reject is not a pass', async () => {
    const prisma = makePrisma({
      compiles: [
        compileRow('c0', 0, 'pass'),
        compileRow('c1', 1, 'pass', '2026-09-20T00:00:00.000Z'),
        compileRow('c2', 1, 'reject', '2026-09-22T00:00:00.000Z'),
      ],
    });
    const r = await enrollFromDecision(prisma, input({ compileIds: ['c0', 'c1', 'c2'] }), deps());
    expect(r).toEqual({ ok: false, reason: 'compile_not_passed:1' });
  });

  it('a review_required step clears only through an approved SendApprovalRequest', async () => {
    const compiles = [compileRow('c0', 0, 'pass'), compileRow('c1', 1, 'review_required')];
    const pending = makePrisma({ compiles });
    pending.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_1', status: 'pending' });
    expect(await enrollFromDecision(pending, input(), deps())).toEqual({ ok: false, reason: 'compile_not_passed:1' });

    const approved = makePrisma({ compiles });
    approved.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_1', status: 'approved' });
    const r = await enrollFromDecision(approved, input(), deps());
    expect(r.ok).toBe(true);
    expect(approved.sendApprovalRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { risk_reasons: { has: 'gap_compile:c1' } } }),
    );
  });

  it('verifyCompiles is pure over rows and answers the first failing step', async () => {
    const prisma = makePrisma();
    expect(await verifyCompiles(prisma, 2, [compileRow('a', 0, 'pass')])).toBe('compile_not_passed:1');
    expect(await verifyCompiles(prisma, 2, [compileRow('a', 0, 'reject'), compileRow('b', 1, 'pass')])).toBe('compile_not_passed:0');
    expect(await verifyCompiles(prisma, 2, PASSING_COMPILES)).toBeNull();
  });

  // -------------------------------------------------------------------------
  // SF14 (6B-T2): compile staleness and evidence freshness, both OPT-IN
  // (undefined by default), closing the gap named in the finish-pass ledger:
  // "compile verdicts have no age limit at enroll time, and signal freshness
  // is not rechecked". Every test above this point runs with neither opt-in
  // set and is unaffected, proven by the full 60-test run staying green
  // after this ticket landed.
  // -------------------------------------------------------------------------

  describe('SF14: compile staleness (verifyCompiles opt-in)', () => {
    it('is a no-op by default, even for a compile far older than any reasonable threshold', async () => {
      const prisma = makePrisma();
      // PASSING_COMPILES is dated 2026-09-22; NOW is 2026-09-23T15:00 (~39.5h later).
      expect(await verifyCompiles(prisma, 2, PASSING_COMPILES)).toBeNull();
      expect(await verifyCompiles(prisma, 2, PASSING_COMPILES, { now: NOW })).toBeNull(); // now alone, no maxCompileAgeMs: still off
    });

    it('refuses compile_stale:<step> for the first step whose newest compile exceeds the age limit, when both now and maxCompileAgeMs are given', async () => {
      const prisma = makePrisma();
      const oneHourMs = 60 * 60 * 1000;
      const r = await verifyCompiles(prisma, 2, PASSING_COMPILES, { now: NOW, maxCompileAgeMs: oneHourMs });
      expect(r).toBe('compile_stale:0');
    });

    it('a fresh-enough compile under the same threshold passes', async () => {
      const prisma = makePrisma();
      const fortyEightHoursMs = 48 * 60 * 60 * 1000;
      const r = await verifyCompiles(prisma, 2, PASSING_COMPILES, { now: NOW, maxCompileAgeMs: fortyEightHoursMs });
      expect(r).toBeNull();
    });

    it('the enroll service refuses compile_stale end to end only when deps.maxCompileAgeMs is set', async () => {
      const prisma = makePrisma();
      const withoutOptIn = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
      expect(withoutOptIn.ok).toBe(true);

      const withOptIn = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), deps({ maxCompileAgeMs: 60 * 60 * 1000 }));
      expect(withOptIn).toEqual({ ok: false, reason: 'compile_stale:0' });
      expect(refusedPredicates()).toContain('compile_stale:0');
    });
  });

  describe('SF14: evidence freshness recheck (checkEvidenceFreshness opt-in)', () => {
    it('null and future freshness_expires_at are both fresh; a past one is expired', () => {
      expect(checkEvidenceFreshness([{ freshness_expires_at: null }], NOW)).toBeNull();
      expect(checkEvidenceFreshness([{ freshness_expires_at: '2026-12-01T00:00:00.000Z' }], NOW)).toBeNull();
      expect(checkEvidenceFreshness([{ freshness_expires_at: '2026-09-01T00:00:00.000Z' }], NOW)).toBe('evidence_expired');
    });

    it('the enroll service refuses evidence_expired only when deps.checkEvidenceFreshness is true, and never with the default hypothesis fixture (no signals array)', async () => {
      const withoutOptIn = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), deps());
      expect(withoutOptIn.ok).toBe(true);

      const expiredHypothesis = {
        id: 'H1',
        status: 'approved',
        account_name: 'Acme Logistics',
        signals: [{ signal: { id: 'sig_1', freshness_expires_at: '2026-09-01T00:00:00.000Z' } }],
      };
      const withOptIn = await enrollFromDecision(
        makePrisma({ hypothesis: expiredHypothesis }),
        input({ mode: 'live' }),
        deps({ checkEvidenceFreshness: true }),
      );
      expect(withOptIn).toEqual({ ok: false, reason: 'evidence_expired' });
      expect(refusedPredicates()).toContain('evidence_expired');

      // A fresh signal under the same opt-in still succeeds.
      const freshHypothesis = { ...expiredHypothesis, signals: [{ signal: { id: 'sig_1', freshness_expires_at: '2026-12-01T00:00:00.000Z' } }] };
      const stillOk = await enrollFromDecision(makePrisma({ hypothesis: freshHypothesis }), input({ mode: 'live' }), deps({ checkEvidenceFreshness: true }));
      expect(stillOk.ok).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Autonomy
// ---------------------------------------------------------------------------

describe('the canonical autonomy read', () => {
  it('live refuses autonomy_halted when the switch is halted, with the reason as detail', async () => {
    const d = deps({ autonomy: vi.fn(async () => ({ halted: true, reason: 'outreach motion halted' })) });
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), d);
    expect(r).toEqual({ ok: false, reason: 'autonomy_halted', detail: 'outreach motion halted' });
    expect(refusedPredicates()).toEqual(['autonomy_halted']);
    expect(d.addOne).not.toHaveBeenCalled();
    expect(mockedEnroll).not.toHaveBeenCalled();
  });

  it('live refuses autonomy_halted when the reader throws (unreachable is not permission)', async () => {
    const d = deps({
      autonomy: vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    });
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), d);
    expect(r).toMatchObject({ ok: false, reason: 'autonomy_halted' });
    expect((r as any).detail).toContain('ECONNREFUSED');
  });

  it('live reads the switch exactly once and only after the compile gate', async () => {
    const d = deps();
    await enrollFromDecision(makePrisma(), input({ mode: 'live' }), d);
    expect(d.autonomy).toHaveBeenCalledTimes(1);

    const halted = deps();
    await enrollFromDecision(makePrisma({ compiles: [compileRow('c0', 0, 'pass')] }), input({ mode: 'live', compileIds: ['c0'] }), halted);
    expect(halted.autonomy).not.toHaveBeenCalled();
  });

  it('shadow never reads the switch', async () => {
    const d = deps();
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'shadow' }), d);
    expect(r.ok).toBe(true);
    expect(d.autonomy).not.toHaveBeenCalled();
  });

  it("the default reader is autonomyHalted('outreach') from the Gmail send gate, and unreachable halts", async () => {
    mockedAutonomyHalted.mockResolvedValue({ halted: true, reason: 'canonical autonomy state is unreadable', unreadable: true });
    const { autonomy: _drop, ...noReader } = deps();
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), noReader);
    expect(mockedAutonomyHalted).toHaveBeenCalledWith('outreach');
    expect(r).toEqual({ ok: false, reason: 'autonomy_halted', detail: 'canonical autonomy state is unreadable' });
  });
});

// ---------------------------------------------------------------------------
// Target resolution and the three paths
// ---------------------------------------------------------------------------

describe('target resolution', () => {
  it('hypothesis_not_found, persona_not_found, no_email', async () => {
    expect(await enrollFromDecision(makePrisma({ hypothesis: null }), input(), deps())).toEqual({ ok: false, reason: 'hypothesis_not_found' });
    expect(await enrollFromDecision(makePrisma({ persona: null }), input(), deps())).toEqual({ ok: false, reason: 'persona_not_found' });
    expect(
      await enrollFromDecision(
        makePrisma({ persona: { id: 7, name: 'Jane', email: '  ', account_name: 'Acme Logistics', hubspot_contact_id: null, do_not_contact: false } }),
        input(),
        deps(),
      ),
    ).toEqual({ ok: false, reason: 'no_email' });
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24). Before this fix,
   * hypothesisId and personaId were resolved independently with no relation
   * enforced between them: a hypothesis for one account and a persona from
   * a completely different account both resolved fine on their own, so the
   * service would compile/attribute one company's evidence and copy while
   * enrolling a different company's actual contact. Mutate the check away
   * and this goes RED.
   */
  it('account_mismatch: a persona from a different account than the hypothesis is refused before suppression or target resolution', async () => {
    const prisma = makePrisma({
      persona: { id: 7, name: 'Jane Doe', email: 'jane.doe@other-co.com', account_name: 'Other Co', hubspot_contact_id: '222', do_not_contact: false, email_status: 'verified' },
    });
    const r = await enrollFromDecision(prisma, input(), deps());
    expect(r).toEqual({ ok: false, reason: 'account_mismatch' });
    expect(prisma.sequenceEnrollment.create).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('account_mismatch control: the same account on both sides enrolls normally', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input(), deps());
    expect(r.ok).toBe(true);
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24). An explicit decisionId
   * names one RoutingDecision row, routed for ONE persona; if the caller's
   * personaId names someone else, that row's target/snapshot (Top100
   * eligibility, preferred sender) would silently apply to the wrong person.
   */
  it('decision_persona_mismatch: an explicit decisionId for a different persona is refused', async () => {
    const prisma = makePrisma({ decision: decisionRow({ persona_id: 999 }) });
    const r = await enrollFromDecision(prisma, input({ decisionId: 'dec_1', personaId: 7 }), deps());
    expect(r).toEqual({ ok: false, reason: 'decision_persona_mismatch' });
  });

  it('decision_persona_mismatch control: a matching persona_id, or no decisionId at all, enrolls normally', async () => {
    const matching = makePrisma({ decision: decisionRow({ persona_id: 7 }) });
    expect((await enrollFromDecision(matching, input({ decisionId: 'dec_1', personaId: 7 }), deps())).ok).toBe(true);

    const noDecisionId = makePrisma({ decision: decisionRow({ persona_id: 999 }) });
    expect((await enrollFromDecision(noDecisionId, input({ decisionId: undefined, personaId: 7 }), deps())).ok).toBe(true);
  });

  it('build_required from the Top100 entry (in the roster, no built sequence) refuses and creates nothing', async () => {
    const prisma = makePrisma({
      decision: decisionRow({
        inputs_snapshot: snapshot({
          target: null,
          persona: { id: 7, email: 'jane.doe@acme-logistics.com', hubspotContactId: '222', top100: { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: null, sequenceName: null } },
        }),
      }),
    });
    const d = deps();
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), d);
    expect(r).toEqual({ ok: false, reason: 'build_required' });
    expect(writes(prisma)).toEqual([]);
    expect(d.addOne).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['build_required']);
  });

  it('with no decisionId the persona newest enroll decision is read; with none at all the target is modex_queue', async () => {
    const prisma = makePrisma({ decision: null });
    const r = await enrollFromDecision(prisma, input({ decisionId: null }), deps());
    expect(prisma.routingDecision.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { persona_id: 7, action: 'enroll_gap_sequence' } }),
    );
    expect(r).toMatchObject({ ok: true, kind: 'modex_shadow', target: 'modex_queue' });
  });

  it('deps.top100 overrides the snapshot', async () => {
    const r = await enrollFromDecision(
      makePrisma(),
      input(),
      deps({ top100: { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: null, sequenceName: null } }),
    );
    expect(r).toEqual({ ok: false, reason: 'build_required' });
  });
});

// ---------------------------------------------------------------------------
// R3-2: suppression before target resolution, every mode, every target
// ---------------------------------------------------------------------------

describe('suppression is read before the target is resolved (R3-2)', () => {
  const personaRow = (extra: Record<string, unknown>) => ({
    id: 7,
    name: 'Jane Doe',
    email: 'jane.doe@acme-logistics.com',
    account_name: 'Acme Logistics',
    hubspot_contact_id: '222',
    do_not_contact: false,
    email_status: 'verified',
    ...extra,
  });

  it('hubspot_native shadow: a do_not_contact persona refuses suppressed naming the modex leg and emits no row', async () => {
    const prisma = makePrisma({ persona: personaRow({ do_not_contact: true }) });
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), deps());
    expect(r).toEqual({ ok: false, reason: 'suppressed', detail: 'modex_do_not_contact' });
    expect(refusedPredicates()).toEqual(['suppressed']);
    expect(mockedAudit.mock.calls.at(-1)?.[1].payload).toMatchObject({ predicate: 'suppressed', leg: 'modex_do_not_contact' });
    // Refused before the decision (and so the target) is read.
    expect(prisma.routingDecision.findUnique).not.toHaveBeenCalled();
    expect(writes(prisma)).toEqual([]);
  });

  it('hubspot_native live: an unsubscribed address refuses suppressed:unsubscribed, looked up on the lowercased email', async () => {
    const prisma = makePrisma();
    prisma.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u1' });
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r).toEqual({ ok: false, reason: 'suppressed', detail: 'unsubscribed' });
    expect(prisma.unsubscribedEmail.findUnique.mock.calls[0][0]).toEqual({ where: { email: 'jane.doe@acme-logistics.com' }, select: { id: true } });
    expect(mockedRecord).not.toHaveBeenCalled();
    expect(writes(prisma)).toEqual([]);
  });

  it('modex_queue shadow and live: a hard_bounced persona email refuses suppressed:bounced before addOne', async () => {
    const modex = decisionRow({ inputs_snapshot: snapshot({ target: 'modex_queue', persona: { id: 7, email: 'jane.doe@acme-logistics.com', hubspotContactId: null, top100: null } }) });
    for (const mode of ['shadow', 'live'] as const) {
      const prisma = makePrisma({ decision: modex, persona: personaRow({ email_status: 'hard_bounced' }) });
      const d = deps();
      const r = await enrollFromDecision(prisma, input({ mode }), d);
      expect(r).toEqual({ ok: false, reason: 'suppressed', detail: 'bounced' });
      expect(d.addOne).not.toHaveBeenCalled();
      expect(mockedEnroll).not.toHaveBeenCalled();
      expect(mockedMaterialize).not.toHaveBeenCalled();
    }
  });

  it('R3-10: the cross-plane read runs after the local legs; suppressed names the clawd leg, unknown refuses suppression_unknown', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), deps({ suppression: staticSuppressionReader('suppressed', { do_not_send: 'hit' }) }));
    expect(r).toEqual({ ok: false, reason: 'suppressed', detail: 'clawd:do_not_send' });
    expect(mockedAudit.mock.calls.at(-1)?.[1].payload).toMatchObject({ predicate: 'suppressed', leg: 'clawd:do_not_send' });
    expect(prisma.routingDecision.findUnique).not.toHaveBeenCalled();

    const unknown = await enrollFromDecision(makePrisma(), input({ mode: 'live' }), deps({ suppression: staticSuppressionReader('unknown') }));
    expect(unknown).toEqual({ ok: false, reason: 'suppression_unknown', detail: 'clawd:clawd_contract' });
    expect(refusedPredicates().at(-1)).toBe('suppression_unknown');

    // A local leg refuses before the reader is consulted.
    const reader = { read: vi.fn(async () => ({ verdict: 'clear' as const, legs: {} })) };
    const local = makePrisma();
    local.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u1' });
    await enrollFromDecision(local, input(), deps({ suppression: reader }));
    expect(reader.read).not.toHaveBeenCalled();
  });

  it('R3-10: the same reader is handed to enroll() on the modex live path', async () => {
    const modex = decisionRow({ inputs_snapshot: snapshot({ target: 'modex_queue', persona: { id: 7, email: 'jane.doe@acme-logistics.com', hubspotContactId: null, top100: null } }) });
    const reader = { read: vi.fn(async () => ({ verdict: 'clear' as const, legs: {} })) };
    const r = await enrollFromDecision(makePrisma({ decision: modex }), input({ mode: 'live' }), deps({ suppression: reader }));
    expect(r.ok).toBe(true);
    expect(mockedEnroll.mock.calls[0][2]).toEqual({ suppression: reader });
  });

  it('R3-10: without an injected reader the default is the clawd contract reader, which is unknown when unconfigured', async () => {
    const saved = { url: process.env.CLAWD_CONTROL_PLANE_URL, token: process.env.CLAWD_CONTROL_PLANE_TOKEN };
    delete process.env.CLAWD_CONTROL_PLANE_URL;
    delete process.env.CLAWD_CONTROL_PLANE_TOKEN;
    try {
      const { suppression: _drop, ...noReader } = deps();
      expect(await enrollFromDecision(makePrisma(), input(), noReader)).toEqual({ ok: false, reason: 'suppression_unknown', detail: 'clawd:clawd_contract' });
    } finally {
      if (saved.url !== undefined) process.env.CLAWD_CONTROL_PLANE_URL = saved.url;
      if (saved.token !== undefined) process.env.CLAWD_CONTROL_PLANE_TOKEN = saved.token;
    }
  });

  it('the unsubscribed leg wins over do_not_contact, and both win over bounced (first refusal names the leg)', async () => {
    const prisma = makePrisma({ persona: personaRow({ do_not_contact: true, email_status: 'bounced' }) });
    prisma.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u1' });
    expect(await enrollFromDecision(prisma, input(), deps())).toEqual({ ok: false, reason: 'suppressed', detail: 'unsubscribed' });
    const prisma2 = makePrisma({ persona: personaRow({ do_not_contact: true, email_status: 'bounced' }) });
    expect(await enrollFromDecision(prisma2, input(), deps())).toEqual({ ok: false, reason: 'suppressed', detail: 'modex_do_not_contact' });
  });
});

describe('hubspot_native', () => {
  it('shadow returns the enroll-table row, no enrollment, zero writes, audited enroll.shadow', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), deps());
    expect(r).toMatchObject({ ok: true, kind: 'enroll_row', target: 'hubspot_native', mode: 'shadow', enrollment: null });
    const row = (r as any).row;
    expect(row.enrollCount).toBe(1);
    expect(row.rows[0]).toMatchObject({
      account: 'Acme Logistics',
      sequence: { hubspotSequenceId: '333', name: 'Acme v1' },
      sendFrom: 'casey@yardflow.ai',
    });
    expect(row.rows[0].enroll[0]).toMatchObject({ personaId: 7, hubspotContactId: '222', name: 'Jane Doe', email: 'jane.doe@acme-logistics.com' });
    // T10 phase 2: a native item without `compile: {ok: true}` is a compile_missing skip; the service passes its own gate result.
    expect(row.skipCount).toBe(0);
    expect(writes(prisma)).toEqual([]);
    expect(mockedRecord).not.toHaveBeenCalled();
    const kinds = mockedAudit.mock.calls.map((c) => c[1].kind);
    expect(kinds).toEqual(['enroll.shadow']);
    expect(mockedAudit.mock.calls[0][1].payload).toMatchObject({ kind: 'enroll_row', recorded: false, target: 'hubspot_native' });
  });

  it('R3-13: live emits the row and records NOTHING, whatever the caller sends: the enrollment-sync cron is the only recorder', async () => {
    const prisma = makePrisma();
    // A readback smuggled through the input shape is ignored: the field no longer exists on the service input.
    const smuggled = { ...input({ mode: 'live' }), readback: { activelyEnrolledCount: 1, latestSequenceId: '333', latestEnrolledAt: null } } as unknown as EnrollFromDecisionInput;
    const r = await enrollFromDecision(prisma, smuggled, deps());
    expect(r).toEqual({ ok: true, kind: 'enroll_row', target: 'hubspot_native', mode: 'live', row: expect.any(Object), enrollment: null });
    expect(mockedRecord).not.toHaveBeenCalled();
    expect(writes(prisma)).toEqual([]);
    // N4: an emitted-only outcome is not an enrollment; it audits enroll.row_emitted, never enroll.live.
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual(['enroll.row_emitted']);
    expect(mockedAudit.mock.calls[0][1].payload).toMatchObject({ kind: 'enroll_row', recorded: false, target: 'hubspot_native' });
  });
});

describe('evidenceRefsFromSignals', () => {
  const now = new Date('2026-09-23T15:00:00.000Z');
  it('maps freshness by expiry or the 45-day window, external_ok fail-closed, and first-party by source type', () => {
    const refs = evidenceRefsFromSignals(
      [
        { id: 'a', title: 'A', evidence_url: null, external_ok: null, observed_at: '2026-09-01T00:00:00.000Z', freshness_expires_at: null, source_type: 'public_primary' },
        { id: 'b', title: 'B', evidence_url: 'https://x', external_ok: true, observed_at: '2026-06-01T00:00:00.000Z', freshness_expires_at: null, source_type: 'public_secondary' },
        { id: 'c', title: 'C', evidence_url: null, external_ok: false, observed_at: '2026-06-01T00:00:00.000Z', freshness_expires_at: '2026-12-01T00:00:00.000Z', source_type: 'first_party' },
        { id: 'd', title: 'D', evidence_url: null, external_ok: true, observed_at: '2026-09-20T00:00:00.000Z', freshness_expires_at: null, source_type: 'manual', metadata: { superseded: true } },
      ],
      now,
    );
    expect(refs).toEqual([
      { id: 'a', title: 'A', url: null, externalOk: false, fresh: true, superseded: false, firstParty: false },
      { id: 'b', title: 'B', url: 'https://x', externalOk: true, fresh: false, superseded: false, firstParty: false },
      { id: 'c', title: 'C', url: null, externalOk: false, fresh: true, superseded: false, firstParty: true },
      { id: 'd', title: 'D', url: null, externalOk: true, fresh: true, superseded: true, firstParty: true },
    ]);
  });
});

describe('modex_queue', () => {
  const modexDecision = () => decisionRow({ inputs_snapshot: snapshot({ target: 'modex_queue', persona: { id: 7, email: 'jane.doe@acme-logistics.com', hubspotContactId: null, top100: null } }) });

  it('shadow audits the would-be draft item with rendered placeholders and creates NOTHING', async () => {
    const prisma = makePrisma({ decision: modexDecision() });
    const d = deps();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), d);
    expect(r).toMatchObject({
      ok: true,
      kind: 'modex_shadow',
      target: 'modex_queue',
      wouldBe: {
        toEmail: 'jane.doe@acme-logistics.com',
        accountName: 'Acme Logistics',
        personaId: 7,
        subject: 'Gate clerks at Acme Logistics',
        sequenceVersionId: 'v1',
        stepIndex: 0,
        owner: 'casey@freightroll.com',
        sender: 'casey@yardflow.ai',
      },
    });
    expect((r as any).wouldBe.body.startsWith('Hi Jane,')).toBe(true);
    // Structural: zero writes on every delegate, no queue item, no enrollment, no transaction.
    expect(writes(prisma)).toEqual([]);
    expect(d.addOne).not.toHaveBeenCalled();
    expect(mockedEnroll).not.toHaveBeenCalled();
    expect(mockedMaterialize).not.toHaveBeenCalled();
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual(['enroll.shadow']);
    expect(mockedAudit.mock.calls[0][1].payload.wouldBe).toMatchObject({ toEmail: 'jane.doe@acme-logistics.com' });
  });

  it('SF10: an actor who is not a vetted sending identity never becomes owner; falls back to DEFAULT_OWNER', async () => {
    const prisma = makePrisma({ decision: modexDecision() });
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow', actor: 'jordan@freightroll.com' }), deps());
    expect((r as any).wouldBe.owner).toBe('casey@freightroll.com');
  });

  it('SF10: an explicit owner still wins over the actor fallback (unchanged)', async () => {
    const prisma = makePrisma({ decision: modexDecision() });
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow', owner: 'casey@yardflow.ai' }), deps());
    expect((r as any).wouldBe.owner).toBe('casey@yardflow.ai');
  });

  it('SF10: a decision snapshot whose preferredSender is not a vetted sending identity never becomes sender; falls back to owner', async () => {
    const decision = decisionRow({
      inputs_snapshot: snapshot({
        target: 'modex_queue',
        persona: { id: 7, email: 'jane.doe@acme-logistics.com', hubspotContactId: null, top100: null },
        preferredSender: 'not-a-sending-identity@example.com',
      }),
    });
    const prisma = makePrisma({ decision });
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), deps());
    expect((r as any).wouldBe.sender).toBe('casey@freightroll.com');
    expect((r as any).wouldBe.owner).toBe('casey@freightroll.com');
  });

  it('live materializes the Sequence once, then addOne, then compiles the created item, then enroll() with the item id it returned', async () => {
    const order: string[] = [];
    const d = deps({
      addOne: asyncSpy(async () => {
        order.push('addOne');
        return { ok: true, id: 4242 };
      }),
    });
    mockedMaterialize.mockImplementation(async () => {
      order.push('materialize');
      return { ok: true, sequenceId: 77, name: 'Fam v1', existing: false, steps: [] };
    });
    mockedCompile.mockImplementation(async () => {
      order.push('compile');
      return ITEM_COMPILE_PASS;
    });
    mockedEnroll.mockImplementation(async () => {
      order.push('enroll');
      return { ok: true, id: 'enr_1', isTest: false, frozen: true };
    });
    const prisma = makePrisma({ decision: modexDecision() });
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), d);
    expect(order).toEqual(['materialize', 'addOne', 'compile', 'enroll']);
    expect(r).toEqual({
      ok: true,
      kind: 'modex_enrolled',
      target: 'modex_queue',
      mode: 'live',
      draftItemId: 4242,
      sequenceId: 77,
      compileId: 'cmp_item',
      enrollment: { id: 'enr_1', frozen: true, isTest: false },
    });
    expect(mockedMaterialize).toHaveBeenCalledTimes(1);
    // R3-3: materialize is told which hypothesis the rows must be bound to.
    expect(mockedMaterialize).toHaveBeenCalledWith(prisma, { versionId: 'v1', hypothesisId: 'H1', compileIds: ['c0', 'c1'] }, 'casey@freightroll.com', expect.objectContaining({ owner: 'casey@freightroll.com' }));
    // The created item carries the Sequence id (the runtime's first guard) AND
    // sequence_version_id (SF11: gates it into queue-actions.ts's gapCompileGuard
    // from this instant, before compile() runs), a draft-only stamp right after addOne.
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledWith({ where: { id: 4242, status: 'draft' }, data: { sequence_id: 77, sequence_version_id: 'v1' } });
    // The per-item compile is keyed to the created item and judges the RENDERED copy.
    expect(mockedCompile).toHaveBeenCalledTimes(1);
    const [compileInput, compileDeps] = mockedCompile.mock.calls[0];
    expect(compileInput).toMatchObject({
      hypothesisId: 'H1',
      sequenceVersionId: 'v1',
      draftQueueItemId: 4242,
      stepIndex: 0,
      subject: 'Gate clerks at Acme Logistics',
      body: expect.stringContaining('Hi Jane,'),
      priorBodies: [],
      createdBy: 'casey@freightroll.com',
    });
    expect(compileInput.contract).toMatchObject({
      hypothesis: { observation: '', problemHypothesis: '', problemFamily: 'unmapped' },
      evidence: [],
      stepCount: 2,
      claimsUsed: [],
    });
    expect(compileDeps.critic).toBe(CRITIC_STUB);
    expect(compileDeps.prisma).toBe(prisma);
    // SF10 (Opus adversarial review, 2026-09-24): addOne's second arg becomes
    // DraftQueueItem.owner, the ONLY field send-deps.ts reads to resolve the
    // actual sending Gmail identity. It must be `sender` (casey@yardflow.ai,
    // this decision's preferredSender), never the administrative `owner`
    // (casey@freightroll.com, the actor) -- otherwise the queue item would
    // send from an identity nobody recorded as the sender.
    expect(d.addOne).toHaveBeenCalledWith(
      {
        toEmail: 'jane.doe@acme-logistics.com',
        accountName: 'Acme Logistics',
        personaName: 'Jane Doe',
        personaId: 7,
        subject: 'Gate clerks at Acme Logistics',
        body: expect.stringContaining('Hi Jane,'),
        campaignTag: 'gap:H1',
        source: 'casey',
      },
      'casey@yardflow.ai',
    );
    expect(mockedEnroll).toHaveBeenCalledWith(prisma, {
      familyId: 'fam_1',
      versionId: 'v1',
      engine: 'modex_draft_queue',
      toEmail: 'jane.doe@acme-logistics.com',
      accountName: 'Acme Logistics',
      personaId: 7,
      hypothesisId: 'H1',
      sender: 'casey@yardflow.ai',
      owner: 'casey@freightroll.com',
      draftItemId: 4242,
      now: NOW,
      enrolledBy: 'casey@freightroll.com',
    }, { suppression: SUPPRESSION_CLEAR });
    // The only write the service makes itself is the sequence_id stamp: addOne, compile(), materializeSequence()
    // and enroll() own their inserts, and enroll() owns the enroll.live audit row, so the service adds none.
    expect(writes(prisma)).toEqual(['draftQueueItem.updateManyx1']);
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual([]);
  });

  it('SF11: the item is stamped with sequence_version_id BEFORE compile() is invoked, so a request that dies mid-compile (no JS exception, so R3-12 never runs) still leaves the item gated, never gate-invisible to queue-actions.ts\'s gapCompileGuard', async () => {
    let stampedBeforeCompileRan = false;
    mockedCompile.mockImplementation(async () => {
      stampedBeforeCompileRan = prisma.draftQueueItem.updateMany.mock.calls.some(
        (c: any) => c[0]?.data?.sequence_version_id === 'v1',
      );
      return ITEM_COMPILE_PASS;
    });
    const prisma = makePrisma({ decision: modexDecision() });
    await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(stampedBeforeCompileRan).toBe(true);
  });

  it('N9: live refuses compiler_disabled while GAP_MESSAGE_COMPILER_ENABLED is off, before materialize and addOne; shadow is unaffected', async () => {
    delete process.env.GAP_MESSAGE_COMPILER_ENABLED;
    const d = deps();
    const r = await enrollFromDecision(makePrisma({ decision: modexDecision() }), input({ mode: 'live' }), d);
    expect(r).toEqual({ ok: false, reason: 'compiler_disabled' });
    expect(refusedPredicates()).toEqual(['compiler_disabled']);
    expect(mockedMaterialize).not.toHaveBeenCalled();
    expect(d.addOne).not.toHaveBeenCalled();
    expect(mockedCompile).not.toHaveBeenCalled();
    const shadow = await enrollFromDecision(makePrisma({ decision: modexDecision() }), input({ mode: 'shadow' }), deps());
    expect(shadow).toMatchObject({ ok: true, kind: 'modex_shadow' });
  });

  it('live: a materialize refusal passes through verbatim and addOne is never called', async () => {
    mockedMaterialize.mockResolvedValue({ ok: false, reason: 'step_not_passed:1' });
    const d = deps();
    const r = await enrollFromDecision(makePrisma({ decision: modexDecision() }), input({ mode: 'live' }), d);
    expect(r).toEqual({ ok: false, reason: 'step_not_passed:1' });
    expect(d.addOne).not.toHaveBeenCalled();
    expect(mockedEnroll).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['step_not_passed:1']);
  });

  it('live: the item compile rejecting refuses compile_not_passed:0, parks the orphan, and never enrolls', async () => {
    mockedCompile.mockResolvedValue({
      id: 'cmp_bad',
      verdict: 'reject',
      checks: [
        { code: 'C01', passed: true, severity: 'reject', detail: '' },
        { code: 'C09', passed: false, severity: 'reject', detail: 'meeting ask' },
      ],
    });
    const prisma = makePrisma({ decision: modexDecision() });
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r).toEqual({ ok: false, reason: 'compile_not_passed:0', detail: 'item compile reject: C09' });
    expect(mockedEnroll).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledWith({
      where: { id: 4242, status: 'draft' },
      data: { status: 'skipped', skipped_reason: 'gap_enroll_refused:compile_not_passed:0' },
    });
    expect(mockedAudit.mock.calls.at(-1)?.[1].payload).toMatchObject({
      predicate: 'compile_not_passed:0',
      draftItemId: 4242,
      parked: true,
      compileId: 'cmp_bad',
      failedChecks: ['C09'],
    });
  });

  it('live: a review_required item compile clears only through an approved request', async () => {
    mockedCompile.mockResolvedValue({ id: 'cmp_rev', verdict: 'review_required', checks: [{ code: 'C14', passed: false, severity: 'review', detail: 'yard' }] });

    const pending = makePrisma({ decision: modexDecision() });
    pending.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_x', status: 'pending' });
    const refused = await enrollFromDecision(pending, input({ mode: 'live' }), deps());
    expect(refused).toMatchObject({ ok: false, reason: 'compile_not_passed:0' });
    expect(mockedEnroll).not.toHaveBeenCalled();

    const approved = makePrisma({ decision: modexDecision() });
    // The version-level rows c0/c1 are passes, so isApproved is consulted only for the item compile.
    approved.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_x', status: 'approved' });
    const ok = await enrollFromDecision(approved, input({ mode: 'live' }), deps());
    expect(ok).toMatchObject({ ok: true, kind: 'modex_enrolled', compileId: 'cmp_rev' });
    expect(approved.sendApprovalRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { risk_reasons: { has: 'gap_compile:cmp_rev' } } }),
    );
  });

  it('live: deps.contract fields are merged OVER the default contract, and linked signals become evidence refs', async () => {
    const prisma = makePrisma({ decision: modexDecision() });
    prisma.prospectingHypothesis.findUnique.mockResolvedValue({
      id: 'H1',
      status: 'approved',
      account_name: 'Acme Logistics',
      observation: 'Acme posted three gate-clerk roles [S:sig_1].',
      problem_hypothesis: 'Clerks exist because the dock and the lot disagree.',
      problem_family: 'hidden_capacity',
      signals: [
        {
          signal: {
            id: 'sig_1',
            title: 'Three gate-clerk roles posted',
            evidence_url: 'https://example.com/jobs',
            external_ok: true,
            observed_at: new Date('2026-09-20T00:00:00.000Z'),
            freshness_expires_at: null,
            source_type: 'public_primary',
            metadata: null,
          },
        },
      ],
    });
    await enrollFromDecision(prisma, input({ mode: 'live' }), deps({ contract: { namedPipeline: ['Example Co'], claimsUsed: ['CR-001'] } }));
    const contract = mockedCompile.mock.calls[0][0].contract;
    expect(contract).toEqual({
      hypothesis: {
        observation: 'Acme posted three gate-clerk roles [S:sig_1].',
        problemHypothesis: 'Clerks exist because the dock and the lot disagree.',
        problemFamily: 'hidden_capacity',
      },
      evidence: [
        { id: 'sig_1', title: 'Three gate-clerk roles posted', url: 'https://example.com/jobs', externalOk: true, fresh: true, superseded: false, firstParty: false },
      ],
      stepCount: 2,
      claimsUsed: ['CR-001'],
      namedPipeline: ['Example Co'],
    });
  });

  it('live: a queue refusal is queue_refused:<reason> and enroll() is never called', async () => {
    const d = deps({ addOne: asyncSpy(async () => ({ ok: false, reason: 'already_queued' })) });
    const r = await enrollFromDecision(makePrisma({ decision: modexDecision() }), input({ mode: 'live' }), d);
    expect(r).toEqual({ ok: false, reason: 'queue_refused:already_queued' });
    expect(mockedEnroll).not.toHaveBeenCalled();
    expect(refusedPredicates()).toEqual(['queue_refused:already_queued']);
  });

  it('live: a refusal from enroll() passes through verbatim and parks the orphan item as skipped', async () => {
    mockedEnroll.mockResolvedValue({ ok: false, reason: 'suppressed' });
    const prisma = makePrisma({ decision: modexDecision() });
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r).toEqual({ ok: false, reason: 'suppressed' });
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledWith({
      where: { id: 4242, status: 'draft' },
      data: { status: 'skipped', skipped_reason: 'gap_enroll_refused:suppressed' },
    });
    expect(mockedAudit.mock.calls.at(-1)?.[1].payload).toMatchObject({ predicate: 'suppressed', draftItemId: 4242, parked: true });
  });

  it('R3-4: the slot is filled from the hypothesis; the queue gets the STRIPPED copy, the compiler the MARKED copy', async () => {
    const slotted = { ...STEPS, steps: [{ ...STEPS.steps[0], templates: { subjectTemplate: 'Gate clerks at {{account}}', bodyTemplate: 'Hi {{first_name}},\n{{observation}}\n\nMy guess is the lot.\n\nCasey', hubspotTemplateId: null } }, STEPS.steps[1]] };
    const hypothesis = {
      id: 'H1',
      status: 'approved',
      account_name: 'Acme Logistics',
      observation: 'Acme posted three gate-clerk roles [S:sig_1].',
      problem_hypothesis: 'The lot is the constraint.',
      problem_family: 'hidden_capacity',
      signals: [{ signal: { id: 'sig_1', title: 'Three gate-clerk roles posted', evidence_url: 'https://example.com/jobs', external_ok: true, observed_at: new Date('2026-09-20T00:00:00.000Z'), freshness_expires_at: null, source_type: 'public_primary', metadata: null } }],
    };
    const d = deps();
    const live = await enrollFromDecision(makePrisma({ decision: modexDecision(), version: { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps: slotted }, hypothesis }), input({ mode: 'live' }), d);
    expect(live.ok).toBe(true);
    const queued = d.addOne.mock.calls[0][0].body;
    expect(queued).toBe('Hi Jane,\nAcme posted three gate-clerk roles.\n\nMy guess is the lot.\n\nCasey');
    expect(queued).not.toContain('[[');
    const compiledBody = mockedCompile.mock.calls[0][0].body;
    expect(compiledBody).toBe('Hi Jane,\nAcme posted three gate-clerk roles [[SRC:sig_1]].\n\nMy guess is the lot.\n\nCasey');
    expect(mockedCompile.mock.calls[0][0].contract.evidence[0]).toMatchObject({ id: 'sig_1', fresh: true, externalOk: true });

    const shadow = await enrollFromDecision(makePrisma({ decision: modexDecision(), version: { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps: slotted }, hypothesis }), input({ mode: 'shadow' }), deps());
    expect(shadow).toMatchObject({ ok: true, kind: 'modex_shadow' });
    expect((shadow as any).wouldBe.body).toBe(queued);
  });

  it('R3-4: unrendered_placeholder:observation refuses shadow and live when the hypothesis has no observation, before addOne', async () => {
    const slotted = { ...STEPS, steps: [{ ...STEPS.steps[0], templates: { subjectTemplate: 'S', bodyTemplate: 'Hi {{first_name}},\n{{observation}}\n\nCasey', hubspotTemplateId: null } }, STEPS.steps[1]] };
    for (const mode of ['shadow', 'live'] as const) {
      const prisma = makePrisma({ decision: modexDecision(), version: { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps: slotted } });
      const d = deps();
      const r = await enrollFromDecision(prisma, input({ mode }), d);
      expect(r).toEqual({ ok: false, reason: 'unrendered_placeholder:observation' });
      expect(d.addOne).not.toHaveBeenCalled();
      expect(mockedMaterialize).not.toHaveBeenCalled();
      expect(writes(prisma)).toEqual([]);
      expect(mockedAudit.mock.calls.at(-1)?.[1].payload).toMatchObject({ predicate: 'unrendered_placeholder:observation', token: 'observation' });
    }
  });

  it('R3-12: an exception after addOne parks the orphan as skipped gap_enroll_error:<name> and rethrows (enroll() throwing)', async () => {
    class DbGone extends Error {
      constructor() {
        super('connection reset');
        this.name = 'DbGone';
      }
    }
    mockedEnroll.mockRejectedValue(new DbGone());
    const prisma = makePrisma({ decision: modexDecision() });
    await expect(enrollFromDecision(prisma, input({ mode: 'live' }), deps())).rejects.toThrow('connection reset');
    expect(prisma.draftQueueItem.updateMany).toHaveBeenLastCalledWith({
      where: { id: 4242, status: 'draft' },
      data: { status: 'skipped', skipped_reason: 'gap_enroll_error:DbGone' },
    });
  });

  it('R3-12: the same park applies when the per-item compile throws, and a park failure never masks the original error', async () => {
    mockedCompile.mockRejectedValue(new TypeError('critic exploded'));
    const prisma = makePrisma({ decision: modexDecision() });
    await expect(enrollFromDecision(prisma, input({ mode: 'live' }), deps())).rejects.toThrow('critic exploded');
    expect(prisma.draftQueueItem.updateMany).toHaveBeenLastCalledWith({
      where: { id: 4242, status: 'draft' },
      data: { status: 'skipped', skipped_reason: 'gap_enroll_error:TypeError' },
    });
    expect(mockedEnroll).not.toHaveBeenCalled();

    // The park itself failing (the database is gone) still surfaces the ORIGINAL error.
    mockedCompile.mockRejectedValue(new TypeError('critic exploded'));
    const broken = makePrisma({ decision: modexDecision() });
    broken.draftQueueItem.updateMany.mockImplementation(async ({ data }: any) => {
      if (data?.status === 'skipped') throw new Error('park failed');
      return { count: 1 };
    });
    await expect(enrollFromDecision(broken, input({ mode: 'live' }), deps())).rejects.toThrow('critic exploded');
  });

  it('step_has_no_copy:0 when the version step 0 carries no templates', async () => {
    const steps = { ...STEPS, steps: [{ ...STEPS.steps[0], templates: null }, STEPS.steps[1]] };
    const prisma = makePrisma({
      decision: modexDecision(),
      version: { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps },
    });
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow' }), deps());
    expect(r).toEqual({ ok: false, reason: 'step_has_no_copy:0' });
  });
});
