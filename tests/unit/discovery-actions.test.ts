import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';

// Mock the HubSpot client layer so no real network calls happen.
type CompanyArg = { properties: Record<string, string>; associations?: unknown[] };
const create = vi.fn(async (_arg: CompanyArg) => ({ id: 'new-123' }));
const update = vi.fn(async (_id: string, _arg: CompanyArg) => ({ id: 'exist-456' }));

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  getPortalId: () => '999',
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({
    crm: { companies: { basicApi: { create, update } } },
  }),
}));

const searchCompanyByDomain = vi.fn();
const searchCompanyByName = vi.fn();
vi.mock('@/lib/hubspot/companies', () => ({
  searchCompanyByDomain: (...args: unknown[]) => searchCompanyByDomain(...args),
  searchCompanyByName: (...args: unknown[]) => searchCompanyByName(...args),
}));

const ensureYardflowIcpScoreProperty = vi.fn();
vi.mock('@/lib/hubspot/properties', () => ({
  ensureYardflowIcpScoreProperty: () => ensureYardflowIcpScoreProperty(),
}));

import { pushProspectToHubSpot } from '@/app/discovery/actions';

const BASE = {
  name: 'Acme Logistics',
  cityState: 'Dallas, TX',
  corridor: 'DFW',
  icpScore: 88,
  tier: 'A',
  isExistingAccount: false,
};

beforeAll(() => {
  // The external-write guard blocks writes when NODE_ENV=test unless allowed.
  process.env.ALLOW_EXTERNAL_WRITES_IN_TEST = 'true';
});

beforeEach(() => {
  create.mockClear();
  update.mockClear();
  searchCompanyByDomain.mockReset();
  searchCompanyByName.mockReset();
  ensureYardflowIcpScoreProperty.mockReset();
});

describe('pushProspectToHubSpot', () => {
  it('refuses existing accounts without touching HubSpot', async () => {
    const res = await pushProspectToHubSpot({ ...BASE, isExistingAccount: true });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe(true);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('creates a new company when none exists (dedup miss)', async () => {
    searchCompanyByName.mockResolvedValue(null);
    const res = await pushProspectToHubSpot(BASE);
    expect(res.ok).toBe(true);
    expect(res.action).toBe('created');
    expect(res.hubspotId).toBe('new-123');
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    // The push self-provisions the custom score property first.
    expect(ensureYardflowIcpScoreProperty).toHaveBeenCalledTimes(1);
    // ICP score is stamped onto the company.
    const props = create.mock.calls[0][0].properties;
    expect(props.yardflow_icp_score).toBe('88');
    expect(props.city).toBe('Dallas');
    expect(props.state).toBe('TX');
  });

  it('updates the existing company when found by name (dedup hit)', async () => {
    searchCompanyByName.mockResolvedValue({ id: 'exist-456', name: 'Acme Logistics' });
    const res = await pushProspectToHubSpot(BASE);
    expect(res.ok).toBe(true);
    expect(res.action).toBe('updated');
    expect(res.hubspotId).toBe('exist-456');
    expect(update).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('dedups by domain when a domain is provided', async () => {
    searchCompanyByDomain.mockResolvedValue(null);
    await pushProspectToHubSpot({ ...BASE, domain: 'acme.com' });
    expect(searchCompanyByDomain).toHaveBeenCalledWith('acme.com');
    expect(searchCompanyByName).not.toHaveBeenCalled();
  });
});
