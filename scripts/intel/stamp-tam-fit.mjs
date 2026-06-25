// Derive + stamp a normalized fit score (yardflow_fit_score, 0-100, on the
// discovery scale) for every TAM='in' account from tam_tier + tam_segment, so
// the whole TAM is rankable on the same axis as the corridor-scored accounts.
// Does NOT touch composite (that's proximity-led; geocoding follow-on) and does
// NOT overwrite a fit already set from the corridor run.
//   node scripts/intel/stamp-tam-fit.mjs --dry-run   # distribution, no writes
//   node scripts/intel/stamp-tam-fit.mjs             # live batch stamp
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }
const dryRun = process.argv.includes('--dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { companies } = JSON.parse(readFileSync(new URL('../../output/intel/tam-scoring.json', import.meta.url), 'utf8'));

// fit components on the discovery 0-25 scale.
// scale + network from tam_tier (facility_count isn't populated, tier is the proxy).
const TIER = { A: { scale: 23, network: 22 }, B: { scale: 17, network: 16 }, C: { scale: 11, network: 10 } };
// vertical from tam_segment, weighted by yard-intensity (all TAM segments are relevant).
const SEG_VERTICAL = {
  '3pl_carrier': 25, cold_chain: 25, ports_intermodal: 25, ecommerce_parcel: 24,
  cpg_food_beverage: 23, retail_grocery: 22, wholesale_distribution: 22,
  building_materials_industrial: 22, paper_packaging: 22, chemicals_plastics: 22,
  automotive_heavy_mfg: 22, agriculture_food_processing: 22,
};
function deriveFit(tier, segment) {
  const t = TIER[tier] ?? TIER.C;
  const v = SEG_VERTICAL[segment] ?? 19;
  return Math.round(((v + t.scale + t.network) / 75) * 100 * 10) / 10; // 0-100, 1dp
}

const has = (x) => x != null && x !== '';
const today = new Date().toISOString().slice(0, 10);
const targets = [];
for (const c of companies) {
  if (has(c.yardflow_fit_score)) continue; // keep the corridor-real fit
  if (!has(c.tam_tier) && !has(c.tam_segment)) continue;
  targets.push({ id: c.id, fit: deriveFit(c.tam_tier, c.tam_segment), tier: c.tam_tier, seg: c.tam_segment });
}

const dist = {};
for (const t of targets) { const b = Math.floor(t.fit / 10) * 10; dist[b] = (dist[b] || 0) + 1; }
console.log(`TAM accounts: ${companies.length} | already have fit: ${companies.filter((c) => has(c.yardflow_fit_score)).length} | to stamp: ${targets.length}`);
console.log('derived-fit distribution (by 10s):', JSON.stringify(Object.fromEntries(Object.entries(dist).sort((a, b) => b[0] - a[0]))));
console.log('samples:', targets.slice(0, 5).map((t) => `${t.fit}[${t.tier}/${t.seg}]`).join(', '));

if (dryRun) { console.log(`\n=== DRY RUN: would stamp yardflow_fit_score on ${targets.length} TAM accounts ===`); process.exit(0); }

let done = 0, failed = 0;
for (let i = 0; i < targets.length; i += 100) {
  const inputs = targets.slice(i, i + 100).map((t) => ({ id: t.id, properties: { yardflow_fit_score: String(t.fit), yardflow_score_at: today } }));
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs }),
  });
  if (res.ok) { done += inputs.length; if ((i / 100) % 10 === 0) process.stderr.write(`  ${done}/${targets.length}\n`); }
  else if (res.status === 429) { await sleep(2000); i -= 100; }
  else { failed += inputs.length; process.stderr.write(`  batch ${i / 100} FAILED ${res.status}: ${(await res.text()).slice(0, 140)}\n`); }
  await sleep(150);
}
console.log(`\n=== DONE: stamped fit on ${done} TAM accounts, ${failed} failed ===`);
