/**
 * ENTITY EXPANSION B1: SCOUT, the cheap first pass on a company GAP does not know.
 *
 *   1. Name rules (free, entity/fit.ts): they may GUESS the entity type; they settle YardFlow fit only when it is
 *      genuinely obvious (our own company, finance, healthcare, education, public sector, media, software).
 *   2. One grounded web pass: what the company is, its domain, and CITED network / freight claims.
 *
 * ENTITY TYPE is descriptive; YARDFLOW FIT (the stored verdict) is DERIVED from cited operating evidence
 * (entity/fit.ts), never the model's opinion and never the label alone: a 3PL running DCs is a direct buyer, a
 * pure broker is not. A claim without an http(s) URL is never evidence (it is listed as an uncited claim). Scout
 * claims are cited, not verified at source: the account brief treats them as leads, never VERIFIED_PUBLIC.
 */
import { deriveFit, ENTITY_TYPES, fitFromName, operatingClaims, type EntityType, type YardFlowFit } from './fit';
import { askGrounded, defaultProviders, groundedOnly, type Attempt, type ProviderName, type ScoutProvider } from './providers';

export type { EntityType, YardFlowFit } from './fit';
/** The stored verdict IS the YardFlow fit. */
export type ScoutVerdict = YardFlowFit;
export interface ScoutClaim {
  claim: string;
  url: string;
}
export interface ScoutResult {
  company: string;
  verdict: YardFlowFit;
  entityType: EntityType | null;
  /** The name could be several companies (identity, separate from fit). */
  ambiguous?: boolean;
  domain: string | null;
  what: string | null;
  why: string;
  network: ScoutClaim[];
  freight: ScoutClaim[];
  unknowns: string[];
  basis: 'name_rules' | 'web';
  /** The web pass itself failed (quota, network, a cut-off answer): nothing was learned, so nothing is stored. */
  failed?: boolean;
  /** Which grounded provider answered, and every attempt in the chain (recorded in the audit). */
  provider?: ProviderName;
  attempts?: Attempt[];
}

/** Kept for callers: the name rule as a Scout-shaped answer (fit settled only when final). */
export function classifyByName(company: string): { entityType: EntityType | null; verdict: YardFlowFit; final: boolean; why: string } {
  const r = fitFromName(company);
  return { entityType: r.entityType, verdict: r.fit, final: r.final, why: r.why };
}

export function deriveVerdict(p: { entityType: EntityType | null; network: ScoutClaim[]; freight: ScoutClaim[]; ambiguous: boolean; what?: string | null }): YardFlowFit {
  return deriveFit({ entityType: p.entityType, operating: operatingClaims([...p.network, ...p.freight]).length, ambiguous: p.ambiguous, what: p.what ?? null }).fit;
}

const TYPES = new Set<EntityType>(ENTITY_TYPES);
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
{"entityType": "shipper" | "retailer" | "distributor" | "manufacturer" | "3pl" | "carrier" | "port_terminal" | "broker" | "vendor" | "consultant" | "other",
 "ambiguous": true if the name could be several different companies,
 "domain": "their corporate web domain",
 "what": "one sentence: what they do",
 "network": [{"claim": "a fact about facilities they OPERATE: plants, DCs, warehouses, terminals, yards, cross-docks, ports", "url": "the page that says it"}],
 "freight": [{"claim": "a fact about fleets, tractors, trailer pools, gates, hostlers, rail, drayage or the freight they move", "url": "the page that says it"}],
 "unknowns": ["what you could not find"]}
"shipper" owns the goods it ships. A 3PL, carrier or terminal operator that RUNS facilities or fleets still gets its network and freight claims: report them. A "broker" arranges freight without running it. Every claim needs the URL of a page that states it. If you cannot find something, leave it out and list it in unknowns. Never guess.`;

/**
 * groundedCompanyScout: the name rule first (free), then the provider chain (entity/providers.ts). Whichever
 * provider answers, the result is the same typed Scout evidence; a claim the search did not cite is dropped.
 */
export async function scoutCompany(company: string, deps: { providers?: ScoutProvider[]; hint?: string } = {}): Promise<ScoutResult> {
  const base = { company, domain: null, what: null, network: [], freight: [], unknowns: [] as string[] };
  const rule = fitFromName(company);
  // Only a genuinely obvious name settles fit for free; a logistics or carrier name still gets checked.
  if (rule.final) return { ...base, verdict: rule.fit, entityType: rule.entityType, why: rule.why, basis: 'name_rules' };
  const providers: ScoutProvider[] = deps.providers ?? defaultProviders();
  const r = await askGrounded(SCOUT_PROMPT(company, deps.hint ?? ''), (a) => {
    const p = parseScout(a.text);
    if (!p) return null;
    const net = groundedOnly(p.network, a.citations, a.citedHosts);
    const fr = groundedOnly(p.freight, a.citations, a.citedHosts);
    const lost = [...net.dropped, ...fr.dropped];
    // Every claim lost to the citation check: the answer is not grounded, so no fit is read from it (next provider).
    if (lost.length && !net.kept.length && !fr.kept.length) return null;
    return { ...p, network: net.kept, freight: fr.kept, unknowns: [...p.unknowns, ...lost.map((c) => `Not cited by the search (dropped): ${c.claim}`)] };
  }, providers);
  if (!r.ok) {
    const how = r.attempts.map((a) => `${a.provider} ${a.outcome.replace(/_/g, ' ')}`).join('; ') || 'no provider configured';
    return { ...base, verdict: 'UNKNOWN', entityType: null, why: `The web pass failed (${how}); nothing is known yet. Retry later.`, basis: 'web', failed: true, attempts: r.attempts };
  }
  const p = r.value;
  const f = deriveFit({ entityType: p.entityType, operating: operatingClaims([...p.network, ...p.freight]).length, ambiguous: p.ambiguous, what: p.what });
  return { company, verdict: f.fit, entityType: p.entityType, ambiguous: p.ambiguous || undefined, domain: p.domain, what: p.what, why: f.why, network: p.network, freight: p.freight, unknowns: p.unknowns, basis: 'web', provider: r.provider, attempts: r.attempts };
}
