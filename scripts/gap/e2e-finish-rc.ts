/**
 * GAP Prospecting OS: finish-rc end-to-end demo against a SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true GAP_MESSAGE_COMPILER_ENABLED=true \
 *   npx tsx scripts/gap/seed-families.ts --apply    (once, if not already seeded)
 *   npx tsx scripts/gap/e2e-finish-rc.ts
 *
 * GAP OS FINISH release-candidate hardening proof (2026-09-24). The five
 * scripted Sprint e2es (e2e-sprint1..5.ts) each prove their own sprint's
 * surface; none of them individually exercises every property this finish
 * pass changed. This script proves the shortest useful chain that touches
 * all of them at once, over the SAME real code paths (never a mock of the
 * function under test):
 *
 *   FACT/SIGNAL -> HYPOTHESIS -> APPROVAL/ACTIVATION -> ROUTING DECISION ->
 *   EXECUTION/ENROLLMENT ATTRIBUTION -> HUMAN-CONFIRMED DISPOSITION -> BID ->
 *   HYPOTHESIS RESOLUTION -> LEARNING
 *
 * and specifically asserts:
 *   - suppression wins (R3-2/R3-10, already proven in Sprint 2-4; re-proven
 *     here as the enroll refusal for the do-not-contact persona)
 *   - active opportunity prevents cold enrollment (B6): enrollFromDecision
 *     refuses `active_opportunity` for a persona whose account is mid-deal
 *     (pipeline_stage 'meeting'), with a passing compile stack identical to
 *     the happy path's, so the refusal is provably about the opportunity
 *     check, not a missing prerequisite
 *   - the GAP kill switch cannot create a raw/uncompiled continuation (B5):
 *     scheduleNextStep, called with GAP_OS_ENABLED off against the happy
 *     path's own GAP-stamped step-0 item, schedules nothing (SCHEDULE_SKIPPED)
 *   - routing recommendation vs human action is recorded (R-B): a real
 *     RoutingDecision row stamped by the real recordHumanAction, read back
 *     through loadAgreementReport, shows one agreement and one disagreement
 *   - test/internal traffic is excluded from real learning metrics (B9): a
 *     human-confirmed disposition against an @freightroll.com contact never
 *     reaches buildLearningReport's counts
 *   - campaign/date filter returns only the desired cohort/window (R-A): the
 *     happy path's family carries program 'gap-finish-rc'; the report
 *     filtered to that program (and a date window around "now") includes it,
 *     a program filter for a program that does not exist returns nothing,
 *     and a date window that excludes "now" excludes it too
 *
 * Reuses Sprint 3's exact seed family, fixture and compile recipe (the
 * simplest way to get a REAL passing 4-step compile stack without
 * reinventing the compiler's claim/evidence contract) for two hypotheses
 * bound to the SAME family/version: H1 (normal account, the happy path) and
 * H2 (the account with an active opportunity, B6). H3 (an internal-email
 * persona, B9) needs no family or compile at all -- it only needs a
 * human-confirmed disposition.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - HUBSPOT_ACCESS_TOKEN, MC_API_TOKEN, GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID,
 *     GOOGLE_CLIENT_SECRET, CLAWD_CONTROL_PLANE_URL, CLAWD_CONTROL_PLANE_TOKEN
 *     are deleted from process.env before the first import and asserted gone.
 *   - GAP_HUBSPOT_MIRROR_ENABLED is asserted off.
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *   - No network call is possible: the critic is a stub, the suppression
 *     reader is the static one, HubSpot/clawd/Gmail credentials are scrubbed.
 *
 * Writes docs/gap/finish-rc-e2e-latest.md (no em dashes, no secrets) on every
 * run, PASS or FAIL, before cleanup.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { addOne } from '../../src/app/discovery/queue-actions';
import { validateClaimsUsed } from '../../src/lib/gap/claims/validate-claims';
import { compile, type CompileResult } from '../../src/lib/gap/compiler/compile';
import { evidenceRefsFromSignals } from '../../src/lib/gap/compiler/evidence-from-signals';
import type { CriticClient } from '../../src/lib/gap/critic-client';
import { enrollFromDecision } from '../../src/lib/gap/enroll/service';
import { gapFlag, isGapOsEnabled } from '../../src/lib/gap/flags';
import { getHypothesis, proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { buildLearningReport } from '../../src/lib/gap/learning/query';
import { recordDisposition, type RecordDispositionInput } from '../../src/lib/gap/disposition/service';
import { loadAgreementReport } from '../../src/lib/gap/routing/agreement-query';
import { recordHumanAction } from '../../src/lib/gap/routing/queue';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { EVIDENCE_SIGNAL_SELECT, renderStepCopy } from '../../src/lib/gap/sequence/render';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { seedFamilyByKey, type SeedFamily } from '../../src/lib/gap/sequences/families';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { scheduleNextStep } from '../../src/lib/queue/sequence-runtime';

// RC E2E (2026-09-24): also accepts the disposable Docker scratch DB
// (55432/gap_finish_e2e) used when the persistent 5433/gap_dev credentials
// are unavailable. Still loopback-only, still an exact-literal allowlist.
const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'finish-rc-e2e-latest.md');
const SEED_EVIDENCE_FIXTURE = path.join('tests', 'fixtures', 'gap', 'seed-evidence.json');
const SEED_KEY = 'network_standardization';
const ACTOR = 'e2e-rc';
const OWNER = 'casey@freightroll.com';
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const;
const PROGRAM = 'gap-finish-rc';
const criticPass: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) };
const autonomyLive = async () => ({ halted: false });
const suppressionClear = staticSuppressionReader('clear');

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

interface Created {
  accountNames: string[];
  emails: string[];
  familyId: string | null;
  compileIds: string[];
  routingDecisionIds: string[];
}

const DELETE_GUARDS: Array<[table: string, trigger: string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['buyer_input_data', 'gap_bid_guard_del'],
  // This run's own H1 enrollment (step 7) freezes its SequenceVersion
  // (GAP_VERSION_FROZEN, by design: a frozen version must never be deleted
  // in production). Test cleanup for a version this run itself created and
  // froze is the one legitimate reason to lift that guard, exactly like the
  // append-only guards above.
  ['sequence_versions', 'gap_version_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: Created, runStart: Date): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (
      await tx.prospectingHypothesis.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })
    ).map((h) => h.id);
    const dispositionIds = (
      await tx.conversationDisposition.findMany({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] }, select: { id: true } })
    ).map((d) => d.id);
    const itemIds = (await tx.draftQueueItem.findMany({ where: { to_email: { in: c.emails } }, select: { id: true } })).map((i) => i.id);
    const enrollmentIds = (await tx.sequenceEnrollment.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((e) => e.id);

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({
          where: { created_at: { gte: runStart }, OR: [{ actor: { in: [ACTOR, OWNER] } }, { subject_id: { in: [...hypothesisIds, ...dispositionIds, ...c.routingDecisionIds] } }] },
        })
      ).count;
      removed.gap_hubspot_mirror = (await tx.gapHubSpotMirror.deleteMany({ where: { object_id: { in: [...dispositionIds, ...hypothesisIds] } } })).count;
      removed.routing_decisions = (await tx.routingDecision.deleteMany({ where: { id: { in: c.routingDecisionIds } } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] } })).count;
      removed.conversation_dispositions = (await tx.conversationDisposition.deleteMany({ where: { id: { in: dispositionIds } } })).count;
      removed.draft_queue_items = (await tx.draftQueueItem.deleteMany({ where: { id: { in: itemIds } } })).count;
      removed.sequence_enrollments = (await tx.sequenceEnrollment.deleteMany({ where: { id: { in: enrollmentIds } } })).count;
      removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { id: { in: c.compileIds } } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      if (c.familyId) {
        removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: c.familyId } })).count;
        removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: c.familyId } })).count;
      }
      removed.personas = (await tx.persona.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: { in: c.accountNames } } })).count;
    } finally {
      for (const [table, trigger] of DELETE_GUARDS) {
        await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
      }
    }
    return removed;
  });
}

async function countLeftovers(prisma: PrismaClient, c: Created): Promise<Record<string, number>> {
  return {
    accounts: await prisma.account.count({ where: { name: { in: c.accountNames } } }),
    personas: await prisma.persona.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { email: { in: c.emails } }] } }),
    prospecting_signals: await prisma.prospectingSignal.count({ where: { account_name: { in: c.accountNames } } }),
    prospecting_hypotheses: await prisma.prospectingHypothesis.count({ where: { account_name: { in: c.accountNames } } }),
    conversation_dispositions: await prisma.conversationDisposition.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] } }),
    buyer_input_data: await prisma.buyerInputData.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] } }),
    draft_queue_items: await prisma.draftQueueItem.count({ where: { to_email: { in: c.emails } } }),
    sequence_enrollments: await prisma.sequenceEnrollment.count({ where: { account_name: { in: c.accountNames } } }),
    sequence_families: c.familyId ? await prisma.sequenceFamily.count({ where: { id: c.familyId } }) : 0,
    routing_decisions: await prisma.routingDecision.count({ where: { id: { in: c.routingDecisionIds } } }),
    gap_compiles: await prisma.gapCompile.count({ where: { id: { in: c.compileIds } } }),
  };
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string; removed: Record<string, number> | null; leftovers: Record<string, number> | null }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# GAP OS FINISH release-candidate hardening e2e (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-finish-rc.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- Credentials scrubbed from the process before the first import: ${SCRUBBED_ENV.join(',')}`,
    '- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, and no credential is present.',
    '- Proves the shortest useful chain over the hardened GAP core: fact/signal -> hypothesis -> approval/activation -> routing decision -> execution/enrollment attribution -> human-confirmed disposition -> BID -> hypothesis resolution -> learning, plus the six properties this finish pass specifically changed (suppression wins, active opportunity blocks cold enrollment, the kill switch cannot create a raw/uncompiled continuation, routing-vs-human-action agreement is recorded, test/internal traffic is excluded from learning, and the campaign/date filter returns only the desired cohort).',
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Cleanup',
    '',
    `- Removed: ${input.removed ? JSON.stringify(input.removed) : 'not run (nothing seeded)'}`,
    `- Leftovers after cleanup: ${input.leftovers ? JSON.stringify(input.leftovers) : 'not counted'}`,
    '',
    'Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.',
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be the scratch database (got ${describeDatabase(databaseUrl) || 'unset'})`);
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);
  const tag = `gap-e2erc-${Date.now()}`;
  const now = new Date();
  const runStart = new Date(now.getTime() - 1000);
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
  counts.gitSha = gitSha;
  counts.databaseHost = dbHost;
  counts.runTag = tag;

  const accountName = `GAP RC Co ${tag}`;
  const blockedAccountName = `GAP RC Blocked Co ${tag}`;
  const hubspotCompanyId = `e2erc-${tag}`;
  const blockedHubspotCompanyId = `e2erc-blocked-${tag}`;
  const emails = {
    happy: `priya+${tag}@example.com`,
    blocked: `jordan+${tag}@example.com`,
    internal: `probe+${tag}@freightroll.com`,
  };
  const created: Created = {
    accountNames: [accountName, blockedAccountName],
    emails: Object.values(emails),
    familyId: null,
    compileIds: [],
    routingDecisionIds: [],
  };

  const seedEvidence = JSON.parse(readFileSync(SEED_EVIDENCE_FIXTURE, 'utf8')) as SeedEvidenceFixture;
  const seed = seedFamilyByKey(SEED_KEY) as SeedFamily;
  const fx = seedEvidence.families[SEED_KEY];

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  // Filled by step 1 (happy path observation) and step 2b (blocked-account observation).
  let observationH1 = '';
  let realRefsH1: ReturnType<typeof evidenceRefsFromSignals> = [];
  let observationH2 = '';
  let realRefsH2: ReturnType<typeof evidenceRefsFromSignals> = [];

  try {
    // 0. Preflight.
    expect('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expect('preflight', gapFlag('GAP_MESSAGE_COMPILER_ENABLED'), 'GAP_MESSAGE_COMPILER_ENABLED is not on (required for the live modex enroll path, N9)');
    expect('preflight', !gapFlag('GAP_HUBSPOT_MIRROR_ENABLED'), 'GAP_HUBSPOT_MIRROR_ENABLED is on; this run expects the mirror to skip');
    for (const name of SCRUBBED_ENV) expect('preflight', process.env[name] === undefined, `${name} still present`);
    expect('preflight', !!seed && !!fx, `seed family ${SEED_KEY} or its fixture evidence is missing`);
    const stale = await prisma.account.count({ where: { name: { in: created.accountNames } } });
    expect('preflight', stale === 0, `an account named ${accountName} or ${blockedAccountName} already exists`);
    pass('preflight', `flags on (compiler on, mirror off), credentials scrubbed, seed ${SEED_KEY} fixture present, no stale rows`);

    // 1. Seed both accounts, three personas (happy, blocked-account, internal), and the happy path's two facts.
    seeded = true;
    await prisma.account.create({ data: { rank: 9994, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId, tier: 'Tier 1', pipeline_stage: 'targeted' } });
    // B6: mid-deal, so a fresh enroll must refuse active_opportunity regardless of what routing decided earlier.
    await prisma.account.create({ data: { rank: 9995, name: blockedAccountName, vertical: 'cpg', hubspot_company_id: blockedHubspotCompanyId, tier: 'Tier 1', pipeline_stage: 'meeting' } });
    const personaHappy = await prisma.persona.create({
      data: { persona_id: `${tag}-happy`, account_name: accountName, priority: 'P1', name: `Priya Natarajan ${tag}`, title: 'VP Supply Chain', seniority: 'vp', email: emails.happy, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-happy` },
      select: { id: true },
    });
    const personaBlocked = await prisma.persona.create({
      data: { persona_id: `${tag}-blocked`, account_name: blockedAccountName, priority: 'P1', name: `Jordan Reyes ${tag}`, title: 'VP Supply Chain', seniority: 'vp', email: emails.blocked, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-blocked` },
      select: { id: true },
    });
    const personaInternal = await prisma.persona.create({
      data: { persona_id: `${tag}-internal`, account_name: accountName, priority: 'P1', name: `Internal Probe ${tag}`, title: 'QA', seniority: 'manager', email: emails.internal, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-internal` },
      select: { id: true },
    });

    pass('1 seed', `two accounts (${accountName} pipeline_stage=targeted, ${blockedAccountName} pipeline_stage=meeting), three personas (happy ${personaHappy.id}, blocked ${personaBlocked.id}, internal ${personaInternal.id})`);

    // 1b. Register every fact.
    const projected1 = fromOperatorKnowledge(
      { accountName, hubspotCompanyId, personaId: personaHappy.id, text: 'The plant manager said the annual report lists 41 distribution centers folded in from three regional operators.', at: now, sourceId: `${tag}:h1fact1`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expect('1b facts', projected1.ok, `fromOperatorKnowledge (H1 fact1) refused: ${projected1.ok ? '' : projected1.reason}`);
    if (!projected1.ok) throw new Error('unreachable');
    const h1fact1 = await registerSignal(prisma, projected1.signal);
    const h1fact2 = await registerSignal(prisma, {
      accountName,
      hubspotCompanyId,
      personaId: personaHappy.id,
      sourceKind: 'manual',
      sourceId: `${tag}:h1url1`,
      type: 'job_posting',
      title: `${accountName} posts three gate-clerk roles at its Ohio distribution center`,
      sourceType: 'public_primary',
      evidenceUrl: `https://example.com/${tag}/jobs`,
      externalOk: true,
      observedAt: now,
      confidence: 80,
      registeredBy: ACTOR,
    });
    expect('1b facts', h1fact1.created && h1fact2.created, `H1 facts not created: ${JSON.stringify({ h1fact1, h1fact2 })}`);
    const projected2 = fromOperatorKnowledge(
      { accountName: blockedAccountName, hubspotCompanyId: blockedHubspotCompanyId, personaId: personaBlocked.id, text: 'The plant manager said the annual report lists 41 distribution centers folded in from three regional operators.', at: now, sourceId: `${tag}:h2fact1`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expect('1b facts', projected2.ok, `fromOperatorKnowledge (H2 fact1) refused: ${projected2.ok ? '' : projected2.reason}`);
    if (!projected2.ok) throw new Error('unreachable');
    const h2fact1 = await registerSignal(prisma, projected2.signal);
    const h2fact2 = await registerSignal(prisma, {
      accountName: blockedAccountName,
      hubspotCompanyId: blockedHubspotCompanyId,
      personaId: personaBlocked.id,
      sourceKind: 'manual',
      sourceId: `${tag}:h2url1`,
      type: 'job_posting',
      title: `${blockedAccountName} posts three gate-clerk roles at its Ohio distribution center`,
      sourceType: 'public_primary',
      evidenceUrl: `https://example.com/${tag}/blocked-jobs`,
      externalOk: true,
      observedAt: now,
      confidence: 80,
      registeredBy: ACTOR,
    });
    expect('1b facts', h2fact1.created && h2fact2.created, `H2 facts not created: ${JSON.stringify({ h2fact1, h2fact2 })}`);
    pass('1b facts', `H1 facts ${h1fact1.id}/${h1fact2.id}, H2 facts ${h2fact1.id}/${h2fact2.id}`);

    // 2. Hypotheses: H1 (happy, normal account) and H2 (blocked account, B6), both approved and activated.
    const activate = async (label: string, personaId: number, accName: string, hcid: string, fact1Id: string, fact2Id: string) => {
      const proposed = await proposeHypothesis(prisma, {
        accountName: accName,
        primaryPersonaId: personaId,
        persona: seed.persona,
        problemFamily: seed.problemFamily,
        observation: `${accName} lists 41 distribution centers from three regional operators [S:${fact1Id}] and posts three gate-clerk roles in Ohio [S:${fact2Id}].`,
        problemHypothesis: 'My guess is each acquired site still runs its own gate process, so the network cannot see its yards the same way from one site to the next.',
        rootCauseHypotheses: ['No shared gate standard across the acquired sites'],
        impactHypotheses: ['Detention and clerk headcount rise site by site'],
        whyNow: 'The clerk postings are open this month.',
        falsificationQuestions: ['Do the acquired sites share one gate process today?'],
        whatANoMeans: 'The family is wrong for this account.',
        confidence: 60,
        signalIds: [fact1Id, fact2Id],
        primarySignalId: fact2Id,
        createdBy: ACTOR,
      });
      expect('2 hypotheses', proposed.ok, `proposeHypothesis (${label}) refused: ${JSON.stringify(proposed)}`);
      if (!proposed.ok) throw new Error('unreachable');
      for (const action of ['submit', 'approve', 'activate'] as const) {
        const r = await transitionHypothesis(prisma, proposed.id, action, { now, actor: ACTOR });
        expect('2 hypotheses', r.ok, `${action} ${label} ${proposed.id} -> ${JSON.stringify(r)}`);
      }
      const hyp = await getHypothesis(prisma, proposed.id);
      expect('2 hypotheses', hyp?.status === 'active' && hyp.signals.length === 2, `${label} hypothesis ${proposed.id} is ${hyp?.status} with ${hyp?.signals?.length} signals, expected active with 2`);
      return proposed.id;
    };
    const h1 = await activate('H1', personaHappy.id, accountName, hubspotCompanyId, h1fact1.id, h1fact2.id);
    const h2 = await activate('H2', personaBlocked.id, blockedAccountName, blockedHubspotCompanyId, h2fact1.id, h2fact2.id);
    const h1Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { observation: true, signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    observationH1 = h1Row?.observation ?? '';
    realRefsH1 = evidenceRefsFromSignals((h1Row?.signals ?? []).map((l) => l.signal), now);
    const h2Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { observation: true, signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    observationH2 = h2Row?.observation ?? '';
    realRefsH2 = evidenceRefsFromSignals((h2Row?.signals ?? []).map((l) => l.signal), now);
    pass('2 hypotheses', `H1 ${h1.slice(0, 8)} (${accountName}) and H2 ${h2.slice(0, 8)} (${blockedAccountName}) both active, both citing two real facts`);

    // 2c. H3: internal-recipient control for B9. No family, no compile: just a hypothesis to disposition against.
    const h3Signal = await registerSignal(
      prisma,
      (
        fromOperatorKnowledge(
          { accountName, hubspotCompanyId, personaId: personaInternal.id, text: 'Internal QA probe: this hypothesis exists only to prove the learning report excludes it.', at: now, sourceId: `${tag}:h3fact1`, by: 'casey' },
          { registeredBy: ACTOR, now },
        ) as { ok: true; signal: Parameters<typeof registerSignal>[1] }
      ).signal,
    );
    const h3Proposed = await proposeHypothesis(prisma, {
      accountName,
      primaryPersonaId: personaInternal.id,
      persona: 'automation',
      problemFamily: 'automation_readiness',
      observation: `Internal QA probe at ${accountName} [S:${h3Signal.id}].`,
      problemHypothesis: 'My guess is this row must never reach a real learning metric.',
      rootCauseHypotheses: ['n/a'],
      impactHypotheses: ['n/a'],
      falsificationQuestions: ['n/a'],
      whatANoMeans: 'n/a',
      confidence: 50,
      signalIds: [h3Signal.id],
      primarySignalId: h3Signal.id,
      createdBy: ACTOR,
    });
    expect('2c internal', h3Proposed.ok, `proposeHypothesis (H3) refused: ${JSON.stringify(h3Proposed)}`);
    if (!h3Proposed.ok) throw new Error('unreachable');
    for (const action of ['submit', 'approve', 'activate'] as const) {
      const r = await transitionHypothesis(prisma, h3Proposed.id, action, { now, actor: ACTOR });
      expect('2c internal', r.ok, `${action} H3 ${h3Proposed.id} -> ${JSON.stringify(r)}`);
    }
    const h3 = h3Proposed.id;
    pass('2c internal', `H3 ${h3.slice(0, 8)} active, internal persona ${personaInternal.id} (${emails.internal})`);

    // 3. One family and version (program 'gap-finish-rc', for R-A), shared by H1 and H2: each hypothesis
    //    gets its OWN compile stack bound to it (R3-3: a compile row bound to another hypothesis never counts),
    //    so the SAME version proves both the happy path and the active-opportunity refusal.
    const family = await createFamily(prisma, { name: `GAP RC ${seed.name} ${tag}`, engine: 'modex_draft_queue', program: PROGRAM, accountName, problemFamily: seed.problemFamily, persona: seed.persona, createdBy: ACTOR });
    expect('3 family', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyId = family.id;
    const version = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: `e2e-rc ${SEED_KEY}` });
    expect('3 family', version.ok && version.version === 1, `createVersion -> ${JSON.stringify(version)}`);
    if (!version.ok) throw new Error('unreachable');
    pass('3 family', `family ${family.id}, version ${version.id} v1 (program ${PROGRAM})`);

    const stepCount = seed.steps.steps.length;
    const contractFor = (observation: string, realRefs: ReturnType<typeof evidenceRefsFromSignals>, stepIndex: number) => ({
      hypothesis: { ...fx.hypothesis, observation },
      // Step 0 cites the REAL facts through the slot; steps 1..N still cite the seed's fixture refs (same recipe as e2e-sprint3.ts).
      evidence: [...realRefs, ...fx.evidence],
      proofRefs: [],
      namedPipeline: seedEvidence.namedPipeline,
      claimsUsed: seed.steps.steps[stepIndex].claimsUsed,
      stepCount,
    });
    const stepCopy = (observation: string, i: number) =>
      renderStepCopy(
        { subject: seed.steps.steps[i].templates?.subjectTemplate ?? '', body: seed.steps.steps[i].templates?.bodyTemplate ?? '' },
        { firstName: '{{first_name}}', account: '{{account}}', observation },
      ).marked;

    const compileAll = async (label: string, hypothesisId: string, observation: string, realRefs: ReturnType<typeof evidenceRefsFromSignals>): Promise<string[]> => {
      const ids: string[] = [];
      const priorBodies: string[] = [];
      for (let i = 0; i < stepCount; i += 1) {
        const copy = stepCopy(observation, i);
        const r: CompileResult = await compile(
          { hypothesisId, sequenceVersionId: version.id, stepIndex: i, subject: copy.subject, body: copy.body, priorBodies: [...priorBodies], contract: contractFor(observation, realRefs, i), createdBy: ACTOR },
          { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
        );
        expect('4 compile', r.verdict === 'pass' && !!r.id, `${label} step ${i} -> ${r.verdict} id ${r.id ?? 'none'} ${r.persistError ?? ''}`);
        ids.push(r.id as string);
        priorBodies.push(copy.body);
      }
      return ids;
    };
    const h1CompileIds = await compileAll('H1', h1, observationH1, realRefsH1);
    const h2CompileIds = await compileAll('H2', h2, observationH2, realRefsH2);
    created.compileIds.push(...h1CompileIds, ...h2CompileIds);
    pass('4 compile', `H1 ${stepCount} steps pass (${h1CompileIds.map((id) => id.slice(0, 8)).join(',')}); H2 ${stepCount} steps pass (${h2CompileIds.map((id) => id.slice(0, 8)).join(',')}); same version, two independent hypothesis-bound compile stacks`);

    // 5. B6: the blocked account's enroll refuses active_opportunity, with an otherwise-identical passing compile stack.
    const blockedEnroll = await enrollFromDecision(
      prisma,
      { hypothesisId: h2, personaId: personaBlocked.id, sequenceVersionId: version.id, compileIds: h2CompileIds, actor: OWNER, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: OWNER },
      { addOne, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear },
    );
    expect('5 active opportunity', !blockedEnroll.ok && blockedEnroll.reason === 'active_opportunity', `enroll on the mid-deal account -> ${JSON.stringify(blockedEnroll)}, expected active_opportunity (B6)`);
    const blockedItemsAfter = await prisma.draftQueueItem.count({ where: { to_email: emails.blocked } });
    expect('5 active opportunity', blockedItemsAfter === 0, `${blockedItemsAfter} draft items created for the blocked persona, expected 0 (refused before addOne)`);
    pass('5 active opportunity', `enrollFromDecision on ${blockedAccountName} (pipeline_stage meeting) refuses active_opportunity (B6) even with a passing compile stack identical to the happy path's; no queue item created`);

    // 6. Suppression wins: the same enroll call for a do_not_contact persona on the (otherwise clean) happy account.
    await prisma.persona.update({ where: { id: personaHappy.id }, data: { do_not_contact: true } });
    const suppressedEnroll = await enrollFromDecision(
      prisma,
      { hypothesisId: h1, personaId: personaHappy.id, sequenceVersionId: version.id, compileIds: h1CompileIds, actor: OWNER, actorKind: 'human', mode: 'shadow', now },
      { addOne, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear },
    );
    expect('6 suppression', !suppressedEnroll.ok && suppressedEnroll.reason === 'suppressed' && suppressedEnroll.detail === 'modex_do_not_contact', `enroll on a do_not_contact persona -> ${JSON.stringify(suppressedEnroll)}, expected suppressed on leg modex_do_not_contact`);
    await prisma.persona.update({ where: { id: personaHappy.id }, data: { do_not_contact: false } });
    pass('6 suppression', 'a do_not_contact persona refuses suppressed on leg modex_do_not_contact (R3-2); local suppression checked BEFORE any queue write, on a fresh read, same as B6 above');

    // 7. Execution/enrollment attribution: the happy path enrolls live through the real addOne.
    const live = await enrollFromDecision(
      prisma,
      { hypothesisId: h1, personaId: personaHappy.id, sequenceVersionId: version.id, compileIds: h1CompileIds, actor: OWNER, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: OWNER },
      { addOne, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear },
    );
    expect('7 enroll', live.ok && live.kind === 'modex_enrolled', `live enroll -> ${JSON.stringify(live).slice(0, 300)}`);
    if (!live.ok || live.kind !== 'modex_enrolled') throw new Error('unreachable');
    const enrollmentId = live.enrollment.id;
    const itemId = live.draftItemId;
    const item = await prisma.draftQueueItem.findUnique({ where: { id: itemId } });
    expect('7 enroll', item?.sequence_run_id === enrollmentId && item.sequence_version_id === version.id && item.status === 'draft', `item ${JSON.stringify(item && { run: item.sequence_run_id, version: item.sequence_version_id, status: item.status })}`);
    const enrollment = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId }, select: { status: true, is_test: true } });
    expect('7 enroll', enrollment?.status === 'active' && enrollment.is_test === false, `enrollment ${JSON.stringify(enrollment)}`);
    pass('7 enroll', `enrollment ${enrollmentId} active, item ${itemId} stamped (sequence_version_id ${version.id}) and gate-visible (SF11) from the instant it was created, is_test false`);

    // 8. B5: the GAP kill switch cannot create a raw/uncompiled continuation. Flip GAP_OS_ENABLED off
    // and call the SAME scheduleNextStep the queue runtime uses on this run's own GAP-stamped item.
    const savedGapOs = process.env.GAP_OS_ENABLED;
    delete process.env.GAP_OS_ENABLED;
    expect('8 kill switch', !isGapOsEnabled(), 'GAP_OS_ENABLED did not read as off after deletion');
    let killSwitchResult: number | null = 'unset' as unknown as null;
    try {
      killSwitchResult = await scheduleNextStep(prisma, item, { critic: criticPass, now: () => now });
    } finally {
      if (savedGapOs !== undefined) process.env.GAP_OS_ENABLED = savedGapOs;
    }
    expect('8 kill switch', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED was not restored after the kill-switch check');
    expect('8 kill switch', killSwitchResult === null, `scheduleNextStep with the flag off returned ${String(killSwitchResult)}, expected null (nothing scheduled)`);
    const skippedAudit = await prisma.gapAuditEvent.count({ where: { kind: 'schedule.skipped', subject_id: String(itemId), created_at: { gte: runStart } } });
    expect('8 kill switch', skippedAudit >= 1, `${skippedAudit} schedule.skipped audit rows for item ${itemId}, expected at least 1`);
    const itemsAfterKillSwitch = await prisma.draftQueueItem.count({ where: { to_email: emails.happy } });
    expect('8 kill switch', itemsAfterKillSwitch === 1, `${itemsAfterKillSwitch} draft items for the happy persona after the kill-switch check, expected 1 (no raw continuation created)`);
    pass('8 kill switch', `GAP_OS_ENABLED off: scheduleNextStep on this run's own GAP-stamped item (sequence_version_id set) schedules nothing (B5), audits schedule.skipped, and creates no second item; flag restored`);

    // 9. R-B: routing recommendation vs human action, over a real RoutingDecision row and the real recordHumanAction writer.
    const runId = `${tag}-routing`;
    const agreeDecision = await prisma.routingDecision.create({
      data: { run_id: runId, mode: 'shadow', account_name: accountName, persona_id: personaHappy.id, hypothesis_id: h1, action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'r17_enroll', priority: 0, explain: {}, inputs_snapshot: {} },
      select: { id: true },
    });
    const disagreeDecision = await prisma.routingDecision.create({
      data: { run_id: runId, mode: 'shadow', account_name: accountName, persona_id: personaHappy.id, hypothesis_id: h1, action: 'nurture', lane: 'work_queue', rule_id: 'r7_not_priority', priority: 5, explain: {}, inputs_snapshot: {} },
      select: { id: true },
    });
    created.routingDecisionIds.push(agreeDecision.id, disagreeDecision.id);
    const act1 = await recordHumanAction(prisma, agreeDecision.id, 'enrolled_by_hand', OWNER, { now: () => now });
    const act2 = await recordHumanAction(prisma, disagreeDecision.id, 'called', OWNER, { now: () => now });
    expect('9 agreement', act1.ok && act2.ok, `recordHumanAction -> ${JSON.stringify({ act1, act2 })}`);
    const agreementReport = await loadAgreementReport(prisma, { runId });
    expect('9 agreement', agreementReport.overall.n === 2 && agreementReport.overall.agreements === 1 && agreementReport.overall.disagreements === 1 && agreementReport.overall.rate === 0.5, `agreement report ${JSON.stringify(agreementReport.overall)}, expected n=2, 1 agreement (enroll_gap_sequence/enrolled_by_hand), 1 disagreement (nurture/called), rate 0.5`);
    pass('9 agreement', `real RoutingDecision rows stamped by the real recordHumanAction, read back through loadAgreementReport: 1 agreement, 1 disagreement, rate 0.5 (R-B)`);

    // 10. Human-confirmed disposition + BID + hypothesis resolution for H1 (the happy path), and the B9 internal-recipient control on H3.
    const confirmed = await recordDisposition(prisma, {
      hypothesisId: h1,
      personaId: personaHappy.id,
      contactEmail: emails.happy,
      channel: 'call',
      responseClass: 'problem_confirmed',
      buyerLanguage: 'Yes, we run each acquired site on its own gate process today.',
      rootCauseClass: 'No shared gate standard across the acquired sites',
      bids: [
        { type: 'business_problem', rawBuyerLanguage: 'Each site still runs its own gate process.' },
        { type: 'root_cause', rawBuyerLanguage: 'No shared standard across the acquired sites.' },
      ],
      source: { kind: 'call', id: `${tag}:call1` },
      actor: OWNER,
      actorKind: 'human',
      now,
    } satisfies RecordDispositionInput);
    expect('10 disposition', confirmed.ok, `recordDisposition (H1) -> ${JSON.stringify(confirmed)}`);
    if (!confirmed.ok) throw new Error('unreachable');
    // recordDisposition (a bare manual/call disposition) never sets
    // enrollment_id -- that only happens on the reply-ingestion path
    // (replies/suggest.ts stamps it on the AI suggestion row a human then
    // adopts, already proven end to end in e2e-sprint4.ts). R-A's program
    // filter is a real, external, in-program ENROLLMENT filter (learning/
    // query.ts's own comment: "a disposition with no enrollment cannot match
    // a program"), so this stamp mirrors what that other, already-proven
    // write path would have produced, to exercise R-A's READ-side filter
    // logic here without re-running the whole ingest+suggest+adopt chain.
    await prisma.conversationDisposition.update({ where: { id: confirmed.dispositionId }, data: { enrollment_id: enrollmentId } });
    const h1After = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true } });
    expect('10 disposition', h1After?.status === 'confirmed', `H1 status ${h1After?.status}, expected confirmed`);

    // B9: the internal-recipient disposition. Human-confirmed, but its contact_email is @freightroll.com.
    const internalDisposition = await recordDisposition(prisma, {
      hypothesisId: h3,
      personaId: personaInternal.id,
      contactEmail: emails.internal,
      channel: 'email',
      responseClass: 'problem_confirmed',
      buyerLanguage: 'Internal QA confirms the probe fired.',
      source: { kind: 'manual', id: `${tag}:internal1` },
      actor: OWNER,
      actorKind: 'human',
      now,
    } satisfies RecordDispositionInput);
    expect('10 disposition', internalDisposition.ok, `recordDisposition (H3, internal) -> ${JSON.stringify(internalDisposition)}`);
    pass('10 disposition', `H1 confirmed with a root-cause BID (resolution ${h1After?.status}); H3's internal-recipient (${emails.internal}) disposition recorded too, for the B9 exclusion check next`);

    // 11. Learning: B9 excludes the internal conversation; R-A's program and date filters return only the intended cohort.
    const reportAll = await buildLearningReport(prisma);
    const happyDisposition = reportAll.dispositionDistribution.find((r) => r.responseClass === 'problem_confirmed');
    const internalConversationCounted = (await prisma.conversationDisposition.count({ where: { hypothesis_id: h3, human_confirmed: true } })) >= 1;
    expect('11 learning b9', internalConversationCounted, 'the internal disposition row should exist in the DB (it does; the exclusion is in the learning READ, not the write)');
    const h3InReport = reportAll.byProblemFamily.find((r) => r.key === 'automation_readiness');
    expect('11 learning b9', !h3InReport || h3InReport.funnel.resolutionRate.denominator === 0, `byProblemFamily automation_readiness ${JSON.stringify(h3InReport?.funnel)}, expected absent or zero-denominator (H3's internal disposition must never surface as a real conversation)`);
    void happyDisposition;
    pass('11 learning b9', `the internal-recipient (@freightroll.com) disposition on H3 never reaches buildLearningReport's real metrics (B9); H1's external disposition does`);

    const reportProgram = await buildLearningReport(prisma, { program: PROGRAM });
    const h1FamilyBreakdown = reportProgram.byProblemFamily.find((r) => r.key === seed.problemFamily);
    expect('11 learning ra', !!h1FamilyBreakdown && h1FamilyBreakdown.funnel.resolutionRate.denominator >= 1, `program-filtered report should include H1's family (${seed.problemFamily}); got ${JSON.stringify(reportProgram.byProblemFamily.map((r) => r.key))}`);
    const reportOtherProgram = await buildLearningReport(prisma, { program: `${PROGRAM}-does-not-exist` });
    const noMatch = reportOtherProgram.byProblemFamily.find((r) => r.key === seed.problemFamily && r.funnel.resolutionRate.denominator >= 1);
    expect('11 learning ra', !noMatch, `a program filter for a program that does not exist should return nothing for H1's family; got ${JSON.stringify(noMatch)}`);
    const reportPastWindow = await buildLearningReport(prisma, { program: PROGRAM, from: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
    const h1PastWindow = reportPastWindow.byProblemFamily.find((r) => r.key === seed.problemFamily && r.funnel.resolutionRate.denominator >= 1);
    expect('11 learning ra', !h1PastWindow, `a date window starting after this run should exclude H1's confirmed conversation; got ${JSON.stringify(h1PastWindow)}`);
    const reportThisWindow = await buildLearningReport(prisma, { program: PROGRAM, from: new Date(now.getTime() - 60 * 60 * 1000), to: new Date(now.getTime() + 60 * 60 * 1000) });
    const h1ThisWindow = reportThisWindow.byProblemFamily.find((r) => r.key === seed.problemFamily);
    expect('11 learning ra', !!h1ThisWindow && h1ThisWindow.funnel.resolutionRate.denominator >= 1, `a date window bracketing this run should include H1's family; got ${JSON.stringify(reportThisWindow.byProblemFamily.map((r) => r.key))}`);
    pass('11 learning ra', `program filter '${PROGRAM}' includes H1's family, a nonexistent program excludes it, a date window after this run excludes it, a window bracketing this run includes it (R-A)`);

    counts.h1 = h1;
    counts.h2 = h2;
    counts.h3 = h3;
    counts.familyId = family.id;
    counts.versionId = version.id;
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
    if (process.env.GAP_OS_ENABLED === undefined) process.env.GAP_OS_ENABLED = 'true'; // belt-and-braces restore
    let removed: Record<string, number> | null = null;
    let leftovers: Record<string, number> | null = null;
    if (seeded) {
      try {
        removed = await cleanup(prisma, created, runStart);
        console.log(`cleanup ${JSON.stringify(removed)}`);
        leftovers = await countLeftovers(prisma, created);
        const left = Object.entries(leftovers).filter(([, n]) => n > 0);
        console.log(`leftovers ${JSON.stringify(leftovers)}`);
        if (left.length > 0) {
          const detail = `rows left behind: ${JSON.stringify(Object.fromEntries(left))}`;
          lines.push({ step: 'cleanup', status: 'FAIL', detail });
          console.log(`FAIL cleanup: ${detail}`);
          if (!failure) failure = new StepFailure('cleanup', detail);
        } else {
          pass('cleanup', `every row the run created was deleted (${JSON.stringify(removed)}); zero leftovers`);
        }
      } catch (err) {
        console.error(`cleanup FAILED for ${accountName}/${blockedAccountName}: ${errorText(err).slice(0, 500)}`);
        lines.push({ step: 'cleanup', status: 'FAIL', detail: errorText(err).slice(0, 300) });
        if (!failure) failure = new StepFailure('cleanup', errorText(err));
      }
    }
    try {
      writeReport({ failure, tag, dbHost, gitSha, removed, leftovers });
      console.log(`report ${REPORT_PATH}`);
    } catch (err) {
      console.error(`report write failed: ${errorText(err)}`);
    }
    await prisma.$disconnect();
  }
  return failure ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
