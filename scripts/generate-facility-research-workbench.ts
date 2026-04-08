#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import {
  buildFacilityFactMap,
  buildFacilityResearchQueries,
  detectFacilityCountSource,
  normalizeAccountKey,
  resolveFacilityCountLabel,
  type FacilityFactRecord,
  type FacilityResearchSeed,
} from '../src/lib/research/facility-counts';

interface AccountRecord extends FacilityResearchSeed {
  rank?: number;
  priority_score?: number;
  icp_fit?: number;
  priority_band?: string;
  facility_count?: string;
  parent_brand?: string;
}

const ROOT = path.resolve(__dirname, '..');
const ACCOUNTS_JSON = path.join(ROOT, 'src/lib/data/accounts.json');
const FACILITY_FACTS_JSON = path.join(ROOT, 'src/lib/data/facility-facts.json');
const OUTPUT_MD = path.join(ROOT, 'docs/research/facility-count-workbench.md');
const OUTPUT_CSV = path.join(ROOT, 'docs/research/facility-count-workbench.csv');
const DEFAULT_LIMIT = 20;
const SUPPLEMENTAL_ACCOUNTS: AccountRecord[] = [
  {
    name: 'AB InBev',
    parent_brand: 'Anheuser-Busch InBev',
    priority_band: 'Flagship',
    tier: 'Flagship',
    facility_count: '100+',
    rank: 999,
    priority_score: 0,
    icp_fit: 5,
  },
  {
    name: 'Coca-Cola',
    parent_brand: 'The Coca-Cola Company',
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

  const selectedAccounts = selectAccounts(accounts, args.accountFilters, args.limit);
  const markdown = buildMarkdown(selectedAccounts, factMap);
  const csv = buildCsv(selectedAccounts, factMap);

  fs.writeFileSync(OUTPUT_MD, markdown, 'utf-8');
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');

  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(`Wrote ${OUTPUT_CSV}`);
  console.log(`Accounts included: ${selectedAccounts.length}`);

  if (args.openCount > 0) {
    openQueries(selectedAccounts, args.openCount);
  }
}

function parseArgs(argv: string[]): { accountFilters: string[]; limit: number; openCount: number } {
  const accountFilters: string[] = [];
  let limit = DEFAULT_LIMIT;
  let openCount = 0;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--account' && argv[index + 1]) {
      accountFilters.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument === '--limit' && argv[index + 1]) {
      limit = Number.parseInt(argv[index + 1], 10) || DEFAULT_LIMIT;
      index += 1;
      continue;
    }

    if (argument === '--open' && argv[index + 1]) {
      openCount = Math.max(0, Number.parseInt(argv[index + 1], 10) || 0);
      index += 1;
    }
  }

  return { accountFilters, limit, openCount };
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function selectAccounts(accounts: AccountRecord[], accountFilters: string[], limit: number): AccountRecord[] {
  const filtered = accountFilters.length
    ? accounts.filter((account) => accountFilters.some((filter) => normalizeAccountKey(filter) === normalizeAccountKey(account.name)))
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

function buildMarkdown(accounts: AccountRecord[], factMap: Map<string, FacilityFactRecord>): string {
  const verifiedCount = accounts.filter((account) => factMap.has(normalizeAccountKey(account.name))).length;
  const sections = accounts.map((account) => buildAccountSection(account, factMap)).join('\n\n');

  return [
    '# Facility Count Research Workbench',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Purpose: replace guessed facility counts with source-backed counts that can feed microsites and ROI models.',
    '',
    '## Workflow',
    '',
    '1. Run the query pack generator to create the current account list and one-click Google searches.',
    '2. Research each account in query order: official footprint, annual report, SEC, North America scope, expansion history, operations footprint.',
    '3. Record the count and evidence in `src/lib/data/facility-facts.json` once you have a defensible number and scope.',
    '4. Re-run `npm run research:facility-report` to confirm coverage moved from repo guesses to researched facts.',
    '5. Re-run `tsx scripts/generate-microsite-data.ts` when generated microsites need the updated count source.',
    '',
    '## Coverage Snapshot',
    '',
    `- Accounts in workbench: ${accounts.length}`,
    `- Accounts with facility facts recorded: ${verifiedCount}`,
    `- Accounts still relying on dossier / accounts.json / heuristic fallback: ${accounts.length - verifiedCount}`,
    '',
    '## Evidence Rules',
    '',
    '- Prefer official company network pages, annual reports, or SEC filings over third-party listicles.',
    '- Capture scope explicitly: global, North America, or the operational subset relevant to YardFlow.',
    '- If the company mixes plants and DCs in one total, note that instead of pretending the count is cleaner than the evidence.',
    '- Use `provisional` only when the number is defensible but not yet confirmed by an official/public-filing source.',
    '',
    '## Account Query Packs',
    '',
    sections,
    '',
  ].join('\n');
}

function buildAccountSection(account: AccountRecord, factMap: Map<string, FacilityFactRecord>): string {
  const fact = factMap.get(normalizeAccountKey(account.name));
  const currentCount = resolveFacilityCountLabel({
    accountName: account.name,
    facilityFact: fact,
    accountFacilityCount: account.facility_count ?? account.currentFacilityCount,
    icpFit: account.icp_fit,
  });
  const currentSource = detectFacilityCountSource({
    accountName: account.name,
    facilityFact: fact,
    accountFacilityCount: account.facility_count ?? account.currentFacilityCount,
    icpFit: account.icp_fit,
  });
  const queries = buildFacilityResearchQueries({
    name: account.name,
    parentBrand: account.parent_brand ?? account.parentBrand,
    vertical: account.vertical,
    currentFacilityCount: account.facility_count ?? account.currentFacilityCount,
    priorityBand: account.priority_band ?? account.priorityBand,
    tier: account.tier,
  });

  return [
    `### ${account.name}`,
    '',
    `- Priority: ${account.priority_band ?? account.priorityBand ?? 'N/A'} / ${account.tier ?? 'N/A'}`,
    `- Current repo count: ${currentCount}`,
    `- Current source: ${currentSource}`,
    `- Research status: ${fact ? `${fact.status} (${fact.confidence})` : 'missing'}`,
    `- Scope target: ${fact?.scope ?? 'North America or MODEX-relevant operating network'}`,
    fact ? `- Current fact summary: ${fact.summary}` : '- Current fact summary: no dedicated facility fact recorded yet.',
    '',
    'Evidence capture:',
    '- Exact facility count:',
    '- Scope:',
    '- Facility type mix:',
    '- Best source 1:',
    '- Best source 2:',
    '- Reconciliation note:',
    '',
    'Queries:',
    ...queries.map(
      (query, index) =>
        `${index + 1}. ${query.label}: ${query.purpose}\n   Search: ${query.query}\n   Google: ${query.googleUrl}`,
    ),
  ].join('\n');
}

function buildCsv(accounts: AccountRecord[], factMap: Map<string, FacilityFactRecord>): string {
  const header = [
    'account',
    'priority_band',
    'tier',
    'current_repo_count',
    'current_source',
    'fact_status',
    'query_id',
    'query_label',
    'purpose',
    'query',
    'google_url',
  ];
  const rows = accounts.flatMap((account) => {
    const fact = factMap.get(normalizeAccountKey(account.name));
    const currentCount = resolveFacilityCountLabel({
      accountName: account.name,
      facilityFact: fact,
      accountFacilityCount: account.facility_count ?? account.currentFacilityCount,
      icpFit: account.icp_fit,
    });
    const currentSource = detectFacilityCountSource({
      accountName: account.name,
      facilityFact: fact,
      accountFacilityCount: account.facility_count ?? account.currentFacilityCount,
      icpFit: account.icp_fit,
    });

    return buildFacilityResearchQueries({
      name: account.name,
      parentBrand: account.parent_brand ?? account.parentBrand,
      vertical: account.vertical,
      currentFacilityCount: account.facility_count ?? account.currentFacilityCount,
      priorityBand: account.priority_band ?? account.priorityBand,
      tier: account.tier,
    }).map((query) => [
      account.name,
      account.priority_band ?? account.priorityBand ?? '',
      account.tier ?? '',
      currentCount,
      currentSource,
      fact ? `${fact.status}:${fact.confidence}` : 'missing',
      query.id,
      query.label,
      query.purpose,
      query.query,
      query.googleUrl,
    ]);
  });

  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function openQueries(accounts: AccountRecord[], openCount: number): void {
  const browser = process.env.BROWSER;
  if (!browser) {
    console.log('BROWSER is not set. Skipping browser launch.');
    return;
  }

  for (const account of accounts.slice(0, openCount)) {
    const firstQuery = buildFacilityResearchQueries(account)[0];
    spawn(browser, [firstQuery.googleUrl], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  }
}

main();