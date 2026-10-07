/**
 * THE OPPORTUNITIES AT AN ACCOUNT (GAP OS execution recovery, R50, 2026-10-06). Pure and client-safe.
 *
 * HubSpot stays the deal authority: the deals, their stages, next steps and contacts are what the opportunity
 * resolver read (opportunity/active-opportunity.ts, with each deal's id and contacts). This projection binds GAP's
 * own records to them through ONE scope rule (deals/scope.ts): each open deal shows only its own obligations and its
 * own confirmed buyer words; account-level rows are their own group, labeled "account-level"; rows scoped to
 * something that is not an open deal here are listed with their label. Two opportunities under one company never
 * share an unqualified commitment, requirement or next step.
 *
 * An open deal blocks a cold first touch (every send gate re-reads it at the click) and is never "nothing to do":
 * each deal carries its own work (its obligations, HubSpot's next step, a conversation logged on it).
 */
import type { Commitment, PhaseRead } from '../work/commitment-model';
import { ACCOUNT_LEVEL, bidScopeInput, partitionByDeal, readScope, type DealRef, type ScopeRead } from './scope';

export interface OpportunityDealInput {
  id: string;
  name: string | null;
  stage: string | null;
  nextStep?: string | null;
  closeDate?: string | null;
  amount?: string | null;
  lastActivityAt?: string | null;
  contactIds?: readonly string[];
}

export interface OpportunityPerson {
  personaId: number;
  name: string;
  title: string | null;
  email: string | null;
  hubspotContactId: string | null;
}

export interface OpportunityBid {
  id: string;
  type: string;
  quote: string;
  summary: string | null;
  contactEmail: string;
  at: string;
  metadata?: unknown;
}

export type ScopedCommitment = Commitment & PhaseRead & { scope: ScopeRead };
export type ScopedNeed = OpportunityBid & { who: string; scope: ScopeRead };

export interface OpportunityView {
  dealId: string;
  name: string | null;
  stage: string | null;
  /** HubSpot's own next step on the deal (read, never written here). */
  nextStep: string | null;
  closeDate: string | null;
  amount: string | null;
  lastActivityAt: string | null;
  /** The people GAP holds who are contacts on this deal. */
  contacts: Array<{ personaId: number; name: string; title: string | null }>;
  /** HubSpot contacts on the deal GAP holds no record for. */
  otherContacts: number;
  /** This deal's open obligations (done and skipped stay in their history). */
  commitments: ScopedCommitment[];
  /** This deal's confirmed buyer words. */
  needs: ScopedNeed[];
  /** Where this deal's own work runs. */
  actions: Array<{ label: string; href: string; external?: boolean }>;
}

export interface OpportunitiesView {
  accountName: string;
  deals: OpportunityView[];
  /** Not tied to any one deal; always shown with the "account-level" label. */
  accountLevel: { commitments: ScopedCommitment[]; needs: ScopedNeed[] };
  /** Scoped to something that is not an open deal here (a closed deal, an unmatched name, a division or site). */
  elsewhere: { commitments: ScopedCommitment[]; needs: ScopedNeed[] };
  /** What an open deal means for outreach, in one sentence. */
  cold: string;
}

export const COLD_BLOCKED_LINE = 'No cold first touch while a deal is open here: the work below is each deal\'s own (every send re-checks HubSpot at the click).';
export { ACCOUNT_LEVEL };

const isOpen = (c: Commitment & PhaseRead) => c.phase !== 'done' && c.phase !== 'skipped';

/** The deal references the scope rule reads (id, name, contacts). */
export const dealRefs = (deals: readonly OpportunityDealInput[]): DealRef[] => deals.map((d) => ({ id: d.id, name: d.name, contactIds: [...(d.contactIds ?? [])] }));

/** The person a row is about, as the scope rule needs them: their HubSpot contact id and a name for the label. */
export function personIndex(people: readonly OpportunityPerson[]) {
  const byId = new Map(people.map((p) => [p.personaId, p]));
  const byEmail = new Map(people.filter((p) => p.email).map((p) => [String(p.email).toLowerCase(), p]));
  return (ref: { personaId?: number | null; email?: string | null } | null | undefined): OpportunityPerson | null =>
    (ref?.personaId != null ? byId.get(ref.personaId) : undefined) ?? (ref?.email ? byEmail.get(ref.email.toLowerCase()) : undefined) ?? null;
}

export function commitmentScope(c: Pick<Commitment, 'dealId' | 'scope' | 'person'>, refs: readonly DealRef[], personOf: ReturnType<typeof personIndex>): ScopeRead {
  const p = personOf(c.person ? { personaId: c.person.personaId, email: c.person.email } : null);
  return readScope({ dealId: c.dealId, division: c.scope?.division ?? null, site: c.scope?.site ?? null }, refs, { contactId: p?.hubspotContactId ?? null, who: p?.name ?? c.person?.name ?? null });
}

export function bidScope(b: Pick<OpportunityBid, 'metadata' | 'contactEmail'>, refs: readonly DealRef[], personOf: ReturnType<typeof personIndex>): ScopeRead {
  const p = personOf({ email: b.contactEmail });
  return readScope(bidScopeInput(b.metadata), refs, { contactId: p?.hubspotContactId ?? null, who: p?.name ?? null });
}

export function buildOpportunities(input: {
  accountName: string;
  deals: readonly OpportunityDealInput[];
  people: readonly OpportunityPerson[];
  commitments: ReadonlyArray<Commitment & PhaseRead>;
  /** Confirmed, unsuperseded buyer words at the account (bid/select.ts already applied). */
  bids: readonly OpportunityBid[];
  /** Capture opened on one deal (its id and name ride in the link). */
  captureHref: (deal: OpportunityDealInput) => string;
  /** The HubSpot record of a deal, when the portal is known. */
  hubspotDealHref?: (dealId: string) => string | null;
}): OpportunitiesView {
  const refs = dealRefs(input.deals);
  const personOf = personIndex(input.people);
  const ids = input.deals.map((d) => d.id);
  const c = partitionByDeal(input.commitments.filter(isOpen), (x) => commitmentScope(x, refs, personOf), ids);
  const who = (email: string) => personOf({ email })?.name ?? email;
  const b = partitionByDeal(input.bids.map((x) => ({ ...x, who: who(x.contactEmail) })), (x) => bidScope(x, refs, personOf), ids);
  const byContact = new Map(input.people.filter((p) => p.hubspotContactId).map((p) => [String(p.hubspotContactId), p]));
  const order = (xs: ScopedCommitment[]) => [...xs].sort((x, y) => String(x.dueAt ?? '9999').localeCompare(String(y.dueAt ?? '9999')) || x.title.localeCompare(y.title));
  return {
    accountName: input.accountName,
    deals: input.deals.map((d) => {
      const held = (d.contactIds ?? []).map((k) => byContact.get(String(k))).filter((p): p is OpportunityPerson => !!p);
      const hs = input.hubspotDealHref?.(d.id) ?? null;
      return {
        dealId: d.id,
        name: d.name,
        stage: d.stage,
        nextStep: d.nextStep?.trim() || null,
        closeDate: d.closeDate ?? null,
        amount: d.amount ?? null,
        lastActivityAt: d.lastActivityAt ?? null,
        contacts: held.map((p) => ({ personaId: p.personaId, name: p.name, title: p.title })),
        otherContacts: (d.contactIds ?? []).length - held.length,
        commitments: order(c.byDeal.get(d.id) ?? []),
        needs: b.byDeal.get(d.id) ?? [],
        actions: [{ label: 'Log a conversation on this deal', href: input.captureHref(d) }, ...(hs ? [{ label: 'Open the deal in HubSpot', href: hs, external: true }] : [])],
      };
    }),
    accountLevel: { commitments: order(c.accountLevel), needs: b.accountLevel },
    elsewhere: { commitments: order(c.elsewhere), needs: b.elsewhere },
    cold: COLD_BLOCKED_LINE,
  };
}
