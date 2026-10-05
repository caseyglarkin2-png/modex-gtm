/**
 * Web-grounded contact research — proposes decision-maker NAMES at a company via
 * Gemini + Google Search grounding, so the worklist can suggest who to reach
 * without manual LinkedIn hunting. Results are PROPOSALS to verify, not facts:
 * the UI flags them, links LinkedIn for a one-click check, and the inferred email
 * + editable composer are the safety net before anything sends.
 *
 * OPERATOR-FIRST (GAP seller correction, 2026-10-04): the search fills explicit RESPONSIBILITY SLOTS in order
 * (direct transportation / logistics / freight / fleet operator, then transportation tech / transformation, then
 * the supply chain sponsor, then a site operator), never "six generic decision makers". Every person must carry a
 * source URL (a public page that shows the current role) or they are dropped; the slot is re-read by the GAP person
 * prior (the one WHO authority), never taken from the model; an email is kept only when the model cites where it
 * was published. Fewer people when the evidence is weak.
 *
 * Only imported from the `'use server'` discovery actions (server-side).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isSponsor, rankWho, readPerson, type PersonLane } from '@/lib/gap/people/person-prior';

/** The responsibility slot a researched person fills, in the order research asks for them. */
export type ResearchSlot = 'DIRECT_OPERATOR' | 'TRANSPORTATION_TECH' | 'EXECUTIVE_SPONSOR' | 'SITE_OPERATOR' | 'OTHER';
export const SLOT_ORDER: ResearchSlot[] = ['DIRECT_OPERATOR', 'TRANSPORTATION_TECH', 'EXECUTIVE_SPONSOR', 'SITE_OPERATOR', 'OTHER'];

/**
 * The slot from the GAP person prior's reading of the title (never the model's own label). The sponsor is the one
 * sponsor rule; any other supply chain, warehouse, DC, plant or regional operations leader is a SITE / regional
 * operator (the local leaders /discovery asks for near a facility; review S7).
 */
export function slotForTitle(title: string | null | undefined): { slot: ResearchSlot; lane: PersonLane } {
  const r = readPerson(title);
  const slot: ResearchSlot =
    r.lane === 'PRIMARY_OPERATOR' ? 'DIRECT_OPERATOR'
    : r.lane === 'TRANSFORMATION_TECH' && r.ownership > 0 ? 'TRANSPORTATION_TECH'
    : isSponsor(r, title) ? 'EXECUTIVE_SPONSOR'
    : r.lane === 'FACILITY_OPERATOR' || r.lane === 'ADJACENT_OPERATOR' ? 'SITE_OPERATOR'
    : r.lane === 'NEEDS_REVIEW' && /\b(plant|manufacturing|production)\b/i.test(String(title ?? '')) ? 'SITE_OPERATOR'
    : 'OTHER';
  return { slot, lane: r.lane };
}

export interface ResearchedContact {
  name: string;
  firstName: string;
  lastName: string;
  title?: string;
  linkedinUrl?: string;
  reason?: string;
  /** 'local' = regional/site leader near the facility; 'corporate' = HQ decision-maker. */
  scope: 'local' | 'corporate';
  /** The responsibility slot, re-read from the title by the GAP person prior. */
  slot?: ResearchSlot;
  lane?: PersonLane;
  /** The public page that shows the current role (a LinkedIn profile URL also counts). Required to keep the person. */
  sourceUrl?: string;
  /** When the source was published or last showed the role, as the model found it (unverified text). */
  sourceDate?: string;
  /** The person's own location or remit, when the source says it. */
  location?: string;
  /** The operating unit / division, when the source names it. */
  division?: string;
  confidence?: 'high' | 'medium' | 'low';
  /** An email the model says was published at emailSourceUrl; dropped when no such source is given. */
  email?: string;
  emailSourceUrl?: string;
}

export interface ResearchLocation {
  city?: string;
  state?: string;
  corridor?: string;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** Tolerantly extract a contacts JSON array from a model response. Pure. */
export function parseResearchedContacts(text: string): ResearchedContact[] {
  if (!text) return [];
  // Prefer a ```json fenced block; else the first top-level [...] array.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start < 0 || end <= start) return [];

  let raw: unknown;
  try {
    raw = JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const out: ResearchedContact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const name = typeof rec.name === 'string' ? rec.name.trim() : '';
    if (!name || !/[a-z]/i.test(name)) continue;
    const { firstName, lastName } = splitName(name);
    if (!firstName) continue;
    const scope = rec.scope === 'local' ? 'local' : 'corporate';
    const str = (k: string) => (typeof rec[k] === 'string' ? (rec[k] as string).trim() || undefined : undefined);
    const url = (k: string) => {
      const v = str(k);
      return v && /^https?:\/\/\S+\.\S+/i.test(v) ? v : undefined;
    };
    const title = str('title');
    const { slot, lane } = slotForTitle(title);
    const emailSourceUrl = url('emailSourceUrl');
    const rawEmail = str('email');
    const email = emailSourceUrl && rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail.toLowerCase() : undefined;
    const confidence = rec.confidence === 'high' || rec.confidence === 'medium' || rec.confidence === 'low' ? rec.confidence : undefined;
    out.push({
      name,
      firstName,
      lastName,
      title,
      linkedinUrl: str('linkedinUrl'),
      reason: str('reason'),
      scope,
      slot,
      lane,
      sourceUrl: url('sourceUrl') ?? url('linkedinUrl'),
      sourceDate: str('sourceDate'),
      location: str('location'),
      division: str('division'),
      confidence,
      ...(email ? { email, emailSourceUrl } : {}),
    });
  }
  return out;
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
  'me.com', 'live.com', 'msn.com', 'proton.me', 'protonmail.com',
]);

/** Extract + validate a corporate email domain from a model answer. Pure. */
export function parseDomainAnswer(text: string): string | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/\b((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})\b/);
  if (!m) return null;
  const domain = m[1].replace(/^www\./, '');
  if (FREE_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}

const domainCache = new Map<string, string | null>();

/**
 * Discover a company's corporate email domain via Gemini + Google Search grounding,
 * so email inference works for net-new companies absent from our corpus and seed map.
 * Cached per process. Returns null when unavailable / not confidently found.
 */
export async function discoverCompanyDomain(company: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !company.trim()) return null;
  const cacheKey = company.trim().toLowerCase();
  if (domainCache.has(cacheKey)) return domainCache.get(cacheKey) ?? null;

  let result: string | null = null;
  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} } as unknown as never],
      generationConfig: { temperature: 0, maxOutputTokens: 256 },
    });
    const prompt = `What is the primary corporate email domain (the part after @ in employee email addresses) for the company "${company}"? Reply with ONLY the domain, like "acme.com". If you are not confident, reply "NONE".`;
    const res = await model.generateContent(prompt);
    result = parseDomainAnswer(res.response.text());
  } catch {
    result = null;
  }
  domainCache.set(cacheKey, result);
  return result;
}

/** The operator-first contact research prompt: explicit responsibility slots, in order, each source-backed. */
export function buildContactResearchPrompt(company: string, loc?: ResearchLocation): string {
  const place = [loc?.city, loc?.state].filter(Boolean).join(', ');
  const region = loc?.corridor && loc.corridor !== place ? ` (${loc.corridor} corridor)` : '';
  return [
    `Find the people at "${company}" who own physical freight execution, by RESPONSIBILITY, not seniority.`,
    `Fill these slots in order. Leave a slot empty when you cannot find evidence; never fill it with a broader title.`,
    ``,
    `1. "DIRECT_OPERATOR" (most important): who runs transportation / logistics / freight / fleet operations across the network.`,
    `   Titles like Transportation Operations Manager, Director of Transportation, Director of Logistics, VP Transportation,`,
    `   Logistics Operations, Private / Dedicated Fleet, Linehaul, Inbound or Outbound Transportation, Logistics Distribution &`,
    `   Transportation (LD&T), Network Logistics. Manager, Director or VP all qualify. Look for the US / North America remit`,
    `   first; at a multi-division company look both at the shared North America function and inside each operating unit.`,
    `2. "TRANSPORTATION_TECH": who owns transportation / logistics / fleet technology or transformation (TMS, control tower,`,
    `   visibility, yard technology, fleet transformation). A generic innovation, IT or digital title does NOT qualify.`,
    `3. "EXECUTIVE_SPONSOR": the supply chain executive over them (VP Supply Chain, Chief Supply Chain Officer, COO). One person.`,
    place ? `4. "SITE_OPERATOR": the site, plant, DC, yard or regional operations leaders for their facility near ${place}${region} (up to 3).` : `4. "SITE_OPERATOR": a site, plant, DC or yard leader. Optional; only if clearly useful.`,
    ``,
    `Do NOT return procurement, sourcing, transportation finance, compliance-only, safety-only, sustainability-only, HR,`,
    `communications, sales or marketing people.`,
    ``,
    `Return ONLY a JSON array (no prose), each item:`,
    `{"slot":"DIRECT_OPERATOR"|"TRANSPORTATION_TECH"|"EXECUTIVE_SPONSOR"|"SITE_OPERATOR","name":"exact current name","title":"exact current title","scope":"local"|"corporate","location":"their own city / state / remit if the source says it","division":"operating unit if the source names it","sourceUrl":"https://... the public page showing they hold this role now","sourceDate":"YYYY-MM or as shown","linkedinUrl":"https://...","confidence":"high"|"medium"|"low","reason":"why this exact role matters"}`,
    ``,
    `Rules:`,
    `- Real, CURRENTLY employed people only, each with a source URL (company leadership page, press release, conference bio,`,
    `  job post, public LinkedIn profile or snippet). No source URL: leave them out.`,
    `- At most 2 people per slot, best first. If unsure, return fewer, or an empty array. Never invent anyone.`,
    `- Never guess an email. Include "email" only with "emailSourceUrl", the public page where that address is published.`,
  ].join('\n');
}

/**
 * Keep only source-backed people in a relevant slot, ordered by slot (operator first) and, inside a slot, by the GAP
 * person prior (named transportation ownership, scope, US market, seniority); at most 2 per slot.
 */
export function sourceBackedBySlot(people: ResearchedContact[], opts: { siteCap?: number } = {}): ResearchedContact[] {
  const kept = people.filter((p) => p.sourceUrl && p.slot && p.slot !== 'OTHER');
  const ranked = rankWho(kept.map((p, i) => ({ key: String(i), name: p.name, title: p.title ?? null, location: p.location ?? null, reachable: false, person: p })));
  // Someone based outside North America never takes a place from someone in it (review N2): they go last in their slot.
  const ordered = [...ranked.filter((r) => r.read.region !== 'OTHER_REGION'), ...ranked.filter((r) => r.read.region === 'OTHER_REGION')].map((r) => r.candidate.person);
  const out: ResearchedContact[] = [];
  for (const slot of SLOT_ORDER) out.push(...ordered.filter((p) => p.slot === slot).slice(0, slot === 'SITE_OPERATOR' ? opts.siteCap ?? 2 : 2));
  return out;
}

/**
 * Research decision-makers at a company, optionally geography-aware (returns both
 * a local/regional contact near the facility and a corporate HQ contact). Returns
 * [] when GEMINI_API_KEY is unset or the call/parse fails (graceful).
 */
export async function researchDecisionMakers(company: string, loc?: ResearchLocation): Promise<ResearchedContact[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !company.trim()) return [];
  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // Google Search grounding — real-time web research with citations.
      tools: [{ googleSearch: {} } as unknown as never],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    });
    const result = await model.generateContent(buildContactResearchPrompt(company, loc));
    // Near a facility, /discovery wants the local leaders too: up to 3 site / regional operators.
    return sourceBackedBySlot(parseResearchedContacts(result.response.text()), { siteCap: loc?.city || loc?.state ? 3 : 2 });
  } catch {
    return [];
  }
}
