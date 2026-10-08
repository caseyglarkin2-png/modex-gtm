/**
 * THESIS-AWARE OWNER SELECTION (owner resolution, 2026-10-05). Owner resolution is not title ranking in isolation:
 * the hypothesis says what changed, and the person whose responsibility that change lands on is more relevant than
 * a generic senior executive. A linehaul / sortation / network modernization fact raises network operations,
 * operations planning and engineering and operations technology; a fulfillment center opening raises distribution
 * and transportation; a yard modernization fact raises transportation technology, yard operations and automation.
 *
 * Explainable: fact FAMILIES (from the fact and the hypothesis text) meet responsibility TAGS (from the title), and
 * the answer is a tier with its reason in words. Never a hidden numeric score. Pure.
 *
 * R32 (GAP OS execution recovery, 2026-10-06): the person is matched to the MOTION and its SCOPE, not only to the fact.
 *   approach   a job / procurement-led thesis whose posting names a role is matched on THAT role's function (the
 *              hiring manager's remit), never on every yard or trailer word in the posting's text: a fleet title is
 *              not "direct" on a Yard Operations Manager posting because the posting mentions trailers
 *   site       a fact that names a site ("its Tulsa distribution center") makes a person who runs ANOTHER site
 *              related, never direct; a network remit is not capped (it covers every site)
 *   division   at a multi-division parent (people/division.ts), a fact one division states is never attributed to a
 *              person in another division (a PBNA fact is not Frito-Lay's); a person whose division is not on record
 *              keeps their tier and the reason says whose fact it is
 */
import { divisionOf } from './division';
import { postingRoleOf } from '../research/claim-types';

export type FactFamily = 'NETWORK_PROGRAM' | 'SITE_OPENING' | 'AUTOMATION_TECH' | 'FLEET' | 'AIR_NETWORK' | 'YARD' | 'GENERIC';
export type RelevanceTier = 'direct' | 'related' | 'none';
export type ResponsibilityTag =
  | 'network_ops'
  | 'planning_engineering'
  | 'linehaul'
  | 'hub_terminal'
  | 'sortation'
  | 'transportation'
  | 'logistics'
  | 'fleet'
  | 'distribution'
  | 'fulfillment'
  | 'warehouse'
  | 'site'
  | 'automation'
  | 'transportation_tech'
  | 'ops_tech'
  | 'air'
  | 'yard'
  | 'generic_ops';

const FAMILY_WORDS: Array<[FactFamily, RegExp]> = [
  ['NETWORK_PROGRAM', /\b(line ?haul|sortation|sort(?:ation)? (?:facilit|cent)\w*|hubs?\b|network (?:2\.0|optimi\w+|redesign\w*|modern\w+|consolidat\w+|transformation)|consolidat\w+ (?:of )?(?:sortation|facilit)\w*|pickup[- ]and[- ]delivery routes?|end[- ]to[- ]end optimi\w+ network|optimi\w+ (?:the |our )?(?:enterprise )?network)\b/i],
  // A bare "facility" or "facilities" is not a site opening ("consolidate sortation facilities" is a network program):
  // the family needs a site noun or an opening, building, expansion or investment verb.
  ['SITE_OPENING', /\b(fulfil+ment cent\w+|distribution cent\w+|warehouses?|plants?|new facilit(?:y|ies)|\bDCs?\b|open(?:s|ed|ing)?(?:a |its |the )?(?:new )?(?:facility|plant|center|centre|site|dc)|build(?:s|ing)? (?:a |its )?(?:new )?(?:facility|plant|center|centre|site|dc)|expan(?:d|sion)\w*|invest\w* (?:more than |over )?\$)\b/i],
  ['AUTOMATION_TECH', /\b(autonomous|automat\w+|robot\w*|autogate|rtls|yard management|yms|tms|telematics|control tower|machine vision|digital|technology|dexterity)\b/i],
  ['FLEET', /\b(private fleet|dedicated fleet|fleets?|tractors?|trailers?|trucks?|drivers?)\b/i],
  ['AIR_NETWORK', /\b(air network|aircraft|flights?|airline|tricolor|air cargo|air freight)\b/i],
  ['YARD', /\b(yards?|gates?|docks?|dwell|detention|check[- ]in|hostlers?|spotters?|trailer pool)\b/i],
];

const FAMILY_LABEL: Record<FactFamily, string> = {
  NETWORK_PROGRAM: 'a network program (linehaul, sortation, hubs, network optimization)',
  SITE_OPENING: 'a site opening or expansion (a fulfillment center, DC, plant or facility)',
  AUTOMATION_TECH: 'an automation or technology change',
  FLEET: 'a fleet change',
  AIR_NETWORK: 'an air network change (aircraft, flights), not the ground network',
  YARD: 'yard, gate or dock execution',
  GENERIC: 'a physical-network change',
};

/** The fact families a hypothesis names (the fact first, then the hypothesis text), most specific first. */
export function factFamilies(text: string): FactFamily[] {
  const out: FactFamily[] = [];
  for (const [family, re] of FAMILY_WORDS) if (re.test(text)) out.push(family);
  return out.length ? out : ['GENERIC'];
}

const TAG_WORDS: Array<[ResponsibilityTag, RegExp]> = [
  ['network_ops', /\b(network operations|network execution|surface operations|ground operations|road network|surface network|ground network|operations network|network logistics)\b/i],
  ['planning_engineering', /\b(operations planning|planning (?:&|and) engineering|network planning|network engineering|operations engineering|industrial engineering|network strategy|network design)\b/i],
  ['linehaul', /\b(line ?haul|middle[- ]mile|intersite|otr|over the road)\b/i],
  ['hub_terminal', /\b(hub|hubs|terminal|terminals|station operations|cross[- ]?dock\w*)\b/i],
  ['sortation', /\b(sortation|sort operations|sort center)\b/i],
  ['transportation', /\b(transportation|transport|freight|trucking|traffic|shipping|carrier management|inbound|outbound|delivery)\b/i],
  ['logistics', /\b(logistics|supply chain operations|physical distribution)\b/i],
  ['fleet', /\b(fleet|private fleet|dedicated|drivers?)\b/i],
  ['distribution', /\b(distribution|dc operations|distribution center)\b/i],
  ['fulfillment', /\b(fulfil+ment|e-?commerce operations|order fulfil+ment)\b/i],
  ['warehouse', /\b(warehous\w*)\b/i],
  ['site', /\b(plant|site|facility|facilities|dc manager|dc director|general manager|yard manager|warehouse manager)\b/i],
  ['automation', /\b(automation|robotics|autonomous|engineering (?:&|and) automation)\b/i],
  ['transportation_tech', /\b((?:transportation|transport|freight|fleet|logistics|yard|supply chain) (?:technology|systems|solutions|transformation|digital|it)|tms|yms|wms|control tower|telematics|visibility|modernization)\b/i],
  ['ops_tech', /\b(operations technology|ops technology|network technology|operations systems|operations research)\b/i],
  ['air', /\b(air network|aircraft|flight|airline|aviation)\b/i],
  ['yard', /\b(yard|gate|dock)\b/i],
  ['generic_ops', /\boperations?\b/i],
];

/** The responsibilities a title names (several at once; a bare "operations" is only generic_ops). */
export function responsibilityTags(title: string | null | undefined): Set<ResponsibilityTag> {
  const t = String(title ?? '');
  const out = new Set<ResponsibilityTag>();
  for (const [tag, re] of TAG_WORDS) if (re.test(t)) out.add(tag);
  return out;
}

/** Which responsibilities each fact family lands on directly, and which are related. */
const FAMILY_TAGS: Record<FactFamily, { direct: ResponsibilityTag[]; related: ResponsibilityTag[] }> = {
  NETWORK_PROGRAM: { direct: ['network_ops', 'planning_engineering', 'linehaul', 'hub_terminal', 'sortation', 'ops_tech'], related: ['transportation', 'logistics', 'fleet', 'generic_ops'] },
  SITE_OPENING: { direct: ['distribution', 'fulfillment', 'warehouse', 'transportation', 'logistics', 'site'], related: ['network_ops', 'fleet', 'planning_engineering', 'generic_ops'] },
  AUTOMATION_TECH: { direct: ['transportation_tech', 'automation', 'ops_tech', 'yard'], related: ['transportation', 'network_ops', 'logistics', 'fleet', 'planning_engineering'] },
  FLEET: { direct: ['fleet', 'transportation'], related: ['logistics', 'network_ops', 'linehaul'] },
  AIR_NETWORK: { direct: ['air'], related: ['network_ops', 'planning_engineering', 'hub_terminal', 'sortation'] },
  YARD: { direct: ['yard', 'transportation', 'hub_terminal', 'site', 'distribution'], related: ['logistics', 'network_ops', 'automation', 'fleet'] },
  GENERIC: { direct: ['transportation', 'logistics', 'fleet', 'network_ops'], related: ['distribution', 'site', 'planning_engineering'] },
};

const TAG_LABEL: Record<ResponsibilityTag, string> = {
  network_ops: 'network operations',
  planning_engineering: 'operations planning and engineering',
  linehaul: 'linehaul',
  hub_terminal: 'hubs and terminals',
  sortation: 'sortation',
  transportation: 'transportation',
  logistics: 'logistics',
  fleet: 'the fleet',
  distribution: 'distribution',
  fulfillment: 'fulfillment',
  warehouse: 'warehousing',
  site: 'a site',
  automation: 'automation',
  transportation_tech: 'transportation technology',
  ops_tech: 'operations technology',
  air: 'the air network',
  yard: 'the yards and gates',
  generic_ops: 'operations',
};

/** Ground network functions: beside an air word they still name the ground network. */
const GROUND_TAGS: ResponsibilityTag[] = ['linehaul', 'hub_terminal', 'sortation', 'planning_engineering'];

export interface ThesisContext {
  observation: string;
  problemHypothesis?: string | null;
  problemFamily?: string | null;
  /** R32: the thesis's declared evidence approach (metadata.approach); absent reads as the event-led path. */
  approach?: string | null;
  /** R32: the role a job posting names (its claim attributes), when known; else read from the observation. */
  postingRole?: string | null;
}

/** R32: where the person sits, for the site and division scope (all optional; unknown never demotes). */
export interface PersonScope {
  accountName?: string | null;
  /** The person's location (a CRM "City, State, Country" line). */
  location?: string | null;
  /** The CRM company field (a division's name, e.g. Frito-Lay), never identity. */
  company?: string | null;
}

export interface ThesisRelevance {
  tier: RelevanceTier;
  /** One clause for Casey ("runs network operations: the fact is a network program"). */
  why: string;
  families: FactFamily[];
  /** The fact family in words (for the headline). */
  factLabel: string;
  /** R32: the posting's role, when the thesis is job-led and the role is known (the function the match was made on). */
  postingRole?: string | null;
  /** R32: a direct fit capped to related because the person runs another site or sits in another division. */
  cappedBy?: 'site' | 'division' | null;
  /** R32: the fact names a site and the person runs that same site. */
  siteMatch?: boolean;
}

const US_STATES = new Set(
  'alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada ohio oklahoma oregon pennsylvania tennessee texas utah vermont virginia washington wisconsin wyoming'
    .split(' ')
    .concat(['new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'rhode island', 'south carolina', 'south dakota', 'west virginia']),
);
const STATE_CODE = /^(?:A[LKZR]|C[AOT]|DE|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]|DC)$/;
const NOT_A_SITE = /^(?:the|a|an|its|our|their|new|north|south|east|west|central|america|americas|north america|united states|us|usa|global|corporate|headquarters|hq|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|company|group|inc|llc)$/i;
const SITE_NOUN = '(?:[Dd]istribution [Cc]ent(?:er|re)|DC|[Pp]lant|[Ff]acility|[Ww]arehouse|[Ff]ulfil+ment [Cc]ent(?:er|re)|[Ss]ite|[Yy]ard|[Tt]erminal|[Hh]ub|[Cc]ampus|[Mm]anufacturing (?:[Pp]lant|[Ff]acility)|[Cc]ross[- ]?[Dd]ock)';
const PLACE = "([A-Z][a-z]+(?:[ -][A-Z][a-z]+){0,2})";

const usablePlace = (raw: string | null | undefined, account?: string | null): string | null => {
  const v = String(raw ?? '').trim();
  if (!v || NOT_A_SITE.test(v) || US_STATES.has(v.toLowerCase()) || STATE_CODE.test(v)) return null;
  if (account && account.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2).includes(v.toLowerCase())) return null;
  if (responsibilityTags(v).size) return null;
  return v;
};

/**
 * R32: the SITE a fact names, when it names one: "its Tulsa distribution center", "a new plant in Tulsa, Oklahoma",
 * "at the Tulsa DC". A state alone, a region, a month or the account's own name is never a site. Null when none.
 */
export function factSite(text: string, accountName?: string | null): string | null {
  const t = String(text ?? '');
  // The place is a capitalized name (case-sensitive); every match is tried, so an early non-place never hides a site.
  const patterns = [
    new RegExp(`\\b(?:[Ii]ts|[Tt]he|[Aa]n?|[Oo]ur|[Nn]ew)\\s+(?:new\\s+)?${PLACE}(?:,\\s*[A-Z]{2})?\\s+${SITE_NOUN}\\b`, 'g'),
    new RegExp(`\\b(?:in|at|near|outside)\\s+(?:the\\s+)?${PLACE},\\s*(?:[A-Z]{2}\\b|[A-Z][a-z]+(?:\\s[A-Z][a-z]+)?)`, 'g'),
    new RegExp(`\\b(?:in|at|near)\\s+(?:the\\s+)?${PLACE}\\s+${SITE_NOUN}\\b`, 'g'),
  ];
  for (const re of patterns) {
    for (const m of t.matchAll(re)) {
      const place = usablePlace(m[1], accountName);
      if (place) return place;
    }
  }
  return null;
}

/**
 * R32: the site a person runs, when their title or location says so: "DC Manager, Dallas", "Plant Manager - Tulsa",
 * or a site-level title with a CRM location ("Dallas, Texas, United States"). A network title is never read as a
 * site from its location (an executive based at headquarters runs every site).
 */
export function personSite(title: string | null | undefined, location: string | null | undefined, accountName?: string | null): string | null {
  const t = String(title ?? '');
  const tail = /(?:,|\s[-\u2013|@]\s|\sat\s)\s*([A-Z][A-Za-z]+(?:[ -][A-Z][A-Za-z]+){0,2})\s*$/.exec(t)?.[1] ?? null;
  const fromTitle = usablePlace(tail, accountName);
  if (fromTitle) return fromTitle;
  if (!responsibilityTags(t).has('site') && !SITE_LEVEL.test(t)) return null;
  const city = String(location ?? '').split(',')[0]?.trim() ?? '';
  return usablePlace(city, accountName);
}

/** A title that runs one site (its location is then the site): a DC, plant, warehouse, terminal, hub or yard lead. */
const SITE_LEVEL = /\b(?:distribution cent(?:er|re)|fulfil+ment cent(?:er|re)|dc|plant|warehouse|terminal|hub|yard|site|facility|branch)\s+(?:operations\s+)?(?:manager|director|general manager|gm|lead|leader|supervisor|superintendent|head)\b/i;
const sameSite = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]+/g, '') === b.toLowerCase().replace(/[^a-z]+/g, '');

/**
 * How a title relates to what the hypothesis says changed. The fact (the observation) names the families; the
 * hypothesis text stands in only when the fact names none.
 */
export function thesisRelevance(title: string | null | undefined, thesis: ThesisContext | null | undefined, person?: PersonScope | null): ThesisRelevance {
  if (!thesis) return { tier: 'none', why: 'no hypothesis context', families: [], factLabel: 'no fact' };
  const base = remitRelevance(title, thesis);
  return scoped(base, title, thesis, person ?? null);
}

/**
 * R32: the site and division scope over a remit read. A DIRECT fit is capped to related when the fact names a site
 * and the person runs another one, or when the fact is one division's and the person sits in another. Unknown never
 * demotes; the reason says whose fact it is when the person's division is not on record.
 */
function scoped(r: ThesisRelevance, title: string | null | undefined, thesis: ThesisContext, person: PersonScope | null): ThesisRelevance {
  if (r.tier !== 'direct') return r;
  const account = person?.accountName ?? null;
  const factDivision = account ? divisionOf(account, thesis.observation) : null;
  if (factDivision && account) {
    const theirs = divisionOf(account, title) ?? divisionOf(account, person?.company ?? null);
    if (theirs && theirs !== factDivision) return { ...r, tier: 'related', why: `${r.why}; but they sit in ${theirs}, and the fact is ${factDivision}'s`, cappedBy: 'division' };
    if (!theirs) r = { ...r, why: `${r.why} (the fact is ${factDivision}'s; their division is not on record)` };
  }
  const site = factSite(thesis.observation, account);
  const theirSite = site ? personSite(title, person?.location ?? null, account) : null;
  if (site && theirSite && !sameSite(site, theirSite)) return { ...r, tier: 'related', why: `${r.why}; but they run ${theirSite}, and the fact names ${site}`, cappedBy: 'site' };
  if (site && theirSite) return { ...r, why: `${r.why}, at ${site}, the site it names`, siteMatch: true };
  return r;
}

/** The remit read: the posting's role for a job-led thesis, else the fact (and the hypothesis text when the fact names nothing). */
function remitRelevance(title: string | null | undefined, thesis: ThesisContext): ThesisRelevance {
  // R32: a job / procurement-led thesis whose posting names a role is matched on that role's function (the hiring
  // manager's remit), never on every word of the posting's text.
  const role = thesis.approach === 'job_procurement_led' ? (thesis.postingRole?.trim() || postingRoleOf(thesis.observation)) : null;
  if (role) {
    const families = factFamilies(role);
    const tags = responsibilityTags(title);
    const factLabel = `a job posting for a ${role}`;
    if (!tags.size) return { tier: 'none', why: `the title names no operating responsibility; the posting is for a ${role}`, families, factLabel, postingRole: role };
    for (const f of families) {
      const hit = FAMILY_TAGS[f].direct.filter((t) => tags.has(t));
      if (hit.length) return { tier: 'direct', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}: the posting is for a ${role}, a role in that function`, families, factLabel, postingRole: role };
    }
    for (const f of families) {
      const hit = FAMILY_TAGS[f].related.filter((t) => tags.has(t));
      if (hit.length) return { tier: 'related', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}, adjacent to the ${role} the posting names`, families, factLabel, postingRole: role };
    }
    return { tier: 'none', why: `runs ${[...tags].map((t) => TAG_LABEL[t]).join(' and ')}; the posting is for a ${role}, outside that function`, families, factLabel, postingRole: role };
  }
  // The FACT decides what changed. The hypothesis text (every hidden-capacity guess says "gates, yards and docks")
  // adds its families only when the fact itself names none: otherwise every transportation title would read
  // direct on every hypothesis and nothing would be thesis-specific (WHO truth maintenance, 2026-10-05).
  const fromFact = factFamilies(thesis.observation);
  const families = fromFact.length === 1 && fromFact[0] === 'GENERIC' ? factFamilies(thesis.problemHypothesis ?? '') : fromFact;
  const tags = responsibilityTags(title);
  const factLabel = families.map((f) => FAMILY_LABEL[f]).join('; ');
  if (!tags.size) return { tier: 'none', why: `the title names no operating responsibility; the fact is ${factLabel}`, families, factLabel };
  // The air side of a GROUND network program (an air network operations title names "network operations" too):
  // related, not direct, unless the title also names a ground function (linehaul, hubs, sortation, planning).
  const airOnly = tags.has('air') && !GROUND_TAGS.some((t) => tags.has(t));
  for (const f of families) {
    const hit = FAMILY_TAGS[f].direct.filter((t) => tags.has(t));
    if (hit.length && f === 'NETWORK_PROGRAM' && airOnly) return { tier: 'related', why: `runs the air network, beside ${FAMILY_LABEL[f]} on the ground`, families, factLabel };
    if (hit.length) return { tier: 'direct', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}: the fact is ${FAMILY_LABEL[f]}`, families, factLabel };
  }
  for (const f of families) {
    const hit = FAMILY_TAGS[f].related.filter((t) => tags.has(t));
    if (hit.length) return { tier: 'related', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}, adjacent to ${FAMILY_LABEL[f]}`, families, factLabel };
  }
  return { tier: 'none', why: `runs ${[...tags].map((t) => TAG_LABEL[t]).join(' and ')}, which the fact (${factLabel}) does not touch`, families, factLabel };
}
