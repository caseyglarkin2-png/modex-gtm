/**
 * GROUNDED COMPANY SCOUT PROVIDERS (Release L, 2026-09-29): one bounded interface, several already-configured
 * providers, the SAME typed Scout evidence contract whichever answers.
 *
 *   gemini       Gemini 2.5 Flash with Google Search grounding (GEMINI_API_KEY)
 *   openai_web   OpenAI Responses API with the web_search tool (OPENAI_API_KEY); returns url_citation annotations
 *   gateway_web  Vercel AI Gateway, a search model (AI_GATEWAY_API_KEY); used only when it returns citations
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

const gemini: ScoutProvider = {
  name: 'gemini',
  available: () => !!process.env.GEMINI_API_KEY,
  ask: async (prompt, signal) => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} } as unknown as never], generationConfig: { temperature: 0, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 512 } } as never });
    const res = await model.generateContent(prompt, { signal });
    // Search is a tool Gemini may skip: only an answer with grounding chunks searched. A claim must cite one of
    // those chunks (its link is a Google grounding redirect to the page read) or a page on a site it read (the
    // chunk title is that site's domain).
    const meta = (res.response.candidates?.[0] as { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } } | undefined)?.groundingMetadata;
    const chunks = meta?.groundingChunks ?? [];
    const citations = chunks.map((c) => c.web?.uri ?? '').filter((u) => /^https?:\/\//.test(u));
    const citedHosts = chunks.map((c) => (c.web?.title ?? '').trim().toLowerCase()).filter((t) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(t));
    return { text: res.response.text(), citations, citedHosts, note: chunks.length ? undefined : 'Gemini did not search' };
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
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1', maxRetries: 0 });
    const res = (await client.chat.completions.create({ model: process.env.SCOUT_GATEWAY_MODEL || 'perplexity/sonar', messages: [{ role: 'user', content: prompt }] }, { signal })) as unknown as {
      choices: Array<{ message: { content: string | null; annotations?: Array<{ type: string; url_citation?: { url: string } }> } }>;
      citations?: string[];
    };
    const msg = res.choices?.[0]?.message;
    const citations = [...(res.citations ?? []), ...((msg?.annotations ?? []).filter((a) => a.type === 'url_citation' && a.url_citation?.url).map((a) => a.url_citation!.url))];
    // No citations back from the gateway: not grounded (askGrounded refuses it). Say which fields it did return.
    return { text: msg?.content ?? '', citations, note: citations.length ? undefined : `response fields: ${Object.keys(res ?? {}).join(',')}; message fields: ${Object.keys(msg ?? {}).join(',')}` };
  },
};

export function defaultProviders(): ScoutProvider[] {
  return [gemini, openaiWeb, gatewayWeb];
}
