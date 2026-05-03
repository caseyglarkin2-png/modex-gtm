import { prisma } from '@/lib/prisma';
import { buildWorkQueueItems, parseWorkQueueTab } from '@/lib/work-queue';
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

  const [activities, captures, approvals, generationJobs, sendJobs] = await Promise.all([
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
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const initialItems = buildWorkQueueItems({
    activities,
    captures,
    approvals,
    generationJobs,
    sendJobs,
  });

  return <WorkQueueClient initialItems={initialItems} defaultTab={defaultTab} />;
}
