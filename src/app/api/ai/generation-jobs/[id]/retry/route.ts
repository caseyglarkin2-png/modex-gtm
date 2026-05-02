import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = Number(id);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ error: 'Invalid generation job id' }, { status: 400 });
  }

  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, retry_count: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'Generation job not found' }, { status: 404 });
  }

  if (job.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed jobs can be retried' }, { status: 409 });
  }

  if (job.retry_count >= 3) {
    return NextResponse.json({ error: 'Retry limit reached' }, { status: 409 });
  }

  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: 'pending',
      error_message: null,
      started_at: null,
      completed_at: null,
      provider_used: null,
    },
  });

  return NextResponse.json({ success: true, id: job.id });
}
