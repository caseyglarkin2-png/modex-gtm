/**
 * Web-grounded contact research — proposes decision-maker NAMES at a company via
 * Gemini + Google Search grounding, so the worklist can suggest who to reach
 * without manual LinkedIn hunting. Results are PROPOSALS to verify, not facts:
 * the UI flags them, links LinkedIn for a one-click check, and the inferred email
 * + editable composer are the safety net before anything sends.
 *
 * Only imported from the `'use server'` discovery actions (server-side).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ResearchedContact {
  name: string;
  firstName: string;
  lastName: string;
  title?: string;
  linkedinUrl?: string;
  reason?: string;
  /** 'local' = regional/site leader near the facility; 'corporate' = HQ decision-maker. */
  scope: 'local' | 'corporate';
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
    out.push({
      name,
      firstName,
      lastName,
      title: typeof rec.title === 'string' ? rec.title.trim() || undefined : undefined,
      linkedinUrl: typeof rec.linkedinUrl === 'string' ? rec.linkedinUrl.trim() || undefined : undefined,
      reason: typeof rec.reason === 'string' ? rec.reason.trim() || undefined : undefined,
      scope,
    });
  }
  return out;
}

function buildPrompt(company: string, loc?: ResearchLocation): string {
  const place = [loc?.city, loc?.state].filter(Boolean).join(', ');
  const region = loc?.corridor && loc.corridor !== place ? ` (${loc.corridor} corridor)` : '';
  const hasGeo = Boolean(place);
  return [
    `Find current decision-makers at "${company}" who would own or influence`,
    `YARD / DOCK / TRAILER / gate / logistics / supply chain / transportation / distribution / fleet / operations decisions.`,
    ``,
    hasGeo
      ? `We are targeting their facility near ${place}${region}. Return TWO kinds of people:`
      : `Return:`,
    hasGeo
      ? `- "local": regional or site leaders responsible for the ${place} area — e.g. Regional VP/Director of Operations/Logistics/Transportation, Distribution Center / site / yard manager covering that region.`
      : `- "local": regional operations/logistics leaders.`,
    `- "corporate": enterprise HQ decision-makers — VP/Director of Supply Chain, Transportation, Distribution, Logistics, or Operations.`,
    ``,
    `Return ONLY a JSON array (no prose), each item:`,
    `{"name":"...","title":"...","scope":"local"|"corporate","linkedinUrl":"https://...","reason":"short phrase why relevant"}`,
    ``,
    `Rules:`,
    hasGeo ? `- Aim for 2-3 "local" and 2-3 "corporate", best first within each.` : `- 5 to 6 people, most relevant first.`,
    `- Real, currently-employed people you can find evidence for; include a LinkedIn URL when available.`,
    `- Prefer Director / VP / Sr Manager level.`,
    `- If unsure, return fewer rather than inventing anyone.`,
  ].join('\n');
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
    const result = await model.generateContent(buildPrompt(company, loc));
    return parseResearchedContacts(result.response.text()).slice(0, 8);
  } catch {
    return [];
  }
}
