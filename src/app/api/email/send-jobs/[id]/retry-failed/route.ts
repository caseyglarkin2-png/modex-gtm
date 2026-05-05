import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'Invalid send job id' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const existing = await prisma.sendJob.findUnique({
    where: { id: numericId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Send job not found' }, { status: 404 });
  }

  const resetResult = await prisma.sendJobRecipient.updateMany({
    where: {
      send_job_id: numericId,
      status: { in: ['failed', 'skipped'] },
    },
    data: {
      status: 'pending',
      error_message: null,
      attempted_at: null,
    },
  });

  await prisma.sendJob.update({
    where: { id: numericId },
    data: {
      status: 'pending',
      started_at: null,
      completed_at: null,
      failed_count: 0,
      skipped_count: 0,
      error_message: null,
    },
  });

  return NextResponse.json({
    success: true,
    resetRecipients: resetResult.count,
  });
}
