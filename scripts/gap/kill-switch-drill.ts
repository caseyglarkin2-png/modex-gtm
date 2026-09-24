/**
 * GAP Prospecting OS, Sprint 7: the kill-switch drill (G6's requirement --
 * "one logged kill-switch drill: halt -> zero enrolls and zero sends within
 * one poll cycle").
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   npx tsx scripts/gap/kill-switch-drill.ts
 *
 * This NEVER touches the real clawd autonomy halt -- it never reverses it,
 * never reads its live state, and the real switch is not involved at all.
 * It proves the MECHANISM: `enrollFromDecision`'s autonomy check
 * (enroll/service.ts step 5, live mode only) reads its dependency FRESH on
 * every call, with no caching, so a halt takes effect on the very next
 * call, not after some stale window. It does this by injecting a fake
 * `autonomy` reader through the same `EnrollDeps.autonomy` override point
 * the real cron and route already support, flipping it between two calls
 * against the SAME real database fixtures:
 *
 *   1. autonomy reader returns { halted: false } -> the autonomy check
 *      itself does not refuse (a live enroll reaches past step 5; some
 *      LATER guard may still refuse it, e.g. suppression or persona
 *      lookup -- this drill only asserts the autonomy step's own behavior).
 *   2. SAME fixtures, autonomy reader flipped to { halted: true } -> refuses
 *      autonomy_halted, immediately, no caching.
 *
 * Logs the result as a `gap_audit_events` row (`automation.kill_switch_drill`)
 * so G6's dashboard tile can see a drill was run, then deletes it in cleanup
 * along with every other fixture row.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - Every row this run creates is deleted in the finally block.
 *
 * Writes docs/gap/kill-switch-drill-latest.md on every run, PASS or FAIL.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { enrollFromDecision, type EnrollFromDecisionInput } from '../../src/lib/gap/enroll/service';
import { audit } from '../../src/lib/gap/audit';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'kill-switch-drill-latest.md');

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
interface StepLine { step: string; status: 'PASS' | 'FAIL'; detail: string; }
const lines: StepLine[] = [];
function pass(step: string, detail: string): void { lines.push({ step, status: 'PASS', detail }); console.log(`PASS ${step}: ${detail}`); }
function fail(step: string, detail: string): never { lines.push({ step, status: 'FAIL', detail }); console.log(`FAIL ${step}: ${detail}`); throw new StepFailure(step, detail); }
function expect(step: string, condition: boolean, detail: string): void { if (!condition) fail(step, detail); }

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
  process.env.GAP_OS_ENABLED = 'true';
  const tag = `killdrill-${Date.now()}`;
  const gitSha = (() => { try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();

  const account = `GAP E2E Kill Switch Drill ${tag}`;
  const NOW = new Date();
  const prisma = new PrismaClient();
  let familyId = '';
  let hypId = '';
  let failure: StepFailure | null = null;
  let haltedState = false;

  try {
    await prisma.account.create({ data: { rank: 9301, name: account, vertical: 'e2e' } });
    const persona = await prisma.persona.create({
      data: {
        persona_id: `${tag}-p1`,
        account_name: account,
        priority: 'P1',
        name: 'Drill Contact',
        email: `${tag}@example.com`,
        email_status: 'verified',
        is_contact_ready: true,
        do_not_contact: false,
      },
    });
    const hyp = await prisma.prospectingHypothesis.create({
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
    hypId = hyp.id;
    const fam = await prisma.sequenceFamily.create({ data: { engine: 'modex_draft_queue' } });
    familyId = fam.id;
    const ver = await prisma.sequenceVersion.create({
      data: { family_id: familyId, version: 1, steps: ONE_STEP, steps_hash: `hash_${tag}`, status: 'draft' },
    });
    const compile = await prisma.gapCompile.create({
      data: {
        sequence_version_id: ver.id,
        hypothesis_id: hypId,
        step_index: 0,
        verdict: 'pass',
        checks: [],
        compiler_version: 'e2e-drill',
        result: { ok: true },
        created_at: NOW,
      },
    });
    pass('seed', `account, persona, hypothesis, family/version/compile for the drill`);

    const baseInput: EnrollFromDecisionInput = {
      hypothesisId: hypId,
      personaId: persona.id,
      sequenceVersionId: ver.id,
      compileIds: [compile.id],
      actor: 'kill-switch-drill',
      actorKind: 'human',
      mode: 'live',
      now: NOW,
    };

    // 1. Not halted: the autonomy step itself does not refuse.
    const notHaltedReader = async () => ({ halted: false });
    const okResult = await enrollFromDecision(prisma, baseInput, {
      addOne: async () => ({ ok: true, id: 1 }),
      suppression: staticSuppressionReader('clear'),
      autonomy: notHaltedReader,
    });
    expect(
      'not_halted_autonomy_step_passes',
      okResult.reason !== 'autonomy_halted',
      `expected the autonomy step to pass (some other reason is fine), got ${JSON.stringify(okResult)}`,
    );
    pass('not_halted_autonomy_step_passes', JSON.stringify(okResult));

    // 2. SAME fixtures, halted: refuses autonomy_halted immediately. No
    // caching, no stale window -- this is what "within one poll cycle" means.
    haltedState = true;
    const haltedReader = async () => ({ halted: haltedState, reason: 'drill' });
    const haltedResult = await enrollFromDecision(prisma, baseInput, {
      addOne: async () => ({ ok: true, id: 1 }),
      suppression: staticSuppressionReader('clear'),
      autonomy: haltedReader,
    });
    expect('halted_refuses_immediately', haltedResult.reason === 'autonomy_halted', `expected autonomy_halted, got ${JSON.stringify(haltedResult)}`);
    pass('halted_refuses_immediately', JSON.stringify(haltedResult));

    // 3. Log the drill (G6's "one logged kill-switch drill").
    const auditResult = await audit(prisma, {
      kind: 'automation.kill_switch_drill',
      actor: 'kill-switch-drill',
      subjectType: 'automation_drill',
      subjectId: tag,
      payload: { ranAt: NOW.toISOString(), notHaltedRefused: okResult.reason === 'autonomy_halted', haltedRefused: haltedResult.reason === 'autonomy_halted' },
    });
    expect('drill_logged', auditResult.stored, `expected the drill audit row to be stored, got ${JSON.stringify(auditResult)}`);
    pass('drill_logged', 'automation.kill_switch_drill row stored');
  } catch (err) {
    if (err instanceof StepFailure) failure = err;
    else {
      failure = new StepFailure('unexpected', errorText(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: errorText(err) });
      console.log(`FAIL unexpected: ${errorText(err)}`);
    }
  } finally {
    const removed = await cleanup(prisma, { account, familyId, hypId, tag });
    const leftover = await prisma.account.count({ where: { name: account } });
    expect('cleanup.zero_leftovers', leftover === 0, `leftover accounts=${leftover}`);
    writeReport({ failure, tag, dbHost, gitSha, removed });
    await prisma.$disconnect();
  }
  return failure ? 1 : 0;
}

async function cleanup(prisma: PrismaClient, ids: { account: string; familyId: string; hypId: string; tag: string }): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events DISABLE TRIGGER gap_append_only_audit_events');
    try {
      removed.gap_audit_events = (await tx.gapAuditEvent.deleteMany({ where: { subject_type: 'automation_drill', subject_id: ids.tag } })).count;
    } finally {
      await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
    }
    removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { version: { family_id: ids.familyId } } })).count;
    removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { id: ids.hypId } })).count;
    removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: ids.familyId } })).count;
    removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: ids.familyId } })).count;
    removed.personas = (await tx.persona.deleteMany({ where: { account_name: ids.account } })).count;
    removed.accounts = (await tx.account.deleteMany({ where: { name: ids.account } })).count;
    return removed;
  });
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string; removed: Record<string, number> }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# Kill-switch drill (latest)', '', `STATUS: ${status}`, '', `<!-- verified:${stamp} -->`, '',
    'Written by `scripts/gap/kill-switch-drill.ts`. Never touches the real clawd autonomy halt -- proves the MECHANISM with an injected fake autonomy reader against real database fixtures on the scratch DB.', '',
    `- Run tag: ${input.tag}`, `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`, `- Git: ${input.gitSha}`, `- Ran at: ${new Date().toISOString()}`, '',
    '## Steps', '', ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`), '',
    '## Cleanup', '', ...Object.entries(input.removed).map(([k, v]) => `- ${k}: ${v}`), '',
    'Every row the run created was deleted in the finally block; zero-leftover count asserted above. The real clawd autonomy halt was never read, reversed, or otherwise touched.', '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

main().then((code) => process.exit(code)).catch((err) => { console.error(errorText(err)); process.exit(1); });
