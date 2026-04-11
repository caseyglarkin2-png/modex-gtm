'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreateCampaignSchema } from '@/lib/validations';
import { getCampaignTemplate } from '@/lib/campaigns/templates';

function slugifyCampaignName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 2;

  while (await prisma.campaign.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function parseOptionalDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createCampaignAction(formData: FormData) {
  const parsed = CreateCampaignSchema.safeParse({
    name: formData.get('name'),
    template_key: formData.get('template_key'),
    campaign_type: formData.get('campaign_type'),
    status: formData.get('status'),
    owner: formData.get('owner'),
    target_account_count: formData.get('target_account_count'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    messaging_angle: formData.get('messaging_angle'),
    key_dates: formData.get('key_dates'),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid campaign input');
  }

  const data = parsed.data;
  const template = getCampaignTemplate(data.template_key);
  const baseSlug = slugifyCampaignName(data.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const defaultTargetCount = await prisma.account.count({
    where: { priority_band: { in: ['A', 'B', 'C'] } },
  }).catch(() => template.defaultTargetAccounts);

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      slug,
      status: data.status,
      campaign_type: data.campaign_type,
      start_date: parseOptionalDate(data.start_date),
      end_date: parseOptionalDate(data.end_date),
      target_account_count: data.target_account_count > 0 ? data.target_account_count : defaultTargetCount,
      messaging_angle: data.messaging_angle || template.defaultMessagingAngle,
      owner: data.owner || 'Casey',
      key_dates: {
        notes: data.key_dates || null,
        templateKey: template.key,
        touchCount: template.defaultTouchCount,
        suggestedIntervals: template.suggestedIntervals,
        aiPromptAngle: template.aiPromptAngle,
        requiredFields: template.requiredFields,
      },
    },
  });

  revalidatePath('/campaigns');
  revalidatePath('/analytics');
  revalidatePath('/analytics/quarterly');

  redirect(`/campaigns/${campaign.slug}`);
}
