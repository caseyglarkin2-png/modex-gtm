import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// --- HubSpot mocks (never hit the live CRM) ---
const mockedUpsertContact = vi.fn();
const mockedSearchCompanyByDomain = vi.fn();
const mockedSearchCompanyByName = vi.fn();
const mockedFindOpenDealForObject = vi.fn();
const mockedFindOpenDealByExactName = vi.fn();
const mockedAssociateDealToObject = vi.fn();
const mockedAdvanceDealStageForward = vi.fn();
const mockedCreateBookingDeal = vi.fn();
const mockedCreateNote = vi.fn();
const mockedCreateCompanyNote = vi.fn();

vi.mock('@/lib/hubspot/contacts', () => ({ upsertContact: mockedUpsertContact }));
vi.mock('@/lib/hubspot/companies', () => ({
  searchCompanyByDomain: mockedSearchCompanyByDomain,
  searchCompanyByName: mockedSearchCompanyByName,
}));
vi.mock('@/lib/hubspot/notes', () => ({
  createNote: mockedCreateNote,
  createCompanyNote: mockedCreateCompanyNote,
}));
vi.mock('@/lib/hubspot/deals', () => ({
  findOpenDealForObject: mockedFindOpenDealForObject,
  findOpenDealByExactName: mockedFindOpenDealByExactName,
  associateDealToObject: mockedAssociateDealToObject,
  advanceDealStageForward: mockedAdvanceDealStageForward,
  createBookingDeal: mockedCreateBookingDeal,
  DEAL_STAGE_DISCOVERY: 'appointmentscheduled',
}));
// rate-limit + contact-standard are real; use a unique IP per test so it never trips.

const { POST } = await import('@/app/api/concierge/booked/route');

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/concierge/booked', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250) + 1}`,
      ...headers,
    },
  });
}

const validBody = {
  email: 'trevor@pepsico.com',
  firstName: 'Trevor',
  startTime: '2026-07-14T18:00:00Z',
  source: 'order-of-operations-concierge',
  company: 'PepsiCo',
};

describe('POST /api/concierge/booked (dedup-safe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CONCIERGE_WEBHOOK_SECRET;
    mockedUpsertContact.mockResolvedValue('contact-1');
    mockedSearchCompanyByDomain.mockResolvedValue(null);
    mockedSearchCompanyByName.mockResolvedValue(null);
    mockedFindOpenDealForObject.mockResolvedValue(null);
    mockedFindOpenDealByExactName.mockResolvedValue(null);
    mockedAssociateDealToObject.mockResolvedValue(undefined);
    mockedAdvanceDealStageForward.mockResolvedValue(undefined);
    mockedCreateBookingDeal.mockResolvedValue('deal-new');
    mockedCreateNote.mockResolvedValue('note-1');
    mockedCreateCompanyNote.mockResolvedValue('cnote-1');
  });

  it('existing open deal on the CONTACT -> associates, never creates', async () => {
    mockedFindOpenDealForObject.mockImplementation(async (type: string) =>
      type === 'contacts' ? { id: 'deal-9', dealstage: 'qualifiedtobuy', dealname: 'YardFlow - PepsiCo' } : null,
    );
    mockedSearchCompanyByDomain.mockResolvedValue({ id: 'co-9', name: 'PepsiCo' });

    const res = await POST(buildRequest(validBody));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, created: false, dealId: 'deal-9', contactId: 'contact-1' });
    expect(mockedCreateBookingDeal).not.toHaveBeenCalled();
    // contact resolved via the contact association; company lookup need not even run,
    // but the contact + (any) company get associated to the found deal.
    expect(mockedAssociateDealToObject).toHaveBeenCalledWith('deal-9', 'contacts', 'contact-1');
  });

  it('name drift: booking company "GXO" resolves the "GXO Logistics" stub by domain and reuses its open deal', async () => {
    mockedFindOpenDealForObject.mockImplementation(async (type: string) =>
      type === 'companies' ? { id: 'deal-7', dealstage: 'presentationscheduled', dealname: 'YardFlow - GXO Logistics' } : null,
    );
    mockedSearchCompanyByDomain.mockResolvedValue({ id: 'co-7', name: 'GXO Logistics' });

    const res = await POST(buildRequest({ ...validBody, email: 'ops@gxo.com', company: 'GXO' }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, created: false, dealId: 'deal-7', companyId: 'co-7' });
    expect(mockedSearchCompanyByDomain).toHaveBeenCalledWith('gxo.com');
    expect(mockedCreateBookingDeal).not.toHaveBeenCalled();
    expect(mockedAssociateDealToObject).toHaveBeenCalledWith('deal-7', 'companies', 'co-7');
    expect(mockedAssociateDealToObject).toHaveBeenCalledWith('deal-7', 'contacts', 'contact-1');
    // Never regress a Proposal-stage deal: forward-advance is still invoked (it no-ops internally).
    expect(mockedAdvanceDealStageForward).toHaveBeenCalledWith('deal-7', 'presentationscheduled', 'appointmentscheduled');
  });

  it('blank company + free email -> creates exactly one deal, no company lookup, no bad company link', async () => {
    const res = await POST(
      buildRequest({ email: 'someone@gmail.com', startTime: '2026-07-14T18:00:00Z' }),
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, created: true, dealId: 'deal-new', companyId: null });
    // Free inbox: never resolve a company.
    expect(mockedSearchCompanyByDomain).not.toHaveBeenCalled();
    expect(mockedSearchCompanyByName).not.toHaveBeenCalled();
    // Exactly one deal, with no company association.
    expect(mockedCreateBookingDeal).toHaveBeenCalledTimes(1);
    expect(mockedCreateBookingDeal).toHaveBeenCalledWith(
      expect.objectContaining({ accountName: 'someone@gmail.com', contactId: 'contact-1', companyId: null }),
    );
    // Note anchored to the contact, not a company.
    expect(mockedCreateNote).toHaveBeenCalledTimes(1);
    expect(mockedCreateCompanyNote).not.toHaveBeenCalled();
  });

  it('no existing deal anywhere -> creates exactly one deal at Discovery', async () => {
    mockedSearchCompanyByDomain.mockResolvedValue({ id: 'co-1', name: 'PepsiCo' });

    const res = await POST(buildRequest(validBody));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, created: true, dealId: 'deal-new' });
    // All three dedup lookups consulted, all missed.
    expect(mockedFindOpenDealForObject).toHaveBeenCalledWith('contacts', 'contact-1');
    expect(mockedFindOpenDealForObject).toHaveBeenCalledWith('companies', 'co-1');
    expect(mockedFindOpenDealByExactName).toHaveBeenCalledWith('PepsiCo');
    expect(mockedCreateBookingDeal).toHaveBeenCalledTimes(1);
    expect(mockedCreateBookingDeal).toHaveBeenCalledWith(
      expect.objectContaining({ accountName: 'PepsiCo', contactId: 'contact-1', companyId: 'co-1' }),
    );
    // Never touch stage on a fresh create.
    expect(mockedAdvanceDealStageForward).not.toHaveBeenCalled();
  });

  it('last-resort: no contact/company deal, but an exact-name open stub exists -> reuse it', async () => {
    mockedFindOpenDealByExactName.mockResolvedValue({
      id: 'deal-stub',
      dealstage: 'appointmentscheduled',
      dealname: 'YardFlow - PepsiCo',
    });
    mockedSearchCompanyByDomain.mockResolvedValue({ id: 'co-1', name: 'PepsiCo' });

    const res = await POST(buildRequest(validBody));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({ created: false, dealId: 'deal-stub' });
    expect(mockedCreateBookingDeal).not.toHaveBeenCalled();
  });

  it('secret missing -> accepts with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('secret set + wrong header -> 401, no writes', async () => {
    process.env.CONCIERGE_WEBHOOK_SECRET = 's3cret';
    const res = await POST(buildRequest(validBody, { 'x-concierge-secret': 'nope' }));
    expect(res.status).toBe(401);
    expect(mockedUpsertContact).not.toHaveBeenCalled();
    expect(mockedCreateBookingDeal).not.toHaveBeenCalled();
  });

  it('secret set + matching header -> 200', async () => {
    process.env.CONCIERGE_WEBHOOK_SECRET = 's3cret';
    const res = await POST(buildRequest(validBody, { 'x-concierge-secret': 's3cret' }));
    expect(res.status).toBe(200);
    expect(mockedUpsertContact).toHaveBeenCalled();
  });

  it('invalid email / body -> 400, no writes', async () => {
    const res = await POST(buildRequest({ email: 'not-an-email', startTime: 'now' }));
    expect(res.status).toBe(400);
    expect(mockedUpsertContact).not.toHaveBeenCalled();
  });

  it('never throws: a HubSpot failure returns 500', async () => {
    mockedUpsertContact.mockRejectedValueOnce(new Error('hubspot down'));
    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(500);
    const payload = await res.json();
    expect(payload.ok).toBe(false);
  });
});
