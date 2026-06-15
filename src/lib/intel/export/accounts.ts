/**
 * Account-research lookup — modex's half of a sniper job. clawd calls this to
 * pull everything modex knows about ONE account on demand (scores + yard-audit
 * sites + metrics + 22-field classification + dossiers + committee), or to page
 * the full deduped account list. Statically imports the committed package data
 * (runtime fs reads of output/** aren't bundled on Vercel).
 *
 * Regenerate the bundled data:
 *   npx tsx scripts/intel/gen-account-research-package.ts   (account-research.json)
 *   npx tsx scripts/intel/gen-deduped-accounts.ts           (deduped-accounts.csv -> .json)
 */
import research from './account-research.json';
import deduped from './deduped-accounts.json';

interface ResearchAccount {
  slug: string;
  account_name: string;
  domain: string | null;
  scores: Record<string, unknown> | null;
  yard_aggregate: Record<string, unknown> | null;
  dossier_url: string | null;
  corpus: Record<string, unknown>;
  sites: unknown[];
  contacts: unknown[];
}
interface DedupedAccount {
  company: string;
  domain: string;
  hubspot_company_id: string;
  in_hubspot: boolean;
  composite: number;
  tier: string;
  sites: number;
  city_state: string;
  nearest_primo: string;
}

const RESEARCH = (research as { accounts: ResearchAccount[] }).accounts;
const DEDUPED = (deduped as { accounts: DedupedAccount[] }).accounts;

const byDomain = new Map<string, ResearchAccount>();
const bySlug = new Map<string, ResearchAccount>();
for (const a of RESEARCH) {
  if (a.domain) byDomain.set(a.domain.toLowerCase(), a);
  bySlug.set(a.slug.toLowerCase(), a);
}
const dedupByDomain = new Map<string, DedupedAccount>();
for (const a of DEDUPED) if (a.domain) dedupByDomain.set(a.domain.toLowerCase(), a);

export interface AccountLookup {
  found: boolean;
  detail_level: 'full' | 'scored' | 'none';
  account: ResearchAccount | DedupedAccount | null;
}

/** One account by domain or slug. Full yard-audit research for the 56 audited
 * accounts; the scored deduped row otherwise; null if unknown. */
export function lookupAccount(domain: string | null, slug: string | null): AccountLookup {
  const d = (domain ?? '').toLowerCase().trim();
  const s = (slug ?? '').toLowerCase().trim();
  const full = (d && byDomain.get(d)) || (s && bySlug.get(s)) || null;
  if (full) return { found: true, detail_level: 'full', account: full };
  const scored = d ? dedupByDomain.get(d) : undefined;
  if (scored) return { found: true, detail_level: 'scored', account: scored };
  return { found: false, detail_level: 'none', account: null };
}

export interface AccountListPage {
  items: DedupedAccount[];
  nextCursor: string | null;
  total: number;
}

/** Page the full deduped account list (ranked by composite). Cursor = the index
 * of the next row, opaque. */
export function listAccounts(cursor: string | null, limit: number): AccountListPage {
  const start = cursor ? Math.max(0, Number.parseInt(cursor, 10) || 0) : 0;
  const sorted = DEDUPED; // already composite-desc from the generator
  const items = sorted.slice(start, start + limit);
  const next = start + limit;
  return { items, nextCursor: next < sorted.length ? String(next) : null, total: sorted.length };
}
