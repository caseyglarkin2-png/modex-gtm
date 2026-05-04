import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildInfographicEvent, parseInfographicMetadata } from '@/lib/revops/infographic-journey';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ bundleId: string }> },
) {
  const { bundleId } = await params;
  if (!bundleId?.trim()) {
    return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
  }

  const rows = await prisma.generatedContent.findMany({
    where: {
      content_type: 'one_pager',
    },
    select: {
      id: true,
      account_name: true,
      campaign_id: true,
      version_metadata: true,
    },
    take: 800,
  });
  const targetIds = rows
    .filter((row) => parseInfographicMetadata(row.version_metadata).bundleId === bundleId)
    .map((row) => row.id);

  if (targetIds.length === 0) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  await prisma.generatedContent.updateMany({
    where: { id: { in: targetIds } },
    data: {
      is_published: true,
      published_at: new Date(),
    },
  });

  const first = rows.find((row) => targetIds.includes(row.id));
  const meta = first ? parseInfographicMetadata(first.version_metadata) : null;
  if (first && meta) {
    await prisma.activity.create({
      data: {
        account_name: first.account_name,
        campaign_id: first.campaign_id ?? null,
        activity_type: 'Infographic Bundle',
        owner: 'Casey',
        outcome: `Bundle published (${bundleId})`,
        notes: JSON.stringify(buildInfographicEvent('bundle_published', {
          accountName: first.account_name,
          campaignId: first.campaign_id,
          infographic_type: meta.infographicType,
          stage_intent: meta.stageIntent,
          bundle_id: bundleId,
          sequence_position: meta.sequencePosition,
        })),
        activity_date: new Date(),
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({
    success: true,
    bundleId,
    publishedCount: targetIds.length,
  });
}
