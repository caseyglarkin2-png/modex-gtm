import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  buildInfographicEvent,
  INFOGRAPHIC_TYPES,
  JOURNEY_STAGE_INTENTS,
  mapOutcomeToNextInfographic,
  transitionJourneyState,
  type JourneyTransitionReason,
} from '@/lib/revops/infographic-journey';

const JourneyAdvanceSchema = z.object({
  accountName: z.string().min(1),
  campaignId: z.number().int().positive().optional().nullable(),
  fromStage: z.enum(JOURNEY_STAGE_INTENTS),
  reasonCode: z.enum(['engagement_positive', 'engagement_negative', 'operator_override', 'proposal_requested', 'customer_confirmed', 'stalled']).optional(),
  outcomeLabel: z.string().optional().nullable(),
  signalId: z.string().optional().nullable(),
  queueNextAsset: z.boolean().default(true),
  overrideToStage: z.enum(JOURNEY_STAGE_INTENTS).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = JourneyAdvanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const transition = transitionJourneyState({
    fromStage: payload.fromStage,
    outcomeLabel: payload.outcomeLabel ?? null,
    reasonCode: payload.reasonCode as JourneyTransitionReason | undefined,
  });
  const toStage = payload.overrideToStage ?? transition.toStage;
  const next = mapOutcomeToNextInfographic({
    stageIntent: toStage,
    outcomeLabel: payload.outcomeLabel,
  });

  await prisma.activity.create({
    data: {
      account_name: payload.accountName,
      campaign_id: payload.campaignId ?? null,
      activity_type: 'Infographic Journey',
      owner: 'Casey',
      outcome: `${payload.fromStage} -> ${toStage}`,
      notes: JSON.stringify(buildInfographicEvent('journey_transition', {
        accountName: payload.accountName,
        campaignId: payload.campaignId,
        reasonCode: transition.reasonCode,
        signalId: payload.signalId ?? null,
        infographic_type: next.nextType,
        stage_intent: next.nextStage,
        bundle_id: null,
        sequence_position: null,
      })),
      next_step: `Generate ${next.nextType} for ${next.nextStage} stage`,
      activity_date: new Date(),
    },
  });

  let queuedJobId: number | null = null;
  if (payload.queueNextAsset) {
    const queued = await prisma.generationJob.create({
      data: {
        account_name: payload.accountName,
        campaign_id: payload.campaignId ?? null,
        content_type: 'one_pager',
        status: 'pending',
      },
      select: { id: true },
    });
    queuedJobId = queued.id;
  }

  return NextResponse.json({
    success: true,
    transition: {
      fromStage: payload.fromStage,
      toStage,
      reasonCode: transition.reasonCode,
      nextType: next.nextType,
      nextStage: next.nextStage,
    },
    queuedJobId,
  });
}

export async function GET(req: NextRequest) {
  const accountName = req.nextUrl.searchParams.get('accountName');
  const campaignIdRaw = req.nextUrl.searchParams.get('campaignId');
  const campaignId = campaignIdRaw ? Number.parseInt(campaignIdRaw, 10) : null;

  const activities = await prisma.activity.findMany({
    where: {
      ...(accountName ? { account_name: accountName } : {}),
      ...(Number.isInteger(campaignId) ? { campaign_id: campaignId } : {}),
      activity_type: 'Infographic Journey',
    },
    orderBy: { activity_date: 'desc' },
    take: 120,
    select: {
      id: true,
      account_name: true,
      campaign_id: true,
      outcome: true,
      notes: true,
      next_step: true,
      activity_date: true,
    },
  });

  const timeline = activities.map((activity) => {
    let event: Record<string, unknown> | null = null;
    try {
      event = activity.notes ? (JSON.parse(activity.notes) as Record<string, unknown>) : null;
    } catch {
      event = null;
    }
    const type = typeof event?.infographicType === 'string' && INFOGRAPHIC_TYPES.includes(event.infographicType as typeof INFOGRAPHIC_TYPES[number])
      ? event.infographicType
      : null;
    return {
      id: activity.id,
      accountName: activity.account_name,
      campaignId: activity.campaign_id,
      outcome: activity.outcome,
      nextStep: activity.next_step,
      activityDate: activity.activity_date?.toISOString() ?? null,
      event,
      inferredType: type,
    };
  });

  return NextResponse.json({ timeline });
}
