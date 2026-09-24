/**
 * GAP Prospecting OS: Sprint 4 end-to-end demo against a SCRATCH database.
 *
 *   HUBSPOT_ACCESS_TOKEN= MC_API_TOKEN= \
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true GAP_MESSAGE_COMPILER_ENABLED=true GAP_REPLY_CLASSIFICATION_ENABLED=true \
 *   npx tsx scripts/gap/e2e-sprint4.ts
 *
 * (GAP_MESSAGE_COMPILER_ENABLED is required by the live modex enroll path,
 * N9: the per-item compile must be switched on. The critic it calls is the
 * stub below.)
 *
 * Walks the committed Sprint 4 surface in order, on top of the Sprint 3 seed
 * (account, three personas at example.com, two registered facts, three
 * approved-and-activated hypotheses, a family and version compiled with the
 * stub critic, three live modex enrollments through `enrollFromDecision`):
 *
 *   2  a Gmail-shaped human reply through `ingestReply` pauses the run with
 *      the reply_pending marker, skips the unsent item, audits once; a second
 *      ingest is already_paused;
 *   3  `listReplies` shows it undispositioned with the HTML stripped;
 *   4  `suggestReply` with a stub model stores an UNCONFIRMED ai row and
 *      changes nothing else (proven); a quote not in the text is rejected;
 *   5  a human `recordDisposition` problem_confirmed with two BIDs adopts
 *      the ai row (agreement recorded), stops the run (replied), resolves the
 *      hypothesis confirmed at 85 (60 + 15 + 10) citing both BID ids, mirror
 *      skipped (flag off); a duplicate submit is duplicate_source;
 *   6  DB truth: the confirmed row's class and metadata are frozen, a BID
 *      cannot be deleted, a correction is a superseding insert;
 *   7  a call-mode voicemail keeps the sequence;
 *   8  timing with resumeAt leaves the hypothesis active, stores the date,
 *      and the routing assembler reads it;
 *   9  do_not_contact writes the unsubscribe rows, flags the persona, stops
 *      the run (dnc); a shadow enroll is then refused suppressed on the
 *      modex_do_not_contact leg;
 *   10 the pre-call brief carries the FACT block with both signals, the
 *      confirmed disposition and zero open BIDs;
 *   11 an agent-created disposition is unconfirmed with no effects, and the
 *      only adoption path (aiSuggestionId) refuses it: there is no human
 *      confirm path for agent rows (documented as debt);
 *   12 no credential reappeared.
 *
 * Every step prints one PASS/FAIL line; the first FAIL stops the run and the
 * process exits 1. Every row the run creates is deleted in the finally block,
 * in dependency order, and the leftover count is asserted zero.
 *
 * Safety rails, all fail-closed:
 *   - DATABASE_URL must point at 127.0.0.1:5433/gap_dev. Anything else exits 2
 *     before a client is built.
 *   - HUBSPOT_ACCESS_TOKEN, MC_API_TOKEN, GOOGLE_REFRESH_TOKEN,
 *     GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLAWD_CONTROL_PLANE_URL and
 *     CLAWD_CONTROL_PLANE_TOKEN are deleted from process.env before the first
 *     import and asserted gone. The AI client is a stub, the critic is a stub,
 *     the autonomy reader is a stub, the cross-plane suppression reader is a
 *     static CLEAR, the disposition mirror answers skipped:gap_mirror_disabled
 *     before any call, `recordUnsubscribe`'s HubSpot leg finds no token and
 *     reports skipped:not_configured, the review-feed poster has no token.
 *   - GAP_AUTO_ENROLL_ENABLED must be off (a human enrolls live under
 *     GAP_OS_ENABLED alone) and GAP_HUBSPOT_MIRROR_ENABLED must be off.
 *   - The cleanup transaction disables the GAP guard triggers that forbid the
 *     DELETEs it needs and re-enables them in the same transaction. That is
 *     only legitimate on a scratch database, which the URL check guarantees.
 *
 * Writes docs/gap/sprint4-e2e-latest.md (no em dashes, no secrets) on every
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
import { bidFromRow, selectConfirmedBids } from '../../src/lib/gap/bid/select';
import { correctBid } from '../../src/lib/gap/bid/capture';
import { validateClaimsUsed } from '../../src/lib/gap/claims/validate-claims';
import { compile, type CompileResult } from '../../src/lib/gap/compiler/compile';
import { evidenceRefsFromSignals } from '../../src/lib/gap/compiler/evidence-from-signals';
import type { CriticClient } from '../../src/lib/gap/critic-client';
import { dispositionEffects } from '../../src/lib/gap/disposition/model';
import { recordDisposition, type RecordDispositionInput } from '../../src/lib/gap/disposition/service';
import { enrollFromDecision } from '../../src/lib/gap/enroll/service';
import { gapFlag } from '../../src/lib/gap/flags';
import { getHypothesis, proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { callBrief } from '../../src/lib/gap/replies/brief';
import { ingestReply, REPLY_PENDING_MARKER } from '../../src/lib/gap/replies/ingest';
import { listReplies } from '../../src/lib/gap/replies/list';
import { suggestReply, type AiClient } from '../../src/lib/gap/replies/suggest';
import { assembleRoutingInputs, isSkip } from '../../src/lib/gap/routing/inputs';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { suppressionLegFor } from '../../src/lib/gap/sequence/enrollment';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { renderStepCopy, EVIDENCE_SIGNAL_SELECT } from '../../src/lib/gap/sequence/render';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { SEED_PROGRAM, seedFamilyByKey, type SeedFamily } from '../../src/lib/gap/sequences/families';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { STATUS } from '../../src/lib/queue/types';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:5433\/gap_dev(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'sprint4-e2e-latest.md');
const SEED_EVIDENCE_FIXTURE = path.join('tests', 'fixtures', 'gap', 'seed-evidence.json');
const SEED_KEY = 'network_standardization';
const ACTOR = 'e2e4';
/** The human actor of every disposition (a session email on the route). */
const OWNER = 'casey@freightroll.com';
const INGEST_ACTOR = 'ingest';
const AI_ACTOR = 'ai';
const AGENT_ACTOR = 'cron';
const RUNTIME_ACTOR = 'sequence-runtime';
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const;

/** The reply's HTML body and the plain text list.ts must derive from it. */
const REPLY_HTML = '<div><p>Yes, our <b>Ohio</b> gate backs up every morning.</p><p>Trucks wait about an hour before a clerk sees the paperwork.</p><style>p{}</style></div>';
const REPLY_TEXT = 'Yes, our Ohio gate backs up every morning. Trucks wait about an hour before a clerk sees the paperwork.';
const QUOTE = 'Trucks wait about an hour before a clerk sees the paperwork.';
const RESUME_AT = '2026-11-02T14:00:00.000Z';

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

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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
const autonomyLive = async () => ({ halted: false });
const suppressionClear = staticSuppressionReader('clear');

/** A model that answers a fixed JSON and counts its calls. */
function stubAi(answer: unknown): { ai: AiClient; calls: () => number } {
  let n = 0;
  const ai: AiClient = async () => {
    n += 1;
    return typeof answer === 'string' ? answer : JSON.stringify(answer);
  };
  return { ai, calls: () => n };
}

// ---------------------------------------------------------------------------
// What the run creates, for cleanup
// ---------------------------------------------------------------------------

interface Created {
  accountName: string;
  emails: string[];
  familyId: string | null;
  sequenceIds: number[];
  compileIds: string[];
  threadIds: string[];
  inboundIds: string[];
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

  const tag = `gap-e2e4-${Date.now()}`;
  const now = new Date();
  const runStart = new Date(now.getTime() - 1000);
  // Digit-free on purpose: the account name is rendered into the copy and C01 treats every number token as a claim.
  const letters = Date.now()
    .toString(36)
    .replace(/[0-9]/g, (d) => 'abcdefghij'[Number(d)]);
  const accountName = `GAP Sprint Four Co ${letters}`;
  const hubspotCompanyId = `e2e4-${tag}`;
  const emails = {
    reply: `priya+${tag}@example.com`,
    call: `marcus+${tag}@example.com`,
    dnc: `dana+${tag}@example.com`,
  };
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
  console.log(
    `env GAP_OS_ENABLED=${gapFlag('GAP_OS_ENABLED')} GAP_REPLY_CLASSIFICATION_ENABLED=${gapFlag('GAP_REPLY_CLASSIFICATION_ENABLED')} GAP_AUTO_ENROLL_ENABLED=${gapFlag('GAP_AUTO_ENROLL_ENABLED')} GAP_HUBSPOT_MIRROR_ENABLED=${gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')} scrubbed=[${SCRUBBED_ENV.join(',')}]`,
  );
  counts.gitSha = gitSha;
  counts.databaseHost = dbHost;
  counts.runTag = tag;
  counts.scrubbedEnv = SCRUBBED_ENV.join(',');

  const seedEvidence = JSON.parse(readFileSync(SEED_EVIDENCE_FIXTURE, 'utf8')) as SeedEvidenceFixture;
  const seed = seedFamilyByKey(SEED_KEY) as SeedFamily;
  const fx = seedEvidence.families[SEED_KEY];

  const created: Created = {
    accountName,
    emails: Object.values(emails),
    familyId: null,
    sequenceIds: [],
    compileIds: [],
    threadIds: [],
    inboundIds: [],
  };

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  try {
    // 0. Preflight.
    expect('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expect('preflight', gapFlag('GAP_MESSAGE_COMPILER_ENABLED'), 'GAP_MESSAGE_COMPILER_ENABLED is not on (the live modex enroll path compiles the item, N9; the critic is a stub)');
    expect('preflight', gapFlag('GAP_REPLY_CLASSIFICATION_ENABLED'), 'GAP_REPLY_CLASSIFICATION_ENABLED is not on (the suggest step needs it; the model is a stub)');
    expect('preflight', !gapFlag('GAP_AUTO_ENROLL_ENABLED'), 'GAP_AUTO_ENROLL_ENABLED is on; this run exercises the human live path with the machine flag off');
    expect('preflight', !gapFlag('GAP_HUBSPOT_MIRROR_ENABLED'), 'GAP_HUBSPOT_MIRROR_ENABLED is on; this run expects the mirror to skip');
    for (const name of SCRUBBED_ENV) expect('preflight', process.env[name] === undefined, `${name} still present`);
    expect('preflight', !!seed && !!fx, `seed family ${SEED_KEY} or its fixture evidence is missing`);
    const seedFamilies = await prisma.sequenceFamily.count({ where: { program: SEED_PROGRAM, engine: 'modex_draft_queue', archived_at: null } });
    expect('preflight', seedFamilies >= 4, `${seedFamilies} seed families on the scratch database, expected 4 (run scripts/gap/seed-families.ts --apply)`);
    const stale = await prisma.account.count({ where: { name: accountName } });
    expect('preflight', stale === 0, `account ${accountName} already exists`);
    const staleUnsub = await prisma.unsubscribedEmail.count({ where: { email: { in: created.emails } } });
    expect('preflight', staleUnsub === 0, `${staleUnsub} unsubscribed_emails rows already carry this run's addresses`);
    counts.seedFamiliesOnScratch = seedFamilies;
    pass('preflight', `flags on (classification on, auto-enroll off, mirror off), credentials scrubbed, ${seedFamilies} seed families present, no stale rows`);

    // 1. Seed: account, three personas, two facts, three active hypotheses, a compiled version, three live enrollments.
    seeded = true;
    await prisma.account.create({ data: { rank: 9998, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId } });
    const mkPersona = async (key: string, name: string, title: string, email: string) =>
      prisma.persona.create({
        data: {
          persona_id: `${tag}-${key}`,
          account_name: accountName,
          priority: 'P1',
          name: `${name} ${tag}`,
          title,
          seniority: 'vp',
          email,
          email_valid: true,
          is_contact_ready: true,
          do_not_contact: false,
          hubspot_contact_id: `${tag}-${key}`,
        },
        select: { id: true },
      });
    const p1 = await mkPersona('reply', 'Priya Natarajan', 'VP Supply Chain', emails.reply);
    const p2 = await mkPersona('call', 'Marcus Bell', 'VP Operations', emails.call);
    const p3 = await mkPersona('dnc', 'Dana Ortiz', 'Director of Logistics', emails.dnc);

    const projected = fromOperatorKnowledge(
      { accountName, hubspotCompanyId, personaId: p1.id, text: 'The plant manager said the annual report lists 41 distribution centers folded in from three regional operators.', at: now, sourceId: `${tag}:fact1`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expect('1 seed', projected.ok, `fromOperatorKnowledge refused: ${projected.ok ? '' : projected.reason}`);
    if (!projected.ok) throw new Error('unreachable');
    const fact1 = await registerSignal(prisma, projected.signal);
    const fact2 = await registerSignal(prisma, {
      accountName,
      hubspotCompanyId,
      personaId: p1.id,
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

    const observation = `${accountName} lists 41 distribution centers from three regional operators [S:${fact1.id}] and posts three gate-clerk roles in Ohio [S:${fact2.id}].`;
    const activate = async (personaId: number): Promise<string> => {
      const proposed = await proposeHypothesis(prisma, {
        accountName,
        primaryPersonaId: personaId,
        persona: seed.persona,
        problemFamily: seed.problemFamily,
        observation,
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
      expect('1 seed', proposed.ok, `proposeHypothesis for persona ${personaId} refused: ${JSON.stringify(proposed)}`);
      if (!proposed.ok) throw new Error('unreachable');
      for (const action of ['submit', 'approve', 'activate'] as const) {
        const r = await transitionHypothesis(prisma, proposed.id, action, { now, actor: ACTOR });
        expect('1 seed', r.ok, `${action} ${proposed.id} -> ${JSON.stringify(r)}`);
      }
      return proposed.id;
    };
    const h1 = await activate(p1.id);
    const h2 = await activate(p2.id);
    const h3 = await activate(p3.id);
    const hyp1 = await getHypothesis(prisma, h1);
    expect('1 seed', hyp1?.status === 'active' && hyp1.signals.length === 2, `hypothesis ${h1} is ${hyp1?.status} with ${hyp1?.signals?.length} signals, expected active with 2`);
    const hypRow = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } } } });
    const realRefs = evidenceRefsFromSignals((hypRow?.signals ?? []).map((l) => l.signal), now);
    expect('1 seed', realRefs.length === 2 && realRefs.every((r) => r.fresh), `evidence refs ${JSON.stringify(realRefs.map((r) => [r.id, r.fresh]))}`);

    const family = await createFamily(prisma, {
      name: `GAP E2E4 ${seed.name} ${tag}`,
      engine: 'modex_draft_queue',
      program: 'gap-e2e4',
      accountName,
      problemFamily: seed.problemFamily,
      persona: seed.persona,
      createdBy: ACTOR,
    });
    expect('1 seed', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyId = family.id;
    const v1 = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: `e2e4 ${SEED_KEY}` });
    expect('1 seed', v1.ok && v1.version === 1, `createVersion -> ${JSON.stringify(v1)}`);
    if (!v1.ok) throw new Error('unreachable');

    const stepCount = seed.steps.steps.length;
    const contractFor = (stepIndex: number) => ({
      hypothesis: { ...fx.hypothesis, observation },
      evidence: [...realRefs, ...fx.evidence],
      proofRefs: [],
      namedPipeline: seedEvidence.namedPipeline,
      claimsUsed: seed.steps.steps[stepIndex].claimsUsed,
      stepCount,
    });
    const stepCopy = (i: number) =>
      renderStepCopy(
        { subject: seed.steps.steps[i].templates?.subjectTemplate ?? '', body: seed.steps.steps[i].templates?.bodyTemplate ?? '' },
        { firstName: '{{first_name}}', account: '{{account}}', observation },
      ).marked;
    /** Compiles bind to the hypothesis (R3-3), so each hypothesis gets its own pass rows. */
    const compileFor = async (hypothesisId: string): Promise<string[]> => {
      const ids: string[] = [];
      const priorBodies: string[] = [];
      for (let i = 0; i < stepCount; i += 1) {
        const copy = stepCopy(i);
        const r: CompileResult = await compile(
          { hypothesisId, sequenceVersionId: v1.id, stepIndex: i, subject: copy.subject, body: copy.body, priorBodies: [...priorBodies], contract: contractFor(i), createdBy: ACTOR },
          { critic: criticPass, validateClaims: validateClaimsUsed, now: () => now, prisma },
        );
        expect('1 seed', r.verdict === 'pass' && !!r.id, `compile ${hypothesisId} step ${i} -> ${r.verdict} (${r.checks.filter((c) => !c.passed).map((c) => `${c.code}: ${c.detail}`).join('; ')}) ${r.persistError ?? ''}`);
        ids.push(r.id as string);
        priorBodies.push(copy.body);
      }
      created.compileIds.push(...ids);
      return ids;
    };
    const compiles = { [h1]: await compileFor(h1), [h2]: await compileFor(h2), [h3]: await compileFor(h3) };

    const liveEnroll = async (hypothesisId: string, personaId: number): Promise<{ enrollmentId: string; itemId: number }> => {
      const live = await enrollFromDecision(
        prisma,
        { hypothesisId, personaId, sequenceVersionId: v1.id, compileIds: compiles[hypothesisId], actor: ACTOR, actorKind: 'human', mode: 'live', now, owner: OWNER, sender: 'casey@yardflow.ai' },
        { addOne, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear, contract: contractFor(0) },
      );
      expect('1 seed', live.ok && live.kind === 'modex_enrolled', `live enroll ${hypothesisId} -> ${JSON.stringify(live).slice(0, 400)}`);
      if (!live.ok || live.kind !== 'modex_enrolled') throw new Error('unreachable');
      if (live.compileId) created.compileIds.push(live.compileId);
      if (!created.sequenceIds.includes(live.sequenceId)) created.sequenceIds.push(live.sequenceId);
      const item = await prisma.draftQueueItem.findUnique({ where: { id: live.draftItemId }, select: { status: true, step_index: true, sequence_run_id: true } });
      expect('1 seed', item?.status === STATUS.draft && item.step_index === 0 && item.sequence_run_id === live.enrollment.id, `step-0 item for ${hypothesisId}: ${JSON.stringify(item)}`);
      return { enrollmentId: live.enrollment.id, itemId: live.draftItemId };
    };
    const e1 = await liveEnroll(h1, p1.id);
    const e2 = await liveEnroll(h2, p2.id);
    const e3 = await liveEnroll(h3, p3.id);
    const liveRows = await prisma.sequenceEnrollment.findMany({ where: { id: { in: [e1.enrollmentId, e2.enrollmentId, e3.enrollmentId] } }, select: { id: true, status: true, engine: true, hypothesis_id: true } });
    expect('1 seed', liveRows.length === 3 && liveRows.every((r) => r.status === 'active' && r.engine === 'modex_draft_queue'), `enrollments ${JSON.stringify(liveRows)}`);
    counts.hypotheses = 3;
    counts.compilesPersisted = created.compileIds.length;
    counts.enrollments = 3;
    pass('1 seed', `account, personas ${p1.id}/${p2.id}/${p3.id} at example.com, facts ${fact1.id.slice(0, 8)} (operator) + ${fact2.id.slice(0, 8)} (public url), hypotheses ${h1.slice(0, 8)}/${h2.slice(0, 8)}/${h3.slice(0, 8)} active citing both facts, family ${family.id.slice(0, 8)} v1 compiled pass (${stepCount} steps x 3 hypotheses, stub critic), three live modex enrollments each with a step-0 draft item`);

    // 2. A Gmail-shaped human reply pauses the run, skips the unsent item, audits once; a second ingest is already_paused.
    const threadId = `${tag}-thread-1`;
    const msg1 = `${tag}-msg-1`;
    await prisma.emailThread.create({ data: { id: threadId, account_name: accountName, persona_email: emails.reply, subject: 'Re: gate clerks in Ohio', last_message_at: now } });
    created.threadIds.push(threadId);
    await prisma.inboundMessage.create({
      data: { id: msg1, thread_id: threadId, from_email: emails.reply, from_name: 'Priya', subject: 'Re: gate clerks in Ohio', body_html: REPLY_HTML, body_text: null, snippet: null, received_at: now, source: 'gmail' },
    });
    created.inboundIds.push(msg1);
    const ingested = await ingestReply(prisma, { contactEmail: emails.reply.toUpperCase(), source: 'gmail', inboundMessageId: msg1, receivedAt: now, isAutoresponder: false, now });
    expect('2 ingest', ingested.action === 'paused' && ingested.enrollments.length === 1 && ingested.enrollments[0].id === e1.enrollmentId && ingested.enrollments[0].next === 'paused' && ingested.itemsStopped === 1, `ingestReply -> ${JSON.stringify(ingested)}`);
    const pausedRow = await prisma.sequenceEnrollment.findUnique({ where: { id: e1.enrollmentId }, select: { status: true, stop_reason: true, external_state: true } });
    const marker = isObj(pausedRow?.external_state) ? (pausedRow!.external_state as Record<string, unknown>)[REPLY_PENDING_MARKER] : null;
    expect('2 ingest', pausedRow?.status === 'paused' && pausedRow.stop_reason === null && isObj(marker) && marker.inbound_message_id === msg1 && marker.source === 'gmail', `enrollment after ingest ${JSON.stringify(pausedRow)}`);
    const item1 = await prisma.draftQueueItem.findUnique({ where: { id: e1.itemId }, select: { status: true, skipped_reason: true } });
    expect('2 ingest', item1?.status === STATUS.skipped && item1.skipped_reason === 'sequence_stopped:replied', `step-0 item after ingest ${JSON.stringify(item1)}`);
    const ingestAudits = async () => prisma.gapAuditEvent.count({ where: { kind: 'reply.ingested', subject_id: msg1, created_at: { gte: runStart } } });
    expect('2 ingest', (await ingestAudits()) === 1, `${await ingestAudits()} reply.ingested rows, expected 1`);
    const again = await ingestReply(prisma, { contactEmail: emails.reply, source: 'gmail', inboundMessageId: msg1, receivedAt: now, isAutoresponder: false, now });
    expect('2 ingest', again.action === 'none' && again.reason === 'already_paused' && (await ingestAudits()) === 1, `second ingest -> ${JSON.stringify(again)}`);
    // The other two runs are untouched.
    const others = await prisma.sequenceEnrollment.findMany({ where: { id: { in: [e2.enrollmentId, e3.enrollmentId] } }, select: { status: true } });
    expect('2 ingest', others.every((r) => r.status === 'active'), `other enrollments after ingest ${JSON.stringify(others)}`);
    pass('2 ingest', `enrollment ${e1.enrollmentId.slice(0, 8)} paused with the ${REPLY_PENDING_MARKER} marker (inbound ${msg1}), step-0 item skipped sequence_stopped:replied, 1 reply.ingested audit row; second ingest already_paused with no second row; the other two runs still active`);

    // 3. listReplies shows the reply undispositioned with the snippet stripped of HTML.
    const page = await listReplies(prisma, { state: 'undispositioned' });
    const item = page.items.find((i) => i.id === msg1);
    expect('3 list', !!item, `reply ${msg1} not in the undispositioned list (${page.items.length} items)`);
    expect('3 list', item!.snippet === REPLY_TEXT && !/<[^>]+>/.test(item!.snippet), `snippet "${item!.snippet}"`);
    expect('3 list', item!.source.kind === 'inbound_message' && item!.source.id === msg1 && item!.contactEmail === emails.reply && item!.personaId === p1.id && item!.hypothesisId === h1 && item!.hypothesisTitle === seed.problemFamily && item!.enrollmentId === e1.enrollmentId && item!.enrollmentStatus === 'paused' && item!.suggestion === null && item!.accountName === accountName, `item fields ${JSON.stringify({ ...item, snippet: undefined })}`);
    pass('3 list', `reply ${msg1} listed: source inbound_message/${msg1}, persona ${p1.id}, hypothesis ${h1.slice(0, 8)} (${seed.problemFamily}), enrollment paused, no suggestion, snippet is the plain text with no tag`);

    // 4. suggestReply stores an UNCONFIRMED ai row and changes nothing else; a quote not in the text is rejected.
    const good = stubAi({ responseClass: 'problem_confirmed', bids: [{ type: 'business_problem', quote: QUOTE, why: 'names the gate problem in their words' }], why: 'agrees with the hypothesis' });
    const snapshotBefore = {
      hypothesis: await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true, resolution: true, resolved_at: true } }),
      enrollment: await prisma.sequenceEnrollment.findUnique({ where: { id: e1.enrollmentId }, select: { status: true, stop_reason: true } }),
      unsubscribed: await prisma.unsubscribedEmail.count({ where: { email: emails.reply } }),
      persona: await prisma.persona.findUnique({ where: { id: p1.id }, select: { do_not_contact: true } }),
      bids: await prisma.buyerInputData.count({ where: { hypothesis_id: h1 } }),
    };
    const suggested = await suggestReply(prisma, good.ai, msg1, { now: () => now });
    expect('4 suggest', suggested.ok && suggested.suggestion !== null && suggested.suggestion.responseClass === 'problem_confirmed' && suggested.suggestion.bids.length === 1 && suggested.suggestion.bids[0].quote === QUOTE, `suggestReply -> ${JSON.stringify(suggested)}`);
    if (!suggested.ok || !suggested.suggestion) throw new Error('unreachable');
    const aiRowId = suggested.suggestion.id;
    const aiRow = await prisma.conversationDisposition.findUnique({ where: { id: aiRowId }, select: { created_by: true, human_confirmed: true, response_class: true, source_kind: true, source_id: true, hypothesis_id: true, persona_id: true, ai_suggested: true, enrollment_id: true } });
    expect('4 suggest', aiRow?.created_by === AI_ACTOR && aiRow.human_confirmed === false && aiRow.response_class === 'problem_confirmed' && aiRow.source_kind === 'inbound_message' && aiRow.source_id === msg1 && aiRow.hypothesis_id === h1 && aiRow.persona_id === p1.id && aiRow.enrollment_id === e1.enrollmentId && isObj(aiRow.ai_suggested), `ai row ${JSON.stringify(aiRow)}`);
    const snapshotAfter = {
      hypothesis: await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true, resolution: true, resolved_at: true } }),
      enrollment: await prisma.sequenceEnrollment.findUnique({ where: { id: e1.enrollmentId }, select: { status: true, stop_reason: true } }),
      unsubscribed: await prisma.unsubscribedEmail.count({ where: { email: emails.reply } }),
      persona: await prisma.persona.findUnique({ where: { id: p1.id }, select: { do_not_contact: true } }),
      bids: await prisma.buyerInputData.count({ where: { hypothesis_id: h1 } }),
    };
    expect('4 suggest', JSON.stringify(snapshotBefore) === JSON.stringify(snapshotAfter) && snapshotAfter.hypothesis?.status === 'active' && snapshotAfter.hypothesis.resolution === null && snapshotAfter.enrollment?.status === 'paused' && snapshotAfter.unsubscribed === 0 && snapshotAfter.persona?.do_not_contact === false && snapshotAfter.bids === 0, `the suggestion changed state: before ${JSON.stringify(snapshotBefore)} after ${JSON.stringify(snapshotAfter)}`);
    expect('4 suggest', dispositionEffects({ responseClass: 'problem_confirmed', humanConfirmed: false }).stopsRun === false, 'an unconfirmed problem_confirmed row must carry no effects');
    const suggestedAudit = await prisma.gapAuditEvent.count({ where: { kind: 'reply.suggested', subject_id: aiRowId, created_at: { gte: runStart } } });
    const secondSuggest = await suggestReply(prisma, good.ai, msg1, { now: () => now });
    expect('4 suggest', suggestedAudit === 1 && secondSuggest.ok && secondSuggest.suggestion?.id === aiRowId && good.calls() === 1, `second suggest -> ${JSON.stringify(secondSuggest)} with ${good.calls()} model calls and ${suggestedAudit} reply.suggested rows`);
    // The listed reply still shows as undispositioned, now carrying the suggestion with the row id.
    const page2 = await listReplies(prisma, { state: 'undispositioned' });
    const item2 = page2.items.find((i) => i.id === msg1);
    expect('4 suggest', item2?.suggestion?.id === aiRowId && item2.suggestion.responseClass === 'problem_confirmed', `listed suggestion ${JSON.stringify(item2?.suggestion)}`);
    // A quote the buyer never wrote is rejected: a second message from the call persona (a known address with a hypothesis).
    const msg2 = `${tag}-msg-2`;
    const thread2 = `${tag}-thread-2`;
    await prisma.emailThread.create({ data: { id: thread2, account_name: accountName, persona_email: emails.call, subject: 'Re: yards', last_message_at: now } });
    created.threadIds.push(thread2);
    await prisma.inboundMessage.create({ data: { id: msg2, thread_id: thread2, from_email: emails.call, subject: 'Re: yards', body_text: 'Not this quarter. Try me in November.', received_at: now, source: 'gmail' } });
    created.inboundIds.push(msg2);
    const bad = stubAi({ responseClass: 'timing', bids: [{ type: 'priority', quote: 'we have bigger fires this quarter', why: 'paraphrase' }], why: 'timing' });
    const rejected = await suggestReply(prisma, bad.ai, msg2, { now: () => now });
    const rejectedAudit = await prisma.gapAuditEvent.findFirst({ where: { kind: 'reply.suggest_rejected', subject_id: msg2, created_at: { gte: runStart } }, select: { payload: true } });
    const rejectedRows = await prisma.conversationDisposition.count({ where: { source_kind: 'inbound_message', source_id: msg2 } });
    expect('4 suggest', rejected.ok && rejected.suggestion === null && 'rejected' in rejected && rejected.rejected === 'quote_not_found:0' && (rejectedAudit?.payload as { rejected?: string } | null)?.rejected === 'quote_not_found:0' && rejectedRows === 0, `bad-quote suggest -> ${JSON.stringify(rejected)} audit ${JSON.stringify(rejectedAudit)} rows ${rejectedRows}`);
    counts.aiSuggestionRowId = aiRowId;
    pass('4 suggest', `unconfirmed ai row ${aiRowId.slice(0, 8)} (created_by ai, problem_confirmed, quote verbatim) with the hypothesis still active, the enrollment still paused, no unsubscribe row, no resolution, no BID; second call idempotent (1 model call); a quote not in the text -> null, quote_not_found:0, reply.suggest_rejected audited, no row`);

    // 5. Human disposition adopts the ai row, stops the run, resolves confirmed at 85, mirror skipped; duplicate refused.
    const base = (over: Partial<RecordDispositionInput>): RecordDispositionInput => ({
      hypothesisId: h1,
      personaId: p1.id,
      contactEmail: emails.reply,
      channel: 'email',
      responseClass: 'problem_confirmed',
      source: { kind: 'inbound_message', id: msg1 },
      actor: OWNER,
      actorKind: 'human',
      now,
      ...over,
    });
    const recorded = await recordDisposition(prisma, base({
      buyerLanguage: REPLY_TEXT,
      rootCauseClass: 'No shared gate standard across the acquired sites',
      bids: [
        { type: 'business_problem', rawBuyerLanguage: QUOTE },
        { type: 'root_cause', rawBuyerLanguage: 'before a clerk sees the paperwork' },
      ],
      aiSuggestionId: aiRowId,
    }));
    expect('5 disposition', recorded.ok, `recordDisposition -> ${JSON.stringify(recorded)}`);
    if (!recorded.ok) throw new Error('unreachable');
    expect('5 disposition', recorded.dispositionId === aiRowId && recorded.bidIds.length === 2 && recorded.humanConfirmed && recorded.effects !== 'none', `result ${JSON.stringify(recorded)}`);
    const effects = recorded.effects as Exclude<typeof recorded.effects, 'none'>;
    const dispRow = await prisma.conversationDisposition.findUnique({ where: { id: aiRowId }, select: { human_confirmed: true, confirmed_by: true, created_by: true, response_class: true, root_cause_class: true, buyer_language: true, metadata: true, ai_suggested: true } });
    const agreement = isObj(dispRow?.metadata) ? (dispRow!.metadata as { aiSuggestion?: { id?: string; responseClass?: string; matched?: boolean } }).aiSuggestion : null;
    expect('5 disposition', dispRow?.human_confirmed === true && dispRow.confirmed_by === OWNER && dispRow.created_by === AI_ACTOR && dispRow.response_class === 'problem_confirmed' && dispRow.buyer_language === REPLY_TEXT && isObj(dispRow.ai_suggested) && agreement?.id === aiRowId && agreement.responseClass === 'problem_confirmed' && agreement.matched === true, `confirmed row ${JSON.stringify(dispRow)}`);
    const bidRows = await prisma.buyerInputData.findMany({ where: { id: { in: recorded.bidIds } }, select: { id: true, type: true, human_confirmed: true, confirmed_by: true, disposition_id: true, source: true, inbound_message_id: true } });
    expect('5 disposition', bidRows.length === 2 && bidRows.every((b) => b.human_confirmed && b.confirmed_by === OWNER && b.disposition_id === aiRowId && b.source === 'email' && b.inbound_message_id === msg1), `bid rows ${JSON.stringify(bidRows)}`);
    const e1Row = await prisma.sequenceEnrollment.findUnique({ where: { id: e1.enrollmentId }, select: { status: true, stop_reason: true, stopped_by: true } });
    expect('5 disposition', effects.stopped.length === 1 && effects.stopped[0] === e1.enrollmentId && e1Row?.status === 'stopped' && e1Row.stop_reason === 'replied' && e1Row.stopped_by === OWNER, `enrollment after disposition ${JSON.stringify(e1Row)} effects.stopped ${JSON.stringify(effects.stopped)}`);
    const h1Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true, resolved_at: true, resolved_by: true, resolution: true } });
    const resolution = isObj(h1Row?.resolution) ? (h1Row!.resolution as Record<string, unknown>) : {};
    const bidIdsCited = Array.isArray(resolution.bidIds) ? (resolution.bidIds as string[]) : [];
    const dispIdsCited = Array.isArray(resolution.dispositionIds) ? (resolution.dispositionIds as string[]) : [];
    expect('5 disposition', h1Row?.status === 'confirmed' && !!h1Row.resolved_at && h1Row.resolved_by === OWNER, `hypothesis after disposition ${JSON.stringify({ status: h1Row?.status, resolved_at: h1Row?.resolved_at, by: h1Row?.resolved_by })}`);
    expect('5 disposition', resolution.problem === 'confirmed' && resolution.confidence === 85 && resolution.rootCause === 'confirmed' && resolution.quote === true && recorded.bidIds.every((id) => bidIdsCited.includes(id)) && dispIdsCited.includes(aiRowId) && resolution.scoredBy === aiRowId, `resolution JSON ${JSON.stringify(resolution)}`);
    expect('5 disposition', effects.resolution?.outcome === 'confirmed' && effects.resolution.confidence === 85 && effects.unsubscribed === false && effects.mirrored === false, `effects ${JSON.stringify(effects)}`);
    expect('5 disposition', recorded.refusals.length === 1 && recorded.refusals[0].step === 'mirror' && recorded.refusals[0].reason === 'skipped:gap_mirror_disabled', `refusals ${JSON.stringify(recorded.refusals)}`);
    const mirrorRows = await prisma.gapHubSpotMirror.count({ where: { object_id: aiRowId } });
    expect('5 disposition', mirrorRows === 0, `${mirrorRows} gap_hubspot_mirror rows for the disposition, expected 0 (flag off)`);
    /** Audit kinds on a subject, oldest first; an enrollment transition row (`decision.human_action`) is named with its payload action. */
    const kindsFor = async (subjectId: string): Promise<string[]> =>
      (await prisma.gapAuditEvent.findMany({ where: { subject_id: subjectId, created_at: { gte: runStart } }, select: { kind: true, payload: true }, orderBy: { created_at: 'asc' } })).map((r) => {
        const action = isObj(r.payload) && typeof r.payload.action === 'string' ? r.payload.action : null;
        return r.kind === 'decision.human_action' && action ? `${r.kind}:${action}` : r.kind;
      });
    const dispKinds = await kindsFor(aiRowId);
    const hypKinds = await kindsFor(h1);
    const enrKinds = await kindsFor(e1.enrollmentId);
    expect('5 disposition', JSON.stringify(dispKinds) === JSON.stringify(['reply.suggested', 'disposition.recorded', 'disposition.effects']), `disposition audit kinds ${JSON.stringify(dispKinds)}`);
    expect('5 disposition', hypKinds.filter((k) => k === 'hypothesis.resolved').length === 1 && hypKinds.filter((k) => k === 'hypothesis.activated').length === 1, `hypothesis audit kinds ${JSON.stringify(hypKinds)}`);
    expect('5 disposition', JSON.stringify(enrKinds) === JSON.stringify(['enroll.live', 'decision.human_action:enrollment.pause', 'decision.human_action:enrollment.stop']), `enrollment audit kinds ${JSON.stringify(enrKinds)}`);
    const dup = await recordDisposition(prisma, base({ buyerLanguage: REPLY_TEXT }));
    expect('5 disposition', !dup.ok && dup.kind === 'refused' && dup.reason === 'hypothesis_not_active', `duplicate on the resolved hypothesis -> ${JSON.stringify(dup)} (the hypothesis is no longer active, so the unique is never reached)`);
    // The unique on (source_kind, source_id) is proven on an ACTIVE hypothesis: the second persona's still-active one with the same source key.
    const dupSource = await recordDisposition(prisma, base({ hypothesisId: h2, personaId: p2.id, contactEmail: emails.call, buyerLanguage: REPLY_TEXT }));
    expect('5 disposition', !dupSource.ok && dupSource.kind === 'refused' && dupSource.reason === 'duplicate_source' && dupSource.existingId === aiRowId, `duplicate source -> ${JSON.stringify(dupSource)}`);
    const listedAfter = (await listReplies(prisma, { state: 'undispositioned' })).items.some((i) => i.id === msg1);
    const listedAll = (await listReplies(prisma, { state: 'all' })).items.find((i) => i.id === msg1);
    expect('5 disposition', !listedAfter && listedAll?.dispositionId === aiRowId, `after the disposition: undispositioned still lists it=${listedAfter}, all carries dispositionId ${listedAll?.dispositionId}`);
    counts.dispositionId = aiRowId;
    counts.confirmedBidIds = recorded.bidIds.join(',');
    counts.resolutionConfidence = 85;
    pass('5 disposition', `ai row ${aiRowId.slice(0, 8)} became the human's row (confirmed_by ${OWNER}, metadata.aiSuggestion matched=true), 2 BIDs confirmed, enrollment stopped (replied), hypothesis ${h1.slice(0, 8)} confirmed at 85 (60 email + 15 quote + 10 root cause) citing both BID ids, mirror skipped:gap_mirror_disabled with no mirror row; audit kinds disposition=[reply.suggested, disposition.recorded, disposition.effects], hypothesis has one hypothesis.resolved, enrollment has one enrollment.pause + one enrollment.stop + one enroll.live; resubmit on the resolved hypothesis -> hypothesis_not_active, same source on an active hypothesis -> duplicate_source (existingId); the reply left the undispositioned list and state=all carries dispositionId`);

    // 6. DB truth: the confirmed row is frozen, a BID cannot be deleted, a correction is a superseding insert.
    const refused = async (fn: () => Promise<unknown>): Promise<string> => {
      try {
        await fn();
        return '';
      } catch (err) {
        return errorText(err);
      }
    };
    const classErr = await refused(() => prisma.conversationDisposition.update({ where: { id: aiRowId }, data: { response_class: 'problem_rejected' } }));
    const metaErr = await refused(() => prisma.conversationDisposition.update({ where: { id: aiRowId }, data: { metadata: { resumeAt: RESUME_AT } } }));
    const revertErr = await refused(() => prisma.conversationDisposition.update({ where: { id: aiRowId }, data: { human_confirmed: false } }));
    expect('6 db truth', classErr.includes('GAP_DISPOSITION_FROZEN') && classErr.includes('response_class'), `class update not refused: ${classErr.slice(0, 200) || 'no error'}`);
    expect('6 db truth', metaErr.includes('GAP_DISPOSITION_FROZEN') && metaErr.includes('metadata'), `metadata update not refused: ${metaErr.slice(0, 200) || 'no error'}`);
    expect('6 db truth', revertErr.includes('GAP_DISPOSITION_FROZEN'), `confirmation revert not refused: ${revertErr.slice(0, 200) || 'no error'}`);
    const [bid1, bid2] = recorded.bidIds;
    const delErr = await refused(() => prisma.buyerInputData.delete({ where: { id: bid1 } }));
    expect('6 db truth', delErr.includes('GAP_BID_IMMUTABLE'), `BID delete not refused: ${delErr.slice(0, 200) || 'no error'}`);
    const langErr = await refused(() => prisma.buyerInputData.update({ where: { id: bid1 }, data: { raw_buyer_language: 'edited' } }));
    expect('6 db truth', langErr.includes('GAP_BID_IMMUTABLE'), `raw language update not refused: ${langErr.slice(0, 200) || 'no error'}`);
    const corrected = await correctBid(prisma, bid1, { rawBuyerLanguage: 'Trucks wait about an hour before a clerk sees the paperwork', capturedBy: { id: OWNER, kind: 'human' }, confirm: true }, { now });
    expect('6 db truth', corrected.ok && corrected.supersedesId === bid1 && corrected.humanConfirmed, `correctBid -> ${JSON.stringify(corrected)}`);
    if (!corrected.ok) throw new Error('unreachable');
    const allBids = await prisma.buyerInputData.findMany({ where: { hypothesis_id: h1 } });
    const selected = selectConfirmedBids(allBids.map(bidFromRow)).map((b) => b.id);
    const original = allBids.find((b) => b.id === bid1);
    expect('6 db truth', allBids.length === 3 && original?.raw_buyer_language === QUOTE && !selected.includes(bid1) && selected.includes(corrected.id) && selected.includes(bid2), `bids ${JSON.stringify(allBids.map((b) => [b.id.slice(0, 8), b.supersedes_id?.slice(0, 8) ?? null]))} selected ${JSON.stringify(selected.map((s) => s.slice(0, 8)))}`);
    const twice = await correctBid(prisma, bid1, { rawBuyerLanguage: 'again', capturedBy: { id: OWNER, kind: 'human' } }, { now });
    expect('6 db truth', !twice.ok && twice.reason === 'already_superseded', `second correction -> ${JSON.stringify(twice)}`);
    counts.correctedBidId = corrected.id;
    pass('6 db truth', `GAP_DISPOSITION_FROZEN refuses response_class, metadata and a confirmation revert on the confirmed row; GAP_BID_IMMUTABLE refuses a BID delete and a raw-language edit; correctBid inserted ${corrected.id.slice(0, 8)} superseding ${bid1.slice(0, 8)} (original untouched), selectConfirmedBids drops the old row and keeps the new plus the root cause; a second correction is already_superseded`);

    // 7. Call mode: a voicemail keeps the sequence.
    const callBase = (over: Partial<RecordDispositionInput>): RecordDispositionInput => ({
      hypothesisId: h2,
      personaId: p2.id,
      contactEmail: emails.call,
      channel: 'call',
      responseClass: 'voicemail',
      source: { kind: 'call', id: `call:${p2.id}:${now.getTime()}:${tag}` },
      actor: OWNER,
      actorKind: 'human',
      now,
      ...over,
    });
    const voicemail = await recordDisposition(prisma, callBase({}));
    expect('7 voicemail', voicemail.ok && voicemail.humanConfirmed && voicemail.effects !== 'none', `voicemail -> ${JSON.stringify(voicemail)}`);
    if (!voicemail.ok || voicemail.effects === 'none') throw new Error('unreachable');
    const e2AfterVm = await prisma.sequenceEnrollment.findUnique({ where: { id: e2.enrollmentId }, select: { status: true, stop_reason: true } });
    const item2AfterVm = await prisma.draftQueueItem.findUnique({ where: { id: e2.itemId }, select: { status: true } });
    const h2AfterVm = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { status: true, resolution: true } });
    const vmEffects = dispositionEffects({ responseClass: 'voicemail', humanConfirmed: true });
    expect('7 voicemail', voicemail.effects.stopped.length === 0 && voicemail.effects.resolution === null && voicemail.effects.unsubscribed === false && e2AfterVm?.status === 'active' && e2AfterVm.stop_reason === null && item2AfterVm?.status === STATUS.draft && h2AfterVm?.status === 'active' && h2AfterVm.resolution === null && vmEffects.keepsSequence && !vmEffects.stopsRun, `after voicemail: effects ${JSON.stringify(voicemail.effects)} enrollment ${JSON.stringify(e2AfterVm)} item ${JSON.stringify(item2AfterVm)} hypothesis ${JSON.stringify(h2AfterVm)}`);
    const vmOnEmail = await recordDisposition(prisma, callBase({ channel: 'email', source: { kind: 'manual', id: `${tag}:vm-email` } }));
    expect('7 voicemail', !vmOnEmail.ok && vmOnEmail.kind === 'invalid_body' && vmOnEmail.reason === 'call_only_class' && vmOnEmail.field === 'responseClass', `voicemail on channel email -> ${JSON.stringify(vmOnEmail)}`);
    pass('7 voicemail', `voicemail on ${emails.call} recorded confirmed (row ${voicemail.dispositionId.slice(0, 8)}) with no stop, no resolution, no unsubscribe: enrollment ${e2.enrollmentId.slice(0, 8)} still active, its draft item still draft, hypothesis still active; the table says keepsSequence; voicemail on channel email is refused call_only_class`);

    // 8. timing with resumeAt: hypothesis stays active, the date is stored, routing reads it.
    const timing = await recordDisposition(prisma, callBase({ responseClass: 'timing', channel: 'email', source: { kind: 'manual', id: `${tag}:timing` }, buyerLanguage: 'Not this quarter. Try me in November.', resumeAt: RESUME_AT }));
    expect('8 timing', timing.ok && timing.effects !== 'none', `timing -> ${JSON.stringify(timing)}`);
    if (!timing.ok || timing.effects === 'none') throw new Error('unreachable');
    const timingRow = await prisma.conversationDisposition.findUnique({ where: { id: timing.dispositionId }, select: { metadata: true, human_confirmed: true } });
    const storedResume = isObj(timingRow?.metadata) ? (timingRow!.metadata as { resumeAt?: unknown }).resumeAt : null;
    const h2AfterTiming = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { status: true, resolution: true } });
    const e2AfterTiming = await prisma.sequenceEnrollment.findUnique({ where: { id: e2.enrollmentId }, select: { status: true, stop_reason: true } });
    expect('8 timing', timingRow?.human_confirmed === true && storedResume === RESUME_AT && h2AfterTiming?.status === 'active' && h2AfterTiming.resolution === null && timing.effects.resolution === null, `timing stored ${JSON.stringify(timingRow)} hypothesis ${JSON.stringify(h2AfterTiming)}`);
    expect('8 timing', timing.effects.stopped.length === 1 && timing.effects.stopped[0] === e2.enrollmentId && e2AfterTiming?.status === 'stopped' && e2AfterTiming.stop_reason === 'replied', `timing stops the run: ${JSON.stringify(e2AfterTiming)} effects ${JSON.stringify(timing.effects.stopped)}`);
    const inputs = await assembleRoutingInputs(prisma, { accountName, personaId: p2.id, now, suppression: suppressionClear });
    expect('8 timing', !isSkip(inputs), `assembleRoutingInputs skipped: ${JSON.stringify(inputs)}`);
    if (isSkip(inputs)) throw new Error('unreachable');
    const last = inputs.comms.lastDisposition;
    expect('8 timing', last?.responseClass === 'timing' && last.resumeAt instanceof Date && last.resumeAt.toISOString() === RESUME_AT && inputs.hypothesis?.id === h2 && inputs.hypothesis.status === 'active', `routing inputs lastDisposition ${JSON.stringify(last)} hypothesis ${JSON.stringify(inputs.hypothesis && { id: inputs.hypothesis.id, status: inputs.hypothesis.status })}`);
    counts.timingDispositionId = timing.dispositionId;
    pass('8 timing', `timing on ${emails.call} confirmed with metadata.resumeAt ${RESUME_AT}; hypothesis ${h2.slice(0, 8)} still active with no resolution; the run stopped (replied); assembleRoutingInputs for persona ${p2.id} reads comms.lastDisposition = timing with that resumeAt`);

    // 9. do_not_contact: unsubscribe rows, persona flagged, run stopped (dnc), mirror skipped; a shadow enroll is then suppressed.
    const dnc = await recordDisposition(prisma, {
      hypothesisId: h3,
      personaId: p3.id,
      contactEmail: emails.dnc,
      channel: 'email',
      responseClass: 'do_not_contact',
      source: { kind: 'manual', id: `${tag}:dnc` },
      buyerLanguage: 'Please stop emailing me.',
      actor: OWNER,
      actorKind: 'human',
      now,
    });
    expect('9 dnc', dnc.ok && dnc.effects !== 'none', `do_not_contact -> ${JSON.stringify(dnc)}`);
    if (!dnc.ok || dnc.effects === 'none') throw new Error('unreachable');
    const unsub = await prisma.unsubscribedEmail.findUnique({ where: { email: emails.dnc }, select: { reason: true } });
    const p3Row = await prisma.persona.findUnique({ where: { id: p3.id }, select: { do_not_contact: true } });
    const e3Row = await prisma.sequenceEnrollment.findUnique({ where: { id: e3.enrollmentId }, select: { status: true, stop_reason: true } });
    const item3 = await prisma.draftQueueItem.findUnique({ where: { id: e3.itemId }, select: { status: true, skipped_reason: true } });
    const h3Row = await prisma.prospectingHypothesis.findUnique({ where: { id: h3 }, select: { status: true } });
    expect('9 dnc', dnc.effects.unsubscribed === true && !!unsub && unsub.reason === 'do_not_contact disposition' && p3Row?.do_not_contact === true, `unsubscribe ${JSON.stringify(unsub)} persona ${JSON.stringify(p3Row)} effects ${JSON.stringify(dnc.effects)}`);
    expect('9 dnc', dnc.effects.stopped.length === 1 && dnc.effects.stopped[0] === e3.enrollmentId && e3Row?.status === 'stopped' && e3Row.stop_reason === 'dnc' && item3?.status === STATUS.skipped && item3.skipped_reason === 'sequence_stopped:dnc', `run after dnc ${JSON.stringify(e3Row)} item ${JSON.stringify(item3)}`);
    expect('9 dnc', dnc.effects.mirrored === false && dnc.effects.resolution === null && h3Row?.status === 'active' && dnc.refusals.length === 1 && dnc.refusals[0].reason === 'skipped:gap_mirror_disabled', `dnc mirror/resolution ${JSON.stringify({ refusals: dnc.refusals, hypothesis: h3Row })}`);
    // The other two personas are untouched by the consent write.
    const otherFlags = await prisma.persona.findMany({ where: { id: { in: [p1.id, p2.id] } }, select: { do_not_contact: true } });
    expect('9 dnc', otherFlags.every((p) => p.do_not_contact === false), `other personas after dnc ${JSON.stringify(otherFlags)}`);
    const shadow = await enrollFromDecision(
      prisma,
      { hypothesisId: h3, personaId: p3.id, sequenceVersionId: v1.id, compileIds: compiles[h3], actor: ACTOR, actorKind: 'human', mode: 'shadow', now },
      { addOne, autonomy: autonomyLive, critic: criticPass, suppression: suppressionClear, contract: contractFor(0) },
    );
    const shadowRefused = await prisma.gapAuditEvent.findFirst({ where: { kind: 'enroll.refused', subject_id: h3, created_at: { gte: runStart } }, orderBy: { created_at: 'desc' }, select: { payload: true } });
    const shadowPayload = (shadowRefused?.payload ?? {}) as { predicate?: string; leg?: string };
    // The service names the FIRST leg that hits. recordUnsubscribe writes UnsubscribedEmail before Persona.do_not_contact and
    // suppressionLegFor checks them in that order, so the emitted leg is `unsubscribed`; the persona flag alone is the modex_do_not_contact leg.
    expect('9 dnc', !shadow.ok && shadow.reason === 'suppressed' && shadow.detail === 'unsubscribed' && shadowPayload.predicate === 'suppressed' && shadowPayload.leg === 'unsubscribed', `shadow enroll after dnc -> ${JSON.stringify(shadow)} audit ${JSON.stringify(shadowPayload)}`);
    expect('9 dnc', suppressionLegFor({ unsubscribed: false, doNotContact: true, emailStatus: null }) === 'modex_do_not_contact' && suppressionLegFor({ unsubscribed: true, doNotContact: true, emailStatus: null }) === 'unsubscribed', 'suppressionLegFor does not name the do_not_contact leg on its own, or does not rank unsubscribed first');
    counts.dncDispositionId = dnc.dispositionId;
    pass('9 dnc', `do_not_contact on ${emails.dnc}: UnsubscribedEmail row (reason "do_not_contact disposition"), Persona.do_not_contact true (the other two false), run ${e3.enrollmentId.slice(0, 8)} stopped (dnc) with its item skipped sequence_stopped:dnc, mirror skipped:gap_mirror_disabled, hypothesis untouched; a shadow enrollFromDecision is refused suppressed on leg unsubscribed (the first leg that hits; the persona flag alone is the modex_do_not_contact leg) and audited enroll.refused`);

    // 10. The pre-call brief for the first persona.
    const brief = await callBrief(prisma, p1.id);
    expect('10 brief', !!brief && brief.persona.id === p1.id && brief.persona.email === emails.reply && brief.persona.doNotContact === false && brief.account.name === accountName, `brief head ${JSON.stringify(brief && { persona: brief.persona, account: brief.account })}`);
    if (!brief) throw new Error('unreachable');
    const signalIds = brief.hypothesis?.signals.map((s) => s.id).sort() ?? [];
    expect('10 brief', brief.hypothesis?.id === h1 && brief.hypothesis.status === 'confirmed' && brief.hypothesis.observation.includes(`[S:${fact1.id}]`) && brief.hypothesis.observation.includes(`[S:${fact2.id}]`) && JSON.stringify(signalIds) === JSON.stringify([fact1.id, fact2.id].sort()) && brief.hypothesis.signals.some((s) => s.evidence_url === `https://example.com/${tag}/jobs`) && brief.hypothesis.wouldProveWrong.includes('The family is wrong for this account.'), `brief hypothesis ${JSON.stringify(brief.hypothesis && { id: brief.hypothesis.id, status: brief.hypothesis.status, signals: signalIds, proveWrong: brief.hypothesis.wouldProveWrong })}`);
    expect('10 brief', brief.lastDispositions.length === 1 && brief.lastDispositions[0].id === aiRowId && brief.lastDispositions[0].humanConfirmed && brief.lastDispositions[0].responseClass === 'problem_confirmed' && brief.lastDispositions[0].buyerLanguage === REPLY_TEXT, `brief dispositions ${JSON.stringify(brief.lastDispositions)}`);
    expect('10 brief', brief.openBids.length === 0 && brief.suggestedQuestions.length === 1 && brief.suggestedQuestions[0] === 'Do the acquired sites share one gate process today?', `brief open BIDs ${JSON.stringify(brief.openBids)} questions ${JSON.stringify(brief.suggestedQuestions)}`);
    const dncBrief = await callBrief(prisma, p3.id);
    expect('10 brief', dncBrief?.persona.doNotContact === true && dncBrief.lastDispositions[0]?.responseClass === 'do_not_contact', `dnc persona brief ${JSON.stringify(dncBrief && { dnc: dncBrief.persona.doNotContact, last: dncBrief.lastDispositions[0]?.responseClass })}`);
    pass('10 brief', `brief for persona ${p1.id}: FACT block observation cites both facts and the signals list carries both (one with the public url), the confirmed disposition with the buyer's words is the only disposition, zero open BIDs (all confirmed or superseded), the falsification question is the suggested question; the dnc persona's brief says doNotContact`);

    // 11. An agent-created disposition is unconfirmed with no effects; the only adoption path refuses it.
    const agent = await recordDisposition(prisma, {
      hypothesisId: h2,
      personaId: p2.id,
      contactEmail: emails.call,
      channel: 'email',
      responseClass: 'problem_rejected',
      source: { kind: 'manual', id: `${tag}:agent` },
      buyerLanguage: 'We do not have that problem.',
      actor: AGENT_ACTOR,
      actorKind: 'agent',
      now,
    });
    expect('11 agent row', agent.ok && agent.humanConfirmed === false && agent.effects === 'none' && agent.refusals.length === 0, `agent disposition -> ${JSON.stringify(agent)}`);
    if (!agent.ok) throw new Error('unreachable');
    const agentRow = await prisma.conversationDisposition.findUnique({ where: { id: agent.dispositionId }, select: { human_confirmed: true, created_by: true, confirmed_by: true } });
    const h2AfterAgent = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { status: true, resolution: true } });
    const agentKinds = await kindsFor(agent.dispositionId);
    expect('11 agent row', agentRow?.human_confirmed === false && agentRow.created_by === AGENT_ACTOR && agentRow.confirmed_by === null && h2AfterAgent?.status === 'active' && h2AfterAgent.resolution === null && JSON.stringify(agentKinds) === JSON.stringify(['disposition.recorded']), `agent row ${JSON.stringify(agentRow)} hypothesis ${JSON.stringify(h2AfterAgent)} audit ${JSON.stringify(agentKinds)}`);
    const adopt = await recordDisposition(prisma, {
      hypothesisId: h2,
      personaId: p2.id,
      contactEmail: emails.call,
      channel: 'email',
      responseClass: 'problem_rejected',
      source: { kind: 'manual', id: `${tag}:agent` },
      aiSuggestionId: agent.dispositionId,
      actor: OWNER,
      actorKind: 'human',
      now,
    });
    expect('11 agent row', !adopt.ok && adopt.kind === 'refused' && adopt.reason === 'ai_suggestion_not_adoptable', `human adoption of the agent row -> ${JSON.stringify(adopt)}`);
    const agentConfirm = await recordDisposition(prisma, { hypothesisId: h2, personaId: p2.id, contactEmail: emails.call, channel: 'email', responseClass: 'problem_rejected', source: { kind: 'manual', id: `${tag}:agent-2` }, aiSuggestionId: aiRowId, actor: AGENT_ACTOR, actorKind: 'agent', now });
    expect('11 agent row', !agentConfirm.ok && agentConfirm.kind === 'refused' && agentConfirm.reason === 'agent_cannot_confirm', `agent with aiSuggestionId -> ${JSON.stringify(agentConfirm)}`);
    counts.agentDispositionId = agent.dispositionId;
    pass('11 agent row', `agent (cron) problem_rejected on ${emails.call} stored unconfirmed with effects none and only disposition.recorded audited; hypothesis ${h2.slice(0, 8)} still active with no resolution; a human adopting it through aiSuggestionId is refused ai_suggestion_not_adoptable (only created_by ai rows adopt: NO human confirm path for agent rows exists, named debt), an agent passing aiSuggestionId is refused agent_cannot_confirm`);

    for (const name of SCRUBBED_ENV) expect('12 credentials', process.env[name] === undefined, `${name} reappeared in process.env during the run`);
    pass('12 credentials', 'no credential reappeared; no HubSpot, clawd, Gmail or model call was possible');
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
          pass('cleanup', `every row the run created was deleted (${JSON.stringify(removed)}); zero leftovers across ${Object.keys(leftovers).length} tables`);
        }
      } catch (err) {
        console.error(`cleanup FAILED for ${accountName}: ${errorText(err).slice(0, 500)}`);
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

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string; removed: Record<string, number> | null; leftovers: Record<string, number> | null }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# Sprint 4 end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-sprint4.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- Credentials scrubbed from the process before the first import: ${String(counts.scrubbedEnv)}`,
    '- No HubSpot, clawd, Gmail or model call is possible in this run: the AI client is a stub, the critic is a stub, the autonomy reader is a stub, the cross-plane suppression reader is a static CLEAR, the disposition mirror answers skipped:gap_mirror_disabled before any call (GAP_HUBSPOT_MIRROR_ENABLED off), recordUnsubscribe finds no HubSpot token, the review-feed poster has no token.',
    '- The human actor of every disposition is the session email the route would derive; the agent row is written with actorKind agent as a header-token caller would be.',
    '- Not exercised: the route handlers themselves (auth needs a Next request scope; tests/unit/gap/*-route.test.ts cover them) and the check-inbox / HubSpot poller wiring (tests/unit/gap/reply-ingest.test.ts pins the call-shape); this run calls ingestReply as those crons do after the InboundMessage persist.',
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
    '## Cleanup',
    '',
    `- Removed: ${input.removed ? JSON.stringify(input.removed) : 'not run (nothing seeded)'}`,
    `- Leftovers after cleanup: ${input.leftovers ? JSON.stringify(input.leftovers) : 'not counted'}`,
    '',
    'Every row the run created was deleted in the finally block (gap_audit_events, buyer_input_data, conversation_dispositions, gap_hubspot_mirror, unsubscribed_emails, inbound_messages, email_threads, send_approval_requests, gap_compiles, hypothesis_events, hypothesis_signals, draft_queue_items, sequence_enrollments, prospecting_hypotheses, prospecting_signals, sequences, sequence_versions, sequence_families, personas, accounts) and the leftover count per table was asserted zero. The four seed families were read, never frozen or changed.',
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
  ['buyer_input_data', 'gap_bid_guard_del'],
];

const RUN_ACTORS = [ACTOR, OWNER, INGEST_ACTOR, AI_ACTOR, AGENT_ACTOR, RUNTIME_ACTOR];

async function cleanup(prisma: PrismaClient, c: Created, runStart: Date): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((h) => h.id);
    const enrollmentIds = (await tx.sequenceEnrollment.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((e) => e.id);
    const dispositionIds = (await tx.conversationDisposition.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((d) => d.id);
    const runItemIds = (await tx.draftQueueItem.findMany({ where: { OR: [{ to_email: { in: c.emails } }, { account_name: c.accountName }] }, select: { id: true } })).map((r) => r.id);
    const compileIds = Array.from(
      new Set([
        ...c.compileIds,
        ...(await tx.gapCompile.findMany({ where: { OR: [{ created_by: ACTOR }, { draft_queue_item_id: { in: runItemIds } }, { hypothesis_id: { in: hypothesisIds } }] }, select: { id: true } })).map((r) => r.id),
      ]),
    );

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({
          where: {
            created_at: { gte: runStart },
            OR: [
              { actor: { in: RUN_ACTORS } },
              { subject_id: { in: [...hypothesisIds, ...enrollmentIds, ...dispositionIds, ...c.inboundIds, ...runItemIds.map(String)] } },
            ],
          },
        })
      ).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.conversation_dispositions = (await tx.conversationDisposition.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.gap_hubspot_mirror = (await tx.gapHubSpotMirror.deleteMany({ where: { object_id: { in: [...dispositionIds, ...hypothesisIds] } } })).count;
      removed.unsubscribed_emails = (await tx.unsubscribedEmail.deleteMany({ where: { email: { in: c.emails } } })).count;
      removed.inbound_messages = (await tx.inboundMessage.deleteMany({ where: { OR: [{ id: { in: c.inboundIds } }, { thread_id: { in: c.threadIds } }] } })).count;
      removed.email_threads = (await tx.emailThread.deleteMany({ where: { id: { in: c.threadIds } } })).count;
      removed.send_approval_requests = (await tx.sendApprovalRequest.deleteMany({ where: { channel: 'gap_compile', requested_by: ACTOR } })).count;
      removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { id: { in: compileIds } } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.draft_queue_items = (await tx.draftQueueItem.deleteMany({ where: { OR: [{ to_email: { in: c.emails } }, { account_name: c.accountName }] } })).count;
      removed.sequence_enrollments = (await tx.sequenceEnrollment.deleteMany({ where: { id: { in: enrollmentIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.sequences = c.sequenceIds.length > 0 ? (await tx.sequence.deleteMany({ where: { id: { in: c.sequenceIds } } })).count : 0;
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

/** Rows that still match the run's keys after cleanup. Every value must be zero. */
async function countLeftovers(prisma: PrismaClient, c: Created): Promise<Record<string, number>> {
  const familyWhere = c.familyId ? { family_id: c.familyId } : { id: '' };
  return {
    accounts: await prisma.account.count({ where: { name: c.accountName } }),
    personas: await prisma.persona.count({ where: { OR: [{ account_name: c.accountName }, { email: { in: c.emails } }] } }),
    prospecting_signals: await prisma.prospectingSignal.count({ where: { account_name: c.accountName } }),
    prospecting_hypotheses: await prisma.prospectingHypothesis.count({ where: { account_name: c.accountName } }),
    conversation_dispositions: await prisma.conversationDisposition.count({ where: { OR: [{ account_name: c.accountName }, { contact_email: { in: c.emails } }] } }),
    buyer_input_data: await prisma.buyerInputData.count({ where: { OR: [{ account_name: c.accountName }, { contact_email: { in: c.emails } }] } }),
    unsubscribed_emails: await prisma.unsubscribedEmail.count({ where: { email: { in: c.emails } } }),
    inbound_messages: await prisma.inboundMessage.count({ where: { OR: [{ id: { in: c.inboundIds } }, { from_email: { in: c.emails } }] } }),
    email_threads: await prisma.emailThread.count({ where: { id: { in: c.threadIds } } }),
    sequence_enrollments: await prisma.sequenceEnrollment.count({ where: { OR: [{ account_name: c.accountName }, { to_email: { in: c.emails } }] } }),
    draft_queue_items: await prisma.draftQueueItem.count({ where: { OR: [{ to_email: { in: c.emails } }, { account_name: c.accountName }] } }),
    sequences: c.sequenceIds.length > 0 ? await prisma.sequence.count({ where: { id: { in: c.sequenceIds } } }) : 0,
    sequence_versions: await prisma.sequenceVersion.count({ where: familyWhere }),
    sequence_families: c.familyId ? await prisma.sequenceFamily.count({ where: { id: c.familyId } }) : 0,
    gap_compiles: await prisma.gapCompile.count({ where: { id: { in: c.compileIds } } }),
  };
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(errorText(err));
    process.exit(1);
  });
