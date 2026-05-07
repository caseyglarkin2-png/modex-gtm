import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedDbGetAccounts = vi.fn();
const mockedResolveCanonicalAccountScope = vi.fn();
const mockedRunAgentAction = vi.fn();
const mockedListAccountContactCandidates = vi.fn();
const mockedUpsertAccountContactCandidates = vi.fn();
const mockedPromoteAccountContactCandidate = vi.fn();
const mockedDeferAccountContactCandidate = vi.fn();
const mockedRestageAccountContactCandidate = vi.fn();

vi.mock('@/lib/db', () => ({
  dbGetAccounts: mockedDbGetAccounts,
}));
vi.mock('@/lib/revops/account-identity', () => ({
  resolveCanonicalAccountScope: mockedResolveCanonicalAccountScope,
}));
vi.mock('@/lib/agent-actions/broker', () => ({
  runAgentAction: mockedRunAgentAction,
}));
vi.mock('@/lib/account-contact-candidates', () => ({
  listAccountContactCandidates: mockedListAccountContactCandidates,
  upsertAccountContactCandidates: mockedUpsertAccountContactCandidates,
  promoteAccountContactCandidate: mockedPromoteAccountContactCandidate,
  deferAccountContactCandidate: mockedDeferAccountContactCandidate,
  restageAccountContactCandidate: mockedRestageAccountContactCandidate,
}));

const { GET, POST } = await import('@/app/api/accounts/[slug]/contact-candidates/route');
const { PATCH } = await import('@/app/api/accounts/[slug]/contact-candidates/[candidateId]/route');

describe('account contact candidate routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDbGetAccounts.mockResolvedValue([{ name: 'Boston Beer Company' }]);
    mockedResolveCanonicalAccountScope.mockResolvedValue({
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
    });
    mockedListAccountContactCandidates.mockResolvedValue([{ id: 1, fullName: 'Pat Brewer' }]);
  });

  it('lists persisted candidates across canonical account scope', async () => {
    const res = await GET(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates'), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.candidates).toHaveLength(1);
    expect(mockedListAccountContactCandidates).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
  });

  it('discovers and persists staged contact candidates', async () => {
    mockedRunAgentAction.mockResolvedValue({ action: 'company_contacts', provider: 'sales_agent' });
    mockedUpsertAccountContactCandidates.mockResolvedValue([{ id: 2, fullName: 'Phil Savastano' }]);

    const res = await POST(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates', {
      method: 'POST',
      body: JSON.stringify({ refresh: true }),
    }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockedRunAgentAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'company_contacts',
      target: expect.objectContaining({
        accountName: 'Boston Beer Company',
        accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      }),
    }));
    expect(payload.candidates[0].fullName).toBe('Phil Savastano');
  });

  it('promotes a candidate and returns refreshed candidate state', async () => {
    mockedPromoteAccountContactCandidate.mockResolvedValue({
      candidate: { id: 3, fullName: 'Pat Brewer', state: 'promoted' },
      importResult: { status: 'imported', personaId: 99, accountName: 'Boston Beer Company' },
    });

    const res = await PATCH(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates/3', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'promote' }),
    }), {
      params: Promise.resolve({ slug: 'boston-beer-company', candidateId: '3' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockedPromoteAccountContactCandidate).toHaveBeenCalledWith(3, null);
    expect(payload.success).toBe(true);
  });

  it('defers a candidate with an operator reason', async () => {
    mockedDeferAccountContactCandidate.mockResolvedValue({ id: 3, fullName: 'Pat Brewer', state: 'deferred' });

    const res = await PATCH(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates/3', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'defer', reason: 'Weak match for this lane' }),
    }), {
      params: Promise.resolve({ slug: 'boston-beer-company', candidateId: '3' }),
    });

    expect(res.status).toBe(200);
    expect(mockedDeferAccountContactCandidate).toHaveBeenCalledWith(3, 'Weak match for this lane');
  });

  it('passes the lane filter through to the broker prospect-discover payload (S2-T2)', async () => {
    mockedRunAgentAction.mockResolvedValue({ action: 'company_contacts', provider: 'sales_agent' });
    mockedUpsertAccountContactCandidates.mockResolvedValue([]);

    const res = await POST(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates', {
      method: 'POST',
      body: JSON.stringify({ refresh: true, lane: 'Financial' }),
    }), {
      params: Promise.resolve({ slug: 'boston-beer-company' }),
    });

    expect(res.status).toBe(200);
    expect(mockedRunAgentAction).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ lane: 'Financial' }),
    }));
  });

  it('restages a previously promoted/deferred candidate (S2-T6 undo)', async () => {
    mockedRestageAccountContactCandidate.mockResolvedValue({ id: 3, fullName: 'Pat Brewer', state: 'staged' });

    const res = await PATCH(new NextRequest('http://localhost/api/accounts/boston-beer-company/contact-candidates/3', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'restage' }),
    }), {
      params: Promise.resolve({ slug: 'boston-beer-company', candidateId: '3' }),
    });

    expect(res.status).toBe(200);
    expect(mockedRestageAccountContactCandidate).toHaveBeenCalledWith(3);
  });
});
