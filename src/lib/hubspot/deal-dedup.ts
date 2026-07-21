/**
 * Deal dedup — decide whether an account already HAS a deal before opening one.
 *
 * WHY THIS EXISTS (2026-07-21). `upsertDealForAccount` deduped by deal NAME:
 * it searched for the literal string "YardFlow - {Account}" and, finding
 * nothing, created a deal. A human deal named anything else was therefore
 * invisible to it. On 2026-07-21 the restored check-inbox cron saw an inbound
 * reply from Wesco and minted "YardFlow - Wesco International" ($50k,
 * INTEGRATION, 0 contacts, 0 notes) alongside the real "Wesco - Pilot and POC"
 * ($100k, Jake's, 64 notes) on the SAME company. Five such phantom deals had
 * accumulated, $250k of fake pipeline.
 *
 * A deal belongs to a COMPANY, not to a name. So dedup keys on the company
 * association — any open deal on that company, whatever it is named, whoever
 * owns it, means we do not open another and we do not touch theirs. The name
 * match survives only as a degraded fallback for when company resolution fails,
 * so behavior degrades instead of breaking.
 *
 * Pure and dependency-injected on purpose: the decision is testable without a
 * single network call (tests/unit/deal-dedup.test.ts).
 */

import { slugify } from '@/lib/data';
import { domainForAccountSlug } from '@/lib/microsites/account-domains';
import { searchCompanyByDomain, searchCompanyByName } from './companies';

/** Minimal shape the decision needs — structurally satisfied by OpenDealRef. */
export interface DedupDealRef {
  id: string;
}

export type DealDedupDecision =
  /** An open deal already exists on this company. Use it. Change NOTHING on it. */
  | { action: 'link'; dealId: string; via: 'company'; companyId: string }
  /** Only an engine-named "YardFlow - X" deal matched. Update it, as before. */
  | { action: 'update'; dealId: string; via: 'name' }
  /** Nothing matched and the caller is allowed to open one. */
  | { action: 'create'; companyId: string | null }
  /** Nothing matched but creating is not allowed, or a lookup failed. */
  | { action: 'skip'; companyId: string | null };

export interface DealDedupDeps {
  /** HubSpot company id for the account, or null when unresolvable. */
  resolveCompanyId(): Promise<string | null>;
  /** Most-advanced OPEN deal associated with the company, or null. */
  findOpenDealAtCompany(companyId: string): Promise<DedupDealRef | null>;
  /** Legacy fallback: exact "YardFlow - {Account}" deal-name match. */
  findDealByName(): Promise<DedupDealRef | null>;
}

export interface DealDedupOptions {
  /**
   * Whether this caller may OPEN a deal that does not exist yet. Defaults to
   * FALSE: a missing deal is a ten-second human fix, a duplicate deal corrupts
   * pipeline reporting and muddies ownership between reps. Only deliberate
   * human "give this account a deal" actions opt in.
   */
  allowCreate?: boolean;
}

/**
 * Decide what to do about a deal for an account.
 *
 * Order is deliberate:
 *   1. Company association — the truth. An open deal there wins outright.
 *   2. Exact engine name — the degraded fallback for unresolvable companies.
 *   3. Create, but only if the caller opted in.
 *
 * Every lookup FAILS CLOSED. If we resolved a company but could not read its
 * deals, we do not know whether one exists, and "create anyway" is precisely
 * how the duplicate got minted. Skip and let a human notice.
 */
export async function decideDealForAccount(
  deps: DealDedupDeps,
  options: DealDedupOptions = {},
): Promise<DealDedupDecision> {
  const allowCreate = options.allowCreate === true;

  // 1. Company association.
  let companyId: string | null = null;
  try {
    companyId = await deps.resolveCompanyId();
  } catch {
    // Resolution failure is recoverable — fall through to the name match.
    companyId = null;
  }

  if (companyId) {
    let openDeal: DedupDealRef | null;
    try {
      openDeal = await deps.findOpenDealAtCompany(companyId);
    } catch {
      return { action: 'skip', companyId };
    }
    if (openDeal) {
      return { action: 'link', dealId: openDeal.id, via: 'company', companyId };
    }
  }

  // 2. Legacy exact-name fallback.
  let named: DedupDealRef | null;
  try {
    named = await deps.findDealByName();
  } catch {
    return { action: 'skip', companyId };
  }
  if (named) return { action: 'update', dealId: named.id, via: 'name' };

  // 3. Nothing anywhere.
  return allowCreate ? { action: 'create', companyId } : { action: 'skip', companyId };
}

/**
 * Resolve the HubSpot company for a local account NAME.
 *
 * Same chain the intent engine uses (`resolveCompanyForIntent`, commit
 * 5784432f): registry DOMAIN first — `account-domains.ts` mirrors HubSpot's own
 * domain values so the match is correct by construction — then the exact-name
 * search. Imported from `account-domains` directly rather than through
 * `hubspot-intent`, which drags the whole 55-module microsite registry into
 * every route that opens a deal.
 *
 * A miss is LOGGED, never silent: a logged miss is a fixable miss.
 */
export async function resolveCompanyIdForAccountName(
  accountName: string,
  deps: {
    byDomain: (domain: string) => Promise<{ id: string } | null>;
    byName: (name: string) => Promise<{ id: string } | null>;
  } = { byDomain: searchCompanyByDomain, byName: searchCompanyByName },
): Promise<string | null> {
  const name = accountName.trim();
  if (!name) return null;

  const domain = domainForAccountSlug(slugify(name));
  if (domain) {
    const hit = await deps.byDomain(domain);
    if (hit) return hit.id;
  }

  const hit = await deps.byName(name);
  if (hit) return hit.id;

  console.warn(
    `[deals] company resolution MISS for account="${name}" domain=${domain ?? '(unmapped)'} — deal dedup falls back to name match`,
  );
  return null;
}
