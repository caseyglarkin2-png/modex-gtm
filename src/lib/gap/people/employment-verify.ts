/**
 * VERIFY CURRENT ROLE (owner resolution, 2026-10-05): one bounded, source-backed public check of where a person
 * works now AND whether the stored role is still theirs. Cheap first: it runs only when Casey asks (or a gate finds a
 * conflict worth asking about), never on a page render, never on every contact. It uses the same grounded search the
 * contact research uses (Gemini with Google Search grounding); it spends no Apollo credit and creates no record by
 * itself. The caller records the answer as DERIVED evidence (employment-store.ts), where the URL's tier, not the
 * model's confidence, decides its weight.
 *
 * Five answers (the Walmart pattern made the fourth necessary: still at the account, the stored role now held by a
 * promoted colleague, the person's own new title unknown):
 *
 *   same_role        a source shows them at the account now, in the stored role (wording may differ)
 *   different_role   a source shows them still at the account in another role, promoted, or the stored role now
 *                    held by someone else; `title` is the new title, or null when the source does not establish it
 *   left             a source shows them at another employer now, or explicitly dates their departure
 *   conflict         current credible sources disagree
 *   unknown          no source-backed answer: nothing is asserted from a model's say-so
 *
 * An answer without a source URL is 'unknown', whatever the verdict.
 */
import { kindForUrl, tierForUrl, type EvidenceTier } from './employment';

export type RoleVerdict = 'same_role' | 'different_role' | 'left' | 'conflict' | 'unknown';

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
  verdict: RoleVerdict;
  /** Compatibility for callers that only ask about the company: same_role / different_role are current; conflict is unknown. */
  employmentVerdict: 'current' | 'left' | 'unknown';
  company: string | null;
  /** Their current title per the source; null when the source does not establish it (a promotion with no new title). */
  title: string | null;
  /** The title the source says they used to hold, when it names one. */
  priorTitle: string | null;
  sourceUrl: string | null;
  sourceDate: string | null;
  /** The model's own confidence, shown, never decisive. */
  confidence: 'high' | 'medium' | 'low';
  /** What the URL earns (employment.ts tierForUrl); 'weak' when there is no usable URL. */
  tier: EvidenceTier;
  summary: string | null;
}

export const employmentVerdictOf = (v: RoleVerdict): EmploymentVerification['employmentVerdict'] => (v === 'same_role' || v === 'different_role' ? 'current' : v === 'left' ? 'left' : 'unknown');

/** The prompt: where do they work now, and is the stored title still their role there. */
export function roleVerifyPrompt(q: EmploymentQuery): string {
  const stored = q.title ?? 'title unknown';
  return [
    `Where does "${q.name}" work right now, and is "${stored}" still their role there?`,
    `Our CRM says they are "${stored}" at "${q.company}"${q.location ? ` (${q.location})` : ''}.${q.linkedinUrl ? ` Their profile: ${q.linkedinUrl}.` : ''}`,
    ``,
    `Signals that COUNT: the person's own current public profile; the employer's leadership or team page; a current employer announcement; a current speaker bio; a current company post naming the role (a colleague's post saying who holds the role now, or congratulating this person on a promotion, counts). Prefer the newest source.`,
    `Signals that DO NOT count: CRM dates, email domains, stale aggregators or people directories, old conference bios, an old post.`,
    ``,
    `Return ONLY a JSON object (no prose):`,
    `{"verdict":"same_role"|"different_role"|"left"|"conflict"|"unknown","company":"the company they are at now, exactly as the source says","title":"their current title per the source, or null when the source does not establish the new title","priorTitle":"the title the source says they used to hold, else null","sourceUrl":"https://... the page that shows it","sourceDate":"YYYY-MM-DD or YYYY-MM as the page shows, else null","confidence":"high"|"medium"|"low","summary":"one sentence: what the source says"}`,
    ``,
    `Rules: "same_role" only if a source shows them at "${q.company}" (or one of its own units) now in the stored role (the same function and remit; wording may differ). "different_role" if a source shows them still at "${q.company}" but in another role, promoted, or the stored role now held by someone else; set title to null when the new title is not established. "left" only if a source shows them at another employer now or explicitly dates their departure. "conflict" when current credible sources disagree. Otherwise "unknown". Never invent a URL. If you cannot find a source, answer {"verdict":"unknown","company":null,"title":null,"priorTitle":null,"sourceUrl":null,"sourceDate":null,"confidence":"low","summary":"no source found"}.`,
  ].join('\n');
}

/** The older name; the same prompt. */
export const buildEmploymentPrompt = roleVerifyPrompt;

const VERDICTS: ReadonlySet<string> = new Set<RoleVerdict>(['same_role', 'different_role', 'left', 'conflict', 'unknown']);

/** Pure. Tolerant of fences and prose; anything unparseable or unsourced is unknown. */
export function parseEmploymentAnswer(text: string | null | undefined, q: Pick<EmploymentQuery, 'companyDomains'>): EmploymentVerification {
  const unknown = (summary: string | null): EmploymentVerification => ({ verdict: 'unknown', employmentVerdict: 'unknown', company: null, title: null, priorTitle: null, sourceUrl: null, sourceDate: null, confidence: 'low', tier: 'weak', summary });
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
  // The older prompt answered "current"; it means same_role.
  const verdictRaw = str('verdict') === 'current' ? 'same_role' : str('verdict');
  const confidence = raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low' ? raw.confidence : 'low';
  const summary = str('summary');
  // No source, no assertion.
  if (!sourceUrl || !verdictRaw || !VERDICTS.has(verdictRaw) || verdictRaw === 'unknown') return { ...unknown(summary ?? (sourceUrl ? 'no verdict' : 'no source given')), confidence };
  const verdict = verdictRaw as Exclude<RoleVerdict, 'unknown'>;
  const tier = tierForUrl(sourceUrl, q.companyDomains ?? []);
  return { verdict, employmentVerdict: employmentVerdictOf(verdict), company: str('company'), title: str('title'), priorTitle: str('priorTitle'), sourceUrl, sourceDate: str('sourceDate'), confidence, tier, summary };
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

/** Verify one person's current employment and role. Never throws; unknown when nothing source-backed came back. */
export async function verifyEmployment(q: EmploymentQuery, deps: VerifyDeps = {}): Promise<EmploymentVerification & { kind: ReturnType<typeof kindForUrl> | null }> {
  const search = deps.search ?? defaultGroundedSearch;
  let text: string | null = null;
  try {
    text = await search(roleVerifyPrompt(q));
  } catch {
    text = null;
  }
  const parsed = parseEmploymentAnswer(text, q);
  return { ...parsed, kind: parsed.sourceUrl ? kindForUrl(parsed.sourceUrl, q.companyDomains ?? []) : null };
}
