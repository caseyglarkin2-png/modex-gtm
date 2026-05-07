import type { PrismaClient } from '@prisma/client';
import { normalizeAccountAliasKey, resolveCanonicalAccountScope } from '@/lib/revops/account-identity';

export type OneAccountRecipient = {
  to: string;
  accountName?: string | null;
};

export type OneAccountInvariantInput = {
  accountName?: string | null;
  recipients: OneAccountRecipient[];
  cc?: string[];
};

export type OneAccountInvariantResult =
  | {
      ok: true;
      canonicalAccountName: string;
      scopedAccountNames: string[];
      normalizedCc: string[];
    }
  | {
      ok: false;
      reason: 'MIXED_ACCOUNT_PAYLOAD';
      message: string;
      details: Record<string, unknown>;
      normalizedCc: string[];
    };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailDomain(value: string) {
  const at = value.lastIndexOf('@');
  if (at < 0) return '';
  return value.slice(at + 1).trim().toLowerCase();
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isAccountInScope(candidate: string, scopedAccountNames: string[]) {
  const candidateKey = normalizeAccountAliasKey(candidate);
  return scopedAccountNames.some((name) => normalizeAccountAliasKey(name) === candidateKey);
}

export async function enforceOneAccountInvariant(
  prisma: PrismaClient,
  input: OneAccountInvariantInput,
): Promise<OneAccountInvariantResult> {
  const normalizedCc = dedupe((input.cc ?? []).map(normalizeEmail));
  const hintedAccounts = dedupe([
    input.accountName?.trim() ?? '',
    ...input.recipients.map((recipient) => recipient.accountName?.trim() ?? ''),
  ]);

  if (hintedAccounts.length === 0) {
    return {
      ok: true,
      canonicalAccountName: '',
      scopedAccountNames: [],
      normalizedCc,
    };
  }

  const primaryAccountName = hintedAccounts[0];
  const scope = await resolveCanonicalAccountScope(primaryAccountName);
  const scopedAccountNames = scope.accountNames.length > 0 ? scope.accountNames : [primaryAccountName];

  const outOfScopeHints = hintedAccounts.filter((candidate) => !isAccountInScope(candidate, scopedAccountNames));
  if (outOfScopeHints.length > 0) {
    return {
      ok: false,
      reason: 'MIXED_ACCOUNT_PAYLOAD',
      message: 'Recipients resolve to multiple canonical accounts.',
      details: {
        primaryAccountName,
        scopedAccountNames,
        outOfScopeAccounts: outOfScopeHints,
      },
      normalizedCc,
    };
  }

  if (normalizedCc.length === 0) {
    return {
      ok: true,
      canonicalAccountName: primaryAccountName,
      scopedAccountNames,
      normalizedCc,
    };
  }

  const scopedPersonas = await prisma.persona.findMany({
    where: { account_name: { in: scopedAccountNames } },
    select: {
      email: true,
      company_domain: true,
      account_name: true,
    },
  });

  const scopedDomains = new Set<string>();
  for (const persona of scopedPersonas) {
    if (persona.company_domain?.trim()) scopedDomains.add(persona.company_domain.trim().toLowerCase());
    if (persona.email?.trim()) scopedDomains.add(emailDomain(persona.email));
  }
  for (const recipient of input.recipients) {
    if (recipient.to.trim()) scopedDomains.add(emailDomain(normalizeEmail(recipient.to)));
  }

  const ccPersonaRows = await prisma.persona.findMany({
    where: { email: { in: normalizedCc } },
    select: {
      email: true,
      account_name: true,
    },
  });
  const ccAccountByEmail = new Map(
    ccPersonaRows
      .filter((row) => row.email)
      .map((row) => [normalizeEmail(row.email!), row.account_name]),
  );

  const outOfScopeCc = normalizedCc.filter((ccEmail) => {
    const mappedAccount = ccAccountByEmail.get(ccEmail);
    if (mappedAccount) return !isAccountInScope(mappedAccount, scopedAccountNames);
    const domain = emailDomain(ccEmail);
    if (!domain || scopedDomains.size === 0) return false;
    return !scopedDomains.has(domain);
  });

  if (outOfScopeCc.length > 0) {
    return {
      ok: false,
      reason: 'MIXED_ACCOUNT_PAYLOAD',
      message: 'CC recipients are outside the canonical account scope.',
      details: {
        primaryAccountName,
        scopedAccountNames,
        outOfScopeCc,
      },
      normalizedCc,
    };
  }

  return {
    ok: true,
    canonicalAccountName: primaryAccountName,
    scopedAccountNames,
    normalizedCc,
  };
}
