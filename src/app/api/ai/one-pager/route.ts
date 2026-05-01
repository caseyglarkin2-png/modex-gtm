import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTextWithMetadata } from '@/lib/ai/client';
import { buildOnePagerPrompt } from '@/lib/ai/prompts';
import type { OnePagerContext } from '@/lib/ai/prompts';
import { getAccountContext } from '@/lib/db';

export const dynamic = 'force-dynamic';

const OnePagerRequestSchema = z.object({
  accountName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = OnePagerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accountName } = parsed.data;
  const { account, meetingBrief } = await getAccountContext(accountName);
  if (!account) {
    return NextResponse.json(
      { error: 'ACCOUNT_NOT_FOUND', message: 'Account not found in database. Add it via /accounts/new.' },
      { status: 404 }
    );
  }

  const ctx: OnePagerContext = {
    accountName: account.name,
    parentBrand: account.parent_brand ?? account.name,
    vertical: account.vertical,
    whyNow: account.why_now ?? 'MODEX 2026 attendance signal',
    primoAngle: account.primo_angle ?? '',
    bestIntroPath: account.best_intro_path ?? '',
    likelyPainPoints:
      meetingBrief?.likely_pain ??
      account.why_now ??
      account.primo_angle ??
      'Trailer queue variability, gate/dock congestion, inconsistent driver journey',
    primoRelevance: meetingBrief?.primo_relevance ?? account.primo_angle ?? '',
    suggestedAttendees: meetingBrief?.suggested_attendees ?? '',
    score: account.priority_score,
    tier: account.tier,
    band: account.priority_band,
  };

  const prompt = buildOnePagerPrompt(ctx);

  try {
    const result = await generateTextWithMetadata(prompt, 1200);
    const raw = result.text;

    // Parse the JSON from Gemini response (may have markdown fences)
    const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    let content: unknown;
    try {
      content = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, return the raw text so the UI can handle it
      return NextResponse.json({
        content: null,
        raw,
        provider: result.provider,
        accountName,
        error: 'Failed to parse structured content — raw text returned',
      });
    }

    // Best-effort save to DB
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.generatedContent.create({
        data: {
          account_name: accountName,
          content_type: 'one_pager',
          tone: 'professional',
          provider_used: result.provider,
          content: JSON.stringify(content),
        },
      });
    } catch {
      // DB offline — skip
    }

    return NextResponse.json({ content, accountName, provider: result.provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';

    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.generatedContent.create({
        data: {
          account_name: accountName,
          content_type: 'one_pager',
          tone: 'professional',
          ai_error: message,
          content: JSON.stringify({ error: message }),
        },
      });
    } catch {
      // DB offline — skip
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
