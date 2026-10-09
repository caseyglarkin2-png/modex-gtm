/**
 * C54: the generated-usefulness evaluation over the frozen reference set, written to docs/gap/QUALITY_EVAL.md.
 *
 *   npx tsx scripts/gap/quality-eval.ts --mocked                       the harness over a scripted generator (no model, no cost)
 *   npx tsx scripts/gap/quality-eval.ts --live                         the real metered model route (needs AI_GATEWAY_API_KEY and Casey's go)
 *   [--out docs/gap/QUALITY_EVAL.md]
 *
 * The ledger is in memory (tests/unit/gap/fixtures/ledger-db.ts): no database, no production rows. A live run spends
 * against the gateway key in the environment and reports the cost; it is never run without authorization.
 */
import { writeFileSync } from 'node:fs';
import { evaluateQuality, renderQualityEval, QUALITY_CHECKS } from '../../src/lib/gap/evaluation/quality-eval';
import { REFERENCE_SET, REFERENCE_SET_VERSION } from '../../tests/unit/gap/fixtures/reference-set';
import { ledgerDb } from '../../tests/unit/gap/fixtures/ledger-db';
import { mockedGenerator } from '../../tests/unit/gap/fixtures/mocked-angle-generator';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const flag = (name: string) => process.argv.includes(name);

async function main() {
  const live = flag('--live');
  if (!live && !flag('--mocked')) throw new Error('say --mocked (the harness check) or --live (the metered model route, with authorization)');
  if (live && !process.env.AI_GATEWAY_API_KEY?.trim()) throw new Error('--live needs AI_GATEWAY_API_KEY in the environment (never printed); none is set');
  const now = new Date();
  const db = ledgerDb({ accounts: [...new Set(REFERENCE_SET.map((c) => c.account?.name).filter((x): x is string => !!x))], personas: REFERENCE_SET.filter((c) => c.person && c.account).map((c, n) => ({ id: n + 1, email: c.person!.email, name: c.person!.name, title: c.person!.title, account_name: c.account!.name, do_not_contact: false })) }, now);
  const report = await evaluateQuality(REFERENCE_SET, { now, referenceVersion: REFERENCE_SET_VERSION, prisma: db.client(), ...(live ? {} : { generate: mockedGenerator(REFERENCE_SET) }) });
  const out = arg('--out') ?? 'docs/gap/QUALITY_EVAL.md';
  writeFileSync(out, renderQualityEval(report), 'utf8');
  const failures = QUALITY_CHECKS.reduce((n, k) => n + report.checks[k].failures.length, 0);
  console.log(`wrote ${out} (${report.mode}): ${report.sampleSize.outputs} outputs over ${report.sampleSize.cases} cases; ${failures} failure(s); cost $${report.cost.usd.toFixed(4)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
