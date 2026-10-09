import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import OpenAI from 'openai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_GATEWAY_MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-5.4';
const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1';
const CONTROL_PLANE_URL = process.env.CLAWD_CONTROL_PLANE_URL?.trim();
const CONTROL_PLANE_TOKEN = process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim();

export type AIProvider = 'ai_gateway' | 'gemini' | 'openai' | 'control_plane';
export type AIErrorCategory = 'quota' | 'billing' | 'model_missing' | 'timeout' | 'service' | 'authentication' | 'unknown';

export interface AIErrorInfo {
  provider: AIProvider;
  category: AIErrorCategory;
  retryable: boolean;
  message: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  /** The provider's own figure (the AI Gateway reports one per call); null when the provider reports none. */
  costUsd: number | null;
}

export interface GenerateTextResult {
  text: string;
  provider: AIProvider;
  /** The model that answered (the gateway's `provider/model`, a Gemini model name, or gpt-4o-mini). */
  model: string | null;
  usage: AIUsage | null;
  errors: AIErrorInfo[];
}

export interface GenerateOptions {
  /** The AI Gateway model for this call (`provider/model`); the configured default otherwise. */
  model?: string;
  /** Never fall through to the clawd control plane (GAP: a prompt with prospect data stays with the metered providers). */
  skipControlPlane?: boolean;
}

/** Every provider failed: the per-provider reasons ride along so a caller can tell permanent from transient. */
export class AIAllProvidersFailed extends Error {
  readonly errors: AIErrorInfo[];

  constructor(errors: AIErrorInfo[]) {
    super(errors.length
      ? `AI generation failed: ${errors.map((error) => `${error.provider}:${error.category}:${error.message}`).join(' | ')}`
      : 'AI generation unavailable. Set AI_GATEWAY_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in your Vercel environment variables.');
    this.name = 'AIAllProvidersFailed';
    this.errors = errors;
  }
}

// Gemini models to try, cheapest first. The 2.0 models were retired on every key this team holds (2026-10-08: "no
// longer available"); a key created after the 2.5 retirement is told to use 3.5-flash-lite, so that is the second.
export const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
];

export function classifyAIError(provider: AIProvider, err: unknown): AIErrorInfo {
  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();
  // Exhausted billing is never a transient quota: OpenAI says it as a 429 `insufficient_quota` ("You have no credits
  // remaining"), the AI Gateway as a 403 ("Free tier users do not have access to this model"), others as a 402. Judged
  // before the rate-limit wording so the caller fails fast instead of retrying a bill (2026-10-08).
  const isBilling = /insufficient_quota|no credits|credits remaining|credit_|free tier|upgrade to paid|payment required|\b402\b|billing/.test(normalized);
  const isQuota = /429|quota|resource_exhausted|rate_limit|rate limit|too many requests/.test(normalized);
  const isTimeout = /timeout|timed out|aborted|network|fetch/.test(normalized);
  // A 404 or a retired model is never a timeout, whatever the SDK's wording ("Error fetching from ...: [404 Not Found] This
  // model ... is no longer available" abandoned the whole Gemini list in production, 2026-10-08): it is judged first.
  const isModelMissing = /404|not found|model.*not.*found|resource.*not.*found|no longer available|no longer supported|deprecated/.test(normalized);
  const isAuth = /\b401\b|unauthorized|api key|invalid key|incorrect api key|permission|forbidden|\b403\b/.test(normalized);
  const isService = /\b50[0-4]\b|service unavailable|overloaded|internal error|bad gateway/.test(normalized);

  let category: AIErrorCategory = 'unknown';
  if (isBilling) category = 'billing';
  else if (isQuota) category = 'quota';
  else if (isModelMissing) category = 'model_missing';
  else if (isTimeout) category = 'timeout';
  else if (isAuth) category = 'authentication';
  else if (isService) category = 'service';

  // Retrying the same request helps only when the provider may answer next time: a rate limit, a timeout, an outage.
  // Billing, an invalid key and a missing model are permanent for this configuration (the Gemini list continues on
  // model_missing by itself).
  const retryable = category === 'quota' || category === 'timeout' || category === 'service';

  return { provider, category, retryable, message };
}

class AIProviderError extends Error {
  provider: AIProvider;
  retryable: boolean;
  category: AIErrorCategory;

  constructor(info: AIErrorInfo) {
    super(info.message);
    this.provider = info.provider;
    this.retryable = info.retryable;
    this.category = info.category;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Gemini path ──────────────────────────────────────────────────────

type ProviderAnswer = { text: string; model: string; usage: AIUsage | null };

function tryGemini(prompt: string, maxTokens: number): Promise<ProviderAnswer> {
  if (!GEMINI_KEY) return Promise.reject(new Error('GEMINI_API_KEY not set'));
  const client = new GoogleGenerativeAI(GEMINI_KEY);
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  ];
  const generationConfig = { maxOutputTokens: maxTokens, temperature: 0.7 };

  return (async () => {
    const errors: AIErrorInfo[] = [];
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = client.getGenerativeModel({ model: modelName, safetySettings, generationConfig });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) throw new Error('Empty response');
        const meta = result.response.usageMetadata;
        return { text, model: modelName, usage: meta ? { promptTokens: meta.promptTokenCount ?? 0, completionTokens: meta.candidatesTokenCount ?? 0, costUsd: null } : null };
      } catch (err) {
        const info = classifyAIError('gemini', err);
        errors.push(info);
        if (info.category === 'model_missing' || info.category === 'quota') {
          continue;
        }
        throw new AIProviderError({ ...info, message: `Gemini error (${modelName}): ${info.message}` });
      }
    }

    const retryable = errors.some((error) => error.retryable);
    const message = `All Gemini models failed. ${errors.map((error) => `${error.provider}:${error.category}:${error.message.slice(0, 120)}`).join(' | ')}`;
    throw new AIProviderError({ provider: 'gemini', category: retryable ? 'quota' : 'service', retryable, message });
  })();
}

// ── OpenAI path ──────────────────────────────────────────────────────

function usageOf(u: unknown): AIUsage | null {
  if (!u || typeof u !== 'object') return null;
  const o = u as { prompt_tokens?: unknown; completion_tokens?: unknown; cost?: unknown };
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return { promptTokens: n(o.prompt_tokens) ?? 0, completionTokens: n(o.completion_tokens) ?? 0, costUsd: n(o.cost) };
}

function tryAIGateway(prompt: string, maxTokens: number, model = AI_GATEWAY_MODEL): Promise<ProviderAnswer> {
  if (!AI_GATEWAY_KEY) return Promise.reject(new Error('AI_GATEWAY_API_KEY not set'));
  const client = new OpenAI({
    apiKey: AI_GATEWAY_KEY,
    baseURL: AI_GATEWAY_BASE_URL,
  });

  return (async () => {
    try {
      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from AI Gateway');
      return { text, model, usage: usageOf(res.usage) };
    } catch (err) {
      const info = classifyAIError('ai_gateway', err);
      throw new AIProviderError({ ...info, message: `AI Gateway error: ${info.message}` });
    }
  })();
}

function tryOpenAI(prompt: string, maxTokens: number): Promise<ProviderAnswer> {
  if (!OPENAI_KEY) return Promise.reject(new Error('OPENAI_API_KEY not set'));
  const client = new OpenAI({ apiKey: OPENAI_KEY });

  return (async () => {
    try {
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from OpenAI');
      return { text, model: 'gpt-4o-mini', usage: usageOf(res.usage) };
    } catch (err) {
      const info = classifyAIError('openai', err);
      throw new AIProviderError({ ...info, message: `OpenAI error: ${info.message}` });
    }
  })();
}

async function tryControlPlane(prompt: string, maxTokens: number): Promise<ProviderAnswer> {
  if (!CONTROL_PLANE_URL) {
    throw new Error('CLAWD_CONTROL_PLANE_URL not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(CONTROL_PLANE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONTROL_PLANE_TOKEN ? { Authorization: `Bearer ${CONTROL_PLANE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Control-plane request failed (${response.status}): ${text.slice(0, 180)}`);
    }

    const payload = await response.json() as { content?: string; text?: string; output?: string };
    const text = payload.content ?? payload.text ?? payload.output;
    if (!text) throw new Error('Control-plane returned empty response');
    return { text, model: 'control_plane', usage: null };
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function generateTextWithProvider(provider: AIProvider, prompt: string, maxTokens = 1024, opts: GenerateOptions = {}): Promise<string> {
  switch (provider) {
    case 'ai_gateway':
      return (await tryAIGateway(prompt, maxTokens, opts.model)).text;
    case 'gemini':
      return (await tryGemini(prompt, maxTokens)).text;
    case 'openai':
      return (await tryOpenAI(prompt, maxTokens)).text;
    case 'control_plane':
      return (await tryControlPlane(prompt, maxTokens)).text;
    default:
      throw new Error(`Unsupported provider: ${String(provider)}`);
  }
}

export async function generateTextWithMetadata(prompt: string, maxTokens = 1024, opts: GenerateOptions = {}): Promise<GenerateTextResult> {
  const errors: AIErrorInfo[] = [];
  const answer = (provider: AIProvider, a: ProviderAnswer): GenerateTextResult => ({ text: a.text, provider, model: a.model, usage: a.usage, errors });

  if (AI_GATEWAY_KEY) {
    try {
      return answer('ai_gateway', await tryAIGateway(prompt, maxTokens, opts.model));
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
        if (err.retryable) {
          await wait(2000);
          try {
            return answer('ai_gateway', await tryAIGateway(prompt, maxTokens, opts.model));
          } catch (retryErr) {
            if (retryErr instanceof AIProviderError) {
              errors.push({ provider: retryErr.provider, category: retryErr.category, retryable: retryErr.retryable, message: retryErr.message });
            } else {
              errors.push(classifyAIError('ai_gateway', retryErr));
            }
          }
        }
      } else {
        errors.push(classifyAIError('ai_gateway', err));
      }
    }
  }

  if (GEMINI_KEY) {
    try {
      return answer('gemini', await tryGemini(prompt, maxTokens));
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
        if (err.retryable) {
          await wait(2000);
          try {
            return answer('gemini', await tryGemini(prompt, maxTokens));
          } catch (retryErr) {
            if (retryErr instanceof AIProviderError) {
              errors.push({ provider: retryErr.provider, category: retryErr.category, retryable: retryErr.retryable, message: retryErr.message });
            } else {
              errors.push(classifyAIError('gemini', retryErr));
            }
          }
        }
      } else {
        errors.push(classifyAIError('gemini', err));
      }
    }
  }

  if (OPENAI_KEY) {
    try {
      return answer('openai', await tryOpenAI(prompt, maxTokens));
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
      } else {
        errors.push(classifyAIError('openai', err));
      }
    }
  }

  if (CONTROL_PLANE_URL && !opts.skipControlPlane) {
    try {
      return answer('control_plane', await tryControlPlane(prompt, maxTokens));
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
      } else {
        errors.push(classifyAIError('control_plane', err));
      }
    }
  }

  throw new AIAllProvidersFailed(errors);
}

export async function generateText(prompt: string, maxTokens = 1024, opts: GenerateOptions = {}): Promise<string> {
  const result = await generateTextWithMetadata(prompt, maxTokens, opts);
  return result.text;
}

export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (AI_GATEWAY_KEY) providers.push('ai_gateway');
  if (GEMINI_KEY) providers.push('gemini');
  if (OPENAI_KEY) providers.push('openai');
  if (CONTROL_PLANE_URL) providers.push('control_plane');
  return providers;
}

/** Quick health check — returns first provider/model that responds */
export async function checkModelHealth(): Promise<{ ok: boolean; provider?: string; model?: string; errors: string[] }> {
  const errors: string[] = [];

  if (AI_GATEWAY_KEY) {
    try {
      const client = new OpenAI({
        apiKey: AI_GATEWAY_KEY,
        baseURL: AI_GATEWAY_BASE_URL,
      });
      const res = await client.chat.completions.create({
        model: AI_GATEWAY_MODEL,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      if (res.choices[0]?.message?.content) {
        return { ok: true, provider: 'ai_gateway', model: AI_GATEWAY_MODEL, errors };
      }
    } catch (err) {
      errors.push(`ai_gateway/${AI_GATEWAY_MODEL}: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`);
    }
  } else {
    errors.push('AI_GATEWAY_API_KEY not set');
  }

  if (GEMINI_KEY) {
    const client = new GoogleGenerativeAI(GEMINI_KEY);
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "ok"');
        if (result.response.text()) return { ok: true, provider: 'gemini', model: modelName, errors };
      } catch (err) {
        errors.push(`gemini/${modelName}: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`);
      }
    }
  } else {
    errors.push('GEMINI_API_KEY not set');
  }

  if (OPENAI_KEY) {
    try {
      const client = new OpenAI({ apiKey: OPENAI_KEY });
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      if (res.choices[0]?.message?.content) return { ok: true, provider: 'openai', model: 'gpt-4o-mini', errors };
    } catch (err) {
      errors.push(`openai/gpt-4o-mini: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`);
    }
  } else {
    errors.push('OPENAI_API_KEY not set');
  }

  return { ok: false, errors };
}
