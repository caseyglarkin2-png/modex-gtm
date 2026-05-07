import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedDb = {
  dbGetPersonasByAccounts: vi.fn(),
  dbGetMicrositeAccountAnalyticsByAccounts: vi.fn(),
  dbGetActivitiesByAccounts: vi.fn(),
  dbGetGeneratedContentByAccounts: vi.fn(),
  dbGetEmailLogsByAccounts: vi.fn(),
  dbGetMeetingsByAccounts: vi.fn(),
  dbGetMobileCapturesByAccounts: vi.fn(),
  dbGetOperatorOutcomesByAccounts: vi.fn(),
  dbGetSendJobsByAccounts: vi.fn(),
  dbGetSendJobRecipientEventsByAccounts: vi.fn(),
};
const mockedResolveCanonicalAccountScope = vi.fn();
const mockedEnsureCanonicalRecords = vi.fn();
const mockedGetAgentContentContext = vi.fn();
const mockedListAccountContactCandidates = vi.fn();

vi.mock('@/lib/db', () => mockedDb);
vi.mock('@/lib/revops/account-identity', () => ({
  resolveCanonicalAccountScope: mockedResolveCanonicalAccountScope,
}));
vi.mock('@/lib/revops/canonical-sync', () => ({
  ensureCanonicalRecords: mockedEnsureCanonicalRecords,
}));
vi.mock('@/lib/account-contact-candidates', () => ({
  listAccountContactCandidates: mockedListAccountContactCandidates,
}));
vi.mock('@/lib/agent-actions/content-context', () => ({
  getAgentContentContext: mockedGetAgentContentContext,
}));
vi.mock('@/lib/source-backed/evidence', () => ({
  loadEvidenceSummaryByAccountScope: vi.fn().mockResolvedValue(null),
}));

const { loadAccountCommandCenterData, summarizeAccountScope } = await import('@/lib/account-command-center-data');

describe('account command center data loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveCanonicalAccountScope.mockResolvedValue({
      accountName: 'Boston Beer Company',
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      normalizedAliases: ['The Boston Beer Company'],
      canonicalCompanyIds: ['account:boston beer company', 'domain:bostonbeer.com'],
    });
    mockedDb.dbGetPersonasByAccounts.mockResolvedValue([{ id: 1, account_name: 'The Boston Beer Company' }]);
    mockedDb.dbGetMicrositeAccountAnalyticsByAccounts.mockResolvedValue({ recentSessions: [] });
    mockedDb.dbGetActivitiesByAccounts.mockResolvedValue([{ id: 10, account_name: 'Boston Beer Company' }]);
    mockedDb.dbGetGeneratedContentByAccounts.mockResolvedValue([{ id: 99, account_name: 'Boston Beer Company' }]);
    mockedDb.dbGetEmailLogsByAccounts.mockResolvedValue([{ id: 12, account_name: 'The Boston Beer Company' }]);
    mockedDb.dbGetMeetingsByAccounts.mockResolvedValue([]);
    mockedDb.dbGetMobileCapturesByAccounts.mockResolvedValue([]);
    mockedDb.dbGetOperatorOutcomesByAccounts.mockResolvedValue([{ id: 'out_1', outcome_label: 'positive' }]);
    mockedDb.dbGetSendJobsByAccounts.mockResolvedValue([{ id: 401, status: 'pending' }]);
    mockedDb.dbGetSendJobRecipientEventsByAccounts.mockResolvedValue([{ id: 55, status: 'failed' }]);
    mockedListAccountContactCandidates.mockResolvedValue([{ id: 44, accountName: 'Boston Beer Company' }]);
    mockedEnsureCanonicalRecords.mockResolvedValue({ contactsByPersonaId: new Map(), accountSummaries: new Map() });
    mockedGetAgentContentContext.mockResolvedValue({
      summary: 'ready',
      freshness: {
        fetchedAt: '2026-05-05T00:00:00.000Z',
        stale: false,
        source: 'live',
        status: 'fresh',
        dimensions: {
          summary: { key: 'summary', label: 'Research summary', status: 'fresh', stale: false, source: 'live', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          signals: { key: 'signals', label: 'Signals', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          contacts: { key: 'contacts', label: 'Contacts', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          generated_content: { key: 'generated_content', label: 'Generated content', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
        },
      },
      nextActions: [],
    });
  });

  it('loads operator-critical account data across canonical account scope', async () => {
    const result = await loadAccountCommandCenterData('Boston Beer Company');

    expect(mockedResolveCanonicalAccountScope).toHaveBeenCalledWith('Boston Beer Company');
    expect(mockedDb.dbGetPersonasByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetGeneratedContentByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetEmailLogsByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetMeetingsByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetMobileCapturesByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetOperatorOutcomesByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetSendJobsByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedDb.dbGetSendJobRecipientEventsByAccounts).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedListAccountContactCandidates).toHaveBeenCalledWith(['Boston Beer Company', 'The Boston Beer Company']);
    expect(mockedGetAgentContentContext).toHaveBeenCalledWith({
      accountName: 'Boston Beer Company',
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
    });
    expect(result.personas).toHaveLength(1);
    expect(result.generatedAssetRows).toHaveLength(1);
    expect(result.emailLogs).toHaveLength(1);
    expect(result.contactCandidates).toHaveLength(1);
    expect(result.operatorOutcomes).toHaveLength(1);
    expect(result.sendJobs).toHaveLength(1);
    expect(result.sendJobRecipientEvents).toHaveLength(1);
  });

  it('summarizes scope metadata for account-page diagnostics', () => {
    expect(summarizeAccountScope({
      accountName: 'Boston Beer Company',
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      normalizedAliases: ['The Boston Beer Company'],
      canonicalCompanyIds: ['account:boston beer company', 'domain:bostonbeer.com'],
    })).toEqual({
      accountName: 'Boston Beer Company',
      scopedAccountCount: 2,
      normalizedAliasCount: 1,
      canonicalCompanyCount: 2,
    });
  });
});
