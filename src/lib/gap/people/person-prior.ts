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
 *     > not another region's stated remit (a title that says they run Europe owns Europe, not North America)
 *     > LANE  (primary operator > adjacent operator > facility operator > executive sponsor
 *              > transformation / tech > needs review > procurement / commercial > non-operating)
 *     > named ownership (transportation / fleet / freight by name > logistics or distribution)
 *     > not based outside North America
 *     > scope  (network > not stated > one site)
 *     > US market (a US / NA remit or US-based > Canada or Mexico only > unknown; Casey's current cold motion)
 *     > seniority
 *
 * OPERATOR-FIRST COLD WHO (seller dogfood correction, 2026-10-04): the buyer map shows every lane; the DEFAULT COLD
 * FIRST TOUCH (isColdWho) is narrower: a direct freight operator, a transportation tech / transformation owner only
 * when a live signal names their initiative, a site operator only for a site-scoped motion. A VP Supply Chain is a
 * sponsor or alternate, never the cold default: with no direct operator on record WHO says "transportation owner not
 * yet identified, research required" instead of promoting the broadest senior title. Buyer truth, a relationship and
 * a named initiative still override (they lead whoKey, and their motions name their own person).
 *
 * Operating ownership beats the bare word "transportation": sourcing, purchasing, category, finance, compliance,
 * sustainability, R&D, sales, a product market or business unit named "Transportation", and generic IT are never the
 * default WHO. GEOGRAPHY is two facts about the PERSON, never the company: their LOCATION (where their own record says
 * they sit: US, Canada, Mexico, elsewhere) and their OPERATING REMIT (the region their title says they run). North
 * America is the US, Canada and Mexico (Casey, 2026-10-03); generic Latin America / LATAM is NOT (it is broader). The remit decides when stated (a Chicago-based "Director, European Logistics" runs Europe; a Toronto-based
 * "VP, North America Transportation" runs North America); otherwise the location does; otherwise it is unknown, never
 * filled from a headquarters or a HubSpot company country. The three North America states rank as one tier, after the
 * lane: geography never outranks operating ownership (Casey amendment, 2026-10-03).
 */
/** Seniority from the title words (5 exec .. 1 other). The LAST tie-break, never the first. */
export function titleSeniority(title: string | null | undefined): number {
  const t = String(title ?? '').toLowerCase();
  // "Vice president" is a VP: "president" alone (never after "vice") is the executive.
  if (/\bchief\b|\bc[a-z]?o\b|\bcsco\b|(?<!vice[ -])\bpresident\b/.test(t)) return 5;
  if (/\b(svp|evp|avp|vp)\b|vice president/.test(t)) return 4;
  // "Senior director" outranks "director" (PepsiCo: a Sr Director of Transportation beat a Director only by name order).
  if (/\b(senior|sr\.?)\s+director\b|\bhead\b/.test(t)) return 3.5;
  if (/director/.test(t)) return 3;
  if (/\b(senior|sr\.?)\s+manager\b/.test(t)) return 2.5;
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
/** The ranking tier: 'US_NA' is North America (a NA remit, or located in the US or Canada). */
export type PersonRegion = 'US_NA' | 'UNKNOWN' | 'OTHER_REGION';
export type PersonLocation = 'US' | 'CANADA' | 'MEXICO' | 'OTHER';
export type PersonRemit = 'NORTH_AMERICA' | 'OTHER_REGION';
/** The transparent geography state shown to Casey. */
export type GeoStatus = 'NA_REMIT' | 'US_CONFIRMED' | 'CANADA_CONFIRMED' | 'MEXICO_CONFIRMED' | 'OTHER_REGION' | 'UNKNOWN';
export const GEO_LABEL: Record<GeoStatus, string> = {
  NA_REMIT: 'North America remit confirmed',
  US_CONFIRMED: 'US confirmed',
  CANADA_CONFIRMED: 'Canada confirmed',
  MEXICO_CONFIRMED: 'Mexico confirmed',
  OTHER_REGION: 'Other region',
  UNKNOWN: 'Location / remit unknown',
};
export type PersonScope = 'NETWORK' | 'UNKNOWN' | 'SITE';
/** US-first among comparable people (Casey's current cold motion); never outranks the lane or named ownership. */
export type PersonMarket = 'US' | 'NA_OTHER' | 'UNKNOWN' | 'OUTSIDE';

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
const SCOPE_ORDER: PersonScope[] = ['NETWORK', 'UNKNOWN', 'SITE'];
const MARKET_ORDER: PersonMarket[] = ['US', 'NA_OTHER', 'UNKNOWN', 'OUTSIDE'];

export interface PersonRead {
  lane: PersonLane;
  /** Why the lane, in words (the title fragment that decided it). */
  laneWhy: string;
  /** The ranking tier (North America / unknown / another region), from geo. */
  region: PersonRegion;
  regionWhy: string;
  /** Where the person's own record says they sit (null: not on record). */
  location: PersonLocation | null;
  /** The region the title says they run (null: not stated). */
  remit: PersonRemit | null;
  geo: GeoStatus;
  scope: PersonScope;
  seniority: number;
  /**
   * Primary lane: 2 = owns transportation / fleet / freight by name, 1 = logistics or distribution.
   * Transformation / tech lane: 2 = explicit transportation, fleet, logistics or yard scope, 0 = generic.
   * 0 otherwise.
   */
  ownership: number;
  /** Casey's current cold market: 'US' (a US / NA remit, or US-based), 'NA_OTHER' (Canada or Mexico only), and so on. */
  market: PersonMarket;
}

const has = (t: string, re: RegExp) => re.test(t);

// "Transportation" names a product market, business unit or research area here, not freight the person moves.
const PRODUCT_TRANSPORTATION = /transportation (markets?|product|platform|(&|and) (energy|electronics)|sbu|business|vertical|division)|(business|r&d|research|branding)[^,;]*transportation|industrial (&|and) transportation|transportation[^,;]*(business group|division|vertical)/;
// HR, recruiting and legal (review S5, 2026-10-04: "Transportation Recruiter", "Director Transportation HR",
// "Transportation Attorney" read as operators).
const NON_OPERATING_WORDS = /\b(r&d|research|sales|marketing|branding|regulatory|quality|legal|counsel|attorney|paralegal|human resources|hr|people operations|talent|recruit\w*|communications|investor)\b/;
const COMMERCIAL_WORDS = /\b(sourcing|procurement|purchas\w*|category|buyer|finance|financial|cost|controller|accounting|pricing|compliance|sustainability)\b/;
// Buying, pricing, paying, contracting or funding freight: never the operator, whatever function sits beside it
// (review S5: freight audit / payment, transportation contracts, rate management). "Contract logistics" (a 3PL's
// operation) and a carrier's "dedicated contracts" (its dedicated fleet business, re-review) are not "contracts".
const COMMERCIAL_STRONG = /\b(sourcing|procurement|purchas\w*|category|buyer|finance|financial|cost|controller|accounting|pricing|audit|payments?|(?<!dedicated )contracts|contracting|contract management|rate management|rates|indirect)\b/;
// Budget or spend: commercial on their own ("Director of Transportation Spend"), a second hat beside a freight
// operations remit ("Director Transportation Budget & Operations", re-review 2026-10-05).
const BUDGET_WORDS = /\b(budget|spend)\b/;
// A MIXED title: a transportation / logistics function JOINED by a conjunction or list to a compliance, sustainability
// or safety remit ("VP Global Transportation and Compliance", "VP Logistics and Transportation Compliance", "VP Fleet
// Safety & Operations"). A function that only modifies the remit ("Transportation Compliance Manager") or trails it as
// a department ("Safety Manager - Fleet", "Compliance Director, Logistics") is not mixed (review B1, 2026-10-04).
const FN = '(?:transportation|transport|freight|fleet|logistics|distribution|line ?haul|otr|shipping|traffic|warehousing)(?:\\s+operations?)?';
const GOV = '(?:compliance|sustainability|safety)';
const GOV_MOD = '(?:(?:trade|dot|regulatory|carrier|hazmat|transportation|transport|fleet|freight|logistics)\\s+)?';
// (Re-review C1: in "Safety & Fleet Compliance Manager" the function word only describes a SECOND remit; the
// lookaheads keep two governance remits governance.)
const MIXED_GOVERNANCE = new RegExp(
  [
    `\\b${FN}\\s*(?:,|&|\\band\\b)\\s*${GOV_MOD}${GOV}\\b`,
    `\\b${GOV}\\s*(?:&|\\band\\b)\\s*${FN}\\b(?!\\s+${GOV_MOD}${GOV})`,
    `\\b(?:transportation|transport|fleet|freight|logistics)\\s+${GOV}\\s*(?:&|\\band\\b)\\s*operations?\\b(?!\\s+${GOV})`,
  ].join('|'),
);
// The governance words (and their non-function modifiers) removed from a mixed title, so the operating function decides.
const GOVERNANCE_WORDS = /\b(?:(?:trade|dot|regulatory|hazmat)\s+)?(?:compliance|sustainability|safety)\b/gi;
// "S&T" is transformation only beside a deployment / program / strategy word (PepsiCo's strategy and transformation
// function, dogfood 2026-10-04); at energy and chemical shippers "S&T" is supply and transportation (review N4).
const TECH_WORDS = /\b(it|software|engineering|digital|technology|technologies|systems?|tms|wms|sap|automation|innovation|data|transformation|analytics|product area|visibility|orchestration|rtls|modernization|solutions architect|identity)\b|\bs&t\b(?=.*\b(deployment|programs?|capabilit\w*|strategy|transformation)\b)/;
const GENERIC_IT = /\b(identity and access|access management|cyber|security engineer|infrastructure|help ?desk|end user)\b/;
const FREIGHT_WORDS = /\b(transportation|transport|transporte|freight|fleet|otr|over the road|dedicated|trucking|traffic|carrier management|inbound|outbound|intersite|line ?haul|middle[- ]mile|intermodal|rail (operations|transportation)|shipping|distribution (&|and) transportation|transportation (&|and) (warehous\w*|distribution|logistics))\b|\bld&t\b/;
// Logistics that names the freight network itself: a direct operator at any seniority.
const LOGISTICS_DIRECT = /\b(logistics operations|network logistics|physical distribution|logistics,? distribution,? (?:&|and) transportation)\b/;
// Technology scoped to freight, fleet, logistics or the yard (transportation tech), never generic transformation.
// (Visibility or orchestration alone is not freight scope: "Director, Order Orchestration", review N4.)
const FREIGHT_TECH_SCOPE = /\b(transportation|transport|freight|fleet|logistics|yard|tms|yms|rtls|autogate|gate automation|machine vision|control tower)\b/;
const LOGISTICS_OPS = /\b(logistics|distribution|warehous\w*|fulfil\w*|network operations|physical distribution|supply chain operations|operations)\b/;
const FACILITY_WORDS = /\b(plant (manager|director)|site (manager|director|leader)|dc (manager|director)|distribution center (manager|director)|yard (manager|supervisor|lead)|warehouse (manager|director)|general manager|facility (manager|director))\b/;
// "Operations" of a function other than freight: never the network operator, at a carrier or anywhere (review S6).
const NON_FREIGHT_OPS = /\b(people|revenue|commercial|hr|human resources|customer|sales|finance|financial|marketing|it|business|legal|pricing|talent|technology|data|product|accounting|clinical|medical|merchandis\w*)\s+operations\b/;
// A freight function JOINED to that other operations is a second remit ("Director, Logistics & Customer Operations",
// re-review); a trailing department ("Director Customer Operations - Transportation") is not.
const FREIGHT_JOINED_OPS = /\b(transportation|logistics|freight|fleet|distribution)\s*(?:&|\band\b)\s*(?:\w+\s+)?operations\b|\boperations\s*(?:&|\band\b)\s*(transportation|logistics|freight|fleet|distribution)\b/;
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
const US_NA = /\b(na|n\.a\.|north america|north american|us|u\.s\.|usa|united states|domestic|nala|canada|canadian|mexico|méxico|mexican|north (?:and|&) (?:latin|south) america)\b/;
const OTHER_REGION = /\b(europe|european|emea|latam|latin america|south america|central america|caribbean|china|hong kong|india|asia|apac|middle east|africa|japan|uk|germany|france|brazil)\b/;
const US_STATES = new Set(['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'district of columbia', 'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc']);
const US_COUNTRY = new Set(['united states', 'united states of america', 'usa', 'us', 'u.s.', 'u.s.a.']);

const CA_COUNTRY = new Set(['canada', 'ca']);
const MX_COUNTRY = new Set(['mexico', 'méxico', 'mx']);
const MX_STATES = new Set(['aguascalientes', 'baja california', 'baja california sur', 'campeche', 'chiapas', 'chihuahua', 'cdmx', 'ciudad de mexico', 'ciudad de méxico', 'mexico city', 'distrito federal', 'coahuila', 'colima', 'durango', 'estado de mexico', 'estado de méxico', 'guanajuato', 'guerrero', 'hidalgo', 'jalisco', 'michoacan', 'michoacán', 'morelos', 'nayarit', 'nuevo leon', 'nuevo león', 'oaxaca', 'puebla', 'queretaro', 'querétaro', 'quintana roo', 'san luis potosi', 'san luis potosí', 'sinaloa', 'sonora', 'tabasco', 'tamaulipas', 'tlaxcala', 'veracruz', 'yucatan', 'yucatán', 'zacatecas']);
const CA_PROVINCES = new Set(['ontario', 'quebec', 'québec', 'british columbia', 'alberta', 'manitoba', 'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland and labrador', 'newfoundland', 'prince edward island', 'yukon', 'northwest territories', 'nunavut', 'on', 'qc', 'bc', 'ab', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'pei', 'yt', 'nt', 'nu']);

/** Where a person's own record says they sit: 'US', 'CANADA', 'OTHER' (another country), or null (nothing usable). */
export function personLocation(location: string | null | undefined): PersonLocation | null {
  const parts = String(location ?? '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  if (US_COUNTRY.has(last)) return 'US';
  if (last === 'canada') return 'CANADA';
  // Mexico (never New Mexico, a US state matched above as a whole part).
  if (MX_COUNTRY.has(last) && !(last === 'mx' && parts.length < 2)) return 'MEXICO';
  // "Toronto, ON, CA": CA is Canada's country code after a province, not California.
  if (last === 'ca' && parts.length >= 3 && CA_PROVINCES.has(parts[parts.length - 2])) return 'CANADA';
  // A recognised state or province without a country decides; a lone city or an unknown region says nothing.
  if (parts.length >= 2 && US_STATES.has(last)) return 'US';
  // NL and BC are also Mexican state codes (Nuevo Leon, Baja California): without a country they say nothing.
  if (parts.length >= 2 && (last === 'nl' || last === 'bc')) return null;
  if (parts.length >= 2 && (CA_PROVINCES.has(last) || CA_COUNTRY.has(last))) return 'CANADA';
  if (parts.length >= 2 && MX_STATES.has(last)) return 'MEXICO';
  if (parts.length >= 2 && /^[a-z .'-]{3,}$/.test(last) && !parts.slice(0, -1).some((p) => US_STATES.has(p) || CA_PROVINCES.has(p) || MX_STATES.has(p))) return 'OTHER';
  return null;
}

/** Where a person record says they are on the old two-way split: North America ('US', which includes Canada) or 'OTHER'. */
export function personCountry(location: string | null | undefined): 'US' | 'OTHER' | null {
  const l = personLocation(location);
  return l === 'OTHER' ? 'OTHER' : l ? 'US' : null;
}

const NETWORK = /\b(global|network|enterprise|corporate|corp\.|north america|national|regional|region|americas|na|nala|all sites|multi-site|domestic)\b/;
const SITE = /\b(plant|site|facility|dc manager|dc director|distribution center (manager|director)|yard manager|warehouse manager)\b/;

/** A mixed title without its governance words ("VP Fleet Safety & Operations" -> "VP Fleet & Operations"). */
function stripGovernance(title: string): string {
  return title.replace(GOVERNANCE_WORDS, ' ').replace(/\s*(?:&|\band\b|,)\s*(?=$|[,;)&-])/gi, ' ').replace(/\s{2,}/g, ' ').trim();
}

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
  } else if (has(t, COMMERCIAL_STRONG) || (has(t, BUDGET_WORDS) && !(has(t, FREIGHT_WORDS) && /\boperations?\b/.test(t))) || (has(t, COMMERCIAL_WORDS) && !has(t, MIXED_GOVERNANCE))) {
    lane = 'PROCUREMENT_COMMERCIAL';
    laneWhy = 'buys, prices, funds or governs transportation (sourcing, purchasing, category, finance, compliance, sustainability); it does not run it';
  } else if (has(t, MIXED_GOVERNANCE) && (has(t, COMMERCIAL_WORDS) || !/\b(security|risk|ehs|hse|claims|loss prevention|asset protection)\b/.test(t))) {
    // A MIXED title (seller correction, 2026-10-04): compliance, sustainability or safety JOINED to a transportation or
    // logistics function. The operating function decides the lane; the governance remit is a second hat.
    const op = readPerson(stripGovernance(raw), { entityType: opts.entityType });
    lane = op.lane;
    const remitWord = /\bsafety\b/.test(t) && !has(t, COMMERCIAL_WORDS) ? 'safety' : 'compliance';
    laneWhy = `${op.laneWhy} (${remitWord} is a second remit beside the ${op.lane === 'PRIMARY_OPERATOR' ? 'operating function, not procurement' : 'function'})`;
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
  } else if (has(t, NON_FREIGHT_OPS) && !has(t, FREIGHT_JOINED_OPS)) {
    lane = 'NEEDS_REVIEW';
    laneWhy = 'runs the operations of another function (people, revenue, commercial, customer and the like), not the freight network';
  } else if (has(t, FACILITY_WORDS)) {
    lane = 'FACILITY_OPERATOR';
    laneWhy = 'runs a site (plant, DC, warehouse or yard)';
  } else if (has(t, FREIGHT_WORDS) || has(t, LOGISTICS_DIRECT) || (carrierLike && has(t, /\b(operations|terminal|yard|network)\b/))) {
    lane = 'PRIMARY_OPERATOR';
    laneWhy = has(t, FREIGHT_WORDS) ? 'title says they run transportation, freight or fleet' : has(t, LOGISTICS_DIRECT) ? 'title says they run logistics operations (the freight network)' : 'runs the operation at a carrier, 3PL or terminal (the physical network is their product)';
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

  // Two facts: LOCATION from the person's own record, REMIT from the title. The remit decides when stated.
  const location = personLocation(opts.location);
  const remit: PersonRemit | null = has(t, US_NA) ? 'NORTH_AMERICA' : has(t, OTHER_REGION) ? 'OTHER_REGION' : null;
  const at = String(opts.location ?? '').trim();
  let geo: GeoStatus;
  let regionWhy: string;
  if (remit === 'NORTH_AMERICA') {
    geo = 'NA_REMIT';
    regionWhy = `North America remit in the title${location ? ` (based in ${at})` : ''}`;
  } else if (remit === 'OTHER_REGION') {
    geo = 'OTHER_REGION';
    regionWhy = `another region's remit in the title${location ? ` (based in ${at}; the remit decides, not the desk)` : ''}`;
  } else if (location === 'US') {
    geo = 'US_CONFIRMED';
    regionWhy = `US-based (${at}); remit not stated`;
  } else if (location === 'CANADA') {
    geo = 'CANADA_CONFIRMED';
    regionWhy = `Canada-based (${at}); remit not stated`;
  } else if (location === 'MEXICO') {
    geo = 'MEXICO_CONFIRMED';
    regionWhy = `Mexico-based (${at}); remit not stated`;
  } else if (location === 'OTHER') {
    geo = 'OTHER_REGION';
    regionWhy = `based outside North America (${at})`;
  } else {
    geo = 'UNKNOWN';
    regionWhy = /\bglobal\b/.test(t) ? 'location unknown (global remit; North America responsibility not stated)' : 'location and remit not on record';
  }
  const region: PersonRegion = geo === 'OTHER_REGION' ? 'OTHER_REGION' : geo === 'UNKNOWN' ? 'UNKNOWN' : 'US_NA';

  // A director-or-above who runs transportation, logistics or fleet runs a network unless a site is named.
  const leadsFreight = seniority >= 3 && (lane === 'PRIMARY_OPERATOR' || lane === 'ADJACENT_OPERATOR');
  const scope: PersonScope = has(t, SITE) && !has(t, NETWORK) ? 'SITE' : has(t, NETWORK) || (leadsFreight && !has(t, SITE)) ? 'NETWORK' : 'UNKNOWN';
  const ownership =
    lane === 'PRIMARY_OPERATOR' ? (/\b(transportation|transport|fleet|freight|otr|dedicated|trucking|line ?haul|intersite|middle[- ]mile)\b|\bld&t\b/.test(t) ? 2 : 1)
    : lane === 'TRANSFORMATION_TECH' ? (has(t, FREIGHT_TECH_SCOPE) ? 2 : 0)
    : 0;
  // US-first (Casey's current cold motion): a title naming the US or North America is the US market, one naming only
  // Canada or Mexico is not; with no remit stated the person's own location decides; unknown is not foreign.
  const usRemit = /\b(na|n\.a\.|north america|north american|us|u\.s\.|usa|united states|domestic|nala)\b/.test(t);
  const market: PersonMarket = geo === 'OTHER_REGION' ? 'OUTSIDE' : remit === 'NORTH_AMERICA' ? (usRemit ? 'US' : 'NA_OTHER') : location === 'US' ? 'US' : location === 'CANADA' || location === 'MEXICO' ? 'NA_OTHER' : 'UNKNOWN';
  return { lane, laneWhy, region, regionWhy, location, remit, geo, scope, seniority, ownership, market };
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
// Function first (lane, then named ownership), then out-of-market, then network scope, then the US market (seller
// correction 2026-10-04: an exact Transportation Operations Manager outranks a generic VP; geography never leads).
export const priorKey = (read: PersonRead): number[] => [read.remit === 'OTHER_REGION' ? 0 : 1, rank(LANE_ORDER, read.lane), read.ownership, read.region === 'OTHER_REGION' ? 0 : 1, rank(SCOPE_ORDER, read.scope), rank(MARKET_ORDER, read.market)];

/** The ordered comparison key (first difference wins). Exposed for tests; never shown as a number. */
export function whoKey(c: WhoCandidate, read: PersonRead): number[] {
  // A stated other-region remit is a fact about what they OWN (review B1): it comes before the lane, not as a tie-break.
  return [c.doNotContact ? 0 : 1, c.buyerTruth ? 1 : 0, c.relationship ? 1 : 0, c.initiative ? 1 : 0, ...priorKey(read), read.seniority, c.reachable ? 1 : 0];
}

/** The geography fact that decided, in a few words (WHO's why, the motion factors). */
export function geoPhrase(read: Pick<PersonRead, 'geo' | 'regionWhy'>): string {
  return read.geo === 'NA_REMIT' ? 'North America remit stated' : read.geo === 'US_CONFIRMED' ? 'US-based' : read.geo === 'CANADA_CONFIRMED' ? 'Canada-based' : read.geo === 'MEXICO_CONFIRMED' ? 'Mexico-based' : read.geo === 'UNKNOWN' ? 'location / remit unknown' : read.regionWhy;
}

/** One sentence for Casey: why this person, from the first reason that decided it. */
export function whyThem(c: WhoCandidate, read: PersonRead): string {
  const lead = c.buyerTruth ? `They are already talking to you (${c.buyerTruth})` : c.relationship ? `You have a way in (${c.relationship})` : c.initiative ? `A live signal names them on the initiative (${c.initiative})` : null;
  const role = `${LANE_LABEL[read.lane]}: ${read.laneWhy}`;
  const where = geoPhrase(read);
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

/**
 * THE DEFAULT COLD FIRST TOUCH (seller correction, 2026-10-04): a direct freight operator; a transportation tech /
 * transformation owner with freight scope only when a live signal names their initiative; a site operator only for a
 * site-scoped motion. Never another region's remit, never someone based outside North America. A VP Supply Chain, an
 * executive sponsor or a bare "operations" title is buyer map, never the cold default.
 */
export function isColdWho(read: Pick<PersonRead, 'lane' | 'remit' | 'region' | 'ownership'>, ctx: { initiative?: string | null; siteScoped?: boolean } = {}): boolean {
  if (read.remit === 'OTHER_REGION' || read.region === 'OTHER_REGION') return false;
  if (read.lane === 'PRIMARY_OPERATOR') return true;
  if (read.lane === 'TRANSFORMATION_TECH') return !!ctx.initiative && read.ownership > 0;
  if (read.lane === 'FACILITY_OPERATOR') return !!ctx.siteScoped;
  return false;
}

/**
 * THE SPONSOR (one rule for the brief, the cockpit and contact research): the executive over operations or supply chain
 * (CSCO, COO), a VP in an adjacent lane, or a director whose title says supply chain or network. Never a warehouse or
 * DC director, never a non-freight "operations" title, never the cold default.
 */
export function isSponsor(read: Pick<PersonRead, 'lane' | 'seniority'>, title: string | null | undefined): boolean {
  if (read.lane === 'EXECUTIVE_SPONSOR') return true;
  if (read.lane !== 'ADJACENT_OPERATOR') return false;
  return read.seniority >= 4 || (read.seniority >= 3 && /supply chain|network/i.test(String(title ?? '')));
}

/** Worth showing in the buying committee as an operating lane (the buyer map); NOT the cold default (isColdWho). */
export const isDefaultWhoLane = (lane: PersonLane) => lane === 'PRIMARY_OPERATOR' || lane === 'ADJACENT_OPERATOR' || lane === 'FACILITY_OPERATOR';

/** The default WHO: an operating lane, and never a person whose title says they run another region (review B1). */
export const isDefaultWho = (read: Pick<PersonRead, 'lane' | 'remit'>) => isDefaultWhoLane(read.lane) && read.remit !== 'OTHER_REGION';
