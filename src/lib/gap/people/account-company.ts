/**
 * WHICH HUBSPOT COMPANIES ARE THIS ACCOUNT (owner resolution, 2026-10-05). The linked `Account.hubspot_company_id`
 * when there is one; otherwise the SAME identity rule deal truth already uses (opportunity/active-opportunity.ts
 * resolveCompanyIdentity: the verified canonical domain and the email domains of the people GAP holds, then HubSpot's
 * own exact-name duplicates). FedEx and H-E-B are GAP accounts with no linked company whose people all mail from
 * fedex.com and heb.com: their HubSpot people are readable through that identity, by one rule, never a guess.
 *
 * Read only. Never links the account (that is a seller decision, made in HubSpot or on the account).
 */
import { loadOpportunityIdentity, resolveCompanyIdentity, type OpportunityReads } from '../opportunity/active-opportunity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type CompanyVia = 'linked' | 'identity' | 'none' | 'unreadable';

export interface AccountCompanies {
  ids: string[];
  via: CompanyVia;
  /** Why, in words (shown when nothing resolves or the read failed). */
  detail: string;
}

export interface AccountCompanyDeps {
  reads?: OpportunityReads;
  /** Default: HUBSPOT_ACCESS_TOKEN present. */
  configured?: () => boolean;
}

export async function resolveAccountHubSpotCompanies(prisma: PrismaLike, accountName: string, deps: AccountCompanyDeps = {}): Promise<AccountCompanies> {
  const account: { hubspot_company_id: string | null } | null = await prisma.account.findUnique({ where: { name: accountName }, select: { hubspot_company_id: true } });
  if (!account) return { ids: [], via: 'none', detail: 'no such GAP account' };
  const linked = String(account.hubspot_company_id ?? '').trim();
  if (linked) return { ids: [linked], via: 'linked', detail: `linked HubSpot company ${linked}` };
  const configured = deps.configured ?? (() => !!process.env.HUBSPOT_ACCESS_TOKEN);
  if (!configured()) return { ids: [], via: 'none', detail: 'HubSpot is not configured' };
  try {
    const identity = await loadOpportunityIdentity(prisma, accountName);
    if (!identity.domains.length) return { ids: [], via: 'none', detail: 'no HubSpot company id and no company domain on file (link the HubSpot company on the account)' };
    const reads = deps.reads ?? (await import('../opportunity/hubspot-reads')).hubspotOpportunityReads;
    const r = await resolveCompanyIdentity(identity, reads);
    if (!r.ok) return { ids: [], via: r.truth.status === 'UNKNOWN' && r.truth.reason === 'identity_unresolved' ? 'none' : 'unreadable', detail: r.truth.status === 'UNKNOWN' ? r.truth.detail ?? r.truth.reason : 'identity read failed' };
    return { ids: r.companyIds, via: 'identity', detail: `resolved by the account identity (${identity.domains.join(', ')}): ${r.companyIds.length} HubSpot ${r.companyIds.length === 1 ? 'company' : 'companies'}` };
  } catch (e) {
    return { ids: [], via: 'unreadable', detail: e instanceof Error ? e.message : String(e) };
  }
}
