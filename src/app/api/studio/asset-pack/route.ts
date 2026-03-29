import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai/client';
import {
  buildEmailPrompt,
  buildDMPrompt,
  buildCallScriptPrompt,
  buildMeetingPrepPrompt,
  buildFollowUpEmailPrompt,
  type PromptContext,
} from '@/lib/ai/prompts';
import { rateLimit } from '@/lib/rate-limit';
import { assertColdOutreachAllowed, sanitizeGeneratedCopy, scoreOutputQuality } from '@/lib/studio/guardrails';

const ToneMap: Record<string, PromptContext['tone']> = {
  formal: 'professional',
  conversational: 'casual',
  provocative: 'bold',
};

const AssetPackSchema = z.object({
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`studio:asset-pack:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AssetPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accountName, personaName, tone, length, notes } = parsed.data;

  try {
    assertColdOutreachAllowed(accountName);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Outreach blocked' }, { status: 403 });
  }

  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const personas = await prisma.persona.findMany({ where: { account_name: accountName } });

  let persona = personas[0] ?? null;
  if (personaName) {
    const target = personaName.toLowerCase().trim();
    // 1. Exact match (case-insensitive)
    const exact = personas.find((p) => p.name.toLowerCase() === target);
    if (exact) {
      persona = exact;
    } else {
      // 2. Fuzzy match: last name must match, first name starts-with (Matt→Matthew, Rob→Robert)
      const targetParts = target.split(/\s+/);
      const fuzzy = personas.find((p) => {
        const parts = p.name.toLowerCase().split(/\s+/);
        if (parts.length < 2 || targetParts.length < 2) return false;
        return parts.at(-1) === targetParts.at(-1) &&
          (parts[0].startsWith(targetParts[0]) || targetParts[0].startsWith(parts[0]));
      });
      if (fuzzy) {
        persona = fuzzy;
      } else {
        return NextResponse.json(
          { error: `Persona "${personaName}" not found for ${accountName}. Available: ${personas.map((p) => p.name).join(', ')}` },
          { status: 404 }
        );
      }
    }
  }

  const ctx: PromptContext = {
    accountName,
    personaName: persona?.name ?? personaName,
    personaTitle: persona?.title ?? undefined,
    bandLabel: account.priority_band,
    score: account.priority_score,
    notes: notes ?? account.why_now ?? undefined,
    vertical: account.vertical ?? undefined,
    primoAngle: account.primo_angle ?? undefined,
    parentBrand: account.parent_brand ?? undefined,
    tone: ToneMap[tone] ?? 'casual',
    length,
  };

  const promptMap = {
    email: buildEmailPrompt(ctx),
    follow_up: buildFollowUpEmailPrompt(ctx),
    dm: buildDMPrompt(ctx),
    call_script: buildCallScriptPrompt(ctx),
    meeting_prep: buildMeetingPrepPrompt(ctx),
  };

  const entries = await Promise.all(Object.entries(promptMap).map(async ([type, prompt]) => {
    const raw = await generateText(prompt, type === 'meeting_prep' ? 800 : 500);
    const content = sanitizeGeneratedCopy(raw);
    const quality = scoreOutputQuality(content, type);

    await prisma.generatedContent.create({
      data: {
        account_name: accountName,
        persona_name: persona?.name ?? personaName ?? null,
        content_type: `studio_${type}`,
        tone,
        length,
        content,
      },
    });

    return [type, { content, quality }] as const;
  }));

  return NextResponse.json({
    accountName,
    personaName: persona?.name ?? personaName,
    tone,
    length,
    assets: Object.fromEntries(entries),
    createdAt: new Date().toISOString(),
  });
}
