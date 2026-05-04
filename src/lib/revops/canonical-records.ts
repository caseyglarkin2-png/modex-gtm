export type CanonicalConflictCode =
  | 'duplicate_contact'
  | 'duplicate_company'
  | 'multi_account_collision'
  | 'orphan_contact'
  | 'domain_conflict';

export type CanonicalStatus = 'resolved' | 'conflict' | 'unresolved';

export type CanonicalAccountInput = {
  name: string;
  hubspot_company_id?: string | null;
};

export type CanonicalPersonaInput = {
  id: number;
  account_name: string;
  name: string;
  normalized_name?: string | null;
  email?: string | null;
  email_valid?: boolean;
  company_domain?: string | null;
  hubspot_contact_id?: string | null;
  do_not_contact?: boolean;
  quality_score?: number;
};

export type CanonicalContactRecord = {
  personaId: number;
  canonicalContactId: string | null;
  canonicalCompanyId: string | null;
  canonicalCompanySource: 'hubspot_company_id' | 'company_domain' | 'account_name' | 'missing';
  status: CanonicalStatus;
  conflictCodes: CanonicalConflictCode[];
  sendBlocked: boolean;
  sendBlockReason: string | null;
};

export type CanonicalAccountSummary = {
  accountName: string;
  canonicalCompanyId: string | null;
  canonicalCompanySource: 'hubspot_company_id' | 'company_domain' | 'account_name' | 'missing';
  linkedContacts: number;
  sendableContacts: number;
  unresolvedConflicts: number;
  duplicateCompanyAccounts: string[];
};

export type CanonicalWorkspace = {
  contactsByPersonaId: Map<number, CanonicalContactRecord>;
  accountSummaries: Map<string, CanonicalAccountSummary>;
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');
  return normalized || null;
}

export function normalizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim().toLowerCase();
  if (!candidate) return null;

  const stripped = candidate
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('@')
    .pop()
    ?.trim() ?? '';

  return stripped || null;
}

function buildAccountCompanyInfo(
  account: CanonicalAccountInput | undefined,
  personas: CanonicalPersonaInput[],
): {
  canonicalCompanyId: string | null;
  canonicalCompanySource: CanonicalAccountSummary['canonicalCompanySource'];
  domain: string | null;
} {
  if (account?.hubspot_company_id) {
    return {
      canonicalCompanyId: `hubspot-company:${account.hubspot_company_id}`,
      canonicalCompanySource: 'hubspot_company_id',
      domain: null,
    };
  }

  const domainCounts = personas.reduce<Map<string, number>>((acc, persona) => {
    const domain = normalizeDomain(persona.company_domain);
    if (!domain) return acc;
    acc.set(domain, (acc.get(domain) ?? 0) + 1);
    return acc;
  }, new Map());

  const dominantDomain = Array.from(domainCounts.entries())
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

  if (dominantDomain) {
    return {
      canonicalCompanyId: `domain:${dominantDomain}`,
      canonicalCompanySource: 'company_domain',
      domain: dominantDomain,
    };
  }

  if (!account) {
    return {
      canonicalCompanyId: null,
      canonicalCompanySource: 'missing',
      domain: null,
    };
  }

  return {
    canonicalCompanyId: `account:${normalizeName(account.name)}`,
    canonicalCompanySource: 'account_name',
    domain: null,
  };
}

export function buildCanonicalWorkspace(
  accounts: CanonicalAccountInput[],
  personas: CanonicalPersonaInput[],
): CanonicalWorkspace {
  const accountsByName = new Map(accounts.map((account) => [account.name, account]));
  const personasByAccount = personas.reduce<Map<string, CanonicalPersonaInput[]>>((acc, persona) => {
    const bucket = acc.get(persona.account_name) ?? [];
    bucket.push(persona);
    acc.set(persona.account_name, bucket);
    return acc;
  }, new Map());

  const accountCompanyInfo = new Map<string, ReturnType<typeof buildAccountCompanyInfo>>();
  for (const [accountName, bucket] of personasByAccount.entries()) {
    accountCompanyInfo.set(accountName, buildAccountCompanyInfo(accountsByName.get(accountName), bucket));
  }
  for (const account of accounts) {
    if (!accountCompanyInfo.has(account.name)) {
      accountCompanyInfo.set(account.name, buildAccountCompanyInfo(account, []));
    }
  }

  const contactKeyCounts = new Map<string, number>();
  const contactKeyAccounts = new Map<string, Set<string>>();
  const companyKeyAccounts = new Map<string, Set<string>>();

  const draft = personas.map((persona) => {
    const companyInfo = accountCompanyInfo.get(persona.account_name) ?? {
      canonicalCompanyId: null,
      canonicalCompanySource: 'missing' as const,
      domain: null,
    };
    const normalizedName = persona.normalized_name || normalizeName(persona.name);
    const email = persona.email?.trim().toLowerCase() ?? null;
    const emailDomain = normalizeDomain(email);
    const companyDomain = normalizeDomain(persona.company_domain) ?? companyInfo.domain;

    let canonicalContactId: string | null = null;
    if (persona.hubspot_contact_id) {
      canonicalContactId = `hubspot-contact:${persona.hubspot_contact_id}`;
    } else if (email && persona.email_valid !== false) {
      canonicalContactId = `email:${email}`;
    } else if (normalizedName && companyInfo.canonicalCompanyId) {
      canonicalContactId = `name-company:${normalizedName}:${companyInfo.canonicalCompanyId}`;
    }

    if (canonicalContactId) {
      contactKeyCounts.set(canonicalContactId, (contactKeyCounts.get(canonicalContactId) ?? 0) + 1);
      const accountsForKey = contactKeyAccounts.get(canonicalContactId) ?? new Set<string>();
      accountsForKey.add(persona.account_name);
      contactKeyAccounts.set(canonicalContactId, accountsForKey);
    }

    if (companyInfo.canonicalCompanyId) {
      const companyAccounts = companyKeyAccounts.get(companyInfo.canonicalCompanyId) ?? new Set<string>();
      companyAccounts.add(persona.account_name);
      companyKeyAccounts.set(companyInfo.canonicalCompanyId, companyAccounts);
    }

    return {
      persona,
      companyInfo,
      canonicalContactId,
      emailDomain,
      companyDomain,
    };
  });

  const contactsByPersonaId = new Map<number, CanonicalContactRecord>();
  for (const row of draft) {
    const conflictCodes: CanonicalConflictCode[] = [];

    if (!row.canonicalContactId || !row.companyInfo.canonicalCompanyId) {
      conflictCodes.push('orphan_contact');
    }
    if (row.canonicalContactId && (contactKeyCounts.get(row.canonicalContactId) ?? 0) > 1) {
      conflictCodes.push('duplicate_contact');
    }
    if (row.canonicalContactId && (contactKeyAccounts.get(row.canonicalContactId)?.size ?? 0) > 1) {
      conflictCodes.push('multi_account_collision');
    }
    if (row.companyInfo.canonicalCompanyId && (companyKeyAccounts.get(row.companyInfo.canonicalCompanyId)?.size ?? 0) > 1) {
      conflictCodes.push('duplicate_company');
    }
    if (row.emailDomain && row.companyDomain && row.emailDomain !== row.companyDomain) {
      conflictCodes.push('domain_conflict');
    }

    const uniqueConflictCodes = Array.from(new Set(conflictCodes));
    const status: CanonicalStatus = uniqueConflictCodes.length === 0
      ? 'resolved'
      : uniqueConflictCodes.includes('orphan_contact')
        ? 'unresolved'
        : 'conflict';

    const sendBlocked = status !== 'resolved';
    const sendBlockReason = !sendBlocked
      ? null
      : uniqueConflictCodes.includes('multi_account_collision')
        ? 'Recipient identity collides across multiple accounts.'
        : uniqueConflictCodes.includes('domain_conflict')
          ? 'Recipient email domain conflicts with company domain.'
          : uniqueConflictCodes.includes('duplicate_contact')
            ? 'Recipient matches a duplicate canonical contact.'
            : 'Recipient is missing canonical company/contact linkage.';

    contactsByPersonaId.set(row.persona.id, {
      personaId: row.persona.id,
      canonicalContactId: row.canonicalContactId,
      canonicalCompanyId: row.companyInfo.canonicalCompanyId,
      canonicalCompanySource: row.companyInfo.canonicalCompanySource,
      status,
      conflictCodes: uniqueConflictCodes,
      sendBlocked,
      sendBlockReason,
    });
  }

  const accountSummaries = new Map<string, CanonicalAccountSummary>();
  for (const account of accounts) {
    const companyInfo = accountCompanyInfo.get(account.name) ?? {
      canonicalCompanyId: null,
      canonicalCompanySource: 'missing' as const,
      domain: null,
    };
    const bucket = personasByAccount.get(account.name) ?? [];
    const resolutions = bucket
      .map((persona) => contactsByPersonaId.get(persona.id))
      .filter((value): value is CanonicalContactRecord => Boolean(value));
    const duplicateCompanyAccounts = companyInfo.canonicalCompanyId
      ? Array.from(companyKeyAccounts.get(companyInfo.canonicalCompanyId) ?? []).filter((name) => name !== account.name)
      : [];

    accountSummaries.set(account.name, {
      accountName: account.name,
      canonicalCompanyId: companyInfo.canonicalCompanyId,
      canonicalCompanySource: companyInfo.canonicalCompanySource,
      linkedContacts: bucket.length,
      sendableContacts: bucket.filter((persona) => Boolean(persona.email)).length,
      unresolvedConflicts: resolutions.filter((resolution) => resolution.status !== 'resolved').length,
      duplicateCompanyAccounts,
    });
  }

  return { contactsByPersonaId, accountSummaries };
}

export function formatCanonicalStatusLabel(status: CanonicalStatus): string {
  if (status === 'resolved') return 'Resolved';
  if (status === 'conflict') return 'Conflict';
  return 'Unresolved';
}

export function formatCanonicalConflictLabel(code: CanonicalConflictCode): string {
  switch (code) {
    case 'duplicate_contact':
      return 'Duplicate contact';
    case 'duplicate_company':
      return 'Duplicate company';
    case 'multi_account_collision':
      return 'Multi-account collision';
    case 'orphan_contact':
      return 'Orphan contact';
    case 'domain_conflict':
      return 'Domain conflict';
  }
}

type CanonicalPrismaClient = {
  persona: {
    findUnique: (args: {
      where: { id: number };
      select: Record<string, boolean>;
    }) => Promise<unknown>;
    findMany: (args: {
      where?: Record<string, unknown>;
      select: Record<string, boolean>;
    }) => Promise<unknown>;
  };
  account: {
    findUnique?: (args: {
      where: { name: string };
      select: Record<string, boolean>;
    }) => Promise<unknown>;
    findMany: (args: {
      where?: Record<string, unknown>;
      select: Record<string, boolean>;
    }) => Promise<unknown>;
  };
};

const personaCanonicalSelect = {
  id: true,
  account_name: true,
  name: true,
  normalized_name: true,
  email: true,
  email_valid: true,
  company_domain: true,
  hubspot_contact_id: true,
  do_not_contact: true,
  quality_score: true,
} as const;

const accountCanonicalSelect = {
  name: true,
  hubspot_company_id: true,
} as const;

export async function resolveCanonicalSendTargets(
  prisma: CanonicalPrismaClient,
  personaIds: number[],
): Promise<Map<number, CanonicalContactRecord>> {
  if (personaIds.length === 0) return new Map();

  const seeds = await prisma.persona.findMany({
    where: { id: { in: personaIds } },
    select: personaCanonicalSelect,
  }) as CanonicalPersonaInput[];
  if (seeds.length === 0) return new Map();

  const hubspotIds = seeds.map((persona) => persona.hubspot_contact_id).filter((value): value is string => Boolean(value));
  const emails = seeds.map((persona) => persona.email?.toLowerCase()).filter((value): value is string => Boolean(value));

  const peers = await prisma.persona.findMany({
    where: {
      OR: [
        { id: { in: personaIds } },
        ...(hubspotIds.length > 0 ? [{ hubspot_contact_id: { in: hubspotIds } }] : []),
        ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
      ],
    },
    select: personaCanonicalSelect,
  }) as CanonicalPersonaInput[];
  const accountNames = Array.from(new Set(peers.map((persona) => persona.account_name)));
  const accounts = await prisma.account.findMany({
    where: { name: { in: accountNames } },
    select: accountCanonicalSelect,
  }) as CanonicalAccountInput[];

  return buildCanonicalWorkspace(accounts, peers).contactsByPersonaId;
}
