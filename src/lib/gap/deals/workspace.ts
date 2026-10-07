/**
 * THE DEAL WORKSPACE READ (GAP OS execution recovery, Sprint 5, 2026-10-06). Server only. What an account with open
 * HubSpot deals needs to be worked from the deal, read once for the account page:
 *
 *   opportunities   R50: each open deal with its own obligations, confirmed buyer words, contacts and HubSpot next
 *                   step; the account-level rows labeled as such (deals/opportunities.ts over deals/scope.ts)
 *
 * The deals themselves come from the account read (the opportunity resolver: HubSpot is the deal authority). Every
 * read here is soft: a failed read leaves its part empty and says so, never the page. Nothing here writes.
 */
import { selectConfirmedBids } from '../bid/select';
import { loadCommitments, withPhases } from '../work/commitments';
import type { Commitment, PhaseRead } from '../work/commitment-model';
import { accountSlug } from '../account-intel/href';
import { buildOpportunities, dealRefs, personIndex, bidScope, type OpportunitiesView, type OpportunityBid, type OpportunityDealInput, type OpportunityPerson } from './opportunities';
import type { BriefBidRow } from './deal-brief';
import type { ScopeRead } from './scope';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const HUBSPOT_PORTAL = '3819073';

export interface DealWorkspace {
  accountName: string;
  opportunities: OpportunitiesView;
  /** The shared scope rule over this account's open deals, for the per-deal briefs. */
  scopeOfBid: (b: BriefBidRow) => ScopeRead;
  /** A part that could not be read, in words. */
  unread: string[];
}

/** Capture opened on one deal: the HubSpot id binds the note's words and obligations to it; the name is the label. */
export function captureHrefFor(accountName: string, deal: { id: string; name: string | null }, extra: Record<string, string> = {}): string {
  return `/gap/capture?${new URLSearchParams({ account: accountName, deal: deal.id, ...(deal.name ? { dealName: deal.name } : {}), from: `account:${accountSlug(accountName)}`, ...extra }).toString()}`;
}

/** The workspace for the account page: the account's commitments read here, with their phase now. */
export async function loadAccountDealWorkspace(prisma: PrismaLike, x: { accountName: string; deals: readonly OpportunityDealInput[]; now: Date }): Promise<DealWorkspace> {
  const commitments = await loadCommitments(prisma, { accountNames: [x.accountName] }).catch(() => null);
  const w = await loadDealWorkspace(prisma, { accountName: x.accountName, deals: x.deals, commitments: withPhases(commitments ?? [], x.now), now: x.now });
  return commitments ? w : { ...w, unread: [...w.unread, 'the obligations'] };
}

export async function loadDealWorkspace(
  prisma: PrismaLike,
  x: { accountName: string; deals: readonly OpportunityDealInput[]; commitments: ReadonlyArray<Commitment & PhaseRead>; now: Date },
): Promise<DealWorkspace> {
  const unread: string[] = [];
  const [people, bidRows] = await Promise.all([
    (prisma.persona?.findMany ? prisma.persona.findMany({ where: { account_name: x.accountName }, select: { id: true, name: true, title: true, email: true, hubspot_contact_id: true }, take: 200 }) : Promise.resolve([])).catch(() => {
      unread.push('the people at the account');
      return [];
    }),
    (prisma.buyerInputData?.findMany
      ? prisma.buyerInputData.findMany({ where: { account_name: x.accountName }, select: { id: true, type: true, raw_buyer_language: true, normalized_summary: true, contact_email: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, captured_at: true, metadata: true } })
      : Promise.resolve([])
    ).catch(() => {
      unread.push('what the buyer said');
      return [];
    }),
  ]);
  const persons: OpportunityPerson[] = (people as Array<{ id: number; name: string | null; title: string | null; email: string | null; hubspot_contact_id: string | null }>).map((p) => ({ personaId: p.id, name: p.name ?? `person ${p.id}`, title: p.title ?? null, email: p.email ?? null, hubspotContactId: p.hubspot_contact_id ? String(p.hubspot_contact_id) : null }));
  type BidRow = { id: string; type: string; raw_buyer_language: string; normalized_summary: string | null; contact_email: string | null; human_confirmed: boolean; supersedes_id: string | null; confirmed_at: Date | string | null; captured_at: Date | string; metadata: unknown };
  const confirmed = selectConfirmedBids((bidRows as BidRow[]).map((b) => ({ ...b, id: String(b.id), humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null })));
  const bids: OpportunityBid[] = confirmed.map((b) => ({ id: String(b.id), type: String(b.type), quote: String(b.raw_buyer_language), summary: (b.normalized_summary as string | null) ?? null, contactEmail: String(b.contact_email ?? '').toLowerCase(), at: new Date(b.confirmed_at ?? b.captured_at).toISOString(), metadata: b.metadata }));
  const opportunities = buildOpportunities({
    accountName: x.accountName,
    deals: x.deals,
    people: persons,
    commitments: x.commitments,
    bids,
    captureHref: (d) => captureHrefFor(x.accountName, d),
    hubspotDealHref: (id) => `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-3/${id}`,
  });
  const refs = dealRefs(x.deals);
  const personOf = personIndex(persons);
  return { accountName: x.accountName, opportunities, scopeOfBid: (b) => bidScope({ metadata: b.metadata, contactEmail: b.contact_email }, refs, personOf), unread };
}
