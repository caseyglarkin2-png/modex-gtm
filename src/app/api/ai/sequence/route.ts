import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/client';
import { buildOutreachSequencePrompt } from '@/lib/ai/prompts';
import type { PromptContext } from '@/lib/ai/prompts';
import { getAccountContext } from '@/lib/db';
import { isWarmIntroOnlyAccount } from '@/lib/studio/guardrails';
import { getAgentContentContext, toAgentMetadata } from '@/lib/agent-actions/content-context';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION, getCtaPolicy } from '@/lib/revops/cold-outbound-policy';
import { buildGenerationInputContract } from '@/lib/agent-actions/generation-input';

export const dynamic = 'force-dynamic';

const TONE_MAP: Record<string, PromptContext['tone']> = {
  formal: 'professional',
  conversational: 'casual',
  provocative: 'bold',
};

const SequenceRequestSchema = z.object({
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  campaignSlug: z.string().optional(),
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  steps: z.array(z.enum(['initial_email', 'follow_up_1', 'follow_up_2', 'breakup'])).optional(),
  useLiveIntel: z.boolean().optional().default(false),
  refreshContext: z.boolean().optional().default(false),
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

  const { accountName, personaName, tone, campaignSlug, useLiveIntel, refreshContext } = parsed.data;
  const steps = parsed.data.steps ?? ['initial_email', 'follow_up_1', 'follow_up_2', 'breakup'];

  if (isWarmIntroOnlyAccount(accountName)) {
    return NextResponse.json(
      { error: 'RESTRICTED_ACCOUNT', message: 'Dannon: warm intro only via Mark Shaughnessy. Cold outreach is blocked.' },
      { status: 403 }
    );
  }

  const { account, personas } = await getAccountContext(accountName);
  if (!account) {
    return NextResponse.json(
      { error: 'ACCOUNT_NOT_FOUND', message: 'Account not found in database. Add it via /accounts/new.' },
      { status: 404 }
    );
  }

  if (personas.length === 0) {
    return NextResponse.json(
      { error: 'NO_PERSONAS', message: 'No personas found for this account. Add one or generate without persona context.' },
      { status: 422 }
    );
  }

  const persona = personaName
    ? personas.find((p) => p.name?.toLowerCase() === personaName.toLowerCase()) ?? personas[0]
    : personas[0];

  const { prisma } = await import('@/lib/prisma');
  const campaign = campaignSlug
    ? await prisma.campaign.findUnique({
        where: { slug: campaignSlug },
        select: { name: true, campaign_type: true, messaging_angle: true, key_dates: true },
      }).catch(() => null)
    : null;
  const agentContext = useLiveIntel
    ? await getAgentContentContext({ accountName, personaName, refresh: refreshContext })
    : null;
  const initialStepPolicy = getCtaPolicy('outreach_sequence', 'sequence_step_1');
  const generationInput = buildGenerationInputContract(agentContext, initialStepPolicy.ctaMode);

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
    campaignName: campaign?.name ?? undefined,
    campaignType: campaign?.campaign_type ?? undefined,
    campaignAngle: campaign?.messaging_angle ?? undefined,
    campaignKeyDates: campaign?.key_dates ? JSON.stringify(campaign.key_dates) : undefined,
    agentContextSummary: agentContext?.summary,
    agentNextActions: agentContext?.nextActions,
    generationInput,
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
        version_metadata: {
          prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
          cta_mode: initialStepPolicy.ctaMode,
          agent_context_summary: generationInput?.account_brief ?? agentContext?.summary ?? null,
          agent_context_freshness: generationInput?.freshness ?? null,
          generation_input_contract: generationInput,
          agentContext: toAgentMetadata(agentContext, initialStepPolicy.ctaMode),
        },
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
    agentContext: toAgentMetadata(agentContext, initialStepPolicy.ctaMode),
    generationInput,
  });
}
