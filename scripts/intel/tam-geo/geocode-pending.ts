// scripts/intel/tam-geo/geocode-pending.ts
import { execFileSync } from 'node:child_process';
import { byStatus, append } from './ledger';

const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '50');
const todo = byStatus('roster').slice(0, limit);
console.log(`geocoding ${todo.length} rosters...`);
for (const r of todo) {
  try {
    execFileSync('npx', ['tsx', 'scripts/yard-audit/geocode-roster.ts', r.slug], { stdio: 'inherit' });
    append({ ...r, status: 'geocoded' });
  } catch (e) {
    append({ ...r, status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}
console.log('done geocoding batch');
