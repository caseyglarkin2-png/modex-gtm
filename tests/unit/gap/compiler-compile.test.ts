/**
 * Compiler orchestrator (GAP Prospecting OS, Sprint 3, S3-T9).
 *
 * Pins the verdict rule (reject > review_required > pass), the critic
 * discipline (a check reject never consults the critic; a critic failure is
 * never a pass), the persisted GapCompile row, the local audit write, and two
 * structural invariants read from the source: the single `pass` assignment
 * site and the absence of any send path import.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { GROUP_A_CHECKS } from '@/lib/gap/compiler/checks/c01-evidence';
import { GROUP_B_CHECKS } from '@/lib/gap/compiler/checks/c04-product';
import { GROUP_C_CHECKS } from '@/lib/gap/compiler/checks/c13-claims';
import { ALL_CHECKS, CHECK_CODES, COMPILER_VERSION, codeOfCheck } from '@/lib/gap/compiler';
import { compile, type CompileDeps, type CompileInput } from '@/lib/gap/compiler/compile';
import type { Check, CheckSeverity } from '@/lib/gap/compiler/types';
import type { CriticClient, CriticScoreResult } from '@/lib/gap/critic-client';

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';

/** Passes every one of the sixteen checks at step 0 with the evidence below. */
export const PASSING_BODY = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

export const PASSING_CONTRACT = {
  hypothesis: {
    observation: 'Ohio DC posted three gate-clerk roles in August.',
    problemHypothesis: 'Clerks exist because the dock and the lot disagree.',
    problemFamily: 'hidden_capacity',
  },
  evidence: [
    { id: 'ev_1', title: 'Ohio DC job postings, August', url: 'https://example.test/jobs', externalOk: true, fresh: true, superseded: false, firstParty: false },
  ],
  proofRefs: [],
  namedPipeline: [],
  claimsUsed: [],
  stepCount: 4,
};

function criticResult(result: CriticScoreResult): CriticClient & { score: ReturnType<typeof vi.fn> } {
  return { score: vi.fn(async () => result) };
}

const CRITIC_PASS: CriticScoreResult = { ok: true, verdict: 'pass', score: 100, findings: [] };

function stubCheck(code: string, passed: boolean, severity: CheckSeverity = 'reject'): Check {
  return () => ({ code, passed, severity, detail: `${code} stub ${passed ? 'pass' : 'fail'}`, span: null });
}

function input(overrides: Partial<CompileInput> = {}): CompileInput {
  return {
    hypothesisId: 'hyp_1',
    stepIndex: 0,
    subject: 'Ohio gate roles',
    body: PASSING_BODY,
    priorBodies: [],
    contract: PASSING_CONTRACT,
    createdBy: 'casey@freightroll.com',
    ...overrides,
  };
}

function fakePrisma() {
  return {
    gapCompile: { create: vi.fn(async () => ({ id: 'cmp_1' })) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'aud_1' })) },
  };
}

function deps(overrides: Partial<CompileDeps> = {}): CompileDeps {
  return { critic: criticResult(CRITIC_PASS), postReview: vi.fn(async () => ({ posted: true as const })), ...overrides };
}

// ---------------------------------------------------------------------------
// ALL_CHECKS
// ---------------------------------------------------------------------------

describe('ALL_CHECKS', () => {
  it('is the union of groups A, B and C, sixteen checks, in code order C01..C16', () => {
    const union = new Set([...GROUP_A_CHECKS, ...GROUP_B_CHECKS, ...GROUP_C_CHECKS]);
    expect(ALL_CHECKS).toHaveLength(16);
    expect(new Set(ALL_CHECKS)).toEqual(union);
    expect(CHECK_CODES).toEqual([
      'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16',
    ]);
    const ctx = {
      stepIndex: 0,
      hypothesis: PASSING_CONTRACT.hypothesis,
      evidence: PASSING_CONTRACT.evidence,
      priorStepBodies: [],
      contract: PASSING_CONTRACT,
    };
    const emitted = ALL_CHECKS.map((check) => check({ subject: 'Ohio gate roles', body: PASSING_BODY }, ctx).code);
    expect(emitted).toEqual(CHECK_CODES);
    ALL_CHECKS.forEach((check, i) => expect(codeOfCheck(check, i)).toBe(CHECK_CODES[i]));
  });

  it('codeOfCheck falls back to the function name for an unknown check', () => {
    const custom: Check = function checkCustomThing() {
      return { code: 'X', passed: true, severity: 'reject', detail: '', span: null };
    };
    expect(codeOfCheck(custom, 3)).toBe('checkCustomThing');
    expect(codeOfCheck(() => ({ code: 'X', passed: true, severity: 'reject', detail: '', span: null }), 3)).toBe('check_3');
  });

  it('COMPILER_VERSION is a non-empty string', () => {
    expect(typeof COMPILER_VERSION).toBe('string');
    expect(COMPILER_VERSION.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

describe('compile: verdicts', () => {
  it('pass: every real check passes and the critic passes', async () => {
    const critic = criticResult(CRITIC_PASS);
    const r = await compile(input(), deps({ critic }));
    expect(r.checks.filter((c) => !c.passed).map((c) => `${c.code}: ${c.detail}`)).toEqual([]);
    expect(r.verdict).toBe('pass');
    expect(r.checks.map((c) => c.code)).toEqual(CHECK_CODES);
    expect(r.critic).toEqual(CRITIC_PASS);
    expect(r.wordCount).toBeGreaterThanOrEqual(45);
    expect(r.wordCount).toBeLessThanOrEqual(80);
    expect(r.ctaFamily).toBe('scorecard_reply');
    expect(r.allowedCtaFamily).toBe('scorecard_reply');
    expect(r.evidenceIdsUsed).toEqual(['ev_1']);
    expect(r.compilerVersion).toBe(COMPILER_VERSION);
    expect(r.hypothesisId).toBe('hyp_1');
    expect(r.stepIndex).toBe(0);
    expect(r.id).toBeUndefined();
    expect(critic.score).toHaveBeenCalledTimes(1);
    expect(critic.score).toHaveBeenCalledWith({ subject: 'Ohio gate roles', body: PASSING_BODY, type: 'cold_email' });
  });

  it('reject never consults the critic', async () => {
    const critic = criticResult(CRITIC_PASS);
    const checks = [stubCheck('C01', true), stubCheck('C11', false, 'reject'), stubCheck('C15', false, 'review')];
    const r = await compile(input(), deps({ critic, checks }));
    expect(r.verdict).toBe('reject');
    expect(critic.score).not.toHaveBeenCalled();
    expect(r.critic).toEqual({ ok: false, reason: 'critic_skipped:check_reject' });
    expect(r.checks.map((c) => [c.code, c.passed])).toEqual([['C01', true], ['C11', false], ['C15', false]]);
  });

  it('a review check -> review_required even when the critic passes (and the critic is consulted)', async () => {
    const critic = criticResult(CRITIC_PASS);
    const checks = [stubCheck('C01', true), stubCheck('C15', false, 'review')];
    const r = await compile(input(), deps({ critic, checks }));
    expect(r.verdict).toBe('review_required');
    expect(critic.score).toHaveBeenCalledTimes(1);
  });

  it('critic down -> review_required, never pass, with the failure reason recorded', async () => {
    for (const reason of ['critic_unreachable', 'critic_timeout', 'critic_http_500', 'critic_malformed', 'critic_unconfigured'] as const) {
      const critic = criticResult({ ok: false, reason });
      const r = await compile(input(), deps({ critic, checks: [stubCheck('C01', true)] }));
      expect(r.verdict, reason).toBe('review_required');
      expect(r.critic).toEqual({ ok: false, reason });
    }
  });

  it('a critic client that throws is recorded as critic_threw and is a review_required', async () => {
    const critic: CriticClient = {
      score: async () => {
        throw new Error('socket hang up');
      },
    };
    const r = await compile(input(), deps({ critic, checks: [stubCheck('C01', true)] }));
    expect(r.verdict).toBe('review_required');
    expect(r.critic).toEqual({ ok: false, reason: 'critic_threw:socket hang up' });
  });

  it('critic review -> review_required; critic reject -> reject', async () => {
    const review = await compile(
      input(),
      deps({ critic: criticResult({ ok: true, verdict: 'review', score: 94, findings: [] }), checks: [stubCheck('C01', true)] }),
    );
    expect(review.verdict).toBe('review_required');
    const reject = await compile(
      input(),
      deps({ critic: criticResult({ ok: true, verdict: 'reject', score: 75, findings: [] }), checks: [stubCheck('C01', true)] }),
    );
    expect(reject.verdict).toBe('reject');
  });

  it('a throwing check is recorded as a review check_error, never a pass', async () => {
    const boom: Check = () => {
      throw new Error('regex blew up');
    };
    const r = await compile(input(), deps({ checks: [stubCheck('C01', true), boom, stubCheck('C03', true)] }));
    expect(r.verdict).toBe('review_required');
    // An arrow bound to `const boom` carries that inferred name; codeOfCheck falls back to it.
    expect(r.checks[1]).toEqual({
      code: 'boom',
      passed: false,
      severity: 'review',
      detail: 'check_error:regex blew up',
      span: null,
    });
  });

  it('claims used without a validator -> C13 review -> review_required; with the validator -> pass', async () => {
    const contract = { ...PASSING_CONTRACT, claimsUsed: ['CR-001'] };
    const without = await compile(input({ contract }), deps());
    expect(without.verdict).toBe('review_required');
    expect(without.checks.find((c) => c.code === 'C13')).toMatchObject({ passed: false, severity: 'review' });

    const validateClaims = vi.fn(() => ({ ok: true as const }));
    const withValidator = await compile(input({ contract }), deps({ validateClaims }));
    expect(withValidator.verdict).toBe('pass');
    expect(validateClaims).toHaveBeenCalledWith(['CR-001'], { stepIsQuestion: true, surface: 'sales_email' });
  });

  it('claims refused by the validator -> reject and the critic is not called', async () => {
    const critic = criticResult(CRITIC_PASS);
    const contract = { ...PASSING_CONTRACT, claimsUsed: ['CR-999'] };
    const r = await compile(
      input({ contract }),
      deps({ critic, validateClaims: () => ({ ok: false, reason: 'claim_unknown:CR-999' }) }),
    );
    expect(r.verdict).toBe('reject');
    expect(r.checks.find((c) => c.code === 'C13')?.detail).toContain('claim_unknown:CR-999');
    expect(critic.score).not.toHaveBeenCalled();
  });

  it('evidence refs missing their flags read fail-closed (stale) and C01 rejects', async () => {
    const contract = { ...PASSING_CONTRACT, evidence: [{ id: 'ev_1', title: 'Ohio DC job postings, August' }] };
    const r = await compile(input({ contract }), deps());
    expect(r.verdict).toBe('reject');
    expect(r.checks.find((c) => c.code === 'C01')?.detail).toContain('stale evidence ev_1');
  });

  it('a null contract compiles (checks read empty) and does not throw', async () => {
    const r = await compile(input({ contract: null }), deps());
    expect(['reject', 'review_required', 'pass']).toContain(r.verdict);
    expect(r.checks).toHaveLength(16);
  });
});

// ---------------------------------------------------------------------------
// Persistence and audit
// ---------------------------------------------------------------------------

describe('compile: persistence and audit', () => {
  it('persists a GapCompile row and audits compile.result with the verdict', async () => {
    const prisma = fakePrisma();
    const postReview = vi.fn(async (_entry: unknown) => ({ posted: true as const }));
    const now = () => new Date('2026-09-23T12:00:00Z');
    const r = await compile(
      input({ sequenceVersionId: 'ver_1', draftQueueItemId: 42 }),
      deps({ prisma, postReview, now }),
    );
    expect(r.verdict).toBe('pass');
    expect(r.id).toBe('cmp_1');

    expect(prisma.gapCompile.create).toHaveBeenCalledTimes(1);
    const { data } = (prisma.gapCompile.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }])[0];
    expect(data).toMatchObject({
      hypothesis_id: 'hyp_1',
      sequence_version_id: 'ver_1',
      draft_queue_item_id: 42,
      step_index: 0,
      verdict: 'pass',
      word_count: r.wordCount,
      cta_family: 'scorecard_reply',
      evidence_ids_used: ['ev_1'],
      compiler_version: COMPILER_VERSION,
      critic: CRITIC_PASS,
      created_by: 'casey@freightroll.com',
    });
    expect(data.checks).toEqual(r.checks);
    expect(data.inputs_snapshot).toMatchObject({
      hypothesisId: 'hyp_1',
      sequenceVersionId: 'ver_1',
      draftQueueItemId: 42,
      stepIndex: 0,
      subject: 'Ohio gate roles',
      body: PASSING_BODY,
      priorBodies: [],
      contract: PASSING_CONTRACT,
      createdBy: 'casey@freightroll.com',
      compiledAt: '2026-09-23T12:00:00.000Z',
    });
    expect(data.result).toMatchObject({ verdict: 'pass', ctaFamily: 'scorecard_reply', allowedCtaFamily: 'scorecard_reply' });

    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    const audit = (prisma.gapAuditEvent.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }])[0].data;
    expect(audit).toMatchObject({
      kind: 'compile.result',
      actor: 'casey@freightroll.com',
      subject_type: 'gap_compile',
      subject_id: 'cmp_1',
    });
    expect(audit.payload).toMatchObject({ verdict: 'pass', hypothesisId: 'hyp_1', draftQueueItemId: 42, stepIndex: 0 });
    expect(r.audit).toEqual({ stored: true, reviewQueued: true });
    await Promise.resolve();
    expect(postReview).toHaveBeenCalledTimes(1);
    expect(postReview.mock.calls[0][0]).toMatchObject({ motion: 'gap', action: 'compile.result', target: 'hyp_1' });
  });

  it('a non-pass verdict is audited locally but not fanned out to the review feed', async () => {
    const prisma = fakePrisma();
    const postReview = vi.fn(async () => ({ posted: true as const }));
    const r = await compile(input(), deps({ prisma, postReview, checks: [stubCheck('C11', false)] }));
    expect(r.verdict).toBe('reject');
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    expect(r.audit).toEqual({ stored: true, reviewQueued: false });
    await Promise.resolve();
    expect(postReview).not.toHaveBeenCalled();
  });

  it('a failed row write does not lose the verdict: id stays undefined, audit still attempted', async () => {
    const prisma = fakePrisma();
    prisma.gapCompile.create.mockRejectedValueOnce(new Error('db down'));
    const r = await compile(input(), deps({ prisma }));
    expect(r.verdict).toBe('pass');
    expect(r.id).toBeUndefined();
    expect(r.persistError).toBe('db down');
  });

  it('without prisma nothing is written and no audit is attempted', async () => {
    const postReview = vi.fn(async () => ({ posted: true as const }));
    const r = await compile(input(), deps({ postReview }));
    expect(r.id).toBeUndefined();
    expect(r.audit).toBeUndefined();
    await Promise.resolve();
    expect(postReview).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Structural invariants (read from the source)
// ---------------------------------------------------------------------------

describe('compile.ts: structural invariants', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'src/lib/gap/compiler/compile.ts'), 'utf8');

  it("has exactly one `verdict = 'pass'` site and it is guarded by checksClean && criticPassed", () => {
    const sites = source.match(/verdict\s*=\s*'pass'/g) ?? [];
    expect(sites).toHaveLength(1);
    const lines = source.split(/\r?\n/);
    const at = lines.findIndex((l) => /verdict\s*=\s*'pass'/.test(l));
    const window = lines.slice(Math.max(0, at - 2), at + 1).join('\n');
    expect(window).toMatch(/if \(checksClean && criticPassed\)/);
    expect(source).toMatch(/const criticPassed = critic\.ok === true && critic\.verdict === 'pass';/);
    expect(source).toMatch(/const checksClean = !anyReject && !anyReview;/);
  });

  it('imports no send path', () => {
    expect(source).not.toMatch(/from ['"]@\/lib\/email/);
    expect(source).not.toMatch(/from ['"][^'"]*lib\/email\//);
    expect(source).not.toMatch(/from ['"][^'"]*lib\/queue\/send/);
    expect(source).not.toMatch(/gmail|sendgrid|nodemailer/i);
  });
});
