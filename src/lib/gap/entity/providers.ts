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
 *     retries once; a cut-off or unparsable answer moves to the next provider.
 *   - A pass where every provider fails is infrastructure state (retryable), never company evidence.
 */

export type ProviderName = 'gemini' | 'openai_web' | 'gateway_web';
export interface ProviderAnswer {
  text: string;
  /** URLs the search actually cited (null when the provider grounds inside its tool and does not list them). */
  citations: string[] | null;
}
export interface ScoutProvider {
  name: ProviderName;
  available: () => boolean;
  ask: (prompt: string) => Promise<ProviderAnswer>;
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
    const daily = /per.?day|daily|PerDay/i.test(msg);
    const retry = /retry in (\d+(?:\.\d+)?)s/i.exec(msg);
    return { kind: 'quota', coolMs: daily ? 3_600_000 : retry ? Math.ceil(Number(retry[1]) * 1000) + 1000 : 60_000, detail: msg.slice(0, 160) };
  }
  if ((status && status >= 500) || /\b5\d\d\b|ECONNRESET|ETIMEDOUT|timeout|fetch failed|overloaded/i.test(msg)) return { kind: 'transient', coolMs: 0, detail: msg.slice(0, 160) };
  return { kind: 'error', coolMs: 0, detail: msg.slice(0, 160) };
}

const bounded = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error(`timeout after ${ms}ms`)), ms))]);

/**
 * Ask the chain. `parse` decides whether an answer is usable (the Scout JSON); an unusable answer moves on.
 * Returns the first usable answer with its provider, or every attempt when none worked.
 */
export async function askGrounded<T>(
  prompt: string,
  parse: (a: ProviderAnswer) => T | null,
  providers: readonly ScoutProvider[] = defaultProviders(),
  opts: { now?: () => number; sleep?: (ms: number) => Promise<void>; timeoutMs?: number } = {},
): Promise<{ ok: true; value: T; provider: ProviderName; attempts: Attempt[] } | { ok: false; attempts: Attempt[] }> {
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const attempts: Attempt[] = [];
  for (const p of providers) {
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
        const a = await bounded(p.ask(prompt), opts.timeoutMs ?? 45_000);
        if (a.citations !== null && a.citations.length === 0) {
          attempts.push({ provider: p.name, outcome: 'no_citations', detail: 'the answer cited no sources: not grounded, not used' });
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
        if (c.kind === 'transient' && attempt === 0) {
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

/** Keep only claims whose URL the search itself cited (same host and path, ignoring query and fragment). */
export function groundedOnly<C extends { claim: string; url: string }>(claims: readonly C[], citations: string[] | null): { kept: C[]; dropped: C[] } {
  if (citations === null) return { kept: [...claims], dropped: [] };
  const key = (u: string) => {
    try {
      const x = new URL(u);
      return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/$/, '')}`.toLowerCase();
    } catch {
      return u.toLowerCase();
    }
  };
  const cited = new Set(citations.map(key));
  const kept: C[] = [];
  const dropped: C[] = [];
  for (const c of claims) (cited.has(key(c.url)) ? kept : dropped).push(c);
  return { kept, dropped };
}

/** HTTP status for a refused Scout: providers down is 503 (retryable infrastructure), one running is 409, caps 429. */
export const scoutRefusalStatus = (refused: string) => (refused === 'web_failed' ? 503 : refused === 'in_flight' ? 409 : 429);

// ---------------------------------------------------------------- the configured providers

const gemini: ScoutProvider = {
  name: 'gemini',
  available: () => !!process.env.GEMINI_API_KEY,
  ask: async (prompt) => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} } as unknown as never], generationConfig: { temperature: 0, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 512 } } as never });
    const res = await model.generateContent(prompt);
    // Grounded inside the Google Search tool; its chunk links are redirect URLs, so claims are not cross-checked.
    return { text: res.response.text(), citations: null };
  },
};

const openaiWeb: ScoutProvider = {
  name: 'openai_web',
  available: () => !!process.env.OPENAI_API_KEY,
  ask: async (prompt) => {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.responses.create({ model: process.env.SCOUT_OPENAI_MODEL || 'gpt-5-mini', tools: [{ type: 'web_search' }], input: prompt });
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
  ask: async (prompt) => {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1' });
    const res = (await client.chat.completions.create({ model: process.env.SCOUT_GATEWAY_MODEL || 'perplexity/sonar', messages: [{ role: 'user', content: prompt }] })) as unknown as {
      choices: Array<{ message: { content: string | null; annotations?: Array<{ type: string; url_citation?: { url: string } }> } }>;
      citations?: string[];
    };
    const msg = res.choices?.[0]?.message;
    const citations = [...(res.citations ?? []), ...((msg?.annotations ?? []).filter((a) => a.type === 'url_citation' && a.url_citation?.url).map((a) => a.url_citation!.url))];
    // No citations back from the gateway: not grounded (askGrounded refuses it).
    return { text: msg?.content ?? '', citations };
  },
};

export function defaultProviders(): ScoutProvider[] {
  return [gemini, openaiWeb, gatewayWeb];
}
