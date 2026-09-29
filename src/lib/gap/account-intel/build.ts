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
  memberships: Array<{ sourceName: string; sourceType: string; relationshipContext: string | null; personName: string | null }>;
  firstTouches: Array<{ recipient: string; sentAt: string | null; state: string }>;
  conversation: { who: string; responseClass: string; at: string } | null;
  /** null = not read this time (the section says so). */
  opportunity: { status: 'CLEAR' | 'ACTIVE' | 'UNKNOWN'; detail: string; deals: Array<{ name: string | null; stage: string | null }> } | null;
  pack: PackInput | null;
  microsite: MicrositeInput | null;
  facilityFact: { facilityCount: string; status: 'verified' | 'provisional'; summary: string; updatedAt: string; sources: Array<{ label: string; url?: string }> } | null;
  roi: { hardSavingsAnnual: number; totalValueAnnual: number; facilities: number; calculatorVersion: string | null; assumptions: string[] } | null;
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
const MICROSITE: Source = { kind: 'microsite', ref: null, label: 'Hand-authored microsite (undated)', url: null, at: null };

function section(key: SectionKey, statements: Statement[], unknowns: string[], now: Date): Section {
  const valid = orderStatements(statements.filter((s) => statementProblems(s).length === 0));
  const refused = statements.filter((s) => statementProblems(s).length > 0).map((s) => `${statementProblems(s).join(',')}: ${s.text.slice(0, 80)}`);
  return { key, title: TITLES[key], status: sectionStatus(valid, unknowns, FRESHNESS[key], now), statements: valid, unknowns, freshnessDays: FRESHNESS[key], refused };
}

const liveFacts = (i: AccountInputs, now: Date) => i.facts.filter((f) => f.continuity !== 'ended' && (!f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime()));
/** Seller relevance first (a network change beats a foreign divestiture), then newest. */
const rankedFacts = (i: AccountInputs, now: Date) => liveFacts(i, now).sort((x, y) => sellerRelevance(x.quote).rank - sellerRelevance(y.quote).rank || y.publishedAt.localeCompare(x.publishedAt));

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
  const cited = auditedSites(i.pack).kept.filter(citedAudit);
  return cited.length ? { truth: 'VERIFIED_PUBLIC', cite: cited[0].verification!.citations.find((c) => c.url)?.url ?? null } : { truth: 'INFERENCE', falsifiableBy, cite: null };
}
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
  if (i.siblings.length) st.push({ text: `Duplicate account rows share this name: ${i.siblings.join(', ')}. People and facts may be split across them until they are merged.`, truth: 'VERIFIED_PUBLIC', sources: [rec] });
  const unknowns = [...(i.domains.length ? [] : ['Company domain']), ...(a.parentBrand ? [] : ['Parent / subsidiary structure'])];
  return section('identity', st, unknowns, now);
}

function footprintSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const unknowns: string[] = [];
  const p = i.pack;
  if (p?.account.networkCount) {
    if (p.account.networkCountSource) st.push({ text: `${p.account.networkCount} facilities (${p.account.networkCountSource})`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: p.account.networkCountSource, label: p.account.networkCountSource, url: /^https?:\/\//.test(p.account.networkCountSource) ? p.account.networkCountSource : null, at: p.account.networkCountAsOf ?? p.builtAt }], asOf: p.account.networkCountAsOf ?? p.builtAt });
    else st.push({ text: `About ${p.account.networkCount} facilities (audit estimate, no cited source)`, truth: 'INFERENCE', sources: [auditSrc('demo pack', p.builtAt)], falsifiableBy: 'A filing or company source gives a different count.' });
  }
  const a = auditedSites(p);
  if (a.all.length) {
    const cited = a.kept.filter(citedAudit);
    st.push({
      text: `${plural(a.all.length, 'site')} audited: ${a.self.length} self-operated, ${a.threePl.length} 3PL-operated (not counted as owned)${a.jv.length ? `, ${a.jv.length} joint venture` : ''}${a.unknownOperator.length ? `, ${a.unknownOperator.length} operator unknown` : ''}${a.unverified.length ? `, ${a.unverified.length} not yet verified` : ''}; ${a.rejected.length} rejected by verification (excluded)`,
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
    st.push({ text: `${rail} of ${plural(a.kept.length, 'audited site')} rail-served`, ...rest, sources: [auditSrc('satellite audit', i.pack!.builtAt, cite)], asOf: i.pack!.builtAt });
  }
  const fr = i.microsite?.freight;
  if (fr?.primaryModes?.length) st.push({ text: `Modes: ${fr.primaryModes.join(', ')}${i.microsite?.network?.fleet ? `; fleet: ${i.microsite.network.fleet}` : ''} (hand-authored, undated)`, truth: 'INFERENCE', sources: [MICROSITE], falsifiableBy: 'Their transportation team describes a different mix.' });
  const unknowns = ['Private fleet vs dedicated vs common carrier mix', 'Drop vs live share by site type', 'Inbound pattern (supplier, plant-to-DC)'];
  return section('freight', st, unknowns, now);
}

function volumeSection(i: AccountInputs, now: Date): Section {
  const st: Statement[] = [];
  const a = auditedSites(i.pack);
  const doors = a.self.reduce((n, s) => n + (s.yardMetrics.dockDoorCount ?? 0), 0) + a.threePl.reduce((n, s) => n + (s.yardMetrics.dockDoorCount ?? 0), 0);
  if (doors > 0) {
    st.push({
      text: `Roughly ${doors}-${doors * 3} trailer moves a day across the ${plural(a.kept.length, 'audited site')}`,
      truth: 'MODELED_ESTIMATE',
      sources: [auditSrc('satellite audit dock counts', i.pack!.builtAt)],
      model: { inputs: { auditedDockDoors: doors, auditedSites: a.kept.length }, formula: 'audited dock doors x 1 to 3 trailer turns per door per day', range: [doors, doors * 3], unit: 'trailer moves/day across audited sites', assumptions: ['1 to 3 turns per door per day (not measured)', 'Audited sites only; the rest of the network is not counted'] },
    });
    const trailers = a.kept.reduce((n, s) => n + (s.yardMetrics.trailersVisible ?? 0), 0);
    if (trailers) {
      const { cite, rest } = splitCite(auditTruth(i, 'Newer imagery or the sites show a different count.'));
      st.push({ text: `${trailers} trailers visible across audited sites on the imagery date`, ...rest, sources: [auditSrc('satellite imagery count', i.pack!.builtAt, cite)], asOf: i.pack!.builtAt });
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
      st.push({ text: `${v} (${VENDOR_FUNCTION[v]}; BUYER CONFIRMED): ${b.summary}`, truth: 'BUYER_CONFIRMED', sources: [bidSrc(b)], asOf: b.at });
    }
  }
  for (const f of liveFacts(i, now)) {
    for (const v of VENDORS) if (vendorRe(v).test(f.quote) && !seen.has(`f:${v}`)) {
      seen.add(`f:${v}`);
      const host = (() => { try { return new URL(f.url ?? '').hostname; } catch { return ''; } })();
      const partner = host && host.toLowerCase().includes(v.toLowerCase().split(' ')[0]);
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
    st.push({ text: `${p.name}${p.title ? `, ${p.title}` : ''} (${reach})${why ? `. LIKELY: ${why}` : ''}`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'persona', ref: String(p.id), label: 'CRM contact', url: null, at: null }] });
  }
  for (const c of i.candidates.filter((x) => x.state === 'staged')) st.push({ text: `${c.name}${c.title ? `, ${c.title}` : ''} (staged, not yet a contact)`, truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'work_source', ref: String(c.id), label: 'staged candidate', url: null, at: null }] });
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

const stripGuess = (s: string) => s.replace(/^my guess is (that )?/i, '').replace(/\.$/, '');

function hypothesisViews(i: AccountInputs, now: Date): HypothesisView[] {
  const verified = new Set(liveFacts(i, now).map((f) => f.id));
  // A BID speaks only to the hypothesis it was captured against. A withdrawn (rejected) draft is Casey's call, not the buyer's: it is not shown.
  return i.hypotheses.filter((h) => h.status !== 'rejected').slice(0, 3).map((h) => {
    const mine = i.bids.filter((b) => b.hypothesisId === h.id);
    const truth: TruthClass = mine.some((b) => b.type === 'objection') ? 'CONTRADICTED' : h.status === 'confirmed' || mine.some((b) => b.type === 'business_problem') ? 'BUYER_CONFIRMED' : 'INFERENCE';
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
    };
  });
}

function discoveryPlan(i: AccountInputs, hyps: HypothesisView[], wedge: Wedge): DiscoveryQuestion[] {
  const has = (t: string) => i.bids.some((b) => b.type === t);
  const top = hyps.find((h) => h.truth !== 'CONTRADICTED' && h.grounded);
  const where = wedge.candidates[0]?.name ?? (wedge.archetype ? `your ${wedge.archetype} sites` : 'your plants and DCs');
  const out: DiscoveryQuestion[] = [];
  if (top && !has('business_problem')) out.push({ type: 'VERIFY_PROBLEM', question: top.discoveryQuestion ?? `Does ${top.problem} happen at ${where}?`, why: 'The problem is still our inference; a yes or no changes whether to pursue.' });
  if (top?.rootCause && !has('root_cause')) out.push({ type: 'ROOT_CAUSE', question: `When it happens, is it ${top.rootCause.charAt(0).toLowerCase()}${top.rootCause.slice(1).replace(/\.$/, '')}, or something else?`, why: 'The root cause decides whether yard visibility is the fix.' });
  if (!has('impact') && !has('metric')) out.push({ type: 'IMPACT', question: 'When the yards back up, where does it show: detention, overtime, or missed shipments?', why: 'Without an observed cost, the economics stay modeled.' });
  if (!has('current_state')) out.push({ type: 'CURRENT_PROCESS', question: `How do trailers get checked in and found at ${where} today?`, why: 'The current process is unknown; it sets the pilot scope.' });
  const techKnown = i.bids.some((b) => VENDORS.some((v) => vendorRe(v).test(b.summary)));
  if (!techKnown) out.push({ type: 'CURRENT_STACK', question: 'What system, if any, tracks trailers in your yards today?', why: 'An incumbent changes the wedge; never assumed from a mention.' });
  out.push({ type: 'OWNERSHIP', question: 'Who owns yard performance across the plants and DCs?', why: 'Ownership is never guessed from a title.' });
  if (!has('future_state')) out.push({ type: 'DESIRED_FUTURE', question: 'What would good yards look like a year from now?', why: 'The desired future frames any proposal.' });
  if (!has('constraint')) out.push({ type: 'CHANGE_REQUIREMENT', question: 'What would a change have to clear: IT, security, the sites themselves?', why: 'Requirements decide whether a pilot can start.' });
  return out.slice(0, 7);
}

function siteWedge(i: AccountInputs): Wedge {
  const a = auditedSites(i.pack);
  const eligible = a.self.filter((s) => s.verification?.verdict === 'confirmed' || s.verification?.verdict === 'probable');
  if (!eligible.length) return { archetype: null, note: i.pack ? 'No confirmed self-operated audited site yet: the wedge is UNKNOWN.' : 'No audited site data: the wedge is UNKNOWN until sites are audited.', candidates: [], expansion: [] };
  const byArch = new Map<string, PackSite[]>();
  for (const s of eligible) byArch.set(s.archetypeName, [...(byArch.get(s.archetypeName) ?? []), s]);
  const [archetype, group] = [...byArch.entries()].sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))[0];
  const features = (s: PackSite) => [s.classification.dropYard ? 'drop yard' : null, s.classification.guardShack ? 'guard shack' : null, s.classification.preGateStaging ? 'pre-gate staging' : null, s.classification.fastLaneOpportunity ? 'fast-lane opportunity' : null, s.yardMetrics.dockDoorCount ? `${s.yardMetrics.dockDoorCount} dock doors` : null].filter((x): x is string => !!x);
  const ranked = [...eligible].sort((x, y) => features(y).length - features(x).length || (y.yardMetrics.dockDoorCount ?? 0) - (x.yardMetrics.dockDoorCount ?? 0) || x.id.localeCompare(y.id)).slice(0, 3);
  const candidates: WedgeCandidate[] = ranked.map((s) => ({
    siteId: s.id,
    name: s.name,
    whyThisSite: features(s),
    whatWeKnow: [`Audit verdict ${s.verification?.verdict}${s.verification?.citations.length ? ` with ${plural(s.verification.citations.length, 'citation')}` : ''}`, `Operator: ${s.verification?.operator ?? 'self'}; tenancy: ${s.verification?.tenancy ?? 'unknown'}`, ...(s.verification?.imageryDate ? [`Imagery ${s.verification.imageryDate}`] : [])],
    whatWeModel: s.yardMetrics.dockDoorCount ? [`${s.yardMetrics.dockDoorCount}-${s.yardMetrics.dockDoorCount * 3} trailer moves a day (1 to 3 turns per door; not measured)`] : [],
    whyPilot: `A self-operated ${s.archetypeName.toLowerCase()} with ${features(s).slice(0, 2).join(' and ') || 'visible yard activity'}: a contained place to prove value (inference).`,
    mustVerify: ['The current yard process (gate, check-in, trailer checks)', 'The system in use, if any', 'Who runs yard operations at this site', ...(s.verification?.tenancy === 'unknown' ? ['Tenancy'] : []), ...(s.verification?.verdict === 'probable' ? ['That the site is theirs and active (verification is probable)'] : [])],
  }));
  const expansion = group.length >= 2 ? ['PILOT: one candidate site', 'PROOF: measured before/after at that site', `REGIONAL: the other ${plural(group.length - 1, `${archetype.toLowerCase()} site`)} audited`, ...(i.pack?.account.networkCount ? [`NETWORK: up to ${i.pack.account.networkCount} facilities (only after proof)`] : [])] : ['PILOT: one candidate site', 'PROOF: measured before/after at that site'];
  return { archetype: `${archetype} (${plural(group.length, 'self-operated site')} audited)`, note: 'Inference from audited sites; nothing about site-level conditions is assumed.', candidates, expansion };
}

function nextAction(i: AccountInputs, hyps: HypothesisView[], now: Date, discovery: DiscoveryQuestion[]): string {
  if (i.opportunity?.status === 'ACTIVE') return 'Work the deal (In Deals), never cold. Next learning: the question below.';
  if (i.opportunity?.status === 'UNKNOWN') return 'Do not contact yet: HubSpot deal state could not be read.';
  if (hyps.some((h) => h.truth === 'CONTRADICTED')) return 'Stop the current story: the buyer rejected or contradicted it. Learn what is true instead.';
  const reachable = i.personas.filter((p) => !p.doNotContact && p.hasEmail);
  if (i.personas.length && !reachable.length) return 'Do not contact yet: no reachable person (do not contact, or no email).';
  if (!liveFacts(i, now).length) return `Do not contact yet: no live verified fact. Research first (${discovery[0]?.type.replace(/_/g, ' ').toLowerCase() ?? 'catalysts'}).`;
  if (i.conversation) return `Follow up with ${i.conversation.who} in the existing thread.`;
  if (!hyps.some((h) => h.grounded)) return 'Draft a thesis from the best verified fact (Research), then review it.';
  return 'Review the thesis, then use the verified fact in a first touch to the primary person (every gate runs at the click).';
}

/** Titles that plausibly touch the yard; still LIKELY, never ownership. */
const OWNER_TITLE = /\b(supply chain|logistics|distribution|transportation|warehous|fulfil|yard|operations)\b/i;

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

  const econ = sections.economics.statements.find((s) => s.truth === 'MODELED_ESTIMATE' || s.truth === 'BUYER_CONFIRMED');
  const thesis: Thesis = {
    status: 'INFERENCE, for your review (never approved by GAP)',
    whyThisAccount: [i.watched ? `Watched: ${i.watchReasons.join(', ') || 'priority account'}` : 'Not watched', live[0] ? `best fact: ${live[0].quote}` : 'no verified fact yet'].join('; '),
    whyNow: live[0] ? `${live[0].continuity === 'ongoing_state' ? 'Ongoing' : 'Recent'}: ${live[0].quote} (${day(live[0].currentness?.publishedAt ?? live[0].publishedAt)})` : 'No current, verified catalyst.',
    whatMayBeBroken: top ? top.problem : `Unknown: ${noHypothesis}`,
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
  const persona = reach.find((p) => OWNER_TITLE.test(p.title ?? '')) ?? i.personas.find((p) => OWNER_TITLE.test(p.title ?? '')) ?? reach[0] ?? i.personas[0];
  const owner = persona ? `${persona.name}${persona.title ? `, ${persona.title}` : ''} (LIKELY; ownership never assumed)` : 'Unknown: no person at this account yet.';
  const biggestUnknown = discovery[0] ? `${discovery[0].type.replace(/_/g, ' ').toLowerCase()}: ${discovery[0].why}` : 'None open.';
  const glance: Glance = {
    account: i.account.name,
    icpState: i.opportunity?.status === 'ACTIVE' ? 'In a deal' : i.watched ? `Watched (${i.watchReasons.join(', ') || 'priority'})` : 'Not in the watched universe',
    whyNow: thesis.whyNow,
    network: sections.footprint.statements[0]?.text ?? 'Unknown',
    freight: sections.freight.statements[0]?.text ?? 'Unknown',
    bestFact: live[0]?.quote ?? null,
    topHypothesis: top ? top.problem : noHypothesis,
    currentTech,
    likelyOwner: owner,
    relationship: sections.relationships.statements[0]?.text ?? 'None recorded',
    commercialState: dealStatement?.text ?? 'HubSpot deal state not read',
    biggestUnknown,
    nextQuestion: discovery[0]?.question ?? null,
    nextAction: nextAction(i, hypotheses, now, discovery),
  };
  return { accountName: i.account.name, generatedAt: now.toISOString(), sections, hypotheses, discovery, thesis, wedge, glance };
}
