/**
 * Match canonical campaign accounts to discovery prospect rows.
 *
 * The campaign accounts come from the clawd canonical view (name + domain);
 * the prospect rows come from the discovery scoring pipeline (name, lat/lng,
 * existingAccountSlug, micrositeSlug). This module reconciles the two so the
 * corridor map can HIGHLIGHT the campaign's accounts (UNFI / Home Depot /
 * Walgreens / KDP / Redner's) against the rest of the Allentown corridor.
 *
 * Pure + testable. A campaign account may match zero, one, or several prospect
 * rows (a multi-site brand shows several pins). Accounts with no coordinate-bearing
 * row are still returned (matchedRows: []) so the UI can list them in the
 * companion panel without inventing a synthetic pin.
 */

export interface CampaignAccountInput {
  /** Stable id from the canonical view (e.g. "a721"). */
  id: string;
  name: string;
  domain: string;
}

export interface MatchableRow {
  name: string;
  placeId: string;
  existingAccountSlug?: string;
  micrositeSlug?: string;
}

export interface CampaignAccountMatch<R extends MatchableRow> {
  account: CampaignAccountInput;
  /** Prospect rows in the corridor that resolve to this account (may be empty). */
  matchedRows: R[];
}

/** Normalize a string to a comparable token: lowercase, drop punctuation + corp suffixes. */
export function normalizeBrand(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`.,]/g, '')
    .replace(
      /\b(the|inc|llc|corp|corporation|co|company|markets?|warehouse|distribution|center|dc|logistics|fresh|micro|fulfillment|warehouses?)\b/g,
      ' ',
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Derive the brand token from a domain ("keurigdrpepper.com" -> "keurigdrpepper"). */
export function domainBrand(domain: string): string {
  if (!domain) return '';
  const host = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  const root = host.split('/')[0].split('.')[0];
  return root.replace(/[^a-z0-9]/g, '');
}

/**
 * A row matches an account when the brand tokens overlap by NAME or DOMAIN.
 *
 * We deliberately do NOT trust the prospect row's existingAccountSlug here: in
 * the discovery seed data it is over-broad (FedEx tagged the-home-depot, Owens &
 * Minor tagged keurig-dr-pepper), which produces false pins. Name + domain brand
 * matching is precise and is what visually distinguishes the campaign's accounts.
 */
function rowMatchesAccount(row: MatchableRow, account: CampaignAccountInput): boolean {
  const acctName = normalizeBrand(account.name);
  const acctDomain = domainBrand(account.domain);
  if (!acctName && !acctDomain) return false;

  const rowName = normalizeBrand(row.name);
  const rowNameCompact = rowName.replace(/\s+/g, '');
  if (!rowName) return false;

  // Name overlap: every word of the account brand appears in the row name.
  const acctWords = acctName.split(/\s+/).filter(Boolean);
  if (acctWords.length > 0 && acctWords.every((w) => rowName.includes(w))) return true;

  // Domain brand appears in the compacted row name (e.g. "keurigdrpepper").
  // Guard at 5 chars so short tokens like "unfi" don't catch "nfi"-style rows.
  if (acctDomain.length >= 5 && rowNameCompact.includes(acctDomain)) return true;

  return false;
}

/**
 * Reconcile campaign accounts to prospect rows. Returns one entry per account,
 * in the input order, each carrying the rows that resolve to it.
 */
export function matchCampaignAccounts<R extends MatchableRow>(
  accounts: CampaignAccountInput[],
  rows: R[],
): CampaignAccountMatch<R>[] {
  return accounts.map((account) => ({
    account,
    matchedRows: rows.filter((row) => rowMatchesAccount(row, account)),
  }));
}

/** The placeIds of every row that resolves to any campaign account (for map highlighting). */
export function highlightedPlaceIds<R extends MatchableRow>(
  matches: CampaignAccountMatch<R>[],
): Set<string> {
  const ids = new Set<string>();
  for (const m of matches) {
    for (const row of m.matchedRows) ids.add(row.placeId);
  }
  return ids;
}
