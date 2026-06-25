// scripts/intel/tam-geo/run.ts — orchestrator + progress/cost report
import { execFileSync } from 'node:child_process';
import { load, type Status } from './ledger';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const phase = arg('phase') ?? 'status';
const limit = arg('limit');

const SCRIPTS: Record<string, string> = {
  seed: 'scripts/intel/tam-geo/seed-ledger.ts',
  discover: 'scripts/intel/tam-geo/discover-batch.ts',
  geocode: 'scripts/intel/tam-geo/geocode-pending.ts',
  score: 'scripts/intel/tam-geo/score-pending.ts',
  stamp: 'scripts/intel/tam-geo/stamp-pending.ts',
};

const ORDER: Status[] = ['pending', 'roster', 'geocoded', 'scored', 'stamped', 'error'];

function status(): void {
  const rows = [...load().values()];
  const counts: Record<string, number> = {};
  for (const st of ORDER) counts[st] = 0;
  let facilities = 0;
  for (const r of rows) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    facilities += r.facilities ?? 0;
  }
  const cost = (facilities * 5) / 1000;
  console.log(`tam-geo ledger: ${rows.length} accounts`);
  for (const st of ORDER) console.log(`  ${st.padEnd(9)} ${counts[st]}`);
  console.log(`facilities so far: ${facilities} | est. geocode cost: $${cost.toFixed(2)} ($5/1k)`);
}

if (phase === 'status') {
  status();
} else if (SCRIPTS[phase]) {
  const args = ['tsx', SCRIPTS[phase]];
  if (limit) args.push(`--limit=${limit}`);
  execFileSync('npx', args, { stdio: 'inherit' });
} else {
  console.error(`unknown phase: ${phase} (use status|seed|discover|geocode|score|stamp)`);
  process.exit(1);
}
