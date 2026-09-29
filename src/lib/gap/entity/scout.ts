/**
 * ENTITY EXPANSION B1: SCOUT, the cheap first pass on a company GAP does not know.
 *
 *   1. Name rules (free): an obvious carrier, broker, 3PL or vendor is NOT ICP without a web call.
 *   2. One grounded web pass: what the company is, its domain, and CITED network / freight claims.
 *
 * The verdict is DERIVED from cited evidence, never the model's opinion:
 *   LIKELY_ICP    a shipper (BCO) with at least one cited network claim
 *   MAYBE_ICP     a shipper with no cited network claim yet
 *   NOT_ICP       a 3PL, carrier, broker or vendor
 *   AMBIGUOUS     the name could be several companies
 *   INSUFFICIENT  nothing usable (no web pass, a failed pass, or an unknown type)
 * A claim without an http(s) URL is never evidence (it is listed as an uncited claim). Scout claims are
 * cited, not verified at source: the account brief treats them as leads, never VERIFIED_PUBLIC.
 */

export type ScoutVerdict = 'LIKELY_ICP' | 'MAYBE_ICP' | 'NOT_ICP' | 'AMBIGUOUS' | 'INSUFFICIENT';
export type EntityType = 'shipper' | '3pl' | 'carrier' | 'broker' | 'vendor' | 'other';
export interface ScoutClaim {
  claim: string;
  url: string;
}
export interface ScoutResult {
  company: string;
  verdict: ScoutVerdict;
  entityType: EntityType | null;
  domain: string | null;
  what: string | null;
  why: string;
  network: ScoutClaim[];
  freight: ScoutClaim[];
  unknowns: string[];
  basis: 'name_rules' | 'web';
  /** The web pass itself failed (quota, network, a cut-off answer): nothing was learned, so nothing is stored. */
  failed?: boolean;
}

/**
 * Free name rules, checked in order. Each names what the company reads as; a wrong call costs nothing because
 * Casey can still map or add it. Nothing here ever says LIKELY ICP: a shipper cannot be told from its name.
 */
const NAME_RULES: Array<[EntityType, RegExp, string]> = [
  ['other', /\b(freightroll|yardflow)\b/i, 'our own company'],
  ['carrier', /\b(fedex|ups|dhl|xpo|j\.?\s?b\.? hunt|schneider|werner|knight[- ]swift|old dominion|saia|estes|forward air|ryder|penske|landstar|yellow corp)\b/i, 'a carrier or logistics provider (a known brand)'],
  ['broker', /\b(brokerage|brokers?|freight(?! buyers)|freight buyers)\b/i, 'a freight broker or freight community'],
  ['carrier', /\b(trucking|truck lines|freight lines|motor freight|carriers?|express|transport(ation)?|trans inc|haul\w*|expedite\w*|drop (and|&) hook)\b/i, 'a carrier'],
  ['3pl', /\b(logistics?|3pl|fulfil+ment|warehousing|supply chain solutions|distribution services)\b/i, 'a 3PL or logistics provider'],
  ['vendor', /\b(software|technolog(y|ies)|systems|solutions|consult(ing|ants?)|advisors?|advisory|agency|audit|productions?|media|topics|news|publishing|podcast|associat(ion|es)|insurance|recruit(ing|ers)|staffing|eap)\b/i, 'a vendor, media or services firm'],
  ['other', /\b(capital|ventures|asset man\w*|investments?|bank|blackstone|private equity|partners)\b/i, 'a finance firm'],
  ['other', /\b(health|dental|medical|clinic|hospital|care|college|university|school|academy|sheriff'?s?|police|county|department of|city of)\b/i, 'healthcare, education or public sector'],
];

export function classifyByName(company: string): { entityType: EntityType | null; verdict: ScoutVerdict; why: string } {
  for (const [t, re, label] of NAME_RULES) if (re.test(company)) return { entityType: t, verdict: 'NOT_ICP', why: `The name reads as ${label} (name rule only; map or add it if that is wrong).` };
  return { entityType: null, verdict: 'INSUFFICIENT', why: 'The name alone says nothing about what the company is.' };
}

export function deriveVerdict(p: { entityType: EntityType | null; network: ScoutClaim[]; freight: ScoutClaim[]; ambiguous: boolean }): ScoutVerdict {
  if (p.ambiguous) return 'AMBIGUOUS';
  if (p.entityType === '3pl' || p.entityType === 'carrier' || p.entityType === 'broker' || p.entityType === 'vendor') return 'NOT_ICP';
  if (p.entityType === 'shipper') return p.network.length ? 'LIKELY_ICP' : 'MAYBE_ICP';
  return 'INSUFFICIENT';
}

const TYPES = new Set<EntityType>(['shipper', '3pl', 'carrier', 'broker', 'vendor', 'other']);
const httpUrl = (u: unknown) => typeof u === 'string' && /^https?:\/\/[^\s]+$/i.test(u.trim());

export function parseScout(text: string): { entityType: EntityType | null; domain: string | null; ambiguous: boolean; what: string | null; network: ScoutClaim[]; freight: ScoutClaim[]; unknowns: string[] } | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const unknowns = Array.isArray(o.unknowns) ? o.unknowns.filter((u): u is string => typeof u === 'string' && !!u.trim()).slice(0, 6) : [];
  const claims = (v: unknown): ScoutClaim[] => {
    if (!Array.isArray(v)) return [];
    const out: ScoutClaim[] = [];
    for (const c of v) {
      if (!c || typeof c !== 'object') continue;
      const { claim, url } = c as Record<string, unknown>;
      if (typeof claim !== 'string' || !claim.trim()) continue;
      if (httpUrl(url)) out.push({ claim: claim.trim(), url: (url as string).trim() });
      else unknowns.push(`Uncited claim (not evidence): ${claim.trim()}`);
    }
    return out.slice(0, 5);
  };
  const t = typeof o.entityType === 'string' ? (o.entityType.toLowerCase() as EntityType) : null;
  const rawDomain = typeof o.domain === 'string' ? o.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : '';
  const domain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(rawDomain) ? rawDomain : null;
  return {
    entityType: t && TYPES.has(t) ? t : null,
    domain,
    ambiguous: o.ambiguous === true,
    what: typeof o.what === 'string' && o.what.trim() ? o.what.trim().slice(0, 200) : null,
    network: claims(o.network),
    freight: claims(o.freight),
    unknowns,
  };
}

export const SCOUT_PROMPT = (company: string, hint: string) => `Identify the company "${company}"${hint ? ` (${hint})` : ''} for a yard-management sales team.
Return ONLY JSON:
{"entityType": "shipper" | "3pl" | "carrier" | "broker" | "vendor" | "other",
 "ambiguous": true if the name could be several different companies,
 "domain": "their corporate web domain",
 "what": "one sentence: what they make or sell",
 "network": [{"claim": "a fact about their plants, DCs, warehouses or yards", "url": "the page that says it"}],
 "freight": [{"claim": "a fact about their trucking, fleet, rail or inbound/outbound freight", "url": "the page that says it"}],
 "unknowns": ["what you could not find"]}
"shipper" means a company that owns the goods it ships (a manufacturer, grower, distributor or retailer). Every claim needs the URL of a page that states it. If you cannot find something, leave it out and list it in unknowns. Never guess.`;

export async function scoutCompany(company: string, deps: { ask?: (prompt: string) => Promise<string>; hint?: string } = {}): Promise<ScoutResult> {
  const base = { company, domain: null, what: null, network: [], freight: [], unknowns: [] as string[] };
  const rule = classifyByName(company);
  if (rule.verdict === 'NOT_ICP') return { ...base, verdict: 'NOT_ICP', entityType: rule.entityType, why: rule.why, basis: 'name_rules' };
  const ask = deps.ask ?? defaultAsk;
  let text: string;
  try {
    text = await ask(SCOUT_PROMPT(company, deps.hint ?? ''));
  } catch (e) {
    return { ...base, verdict: 'INSUFFICIENT', entityType: null, why: `The web pass failed (${e instanceof Error ? e.message.slice(0, 120) : 'error'}); nothing is known yet.`, basis: 'web', failed: true };
  }
  const p = parseScout(text);
  if (!p) return { ...base, verdict: 'INSUFFICIENT', entityType: null, why: 'The web pass returned nothing usable.', basis: 'web', failed: true };
  const verdict = deriveVerdict(p);
  const why =
    verdict === 'LIKELY_ICP' ? `A shipper with cited network evidence (${p.network.length} ${p.network.length === 1 ? 'claim' : 'claims'}).`
    : verdict === 'MAYBE_ICP' ? 'A shipper, but no cited network evidence yet.'
    : verdict === 'NOT_ICP' ? `Reads as a ${p.entityType === '3pl' ? '3PL' : p.entityType}, not a shipper that owns yards${p.network.length || p.freight.length ? '' : ' (the web pass cited nothing for this; check before ignoring)'}.`
    : verdict === 'AMBIGUOUS' ? 'The name could be several companies: say which one before anything else.'
    : 'The company type could not be established.';
  return { company, verdict, entityType: p.entityType, domain: p.domain, what: p.what, why, network: p.network, freight: p.freight, unknowns: p.unknowns, basis: 'web' };
}

async function defaultAsk(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('web search not configured');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} } as unknown as never], generationConfig: { temperature: 0, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 512 } } as never });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
