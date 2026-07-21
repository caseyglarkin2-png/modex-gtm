import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import { prisma } from '@/lib/prisma';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from './client';
import { pipelineStageToHubSpotDealStage, stageToStatus, type PipelineStage } from '@/lib/pipeline';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/AssociationSpec';
import {
  decideDealForAccount,
  resolveCompanyIdForAccountName,
  type DealDedupDeps,
} from './deal-dedup';

const DEAL_PROPERTIES = ['dealname', 'dealstage', 'amount', 'pipeline', 'closedate'] as const;

/**
 * Live "default" pipeline stage ids (verified in-portal, earliest-first). The
 * booking handler + GTM engine write ONLY these; the older internal ids
 * (decisionmakerboughtin / contractsent / closedwon) do NOT exist in this portal
 * and 400 on write.
 */
export const DEAL_PIPELINE_ID = 'default';
export const DEAL_STAGE_DISCOVERY = 'appointmentscheduled'; // Discovery (earliest open)
export const DEAL_STAGE_SOLUTION = 'qualifiedtobuy'; // Solution
export const DEAL_STAGE_PROPOSAL = 'presentationscheduled'; // Proposal
export const DEAL_STAGE_CLOSED_WON = '25153609';
export const DEAL_STAGE_CLOSED_LOST = '25153610';

/** Terminal stages — a deal in one of these is NOT open. */
export const CLOSED_DEAL_STAGE_IDS = new Set<string>([DEAL_STAGE_CLOSED_WON, DEAL_STAGE_CLOSED_LOST]);

/** Open stages earliest→latest, for forward-only stage advancement. */
const OPEN_STAGE_ORDER: readonly string[] = [
  DEAL_STAGE_DISCOVERY,
  DEAL_STAGE_SOLUTION,
  DEAL_STAGE_PROPOSAL,
];
function openStageRank(stage: string): number {
  return OPEN_STAGE_ORDER.indexOf(stage);
}

/** HubSpot-defined association type ids. */
const DEAL_TO_CONTACT_ASSOC_TYPE_ID = 3;
const DEAL_TO_COMPANY_ASSOC_TYPE_ID = 5;

export interface OpenDealRef {
  id: string;
  dealstage: string;
  dealname: string;
}

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
  /**
   * Known HubSpot company id (e.g. `Account.hubspot_company_id`). Skips the
   * domain/name resolution round-trip and makes dedup exact.
   */
  companyId?: string | null;
  /**
   * Whether this caller may OPEN a deal that does not exist. Defaults to FALSE
   * (link-only). See deal-dedup.ts for why.
   */
  allowCreate?: boolean;
}

function buildDealName(accountName: string) {
  return `YardFlow - ${accountName}`;
}

/** Exact "YardFlow - {Account}" match, ANY stage — the legacy dedup fallback. */
async function findDealByEngineName(accountName: string): Promise<{ id: string } | null> {
  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'dealname',
                operator: FilterOperatorEnum.Eq,
                value: buildDealName(accountName),
              },
            ],
          },
        ],
        properties: [...DEAL_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `searchDeal:${accountName}`,
  );
  const hit = result?.results?.[0];
  return hit ? { id: hit.id } : null;
}

/**
 * Wire the real HubSpot lookups into the pure dedup decision. Company
 * association first (the truth), engine-name match second (the fallback).
 */
function dedupDepsFor(input: Pick<EnsureDealInput, 'accountName' | 'companyId'>): DealDedupDeps {
  return {
    resolveCompanyId: async () =>
      input.companyId ?? (await resolveCompanyIdForAccountName(input.accountName)),
    findOpenDealAtCompany: async (companyId) => {
      const ref = await findOpenDealForObject('companies', companyId);
      return ref ? { id: ref.id } : null;
    },
    findDealByName: () => findDealByEngineName(input.accountName),
  };
}

/**
 * Ensure the account has a deal, WITHOUT ever duplicating a human one.
 *
 * Dedup is by company association (see deal-dedup.ts). When an open deal
 * already exists on the company — any name, any owner, any open stage — this
 * returns its id and touches NOTHING: no rename, no re-stage, no re-own, no
 * re-amount. Only an engine-named "YardFlow - {Account}" stub is ever updated,
 * and a new deal is only opened when the caller passes `allowCreate: true`.
 */
export async function upsertDealForAccount(input: EnsureDealInput): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'upsertDealForAccount');

  const decision = await decideDealForAccount(dedupDepsFor(input), {
    allowCreate: input.allowCreate === true,
  });

  // Somebody else's deal is already open on this company. Hands off.
  if (decision.action === 'link') return decision.dealId;
  if (decision.action === 'skip') return null;

  const client = getHubSpotClient();
  const dealName = buildDealName(input.accountName);
  const dealStage = pipelineStageToHubSpotDealStage(input.stage);
  const amount = String(input.amount ?? 25000);

  if (decision.action === 'update') {
    await withHubSpotRetry(
      () =>
        client.crm.deals.basicApi.update(decision.dealId, {
          properties: { dealname: dealName, dealstage: dealStage, amount, pipeline: 'default' },
        }),
      `updateDeal:${decision.dealId}`,
    ).catch(() => null);
    return decision.dealId;
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

  if (!created?.id) return null;

  // Associate to the company we deduped against. Without this the new deal is
  // orphaned and the NEXT run's company lookup misses it — which is how the
  // engine kept minting stubs (all five phantom deals have zero associations).
  if (decision.companyId) await associateDealToObject(created.id, 'companies', decision.companyId);

  return created.id;
}

/**
 * Create a deal ONLY if the account has none yet, and associate it to the
 * contact. Unlike upsertDealForAccount this never touches an existing deal at
 * all — so an inbound signal (e.g. a self-served ROI lead) can open a fresh
 * opportunity without regressing a deal already in flight.
 *
 * Dedup is the same company-association-first check (deal-dedup.ts): this
 * carried the identical name-only bug and could have duplicated a human deal
 * from the public ROI form.
 *
 * Returns { id, created } or null when HubSpot is unconfigured/write fails.
 */
export async function createDealIfMissing(input: {
  accountName: string;
  stage: PipelineStage;
  amount?: number;
  contactId?: string | null;
  companyId?: string | null;
}): Promise<{ id: string; created: boolean } | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'createDealIfMissing');

  const decision = await decideDealForAccount(dedupDepsFor(input), { allowCreate: true });

  // Any existing deal — theirs by association, or ours by name — is returned
  // untouched. This function's whole contract is "never disturb what exists".
  if (decision.action === 'link' || decision.action === 'update') {
    return { id: decision.dealId, created: false };
  }
  if (decision.action === 'skip') return null;

  const client = getHubSpotClient();
  const dealName = buildDealName(input.accountName);

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

  // Company association — so the next dedup pass can SEE this deal.
  if (decision.companyId) await associateDealToObject(created.id, 'companies', decision.companyId);

  return { id: created.id, created: true };
}

export interface EnsureLocalMeetingDealLinkOptions {
  /**
   * Whether this caller may OPEN a HubSpot deal when the account has none.
   *
   * Defaults to FALSE. This function's job is in its NAME: LINK the local
   * Meeting row to a HubSpot deal. Creating one was a side effect, and it is
   * the side effect that put $250k of phantom pipeline in the portal. Only
   * deliberate human deal-making actions (moving an account into a deal stage,
   * logging a booked meeting, clicking "sync deal") pass true. Automation —
   * above all the inbound-reply cron — never does: a reply is not a deal.
   */
  allowCreate?: boolean;
}

export async function ensureLocalMeetingDealLink(
  accountName: string,
  stage: PipelineStage,
  options: EnsureLocalMeetingDealLinkOptions = {},
) {
  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) return null;

  const dealId = await upsertDealForAccount({
    accountName,
    stage,
    amount: Math.max(10000, (account.priority_score ?? 0) * 1000),
    companyId: account.hubspot_company_id,
    allowCreate: options.allowCreate === true,
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

/**
 * Find an OPEN deal (not Closed Won / Closed Lost) associated with a contact or
 * company, via HubSpot associations v4. Returns the most-advanced open deal so a
 * booking re-attaches to a deal already in flight instead of spawning a
 * duplicate. Null when HubSpot is unconfigured, the object has no associated
 * deals, or every associated deal is closed.
 *
 * This is the deal-level dedup the canonical engine never does (it dedupes
 * contacts + companies only), so it MUST live here in the deal layer.
 */
export async function findOpenDealForObject(
  objectType: 'contacts' | 'companies',
  objectId: string,
): Promise<OpenDealRef | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  const client = getHubSpotClient();

  // 1. Collect associated deal ids (paginated).
  const dealIds: string[] = [];
  let after: string | undefined = undefined;
  try {
    do {
      const page = await withHubSpotRetry(
        () => client.crm.associations.v4.basicApi.getPage(objectType, objectId, 'deals', after, 100),
        `findOpenDealForObject:assoc(${objectType}:${objectId})`,
      );
      for (const item of page.results) {
        dealIds.push(String((item as { toObjectId: string | number }).toObjectId));
      }
      after = page.paging?.next?.after;
    } while (after);
  } catch {
    return null;
  }
  if (!dealIds.length) return null;

  // 2. Batch-read those deals; keep the open ones.
  const open: OpenDealRef[] = [];
  try {
    for (let i = 0; i < dealIds.length; i += 100) {
      const chunk = dealIds.slice(i, i + 100);
      const batch = await withHubSpotRetry(
        () =>
          client.crm.deals.batchApi.read({
            inputs: chunk.map((id) => ({ id })),
            properties: [...DEAL_PROPERTIES],
            propertiesWithHistory: [],
          }),
        `findOpenDealForObject:read(${objectType}:${objectId})`,
      );
      for (const raw of batch.results) {
        const r = raw as { id: string; properties: Record<string, string | null> };
        const dealstage = r.properties.dealstage || '';
        if (!dealstage || CLOSED_DEAL_STAGE_IDS.has(dealstage)) continue;
        open.push({ id: r.id, dealstage, dealname: r.properties.dealname || '' });
      }
    }
  } catch {
    return null;
  }
  if (!open.length) return null;

  // Prefer the most-advanced open deal; break ties by id for determinism.
  open.sort(
    (a, b) => openStageRank(b.dealstage) - openStageRank(a.dealstage) || a.id.localeCompare(b.id),
  );
  return open[0];
}

/**
 * Last-resort dedup: exact dealname match on "YardFlow - {account}", filtered to
 * OPEN deals. Catches the engine's INTEGRATION-source stubs when a booking has no
 * resolvable contact/company association yet.
 */
export async function findOpenDealByExactName(accountName: string): Promise<OpenDealRef | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  const client = getHubSpotClient();
  const dealName = buildDealName(accountName);
  const result = await withHubSpotRetry(
    () =>
      client.crm.deals.searchApi.doSearch({
        filterGroups: [
          { filters: [{ propertyName: 'dealname', operator: FilterOperatorEnum.Eq, value: dealName }] },
        ],
        properties: [...DEAL_PROPERTIES],
        limit: 10,
        after: '0',
        sorts: [],
      }),
    `findOpenDealByExactName:${accountName}`,
  ).catch(() => null);

  const match = (result?.results ?? []).find((d) => {
    const stage = (d as { properties: Record<string, string | null> }).properties.dealstage || '';
    return stage && !CLOSED_DEAL_STAGE_IDS.has(stage);
  });
  if (!match) return null;
  const m = match as { id: string; properties: Record<string, string | null> };
  return { id: m.id, dealstage: m.properties.dealstage || '', dealname: m.properties.dealname || '' };
}

/**
 * Associate an existing deal to a contact or company (HubSpot-defined). Best-effort:
 * a re-association of an already-linked pair is a no-op on HubSpot's side.
 */
export async function associateDealToObject(
  dealId: string,
  objectType: 'contacts' | 'companies',
  objectId: string,
): Promise<void> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return;
  assertExternalWriteAllowed('hubspot', 'associateDealToObject');
  const typeId =
    objectType === 'contacts' ? DEAL_TO_CONTACT_ASSOC_TYPE_ID : DEAL_TO_COMPANY_ASSOC_TYPE_ID;
  const client = getHubSpotClient();
  await withHubSpotRetry(
    () =>
      client.crm.associations.v4.basicApi.create('deals', dealId, objectType, objectId, [
        { associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined, associationTypeId: typeId },
      ]),
    `associateDealToObject(${dealId}->${objectType}:${objectId})`,
  ).catch(() => undefined);
}

/**
 * Move an open deal FORWARD to `targetStage` only if that is strictly later than
 * its current open stage. Never regresses a deal already further along — a booking
 * must never pull a Proposal-stage deal back to Discovery. No-op on closed deals.
 */
export async function advanceDealStageForward(
  dealId: string,
  currentStage: string,
  targetStage: string,
): Promise<void> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return;
  if (CLOSED_DEAL_STAGE_IDS.has(currentStage)) return;
  if (openStageRank(targetStage) <= openStageRank(currentStage)) return;
  assertExternalWriteAllowed('hubspot', 'advanceDealStageForward');
  const client = getHubSpotClient();
  await withHubSpotRetry(
    () => client.crm.deals.basicApi.update(dealId, { properties: { dealstage: targetStage } }),
    `advanceDealStageForward(${dealId})`,
  ).catch(() => undefined);
}

/**
 * Create exactly ONE deal at Discovery (appointmentscheduled) for a booking and
 * associate it to the contact and/or company. Callers MUST have already checked
 * for an existing open deal (findOpenDealForObject / findOpenDealByExactName) —
 * this always creates. Returns the new deal id or null on failure.
 */
export async function createBookingDeal(input: {
  accountName: string;
  contactId?: string | null;
  companyId?: string | null;
}): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return null;
  assertExternalWriteAllowed('hubspot', 'createBookingDeal');
  const client = getHubSpotClient();
  const created = await withHubSpotRetry(
    () =>
      client.crm.deals.basicApi.create({
        properties: {
          dealname: buildDealName(input.accountName),
          dealstage: DEAL_STAGE_DISCOVERY,
          pipeline: DEAL_PIPELINE_ID,
          ...(DEFAULT_DEAL_OWNER_ID ? { hubspot_owner_id: DEFAULT_DEAL_OWNER_ID } : {}),
        },
        associations: [],
      }),
    `createBookingDeal:${input.accountName}`,
  ).catch(() => null);
  if (!created?.id) return null;

  if (input.contactId) await associateDealToObject(created.id, 'contacts', input.contactId);
  if (input.companyId) await associateDealToObject(created.id, 'companies', input.companyId);
  return created.id;
}
