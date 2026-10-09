/**
 * THE COMMERCIAL-CONTEXT PACKET (C13 of the commercial-context audit, 2026-10-08). Pure types and helpers.
 *
 * One shape the prospecting and preparation path reads before it recommends anything: identity (who, placed by the
 * identity machinery), opportunity (the CRM's open deals under a complete read, else unknown), the conversation
 * timeline (sent, received, drafts and calendar mail typed apart), buyer facts and seller hypotheses as attributed
 * CLAIMS with provenance, commitments, incumbents, the externally checked facts, and the COVERAGE of every source
 * (configured, reachable, complete or partial, watermark, what was omitted and why). It extends the existing
 * AccountContext and Story readers; it is not a second CRM.
 *
 * Rules the helpers enforce: a claim without a source id, a class, an authority and a visibility is refused
 * (validateClaims); a document's refresh time is never a claim's observation date (observedAt is the claim's own);
 * conflicts and supersession stay visible; internal context never leaks into external use (externallyUsable);
 * nothing in a retrieved text is an instruction (the packet is data). The revision fingerprint (C23) changes when
 * any source id, version or observation date changes, and only then.
 */
import { createHash } from 'node:crypto';
import type { DealCoverageStatus } from '../work/deal-coverage';

export type SourceKind = 'crm' | 'gmail' | 'hubspot_engagement' | 'vault' | 'clawd' | 'public' | 'seller' | 'gap';

/** Which question a source is authoritative for (C17: no universal newest-wins). */
export type Authority = 'deal_existence' | 'sent_received' | 'buyer_words' | 'seller_interpretation' | 'public_fact' | 'modeled';

/** The trust vocabulary applied to a retrieved chunk (C18). */
export type ClaimClass = 'buyer_said' | 'seller_noted' | 'checked_public' | 'modeled' | 'inference' | 'internal_only';

export type ContextVisibility = 'internal' | 'external_ok';

export type Completeness = 'complete' | 'partial' | 'unknown';

export interface SourceEnvelope {
  /** The provider's own id (a Gmail message id, a HubSpot object id, a vault path with a heading, a Clawd note id). */
  sourceId: string;
  sourceKind: SourceKind;
  authority: Authority;
  /** When the thing happened (the email's date, the meeting's date, the filing date); null when unknown. */
  eventAt: string | null;
  /** When the claim was observed or written; never a file or index refresh time (C15). */
  observedAt: string | null;
  /** When the source was indexed or rebuilt (a vault file's last_refreshed, a Clawd rebuilt_at); a label only. */
  indexedAt: string | null;
  url: string | null;
  /** The source's own version marker (a note's date, a snapshot id) for supersession (C16). */
  version: string | null;
  completeness: Completeness;
  visibility: ContextVisibility;
}

export interface ContextClaim extends SourceEnvelope {
  claimId: string;
  text: string;
  claimClass: ClaimClass;
  about: 'account' | 'person' | 'deal';
  subjectId: string;
  /** The newer claim this one is superseded by, when research marked one (history retained). */
  supersededBy?: string | null;
  /** Claims this one contradicts, both shown (C17). */
  conflictsWith?: string[];
}

export type PersonVia = 'persona' | 'hubspot_contact' | 'hubspot_company_id' | 'domain' | 'alias' | 'normalized' | null;

export interface ContextPerson {
  email: string;
  name: string | null;
  title: string | null;
  personaId: number | null;
  hubspotContactId: string | null;
  via: PersonVia;
}

export interface ContextIdentity {
  accountName: string | null;
  via: PersonVia;
  ambiguous: boolean;
  hubspotCompanyIds: string[];
  domains: string[];
  people: ContextPerson[];
}

export interface ContextDeal {
  id: string | null;
  name: string | null;
  stage: string;
  nextStep: string | null;
  closeDate: string | null;
  contactIds: string[];
}

export interface ContextOpportunity {
  /** open: a complete CRM read found a deal; none: a complete read found none; unknown: no complete read; ambiguous: more than one deal and no scope chosen (C06). */
  status: 'open' | 'none' | 'unknown' | 'ambiguous';
  deals: ContextDeal[];
  coverage: DealCoverageStatus;
  checkedAt: string | null;
  /** The one deal the work is scoped to, when the scope is settled. */
  scopedDealId: string | null;
}

/** Message purpose (C09): evidence-backed, never CRM truth by itself. */
export type Purpose = 'buyer_conversation' | 'customer_support' | 'vendor_solicitation' | 'partner_referral' | 'media' | 'internal' | 'calendar' | 'automated' | 'suspicious' | 'unknown';

/** Commercial relationship (C09): a separate evidenced axis; purpose never proves relationship. */
export type Relationship = 'active_opportunity' | 'customer' | 'prospect' | 'partner' | 'vendor' | 'media' | 'internal' | 'mixed' | 'unknown';

export type TimelineType = 'email' | 'draft' | 'calendar' | 'meeting' | 'call' | 'crm_note' | 'crm_task' | 'reply_recorded';

export interface TimelineEvent {
  id: string;
  /** The provider's thread, when known (C08/C25: a draft is matched by its thread, never by subject). */
  threadId?: string | null;
  at: string;
  direction: 'inbound' | 'outbound' | 'internal';
  type: TimelineType;
  provider: 'gmail' | 'hubspot' | 'gap';
  /** Every provider id that is this same event (a Gmail id and a HubSpot engagement id for one email, C47). */
  providerIds: string[];
  from: string | null;
  to: string[];
  subject: string | null;
  /** The author's own text, bounded; quoted earlier messages are not here (C07). */
  excerpt: string | null;
  /** A draft is never a contact (C08). */
  isDraft: boolean;
  purpose: Purpose | null;
  /** True when the excerpt had quoted text cut off below it. */
  quotedBelow?: boolean;
}

export interface ContextCommitment {
  id: string;
  text: string;
  dueAt: string | null;
  owner: 'seller' | 'buyer';
  sourceId: string;
}

export interface SourceCoverage {
  source: SourceKind;
  configured: boolean;
  reachable: boolean;
  completeness: Completeness;
  /** The newest thing the source holds (its own clock), for freshness; null when unknown. */
  watermark: string | null;
  indexedAt: string | null;
  /** What was asked (an address, an account, a query) so a reader can repeat it. */
  query: string | null;
  omittedReason: string | null;
}

export interface CommercialContextPacket {
  identity: ContextIdentity;
  opportunity: ContextOpportunity;
  relationship: { value: Relationship; evidence: string[] };
  timeline: TimelineEvent[];
  buyerFacts: ContextClaim[];
  sellerHypotheses: ContextClaim[];
  commitments: ContextCommitment[];
  incumbents: ContextClaim[];
  externalFacts: ContextClaim[];
  coverage: SourceCoverage[];
  assembledAt: string;
  /** C23: changes when any source id, version or observation date changes, and only then. */
  revision: string;
}

const CLAIM_CLASSES: ReadonlySet<string> = new Set(['buyer_said', 'seller_noted', 'checked_public', 'modeled', 'inference', 'internal_only']);
const AUTHORITIES: ReadonlySet<string> = new Set(['deal_existence', 'sent_received', 'buyer_words', 'seller_interpretation', 'public_fact', 'modeled']);
const VISIBILITIES: ReadonlySet<string> = new Set(['internal', 'external_ok']);

export type ClaimFault = { claimId: string | null; reason: 'no_source_id' | 'no_class' | 'no_authority' | 'no_visibility' | 'no_text' | 'refresh_as_observation' };

/** Refuse an untyped claim (C13 acceptance): every claim carries a source id, a class, an authority and a visibility. */
export function validateClaims(claims: ReadonlyArray<Partial<ContextClaim>>): { ok: true; claims: ContextClaim[] } | { ok: false; faults: ClaimFault[] } {
  const faults: ClaimFault[] = [];
  const out: ContextClaim[] = [];
  for (const c of claims) {
    const id = typeof c.claimId === 'string' ? c.claimId : null;
    if (!c.sourceId) faults.push({ claimId: id, reason: 'no_source_id' });
    else if (!c.claimClass || !CLAIM_CLASSES.has(c.claimClass)) faults.push({ claimId: id, reason: 'no_class' });
    else if (!c.authority || !AUTHORITIES.has(c.authority)) faults.push({ claimId: id, reason: 'no_authority' });
    else if (!c.visibility || !VISIBILITIES.has(c.visibility)) faults.push({ claimId: id, reason: 'no_visibility' });
    else if (!c.text || !c.text.trim()) faults.push({ claimId: id, reason: 'no_text' });
    // C57 F5 (accepted residual): the guard refuses an undated claim stamped with its refresh time; a claim whose own date happens to be the refresh day (a note written the day it was synced) is legitimate and must pass, so equality with a copied eventAt is NOT refused here. The heading-date source of the real bypass is closed in retrieval (F4).
    else if (c.observedAt && c.indexedAt && c.observedAt === c.indexedAt && c.eventAt === null) faults.push({ claimId: id, reason: 'refresh_as_observation' });
    else out.push(c as ContextClaim);
  }
  return faults.length ? { ok: false, faults } : { ok: true, claims: out };
}

/** The claims a buyer may be shown or told (C18): external_ok and never internal-only, modeled or an inference. */
export function externallyUsable(claims: ReadonlyArray<ContextClaim>): ContextClaim[] {
  return claims.filter((c) => c.visibility === 'external_ok' && (c.claimClass === 'buyer_said' || c.claimClass === 'checked_public') && !c.supersededBy);
}

/** C17: the claims that answer one question, by the source authoritative for it; conflicts stay (both returned). */
export function byAuthority(claims: ReadonlyArray<ContextClaim>, authority: Authority): ContextClaim[] {
  return claims.filter((c) => c.authority === authority && !c.supersededBy);
}

/** C23: a stable fingerprint over every source id, version and observation date in the packet, order independent. */
export function contextFingerprint(p: Pick<CommercialContextPacket, 'identity' | 'opportunity' | 'timeline' | 'buyerFacts' | 'sellerHypotheses' | 'commitments' | 'incumbents' | 'externalFacts'>): string {
  const parts: string[] = [];
  parts.push(`identity:${p.identity.accountName ?? ''}:${p.identity.ambiguous ? 'ambiguous' : p.identity.via ?? ''}:${[...p.identity.hubspotCompanyIds].sort().join(',')}`);
  parts.push(`opportunity:${p.opportunity.status}:${p.opportunity.deals.map((d) => `${d.id ?? ''}|${d.stage}|${d.nextStep ?? ''}`).sort().join(';')}`);
  for (const e of p.timeline) parts.push(`event:${[...e.providerIds].sort().join(',')}:${e.at}:${e.isDraft ? 'draft' : e.direction}`);
  for (const c of [...p.buyerFacts, ...p.sellerHypotheses, ...p.incumbents, ...p.externalFacts]) parts.push(`claim:${c.sourceId}:${c.version ?? ''}:${c.observedAt ?? ''}:${c.supersededBy ?? ''}`);
  for (const c of p.commitments) parts.push(`commitment:${c.sourceId}:${c.dueAt ?? ''}`);
  return createHash('sha256').update(parts.sort().join('\n')).digest('hex').slice(0, 16);
}

/** An empty packet that says every source is absent: the honest starting point, never an invented empty history (C20). */
export function emptyPacket(assembledAt: Date, sources: ReadonlyArray<SourceKind> = ['crm', 'gmail', 'vault', 'clawd']): CommercialContextPacket {
  const base = {
    identity: { accountName: null, via: null, ambiguous: false, hubspotCompanyIds: [], domains: [], people: [] },
    opportunity: { status: 'unknown' as const, deals: [], coverage: 'absent' as const, checkedAt: null, scopedDealId: null },
    relationship: { value: 'unknown' as const, evidence: [] },
    timeline: [],
    buyerFacts: [],
    sellerHypotheses: [],
    commitments: [],
    incumbents: [],
    externalFacts: [],
  };
  return { ...base, coverage: sources.map((source) => ({ source, configured: false, reachable: false, completeness: 'unknown' as const, watermark: null, indexedAt: null, query: null, omittedReason: 'not read' })), assembledAt: assembledAt.toISOString(), revision: contextFingerprint(base) };
}

/** The seller words for a source's coverage: empty is not unavailable (C20). */
export function coverageLine(c: SourceCoverage): string {
  if (!c.configured) return `${c.source}: not configured`;
  if (!c.reachable) return `${c.source}: unreachable${c.omittedReason ? ` (${c.omittedReason})` : ''}`;
  const when = c.watermark ? `, newest ${c.watermark.slice(0, 10)}` : '';
  return `${c.source}: ${c.completeness}${when}${c.indexedAt ? `, indexed ${c.indexedAt.slice(0, 10)}` : ''}`;
}
