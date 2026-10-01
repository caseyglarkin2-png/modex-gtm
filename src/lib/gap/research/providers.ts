/**
 * GAP evidence research providers (last mile, 2026-09-25). Each returns
 * CANDIDATES only: { url, title, publishedAt, excerpt }. research/run.ts
 * accepts a candidate only after re-fetching its URL and finding the excerpt
 * verbatim (facts.ts excerptFoundIn), whatever provider proposed it.
 *
 *   edgar   SEC EDGAR full-text search over the account's own filings (the
 *           last 12 months of 10-K, 10-Q, 8-K). Primary source. Excerpts are
 *           extracted from the fetched filing itself.
 *   web     the existing Gemini + Google Search grounding capability
 *           (src/lib/discovery/research.ts uses the same model and tool).
 *           Its excerpts are PROPOSALS; unverifiable ones are dropped.
 */
import { extractFactSentences, htmlToText } from './facts';
import type { PageResult } from '../signals/research';
import { askGrounded, defaultProviders, type ScoutProvider } from '../entity/providers';

export interface Candidate {
  /** `manual`: a public URL + sentence Casey typed, verified by the same contract (research/run.ts verifyCandidate). */
  /** `signal`: a sentence from the page of a signal Casey shared or GAP discovered (Signal Intelligence), verified by the same contract. */
  provider: 'edgar' | 'web' | 'manual' | 'signal';
  url: string;
  title: string;
  publishedAt: Date | null;
  excerpt: string;
  sourceType: 'public_primary' | 'public_secondary';
}

export type FetchText = (url: string) => Promise<string>;

const SEC_UA = 'YardFlow GAP research casey@yardflow.ai';

export const defaultFetchText: FetchText = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': url.includes('sec.gov') ? SEC_UA : 'Mozilla/5.0 (compatible; YardFlowResearch/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return htmlToText(await res.text());
};

const CORPORATE_SUFFIX = /\b(the|co|inc|corp|corporation|company|companies|ltd|llc|plc|holdings|group|incorporated)\b/g;
export function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(CORPORATE_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
}

/** The SEC CIK for an account, only on an exact normalized name match (never a fuzzy guess). */
export async function resolveCik(accountName: string, fetchJson: (url: string) => Promise<unknown> = defaultFetchJson): Promise<{ cik: string; title: string } | null> {
  const data = (await fetchJson('https://www.sec.gov/files/company_tickers.json')) as Record<string, { cik_str: number; title: string }>;
  const target = normalizeCompany(accountName);
  const matches = Object.values(data).filter((c) => normalizeCompany(c.title) === target);
  const unique = [...new Map(matches.map((m) => [m.cik_str, m])).values()];
  if (unique.length !== 1) return null;
  return { cik: String(unique[0].cik_str).padStart(10, '0'), title: unique[0].title };
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { 'User-Agent': SEC_UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.json();
}

export const EDGAR_QUERIES = ['"distribution center"', '"fulfillment center"', '"warehouse"', '"automation"', '"supply chain network"', '"plan of merger"', '"definitive agreement"'];

export async function edgarCandidates(
  accountName: string,
  now: Date,
  deps: { fetchJson?: (url: string) => Promise<unknown>; fetchText?: FetchText } = {},
): Promise<{ candidates: Candidate[]; note: string; pageResults?: PageResult[] }> {
  const fetchJson = deps.fetchJson ?? defaultFetchJson;
  const fetchText = deps.fetchText ?? defaultFetchText;
  const company = await resolveCik(accountName, fetchJson);
  if (!company) return { candidates: [], note: 'no exact SEC registrant match (private company or ambiguous name)' };
  const start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const end = now.toISOString().slice(0, 10);
  const docs = new Map<string, { url: string; form: string; date: string }>();
  for (const q of EDGAR_QUERIES) {
    try {
      const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(q)}&ciks=${company.cik}&dateRange=custom&startdt=${start}&enddt=${end}`;
      const body = (await fetchJson(url)) as { hits?: { hits?: Array<{ _id: string; _source: { file_date: string; form: string } }> } };
      for (const h of body.hits?.hits ?? []) {
        const [acc, file] = h._id.split(':');
        if (!/^(10-K|10-Q|8-K)/.test(h._source.form)) continue;
        const docUrl = `https://www.sec.gov/Archives/edgar/data/${Number(company.cik)}/${acc.replace(/-/g, '')}/${file}`;
        if (!docs.has(docUrl)) docs.set(docUrl, { url: docUrl, form: h._source.form, date: h._source.file_date });
      }
    } catch {
      // one query failing is not the end of the search
    }
  }
  const sorted = [...docs.values()].sort((a, b) => b.date.localeCompare(a.date));
  const newestFirst = sorted.slice(0, 5);
  const candidates: Candidate[] = [];
  // Research aperture: every filing found is a source (read with or without a fact sentence, unreadable, not read).
  const title = (d: { form: string; date: string }) => `${company.title} ${d.form} (filed ${d.date})`;
  const at = (d: { date: string }) => new Date(`${d.date}T00:00:00Z`);
  const pageResults: PageResult[] = sorted.slice(5).map((d) => ({ url: d.url, title: title(d), publishedAt: at(d), outcome: 'not_read' as const, sentences: 0 }));
  for (const d of newestFirst) {
    try {
      const text = await fetchText(d.url);
      const sentences = extractFactSentences(text, 4);
      pageResults.push({ url: d.url, title: title(d), publishedAt: at(d), outcome: 'read', sentences: sentences.length });
      for (const excerpt of sentences) {
        candidates.push({ provider: 'edgar', url: d.url, title: title(d), publishedAt: at(d), excerpt, sourceType: 'public_primary' });
      }
    } catch (e) {
      pageResults.push({ url: d.url, title: title(d), publishedAt: at(d), outcome: 'unreadable', sentences: 0, error: (e instanceof Error ? e.message : String(e)).slice(0, 120) });
    }
  }
  return { candidates, note: `${company.title}: ${docs.size} filing hits, ${newestFirst.length} read`, pageResults };
}

const DATELINE_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * A press release's own dateline ("June 8, 2026 PepsiCo and Gatik announced ..."), for a page with no article
 * meta date. Accepted only when the date is immediately followed by the account's name (a sidebar or footer
 * date is not), and never in the future.
 */
export function datelineDate(text: string, accountName: string, now: Date = new Date()): Date | null {
  const key = normalizeCompany(accountName);
  if (!key) return null;
  const re = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/g;
  for (const m of text.slice(0, 6000).matchAll(re)) {
    const after = ` ${text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 60).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
    // the account's name immediately after the date, allowing only a wire tag ("/PRNewswire/ --")
    if (!after.replace(/^ (?:prnewswire|businesswire|business wire|globenewswire|globe newswire|newswire) /, ' ').startsWith(` ${key} `)) continue;
    const d = new Date(Date.UTC(Number(m[3]), DATELINE_MONTHS.indexOf(m[1].toLowerCase()), Number(m[2])));
    if (Number.isNaN(d.getTime()) || d.getTime() > now.getTime() + 86_400_000) continue;
    return d;
  }
  return null;
}

/** Is this URL on the account's own domain ("pepsico.com" for PepsiCo, "generalmills.com" for General Mills)? */
export function hostBelongsToAccount(url: string, accountName: string): boolean {
  const key = normalizeCompany(accountName).replace(/ /g, '');
  if (key.length < 4) return false;
  try {
    const labels = new URL(url).hostname.toLowerCase().replace(/^www\./, '').split('.');
    return labels.slice(0, -1).some((l) => l.replace(/-/g, '') === key);
  } catch {
    return false;
  }
}

/** Parse the model's JSON array of candidate facts; anything malformed is dropped. */
export function parseWebCandidates(text: string): Array<{ url: string; title: string; date: string | null; excerpt: string }> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(body.slice(start, end + 1)) as unknown[];
    return arr
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({ url: String(x.url ?? ''), title: String(x.title ?? ''), date: typeof x.date === 'string' ? x.date : null, excerpt: String(x.excerpt ?? '') }))
      .filter((x) => /^https?:\/\//.test(x.url) && x.excerpt.length >= 40);
  } catch {
    return [];
  }
}

/** The model's answer holds a JSON array (possibly empty): an answer. No array at all: not an answer. */
const hasJsonArray = (text: string) => {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start < 0 || end <= start) return false;
  try {
    return Array.isArray(JSON.parse(body.slice(start, end + 1)));
  } catch {
    return false;
  }
};

/**
 * Web proposals through the same grounded provider chain as Scout (entity/providers.ts): Gemini, then the
 * configured fallbacks. Every proposal is still verified at its own page before it becomes a fact. When no
 * provider can run (quota, no key, no grounding, a cut-off answer) this THROWS: an outage is infrastructure
 * state, never "nothing found".
 */
export async function webCandidates(accountName: string, focus: string, deps: { providers?: ScoutProvider[] } = {}): Promise<{ candidates: Candidate[]; note: string; sources?: string[] }> {
  const prompt = `Find up to 5 PUBLIC, dated facts from the last 12 months about ${accountName}'s physical operations: distribution or fulfillment centers, warehouses, plants, yards, docks or transportation network (openings, closures, consolidations, expansions, automation, acquisitions, relocations). ${focus}
Sources, best first: ${accountName}'s own newsroom, investor or official operations page; an SEC filing; a government, economic-development or permit release; a credible trade or business publication; a vendor case study that names ${accountName}. When a story reports a fact, cite ${accountName}'s own announcement of it if one exists. Never cite a search-result redirect, an aggregator or syndicated copy, a snippet-only page or a paywalled page.
Return ONLY a JSON array: [{"url": "...", "title": "...", "date": "YYYY-MM-DD", "excerpt": "one sentence copied VERBATIM from that page"}].
Every excerpt must be copied exactly from the page at that url. If you cannot find such facts, return [].`;
  let cited: string[] = [];
  const r = await askGrounded(prompt, (a) => {
    const parsed = hasJsonArray(a.text) ? parseWebCandidates(a.text) : null;
    if (parsed) cited = a.citations;
    return parsed;
  }, deps.providers ?? defaultProviders());
  if (!r.ok) throw new Error(`no grounded web search (${r.attempts.map((x) => `${x.provider} ${x.outcome.replace(/_/g, ' ')}`).join('; ') || 'no provider configured'})`);
  const parsed = r.value;
  return {
    candidates: parsed.map((p) => ({
      provider: 'web' as const,
      url: p.url,
      title: p.title || p.url,
      publishedAt: p.date && !Number.isNaN(Date.parse(p.date)) ? new Date(p.date) : null,
      excerpt: p.excerpt,
      sourceType: 'public_secondary' as const,
    })),
    note: `${parsed.length} web proposals via ${r.provider}`,
    // The pages the search read (grounding redirects are resolved upstream; a raw redirect is never a source page).
    sources: [...new Set(cited.filter((u) => /^https?:\/\//.test(u) && !/vertexaisearch\.cloud\.google\.com/.test(u)))],
  };
}
