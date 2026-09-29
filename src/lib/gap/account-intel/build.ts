/**
 * THE CANONICAL ACCOUNT INTELLIGENCE BRIEF (2026-09-29): a PURE, live projection
 * over what GAP already knows about one account. No copy of truth is stored:
 * `loadAccountInputs` (load.ts) reads the canonical stores, this builds.
 *
 * Every material statement goes through the truth contract (truth.ts): a
 * verified fact or a dated audit is VERIFIED_PUBLIC; a confirmed BID is
 * BUYER_CONFIRMED and outranks public; hand-authored microsite copy is
 * INFERENCE (undated, never current truth by itself); numbers GAP computes are
 * MODELED_ESTIMATE ranges with inputs, formula and assumptions; UNKNOWN is an
 * honest answer and feeds the discovery plan. An invalid statement is dropped,
 * never rendered. Section status is derived, never scored.
 */
import { orderStatements, sectionStatus, statementProblems, type SectionStatus, type Source, type Statement, type TruthClass } from './truth';
import { suggestAngle } from '../motion/persona-angle';
import { sellerRelevance } from '../research/continuity';
import { traitsOf } from '../intake/traits';
import { deriveFit, ENTITY_LABEL, FIT_LABEL, operatingClaims, type EntityType, type YardFlowFit } from '../entity/fit';
import { sensitivityOf } from '../research/sensitivity';
import { decideApproach } from '../motion/approach';
import { computeAccountMotion, titleSeniority } from '../motion/account-motion';

// ---------------------------------------------------------------- inputs (what load.ts gathers)

export interface FactInput {
  id: string;
  quote: string;
  url: string | null;
  title: string;
  publishedAt: string;
  expiresAt: string | null;
  continuity: 'event' | 'ongoing_state' | 'ended';
  currentness: { url: string | null; publishedAt: string } | null;
}

export interface HypothesisInput {
  id: string;
  status: string;
  observation: string;
  problem: string;
  rootCauses: string[];
  impacts: string[];
  falsification: string[];
  whatANoMeans: string | null;
  primarySignalId: string | null;
  /** When Casey approved it (reviewed_at on an approved or active thesis); null for a draft. */
  reviewedAt?: string | null;
  /** The buyer rejected the problem (a human-confirmed problem_rejected disposition on it), not Casey withdrawing it. */
  buyerRejected?: boolean;
}

export interface BidInput {
  id: string;
  type: string;
  summary: string;
  quote: string;
  who: string | null;
  at: string;
  /** The hypothesis this BID was captured against (every BID has one). */
  hypothesisId: string | null;
}

export interface PersonaInput {
  id: number;
  name: string;
  title: string | null;
  doNotContact: boolean;
  hasEmail: boolean;
  emailStatus: string | null;
}

interface PackSite {
  id: string;
  name: string;
  type: string;
  archetype: string;
  archetypeName: string;
  yardMetrics: { dockDoorCount: number | null; trailersVisible: number | null; trailerParkingCapacity: number | null; truckGateCount: number | null; railServed: boolean | null };
  classification: { dropYard: boolean; guardShack: boolean; truckGate: boolean; preGateStaging: boolean; fastLaneOpportunity: boolean; dockDoors: string; dropArea: string };
  verification?: { verdict: 'confirmed' | 'probable' | 'rejected'; operator: 'self' | '3PL' | 'JV' | 'unknown'; tenancy: 'owned' | 'leased' | 'unknown'; citations: Array<{ url: string; date: string }>; imageryDate?: string; verifiedAt: string };
}

export interface PackInput {
  builtAt: string;
  account: { archetype: string; siteCount: number; networkCount?: number; networkCountSource?: string; networkCountAsOf?: string; coverageNote: { auditedCount: number; estimatedFootprint: number | null; legacyYmsFacilityCount?: number | null } | null };
  network: { totals: { dockDoors: number; trailerCapacity: number; gates: number; railServed: number }; sites: PackSite[] };
}

export interface MicrositeInput {
  network?: { facilityCount?: string; facilityTypes?: string[]; geographicSpread?: string; dailyTrailerMoves?: string; fleet?: string };
  freight?: { primaryModes?: string[]; avgLoadsPerDay?: string; keyRoutes?: string[] };
  sections?: unknown[];
}

export interface AccountInputs {
  account: { name: string; tier: string | null; priorityBand: string | null; vertical: string | null; parentBrand: string | null; hubspotCompanyId: string | null };
  aliases: string[];
  domains: string[];
  /** Other account rows whose name normalizes the same (duplicate CRM shells). */
  siblings: string[];
  watched: boolean;
  watchReasons: string[];
  facts: FactInput[];
  signals: Array<{ id: string; title: string | null; url: string | null; publishedAt: string | null; researchStatus: string }>;
  lastResearch: { at: string; outcome: string } | null;
  hypotheses: HypothesisInput[];
  /** Human-confirmed, unsuperseded BIDs only. */
  bids: BidInput[];
  personas: PersonaInput[];
  candidates: Array<{ id: number; name: string; title: string | null; state: string }>;
  memberships: Array<{ sourceName: string; sourceType: string; relationshipContext: string | null; personName: string | null; doNotContact?: boolean }>;
  firstTouches: Array<{ recipient: string; sentAt: string | null; state: string }>;
  conversation: { who: string; responseClass: string; at: string } | null;
  /** null = not read this time (the section says so). */
  opportunity: { status: 'CLEAR' | 'ACTIVE' | 'UNKNOWN'; detail: string; deals: Array<{ name: string | null; stage: string | null }> } | null;
  pack: PackInput | null;
  microsite: MicrositeInput | null;
  facilityFact: { facilityCount: string; status: 'verified' | 'provisional'; summary: string; updatedAt: string; sources: Array<{ label: string; url?: string }> } | null;
  roi: { hardSavingsAnnual: number; totalValueAnnual: number; facilities: number; calculatorVersion: string | null; assumptions: string[] } | null;
  /** What Scout found when this company was a candidate: cited, never verified at source (leads, not facts). */
  scout?: { domain: string | null; what: string | null; entityType: string | null; network: Array<{ claim: string; url: string }>; freight: Array<{ claim: string; url: string }>; at: string | null; basis?: 'web' | 'name_rules' | null; ambiguous?: boolean } | null;
}

// ---------------------------------------------------------------- the brief

export type SectionKey = 'identity' | 'footprint' | 'freight' | 'volume' | 'yard' | 'technology' | 'catalysts' | 'economics' | 'org' | 'relationships' | 'commercial';

export interface Section {
  key: SectionKey;
  title: string;
  status: SectionStatus;
  statements: Statement[];
  unknowns: string[];
  freshnessDays: number;
  /** Statements the truth contract refused (never rendered); should be empty. */
  refused: string[];
}

export interface HypothesisView {
  id: string;
  truth: TruthClass;
  observation: { text: string; verified: boolean };
  inference: string;
  problem: string;
  rootCause: string | null;
  impact: string | null;
  wrongIf: string | null;
  discoveryQuestion: string | null;
  /** Its observation is a live verified fact, or the buyer confirmed it. An ungrounded draft never leads. */
  grounded: boolean;
  /**
   * What changed since Casey approved it (THESIS NEEDS REVIEW). Never a rewrite: the thesis stays as approved and
   * this says why to look again. Empty for a draft, or when nothing material changed.
   */
  needsReview: string[];
}

export type QuestionType = 'VERIFY_PROBLEM' | 'ROOT_CAUSE' | 'IMPACT' | 'CURRENT_PROCESS' | 'CURRENT_STACK' | 'OWNERSHIP' | 'DESIRED_FUTURE' | 'CHANGE_REQUIREMENT';
export interface DiscoveryQuestion {
  type: QuestionType;
  question: string;
  /** The unknown it closes, and why it could change the motion. */
  why: string;
}

export interface WedgeCandidate {
  siteId: string;
  name: string;
  whyThisSite: string[];
  whatWeKnow: string[];
  whatWeModel: string[];
  whyPilot: string;
  mustVerify: string[];
}

export interface Wedge {
  archetype: string | null;
  note: string;
  candidates: WedgeCandidate[];
  expansion: string[];
}

export interface Thesis {
  status: string;
  whyThisAccount: string;
  whyNow: string;
  whatMayBeBroken: string;
  whyItMayMatter: string;
  whereYardFlowMayFit: string;
  wrongIf: string | null;
  whyNotPursue: string[];
}

export interface Glance {
  account: string;
  icpState: string;
  whyNow: string;
  network: string;
  freight: string;
  bestFact: string | null;
  topHypothesis: string;
  currentTech: string;
  likelyOwner: string;
  relationship: string;
  commercialState: string;
  biggestUnknown: string;
  nextQuestion: string | null;
  nextAction: string;
  /** The motion, in one line ("Fact-led: Dana Ops, on the verified fact." / "No good motion yet: ..."). */
  motion: string;
  /** "3PL / contract logistics · Direct buyer" (entity type, then YardFlow fit). */
  fit: string;
}

export type MotionType = 'IN_DEAL' | 'NO_GOOD_MOTION' | 'FOLLOW_UP' | 'REFERRAL_LED' | 'RELATIONSHIP_LED' | 'FACT_LED';
/** How to approach this account, gates first. Never overrides a gate: every send still runs its own checks. */
export interface Motion {
  type: MotionType;
  who: string | null;
  why: string;
}

export interface AccountIntelligenceBrief {
  accountName: string;
  generatedAt: string;
  sections: Record<SectionKey, Section>;
  hypotheses: HypothesisView[];
  discovery: DiscoveryQuestion[];
  thesis: Thesis;
  wedge: Wedge;
  glance: Glance;
  motion: Motion;
  /** What the company is (descriptive) and whether it could buy YardFlow (from operations), with the evidence. */
  fit: { entityType: EntityType | null; fit: YardFlowFit; why: string; evidence: string[]; scoutedAt: string | null };
  /** The HubSpot deal state as data (plans and gates read this, never the display text). */
  dealState: 'ACTIVE' | 'CLEAR' | 'UNKNOWN' | 'NOT_READ';
  /** The open deals when dealState is ACTIVE (name and stage as HubSpot said them moments ago). */
  deals: Array<{ name: string | null; stage: string | null }>;
}

// ---------------------------------------------------------------- helpers

const FRESHNESS: Record<SectionKey, number> = { identity: 365, footprint: 180, freight: 180, volume: 365, yard: 365, technology: 180, catalysts: 45, economics: 365, org: 120, relationships: 60, commercial: 14 };
const TITLES: Record<SectionKey, string> = {
  identity: 'Identity',
  footprint: 'Facility and network footprint',
  freight: 'Freight operating model',
  volume: 'Volume and production capacity',
  yard: 'Physical execution and yard model',
  technology: 'Current technology and incumbents',
  catalysts: 'Catalysts',
  economics: 'Economics (modeled)',
  org: 'Organization',
  relationships: 'Relationships',
  commercial: 'Commercial history',
};
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : 'undated');
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const money = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

const ev = (f: FactInput): Source => ({ kind: 'evidence', ref: f.id, label: f.title, url: f.url, at: f.publishedAt });
const bidSrc = (b: BidInput): Source => ({ kind: 'bid', ref: b.id, label: `${b.who ?? 'buyer'}, confirmed`, url: null, at: b.at });
const SCOUT = (at: string | null): Source => ({ kind: 'signal', ref: 'scout', label: 'Scout (cited web pass, not verified at source)', url: null, at });
const MICROSITE: Source = { kind: 'microsite', ref: null, label: 'Hand-authored microsite (undated)', url: null, at: null };

function section(key: SectionKey, statements: Statement[], unknowns: string[], now: Date): Section {
  const valid = orderStatements(statements.filter((s) => statementProblems(s).length === 0));
  const refused = statements.filter((s) => statementProblems(s).length > 0).map((s) => `${statementProblems(s).join(',')}: ${s.text.slice(0, 80)}`);
  return { key, title: TITLES[key], status: sectionStatus(valid, unknowns, FRESHNESS[key], now), statements: valid, unknowns, freshnessDays: FRESHNESS[key], refused };
}

const liveFacts = (i: AccountInputs, now: Date) => i.facts.filter((f) => f.continuity !== 'ended' && (!f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime()));
/** Seller relevance first (a network change beats a foreign divestiture), then newest. */
// A sensitive fact (people harmed) or a vendor's own marketing ("Gatik moves freight for ...") never leads.
const demoted = (q: string) => (sensitivityOf(q) ? 2 : 0) + (VENDOR_LEAD.test(q) ? 1 : 0);
const rankedFacts = (i: AccountInputs, now: Date) => liveFacts(i, now).sort((x, y) => demoted(x.quote) - demoted(y.quote) || sellerRelevance(x.quote).rank - sellerRelevance(y.quote).rank || y.publishedAt.localeCompare(x.publishedAt));

/** Sites the audit did not reject, split by who operates them. */
function auditedSites(pack: PackInput | null) {
  const sites = pack?.network.sites ?? [];
  const kept = sites.filter((s) => s.verification?.verdict !== 'rejected');
  return {
    all: sites,
    kept,
    // never assume ownership: a site with no verification is unverified, not self-operated
    self: kept.filter((s) => s.verification?.operator === 'self'),
    threePl: kept.filter((s) => s.verification?.operator === '3PL'),
    jv: kept.filter((s) => s.verification?.operator === 'JV'),
    unknownOperator: kept.filter((s) => !!s.verification && !['self', '3PL', 'JV'].includes(s.verification.operator)),
    unverified: kept.filter((s) => !s.verification),
    rejected: sites.filter((s) => s.verification?.verdict === 'rejected'),
  };
}

const citedAudit = (s: PackSite) => !!s.verification && s.verification.verdict === 'confirmed' && s.verification.citations.some((c) => c.url && c.date);
const auditSrc = (label: string, at: string | null, url: string | null = null): Source => ({ kind: 'audit', ref: label, label, url, at });
/** Audit-derived counts are VERIFIED only when at least one kept site carries a cited, confirmed verification. */
function auditTruth(i: AccountInputs, falsifiableBy: string): Pick<Statement, 'truth' | 'falsifiableBy'> & { cite: string | null } {
  // A count over the audited sites is VERIFIED only when EVERY counted site carries a cited, confirmed verification.
  const kept = auditedSites(i.pack).kept;
  const cited = kept.filter(citedAudit);
  return kept.length && cited.length === kept.length ? { truth: 'VERIFIED_PUBLIC', cite: cited[0].verification!.citations.find((c) => c.url)?.url ?? null } : { truth: 'INFERENCE', falsifiableBy, cite: null };
}
/** When the audit saw it: the OLDEST imagery (or verification) date among the audited sites, never the pack build date. */
const auditAsOf = (i: AccountInputs) => {
  const dates = auditedSites(i.pack).kept.map((s) => s.verification?.imageryDate ?? s.verification?.verifiedAt ?? null).filter((d): d is string => !!d).sort();
  return dates[0] ?? i.pack?.builtAt ?? null;
};
const splitCite = ({ cite, ...rest }: ReturnType<typeof auditTruth>) => ({ cite, rest });

// ---------------------------------------------------------------- sections

function identitySection(i: AccountInputs, now: Date): Section {
  const a = i.account;
  const rec: Source = { kind: 'account', ref: a.name, label: 'GAP account record', url: null, at: null };
  const st: Statement[] = [
    { text: `${a.name}${a.vertical ? `, ${a.vertical}` : ''}${a.tier ? `, ${a.tier}` : ''}${a.priorityBand ? ` / band ${a.priorityBand}` : ''}`, truth: 'VERIFIED_PUBLIC', sources: [rec] },
  ];
  if (i.aliases.length) st.push({ text: `Also known as: ${i.aliases.join(', ')}`, truth: 'VERIFIED_PUBLIC', sources: [rec] });
  if (i.domains.length) st.push({ text: `Domains: ${i.domains.join(', ')}`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'hubspot', ref: a.hubspotCompanyId ?? 'crm-identity', label: 'CRM identity', url: null, at: null }] });
  if (a.hubspotCompanyId) st.push({ text: `HubSpot company ${a.hubspotCompanyId}`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'hubspot', ref: a.hubspotCompanyId, label: 'HubSpot', url: null, at: null }] });
  if (a.parentBrand) st.push({ text: `Parent brand: ${a.parentBrand}`, truth: 'VERIFIED_PUBLIC', sources: [rec] });
  if (i.pack?.account.archetype) {
    const t = i.pack.account.archetype;
    st.push({ text: `Company type (audit classification): ${t}`, truth: 'INFERENCE', sources: [auditSrc('demo pack', i.pack.builtAt)], falsifiableBy: 'Its filings or site describe a different operating model.' });
  }
  const fit = accountFit(i, now);
  st.push({ text: `${fit.entityType ? ENTITY_LABEL[fit.entityType] : 'Company type unknown'}; YardFlow fit: ${FIT_LABEL[fit.fit]}. ${fit.why}${fit.evidence.length ? ` Evidence: ${fit.evidence.join('; ')}.` : ''}`, truth: 'INFERENCE', sources: [rec], falsifiableBy: 'Its own sites and operations say otherwise (who runs the facilities, yards and fleet).' });
  if (i.siblings.length) st.push({ text: `Duplicate account rows share this name: ${i.siblings.join(', ')}. People and facts may be split across them until they are merged.`, truth: 'VERIFIED_PUBLIC', sources: [rec] });
  const sc = i.scout;
  if (sc?.what || sc?.entityType) st.push({ text: `Scout: ${[sc.entityType ? `a ${sc.entityType === '3pl' ? '3PL' : sc.entityType}` : null, sc.what].filter(Boolean).join('; ')}${sc.domain ? ` (${sc.domain})` : ''}`, truth: 'INFERENCE', sources: [SCOUT(sc.at)], falsifiableBy: 'Their own site or filings describe a different business.' });
  const unknowns = [...(i.domains.length || sc?.domain ? [] : ['Company domain']), ...(a.parentBrand ? [] : ['Parent / subsidiary structure'])];
  return section('identity', st, unknowns, now);
}

function footprintSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const unknowns: string[] = [];
  const p = i.pack;
  if (p?.account.networkCount) {
    const src = p.account.networkCountSource;
    // Our own estimate is never a verified count, however it is worded; a named filing is, and its URL is the link.
    const url = src ? /https?:\/\/[^\s)]+/.exec(src)?.[0]?.replace(/[.,;]+$/, '') ?? null : null;
    // VERIFIED only with a link to the named source; a named source without one is a lead (said so).
    if (src && url && !/\b(estimat\w*|extrapolat\w*|approximat\w*|roughly|est\.|modeled|our (count|model))\b|~/i.test(src)) {
      st.push({ text: `${p.account.networkCount} facilities (${src})`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: src, label: src.replace(/\s*https?:\/\/\S+/g, '').trim() || src, url, at: p.account.networkCountAsOf ?? p.builtAt }], asOf: p.account.networkCountAsOf ?? p.builtAt });
    } else if (src) st.push({ text: `About ${p.account.networkCount} facilities (per ${src}${url ? '' : ', not linked'})`, truth: 'INFERENCE', sources: [auditSrc('demo pack', p.builtAt)], falsifiableBy: 'A filing or company source gives a different count.' });
    else st.push({ text: `About ${p.account.networkCount} facilities (audit estimate, no cited source)`, truth: 'INFERENCE', sources: [auditSrc('demo pack', p.builtAt)], falsifiableBy: 'A filing or company source gives a different count.' });
  }
  const a = auditedSites(p);
  if (a.all.length) {
    const cited = a.kept.filter(citedAudit);
    st.push({
      text: `${plural(a.all.length, 'site')} audited: ${a.self.length} self-operated, ${a.threePl.length} run by a 3PL (not counted as theirs to decide)${a.jv.length ? `, ${a.jv.length} joint venture` : ''}${a.unknownOperator.length ? `, ${a.unknownOperator.length} operator unknown` : ''}${a.unverified.length ? `, ${a.unverified.length} not yet verified` : ''}; ${a.rejected.length} rejected by verification (excluded)`,
      truth: cited.length ? 'VERIFIED_PUBLIC' : 'INFERENCE',
      sources: [auditSrc('satellite + source audit', p!.builtAt, cited[0]?.verification?.citations[0]?.url ?? null)],
      asOf: cited[0]?.verification?.verifiedAt ?? p!.builtAt,
      ...(cited.length ? {} : { falsifiableBy: 'A site verification finds a different operator or status.' }),
    });
    const types = [...new Set(a.self.map((s) => s.type))];
    if (types.length) st.push({ text: `Self-operated site types audited: ${types.join(', ')}`, truth: cited.length ? 'VERIFIED_PUBLIC' : 'INFERENCE', sources: [auditSrc('audit', p!.builtAt, cited[0]?.verification?.citations.find((c) => c.url)?.url ?? null)], asOf: p!.builtAt, ...(cited.length ? {} : { falsifiableBy: 'Verification changes the type.' }) });
  } else unknowns.push('Audited sites (ownership, types, locations)');
  if (i.facilityFact) {
    const f = i.facilityFact;
    const url = f.sources.find((s) => s.url)?.url ?? null;
    if (f.status === 'verified' && url) st.push({ text: `${f.facilityCount}: ${f.summary}`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'facility-facts', label: f.sources[0]?.label ?? 'facility registry', url, at: f.updatedAt }], asOf: f.updatedAt });
    else st.push({ text: `${f.facilityCount} (provisional): ${f.summary}`, truth: 'INFERENCE', sources: [{ kind: 'account', ref: 'facility-facts', label: 'facility registry (provisional)', url: null, at: f.updatedAt }], falsifiableBy: 'A cited source gives a different count.' });
  }
  const n = i.microsite?.network;
  if (n?.facilityCount) st.push({ text: `${n.facilityCount}${n.facilityTypes?.length ? ` (${n.facilityTypes.join(', ')})` : ''}${n.geographicSpread ? `, ${n.geographicSpread}` : ''} (hand-authored, undated)`, truth: 'INFERENCE', sources: [MICROSITE], falsifiableBy: 'A current filing or site count differs.' });
  for (const f of liveFacts(i, now).filter((x) => /\b(distribution cent|fulfil|warehouse|plant|facilit|DC\b|site)/i.test(x.quote))) {
    st.push({ text: f.quote, truth: 'VERIFIED_PUBLIC', sources: [ev(f)], asOf: f.publishedAt });
  }
  for (const c of i.scout?.network ?? []) st.push({ text: `${c.claim} (Scout lead, not yet verified at source)`, truth: 'INFERENCE', sources: [{ ...SCOUT(i.scout!.at), url: c.url }], falsifiableBy: 'The page does not say this, or a newer source differs.' });
  if (!p?.account.networkCount && !i.facilityFact) unknowns.push('Total facility count (sourced)');
  return section('footprint', st, unknowns, now);
}

const FREIGHT_WORDS = /\b(fleet|trucks?|truckload|intermodal|rail|drayage|carriers?|freight|linehaul|middle[- ]mile|DSD|direct store delivery|drop[- ]and[- ]hook|shuttle)\b/i;

function freightSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  for (const f of liveFacts(i, now).filter((x) => FREIGHT_WORDS.test(x.quote))) st.push({ text: f.quote, truth: 'VERIFIED_PUBLIC', sources: [ev(f)], asOf: f.publishedAt });
  const a = auditedSites(i.pack);
  const rail = a.kept.filter((s) => s.yardMetrics.railServed).length;
  if (a.kept.length) {
    const { cite, rest } = splitCite(auditTruth(i, 'A site visit or the railroad shows different service.'));
    st.push({ text: `${rail} of ${plural(a.kept.length, 'audited site')} rail-served`, ...rest, sources: [auditSrc('satellite audit', auditAsOf(i), cite)], asOf: auditAsOf(i) });
  }
  for (const c of i.scout?.freight ?? []) st.push({ text: `${c.claim} (Scout lead, not yet verified at source)`, truth: 'INFERENCE', sources: [{ ...SCOUT(i.scout!.at), url: c.url }], falsifiableBy: 'The page does not say this, or a newer source differs.' });
  const fr = i.microsite?.freight;
  if (fr?.primaryModes?.length) st.push({ text: `Modes: ${fr.primaryModes.join(', ')}${i.microsite?.network?.fleet ? `; fleet: ${i.microsite.network.fleet}` : ''} (hand-authored, undated)`, truth: 'INFERENCE', sources: [MICROSITE], falsifiableBy: 'Their transportation team describes a different mix.' });
  const unknowns = ['Private fleet vs dedicated vs common carrier mix', 'Drop vs live share by site type', 'Inbound pattern (supplier, plant-to-DC)'];
  return section('freight', st, unknowns, now);
}

function volumeSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const a = auditedSites(i.pack);
  const doors = a.self.reduce((n, s) => n + (s.yardMetrics.dockDoorCount ?? 0), 0);
  if (doors > 0) {
    st.push({
      text: `Roughly ${doors}-${doors * 3} door turns a day across the ${plural(a.self.length, 'self-operated audited site')}`,
      truth: 'MODELED_ESTIMATE',
      sources: [auditSrc('satellite audit dock counts', i.pack!.builtAt)],
      model: { inputs: { auditedDockDoors: doors, auditedSites: a.self.length }, formula: 'audited dock doors at self-operated sites x 1 to 3 turns per door per day', range: [doors, doors * 3], unit: 'door turns/day across self-operated audited sites', assumptions: ['1 to 3 turns per door per day (not measured)', 'Each turn is at least two yard moves (in and out)', 'Self-operated audited sites only; 3PL-run sites and the rest of the network are not counted'] },
    });
    const trailers = a.kept.reduce((n, s) => n + (s.yardMetrics.trailersVisible ?? 0), 0);
    if (trailers) {
      const { cite, rest } = splitCite(auditTruth(i, 'Newer imagery or the sites show a different count.'));
      st.push({ text: `${trailers} trailers visible across audited sites on the imagery date`, ...rest, sources: [auditSrc('satellite imagery count', auditAsOf(i), cite)], asOf: auditAsOf(i) });
    }
  }
  if (i.microsite?.network?.dailyTrailerMoves) st.push({ text: `${i.microsite.network.dailyTrailerMoves} daily trailer moves (hand-authored, undated)`, truth: 'INFERENCE', sources: [MICROSITE], falsifiableBy: 'Their yard or TMS data shows a different volume.' });
  return section('volume', st, ['Measured shipments per day', 'Peak season multiplier'], now);
}

function yardSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const a = auditedSites(i.pack);
  if (a.kept.length) {
    const c = (f: (s: PackSite) => boolean) => a.kept.filter(f).length;
    const { cite, rest } = splitCite(auditTruth(i, 'A site visit shows different yard features.'));
    st.push({
      text: `Across ${plural(a.kept.length, 'audited site')}: ${c((s) => s.classification.dropYard)} with a drop yard, ${c((s) => s.classification.guardShack)} with a guard shack, ${c((s) => s.classification.truckGate)} with a truck gate, ${c((s) => s.classification.preGateStaging)} with pre-gate staging`,
      ...rest,
      sources: [auditSrc('satellite audit', i.pack!.builtAt, cite)],
      asOf: i.pack!.builtAt,
    });
  }
  for (const b of i.bids.filter((x) => x.type === 'current_state')) st.push({ text: b.summary, truth: 'BUYER_CONFIRMED', sources: [bidSrc(b)], asOf: b.at });
  const unknowns = [...(i.bids.some((x) => x.type === 'current_state') ? [] : ['Current yard process (gate, check-in, trailer checks)']), 'Appointment scheduling in use', 'Spotter / hostler model'];
  return section('yard', st, unknowns, now);
}

const VENDORS = ['PINC', 'Kaleris', 'Terminal Industries', 'FourKites', 'project44', 'Blue Yonder', 'Manhattan Associates', 'SAP', 'Oracle', 'o9', 'Kinaxis', 'Descartes', 'C3 Solutions', 'Yard Management Solutions', 'Samsara', 'Motive', 'Trimble', 'Omnitracs', 'Transplace', 'Uber Freight', 'Gatik', 'Aurora', 'Kodiak', 'Outrider'];
/** Vendor names that are also places or words: only counted with a company qualifier next to them. */
const QUALIFIED: Record<string, RegExp> = {
  Aurora: /\bAurora (Innovation|Driver|autonomous|trucks?)\b/,
  Motive: /\bMotive (Technologies|fleet|telematics|ELD|dashcams?|AI)\b|\bgomotive\b/,
  Kodiak: /\bKodiak (Robotics|autonomous|trucks?)\b/,
  Trimble: /\bTrimble\b(?!,? (county|street|road|avenue|park))/,
  Oracle: /\bOracle\b(?! (Park|Arena|Road))/,
};
/** What each vendor does, so an autonomous-freight partner is never read as a yard system. */
const VENDOR_FUNCTION: Record<string, string> = { PINC: 'yard management', Kaleris: 'yard management', 'Terminal Industries': 'yard automation', FourKites: 'freight visibility', project44: 'freight visibility', 'Blue Yonder': 'supply chain software', 'Manhattan Associates': 'supply chain software', Manhattan: 'supply chain software', SAP: 'ERP / supply chain software', Oracle: 'ERP / supply chain software', o9: 'supply chain planning', Kinaxis: 'supply chain planning', Descartes: 'logistics software', 'C3 Solutions': 'dock scheduling / yard', 'Yard Management Solutions': 'yard management', Samsara: 'fleet telematics', Motive: 'fleet telematics', Trimble: 'fleet / transportation software', Omnitracs: 'fleet telematics', Transplace: 'managed transportation', 'Uber Freight': 'freight brokerage / managed transportation', Gatik: 'autonomous freight', Aurora: 'autonomous freight', Kodiak: 'autonomous freight', Outrider: 'autonomous yard trucks' };
const vendorRe = (v: string) => QUALIFIED[v] ?? new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, v === 'SAP' || v === 'PINC' || v === 'o9' ? '' : 'i');

/** Yard management systems (an explicit set: a yard truck or a dock scheduler is not a YMS). */
const YMS = new Set(['PINC', 'Kaleris', 'Terminal Industries', 'Yard Management Solutions']);

/**
 * What the buyer said about one vendor: current ("we use PINC"), former ("we replaced Kaleris with PINC", "we
 * used to run Kaleris") or not in use ("we don't use PINC"). Only a CURRENT buyer mention overrules the public
 * record; a former or negated one contradicts a public claim that they use it.
 */
function buyerVendorStatus(summary: string, v: string): 'current' | 'former' | 'not_in_use' {
  const at = summary.search(vendorRe(v));
  const before = at >= 0 ? summary.slice(Math.max(0, at - 60), at) : '';
  const clause = before.split(/[.;]|\bbut\b/i).pop() ?? '';
  // The verb must govern THIS vendor (right before its name): in "we replaced Kaleris with PINC" only Kaleris is former.
  if (/\b(?:(?:don'?t|do not|doesn'?t|does not|never|aren'?t|no longer)\s+(?:use|using|run|running|have|had|used)|not using)\s+(?:any\s+|the\s+|a\s+)?$/i.test(clause)) return 'not_in_use';
  if (/\b(?:replaced|moved off(?: of)?|switched (?:away )?from|got rid of|dropped|used to (?:use|run|have)|formerly (?:used|ran)?|previously (?:used|ran)?)\s+(?:the\s+|our\s+)?$/i.test(clause)) return 'former';
  const after = at >= 0 ? summary.slice(at, at + 60) : '';
  if (new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(was|were|has been|got)\\s+(replaced|removed|dropped)`, 'i').test(after)) return 'former';
  return 'current';
}
const BUYER_LABEL = { current: 'BUYER CONFIRMED', former: 'BUYER: no longer in use', not_in_use: 'BUYER: not in use' } as const;

function vendorStatus(text: string): string {
  if (/\bpilot(s|ed|ing)?\b(?! plants?\b| lines?\b| facilit)/i.test(text)) return 'PILOT';
  if (/\b(previously|formerly|replaced|former)\b/i.test(text)) return 'HISTORICAL';
  return 'PUBLIC MENTION';
}

function technologySection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const seen = new Set<string>();
  for (const b of i.bids) {
    for (const v of VENDORS) if (vendorRe(v).test(b.summary) && !seen.has(`b:${v}`)) {
      seen.add(`b:${v}`);
      st.push({ text: `${v} (${VENDOR_FUNCTION[v]}; ${BUYER_LABEL[buyerVendorStatus(b.summary, v)]}): ${b.summary}`, truth: 'BUYER_CONFIRMED', sources: [bidSrc(b)], asOf: b.at });
    }
  }
  // Buyer truth outranks public: once the buyer names their yard system, a public mention of a DIFFERENT yard
  // system is contradicted by the buyer (visible until Casey resolves it), never silently kept as current.
  const said = i.bids.flatMap((b) => VENDORS.filter((v) => vendorRe(v).test(b.summary)).map((v) => ({ v, b, status: buyerVendorStatus(b.summary, v) })));
  for (const f of liveFacts(i, now)) {
    for (const v of VENDORS) if (vendorRe(v).test(f.quote) && !seen.has(`f:${v}`)) {
      seen.add(`f:${v}`);
      const host = (() => { try { return new URL(f.url ?? '').hostname; } catch { return ''; } })();
      const partner = host && host.toLowerCase().includes(v.toLowerCase().split(' ')[0]);
      // A public HISTORICAL mention agrees with a buyer who moved on: never overruled.
      const historical = vendorStatus(f.quote) === 'HISTORICAL';
      const denied = said.find((x) => x.v === v && x.status !== 'current');
      const otherYms = YMS.has(v) ? said.find((x) => YMS.has(x.v) && x.v !== v && x.status === 'current') : undefined;
      if (!historical && (denied || otherYms)) {
        const why = denied ? `The buyer says they ${denied.status === 'former' ? 'no longer use' : 'do not use'} ${v}.` : `The buyer says they use ${otherYms!.v}.`;
        st.push({ text: `${v} (${VENDOR_FUNCTION[v]}; ${partner ? 'PARTNER CLAIM' : vendorStatus(f.quote)}, ${day(f.publishedAt)}): ${f.quote} ${why}`, truth: 'CONTRADICTED', sources: [ev(f)], contradictedBy: [bidSrc((denied ?? otherYms)!.b)], asOf: f.publishedAt });
        continue;
      }
      st.push({ text: `${v} (${VENDOR_FUNCTION[v]}; ${partner ? 'PARTNER CLAIM' : vendorStatus(f.quote)}, ${day(f.publishedAt)}): ${f.quote}`, truth: 'VERIFIED_PUBLIC', sources: [ev(f)], asOf: f.publishedAt });
    }
  }
  const prose = JSON.stringify(i.microsite?.sections ?? []);
  for (const v of VENDORS) if (vendorRe(v).test(prose) && !seen.has(`m:${v}`) && !seen.has(`b:${v}`)) {
    seen.add(`m:${v}`);
    st.push({ text: `${v} is mentioned in hand-authored microsite copy (undated; status unknown)`, truth: 'INFERENCE', sources: [MICROSITE], falsifiableBy: 'Their IT or operations team names a different system.' });
  }
  const legacy = i.pack?.account.coverageNote?.legacyYmsFacilityCount;
  if (typeof legacy === 'number') st.push({ text: `About ${legacy} facilities may run a legacy YMS (audit estimate)`, truth: 'INFERENCE', sources: [auditSrc('demo pack coverage note', i.pack!.builtAt)], falsifiableBy: 'A site visit or the buyer says otherwise.' });
  const unknowns = [...(i.bids.length ? [] : ['Yard system (YMS) in use, if any']), 'Appointment scheduling / gate system', 'Trailer visibility (GPS, RTLS, cameras)'];
  return section('technology', st, unknowns, now);
}

function catalystSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  for (const f of i.facts) {
    const live = !f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime();
    const label = f.continuity === 'ended' ? 'ENDED / SUPERSEDED' : f.continuity === 'ongoing_state' ? 'ONGOING CONDITION' : 'RECENT EVENT';
    if (!live && f.continuity !== 'ended') continue;
    st.push({ text: `${label}: ${f.quote}${f.currentness ? ` (current as of ${day(f.currentness.publishedAt)})` : ''}`, truth: 'VERIFIED_PUBLIC', sources: [ev(f)], asOf: f.currentness?.publishedAt ?? f.publishedAt });
  }
  for (const s of i.signals.filter((x) => x.researchStatus !== 'fact_found')) {
    st.push({ text: `Signal, not verified: ${s.title ?? s.url ?? 'untitled'} (${day(s.publishedAt)})`, truth: 'INFERENCE', sources: [{ kind: 'signal', ref: s.id, label: 'shared or discovered signal', url: s.url, at: s.publishedAt }], falsifiableBy: 'Research finds no verifiable fact behind it.' });
  }
  const unknowns = liveFacts(i, now).length ? [] : ['A current, verified catalyst'];
  return section('catalysts', st, unknowns, now);
}

function economicsSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  if (i.roi) {
    st.push({
      text: `${money(i.roi.hardSavingsAnnual)} to ${money(i.roi.totalValueAnnual)} a year across ${plural(i.roi.facilities, 'facility', 'facilities')} (modeled, not observed pain)`,
      truth: 'MODELED_ESTIMATE',
      sources: [{ kind: 'roi', ref: i.roi.calculatorVersion, label: 'shared ROI engine', url: null, at: null }],
      model: { inputs: { facilities: i.roi.facilities, calculator: i.roi.calculatorVersion ?? 'shared engine' }, formula: 'shared ROI engine (src/lib/microsites/roi.ts) over the facility mix: hard savings (labor, detention, paper) to total value (plus modeled production capacity and standardization)', range: [i.roi.hardSavingsAnnual, i.roi.totalValueAnnual], unit: 'USD per year', assumptions: i.roi.assumptions.length ? i.roi.assumptions : ['Engine defaults'] },
    });
  }
  const impacts = i.bids.filter((b) => b.type === 'impact' || b.type === 'metric');
  for (const b of impacts) st.push({ text: b.summary, truth: 'BUYER_CONFIRMED', sources: [bidSrc(b)], asOf: b.at });
  const unknowns = impacts.length ? [] : ['Observed cost of the problem (detention, labor, missed shipments)'];
  return section('economics', st, unknowns, now);
}

function orgSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  for (const p of i.personas) {
    const why = suggestAngle({ title: p.title, personaKey: null, accountName: i.account.name });
    const reach = p.doNotContact ? 'do not contact' : !p.hasEmail ? 'no email on record' : p.emailStatus && /bounce|invalid/.test(p.emailStatus) ? `email ${p.emailStatus}` : 'reachable';
    st.push({ text: `${p.name}${p.title ? `, ${p.title}` : ''} (${reach})`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'persona', ref: String(p.id), label: 'CRM contact', url: null, at: null }] });
    if (why) st.push({ text: `${p.name}: LIKELY ${why}`, truth: 'INFERENCE', sources: [{ kind: 'gap', ref: 'persona-angle', label: 'GAP title reading', url: null, at: null }], falsifiableBy: 'They say their role is different.' });
  }
  for (const c of i.candidates.filter((x) => x.state === 'staged')) st.push({ text: `${c.name}${c.title ? `, ${c.title}` : ''} (staged from a list, not yet vetted)`, truth: 'INFERENCE', sources: [{ kind: 'work_source', ref: String(c.id), label: 'staged candidate', url: null, at: null }], falsifiableBy: 'Review finds they are not at this account.' });
  return section('org', st, ['Who owns yard performance (never assumed from a title)', 'Who signs for yard technology'], now);
}

function relationshipSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = i.memberships.map((m) => ({
    text: `${m.relationshipContext ?? `From ${m.sourceName}`}${m.personName ? ` (${m.personName})` : ''}. Context, never evidence or consent.`,
    truth: 'VERIFIED_PUBLIC' as const,
    sources: [{ kind: 'work_source' as const, ref: m.sourceName, label: m.sourceName, url: null, at: null }],
  }));
  return section('relationships', st, i.memberships.length ? [] : ['How Casey knows anyone here'], now);
}

function commercialSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const unknowns: string[] = [];
  const o = i.opportunity;
  if (!o) unknowns.push('HubSpot deal state (not read this time)');
  else if (o.status === 'UNKNOWN') st.push({ text: `HubSpot deal state could not be read (${o.detail || 'unknown'}): held, never cold`, truth: 'UNKNOWN', sources: [] });
  else st.push({ text: o.status === 'ACTIVE' ? `Open deal: ${o.deals.map((d) => `${d.name ?? 'deal'}${d.stage ? ` (${d.stage})` : ''}`).join('; ')}` : 'No open HubSpot deal', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'hubspot', ref: 'deal-truth', label: 'HubSpot, read now', url: null, at: now.toISOString() }], asOf: now.toISOString() });
  for (const t of i.firstTouches) st.push({ text: `GAP first touch to ${t.recipient}${t.sentAt ? ` on ${day(t.sentAt)}` : ''} (${t.state})`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'ledger', ref: t.recipient, label: 'GAP send ledger', url: null, at: t.sentAt }], asOf: t.sentAt });
  if (i.conversation) st.push({ text: `Conversation with ${i.conversation.who}: ${i.conversation.responseClass.replace(/_/g, ' ')} (${day(i.conversation.at)})`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'ledger', ref: i.conversation.who, label: 'human-confirmed disposition', url: null, at: i.conversation.at }], asOf: i.conversation.at });
  for (const b of i.bids) st.push({ text: `Buyer said (${b.type.replace(/_/g, ' ')}): ${b.summary}`, truth: 'BUYER_CONFIRMED', sources: [bidSrc(b)], asOf: b.at });
  unknowns.push('Sends outside GAP (manual HubSpot or other mailboxes) are not visible here');
  return section('commercial', st, unknowns, now);
}

// ---------------------------------------------------------------- synthesis

/** An inference keeps its label wherever it is shown; only the buyer's words drop it. */
const hedge = (h: HypothesisView) => (h.truth === 'BUYER_CONFIRMED' ? h.problem : `Inference: ${h.problem}`);
const stripGuess = (s: string) => s.replace(/^my guess is (that )?/i, '').replace(/\.$/, '');

function hypothesisViews(i: AccountInputs, now: Date): HypothesisView[] {
  const verified = new Set(liveFacts(i, now).map((f) => f.id));
  // A BID speaks only to the hypothesis it was captured against. A withdrawn (rejected) draft is Casey's call, not the buyer's: it is not shown.
  return i.hypotheses.filter((h) => h.status !== 'rejected' || h.buyerRejected).slice(0, 3).map((h) => {
    const mine = i.bids.filter((b) => b.hypothesisId === h.id);
    // Buyer truth only from a live (confirmed, unsuperseded) BID on THIS thesis; a status alone never makes it buyer truth.
    const truth: TruthClass = h.buyerRejected || mine.some((b) => b.type === 'objection') ? 'CONTRADICTED' : mine.some((b) => b.type === 'business_problem') ? 'BUYER_CONFIRMED' : 'INFERENCE';
    const obsVerified = !!h.primarySignalId && verified.has(h.primarySignalId);
    return {
    id: h.id,
    truth,
    grounded: obsVerified || truth === 'BUYER_CONFIRMED',
    observation: { text: h.observation, verified: obsVerified },
    inference: stripGuess(h.problem),
    problem: stripGuess(h.problem),
    rootCause: h.rootCauses[0] ?? null,
    impact: h.impacts[0] ?? null,
    wrongIf: h.whatANoMeans ?? h.falsification[1] ?? null,
    discoveryQuestion: h.falsification[0] ?? null,
    needsReview: reviewReasons(i, h, now, verified, truth),
    };
  });
}

const monthDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** THESIS NEEDS REVIEW: material changes since Casey approved this thesis. Only an approved or active thesis can go stale on him. */
function reviewReasons(i: AccountInputs, h: HypothesisInput, now: Date, verified: ReadonlySet<string>, truth: TruthClass): string[] {
  if (!(h.status === 'approved' || h.status === 'active') || !h.reviewedAt) return [];
  const since = new Date(h.reviewedAt).getTime();
  const out: string[] = [];
  if (truth === 'CONTRADICTED') out.push('The buyer contradicted it.');
  // Buyer truth on THIS thesis (or on none), after Casey last reviewed it; the buyer confirming the problem is not a reason to look again.
  const newBid = i.bids
    .filter((b) => (b.hypothesisId === h.id || b.hypothesisId == null) && b.type !== 'business_problem' && new Date(b.at).getTime() > since)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  if (newBid) out.push(`The buyer said something after you approved it (${newBid.type.replace(/_/g, ' ')}, ${monthDay(newBid.at)}).`);
  if (h.primarySignalId && !verified.has(h.primarySignalId)) out.push('Its fact is no longer live: the thesis rests on nothing current.');
  // A newer fact matters only when it is a strong seller fact (a network, site or automation change) that beats a
  // live primary fact; a missing or stale primary is already said above.
  const primary = i.facts.find((f) => f.id === h.primarySignalId);
  if (primary && verified.has(primary.id)) {
    const primaryRank = sellerRelevance(primary.quote).rank;
    const better = rankedFacts(i, now).find((f) => f.id !== primary.id && new Date(f.publishedAt).getTime() > since && sellerRelevance(f.quote).rank <= 3 && sellerRelevance(f.quote).rank < primaryRank);
    if (better) out.push(`A newer fact (${sellerRelevance(better.quote).reason}, ${monthDay(better.publishedAt)}) may change the story.`);
  }
  return out;
}

function discoveryPlan(i: AccountInputs, hyps: HypothesisView[], _wedge: Wedge): DiscoveryQuestion[] {
  const top = hyps.find((h) => h.truth !== 'CONTRADICTED' && h.grounded);
  // Problem-scoped buyer truth belongs to the thesis it was captured on; the current state is account-wide.
  const onTop = (t: string) => i.bids.some((b) => b.type === t && (!top || b.hypothesisId === top.id || b.hypothesisId == null));
  const any = (t: string) => i.bids.some((b) => b.type === t);
  // Never name a site the buyer has not named (a satellite-found site in a first question reads as surveillance).
  const where = PARTNER_VERTICAL.test(i.account.vertical ?? '') ? 'your sites' : 'your plants and DCs';
  const out: DiscoveryQuestion[] = [];
  if (!any('current_state')) out.push({ type: 'CURRENT_PROCESS', question: `How do trailers get checked in and found at ${where} today?`, why: 'Current state first: it is non-leading and sets the pilot scope.' });
  if (!onTop('business_problem')) {
    out.push(
      top
        ? { type: 'VERIFY_PROBLEM', question: top.discoveryQuestion ?? `Is this true at ${where}: ${top.problem}?`, why: 'The problem is still our inference; a yes or no changes whether to pursue.' }
        : { type: 'VERIFY_PROBLEM', question: `What slows trucks and trailers down at ${where}, if anything?`, why: 'No thesis yet: let the buyer name the problem, never presume one.' },
    );
  }
  if (top?.rootCause && !onTop('root_cause')) out.push({ type: 'ROOT_CAUSE', question: `When it happens, is it ${top.rootCause.charAt(0).toLowerCase()}${top.rootCause.slice(1).replace(/\.$/, '')}, or something else?`, why: 'The root cause decides whether yard visibility is the fix.' });
  if (!onTop('impact') && !onTop('metric')) {
    out.push(
      onTop('business_problem')
        ? { type: 'IMPACT', question: 'When it happens, what does it cost you: detention, overtime, missed shipments, or nothing much?', why: 'The buyer named the problem; its cost decides whether it is worth fixing.' }
        : { type: 'IMPACT', question: 'Is yard time something you measure today? When it runs long, what does it cost you, if anything?', why: 'Without an observed cost, the economics stay modeled.' },
    );
  }
  const techKnown = i.bids.some((b) => VENDORS.some((v) => vendorRe(v).test(b.summary)));
  if (!techKnown) out.push({ type: 'CURRENT_STACK', question: 'What system, if any, tracks trailers in your yards today?', why: 'An incumbent changes the wedge; never assumed from a mention.' });
  out.push({ type: 'OWNERSHIP', question: `Who owns yard performance across ${where}?`, why: 'Ownership is never guessed from a title.' });
  if (!any('future_state')) out.push({ type: 'DESIRED_FUTURE', question: 'What would good yards look like a year from now?', why: 'The desired future frames any proposal.' });
  if (!any('constraint')) out.push({ type: 'CHANGE_REQUIREMENT', question: 'What would a change have to clear: IT, security, the sites themselves?', why: 'Requirements decide whether a pilot can start.' });
  return out.slice(0, 7);
}

const PARTNER_VERTICAL = /\b(3pl|logistics|carrier|freight|trucking|broker)\b/i;
/** A vendor's own marketing names the vendor first ("Gatik moves freight for ..."): context, never the opener. */
const VENDOR_LEAD = /^[\s"'“‘]*(PINC|Kaleris|Terminal Industries|FourKites|project44|Blue Yonder|Manhattan Associates|Descartes|Samsara|Motive|Trimble|Uber Freight|Gatik|Aurora|Kodiak|Outrider)\b/;
const stateOf = (name: string) => /\b([A-Z]{2})(?:\s*\(|\s*$)/.exec(name)?.[1] ?? null;

function siteWedge(i: AccountInputs): Wedge {
  const a = auditedSites(i.pack);
  const eligible = a.self.filter((s) => s.verification?.verdict === 'confirmed' || s.verification?.verdict === 'probable');
  if (!eligible.length) return { archetype: null, note: i.pack ? 'No confirmed self-operated audited site yet: the wedge is UNKNOWN.' : 'No audited site data: the wedge is UNKNOWN until sites are audited.', candidates: [], expansion: [] };
  const byArch = new Map<string, PackSite[]>();
  for (const s of eligible) byArch.set(s.archetypeName, [...(byArch.get(s.archetypeName) ?? []), s]);
  const [archetype, group] = [...byArch.entries()].sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))[0];
  const features = (s: PackSite) => [s.classification.dropYard ? 'drop yard' : null, s.classification.guardShack ? 'guard shack' : null, s.classification.preGateStaging ? 'room to stage trucks before the gate' : null, s.classification.fastLaneOpportunity ? 'a possible fast lane at the gate' : null, s.yardMetrics.dockDoorCount ? `${s.yardMetrics.dockDoorCount} dock doors` : null].filter((x): x is string => !!x);
  // Candidates come from the chosen kind of site only; the start site is a typical one (median size), not the biggest.
  const median = [...group].map((s) => s.yardMetrics.dockDoorCount ?? 0).sort((x, y) => x - y)[Math.floor(group.length / 2)] ?? 0;
  const ranked = [...group].sort((x, y) => Math.abs((x.yardMetrics.dockDoorCount ?? 0) - median) - Math.abs((y.yardMetrics.dockDoorCount ?? 0) - median) || features(y).length - features(x).length || x.id.localeCompare(y.id)).slice(0, 3);
  const candidates: WedgeCandidate[] = ranked.map((s) => ({
    siteId: s.id,
    name: s.name,
    whyThisSite: features(s),
    whatWeKnow: [`Audit verdict ${s.verification?.verdict}${s.verification?.citations.length ? ` with ${plural(s.verification.citations.length, 'citation')}` : ''}`, `Operator: ${s.verification?.operator ?? 'self'}; tenancy: ${s.verification?.tenancy ?? 'unknown'}`, ...(s.verification?.imageryDate ? [`Imagery ${s.verification.imageryDate}`] : [])],
    whatWeModel: s.yardMetrics.dockDoorCount ? [`${s.yardMetrics.dockDoorCount}-${s.yardMetrics.dockDoorCount * 3} trailer moves a day (1 to 3 turns per door; not measured)`] : [],
    whyPilot: `A typical self-operated site of this kind (${s.archetypeName}), with ${features(s).slice(0, 2).join(' and ') || 'visible yard activity'}: results there would say something about the others (inference; a willing site leader matters more than any feature).`,
    mustVerify: ['The current yard process (gate, check-in, trailer checks)', 'The system in use, if any', 'Who runs yard operations at this site', ...(s.verification?.tenancy === 'unknown' ? ['Tenancy'] : []), ...(s.verification?.verdict === 'probable' ? ['That the site is theirs and active (verification is probable)'] : [])],
  }));
  // Expansion only where warranted: never inside a deal (the deal sets scope), REGIONAL only for audited sites of the
  // same kind in the start site's state, NETWORK only on a cited facility count.
  const startState = ranked[0] ? stateOf(ranked[0].name) : null;
  const nearby = startState ? group.filter((s) => s !== ranked[0] && stateOf(s.name) === startState) : [];
  const citedCount = i.pack?.account.networkCount && /https?:\/\//.test(i.pack.account.networkCountSource ?? '') ? i.pack.account.networkCount : null;
  const expansion = i.opportunity?.status === 'ACTIVE'
    ? []
    : ['PILOT: one candidate site', 'PROOF: measured before/after at that site', ...(nearby.length ? [`REGIONAL: ${plural(nearby.length, 'other audited site')} of this kind in ${startState}`] : []), ...(citedCount ? [`NETWORK: up to ${citedCount} facilities (cited count; only after proof)`] : [])];
  return { archetype: `${archetype} (${plural(group.length, 'self-operated site')} audited)`, note: 'Inference from audited sites; nothing about site-level conditions is assumed. Site names are for you, never for the first conversation.', candidates, expansion };
}

/** The next action, read off the ONE motion decision (never a second decision tree). */
function nextAction(i: AccountInputs, m: Motion, now: Date): string {
  switch (m.type) {
    case 'IN_DEAL':
      return 'Work the deal (In Deals), never cold. Next learning: the Deal brief objective.';
    case 'FOLLOW_UP':
      return `Follow up with ${m.who ?? 'them'} in the existing thread.`;
    case 'FACT_LED':
      return `Review the thesis, then use the verified fact in a first touch to ${m.who ?? 'the primary person'} (every gate runs at the click).`;
    case 'REFERRAL_LED':
    case 'RELATIONSHIP_LED':
      return `Reach out to ${m.who ?? 'them'} through how you know them and ask for their perspective (your own note; GAP drafts nothing yet).`;
    default:
      return liveFacts(i, now).length || /Not a shipper prospect/.test(m.why) ? m.why : `${m.why} Research first (Deepen catalysts on this page).`;
  }
}

const WATCH_REASON: Record<string, string> = { priority: 'priority account', gap_thesis: 'has a GAP thesis', buying_committee: 'buying committee mapped', audited_for_page: 'audited for a /for page' };

const MOTION_LABEL: Record<MotionType, string> = { IN_DEAL: 'In a deal', NO_GOOD_MOTION: 'No good motion yet', FOLLOW_UP: 'Follow-up', REFERRAL_LED: 'Referral-led', RELATIONSHIP_LED: 'Relationship-led', FACT_LED: 'Fact-led' };

/**
 * The account motion, gates first: an open deal, then anything that says "not now" (an unreadable deal state,
 * a contradicted story, nobody reachable), then the strongest honest way in: a live conversation, a referral,
 * someone Casey met, a verified fact with a hypothesis grounded in it. A newsletter subscription is context,
 * not a way in. With none of these the answer is "do not contact yet".
 */
function accountMotion(i: AccountInputs, hyps: HypothesisView[], now: Date, primary: PersonaInput | undefined): Motion {
  const reachable = i.personas.filter((p) => !p.doNotContact && p.hasEmail);
  // How Casey knows someone here: engaged sources first (met, referred), then relational ones; never a do-not-contact person.
  const members = i.memberships.filter((m) => !m.doNotContact && (traitsOf(m.sourceType).engaged || traitsOf(m.sourceType).relational));
  const known = members.find((m) => traitsOf(m.sourceType).engaged) ?? members[0] ?? null;
  // The account motion gate's own reading of first touches (one cold email motion at a time).
  const gate = computeAccountMotion({
    accountName: i.account.name,
    readyEmailCards: [],
    choice: null,
    firstTouches: i.firstTouches.map((t) => ({ personaId: null, recipient: t.recipient, sentAt: t.sentAt ?? now.toISOString(), released: t.state === 'released', ...(t.state === 'draft outstanding' ? { outstanding: true } : {}) })),
    replyHold: null,
    conversation: null,
    now,
  });
  const a = decideApproach({
    deal: i.opportunity ? i.opportunity.status : 'NOT_READ',
    contradicted: hyps.some((h) => h.truth === 'CONTRADICTED'),
    conversation: i.conversation,
    touchHold: gate.state === 'in_motion' ? gate.headline : null,
    verifiedFact: liveFacts(i, now).length > 0,
    reachable: reachable.length > 0 || (!i.personas.length && !!known?.personName),
    source: known ? { sourceType: known.sourceType, context: known.relationshipContext, name: known.sourceName } : null,
    groundedThesis: hyps.some((h) => h.grounded && h.truth !== 'CONTRADICTED'),
    staleThesis: !hyps.some((h) => h.grounded && h.truth !== 'CONTRADICTED' && h.needsReview.length === 0) && hyps.some((h) => h.grounded && h.needsReview.length > 0),
    sensitiveOnly: (() => {
      const live = liveFacts(i, now);
      return live.length && live.every((f) => sensitivityOf(f.quote)) ? sensitivityOf(live[0].quote) : null;
    })(),
    fit: accountFit(i, now),
  });
  const who = a.kind === 'FACT_LED' ? (primary && !primary.doNotContact && primary.hasEmail ? primary : reachable[0])?.name ?? null : a.kind === 'FOLLOW_UP' ? i.conversation?.who ?? null : a.kind === 'REFERRAL_LED' || a.kind === 'RELATIONSHIP_LED' ? known?.personName ?? null : null;
  return { type: a.kind, who, why: a.why };
}

const motionLine = (m: Motion) => (m.type === 'FACT_LED' ? `Fact-led: ${m.who ?? 'the primary person'}, on the verified fact.` : m.type === 'NO_GOOD_MOTION' ? `No good motion yet: ${m.why.replace(/^Do not contact yet: /, '')}` : `${MOTION_LABEL[m.type]}${m.who ? `: ${m.who}` : ''}. ${m.why}`);

/** Titles that plausibly touch the yard; still LIKELY, never ownership. */
const OWNER_TITLE = /\b(supply chain|logistics|distribution|transportation|warehous|fulfil|yard|operations)\b/i;
const NOT_OWNER_TITLE = /\b(sourcing|procurement|purchasing|category|planning|planner|analyst|buyer|coordinator|specialist|intern)\b/i;

/** What the account record's vertical says the company is (descriptive only; never the fit). */
export function typeFromVertical(v: string | null): EntityType | null {
  // Stems match whole words and their endings ("Manufacturing", "Automotive", "Warehousing"); order matters
  // ("Food Distribution" is a distributor before it is food).
  const s = v ?? '';
  const has = (re: string) => new RegExp(`\\b(${re})\\w*`, 'i').test(s);
  if (has('port|terminal|marine')) return 'port_terminal';
  if (has('broker')) return 'broker';
  if (has('3pl|logistic|warehous|contract logistic|fulfil')) return '3pl';
  if (has('carrier|trucking|transport|freight|rail|drayage')) return 'carrier';
  if (has('retail|grocer|e-?commerce|supermarket')) return 'retailer';
  if (has('distribut|wholesale|foodservice')) return 'distributor';
  if (has('food|beverage|cpg|consumer|manufactur|chemical|automo|auto|industrial|paper|packag|pharma|agri|building|dairy|bottl|brew|steel|metal')) return 'manufacturer';
  if (has('software|technolog|saas|consult')) return 'vendor';
  return null;
}

/**
 * The account's YardFlow fit: entity type from Scout, else the record's vertical (descriptive); fit from the
 * OPERATING evidence GAP holds (audited sites, a sourced facility count, live facts and Scout claims about
 * facilities, yards, fleets). A 3PL or carrier that runs sites is a direct buyer, never a "partner" by label.
 */
export function accountFit(i: AccountInputs, now: Date): { entityType: EntityType | null; fit: YardFlowFit; why: string; evidence: string[]; scoutedAt: string | null } {
  // Scout counts only from a web pass on the RIGHT company (never a name rule, never an ambiguous identity).
  const scout = i.scout && i.scout.basis !== 'name_rules' && !i.scout.ambiguous ? i.scout : null;
  const entityType = (scout?.entityType as EntityType | undefined) ?? typeFromVertical(i.account.vertical);
  const a = auditedSites(i.pack);
  const evidence: string[] = [];
  // Only sites the audit verified as self-operated are the company's own operations (a 3PL-run or unverified
  // site says little about what this company runs).
  const own = a.self.filter((s) => s.verification?.verdict === 'confirmed' || s.verification?.verdict === 'probable');
  if (own.length) evidence.push(`${plural(own.length, 'verified self-operated site')} with yards`);
  if (i.facilityFact?.status === 'verified') evidence.push(`sourced facility count: ${i.facilityFact.facilityCount}`);
  for (const f of liveFacts(i, now)) if (operatingClaims([{ claim: f.quote }]).length) evidence.push(`fact: ${f.quote.slice(0, 90)}`);
  for (const c of operatingClaims([...(scout?.network ?? []), ...(scout?.freight ?? [])])) evidence.push(`Scout lead: ${c.claim.slice(0, 90)}`);
  // Each verified self-operated site is its own piece of operating evidence.
  const f = deriveFit({ entityType, operating: evidence.length + Math.max(own.length - 1, 0), ambiguous: false, what: scout?.what ?? null });
  return { entityType, fit: f.fit, why: f.why, evidence: evidence.slice(0, 4), scoutedAt: i.scout?.basis === 'web' ? i.scout.at : null };
}

// ---------------------------------------------------------------- the build

export function buildAccountBrief(i: AccountInputs, now: Date): AccountIntelligenceBrief {
  const sections: Record<SectionKey, Section> = {
    identity: identitySection(i, now),
    footprint: footprintSection(i, now),
    freight: freightSection(i, now),
    volume: volumeSection(i, now),
    yard: yardSection(i, now),
    technology: technologySection(i, now),
    catalysts: catalystSection(i, now),
    economics: economicsSection(i, now),
    org: orgSection(i, now),
    relationships: relationshipSection(i, now),
    commercial: commercialSection(i, now),
  };
  const hypotheses = hypothesisViews(i, now);
  const wedge = siteWedge(i);
  const discovery = discoveryPlan(i, hypotheses, wedge);
  const live = rankedFacts(i, now);
  const top = hypotheses.find((h) => h.truth !== 'CONTRADICTED' && h.grounded) ?? hypotheses.find((h) => h.truth === 'CONTRADICTED') ?? null;
  const drafts = hypotheses.filter((h) => !h.grounded && h.truth !== 'CONTRADICTED').length;
  const noHypothesis = drafts ? `No strong hypothesis yet (${plural(drafts, 'ungrounded draft')} ${drafts === 1 ? 'exists: its observation is' : 'exist: their observations are'} not a live verified fact).` : 'No strong hypothesis yet.';

  const whyNot: string[] = [];
  if (i.opportunity?.status === 'ACTIVE') whyNot.push('There is an open deal: work it from the deal, never cold.');
  if (!i.watched) whyNot.push('Not in the watched universe (tier / band / thesis / watchlist).');
  if (!live.length) whyNot.push('No live verified fact: nothing public to open on yet.');
  if (hypotheses.some((h) => h.truth === 'CONTRADICTED')) whyNot.push('The buyer rejected or contradicted the current story.');
  if (i.bids.some((b) => VENDORS.some((v) => vendorRe(v).test(b.summary)))) whyNot.push('The buyer confirmed an incumbent system: a displacement story needs its own evidence.');
  const aud = auditedSites(i.pack);
  if (aud.kept.length && aud.threePl.length > aud.self.length) whyNot.push('Most audited sites are 3PL-operated: the yard decision may sit with the 3PL.');
  const fit = accountFit(i, now);
  if (fit.fit === 'PARTNER' || fit.fit === 'NOT_FIT' || fit.fit === 'UNKNOWN') whyNot.push(`${FIT_LABEL[fit.fit]}: ${fit.why}`);
  const sensitive = live[0] ? sensitivityOf(live[0].quote) : null;
  if (sensitive) whyNot.push(`The best fact is sensitive (${sensitive}): reference the network change, never the people affected, or choose a different opener.`);

  const econ = sections.economics.statements.find((s) => s.truth === 'MODELED_ESTIMATE' || s.truth === 'BUYER_CONFIRMED');
  // An approved thesis the world moved under: flagged, never rewritten.
  const stale = top?.needsReview.length ? top : hypotheses.find((h) => h.needsReview.length > 0);
  const thesis: Thesis = {
    status: stale ? `THESIS NEEDS REVIEW: ${stale.needsReview.join(' ')}` : 'INFERENCE, for your review (never approved by GAP)',
    whyThisAccount: [i.watched ? `Watched: ${i.watchReasons.map((r) => WATCH_REASON[r] ?? r.replace(/_/g, ' ')).join(', ') || 'priority account'}` : 'Not watched', live[0] ? `best fact: ${live[0].quote}` : 'no verified fact yet'].join('; '),
    whyNow: live[0] ? `${live[0].continuity === 'ongoing_state' ? 'Ongoing' : 'Recent'}: ${live[0].quote} (${day(live[0].currentness?.publishedAt ?? live[0].publishedAt)})${sensitive ? ` SENSITIVE (${sensitive}): never the hook; reference the network change only.` : ''}` : 'No current, verified catalyst.',
    whatMayBeBroken: top ? hedge(top) : `Unknown: ${noHypothesis}`,
    whyItMayMatter: econ ? econ.text : 'Unknown: no economics yet.',
    whereYardFlowMayFit: wedge.archetype ? `${wedge.archetype}${wedge.candidates[0] ? `; start at ${wedge.candidates[0].name}` : ''}` : 'Unknown: no audited site data.',
    wrongIf: top?.wrongIf ?? null,
    whyNotPursue: whyNot,
  };

  // Current tech is what the BUYER said; a public mention is labelled as only that, never adoption.
  const techBuyer = sections.technology.statements.find((s) => s.truth === 'BUYER_CONFIRMED');
  const techPublic = sections.technology.statements.find((s) => s.truth === 'VERIFIED_PUBLIC');
  const currentTech = techBuyer ? techBuyer.text : techPublic ? `Public mention only: ${techPublic.text}` : 'Unknown';
  const dealStatement = sections.commercial.statements.find((s) => s.sources.some((x) => x.ref === 'deal-truth') || (s.truth === 'UNKNOWN' && /deal state/.test(s.text)));
  const reach = i.personas.filter((p) => !p.doNotContact && p.hasEmail);
  // Who probably owns it: operations titles only (never sourcing, procurement, category, planning or analyst), most senior first.
  const owners = (list: PersonaInput[]) => list.filter((p) => OWNER_TITLE.test(p.title ?? '') && !NOT_OWNER_TITLE.test(p.title ?? '')).sort((x, y) => titleSeniority(y.title) - titleSeniority(x.title));
  const persona = owners(reach)[0] ?? owners(i.personas)[0] ?? reach[0] ?? i.personas[0];
  const motion = accountMotion(i, hypotheses, now, persona);
  const owner = persona ? `${persona.name}${persona.title ? `, ${persona.title}` : ''} (LIKELY; ownership never assumed)` : 'Unknown: no person at this account yet.';
  const biggestUnknown = discovery[0] ? `${discovery[0].type.replace(/_/g, ' ').toLowerCase()}: ${discovery[0].why}` : 'None open.';
  const glance: Glance = {
    account: i.account.name,
    icpState: i.opportunity?.status === 'ACTIVE' ? 'In a deal' : i.watched ? `Watched: ${i.watchReasons.map((r) => WATCH_REASON[r] ?? r.replace(/_/g, ' ')).join(', ') || 'priority account'}` : 'Not in the watched universe',
    whyNow: thesis.whyNow,
    network: sections.footprint.statements[0]?.text ?? 'Unknown',
    freight: sections.freight.statements[0]?.text ?? 'Unknown',
    bestFact: live[0]?.quote ?? null,
    topHypothesis: top ? hedge(top) : noHypothesis,
    currentTech,
    likelyOwner: owner,
    relationship: sections.relationships.statements[0]?.text ?? 'None recorded',
    commercialState: dealStatement?.text ?? 'HubSpot deal state not read',
    biggestUnknown,
    nextQuestion: discovery[0]?.question ?? null,
    nextAction: nextAction(i, motion, now),
    motion: motionLine(motion),
    fit: `${fit.entityType ? ENTITY_LABEL[fit.entityType] : 'Type unknown'} · ${FIT_LABEL[fit.fit]}`,
  };
  const dealState = i.opportunity ? i.opportunity.status : 'NOT_READ';
  return { accountName: i.account.name, generatedAt: now.toISOString(), sections, hypotheses, discovery, thesis, wedge, glance, fit, dealState, deals: i.opportunity?.status === 'ACTIVE' ? i.opportunity.deals : [], motion };
}
