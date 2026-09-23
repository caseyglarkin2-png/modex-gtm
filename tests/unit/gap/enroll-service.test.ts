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
vi.mock('@/lib/gap/sequence/enrollment', () => ({
  enroll: mockedEnroll,
  recordExternalEnrollment: mockedRecord,
}));
vi.mock('@/lib/email/autonomy-gate', () => ({ autonomyHalted: mockedAutonomyHalted }));
vi.mock('@/lib/gap/compiler/compile', () => ({ compile: mockedCompile }));
vi.mock('@/lib/gap/sequences/service', () => ({ materializeSequence: mockedMaterialize }));

import { enrollFromDecision, evidenceRefsFromSignals, verifyCompiles, type EnrollDeps, type EnrollFromDecisionInput } from '@/lib/gap/enroll/service';
import { enrollmentId } from '@/lib/gap/sequence/external-sync';

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

function compileRow(id: string, stepIndex: number, verdict: string, createdAt = '2026-09-22T00:00:00.000Z', versionId = 'v1') {
  return { id, sequence_version_id: versionId, step_index: stepIndex, verdict, created_at: new Date(createdAt) };
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

function makePrisma(opts: { compiles?: any[]; decision?: any; version?: any; persona?: any; hypothesis?: any } = {}) {
  const p = {
    sequenceVersion: {
      findUnique: asyncSpy(async () =>
        opts.version === undefined ? { id: 'v1', family_id: 'fam_1', version: 1, status: 'draft', steps: STEPS } : opts.version,
      ),
    },
    gapCompile: { findMany: asyncSpy(async () => opts.compiles ?? PASSING_COMPILES) },
    sendApprovalRequest: { findFirst: asyncSpy(async () => null) },
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
    ...overrides,
  } as any;
}

function refusedPredicates(): string[] {
  return mockedAudit.mock.calls.filter((c) => c[1]?.kind === 'enroll.refused').map((c) => c[1].payload.predicate);
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = { GAP_OS_ENABLED: process.env.GAP_OS_ENABLED, GAP_AUTO_ENROLL_ENABLED: process.env.GAP_AUTO_ENROLL_ENABLED };
  process.env.GAP_OS_ENABLED = 'true';
  delete process.env.GAP_AUTO_ENROLL_ENABLED;
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

  it('shadow from an agent is allowed with the flag off', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'shadow', actor: 'cron', actorKind: 'agent' }), deps());
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

  it('live WITHOUT a readback emits the row and records nothing (the service never calls HubSpot)', async () => {
    const prisma = makePrisma();
    const r = await enrollFromDecision(prisma, input({ mode: 'live' }), deps());
    expect(r).toMatchObject({ ok: true, kind: 'enroll_row', mode: 'live', enrollment: null });
    expect(mockedRecord).not.toHaveBeenCalled();
    expect(writes(prisma)).toEqual([]);
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual(['enroll.live']);
  });

  it('live WITH a readback records the enrollment through recordExternalEnrollment under the v5 id', async () => {
    const readback = { activelyEnrolledCount: 1, latestSequenceId: '333', latestEnrolledAt: '2026-09-23T14:00:00.000Z' };
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'live', readback }), deps());
    expect(r).toMatchObject({ ok: true, kind: 'enroll_row', enrollment: { id: 'ext_1', frozen: true, isTest: false } });
    expect(mockedRecord).toHaveBeenCalledTimes(1);
    // recordExternalEnrollment audits the record itself; the service adds no second row.
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual([]);
    expect(mockedRecord.mock.calls[0][1]).toMatchObject({
      id: enrollmentId('333', '222'),
      familyId: 'fam_1',
      versionId: 'v1',
      toEmail: 'jane.doe@acme-logistics.com',
      hubspotContactId: '222',
      hubspotSequenceId: '333',
      hypothesisId: 'H1',
      personaId: 7,
      externalState: readback,
      enrolledBy: 'casey@freightroll.com',
    });
  });

  it('a refusal from recordExternalEnrollment passes through verbatim', async () => {
    mockedRecord.mockResolvedValue({ ok: false, reason: 'already_enrolled' });
    const readback = { activelyEnrolledCount: 1, latestSequenceId: '333', latestEnrolledAt: null };
    const r = await enrollFromDecision(makePrisma(), input({ mode: 'live', readback }), deps());
    expect(r).toEqual({ ok: false, reason: 'already_enrolled' });
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
    expect(mockedMaterialize).toHaveBeenCalledWith(prisma, { versionId: 'v1', compileIds: ['c0', 'c1'] }, 'casey@freightroll.com', expect.objectContaining({ owner: 'casey@freightroll.com' }));
    // The created item carries the Sequence id (the runtime's first guard); a draft-only stamp right after addOne.
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledWith({ where: { id: 4242, status: 'draft' }, data: { sequence_id: 77 } });
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
      'casey@freightroll.com',
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
    });
    // The only write the service makes itself is the sequence_id stamp: addOne, compile(), materializeSequence()
    // and enroll() own their inserts, and enroll() owns the enroll.live audit row, so the service adds none.
    expect(writes(prisma)).toEqual(['draftQueueItem.updateManyx1']);
    expect(mockedAudit.mock.calls.map((c) => c[1].kind)).toEqual([]);
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
