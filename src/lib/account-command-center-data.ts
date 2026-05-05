import {
  dbGetActivitiesByAccounts,
  dbGetEmailLogsByAccounts,
  dbGetGeneratedContentByAccounts,
  dbGetMeetingsByAccounts,
  dbGetMicrositeAccountAnalyticsByAccounts,
  dbGetMobileCapturesByAccounts,
  dbGetOperatorOutcomesByAccounts,
  dbGetPersonasByAccounts,
  dbGetSendJobRecipientEventsByAccounts,
  dbGetSendJobsByAccounts,
} from '@/lib/db';
import { getAgentContentContext } from '@/lib/agent-actions/content-context';
import { listAccountContactCandidates } from '@/lib/account-contact-candidates';
import { ensureCanonicalRecords } from '@/lib/revops/canonical-sync';
import { resolveCanonicalAccountScope, type CanonicalAccountScope } from '@/lib/revops/account-identity';

export async function loadAccountCommandCenterData(accountName: string) {
  const accountScope = await resolveCanonicalAccountScope(accountName);
  const [personas, microsite, rawActivities, generatedAssetRows, emailLogs, meetings, captures, canonicalWorkspace, agentContentContext, contactCandidates, sendJobs, sendJobRecipientEvents, operatorOutcomes] = await Promise.all([
    dbGetPersonasByAccounts(accountScope.accountNames),
    dbGetMicrositeAccountAnalyticsByAccounts(accountScope.accountNames),
    dbGetActivitiesByAccounts(accountScope.accountNames),
    dbGetGeneratedContentByAccounts(accountScope.accountNames),
    dbGetEmailLogsByAccounts(accountScope.accountNames),
    dbGetMeetingsByAccounts(accountScope.accountNames),
    dbGetMobileCapturesByAccounts(accountScope.accountNames),
    ensureCanonicalRecords({ accountNames: accountScope.accountNames }),
    getAgentContentContext({ accountName, accountNames: accountScope.accountNames }),
    listAccountContactCandidates(accountScope.accountNames),
    dbGetSendJobsByAccounts(accountScope.accountNames),
    dbGetSendJobRecipientEventsByAccounts(accountScope.accountNames),
    dbGetOperatorOutcomesByAccounts(accountScope.accountNames),
  ]);

  return {
    accountScope,
    personas,
    microsite,
    rawActivities,
    generatedAssetRows,
    emailLogs,
    meetings,
    captures,
    canonicalWorkspace,
    agentContentContext,
    contactCandidates,
    sendJobs,
    sendJobRecipientEvents,
    operatorOutcomes,
  };
}

export function summarizeAccountScope(accountScope: CanonicalAccountScope) {
  return {
    accountName: accountScope.accountName,
    scopedAccountCount: accountScope.accountNames.length,
    normalizedAliasCount: accountScope.normalizedAliases.length,
    canonicalCompanyCount: accountScope.canonicalCompanyIds.length,
  };
}
