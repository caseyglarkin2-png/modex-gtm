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
