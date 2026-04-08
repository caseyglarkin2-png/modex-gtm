#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  buildFacilityFactMap,
  detectFacilityCountSource,
  normalizeAccountKey,
  resolveFacilityCountLabel,
  type FacilityFactRecord,
} from '../src/lib/research/facility-counts';

interface AccountRecord {
  name: string;
  rank?: number;
  priority_band?: string;
  tier?: string;
  priority_score?: number;
  facility_count?: string;
  icp_fit?: number;
}

const ROOT = path.resolve(__dirname, '..');
const ACCOUNTS_JSON = path.join(ROOT, 'src/lib/data/accounts.json');
const FACILITY_FACTS_JSON = path.join(ROOT, 'src/lib/data/facility-facts.json');
const FLAGSHIP_ACCOUNTS = ['Dannon', 'General Mills', 'Frito-Lay', 'AB InBev', 'Coca-Cola'];
const DEFAULT_LIMIT = 20;
const SUPPLEMENTAL_ACCOUNTS: AccountRecord[] = [
  {
    name: 'AB InBev',
    priority_band: 'Flagship',
    tier: 'Flagship',
    facility_count: '100+',
    rank: 999,
    priority_score: 0,
    icp_fit: 5,
  },
  {
    name: 'Coca-Cola',
    priority_band: 'Flagship',
    tier: 'Flagship',
    facility_count: '70+',
    rank: 999,
    priority_score: 0,
    icp_fit: 5,
  },
];

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const accounts = mergeAccounts(loadJson<AccountRecord[]>(ACCOUNTS_JSON));
  const facilityFacts = loadJson<FacilityFactRecord[]>(FACILITY_FACTS_JSON);
  const factMap = buildFacilityFactMap(facilityFacts);

  const selectedAccounts = selectAccounts(accounts, args.onlyFlagships, args.limit);
  const missing = selectedAccounts.filter((account) => !factMap.has(normalizeAccountKey(account.name)));
  const verified = selectedAccounts.length - missing.length;

  console.log(`Facility fact coverage: ${verified}/${selectedAccounts.length}`);

  if (missing.length > 0) {
    console.log('');
    console.log('Missing dedicated facility facts:');

    for (const account of missing) {
      const currentCount = resolveFacilityCountLabel({
        accountName: account.name,
        accountFacilityCount: account.facility_count,
        icpFit: account.icp_fit,
      });
      const currentSource = detectFacilityCountSource({
        accountName: account.name,
        accountFacilityCount: account.facility_count,
        icpFit: account.icp_fit,
      });

      console.log(
        `- ${account.name} | ${account.priority_band ?? 'N/A'} / ${account.tier ?? 'N/A'} | current=${currentCount} | source=${currentSource}`,
      );
    }
  }

  if (args.strict && missing.length > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { limit: number; strict: boolean; onlyFlagships: boolean } {
  let limit = DEFAULT_LIMIT;
  let strict = false;
  let onlyFlagships = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--limit' && argv[index + 1]) {
      limit = Number.parseInt(argv[index + 1], 10) || DEFAULT_LIMIT;
      index += 1;
      continue;
    }

    if (argument === '--strict') {
      strict = true;
      continue;
    }

    if (argument === '--flagships') {
      onlyFlagships = true;
    }
  }

  return { limit, strict, onlyFlagships };
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function selectAccounts(accounts: AccountRecord[], onlyFlagships: boolean, limit: number): AccountRecord[] {
  const filtered = onlyFlagships
    ? accounts.filter((account) => FLAGSHIP_ACCOUNTS.includes(account.name))
    : accounts;

  return [...filtered]
    .sort((left, right) => {
      const rankDiff = (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
      if (rankDiff !== 0) return rankDiff;

      const scoreDiff = (right.priority_score ?? 0) - (left.priority_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

function mergeAccounts(accounts: AccountRecord[]): AccountRecord[] {
  const byKey = new Map(accounts.map((account) => [normalizeAccountKey(account.name), account]));

  for (const account of SUPPLEMENTAL_ACCOUNTS) {
    const key = normalizeAccountKey(account.name);
    if (!byKey.has(key)) {
      byKey.set(key, account);
    }
  }

  return Array.from(byKey.values());
}

main();