import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAccountContext } from '@/lib/db';
import { isGenerationContractPolicyEnabled } from '@/lib/revops/campaign-generation-contract';

export const dynamic = 'force-dynamic';

const BatchGenerationSchema = z.object({
  accountNames: z.array(z.string().min(1)).min(1),
  campaignSlug: z.string().optional(),
  personaName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BatchGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accountNames, campaignSlug, personaName } = parsed.data;
  const batchId = crypto.randomUUID();
  const campaign = campaignSlug
    ? await prisma.campaign.findUnique({
      where: { slug: campaignSlug },
      select: {
        id: true,
        key_dates: true,
        generation_contract: {
          select: {
            is_complete: true,
            quality_score: true,
          },
        },
      },
    }).catch(() => null)
    : null;
  if (campaign && isGenerationContractPolicyEnabled(campaign.key_dates) && !campaign.generation_contract?.is_complete) {
    return NextResponse.json({
      error: 'Campaign brief contract is required and incomplete for this campaign.',
      contractQualityScore: campaign.generation_contract?.quality_score ?? 0,
    }, { status: 409 });
  }

  const createdJobs: Array<{ id: number; accountName: string }> = [];
  const skipped: string[] = [];

  for (const accountName of accountNames) {
    const { account } = await getAccountContext(accountName);
    if (!account) {
      skipped.push(accountName);
      continue;
    }

    const job = await prisma.generationJob.create({
      data: {
        account_name: account.name,
        campaign_id: campaign?.id,
        persona_name: personaName ?? null,
        content_type: 'one_pager',
        batch_id: batchId,
      },
    });

    createdJobs.push({ id: job.id, accountName: account.name });
  }

  return NextResponse.json({ batchId, createdJobs, skipped });
}
