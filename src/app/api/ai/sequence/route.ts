import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/client';
import { buildOutreachSequencePrompt } from '@/lib/ai/prompts';
import type { PromptContext } from '@/lib/ai/prompts';
import { getAccountByName, getPersonasByAccount } from '@/lib/data';

const TONE_MAP: Record<string, PromptContext['tone']> = {
  formal: 'professional',
  conversational: 'casual',
  provocative: 'bold',
};

const SequenceRequestSchema = z.object({
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  steps: z.array(z.enum(['initial_email', 'follow_up_1', 'follow_up_2', 'breakup'])).optional(),
});

function parseEmailContent(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/^SUBJECT:\s*(.+)/m);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  const bodyStart = raw.indexOf('---');
  let body = bodyStart >= 0 ? raw.slice(bodyStart + 3).trim() : raw.trim();

  // Strip AI-generated greetings (voice rules say: no greetings)
  body = body
    .replace(/^(Hi|Hey|Hello|Dear)\s+[A-Z][a-z]+,?\s*\n{1,2}/i, '')
    .trim();

  // Strip em dashes (voice rules say: no em dashes)
  body = body.replace(/\u2014/g, ',').replace(/--/g, ',');

  // Strip AI-generated sign-offs (Casey signs via the email template)
  body = body
    .replace(/\n{1,3}(Best|Sincerely|Regards|Cheers|Warm regards|All the best|Looking forward),?\s*\n+\[Your Name\][\s\S]*$/i, '')
    .replace(/\n{1,3}(Best|Sincerely|Regards|Cheers|Warm regards|All the best|Looking forward),?\s*\n*$/i, '')
    .replace(/\n{1,3}\[Your Name\][\s\S]*$/i, '')
    .replace(/\n{1,3}Casey Larkin\s*$/i, '')
    .replace(/\n{1,3}Casey\s*$/i, '')
    .trim();

  return { subject, body };
}

export async function POST(req: NextRequest) {
  let reqBody: unknown;
  try {
    reqBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SequenceRequestSchema.safeParse(reqBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accountName, personaName, tone } = parsed.data;
  const steps = parsed.data.steps ?? ['initial_email', 'follow_up_1', 'follow_up_2', 'breakup'];

  const account = getAccountByName(accountName);
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const personas = getPersonasByAccount(accountName);
  const persona = personaName
    ? personas.find((p) => p.name?.toLowerCase() === personaName.toLowerCase()) ?? personas[0]
    : personas[0];

  const ctx: PromptContext = {
    accountName,
    personaName: persona?.name ?? personaName,
    personaTitle: persona?.title ?? undefined,
    bandLabel: account.priority_band,
    score: account.priority_score,
    notes: account.why_now ?? undefined,
    vertical: account.vertical ?? undefined,
    primoAngle: account.primo_angle ?? undefined,
    parentBrand: account.parent_brand ?? undefined,
    tone: TONE_MAP[tone] ?? 'casual',
    length: 'medium',
  };

  const results: Array<{
    step: string;
    subject: string;
    body: string;
    dayOffset: number;
  }> = [];

  const dayOffsets: Record<string, number> = {
    initial_email: 0,
    follow_up_1: 3,
    follow_up_2: 8,
    breakup: 15,
  };

  for (const step of steps) {
    try {
      const prompt = buildOutreachSequencePrompt(ctx, step);
      const raw = await generateText(prompt, 400);
      const { subject, body } = parseEmailContent(raw);
      results.push({
        step,
        subject,
        body,
        dayOffset: dayOffsets[step] ?? 0,
      });
    } catch (err) {
      results.push({
        step,
        subject: '',
        body: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        dayOffset: dayOffsets[step] ?? 0,
      });
    }
  }

  // Best-effort save to DB
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.generatedContent.create({
      data: {
        account_name: accountName,
        persona_name: persona?.name ?? personaName ?? null,
        content_type: 'outreach_sequence',
        tone,
        content: JSON.stringify(results),
      },
    });
  } catch {
    // DB offline — skip
  }

  return NextResponse.json({
    accountName,
    personaName: persona?.name ?? personaName,
    tone,
    sequence: results,
  });
}
