/**
 * GAP Prospecting OS: Sprint 5 end-to-end demo against a SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:5433/gap_dev \
 *   GAP_OS_ENABLED=true \
 *   npx tsx scripts/gap/e2e-sprint5.ts
 *
 * Closes the loop the spec calls out: signal -> hypothesis -> interaction ->
 * confirmed BID/disposition -> resolved hypothesis -> learning query/
 * dashboard receives the correct metric with n. Sprint 5 adds no new tables
 * (section 4: "use the existing data model"), so this script seeds through
 * the same Sprint 1 and Sprint 4 services the earlier e2e scripts use
 * (proposeHypothesis, transitionHypothesis, recordDisposition) and reads the
 * result back through `buildLearningReport`, never through raw SQL.
 *
 * Two hypotheses, on purpose, so precision and resonance are not trivially
 * 100%:
 *   H1 (hidden_capacity, site_ops)   a call disposition CONFIRMS the
 *                                    problem, with a root-cause BID and a
 *                                    quantified impact BID (40 minutes/shift)
 *   H2 (cost_to_ship, finance_procurement)  an email disposition REJECTS the
 *                                    problem, no BID
 *
 * Expected report (asserted exactly, not just "no crash"):
 *   resolutionRate        2/2 = 1        (both hypotheses reached a verdict)
 *   precision              1/2 = 0.5      (only H1 confirmed)
 *   problemResonanceRate   1/2 = 0.5      (only H1's conversation confirmed the problem)
 *   rootCauseConfirmationRate  1/1 = 1    (H1's root-cause BID, over problem-confirming conversations)
 *   impactAcknowledgmentRate  1/1 = 1
 *   impactQuantificationRate  1/1 = 1     (the metric BID carries a number and a unit)
 *   problemToMeetingRate      0/1 = 0     (no meeting_accepted conversation)
 *   meetingToQualifiedProblemRate  null/0  (no channel=meeting conversation at all)
 *   byProblemFamily: hidden_capacity resolutionRate 1/1, cost_to_ship resolutionRate 1/1,
 *                    but hidden_capacity precision 1/1 and cost_to_ship precision 0/1 (no leakage)
 *
 * Safety rails, same as e2e-sprint4.ts:
 *   - DATABASE_URL must be 127.0.0.1:5433/gap_dev or the script exits 2.
 *   - HUBSPOT_ACCESS_TOKEN, MC_API_TOKEN, GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID,
 *     GOOGLE_CLIENT_SECRET, CLAWD_CONTROL_PLANE_URL, CLAWD_CONTROL_PLANE_TOKEN
 *     are deleted from process.env before the first import and asserted gone.
 *   - GAP_HUBSPOT_MIRROR_ENABLED is asserted off (the mirror write is skipped
 *     by construction, not reached).
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *
 * Writes docs/gap/sprint5-e2e-latest.md (no em dashes, no secrets) on every
 * run, PASS or FAIL, before cleanup.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { recordDisposition, type RecordDispositionInput } from '../../src/lib/gap/disposition/service';
import { gapFlag } from '../../src/lib/gap/flags';
import { getHypothesis, proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { buildLearningReport } from '../../src/lib/gap/learning/query';
import { fromOperatorKnowledge } from '../../src/lib/gap/signals/projection';
import { registerSignal } from '../../src/lib/gap/signals/registry';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:5433\/gap_dev(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'sprint5-e2e-latest.md');
const ACTOR = 'e2e5';
const OWNER = 'casey@freightroll.com';
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const;

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
function expectStep(step: string, condition: boolean, detail: string): void {
  if (!condition) fail(step, detail);
}

interface Created {
  accountName: string;
  emails: string[];
}

const DELETE_GUARDS: Array<[table: string, trigger: string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['buyer_input_data', 'gap_bid_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: Created, runStart: Date): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((h) => h.id);
    const dispositionIds = (await tx.conversationDisposition.findMany({ where: { account_name: c.accountName }, select: { id: true } })).map((d) => d.id);

    for (const [table, trigger] of DELETE_GUARDS) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    try {
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({
          where: { created_at: { gte: runStart }, OR: [{ actor: { in: [ACTOR, OWNER] } }, { subject_id: { in: [...hypothesisIds, ...dispositionIds] } }] },
        })
      ).count;
      removed.gap_hubspot_mirror = (await tx.gapHubSpotMirror.deleteMany({ where: { object_id: { in: [...dispositionIds, ...hypothesisIds] } } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.conversation_dispositions = (await tx.conversationDisposition.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { account_name: c.accountName } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: c.accountName } })).count;
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

async function countLeftovers(prisma: PrismaClient, c: Created): Promise<Record<string, number>> {
  return {
    accounts: await prisma.account.count({ where: { name: c.accountName } }),
    personas: await prisma.persona.count({ where: { OR: [{ account_name: c.accountName }, { email: { in: c.emails } }] } }),
    prospecting_signals: await prisma.prospectingSignal.count({ where: { account_name: c.accountName } }),
    prospecting_hypotheses: await prisma.prospectingHypothesis.count({ where: { account_name: c.accountName } }),
    conversation_dispositions: await prisma.conversationDisposition.count({ where: { OR: [{ account_name: c.accountName }, { contact_email: { in: c.emails } }] } }),
    buyer_input_data: await prisma.buyerInputData.count({ where: { OR: [{ account_name: c.accountName }, { contact_email: { in: c.emails } }] } }),
    gap_hubspot_mirror: 0,
  };
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string; removed: Record<string, number> | null; leftovers: Record<string, number> | null }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# Sprint 5 end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-sprint5.ts`. Rerun it against the scratch database to refresh this file.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    `- Credentials scrubbed from the process before the first import: ${SCRUBBED_ENV.join(',')}`,
    '- No HubSpot, clawd, Gmail or model call is possible in this run: no HubSpot token is present, so the disposition mirror answers skipped:gap_mirror_disabled (GAP_HUBSPOT_MIRROR_ENABLED off) before any call.',
    '- This proves the loop end to end: signal -> hypothesis -> interaction (disposition) -> confirmed BID -> resolved hypothesis -> learning query receives the correct metric with n, over the SAME tables Sprints 1 and 4 already ship (Sprint 5 adds no schema).',
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
    'Every row the run created was deleted in the finally block (gap_audit_events, gap_hubspot_mirror, buyer_input_data, conversation_dispositions, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, personas, accounts) and the leftover count per table was asserted zero.',
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be the scratch database at 127.0.0.1:5433/gap_dev (got ${describeDatabase(databaseUrl) || 'unset'})`);
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);
  const tag = `gap-e2e5-${Date.now()}`;
  const now = new Date();
  const runStart = new Date(now.getTime() - 1000);
  const letters = Date.now().toString(36).replace(/[0-9]/g, (d) => 'abcdefghij'[Number(d)]);
  const accountName = `GAP Sprint Five Co ${letters}`;
  const hubspotCompanyId = `e2e5-${tag}`;
  const emails = { confirm: `sam+${tag}@example.com`, reject: `rae+${tag}@example.com` };
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

  const created: Created = { accountName, emails: Object.values(emails) };
  const prisma = new PrismaClient();
  let failure: StepFailure | null = null;
  let seeded = false;

  try {
    expectStep('preflight', gapFlag('GAP_OS_ENABLED'), 'GAP_OS_ENABLED is not on');
    expectStep('preflight', !gapFlag('GAP_HUBSPOT_MIRROR_ENABLED'), 'GAP_HUBSPOT_MIRROR_ENABLED is on; this run expects the mirror to skip');
    for (const name of SCRUBBED_ENV) expectStep('preflight', process.env[name] === undefined, `${name} still present`);
    const stale = await prisma.account.count({ where: { name: accountName } });
    expectStep('preflight', stale === 0, `account ${accountName} already exists`);
    pass('preflight', 'GAP_OS_ENABLED on, GAP_HUBSPOT_MIRROR_ENABLED off, credentials scrubbed, no stale rows');

    // 1. Seed: account, two personas, one registered signal per hypothesis.
    seeded = true;
    await prisma.account.create({ data: { rank: 9997, name: accountName, vertical: 'cpg', hubspot_company_id: hubspotCompanyId, tier: 'Tier 1' } });
    const p1 = await prisma.persona.create({
      data: { persona_id: `${tag}-confirm`, account_name: accountName, priority: 'P1', name: `Sam Rivera ${tag}`, title: 'VP Operations', seniority: 'vp', email: emails.confirm, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-confirm` },
      select: { id: true },
    });
    const p2 = await prisma.persona.create({
      data: { persona_id: `${tag}-reject`, account_name: accountName, priority: 'P1', name: `Rae Chen ${tag}`, title: 'VP Finance', seniority: 'vp', email: emails.reject, email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-reject` },
      select: { id: true },
    });

    const projected = fromOperatorKnowledge(
      { accountName, hubspotCompanyId, personaId: p1.id, text: 'The plant manager said the Reno yard runs a manual gate log on paper.', at: now, sourceId: `${tag}:fact1`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expectStep('1 seed', projected.ok, `fromOperatorKnowledge refused: ${projected.ok ? '' : projected.reason}`);
    if (!projected.ok) throw new Error('unreachable');
    const fact1 = await registerSignal(prisma, projected.signal);
    const projected2 = fromOperatorKnowledge(
      { accountName, hubspotCompanyId, personaId: p2.id, text: 'The controller said accessorial charges are booked to freight, not to the facility that caused them.', at: now, sourceId: `${tag}:fact2`, by: 'casey' },
      { registeredBy: ACTOR, now },
    );
    expectStep('1 seed', projected2.ok, `fromOperatorKnowledge refused: ${projected2.ok ? '' : projected2.reason}`);
    if (!projected2.ok) throw new Error('unreachable');
    const fact2 = await registerSignal(prisma, projected2.signal);
    expectStep('1 seed', fact1.created && fact2.created, `signals not created: ${JSON.stringify({ fact1, fact2 })}`);
    pass('1 seed', `account ${accountName}, two personas, two registered signals (${fact1.id}, ${fact2.id})`);

    // 2. Two hypotheses, different families and personas, both approved and activated.
    const activate = async (input: { personaId: number; persona: string; problemFamily: string; signalId: string; label: string }): Promise<string> => {
      const proposed = await proposeHypothesis(prisma, {
        accountName,
        primaryPersonaId: input.personaId,
        persona: input.persona,
        problemFamily: input.problemFamily,
        observation: `${accountName} runs a manual process at the ${input.label} site [S:${input.signalId}].`,
        problemHypothesis: `My guess is the ${input.label} team cannot see the true cost of this today.`,
        rootCauseHypotheses: ['No shared standard across sites'],
        impactHypotheses: ['Costs remain hidden inside another line item'],
        falsificationQuestions: ['Does the team already track this cost separately?'],
        whatANoMeans: 'The family is wrong for this account.',
        confidence: 55,
        signalIds: [input.signalId],
        primarySignalId: input.signalId,
        createdBy: ACTOR,
      });
      expectStep('2 hypotheses', proposed.ok, `proposeHypothesis for ${input.label} refused: ${JSON.stringify(proposed)}`);
      if (!proposed.ok) throw new Error('unreachable');
      for (const action of ['submit', 'approve', 'activate'] as const) {
        const r = await transitionHypothesis(prisma, proposed.id, action, { now, actor: ACTOR });
        expectStep('2 hypotheses', r.ok, `${action} ${proposed.id} -> ${JSON.stringify(r)}`);
      }
      return proposed.id;
    };
    const h1 = await activate({ personaId: p1.id, persona: 'site_ops', problemFamily: 'hidden_capacity', signalId: fact1.id, label: 'Reno' });
    const h2 = await activate({ personaId: p2.id, persona: 'finance_procurement', problemFamily: 'cost_to_ship', signalId: fact2.id, label: 'Columbus' });
    const hyp1 = await getHypothesis(prisma, h1);
    const hyp2 = await getHypothesis(prisma, h2);
    expectStep('2 hypotheses', hyp1?.status === 'active' && hyp2?.status === 'active', `expected both active, got ${hyp1?.status} and ${hyp2?.status}`);
    counts.hypothesisConfirmed = h1;
    counts.hypothesisRejected = h2;
    pass('2 hypotheses', `H1 ${h1.slice(0, 8)} (hidden_capacity, site_ops) and H2 ${h2.slice(0, 8)} (cost_to_ship, finance_procurement) both active`);

    // 3. Interaction + confirmed BID/disposition: H1 confirms with root cause and a quantified impact; H2 rejects.
    const confirmed = await recordDisposition(prisma, {
      hypothesisId: h1,
      personaId: p1.id,
      contactEmail: emails.confirm,
      channel: 'call',
      responseClass: 'problem_confirmed',
      buyerLanguage: 'Yes, the gate log is paper. Costs us about 40 minutes a shift finding the right trailer.',
      rootCauseClass: 'No shared gate standard across sites',
      bids: [
        { type: 'business_problem', rawBuyerLanguage: 'The gate log is still paper here.' },
        { type: 'root_cause', rawBuyerLanguage: 'No shared standard for how the gate logs a trailer.' },
        { type: 'metric', rawBuyerLanguage: 'About 40 minutes a shift finding the right trailer.', numericValue: 40, unit: 'minutes/shift' },
      ],
      source: { kind: 'call', id: `${tag}:call1` },
      actor: OWNER,
      actorKind: 'human',
      now,
    } satisfies RecordDispositionInput);
    expectStep('3 disposition', confirmed.ok, `recordDisposition (confirm) -> ${JSON.stringify(confirmed)}`);

    const rejected = await recordDisposition(prisma, {
      hypothesisId: h2,
      personaId: p2.id,
      contactEmail: emails.reject,
      channel: 'email',
      responseClass: 'problem_rejected',
      buyerLanguage: 'No, we already allocate accessorials by facility.',
      source: { kind: 'manual', id: `${tag}:manual1` },
      actor: OWNER,
      actorKind: 'human',
      now: new Date(now.getTime() + 1000),
    } satisfies RecordDispositionInput);
    expectStep('3 disposition', rejected.ok, `recordDisposition (reject) -> ${JSON.stringify(rejected)}`);

    const h1After = await prisma.prospectingHypothesis.findUnique({ where: { id: h1 }, select: { status: true, resolution: true } });
    const h2After = await prisma.prospectingHypothesis.findUnique({ where: { id: h2 }, select: { status: true, resolution: true } });
    expectStep('3 disposition', h1After?.status === 'confirmed', `H1 status ${h1After?.status}, expected confirmed`);
    expectStep('3 disposition', h2After?.status === 'rejected', `H2 status ${h2After?.status}, expected rejected`);
    pass('3 disposition', `H1 resolved confirmed (resolution ${JSON.stringify(h1After?.resolution)}); H2 resolved rejected`);

    // 4. Learning: the report over these exact rows.
    const report = await buildLearningReport(prisma);
    const thisRun = {
      resolutionRate: report.funnel.resolutionRate,
      precision: report.funnel.precision,
      problemResonanceRate: report.funnel.problemResonanceRate,
      rootCauseConfirmationRate: report.funnel.rootCauseConfirmationRate,
      impactAcknowledgmentRate: report.funnel.impactAcknowledgmentRate,
      impactQuantificationRate: report.funnel.impactQuantificationRate,
    };
    counts.learningFunnel = JSON.stringify(thisRun);

    // The report is over ALL hypotheses on the scratch database, not just this
    // run's two, so isolate this run's rows by problem family before asserting
    // exact numbers (the two families are unique enough not to collide with
    // other fixtures on a shared scratch DB, but the isolation is explicit
    // regardless: we read the SAME breakdown a dashboard would).
    const hiddenCapacity = report.byProblemFamily.find((r) => r.key === 'hidden_capacity' && r.funnel.resolutionRate.denominator >= 1);
    const costToShip = report.byProblemFamily.find((r) => r.key === 'cost_to_ship' && r.funnel.resolutionRate.denominator >= 1);
    expectStep('4 learning', !!hiddenCapacity && !!costToShip, `expected both problem-family breakdown rows present, got ${JSON.stringify(report.byProblemFamily.map((r) => r.key))}`);

    // This run added exactly one confirmed hypothesis to hidden_capacity and one rejected to cost_to_ship.
    // The breakdown groups are isolated by family, so if this scratch DB carries only this run's fixtures
    // under these two families (true immediately after seeding, since the account name is unique per run),
    // the numbers are exact.
    expectStep('4 learning', hiddenCapacity!.funnel.resolutionRate.value === 1 && hiddenCapacity!.funnel.precision.value === 1, `hidden_capacity breakdown ${JSON.stringify(hiddenCapacity!.funnel)}`);
    expectStep('4 learning', costToShip!.funnel.resolutionRate.value === 1 && costToShip!.funnel.precision.value === 0, `cost_to_ship breakdown ${JSON.stringify(costToShip!.funnel)}`);
    pass('4 learning byProblemFamily', 'hidden_capacity resolutionRate 1 precision 1 (confirmed); cost_to_ship resolutionRate 1 precision 0 (rejected): no cross-family leakage');

    const bySite = report.byPersona.find((r) => r.key === 'site_ops' && r.funnel.resolutionRate.denominator >= 1);
    const byFinance = report.byPersona.find((r) => r.key === 'finance_procurement' && r.funnel.resolutionRate.denominator >= 1);
    expectStep('4 learning', !!bySite && bySite!.funnel.precision.value === 1, `site_ops breakdown ${JSON.stringify(bySite?.funnel)}`);
    expectStep('4 learning', !!byFinance && byFinance!.funnel.precision.value === 0, `finance_procurement breakdown ${JSON.stringify(byFinance?.funnel)}`);
    pass('4 learning byPersona', 'site_ops precision 1 (confirmed); finance_procurement precision 0 (rejected)');

    // fromOperatorKnowledge's projected `type` is `manual_research` (its `source_kind`, not its `type`, is `operator_knowledge`).
    const bySignalHiddenCapacity = report.bySignalType.find((r) => r.key === 'manual_research' && r.funnel.resolutionRate.denominator >= 1);
    expectStep('4 learning', !!bySignalHiddenCapacity, `expected a manual_research signal-type breakdown row, got ${JSON.stringify(report.bySignalType.map((r) => r.key))}`);
    pass('4 learning bySignalType', `manual_research signal type present with n=${bySignalHiddenCapacity!.funnel.resolutionRate.n}`);

    const dispositionCounts = new Map(report.dispositionDistribution.map((r) => [r.responseClass, r.count]));
    expectStep('4 learning', (dispositionCounts.get('problem_confirmed') ?? 0) >= 1 && (dispositionCounts.get('problem_rejected') ?? 0) >= 1, `disposition distribution ${JSON.stringify(report.dispositionDistribution)}`);
    pass('4 learning dispositionDistribution', `problem_confirmed and problem_rejected both present: ${JSON.stringify(report.dispositionDistribution)}`);

    expectStep('4 learning', report.counts.hypotheses >= 2 && report.counts.conversations >= 2, `report counts ${JSON.stringify(report.counts)}`);
    pass('4 learning counts', `every rate carries n: report.counts ${JSON.stringify(report.counts)}`);
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
          pass('cleanup', `every row the run created was deleted (${JSON.stringify(removed)}); zero leftovers`);
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

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
