import { prisma } from '@/lib/prisma';
import { getCampaignTemplate, type CampaignTemplateKey } from './templates';

interface CampaignDripConfig {
  templateKey: CampaignTemplateKey;
  touchCount: number;
  intervals: number[];
  aiPromptAngle: string;
}

export interface CampaignDripSummary {
  campaignsChecked: number;
  accountsReviewed: number;
  dueCandidates: number;
  activitiesCreated: number;
  skipped: number;
  touchedAccounts: string[];
}

function parseDripConfig(keyDates: unknown): CampaignDripConfig {
  const templateKey =
    keyDates && typeof keyDates === 'object' && !Array.isArray(keyDates) && typeof (keyDates as Record<string, unknown>).templateKey === 'string'
      ? ((keyDates as Record<string, unknown>).templateKey as CampaignTemplateKey)
      : 'trade_show_follow_up';

  const template = getCampaignTemplate(templateKey);
  const rawTouchCount =
    keyDates && typeof keyDates === 'object' && !Array.isArray(keyDates)
      ? Number((keyDates as Record<string, unknown>).touchCount ?? template.defaultTouchCount)
      : template.defaultTouchCount;
  const rawIntervals =
    keyDates && typeof keyDates === 'object' && !Array.isArray(keyDates) && Array.isArray((keyDates as Record<string, unknown>).suggestedIntervals)
      ? ((keyDates as Record<string, unknown>).suggestedIntervals as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : template.suggestedIntervals;

  return {
    templateKey: template.key,
    touchCount: rawTouchCount > 0 ? rawTouchCount : template.defaultTouchCount,
    intervals: rawIntervals.length > 0 ? rawIntervals : template.suggestedIntervals,
    aiPromptAngle:
      keyDates && typeof keyDates === 'object' && !Array.isArray(keyDates) && typeof (keyDates as Record<string, unknown>).aiPromptAngle === 'string'
        ? ((keyDates as Record<string, unknown>).aiPromptAngle as string)
        : template.aiPromptAngle,
  };
}

function getGapDays(intervals: number[], sentCount: number): number {
  if (sentCount <= 0) return 0;
  const currentIndex = Math.min(Math.max(0, sentCount - 1), intervals.length - 1);
  const nextIndex = Math.min(sentCount, intervals.length - 1);
  const currentOffset = intervals[currentIndex] ?? 0;
  const nextOffset = intervals[nextIndex] ?? currentOffset + 3;
  if (nextIndex === currentIndex) {
    return Math.max(1, currentOffset - (intervals[currentIndex - 1] ?? 0) || 3);
  }
  return Math.max(1, nextOffset - currentOffset);
}

export async function runCampaignDripCheck(now = new Date()): Promise<CampaignDripSummary> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'active' },
    include: {
      outreach_waves: { select: { account_name: true } },
      email_logs: {
        orderBy: { sent_at: 'asc' },
        select: { id: true, account_name: true, sent_at: true, reply_count: true },
      },
    },
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
  });

  const summary: CampaignDripSummary = {
    campaignsChecked: campaigns.length,
    accountsReviewed: 0,
    dueCandidates: 0,
    activitiesCreated: 0,
    skipped: 0,
    touchedAccounts: [],
  };

  for (const campaign of campaigns) {
    const config = parseDripConfig(campaign.key_dates);
    const accountNames = [...new Set([
      ...campaign.outreach_waves.map((wave) => wave.account_name),
      ...campaign.email_logs.map((email) => email.account_name).filter(Boolean),
    ])];

    for (const accountName of accountNames) {
      summary.accountsReviewed += 1;

      const logs = campaign.email_logs.filter((email) => email.account_name === accountName);
      const nextTouchNumber = logs.length + 1;

      if (nextTouchNumber > config.touchCount) {
        summary.skipped += 1;
        continue;
      }

      const account = await prisma.account.findUnique({
        where: { name: accountName },
        select: { meeting_status: true, outreach_status: true },
      }).catch(() => null);

      if (logs.some((log) => (log.reply_count ?? 0) > 0) || /booked|held|scheduled/i.test(account?.meeting_status ?? '')) {
        summary.skipped += 1;
        continue;
      }

      const dueAt = logs.length === 0
        ? (campaign.start_date ?? now)
        : new Date(logs[logs.length - 1].sent_at.getTime() + getGapDays(config.intervals, logs.length) * 24 * 60 * 60 * 1000);

      if (dueAt > now) {
        summary.skipped += 1;
        continue;
      }

      summary.dueCandidates += 1;
      const marker = `Campaign drip automation - touch ${nextTouchNumber} - ${campaign.slug}`;

      const existing = await prisma.activity.findFirst({
        where: {
          account_name: accountName,
          campaign_id: campaign.id,
          activity_type: 'Follow-up',
          notes: { contains: marker },
        },
        select: { id: true },
      });

      if (existing) {
        summary.skipped += 1;
        continue;
      }

      await prisma.activity.create({
        data: {
          account_name: accountName,
          campaign_id: campaign.id,
          activity_type: 'Follow-up',
          owner: campaign.owner,
          outcome: nextTouchNumber === 1
            ? `Initial touch ready for ${campaign.name}`
            : `Touch ${nextTouchNumber} is due for ${campaign.name}`,
          next_step: nextTouchNumber === 1
            ? `Send first touch using ${config.templateKey}`
            : `Send touch ${nextTouchNumber} with angle: ${config.aiPromptAngle}`,
          next_step_due: dueAt,
          notes: `${marker}\nIntervals: ${config.intervals.join(', ')} days\nAI angle: ${config.aiPromptAngle}`,
          activity_date: now,
        },
      }).catch(() => undefined);

      summary.activitiesCreated += 1;
      summary.touchedAccounts.push(`${accountName} (touch ${nextTouchNumber})`);
    }
  }

  return summary;
}
