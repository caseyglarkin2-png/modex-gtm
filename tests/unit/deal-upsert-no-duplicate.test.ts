/**
 * End-to-end guard on the deal writer itself: replay the 2026-07-21 Wesco
 * duplicate through `upsertDealForAccount` / `ensureLocalMeetingDealLink` with a
 * fully mocked HubSpot client and assert that NOTHING is written.
 *
 * The pure decision is covered in deal-dedup.test.ts; this test exists because
 * the bug was never in the decision — it was in what the writer did with it.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  dealSearch,
  dealCreate,
  dealUpdate,
  assocGetPage,
  assocCreate,
  batchRead,
  byDomain,
  byName,
  accountFindUnique,
  meetingFindFirst,
  meetingUpdate,
  meetingCreate,
} = vi.hoisted(() => ({
  dealSearch: vi.fn(),
  dealCreate: vi.fn(),
  dealUpdate: vi.fn(),
  assocGetPage: vi.fn(),
  assocCreate: vi.fn(),
  batchRead: vi.fn(),
  byDomain: vi.fn(),
  byName: vi.fn(),
  accountFindUnique: vi.fn(),
  meetingFindFirst: vi.fn(),
  meetingUpdate: vi.fn(),
  meetingCreate: vi.fn(),
}));

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  getPortalId: () => '3819073',
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({
    crm: {
      deals: {
        searchApi: { doSearch: dealSearch },
        basicApi: { create: dealCreate, update: dealUpdate },
        batchApi: { read: batchRead },
      },
      associations: { v4: { basicApi: { getPage: assocGetPage, create: assocCreate } } },
    },
  }),
}));
vi.mock('@/lib/hubspot/companies', () => ({
  searchCompanyByDomain: byDomain,
  searchCompanyByName: byName,
}));
vi.mock('@/lib/enrichment/external-write-guard', () => ({
  assertExternalWriteAllowed: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findUnique: accountFindUnique },
    meeting: { findFirst: meetingFindFirst, update: meetingUpdate, create: meetingCreate },
  },
}));

import { upsertDealForAccount, ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';

/** The real Wesco records, as they exist in portal 3819073. */
const WESCO_COMPANY = { id: '55554445576', name: 'Wesco International', domain: 'wesco.com' };
const JAKES_DEAL = {
  id: '59419157591',
  properties: { dealname: 'Wesco - Pilot and POC', dealstage: 'qualifiedtobuy' },
};

function companyHasDeals(deals: Array<{ id: string; properties: Record<string, string> }>) {
  assocGetPage.mockResolvedValue({
    results: deals.map((d) => ({ toObjectId: d.id })),
    paging: undefined,
  });
  batchRead.mockResolvedValue({ results: deals });
}

beforeEach(() => {
  vi.clearAllMocks();
  byDomain.mockResolvedValue(null);
  byName.mockResolvedValue(null);
  dealSearch.mockResolvedValue({ results: [] });
  dealCreate.mockResolvedValue({ id: 'NEW' });
  dealUpdate.mockResolvedValue({ id: 'UPDATED' });
  assocGetPage.mockResolvedValue({ results: [], paging: undefined });
  assocCreate.mockResolvedValue({});
  batchRead.mockResolvedValue({ results: [] });
  meetingUpdate.mockResolvedValue({});
  meetingCreate.mockResolvedValue({});
  accountFindUnique.mockResolvedValue({
    name: 'Wesco International',
    priority_score: 50,
    hubspot_company_id: null,
  });
  meetingFindFirst.mockResolvedValue(null);
});

describe('upsertDealForAccount — the Wesco duplicate', () => {
  it("returns Jake's deal untouched instead of creating a second one", async () => {
    byName.mockResolvedValue(WESCO_COMPANY);
    companyHasDeals([JAKES_DEAL]);

    const id = await upsertDealForAccount({
      accountName: 'Wesco International',
      stage: 'proposal',
      amount: 50000,
      allowCreate: true,
    });

    expect(id).toBe('59419157591');
    expect(dealCreate).not.toHaveBeenCalled();
    // No rename, no re-stage, no re-own, no re-amount.
    expect(dealUpdate).not.toHaveBeenCalled();
    // And it never even fell through to the old name search.
    expect(dealSearch).not.toHaveBeenCalled();
  });

  it('uses Account.hubspot_company_id directly when it is set', async () => {
    companyHasDeals([JAKES_DEAL]);

    const id = await upsertDealForAccount({
      accountName: 'Wesco International',
      stage: 'proposal',
      companyId: '55554445576',
      allowCreate: true,
    });

    expect(id).toBe('59419157591');
    expect(byDomain).not.toHaveBeenCalled();
    expect(byName).not.toHaveBeenCalled();
    expect(dealCreate).not.toHaveBeenCalled();
  });

  it('ignores CLOSED deals on the company and opens one', async () => {
    byName.mockResolvedValue(WESCO_COMPANY);
    companyHasDeals([
      { id: '1', properties: { dealname: 'Wesco - old', dealstage: '25153610' } }, // closed lost
    ]);
    dealCreate.mockResolvedValue({ id: 'NEW' });

    const id = await upsertDealForAccount({
      accountName: 'Wesco International',
      stage: 'proposal',
      allowCreate: true,
    });

    expect(id).toBe('NEW');
    expect(dealCreate).toHaveBeenCalledTimes(1);
  });

  it('ASSOCIATES a created deal to the company so the next pass can see it', async () => {
    byName.mockResolvedValue(WESCO_COMPANY);
    dealCreate.mockResolvedValue({ id: 'NEW' });

    await upsertDealForAccount({
      accountName: 'Wesco International',
      stage: 'proposal',
      allowCreate: true,
    });

    expect(assocCreate).toHaveBeenCalledWith(
      'deals',
      'NEW',
      'companies',
      '55554445576',
      expect.anything(),
    );
  });

  it('never creates when allowCreate is not passed', async () => {
    byName.mockResolvedValue(WESCO_COMPANY);

    const id = await upsertDealForAccount({ accountName: 'Wesco International', stage: 'proposal' });

    expect(id).toBeNull();
    expect(dealCreate).not.toHaveBeenCalled();
  });

  it('still updates the engine-named stub when no company resolves', async () => {
    dealSearch.mockResolvedValue({ results: [{ id: '62958605870' }] });

    const id = await upsertDealForAccount({
      accountName: 'Wesco International',
      stage: 'proposal',
      allowCreate: true,
    });

    expect(id).toBe('62958605870');
    expect(dealUpdate).toHaveBeenCalledTimes(1);
    expect(dealCreate).not.toHaveBeenCalled();
  });
});

describe('ensureLocalMeetingDealLink — the check-inbox call site', () => {
  it('is link-only by default: an inbound reply creates no deal', async () => {
    byName.mockResolvedValue(WESCO_COMPANY);

    const id = await ensureLocalMeetingDealLink('Wesco International', 'proposal', {
      allowCreate: false,
    });

    expect(id).toBeNull();
    expect(dealCreate).not.toHaveBeenCalled();
    expect(meetingCreate).not.toHaveBeenCalled();
  });

  it("links the local Meeting row to Jake's existing deal", async () => {
    byName.mockResolvedValue(WESCO_COMPANY);
    companyHasDeals([JAKES_DEAL]);
    meetingFindFirst.mockResolvedValue({ id: 7 });

    const id = await ensureLocalMeetingDealLink('Wesco International', 'proposal', {
      allowCreate: false,
    });

    expect(id).toBe('59419157591');
    expect(meetingUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { hubspot_deal_id: '59419157591' },
    });
    expect(dealCreate).not.toHaveBeenCalled();
    expect(dealUpdate).not.toHaveBeenCalled();
  });

  it('passes the account hubspot_company_id through to dedup', async () => {
    accountFindUnique.mockResolvedValue({
      name: 'Wesco International',
      priority_score: 50,
      hubspot_company_id: '55554445576',
    });
    companyHasDeals([JAKES_DEAL]);

    await ensureLocalMeetingDealLink('Wesco International', 'proposal', { allowCreate: true });

    expect(byDomain).not.toHaveBeenCalled();
    expect(byName).not.toHaveBeenCalled();
    expect(dealCreate).not.toHaveBeenCalled();
  });
});
