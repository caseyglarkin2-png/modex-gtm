import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import { prisma } from '@/lib/prisma';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from './client';
import { pipelineStageToHubSpotDealStage, stageToStatus, type PipelineStage } from '@/lib/pipeline';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';

const DEAL_PROPERTIES = ['dealname', 'dealstage', 'amount', 'pipeline', 'closedate'] as const;

export interface EnsureDealInput {
  accountName: string;
  stage: PipelineStage;
  amount?: number;
}

function buildDealName(accountName: string) {
  return `YardFlow - ${accountName}`;
}

export async function upsertDealForAccount(input: EnsureDealInput): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'upsertDealForAccount');

  const client = getHubSpotClient();
  const dealName = buildDealName(input.accountName);
  const dealStage = pipelineStageToHubSpotDealStage(input.stage);
  const amount = String(input.amount ?? 25000);

  const existing = await withHubSpotRetry(
    () =>
      client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [{ propertyName: 'dealname', operator: FilterOperatorEnum.Eq, value: dealName }],
          },
        ],
        properties: [...DEAL_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchDeal:${input.accountName}`,
  ).catch(() => null);

  if (existing?.results?.[0]) {
    const id = existing.results[0].id;
    await withHubSpotRetry(
      () =>
        client.crm.deals.basicApi.update(id, {
          properties: {
            dealname: dealName,
            dealstage: dealStage,
            amount,
            pipeline: 'default',
          },
        }),
      `updateDeal:${id}`,
    ).catch(() => null);
    return id;
  }

  const created = await withHubSpotRetry(
    () =>
      client.crm.deals.basicApi.create({
        properties: {
          dealname: dealName,
          dealstage: dealStage,
          amount,
          pipeline: 'default',
        },
        associations: [],
      }),
    `createDeal:${input.accountName}`,
  ).catch(() => null);

  return created?.id ?? null;
}

export async function ensureLocalMeetingDealLink(accountName: string, stage: PipelineStage) {
  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) return null;

  const dealId = await upsertDealForAccount({
    accountName,
    stage,
    amount: Math.max(10000, (account.priority_score ?? 0) * 1000),
  });

  if (!dealId) return null;

  const latestMeeting = await prisma.meeting.findFirst({
    where: { account_name: accountName },
    orderBy: { created_at: 'desc' },
  });

  if (latestMeeting) {
    await prisma.meeting.update({
      where: { id: latestMeeting.id },
      data: { hubspot_deal_id: dealId },
    }).catch(() => undefined);
  } else if (stage === 'meeting' || stage === 'proposal' || stage === 'closed') {
    await prisma.meeting.create({
      data: {
        account_name: accountName,
        meeting_status: stageToStatus(stage).meetingStatus,
        objective: 'Pipeline deal tracking placeholder',
        hubspot_deal_id: dealId,
      },
    }).catch(() => undefined);
  }

  return dealId;
}
