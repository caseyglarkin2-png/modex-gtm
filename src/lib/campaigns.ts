import { prisma } from '@/lib/prisma';

const MODEX_START = new Date('2026-04-01T00:00:00Z');
const MODEX_END = new Date('2026-04-30T23:59:59Z');

export async function ensureDefaultCampaign() {
  const targetAccountCount = await prisma.outreachWave.count();

  const campaign = await prisma.campaign.upsert({
    where: { slug: 'modex-2026-follow-up' },
    update: {
      status: 'active',
      campaign_type: 'trade_show',
      target_account_count: targetAccountCount,
      messaging_angle: 'The yard is the constraint. Use MODEX follow-up to book qualified meetings.',
      key_dates: {
        event: 'MODEX 2026',
        venue: 'Atlanta',
        dates: ['2026-04-13', '2026-04-16'],
      },
      start_date: MODEX_START,
      end_date: MODEX_END,
      owner: 'Casey',
    },
    create: {
      name: 'MODEX 2026 Follow-Up',
      slug: 'modex-2026-follow-up',
      status: 'active',
      campaign_type: 'trade_show',
      start_date: MODEX_START,
      end_date: MODEX_END,
      target_account_count: targetAccountCount,
      messaging_angle: 'The yard is the constraint. Use MODEX follow-up to book qualified meetings.',
      key_dates: {
        event: 'MODEX 2026',
        venue: 'Atlanta',
        dates: ['2026-04-13', '2026-04-16'],
      },
      owner: 'Casey',
    },
  });

  await Promise.all([
    prisma.outreachWave.updateMany({
      where: { campaign_id: null },
      data: { campaign_id: campaign.id },
    }),
    prisma.emailLog.updateMany({
      where: { campaign_id: null, sent_at: { gte: MODEX_START, lte: MODEX_END } },
      data: { campaign_id: campaign.id },
    }),
    prisma.activity.updateMany({
      where: { campaign_id: null, created_at: { gte: MODEX_START, lte: MODEX_END } },
      data: { campaign_id: campaign.id },
    }),
    prisma.generatedContent.updateMany({
      where: { campaign_id: null, created_at: { gte: MODEX_START, lte: MODEX_END } },
      data: { campaign_id: campaign.id },
    }),
  ]);

  return campaign;
}

export async function getCampaignSummaries() {
  await ensureDefaultCampaign();

  return prisma.campaign.findMany({
    include: {
      _count: {
        select: {
          outreach_waves: true,
          email_logs: true,
          activities: true,
          generated_content: true,
        },
      },
    },
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
  });
}
