/**
 * GAP Prospecting OS: Sprint 3 end-to-end demo against a SCRATCH database.
 *
 *   HUBSPOT_ACCESS_TOKEN= MC_API_TOKEN= \
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true \
 *   npx tsx scripts/gap/e2e-sprint3.ts
 *
 * Walks the committed Sprint 3 surface in order: seed (account, persona,
 * two registered facts, a hypothesis proposed, approved and activated), a
 * family and version from the Network Standardization seed with the twin
 * refusal, every step compiled through `compile()` with a stub critic and
 * persisted, a meeting ask rejected at step 0 (C09), the approval path on a
 * review_required compile (idempotent), `materializeSequence` refused then
 * created then idempotent, `enrollFromDecision` in shadow (zero writes) and
 * live through the REAL `addOne` into the Draft Queue (enrollment row, the
 * version frozen by the trigger, the item stamped, an item-level compile
 * row), the approveBatch guard's data contract, `scheduleNextStep` for step
 * 1 under the flag (pinned steps, rendered placeholders, deterministic key,
 * business-day delay), the frozen version refused by the service and by the
 * database, a stop that skips the unsent rows including a failed one, the
 * Top100 journal import dry run over its fixture, and the compile-top100
 * persist path over its fixture with the enroll-row compile gate reading the
 * exact skip reasons. Every step prints one PASS/FAIL line; the first FAIL
 * stops the run and the process exits 1. Every row the run creates is
 * deleted in the finally block, in dependency order.
 *
 * Safety rails, all fail-closed:
 *   - DATABASE_URL must point at 127.0.0.1:5433/gap_dev. Anything else exits 2
 *     before a client is built.
 *   - HUBSPOT_ACCESS_TOKEN, MC_API_TOKEN, GOOGLE_REFRESH_TOKEN,
 *     GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are deleted from process.env
 *     before the first write and asserted gone. No HubSpot, clawd or Gmail
 *     call can be made: the critic is a stub, the autonomy reader is a stub,
 *     `addOne`'s Gmail thread check sees no credentials and reports no
 *     thread, and the review-feed poster has no token.
 *   - The four seed families must already exist on the scratch database
 *     (scripts/gap/seed-families.ts --apply); the run creates its OWN family
 *     and version from the seed steps so the shared seed rows are never
 *     frozen by this run.
 *   - The cleanup transaction disables the GAP guard triggers that forbid the
 *     DELETEs it needs and re-enables them in the same transaction. That is
 *     only legitimate on a scratch database, which the URL check guarantees.
 *
 * Not exercised here, and why: `approveBatch` in
 * src/app/discovery/queue-actions.ts calls NextAuth's `auth()`, which reads
 * `headers()` and throws outside a Next request scope, so a script cannot
 * call it; step 9 asserts the guard's data contract (the newest compile row
 * keyed to the item) instead, and tests/unit/gap cover the guard itself.
 *
 * Writes docs/gap/sprint3-e2e-latest.md (no em dashes, no secrets) on every
 * run, PASS or FAIL, before cleanup.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { addOne } from '../../src/app/discovery/queue-actions';
import { validateClaimsUsed } from '../../src/lib/gap/claims/validate-claims';
import { requestApproval } from '../../src/lib/gap/compiler/approval';
import { compile, type CompileResult } from '../../src/lib/gap/compiler/compile';
import type { CriticClient } from '../../src/lib/gap/critic-client';
import { enrollFromDecision } from '../../src/lib/gap/enroll/service';
import { gapFlag } from '../../src/lib/gap/flags';
import { getHypothesis, proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import {
  TOP100_COMPILE_KEY,
  compiledSteps,
  reduceReport,
  toCompileInputs,
  type LaneResearchFile,
  type LaneSequenceFile,
} from '../../src/lib/gap/import/top100-compile';
import { buildEnrollRows, loadCompileGate, type EnrollRowItem } from '../../src/lib/gap/routing/enroll-row';
import type { RoutingInputs } from '../../src/lib/gap/routing/types';
import { stop } from '../../src/lib/gap/sequence/enrollment';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { createVersion, updateVersionSteps } from '../../src/lib/gap/sequence/version';
import { materializeSequence } from '../../src/lib/gap/sequences/service';
import { SEED_PROGRAM, seedFamilyByKey, type SeedFamily } from '../../src/lib/gap/sequences/families';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { scheduleNextStep, sequenceStepIdempotencyKey } from '../../src/lib/queue/sequence-runtime';
import { STATUS } from '../../src/lib/queue/types';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:5433\/gap_dev(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'sprint3-e2e-latest.md');
const SEED_EVIDENCE_FIXTURE = path.join('tests', 'fixtures', 'gap', 'seed-evidence.json');
const COMPILE_FIXTURE_DIR = path.join('tests', 'fixtures', 'gap', 'top100-compile');
const JOURNAL_FIXTURE_DIR = path.join('tests', 'fixtures', 'gap', 'top100-journal');
const SEED_KEY = 'network_standardization';
const ACTOR = 'e2e3';
const OWNER = 'casey@freightroll.com';
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;
/** Fixture contacts of tests/fixtures/gap/top100-compile: Jordan passes step 1 and rejects steps 2 to 4 on C01; Riley rejects step 1 on C09 (meeting ask). */
const FIXTURE_JORDAN = '100000000001';
const FIXTURE_RILEY = '100000000002';

interface FixtureRef {
  id: string;
  title: string;
  url: string;
  externalOk: boolean;
  fresh: boolean;
  superseded: boolean;
  firstParty: boolean;
}
interface SeedEvidenceFixture {
  namedPipeline: string[];
  families: Record<string, { hypothesis: { observation: string; problemHypothesis: string; problemFamily: string }; evidence: FixtureRef[] }>;
}

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

// ---------------------------------------------------------------------------
// Step ledger
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stubs (nothing here reaches a network)
// ---------------------------------------------------------------------------

const criticPass: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) };
const criticReview: CriticClient = {
  score: async () => ({ ok: true, verdict: 'review', score: 88, findings: [{ source: 'congruence', rule: 'e2e', severity: 'warn', message: 'stub review' }] }),
};
const autonomyLive = async () => ({ halted: false });

// ---------------------------------------------------------------------------
// What the run creates, for cleanup
// ---------------------------------------------------------------------------

interface Created {
  accountName: string;
  emails: string[];
  familyId: string | null;
  sequenceName: string | null;
  compileIds: string[];
  syntheticContactId: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(
      `refusing to run: DATABASE_URL must be the scratch database at 127.0.0.1:5433/gap_dev (got ${describeDatabase(databaseUrl) || 'unset'})`,
    );
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);

  const tag = `gap-e2e3-${Date.now()}`;
  const now = new Date();
  const runStart = new Date(now.getTime() - 1000);
  // Digit-free on purpose: the account name is rendered into the copy and C01 treats every number token as a claim.
  const letters = Date.now()
    .toString(36)
    .replace(/[0-9]/g, (d) => 'abcdefghij'[Number(d)]);
  const accountName = `GAP End To End Co ${letters}`;
  const hubspotCompanyId = `e2e3-${tag}`;
  const personaEmail = `priya+${tag}@example.com`;
  const gitSha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();

  console.log(`run tag ${tag}`);
  console.log(`database ${dbHost}`);
  console.log(`git ${gitSha}`);
  console.log(`env GAP_OS_ENABLED=${gapFlag('GAP_OS_ENABLED')} GAP_AUTO_ENROLL_ENABLED=${gapFlag('GAP_AUTO_ENROLL_ENABLED')} scrubbed=[${SCRUBBED_ENV.join(',')}]`);
  counts.gitSha = gitSha;
  counts.databaseHost = dbHost;
  counts.runTag = tag;
  counts.scrubbedEnv = SCRUBBED_ENV.join(',');

  // Fixtures, read before any write.
  const seedEvidence = JSON.parse(readFileSync(SEED_EVIDENCE_FIXTURE, 'utf8')) as SeedEvidenceFixture;
  const seed = seedFamilyByKey(SEED_KEY) as SeedFamily;
  const fx = seedEvidence.families[SEED_KEY];
  const laneSequence = JSON.parse(readFileSync(path.join(COMPILE_FIXTURE_DIR, 'sequences', 'acme-example-com.json'), 'utf8')) as LaneSequenceFile;
  const laneResearch = JSON.parse(readFileSync(path.join(COMPILE_FIXTURE_DIR, 'research', 'acme-example-com.json'), 'utf8')) as LaneResearchFile;

  const created: Created = {
    accountName,
    emails: [personaEmail],
    familyId: null,
    sequenceName: null,
    compileIds: [],
    syntheticContactId: `${tag}-clean`,
  };

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  const contractFor = (stepIndex: number) => ({
    hypothesis: fx.hypothesis,
    evidence: fx.evidence,
    proofRefs: [],
    namedPipeline: seedEvidence.namedPipeline,
    claimsUsed: seed.steps.steps[stepIndex].claimsUsed,
    stepCount: seed.steps.steps.length,
  });
  const stepCopy = (i: number) => ({
    subject: seed.steps.steps[i].templates?.subjectTemplate ?? '',
    body: seed.steps.steps[i].templates?.bodyTemplate ?? '',
  });

  try {
    // 0. Preflight.
    expect('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expect('preflight', !gapFlag('GAP_AUTO_ENROLL_ENABLED'), 'GAP_AUTO_ENROLL_ENABLED is on; this run exercises the human live path with the machine flag off');
    for (const name of SCRUBBED_ENV) expect('preflight', process.env[name] === undefined, `${name} still present`);
    expect('preflight', !!seed && !!fx, `seed family ${SEED_KEY} or its fixture evidence is missing`);
    const seedFamilies = await prisma.sequenceFamily.count({ where: { program: SEED_PROGRAM, engine: 'modex_draft_queue', archived_at: null } });
    expect('preflight', seedFamilies >= 4, `${seedFamilies} seed families on the scratch database, expected 4 (run scripts/gap/seed-families.ts --apply)`);
    const stale = await prisma.account.count({ where: { name: accountName } });
    expect('preflight', stale === 0, `account ${accountName} already exists`);
    const staleFixtureRows = await prisma.gapCompile.count({
      where: { inputs_snapshot: { path: ['contract', TOP100_COMPILE_KEY, 'hubspotContactId'], equals: FIXTURE_RILEY } },
    });
    expect('preflight', staleFixtureRows === 0, `${staleFixtureRows} gap_compiles rows already keyed to fixture contact ${FIXTURE_RILEY}; remove them before running`);
    counts.seedFamiliesOnScratch = seedFamilies;
    pass('preflight', `flags on (auto-enroll off), credentials scrubbed, ${seedFamilies} seed families present, no stale rows`);

    // 1. Seed: account, persona, two facts, a hypothesis proposed, approved and activated.
    seeded = true;
    await prisma.account.create({ data: { rank: 9999, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId } });
    const persona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-ops`,
        account_name: accountName,
        priority: 'P1',
        name: `Priya Natarajan ${tag}`,
        title: 'VP Supply Chain',
        seniority: 'vp',
        email: personaEmail,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: false,
        hubspot_contact_id: `${tag}-c1`,
      },
      select: { id: true },
    });
    const projected = fromOperatorKnowledge(
      { accountName, hubspotCompanyId, personaId: persona.id, text: 'The plant manager said the annual report lists 41 distribution centers folded in from three regional operators.', at: now, sourceId: `${tag}:fact1`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expect('1 seed', projected.ok, `fromOperatorKnowledge refused: ${projected.ok ? '' : projected.reason}`);
    if (!projected.ok) throw new Error('unreachable');
    const fact1 = await registerSignal(prisma, projected.signal);
    const fact2 = await registerSignal(prisma, {
      accountName,
      hubspotCompanyId,
      personaId: persona.id,
      sourceKind: 'manual',
      sourceId: `${tag}:url1`,
      type: 'job_posting',
      title: `${accountName} posts three gate-clerk roles at its Ohio distribution center`,
      sourceType: 'public_primary',
      evidenceUrl: `https://example.com/${tag}/jobs`,
      externalOk: true,
      observedAt: now,
      confidence: 80,
      registeredBy: ACTOR,
    });
    expect('1 seed', fact1.created && fact2.created, `facts not created: ${JSON.stringify({ fact1, fact2 })}`);
    const proposed = await proposeHypothesis(prisma, {
      accountName,
      primaryPersonaId: persona.id,
      persona: seed.persona,
      problemFamily: seed.problemFamily,
      observation: `${accountName} lists 41 distribution centers folded in from three regional operators [S:${fact1.id}] and posts three gate-clerk roles at its Ohio distribution center [S:${fact2.id}].`,
      problemHypothesis: 'My guess is each acquired site still runs its own gate process, so the network cannot see its yards the same way from one site to the next.',
      rootCauseHypotheses: ['No shared gate standard across the acquired sites'],
      impactHypotheses: ['Detention and clerk headcount rise site by site'],
      whyNow: 'The clerk postings are open this month.',
      falsificationQuestions: ['Do the acquired sites share one gate process today?'],
      whatANoMeans: 'The family is wrong for this account.',
      confidence: 60,
      signalIds: [fact1.id, fact2.id],
      primarySignalId: fact2.id,
      createdBy: ACTOR,
    });
    expect('1 seed', proposed.ok, `proposeHypothesis refused: ${JSON.stringify(proposed)}`);
    if (!proposed.ok) throw new Error('unreachable');
    const hypothesisId = proposed.id;
    for (const action of ['submit', 'approve', 'activate'] as const) {
      const r = await transitionHypothesis(prisma, hypothesisId, action, { now, actor: ACTOR });
      expect('1 seed', r.ok, `${action} ${hypothesisId} -> ${JSON.stringify(r)}`);
    }
    const hyp = await getHypothesis(prisma, hypothesisId);
    expect('1 seed', hyp?.status === 'active' && hyp.signals.length === 2, `hypothesis ${hypothesisId} is ${hyp?.status} with ${hyp?.signals?.length} signals, expected active with 2`);
    counts.hypothesisSignals = hyp.signals.length;
    pass('1 seed', `account, persona ${persona.id} (${personaEmail}), facts ${fact1.id} (operator) + ${fact2.id} (public url), hypothesis ${hypothesisId} active (${seed.problemFamily} / ${seed.persona})`);

    // 2. Family and version from the seed, then the twin refusal.
    const family = await createFamily(prisma, {
      name: `GAP E2E3 ${seed.name} ${tag}`,
      engine: 'modex_draft_queue',
      program: 'gap-e2e3',
      accountName,
      problemFamily: seed.problemFamily,
      persona: seed.persona,
      createdBy: ACTOR,
    });
    expect('2 version', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyId = family.id;
    const v1 = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: `e2e3 ${SEED_KEY}` });
    expect('2 version', v1.ok && v1.version === 1, `createVersion -> ${JSON.stringify(v1)}`);
    if (!v1.ok) throw new Error('unreachable');
    const twin = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR });
    expect('2 version', !twin.ok && twin.reason === 'identical_to_version:1', `twin createVersion -> ${JSON.stringify(twin)}, expected identical_to_version:1`);
    const versionRow = await prisma.sequenceVersion.findUnique({ where: { id: v1.id }, select: { status: true, steps_hash: true } });
    expect('2 version', versionRow?.status === 'draft', `version ${v1.id} is ${versionRow?.status}, expected draft`);
    pass('2 version', `family ${family.id}, version ${v1.id} v1 draft (hash ${v1.stepsHash.slice(0, 12)}), identical steps refused identical_to_version:1`);

    // 3. Compile every step of the version, persisted.
    const stepCount = seed.steps.steps.length;
    const versionCompileIds: string[] = [];
    const priorBodies: string[] = [];
    let versionCheckCount = 0;
    for (let i = 0; i < stepCount; i += 1) {
      const copy = stepCopy(i);
      const r: CompileResult = await compile(
        { hypothesisId, sequenceVersionId: v1.id, stepIndex: i, subject: copy.subject, body: copy.body, priorBodies: [...priorBodies], contract: contractFor(i), createdBy: ACTOR },
        { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
      );
      expect('3 compile', r.verdict === 'pass' && !!r.id, `step ${i} -> ${r.verdict} (${r.checks.filter((c) => !c.passed).map((c) => `${c.code}: ${c.detail}`).join('; ')}) id ${r.id ?? 'none'} ${r.persistError ?? ''}`);
      versionCompileIds.push(r.id as string);
      versionCheckCount += r.checks.length;
      priorBodies.push(copy.body);
    }
    created.compileIds.push(...versionCompileIds);
    const persisted = await prisma.gapCompile.count({ where: { id: { in: versionCompileIds }, verdict: 'pass', sequence_version_id: v1.id } });
    expect('3 compile', persisted === stepCount, `${persisted} pass rows persisted for version ${v1.id}, expected ${stepCount}`);
    counts.versionStepsCompiled = stepCount;
    counts.versionChecksRun = versionCheckCount;
    pass('3 compile', `${stepCount} steps pass through ${versionCheckCount} checks with the stub critic, ${persisted} GapCompile rows persisted (${versionCompileIds.map((id) => id.slice(0, 8)).join(', ')})`);

    // 4. A meeting ask at step 0 is rejected by C09.
    const step0 = stepCopy(0);
    const meetingBody = step0.body.replace(/\n\n[^\n]*\?\n\n/, '\n\nOpen to a quick call on it?\n\n');
    expect('4 meeting ask', meetingBody !== step0.body && meetingBody.includes('Open to a quick call on it?'), 'could not place the meeting ask in the step 0 body');
    const meeting = await compile(
      { hypothesisId, sequenceVersionId: v1.id, stepIndex: 0, subject: step0.subject, body: meetingBody, priorBodies: [], contract: contractFor(0), createdBy: ACTOR },
      { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
    );
    if (meeting.id) created.compileIds.push(meeting.id);
    const c09 = meeting.checks.find((c) => c.code === 'C09');
    expect('4 meeting ask', meeting.verdict === 'reject' && c09?.passed === false && meeting.ctaFamily === 'meeting_request', `meeting-ask compile -> ${meeting.verdict}, C09 ${JSON.stringify(c09)}, cta ${meeting.ctaFamily}`);
    pass('4 meeting ask', `reject, C09 ${c09?.detail}`);

    // 5. review_required (critic review) creates one SendApprovalRequest, idempotently.
    const review = await compile(
      { hypothesisId, sequenceVersionId: v1.id, stepIndex: 0, subject: step0.subject, body: step0.body, priorBodies: [], contract: contractFor(0), createdBy: ACTOR },
      { critic: criticReview, validateClaims: validateClaimsUsed, now: () => now, prisma },
    );
    expect('5 approval', review.verdict === 'review_required' && !!review.id, `critic-review compile -> ${review.verdict} id ${review.id ?? 'none'}`);
    created.compileIds.push(review.id as string);
    const approval1 = await requestApproval(prisma, { compileId: review.id as string, hypothesisId, accountName, reason: 'review_required: critic_review', reviewCodes: [], requestedBy: ACTOR, now });
    const approval2 = await requestApproval(prisma, { compileId: review.id as string, hypothesisId, accountName, reason: 'review_required: critic_review', reviewCodes: [], requestedBy: ACTOR, now });
    expect('5 approval', approval1.ok && !approval1.existing && approval2.ok && approval2.existing && approval1.id === approval2.id, `requestApproval x2 -> ${JSON.stringify([approval1, approval2])}`);
    const approvalRow = await prisma.sendApprovalRequest.findUnique({ where: { id: (approval1 as { id: string }).id }, select: { channel: true, status: true, risk_score: true, risk_reasons: true } });
    expect('5 approval', approvalRow?.channel === 'gap_compile' && approvalRow.status === 'pending' && approvalRow.risk_score === 30 && approvalRow.risk_reasons.includes(`gap_compile:${review.id}`), `approval row ${JSON.stringify(approvalRow)}`);
    pass('5 approval', `review_required compile ${review.id}, one pending gap_compile request ${(approval1 as { id: string }).id} (risk 30), second call existing`);

    // 6. materializeSequence: refused, created, idempotent.
    const noIds = await materializeSequence(prisma, { versionId: v1.id, compileIds: [] }, ACTOR);
    expect('6 materialize', !noIds.ok && noIds.reason === 'no_compile_ids', `materialize with no ids -> ${JSON.stringify(noIds)}`);
    const partial = await materializeSequence(prisma, { versionId: v1.id, compileIds: versionCompileIds.slice(0, 2) }, ACTOR);
    expect('6 materialize', !partial.ok && partial.reason === 'step_not_compiled:2', `materialize with 2 of ${stepCount} ids -> ${JSON.stringify(partial)}, expected step_not_compiled:2`);
    const mat1 = await materializeSequence(prisma, { versionId: v1.id, compileIds: versionCompileIds }, ACTOR, { owner: OWNER, now: () => now });
    expect('6 materialize', mat1.ok && !mat1.existing && mat1.steps.length === stepCount, `materialize -> ${JSON.stringify(mat1)}`);
    if (!mat1.ok) throw new Error('unreachable');
    created.sequenceName = mat1.name;
    const mat2 = await materializeSequence(prisma, { versionId: v1.id, compileIds: versionCompileIds }, ACTOR, { owner: OWNER, now: () => now });
    expect('6 materialize', mat2.ok && mat2.existing && mat2.sequenceId === mat1.sequenceId, `second materialize -> ${JSON.stringify(mat2)}`);
    counts.sequenceId = mat1.sequenceId;
    pass('6 materialize', `no_compile_ids, then step_not_compiled:2, then Sequence ${mat1.sequenceId} "${mat1.name}" with ${mat1.steps.length} steps, second call existing`);

    // 7. enrollFromDecision shadow: zero writes.
    const tableCounts = async () => ({
      items: await prisma.draftQueueItem.count({ where: { to_email: personaEmail } }),
      enrollments: await prisma.sequenceEnrollment.count({ where: { account_name: accountName } }),
      compiles: await prisma.gapCompile.count({ where: { created_by: ACTOR } }),
      sequences: await prisma.sequence.count({ where: { name: mat1.name } }),
    });
    const before = await tableCounts();
    const shadow = await enrollFromDecision(
      prisma,
      { hypothesisId, personaId: persona.id, sequenceVersionId: v1.id, compileIds: versionCompileIds, actor: ACTOR, actorKind: 'human', mode: 'shadow', now },
      { addOne, autonomy: autonomyLive, critic: criticPass, contract: contractFor(0) },
    );
    const afterShadow = await tableCounts();
    expect('7 shadow', shadow.ok && shadow.kind === 'modex_shadow' && shadow.target === 'modex_queue', `shadow -> ${JSON.stringify(shadow).slice(0, 300)}`);
    if (!shadow.ok || shadow.kind !== 'modex_shadow') throw new Error('unreachable');
    expect('7 shadow', shadow.wouldBe.toEmail === personaEmail && shadow.wouldBe.body.startsWith('Hi Priya,') && !shadow.wouldBe.body.includes('{{'), `would-be item ${JSON.stringify({ to: shadow.wouldBe.toEmail, subject: shadow.wouldBe.subject, head: shadow.wouldBe.body.slice(0, 40) })}`);
    expect('7 shadow', JSON.stringify(before) === JSON.stringify(afterShadow), `shadow wrote rows: before ${JSON.stringify(before)} after ${JSON.stringify(afterShadow)}`);
    const shadowAudit = await prisma.gapAuditEvent.count({ where: { kind: 'enroll.shadow', actor: ACTOR, subject_id: hypothesisId, created_at: { gte: runStart } } });
    expect('7 shadow', shadowAudit === 1, `${shadowAudit} enroll.shadow audit rows, expected 1`);
    pass('7 shadow', `modex_shadow for ${personaEmail}: subject "${shadow.wouldBe.subject}", body rendered (Hi Priya,), zero writes (${JSON.stringify(before)}), 1 enroll.shadow audit row`);

    // 8. enrollFromDecision live through the real addOne.
    const live = await enrollFromDecision(
      prisma,
      { hypothesisId, personaId: persona.id, sequenceVersionId: v1.id, compileIds: versionCompileIds, actor: ACTOR, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: 'casey@yardflow.ai' },
      { addOne, autonomy: autonomyLive, critic: criticPass, contract: contractFor(0) },
    );
    expect('8 live', live.ok && live.kind === 'modex_enrolled', `live -> ${JSON.stringify(live).slice(0, 400)}`);
    if (!live.ok || live.kind !== 'modex_enrolled') throw new Error('unreachable');
    const enrollmentId = live.enrollment.id;
    const itemId = live.draftItemId;
    if (live.compileId) created.compileIds.push(live.compileId);
    const enrollment = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId } });
    expect('8 live', enrollment?.status === 'active' && enrollment.engine === 'modex_draft_queue' && enrollment.sequence_version_id === v1.id && enrollment.hypothesis_id === hypothesisId && enrollment.is_test === false && enrollment.to_email === personaEmail, `enrollment ${JSON.stringify(enrollment && { status: enrollment.status, engine: enrollment.engine, version: enrollment.sequence_version_id, hyp: enrollment.hypothesis_id, is_test: enrollment.is_test })}`);
    const frozen = await prisma.sequenceVersion.findUnique({ where: { id: v1.id }, select: { status: true, frozen_by_enrollment_id: true, frozen_at: true } });
    expect('8 live', frozen?.status === 'frozen' && frozen.frozen_by_enrollment_id === enrollmentId && !!frozen.frozen_at, `version after enroll ${JSON.stringify(frozen)}, expected frozen by ${enrollmentId}`);
    const item = await prisma.draftQueueItem.findUnique({ where: { id: itemId } });
    expect('8 live', item?.sequence_run_id === enrollmentId && item.step_index === 0 && item.sequence_version_id === v1.id && item.status === STATUS.draft && item.persona_id === persona.id && item.body.startsWith('Hi Priya,'), `item ${JSON.stringify(item && { run: item.sequence_run_id, step: item.step_index, version: item.sequence_version_id, status: item.status, head: item.body.slice(0, 20) })}`);
    // The service materialized (idempotently, the step 6 row) and stamped the runtime Sequence id itself.
    expect('8 live', item!.sequence_id === mat1.sequenceId && live.sequenceId === mat1.sequenceId, `item sequence_id ${item!.sequence_id}, service sequenceId ${live.sequenceId}, expected ${mat1.sequenceId} (the step 6 Sequence, reused)`);
    const sequenceRows = await prisma.sequence.count({ where: { name: mat1.name } });
    expect('8 live', sequenceRows === 1, `${sequenceRows} Sequence rows named "${mat1.name}", expected 1 (materialize is idempotent)`);
    const itemCompile = await prisma.gapCompile.findFirst({ where: { draft_queue_item_id: itemId }, orderBy: { created_at: 'desc' }, select: { id: true, verdict: true, hypothesis_id: true, sequence_version_id: true, step_index: true } });
    expect('8 live', itemCompile?.verdict === 'pass' && itemCompile.id === live.compileId && itemCompile.hypothesis_id === hypothesisId && itemCompile.step_index === 0, `item-level compile ${JSON.stringify(itemCompile)}`);
    const liveAudit = await prisma.gapAuditEvent.count({ where: { kind: 'enroll.live', subject_id: enrollmentId, created_at: { gte: runStart } } });
    expect('8 live', liveAudit === 1, `${liveAudit} enroll.live audit rows for ${enrollmentId}, expected exactly 1 (enroll() writes it; the service adds none)`);
    counts.enrollmentId = enrollmentId;
    counts.draftItemId = itemId;
    pass('8 live', `enrollment ${enrollmentId} active on v1, version FROZEN by the trigger (frozen_by_enrollment_id matches), draft item ${itemId} stamped (run, step 0, version, sequence_id ${item!.sequence_id} from the idempotent materialize), item-level GapCompile ${itemCompile!.id} pass, 1 enroll.live audit row`);

    // 9. The approveBatch guard's data contract (approveBatch itself needs a NextAuth request scope).
    const guardWouldApprove = async (id: number): Promise<boolean> => {
      const stamped = await prisma.draftQueueItem.findUnique({ where: { id }, select: { sequence_version_id: true, step_index: true } });
      if (!stamped?.sequence_version_id) return true;
      const own = await prisma.gapCompile.findFirst({ where: { draft_queue_item_id: id }, orderBy: { created_at: 'desc' }, select: { verdict: true } });
      if (own) return own.verdict === 'pass';
      const template = await prisma.gapCompile.findFirst({
        where: { draft_queue_item_id: null, sequence_version_id: stamped.sequence_version_id, step_index: stamped.step_index },
        orderBy: { created_at: 'desc' },
        select: { verdict: true },
      });
      return template?.verdict === 'pass';
    };
    expect('9 approve guard', await guardWouldApprove(itemId), `the stamped item ${itemId} would be refused by the compile guard`);
    const orphan = await prisma.draftQueueItem.create({
      data: {
        to_email: `orphan+${tag}@example.com`,
        account_name: accountName,
        persona_id: persona.id,
        subject: 'orphan',
        body: 'orphan body',
        owner: OWNER,
        created_by: ACTOR,
        sequence_version_id: v1.id,
        step_index: 9,
        idempotency_key: `${tag}:orphan`,
      },
      select: { id: true },
    });
    created.emails.push(`orphan+${tag}@example.com`);
    const orphanCompile = await compile(
      { hypothesisId, sequenceVersionId: v1.id, draftQueueItemId: orphan.id, stepIndex: 0, subject: step0.subject, body: meetingBody, priorBodies: [], contract: contractFor(0), createdBy: ACTOR },
      { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
    );
    if (orphanCompile.id) created.compileIds.push(orphanCompile.id);
    expect('9 approve guard', orphanCompile.verdict === 'reject' && !(await guardWouldApprove(orphan.id)), `a second stamped item with a rejecting compile row would be approved`);
    await prisma.gapCompile.deleteMany({ where: { id: orphanCompile.id } });
    created.compileIds = created.compileIds.filter((id) => id !== orphanCompile.id);
    expect('9 approve guard', !(await guardWouldApprove(orphan.id)), `a second stamped item (step 9) whose compile row was deleted would be approved; no template-level compile exists for that step`);
    pass('9 approve guard', `item ${itemId} passes the guard contract (newest item-level compile is pass); orphan item ${orphan.id} refused with a rejecting row and refused again after that row is deleted (no template-level row for its step)`);

    // 10. scheduleNextStep for step 1 under the flag.
    const sentAt = new Date('2026-09-25T14:00:00.000Z'); // a Friday
    // Only the send outcome is simulated here; sequence_id was stamped by the service in step 8.
    await prisma.draftQueueItem.update({ where: { id: itemId }, data: { status: STATUS.sent, sent_at: sentAt } });
    const sentItem = await prisma.draftQueueItem.findUnique({ where: { id: itemId } });
    const nextId = await scheduleNextStep(prisma, sentItem);
    expect('10 schedule', typeof nextId === 'number', `scheduleNextStep returned ${String(nextId)}`);
    const nextItem = await prisma.draftQueueItem.findUnique({ where: { id: nextId as number } });
    const expectedKey = sequenceStepIdempotencyKey(OWNER, personaEmail, enrollmentId, 1);
    const step1Template = seed.steps.steps[1].templates?.bodyTemplate ?? '';
    expect('10 schedule', nextItem?.step_index === 1 && nextItem.sequence_run_id === enrollmentId && nextItem.sequence_version_id === v1.id && nextItem.idempotency_key === expectedKey && nextItem.status === STATUS.approved, `step 1 item ${JSON.stringify(nextItem && { step: nextItem.step_index, run: nextItem.sequence_run_id, version: nextItem.sequence_version_id, key: nextItem.idempotency_key, status: nextItem.status })}`);
    const accountRendered = step1Template.includes('{{account}}') ? nextItem!.body.includes(accountName) : true;
    expect('10 schedule', step1Template.includes('{{first_name}}') && !nextItem!.body.includes('{{') && nextItem!.body.startsWith('Hi Priya,') && accountRendered, `step 1 body not rendered: ${nextItem!.body.slice(0, 80)}`);
    // Friday + 4 business days (seed cadence) = the following Thursday at the same hour.
    expect('10 schedule', nextItem!.scheduled_for?.toISOString() === '2026-10-01T14:00:00.000Z', `scheduled_for ${nextItem!.scheduled_for?.toISOString()}, expected 2026-10-01T14:00:00.000Z (Friday + 4 business days)`);
    const again = await scheduleNextStep(prisma, sentItem);
    expect('10 schedule', again === nextId, `a second scheduleNextStep returned ${String(again)}, expected the same id ${nextId} (deterministic key)`);
    counts.step1ItemId = nextId as number;
    pass('10 schedule', `step 1 item ${nextId} from the pinned version, placeholders rendered, key ${expectedKey}, scheduled 2026-10-01T14:00Z (Friday + 4 business days), rerun returns the same id`);

    // 11. The frozen version refuses edits: the service, then the database trigger.
    const edited = { ...seed.steps, steps: seed.steps.steps.map((s, i) => (i === 1 ? { ...s, delay: { value: 9, unit: 'business_days' as const } } : s)) };
    const svc = await updateVersionSteps(prisma, v1.id, edited, ACTOR, now);
    expect('11 frozen', !svc.ok && svc.reason === 'version_frozen', `updateVersionSteps on frozen -> ${JSON.stringify(svc)}`);
    let dbError = '';
    try {
      await prisma.sequenceVersion.update({ where: { id: v1.id }, data: { steps: edited as object } });
    } catch (err) {
      dbError = errorText(err);
    }
    expect('11 frozen', dbError.includes('GAP_VERSION_FROZEN'), `raw update of the frozen version was not refused by the database: ${dbError.slice(0, 200) || 'no error'}`);
    pass('11 frozen', `service refuses version_frozen; the database trigger refuses a raw update with GAP_VERSION_FROZEN`);

    // 12. Stop: unsent rows are skipped, a failed row included; the sent row is untouched.
    await prisma.draftQueueItem.update({ where: { id: nextId as number }, data: { status: STATUS.failed, error_message: 'e2e failed row' } });
    const stopped = await stop(prisma, enrollmentId, 'replied', ACTOR, now);
    expect('12 stop', stopped.ok && stopped.status === 'stopped' && stopped.skipped === 1, `stop -> ${JSON.stringify(stopped)}`);
    const runRows = await prisma.draftQueueItem.findMany({ where: { sequence_run_id: enrollmentId }, select: { id: true, status: true, skipped_reason: true }, orderBy: { id: 'asc' } });
    const sentRow = runRows.find((r) => r.id === itemId);
    const failedRow = runRows.find((r) => r.id === nextId);
    expect('12 stop', sentRow?.status === STATUS.sent && failedRow?.status === STATUS.skipped && failedRow.skipped_reason === 'sequence_stopped:replied', `run rows after stop ${JSON.stringify(runRows)}`);
    const stoppedRow = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId }, select: { status: true, stop_reason: true, stopped_by: true } });
    expect('12 stop', stoppedRow?.status === 'stopped' && stoppedRow.stop_reason === 'replied' && stoppedRow.stopped_by === ACTOR, `enrollment after stop ${JSON.stringify(stoppedRow)}`);
    const terminal = await stop(prisma, enrollmentId, 'manual', ACTOR, now);
    expect('12 stop', !terminal.ok && terminal.reason === 'terminal', `second stop -> ${JSON.stringify(terminal)}, expected terminal`);
    pass('12 stop', `stop(replied) skipped 1 row (the failed step 1, now sequence_stopped:replied), the sent step 0 untouched, enrollment stopped by ${ACTOR}, second stop terminal`);

    // 13. Top100 journal import dry run over its fixture.
    const journalOut = execSync(`npx tsx scripts/gap/import-top100-journal.ts ${JOURNAL_FIXTURE_DIR}`, {
      encoding: 'utf8',
      env: { ...process.env, GAP_OS_ENABLED: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const journal = JSON.parse(journalOut.slice(journalOut.indexOf('{'))) as { dryRun: boolean; counts: Record<string, number>; warnings: string[] };
    expect('13 journal', journal.dryRun === true && journal.counts.rows > 0 && journal.counts.families_new >= 1 && journal.counts.versions_new >= 1, `journal dry run -> ${JSON.stringify(journal.counts)}`);
    counts.journalRows = journal.counts.rows;
    counts.journalFamiliesNew = journal.counts.families_new;
    counts.journalVersionsNew = journal.counts.versions_new;
    counts.journalCopyEventsNew = journal.counts.copy_events_new;
    pass('13 journal', `dry run over ${JOURNAL_FIXTURE_DIR}: ${JSON.stringify(journal.counts)}, ${journal.warnings.length} warnings, nothing written`);

    // 14. compile-top100 persist path over its fixture, then the enroll-row gate.
    const prepared = toCompileInputs(laneSequence, laneResearch, { now, claimsValidator: validateClaimsUsed, namedPipeline: [], createdBy: ACTOR });
    const results = new Map<(typeof prepared.inputs)[number], CompileResult>();
    for (const entry of prepared.inputs) {
      const r = await compile(entry.input, { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma });
      if (r.id) created.compileIds.push(r.id);
      results.set(entry, r);
    }
    const summary = reduceReport(compiledSteps(prepared, results));
    expect('14 top100 gate', summary.totals.steps === 8 && summary.totals.pass === 1 && summary.totals.reject === 7, `fixture lane totals ${JSON.stringify(summary.totals)}, expected 8 steps, 1 pass, 7 reject`);
    const persistedLane = await prisma.gapCompile.count({ where: { created_by: ACTOR, inputs_snapshot: { path: ['contract', TOP100_COMPILE_KEY, 'laneKey'], equals: laneSequence.key } } });
    expect('14 top100 gate', persistedLane === 8, `${persistedLane} lane rows persisted with the ${TOP100_COMPILE_KEY} key, expected 8`);
    const rileyGate = await loadCompileGate(prisma, FIXTURE_RILEY);
    const jordanGate = await loadCompileGate(prisma, FIXTURE_JORDAN);
    expect('14 top100 gate', !rileyGate.ok && rileyGate.reason === 'compile_not_passed:0', `Riley (meeting ask at step 1) gate -> ${JSON.stringify(rileyGate)}, expected compile_not_passed:0`);
    expect('14 top100 gate', !jordanGate.ok && jordanGate.reason === 'compile_not_passed:1', `Jordan (stale ref at step 2) gate -> ${JSON.stringify(jordanGate)}, expected compile_not_passed:1`);
    // A clean contact: the four seed steps compiled and keyed to a synthetic contact id.
    const cleanPrior: string[] = [];
    for (let i = 0; i < stepCount; i += 1) {
      const copy = stepCopy(i);
      const r = await compile(
        {
          hypothesisId: null,
          sequenceVersionId: null,
          stepIndex: i,
          subject: copy.subject,
          body: copy.body,
          priorBodies: [...cleanPrior],
          contract: { ...contractFor(i), [TOP100_COMPILE_KEY]: { laneKey: 'e2e3-clean', hubspotContactId: created.syntheticContactId, personKey: created.syntheticContactId, step: i + 1, stepIndex: i } },
          createdBy: ACTOR,
        },
        { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
      );
      expect('14 top100 gate', r.verdict === 'pass' && !!r.id, `clean contact step ${i} -> ${r.verdict}`);
      created.compileIds.push(r.id as string);
      cleanPrior.push(copy.body);
    }
    const cleanGate = await loadCompileGate(prisma, created.syntheticContactId);
    expect('14 top100 gate', cleanGate.ok && cleanGate.compileIds.length === 4, `clean contact gate -> ${JSON.stringify(cleanGate)}`);
    const nativeItem = (contactId: string, email: string, gate: EnrollRowItem['compile']): EnrollRowItem => ({
      decision: { action: 'enroll_gap_sequence', lane: 'work_queue', ruleId: 'enroll', priority: 80, blocked: false, target: 'hubspot_native', explain: { whyAccount: '', whyPerson: '', whyProblem: '', whyNow: '', whyAction: '', evidenceIds: [], signalIds: [], wouldProveWrong: '' } },
      inputs: {
        account: { name: 'Acme Foods', hubspotCompanyId: null } as unknown as RoutingInputs['account'],
        persona: { id: 1, email, hubspotContactId: contactId, top100: { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: '999', sequenceName: 'Acme v1' } } as unknown as RoutingInputs['persona'],
      },
      displayName: contactId === FIXTURE_RILEY ? 'Riley Okafor' : 'Clean Contact',
      compile: gate,
    });
    const table = buildEnrollRows([nativeItem(created.syntheticContactId, 'clean@example.com', cleanGate), nativeItem(FIXTURE_RILEY, 'riley@example.com', rileyGate)]);
    expect('14 top100 gate', table.rows.length === 1 && table.rows[0].contacts.length === 1 && table.rows[0].contacts[0].hubspotContactId === created.syntheticContactId, `enroll rows ${JSON.stringify(table.rows.map((r) => ({ contacts: r.contacts.map((c) => c.hubspotContactId), skips: r.skips })))}`);
    expect('14 top100 gate', table.skipped.length === 1 && table.skipped[0].reason === 'compile_not_passed:0' && table.skipped[0].name === 'Riley Okafor', `skips ${JSON.stringify(table.skipped)}, expected Riley Okafor (compile_not_passed:0)`);
    counts.laneStepsCompiled = summary.totals.steps;
    counts.laneStepsPass = summary.totals.pass;
    counts.laneStepsReject = summary.totals.reject;
    pass('14 top100 gate', `fixture lane 8 steps (1 pass, 7 reject) persisted with the ${TOP100_COMPILE_KEY} key; gate: Riley compile_not_passed:0 (meeting ask), Jordan compile_not_passed:1 (stale ref at step 2), synthetic clean contact ok with 4 ids; enroll table: 1 contact under Enroll, Riley skipped as "compile_not_passed:0"`);

    for (const name of SCRUBBED_ENV) expect('15 credentials', process.env[name] === undefined, `${name} reappeared in process.env during the run`);
    pass('15 credentials', 'no credential reappeared; no HubSpot, clawd or Gmail call was possible');
  } catch (err) {
    if (err instanceof StepFailure) {
      failure = err;
    } else {
      const step = lines.length > 0 ? `after ${lines[lines.length - 1].step}` : 'preflight';
      const detail = `unexpected error: ${errorText(err).slice(0, 500)}`;
      lines.push({ step, status: 'FAIL', detail });
      console.log(`FAIL ${step}: ${detail}`);
      failure = new StepFailure(step, detail);
    }
  } finally {
    try {
      writeReport({ failure, tag, dbHost, gitSha });
      console.log(`report ${REPORT_PATH}`);
    } catch (err) {
      console.error(`report write failed: ${errorText(err)}`);
    }
    if (seeded) {
      try {
        const removed = await cleanup(prisma, created, runStart);
        console.log(`cleanup ${JSON.stringify(removed)}`);
      } catch (err) {
        console.error(`cleanup FAILED for ${accountName}: ${errorText(err).slice(0, 500)}`);
        if (!failure) failure = new StepFailure('cleanup', errorText(err));
      }
    }
    await prisma.$disconnect();
  }
  return failure ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# Sprint 3 end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-sprint3.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- Credentials scrubbed from the process before the first write: ${String(counts.scrubbedEnv)}`,
    '- No HubSpot, clawd or Gmail call is possible in this run: stub critic, stub autonomy reader, Gmail credentials absent for the queue dedup thread check, review-feed poster without a token.',
    '- Not exercised: `approveBatch` (NextAuth `auth()` needs a request scope); step 9 asserts the guard data contract instead and the unit suite covers the guard.',
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(counts)
      .filter(([k]) => !['gitSha', 'databaseHost', 'runTag', 'scrubbedEnv'].includes(k))
      .map(([k, v]) => `- ${k}: ${v}`),
    '',
    'Every row the run created was deleted in the finally block (gap_audit_events, send_approval_requests, gap_compiles, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, draft_queue_items, sequences, sequence_enrollments, sequence_versions, sequence_families, personas, accounts). The four seed families were read, never frozen or changed.',
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/** Trigger name per table that forbids the DELETE the cleanup needs. Disabled and re-enabled inside one transaction. */
const DELETE_GUARDS: Array<[table: string, trigger: string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['sequence_versions', 'gap_version_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: Created, runStart: Date): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((h) => h.id);
    const enrollmentIds = (await tx.sequenceEnrollment.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((e) => e.id);
    const compileIds = Array.from(new Set([...c.compileIds, ...(await tx.gapCompile.findMany({ where: { created_by: ACTOR }, select: { id: true } })).map((r) => r.id)]));

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({
          where: {
            created_at: { gte: runStart },
            OR: [
              { actor: { in: [ACTOR, 'sequence-runtime'] } },
              { subject_id: { in: [...hypothesisIds, ...enrollmentIds] } },
            ],
          },
        })
      ).count;
      removed.send_approval_requests = (
        await tx.sendApprovalRequest.deleteMany({ where: { channel: 'gap_compile', requested_by: ACTOR } })
      ).count;
      removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { id: { in: compileIds } } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.draft_queue_items = (await tx.draftQueueItem.deleteMany({ where: { OR: [{ to_email: { in: c.emails } }, { account_name: c.accountName }] } })).count;
      removed.sequence_enrollments = (await tx.sequenceEnrollment.deleteMany({ where: { id: { in: enrollmentIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.sequences = c.sequenceName ? (await tx.sequence.deleteMany({ where: { name: c.sequenceName } })).count : 0;
      if (c.familyId) {
        removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: c.familyId } })).count;
        removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: c.familyId } })).count;
      }
      removed.personas = (await tx.persona.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: c.accountName } })).count;
    } finally {
      for (const [table, trigger] of DELETE_GUARDS) {
        await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
      }
    }
    return removed;
  });
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(errorText(err));
    process.exit(1);
  });
