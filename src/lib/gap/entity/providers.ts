/**
 * GROUNDED COMPANY SCOUT PROVIDERS (Release L, 2026-09-29): one bounded interface, several already-configured
 * providers, the SAME typed Scout evidence contract whichever answers.
 *
 *   gemini       Gemini 2.5 Flash with Google Search grounding (GEMINI_API_KEY)
 *   openai_web   OpenAI Responses API with the web_search tool (OPENAI_API_KEY); returns url_citation annotations
 *   gateway_web  Vercel AI Gateway with its Perplexity search tool (AI_GATEWAY_API_KEY); citations are the pages it returned
 *
 * Rules:
 *   - A provider that cannot ground (no search tool, no citations) is never used: model memory is never evidence.
 *   - When a provider returns its citations, a claim whose URL is not among them is DROPPED (it is not grounded).
 *   - Quota / rate limits cool that provider down (in-process) and the chain tries the next one; a transient error
 *     retries once (a timeout does not); a cut-off or unparsable answer moves to the next provider.
 *   - One total deadline for the whole chain (inside the route's maxDuration); each call is aborted at its bound
 *     and the SDKs' own retries are off, so a timed-out request stops, and so does its cost.
 *   - A pass where every provider fails is infrastructure state (retryable), never company evidence.
 */

export type ProviderName = 'gemini' | 'openai_web' | 'gateway_web';
export interface ProviderAnswer {
  text: string;
  /** URLs the search actually cited. Empty (with no citedHosts) means the answer was not grounded: never used. */
  citations: string[];
  /** Sites the search cited when the provider gives only the site, not the page (Gemini): a claim must be on one. */
  citedHosts?: string[];
  /** Why an answer has no citations, when the provider's response says (recorded in the audit). */
  note?: string;
}
export interface ScoutProvider {
  name: ProviderName;
  available: () => boolean;
  ask: (prompt: string, signal: AbortSignal) => Promise<ProviderAnswer>;
}
export interface Attempt {
  provider: ProviderName;
  outcome: 'ok' | 'quota' | 'error' | 'unparsable' | 'no_citations' | 'cooling_down' | 'unavailable';
  detail?: string;
}

const cooling = new Map<ProviderName, number>();
export const _resetCooldowns = () => cooling.clear();

/** Classify a provider error: quota / rate limit (cool down and move on) versus transient (retry once). */
export function classifyProviderError(e: unknown): { kind: 'quota' | 'transient' | 'error'; coolMs: number; detail: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as { status?: number })?.status;
  if (status === 429 || /\b429\b|quota|rate.?limit|resource.?exhausted|too many requests/i.test(msg)) {
    // A per-day limit, or an account with no credits left, will not clear in a minute.
    const daily = /per.?day|daily|PerDay|no credits|insufficient_quota|billing/i.test(msg);
    const retry = /retry in (\d+(?:\.\d+)?)s/i.exec(msg);
    return { kind: 'quota', coolMs: daily ? 3_600_000 : retry ? Math.ceil(Number(retry[1]) * 1000) + 1000 : 60_000, detail: msg.slice(0, 160) };
  }
  if ((status && status >= 500) || /\b5\d\d\b|ECONNRESET|ETIMEDOUT|timeout|fetch failed|overloaded/i.test(msg)) return { kind: 'transient', coolMs: 0, detail: msg.slice(0, 160) };
  return { kind: 'error', coolMs: 0, detail: msg.slice(0, 160) };
}

class Timeout extends Error {}
/** Run one provider call under an abort signal and a bound; the timer never outlives the call. */
async function bounded<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(ctl.signal),
      new Promise<never>((_, no) => {
        timer = setTimeout(() => {
          ctl.abort();
          no(new Timeout(`timeout after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the chain. `parse` decides whether an answer is usable (the Scout JSON); an unusable answer moves on.
 * Returns the first usable answer with its provider, or every attempt when none worked.
 */
export async function askGrounded<T>(
  prompt: string,
  parse: (a: ProviderAnswer) => T | null,
  providers: readonly ScoutProvider[] = defaultProviders(),
  opts: { now?: () => number; sleep?: (ms: number) => Promise<void>; timeoutMs?: number; budgetMs?: number } = {},
): Promise<{ ok: true; value: T; provider: ProviderName; attempts: Attempt[] } | { ok: false; attempts: Attempt[] }> {
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const attempts: Attempt[] = [];
  // The whole chain fits inside the route's 120s maxDuration with room to write the audit.
  const deadline = Date.now() + (opts.budgetMs ?? 90_000);
  for (const p of providers) {
    if (deadline - Date.now() < 5_000) {
      attempts.push({ provider: p.name, outcome: 'error', detail: 'no time left in this pass' });
      continue;
    }
    if (!p.available()) {
      attempts.push({ provider: p.name, outcome: 'unavailable' });
      continue;
    }
    const until = cooling.get(p.name) ?? 0;
    if (until > now()) {
      attempts.push({ provider: p.name, outcome: 'cooling_down', detail: `until ${new Date(until).toISOString()}` });
      continue;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const a = await bounded((signal) => p.ask(prompt, signal), Math.min(opts.timeoutMs ?? 45_000, deadline - Date.now()));
        if (!a.citations.length && !a.citedHosts?.length) {
          attempts.push({ provider: p.name, outcome: 'no_citations', detail: `the answer cited no sources: not grounded, not used${a.note ? ` (${a.note})` : ''}` });
          break;
        }
        const v = parse(a);
        if (v === null) {
          attempts.push({ provider: p.name, outcome: 'unparsable' });
          break;
        }
        attempts.push({ provider: p.name, outcome: 'ok' });
        return { ok: true, value: v, provider: p.name, attempts };
      } catch (e) {
        const c = classifyProviderError(e);
        if (c.kind === 'quota') {
          cooling.set(p.name, now() + c.coolMs);
          attempts.push({ provider: p.name, outcome: 'quota', detail: c.detail });
          break;
        }
        if (c.kind === 'transient' && attempt === 0 && !(e instanceof Timeout) && deadline - Date.now() > 15_000) {
          await sleep(2_000);
          continue;
        }
        attempts.push({ provider: p.name, outcome: 'error', detail: c.detail });
        break;
      }
    }
  }
  return { ok: false, attempts };
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};
/**
 * Keep only claims the search itself cited: the same page (host and path, ignoring query and fragment), or, when
 * the provider names only the sites it read, a page on one of those sites (or a subdomain of one).
 */
export function groundedOnly<C extends { claim: string; url: string }>(claims: readonly C[], citations: readonly string[], citedHosts: readonly string[] = []): { kept: C[]; dropped: C[] } {
  const key = (u: string) => {
    try {
      const x = new URL(u);
      return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/$/, '')}`.toLowerCase();
    } catch {
      return u.toLowerCase();
    }
  };
  const cited = new Set(citations.map(key));
  const hosts = citedHosts.map((h) => h.replace(/^www\./, '').toLowerCase()).filter(Boolean);
  const onCitedSite = (u: string) => {
    const h = hostOf(u);
    return !!h && hosts.some((x) => h === x || h.endsWith(`.${x}`));
  };
  const kept: C[] = [];
  const dropped: C[] = [];
  for (const c of claims) (cited.has(key(c.url)) || onCitedSite(c.url) ? kept : dropped).push(c);
  return { kept, dropped };
}

/** HTTP status for a refused Scout: providers down is 503 (retryable infrastructure), one running is 409, caps 429. */
export const scoutRefusalStatus = (refused: string) => (refused === 'web_failed' ? 503 : refused === 'in_flight' ? 409 : 429);

// ---------------------------------------------------------------- the configured providers

/**
 * The paid yardflow-llm Gemini key (Flow-State concierge) is a "new user" to Google: pinned ids such as
 * gemini-2.5-flash answer 404 "no longer available to new users" for it, while an older key still serves them.
 * Try the configured model, then the -latest alias, moving on ONLY for a model-gone 404 (quota and other errors
 * go to the chain as they are).
 */
export const GEMINI_MODELS = () => [...new Set([process.env.SCOUT_GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-flash-latest'])];
export const modelGone = (e: unknown) => /\b404\b|not found|no longer available/i.test(e instanceof Error ? e.message : String(e));
export async function withModelFallback<T>(models: readonly string[], run: (model: string) => Promise<T>): Promise<T> {
  let last: unknown;
  for (const m of models) {
    try {
      return await run(m);
    } catch (e) {
      if (!modelGone(e)) throw e;
      last = e;
    }
  }
  throw last;
}

type GeminiCall = (prompt: string, search: boolean) => Promise<{ text: string; chunks: Array<{ uri?: string; title?: string }>; supports?: Array<{ text: string; chunks: number[] }> }>;

/**
 * Gemini in two steps. Newer Gemini models (the paid yardflow-llm key resolves gemini-flash-latest to 3.x) do not
 * search when the prompt asks for JSON output, so an answer would be model memory. Step A researches the request
 * in plain language WITH Google Search; step B formats those findings into the requested answer WITHOUT tools,
 * told to use only them. Citations are step A's grounding chunks only, so every claim must still match a page or
 * a site the search returned. No chunks in step A: nothing was searched, and the answer is not used.
 */
/** A Google grounding redirect resolved to the page it points at (one bounded HEAD, no body read); null if not. */
async function resolveGroundingLink(uri: string): Promise<string | null> {
  if (!/^https:\/\/vertexaisearch\.cloud\.google\.com\//.test(uri)) return uri;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4_000);
  try {
    const r = await fetch(uri, { method: 'HEAD', redirect: 'manual', signal: ctl.signal });
    const loc = r.headers.get('location');
    return loc && /^https?:\/\//.test(loc) ? loc : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function geminiTwoStep(prompt: string, call: GeminiCall, resolve: (uri: string) => Promise<string | null> = resolveGroundingLink): Promise<ProviderAnswer> {
  // The request without its output-format lines: any "return JSON" wording makes newer Gemini skip the search.
  const request = prompt
    .split('\n')
    .filter((l) => !/\bjson\b|return only|^\s*[[{"]|"url"|copied verbatim|if you cannot find/i.test(l))
    .join('\n')
    .trim();
  const research = await call(
    `Research the request below with Google Search. Write your findings as plain sentences, each with the web page it came from. Leave out anything the search did not show.\n\nREQUEST:\n${request}`,
    true,
  );
  const chunks = research.chunks;
  if (!chunks.length) return { text: research.text, citations: [], citedHosts: [], note: 'Gemini did not search' };
  // The pages the search actually read: each grounding redirect resolved to its page (falls back to the link).
  const raw = chunks.map((c) => c.uri ?? '').filter((u) => /^https?:\/\//.test(u));
  const pages = await Promise.all(raw.map((u) => resolve(u).catch(() => null)));
  const links = raw.map((u, i) => pages[i] ?? u);
  const citations = [...new Set([...links, ...raw])];
  const citedHosts = chunks.map((c) => (c.title ?? '').trim().toLowerCase()).filter((t) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(t));
  const sources = links.map((u, i) => `- ${chunks[i]?.title ?? 'source'}: ${u}`).join('\n');
  // Each statement the search supports, with the page(s) it came from (Gemini's grounding supports), so the answer
  // can cite the exact page. Without supports, the plain findings.
  const supported = (research.supports ?? [])
    .map((sp) => ({ text: sp.text.trim(), urls: [...new Set(sp.chunks.map((i) => links[i]).filter(Boolean))] }))
    .filter((sp) => sp.text && sp.urls.length);
  const findings = supported.length ? supported.map((sp) => `- ${sp.text} [source: ${sp.urls.join(' ; ')}]`).join('\n') : research.text;
  const formatted = await call(
    `${prompt}\n\nAnswer using ONLY the research findings below. Every url you give must be EXACTLY one of the source links below (copy it as written); leave out anything the findings do not support.\n\nFINDINGS (each with its source page):\n${findings}\n\nSOURCE LINKS THE SEARCH RETURNED:\n${sources}`,
    false,
  );
  return { text: formatted.text, citations, citedHosts };
}

const gemini: ScoutProvider = {
  name: 'gemini',
  available: () => !!process.env.GEMINI_API_KEY,
  ask: async (prompt, signal) => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const call: GeminiCall = async (text, search) => {
      const res = await withModelFallback(GEMINI_MODELS(), (name) =>
        client.getGenerativeModel({ model: name, ...(search ? { tools: [{ googleSearch: {} } as unknown as never] } : {}), generationConfig: { temperature: 0, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 512 } } as never }).generateContent(text, { signal }),
      );
      const meta = (res.response.candidates?.[0] as { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>; groundingSupports?: Array<{ segment?: { text?: string }; groundingChunkIndices?: number[] }> } } | undefined)?.groundingMetadata;
      return {
        text: res.response.text(),
        chunks: (meta?.groundingChunks ?? []).map((c) => ({ uri: c.web?.uri, title: c.web?.title })),
        supports: (meta?.groundingSupports ?? []).map((sp) => ({ text: sp.segment?.text ?? '', chunks: sp.groundingChunkIndices ?? [] })),
      };
    };
    return geminiTwoStep(prompt, call);
  },
};

const openaiWeb: ScoutProvider = {
  name: 'openai_web',
  available: () => !!process.env.OPENAI_API_KEY,
  ask: async (prompt, signal) => {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
    const res = await client.responses.create({ model: process.env.SCOUT_OPENAI_MODEL || 'gpt-5-mini', tools: [{ type: 'web_search' }], input: prompt }, { signal });
    const citations: string[] = [];
    for (const item of res.output ?? []) {
      if (item.type !== 'message') continue;
      for (const part of item.content ?? []) {
        if (part.type !== 'output_text') continue;
        for (const a of part.annotations ?? []) if (a.type === 'url_citation' && a.url) citations.push(a.url);
      }
    }
    return { text: res.output_text ?? '', citations };
  },
};

const gatewayWeb: ScoutProvider = {
  name: 'gateway_web',
  available: () => !!process.env.AI_GATEWAY_API_KEY,
  ask: async (prompt, signal) => {
    // The AI Gateway's Perplexity search tool (billed on the gateway, not a model key). The URLs its search
    // returned are the citations; the chat-completions path carries no sources, so it is not used.
    const { gateway, generateText, stepCountIs } = await import('ai');
    const r = await generateText({
      model: process.env.SCOUT_GATEWAY_MODEL || 'openai/gpt-5.4-nano',
      prompt,
      tools: { perplexity_search: gateway.tools.perplexitySearch({ maxResults: 10, searchLanguageFilter: ['en'] }) },
      stopWhen: stepCountIs(4),
      maxRetries: 0,
      abortSignal: signal,
    });
    const searched = r.steps.flatMap((st) => st.toolResults ?? []).flatMap((t) => urlsIn((t as { output?: unknown }).output));
    const sourced = (r.sources ?? []).flatMap((x) => ('url' in x && typeof x.url === 'string' ? [x.url] : []));
    const citations = [...new Set([...searched, ...sourced])];
    return { text: r.text, citations, note: citations.length ? undefined : `the search returned no pages (${r.steps.length} steps)` };
  },
};

/** Every http(s) URL in a provider's metadata (sources, search results), however it nests them. */
export function urlsIn(v: unknown, depth = 0): string[] {
  if (depth > 6 || v == null) return [];
  if (typeof v === 'string') return /^https?:\/\/\S+$/.test(v) ? [v] : [];
  if (Array.isArray(v)) return v.flatMap((x) => urlsIn(x, depth + 1));
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).flatMap((x) => urlsIn(x, depth + 1));
  return [];
}

export function defaultProviders(): ScoutProvider[] {
  return [gemini, openaiWeb, gatewayWeb];
}
