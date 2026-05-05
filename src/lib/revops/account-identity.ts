import { prisma } from '@/lib/prisma';

export type CanonicalAccountScope = {
  accountName: string;
  accountNames: string[];
  normalizedAliases: string[];
  canonicalCompanyIds: string[];
};

export function normalizeAccountAliasKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findNormalizedAccountAliases(accountName: string, candidateNames: string[]): string[] {
  const targetKey = normalizeAccountAliasKey(accountName);
  return Array.from(
    new Set(
      candidateNames.filter((candidate) => normalizeAccountAliasKey(candidate) === targetKey),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export async function resolveCanonicalAccountScope(accountName: string): Promise<CanonicalAccountScope> {
  const accounts = await prisma.account.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  });
  const normalizedAliases = findNormalizedAccountAliases(
    accountName,
    accounts.map((account) => account.name),
  );
  const seedNames = Array.from(new Set([accountName, ...normalizedAliases]));

  const seedLinks = await prisma.canonicalAccountLink.findMany({
    where: { account_name: { in: seedNames } },
    select: {
      account_name: true,
      canonical_company_id: true,
    },
  });
  const canonicalCompanyIds = Array.from(new Set(seedLinks.map((link) => link.canonical_company_id)));
  const linkedAccounts = canonicalCompanyIds.length > 0
    ? await prisma.canonicalAccountLink.findMany({
        where: { canonical_company_id: { in: canonicalCompanyIds } },
        select: {
          account_name: true,
        },
      })
    : [];

  return {
    accountName,
    accountNames: Array.from(
      new Set([
        ...seedNames,
        ...linkedAccounts.map((account) => account.account_name),
      ]),
    ).sort((left, right) => left.localeCompare(right)),
    normalizedAliases: normalizedAliases.filter((candidate) => candidate !== accountName),
    canonicalCompanyIds,
  };
}
