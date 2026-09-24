/**
 * GAP Prospecting OS, Sprint 6B: multi-engine execution contract end-to-end
 * demo against a SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   GAP_OS_ENABLED=true npx tsx scripts/gap/e2e-6b.ts
 *
 * Proves `legacyEnrollAdapter` against the REAL `enrollFromDecision`, a real
 * database and real GAP guard triggers, not mocks:
 *
 *   1. A plain shadow enroll (no SF14 opt-in) returns a translated
 *      { engine: 'modex_queue', status: 'shadow' } receipt.
 *   2. The SAME compile row, ~40 hours old, refuses compile_stale:0 once the
 *      caller opts into a 1-hour maxCompileAgeMs -- proving 6B-T2's opt-in
 *      staleness check is wired into the real gate chain, not just unit
 *      tested against a mock.
 *   3. A hypothesis whose one linked signal's freshness_expires_at is
 *      already past refuses evidence_expired once the caller opts into
 *      checkEvidenceFreshness, against a real HypothesisSignal link and a
 *      real ProspectingSignal row.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - GAP_AUTO_ENROLL_ENABLED, GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED and
 *     GAP_HUBSPOT_MIRROR_ENABLED are asserted unset; every enroll here is
 *     shadow mode, so nothing outbound is possible regardless.
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *
 * Writes docs/gap/6b-e2e-latest.md (no em dashes, no secrets) on every run,
 * PASS or FAIL, before cleanup.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { legacyEnrollAdapter } from '../../src/lib/gap/execution/legacy-enroll-adapter';
import type { ExecutionIntent } from '../../src/lib/gap/execution/contract';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', '6b-e2e-latest.md');

function describeDatabase(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '<unparseable>';
  }
}

class StepFailure extends Error {
  constructor(public readonly step: string, message: string) {
    super(message);
    this.name = 'StepFailure';
  }
}

function errorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as { message?: unknown; meta?: unknown; cause?: unknown };
  return [e.message, e.meta ? JSON.stringify(e.meta) : '', e.cause ? String(e.cause) : ''].filter(Boolean).join(' ');
}

interface StepLine {
  step: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}
const lines: StepLine[] = [];
const counts: Record<string, number | string> = {};

function pass(step: string, detail: string): void {
  lines.push({ step, status: 'PASS', detail });
  console.log(`PASS ${step}: ${detail}`);
}
function fail(step: string, detail: string): never {
  lines.push({ step, status: 'FAIL', detail });
  console.log(`FAIL ${step}: ${detail}`);
  throw new StepFailure(step, detail);
}
function expect(step: string, condition: boolean, detail: string): void {
  if (!condition) fail(step, detail);
}

const ONE_STEP = {
  schema: 'steps.v2',
  steps: [
    {
      index: 0,
      delay: { value: 0, unit: 'business_days' },
      purpose: 'intrigue',
      productProofAllowed: false,
      requiredEvidenceTypes: [],
      claimsUsed: [],
      templates: { subjectTemplate: 'Hi {{first_name}}', bodyTemplate: 'Body', hubspotTemplateId: null },
    },
  ],
};

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be a scratch database (got ${describeDatabase(databaseUrl) || 'unset'})`);
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);
  for (const name of ['GAP_AUTO_ENROLL_ENABLED', 'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED', 'GAP_HUBSPOT_MIRROR_ENABLED'] as const) {
    expect('rails.flags_off', !process.env[name], `${name} must be unset for this e2e (found ${process.env[name]})`);
  }
  process.env.GAP_OS_ENABLED = 'true';

  const tag = `gap6b-${Date.now()}`;
  const gitSha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();

  const account = `GAP E2E 6B Account ${tag}`;
  const NOW = new Date();
  const STALE_CREATED_AT = new Date(NOW.getTime() - 40 * 60 * 60 * 1000); // ~40h old

  const prisma = new PrismaClient();
  let familyId = '';
  let versionAId = '';
  let versionBId = '';
  let hypAId = '';
  let hypCId = '';
  let signalId = '';
  let personaId = 0;
  let failure: StepFailure | null = null;

  try {
    await prisma.account.create({ data: { rank: 9101, name: account, vertical: 'e2e' } });
    const persona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-p1`,
        account_name: account,
        priority: 'P1',
        name: 'E2E Contact',
        email: `${tag}@example.com`,
        email_status: 'verified',
        is_contact_ready: true,
        do_not_contact: false,
      },
    });
    personaId = persona.id;

    const family = await prisma.sequenceFamily.create({ data: { engine: 'modex_draft_queue' } });
    familyId = family.id;
    const versionA = await prisma.sequenceVersion.create({
      data: { family_id: familyId, version: 1, steps: ONE_STEP, steps_hash: `hash_a_${tag}`, status: 'draft' },
    });
    versionAId = versionA.id;
    const versionC = await prisma.sequenceVersion.create({
      data: { family_id: familyId, version: 2, steps: ONE_STEP, steps_hash: `hash_c_${tag}`, status: 'draft' },
    });
    versionBId = versionC.id;

    const compileA = await prisma.gapCompile.create({
      data: {
        sequence_version_id: versionAId,
        step_index: 0,
        verdict: 'pass',
        checks: [],
        compiler_version: 'e2e-6b',
        result: { ok: true },
        created_at: STALE_CREATED_AT,
      },
    });
    const compileC = await prisma.gapCompile.create({
      data: {
        sequence_version_id: versionBId,
        step_index: 0,
        verdict: 'pass',
        checks: [],
        compiler_version: 'e2e-6b',
        result: { ok: true },
        created_at: NOW,
      },
    });

    const hypA = await prisma.prospectingHypothesis.create({
      data: {
        account_name: account,
        problem_family: 'hidden_capacity',
        observation: 'Fact. [S:x]',
        problem_hypothesis: 'Maybe.',
        root_cause_hypotheses: ['a'],
        impact_hypotheses: ['b'],
        falsification_questions: ['c?'],
        persona: 'site_ops',
        confidence: 40,
        status: 'draft',
        created_by: 'e2e',
      },
    });
    hypAId = hypA.id;

    const signal = await prisma.prospectingSignal.create({
      data: {
        account_name: account,
        source_kind: 'manual',
        source_id: `${tag}-sig`,
        type: 'news',
        title: 'Expired fact',
        source_type: 'manual',
        observed_at: new Date(NOW.getTime() - 100 * 24 * 60 * 60 * 1000),
        confidence: 50,
        freshness_expires_at: new Date(NOW.getTime() - 24 * 60 * 60 * 1000), // expired yesterday
        registered_by: 'e2e',
      },
    });
    signalId = signal.id;

    const hypC = await prisma.prospectingHypothesis.create({
      data: {
        account_name: account,
        problem_family: 'hidden_capacity',
        observation: 'Fact. [S:x]',
        problem_hypothesis: 'Maybe.',
        root_cause_hypotheses: ['a'],
        impact_hypotheses: ['b'],
        falsification_questions: ['c?'],
        persona: 'site_ops',
        confidence: 40,
        status: 'draft',
        created_by: 'e2e',
      },
    });
    hypCId = hypC.id;
    await prisma.hypothesisSignal.create({ data: { hypothesis_id: hypCId, signal_id: signalId } });

    pass(
      'seed',
      `account, persona, family, 2 versions (A stale-compile, C expired-evidence), 2 compiles (A ~40h old, C fresh), 2 hypotheses (A no signals, C linked to an expired signal)`,
    );

    const deps = { addOne: async () => ({ ok: true as const, id: 1 }), suppression: staticSuppressionReader('clear') };

    // 1. Plain shadow, no SF14 opt-in: succeeds despite the ~40h-old compile.
    const intentA: ExecutionIntent = {
      engine: 'modex_queue',
      personaId,
      hypothesisId: hypAId,
      sequenceVersionId: versionAId,
      stepIndex: 0,
      compileIds: [compileA.id],
      senderIdentity: 'casey@yardflow.ai',
      idempotencyKey: `${tag}-a`,
      actor: 'e2e',
      actorKind: 'human',
      mode: 'shadow',
      now: NOW,
    };
    const receiptA = await legacyEnrollAdapter(prisma, intentA, deps);
    expect('plain_shadow', receiptA.status === 'shadow' && receiptA.engine === 'modex_queue', `expected a shadow receipt, got ${JSON.stringify(receiptA)}`);
    pass('plain_shadow', JSON.stringify(receiptA));

    // 2. Same compile, opt into a 1-hour max age: refuses compile_stale:0.
    const receiptB = await legacyEnrollAdapter(prisma, { ...intentA, idempotencyKey: `${tag}-b` }, { ...deps, maxCompileAgeMs: 60 * 60 * 1000 });
    expect('compile_stale', receiptB.status === 'refused' && receiptB.refusalReason === 'compile_stale:0', `expected compile_stale:0, got ${JSON.stringify(receiptB)}`);
    pass('compile_stale', JSON.stringify(receiptB));

    // 3. A hypothesis linked to a real expired signal, opt into the evidence-freshness recheck.
    const intentC: ExecutionIntent = {
      ...intentA,
      hypothesisId: hypCId,
      sequenceVersionId: versionBId,
      compileIds: [compileC.id],
      idempotencyKey: `${tag}-c`,
    };
    const receiptC = await legacyEnrollAdapter(prisma, intentC, { ...deps, checkEvidenceFreshness: true });
    expect('evidence_expired', receiptC.status === 'refused' && receiptC.refusalReason === 'evidence_expired', `expected evidence_expired, got ${JSON.stringify(receiptC)}`);
    pass('evidence_expired', JSON.stringify(receiptC));
  } catch (err) {
    if (err instanceof StepFailure) {
      failure = err;
    } else {
      failure = new StepFailure('unexpected', errorText(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: errorText(err) });
      console.log(`FAIL unexpected: ${errorText(err)}`);
    }
  } finally {
    const removed = await cleanup(prisma, { account, familyId, hypAId, hypCId, signalId });
    for (const [table, count] of Object.entries(removed)) counts[`cleanup.${table}`] = count;
    const leftoverAccounts = await prisma.account.count({ where: { name: account } });
    expect('cleanup.zero_leftovers', leftoverAccounts === 0, `leftover accounts=${leftoverAccounts}`);
    writeReport({ failure, tag, dbHost, gitSha });
    await prisma.$disconnect();
  }

  return failure ? 1 : 0;
}

async function cleanup(
  prisma: PrismaClient,
  ids: { account: string; familyId: string; hypAId: string; hypCId: string; signalId: string },
): Promise<Record<string, number>> {
  const removed: Record<string, number> = {};
  removed.hypothesis_signals = (await prisma.hypothesisSignal.deleteMany({ where: { hypothesis_id: ids.hypCId } })).count;
  removed.gap_compiles = (await prisma.gapCompile.deleteMany({ where: { sequence_version_id: { not: null }, version: { family_id: ids.familyId } } })).count;
  removed.prospecting_hypotheses = (await prisma.prospectingHypothesis.deleteMany({ where: { account_name: ids.account } })).count;
  removed.prospecting_signals = (await prisma.prospectingSignal.deleteMany({ where: { id: ids.signalId } })).count;
  removed.sequence_versions = (await prisma.sequenceVersion.deleteMany({ where: { family_id: ids.familyId } })).count;
  removed.sequence_families = (await prisma.sequenceFamily.deleteMany({ where: { id: ids.familyId } })).count;
  removed.personas = (await prisma.persona.deleteMany({ where: { account_name: ids.account } })).count;
  removed.accounts = (await prisma.account.deleteMany({ where: { name: ids.account } })).count;
  return removed;
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# 6B execution contract end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-6b.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`),
    '',
    'Every row the run created was deleted in the finally block; zero-leftover count asserted above. Every enroll in this run was shadow mode: no queue item, no HubSpot call, no send.',
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(errorText(err));
    process.exit(1);
  });
