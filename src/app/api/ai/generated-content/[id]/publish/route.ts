import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeLearningReviewSlaDueAt } from '@/lib/revops/engagement-learning';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const contentId = Number(id);

  if (!Number.isInteger(contentId) || contentId <= 0) {
    return NextResponse.json({ error: 'Invalid generated content id' }, { status: 400 });
  }

  const existing = await prisma.generatedContent.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      account_name: true,
      content_type: true,
      campaign_id: true,
      version: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Generated content not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.generatedContent.updateMany({
      where: {
        account_name: existing.account_name,
        content_type: existing.content_type,
        campaign_id: existing.campaign_id,
        id: { not: existing.id },
      },
      data: {
        is_published: false,
        published_at: null,
      },
    }),
    prisma.generatedContent.update({
      where: { id: existing.id },
      data: {
        is_published: true,
        published_at: new Date(),
      },
    }),
  ]);

  const priorVersion = await prisma.generatedContent.findFirst({
    where: {
      account_name: existing.account_name,
      content_type: existing.content_type,
      campaign_id: existing.campaign_id,
      version: { lt: existing.version },
    },
    orderBy: { version: 'desc' },
    select: { id: true },
  });

  const reviewCandidate = await prisma.messageEvolutionRegistry.findFirst({
    where: {
      generated_content_id: existing.id,
      status: { in: ['approved', 'proposed', 'in-review'] },
    },
    orderBy: { created_at: 'desc' },
    select: { id: true, status: true, rationale: true, evidence_snapshot: true, owner: true },
  });

  if (reviewCandidate) {
    await prisma.messageEvolutionRegistry.update({
      where: { id: reviewCandidate.id },
      data: {
        status: 'deployed',
        deployed_at: new Date(),
        reviewed_at: reviewCandidate.status === 'approved' ? undefined : new Date(),
        reviewed_by: reviewCandidate.status === 'approved' ? undefined : 'Casey',
        sla_due_at: computeLearningReviewSlaDueAt(new Date(), 'deployed'),
        rollback_link: priorVersion ? `/generated-content?account=${encodeURIComponent(existing.account_name)}&version=${priorVersion.id}` : null,
      },
    });
  } else {
    await prisma.messageEvolutionRegistry.create({
      data: {
        account_name: existing.account_name,
        campaign_id: existing.campaign_id,
        previous_generated_content_id: priorVersion?.id ?? null,
        generated_content_id: existing.id,
        status: 'deployed',
        owner: 'Casey',
        reviewed_by: 'Casey',
        reviewed_at: new Date(),
        deployed_at: new Date(),
        sla_due_at: computeLearningReviewSlaDueAt(new Date(), 'deployed'),
        rationale: `Published generated content v${existing.version}.`,
        evidence_snapshot: { source: 'publish-route' },
        rollback_link: priorVersion ? `/generated-content?account=${encodeURIComponent(existing.account_name)}&version=${priorVersion.id}` : null,
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({ success: true, id: existing.id });
}
