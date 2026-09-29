/**
 * ENTITY TYPE != YARDFLOW FIT (2026-09-29). Pure; shared by Scout, the candidate queue and the account brief.
 *
 * ENTITY TYPE is descriptive: what the company is.
 * YARDFLOW FIT is whether it could buy YardFlow, and it comes from OPERATIONS, never the label. YardFlow is for
 * whoever owns, operates, controls or answers for meaningful physical freight and yard execution: plants, DCs,
 * terminals, yards, trailer pools, gates, fleets. That includes shippers, retailers and distributors, and also
 * 3PLs, carriers, ports and terminals that run their own facilities. "Doesn't own the freight" is not "doesn't
 * own the yard problem".
 *
 *   DIRECT_BUYER            cited evidence it runs freight-intensive facilities or fleets
 *   POTENTIAL_DIRECT_BUYER  an owner of goods without cited operations yet, or an asset-based broker
 *   PARTNER                 a vendor or advisor serving logistics: a channel, never a direct buyer
 *   NOT_FIT                 no physical freight operation (a pure broker, an unrelated business)
 *   UNKNOWN                 not enough to say (an operator type with no cited operations: check its network)
 */

export type EntityType = 'shipper' | 'retailer' | 'distributor' | 'manufacturer' | '3pl' | 'carrier' | 'port_terminal' | 'broker' | 'vendor' | 'consultant' | 'other';
export type YardFlowFit = 'DIRECT_BUYER' | 'POTENTIAL_DIRECT_BUYER' | 'PARTNER' | 'NOT_FIT' | 'UNKNOWN';
export const ENTITY_TYPES: readonly EntityType[] = ['shipper', 'retailer', 'distributor', 'manufacturer', '3pl', 'carrier', 'port_terminal', 'broker', 'vendor', 'consultant', 'other'];

export const ENTITY_LABEL: Record<EntityType, string> = {
  shipper: 'shipper / BCO',
  retailer: 'retailer',
  distributor: 'distributor',
  manufacturer: 'manufacturer',
  '3pl': '3PL / contract logistics',
  carrier: 'carrier',
  port_terminal: 'port / terminal',
  broker: 'freight broker',
  vendor: 'software / services vendor',
  consultant: 'consultant',
  other: 'other',
};
export const FIT_LABEL: Record<YardFlowFit, string> = {
  DIRECT_BUYER: 'Direct buyer',
  POTENTIAL_DIRECT_BUYER: 'Potential direct buyer',
  PARTNER: 'Partner / channel',
  NOT_FIT: 'Not a fit',
  UNKNOWN: 'Fit unknown',
};

/** A claim about physical freight operations (facilities, yards, fleets, trailer pools, gates, terminals). */
const OPERATING = /\b(distribution (cent(er|re)s?|network)|DCs?|warehous\w*|plants?|terminals?|yards?|trailers?|fleets?|tractors?|trucks?|hostlers?|gates?|cross[- ]?docks?|facilit(y|ies)|ports?|rail(yard|road)?|intermodal|chassis|containers?|depots?|hubs?|fulfil+ment (cent(er|re)s?|network)|service cent(er|re)s?|cold storage|drayage)\b/i;
const LOGISTICS_SERVICE = /\b(logistic|freight|transport|supply chain|shipping|fleet|yard|warehouse|trucking|carrier|3pl|dock|trailer|visibility|tms|wms)\w*/i;

export function operatingClaims<T extends { claim: string }>(claims: readonly T[]): T[] {
  return claims.filter((c) => OPERATING.test(c.claim));
}

const OWNERS = new Set<EntityType>(['shipper', 'retailer', 'distributor', 'manufacturer']);
const OPERATORS = new Set<EntityType>(['3pl', 'carrier', 'port_terminal']);

export function deriveFit(x: { entityType: EntityType | null; operating: number; ambiguous: boolean; what: string | null }): { fit: YardFlowFit; why: string } {
  const n = `${x.operating} cited operating ${x.operating === 1 ? 'claim' : 'claims'}`;
  if (x.ambiguous) return { fit: 'UNKNOWN', why: 'The name could be several companies: say which one before judging fit.' };
  if (!x.entityType) return { fit: 'UNKNOWN', why: 'What the company is could not be established.' };
  const label = ENTITY_LABEL[x.entityType];
  if (OWNERS.has(x.entityType)) return x.operating ? { fit: 'DIRECT_BUYER', why: `A ${label} that runs freight facilities (${n}).` } : { fit: 'POTENTIAL_DIRECT_BUYER', why: `A ${label}; no cited operating evidence yet (check its plants and DCs).` };
  if (OPERATORS.has(x.entityType)) return x.operating ? { fit: 'DIRECT_BUYER', why: `A ${label} that runs its own facilities or fleet (${n}): it owns yard problems even without owning the freight.` } : { fit: 'UNKNOWN', why: `A ${label}; fit depends on whether it runs facilities, yards or a fleet: needs an operating-network check.` };
  if (x.entityType === 'broker') return x.operating ? { fit: 'POTENTIAL_DIRECT_BUYER', why: `A broker with physical operations (${n}): asset-based, check which facilities it runs.` } : { fit: 'NOT_FIT', why: 'A freight broker with no cited physical operation: it does not run yards.' };
  if (x.entityType === 'vendor' || x.entityType === 'consultant') return x.what && LOGISTICS_SERVICE.test(x.what) ? { fit: 'PARTNER', why: `A ${label} serving logistics: a partner or channel, never a direct buyer.` } : { fit: 'NOT_FIT', why: `A ${label} outside freight operations.` };
  return x.operating ? { fit: 'POTENTIAL_DIRECT_BUYER', why: `Unclassified, but runs freight facilities (${n}).` } : { fit: 'NOT_FIT', why: 'No physical freight operation found.' };
}

/**
 * Free name rules. They may GUESS the entity type; they settle fit ONLY when it is genuinely obvious (our own
 * company, finance, healthcare, education, public sector, media, software and staffing firms). A logistics,
 * transportation, distribution-services, carrier or broker name is a guess that needs an operating check.
 */
const FINAL: Array<[EntityType, RegExp, string]> = [
  ['other', /\b(freightroll|yardflow)\b/i, 'our own company'],
  ['other', /\b(capital|ventures|asset man\w*|investments?|bank|blackstone|private equity)\b/i, 'a finance firm'],
  ['other', /\b(health|dental|medical|clinic|hospital|college|university|school|academy|sheriff'?s?|police|county|department of|city of)\b/i, 'healthcare, education or public sector'],
  ['vendor', /\b(topics|news|media|magazine|publishing|podcast|productions?)\b/i, 'a media company'],
  ['vendor', /\b(software|recruit(ing|ers)|staffing|insurance|eap)\b/i, 'a software or staffing firm'],
];
const GUESS: Array<[EntityType, RegExp]> = [
  ['carrier', /\b(fedex|ups|dhl|xpo|j\.?\s?b\.? hunt|schneider|werner|knight[- ]swift|old dominion|saia|estes|forward air|ryder|penske|landstar)\b/i],
  ['port_terminal', /\b(port|terminals?|stevedor\w*|marine)\b/i],
  ['broker', /\b(brokerage|brokers?)\b/i],
  ['carrier', /\b(trucking|truck lines|freight lines|motor freight|carriers?|express|transport(ation)?|trans inc|haul\w*|expedite\w*|drayage|intermodal)\b/i],
  ['3pl', /\b(logistics?|3pl|fulfil+ment|warehousing|supply chain solutions|distribution services)\b/i],
  ['broker', /\bfreight\b/i],
  ['vendor', /\b(technolog(y|ies)|systems|solutions|consult(ing|ants?)|advisors?|advisory|agency|audit)\b/i],
];

export function fitFromName(company: string): { entityType: EntityType | null; fit: YardFlowFit; final: boolean; why: string } {
  for (const [t, re, label] of FINAL) if (re.test(company)) return { entityType: t, fit: 'NOT_FIT', final: true, why: `The name reads as ${label} (name rule only; map or add it if that is wrong).` };
  for (const [t, re] of GUESS) if (re.test(company)) return { entityType: t, fit: 'UNKNOWN', final: false, why: `The name suggests a ${ENTITY_LABEL[t]}; YardFlow fit depends on its operations (needs an operating-network check).` };
  return { entityType: null, fit: 'UNKNOWN', final: false, why: 'The name alone says nothing about what the company is.' };
}
