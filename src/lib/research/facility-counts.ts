export type FacilityFactStatus = 'verified' | 'provisional';
export type FacilityFactConfidence = 'official' | 'public-filing' | 'third-party' | 'inferred';

export interface FacilityFactSource {
  label: string;
  url?: string;
}

export interface FacilityFactRecord {
  account: string;
  facilityCount: string;
  scope: string;
  status: FacilityFactStatus;
  confidence: FacilityFactConfidence;
  summary: string;
  updatedAt: string;
  sources: FacilityFactSource[];
}

export interface FacilityResearchSeed {
  name: string;
  parentBrand?: string | null;
  vertical?: string | null;
  currentFacilityCount?: string | null;
  priorityBand?: string | null;
  tier?: string | null;
}

export interface FacilityResearchQuery {
  id: string;
  label: string;
  purpose: string;
  query: string;
  googleUrl: string;
}

export interface ResolveFacilityCountLabelInput {
  accountName: string;
  facilityFact?: FacilityFactRecord | null;
  dossierFacilityCount?: string | null;
  accountFacilityCount?: string | null;
  icpFit?: number | null;
}

export function normalizeAccountKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function buildFacilityFactMap(records: FacilityFactRecord[]): Map<string, FacilityFactRecord> {
  return new Map(records.map((record) => [normalizeAccountKey(record.account), record]));
}

export function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildFacilityResearchQueries(seed: FacilityResearchSeed): FacilityResearchQuery[] {
  const accountClause = buildAccountClause(seed);
  const geographyClause = '("North America" OR USA OR US)';

  return [
    {
      id: 'official-footprint',
      label: 'Official Footprint',
      purpose: 'Find the company\'s published network, locations, or footprint page.',
      query: `${accountClause} (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")`,
      googleUrl: buildGoogleSearchUrl(
        `${accountClause} (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")`,
      ),
    },
    {
      id: 'annual-report',
      label: 'Annual Report / IR',
      purpose: 'Find investor-facing language that discloses facility totals or regional footprint.',
      query: `${accountClause} ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")`,
      googleUrl: buildGoogleSearchUrl(
        `${accountClause} ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")`,
      ),
    },
    {
      id: 'sec-filings',
      label: 'SEC Filings',
      purpose: 'Cross-check formal public filings when company marketing pages are vague.',
      query: `site:sec.gov ${accountClause} ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)`,
      googleUrl: buildGoogleSearchUrl(
        `site:sec.gov ${accountClause} ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)`,
      ),
    },
    {
      id: 'north-america-network',
      label: 'North America Network',
      purpose: 'Separate global footprint claims from the network Casey is actually selling into.',
      query: `${accountClause} ${geographyClause} (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)`,
      googleUrl: buildGoogleSearchUrl(
        `${accountClause} ${geographyClause} (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)`,
      ),
    },
    {
      id: 'expansion-history',
      label: 'Expansion History',
      purpose: 'Catch openings, expansions, and new DC announcements that imply current footprint scale.',
      query: `${accountClause} ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)`,
      googleUrl: buildGoogleSearchUrl(
        `${accountClause} ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)`,
      ),
    },
    {
      id: 'operations-footprint',
      label: 'Operations Footprint',
      purpose: 'Find supply-chain and operations interviews that mention site counts and operating model.',
      query: `${accountClause} ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)`,
      googleUrl: buildGoogleSearchUrl(
        `${accountClause} ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)`,
      ),
    },
  ];
}

export function resolveFacilityCountLabel(input: ResolveFacilityCountLabelInput): string {
  return (
    cleanValue(input.facilityFact?.facilityCount) ??
    cleanValue(input.dossierFacilityCount) ??
    cleanValue(input.accountFacilityCount) ??
    defaultHeuristicCount(input.icpFit)
  );
}

export function detectFacilityCountSource(
  input: ResolveFacilityCountLabelInput,
): 'facility-facts' | 'dossier' | 'accounts-json' | 'heuristic' {
  if (cleanValue(input.facilityFact?.facilityCount)) return 'facility-facts';
  if (cleanValue(input.dossierFacilityCount)) return 'dossier';
  if (cleanValue(input.accountFacilityCount)) return 'accounts-json';
  return 'heuristic';
}

function buildAccountClause(seed: FacilityResearchSeed): string {
  const names = [seed.name, seed.parentBrand]
    .filter((name): name is string => Boolean(name && name.trim()))
    .map((name) => name.trim())
    .filter((name, index, values) => values.indexOf(name) === index);

  if (names.length === 1) {
    return `"${names[0]}"`;
  }

  return `(${names.map((name) => `"${name}"`).join(' OR ')})`;
}

function cleanValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function defaultHeuristicCount(icpFit?: number | null): string {
  return (icpFit ?? 0) >= 4 ? '20+' : '10+';
}