import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { fetchAccountIdentityReport } from '@/lib/revops/account-identity-report';
import { syncCanonicalRecords } from '@/lib/revops/canonical-sync';

export type CanonicalBackfillAudit = {
  at: string;
  accountCount: number;
  clusterCount: number;
  impactedAccountCount: number;
  mismatchedCanonicalClusterCount: number;
  missingCanonicalLinkCount: number;
  signature: string;
};

export async function runCanonicalBackfill(scope: {
  accountNames?: string[];
  personaIds?: number[];
} = {}): Promise<CanonicalBackfillAudit> {
  const report = await fetchAccountIdentityReport();
  const scopedAccountNames = Array.from(
    new Set(
      scope.accountNames?.length
        ? scope.accountNames
        : scope.personaIds?.length
          ? []
        : report.clusters.flatMap((cluster) => cluster.accountNames),
    ),
  );

  if (scope.personaIds?.length || scopedAccountNames.length > 0) {
    await syncCanonicalRecords({
      accountNames: scopedAccountNames,
      personaIds: scope.personaIds,
    });
  }

  const refreshedReport = await fetchAccountIdentityReport();
  const at = new Date().toISOString();
  const signer = process.env.CRON_SECRET || 'missing-cron-secret';
  const signature = crypto
    .createHash('sha256')
    .update(`canonical-backfill:${at}:${scopedAccountNames.join('|')}:${(scope.personaIds ?? []).join('|')}:${signer}`)
    .digest('hex');

  const audit: CanonicalBackfillAudit = {
    at,
    accountCount: scopedAccountNames.length,
    clusterCount: refreshedReport.summary.clusterCount,
    impactedAccountCount: refreshedReport.summary.impactedAccountCount,
    mismatchedCanonicalClusterCount: refreshedReport.summary.mismatchedCanonicalClusterCount,
    missingCanonicalLinkCount: refreshedReport.summary.missingCanonicalLinkCount,
    signature,
  };

  await prisma.systemConfig.upsert({
    where: { key: 'runbook:canonical-backfill:last' },
    update: {
      value: JSON.stringify(audit),
    },
    create: {
      key: 'runbook:canonical-backfill:last',
      value: JSON.stringify(audit),
    },
  });

  return audit;
}
