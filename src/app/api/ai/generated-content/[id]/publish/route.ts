import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  return NextResponse.json({ success: true, id: existing.id });
}
