'use server';

import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured, getPortalId } from '@/lib/hubspot/client';
import { searchCompanyByDomain, searchCompanyByName } from '@/lib/hubspot/companies';
import { ensureYardflowIcpScoreProperty } from '@/lib/hubspot/properties';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';

export interface PushProspectInput {
  name: string;
  cityState?: string;
  corridor?: string;
  icpScore: number;
  tier: string;
  isExistingAccount: boolean;
  /** Optional domain for dedup; most Places discoveries don't carry one. */
  domain?: string;
}

export interface PushResult {
  ok: boolean;
  action?: 'created' | 'updated';
  hubspotId?: string;
  url?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Push a single discovered prospect to HubSpot as a Company.
 * Dedups by domain → name before creating (mirrors push-to-hubspot.ts), stamps
 * the yardflow_icp_score property, and refuses rows already in the CRM.
 */
export async function pushProspectToHubSpot(input: PushProspectInput): Promise<PushResult> {
  if (input.isExistingAccount) {
    return { ok: false, skipped: true, reason: 'Already an existing account in the CRM.' };
  }
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) {
    return { ok: false, error: 'HubSpot sync is not configured or is disabled.' };
  }

  try {
    assertExternalWriteAllowed('hubspot', 'pushProspectToHubSpot');

    // Self-heal: make sure the custom score property exists before stamping it.
    await ensureYardflowIcpScoreProperty();

    const [city, state] = (input.cityState ?? '').split(',').map((s) => s.trim());
    const existing = input.domain
      ? await searchCompanyByDomain(input.domain)
      : await searchCompanyByName(input.name);

    const properties: Record<string, string> = {
      name: input.name,
      ...(input.domain ? { domain: input.domain } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      yardflow_icp_score: String(input.icpScore),
    };

    const client = getHubSpotClient();
    let hubspotId: string;
    let action: 'created' | 'updated';

    if (existing) {
      await withHubSpotRetry(
        () => client.crm.companies.basicApi.update(existing.id, { properties }),
        `discovery.updateCompany(${existing.id})`,
      );
      hubspotId = existing.id;
      action = 'updated';
    } else {
      const created = await withHubSpotRetry(
        () => client.crm.companies.basicApi.create({ properties, associations: [] }),
        `discovery.createCompany(${input.name})`,
      );
      hubspotId = created.id;
      action = 'created';
    }

    const portal = getPortalId();
    const url = portal ? `https://app.hubspot.com/contacts/${portal}/company/${hubspotId}` : undefined;
    return { ok: true, action, hubspotId, url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
