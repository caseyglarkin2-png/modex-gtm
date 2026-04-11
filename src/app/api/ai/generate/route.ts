import { NextRequest, NextResponse } from 'next/server';
import { GenerateContentSchema } from '@/lib/validations';
import { generateText } from '@/lib/ai/client';
import type { PromptContext } from '@/lib/ai/prompts';
import {
  buildEmailPrompt,
  buildFollowUpEmailPrompt,
  buildDMPrompt,
  buildCallScriptPrompt,
  buildMeetingPrepPrompt,
} from '@/lib/ai/prompts';
import { getAccountContext } from '@/lib/db';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { buildAbsoluteUrl } from '@/lib/site-url';

const TONE_MAP: Record<string, PromptContext['tone']> = {
  formal: 'professional',
  conversational: 'casual',
  provocative: 'bold',
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = GenerateContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, accountName, personaName, tone, length, context } = parsed.data;

  const { account, personas } = await getAccountContext(accountName);
  const persona = personaName
    ? personas.find((p) => p.name?.toLowerCase() === personaName.toLowerCase()) ?? personas[0]
    : personas[0];

  const microsite = getAllAccountMicrositeData().find((entry) => entry.accountName === accountName);
  const micrositeUrl = microsite ? buildAbsoluteUrl(`/for/${microsite.slug}`) : undefined;

  const ctx: PromptContext = {
    accountName,
    personaName: persona?.name ?? personaName,
    personaTitle: (context as Record<string, string> | undefined)?.personaTitle ?? persona?.title ?? undefined,
    bandLabel: account?.priority_band ?? undefined,
    score: account?.priority_score ?? undefined,
    previousMeeting: (context as Record<string, string> | undefined)?.previousMeeting,
    notes: (context as Record<string, string> | undefined)?.notes ?? account?.why_now ?? undefined,
    vertical: (context as Record<string, string> | undefined)?.vertical ?? account?.vertical ?? undefined,
    primoAngle: (context as Record<string, string> | undefined)?.primoAngle ?? account?.primo_angle ?? undefined,
    parentBrand: account?.parent_brand ?? undefined,
    micrositeUrl,
    tone: TONE_MAP[tone] ?? 'casual',
    length: length as PromptContext['length'],
  };

  let prompt: string;
  let maxTokens = 512;

  switch (type) {
    case 'email':
      prompt = buildEmailPrompt(ctx);
      maxTokens = 400;
      break;
    case 'follow_up':
      prompt = buildFollowUpEmailPrompt(ctx);
      maxTokens = 300;
      break;
    case 'dm':
      prompt = buildDMPrompt(ctx);
      maxTokens = 200;
      break;
    case 'call_script':
      prompt = buildCallScriptPrompt(ctx);
      maxTokens = 600;
      break;
    case 'meeting_prep':
      prompt = buildMeetingPrepPrompt(ctx);
      maxTokens = 800;
      break;
    case 'infographic':
      prompt = buildMeetingPrepPrompt(ctx); // re-use prep as infographic skeleton
      maxTokens = 500;
      break;
    default:
      prompt = buildEmailPrompt(ctx);
  }

  try {
    const content = await generateText(prompt, maxTokens);
    return NextResponse.json({ content, type, accountName, personaName: ctx.personaName, tone, length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
