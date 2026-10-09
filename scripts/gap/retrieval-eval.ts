/**
 * C53: the retrieval evaluation over the frozen reference set, written to docs/gap/RETRIEVAL_EVAL.md.
 *
 *   npx tsx scripts/gap/retrieval-eval.ts [--out docs/gap/RETRIEVAL_EVAL.md]
 *
 * Sink adapters and the real assembler; no model, no network, no database. Exit code 1 when any class fails.
 */
import { writeFileSync } from 'node:fs';
import { evaluateRetrieval, renderRetrievalEval, EVAL_CLASSES } from '../../src/lib/gap/evaluation/retrieval-eval';
import { REFERENCE_SET, REFERENCE_SET_VERSION } from '../../tests/unit/gap/fixtures/reference-set';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };

async function main() {
  const report = await evaluateRetrieval(REFERENCE_SET, { now: new Date(), referenceVersion: REFERENCE_SET_VERSION });
  const out = arg('--out') ?? 'docs/gap/RETRIEVAL_EVAL.md';
  writeFileSync(out, renderRetrievalEval(report), 'utf8');
  const failures = EVAL_CLASSES.reduce((n, k) => n + report.classes[k].failures.length, 0);
  console.log(`wrote ${out}: ${report.sampleSize.runs} runs over ${report.sampleSize.cases} cases; ${failures} failure(s) across ${EVAL_CLASSES.length} classes`);
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
