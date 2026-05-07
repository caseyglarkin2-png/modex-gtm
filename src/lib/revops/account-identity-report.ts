import { prisma } from '@/lib/prisma';
import { normalizeAccountAliasKey } from '@/lib/revops/account-identity';

type AccountIdentityAccount = {
  name: string;
  hubspot_company_id?: string | null;
};

type AccountIdentityLink = {
  account_name: string;
  canonical_company_id: string;
  status?: string;
};

type AccountIdentityPersona = {
  account_name: string;
  email?: string | null;
};

type AccountIdentityRow = {
  account_name: string;
};

export type AccountIdentityCluster = {
  key: string;
  reasons: Array<'normalized_alias' | 'shared_canonical_company'>;
  normalizedKeys: string[];
  accountNames: string[];
  canonicalCompanyIds: string[];
  missingCanonicalLinks: string[];
  hubspotBackedAccounts: string[];
  contactCount: number;
  sendableContactCount: number;
  generatedContentCount: number;
  emailLogCount: number;
  unresolvedConflicts: number;
  mismatchedCanonicalIds: boolean;
  suggestedPrimaryAccount: string;
};

export type AccountIdentityReport = {
  clusters: AccountIdentityCluster[];
  summary: {
    clusterCount: number;
    impactedAccountCount: number;
    mismatchedCanonicalClusterCount: number;
    missingCanonicalLinkCount: number;
  };
};

function escapeCsvValue(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

export function buildAccountIdentityReport(input: {
  accounts: AccountIdentityAccount[];
  links: AccountIdentityLink[];
  personas: AccountIdentityPersona[];
  generatedContentRows: AccountIdentityRow[];
  emailLogRows: AccountIdentityRow[];
  conflictRows: AccountIdentityRow[];
}): AccountIdentityReport {
  const normalizedGroups = input.accounts.reduce<Map<string, string[]>>((acc, account) => {
    const key = normalizeAccountAliasKey(account.name);
    const bucket = acc.get(key) ?? [];
    bucket.push(account.name);
    acc.set(key, bucket);
    return acc;
  }, new Map());

  const canonicalGroups = input.links.reduce<Map<string, string[]>>((acc, link) => {
    const bucket = acc.get(link.canonical_company_id) ?? [];
    bucket.push(link.account_name);
    acc.set(link.canonical_company_id, bucket);
    return acc;
  }, new Map());

  const clusterMap = new Map<string, { accountNames: Set<string>; reasons: Set<'normalized_alias' | 'shared_canonical_company'>; normalizedKeys: Set<string> }>();
  for (const [normalizedKey, accountNames] of normalizedGroups.entries()) {
    if (accountNames.length <= 1) continue;
    const key = [...new Set(accountNames)].sort().join('|');
    clusterMap.set(key, {
      accountNames: new Set(accountNames),
      reasons: new Set(['normalized_alias']),
      normalizedKeys: new Set([normalizedKey]),
    });
  }

  for (const [, accountNames] of canonicalGroups.entries()) {
    if (accountNames.length <= 1) continue;
    const key = [...new Set(accountNames)].sort().join('|');
    const existing = clusterMap.get(key);
    if (existing) {
      existing.reasons.add('shared_canonical_company');
      for (const accountName of accountNames) existing.accountNames.add(accountName);
      for (const accountName of accountNames) existing.normalizedKeys.add(normalizeAccountAliasKey(accountName));
      continue;
    }
    clusterMap.set(key, {
      accountNames: new Set(accountNames),
      reasons: new Set(['shared_canonical_company']),
      normalizedKeys: new Set(accountNames.map((accountName) => normalizeAccountAliasKey(accountName))),
    });
  }

  const linkMap = input.links.reduce<Map<string, string[]>>((acc, link) => {
    const bucket = acc.get(link.account_name) ?? [];
    bucket.push(link.canonical_company_id);
    acc.set(link.account_name, bucket);
    return acc;
  }, new Map());
  const accountMap = new Map(input.accounts.map((account) => [account.name, account]));
  const personaCounts = input.personas.reduce<Map<string, { contacts: number; sendable: number }>>((acc, persona) => {
    const bucket = acc.get(persona.account_name) ?? { contacts: 0, sendable: 0 };
    bucket.contacts += 1;
    if (persona.email) bucket.sendable += 1;
    acc.set(persona.account_name, bucket);
    return acc;
  }, new Map());
  const generatedCounts = input.generatedContentRows.reduce<Map<string, number>>((acc, row) => {
    acc.set(row.account_name, (acc.get(row.account_name) ?? 0) + 1);
    return acc;
  }, new Map());
  const emailLogCounts = input.emailLogRows.reduce<Map<string, number>>((acc, row) => {
    acc.set(row.account_name, (acc.get(row.account_name) ?? 0) + 1);
    return acc;
  }, new Map());
  const conflictCounts = input.conflictRows.reduce<Map<string, number>>((acc, row) => {
    acc.set(row.account_name, (acc.get(row.account_name) ?? 0) + 1);
    return acc;
  }, new Map());

  const clusters = Array.from(clusterMap.values()).map((cluster) => {
    const accountNames = Array.from(cluster.accountNames).sort((left, right) => left.localeCompare(right));
    const canonicalCompanyIds = Array.from(new Set(accountNames.flatMap((accountName) => linkMap.get(accountName) ?? []))).sort();
    const missingCanonicalLinks = accountNames.filter((accountName) => !linkMap.has(accountName));
    const hubspotBackedAccounts = accountNames.filter((accountName) => Boolean(accountMap.get(accountName)?.hubspot_company_id));
    const totals = accountNames.reduce((acc, accountName) => {
      const contacts = personaCounts.get(accountName);
      acc.contactCount += contacts?.contacts ?? 0;
      acc.sendableContactCount += contacts?.sendable ?? 0;
      acc.generatedContentCount += generatedCounts.get(accountName) ?? 0;
      acc.emailLogCount += emailLogCounts.get(accountName) ?? 0;
      acc.unresolvedConflicts += conflictCounts.get(accountName) ?? 0;
      return acc;
    }, {
      contactCount: 0,
      sendableContactCount: 0,
      generatedContentCount: 0,
      emailLogCount: 0,
      unresolvedConflicts: 0,
    });
    const suggestedPrimaryAccount = accountNames
      .slice()
      .sort((left, right) => {
        const leftHubspot = accountMap.get(left)?.hubspot_company_id ? 1 : 0;
        const rightHubspot = accountMap.get(right)?.hubspot_company_id ? 1 : 0;
        if (rightHubspot !== leftHubspot) return rightHubspot - leftHubspot;
        const leftSendable = personaCounts.get(left)?.sendable ?? 0;
        const rightSendable = personaCounts.get(right)?.sendable ?? 0;
        if (rightSendable !== leftSendable) return rightSendable - leftSendable;
        return left.localeCompare(right);
      })[0] ?? accountNames[0];

    return {
      key: accountNames.join('|'),
      reasons: Array.from(cluster.reasons).sort(),
      normalizedKeys: Array.from(cluster.normalizedKeys).sort(),
      accountNames,
      canonicalCompanyIds,
      missingCanonicalLinks,
      hubspotBackedAccounts,
      ...totals,
      mismatchedCanonicalIds: canonicalCompanyIds.length > 1,
      suggestedPrimaryAccount,
    } satisfies AccountIdentityCluster;
  }).sort((left, right) => {
    if (right.accountNames.length !== left.accountNames.length) return right.accountNames.length - left.accountNames.length;
    if (right.mismatchedCanonicalIds !== left.mismatchedCanonicalIds) return Number(right.mismatchedCanonicalIds) - Number(left.mismatchedCanonicalIds);
    return left.accountNames[0].localeCompare(right.accountNames[0]);
  });

  return {
    clusters,
    summary: {
      clusterCount: clusters.length,
      impactedAccountCount: new Set(clusters.flatMap((cluster) => cluster.accountNames)).size,
      mismatchedCanonicalClusterCount: clusters.filter((cluster) => cluster.mismatchedCanonicalIds).length,
      missingCanonicalLinkCount: clusters.reduce((sum, cluster) => sum + cluster.missingCanonicalLinks.length, 0),
    },
  };
}

export async function fetchAccountIdentityReport(): Promise<AccountIdentityReport> {
  const [accounts, links, personas, generatedContentRows, emailLogRows, conflictRows] = await Promise.all([
    prisma.account.findMany({
      select: { name: true, hubspot_company_id: true },
      orderBy: { name: 'asc' },
    }),
    prisma.canonicalAccountLink.findMany({
      select: { account_name: true, canonical_company_id: true, status: true },
    }),
    prisma.persona.findMany({
      select: { account_name: true, email: true },
    }),
    prisma.generatedContent.findMany({
      select: { account_name: true },
    }),
    prisma.emailLog.findMany({
      select: { account_name: true },
    }),
    prisma.canonicalConflict.findMany({
      where: { status: 'open' },
      select: { account_name: true },
    }).then((rows) => rows.filter((row): row is { account_name: string } => Boolean(row.account_name))),
  ]);

  return buildAccountIdentityReport({
    accounts,
    links,
    personas,
    generatedContentRows,
    emailLogRows,
    conflictRows,
  });
}

export function serializeAccountIdentityReportCsv(report: AccountIdentityReport): string {
  const header = [
    'cluster_key',
    'suggested_primary_account',
    'reasons',
    'account_names',
    'canonical_company_ids',
    'missing_canonical_links',
    'hubspot_backed_accounts',
    'normalized_keys',
    'contact_count',
    'sendable_contact_count',
    'generated_content_count',
    'email_log_count',
    'unresolved_conflicts',
    'mismatched_canonical_ids',
  ];

  const rows = report.clusters.map((cluster) => [
    cluster.key,
    cluster.suggestedPrimaryAccount,
    cluster.reasons.join('|'),
    cluster.accountNames.join('|'),
    cluster.canonicalCompanyIds.join('|'),
    cluster.missingCanonicalLinks.join('|'),
    cluster.hubspotBackedAccounts.join('|'),
    cluster.normalizedKeys.join('|'),
    cluster.contactCount,
    cluster.sendableContactCount,
    cluster.generatedContentCount,
    cluster.emailLogCount,
    cluster.unresolvedConflicts,
    cluster.mismatchedCanonicalIds,
  ]);

  return [
    header.join(','),
    ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(',')),
  ].join('\n');
}
