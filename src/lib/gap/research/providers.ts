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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractFactSentences, htmlToText } from './facts';

export interface Candidate {
  provider: 'edgar' | 'web';
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
    headers: { 'User-Agent': url.includes('sec.gov') ? SEC_UA : 'Mozilla/5.0 (compatible; YardFlowResearch/1.0)' },
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
): Promise<{ candidates: Candidate[]; note: string }> {
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
  const newestFirst = [...docs.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const candidates: Candidate[] = [];
  for (const d of newestFirst) {
    try {
      const text = await fetchText(d.url);
      for (const excerpt of extractFactSentences(text, 4)) {
        candidates.push({ provider: 'edgar', url: d.url, title: `${company.title} ${d.form} (filed ${d.date})`, publishedAt: new Date(`${d.date}T00:00:00Z`), excerpt, sourceType: 'public_primary' });
      }
    } catch {
      // skip an unreadable filing
    }
  }
  return { candidates, note: `${company.title}: ${docs.size} filing hits, ${newestFirst.length} read` };
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

export async function webCandidates(accountName: string, focus: string): Promise<{ candidates: Candidate[]; note: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { candidates: [], note: 'web search not configured' };
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} } as unknown as never] });
  const prompt = `Find up to 5 PUBLIC, dated facts from the last 12 months about ${accountName}'s physical operations: distribution or fulfillment centers, warehouses, plants, yards, docks or transportation network (openings, closures, consolidations, expansions, automation, acquisitions, relocations). ${focus}
Return ONLY a JSON array: [{"url": "...", "title": "...", "date": "YYYY-MM-DD", "excerpt": "one sentence copied VERBATIM from that page"}].
Every excerpt must be copied exactly from the page at that url. If you cannot find such facts, return [].`;
  const result = await model.generateContent(prompt);
  const parsed = parseWebCandidates(result.response.text());
  return {
    candidates: parsed.map((p) => ({
      provider: 'web' as const,
      url: p.url,
      title: p.title || p.url,
      publishedAt: p.date && !Number.isNaN(Date.parse(p.date)) ? new Date(p.date) : null,
      excerpt: p.excerpt,
      sourceType: 'public_secondary' as const,
    })),
    note: `${parsed.length} web proposals`,
  };
}
