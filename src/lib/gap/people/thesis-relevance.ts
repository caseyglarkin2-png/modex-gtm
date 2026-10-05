/**
 * THESIS-AWARE OWNER SELECTION (owner resolution, 2026-10-05). Owner resolution is not title ranking in isolation:
 * the hypothesis says what changed, and the person whose responsibility that change lands on is more relevant than
 * a generic senior executive. A linehaul / sortation / network modernization fact raises network operations,
 * operations planning and engineering and operations technology; a fulfillment center opening raises distribution
 * and transportation; a yard modernization fact raises transportation technology, yard operations and automation.
 *
 * Explainable: fact FAMILIES (from the fact and the hypothesis text) meet responsibility TAGS (from the title), and
 * the answer is a tier with its reason in words. Never a hidden numeric score. Pure.
 */

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
  ['SITE_OPENING', /\b(fulfil+ment cent\w+|distribution cent\w+|warehouses?|plants?|facilit(?:y|ies)|\bDCs?\b|open(?:s|ed|ing)? (?:a |its |the )?(?:new )?(?:facility|plant|center|centre|site|dc)|build(?:s|ing)? (?:a |its )?(?:new )?(?:facility|plant|center|centre|site|dc)|expan(?:d|sion)\w*|invest\w* (?:more than |over )?\$)\b/i],
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
  yard: 'the yard and gate',
  generic_ops: 'operations',
};

export interface ThesisContext {
  observation: string;
  problemHypothesis?: string | null;
  problemFamily?: string | null;
}

export interface ThesisRelevance {
  tier: RelevanceTier;
  /** One clause for Casey ("runs network operations: the fact is a network program"). */
  why: string;
  families: FactFamily[];
  /** The fact family in words (for the headline). */
  factLabel: string;
}

/**
 * How a title relates to what the hypothesis says changed. The fact (the observation) names the families first; the
 * hypothesis text adds its own (a yard-execution hypothesis over a network fact lands on both).
 */
export function thesisRelevance(title: string | null | undefined, thesis: ThesisContext | null | undefined): ThesisRelevance {
  if (!thesis) return { tier: 'none', why: 'no hypothesis context', families: [], factLabel: 'no fact' };
  const families = [...new Set([...factFamilies(thesis.observation), ...factFamilies(thesis.problemHypothesis ?? '')])].filter((f, _i, all) => f !== 'GENERIC' || all.length === 1);
  const tags = responsibilityTags(title);
  const factLabel = families.map((f) => FAMILY_LABEL[f]).join('; ');
  if (!tags.size) return { tier: 'none', why: `the title names no operating responsibility; the fact is ${factLabel}`, families, factLabel };
  for (const f of families) {
    const hit = FAMILY_TAGS[f].direct.filter((t) => tags.has(t));
    if (hit.length) return { tier: 'direct', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}: the fact is ${FAMILY_LABEL[f]}`, families, factLabel };
  }
  for (const f of families) {
    const hit = FAMILY_TAGS[f].related.filter((t) => tags.has(t));
    if (hit.length) return { tier: 'related', why: `runs ${hit.map((t) => TAG_LABEL[t]).join(' and ')}, adjacent to ${FAMILY_LABEL[f]}`, families, factLabel };
  }
  return { tier: 'none', why: `runs ${[...tags].map((t) => TAG_LABEL[t]).join(' and ')}, which the fact (${factLabel}) does not touch`, families, factLabel };
}
