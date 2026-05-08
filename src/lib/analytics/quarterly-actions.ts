'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function saveQuarterlyGoals(formData: FormData) {
  const quarter = String(formData.get('quarter') ?? '').trim();
  const year = String(formData.get('year') ?? '').trim();
  const meetingTarget = Number(formData.get('meeting_target') ?? 0);
  const pipelineTarget = Number(formData.get('pipeline_target') ?? 0);

  if (!quarter || !year) {
    throw new Error('Quarter and year are required');
  }

  const value = JSON.stringify({
    meetingTarget: Number.isFinite(meetingTarget) ? meetingTarget : 0,
    pipelineTarget: Number.isFinite(pipelineTarget) ? pipelineTarget : 0,
  });

  await prisma.systemConfig.upsert({
    where: { key: `quarterly-goals:${year}-${quarter}` },
    update: { value },
    create: { key: `quarterly-goals:${year}-${quarter}`, value },
  });

  revalidatePath('/analytics');
}
