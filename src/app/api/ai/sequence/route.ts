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
  // Case-insensitive subject parsing (model may write SUBJECT:, Subject:, subject:)
  const subjectMatch = raw.match(/^subject:\s*(.+)/im);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';

  // Find body after --- separator, or after subject line
  const bodyStart = raw.indexOf('---');
  let body: string;
  if (bodyStart >= 0) {
    body = raw.slice(bodyStart + 3).trim();
  } else if (subjectMatch) {
    // No --- separator: strip the subject line and take the rest
    body = raw.slice(raw.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
  } else {
    body = raw.trim();
  }

  // Strip stray "subject:" if it leaked into the body
  body = body.replace(/^subject:\s*.+\n{1,2}/im, '').trim();

  // Strip AI-generated greetings (voice rules say: no greetings)
  // Catches "Hi Name,", "Hey Name,", "Hello Name,", "Dear Name,", and bare "Name,"
  body = body
    .replace(/^(Hi|Hey|Hello|Dear)\s+[A-Z][a-z]+,?\s*\n{1,2}/i, '')
    .replace(/^[A-Z][a-z]+,\s*\n{1,2}/, '')
    .trim();

  // Strip smart quotes: curly apostrophes → straight, curly double quotes → straight
  body = body
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  // Strip em dashes (voice rules say: no em dashes)
  body = body.replace(/\u2014/g, ', ').replace(/--/g, ', ');

  // Strip AI-generated sign-offs (Casey signs via the email template)
  body = body
    .replace(/\n{1,3}(Best|Sincerely|Regards|Cheers|Warm regards|All the best|Looking forward),?\s*\n+\[Your Name\][\s\S]*$/i, '')
    .replace(/\n{1,3}(Best|Sincerely|Regards|Cheers|Warm regards|All the best|Looking forward),?\s*\n*$/i, '')
    .replace(/\n{1,3}\[Your Name\][\s\S]*$/i, '')
    .replace(/\n{1,3}Casey Larkin\s*$/i, '')
    .replace(/\n{1,3}Casey\s*$/i, '')
    .trim();

  // Also normalize subject: strip smart quotes
  const cleanSubject = subject
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  return { subject: cleanSubject, body };
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
