'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreateCampaignSchema, UpdateCampaignSettingsSchema, type UpdateCampaignSettingsInput } from '@/lib/validations';
import { getCampaignTemplate } from '@/lib/campaigns/templates';

function extractCampaignSettings(keyDates: unknown) {
  if (!keyDates || typeof keyDates !== 'object' || Array.isArray(keyDates)) return {} as Record<string, unknown>;
  return keyDates as Record<string, unknown>;
}

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

function parseSuggestedIntervals(input: string) {
  const values = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0);
  return values.length > 0 ? values : [0, 3, 7, 14];
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

export async function pauseCampaignAutomationAction(slug: string) {
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, key_dates: true } });
  if (!campaign) return { success: false, error: 'Campaign not found' };

  const settings = extractCampaignSettings(campaign.key_dates);

  await prisma.campaign.update({
    where: { slug },
    data: {
      status: 'paused',
      key_dates: {
        ...settings,
        automationPaused: true,
      },
    },
  });

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${slug}`);
  revalidatePath(`/campaigns/${slug}/analytics`);
  return { success: true };
}

export async function resumeCampaignAutomationAction(slug: string) {
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, key_dates: true } });
  if (!campaign) return { success: false, error: 'Campaign not found' };

  const settings = extractCampaignSettings(campaign.key_dates);

  await prisma.campaign.update({
    where: { slug },
    data: {
      status: 'active',
      key_dates: {
        ...settings,
        automationPaused: false,
      },
    },
  });

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${slug}`);
  revalidatePath(`/campaigns/${slug}/analytics`);
  return { success: true };
}

export async function resetCampaignDripQueueAction(slug: string) {
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true } });
  if (!campaign) return { success: false, error: 'Campaign not found' };

  const deleted = await prisma.activity.deleteMany({
    where: {
      campaign_id: campaign.id,
      activity_type: 'Follow-up',
      notes: { contains: `Campaign drip automation - touch` },
    },
  });

  revalidatePath('/activities');
  revalidatePath(`/campaigns/${slug}`);
  revalidatePath('/admin/crons');
  return { success: true, cleared: deleted.count };
}

export async function updateCampaignSettingsAction(slug: string, input: UpdateCampaignSettingsInput) {
  const parsed = UpdateCampaignSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid campaign settings' };
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { key_dates: true } });
  if (!campaign) return { success: false, error: 'Campaign not found' };

  const settings = extractCampaignSettings(campaign.key_dates);
  const intervals = parseSuggestedIntervals(parsed.data.suggested_intervals);

  await prisma.campaign.update({
    where: { slug },
    data: {
      name: parsed.data.name,
      owner: parsed.data.owner,
      status: parsed.data.status,
      target_account_count: parsed.data.target_account_count,
      messaging_angle: parsed.data.messaging_angle || null,
      key_dates: {
        ...settings,
        touchCount: parsed.data.touch_count,
        suggestedIntervals: intervals,
      },
    },
  });

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${slug}`);
  revalidatePath(`/campaigns/${slug}/analytics`);
  revalidatePath('/analytics');

  return { success: true };
}

export async function deleteCampaignAction(slug: string, confirmationName: string) {
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!campaign) return { success: false, error: 'Campaign not found' };
  if (slug === 'modex-2026-follow-up') {
    return { success: false, error: 'The default system campaign cannot be deleted from this screen' };
  }
  if (confirmationName.trim() !== campaign.name) {
    return { success: false, error: 'Type the exact campaign name to confirm deletion' };
  }

  await prisma.outreachWave.updateMany({ where: { campaign_id: campaign.id }, data: { campaign_id: null } });
  await prisma.emailLog.updateMany({ where: { campaign_id: campaign.id }, data: { campaign_id: null } });
  await prisma.activity.updateMany({ where: { campaign_id: campaign.id }, data: { campaign_id: null } });
  await prisma.generatedContent.updateMany({ where: { campaign_id: campaign.id }, data: { campaign_id: null } });
  await prisma.campaign.delete({ where: { id: campaign.id } });

  revalidatePath('/campaigns');
  revalidatePath('/analytics');
  revalidatePath('/analytics/quarterly');
  return { success: true };
}
