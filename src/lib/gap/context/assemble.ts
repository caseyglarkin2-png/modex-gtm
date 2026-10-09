/**
 * THE COMMERCIAL-CONTEXT ASSEMBLER (C17, C18, C20 of the commercial-context audit, 2026-10-08). Pure over adapters.
 *
 * One packet (commercial-context.ts) built from injected source adapters: identity (the identity machinery), the
 * CRM's opportunity read, the conversation timeline (builder A's adapter, the contract's TimelineEvent[]), the
 * account knowledge (context/retrieval.ts: the vault and Clawd), the public facts (the verified signals), the
 * commitments. Each question is answered by the source AUTHORITATIVE for it (C17), never by whatever is newest:
 *
 *   deal existence      the CRM read only; a vault or Clawd line saying "no associated deal" is a seller note with
 *                       seller authority and never moves opportunity.status
 *   sent and received   the provider timeline (a draft is never a contact)
 *   buyer words         a buyer source only: an inbound message, a meeting's verbatim buyer words, a buyer's
 *                       transcript span; a seller note that quotes the buyer stays the seller's interpretation
 *   interpretation      the seller's notes and hypotheses, labelled as such
 *   external facts      public citations the research verified at their source, with their dates
 *
 * C18: every chunk already carries the trust vocabulary from its retrieval; the assembler buckets by it and keeps
 * internal context (engagement, private detail, modeled figures, standup reads) available to planning while
 * externallyUsable keeps it from the buyer. A scanner's deck views are never a buyer intent claim. Text from any
 * source is DATA: an instruction inside an email or a note changes nothing the assembler returns or calls.
 * C20: one coverage row per source (configured, reachable, complete or partial, watermark, indexedAt, query,
 * omitted reason); a vault offline, a Clawd timeout and a partial CRM read give a useful packet with honest gaps
 * over emptyPacket, never a fabricated empty history. Pinned by tests/unit/gap/stream-b-assemble.test.ts.
 */
import { contextFingerprint, emptyPacket, validateClaims, type CommercialContextPacket, type Completeness, type ContextClaim, type ContextCommitment, type ContextIdentity, type ContextOpportunity, type ContextPerson, type SourceCoverage, type SourceKind, type TimelineEvent } from './commercial-context';
import { retrieveAccountKnowledge, type AccountKnowledge, type KnowledgeAdapters } from './retrieval';
import { VERIFIED_EXCERPT, type GateSignal } from '../research/evidence-gate';
import { factUsability } from '../research/currentness';
import { hash8 } from './retrieval';

export interface IdentityQuery {
  accountName: string | null;
  aliases: readonly string[];
  domain: string | null;
  people: readonly ContextPerson[];
}

export interface OpportunityRead {
  opportunity: ContextOpportunity;
  /** The CRM read's own completeness (a truncated association page is partial). */
  completeness?: Completeness;
  watermark?: string | null;
  omittedReason?: string | null;
}

export interface TimelineRead {
  events: TimelineEvent[];
  coverage: Array<Partial<SourceCoverage> & { source: 'gmail' | 'hubspot_engagement' }>;
}

export interface AssembleAdapters {
  identity?: (q: IdentityQuery) => Promise<ContextIdentity | null>;
  /** The CRM: deal existence. Null or a throw is unknown, never none. */
  opportunity?: (identity: ContextIdentity) => Promise<OpportunityRead | null>;
  /** Builder A's thread-context adapter: the contract's events with their provider coverage. */
  timeline?: (q: { identity: ContextIdentity; threadId: string | null; now: Date }) => Promise<TimelineRead>;
  /** The vault and Clawd (context/retrieval.ts); absent means neither is configured. */
  knowledge?: KnowledgeAdapters;
  /** The verified public facts for the account (the research's signal rows). */
  publicFacts?: (q: { accountName: string; now: Date }) => Promise<GateSignal[]>;
  commitments?: (q: { accountName: string | null; identity: ContextIdentity }) => Promise<ContextCommitment[]>;
}

export interface AssembleInput {
  accountName: string | null;
  aliases?: readonly string[];
  domain?: string | null;
  people?: readonly ContextPerson[];
  threadId?: string | null;
  now: Date;
  otherAccounts?: readonly string[];
  /** What the caller already holds (a Pursue task's input): used when the adapter for it is absent, never over it. */
  seed?: { identity?: Partial<ContextIdentity>; opportunity?: ContextOpportunity; timeline?: TimelineEvent[] };
}

export interface AssembleReport {
  packet: CommercialContextPacket;
  knowledge: AccountKnowledge | null;
  /** Claims the validator refused (a bug upstream, never passed on), by fault. */
  refused: Array<{ claimId: string | null; reason: string }>;
}

/** Systems a buyer names: the incumbents the angle must not ask about as if unknown (C21). */
export const INCUMBENT_RE = /\b(open ?dock|blue yonder|bird'?s ?eye|birdseye|kaleris|claris|terminal|highway|takt|locus|manhattan|c3 ?(reservations|yard)?|transporeon|pinc|yardview|fourkites|project44|descartes|oracle|sap|yms|wms|tms)\b/i;
const NEGATION_RE = /\b(no longer|dropped|replaced|replacing|moved off|moving off|not using|stopped using|retired|sunset|cancel+ed)\b/i;
const MAX_BUYER_EVENTS = 6;

const cov = (source: SourceKind, over: Partial<SourceCoverage> = {}): SourceCoverage => ({ source, configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, query: null, omittedReason: 'not configured', ...over });
const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));
const failReason = (err: unknown) => (/abort|timeout/i.test(errText(err)) ? 'timeout' : errText(err));

/** An inbound message is the buyer's words, by the provider that holds it (C17 buyer_words). A draft or an outbound message never is. */
export function buyerClaimsFromTimeline(events: readonly TimelineEvent[], subjectId: string): ContextClaim[] {
  return events
    .filter((e) => e.direction === 'inbound' && !e.isDraft && (e.type === 'email' || e.type === 'reply_recorded' || e.type === 'meeting' || e.type === 'call') && e.excerpt && e.excerpt.trim())
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_BUYER_EVENTS)
    .map((e) => {
      const sourceId = `${e.provider}:${e.providerIds[0] ?? e.id}`;
      const text = e.excerpt!.replace(/\s+/g, ' ').trim().slice(0, 600);
      return {
        claimId: `${sourceId}:${hash8(text)}`,
        sourceId,
        sourceKind: e.provider === 'gmail' ? 'gmail' : e.provider === 'hubspot' ? 'hubspot_engagement' : 'gap',
        authority: 'buyer_words',
        eventAt: e.at,
        observedAt: e.at,
        indexedAt: null,
        url: null,
        version: null,
        completeness: e.quotedBelow ? 'partial' : 'complete',
        visibility: e.purpose === 'suspicious' || e.purpose === 'automated' ? 'internal' : 'external_ok',
        text: e.from ? `${e.from}: ${text}` : text,
        claimClass: 'buyer_said',
        about: 'account',
        subjectId,
      } satisfies ContextClaim;
    });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * The research's verified facts as checked_public claims: a public source whose excerpt was found at the source and
 * names this account; external when the research marked it external and it is still usable, else internal (an ended
 * or undated fact is context with its date, never a buyer-facing line). The outreach gate (evidence-gate.ts) decides
 * separately what may OPEN a first touch; context is wider than an opener.
 */
export function publicFactClaims(signals: readonly GateSignal[], accountName: string, now: Date): ContextClaim[] {
  const out: ContextClaim[] = [];
  for (const s of signals) {
    if (!s || !s.evidence_text?.trim()) continue;
    if (s.source_type !== 'public_primary' && s.source_type !== 'public_secondary') continue;
    if (!isObj(s.metadata) || s.metadata.verified !== VERIFIED_EXCERPT) continue;
    if (s.account_name != null && s.account_name.trim().toLowerCase() !== accountName.trim().toLowerCase()) continue;
    const u = factUsability(s, now);
    const at = s.observed_at ? new Date(s.observed_at).toISOString() : null;
    const text = s.evidence_text.replace(/\s+/g, ' ').trim().slice(0, 500);
    const sourceId = `signal:${s.id}`;
    out.push({ claimId: `${sourceId}:${hash8(text)}`, sourceId, sourceKind: 'public', authority: 'public_fact', eventAt: at, observedAt: at, indexedAt: null, url: s.evidence_url ?? null, version: null, completeness: 'complete', visibility: u.usable && s.external_ok !== false ? 'external_ok' : 'internal', text: s.title ? `${s.title}: ${text}` : text, claimClass: 'checked_public', about: 'account', subjectId: accountName });
  }
  return out;
}

/** C17: two buyer sources that name the same system, one keeping it and one dropping it, are shown in conflict (both kept). */
export function markBuyerConflicts(claims: ContextClaim[]): ContextClaim[] {
  const buyer = claims.filter((c) => c.claimClass === 'buyer_said' && !c.supersededBy);
  for (let i = 0; i < buyer.length; i += 1) {
    for (let j = i + 1; j < buyer.length; j += 1) {
      const a = buyer[i];
      const b = buyer[j];
      const sa = a.text.match(new RegExp(INCUMBENT_RE.source, 'gi'))?.map((x) => x.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? [];
      const sb = b.text.match(new RegExp(INCUMBENT_RE.source, 'gi'))?.map((x) => x.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? [];
      const shared = sa.some((x) => sb.includes(x));
      if (!shared || NEGATION_RE.test(a.text) === NEGATION_RE.test(b.text)) continue;
      a.conflictsWith = [...new Set([...(a.conflictsWith ?? []), b.claimId])];
      b.conflictsWith = [...new Set([...(b.conflictsWith ?? []), a.claimId])];
    }
  }
  return claims;
}

/** The incumbent systems the packet's claims name, by the strongest class that names each (buyer over seller over the rest). */
export function incumbentNames(packet: Pick<CommercialContextPacket, 'incumbents'>): Array<{ name: string; claimClass: ContextClaim['claimClass']; claimId: string; at: string | null }> {
  const rank: Record<string, number> = { buyer_said: 0, checked_public: 1, seller_noted: 2, internal_only: 3, inference: 4, modeled: 5 };
  const best = new Map<string, { name: string; claimClass: ContextClaim['claimClass']; claimId: string; at: string | null }>();
  for (const c of packet.incumbents) {
    for (const m of c.text.match(new RegExp(INCUMBENT_RE.source, 'gi')) ?? []) {
      const key = m.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (['yms', 'wms', 'tms', 'sap', 'oracle'].includes(key)) continue;
      const cur = best.get(key);
      if (!cur || rank[c.claimClass] < rank[cur.claimClass]) best.set(key, { name: m, claimClass: c.claimClass, claimId: c.claimId, at: c.eventAt ?? c.observedAt ?? null });
    }
  }
  return [...best.values()];
}

export async function assembleCommercialContext(adapters: AssembleAdapters, input: AssembleInput): Promise<AssembleReport> {
  const base = emptyPacket(input.now, []);
  const coverage: SourceCoverage[] = [];
  const refused: AssembleReport['refused'] = [];
  const people = [...(input.people ?? [])];
  const aliases = input.aliases ?? [];

  // Identity: the machinery when given, else what the caller already resolved (said as such), never guessed here.
  let identity: ContextIdentity = { ...base.identity, accountName: input.accountName, domains: input.domain ? [input.domain] : [], people, ...(input.seed?.identity ?? {}) };
  if (adapters.identity) {
    try {
      const r = await adapters.identity({ accountName: input.accountName, aliases, domain: input.domain ?? null, people });
      if (r) identity = { ...r, people: r.people.length ? r.people : people };
    } catch {
      /* the seed stands; identity has no coverage row of its own, the CRM row says what was read */
    }
  }

  // Opportunity (C17 deal existence): the CRM read only. Absent adapter: the seed if the caller carried a CRM read, else unknown.
  let opportunity: ContextOpportunity = input.seed?.opportunity ?? base.opportunity;
  if (adapters.opportunity) {
    try {
      const r = await adapters.opportunity(identity);
      if (r) {
        opportunity = r.opportunity;
        coverage.push(cov('crm', { configured: true, reachable: true, completeness: r.completeness ?? (r.opportunity.coverage === 'complete' ? 'complete' : 'unknown'), watermark: r.watermark ?? r.opportunity.checkedAt, query: identity.hubspotCompanyIds.join(',') || identity.accountName, omittedReason: r.omittedReason ?? null }));
        if ((r.completeness ?? 'complete') !== 'complete' && opportunity.status === 'none') opportunity = { ...opportunity, status: 'unknown' };
      } else {
        opportunity = { ...base.opportunity, coverage: 'unavailable' };
        coverage.push(cov('crm', { configured: true, reachable: false, query: identity.accountName, omittedReason: 'no read returned' }));
      }
    } catch (err) {
      opportunity = { ...base.opportunity, coverage: 'unavailable' };
      coverage.push(cov('crm', { configured: true, reachable: false, query: identity.accountName, omittedReason: failReason(err) }));
    }
  } else {
    coverage.push(cov('crm', input.seed?.opportunity ? { configured: true, reachable: input.seed.opportunity.coverage === 'complete', completeness: input.seed.opportunity.coverage === 'complete' ? 'complete' : 'unknown', watermark: input.seed.opportunity.checkedAt, query: identity.accountName, omittedReason: input.seed.opportunity.coverage === 'complete' ? 'carried from the day\'s read' : `carried: ${input.seed.opportunity.coverage}` } : {}));
  }

  // Timeline (C17 sent/received): the provider adapter, else the seed's events (what the Pursue carried).
  let timeline: TimelineEvent[] = [...(input.seed?.timeline ?? [])];
  if (adapters.timeline) {
    try {
      const r = await adapters.timeline({ identity, threadId: input.threadId ?? null, now: input.now });
      timeline = r.events;
      for (const c of r.coverage) coverage.push(cov(c.source, { configured: true, reachable: true, completeness: 'complete', omittedReason: null, ...c }));
      if (!r.coverage.some((c) => c.source === 'gmail')) coverage.push(cov('gmail', { configured: true, reachable: true, completeness: 'unknown', omittedReason: 'the adapter reported no gmail coverage' }));
    } catch (err) {
      coverage.push(cov('gmail', { configured: true, reachable: false, query: input.threadId ?? identity.accountName, omittedReason: failReason(err) }));
    }
  } else {
    coverage.push(cov('gmail', timeline.length ? { configured: true, reachable: true, completeness: 'partial', watermark: timeline.map((e) => e.at).sort().at(-1) ?? null, omittedReason: 'only the message the Pursue carried' } : {}));
  }
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  // Knowledge (C14-C16): the vault and Clawd, each with its own coverage.
  let knowledge: AccountKnowledge | null = null;
  if (adapters.knowledge && identity.accountName) {
    knowledge = await retrieveAccountKnowledge(adapters.knowledge, { accountName: identity.accountName, aliases, domain: input.domain ?? identity.domains[0] ?? null, now: input.now, otherAccounts: input.otherAccounts });
    coverage.push(...knowledge.coverage);
  } else {
    coverage.push(cov('vault', identity.accountName ? {} : { omittedReason: 'no account to read' }), cov('clawd', identity.accountName ? {} : { omittedReason: 'no account to read' }));
  }

  // Public facts (C17 public_fact).
  let external: ContextClaim[] = [];
  if (adapters.publicFacts && identity.accountName) {
    try {
      const rows = await adapters.publicFacts({ accountName: identity.accountName, now: input.now });
      external = publicFactClaims(rows, identity.accountName, input.now);
      coverage.push(cov('public', { configured: true, reachable: true, completeness: 'complete', watermark: external.map((c) => c.observedAt ?? '').filter(Boolean).sort().at(-1) ?? null, query: identity.accountName, omittedReason: null }));
    } catch (err) {
      coverage.push(cov('public', { configured: true, reachable: false, query: identity.accountName, omittedReason: failReason(err) }));
    }
  } else coverage.push(cov('public'));

  let commitments: ContextCommitment[] = [];
  if (adapters.commitments) {
    try {
      commitments = await adapters.commitments({ accountName: identity.accountName, identity });
    } catch {
      coverage.push(cov('gap', { configured: true, reachable: false, omittedReason: 'commitments unreadable' }));
    }
  }

  // Every chunk validates or is refused here (C13); then the buckets by the trust vocabulary (C18).
  const subject = identity.accountName ?? input.domain ?? 'unknown';
  const candidate = [...buyerClaimsFromTimeline(timeline, subject), ...(knowledge?.claims ?? []), ...external];
  const checked = validateClaims(candidate);
  const claims = checked.ok ? checked.claims : candidate.filter((c) => !checked.faults.some((f) => f.claimId === c.claimId));
  if (!checked.ok) refused.push(...checked.faults.map((f) => ({ claimId: f.claimId, reason: f.reason })));
  markBuyerConflicts(claims);
  const buyerFacts = claims.filter((c) => c.claimClass === 'buyer_said');
  const sellerHypotheses = claims.filter((c) => c.claimClass === 'seller_noted' || c.claimClass === 'inference' || c.claimClass === 'internal_only' || c.claimClass === 'modeled');
  const externalFacts = claims.filter((c) => c.claimClass === 'checked_public');
  const incumbents = claims.filter((c) => c.claimClass !== 'modeled' && INCUMBENT_RE.test(c.text));

  const relationship: CommercialContextPacket['relationship'] = opportunity.status === 'open' ? { value: 'active_opportunity', evidence: opportunity.deals.map((d) => `crm:deal:${d.id ?? 'unknown'}`) } : { value: 'unknown', evidence: [] };
  const body = { identity, opportunity, relationship, timeline, buyerFacts, sellerHypotheses, commitments, incumbents, externalFacts };
  const packet: CommercialContextPacket = { ...body, coverage, assembledAt: input.now.toISOString(), revision: contextFingerprint(body) };
  return { packet, knowledge, refused };
}

/** The seller words for the packet's gaps (C20): what was not read and why, one line per source with a gap. */
export function gapLines(packet: Pick<CommercialContextPacket, 'coverage'>): string[] {
  return packet.coverage.filter((c) => !c.configured || !c.reachable || c.completeness !== 'complete').map((c) => (!c.configured ? `${c.source}: not configured` : !c.reachable ? `${c.source}: could not be read${c.omittedReason ? ` (${c.omittedReason})` : ''}` : `${c.source}: ${c.completeness}${c.omittedReason ? ` (${c.omittedReason})` : ''}`));
}
