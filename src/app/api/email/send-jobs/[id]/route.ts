import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'Invalid send job id' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const sendJob = await prisma.sendJob.findUnique({
    where: { id: numericId },
    select: {
      id: true,
      status: true,
      requested_by: true,
      total_recipients: true,
      sent_count: true,
      failed_count: true,
      skipped_count: true,
      error_message: true,
      started_at: true,
      completed_at: true,
      created_at: true,
      updated_at: true,
      recipients: {
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          generated_content_id: true,
          account_name: true,
          persona_name: true,
          to_email: true,
          status: true,
          error_message: true,
          provider_message_id: true,
          hubspot_engagement_id: true,
          email_log_id: true,
          attempted_at: true,
          sent_at: true,
          created_at: true,
        },
      },
    },
  });

  if (!sendJob) {
    return NextResponse.json({ error: 'Send job not found' }, { status: 404 });
  }

  const recipientCounts = sendJob.recipients.reduce<Record<string, number>>((acc, recipient) => {
    acc[recipient.status] = (acc[recipient.status] ?? 0) + 1;
    return acc;
  }, {});
  const generatedContentIds = Array.from(new Set(sendJob.recipients.map((recipient) => recipient.generated_content_id)));

  return NextResponse.json({
    success: true,
    job: sendJob,
    recipientCounts,
    generatedContentIds,
  });
}
