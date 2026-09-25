/**
 * GAP Prospecting OS: the FINAL INTEGRATED RUNTIME E2E, weaving 6A through
 * Sprint 7 into one chain, against a SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   GAP_OS_ENABLED=true GAP_HYPOTHESIS_ENABLED=true GAP_ROUTING_ENABLED=true \
 *   GAP_MESSAGE_COMPILER_ENABLED=true GAP_REPLY_CLASSIFICATION_ENABLED=true \
 *   npx tsx scripts/gap/e2e-runtime.ts
 *
 * (run `npx tsx scripts/gap/seed-families.ts --apply` once first if the
 * scratch DB has no seed families yet.)
 *
 * MESSY EXTERNAL COMPANY IDENTITY -> canonical resolution (6A) -> signal ->
 * hypothesis -> routing -> ExecutionIntent -> the full 6B gate chain -> a
 * fake transport through an adapter -> ExecutionReceipt -> reconciliation
 * (6D) -> inbound reply -> AI/unconfirmed disposition suggestion -> human
 * confirmation -> BuyerInputData -> hypothesis resolution -> stop/DNC effect
 * -> operational learning (6E/6F) -> routing-vs-human agreement (R-B) ->
 * Sprint 7 shadow decision -> cap/gate evaluation -> kill-switch drill ->
 * ZERO real outbound action anywhere.
 *
 * Every real GAP function is called directly, never mocked. The only fakes
 * are at the true network boundary: a fetchImpl spy for the HubSpot adapter
 * and injected Gmail-sender functions for the Gmail adapters (both deps
 * points the adapters already expose for exactly this), so this script
 * proves the REAL adapter code paths while making zero real HTTP calls.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - HUBSPOT_ACCESS_TOKEN, MC_API_TOKEN, GOOGLE_REFRESH_TOKEN,
 *     GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLAWD_CONTROL_PLANE_URL,
 *     CLAWD_CONTROL_PLANE_TOKEN are deleted from process.env before the
 *     first import.
 *   - GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED and GAP_AUTO_ENROLL_ENABLED stay
 *     off throughout (only GAP_AUTO_ENROLL_SHADOW is flipped on, briefly,
 *     for the one shadow-decision step, and restored after).
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *
 * Writes docs/gap/runtime-e2e-latest.md on every run, PASS or FAIL, before
 * cleanup.
 */
const SCRUBBED_ENV = [
  'HUBSPOT_ACCESS_TOKEN',
  'MC_API_TOKEN',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CLAWD_CONTROL_PLANE_URL',
  'CLAWD_CONTROL_PLANE_TOKEN',
] as const;
for (const name of SCRUBBED_ENV) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { addOne } from '../../src/app/discovery/queue-actions';
import { correctBid } from '../../src/lib/gap/bid/capture';
import { validateClaimsUsed } from '../../src/lib/gap/claims/validate-claims';
import { compile, type CompileResult } from '../../src/lib/gap/compiler/compile';
import { evidenceRefsFromSignals } from '../../src/lib/gap/compiler/evidence-from-signals';
import type { CriticClient } from '../../src/lib/gap/critic-client';
import { dispositionEffects } from '../../src/lib/gap/disposition/model';
import { recordDisposition, type RecordDispositionInput } from '../../src/lib/gap/disposition/service';
import { audit } from '../../src/lib/gap/audit';
import { checkCanaryCaps, type CanaryConfig, type CanaryDayState } from '../../src/lib/gap/automation/canary';
import { evaluateGates, allGatesEarned, type GateInputs } from '../../src/lib/gap/automation/gates';
import { recordShadowDecision } from '../../src/lib/gap/automation/shadow';
import { enrollFromDecision, type EnrollDeps } from '../../src/lib/gap/enroll/service';
import { gmailDraftAdapter, sendDraftedGmailAdapter } from '../../src/lib/gap/execution/gmail-adapter';
import { hubspotSequenceAdapter } from '../../src/lib/gap/execution/hubspot-sequence-adapter';
import { legacyEnrollAdapter } from '../../src/lib/gap/execution/legacy-enroll-adapter';
import { reconcileOne, type EngineEvidence } from '../../src/lib/gap/execution/reconciler';
import type { ExecutionIntent } from '../../src/lib/gap/execution/contract';
import { gapFlag, isGapOsEnabled } from '../../src/lib/gap/flags';
import { getHypothesis, proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { loadIdentityContext } from '../../src/lib/gap/identity/service';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
import { buildLearningReport } from '../../src/lib/gap/learning/query';
import { ingestReply } from '../../src/lib/gap/replies/ingest';
import { listReplies } from '../../src/lib/gap/replies/list';
import { suggestReply, type AiClient } from '../../src/lib/gap/replies/suggest';
import { loadAgreementReport } from '../../src/lib/gap/routing/agreement-query';
import { recordHumanAction } from '../../src/lib/gap/routing/queue';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { EVIDENCE_SIGNAL_SELECT, renderStepCopy } from '../../src/lib/gap/sequence/render';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { seedFamilyByKey, type SeedFamily } from '../../src/lib/gap/sequences/families';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { scheduleNextStep } from '../../src/lib/queue/sequence-runtime';
import { STATUS } from '../../src/lib/queue/types';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'runtime-e2e-latest.md');
const SEED_EVIDENCE_FIXTURE = path.join('tests', 'fixtures', 'gap', 'seed-evidence.json');
const SEED_KEY = 'network_standardization';
const ACTOR = 'e2e-runtime';
const OWNER = 'casey@freightroll.com';
const PROGRAM = 'gap-e2e-runtime';
const AI_ACTOR = 'ai';
const criticPass: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) };
const autonomyLive = async () => ({ halted: false });
const suppressionClear = staticSuppressionReader('clear');
const REPLY_HTML = '<div><p>Yes, our <b>Ohio</b> gate backs up every morning.</p><p>Trucks wait about an hour before a clerk sees the paperwork.</p><style>p{}</style></div>';
const REPLY_TEXT = 'Yes, our Ohio gate backs up every morning. Trucks wait about an hour before a clerk sees the paperwork.';
const QUOTE = 'Trucks wait about an hour before a clerk sees the paperwork.';

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
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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
function stubAi(answer: unknown): { ai: AiClient; calls: () => number } {
  let n = 0;
  const ai: AiClient = async () => {
    n += 1;
    return typeof answer === 'string' ? answer : JSON.stringify(answer);
  };
  return { ai, calls: () => n };
}

interface Created {
  accountNames: string[];
  emails: string[];
  familyId: string | null;
  compileIds: string[];
  routingDecisionIds: string[];
  inboundIds: string[];
  threadIds: string[];
  triggerIds: number[];
  aliasAccountNames: string[];
}

const DELETE_GUARDS: Array<[table: string, trigger: string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['buyer_input_data', 'gap_bid_guard_del'],
  ['sequence_versions', 'gap_version_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: Created, runStart: Date): Promise<Record<string, number>> {
  return prisma.$transaction(
    async (tx) => {
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
            where: { created_at: { gte: runStart }, OR: [{ actor: { in: [ACTOR, OWNER, 'system:shadow', 'kill-switch-drill'] } }, { subject_id: { in: [...hypothesisIds, ...dispositionIds, ...c.routingDecisionIds] } }] },
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
        removed.gap_account_aliases = (await tx.gapAccountAlias.deleteMany({ where: { account_name: { in: c.aliasAccountNames } } })).count;
        removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { id: { in: c.triggerIds } } })).count;
        removed.inbound_messages = (await tx.inboundMessage.deleteMany({ where: { id: { in: c.inboundIds } } })).count;
        removed.email_threads = (await tx.emailThread.deleteMany({ where: { id: { in: c.threadIds } } })).count;
        if (c.familyId) {
          removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: c.familyId } })).count;
          removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: c.familyId } })).count;
        }
        removed.unsubscribed_emails = (await tx.unsubscribedEmail.deleteMany({ where: { email: { in: c.emails } } })).count;
        removed.personas = (await tx.persona.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
        removed.accounts = (await tx.account.deleteMany({ where: { name: { in: c.accountNames } } })).count;
      } finally {
        for (const [table, trigger] of DELETE_GUARDS) {
          await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
        }
      }
      return removed;
    },
    { maxWait: 15_000, timeout: 60_000 },
  );
}

async function countLeftovers(prisma: PrismaClient, c: Created): Promise<Record<string, number>> {
  return {
    accounts: await prisma.account.count({ where: { name: { in: c.accountNames } } }),
    personas: await prisma.persona.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { email: { in: c.emails } }] } }),
    prospecting_signals: await prisma.prospectingSignal.count({ where: { account_name: { in: c.accountNames } } }),
    prospecting_hypotheses: await prisma.prospectingHypothesis.count({ where: { account_name: { in: c.accountNames } } }),
    gap_account_aliases: await prisma.gapAccountAlias.count({ where: { account_name: { in: c.aliasAccountNames } } }),
    pounce_triggers: await prisma.pounceTrigger.count({ where: { id: { in: c.triggerIds } } }),
    conversation_dispositions: await prisma.conversationDisposition.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] } }),
    buyer_input_data: await prisma.buyerInputData.count({ where: { OR: [{ account_name: { in: c.accountNames } }, { contact_email: { in: c.emails } }] } }),
    draft_queue_items: await prisma.draftQueueItem.count({ where: { to_email: { in: c.emails } } }),
    sequence_enrollments: await prisma.sequenceEnrollment.count({ where: { account_name: { in: c.accountNames } } }),
    sequence_families: c.familyId ? await prisma.sequenceFamily.count({ where: { id: c.familyId } }) : 0,
    routing_decisions: await prisma.routingDecision.count({ where: { id: { in: c.routingDecisionIds } } }),
    gap_compiles: await prisma.gapCompile.count({ where: { id: { in: c.compileIds } } }),
    inbound_messages: await prisma.inboundMessage.count({ where: { id: { in: c.inboundIds } } }),
    email_threads: await prisma.emailThread.count({ where: { id: { in: c.threadIds } } }),
    unsubscribed_emails: await prisma.unsubscribedEmail.count({ where: { email: { in: c.emails } } }),
  };
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string; removed: Record<string, number> | null; leftovers: Record<string, number> | null }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# GAP OS RUNTIME final integrated e2e (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-runtime.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- Credentials scrubbed from the process before the first import: ${SCRUBBED_ENV.join(',')}`,
    '- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, no credential is present, and the HubSpot/Gmail adapters run against injected fake transports.',
    '- Proves the full chain: messy company identity -> 6A canonical resolution -> signal -> hypothesis -> routing -> ExecutionIntent -> the full 6B gate chain -> a fake-transport adapter receipt -> 6D reconciliation -> inbound reply -> AI/unconfirmed suggestion -> human confirmation -> BID -> hypothesis resolution -> stop/DNC effect -> operational learning (6E/6F) -> routing-vs-human agreement (R-B) -> Sprint 7 shadow decision -> cap/gate evaluation -> the kill-switch drill -> zero real outbound action.',
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
  const tag = `gap-rt-${Date.now()}`;
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

  const accountName = `GAP RT Co ${tag}`;
  const blockedAccountName = `GAP RT Blocked Co ${tag}`;
  // The legal-suffix token must be the LAST token after normalization, so it
  // goes after the (hyphenated) tag, not before it.
  const ambiguousA = `GAP RT Ambiguous ${tag} Co`;
  const ambiguousB = `GAP RT Ambiguous, ${tag} Co.`;
  const hubspotCompanyId = `e2ert-${tag}`;
  const blockedHubspotCompanyId = `e2ert-blocked-${tag}`;
  const wrongGuessName = `GAP RT Wrong Guess ${tag}`;
  const unknownName = `Totally Unknown RT Co ${tag}`;
  const emails = {
    happy: `priya+${tag}@example.com`,
    blocked: `jordan+${tag}@example.com`,
    internal: `probe+${tag}@freightroll.com`,
    dnc: `morgan+${tag}@example.com`,
  };
  const created: Created = {
    accountNames: [accountName, blockedAccountName, ambiguousA, ambiguousB, wrongGuessName],
    emails: Object.values(emails),
    familyId: null,
    compileIds: [],
    routingDecisionIds: [],
    inboundIds: [],
    threadIds: [],
    triggerIds: [],
    aliasAccountNames: [accountName],
  };

  const seedEvidence = JSON.parse(readFileSync(SEED_EVIDENCE_FIXTURE, 'utf8')) as {
    namedPipeline: string[];
    families: Record<string, { hypothesis: { observation: string; problemHypothesis: string; problemFamily: string }; evidence: Array<{ id: string; title: string; url: string; externalOk: boolean; fresh: boolean; superseded: boolean; firstParty: boolean }> }>;
  };
  const seed = seedFamilyByKey(SEED_KEY) as SeedFamily;
  const fx = seedEvidence.families[SEED_KEY];

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;
  let observationH1 = '';
  let realRefsH1: ReturnType<typeof evidenceRefsFromSignals> = [];

  try {
    // 0. Preflight.
    expect('0 preflight', isGapOsEnabled() && gapFlag('GAP_HYPOTHESIS_ENABLED') && gapFlag('GAP_ROUTING_ENABLED') && gapFlag('GAP_MESSAGE_COMPILER_ENABLED') && gapFlag('GAP_REPLY_CLASSIFICATION_ENABLED'), 'not every required flag is on');
    expect('0 preflight', !gapFlag('GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED') && !gapFlag('GAP_AUTO_ENROLL_ENABLED') && !gapFlag('GAP_AUTO_ENROLL_SHADOW'), 'a Sprint 7 flag is already on before this run touches anything');
    for (const name of SCRUBBED_ENV) expect('0 preflight', process.env[name] === undefined, `${name} still present`);
    expect('0 preflight', !!seed && !!fx, `seed family ${SEED_KEY} or its fixture evidence is missing (run scripts/gap/seed-families.ts --apply)`);
    const stale = await prisma.account.count({ where: { name: { in: created.accountNames } } });
    expect('0 preflight', stale === 0, `a run-tagged account already exists`);
    pass('0 preflight', 'flags on, Sprint 7 flags off, credentials scrubbed, seed family present, no stale rows');

    // 1. IDENTITY (6A).
    seeded = true;
    await prisma.account.create({ data: { rank: 9990, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId, tier: 'Tier 1', pipeline_stage: 'targeted' } });
    await prisma.account.create({ data: { rank: 9991, name: blockedAccountName, vertical: 'cpg', hubspot_company_id: blockedHubspotCompanyId, tier: 'Tier 1', pipeline_stage: 'meeting' } });
    await prisma.account.create({ data: { rank: 9992, name: wrongGuessName, vertical: 'cpg' } });
    await prisma.account.create({ data: { rank: 9993, name: ambiguousA, vertical: 'cpg' } });
    await prisma.account.create({ data: { rank: 9994, name: ambiguousB, vertical: 'cpg' } });

    // 1a. Company id / domain precedence: a raw name that exactly matches the
    // WRONG account, but a real hubspot_company_id that names the RIGHT one.
    // The higher tier wins and the conflict is auditable (never silently dropped).
    const ctx1 = await loadIdentityContext(prisma);
    const idA = resolveIdentity(ctx1, { rawName: wrongGuessName, hubspotCompanyId });
    expect('1a identity precedence', idA.ok && idA.via === 'hubspot_company_id' && idA.accountName === accountName, `expected hubspot_company_id to win and name ${accountName}, got ${JSON.stringify(idA)}`);
    expect('1a identity precedence', idA.ok && !!idA.conflict && idA.conflict.accountName === wrongGuessName, `expected the name-derived conflict to be reported, got ${idA.ok ? JSON.stringify(idA.conflict) : 'refused'}`);
    pass('1a identity precedence', `company id wins over a name that exactly matches a different real account (${wrongGuessName}); conflict reported: ${JSON.stringify(idA.ok ? idA.conflict : null)}`);

    // 1b. Normalized-name fallback does NOT silently merge two real, ambiguous accounts.
    const key1 = normalizeCompanyName(ambiguousA);
    const key2 = normalizeCompanyName(ambiguousB);
    expect('1b identity ambiguity', key1 === key2, `test fixture bug: "${ambiguousA}" and "${ambiguousB}" must normalize identically to exercise ambiguity, got "${key1}" vs "${key2}"`);
    const ctx1b = await loadIdentityContext(prisma);
    const thirdRawName = `GAP RT Ambiguous ${tag} Company`; // normalizes the same way, exact match to neither
    expect('1b identity ambiguity', normalizeCompanyName(thirdRawName) === key1, `test fixture bug: "${thirdRawName}" must also normalize to "${key1}", got "${normalizeCompanyName(thirdRawName)}"`);
    const idB = resolveIdentity(ctx1b, { rawName: thirdRawName });
    expect('1b identity ambiguity', !idB.ok && idB.reason === 'ambiguous_identity', `expected ambiguous_identity for two real accounts normalizing identically, got ${JSON.stringify(idB)}`);
    pass('1b identity ambiguity', `two real accounts that normalize identically refuse ambiguous_identity rather than silently picking one`);

    // 1c. A messy raw pounce-trigger name resolves via the normalized fallback
    // tier to the CANONICAL account, through the real hypothesize job.
    const trigger = await prisma.pounceTrigger.create({
      data: {
        url_hash: `${tag}-messy`,
        account_slug: 'messy',
        account_name: `${accountName}, LLC`,
        title: 'Opens new automated yard',
        url: `https://example.com/${tag}/messy`,
        source: 'news',
        score: 9,
        categories: ['expansion'],
        first_seen_at: now,
      },
    });
    created.triggerIds.push(trigger.id);
    const { runHypothesize } = await import('../../src/lib/gap/hypothesis/hypothesize');
    const hypReport = await runHypothesize(prisma, { now, lookbackDays: 1, dryRun: false });
    expect('1c messy identity', hypReport.identity.resolved >= 1, `runHypothesize identity report ${JSON.stringify(hypReport.identity)}, expected at least 1 resolved`);
    const messySignal = await prisma.prospectingSignal.findUnique({ where: { source_kind_source_id: { source_kind: 'pounce_trigger', source_id: String(trigger.id) } } });
    expect('1c messy identity', messySignal?.account_name === accountName, `expected the messy-named trigger's signal to land under the canonical account ${accountName}, got ${messySignal?.account_name}`);
    const alias = await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: normalizeCompanyName(`${accountName}, LLC`) } });
    expect('1c messy identity', alias?.account_name === accountName, `expected the messy name to be cached as an alias to ${accountName}`);
    pass('1c messy identity', `"${accountName}, LLC" resolved to the canonical account ${accountName} through the real hypothesize job (not thrown), and cached as an alias`);

    // 2. Facts, personas, hypotheses (H1 happy, H2 blocked-account for B6,
    // H3 internal for B9, H4 for the DNC effect).
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
    const personaDnc = await prisma.persona.create({
      data: { persona_id: `${tag}-dnc`, account_name: accountName, priority: 'P1', name: `Morgan Lee ${tag}`, title: 'Director Ops', seniority: 'director', email: emails.dnc, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-dnc` },
      select: { id: true },
    });
    pass('2 seed personas', `account ${accountName} (pipeline_stage=targeted), blocked account ${blockedAccountName} (pipeline_stage=meeting), four personas (happy ${personaHappy.id}, blocked ${personaBlocked.id}, internal ${personaInternal.id}, dnc ${personaDnc.id})`);

    const registerFacts = async (accName: string, hcid: string, personaId: number, tagSuffix: string) => {
      const p1 = fromOperatorKnowledge({ accountName: accName, hubspotCompanyId: hcid, personaId, text: 'The plant manager said the annual report lists 41 distribution centers folded in from three regional operators.', at: now, sourceId: `${tag}:${tagSuffix}fact1`, by: 'casey' }, { registeredBy: ACTOR, now });
      expect('2b facts', p1.ok, `fromOperatorKnowledge (${tagSuffix} fact1) refused: ${p1.ok ? '' : p1.reason}`);
      if (!p1.ok) throw new Error('unreachable');
      const f1 = await registerSignal(prisma, p1.signal);
      const f2 = await registerSignal(prisma, { accountName: accName, hubspotCompanyId: hcid, personaId, sourceKind: 'manual', sourceId: `${tag}:${tagSuffix}url1`, type: 'job_posting', title: `${accName} posts three gate-clerk roles at its Ohio distribution center`, sourceType: 'public_primary', evidenceUrl: `https://example.com/${tag}/${tagSuffix}-jobs`, externalOk: true, observedAt: now, confidence: 80, registeredBy: ACTOR });
      expect('2b facts', f1.created && f2.created, `${tagSuffix} facts not created: ${JSON.stringify({ f1, f2 })}`);
      return { f1, f2 };
    };
    const factsH1 = await registerFacts(accountName, hubspotCompanyId, personaHappy.id, 'h1');
    const factsH2 = await registerFacts(blockedAccountName, blockedHubspotCompanyId, personaBlocked.id, 'h2');
    const factsH4 = await registerFacts(accountName, hubspotCompanyId, personaDnc.id, 'h4');
    pass('2b facts', `H1 facts ${factsH1.f1.id.slice(0, 8)}/${factsH1.f2.id.slice(0, 8)}, H2 facts ${factsH2.f1.id.slice(0, 8)}/${factsH2.f2.id.slice(0, 8)}, H4 facts ${factsH4.f1.id.slice(0, 8)}/${factsH4.f2.id.slice(0, 8)}`);

    // SF14's evidence_expired proof needs a real signal linked to H4 whose
    // freshness is already past. Linking must happen BEFORE H4 is activated:
    // GAP_HYPOTHESIS_FROZEN's N4 rule refuses linking a new signal into a
    // hypothesis past review, so this cannot be added after the fact.
    const expiredSignal = await prisma.prospectingSignal.create({ data: { account_name: accountName, source_kind: 'manual', source_id: `${tag}-expired-fact`, type: 'news', title: 'Expired fact for SF14', source_type: 'manual', observed_at: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), confidence: 50, freshness_expires_at: new Date(now.getTime() - 24 * 60 * 60 * 1000), registered_by: ACTOR } });

    const activate = async (label: string, personaId: number, accName: string, fact1Id: string, fact2Id: string, extraSignalIds: string[] = []) => {
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
        signalIds: [fact1Id, fact2Id, ...extraSignalIds],
        primarySignalId: fact2Id,
        createdBy: ACTOR,
      });
      expect('2c hypotheses', proposed.ok, `proposeHypothesis (${label}) refused: ${JSON.stringify(proposed)}`);
      if (!proposed.ok) throw new Error('unreachable');
      for (const action of ['submit', 'approve', 'activate'] as const) {
        const r = await transitionHypothesis(prisma, proposed.id, action, { now, actor: ACTOR });
        expect('2c hypotheses', r.ok, `${action} ${label} ${proposed.id} -> ${JSON.stringify(r)}`);
      }
      return proposed.id;
    };
    const h1 = await activate('H1', personaHappy.id, accountName, factsH1.f1.id, factsH1.f2.id);
    const h2 = await activate('H2', personaBlocked.id, blockedAccountName, factsH2.f1.id, factsH2.f2.id);
    const h4 = await activate('H4', personaDnc.id, accountName, factsH4.f1.id, factsH4.f2.id, [expiredSignal.id]);
    const h1Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { observation: true, signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    observationH1 = h1Row?.observation ?? '';
    realRefsH1 = evidenceRefsFromSignals((h1Row?.signals ?? []).map((l) => l.signal), now);

    // 2d. H3: internal-recipient control for B9.
    const h3Signal = await registerSignal(prisma, (fromOperatorKnowledge({ accountName, hubspotCompanyId, personaId: personaInternal.id, text: 'Internal QA probe: this hypothesis exists only to prove the learning report excludes it.', at: now, sourceId: `${tag}:h3fact1`, by: 'casey' }, { registeredBy: ACTOR, now }) as { ok: true; signal: Parameters<typeof registerSignal>[1] }).signal);
    const h3Proposed = await proposeHypothesis(prisma, { accountName, primaryPersonaId: personaInternal.id, persona: 'automation', problemFamily: 'automation_readiness', observation: `Internal QA probe at ${accountName} [S:${h3Signal.id}].`, problemHypothesis: 'My guess is this row must never reach a real learning metric.', rootCauseHypotheses: ['n/a'], impactHypotheses: ['n/a'], falsificationQuestions: ['n/a'], whatANoMeans: 'n/a', confidence: 50, signalIds: [h3Signal.id], primarySignalId: h3Signal.id, createdBy: ACTOR });
    expect('2d internal', h3Proposed.ok, `proposeHypothesis (H3) refused: ${JSON.stringify(h3Proposed)}`);
    if (!h3Proposed.ok) throw new Error('unreachable');
    for (const action of ['submit', 'approve', 'activate'] as const) {
      const r = await transitionHypothesis(prisma, h3Proposed.id, action, { now, actor: ACTOR });
      expect('2d internal', r.ok, `${action} H3 -> ${JSON.stringify(r)}`);
    }
    const h3 = h3Proposed.id;
    pass('2c/2d hypotheses', `H1 ${h1.slice(0, 8)}, H2 ${h2.slice(0, 8)} (blocked), H3 ${h3.slice(0, 8)} (internal), H4 ${h4.slice(0, 8)} (dnc target) all active`);

    // 3. One family/version (program for R-A), each hypothesis gets its OWN compile stack.
    const family = await createFamily(prisma, { name: `GAP RT ${seed.name} ${tag}`, engine: 'modex_draft_queue', program: PROGRAM, accountName, problemFamily: seed.problemFamily, persona: seed.persona, createdBy: ACTOR });
    expect('3 family', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyId = family.id;
    const version = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: `e2e-runtime ${SEED_KEY}` });
    expect('3 family', version.ok && version.version === 1, `createVersion -> ${JSON.stringify(version)}`);
    if (!version.ok) throw new Error('unreachable');
    const stepCount = seed.steps.steps.length;
    const contractFor = (observation: string, realRefs: ReturnType<typeof evidenceRefsFromSignals>, stepIndex: number) => ({ hypothesis: { ...fx.hypothesis, observation }, evidence: [...realRefs, ...fx.evidence], proofRefs: [], namedPipeline: seedEvidence.namedPipeline, claimsUsed: seed.steps.steps[stepIndex].claimsUsed, stepCount });
    const stepCopy = (observation: string, i: number) => renderStepCopy({ subject: seed.steps.steps[i].templates?.subjectTemplate ?? '', body: seed.steps.steps[i].templates?.bodyTemplate ?? '' }, { firstName: '{{first_name}}', account: '{{account}}', observation }).marked;
    const compileAll = async (label: string, hypothesisId: string, observation: string, realRefs: ReturnType<typeof evidenceRefsFromSignals>, createdAt?: Date): Promise<string[]> => {
      const ids: string[] = [];
      const priorBodies: string[] = [];
      for (let i = 0; i < stepCount; i += 1) {
        const copy = stepCopy(observation, i);
        const r: CompileResult = await compile({ hypothesisId, sequenceVersionId: version.id, stepIndex: i, subject: copy.subject, body: copy.body, priorBodies: [...priorBodies], contract: contractFor(observation, realRefs, i), createdBy: ACTOR }, { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma });
        expect('4 compile', r.verdict === 'pass' && !!r.id, `${label} step ${i} -> ${r.verdict} id ${r.id ?? 'none'} ${r.persistError ?? ''}`);
        if (createdAt && r.id) await prisma.gapCompile.update({ where: { id: r.id }, data: { created_at: createdAt } });
        ids.push(r.id as string);
        priorBodies.push(copy.body);
      }
      return ids;
    };
    const h1CompileIds = await compileAll('H1', h1, observationH1, realRefsH1);
    const h2Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { observation: true, signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    const observationH2 = h2Row?.observation ?? '';
    const realRefsH2 = evidenceRefsFromSignals((h2Row?.signals ?? []).map((l) => l.signal), now);
    const h2CompileIds = await compileAll('H2', h2, observationH2, realRefsH2);
    const h4Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h4 }, select: { observation: true, signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    const observationH4 = h4Row?.observation ?? '';
    const realRefsH4 = evidenceRefsFromSignals((h4Row?.signals ?? []).map((l) => l.signal), now);
    const h4CompileIds = await compileAll('H4', h4, observationH4, realRefsH4);
    // A ~40h-old compile stack for SF14's staleness proof, bound to H1 (a
    // second, independent compile generation; the newest per-step row is what verifyCompiles reads).
    const staleCompileIds = await compileAll('H1-stale', h1, observationH1, realRefsH1, new Date(now.getTime() - 40 * 60 * 60 * 1000));
    created.compileIds.push(...h1CompileIds, ...h2CompileIds, ...h4CompileIds, ...staleCompileIds);
    pass('4 compile', `H1 ${stepCount} steps pass (+1 stale generation for SF14), H2 ${stepCount} steps pass, H4 ${stepCount} steps pass; three independent hypothesis-bound compile stacks on one version`);

    // 4a. EXECUTION INTENT -> the full 6B gate chain, through legacyEnrollAdapter.
    const addOneSpy = { calls: 0, fn: async (input: Parameters<typeof addOne>[0], owner: string) => { addOneSpy.calls += 1; return addOne(input, owner); } };
    const baseDeps: EnrollDeps = { addOne: addOneSpy.fn, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear };
    const intentFor = (hypothesisId: string, personaId: number, compileIds: string[], mode: 'shadow' | 'live'): ExecutionIntent => ({
      engine: 'modex_queue', personaId, hypothesisId, sequenceVersionId: version.id, stepIndex: 0, compileIds, senderIdentity: OWNER, idempotencyKey: `${tag}-${hypothesisId}-${mode}`, actor: OWNER, actorKind: 'human', mode, now,
    });

    // Active opportunity (B6): the blocked account refuses through the SAME contract layer, no fake transport call.
    const blockedReceipt = await legacyEnrollAdapter(prisma, intentFor(h2, personaBlocked.id, h2CompileIds, 'live'), baseDeps);
    expect('4a active opportunity', blockedReceipt.status === 'refused' && blockedReceipt.refusalReason === 'active_opportunity', `blocked receipt -> ${JSON.stringify(blockedReceipt)}`);
    const blockedItems = await prisma.draftQueueItem.count({ where: { to_email: emails.blocked } });
    expect('4a active opportunity', blockedItems === 0 && addOneSpy.calls === 0, `${blockedItems} items / ${addOneSpy.calls} addOne calls for the blocked persona, expected 0/0 (refused before the queue write)`);
    pass('4a active opportunity', `ExecutionIntent for the mid-deal account refuses active_opportunity through legacyEnrollAdapter; no queue write, no fake transport call`);

    // Suppression wins, through the same contract layer.
    await prisma.persona.update({ where: { id: personaHappy.id }, data: { do_not_contact: true } });
    const suppressedReceipt = await legacyEnrollAdapter(prisma, intentFor(h1, personaHappy.id, h1CompileIds, 'shadow'), baseDeps);
    expect('4a suppression', suppressedReceipt.status === 'refused' && (suppressedReceipt.refusalReason ?? '').startsWith('suppressed'), `suppressed receipt -> ${JSON.stringify(suppressedReceipt)}`);
    await prisma.persona.update({ where: { id: personaHappy.id }, data: { do_not_contact: false } });
    pass('4a suppression', `a do_not_contact persona refuses suppressed through the same ExecutionIntent/legacyEnrollAdapter path`);

    // SF14: compile_stale, opted into via deps.maxCompileAgeMs, through the real gate chain.
    const staleReceipt = await legacyEnrollAdapter(prisma, intentFor(h1, personaHappy.id, staleCompileIds, 'live'), { ...baseDeps, maxCompileAgeMs: 60 * 60 * 1000 });
    expect('4b sf14 compile_stale', staleReceipt.status === 'refused' && staleReceipt.refusalReason === 'compile_stale:0', `stale receipt -> ${JSON.stringify(staleReceipt)}`);
    pass('4b sf14 compile_stale', `a ~40h-old compile refuses compile_stale:0 once maxCompileAgeMs is opted into, through legacyEnrollAdapter`);

    // SF14: evidence_expired, opted into via deps.checkEvidenceFreshness. H4
    // was activated with the expired signal already linked (created above,
    // before H1/H2/H4 were proposed -- see the N4 comment there).
    const evidenceReceipt = await legacyEnrollAdapter(prisma, intentFor(h4, personaDnc.id, h4CompileIds, 'live'), { ...baseDeps, checkEvidenceFreshness: true });
    expect('4b sf14 evidence_expired', evidenceReceipt.status === 'refused' && evidenceReceipt.refusalReason === 'evidence_expired', `evidence receipt -> ${JSON.stringify(evidenceReceipt)}`);
    pass('4b sf14 evidence_expired', `a hypothesis linked to a real expired signal refuses evidence_expired once checkEvidenceFreshness is opted into`);

    // The happy-path live enroll, through the full gate chain, no opt-ins: succeeds.
    const liveReceipt = await legacyEnrollAdapter(prisma, intentFor(h1, personaHappy.id, h1CompileIds, 'live'), baseDeps);
    expect('4c enroll', liveReceipt.status === 'queued' && liveReceipt.engine === 'modex_queue' && !!liveReceipt.engineId, `live receipt -> ${JSON.stringify(liveReceipt)}`);
    const itemId = Number(liveReceipt.engineId);
    const item = await prisma.draftQueueItem.findUnique({ where: { id: itemId } });
    const enrollmentId = item?.sequence_run_id as string;
    expect('4c enroll', !!item && item.sequence_version_id === version.id && item.status === 'draft', `item ${JSON.stringify(item)}`);
    const enrollmentRow = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId }, select: { status: true, is_test: true } });
    expect('4c enroll', enrollmentRow?.status === 'active' && enrollmentRow.is_test === false, `enrollment ${JSON.stringify(enrollmentRow)}`);
    pass('4c enroll', `ExecutionIntent for the happy path succeeds through the full 6B gate chain: receipt ${JSON.stringify(liveReceipt)}, enrollment ${enrollmentId} active`);

    // Same happy-path hypothesis/persona, a DIRECT SequenceEnrollment for the DNC step later (H4's own enroll, live).
    const dncReceipt = await legacyEnrollAdapter(prisma, intentFor(h4, personaDnc.id, h4CompileIds, 'live'), baseDeps);
    // (expiredSignal already made this refuse evidence_expired ONLY when opted in; without the opt-in it must succeed.)
    expect('4c enroll (dnc target)', dncReceipt.status === 'queued' && !!dncReceipt.engineId, `dnc-target receipt -> ${JSON.stringify(dncReceipt)}`);
    const dncItem = await prisma.draftQueueItem.findUnique({ where: { id: Number(dncReceipt.engineId) } });
    const dncEnrollmentId = dncItem?.sequence_run_id as string;
    counts.dncEnrollmentId = dncEnrollmentId;

    // 5. FAKE-TRANSPORT ADAPTERS (6C).
    // HubSpot sequence adapter: flag off means zero network calls, provably.
    const hsFetchOff = { calls: 0, fn: async (..._args: any[]) => { hsFetchOff.calls += 1; throw new Error('must never be called'); } };
    const hsOffReceipt = await hubspotSequenceAdapter(intentFor(h1, personaHappy.id, h1CompileIds, 'live'), { sequenceId: 'seq_1', contactId: 'contact_1', senderEmail: OWNER, userId: '85093129' }, { fetchImpl: hsFetchOff.fn as unknown as typeof fetch });
    expect('5a hubspot flag off', hsOffReceipt.status === 'refused' && hsOffReceipt.refusalReason === 'gap_hubspot_sequence_publish_disabled' && hsFetchOff.calls === 0, `hubspot flag-off receipt ${JSON.stringify(hsOffReceipt)}, fetch calls ${hsFetchOff.calls}`);
    // Flag on + a fake transport: proves the REAL adapter code path, zero real network.
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    const hsFake = async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ enrollmentId: `hs_enr_${tag}` }), { status: 200 });
    const hsOnReceipt = await hubspotSequenceAdapter(intentFor(h1, personaHappy.id, h1CompileIds, 'live'), { sequenceId: 'seq_1', contactId: 'contact_1', senderEmail: OWNER, userId: '85093129' }, { fetchImpl: hsFake as unknown as typeof fetch, accessToken: 'fake-token' });
    delete process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    expect('5a hubspot fake transport', hsOnReceipt.status === 'queued' && hsOnReceipt.engineId === `hs_enr_${tag}`, `hubspot fake-transport receipt ${JSON.stringify(hsOnReceipt)}`);
    pass('5a hubspot adapter', `flag off: zero network calls, provably; flag on with a fake transport: real adapter code runs end to end, engineId ${hsOnReceipt.engineId}, no real HTTP call possible`);

    // Gmail: gmail_draft is distinct from gmail_direct; draft lineage becomes
    // a sent receipt without confusing the draft id with the sent message id.
    let fakeFetchCalls = 0;
    const draftReceipt = await gmailDraftAdapter(
      intentFor(h1, personaHappy.id, [], 'live'),
      { to: emails.happy, subject: 'field guide', html: '<p>hi</p>' },
      { createGmailDraft: async () => { fakeFetchCalls += 1; return { provider: 'gmail', draftId: `draft_${tag}`, messageId: null, threadId: `thread_${tag}` }; } },
    );
    expect('5b gmail draft', draftReceipt.status === 'drafted' && draftReceipt.engine === 'gmail_draft' && draftReceipt.engineId === `draft_${tag}`, `draft receipt ${JSON.stringify(draftReceipt)}`);
    const sentReceipt = await sendDraftedGmailAdapter(
      intentFor(h1, personaHappy.id, [], 'live'),
      draftReceipt,
      { to: emails.happy },
      { sendGmailDraft: async () => { fakeFetchCalls += 1; return { provider: 'gmail', id: `sent_${tag}`, threadId: `thread_${tag}` }; } },
    );
    expect('5b gmail sent', sentReceipt.status === 'sent' && sentReceipt.engine === 'gmail_direct' && sentReceipt.engineId === `sent_${tag}` && sentReceipt.supersedesEngineId === `draft_${tag}` && sentReceipt.engineId !== draftReceipt.engineId, `sent receipt ${JSON.stringify(sentReceipt)}, draft receipt ${JSON.stringify(draftReceipt)}`);
    expect('5b gmail lineage', fakeFetchCalls === 2, `expected exactly 2 fake-transport calls (one draft, one send), got ${fakeFetchCalls}`);
    pass('5b gmail adapters', `gmail_draft (${draftReceipt.engineId}) is distinct from gmail_direct (${sentReceipt.engineId}); the sent receipt's supersedesEngineId names the draft, never collapsed into one event; both against a fake transport, zero real Gmail/OAuth calls`);

    // 6. RECONCILIATION (6D): the real happy-path enrollment, MATCHED then ALREADY_IMPORTED; a messy name; an unknown name.
    const reconcileDeps = {
      resolveIdentity: async (input: Parameters<typeof resolveIdentity>[1]) => resolveIdentity(await loadIdentityContext(prisma), input),
      findAlreadyImported: async (engine: string, engineEventId: string) => {
        const row = await prisma.conversationDisposition.findFirst({ where: { source_kind: `reconcile:${engine}`, source_id: engineEventId }, select: { enrollment_id: true, hypothesis_id: true } });
        return row?.enrollment_id ? { id: row.enrollment_id, hypothesis_id: row.hypothesis_id } : null;
      },
      findHypothesis: async (accName: string) => (await prisma.prospectingHypothesis.findFirst({ where: { account_name: accName }, select: { id: true } })) ?? null,
      findEnrollments: async (accName: string, contactEmail: string) => prisma.sequenceEnrollment.findMany({ where: { account_name: accName, to_email: contactEmail }, select: { id: true, hypothesis_id: true } }),
    };
    const evidence: EngineEvidence = { engine: 'modex_queue', rawAccountName: `${accountName}, LLC`, contactEmail: emails.happy, engineEventId: `${tag}-reconcile-evt`, occurredAt: now };
    const matched = await reconcileOne(evidence, reconcileDeps as any);
    expect('6 reconcile matched', matched.outcome === 'MATCHED' && matched.accountName === accountName && matched.enrollmentId === enrollmentId, `matched -> ${JSON.stringify(matched)}`);
    const disp = await prisma.conversationDisposition.create({ data: { hypothesis_id: h1, account_name: accountName, contact_email: emails.happy, enrollment_id: enrollmentId, source_kind: `reconcile:${evidence.engine}`, source_id: evidence.engineEventId, channel: 'email', response_class: 'timing', created_by: ACTOR } });
    const again = await reconcileOne(evidence, reconcileDeps as any);
    expect('6 reconcile already_imported', again.outcome === 'ALREADY_IMPORTED' && again.enrollmentId === enrollmentId, `already_imported -> ${JSON.stringify(again)}`);
    const unknownEvidence: EngineEvidence = { engine: 'modex_queue', rawAccountName: unknownName, contactEmail: 'nobody@example.com', engineEventId: `${tag}-reconcile-unknown`, occurredAt: now };
    const unresolved = await reconcileOne(unknownEvidence, reconcileDeps as any);
    expect('6 reconcile identity_unresolved', unresolved.outcome === 'IDENTITY_UNRESOLVED', `unresolved -> ${JSON.stringify(unresolved)}`);
    const unknownAccountCreated = await prisma.account.count({ where: { name: unknownName } });
    expect('6 reconcile identity_unresolved', unknownAccountCreated === 0, 'the reconciler must never create an Account');
    pass('6 reconcile', `MATCHED (messy raw name -> canonical account -> the real enrollment ${enrollmentId}), then ALREADY_IMPORTED on the same evidence, then IDENTITY_UNRESOLVED for an unknown company (no Account created)`);

    // 7. Reply -> AI suggestion -> human confirmation -> BID -> hypothesis resolution.
    const threadId = `${tag}-thread-1`;
    const msg1 = `${tag}-msg-1`;
    await prisma.emailThread.create({ data: { id: threadId, account_name: accountName, persona_email: emails.happy, subject: 'Re: gate clerks in Ohio', last_message_at: now } });
    created.threadIds.push(threadId);
    await prisma.inboundMessage.create({ data: { id: msg1, thread_id: threadId, from_email: emails.happy, from_name: 'Priya', subject: 'Re: gate clerks in Ohio', body_html: REPLY_HTML, body_text: null, snippet: null, received_at: now, source: 'gmail' } });
    created.inboundIds.push(msg1);
    const ingested = await ingestReply(prisma, { contactEmail: emails.happy.toUpperCase(), source: 'gmail', inboundMessageId: msg1, receivedAt: now, isAutoresponder: false, now });
    expect('7a ingest', ingested.action === 'paused' && ingested.enrollments.some((e) => e.id === enrollmentId), `ingestReply -> ${JSON.stringify(ingested)}`);
    const page = await listReplies(prisma, { state: 'undispositioned' });
    expect('7a ingest', page.items.some((i) => i.id === msg1 && i.suggestion === null), `listReplies undispositioned should contain ${msg1} with no suggestion yet`);

    const good = stubAi({ responseClass: 'problem_confirmed', bids: [{ type: 'business_problem', quote: QUOTE, why: 'names the gate problem in their words' }], why: 'agrees with the hypothesis' });
    const suggested = await suggestReply(prisma, good.ai, msg1, { now: () => now });
    expect('7b ai suggestion', suggested.ok && suggested.suggestion !== null && suggested.suggestion.responseClass === 'problem_confirmed', `suggestReply -> ${JSON.stringify(suggested)}`);
    if (!suggested.ok || !suggested.suggestion) throw new Error('unreachable');
    const aiRowId = suggested.suggestion.id;
    const aiRow = await prisma.conversationDisposition.findUnique({ where: { id: aiRowId }, select: { created_by: true, human_confirmed: true } });
    expect('7b ai suggestion', aiRow?.created_by === AI_ACTOR && aiRow.human_confirmed === false, `AI suggestion must be unconfirmed: ${JSON.stringify(aiRow)}`);
    expect('7b ai suggestion', dispositionEffects({ responseClass: 'problem_confirmed', humanConfirmed: false }).stopsRun === false, 'an unconfirmed AI suggestion must carry no effects (it is not buyer truth)');
    pass('7b ai suggestion', `unconfirmed AI suggestion ${aiRowId.slice(0, 8)} carries no effects; only a human session can turn it into truth`);

    const confirmedResult = await recordDisposition(prisma, {
      hypothesisId: h1, personaId: personaHappy.id, contactEmail: emails.happy, channel: 'email', responseClass: 'problem_confirmed',
      source: { kind: 'inbound_message', id: msg1 }, actor: OWNER, actorKind: 'human', now,
      buyerLanguage: REPLY_TEXT, rootCauseClass: 'No shared gate standard across the acquired sites',
      bids: [{ type: 'business_problem', rawBuyerLanguage: QUOTE }, { type: 'root_cause', rawBuyerLanguage: 'before a clerk sees the paperwork' }],
      aiSuggestionId: aiRowId,
    } satisfies RecordDispositionInput);
    expect('7c human confirm', confirmedResult.ok && confirmedResult.dispositionId === aiRowId && confirmedResult.humanConfirmed, `recordDisposition -> ${JSON.stringify(confirmedResult)}`);
    if (!confirmedResult.ok) throw new Error('unreachable');
    const confirmedRow = await prisma.conversationDisposition.findUnique({ where: { id: aiRowId }, select: { human_confirmed: true, confirmed_by: true, created_by: true } });
    expect('7c human confirm', confirmedRow?.human_confirmed === true && confirmedRow.confirmed_by === OWNER && confirmedRow.created_by === AI_ACTOR, `confirmed row ${JSON.stringify(confirmedRow)} -- the human confirms, the AI's original authorship is preserved`);
    const bidRows = await prisma.buyerInputData.findMany({ where: { id: { in: confirmedResult.bidIds } }, select: { human_confirmed: true, confirmed_by: true } });
    expect('7c human confirm', bidRows.length === 2 && bidRows.every((b) => b.human_confirmed && b.confirmed_by === OWNER), `BID rows ${JSON.stringify(bidRows)}`);
    // A confirmed human BID cannot be overwritten by agent state: correctBid requires a human actor; an agent attempt refuses.
    const agentCorrection = await correctBid(prisma, confirmedResult.bidIds[0], { rawBuyerLanguage: 'an agent tried to overwrite this', source: 'email', capturedBy: { id: 'cron:some-agent', kind: 'agent' } }, { now });
    expect('7c bid immutable to agents', !agentCorrection.ok && agentCorrection.reason === 'correction_requires_human', `agent BID correction -> ${JSON.stringify(agentCorrection)}, expected correction_requires_human`);
    const h1AfterConfirm = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true } });
    expect('7c human confirm', h1AfterConfirm?.status === 'confirmed', `H1 status ${h1AfterConfirm?.status}, expected confirmed`);
    const e1AfterConfirm = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId }, select: { status: true, stop_reason: true } });
    expect('7c human confirm', e1AfterConfirm?.status === 'stopped' && e1AfterConfirm.stop_reason === 'replied', `enrollment after confirm ${JSON.stringify(e1AfterConfirm)}`);
    pass('7c human confirm', `human confirmation turns the AI suggestion into buyer truth (BuyerInputData, hypothesis resolved confirmed, enrollment stopped replied); an agent cannot overwrite the confirmed BID (correction_requires_human)`);

    // 7d. DNC / stop effect, on the SEPARATE H4/persona enrollment.
    const dnc = await recordDisposition(prisma, { hypothesisId: h4, personaId: personaDnc.id, contactEmail: emails.dnc, channel: 'email', responseClass: 'do_not_contact', source: { kind: 'manual', id: `${tag}:dnc1` }, actor: OWNER, actorKind: 'human', now } satisfies RecordDispositionInput);
    expect('7d dnc', dnc.ok && dnc.effects !== 'none', `dnc disposition -> ${JSON.stringify(dnc)}`);
    if (!dnc.ok || dnc.effects === 'none') throw new Error('unreachable');
    const unsub = await prisma.unsubscribedEmail.findUnique({ where: { email: emails.dnc } });
    const personaDncRow = await prisma.persona.findUnique({ where: { id: personaDnc.id }, select: { do_not_contact: true } });
    const dncEnrollmentRow = await prisma.sequenceEnrollment.findUnique({ where: { id: dncEnrollmentId }, select: { status: true, stop_reason: true } });
    expect('7d dnc', !!unsub && personaDncRow?.do_not_contact === true && dncEnrollmentRow?.status === 'stopped' && dncEnrollmentRow.stop_reason === 'dnc', `dnc effects: unsub=${!!unsub} persona=${JSON.stringify(personaDncRow)} enrollment=${JSON.stringify(dncEnrollmentRow)}`);
    pass('7d dnc', `do_not_contact disposition unsubscribes ${emails.dnc}, flags the persona, and stops its enrollment (stop_reason=dnc)`);

    // 8. LEARNING (6E/6F) and R-B routing agreement.
    const runId = `${tag}-routing`;
    const agreeDecision = await prisma.routingDecision.create({ data: { run_id: runId, mode: 'shadow', account_name: accountName, persona_id: personaHappy.id, hypothesis_id: h1, action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'r17_enroll', priority: 0, explain: {}, inputs_snapshot: {} }, select: { id: true } });
    const disagreeDecision = await prisma.routingDecision.create({ data: { run_id: runId, mode: 'shadow', account_name: accountName, persona_id: personaHappy.id, hypothesis_id: h1, action: 'nurture', lane: 'work_queue', rule_id: 'r7_not_priority', priority: 5, explain: {}, inputs_snapshot: {} }, select: { id: true } });
    created.routingDecisionIds.push(agreeDecision.id, disagreeDecision.id);
    await recordHumanAction(prisma, agreeDecision.id, 'enrolled_by_hand', OWNER, { now: () => now });
    await recordHumanAction(prisma, disagreeDecision.id, 'called', OWNER, { now: () => now });
    const agreementReport = await loadAgreementReport(prisma, { runId });
    expect('8a agreement', agreementReport.overall.n === 2 && agreementReport.overall.agreements === 1 && agreementReport.overall.rate === 0.5, `agreement report ${JSON.stringify(agreementReport.overall)}`);
    pass('8a agreement', `routing-vs-human-action agreement over real RoutingDecision rows: 1 agreement, 1 disagreement, rate 0.5 (R-B)`);

    // H3 internal disposition, for B9.
    await recordDisposition(prisma, { hypothesisId: h3, personaId: personaInternal.id, contactEmail: emails.internal, channel: 'email', responseClass: 'problem_confirmed', buyerLanguage: 'Internal QA confirms the probe fired.', source: { kind: 'manual', id: `${tag}:internal1` }, actor: OWNER, actorKind: 'human', now } satisfies RecordDispositionInput);

    const reportAll = await buildLearningReport(prisma, { now });
    const h3InReport = reportAll.byProblemFamily.find((r) => r.key === 'automation_readiness');
    expect('8b learning b9', !h3InReport || h3InReport.funnel.resolutionRate.denominator === 0, `H3's internal disposition must never surface in a real learning metric: ${JSON.stringify(h3InReport?.funnel)}`);
    expect('8b learning byEngine', reportAll.byEngine.some((r) => r.key === 'modex_draft_queue'), `byEngine breakdown missing modex_draft_queue: ${JSON.stringify(reportAll.byEngine.map((r) => r.key))}`);
    expect('8b learning bySender', reportAll.bySender.some((r) => r.key === OWNER), `bySender breakdown missing ${OWNER}: ${JSON.stringify(reportAll.bySender.map((r) => r.key))}`);
    expect('8b learning n', reportAll.counts.hypotheses >= 1 && reportAll.funnel.resolutionRate.denominator >= 1, `every rate must carry n; counts ${JSON.stringify(reportAll.counts)}`);
    pass('8b learning', `internal/test traffic excluded (B9); byEngine and bySender breakdowns both present; every rate carries n (denominator ${reportAll.funnel.resolutionRate.denominator})`);

    const reportProgram = await buildLearningReport(prisma, { program: PROGRAM, now });
    const h1InProgram = reportProgram.byProblemFamily.find((r) => r.key === seed.problemFamily);
    expect('8c learning ra', !!h1InProgram && h1InProgram.funnel.resolutionRate.denominator >= 1, `program-filtered report should include H1's family; got ${JSON.stringify(reportProgram.byProblemFamily.map((r) => r.key))}`);
    const reportOtherProgram = await buildLearningReport(prisma, { program: `${PROGRAM}-does-not-exist`, now });
    const noMatch = reportOtherProgram.byProblemFamily.find((r) => r.key === seed.problemFamily && r.funnel.resolutionRate.denominator >= 1);
    expect('8c learning ra', !noMatch, `a nonexistent program should return nothing for H1's family`);
    const reportPastWindow = await buildLearningReport(prisma, { program: PROGRAM, from: new Date(now.getTime() + 24 * 60 * 60 * 1000), now });
    const h1PastWindow = reportPastWindow.byProblemFamily.find((r) => r.key === seed.problemFamily && r.funnel.resolutionRate.denominator >= 1);
    expect('8c learning ra', !h1PastWindow, `a date window after this run should exclude H1's confirmed conversation`);
    pass('8c learning ra', `campaign/program filtering and date filtering both work: program ${PROGRAM} includes H1, a nonexistent program excludes it, a future date window excludes it`);
    counts.replyBacklogCount = reportAll.replyBacklog.count;
    counts.staleHypothesesN = reportAll.staleHypotheses.n;

    // 9. SPRINT 7: canary caps, gate evaluation, shadow decision, kill-switch drill.
    const canaryConfig: CanaryConfig = { allowlist: [accountName], perRuleCap: 3, dailyCap: 5, startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    const canaryState: CanaryDayState = { countByRule: {}, totalToday: 0 };
    const canaryOk = checkCanaryCaps(canaryConfig, canaryState, { accountName, ruleId: 'enroll', now });
    const canaryRefused = checkCanaryCaps(canaryConfig, canaryState, { accountName: blockedAccountName, ruleId: 'enroll', now });
    expect('9a canary', canaryOk.ok === true && canaryRefused.ok === false && !canaryRefused.ok && canaryRefused.reason === 'account_not_on_allowlist', `canary checks ${JSON.stringify({ canaryOk, canaryRefused })}`);
    pass('9a canary', `checkCanaryCaps allows the allowlisted account and fails closed for one not on it`);

    const gateInputs: GateInputs = {
      shadowAgreementRate: agreementReport.overall.rate, shadowDecisionCount: agreementReport.overall.n, shadowWeeksOfData: 0,
      compilerRejectViolations: 0, compilerAuditSampleSize: h1CompileIds.length + h2CompileIds.length + h4CompileIds.length,
      suppressionUnknownVerdicts7d: 0, suppressionDncViolationsEver: 0,
      replyClassificationAgreementRate: 1, replyClassificationSampleSize: 1,
      hypothesisResolutionRate: reportAll.funnel.resolutionRate.value, hypothesisSampleSize: reportAll.funnel.resolutionRate.denominator,
      canaryAllowlistSize: canaryConfig.allowlist.length, canaryPerRuleCap: canaryConfig.perRuleCap, canaryDailyCap: canaryConfig.dailyCap, canaryWeeksRun: 0, canaryIncidents: 0, killSwitchDrillLogged: false,
      autonomyHaltReversed: false,
    };
    const gateResults = evaluateGates(gateInputs);
    expect('9b gates', gateResults.length === 7 && !allGatesEarned(gateResults), `gate results over REAL, tiny n must not report earned: ${JSON.stringify(gateResults)}`);
    expect('9b gates', gateResults.find((r) => r.gate === 'G0')?.passed === false, `G0 must report unmet (the real halt is untouched)`);
    pass('9b gates', `evaluateGates over real numbers from this run correctly reports NOT earned (n is far below every threshold, as it honestly should be for one e2e run); G0 (owner halt reversal) reports unmet, matching the real, untouched autonomy halt`);

    process.env.GAP_AUTO_ENROLL_SHADOW = 'true';
    const shadowAuditSpy = { calls: 0 };
    const shadowResult = await recordShadowDecision(prisma, { accountName, ruleId: 'enroll', personaId: personaHappy.id, hypothesisId: h1, wouldEngine: 'hubspot_sequence', now }, { audit: async (p: any, i: any) => { shadowAuditSpy.calls += 1; return audit(p, i); } });
    delete process.env.GAP_AUTO_ENROLL_SHADOW;
    expect('9c shadow decision', shadowResult.recorded && shadowAuditSpy.calls === 1, `shadow decision -> ${JSON.stringify(shadowResult)}, audit calls ${shadowAuditSpy.calls}`);
    const shadowAuditRow = await prisma.gapAuditEvent.findFirst({ where: { kind: 'enroll.shadow', subject_id: h1, created_at: { gte: runStart } }, orderBy: { created_at: 'desc' }, select: { payload: true } });
    const shadowPayload = isObj(shadowAuditRow?.payload) ? shadowAuditRow!.payload : {};
    expect('9c shadow decision', shadowPayload.acted_by_system_at === null, `shadow audit payload ${JSON.stringify(shadowPayload)}, expected acted_by_system_at: null`);
    pass('9c shadow decision', `recordShadowDecision writes one enroll.shadow audit row with acted_by_system_at explicitly null; GAP_AUTO_ENROLL_SHADOW restored to off after`);

    // Kill-switch drill, reusing this run's own real compile stack (H1, fresh generation).
    const drillDeps = { addOne: addOneSpy.fn, suppression: suppressionClear };
    const notHaltedResult = await enrollFromDecision(prisma, { hypothesisId: h1, personaId: personaHappy.id, sequenceVersionId: version.id, compileIds: h1CompileIds, actor: OWNER, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: OWNER }, { ...drillDeps, autonomy: async () => ({ halted: false }) });
    const haltedResult = await enrollFromDecision(prisma, { hypothesisId: h1, personaId: personaHappy.id, sequenceVersionId: version.id, compileIds: h1CompileIds, actor: OWNER, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: OWNER }, { ...drillDeps, autonomy: async () => ({ halted: true, reason: 'drill' }) });
    expect('9d kill-switch drill', haltedResult.reason === 'autonomy_halted', `halted result -> ${JSON.stringify(haltedResult)}`);
    expect('9d kill-switch drill', notHaltedResult.reason !== 'autonomy_halted', `not-halted result -> ${JSON.stringify(notHaltedResult)} must not refuse on the autonomy step itself`);
    await audit(prisma, { kind: 'automation.kill_switch_drill', actor: 'kill-switch-drill', subjectType: 'automation_drill', subjectId: tag, payload: { ranAt: now.toISOString(), notHaltedRefused: notHaltedResult.reason === 'autonomy_halted', haltedRefused: haltedResult.reason === 'autonomy_halted' } });
    pass('9d kill-switch drill', `the real clawd autonomy halt is never touched; an injected fake reader proves the guard reads fresh on every call: not-halted does not refuse on the autonomy step, halted refuses autonomy_halted immediately`);

    // 10. Zero real outbound action: every credential absent throughout, confirmed one more time.
    for (const name of SCRUBBED_ENV) expect('10 zero outbound', process.env[name] === undefined, `${name} reappeared during the run`);
    pass('10 zero outbound', 'every credential absent throughout; every network-adjacent call in this run went through a fake transport or a stub; no real send, enrollment, or write to HubSpot/Gmail/production ever happened');

    counts.h1 = h1;
    counts.h2 = h2;
    counts.h3 = h3;
    counts.h4 = h4;
    counts.familyId = family.id;
    counts.versionId = version.id;
    counts.enrollmentId = enrollmentId;
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
    if (process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED !== undefined) delete process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    if (process.env.GAP_AUTO_ENROLL_SHADOW !== undefined) delete process.env.GAP_AUTO_ENROLL_SHADOW;
    if (process.env.GAP_OS_ENABLED === undefined) process.env.GAP_OS_ENABLED = 'true';
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
        console.error(`cleanup FAILED: ${errorText(err).slice(0, 500)}`);
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
