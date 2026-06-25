/**
 * Stamp the full discovery-score set onto EXISTING HubSpot company records,
 * from the per-account snapshot (src/lib/intel/export/proximity-data.json).
 * Existing matches only — never creates a company (a create decision is
 * separate). Idempotent: re-running just refreshes the values.
 *
 *   npx tsx scripts/intel/stamp-company-scores.ts --dry-run   # match report, no writes
 *   npx tsx scripts/intel/stamp-company-scores.ts             # live update
 *
 * Match: by account_domain first (searchCompanyByDomain), then exact name
 * (searchCompanyByName). No match -> skipped (existing-only). Writes the 14
 * yardflow_* score properties created by scripts/intel/ensure-score-properties.mjs.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '../../src/lib/hubspot/client';
import { searchCompanyByDomain, searchCompanyByName } from '../../src/lib/hubspot/companies';
import { assertExternalWriteAllowed } from '../../src/lib/enrichment/external-write-guard';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SNAP = join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json');

interface YardAudit {
  facilities: number | null;
  truck_gated_pct: number | null;
  dock_doors: number | null;
  trailer_cap: number | null;
  top_archetype: string | null;
  recommended_entry: string | null;
}
interface Account {
  slug: string;
  account_name: string;
  account_domain: string | null;
  composite_score: number | null;
  proximity_score: number;
  fit_score: number | null;
  corridor_density: number | null;
  nearest_distance_mi: number;
  yard_audit: YardAudit | null;
  dossier_url: string | null;
}

const dryRun = process.argv.includes('--dry-run');
const snap = JSON.parse(readFileSync(SNAP, 'utf8')) as { generatedAt: string; accounts: Account[] };
const scoreAt = snap.generatedAt;

function buildProps(a: Account): Record<string, string> {
  const p: Record<string, string> = { yardflow_score_at: scoreAt };
  if (a.composite_score != null) p.yardflow_composite_score = String(a.composite_score);
  p.yardflow_proximity_score = String(a.proximity_score);
  if (a.fit_score != null) p.yardflow_fit_score = String(a.fit_score);
  if (a.corridor_density != null) p.yardflow_corridor_density = String(a.corridor_density);
  p.yardflow_nearest_primo_mi = String(a.nearest_distance_mi);
  if (a.dossier_url) p.yardflow_dossier_url = a.dossier_url;
  const y = a.yard_audit;
  if (y) {
    if (y.facilities != null) p.yardflow_yard_facilities = String(y.facilities);
    if (y.truck_gated_pct != null) p.yardflow_yard_gated_pct = String(y.truck_gated_pct);
    if (y.dock_doors != null) p.yardflow_yard_dock_doors = String(y.dock_doors);
    if (y.trailer_cap != null) p.yardflow_yard_trailer_cap = String(y.trailer_cap);
    if (y.top_archetype) p.yardflow_yard_archetype = y.top_archetype;
    if (y.recommended_entry) p.yardflow_yard_entry = y.recommended_entry;
  }
  return p;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main() {
  if (!isHubSpotConfigured()) {
    process.stderr.write('HUBSPOT_ACCESS_TOKEN not set\n');
    process.exit(1);
  }
  if (!dryRun) assertExternalWriteAllowed('hubspot', 'stamp-company-scores');
  const client = getHubSpotClient();

  let matched = 0, updated = 0, skipped = 0, errored = 0;
  const skips: string[] = [];

  for (let i = 0; i < snap.accounts.length; i++) {
    const a = snap.accounts[i];
    try {
      const company = a.account_domain
        ? (await searchCompanyByDomain(a.account_domain)) ?? (await searchCompanyByName(a.account_name))
        : await searchCompanyByName(a.account_name);
      if (!company) {
        skipped += 1;
        skips.push(`${a.account_name} (${a.account_domain ?? 'no domain'})`);
        continue;
      }
      matched += 1;
      const props = buildProps(a);
      if (dryRun) {
        process.stderr.write(`MATCH ${a.account_name} -> company ${company.id} (composite ${a.composite_score ?? 'prox-only'})\n`);
      } else {
        await withHubSpotRetry(
          () => client.crm.companies.basicApi.update(company.id, { properties: props }),
          `stampScores(${company.id}:${a.account_name})`,
        );
        updated += 1;
        process.stderr.write(`STAMPED ${a.account_name} -> ${company.id}\n`);
      }
    } catch (err) {
      errored += 1;
      process.stderr.write(`ERROR ${a.account_name}: ${err instanceof Error ? err.message : String(err)}\n`);
    }
    if (i < snap.accounts.length - 1) await sleep(120);
  }

  console.log(`\n=== ${dryRun ? 'DRY RUN' : 'STAMP'} complete (${snap.accounts.length} accounts) ===`);
  console.log(`matched: ${matched}`);
  if (!dryRun) console.log(`updated: ${updated}`);
  console.log(`skipped (no existing match): ${skipped}`);
  console.log(`errors: ${errored}`);
  if (skips.length) console.log(`\nno-match (need create or alias):\n  ${skips.join('\n  ')}`);
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
