'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { derivePipelineStage, nextPipelineStage, stageToStatus, type PipelineStage } from '@/lib/pipeline';

export async function moveAccountToStage(accountName: string, stage: PipelineStage) {
  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) return { success: false, error: 'Account not found' };

  const mapped = stageToStatus(stage);

  await prisma.account.update({
    where: { name: accountName },
    data: {
      pipeline_stage: stage,
      outreach_status: mapped.outreachStatus,
      meeting_status: mapped.meetingStatus,
      current_motion: `Pipeline stage: ${stage}`,
    },
  });

  if (stage === 'meeting' || stage === 'proposal' || stage === 'closed') {
    const latestMeeting = await prisma.meeting.findFirst({
      where: { account_name: accountName },
      orderBy: { created_at: 'desc' },
    });

    if (latestMeeting) {
      await prisma.meeting.update({
        where: { id: latestMeeting.id },
        data: { meeting_status: mapped.meetingStatus },
      }).catch(() => undefined);
    }
  }

  await prisma.activity.create({
    data: {
      account_name: accountName,
      activity_type: 'Pipeline',
      owner: 'System',
      outcome: `Moved to ${stage}`,
      next_step: stage === 'closed' ? 'Celebrate and expand' : `Advance to ${nextPipelineStage(stage)}`,
      activity_date: new Date(),
    },
  }).catch(() => undefined);

  const hubspotDealId = await ensureLocalMeetingDealLink(accountName, stage).catch(() => null);

  revalidatePath('/pipeline');
  revalidatePath('/');
  revalidatePath('/analytics');
  revalidatePath(`/accounts/${accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

  return { success: true, hubspotDealId };
}

export async function syncAccountDeal(accountName: string) {
  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) return { success: false, error: 'Account not found' };

  const dealId = await ensureLocalMeetingDealLink(
    accountName,
    derivePipelineStage({
      pipeline_stage: account.pipeline_stage,
      outreach_status: account.outreach_status,
      meeting_status: account.meeting_status,
    }),
  ).catch(() => null);

  revalidatePath('/pipeline');
  revalidatePath('/analytics');

  return { success: true, dealId };
}
