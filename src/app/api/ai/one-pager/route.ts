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
import { getAgentContentContext, toAgentMetadata } from '@/lib/agent-actions/content-context';
import {
  COLD_OUTBOUND_PROMPT_POLICY_VERSION,
  getCtaPolicy,
  getOnePagerSuggestedNextStep,
} from '@/lib/revops/cold-outbound-policy';
import { buildGenerationInputContract } from '@/lib/agent-actions/generation-input';
import { resolveCanonicalAccountScope } from '@/lib/revops/account-identity';

export const dynamic = 'force-dynamic';

const OnePagerRequestSchema = z.object({
  accountName: z.string().min(1),
  campaignSlug: z.string().optional(),
  stageIntent: z.enum(JOURNEY_STAGE_INTENTS).optional(),
  infographicType: z.enum(INFOGRAPHIC_TYPES).optional(),
  bundleId: z.string().max(128).optional().nullable(),
  sequencePosition: z.number().int().min(1).max(50).optional().nullable(),
  regeneration: SignalRegenerationSchema.optional(),
  useLiveIntel: z.boolean().optional().default(false),
  refreshContext: z.boolean().optional().default(false),
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
    accountName: requestedAccountName,
    campaignSlug,
    stageIntent,
    infographicType,
    bundleId,
    sequencePosition,
    regeneration,
    useLiveIntel,
    refreshContext,
  } = parsed.data;
  const canonicalScope = await resolveCanonicalAccountScope(requestedAccountName);
  const persistedAccountName = canonicalScope.accountNames[0] ?? requestedAccountName;
  const { account, meetingBrief } = await getAccountContext(persistedAccountName, canonicalScope.accountNames);
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
  const agentContext = useLiveIntel
    ? await getAgentContentContext({ accountName: persistedAccountName, accountNames: canonicalScope.accountNames, refresh: refreshContext })
    : null;
  const ctaPolicy = getCtaPolicy('one_pager', 'one_pager');
  const generationInput = buildGenerationInputContract(agentContext, ctaPolicy.ctaMode);
  ctx.agentContextSummary = agentContext?.summary;
  ctx.agentNextActions = agentContext?.nextActions;
  ctx.generationInput = generationInput;

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
        accountName: persistedAccountName,
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
        accountName: persistedAccountName,
        requestedAccountName,
        accountScope: canonicalScope.accountNames,
        agentContext: toAgentMetadata(agentContext, ctaPolicy.ctaMode),
        generationInput,
        error: 'Failed to parse structured content — raw text returned',
      });
    }
    if (content && typeof content === 'object' && !Array.isArray(content)) {
      const record = content as Record<string, unknown>;
      if (!record.suggestedNextStep || typeof record.suggestedNextStep !== 'string') {
        record.suggestedNextStep = getOnePagerSuggestedNextStep(persistedAccountName);
      }
    }

    // Best-effort save to DB
    try {
      const { prisma } = await import('@/lib/prisma');
      const latestVersion = await prisma.generatedContent.findFirst({
        where: {
          account_name: persistedAccountName,
          content_type: 'one_pager',
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const templateQuality = evaluateInfographicTemplateQuality(selectedType, JSON.stringify(content));
      await prisma.generatedContent.create({
        data: {
          account_name: persistedAccountName,
          content_type: 'one_pager',
          tone: 'professional',
          provider_used: result.provider,
          version: (latestVersion?.version ?? 0) + 1,
          version_metadata: {
            source: 'one_pager_generator',
            prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
            cta_mode: ctaPolicy.ctaMode,
            agent_context_summary: generationInput?.account_brief ?? agentContext?.summary ?? null,
            agent_context_freshness: generationInput?.freshness ?? null,
            generation_input_contract: generationInput,
            model_provider: result.provider,
            agentContext: toAgentMetadata(agentContext, ctaPolicy.ctaMode),
            provenance: {
              requested_account_name: requestedAccountName,
              persisted_account_name: persistedAccountName,
              scoped_account_names: canonicalScope.accountNames,
              used_live_intel: useLiveIntel,
              generated_at: new Date().toISOString(),
              signal_count: generationInput?.signals.length ?? 0,
              recommended_contact_count: generationInput?.recommended_contacts.length ?? 0,
              committee_gap_count: generationInput?.committee_gaps.length ?? 0,
              freshness_status: generationInput?.freshness.status ?? null,
            },
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
          account_name: persistedAccountName,
          campaign_id: campaign?.id ?? null,
          activity_type: 'Infographic',
          owner: 'Casey',
          outcome: `Generated ${selectedType} (${selectedStage})`,
          notes: JSON.stringify(buildInfographicEvent('bundle_created', {
            accountName: persistedAccountName,
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
            account_name: persistedAccountName,
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
              rollback_link: previousVersionId ? `/generated-content?account=${encodeURIComponent(persistedAccountName)}&version=${previousVersionId}` : null,
            },
          }).catch(() => undefined);
        }
      }
    } catch {
      // DB offline — skip
    }

    return NextResponse.json({
      content,
      accountName: persistedAccountName,
      requestedAccountName,
      accountScope: canonicalScope.accountNames,
      provider: result.provider,
      agentContext: toAgentMetadata(agentContext, ctaPolicy.ctaMode),
      generationInput,
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
          account_name: persistedAccountName,
          content_type: 'one_pager',
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      await prisma.generatedContent.create({
        data: {
          account_name: persistedAccountName,
          content_type: 'one_pager',
          tone: 'professional',
          ai_error: message,
          version: (latestVersion?.version ?? 0) + 1,
          version_metadata: {
            source: 'one_pager_generator',
            failed: true,
            prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
            cta_mode: ctaPolicy.ctaMode,
            agent_context_summary: generationInput?.account_brief ?? agentContext?.summary ?? null,
            agent_context_freshness: generationInput?.freshness ?? null,
            generation_input_contract: generationInput,
            agentContext: toAgentMetadata(agentContext, ctaPolicy.ctaMode),
            provenance: {
              requested_account_name: requestedAccountName,
              persisted_account_name: persistedAccountName,
              scoped_account_names: canonicalScope.accountNames,
              used_live_intel: useLiveIntel,
              generated_at: new Date().toISOString(),
              signal_count: generationInput?.signals.length ?? 0,
              recommended_contact_count: generationInput?.recommended_contacts.length ?? 0,
              committee_gap_count: generationInput?.committee_gaps.length ?? 0,
              freshness_status: generationInput?.freshness.status ?? null,
            },
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

    return NextResponse.json({ error: message, agentContext: toAgentMetadata(agentContext, ctaPolicy.ctaMode), generationInput }, { status: 500 });
  }
}
