/**
 * DEAL COVERAGE (C01, C03, C04 of the commercial-context audit, 2026-10-08). Pure.
 *
 * The one shape every intelligence consumer reads for "is this account in an open deal": the in-deals summary the
 * day already loads (deals/in-deals.ts, HubSpot read complete or unavailable), folded by every name the account is
 * recorded under (its GAP name and the duplicates on the same deals), with the read's status and time. A negative
 * ("no open deal") is said only when the read was COMPLETE; an absent or failed read says UNKNOWN, never no deal.
 */
import type { InDealsSummary } from '../deals/in-deals';

export type DealCoverageStatus = 'complete' | 'unavailable' | 'absent';

export interface CoveredDeal {
  id: string | null;
  name: string | null;
  stage: string;
  nextStep: string | null;
  closeDate: string | null;
  contactIds: string[];
}

export interface CoveredAccount {
  accountName: string;
  names: string[];
  deals: CoveredDeal[];
}

export interface DealCoverage {
  status: DealCoverageStatus;
  /** When HubSpot was read (the summary's checkedAt); null when it was not. */
  checkedAt: string | null;
  /** Every recorded name of an in-deal account, lowercased, to its account. */
  byName: ReadonlyMap<string, CoveredAccount>;
  /** A HubSpot contact id on an open deal to its account (batch item 8 carried the ids). */
  byContactId: ReadonlyMap<string, CoveredAccount>;
  /** C57 F13: the names of HubSpot companies with open deals the read could not map to an account (InDealsSummary.unresolved). */
  unmappedNames: ReadonlySet<string>;
}

export type DealLookup = { inDeal: true; account: CoveredAccount } | { inDeal: false } | { inDeal: null; /** C57: why nothing was decided (no identity to check; an unmapped company with an open deal). */ why?: 'unplaced' | 'unmapped' };

const key = (name: string) => name.trim().toLowerCase();

export const ABSENT_COVERAGE: DealCoverage = { status: 'absent', checkedAt: null, byName: new Map(), byContactId: new Map(), unmappedNames: new Set() };

/** The coverage the in-deals summary gives (the same read the day, the Work page and the briefing use). */
export function dealCoverageFrom(summary: Pick<InDealsSummary, 'status' | 'accounts'> & { checkedAt?: string | null } | null | undefined): DealCoverage {
  if (!summary) return ABSENT_COVERAGE;
  const byName = new Map<string, CoveredAccount>();
  const byContactId = new Map<string, CoveredAccount>();
  for (const a of summary.accounts ?? []) {
    const deals: CoveredDeal[] = (a.deals ?? []).map((d) => ({ id: d.id ?? null, name: d.name ?? null, stage: d.stage, nextStep: d.nextStep ?? null, closeDate: d.closeDate ?? null, contactIds: [...(d.contactIds ?? [])] }));
    const names = [a.accountName, ...(a.alsoRecordedAs ?? [])];
    const entry: CoveredAccount = { accountName: a.accountName, names, deals };
    for (const n of names) byName.set(key(n), entry);
    for (const d of deals) for (const c of d.contactIds) byContactId.set(String(c), entry);
  }
  // C57 F13: the companies with open deals the read could not map to an account (InDealsSummary.unresolved), by every name they carry.
  const unmappedNames = new Set<string>();
  for (const u of ((summary as { unresolved?: ReadonlyArray<Record<string, unknown>> }).unresolved ?? [])) {
    for (const k of ['companyName', 'name', 'accountName', 'hubspotCompanyName']) if (typeof u[k] === 'string' && (u[k] as string).trim()) unmappedNames.add(key(u[k] as string));
    for (const d of (Array.isArray(u.deals) ? (u.deals as Array<Record<string, unknown>>) : [])) if (typeof d.companyName === 'string') unmappedNames.add(key(d.companyName));
  }
  return { status: summary.status === 'complete' ? 'complete' : 'unavailable', checkedAt: summary.checkedAt ?? null, byName, byContactId, unmappedNames };
}

/** Compatibility with the older `dealAccounts` set (names only): null is absent, a set is a complete read of those names. */
export function coverageFromNames(names: ReadonlySet<string> | null | undefined): DealCoverage {
  if (!names) return ABSENT_COVERAGE;
  const byName = new Map<string, CoveredAccount>();
  for (const n of names) byName.set(key(n), { accountName: n, names: [n], deals: [] });
  return { status: 'complete', checkedAt: null, byName, byContactId: new Map(), unmappedNames: new Set() };
}

/** The account's standing under the coverage: in a deal, not (a complete read said so), or unknown. */
export function dealsAt(coverage: DealCoverage, accountName: string | null | undefined, extraNames: readonly string[] = []): DealLookup {
  if (coverage.status !== 'complete') return { inDeal: null };
  const names = [accountName, ...extraNames].filter((n): n is string => !!n && !!n.trim());
  // C57 F1 (C04): no name means nothing was checked; a negative needs an identity to be negative about.
  if (!names.length) return { inDeal: null, why: 'unplaced' };
  for (const n of names) {
    const hit = coverage.byName.get(key(n));
    if (hit) return { inDeal: true, account: hit };
  }
  // C57 F13 (C01/C04): an open deal at a HubSpot company GAP could not map to an account, under this name, is unknown, never none.
  for (const n of names) if (coverage.unmappedNames.has(key(n))) return { inDeal: null, why: 'unmapped' };
  return { inDeal: false };
}

/** The account by a HubSpot contact id on an open deal (the CRM's own association), under a complete read. */
export function dealsByContactId(coverage: DealCoverage, contactId: string | null | undefined): DealLookup {
  if (coverage.status !== 'complete') return { inDeal: null };
  const hit = contactId ? coverage.byContactId.get(String(contactId)) : undefined;
  return hit ? { inDeal: true, account: hit } : { inDeal: false };
}

const when = (iso: string | null) => (iso ? ` (HubSpot read ${new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York)` : '');

/** The seller words for the lookup: never "no live opportunity" unless the read was complete. */
export function dealWords(coverage: DealCoverage, lookup: DealLookup): string {
  if (lookup.inDeal === true) {
    const d = lookup.account.deals[0];
    return `their account is in an open deal${d?.name ? ` (${d.name}${d.stage ? `, ${d.stage}` : ''})` : ''}: work it from the deal`;
  }
  if (lookup.inDeal === false) return `no open deal found${when(coverage.checkedAt)}`;
  if (lookup.why === 'unplaced') return 'open deal unknown: the person is not placed at an account';
  if (lookup.why === 'unmapped') return 'open deal unknown: an open deal exists at a HubSpot company of this name that GAP has not mapped to an account';
  return coverage.status === 'unavailable' ? 'open deal unknown: HubSpot could not be read' : 'open deal unknown: HubSpot not read for this list';
}
