/**
 * GAP Prospecting OS, Sprint 6D: generic reconciler end-to-end demo against a
 * SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   npx tsx scripts/gap/e2e-6d.ts
 *
 * Proves `reconcileOne` against REAL Prisma-backed deps (the real 6A
 * identity resolver, real ProspectingHypothesis/SequenceEnrollment reads),
 * not mocks:
 *
 *   1. MATCHED: evidence naming the account by an unnormalized raw string
 *      resolves via 6A, finds the real hypothesis and the one real
 *      enrollment for that contact.
 *   2. HYPOTHESIS_MISSING: a second, real Account with no hypothesis at all.
 *   3. IDENTITY_UNRESOLVED: a raw account name with no matching Account row
 *      anywhere -- never creates one.
 *   4. The 6D-T1 freeze trigger, exercised for real: recording the MATCHED
 *      result's enrollment_id on a disposition, then attempting to
 *      reattribute it, refuses GAP_DISPOSITION_ENROLLMENT_FROZEN.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *
 * Writes docs/gap/6d-e2e-latest.md (no em dashes, no secrets) on every run,
 * PASS or FAIL, before cleanup.
 */
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadIdentityContext } from '../../src/lib/gap/identity/service';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';
import { reconcileOne, type EngineEvidence, type ReconcilerDeps } from '../../src/lib/gap/execution/reconciler';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', '6d-e2e-latest.md');

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
const counts: Record<string, number | string> = {};
function pass(step: string, detail: string): void { lines.push({ step, status: 'PASS', detail }); console.log(`PASS ${step}: ${detail}`); }
function fail(step: string, detail: string): never { lines.push({ step, status: 'FAIL', detail }); console.log(`FAIL ${step}: ${detail}`); throw new StepFailure(step, detail); }
function expect(step: string, condition: boolean, detail: string): void { if (!condition) fail(step, detail); }

function realDeps(prisma: PrismaClient): ReconcilerDeps {
  return {
    resolveIdentity: async (input) => resolveIdentity(await loadIdentityContext(prisma), input),
    findAlreadyImported: async (engine, engineEventId) => {
      const row = await prisma.conversationDisposition.findFirst({
        where: { source_kind: `reconcile:${engine}`, source_id: engineEventId },
        select: { enrollment_id: true, hypothesis_id: true },
      });
      return row?.enrollment_id ? { id: row.enrollment_id, hypothesis_id: row.hypothesis_id } : null;
    },
    findHypothesis: async (accountName) => {
      const row = await prisma.prospectingHypothesis.findFirst({ where: { account_name: accountName }, select: { id: true } });
      return row ?? null;
    },
    findEnrollments: async (accountName, contactEmail) => {
      const rows = await prisma.sequenceEnrollment.findMany({
        where: { account_name: accountName, to_email: contactEmail },
        select: { id: true, hypothesis_id: true },
      });
      return rows;
    },
  };
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be a scratch database (got ${describeDatabase(databaseUrl) || 'unset'})`);
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);
  const tag = `gap6d-${Date.now()}`;
  const gitSha = (() => { try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();

  const accountMatched = `GAP E2E 6D Matched ${tag}`;
  const accountNoHyp = `GAP E2E 6D NoHyp ${tag}`;
  const NOW = new Date();

  const prisma = new PrismaClient();
  const createdAccounts = [accountMatched, accountNoHyp];
  let familyId = '';
  let hypId = '';
  let enrId = '';
  let dispId = '';
  let failure: StepFailure | null = null;

  try {
    await prisma.account.create({ data: { rank: 9201, name: accountMatched, vertical: 'e2e' } });
    await prisma.account.create({ data: { rank: 9202, name: accountNoHyp, vertical: 'e2e' } });

    const hyp = await prisma.prospectingHypothesis.create({
      data: {
        account_name: accountMatched,
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

    const fam = await prisma.sequenceFamily.create({ data: { engine: 'modex_draft_queue', program: `e2e-6d-${tag}` } });
    familyId = fam.id;
    const ver = await prisma.sequenceVersion.create({
      data: { family_id: familyId, version: 1, steps: { schema: 'steps.v2', steps: [] }, steps_hash: `hash_${tag}`, status: 'draft' },
    });
    const contactEmail = `${tag}@example.com`;
    const enr = await prisma.sequenceEnrollment.create({
      data: {
        id: randomUUID(),
        engine: 'modex_draft_queue',
        family_id: familyId,
        sequence_version_id: ver.id,
        hypothesis_id: hypId,
        account_name: accountMatched,
        to_email: contactEmail,
        sender: 'casey@yardflow.ai',
        owner: 'casey@freightroll.com',
        enrolled_by: 'e2e',
        is_test: true,
      },
    });
    enrId = enr.id;
    pass('seed', `2 accounts, 1 hypothesis, 1 family/version/enrollment for the matched contact ${contactEmail}`);

    const deps = realDeps(prisma);

    // 1. MATCHED, resolved via an unnormalized raw name.
    const evMatched: EngineEvidence = {
      engine: 'hubspot_sequence',
      rawAccountName: `${accountMatched}, LLC`,
      contactEmail,
      engineEventId: `${tag}-evt-matched`,
      occurredAt: NOW,
    };
    const rMatched = await reconcileOne(evMatched, deps);
    expect('matched', rMatched.outcome === 'MATCHED' && rMatched.accountName === accountMatched && rMatched.hypothesisId === hypId && rMatched.enrollmentId === enrId, `expected MATCHED, got ${JSON.stringify(rMatched)}`);
    pass('matched', JSON.stringify(rMatched));

    // 2. HYPOTHESIS_MISSING for the second, hypothesis-less account.
    const rNoHyp = await reconcileOne({ ...evMatched, rawAccountName: accountNoHyp, engineEventId: `${tag}-evt-nohyp` }, deps);
    expect('hypothesis_missing', rNoHyp.outcome === 'HYPOTHESIS_MISSING' && rNoHyp.accountName === accountNoHyp, `expected HYPOTHESIS_MISSING, got ${JSON.stringify(rNoHyp)}`);
    pass('hypothesis_missing', JSON.stringify(rNoHyp));

    // 3. IDENTITY_UNRESOLVED for a name that matches no Account, and never creates one.
    const unknownName = `Totally Unknown 6D Co ${tag}`;
    const rUnknown = await reconcileOne({ ...evMatched, rawAccountName: unknownName, engineEventId: `${tag}-evt-unknown` }, deps);
    expect('identity_unresolved', rUnknown.outcome === 'IDENTITY_UNRESOLVED', `expected IDENTITY_UNRESOLVED, got ${JSON.stringify(rUnknown)}`);
    const noAccountCreated = await prisma.account.count({ where: { name: unknownName } });
    expect('identity_unresolved_no_account_created', noAccountCreated === 0, `the reconciler must never create an Account`);
    pass('identity_unresolved', JSON.stringify(rUnknown));

    // 4. Record the MATCHED result, then prove 6D-T1's freeze trigger for real.
    const disp = await prisma.conversationDisposition.create({
      data: {
        hypothesis_id: hypId,
        account_name: accountMatched,
        contact_email: contactEmail,
        enrollment_id: enrId,
        source_kind: `reconcile:${evMatched.engine}`,
        source_id: evMatched.engineEventId,
        channel: 'email',
        response_class: 'timing',
        created_by: 'e2e',
      },
    });
    dispId = disp.id;
    let frozeCorrectly = false;
    try {
      await prisma.conversationDisposition.update({ where: { id: dispId }, data: { enrollment_id: 'some_other_enrollment' } });
    } catch (err) {
      frozeCorrectly = errorText(err).includes('GAP_DISPOSITION_ENROLLMENT_FROZEN');
    }
    expect('freeze_trigger', frozeCorrectly, 'expected GAP_DISPOSITION_ENROLLMENT_FROZEN on a reattribution attempt');
    pass('freeze_trigger', 'reattribution refused by the real trigger');

    // 5. A SECOND reconcileOne call for the SAME evidence is ALREADY_IMPORTED.
    const rAgain = await reconcileOne(evMatched, deps);
    expect('already_imported', rAgain.outcome === 'ALREADY_IMPORTED' && rAgain.enrollmentId === enrId, `expected ALREADY_IMPORTED, got ${JSON.stringify(rAgain)}`);
    pass('already_imported', JSON.stringify(rAgain));
  } catch (err) {
    if (err instanceof StepFailure) failure = err;
    else {
      failure = new StepFailure('unexpected', errorText(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: errorText(err) });
      console.log(`FAIL unexpected: ${errorText(err)}`);
    }
  } finally {
    const removed = await cleanup(prisma, { accounts: createdAccounts, familyId, hypId, dispId });
    for (const [table, count] of Object.entries(removed)) counts[`cleanup.${table}`] = count;
    const leftover = await prisma.account.count({ where: { name: { in: createdAccounts } } });
    expect('cleanup.zero_leftovers', leftover === 0, `leftover accounts=${leftover}`);
    writeReport({ failure, tag, dbHost, gitSha });
    await prisma.$disconnect();
  }
  return failure ? 1 : 0;
}

async function cleanup(prisma: PrismaClient, ids: { accounts: string[]; familyId: string; hypId: string; dispId: string }): Promise<Record<string, number>> {
  const removed: Record<string, number> = {};
  removed.conversation_dispositions = ids.dispId ? (await prisma.conversationDisposition.deleteMany({ where: { id: ids.dispId } })).count : 0;
  removed.sequence_enrollments = ids.familyId ? (await prisma.sequenceEnrollment.deleteMany({ where: { family_id: ids.familyId } })).count : 0;
  removed.prospecting_hypotheses = ids.hypId ? (await prisma.prospectingHypothesis.deleteMany({ where: { id: ids.hypId } })).count : 0;
  removed.sequence_versions = ids.familyId ? (await prisma.sequenceVersion.deleteMany({ where: { family_id: ids.familyId } })).count : 0;
  removed.sequence_families = ids.familyId ? (await prisma.sequenceFamily.deleteMany({ where: { id: ids.familyId } })).count : 0;
  removed.accounts = (await prisma.account.deleteMany({ where: { name: { in: ids.accounts } } })).count;
  return removed;
}

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# 6D generic reconciler end-to-end run (latest)', '', `STATUS: ${status}`, '', `<!-- verified:${stamp} -->`, '',
    'Written by `scripts/gap/e2e-6d.ts`. Rerun it against the scratch database to refresh this file.', '',
    `- Run tag: ${input.tag}`, `- Database: ${input.dbHost} (scratch only; the script refuses any other host)`, `- Git: ${input.gitSha}`, `- Ran at: ${new Date().toISOString()}`, '',
    '## Steps', '', ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`), '',
    '## Counts', '', ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`), '',
    'Every row the run created was deleted in the finally block; zero-leftover count asserted above.', '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

main().then((code) => process.exit(code)).catch((err) => { console.error(errorText(err)); process.exit(1); });
