import fs from 'node:fs';
import path from 'node:path';

const reportPath = path.resolve('test-results/onepager-proof-report.json');

if (!fs.existsSync(reportPath)) {
  console.error(`Missing Playwright report at ${reportPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(reportPath, 'utf8');
const report = JSON.parse(raw);
const stats = report.stats ?? {};

const expected = Number(stats.expected ?? stats.total ?? 0);
const unexpected = Number(stats.unexpected ?? 0);
const flaky = Number(stats.flaky ?? 0);
const passed = Number(stats.passed ?? (expected - unexpected - flaky));
const skipped = Number(stats.skipped ?? 0);

if (expected <= 0) {
  console.error('Proof suite did not schedule any tests.');
  process.exit(1);
}

if (skipped > 0) {
  console.error(`Proof suite skipped ${skipped} test(s). Skips are not allowed.`);
  process.exit(1);
}

if (passed <= 0) {
  console.error('Proof suite did not pass any tests.');
  process.exit(1);
}

console.log(`Proof suite validated: expected=${expected}, passed=${passed}, skipped=${skipped}`);
