import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import { prisma } from '@/lib/prisma';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from './client';
import { pipelineStageToHubSpotDealStage, stageToStatus, type PipelineStage } from '@/lib/pipeline';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/AssociationSpec';

const DEAL_PROPERTIES = ['dealname', 'dealstage', 'amount', 'pipeline', 'closedate'] as const;

/**
 * Default owner stamped onto deals THIS engine creates, so GTM-generated
 * opportunities never land ownerless (the unassigned-deal pileup that had to be
 * cleaned up by hand). Overridable via env for owner rotation; falls back to
 * Casey (founding AE, owner id 85093129). Applied on CREATE only — updates
 * deliberately omit owner so a deal reassigned to another rep (e.g. Jake) is
 * never clobbered back.
 */
const DEFAULT_DEAL_OWNER_ID = process.env.HUBSPOT_DEFAULT_DEAL_OWNER_ID ?? '85093129';

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
          ...(DEFAULT_DEAL_OWNER_ID ? { hubspot_owner_id: DEFAULT_DEAL_OWNER_ID } : {}),
        },
        associations: [],
      }),
    `createDeal:${input.accountName}`,
  ).catch(() => null);

  return created?.id ?? null;
}

/**
 * Create a deal ONLY if the account has none yet (dedup by dealname), and
 * associate it to the contact. Unlike upsertDealForAccount this never touches an
 * existing deal's stage/amount — so an inbound signal (e.g. a self-served ROI
 * lead) can open a fresh opportunity without regressing a deal already in flight.
 * Returns { id, created } or null when HubSpot is unconfigured/write fails.
 */
export async function createDealIfMissing(input: {
  accountName: string;
  stage: PipelineStage;
  amount?: number;
  contactId?: string | null;
}): Promise<{ id: string; created: boolean } | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'createDealIfMissing');

  const client = getHubSpotClient();
  const dealName = buildDealName(input.accountName);

  const existing = await withHubSpotRetry(
    () =>
      client.crm.deals.searchApi.doSearch({
        filterGroups: [{ filters: [{ propertyName: 'dealname', operator: FilterOperatorEnum.Eq, value: dealName }] }],
        properties: [...DEAL_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchDeal:${input.accountName}`,
  ).catch(() => null);

  if (existing?.results?.[0]) return { id: existing.results[0].id, created: false };

  const created = await withHubSpotRetry(
    () =>
      client.crm.deals.basicApi.create({
        properties: {
          dealname: dealName,
          dealstage: pipelineStageToHubSpotDealStage(input.stage),
          amount: String(Math.max(0, Math.round(input.amount ?? 25000))),
          pipeline: 'default',
          ...(DEFAULT_DEAL_OWNER_ID ? { hubspot_owner_id: DEFAULT_DEAL_OWNER_ID } : {}),
        },
        associations: [],
      }),
    `createDeal:${input.accountName}`,
  ).catch(() => null);

  if (!created?.id) return null;

  if (input.contactId) {
    await withHubSpotRetry(
      () =>
        client.crm.associations.v4.basicApi.create('deals', created.id, 'contacts', input.contactId!, [
          { associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined, associationTypeId: 3 },
        ]),
      `createDeal:associate:${created.id}`,
    ).catch(() => null);
  }

  return { id: created.id, created: true };
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
