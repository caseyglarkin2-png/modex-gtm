import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '../../src/lib/hubspot/client';
import { searchCompanyByDomain, searchCompanyByName } from '../../src/lib/hubspot/companies';
import { assertExternalWriteAllowed } from '../../src/lib/enrichment/external-write-guard';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Types ────────────────────────────────────────────────────────────────

interface ScoredProspect {
  name: string;
  domain?: string;
  vertical?: string;
  why?: string;
  estimatedRevenue?: string;
  estimatedFacilities?: number;
  icpScore: number;
  tier: string;
  isExistingAccount: boolean;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  knownLocations?: { name: string; city: string; state: string; lat: number; lng: number }[];
}

interface ScoredProspectsFile {
  scoredAt: string;
  prospects: ScoredProspect[];
}

interface PushResult {
  name: string;
  domain?: string;
  icpScore: number;
  tier: string;
  action: 'created' | 'updated' | 'skipped';
  hubspotId?: string;
  error?: string;
}

// ── Vertical → HubSpot industry mapping ─────────────────────────────────
// HubSpot uses a fixed set of industry values; map our verticals to the closest match.

const VERTICAL_TO_INDUSTRY: Record<string, string> = {
  'Food & Beverage': 'FOOD_PRODUCTION',
  'Food & Beverage / Dairy': 'FOOD_PRODUCTION',
  'Food & Beverage / Restaurant': 'RESTAURANTS',
  'Agriculture / Food': 'FARMING',
  'Retail / Grocery': 'RETAIL',
  'Retail / Apparel': 'RETAIL',
  'Retail / Discount': 'RETAIL',
  'Retail / C-Store': 'RETAIL',
  'Retail / C-Store / Dairy': 'RETAIL',
  'Distribution / Grocery': 'FOOD_PRODUCTION',
  'Distribution / Industrial Supply': 'WHOLESALE',
  '3PL / Logistics': 'LOGISTICS_AND_SUPPLY_CHAIN',
  '3PL / Fleet': 'LOGISTICS_AND_SUPPLY_CHAIN',
  'Cold Storage / 3PL': 'LOGISTICS_AND_SUPPLY_CHAIN',
  'Freight / Logistics': 'LOGISTICS_AND_SUPPLY_CHAIN',
  'Freight / LTL': 'LOGISTICS_AND_SUPPLY_CHAIN',
  'Fleet / Logistics': 'LOGISTICS_AND_SUPPLY_CHAIN',
  'Manufacturing': 'INDUSTRIAL_AUTOMATION',
  'Manufacturing / Packaging': 'PACKAGING_AND_CONTAINERS',
  'Manufacturing / Steel': 'MINING_AND_METALS',
  'Manufacturing / Semiconductor': 'SEMICONDUCTORS',
  'Manufacturing / Furniture': 'FURNITURE',
  'Manufacturing / Heavy Equipment': 'MACHINERY',
  'Manufacturing / Automotive': 'AUTOMOTIVE',
  'Manufacturing / Security': 'SECURITY_AND_INVESTIGATIONS',
  'Manufacturing / Paper': 'PAPER_AND_FOREST_PRODUCTS',
  'Chemical / Manufacturing': 'CHEMICALS',
  'Consumer Goods': 'CONSUMER_GOODS',
  'Consumer Goods / Manufacturing': 'CONSUMER_GOODS',
  'Pharmaceutical / Manufacturing': 'PHARMACEUTICALS',
  'Pharmaceutical / Consumer Health': 'PHARMACEUTICALS',
  'Energy / Industrial': 'OIL_AND_ENERGY',
  'Energy / Midstream': 'OIL_AND_ENERGY',
  'Aerospace / Manufacturing': 'AVIATION_AND_AEROSPACE',
  'Waste Management': 'ENVIRONMENTAL_SERVICES',
  'Beverage': 'FOOD_PRODUCTION',
  'Electronics Distribution': 'ELECTRICAL_AND_ELECTRONIC_MANUFACTURING',
  'Food Distribution / Nonprofit': 'NONPROFIT_ORGANIZATION_MANAGEMENT',
};

function mapVerticalToIndustry(vertical: string | undefined): string {
  if (!vertical) return '';
  return VERTICAL_TO_INDUSTRY[vertical] ?? '';
}

// ── File discovery ──────────────────────────────────────────────────────

function findLatestScoredProspects(): string {
  const dir = join(ROOT, 'output', 'prospect-discovery');
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('scored-prospects-') && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(
      `No scored-prospects-*.json files found in ${dir}. ` +
      'Run the scoring pipeline first.',
    );
  }
  return join(dir, files[files.length - 1]);
}

// ── CLI args ────────────────────────────────────────────────────────────

function parseArgs(): { dryRun: boolean; minScore: number; file?: string } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let minScore = 50;
  let file: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--min-score' && args[i + 1]) {
      minScore = parseInt(args[++i], 10);
      if (isNaN(minScore)) {
        process.stderr.write('Error: --min-score must be a number\n');
        process.exit(1);
      }
    } else if (args[i] === '--file' && args[i + 1]) {
      file = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: npx tsx scripts/prospect-discovery/push-to-hubspot.ts [options]

Options:
  --dry-run          Preview what would be created without writing to HubSpot
  --min-score <n>    Minimum ICP score to push (default: 50 = Tier A + B)
  --file <path>      Path to scored-prospects JSON (default: latest in output/)
  --help             Show this help`);
      process.exit(0);
    }
  }

  return { dryRun, minScore, file };
}

// ── Main ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const opts = parseArgs();

  const filePath = opts.file ?? findLatestScoredProspects();
  process.stderr.write(`Reading scored prospects from: ${filePath}\n`);

  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as ScoredProspectsFile;
  const eligible = raw.prospects.filter(
    (p) => p.icpScore >= opts.minScore && !p.isExistingAccount,
  );

  process.stderr.write(`Total prospects in file: ${raw.prospects.length}\n`);
  process.stderr.write(`Eligible (score >= ${opts.minScore}, not existing): ${eligible.length}\n\n`);

  if (eligible.length === 0) {
    console.log('No eligible prospects to push.');
    return;
  }

  if (opts.dryRun) {
    console.log('=== DRY RUN — No HubSpot writes ===\n');
    for (const p of eligible) {
      const city = p.city ?? p.knownLocations?.[0]?.city ?? '';
      const state = p.state ?? p.knownLocations?.[0]?.state ?? '';
      const location = [city, state].filter(Boolean).join(', ');
      console.log(
        `  [${p.tier}] ${p.name} (score: ${p.icpScore})` +
        `${location ? ` — ${location}` : ''}` +
        `${p.domain ? ` — ${p.domain}` : ''}`,
      );
    }
    console.log(`\nWould push ${eligible.length} companies to HubSpot.`);
    return;
  }

  if (!isHubSpotConfigured()) {
    process.stderr.write('Error: HUBSPOT_ACCESS_TOKEN not set. Cannot push to HubSpot.\n');
    process.exit(1);
  }

  assertExternalWriteAllowed('hubspot', 'push-to-hubspot');
  const client = getHubSpotClient();

  const results: PushResult[] = [];

  for (let i = 0; i < eligible.length; i++) {
    const p = eligible[i];
    process.stderr.write(`[${i + 1}/${eligible.length}] ${p.name}...`);

    const result: PushResult = {
      name: p.name,
      domain: p.domain,
      icpScore: p.icpScore,
      tier: p.tier,
      action: 'skipped',
    };

    try {
      const existing = p.domain
        ? await searchCompanyByDomain(p.domain)
        : await searchCompanyByName(p.name);

      const city = p.city ?? p.knownLocations?.[0]?.city ?? '';
      const state = p.state ?? p.knownLocations?.[0]?.state ?? '';
      const industry = mapVerticalToIndustry(p.vertical);

      const properties: Record<string, string> = {
        name: p.name,
        ...(p.domain && { domain: p.domain }),
        ...(city && { city }),
        ...(state && { state }),
        ...(industry && { industry }),
        ...(p.why && { description: p.why }),
        yardflow_icp_score: String(p.icpScore),
      };

      if (existing) {
        await withHubSpotRetry(
          () => client.crm.companies.basicApi.update(existing.id, { properties }),
          `updateCompany(${existing.id}:${p.name})`,
        );
        result.action = 'updated';
        result.hubspotId = existing.id;
        process.stderr.write(` updated (${existing.id})\n`);
      } else {
        const created = await withHubSpotRetry(
          () => client.crm.companies.basicApi.create({ properties, associations: [] }),
          `createCompany(${p.name})`,
        );
        result.action = 'created';
        result.hubspotId = created.id;
        process.stderr.write(` created (${created.id})\n`);
      }
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
      process.stderr.write(` ERROR: ${result.error}\n`);
    }

    results.push(result);

    // Rate-limit courtesy: 100ms between calls
    if (i < eligible.length - 1) await sleep(100);
  }

  const created = results.filter((r) => r.action === 'created');
  const updated = results.filter((r) => r.action === 'updated');
  const errored = results.filter((r) => r.error);

  console.log('\n=== Push Complete ===');
  console.log(`Created: ${created.length}`);
  console.log(`Updated: ${updated.length}`);
  console.log(`Errors:  ${errored.length}`);

  if (errored.length > 0) {
    console.log('\nFailed:');
    for (const r of errored) {
      console.log(`  ${r.name}: ${r.error}`);
    }
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
