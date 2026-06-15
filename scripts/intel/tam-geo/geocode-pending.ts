// scripts/intel/tam-geo/geocode-pending.ts
import { execSync } from 'node:child_process';
import { byStatus, append } from './ledger';

const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '50');
// Geocode rosters not yet geocoded, and retry any that errored (a transient
// geocode/spawn failure should not strand an account).
const todo = [...byStatus('roster'), ...byStatus('error')].slice(0, limit);
console.log(`geocoding ${todo.length} rosters...`);
for (const r of todo) {
  try {
    // execSync (shell) not execFileSync('npx') — on Windows npx is npx.cmd and
    // a bare-name execFileSync spawn fails (ENOENT), erroring every account.
    execSync(`npx tsx scripts/yard-audit/geocode-roster.ts ${r.slug}`, { stdio: 'inherit' });
    append({ ...r, status: 'geocoded', error: undefined });
  } catch (e) {
    append({ ...r, status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}
console.log('done geocoding batch');
