import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/client';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeGeneratedCopy } from '@/lib/studio/guardrails';

const VoiceRehearsalSchema = z.object({
  script: z.string().min(30).max(6_000),
});

function computeMetrics(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean);
  const sentences = script
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const estimatedSeconds = Math.max(8, Math.round((wordCount / 145) * 60));
  const avgWordsPerSentence = sentenceCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : wordCount;
  const longSentences = sentences.filter((sentence) => sentence.split(/\s+/).length > 22).length;

  let score = 100;
  if (estimatedSeconds < 25 || estimatedSeconds > 75) score -= 15;
  if (avgWordsPerSentence > 20) score -= 10;
  if (longSentences > 0) score -= Math.min(20, longSentences * 5);

  return {
    wordCount,
    sentenceCount,
    estimatedSeconds,
    avgWordsPerSentence,
    longSentences,
    pacingScore: Math.max(0, score),
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`studio:voice-rehearsal:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = VoiceRehearsalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const metrics = computeMetrics(parsed.data.script);

  const critiquePrompt = `You are a sales call coach for MODEX meeting booking.
Analyze this script and return valid JSON with keys: strengths (string[]), risks (string[]), rewrite (string).
Constraints:
- Keep rewrite under 95 words.
- Use no em dashes.
- Keep the ask direct and specific.

Script:
${parsed.data.script}`;

  let strengths: string[] = [];
  let risks: string[] = [];
  let rewrite = parsed.data.script;

  try {
    const raw = await generateText(critiquePrompt, 450);
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsedCritique = JSON.parse(cleaned) as {
      strengths?: string[];
      risks?: string[];
      rewrite?: string;
    };

    strengths = parsedCritique.strengths ?? [];
    risks = parsedCritique.risks ?? [];
    rewrite = sanitizeGeneratedCopy(parsedCritique.rewrite ?? parsed.data.script);
  } catch {
    strengths = ['Script can be delivered in a single pass with minor edits.'];
    risks = ['AI critique unavailable. Using deterministic pacing feedback only.'];
    rewrite = sanitizeGeneratedCopy(parsed.data.script);
  }

  return NextResponse.json({
    metrics,
    critique: {
      strengths,
      risks,
      rewrite,
    },
  });
}
