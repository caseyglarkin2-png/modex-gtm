import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CampaignGenerationContractSchema } from '@/lib/validations';
import { evaluateCampaignGenerationContract } from '@/lib/revops/campaign-generation-contract';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = CampaignGenerationContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;
  const evaluation = evaluateCampaignGenerationContract({
    objective: payload.objective,
    personaHypothesis: payload.personaHypothesis,
    offer: payload.offer,
    proof: payload.proof,
    cta: payload.cta,
    metric: payload.metric,
  });

  const contract = await prisma.campaignGenerationContract.upsert({
    where: { campaign_id: payload.campaignId },
    update: {
      objective: payload.objective,
      persona_hypothesis: payload.personaHypothesis,
      offer: payload.offer,
      proof: payload.proof,
      cta: payload.cta,
      metric: payload.metric,
      quality_score: evaluation.score,
      is_complete: evaluation.isComplete,
      created_by: payload.createdBy ?? 'Casey',
    },
    create: {
      campaign_id: payload.campaignId,
      objective: payload.objective,
      persona_hypothesis: payload.personaHypothesis,
      offer: payload.offer,
      proof: payload.proof,
      cta: payload.cta,
      metric: payload.metric,
      quality_score: evaluation.score,
      is_complete: evaluation.isComplete,
      created_by: payload.createdBy ?? 'Casey',
    },
    select: {
      id: true,
      campaign_id: true,
      quality_score: true,
      is_complete: true,
      updated_at: true,
    },
  });

  return NextResponse.json({
    success: true,
    contract,
    evaluation,
  });
}
