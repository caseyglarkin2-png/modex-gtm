/**
 * GAP Prospecting OS: Sprint 2 end-to-end demo against a SCRATCH database.
 *
 *   HUBSPOT_ACCESS_TOKEN= \
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true GAP_HYPOTHESIS_ENABLED=true GAP_ROUTING_ENABLED=true \
 *   npx tsx scripts/gap/e2e-sprint2.ts
 *
 * Leave HUBSPOT_SYNC_ENABLED and GAP_HUBSPOT_MIRROR_ENABLED unset.
 *
 * Walks the committed Sprint 2 surface in order: seed (account, three
 * personas, two ten-day-old triggers, a Sequence and a two-row Draft Queue
 * run), hypothesize plus the S2-T10 fact link and unlink refusal, the S2-T4
 * enrollment-truth sync over the Top100 fixtures (twice, the second must be
 * a no-op), the S2-T9 reply poller with a human reply and an out-of-office
 * (twice), the S2-T7 shadow routing run with its queue read and human-action
 * capture, the S2-T8 enroll table, the R0/R0b suppression verdicts, the
 * S2-T2 stop-not-delete under the flag, the routing rerun that proves the
 * stop unlocked the recipient (reply_pending), and the S1-T11b mirror gate.
 * Every step prints one PASS/FAIL line; the first FAIL stops the run and the
 * process exits 1. Every row the run creates is deleted in the finally block,
 * in dependency order.
 *
 * Safety rails, all fail-closed:
 *   - DATABASE_URL must point at 127.0.0.1:5433/gap_dev. Anything else exits 2
 *     before a client is built.
 *   - HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are deleted from process.env before
 *     the first write and asserted gone. No HubSpot call can be made: the
 *     suppression reader is the static one, the HubSpot snapshot provider is a
 *     stub, the enrollment readback is a fixture, the reply search is a fixture,
 *     and the review-feed poster is stubbed to `no_token`.
 *   - The Top100 fixture accounts (Dell, J.B. Hunt) and their two sequence ids
 *     must not exist before the run; stale rows from an aborted run fail the
 *     preflight instead of being adopted or deleted.
 *   - The cleanup transaction disables the GAP guard triggers that forbid the
 *     DELETEs it needs (append-only events and audit, BID immutability, the
 *     post-review signal unlink guard, the frozen-version delete guard) and
 *     re-enables them in the same transaction. That is only legitimate on a
 *     scratch database, which the URL check guarantees.
 *
 * Writes docs/gap/sprint2-e2e-latest.md (no em dashes, no secrets) on every
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
import { extractCitationIds } from '../../src/lib/gap/hypothesis/observation';
import {
  getHypothesis,
  linkSignals,
  listHypotheses,
  transitionHypothesis,
  unlinkSignal,
  type ServiceDeps,
} from '../../src/lib/gap/hypothesis/service';
import { messageIdFor, pollHubSpotReplies, threadIdFor, WATERMARK_KEY, type HubSpotEmailEngagement } from '../../src/lib/gap/replies/hubspot-poller';
import {
  buildEnrollRows,
  ENROLL_TABLE_HEADER,
  loadDecisions,
  renderEnrollTableMarkdown,
  SKIP_REASON,
} from '../../src/lib/gap/routing/enroll-row';
import { listQueue, recordHumanAction } from '../../src/lib/gap/routing/queue';
import { LAST_RUN_CONFIG_KEY, runRouting, SHADOW_MODE, type HubSpotSnapshotProvider } from '../../src/lib/gap/routing/run';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { enrollmentId, READBACK_PROPERTIES, runEnrollmentSync, type ReadContactsDeps } from '../../src/lib/gap/sequence/external-sync';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { readManifest, readRoster } from '../../src/lib/gap/top100/reader';
import { cancelDownstream } from '../../src/lib/queue/sequence-runtime';
import { STATUS } from '../../src/lib/queue/types';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:5433\/gap_dev(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'sprint2-e2e-latest.md');
const MANIFEST_FIXTURE = path.join('tests', 'fixtures', 'gap', 'top100-manifest.json');
const ROSTER_FIXTURE = path.join('tests', 'fixtures', 'gap', 'top100-roster.json');
const ACTOR = 'e2e';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Older than the 7-day hot window (R14/R15 must not fire) and inside the assembler's 28-day trigger window, the 45-day news TTL and the hypothesize lookback below. */
const TRIGGER_AGE_DAYS = 10;
const HYPOTHESIZE_LOOKBACK_DAYS = 12;
const SYSTEM_CONFIG_KEYS = [LAST_RUN_CONFIG_KEY, WATERMARK_KEY] as const;

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
// Fire-and-forget capture: the services do not await their audit and mirror
// hooks. Wrapping them lets the script wait for every hook before it asserts
// on the tables they write, and before cleanup.
// ---------------------------------------------------------------------------

const pendingHooks: Promise<unknown>[] = [];

const capturedAudit = (prisma: any, input: AuditInput) => {
  const p = realAudit(prisma, input, {
    // The env token is scrubbed, so the real poster would return no_token
    // anyway; the stub makes "never leaves the process" explicit.
    postReview: async () => ({ posted: false, reason: 'no_token' as const }),
  });
  pendingHooks.push(p);
  return p;
};

const serviceDeps: ServiceDeps = {
  audit: capturedAudit,
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
// What the run creates, for cleanup
// ---------------------------------------------------------------------------

interface Created {
  accountName: string;
  fixtureAccountNames: string[];
  fixtureSequenceIds: string[];
  sequenceName: string;
  sequenceRunId: string;
  routingRunIds: string[];
  messageIds: string[];
  threadIds: string[];
  systemConfigBefore: Record<string, string | null>;
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

  const tag = `gap-e2e2-${Date.now()}`;
  const now = new Date();
  const triggerSeenAt = new Date(now.getTime() - TRIGGER_AGE_DAYS * DAY_MS);
  const accountName = `GAP E2E Co ${tag}`;
  const hubspotCompanyId = `e2e-${tag}`;
  const opsEmail = `ops+${tag}@example.com`;
  const execEmail = `exec+${tag}@example.com`;
  const opsContactId = `${tag}-c1`;
  const execContactId = `${tag}-c2`;
  const dncContactId = `${tag}-c3`;
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
    `env GAP_OS_ENABLED=${gapFlag('GAP_OS_ENABLED')} GAP_HYPOTHESIS_ENABLED=${gapFlag('GAP_HYPOTHESIS_ENABLED')} GAP_ROUTING_ENABLED=${gapFlag('GAP_ROUTING_ENABLED')} GAP_HUBSPOT_MIRROR_ENABLED=${gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')} HUBSPOT_SYNC_ENABLED(resolved)=${HUBSPOT_SYNC_ENABLED} scrubbed=[${scrubbed.join(',')}]`,
  );
  counts.gitSha = gitSha;
  counts.databaseHost = dbHost;
  counts.runTag = tag;
  counts.hubspotSyncEnabledResolved = String(HUBSPOT_SYNC_ENABLED);
  counts.scrubbedEnv = scrubbed.join(',') || 'none';

  // Fixtures (read before any write so a bad fixture fails before the seed).
  const manifest = readManifest(readFileSync(MANIFEST_FIXTURE, 'utf8'));
  const roster = readRoster(readFileSync(ROSTER_FIXTURE, 'utf8'));
  const rosters = { [roster.key]: roster.people };
  const manifestAccounts = Object.values(manifest.accounts);
  const fixtureAccountNames = manifestAccounts.map((a) => a.name);
  const fixtureCompanyIds = manifestAccounts.map((a) => a.hubspotCompanyId).filter((v): v is string => !!v);
  const fixtureSequenceIds = manifestAccounts.map((a) => a.sequence?.hubspotSequenceId).filter((v): v is string => !!v);
  const dellAccount = manifest.accounts[roster.key];
  const dellFirst = roster.people[0];

  const created: Created = {
    accountName,
    fixtureAccountNames,
    fixtureSequenceIds,
    sequenceName: `GAP E2E seq ${tag}`,
    sequenceRunId: `${tag}-run`,
    routingRunIds: [],
    messageIds: [],
    threadIds: [],
    systemConfigBefore: {},
  };

  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  try {
    // 0. Preflight: flags on, no token, nothing stale that the run would adopt.
    expect('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expect('preflight', gapFlag('GAP_HYPOTHESIS_ENABLED'), 'GAP_HYPOTHESIS_ENABLED is not on');
    expect('preflight', gapFlag('GAP_ROUTING_ENABLED'), 'GAP_ROUTING_ENABLED is not on');
    expect('preflight', !gapFlag('GAP_HUBSPOT_MIRROR_ENABLED'), 'GAP_HUBSPOT_MIRROR_ENABLED is on; this run must exercise the default-off mirror gate');
    expect('preflight', process.env.HUBSPOT_ACCESS_TOKEN === undefined, 'HUBSPOT_ACCESS_TOKEN still present');
    expect('preflight', process.env.MC_API_TOKEN === undefined, 'MC_API_TOKEN still present');
    expect('preflight', manifestAccounts.length >= 2 && fixtureSequenceIds.length >= 2, `manifest fixture carries ${manifestAccounts.length} accounts and ${fixtureSequenceIds.length} built sequences, expected >= 2 of each`);
    expect('preflight', !!dellAccount?.sequence && !!dellFirst?.hubspotContactId && !!dellFirst?.email, `roster fixture ${roster.key} must match a manifest account with a sequence and carry a first person with a contact id and email`);
    const staleAccounts = await prisma.account.count({
      where: { OR: [{ name: { in: fixtureAccountNames } }, { hubspot_company_id: { in: fixtureCompanyIds } }] },
    });
    expect('preflight', staleAccounts === 0, `${staleAccounts} Account rows already match the Top100 fixture (${fixtureAccountNames.join(', ')}); remove them before running`);
    const staleFamilies = await prisma.sequenceFamily.count({ where: { hubspot_sequence_id: { in: fixtureSequenceIds } } });
    expect('preflight', staleFamilies === 0, `${staleFamilies} sequence_families rows already carry the fixture sequence ids ${fixtureSequenceIds.join(', ')}; remove them before running`);
    const foreignLiveTriggers = await prisma.pounceTrigger.count({
      where: { dismissed: false, first_seen_at: { gte: new Date(now.getTime() - HYPOTHESIZE_LOOKBACK_DAYS * DAY_MS) } },
    });
    expect('preflight', foreignLiveTriggers === 0, `${foreignLiveTriggers} foreign live triggers in the ${HYPOTHESIZE_LOOKBACK_DAYS}-day hypothesize window; the run would propose hypotheses for accounts it does not own`);
    for (const key of SYSTEM_CONFIG_KEYS) {
      const row = await prisma.systemConfig.findUnique({ where: { key } });
      created.systemConfigBefore[key] = row?.value ?? null;
    }
    counts.foreignLiveTriggersBefore = foreignLiveTriggers;
    pass('preflight', `flags on, credentials scrubbed, no stale fixture rows, 0 foreign live triggers in the ${HYPOTHESIZE_LOOKBACK_DAYS}-day window`);

    // 1. Seed.
    seeded = true;
    await prisma.account.create({
      data: { rank: 9999, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId },
    });
    const opsPersona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-ops`,
        account_name: accountName,
        priority: 'P1',
        name: `E2E Ops ${tag}`,
        title: 'Director of Plant Operations',
        seniority: 'director',
        email: opsEmail,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: false,
        hubspot_contact_id: opsContactId,
      },
      select: { id: true },
    });
    const execPersona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-exec`,
        account_name: accountName,
        priority: 'P1',
        name: `E2E Exec ${tag}`,
        title: 'VP Supply Chain',
        seniority: 'vp',
        email: execEmail,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: false,
        hubspot_contact_id: execContactId,
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
        seniority: 'vp',
        email: `dnc+${tag}@example.com`,
        email_valid: true,
        is_contact_ready: true,
        do_not_contact: true,
        hubspot_contact_id: dncContactId,
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
          first_seen_at: triggerSeenAt,
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
          first_seen_at: triggerSeenAt,
          hubspot_company_id: hubspotCompanyId,
        },
      ],
    });
    // Top100 fixture accounts, so the enrollment sync can resolve its families.
    let rank = 9990;
    for (const acct of manifestAccounts) {
      await prisma.account.create({
        data: { rank: rank++, name: acct.name, vertical: 'top100-fixture', hubspot_company_id: acct.hubspotCompanyId },
      });
    }
    // A modex sequence run for the ready persona: one approved, one draft, same run.
    const sequence = await prisma.sequence.create({
      data: { name: created.sequenceName, steps: [] },
      select: { id: true },
    });
    await prisma.draftQueueItem.createMany({
      data: [0, 1].map((step) => ({
        to_email: opsEmail,
        account_name: accountName,
        persona_name: `E2E Ops ${tag}`,
        persona_id: opsPersona.id,
        subject: `${accountName} step ${step + 1}`,
        body: `Step ${step + 1} of the e2e run ${tag}.`,
        status: step === 0 ? STATUS.approved : STATUS.draft,
        approved_at: step === 0 ? now : null,
        sequence_id: sequence.id,
        sequence_run_id: created.sequenceRunId,
        step_index: step,
        idempotency_key: `${tag}:${step}`,
        created_by: ACTOR,
      })),
    });
    pass('1 seed', `account, personas ${opsPersona.id} (ready, director), ${execPersona.id} (ready, vp), ${dncPersona.id} (suppressed), 2 triggers ${TRIGGER_AGE_DAYS} days old, fixture accounts ${fixtureAccountNames.join(' + ')}, sequence ${sequence.id} with 2 draft queue rows (approved + draft) on run ${created.sequenceRunId}`);

    // 2. Hypothesize, then the S2-T10 fact link and unlink refusal, then approve.
    const run1 = await runHypothesize(prisma, { now, dryRun: false, lookbackDays: HYPOTHESIZE_LOOKBACK_DAYS, maxAccounts: 5 });
    counts.hypothesizeSignalsCreated = run1.signals.created;
    counts.hypothesizeProposed = run1.proposed;
    expect('2 hypothesize', run1.signals.created >= 2, `signals.created=${run1.signals.created}, expected >= 2 (report ${JSON.stringify(run1)})`);
    expect('2 hypothesize', run1.proposed >= 1, `proposed=${run1.proposed}, expected >= 1 (report ${JSON.stringify(run1)})`);
    const drafts = (await listHypotheses(prisma, { accountName, status: 'draft' })).items;
    const opsDraft = drafts.find((h) => h.primary_persona_id === opsPersona.id);
    const execDraft = drafts.find((h) => h.primary_persona_id === execPersona.id);
    expect('2 hypothesize', Boolean(opsDraft), `no draft for the ops persona ${opsPersona.id} (drafts: ${drafts.map((h) => `${h.id}:${h.primary_persona_id}:${h.problem_family}`).join(', ')})`);
    expect('2 hypothesize', Boolean(execDraft), `no draft for the exec persona ${execPersona.id} (drafts: ${drafts.map((h) => `${h.id}:${h.primary_persona_id}:${h.problem_family}`).join(', ')})`);
    const suppressedHits = drafts.filter((h) => h.primary_persona_id === dncPersona.id).length;
    expect('2 hypothesize', suppressedHits === 0, `suppressed persona ${dncPersona.id} produced ${suppressedHits} drafts`);
    const opsDraftId: string = opsDraft.id;
    const before = await getHypothesis(prisma, opsDraftId);
    const signalsBefore: number = before.signals.length;
    expect('2 hypothesize', signalsBefore > 0, 'ops draft has no linked signals');

    // Operator fact through the registry, then linked to the draft.
    const projected = fromOperatorKnowledge(
      {
        accountName,
        hubspotCompanyId,
        personaId: opsPersona.id,
        text: 'The plant manager said trailers wait about forty minutes at the gate on Monday mornings.',
        at: now,
        sourceId: `${tag}:fact1`,
        by: 'casey',
      },
      { registeredBy: ACTOR, now },
    );
    expect('2 hypothesize', projected.ok, `fromOperatorKnowledge refused: ${projected.ok ? '' : projected.reason}`);
    if (!projected.ok) throw new Error('unreachable');
    const fact = await registerSignal(prisma, projected.signal);
    expect('2 hypothesize', fact.created, `operator fact ${fact.id} already existed`);
    const linked = await linkSignals(prisma, opsDraftId, [fact.id], ACTOR);
    expect('2 hypothesize', linked.ok && linked.linked.includes(fact.id), `linkSignals -> ${JSON.stringify(linked)}`);
    const afterLink = await getHypothesis(prisma, opsDraftId);
    expect('2 hypothesize', afterLink.signals.length === signalsBefore + 1, `signal count ${afterLink.signals.length} after link, expected ${signalsBefore + 1}`);
    const relink = await linkSignals(prisma, opsDraftId, [fact.id], ACTOR);
    expect('2 hypothesize', relink.ok && relink.linked.length === 0 && relink.already.includes(fact.id), `second linkSignals -> ${JSON.stringify(relink)}, expected already=[${fact.id}]`);

    // Unlinking a signal the observation cites must refuse.
    const cited = extractCitationIds(String(before.observation ?? ''));
    expect('2 hypothesize', cited.length > 0, `ops draft observation carries no [S: citation: ${JSON.stringify(before.observation)}`);
    const unlink = await unlinkSignal(prisma, opsDraftId, cited[0], ACTOR);
    expect('2 hypothesize', !unlink.ok && unlink.reason === 'signal_cited', `unlinkSignal of cited ${cited[0]} -> ${JSON.stringify(unlink)}, expected signal_cited (N5)`);
    const afterUnlink = await getHypothesis(prisma, opsDraftId);
    expect('2 hypothesize', afterUnlink.signals.length === signalsBefore + 1, `signal count ${afterUnlink.signals.length} after the refused unlink, expected ${signalsBefore + 1}`);

    // Approve every draft of the account so routing sees a live hypothesis per persona.
    let approved = 0;
    for (const draft of drafts) {
      const submit = await transitionHypothesis(prisma, draft.id, 'submit', { now, actor: ACTOR }, serviceDeps);
      await settleHooks();
      expect('2 hypothesize', submit.ok && submit.to === 'review_required', `submit ${draft.id} -> ${JSON.stringify(submit)}`);
      const approve = await transitionHypothesis(prisma, draft.id, 'approve', { now, actor: ACTOR }, serviceDeps);
      await settleHooks();
      expect('2 hypothesize', approve.ok && approve.to === 'approved', `approve ${draft.id} -> ${JSON.stringify(approve)}`);
      approved += 1;
    }
    counts.hypothesesApproved = approved;
    counts.opsDraftSignals = afterUnlink.signals.length;
    pass('2 hypothesize', `signals.created=${run1.signals.created} proposed=${run1.proposed} opsDraft=${opsDraftId} (${opsDraft.problem_family}) execDraft=${execDraft.id} (${execDraft.problem_family}); fact ${fact.id} linked (${signalsBefore} -> ${signalsBefore + 1}), relink already, unlink of cited ${cited[0]} refused signal_cited; ${approved} drafts submitted and approved`);

    // 3. Enrollment-truth sync over the Top100 fixtures, twice.
    let readbackCalls = 0;
    const readContacts: ReadContactsDeps['readContacts'] = async (ids, properties) => {
      readbackCalls += 1;
      expect('3 sync', JSON.stringify(properties) === JSON.stringify(READBACK_PROPERTIES), `readback asked for ${JSON.stringify(properties)}, expected ${JSON.stringify(READBACK_PROPERTIES)}`);
      return ids.map((id) =>
        id === dellFirst.hubspotContactId
          ? {
              id,
              properties: {
                hs_sequences_actively_enrolled_count: '1',
                hs_latest_sequence_enrolled: dellAccount.sequence!.hubspotSequenceId,
                hs_latest_sequence_enrolled_date: String(now.getTime() - 3 * DAY_MS),
              },
            }
          : { id, properties: { hs_sequences_actively_enrolled_count: '0', hs_latest_sequence_enrolled: null, hs_latest_sequence_enrolled_date: null } },
      );
    };
    const syncOpts = { manifest, rosters, now, dryRun: false, program: manifest.runId, portal: manifest.portal, actor: ACTOR };
    const sync1 = await runEnrollmentSync(prisma, syncOpts, { readContacts });
    counts.sync1FamiliesCreated = sync1.families.created;
    counts.sync1EnrollmentsCreated = sync1.enrollments.created;
    counts.sync1ContactsRead = sync1.contactsRead;
    expect('3 sync', sync1.families.created >= 2, `families.created=${sync1.families.created}, expected >= 2 (${JSON.stringify(sync1)})`);
    expect('3 sync', sync1.families.skipped.length === 0, `families skipped ${JSON.stringify(sync1.families.skipped)}`);
    expect('3 sync', sync1.enrollments.created === 1, `enrollments.created=${sync1.enrollments.created}, expected 1 (${JSON.stringify(sync1)})`);
    expect('3 sync', sync1.contactsRead === roster.people.filter((p) => p.hubspotContactId).length, `contactsRead=${sync1.contactsRead}, expected ${roster.people.filter((p) => p.hubspotContactId).length}`);
    const expectedEnrollmentId = enrollmentId(dellAccount.sequence!.hubspotSequenceId, dellFirst.hubspotContactId!);
    const enrollment = await prisma.sequenceEnrollment.findUnique({
      where: { id: expectedEnrollmentId },
      include: { version: { select: { status: true, frozen_by_enrollment_id: true } } },
    });
    expect('3 sync', enrollment?.legacy === true && enrollment.status === 'active' && enrollment.to_email === dellFirst.email!.toLowerCase(), `enrollment ${expectedEnrollmentId} -> ${JSON.stringify(enrollment && { legacy: enrollment.legacy, status: enrollment.status, to_email: enrollment.to_email })}`);
    expect('3 sync', enrollment!.account_name === dellAccount.name, `enrollment account ${enrollment!.account_name}, expected ${dellAccount.name}`);
    // R2-5: a legacy readback row (legacy=true) never freezes the placeholder scaffold; the version stays draft and unclaimed.
    expect('3 sync', enrollment!.version.status === 'draft' && enrollment!.version.frozen_by_enrollment_id == null, `legacy enrollment must not freeze its version (R2-5), got ${JSON.stringify(enrollment!.version)}, expected status draft with no frozen_by_enrollment_id`);
    const sync2 = await runEnrollmentSync(prisma, syncOpts, { readContacts });
    counts.sync2FamiliesExisting = sync2.families.existing;
    counts.sync2EnrollmentsUnchanged = sync2.enrollments.unchanged;
    expect('3 sync', sync2.families.created === 0 && sync2.families.existing === sync1.families.created, `second sync families -> ${JSON.stringify(sync2.families)}, expected created 0 existing ${sync1.families.created}`);
    expect('3 sync', sync2.enrollments.created === 0 && sync2.enrollments.updated === 0 && sync2.enrollments.unchanged === 1, `second sync enrollments -> ${JSON.stringify(sync2.enrollments)}, expected created 0 updated 0 unchanged 1`);
    counts.readbackCalls = readbackCalls;
    pass('3 sync', `families created ${sync1.families.created} (${fixtureSequenceIds.join(', ')}), enrollments created 1 (${expectedEnrollmentId}, legacy, version still draft per R2-5), rosters missing ${JSON.stringify(sync1.rostersMissing)}, reported ${JSON.stringify(sync1.reported)}; second run created 0 / existing ${sync2.families.existing} / unchanged 1; ${readbackCalls} readback calls`);

    // 4. Reply poller with a human reply and an out-of-office, twice.
    const engagements: HubSpotEmailEngagement[] = [
      {
        id: `${tag}-e1`,
        fromEmail: opsEmail,
        toEmail: 'casey@freightroll.com',
        subject: `Re: ${accountName} gate dwell`,
        text: 'Thanks for the note. Can we talk Thursday about what the gate is costing us?',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        id: `${tag}-e2`,
        fromEmail: opsEmail,
        toEmail: 'casey@freightroll.com',
        subject: 'Automatic reply: out of office',
        text: 'I am out of the office until Monday with limited access to email.',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ];
    created.messageIds = engagements.map((e) => messageIdFor(e.id));
    created.threadIds = [threadIdFor(opsContactId)];
    let searchCalls = 0;
    const searchIncomingEmails = async () => {
      searchCalls += 1;
      return engagements;
    };
    const pollOpts = { now, since: new Date(now.getTime() - DAY_MS), dryRun: false };
    const poll1 = await pollHubSpotReplies(prisma, pollOpts, { searchIncomingEmails });
    counts.poll1Created = poll1.created;
    counts.poll1Filtered = Object.values(poll1.filtered).reduce((n, v) => n + v, 0);
    expect('4 replies', poll1.seen === 2 && poll1.created === 1, `first poll -> ${JSON.stringify(poll1)}, expected seen 2 created 1`);
    expect('4 replies', poll1.filtered.auto_reply_subject === 1 && Object.keys(poll1.filtered).length === 1, `first poll filtered ${JSON.stringify(poll1.filtered)}, expected {auto_reply_subject: 1}`);
    expect('4 replies', poll1.unknownSender === 0, `unknownSender=${poll1.unknownSender}, expected 0`);
    const inbound = await prisma.inboundMessage.findMany({ where: { id: { in: created.messageIds } }, select: { id: true, source: true, from_email: true, thread_id: true } });
    expect('4 replies', inbound.length === 1 && inbound[0].id === messageIdFor(`${tag}-e1`) && inbound[0].source === 'hubspot' && inbound[0].thread_id === threadIdFor(opsContactId), `inbound rows ${JSON.stringify(inbound)}, expected only the human reply as source hubspot on thread ${threadIdFor(opsContactId)}`);
    const notifications = await prisma.notification.findMany({ where: { source_id: { in: created.messageIds } }, select: { type: true, source_id: true, read: true }, orderBy: { source_id: 'asc' } });
    expect('4 replies', notifications.length === 2 && notifications.some((n) => n.type === 'reply' && n.read === false) && notifications.some((n) => n.type === 'filtered_inbound' && n.read === true), `notifications ${JSON.stringify(notifications)}, expected one unread reply and one read filtered_inbound`);
    const poll2 = await pollHubSpotReplies(prisma, pollOpts, { searchIncomingEmails });
    counts.poll2Existing = poll2.existing;
    expect('4 replies', poll2.created === 0 && poll2.existing === 2, `second poll -> ${JSON.stringify(poll2)}, expected created 0 existing 2 (both engagements carry a notification, so neither is re-classified)`);
    const watermark = await prisma.systemConfig.findUnique({ where: { key: WATERMARK_KEY } });
    expect('4 replies', watermark?.value === engagements[1].timestamp.toISOString(), `watermark ${watermark?.value}, expected ${engagements[1].timestamp.toISOString()}`);
    pass('4 replies', `first poll created 1 filtered {auto_reply_subject: 1}, inbound ${inbound[0].id} on ${inbound[0].thread_id}, notifications reply + filtered_inbound; second poll created 0 existing 2; watermark advanced; ${searchCalls} fixture searches`);

    // 5. Shadow routing run A: the ready persona is in flight, the exec persona enrolls, the do_not_contact persona is blocked at R0 (R2-1).
    let snapshotCalls = 0;
    const snapshotProvider: HubSpotSnapshotProvider = async (name, companyId) => {
      snapshotCalls += 1;
      expect('5 routing', name === accountName && companyId === hubspotCompanyId, `snapshot provider called for ${name} / ${companyId}`);
      return {
        tam: 'in',
        tamTier: 'A',
        contacts: {
          [opsContactId]: { qualVerdict: 'qualified' },
          [execContactId]: { qualVerdict: 'qualified' },
        },
      };
    };
    const routingDeps = {
      hubspotSnapshot: snapshotProvider,
      top100: { manifest, rosterByKey: rosters },
      audit: capturedAudit,
    };
    const runIdA = `${tag}-run-a`;
    created.routingRunIds.push(runIdA);
    const runA = await runRouting(
      prisma,
      { now, runId: runIdA, accountNames: [accountName], maxPersonasPerAccount: 3, actor: ACTOR },
      { ...routingDeps, suppression: staticSuppressionReader('clear') },
    );
    await settleHooks();
    counts.runADecisions = runA.decisions;
    counts.runASkips = JSON.stringify(runA.skips);
    counts.runAByRule = JSON.stringify(runA.byRule);
    expect('5 routing', runA.mode === SHADOW_MODE && runA.accountsScanned === 1, `run A -> ${JSON.stringify(runA)}`);
    expect('5 routing', runA.decisions >= 1, `decisions=${runA.decisions}, expected >= 1 (${JSON.stringify(runA)})`);
    expect('5 routing', (runA.skips.in_flight ?? 0) === 1, `skips ${JSON.stringify(runA.skips)}, expected in_flight 1 (the ready persona has an approved draft queue row)`);
    expect('5 routing', snapshotCalls === 1, `snapshot provider called ${snapshotCalls} times, expected 1`);
    const rowsA = await prisma.routingDecision.findMany({ where: { run_id: runIdA }, orderBy: { priority: 'desc' } });
    expect('5 routing', rowsA.length === runA.decisions, `${rowsA.length} rows stored for run A, report says ${runA.decisions}`);
    for (const row of rowsA) {
      const snap = row.inputs_snapshot as Record<string, unknown> | null;
      const ok = !!snap && typeof snap === 'object' && !!(snap as any).account?.name && typeof (snap as any).persona?.id === 'number';
      expect('5 routing', row.mode === SHADOW_MODE && ok, `row ${row.id} mode ${row.mode} inputs_snapshot ${ok ? 'ok' : JSON.stringify(snap).slice(0, 200)}`);
    }
    const execRowA = rowsA.find((r) => r.persona_id === execPersona.id);
    const dncRowA = rowsA.find((r) => r.persona_id === dncPersona.id);
    const opsRowA = rowsA.find((r) => r.persona_id === opsPersona.id);
    expect('5 routing', !opsRowA, `the in-flight ready persona was stored as ${opsRowA?.rule_id}; a skip must never be stored`);
    expect('5 routing', execRowA?.rule_id === 'enroll' && execRowA.action === 'enroll_gap_sequence' && execRowA.lane === 'work_queue', `exec persona rule ${execRowA?.rule_id} action ${execRowA?.action} lane ${execRowA?.lane}, expected enroll / enroll_gap_sequence / work_queue`);
    expect('5 routing', (execRowA!.inputs_snapshot as any).target === 'modex_queue' && execRowA!.hypothesis_id === execDraft.id, `exec target ${(execRowA!.inputs_snapshot as any).target} hypothesis ${execRowA!.hypothesis_id}, expected modex_queue on ${execDraft.id}`);
    // R2-1: the persona's do_not_contact column is authoritative on its own; a clear remote verdict never routes it past R0.
    expect('5 routing', dncRowA?.rule_id === 'suppressed' && dncRowA.action === 'do_not_contact' && dncRowA.lane === 'blocked', `suppressed persona rule ${dncRowA?.rule_id} action ${dncRowA?.action} lane ${dncRowA?.lane}, expected suppressed / do_not_contact / blocked (R2-1)`);
    const queue = await listQueue(prisma, { runId: runIdA });
    expect('5 routing', queue.runId === runIdA && queue.items.length === rowsA.length && queue.nextCursor === null, `listQueue -> runId ${queue.runId} items ${queue.items.length} nextCursor ${queue.nextCursor}`);
    for (let i = 1; i < queue.items.length; i += 1) {
      expect('5 routing', queue.items[i - 1].priority >= queue.items[i].priority, `queue not ordered by priority: ${queue.items.map((q) => q.priority).join(',')}`);
    }
    expect('5 routing', queue.items[0].id === execRowA!.id && queue.items[0].account.tam === 'in' && queue.items[0].account.tamTier === 'A' && queue.items[0].persona.email === execEmail, `top queue item ${JSON.stringify({ id: queue.items[0].id, tam: queue.items[0].account.tam, tier: queue.items[0].account.tamTier, email: queue.items[0].persona.email })}`);
    const act1 = await recordHumanAction(prisma, execRowA!.id, 'enrolled_by_hand', ACTOR, { audit: capturedAudit, now: () => now });
    const act2 = await recordHumanAction(prisma, execRowA!.id, 'enrolled_by_hand', ACTOR, { audit: capturedAudit, now: () => now });
    const act3 = await recordHumanAction(prisma, `${tag}-missing`, 'enrolled_by_hand', ACTOR, { audit: capturedAudit, now: () => now });
    await settleHooks();
    expect('5 routing', act1.ok, `first recordHumanAction -> ${JSON.stringify(act1)}`);
    expect('5 routing', !act2.ok && act2.reason === 'already_acted', `second recordHumanAction -> ${JSON.stringify(act2)}, expected already_acted`);
    expect('5 routing', !act3.ok && act3.reason === 'not_found', `recordHumanAction on a missing id -> ${JSON.stringify(act3)}, expected not_found`);
    const acted = await prisma.routingDecision.findUnique({ where: { id: execRowA!.id }, select: { human_action: true, human_actor: true } });
    expect('5 routing', acted?.human_action === 'enrolled_by_hand' && acted.human_actor === ACTOR, `stamped ${JSON.stringify(acted)}`);
    const lastRun = await prisma.systemConfig.findUnique({ where: { key: LAST_RUN_CONFIG_KEY } });
    expect('5 routing', lastRun?.value === runIdA, `${LAST_RUN_CONFIG_KEY} is ${lastRun?.value}, expected ${runIdA}`);
    pass('5 routing', `run A mode shadow: ${runA.decisions} decisions ${JSON.stringify(runA.byRule)}, skips ${JSON.stringify(runA.skips)}; exec persona ${execPersona.id} -> enroll (target modex_queue, hypothesis ${execDraft.id}); do_not_contact persona -> suppressed / do_not_contact / blocked (R2-1); every row carries account + persona; queue ordered by priority; human action ok then already_acted, missing id not_found`);

    // 6. Enroll table off run A.
    const items = await loadDecisions(prisma, runIdA);
    expect('6 enroll rows', items.length === 1 && items[0].inputs.persona.id === execPersona.id, `loadDecisions returned ${items.length} enroll items (${items.map((i) => i.inputs.persona.id).join(',')}), expected 1 for persona ${execPersona.id}`);
    const table = buildEnrollRows(items);
    const rendered = renderEnrollTableMarkdown(table);
    expect('6 enroll rows', rendered.startsWith(`${ENROLL_TABLE_HEADER}\n`), `rendered table does not start with the lane header: ${rendered.split('\n')[0]}`);
    expect('6 enroll rows', table.rows.length === 1 && table.rows[0].account === accountName, `rows ${JSON.stringify(table.rows.map((r) => r.account))}, expected [${accountName}]`);
    expect('6 enroll rows', table.rows[0].contacts.length === 0 && table.skipped.length === 1 && table.skipped[0].reason === SKIP_REASON.modex_queue && table.skipped[0].personaId === execPersona.id, `row ${JSON.stringify({ contacts: table.rows[0].contacts.length, skips: table.rows[0].skips })}, expected the exec persona skipped as ${SKIP_REASON.modex_queue}`);
    expect('6 enroll rows', rendered.includes(`| ${accountName} |`) && rendered.includes(`E2E Exec ${tag} (${SKIP_REASON.modex_queue})`), `rendered row missing the account or the skip cell: ${rendered.split('\n')[2]}`);
    counts.enrollTableRows = table.rows.length;
    counts.enrollTableSkips = table.skipped.length;
    pass('6 enroll rows', `header + 1 row for ${accountName}: sequence ${table.rows[0].sequence ? table.rows[0].sequence.hubspotSequenceId : 'NOT BUILT'}, 0 contacts, 1 skip (${table.skipped[0].name}: ${table.skipped[0].reason})`);

    // 7. Suppression verdicts: suppressed blocks everyone as do_not_contact, unknown blocks everyone as research_required.
    const runIdS = `${tag}-run-suppressed`;
    const runIdU = `${tag}-run-unknown`;
    created.routingRunIds.push(runIdS, runIdU);
    const runS = await runRouting(
      prisma,
      { now, runId: runIdS, accountNames: [accountName], maxPersonasPerAccount: 3, actor: ACTOR },
      { ...routingDeps, suppression: staticSuppressionReader('suppressed') },
    );
    await settleHooks();
    const rowsS = await prisma.routingDecision.findMany({ where: { run_id: runIdS }, select: { rule_id: true, action: true, lane: true, persona_id: true } });
    expect('7 suppression', runS.decisions === 3 && rowsS.length === 3, `suppressed run -> ${JSON.stringify(runS)} with ${rowsS.length} rows, expected 3 decisions (R0 fires before the in-flight skip)`);
    for (const r of rowsS) {
      expect('7 suppression', r.rule_id === 'suppressed' && r.action === 'do_not_contact' && r.lane === 'blocked', `suppressed run persona ${r.persona_id}: ${r.rule_id} / ${r.action} / ${r.lane}, expected suppressed / do_not_contact / blocked`);
    }
    const runU = await runRouting(
      prisma,
      { now, runId: runIdU, accountNames: [accountName], maxPersonasPerAccount: 3, actor: ACTOR },
      { ...routingDeps, suppression: staticSuppressionReader('unknown') },
    );
    await settleHooks();
    const rowsU = await prisma.routingDecision.findMany({ where: { run_id: runIdU }, select: { rule_id: true, action: true, lane: true, persona_id: true } });
    expect('7 suppression', runU.decisions === 3 && rowsU.length === 3, `unknown run -> ${JSON.stringify(runU)} with ${rowsU.length} rows, expected 3 decisions`);
    for (const r of rowsU) {
      // R2-1: the local do_not_contact column outranks an unreadable clawd leg, so the DNC persona is
      // suppressed even when the contract is unknown; every other persona is unknown -> research.
      if (r.persona_id === dncPersona.id) {
        expect('7 suppression', r.rule_id === 'suppressed' && r.action === 'do_not_contact' && r.lane === 'blocked', `unknown run dnc persona ${r.persona_id}: ${r.rule_id} / ${r.action} / ${r.lane}, expected suppressed / do_not_contact / blocked (local do_not_contact outranks unknown, R2-1)`);
        continue;
      }
      expect('7 suppression', r.rule_id === 'suppression_unknown' && r.action === 'research_required' && r.lane === 'blocked', `unknown run persona ${r.persona_id}: ${r.rule_id} / ${r.action} / ${r.lane}, expected suppression_unknown / research_required / blocked`);
    }
    const blockedQueue = await listQueue(prisma, { runId: runIdS, lane: 'blocked' });
    expect('7 suppression', blockedQueue.items.length === 3 && blockedQueue.items.every((q) => q.blocked), `blocked lane filter returned ${blockedQueue.items.length} items`);
    counts.suppressedDecisions = rowsS.length;
    counts.unknownDecisions = rowsU.length;
    pass('7 suppression', `suppressed -> ${rowsS.length} x do_not_contact/blocked (rule suppressed); unknown -> ${rowsU.length} rows: dnc persona suppressed (local column outranks unknown, R2-1), others research_required/blocked (rule suppression_unknown); queue lane=blocked filter returns ${blockedQueue.items.length}`);

    // 8. Stop, do not delete, under the flag; then prove the recipient unlocked.
    const dqBefore = await prisma.draftQueueItem.findMany({ where: { sequence_run_id: created.sequenceRunId }, select: { id: true, status: true, skipped_reason: true } });
    expect('8 stop', dqBefore.length === 2 && dqBefore.some((r) => r.status === STATUS.approved) && dqBefore.some((r) => r.status === STATUS.draft), `draft queue run before stop ${JSON.stringify(dqBefore)}`);
    const stopped = await cancelDownstream(prisma, created.sequenceRunId, 'replied');
    const dqAfter = await prisma.draftQueueItem.findMany({ where: { sequence_run_id: created.sequenceRunId }, select: { id: true, status: true, skipped_reason: true } });
    expect('8 stop', stopped === 2, `cancelDownstream marked ${stopped} rows, expected 2`);
    expect('8 stop', dqAfter.length === 2, `${dqAfter.length} rows remain after the stop, expected 2 (nothing deleted)`);
    for (const r of dqAfter) {
      expect('8 stop', r.status === STATUS.skipped && r.skipped_reason === 'sequence_stopped:replied', `row ${r.id} is ${r.status} / ${r.skipped_reason}, expected skipped / sequence_stopped:replied`);
    }
    const stoppedAgain = await cancelDownstream(prisma, created.sequenceRunId, 'replied');
    expect('8 stop', stoppedAgain === 0, `second cancelDownstream marked ${stoppedAgain} rows, expected 0`);
    counts.stopMarked = stopped;
    counts.stopRowsRemaining = dqAfter.length;

    const runIdB = `${tag}-run-b`;
    created.routingRunIds.push(runIdB);
    const runB = await runRouting(
      prisma,
      { now, runId: runIdB, accountNames: [accountName], maxPersonasPerAccount: 3, actor: ACTOR },
      { ...routingDeps, suppression: staticSuppressionReader('clear') },
    );
    await settleHooks();
    counts.runBByRule = JSON.stringify(runB.byRule);
    expect('8 stop', (runB.skips.in_flight ?? 0) === 0 && runB.decisions === 3, `run B after the stop -> ${JSON.stringify(runB)}, expected no in_flight skip and 3 decisions`);
    const opsRowB = await prisma.routingDecision.findFirst({ where: { run_id: runIdB, persona_id: opsPersona.id } });
    expect('8 stop', opsRowB?.rule_id === 'reply_pending' && opsRowB.action === 'one_off_email' && opsRowB.lane === 'reply_triage', `ready persona after the stop: rule ${opsRowB?.rule_id} action ${opsRowB?.action} lane ${opsRowB?.lane}, expected reply_pending / one_off_email / reply_triage (the step 4 inbound has no disposition)`);
    expect('8 stop', (opsRowB!.inputs_snapshot as any).comms?.undispositionedInbound === true && (opsRowB!.inputs_snapshot as any).comms?.inFlight === false, `ready persona comms ${JSON.stringify((opsRowB!.inputs_snapshot as any).comms)}`);
    pass('8 stop', `cancelDownstream(replied) marked ${stopped} rows skipped with sequence_stopped:replied, ${dqAfter.length} rows remain, rerun marks 0; routing run B: ${JSON.stringify(runB.byRule)}, ready persona ${opsPersona.id} -> reply_pending (rule id printed as observed)`);

    // 9. Mirror gate.
    const opsApproved = await getHypothesis(prisma, opsDraftId);
    const mirror = await realMirror(prisma, {
      hypothesisId: opsDraftId,
      action: 'approved',
      hypothesis: {
        accountName,
        hubspotCompanyId,
        problemFamily: opsApproved.problem_family,
        observation: opsApproved.observation,
        problemHypothesis: opsApproved.problem_hypothesis,
        whyNow: opsApproved.why_now ?? null,
        falsificationQuestions: Array.isArray(opsApproved.falsification_questions) ? opsApproved.falsification_questions : [],
        whatANoMeans: opsApproved.what_a_no_means ?? null,
        confidence: opsApproved.confidence,
        status: 'approved',
      },
      evidence: opsApproved.signals.map((link: any) => ({
        id: link.signal.id,
        title: link.signal.title,
        url: link.signal.evidence_url ?? null,
      })),
    });
    const hypothesisIds = drafts.map((h) => h.id as string);
    const mirrorRows = await prisma.gapHubSpotMirror.count({
      where: { OR: hypothesisIds.map((id) => ({ key: { startsWith: `gap:hyp:${id}:` } })) },
    });
    counts.mirrorRows = mirrorRows;
    expect('9 mirror', mirror.status === 'skipped' && mirror.reason === 'gap_mirror_disabled', `mirror -> ${JSON.stringify(mirror)}, expected skipped/gap_mirror_disabled (GAP_HUBSPOT_MIRROR_ENABLED=${gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')}, HUBSPOT_SYNC_ENABLED resolved ${HUBSPOT_SYNC_ENABLED})`);
    expect('9 mirror', mirrorRows === 0, `${mirrorRows} gap_hubspot_mirror rows exist for this run, expected 0`);
    expect('9 mirror', process.env.HUBSPOT_ACCESS_TOKEN === undefined && process.env.MC_API_TOKEN === undefined, 'a credential reappeared in process.env during the run');
    pass('9 mirror', `skipped/gap_mirror_disabled with HUBSPOT_SYNC_ENABLED resolved ${HUBSPOT_SYNC_ENABLED}, 0 gap_hubspot_mirror rows, credentials still absent`);
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
    // 10. Report, always, before cleanup.
    try {
      writeReport({ failure, tag, dbHost, gitSha });
      console.log(`report ${REPORT_PATH}`);
    } catch (err) {
      console.error(`report write failed: ${errorText(err)}`);
    }
    if (seeded) {
      try {
        const removed = await cleanup(prisma, created);
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
    '# Sprint 2 end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-sprint2.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: ${String(counts.hubspotSyncEnabledResolved)} (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)`,
    `- Credentials scrubbed from the process before the first write: ${String(counts.scrubbedEnv)}`,
    '- No HubSpot call is possible in this run: static suppression reader, stub snapshot provider, fixture enrollment readback, fixture reply search, review-feed poster stubbed.',
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
    'Every row the run created was deleted in the finally block (routing_decisions, gap_audit_events, hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, sequence_enrollments, sequence_versions, sequence_families, notifications, inbound_messages, email_threads, draft_queue_items, sequences, pounce_triggers, personas, accounts) and the system_config keys it wrote were restored or removed.',
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
  ['sequence_versions', 'gap_version_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: Created): Promise<Record<string, number>> {
  const accountNames = [c.accountName, ...c.fixtureAccountNames];
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (
      await tx.prospectingHypothesis.findMany({ where: { account_name: { in: accountNames } }, select: { id: true } })
    ).map((h) => h.id);
    const decisionIds = (
      await tx.routingDecision.findMany({ where: { OR: [{ run_id: { in: c.routingRunIds } }, { account_name: { in: accountNames } }] }, select: { id: true } })
    ).map((d) => d.id);
    const familyIds = (
      await tx.sequenceFamily.findMany({ where: { hubspot_sequence_id: { in: c.fixtureSequenceIds } }, select: { id: true } })
    ).map((f) => f.id);

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.routing_decisions = (await tx.routingDecision.deleteMany({ where: { id: { in: decisionIds } } })).count;
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({
          where: {
            OR: [
              { subject_type: 'hypothesis', subject_id: { in: hypothesisIds } },
              { subject_type: 'routing_run', subject_id: { in: c.routingRunIds } },
              { subject_type: 'routing_decision', subject_id: { in: decisionIds } },
            ],
          },
        })
      ).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { account_name: { in: accountNames } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.gap_hubspot_mirror = (
        await tx.gapHubSpotMirror.deleteMany({ where: { OR: hypothesisIds.map((id) => ({ key: { startsWith: `gap:hyp:${id}:` } })) } })
      ).count;
      removed.sequence_enrollments = (
        await tx.sequenceEnrollment.deleteMany({ where: { OR: [{ family_id: { in: familyIds } }, { account_name: { in: accountNames } }] } })
      ).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: { in: accountNames } } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: accountNames } } })).count;
      removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: { in: familyIds } } })).count;
      removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: { in: familyIds } } })).count;
      removed.notifications = (await tx.notification.deleteMany({ where: { source_id: { in: c.messageIds } } })).count;
      removed.inbound_messages = (await tx.inboundMessage.deleteMany({ where: { id: { in: c.messageIds } } })).count;
      removed.email_threads = (await tx.emailThread.deleteMany({ where: { id: { in: c.threadIds } } })).count;
      removed.draft_queue_items = (await tx.draftQueueItem.deleteMany({ where: { sequence_run_id: c.sequenceRunId } })).count;
      removed.sequences = (await tx.sequence.deleteMany({ where: { name: c.sequenceName } })).count;
      removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { account_name: { in: accountNames } } })).count;
      removed.personas = (await tx.persona.deleteMany({ where: { account_name: { in: accountNames } } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: { in: accountNames } } })).count;
      let configTouched = 0;
      for (const key of SYSTEM_CONFIG_KEYS) {
        const prior = c.systemConfigBefore[key];
        if (prior === undefined) continue;
        if (prior === null) {
          configTouched += (await tx.systemConfig.deleteMany({ where: { key } })).count;
        } else {
          await tx.systemConfig.upsert({ where: { key }, update: { value: prior }, create: { key, value: prior } });
          configTouched += 1;
        }
      }
      removed.system_config_restored = configTouched;
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
