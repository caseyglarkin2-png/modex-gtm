import { NextRequest, NextResponse } from 'next/server';
import { OperatorOutcomeSchema } from '@/lib/validations';
import { parseOperatorOutcomeLabel } from '@/lib/revops/operator-outcomes';
import { buildSignalToContentMapping, computeLearningReviewSlaDueAt } from '@/lib/revops/engagement-learning';
import { buildInfographicEvent, mapOutcomeToNextInfographic, parseInfographicMetadata } from '@/lib/revops/infographic-journey';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = OperatorOutcomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const outcomeLabel = parseOperatorOutcomeLabel(payload.outcomeLabel);
  if (!outcomeLabel) {
    return NextResponse.json({ error: 'Invalid outcome label' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const accountExists = await prisma.account.findUnique({
    where: { name: payload.accountName },
    select: { name: true },
  });
  if (!accountExists) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const existing = await prisma.operatorOutcome.findUnique({
    where: {
      source_kind_source_id_outcome_label: {
        source_kind: payload.sourceKind,
        source_id: payload.sourceId,
        outcome_label: outcomeLabel,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ success: true, deduped: true, outcomeId: existing.id });
  }

  const created = await prisma.operatorOutcome.create({
    data: {
      account_name: payload.accountName,
      campaign_id: payload.campaignId ?? null,
      generated_content_id: payload.generatedContentId ?? null,
      outcome_label: outcomeLabel,
      source_kind: payload.sourceKind,
      source_id: payload.sourceId,
      notes: payload.notes?.trim() ? payload.notes : null,
      created_by: payload.createdBy ?? null,
    },
    select: { id: true },
  });

  await prisma.activity.create({
    data: {
      account_name: payload.accountName,
      activity_type: 'Outcome',
      owner: payload.createdBy ?? 'Casey',
      outcome: `Operator outcome logged: ${outcomeLabel}`,
      next_step: outcomeLabel === 'positive' || outcomeLabel === 'closed-won'
        ? 'Advance sequence and propose next milestone'
        : outcomeLabel === 'wrong-person'
          ? 'Replace contact with correct buyer'
          : 'Refine messaging and follow up',
      notes: `operator-outcome:${payload.sourceKind}:${payload.sourceId}:${outcomeLabel}`,
      activity_date: new Date(),
    },
  }).catch(() => undefined);

  const mapping = buildSignalToContentMapping({
    sourceKind: payload.sourceKind,
    sourceId: payload.sourceId,
    accountName: payload.accountName,
    campaignId: payload.campaignId,
    generatedContentId: payload.generatedContentId,
    outcomeLabel,
    signalContext: payload.notes ?? null,
  });

  await prisma.signalContentLink.upsert({
    where: {
      source_kind_source_id: {
        source_kind: mapping.sourceKind,
        source_id: mapping.sourceId,
      },
    },
    update: {
      account_name: mapping.accountName,
      campaign_id: mapping.campaignId,
      generated_content_id: mapping.generatedContentId,
      signal_kind: mapping.signalKind,
      signal_context: mapping.evidenceSnapshot.signalContext,
      outcome_label: mapping.evidenceSnapshot.outcomeLabel,
    },
    create: {
      account_name: mapping.accountName,
      campaign_id: mapping.campaignId,
      generated_content_id: mapping.generatedContentId,
      source_kind: mapping.sourceKind,
      source_id: mapping.sourceId,
      signal_kind: mapping.signalKind,
      signal_context: mapping.evidenceSnapshot.signalContext,
      outcome_label: mapping.evidenceSnapshot.outcomeLabel,
    },
    select: { id: true },
  }).catch(() => undefined);

  if (payload.generatedContentId) {
    const generated = await prisma.generatedContent.findUnique({
      where: { id: payload.generatedContentId },
      select: {
        account_name: true,
        campaign_id: true,
        version_metadata: true,
      },
    }).catch(() => null);
    const metadata = parseInfographicMetadata(generated?.version_metadata);
    if (metadata.bundleId && ['positive', 'neutral', 'closed-won'].includes(outcomeLabel)) {
      await prisma.activity.create({
        data: {
          account_name: generated?.account_name ?? payload.accountName,
          campaign_id: generated?.campaign_id ?? payload.campaignId ?? null,
          activity_type: 'Infographic Bundle',
          owner: payload.createdBy ?? 'Casey',
          outcome: `Bundle engaged (${metadata.bundleId})`,
          notes: JSON.stringify(buildInfographicEvent('bundle_engaged', {
            accountName: generated?.account_name ?? payload.accountName,
            campaignId: generated?.campaign_id ?? payload.campaignId ?? null,
            infographic_type: metadata.infographicType,
            stage_intent: metadata.stageIntent,
            bundle_id: metadata.bundleId,
            sequence_position: metadata.sequencePosition,
          })),
          activity_date: new Date(),
        },
      }).catch(() => undefined);
    }
  }

  if (['negative', 'wrong-person', 'bad-timing', 'closed-lost'].includes(outcomeLabel)) {
    await prisma.activity.create({
      data: {
        account_name: payload.accountName,
        campaign_id: payload.campaignId ?? null,
        activity_type: 'Follow-up',
        owner: payload.createdBy ?? 'Casey',
        outcome: `Content revision required from ${outcomeLabel}`,
        next_step: 'Regenerate from signal and review diff before publish.',
        next_step_due: computeLearningReviewSlaDueAt(new Date(), 'proposed'),
        notes: `content-revision-required:${payload.sourceKind}:${payload.sourceId}:${outcomeLabel}`,
        activity_date: new Date(),
      },
    }).catch(() => undefined);
  }

  const latestJourney = await prisma.activity.findFirst({
    where: {
      account_name: payload.accountName,
      activity_type: 'Infographic Journey',
    },
    orderBy: { activity_date: 'desc' },
    select: {
      outcome: true,
      notes: true,
    },
  }).catch(() => null);
  const inferredStage = (() => {
    const stageMatch = latestJourney?.outcome?.match(/->\s*([a-z]+)/i);
    if (!stageMatch?.[1]) return 'cold';
    const candidate = stageMatch[1].toLowerCase();
    return ['cold', 'engaged', 'discovery', 'evaluation', 'proposal', 'customer'].includes(candidate)
      ? candidate
      : 'cold';
  })();
  const nextInfographic = mapOutcomeToNextInfographic({
    stageIntent: inferredStage as 'cold' | 'engaged' | 'discovery' | 'evaluation' | 'proposal' | 'customer',
    outcomeLabel,
  });
  await prisma.activity.create({
    data: {
      account_name: payload.accountName,
      campaign_id: payload.campaignId ?? null,
      activity_type: 'Infographic Journey',
      owner: payload.createdBy ?? 'Casey',
      outcome: `${inferredStage} -> ${nextInfographic.nextStage}`,
      next_step: `Generate ${nextInfographic.nextType} for ${nextInfographic.nextStage}`,
      notes: `reason:${nextInfographic.reasonCode};source:${payload.sourceKind}:${payload.sourceId}`,
      activity_date: new Date(),
    },
  }).catch(() => undefined);
  await prisma.generationJob.create({
    data: {
      account_name: payload.accountName,
      campaign_id: payload.campaignId ?? null,
      content_type: 'one_pager',
      status: 'pending',
    },
  }).catch(() => undefined);

  return NextResponse.json({ success: true, deduped: false, outcomeId: created.id });
}
