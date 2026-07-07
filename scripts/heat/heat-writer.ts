/**
 * Account Heat Score — WRITER (GATED, NOT run by the dry-run loop).
 *
 * Reads the dry-run output (heat-score-ranked.json — but the real writer would
 * recompute over ALL TAM-in accounts, not just top 60) and writes two company
 * properties + refreshes the Hot Accounts list. It is a DOUBLE-GATED no-op unless
 * BOTH are set:
 *
 *     HEAT_WRITE_ENABLED=1   (env)   and   --apply   (argv)
 *
 * Neither is set by scripts/heat/heat-dry-run.ts, by tests, or by any cron here.
 * This file exists so the write path is designed + reviewable, NOT executed.
 *
 * Provisions (idempotent): `yardflow_heat` (number 0-100) and `yardflow_heat_tier`
 * (enum 1-4). Run (only when you intend to write, e.g. after reviewing the ranking):
 *     HEAT_WRITE_ENABLED=1 npx tsx scripts/heat/heat-writer.ts --apply
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const ENABLED = process.env.HEAT_WRITE_ENABLED === '1';

const ROOT = process.cwd(); // run from repo root
const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const GROUP = 'companyinformation';

/** Create the two heat properties if absent. Safe/idempotent (409 => exists). */
async function ensureHeatProperties(): Promise<void> {
  const props = [
    { name: 'yardflow_heat', label: 'YardFlow Heat', type: 'number', fieldType: 'number', groupName: GROUP },
    {
      name: 'yardflow_heat_tier', label: 'YardFlow Heat Tier', type: 'enumeration', fieldType: 'select', groupName: GROUP,
      options: [
        { label: 'Tier 1 — Live intent', value: '1', displayOrder: 0 },
        { label: 'Tier 2 — Engaged', value: '2', displayOrder: 1 },
        { label: 'Tier 3 — Qualified-cold', value: '3', displayOrder: 2 },
        { label: 'Tier 4 — Nurture', value: '4', displayOrder: 3 },
      ],
    },
  ];
  for (const p of props) {
    const res = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
      method: 'POST', headers: H, body: JSON.stringify(p),
    });
    if (res.ok) console.error(`created ${p.name}`);
    else {
      const t = await res.text();
      if (res.status === 409 || /already exists/i.test(t)) console.error(`exists  ${p.name}`);
      else console.error(`FAIL    ${p.name}: ${res.status} ${t.slice(0, 160)}`);
    }
  }
}

/** Batch-write yardflow_heat + yardflow_heat_tier (100/req). */
async function writeHeat(rows: Array<{ id: string; heat: number; tier: number }>): Promise<void> {
  for (let i = 0; i < rows.length; i += 100) {
    const inputs = rows.slice(i, i + 100).map((r) => ({
      id: r.id,
      properties: { yardflow_heat: String(r.heat), yardflow_heat_tier: String(r.tier) },
    }));
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
      method: 'POST', headers: H, body: JSON.stringify({ inputs }),
    });
    if (!res.ok) console.error('write fail', res.status, (await res.text()).slice(0, 160));
  }
}

async function main() {
  if (!ENABLED || !APPLY) {
    console.error('GATED NO-OP: set HEAT_WRITE_ENABLED=1 and pass --apply to write.');
    console.error(`  HEAT_WRITE_ENABLED=${process.env.HEAT_WRITE_ENABLED ?? '(unset)'}  --apply=${APPLY}`);
    console.error('  Would: (1) ensure yardflow_heat + yardflow_heat_tier properties,');
    console.error('         (2) batch-update every TAM-in company (id, heat, tier),');
    console.error('         (3) refresh the "Hot Accounts" active list to yardflow_heat_tier IN (1,2).');
    console.error('  TODO before first real write: recompute over ALL TAM-in accounts (not the top-60 file),');
    console.error('        and build the Hot-Accounts list filter in the HubSpot UI (list ids are UI-managed).');
    process.exit(0);
  }

  // --- REAL WRITE PATH (only reached when double-gated) ---
  const ranked = JSON.parse(
    readFileSync(
      'C:/Users/casey/AppData/Local/Temp/claude/C--Users-casey-Desktop/c28d1654-1631-4555-8b07-e8a8e651992f/scratchpad/heat-score-ranked.json',
      'utf8',
    ),
  );
  // NOTE: the ranked file is TOP-60 only. A production writer would re-run the
  // dry-run compute for the FULL TAM-in set and pass every account here. Left as
  // a top-60 write deliberately so an accidental --apply cannot touch 6,913 rows.
  const rows: Array<{ id: string; heat: number; tier: number }> = [];
  // The dry-run JSON doesn't carry company ids (kept out on purpose); a real
  // writer would join by domain/name or emit ids. Intentionally unresolved here.
  void ranked;
  console.error('ensuring properties…');
  await ensureHeatProperties();
  console.error(`writing ${rows.length} companies…`);
  await writeHeat(rows);
  console.error('done. (Hot Accounts list refresh is a UI step — see TODO.)');
}

main().catch((e) => { console.error(e); process.exit(1); });
