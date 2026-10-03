/**
 * THE PERSON PRIOR (V2, Casey's seller learning 2026-10-02). Who Casey sells to best: the US / North America leader
 * who OPERATES transportation and the physical freight network at an enterprise shipper (transportation operations,
 * private or dedicated fleet, distribution and transportation, transportation and warehousing, network logistics).
 *
 * Transparent lanes and an ORDERED comparison, never a number. Every pick can say why in a sentence.
 *
 *   Order (first difference wins):
 *     buyer truth (the person who answered, a confirmed champion)
 *     > relationship (an introduction, someone Casey met)
 *     > explicit initiative ownership in a live signal (a named yard-modernization leader)
 *     > LANE  (primary operator > adjacent operator > facility operator > executive sponsor
 *              > transformation / tech > needs review > procurement / commercial > non-operating)
 *     > region (US / North America stated > not stated > another region stated)
 *     > scope  (network > not stated > one site)
 *     > seniority
 *
 * Operating ownership beats the bare word "transportation": sourcing, purchasing, category, finance, compliance,
 * sustainability, R&D, sales, a product market or business unit named "Transportation", and generic IT are never the
 * default WHO. Region comes from the person's own title or remit only; a company's headquarters or HubSpot company
 * country never makes a person US-based, and an unstated remit is "US location unknown", not foreign.
 */
/** Seniority from the title words (5 exec .. 1 other). The LAST tie-break, never the first. */
export function titleSeniority(title: string | null | undefined): number {
  const t = String(title ?? '').toLowerCase();
  // "Vice president" is a VP: "president" alone (never after "vice") is the executive.
  if (/\bchief\b|\bc[a-z]?o\b|\bcsco\b|(?<!vice[ -])\bpresident\b/.test(t)) return 5;
  if (/\b(svp|evp|avp|vp)\b|vice president/.test(t)) return 4;
  if (/director|\bhead\b/.test(t)) return 3;
  if (/manager|lead\b/.test(t)) return 2;
  return 1;
}

export type PersonLane =
  | 'PRIMARY_OPERATOR'
  | 'ADJACENT_OPERATOR'
  | 'FACILITY_OPERATOR'
  | 'EXECUTIVE_SPONSOR'
  | 'TRANSFORMATION_TECH'
  | 'SECURITY_RISK'
  | 'NEEDS_REVIEW'
  | 'PROCUREMENT_COMMERCIAL'
  | 'NON_OPERATING';
export type PersonRegion = 'US_NA' | 'UNKNOWN' | 'OTHER_REGION';
export type PersonScope = 'NETWORK' | 'UNKNOWN' | 'SITE';

export const LANE_LABEL: Record<PersonLane, string> = {
  PRIMARY_OPERATOR: 'Primary operator',
  ADJACENT_OPERATOR: 'Adjacent operator',
  FACILITY_OPERATOR: 'Facility / yard operator',
  EXECUTIVE_SPONSOR: 'Executive sponsor',
  TRANSFORMATION_TECH: 'Transformation / technology',
  SECURITY_RISK: 'Security / risk',
  NEEDS_REVIEW: 'Needs review',
  PROCUREMENT_COMMERCIAL: 'Procurement / commercial',
  NON_OPERATING: 'Not an operating role',
};

const LANE_ORDER: PersonLane[] = ['PRIMARY_OPERATOR', 'ADJACENT_OPERATOR', 'FACILITY_OPERATOR', 'EXECUTIVE_SPONSOR', 'TRANSFORMATION_TECH', 'SECURITY_RISK', 'NEEDS_REVIEW', 'PROCUREMENT_COMMERCIAL', 'NON_OPERATING'];
const REGION_ORDER: PersonRegion[] = ['US_NA', 'UNKNOWN', 'OTHER_REGION'];
const SCOPE_ORDER: PersonScope[] = ['NETWORK', 'UNKNOWN', 'SITE'];

export interface PersonRead {
  lane: PersonLane;
  /** Why the lane, in words (the title fragment that decided it). */
  laneWhy: string;
  region: PersonRegion;
  regionWhy: string;
  scope: PersonScope;
  seniority: number;
}

const has = (t: string, re: RegExp) => re.test(t);

// "Transportation" names a product market, business unit or research area here, not freight the person moves.
const PRODUCT_TRANSPORTATION = /transportation (markets?|product|platform|(&|and) (energy|electronics)|sbu|business|vertical|division)|(business|r&d|research|branding)[^,;]*transportation|industrial (&|and) transportation|transportation[^,;]*(business group|division|vertical)/;
const NON_OPERATING_WORDS = /\b(r&d|research|sales|marketing|branding|regulatory|quality|legal|counsel|human resources|talent|recruit|communications|investor)\b/;
const COMMERCIAL_WORDS = /\b(sourcing|procurement|purchas\w*|category|buyer|finance|financial|cost|controller|accounting|pricing|compliance|sustainability)\b/;
const TECH_WORDS = /\b(it|software|engineering|digital|technology|technologies|systems?|tms|wms|sap|automation|innovation|data|transformation|analytics|product area|visibility|orchestration|rtls|modernization|solutions architect|identity)\b/;
const GENERIC_IT = /\b(identity and access|access management|cyber|security engineer|infrastructure|help ?desk|end user)\b/;
const FREIGHT_WORDS = /\b(transportation|transport|transporte|freight|fleet|otr|over the road|dedicated|trucking|traffic|carrier management|inbound|outbound|intersite|line ?haul|shipping|distribution (&|and) transportation|transportation (&|and) (warehous\w*|distribution|logistics))\b/;
const LOGISTICS_OPS = /\b(logistics|distribution|warehous\w*|fulfil\w*|network operations|physical distribution|supply chain operations|operations)\b/;
const FACILITY_WORDS = /\b(plant manager|site (manager|director|leader)|dc manager|distribution center manager|yard (manager|supervisor|lead)|warehouse manager|general manager|facility (manager|director))\b/;
const EXEC_WORDS = /\b(chief|csco|coo)\b|(?<!vice[ -])\bpresident\b/;
// Executive technology roles: a technology partner at the top, never the operating owner.
const EXEC_TECH = /\b(cio|cto|cdo|cdio|chief (information|technology|digital|data) officer)\b/;
// Safety, security, risk and claims: their own buyer-map lane, never the freight owner.
const RISK_WORDS = /\b(safety|security|risk|ehs|hse|claims|loss prevention|asset protection)\b/;
// Never the operating owner, whatever else the title says: outside the operating line, or support and planning roles.
const OUTSIDE_LINE = /\b(board|former|retired|ex-|advisor|adviser|investor|business development|ceo office|office of the ceo|chief of staff|intern)\b/;
// Running stores or a retail field organization is not running the freight network.
const STORE_OPS = /\b(store|stores|retail|field|restaurant|branch sales) operations\b/;
const SUPPORT_ROLE = /\b(analyst|coordinator|specialist|planner|planning|project manager|assistant|associate)\b/;
const US_NA = /\b(na|n\.a\.|north america|north american|us|u\.s\.|usa|united states|domestic|nala|americas)\b/;
const OTHER_REGION = /\b(europe|european|emea|latam|latin america|china|hong kong|india|asia|apac|middle east|africa|japan|uk|germany|france|mexico|brazil)\b/;
const US_STATES = new Set(['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'district of columbia', 'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc']);
const US_COUNTRY = new Set(['united states', 'united states of america', 'usa', 'us', 'u.s.', 'u.s.a.']);

/** Where a person record says they are: 'US', 'OTHER' (a non-US country), or null (nothing usable). */
export function personCountry(location: string | null | undefined): 'US' | 'OTHER' | null {
  const parts = String(location ?? '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  if (US_COUNTRY.has(last)) return 'US';
  // A recognised state without a country is US; a lone city or an unknown region says nothing.
  if (parts.length >= 2 && US_STATES.has(last)) return 'US';
  if (parts.length >= 2 && !US_STATES.has(last) && /^[a-z .'-]{3,}$/.test(last) && !parts.slice(0, -1).some((p) => US_STATES.has(p))) return 'OTHER';
  return null;
}

const NETWORK = /\b(global|network|enterprise|corporate|corp\.|north america|national|regional|region|americas|na|nala|all sites|multi-site|domestic)\b/;
const SITE = /\b(plant|site|facility|dc manager|distribution center manager|yard manager|warehouse manager)\b/;

/** Read one person's title (and the account's entity type) into lane, region, scope and seniority, with reasons. */
export function readPerson(title: string | null | undefined, opts: { entityType?: string | null; location?: string | null } = {}): PersonRead {
  const raw = String(title ?? '').trim();
  // "Sales logistics" (P&G and peers) is customer-delivery logistics, an operating role, not sales.
  const t = ` ${raw.toLowerCase().replace(/[–—]/g, '-').replace(/\bsales logistics\b/g, 'customer logistics')} `;
  const seniority = titleSeniority(raw);
  const carrierLike = opts.entityType === 'carrier' || opts.entityType === '3pl' || opts.entityType === 'port_terminal';

  let lane: PersonLane;
  let laneWhy: string;
  if (!raw) {
    lane = 'NEEDS_REVIEW';
    laneWhy = 'no title on record';
  } else if (has(t, OUTSIDE_LINE)) {
    lane = 'NON_OPERATING';
    laneWhy = 'outside the operating line (a board seat, a former role, an advisor, the CEO\'s office)';
  } else if (has(t, PRODUCT_TRANSPORTATION) || (has(t, NON_OPERATING_WORDS) && !has(t, /\boperations? (director|leader|manager)\b/))) {
    lane = 'NON_OPERATING';
    laneWhy = has(t, PRODUCT_TRANSPORTATION) ? '"transportation" names a product, market or business unit here, not freight they move' : 'a non-operating function (R&D, sales, regulatory, quality and the like)';
  } else if (has(t, COMMERCIAL_WORDS)) {
    lane = 'PROCUREMENT_COMMERCIAL';
    laneWhy = 'buys, prices, funds or governs transportation (sourcing, purchasing, category, finance, compliance, sustainability); it does not run it';
  } else if (has(t, EXEC_TECH)) {
    lane = 'TRANSFORMATION_TECH';
    laneWhy = 'the technology executive (a sponsor for systems, never the operating owner)';
  } else if (has(t, RISK_WORDS)) {
    lane = 'SECURITY_RISK';
    laneWhy = 'safety, security or risk (a committee voice on the gate and the yard; does not run the freight)';
  } else if (has(t, GENERIC_IT)) {
    lane = 'NON_OPERATING';
    laneWhy = 'generic IT, not supply chain or transportation systems';
  } else if (has(t, TECH_WORDS)) {
    // Automation, TMS / WMS, RTLS, visibility, orchestration and yard modernization are supply chain technology in
    // themselves; IT, software, data or "digital" with no supply chain remit is generic.
    const supplyChain = has(t, FREIGHT_WORDS) || has(t, LOGISTICS_OPS) || /supply chain|\b(automation|tms|wms|rtls|visibility|orchestration|modernization|yard)\b/.test(t);
    lane = supplyChain ? 'TRANSFORMATION_TECH' : 'NON_OPERATING';
    laneWhy = supplyChain ? 'transportation or supply chain technology / transformation (a technical partner, or the owner when a signal names their initiative)' : 'technology or transformation with no supply chain remit stated';
  } else if (has(t, EXEC_WORDS) && seniority >= 5) {
    lane = /supply chain|operations|logistics|transportation|distribution|csco|coo/.test(t) ? 'EXECUTIVE_SPONSOR' : 'NEEDS_REVIEW';
    laneWhy = lane === 'EXECUTIVE_SPONSOR' ? 'the executive over operations or supply chain (a sponsor, rarely the first person)' : 'an executive outside operations';
  } else if (has(t, STORE_OPS) && !has(t, FREIGHT_WORDS)) {
    lane = 'NEEDS_REVIEW';
    laneWhy = 'runs stores or a field organization, not the freight network';
  } else if (has(t, SUPPORT_ROLE) && seniority <= 2) {
    lane = 'NEEDS_REVIEW';
    laneWhy = 'a support, analyst or planning role (may know the work; rarely owns the decision)';
  } else if (has(t, FACILITY_WORDS)) {
    lane = 'FACILITY_OPERATOR';
    laneWhy = 'runs a site (plant, DC, warehouse or yard)';
  } else if (has(t, FREIGHT_WORDS) || (carrierLike && has(t, /\b(operations|terminal|yard|network)\b/))) {
    lane = 'PRIMARY_OPERATOR';
    laneWhy = carrierLike && !has(t, FREIGHT_WORDS) ? 'runs the operation at a carrier, 3PL or terminal (the physical network is their product)' : 'title says they run transportation, freight or fleet';
  } else if (/\blogistics\b/.test(t) && /\b(global|director|vp|vice president|head|senior director)\b/.test(t) && !/\bsupply chain manager\b/.test(t)) {
    lane = 'PRIMARY_OPERATOR';
    laneWhy = 'title says they run logistics (the freight network)';
  } else if (has(t, LOGISTICS_OPS) || /supply chain/.test(t)) {
    lane = 'ADJACENT_OPERATOR';
    laneWhy = 'runs supply chain, distribution, warehouse or network operations; transportation ownership not stated';
  } else {
    lane = 'NEEDS_REVIEW';
    laneWhy = 'the title does not say what they operate';
  }

  // The person's own record ("Chicago, Illinois, United States"): the country decides; without one, a US state does.
  const where = personCountry(opts.location);
  let region: PersonRegion;
  let regionWhy: string;
  if (has(t, US_NA)) {
    region = 'US_NA';
    regionWhy = 'US / North America remit in the title';
  } else if (has(t, OTHER_REGION)) {
    region = 'OTHER_REGION';
    regionWhy = 'another region named in the title';
  } else if (where === 'US') {
    region = 'US_NA';
    regionWhy = `US-based (${String(opts.location).trim()})`;
  } else if (where === 'OTHER') {
    region = 'OTHER_REGION';
    regionWhy = `based outside the US (${String(opts.location).trim()})`;
  } else {
    region = 'UNKNOWN';
    regionWhy = /\bglobal\b/.test(t) ? 'US location unknown (global remit; US responsibility not stated)' : 'US location unknown (no remit stated; the company\'s country is not the person\'s)';
  }

  // A director-or-above who runs transportation, logistics or fleet runs a network unless a site is named.
  const leadsFreight = seniority >= 3 && (lane === 'PRIMARY_OPERATOR' || lane === 'ADJACENT_OPERATOR');
  const scope: PersonScope = has(t, SITE) && !has(t, NETWORK) ? 'SITE' : has(t, NETWORK) || (leadsFreight && !has(t, SITE)) ? 'NETWORK' : 'UNKNOWN';
  return { lane, laneWhy, region, regionWhy, scope, seniority };
}

export interface WhoCandidate {
  key: string;
  name: string;
  title: string | null;
  /** Reachable on the channel the motion uses (email for email, phone for a call). */
  reachable: boolean;
  doNotContact?: boolean;
  /** The buyer answered, or is a confirmed champion (buyer truth). */
  buyerTruth?: string | null;
  /** How Casey knows them (met, introduced). */
  relationship?: string | null;
  /** A live signal names them as the owner of the initiative (e.g. a yard-modernization role). */
  initiative?: string | null;
  location?: string | null;
}

export interface WhoPick<C extends WhoCandidate = WhoCandidate> {
  candidate: C;
  read: PersonRead;
  /** One sentence: why this person. */
  why: string;
}

const rank = <T>(order: T[], v: T) => order.length - order.indexOf(v);

/** The prior's own part of the order (lane, region, scope), for callers that add their own tie-breaks. */
export const priorKey = (read: PersonRead): number[] => [rank(LANE_ORDER, read.lane), rank(REGION_ORDER, read.region), rank(SCOPE_ORDER, read.scope)];

/** The ordered comparison key (first difference wins). Exposed for tests; never shown as a number. */
export function whoKey(c: WhoCandidate, read: PersonRead): number[] {
  return [c.doNotContact ? 0 : 1, c.buyerTruth ? 1 : 0, c.relationship ? 1 : 0, c.initiative ? 1 : 0, rank(LANE_ORDER, read.lane), rank(REGION_ORDER, read.region), rank(SCOPE_ORDER, read.scope), read.seniority, c.reachable ? 1 : 0];
}

/** One sentence for Casey: why this person, from the first reason that decided it. */
export function whyThem(c: WhoCandidate, read: PersonRead): string {
  const lead = c.buyerTruth ? `They are already talking to you (${c.buyerTruth})` : c.relationship ? `You have a way in (${c.relationship})` : c.initiative ? `A live signal names them on the initiative (${c.initiative})` : null;
  const role = `${LANE_LABEL[read.lane]}: ${read.laneWhy}`;
  const where = read.region === 'US_NA' ? 'US / North America remit stated' : read.region === 'UNKNOWN' ? 'US location unknown' : read.regionWhy;
  return `${lead ? `${lead}. ` : ''}${role}; ${where}${read.scope === 'NETWORK' ? '; network scope' : read.scope === 'SITE' ? '; one site' : ''}.`;
}

/** Rank the people for WHO, best first, each with its reasons. Ties fall back to name for a stable order. */
export function rankWho<C extends WhoCandidate>(cands: readonly C[], opts: { entityType?: string | null } = {}): Array<WhoPick<C>> {
  return cands
    .map((candidate) => {
      const read = readPerson(candidate.title, { entityType: opts.entityType, location: candidate.location });
      return { candidate, read, key: whoKey(candidate, read), why: whyThem(candidate, read) };
    })
    .sort((a, b) => {
      for (let k = 0; k < a.key.length; k++) if (a.key[k] !== b.key[k]) return b.key[k] - a.key[k];
      return a.candidate.name.localeCompare(b.candidate.name) || a.candidate.key.localeCompare(b.candidate.key);
    })
    .map(({ candidate, read, why }) => ({ candidate, read, why }));
}

/** A person worth leading with: an operating lane, never procurement, non-operating or an unread title by default. */
export const isDefaultWhoLane = (lane: PersonLane) => lane === 'PRIMARY_OPERATOR' || lane === 'ADJACENT_OPERATOR' || lane === 'FACILITY_OPERATOR';
