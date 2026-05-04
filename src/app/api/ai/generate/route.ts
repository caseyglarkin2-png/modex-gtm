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
import { prisma } from '@/lib/prisma';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { getFacilityFact } from '@/lib/research/facility-fact-registry';
import { buildAccountTags } from '@/lib/research/account-tags';
import { isGenerationContractPolicyEnabled } from '@/lib/revops/campaign-generation-contract';
import { getAgentContentContext, toAgentMetadata } from '@/lib/agent-actions/content-context';

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

  const { type, accountName, personaName, campaignSlug, tone, length, context, useLiveIntel, refreshContext } = parsed.data;

  const { account, personas } = await getAccountContext(accountName);
  const requestedCampaignSlug = campaignSlug ?? (context as Record<string, string> | undefined)?.campaignSlug;
  const campaign = requestedCampaignSlug
    ? await prisma.campaign.findUnique({
        where: { slug: requestedCampaignSlug },
        select: {
          slug: true,
          name: true,
          campaign_type: true,
          messaging_angle: true,
          key_dates: true,
          generation_contract: {
            select: {
              objective: true,
              persona_hypothesis: true,
              offer: true,
              proof: true,
              cta: true,
              metric: true,
              is_complete: true,
            },
          },
        },
      }).catch(() => null)
    : null;
  if (campaign && isGenerationContractPolicyEnabled(campaign.key_dates) && !campaign.generation_contract?.is_complete) {
    return NextResponse.json({ error: 'Campaign brief contract is required before generation for this campaign.' }, { status: 409 });
  }
  const contractPayload = campaign?.generation_contract
    ? [
      `Objective: ${campaign.generation_contract.objective}`,
      `Persona hypothesis: ${campaign.generation_contract.persona_hypothesis}`,
      `Offer: ${campaign.generation_contract.offer}`,
      `Proof: ${campaign.generation_contract.proof}`,
      `CTA: ${campaign.generation_contract.cta}`,
      `Metric: ${campaign.generation_contract.metric}`,
    ].join('\n')
    : null;
  const campaignKeyDates = campaign?.key_dates ? JSON.stringify(campaign.key_dates) : (context as Record<string, string> | undefined)?.campaignKeyDates;
  const persona = personaName
    ? personas.find((p) => p.name?.toLowerCase() === personaName.toLowerCase()) ?? personas[0]
    : personas[0];

  const microsite = getAllAccountMicrositeData().find((entry) => entry.accountName === accountName);
  const micrositeUrl = microsite ? buildAbsoluteUrl(`/for/${microsite.slug}`) : undefined;
  const facilityFact = account ? getFacilityFact(account.name) : undefined;
  const accountTags = account ? buildAccountTags(account) : [];
  const agentContext = useLiveIntel
    ? await getAgentContentContext({ accountName, personaName, refresh: refreshContext })
    : null;

  const ctx: PromptContext = {
    accountName,
    personaName: persona?.name ?? personaName,
    personaTitle: (context as Record<string, string> | undefined)?.personaTitle ?? persona?.title ?? undefined,
    bandLabel: account?.priority_band ?? undefined,
    score: account?.priority_score ?? undefined,
    previousMeeting: (context as Record<string, string> | undefined)?.previousMeeting,
    notes: [
      (context as Record<string, string> | undefined)?.notes ?? account?.why_now ?? '',
      contractPayload ? `Campaign brief contract:\n${contractPayload}` : '',
    ].filter(Boolean).join('\n\n') || undefined,
    vertical: (context as Record<string, string> | undefined)?.vertical ?? account?.vertical ?? undefined,
    primoAngle: (context as Record<string, string> | undefined)?.primoAngle ?? account?.primo_angle ?? undefined,
    parentBrand: account?.parent_brand ?? undefined,
    micrositeUrl,
    campaignName: campaign?.name ?? (context as Record<string, string> | undefined)?.campaignName,
    campaignType: campaign?.campaign_type ?? (context as Record<string, string> | undefined)?.campaignType,
    campaignAngle: campaign?.messaging_angle ?? (context as Record<string, string> | undefined)?.campaignAngle,
    campaignKeyDates,
    facilityCountLabel: facilityFact?.facilityCount,
    facilityScope: facilityFact?.scope,
    researchTags: accountTags.map((t) => `${t.label}: ${t.value}`),
    playbookHints: (context as Record<string, string> | undefined)?.playbookHints,
    agentContextSummary: agentContext?.summary,
    agentNextActions: agentContext?.nextActions,
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
    return NextResponse.json({
      content,
      type,
      accountName,
      personaName: ctx.personaName,
      tone,
      length,
      agentContext: toAgentMetadata(agentContext),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
