import { describe, expect, it } from 'vitest';
import { buildAccountIdentityReport, serializeAccountIdentityReportCsv } from '@/lib/revops/account-identity-report';

describe('account identity report', () => {
  it('detects duplicate clusters from normalized aliases and canonical-company collisions', () => {
    const report = buildAccountIdentityReport({
      accounts: [
        { name: 'Boston Beer Company', hubspot_company_id: null },
        { name: 'The Boston Beer Company', hubspot_company_id: 'hs_1' },
        { name: 'Blue Rail', hubspot_company_id: null },
      ],
      links: [
        { account_name: 'Boston Beer Company', canonical_company_id: 'account:boston beer company', status: 'resolved' },
        { account_name: 'The Boston Beer Company', canonical_company_id: 'domain:bostonbeer.com', status: 'resolved' },
      ],
      personas: [
        { account_name: 'The Boston Beer Company', email: 'pat@bostonbeer.com' },
        { account_name: 'The Boston Beer Company', email: null },
      ],
      generatedContentRows: [
        { account_name: 'Boston Beer Company' },
      ],
      emailLogRows: [
        { account_name: 'Boston Beer Company' },
        { account_name: 'The Boston Beer Company' },
      ],
      conflictRows: [
        { account_name: 'Boston Beer Company' },
      ],
    });

    expect(report.summary.clusterCount).toBe(1);
    expect(report.summary.impactedAccountCount).toBe(2);
    expect(report.summary.mismatchedCanonicalClusterCount).toBe(1);
    expect(report.clusters[0]).toMatchObject({
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      canonicalCompanyIds: ['account:boston beer company', 'domain:bostonbeer.com'],
      mismatchedCanonicalIds: true,
      contactCount: 2,
      sendableContactCount: 1,
      generatedContentCount: 1,
      emailLogCount: 2,
      unresolvedConflicts: 1,
      suggestedPrimaryAccount: 'The Boston Beer Company',
    });
  });

  it('serializes duplicate clusters into an exportable csv', () => {
    const report = buildAccountIdentityReport({
      accounts: [
        { name: 'Boston Beer Company', hubspot_company_id: null },
        { name: 'The Boston Beer Company', hubspot_company_id: 'hs_1' },
      ],
      links: [
        { account_name: 'Boston Beer Company', canonical_company_id: 'account:boston beer company' },
      ],
      personas: [
        { account_name: 'The Boston Beer Company', email: 'pat@bostonbeer.com' },
      ],
      generatedContentRows: [],
      emailLogRows: [],
      conflictRows: [],
    });

    const csv = serializeAccountIdentityReportCsv(report);

    expect(csv).toContain('cluster_key,suggested_primary_account,reasons');
    expect(csv).toContain('Boston Beer Company|The Boston Beer Company');
    expect(csv).toContain('The Boston Beer Company');
    expect(csv).toContain('normalized_alias');
  });
});
