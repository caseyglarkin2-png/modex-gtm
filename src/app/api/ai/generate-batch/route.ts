import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAccountContext } from '@/lib/db';

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
    ? await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } }).catch(() => null)
    : null;

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
