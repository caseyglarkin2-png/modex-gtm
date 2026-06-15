// scripts/intel/tam-geo/stamp-pending.ts  (Node, private-app token)
import fs from 'node:fs';
import path from 'node:path';
import { byStatus, append } from './ledger';
const ROOT = process.cwd();
const TOKEN = (fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const hs = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'intel', 'hubspot-companies.json'), 'utf8'));
const idByDomain = new Map<string, string>(); for (const c of hs.companies) if (c.domain) idByDomain.set(c.domain.toLowerCase(), c.id);
const today = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes('--dry-run');
const inputs: Array<{ id: string; properties: Record<string, string> }> = [];
const skip: string[] = [];
for (const r of byStatus('scored')) {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'intel', 'tam-geo', 'scores', `${r.slug}.json`), 'utf8'));
  const id = r.domain ? idByDomain.get(r.domain) : undefined;
  if (!id) { skip.push(r.slug); continue; }
  const p: Record<string, string> = { yardflow_proximity_score: String(s.proximity_score), yardflow_corridor_density: String(s.corridor_density), yardflow_yard_facilities: String(s.facilities), yardflow_score_at: today };
  if (s.composite_score != null) p.yardflow_composite_score = String(s.composite_score);
  if (s.nearest_distance_mi >= 0) p.yardflow_nearest_primo_mi = String(s.nearest_distance_mi);
  if (s.nearest_primo_site) p.yardflow_nearest_primo_site = s.nearest_primo_site;
  inputs.push({ id, properties: p });
}
console.log(`to stamp: ${inputs.length} | no-domain-match skip: ${skip.length}`);
if (dry) process.exit(0);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
(async () => {
  for (let i = 0; i < inputs.length; i += 100) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: inputs.slice(i, i + 100) }) });
    if (!res.ok) { console.error('batch failed', res.status, (await res.text()).slice(0, 140)); continue; }
    await sleep(200);
  }
  for (const r of byStatus('scored')) if (r.domain && idByDomain.get(r.domain)) append({ ...r, status: 'stamped' });
  console.log('stamped.');
})();
