import { prisma } from '@/lib/prisma';
import { buildWorkQueueItems, parseWorkQueueTab } from '@/lib/work-queue';
import { auditOperatorOutcomeQuality } from '@/lib/revops/operator-outcomes';
import { WorkQueueClient } from './work-queue-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Work Queue' };

type SearchParams = {
  tab?: string;
};

export default async function QueuePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const defaultTab = parseWorkQueueTab(params.tab);

  const [activities, captures, notificationApprovals, sendApprovalRequests, generationJobs, sendJobs, operatorOutcomes, messageEvolutions] = await Promise.all([
    prisma.activity.findMany({
      where: {
        OR: [
          { next_step: { not: null } },
          { activity_type: { contains: 'follow-up', mode: 'insensitive' } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 120,
      select: {
        id: true,
        account_name: true,
        activity_type: true,
        next_step: true,
        outcome: true,
        next_step_due: true,
        notes: true,
        created_at: true,
      },
    }),
    prisma.mobileCapture.findMany({
      orderBy: { created_at: 'desc' },
      take: 120,
      select: {
        id: true,
        account_name: true,
        persona_name: true,
        notes: true,
        heat_score: true,
        due_date: true,
        followup_status: true,
        created_at: true,
      },
    }),
    prisma.notification.findMany({
      where: {
        type: { contains: 'approval', mode: 'insensitive' },
      },
      orderBy: { created_at: 'desc' },
      take: 80,
      select: {
        id: true,
        type: true,
        account_name: true,
        subject: true,
        preview: true,
        read: true,
        created_at: true,
      },
    }),
    prisma.sendApprovalRequest.findMany({
      where: {
        status: { in: ['pending', 'approved', 'rejected'] },
      },
      orderBy: { created_at: 'desc' },
      take: 120,
      select: {
        id: true,
        channel: true,
        account_name: true,
        risk_score: true,
        risk_reasons: true,
        status: true,
        comment: true,
        requested_by: true,
        sla_due_at: true,
        created_at: true,
      },
    }),
    prisma.generationJob.findMany({
      where: {
        status: { in: ['pending', 'processing', 'failed'] },
      },
      orderBy: { created_at: 'desc' },
      take: 160,
      select: {
        id: true,
        account_name: true,
        status: true,
        retry_count: true,
        error_message: true,
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        created_at: true,
        updated_at: true,
        started_at: true,
      },
    }),
    prisma.sendJob.findMany({
      where: {
        OR: [
          { status: { in: ['pending', 'processing', 'failed', 'partial'] } },
          { failed_count: { gt: 0 } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 120,
      select: {
        id: true,
        status: true,
        failed_count: true,
        error_message: true,
        send_strategy: true,
        created_at: true,
        updated_at: true,
        started_at: true,
        recipients: {
          where: { status: 'failed' },
          take: 5,
          select: {
            account_name: true,
            status: true,
            error_message: true,
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.operatorOutcome.findMany({
      orderBy: { created_at: 'desc' },
      take: 300,
      select: {
        id: true,
        account_name: true,
        campaign_id: true,
        generated_content_id: true,
        outcome_label: true,
        source_kind: true,
        source_id: true,
        notes: true,
        created_at: true,
      },
    }),
    prisma.messageEvolutionRegistry.findMany({
      where: {
        status: { in: ['proposed', 'in-review', 'approved', 'deployed'] },
      },
      orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
      take: 120,
      select: {
        id: true,
        account_name: true,
        campaign_id: true,
        generated_content_id: true,
        status: true,
        owner: true,
        sla_due_at: true,
        rationale: true,
        created_at: true,
      },
    }),
  ]);
  const approvals = [
    ...notificationApprovals.map((item) => ({
      id: `notification-${item.id}`,
      type: item.type,
      account_name: item.account_name,
      subject: item.subject,
      preview: item.preview,
      read: item.read,
      created_at: item.created_at,
      channel: null,
      risk_score: null,
      risk_reasons: [],
      status: item.read ? 'viewed' : 'pending',
      comment: null,
      sla_due_at: null,
    })),
    ...sendApprovalRequests.map((item) => ({
      id: item.id,
      type: 'send_approval_request',
      account_name: item.account_name,
      subject: `Send approval (${item.channel})`,
      preview: item.comment ?? `Approval requested by ${item.requested_by ?? 'unknown'}`,
      read: item.status !== 'pending',
      created_at: item.created_at,
      channel: item.channel,
      risk_score: item.risk_score,
      risk_reasons: item.risk_reasons,
      status: item.status,
      comment: item.comment,
      sla_due_at: item.sla_due_at,
    })),
  ];
  const outcomeAudits = auditOperatorOutcomeQuality(operatorOutcomes);

  const initialItems = buildWorkQueueItems({
    activities,
    captures,
    approvals,
    generationJobs,
    sendJobs,
    outcomeAudits,
    messageEvolutions,
  });

  return <WorkQueueClient initialItems={initialItems} defaultTab={defaultTab} />;
}
