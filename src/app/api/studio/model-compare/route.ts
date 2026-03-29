import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTextWithProvider, getAvailableProviders, type AIProvider } from '@/lib/ai/client';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeGeneratedCopy, scoreOutputQuality } from '@/lib/studio/guardrails';

const ModelCompareSchema = z.object({
  prompt: z.string().min(20).max(8_000),
  maxTokens: z.number().int().min(120).max(1_200).default(500),
  providers: z.array(z.enum(['gemini', 'openai', 'control_plane'])).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`studio:model-compare:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ModelCompareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const available = getAvailableProviders();
  if (available.length === 0) {
    return NextResponse.json({ error: 'No AI providers configured' }, { status: 503 });
  }

  const selectedProviders = (parsed.data.providers?.length ? parsed.data.providers : available)
    .filter((provider): provider is AIProvider => available.includes(provider));

  if (selectedProviders.length === 0) {
    return NextResponse.json({ error: 'Requested providers are not configured' }, { status: 400 });
  }

  const outputs = await Promise.all(selectedProviders.map(async (provider) => {
    const started = Date.now();
    try {
      const raw = await generateTextWithProvider(provider, parsed.data.prompt, parsed.data.maxTokens);
      const content = sanitizeGeneratedCopy(raw);
      const quality = scoreOutputQuality(content);

      return {
        provider,
        ok: true,
        content,
        latencyMs: Date.now() - started,
        quality,
      };
    } catch (err) {
      return {
        provider,
        ok: false,
        error: err instanceof Error ? err.message : 'Generation failed',
        latencyMs: Date.now() - started,
      };
    }
  }));

  return NextResponse.json({
    prompt: parsed.data.prompt,
    outputs,
    comparedAt: new Date().toISOString(),
  });
}
