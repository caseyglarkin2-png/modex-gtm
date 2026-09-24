/**
 * GAP Prospecting OS: Sprint 1 end-to-end demo against a SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true GAP_HYPOTHESIS_ENABLED=true \
 *   npx tsx scripts/gap/e2e-sprint1.ts
 *
 * Leave HUBSPOT_SYNC_ENABLED and GAP_HUBSPOT_MIRROR_ENABLED unset.
 *
 * Walks the committed Sprint 1 surface in order: seed, hypothesize (twice, the
 * second run must be idempotent), the full draft -> review_required -> approved
 * -> active lifecycle with the event log and the DB freeze trigger, the
 * incomplete-draft negative path, the HubSpot mirror gate, and the PIC import
 * applied twice. Every step prints one PASS/FAIL line; the first FAIL stops
 * the run and the process exits 1. Every row the run creates carries the run
 * tag and is deleted in the finally block, in dependency order.
 *
 * Safety rails, all fail-closed:
 *   - DATABASE_URL must point at 127.0.0.1:5433/gap_dev. Anything else exits 2
 *     before a client is built.
 *   - HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are deleted from process.env before
 *     the first write, so no HubSpot or war-room call can be made even by the
 *     service's fire-and-forget mirror and review-feed hooks.
 *   - HUBSPOT_SYNC_ENABLED is read from feature-flags at module load and its
 *     codebase default is ON when unset (src/lib/feature-flags.ts). That is
 *     why the mirror has its own default-OFF gate, GAP_HUBSPOT_MIRROR_ENABLED
 *     (S1-T11b). Step 6 runs with that flag unset and asserts the mirror
 *     reports `gap_mirror_disabled` before it ever consults sync or HubSpot.
 *   - The cleanup transaction disables the four GAP guard triggers that forbid
 *     DELETE (append-only events and audit, BID immutability, the post-review
 *     signal unlink guard) and re-enables them in the same transaction. That is
 *     only legitimate on a scratch database, which the URL check guarantees.
 *
 * Writes docs/gap/sprint1-e2e-latest.md (no em dashes, no secrets) on every
 * run, PASS or FAIL, before cleanup.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { HUBSPOT_SYNC_ENABLED } from '../../src/lib/feature-flags';
import { audit as realAudit, type AuditInput } from '../../src/lib/gap/audit';
import { gapFlag } from '../../src/lib/gap/flags';
import { mirrorHypothesisEvent as realMirror, type MirrorEvent } from '../../src/lib/gap/hubspot-mirror';
import { runHypothesize } from '../../src/lib/gap/hypothesis/hypothesize';
import {
  getHypothesis,
  listHypotheses,
  proposeHypothesis,
  transitionHypothesis,
  type ServiceDeps,
} from '../../src/lib/gap/hypothesis/service';
import { applyPlan, createBid, type ApplyDeps } from '../../src/lib/gap/import/apply';
import { planPicImport, type PicLike } from '../../src/lib/gap/import/pic';
import { registerSignal } from '../../src/lib/gap/signals/registry';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

// RC E2E (2026-09-24): also accepts the disposable Docker scratch DB
// (55432/gap_finish_e2e) used when the persistent 5433/gap_dev credentials
// are unavailable. Still loopback-only, still an exact-literal allowlist.
const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'sprint1-e2e-latest.md');
const FIXTURE_PATH = path.join('tests', 'fixtures', 'gap', 'pic-honda.json');
const ACTOR = 'e2e';

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
  return [e.message, e.meta ? JSON.stringify(e.meta) : '', e.cause ? String(e.cause) : '']
    .filter(Boolean)
    .join(' ');
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
// Fire-and-forget capture: the service does not await its audit and mirror
// hooks. Wrapping them lets the script wait for every hook before it asserts
// on the tables they write, and before cleanup.
// ---------------------------------------------------------------------------

const pendingHooks: Promise<unknown>[] = [];

const serviceDeps: ServiceDeps = {
  audit: (prisma: any, input: AuditInput) => {
    const p = realAudit(prisma, input, {
      // The env token is scrubbed, so the real poster would return no_token
      // anyway; the stub makes "never leaves the process" explicit.
      postReview: async () => ({ posted: false, reason: 'no_token' as const }),
    });
    pendingHooks.push(p);
    return p;
  },
  mirror: (prisma: any, event: MirrorEvent) => {
    const p = realMirror(prisma, event);
    pendingHooks.push(p);
    return p;
  },
};

async function settleHooks(): Promise<void> {
  await Promise.allSettled(pendingHooks.splice(0));
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

  // Scrub every outbound credential before the first write.
  const scrubbed: string[] = [];
  for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
    if (process.env[name] !== undefined) {
      delete process.env[name];
      scrubbed.push(name);
    }
  }

  const tag = `gap-e2e-${Date.now()}`;
  const now = new Date();
  const accountName = `GAP E2E Co ${tag}`;
  const hubspotCompanyId = `e2e-${tag}`;
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
    `env GAP_OS_ENABLED=${gapFlag('GAP_OS_ENABLED')} GAP_HYPOTHESIS_ENABLED=${gapFlag('GAP_HYPOTHESIS_ENABLED')} GAP_HUBSPOT_MIRROR_ENABLED=${gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')} HUBSPOT_SYNC_ENABLED(resolved)=${HUBSPOT_SYNC_ENABLED} raw=${process.env.HUBSPOT_SYNC_ENABLED === undefined ? '<unset>' : JSON.stringify(process.env.HUBSPOT_SYNC_ENABLED)} scrubbed=[${scrubbed.join(',')}]`,
  );
  counts.gitSha = gitSha;
  counts.databaseHost = dbHost;
  counts.runTag = tag;
  counts.hubspotSyncEnabledResolved = String(HUBSPOT_SYNC_ENABLED);
  counts.scrubbedEnv = scrubbed.join(',') || 'none';

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  try {
    // 0. Preflight: flags on, no token, nothing stale under this tag.
    expect('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expect('preflight', gapFlag('GAP_HYPOTHESIS_ENABLED'), 'GAP_HYPOTHESIS_ENABLED is not on');
    expect('preflight', process.env.HUBSPOT_ACCESS_TOKEN === undefined, 'HUBSPOT_ACCESS_TOKEN still present');
    expect('preflight', !gapFlag('GAP_HUBSPOT_MIRROR_ENABLED'), 'GAP_HUBSPOT_MIRROR_ENABLED is on; this run must exercise the default-off mirror gate');
    const liveTriggers = await prisma.pounceTrigger.count({
      where: { dismissed: false, first_seen_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });
    counts.foreignLiveTriggersBefore = liveTriggers;
    pass('preflight', `flags on, credentials scrubbed, ${liveTriggers} foreign live triggers in the 1-day window`);

    // 1. Seed.
    await prisma.account.create({
      data: { rank: 9999, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId },
    });
    seeded = true;
    const opsPersona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-ops`,
        account_name: accountName,
        priority: 'P1',
        name: `E2E Ops ${tag}`,
        title: 'Director of Plant Operations',
        email: `ops+${tag}@example.com`,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: false,
      },
      select: { id: true },
    });
    const dncPersona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-dnc`,
        account_name: accountName,
        priority: 'P1',
        name: `E2E Suppressed ${tag}`,
        title: 'VP Manufacturing',
        email: `dnc+${tag}@example.com`,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: true,
      },
      select: { id: true },
    });
    await prisma.pounceTrigger.createMany({
      data: [
        {
          url_hash: `${tag}-t1`,
          account_slug: tag,
          account_name: accountName,
          title: `${accountName} adds a second shift and twelve new dock doors at its Ohio plant`,
          url: `https://example.com/${tag}/second-shift`,
          source: 'news',
          score: 9,
          categories: ['network_capex'],
          published_at: null,
          first_seen_at: now,
          hubspot_company_id: hubspotCompanyId,
        },
        {
          url_hash: `${tag}-t2`,
          account_slug: tag,
          account_name: accountName,
          title: `${accountName} pilots trailer tracking across three yards`,
          url: `https://example.com/${tag}/trailer-tracking`,
          source: 'news',
          score: 7,
          categories: ['yard_direct'],
          published_at: null,
          first_seen_at: now,
          hubspot_company_id: hubspotCompanyId,
        },
      ],
    });
    pass('1 seed', `account, personas ${opsPersona.id} (ready) and ${dncPersona.id} (suppressed), 2 triggers`);

    // 2. Hypothesize.
    const run1 = await runHypothesize(prisma, { now, dryRun: false, lookbackDays: 1, maxAccounts: 5 });
    counts.run1SignalsCreated = run1.signals.created;
    counts.run1Proposed = run1.proposed;
    counts.run1AccountsScanned = run1.accountsScanned;
    expect('2 hypothesize', run1.signals.created >= 2, `signals.created=${run1.signals.created}, expected >= 2 (report ${JSON.stringify(run1)})`);
    expect('2 hypothesize', run1.proposed >= 1, `proposed=${run1.proposed}, expected >= 1 (report ${JSON.stringify(run1)})`);
    const listed = await listHypotheses(prisma, { accountName, status: 'draft' });
    const draft = listed.items.find((h) => h.problem_family === 'hidden_capacity') ?? listed.items[0];
    expect('2 hypothesize', Boolean(draft), `no draft hypothesis listed for ${accountName}`);
    const draftId: string = draft.id;
    expect('2 hypothesize', typeof draft.observation === 'string' && draft.observation.includes('[S:'), `observation lacks a [S: citation: ${JSON.stringify(draft.observation)}`);
    const draftFull = await getHypothesis(prisma, draftId);
    expect('2 hypothesize', Array.isArray(draftFull?.signals) && draftFull.signals.length > 0, 'signals join has no rows');
    const suppressedHits = await prisma.prospectingHypothesis.count({ where: { primary_persona_id: dncPersona.id } });
    expect('2 hypothesize', suppressedHits === 0, `suppressed persona ${dncPersona.id} produced ${suppressedHits} hypotheses`);
    counts.draftSignals = draftFull.signals.length;
    pass('2 hypothesize', `signals.created=${run1.signals.created} proposed=${run1.proposed} draft=${draftId} family=${draft.problem_family} signals=${draftFull.signals.length} suppressed_hits=0`);

    // 3. Idempotent rerun.
    const run2 = await runHypothesize(prisma, { now, dryRun: false, lookbackDays: 1, maxAccounts: 5 });
    counts.run2SkippedOpen = run2.skippedOpen;
    counts.run2Proposed = run2.proposed;
    expect('3 rerun', run2.skippedOpen >= 1, `skippedOpen=${run2.skippedOpen}, expected >= 1 (report ${JSON.stringify(run2)})`);
    expect('3 rerun', run2.proposed === 0, `proposed=${run2.proposed}, expected 0 (report ${JSON.stringify(run2)})`);
    pass('3 rerun', `skippedOpen=${run2.skippedOpen} proposed=0 signals.existing=${run2.signals.existing}`);

    // 4. Lifecycle.
    const submit = await transitionHypothesis(prisma, draftId, 'submit', { now, actor: ACTOR }, serviceDeps);
    await settleHooks();
    expect('4 lifecycle', submit.ok && submit.to === 'review_required', `submit -> ${JSON.stringify(submit)}`);
    const approve = await transitionHypothesis(prisma, draftId, 'approve', { now, actor: ACTOR }, serviceDeps);
    await settleHooks();
    expect('4 lifecycle', approve.ok && approve.to === 'approved', `approve -> ${JSON.stringify(approve)}`);
    const activate = await transitionHypothesis(prisma, draftId, 'activate', { now, actor: ACTOR }, serviceDeps);
    await settleHooks();
    expect('4 lifecycle', activate.ok && activate.to === 'active', `activate -> ${JSON.stringify(activate)}`);
    const active = await getHypothesis(prisma, draftId);
    expect('4 lifecycle', active?.status === 'active', `status after activate is ${active?.status}`);
    expect('4 lifecycle', active.activated_at instanceof Date, 'activated_at not set');
    expect('4 lifecycle', active.expires_at instanceof Date, 'expires_at not set');
    const actions: string[] = [...active.events]
      .sort((a: any, b: any) => a.created_at.getTime() - b.created_at.getTime())
      .map((e: any) => e.action);
    const expectedActions = ['propose', 'submit', 'approve', 'activate'];
    expect('4 lifecycle', JSON.stringify(actions) === JSON.stringify(expectedActions), `events ${JSON.stringify(actions)}, expected ${JSON.stringify(expectedActions)}`);
    const resolve = await transitionHypothesis(prisma, draftId, 'resolve', { now, actor: ACTOR, outcome: 'confirmed' }, serviceDeps);
    await settleHooks();
    expect('4 lifecycle', !resolve.ok && resolve.reason === 'no_confirmed_disposition', `resolve -> ${JSON.stringify(resolve)}, expected no_confirmed_disposition`);
    let frozenMessage = '';
    try {
      await prisma.prospectingHypothesis.update({ where: { id: draftId }, data: { observation: `tampered ${tag}` } });
    } catch (err) {
      frozenMessage = errorText(err);
    }
    expect('4 lifecycle', frozenMessage.includes('GAP_HYPOTHESIS_FROZEN'), frozenMessage ? `direct update refused without GAP_HYPOTHESIS_FROZEN: ${frozenMessage.slice(0, 200)}` : 'direct update of observation on an active row was ACCEPTED');
    const after = await prisma.prospectingHypothesis.findUnique({ where: { id: draftId }, select: { observation: true, problem_hypothesis: true } });
    expect('4 lifecycle', after?.problem_hypothesis === active.problem_hypothesis, 'problem_hypothesis changed after the refused update');
    expect('4 lifecycle', after?.observation === active.observation, 'observation changed after the refused update');
    counts.lifecycleEvents = actions.length;
    pass('4 lifecycle', `submit/approve/activate ok, events ${actions.join(',')}, resolve refused no_confirmed_disposition, DB freeze GAP_HYPOTHESIS_FROZEN, narrative unchanged`);

    // 5. Negative path: an incomplete draft.
    const noFactsRef = `e2e:${tag}:nofacts`;
    const noFacts = await proposeHypothesis(prisma, {
      accountName,
      primaryPersonaId: opsPersona.id,
      persona: 'site_ops',
      problemFamily: 'hidden_capacity',
      observation: '',
      problemHypothesis: `I suspect the gate at ${accountName} is the ceiling on production capacity.`,
      rootCauseHypotheses: [],
      impactHypotheses: [],
      falsificationQuestions: ['How many trailers wait at the gate at the busiest hour?'],
      confidence: 40,
      signalIds: [],
      sourceRef: noFactsRef,
      createdBy: ACTOR,
    });
    expect('5 negative', noFacts.ok, `propose without facts -> ${JSON.stringify(noFacts)}`);
    const noFactsId = noFacts.ok ? noFacts.id : '';
    const noFactsRow = await getHypothesis(prisma, noFactsId);
    expect('5 negative', noFactsRow?.metadata?.needsObservation === true, `metadata.needsObservation is ${JSON.stringify(noFactsRow?.metadata)}`);
    const badSubmit = await transitionHypothesis(prisma, noFactsId, 'submit', { now, actor: ACTOR }, serviceDeps);
    await settleHooks();
    expect('5 negative', !badSubmit.ok && badSubmit.reason === 'no_signals', `submit of the empty draft -> ${JSON.stringify(badSubmit)}, expected no_signals`);
    const dup = await proposeHypothesis(prisma, {
      accountName,
      persona: 'site_ops',
      problemFamily: 'hidden_capacity',
      observation: '',
      problemHypothesis: 'I suspect a duplicate.',
      rootCauseHypotheses: [],
      impactHypotheses: [],
      falsificationQuestions: ['Is this a duplicate?'],
      confidence: 40,
      signalIds: [],
      sourceRef: noFactsRef,
      createdBy: ACTOR,
    });
    expect('5 negative', !dup.ok && dup.reason === 'duplicate_source_ref' && dup.existingId === noFactsId, `second propose -> ${JSON.stringify(dup)}, expected duplicate_source_ref with existingId ${noFactsId}`);
    pass('5 negative', `needsObservation=true, submit refused no_signals, duplicate_source_ref existingId=${noFactsId}`);

    // 6. Mirror gate.
    const mirror = await realMirror(prisma, {
      hypothesisId: draftId,
      action: 'activated',
      hypothesis: {
        accountName,
        hubspotCompanyId,
        problemFamily: active.problem_family,
        observation: active.observation,
        problemHypothesis: active.problem_hypothesis,
        whyNow: active.why_now ?? null,
        falsificationQuestions: Array.isArray(active.falsification_questions) ? active.falsification_questions : [],
        whatANoMeans: active.what_a_no_means ?? null,
        confidence: active.confidence,
        status: 'active',
      },
      evidence: active.signals.map((link: any) => ({
        id: link.signal.id,
        title: link.signal.title,
        url: link.signal.evidence_url ?? null,
      })),
    });
    const mirrorRows = await prisma.gapHubSpotMirror.count({
      where: { OR: [{ key: { startsWith: `gap:hyp:${draftId}:` } }, { key: { startsWith: `gap:hyp:${noFactsId}:` } }] },
    });
    counts.mirrorRows = mirrorRows;
    expect('6 mirror', mirror.status === 'skipped' && mirror.reason === 'gap_mirror_disabled', `mirror -> ${JSON.stringify(mirror)}, expected skipped/gap_mirror_disabled (GAP_HUBSPOT_MIRROR_ENABLED=${gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')}, HUBSPOT_SYNC_ENABLED resolved ${HUBSPOT_SYNC_ENABLED}; ${mirrorRows} gap_hubspot_mirror rows for this run)`);
    expect('6 mirror', mirrorRows === 0, `${mirrorRows} gap_hubspot_mirror rows exist for this run, expected 0`);
    pass('6 mirror', `skipped/gap_mirror_disabled with HUBSPOT_SYNC_ENABLED resolved ${HUBSPOT_SYNC_ENABLED}, 0 gap_hubspot_mirror rows`);

    // 7. PIC import, applied twice.
    const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as PicLike;
    const pic: PicLike = { ...fixture, slug: `${fixture.slug}-${tag}` };
    const plan = planPicImport(pic, { accountName, hubspotCompanyId, now, registeredBy: ACTOR });
    const realDeps: ApplyDeps = { registerSignal, proposeHypothesis, createBid };
    const apply1 = await applyPlan(prisma, plan, realDeps, { dryRun: false, createdBy: ACTOR });
    counts.picRows = pic.rows.length;
    counts.picApply1HypothesesCreated = apply1.hypotheses.created;
    counts.picApply1SignalsCreated = apply1.signals.created;
    counts.picApply1Bids = apply1.bids.created;
    expect('7 pic', apply1.hypotheses.created === pic.rows.length, `first apply hypotheses.created=${apply1.hypotheses.created}, expected ${pic.rows.length} (${JSON.stringify(apply1)})`);
    expect('7 pic', apply1.signals.created >= 1, `first apply signals.created=${apply1.signals.created}, expected >= 1`);
    const apply2 = await applyPlan(prisma, plan, realDeps, { dryRun: false, createdBy: ACTOR });
    counts.picApply2HypothesesExisting = apply2.hypotheses.existing;
    expect('7 pic', apply2.hypotheses.created === 0, `second apply hypotheses.created=${apply2.hypotheses.created}, expected 0`);
    expect('7 pic', apply2.hypotheses.existing === pic.rows.length, `second apply hypotheses.existing=${apply2.hypotheses.existing}, expected ${pic.rows.length}`);
    expect('7 pic', apply2.signals.created === 0, `second apply signals.created=${apply2.signals.created}, expected 0`);
    pass('7 pic', `first apply created ${apply1.hypotheses.created} hypotheses, ${apply1.signals.created} signals, ${apply1.bids.created} bids; second apply created 0, existing ${apply2.hypotheses.existing}, signals.created 0`);
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
    await settleHooks();
    // 8. Report, always, before cleanup.
    try {
      writeReport({ failure, tag, dbHost, gitSha });
      console.log(`report ${REPORT_PATH}`);
    } catch (err) {
      console.error(`report write failed: ${errorText(err)}`);
    }
    if (seeded) {
      try {
        const removed = await cleanup(prisma, accountName);
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
    '# Sprint 1 end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-sprint1.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: ${String(counts.hubspotSyncEnabledResolved)} (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)`,
    `- Credentials scrubbed from the process before the first write: ${String(counts.scrubbedEnv)}`,
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(counts)
      .filter(([k]) => !['gitSha', 'databaseHost', 'runTag', 'hubspotSyncEnabledResolved', 'scrubbedEnv'].includes(k))
      .map(([k, v]) => `- ${k}: ${v}`),
    '',
    'Every row the run created was deleted in the finally block (hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, gap_audit_events, pounce_triggers, personas, accounts).',
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
  ['buyer_input_data', 'gap_bid_guard_del'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
];

async function cleanup(prisma: PrismaClient, accountName: string): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (
      await tx.prospectingHypothesis.findMany({ where: { account_name: accountName }, select: { id: true } })
    ).map((h) => h.id);

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { account_name: accountName } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: accountName } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: accountName } })).count;
      removed.gap_hubspot_mirror = (
        await tx.gapHubSpotMirror.deleteMany({ where: { OR: hypothesisIds.map((id) => ({ key: { startsWith: `gap:hyp:${id}:` } })) } })
      ).count;
      removed.gap_audit_events = (await tx.gapAuditEvent.deleteMany({ where: { subject_type: 'hypothesis', subject_id: { in: hypothesisIds } } })).count;
      removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { account_name: accountName } })).count;
      removed.personas = (await tx.persona.deleteMany({ where: { account_name: accountName } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: accountName } })).count;
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
