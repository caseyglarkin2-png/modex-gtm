import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTextWithMetadata } from '@/lib/ai/client';
import { buildOnePagerPrompt } from '@/lib/ai/prompts';
import type { OnePagerContext } from '@/lib/ai/prompts';
import { getAccountContext } from '@/lib/db';
import { SignalRegenerationSchema } from '@/lib/validations';
import {
  buildRegenerationPromptContext,
  buildSignalToContentMapping,
  computeLearningReviewSlaDueAt,
} from '@/lib/revops/engagement-learning';
import { prisma } from '@/lib/prisma';
import { isGenerationContractPolicyEnabled } from '@/lib/revops/campaign-generation-contract';
import {
  buildInfographicEvent,
  buildInfographicMetadata,
  evaluateInfographicTemplateQuality,
  INFOGRAPHIC_TYPES,
  JOURNEY_STAGE_INTENTS,
  recommendInfographicType,
  type JourneyStageIntent,
} from '@/lib/revops/infographic-journey';

export const dynamic = 'force-dynamic';

const OnePagerRequestSchema = z.object({
  accountName: z.string().min(1),
  campaignSlug: z.string().optional(),
  stageIntent: z.enum(JOURNEY_STAGE_INTENTS).optional(),
  infographicType: z.enum(INFOGRAPHIC_TYPES).optional(),
  bundleId: z.string().max(128).optional().nullable(),
  sequencePosition: z.number().int().min(1).max(50).optional().nullable(),
  regeneration: SignalRegenerationSchema.optional(),
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

  const {
    accountName,
    campaignSlug,
    stageIntent,
    infographicType,
    bundleId,
    sequencePosition,
    regeneration,
  } = parsed.data;
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
    whyNow: account.why_now ?? 'Rising throughput and service pressure requires standardized yard execution.',
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

  const selectedStage = (stageIntent ?? 'cold') as JourneyStageIntent;
  const recommendation = recommendInfographicType({ stageIntent: selectedStage });
  const selectedType = infographicType ?? recommendation.recommended;
  const infographicMetadata = buildInfographicMetadata({
    infographic_type: selectedType,
    stage_intent: selectedStage,
    bundle_id: bundleId ?? null,
    sequence_position: sequencePosition ?? null,
  });
  const promptBase = [
    buildOnePagerPrompt(ctx),
    `Infographic type: ${selectedType}`,
    `Journey stage intent: ${selectedStage}`,
    'Ensure structure is clear, evidence-based, and stage-appropriate.',
  ].join('\n\n');
  const campaign = campaignSlug
    ? await prisma.campaign.findUnique({
      where: { slug: campaignSlug },
      select: {
        id: true,
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
    return NextResponse.json({ error: 'Campaign brief contract is required before one-pager generation for this campaign.' }, { status: 409 });
  }
  const contractPrompt = campaign?.generation_contract
    ? `Campaign brief contract:
- Objective: ${campaign.generation_contract.objective}
- Persona hypothesis: ${campaign.generation_contract.persona_hypothesis}
- Offer: ${campaign.generation_contract.offer}
- Proof: ${campaign.generation_contract.proof}
- CTA: ${campaign.generation_contract.cta}
- Metric: ${campaign.generation_contract.metric}`
    : '';
  const signalMapping = regeneration
    ? buildSignalToContentMapping({
        sourceKind: regeneration.sourceKind,
        sourceId: regeneration.sourceId,
        accountName,
        campaignId: regeneration.campaignId,
        generatedContentId: regeneration.generatedContentId,
        signalContext: regeneration.context,
      })
    : null;
  const regenerationPrompt = signalMapping ? buildRegenerationPromptContext(signalMapping) : null;
  const prompt = [promptBase, contractPrompt, regenerationPrompt?.prompt ?? ''].filter(Boolean).join('\n\n');

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
      const latestVersion = await prisma.generatedContent.findFirst({
        where: {
          account_name: accountName,
          content_type: 'one_pager',
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const templateQuality = evaluateInfographicTemplateQuality(selectedType, JSON.stringify(content));
      await prisma.generatedContent.create({
        data: {
          account_name: accountName,
          content_type: 'one_pager',
          tone: 'professional',
          provider_used: result.provider,
          version: (latestVersion?.version ?? 0) + 1,
          version_metadata: {
            source: 'one_pager_generator',
            model_provider: result.provider,
            infographic: {
              infographic_type: infographicMetadata.infographicType,
              stage_intent: infographicMetadata.stageIntent,
              bundle_id: infographicMetadata.bundleId,
              sequence_position: infographicMetadata.sequencePosition,
              recommendation_rationale: recommendation.rationale,
            },
            infographic_quality: templateQuality,
            regeneration: signalMapping
              ? {
                  source_kind: signalMapping.sourceKind,
                  source_id: signalMapping.sourceId,
                  signal_kind: signalMapping.signalKind,
                  signal_context: signalMapping.evidenceSnapshot.signalContext,
                  generated_content_id: signalMapping.generatedContentId,
                  campaign_id: signalMapping.campaignId,
                }
              : null,
          },
          content: JSON.stringify(content),
        },
      });
      await prisma.activity.create({
        data: {
          account_name: accountName,
          campaign_id: campaign?.id ?? null,
          activity_type: 'Infographic',
          owner: 'Casey',
          outcome: `Generated ${selectedType} (${selectedStage})`,
          notes: JSON.stringify(buildInfographicEvent('bundle_created', {
            accountName,
            infographic_type: infographicMetadata.infographicType,
            stage_intent: infographicMetadata.stageIntent,
            bundle_id: infographicMetadata.bundleId,
            sequence_position: infographicMetadata.sequencePosition,
          })),
          activity_date: new Date(),
        },
      }).catch(() => undefined);
      if (signalMapping) {
        const latestCreated = await prisma.generatedContent.findFirst({
          where: {
            account_name: accountName,
            content_type: 'one_pager',
          },
          orderBy: { id: 'desc' },
          select: { id: true, campaign_id: true, account_name: true },
        });

        if (latestCreated) {
          const signalLink = await prisma.signalContentLink.upsert({
            where: {
              source_kind_source_id: {
                source_kind: signalMapping.sourceKind,
                source_id: signalMapping.sourceId,
              },
            },
            update: {
              account_name: latestCreated.account_name,
              campaign_id: latestCreated.campaign_id,
              generated_content_id: latestCreated.id,
              signal_kind: signalMapping.signalKind,
              signal_context: signalMapping.evidenceSnapshot.signalContext,
              outcome_label: signalMapping.evidenceSnapshot.outcomeLabel,
              send_job_recipient_id: signalMapping.sendJobRecipientId,
              email_log_id: signalMapping.emailLogId,
            },
            create: {
              account_name: latestCreated.account_name,
              campaign_id: latestCreated.campaign_id,
              generated_content_id: latestCreated.id,
              source_kind: signalMapping.sourceKind,
              source_id: signalMapping.sourceId,
              signal_kind: signalMapping.signalKind,
              signal_context: signalMapping.evidenceSnapshot.signalContext,
              outcome_label: signalMapping.evidenceSnapshot.outcomeLabel,
              send_job_recipient_id: signalMapping.sendJobRecipientId,
              email_log_id: signalMapping.emailLogId,
            },
            select: { id: true },
          });

          const previousVersionId = signalMapping.generatedContentId ?? null;
          await prisma.messageEvolutionRegistry.create({
            data: {
              account_name: latestCreated.account_name,
              campaign_id: latestCreated.campaign_id,
              signal_content_link_id: signalLink.id,
              previous_generated_content_id: previousVersionId,
              generated_content_id: latestCreated.id,
              status: 'proposed',
              owner: 'Casey',
              sla_due_at: computeLearningReviewSlaDueAt(new Date(), 'proposed'),
              rationale: `Signal-triggered regeneration from ${signalMapping.sourceKind}:${signalMapping.sourceId}.`,
              evidence_snapshot: {
                signal_kind: signalMapping.signalKind,
                context: signalMapping.evidenceSnapshot.signalContext,
                outcome_label: signalMapping.evidenceSnapshot.outcomeLabel,
              },
              rollback_link: previousVersionId ? `/generated-content?account=${encodeURIComponent(accountName)}&version=${previousVersionId}` : null,
            },
          }).catch(() => undefined);
        }
      }
    } catch {
      // DB offline — skip
    }

    return NextResponse.json({
      content,
      accountName,
      provider: result.provider,
      infographic: {
        type: infographicMetadata.infographicType,
        stage: infographicMetadata.stageIntent,
        bundleId: infographicMetadata.bundleId,
        sequencePosition: infographicMetadata.sequencePosition,
        recommendation: recommendation.rationale,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';

    try {
      const { prisma } = await import('@/lib/prisma');
      const latestVersion = await prisma.generatedContent.findFirst({
        where: {
          account_name: accountName,
          content_type: 'one_pager',
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      await prisma.generatedContent.create({
        data: {
          account_name: accountName,
          content_type: 'one_pager',
          tone: 'professional',
          ai_error: message,
          version: (latestVersion?.version ?? 0) + 1,
          version_metadata: {
            source: 'one_pager_generator',
            failed: true,
            infographic: {
              infographic_type: infographicMetadata.infographicType,
              stage_intent: infographicMetadata.stageIntent,
              bundle_id: infographicMetadata.bundleId,
              sequence_position: infographicMetadata.sequencePosition,
            },
          },
          content: JSON.stringify({ error: message }),
        },
      });
    } catch {
      // DB offline — skip
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
