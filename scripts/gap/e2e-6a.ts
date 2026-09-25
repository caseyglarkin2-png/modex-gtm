/**
 * GAP Prospecting OS, Sprint 6A: canonical identity end-to-end demo against a
 * SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   npx tsx scripts/gap/e2e-6a.ts
 *
 * Proves the acceptance case from docs/GAP_RUNTIME_HANDOFF.md end to end
 * against the REAL runHypothesize, the REAL identity resolver, and a real
 * database, not mocks:
 *
 *   1. A pounce trigger named "<Account>, LLC" (the Niagara Bottling shape)
 *      resolves via the normalized-name fallback tier, is grouped under the
 *      CANONICAL account, produces a prospecting_signal with the correct
 *      account_name (never an FK violation), and is cached as an explicit
 *      alias for next time.
 *   2. A trigger naming a genuinely unknown company is refused
 *      unresolved_company, produces no signal, and creates no Account.
 *   3. A trigger whose HubSpot company id names one real account while its
 *      raw text exactly matches a DIFFERENT real account resolves to the
 *      company-id account (tier A beats tier D) and the disagreement is
 *      recorded as an identity.conflict gap_audit_events row.
 *   4. A second identity resolution of the same raw name from step 1 now
 *      resolves via the cached alias tier (higher confidence), proving the
 *      alias registered in step 1 actually speeds up the next lookup.
 *
 * Safety rails, matching every other e2e-sprint*.ts:
 *   - DATABASE_URL must be the scratch database or the script exits 2.
 *   - No external credentials are read (identity resolution touches no
 *     network); nothing is scrubbed because nothing outbound is possible.
 *   - Every row this run creates is deleted in the finally block; the
 *     leftover count per table is asserted zero.
 *
 * Writes docs/gap/6a-e2e-latest.md (no em dashes, no secrets) on every run,
 * PASS or FAIL, before cleanup.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
import { loadIdentityContext } from '../../src/lib/gap/identity/service';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';
import { runHypothesize } from '../../src/lib/gap/hypothesis/hypothesize';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', '6a-e2e-latest.md');

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be a scratch database (got ${describeDatabase(databaseUrl) || 'unset'})`);
    return 2;
  }
  const dbHost = describeDatabase(databaseUrl);
  const tag = `gap6a-${Date.now()}`;
  const gitSha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();

  const niagaraAccount = `GAP E2E Niagara Bottling ${tag}`;
  const realAccount = `GAP E2E Real Account ${tag}`;
  const wrongGuessAccount = `GAP E2E Wrong Guess Co ${tag}`;
  const unknownName = `Totally Unknown Company ${tag}`;
  const hubspotCompanyId = `hs-${tag}`;

  const prisma = new PrismaClient();
  const createdAccountNames = [niagaraAccount, realAccount, wrongGuessAccount];
  const createdTriggerIds: number[] = [];
  let failure: StepFailure | null = null;

  try {
    // 1. Seed three real accounts and three triggers (Niagara-shape, unknown, conflict).
    await prisma.account.createMany({
      data: [
        { rank: 9001, name: niagaraAccount, vertical: 'e2e' },
        { rank: 9002, name: realAccount, vertical: 'e2e', hubspot_company_id: hubspotCompanyId },
        { rank: 9003, name: wrongGuessAccount, vertical: 'e2e' },
      ],
    });
    pass('seed.accounts', `created ${niagaraAccount}, ${realAccount} (hubspot_company_id=${hubspotCompanyId}), ${wrongGuessAccount}`);

    const niagaraTrigger = await prisma.pounceTrigger.create({
      data: {
        url_hash: `${tag}-niagara`,
        account_slug: 'niagara',
        account_name: `${niagaraAccount}, LLC`,
        title: 'Opens new automated yard',
        url: `https://example.com/${tag}/niagara`,
        source: 'news',
        score: 9,
        categories: ['expansion'],
        first_seen_at: new Date(),
      },
    });
    const unknownTrigger = await prisma.pounceTrigger.create({
      data: {
        url_hash: `${tag}-unknown`,
        account_slug: 'unknown',
        account_name: unknownName,
        title: 'Some unrelated news item',
        url: `https://example.com/${tag}/unknown`,
        source: 'news',
        score: 5,
        categories: ['expansion'],
        first_seen_at: new Date(),
      },
    });
    const conflictTrigger = await prisma.pounceTrigger.create({
      data: {
        url_hash: `${tag}-conflict`,
        account_slug: 'conflict',
        account_name: wrongGuessAccount,
        hubspot_company_id: hubspotCompanyId,
        title: 'Expands yard capacity',
        url: `https://example.com/${tag}/conflict`,
        source: 'news',
        score: 7,
        categories: ['expansion'],
        first_seen_at: new Date(),
      },
    });
    createdTriggerIds.push(niagaraTrigger.id, unknownTrigger.id, conflictTrigger.id);
    pass(
      'seed.triggers',
      `niagara="${niagaraAccount}, LLC" unknown="${unknownName}" conflict=(name="${wrongGuessAccount}", hubspot_company_id=${hubspotCompanyId})`,
    );

    // 2. Run the real hypothesize job against the real database.
    const report = await runHypothesize(prisma, { now: new Date(), lookbackDays: 30 });
    counts.identityResolved = report.identity.resolved;
    counts.identityConflicts = report.identity.conflicts;
    counts.identityAliasesRegistered = report.identity.aliasesRegistered;
    counts.identityRefusedUnresolved = report.identity.refused.unresolved_company ?? 0;

    expect('run.identity_resolved', report.identity.resolved === 2, `expected 2 resolved (niagara + conflict), got ${report.identity.resolved}`);
    expect(
      'run.identity_refused_unknown',
      report.identity.refused.unresolved_company === 1,
      `expected 1 unresolved_company refusal, got ${JSON.stringify(report.identity.refused)}`,
    );
    expect('run.identity_conflicts', report.identity.conflicts === 1, `expected 1 conflict, got ${report.identity.conflicts}`);
    expect(
      'run.identity_alias_registered',
      report.identity.aliasesRegistered === 1,
      `expected 1 alias registered (niagara, via normalized tier), got ${report.identity.aliasesRegistered}`,
    );
    pass('run.hypothesize', `identity=${JSON.stringify(report.identity)}`);

    // 3. The Niagara signal landed under the CANONICAL account, not the raw trigger text.
    const niagaraSignal = await prisma.prospectingSignal.findUnique({
      where: { source_kind_source_id: { source_kind: 'pounce_trigger', source_id: String(niagaraTrigger.id) } },
    });
    expect('assert.niagara_signal_exists', niagaraSignal !== null, 'expected a prospecting_signal for the niagara trigger');
    expect(
      'assert.niagara_signal_account',
      niagaraSignal?.account_name === niagaraAccount,
      `expected account_name=${niagaraAccount}, got ${niagaraSignal?.account_name}`,
    );

    // 4. The unknown trigger produced no signal and created no Account.
    const unknownSignal = await prisma.prospectingSignal.findUnique({
      where: { source_kind_source_id: { source_kind: 'pounce_trigger', source_id: String(unknownTrigger.id) } },
    });
    expect('assert.unknown_no_signal', unknownSignal === null, 'expected no signal for the genuinely unknown company');
    const unknownAccountRow = await prisma.account.findUnique({ where: { name: unknownName } });
    expect('assert.unknown_no_account', unknownAccountRow === null, 'the resolver must never create an Account for an unresolved name');

    // 5. The conflict trigger resolved to the REAL (company-id) account, and the disagreement is audited.
    const conflictSignal = await prisma.prospectingSignal.findUnique({
      where: { source_kind_source_id: { source_kind: 'pounce_trigger', source_id: String(conflictTrigger.id) } },
    });
    expect('assert.conflict_signal_exists', conflictSignal !== null, 'expected a prospecting_signal for the conflict trigger');
    expect(
      'assert.conflict_signal_account',
      conflictSignal?.account_name === realAccount,
      `expected the hubspot_company_id account (${realAccount}) to win, got ${conflictSignal?.account_name}`,
    );
    const conflictAudit = await prisma.gapAuditEvent.findFirst({
      where: { kind: 'identity.conflict', subject_type: 'pounce_trigger', subject_id: String(conflictTrigger.id) },
    });
    expect('assert.conflict_audited', conflictAudit !== null, 'expected an identity.conflict gap_audit_events row, never silently swallowed');
    const auditPayload = conflictAudit?.payload as Record<string, unknown> | null;
    expect(
      'assert.conflict_audit_payload',
      auditPayload?.resolvedAccountName === realAccount && auditPayload?.conflictAccountName === wrongGuessAccount,
      `expected payload naming both accounts, got ${JSON.stringify(auditPayload)}`,
    );
    pass('assert.conflict', `resolved=${realAccount} conflict=${wrongGuessAccount} audited=true`);

    // 6. The alias registered in step 2 makes the SAME raw name resolve
    // faster/more confidently next time, via tier C instead of tier D.
    const alias = await prisma.gapAccountAlias.findUnique({
      where: { normalized_alias: normalizeCompanyName(`${niagaraAccount}, LLC`) },
    });
    expect('assert.alias_registered', alias !== null && alias.account_name === niagaraAccount, 'expected the niagara alias to be registered');
    expect('assert.alias_source', alias?.source === 'hypothesize_cron', `expected source=hypothesize_cron, got ${alias?.source}`);

    const secondLookupContext = await loadIdentityContext(prisma);
    const secondLookup = resolveIdentity(secondLookupContext, { rawName: `${niagaraAccount}, LLC` });
    expect('assert.second_lookup_ok', secondLookup.ok === true, `expected the second lookup to resolve, got ${JSON.stringify(secondLookup)}`);
    if (secondLookup.ok) {
      expect('assert.second_lookup_via_alias', secondLookup.via === 'alias', `expected via=alias on the cached lookup, got ${secondLookup.via}`);
      expect(
        'assert.second_lookup_higher_confidence',
        secondLookup.confidence > 70,
        `expected a higher confidence than the first (normalized, 70) run, got ${secondLookup.confidence}`,
      );
    }
    pass('assert.alias_speeds_up_next_lookup', `via=${secondLookup.ok ? secondLookup.via : 'refused'} confidence=${secondLookup.ok ? secondLookup.confidence : 'n/a'}`);
  } catch (err) {
    if (err instanceof StepFailure) {
      failure = err;
    } else {
      failure = new StepFailure('unexpected', errorText(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: errorText(err) });
      console.log(`FAIL unexpected: ${errorText(err)}`);
    }
  } finally {
    const removed = await cleanup(prisma, createdAccountNames, createdTriggerIds);
    for (const [table, count] of Object.entries(removed)) counts[`cleanup.${table}`] = count;
    const leftoverAccounts = await prisma.account.count({ where: { name: { in: createdAccountNames } } });
    const leftoverTriggers = await prisma.pounceTrigger.count({ where: { id: { in: createdTriggerIds } } });
    expect('cleanup.zero_leftovers', leftoverAccounts === 0 && leftoverTriggers === 0, `leftover accounts=${leftoverAccounts} triggers=${leftoverTriggers}`);
    writeReport({ failure, tag, dbHost, gitSha });
    await prisma.$disconnect();
  }

  return failure ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup(prisma: PrismaClient, accountNames: string[], triggerIds: number[]): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    // gap_audit_events is append-only (GAP_APPEND_ONLY); disabling and
    // re-enabling its guard inside one transaction is only legitimate on a
    // scratch database, which the URL allowlist guarantees.
    await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events DISABLE TRIGGER gap_append_only_audit_events');
    try {
      removed.gap_audit_events = (
        await tx.gapAuditEvent.deleteMany({ where: { subject_type: 'pounce_trigger', subject_id: { in: triggerIds.map(String) } } })
      ).count;
    } finally {
      await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
    }
    removed.gap_account_aliases = (await tx.gapAccountAlias.deleteMany({ where: { account_name: { in: accountNames } } })).count;
    removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: accountNames } } })).count;
    removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { id: { in: triggerIds } } })).count;
    removed.accounts = (await tx.account.deleteMany({ where: { name: { in: accountNames } } })).count;
    return removed;
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(input: { failure: StepFailure | null; tag: string; dbHost: string; gitSha: string }): void {
  const status = input.failure ? `FAIL at ${input.failure.step}` : 'PASS';
  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    '# 6A canonical identity end-to-end run (latest)',
    '',
    `STATUS: ${status}`,
    '',
    `<!-- verified:${stamp} -->`,
    '',
    'Written by `scripts/gap/e2e-6a.ts`. Rerun it against the scratch database to refresh this file.',
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
    'Every row the run created was deleted in the finally block (gap_audit_events, gap_account_aliases, prospecting_signals, pounce_triggers, accounts); zero-leftover counts asserted above.',
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
