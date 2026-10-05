/**
 * VERIFY CURRENT ROLE (owner resolution, 2026-10-05): one bounded, source-backed public check of where a person
 * works now. Cheap first: it runs only when Casey asks (or a gate finds a conflict worth asking about), never on a
 * page render, never on every contact. It uses the same grounded search the contact research uses (Gemini with Google
 * Search grounding); it spends no Apollo credit and creates no record by itself. The caller records the answer as
 * DERIVED evidence (employment-store.ts), where the URL's tier, not the model's confidence, decides its weight.
 *
 * An answer without a source URL is 'unknown': nothing is asserted from a model's say-so.
 */
import { kindForUrl, tierForUrl, type EvidenceTier } from './employment';

export interface EmploymentQuery {
  name: string;
  /** The title GAP holds for them (what the CRM says). */
  title: string | null;
  /** The account GAP holds them at. */
  company: string;
  linkedinUrl?: string | null;
  location?: string | null;
  /** The account's own domains, so an employer page reads strong. */
  companyDomains?: readonly string[];
}

export interface EmploymentVerification {
  verdict: 'current' | 'left' | 'unknown';
  company: string | null;
  title: string | null;
  sourceUrl: string | null;
  sourceDate: string | null;
  /** The model's own confidence, shown, never decisive. */
  confidence: 'high' | 'medium' | 'low';
  /** What the URL earns (employment.ts tierForUrl); 'weak' when there is no usable URL. */
  tier: EvidenceTier;
  summary: string | null;
}

export function buildEmploymentPrompt(q: EmploymentQuery): string {
  return [
    `Where does "${q.name}" work right now?`,
    `Our CRM says they are "${q.title ?? 'title unknown'}" at "${q.company}"${q.location ? ` (${q.location})` : ''}.${q.linkedinUrl ? ` Their profile: ${q.linkedinUrl}.` : ''}`,
    `Check their own current public professional profile, the employer's leadership or bio page, a current announcement or a recent event bio. Prefer the newest source. A people directory or aggregator is weaker; a company email domain or an old post proves nothing.`,
    ``,
    `Return ONLY a JSON object (no prose):`,
    `{"verdict":"current"|"left"|"unknown","company":"the company they are at now, exactly as the source says","title":"their current title per the source","sourceUrl":"https://... the page that shows it","sourceDate":"YYYY-MM-DD or YYYY-MM as the page shows, else null","confidence":"high"|"medium"|"low","summary":"one sentence: what the source says"}`,
    ``,
    `Rules: "current" only if a source shows them at "${q.company}" (or one of its own units) now; "left" only if a source shows them at another employer now or explicitly dates their departure; otherwise "unknown". Never invent a URL. If you cannot find a source, answer {"verdict":"unknown","company":null,"title":null,"sourceUrl":null,"sourceDate":null,"confidence":"low","summary":"no source found"}.`,
  ].join('\n');
}

/** Pure. Tolerant of fences and prose; anything unparseable or unsourced is unknown. */
export function parseEmploymentAnswer(text: string | null | undefined, q: Pick<EmploymentQuery, 'companyDomains'>): EmploymentVerification {
  const unknown = (summary: string | null): EmploymentVerification => ({ verdict: 'unknown', company: null, title: null, sourceUrl: null, sourceDate: null, confidence: 'low', tier: 'weak', summary });
  if (!text) return unknown('no answer');
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return unknown('no answer');
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return unknown('unparseable answer');
  }
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string).trim() || null : null);
  const url = str('sourceUrl');
  const sourceUrl = url && /^https?:\/\/\S+\.\S+/i.test(url) ? url : null;
  const verdictRaw = str('verdict');
  const confidence = raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low' ? raw.confidence : 'low';
  const summary = str('summary');
  // No source, no assertion.
  if (!sourceUrl || (verdictRaw !== 'current' && verdictRaw !== 'left')) return { ...unknown(summary ?? (sourceUrl ? 'no verdict' : 'no source given')), confidence };
  const tier = tierForUrl(sourceUrl, q.companyDomains ?? []);
  return { verdict: verdictRaw, company: str('company'), title: str('title'), sourceUrl, sourceDate: str('sourceDate'), confidence, tier, summary };
}

export interface VerifyDeps {
  /** The grounded search: a prompt in, the model's text out (null when no provider is configured). */
  search?: (prompt: string) => Promise<string | null>;
}

/** The default grounded search (Gemini + Google Search), or null without a key. One call, no retries, no Apollo. */
export async function defaultGroundedSearch(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} } as unknown as never],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    });
    const res = await model.generateContent(prompt);
    return res.response.text();
  } catch {
    return null;
  }
}

/** Verify one person's current employment. Never throws; unknown when nothing source-backed came back. */
export async function verifyEmployment(q: EmploymentQuery, deps: VerifyDeps = {}): Promise<EmploymentVerification & { kind: ReturnType<typeof kindForUrl> | null }> {
  const search = deps.search ?? defaultGroundedSearch;
  let text: string | null = null;
  try {
    text = await search(buildEmploymentPrompt(q));
  } catch {
    text = null;
  }
  const parsed = parseEmploymentAnswer(text, q);
  return { ...parsed, kind: parsed.sourceUrl ? kindForUrl(parsed.sourceUrl, q.companyDomains ?? []) : null };
}
