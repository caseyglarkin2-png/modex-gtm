import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import OpenAI from 'openai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CONTROL_PLANE_URL = process.env.CLAWD_CONTROL_PLANE_URL?.trim();
const CONTROL_PLANE_TOKEN = process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim();

export type AIProvider = 'gemini' | 'openai' | 'control_plane';
export type AIErrorCategory = 'quota' | 'model_missing' | 'timeout' | 'service' | 'authentication' | 'unknown';

export interface AIErrorInfo {
  provider: AIProvider;
  category: AIErrorCategory;
  retryable: boolean;
  message: string;
}

export interface GenerateTextResult {
  text: string;
  provider: AIProvider;
  errors: AIErrorInfo[];
}

// Gemini models to try (newest/cheapest first)
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

function classifyAIError(provider: AIProvider, err: unknown): AIErrorInfo {
  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();
  const isQuota = /429|quota|resource_exhausted|rate_limit/.test(normalized);
  const isTimeout = /timeout|timed out|aborted|network|fetch/.test(normalized);
  const isModelMissing = /404|not found|model.*not.*found|resource.*not.*found/.test(normalized);
  const isAuth = /unauthorized|api key|invalid key|permission/.test(normalized);

  let category: AIErrorCategory = 'unknown';
  if (isQuota) category = 'quota';
  else if (isTimeout) category = 'timeout';
  else if (isModelMissing) category = 'model_missing';
  else if (isAuth) category = 'authentication';

  const retryable = category === 'quota' || category === 'timeout' || category === 'model_missing';

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

function tryGemini(prompt: string, maxTokens: number): Promise<string> {
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
        return text;
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

function tryOpenAI(prompt: string, maxTokens: number): Promise<string> {
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
      return text;
    } catch (err) {
      const info = classifyAIError('openai', err);
      throw new AIProviderError({ ...info, message: `OpenAI error: ${info.message}` });
    }
  })();
}

async function tryControlPlane(prompt: string, maxTokens: number): Promise<string> {
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
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function generateTextWithProvider(provider: AIProvider, prompt: string, maxTokens = 1024): Promise<string> {
  switch (provider) {
    case 'gemini':
      return tryGemini(prompt, maxTokens);
    case 'openai':
      return tryOpenAI(prompt, maxTokens);
    case 'control_plane':
      return tryControlPlane(prompt, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${String(provider)}`);
  }
}

export async function generateTextWithMetadata(prompt: string, maxTokens = 1024): Promise<GenerateTextResult> {
  const errors: AIErrorInfo[] = [];

  if (GEMINI_KEY) {
    try {
      const text = await tryGemini(prompt, maxTokens);
      return { text, provider: 'gemini', errors };
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
        if (err.retryable) {
          await wait(2000);
          try {
            const text = await tryGemini(prompt, maxTokens);
            return { text, provider: 'gemini', errors };
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
      const text = await tryOpenAI(prompt, maxTokens);
      return { text, provider: 'openai', errors };
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
      } else {
        errors.push(classifyAIError('openai', err));
      }
    }
  }

  if (CONTROL_PLANE_URL) {
    try {
      const text = await tryControlPlane(prompt, maxTokens);
      return { text, provider: 'control_plane', errors };
    } catch (err) {
      if (err instanceof AIProviderError) {
        errors.push({ provider: err.provider, category: err.category, retryable: err.retryable, message: err.message });
      } else {
        errors.push(classifyAIError('control_plane', err));
      }
    }
  }

  const errorMessage = errors.length
    ? `AI generation failed: ${errors.map((error) => `${error.provider}:${error.category}:${error.message}`).join(' | ')}`
    : 'AI generation unavailable. Set GEMINI_API_KEY or OPENAI_API_KEY in your Vercel environment variables.';
  throw new Error(errorMessage);
}

export async function generateText(prompt: string, maxTokens = 1024): Promise<string> {
  const result = await generateTextWithMetadata(prompt, maxTokens);
  return result.text;
}

export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (GEMINI_KEY) providers.push('gemini');
  if (OPENAI_KEY) providers.push('openai');
  if (CONTROL_PLANE_URL) providers.push('control_plane');
  return providers;
}

/** Quick health check — returns first provider/model that responds */
export async function checkModelHealth(): Promise<{ ok: boolean; provider?: string; model?: string; errors: string[] }> {
  const errors: string[] = [];

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
