import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation((options) => ({
    options,
    chat: {
      completions: {
        create: createMock,
      },
    },
  })),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'harassment',
    HARM_CATEGORY_HATE_SPEECH: 'hate_speech',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'block_only_high',
  },
}));

describe('AI client provider routing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_MODEL;
    delete process.env.AI_GATEWAY_BASE_URL;
  });

  it('prefers Vercel AI Gateway when configured', async () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
    process.env.AI_GATEWAY_MODEL = 'openai/gpt-5.4';
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'gateway response' } }],
    });

    const { generateTextWithMetadata, getAvailableProviders } = await import('@/lib/ai/client');

    await expect(generateTextWithMetadata('write a one-pager')).resolves.toEqual({
      text: 'gateway response',
      provider: 'ai_gateway',
      model: 'openai/gpt-5.4',
      usage: null,
      errors: [],
    });
    expect(getAvailableProviders()).toEqual(['ai_gateway']);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'openai/gpt-5.4',
      messages: [{ role: 'user', content: 'write a one-pager' }],
    }));
  });

  it('falls back to direct OpenAI if AI Gateway is unavailable', async () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
    process.env.OPENAI_API_KEY = 'openai-test-key';
    createMock
      .mockRejectedValueOnce(new Error('429 quota'))
      .mockRejectedValueOnce(new Error('429 quota'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'openai fallback' } }],
      });

    const { generateTextWithMetadata } = await import('@/lib/ai/client');

    const result = await generateTextWithMetadata('write a one-pager');

    expect(result.text).toBe('openai fallback');
    expect(result.provider).toBe('openai');
    expect(result.errors).toHaveLength(2);
    expect(result.errors.every((error) => error.provider === 'ai_gateway')).toBe(true);
  });
});

describe('classifyAIError: a retired model is model_missing, never a timeout (production 2026-10-08)', () => {
  it('a 404 whose wording says "Error fetching" is model_missing (the Gemini list continues); a real timeout stays a timeout; a 429 is quota', async () => {
    const { classifyAIError } = await import('@/lib/ai/client');
    const retired = classifyAIError('gemini', new Error('[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent: [404 Not Found] This model models/gemini-2.5-flash-lite is no longer available'));
    // A01: a missing model is permanent for this configuration (the Gemini list itself continues on it); the same request is not retried.
    expect(retired).toMatchObject({ category: 'model_missing', retryable: false });
    expect(classifyAIError('gemini', new Error('Error fetching from https://x: request timed out'))).toMatchObject({ category: 'timeout', retryable: true });
    expect(classifyAIError('gemini', new Error('429 Too Many Requests: rate limit exceeded'))).toMatchObject({ category: 'quota', retryable: true });
  });
});

describe('A04: the clawd control plane is never a fallback when the caller says so', () => {
  it('with only CLAWD_CONTROL_PLANE_URL set, skipControlPlane throws AIAllProvidersFailed without a request; without the option the control plane is tried', async () => {
    vi.resetModules();
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.CLAWD_CONTROL_PLANE_URL = 'https://control-plane.example/generate';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: 'from clawd' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const { generateTextWithMetadata, AIAllProvidersFailed } = await import('@/lib/ai/client');
      await expect(generateTextWithMetadata('prospect data', 100, { skipControlPlane: true })).rejects.toBeInstanceOf(AIAllProvidersFailed);
      expect(fetchMock).not.toHaveBeenCalled();
      await expect(generateTextWithMetadata('prospect data', 100)).resolves.toMatchObject({ provider: 'control_plane', text: 'from clawd' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
      delete process.env.CLAWD_CONTROL_PLANE_URL;
    }
  });
});

describe('A01: exhausted billing is permanent, never a transient quota; an invalid key is permanent; the gateway answers with its model and cost', () => {
  it('classifies OpenAI insufficient_quota (a 429), the gateway free-tier 403 and a 402 as billing, non-retryable; a 401 as authentication; a 503 as service, retryable', async () => {
    const { classifyAIError } = await import('@/lib/ai/client');
    expect(classifyAIError('openai', new Error('429 You have no credits remaining. Add credits to continue using the API. insufficient_quota'))).toMatchObject({ category: 'billing', retryable: false });
    expect(classifyAIError('ai_gateway', new Error('403 Free tier users do not have access to this model. Upgrade to paid credits'))).toMatchObject({ category: 'billing', retryable: false });
    expect(classifyAIError('ai_gateway', new Error('402 Payment Required'))).toMatchObject({ category: 'billing', retryable: false });
    expect(classifyAIError('openai', new Error('401 Incorrect API key provided'))).toMatchObject({ category: 'authentication', retryable: false });
    expect(classifyAIError('ai_gateway', new Error('503 Service Unavailable: overloaded'))).toMatchObject({ category: 'service', retryable: true });
  });

  it('a per-call model override reaches the gateway; the answer carries the model and the usage with the gateway cost; a billing failure is not retried and the chain throws AIAllProvidersFailed with every reason', async () => {
    vi.resetModules();
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
    process.env.AI_GATEWAY_MODEL = 'openai/gpt-5.4';
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    createMock.mockResolvedValueOnce({ choices: [{ message: { content: 'cheap answer' } }], usage: { prompt_tokens: 1285, completion_tokens: 180, total_tokens: 1465, cost: 0.0002005 } });
    const { generateTextWithMetadata, AIAllProvidersFailed } = await import('@/lib/ai/client');
    const r = await generateTextWithMetadata('angle please', 700, { model: 'google/gemini-2.5-flash-lite' });
    expect(r).toMatchObject({ text: 'cheap answer', provider: 'ai_gateway', model: 'google/gemini-2.5-flash-lite', usage: { promptTokens: 1285, completionTokens: 180, costUsd: 0.0002005 } });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'google/gemini-2.5-flash-lite', max_tokens: 700 }));

    createMock.mockReset();
    createMock.mockRejectedValue(new Error('403 Free tier users do not have access to this model'));
    const err = await generateTextWithMetadata('angle please', 700, { model: 'openai/gpt-5.4' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AIAllProvidersFailed);
    expect((err as InstanceType<typeof AIAllProvidersFailed>).errors).toEqual([expect.objectContaining({ provider: 'ai_gateway', category: 'billing', retryable: false })]);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
