import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedRunCanonicalBackfill = vi.fn();
const mockedFetchAccountIdentityReport = vi.fn();
const mockedSerializeAccountIdentityReportCsv = vi.fn();

vi.mock('@/lib/revops/account-identity-backfill', () => ({
  runCanonicalBackfill: mockedRunCanonicalBackfill,
}));
vi.mock('@/lib/revops/account-identity-report', () => ({
  fetchAccountIdentityReport: mockedFetchAccountIdentityReport,
  serializeAccountIdentityReportCsv: mockedSerializeAccountIdentityReportCsv,
}));

const { POST } = await import('@/app/api/revops/canonical-sync/route');
const { GET } = await import('@/app/api/revops/account-identity-report/route');

describe('canonical account identity routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('runs canonical backfill through the signed sync route', async () => {
    mockedRunCanonicalBackfill.mockResolvedValue({
      at: '2026-05-05T00:00:00.000Z',
      accountCount: 2,
      clusterCount: 1,
      impactedAccountCount: 2,
      mismatchedCanonicalClusterCount: 0,
      missingCanonicalLinkCount: 0,
      signature: 'sig',
    });

    const res = await POST(new NextRequest('http://localhost/api/revops/canonical-sync', {
      method: 'POST',
      headers: {
        'x-canonical-sync-secret': 'test-secret',
      },
      body: JSON.stringify({
        accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      }),
    }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedRunCanonicalBackfill).toHaveBeenCalledWith({
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
    });
  });

  it('exports the account identity report as csv', async () => {
    mockedFetchAccountIdentityReport.mockResolvedValue({
      clusters: [],
      summary: {
        clusterCount: 0,
        impactedAccountCount: 0,
        mismatchedCanonicalClusterCount: 0,
        missingCanonicalLinkCount: 0,
      },
    });
    mockedSerializeAccountIdentityReportCsv.mockReturnValue('cluster_key\n');

    const res = await GET(new NextRequest('http://localhost/api/revops/account-identity-report?format=csv'));
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toBe('cluster_key\n');
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('account-identity-report.csv');
  });
});
