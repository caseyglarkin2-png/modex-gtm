import { prisma } from '@/lib/prisma';
import {
  buildCanonicalWorkspace,
  type CanonicalAccountInput,
  type CanonicalConflictCode,
  type CanonicalPersonaInput,
  type CanonicalStatus,
  type CanonicalWorkspace,
} from '@/lib/revops/canonical-records';

type SyncScope = {
  accountNames?: string[];
  personaIds?: number[];
};

async function loadScope(scope: SyncScope): Promise<{ accounts: CanonicalAccountInput[]; personas: CanonicalPersonaInput[] }> {
  const canonicalPersonaSelect = {
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

  let personas: CanonicalPersonaInput[] = [];
  if (scope.personaIds?.length) {
    const seedPersonas = await prisma.persona.findMany({
      where: { id: { in: scope.personaIds } },
      select: canonicalPersonaSelect,
    });
    const hubspotIds = seedPersonas.map((persona) => persona.hubspot_contact_id).filter((value): value is string => Boolean(value));
    const emails = seedPersonas.map((persona) => persona.email?.toLowerCase()).filter((value): value is string => Boolean(value));
    personas = await prisma.persona.findMany({
      where: {
        OR: [
          { id: { in: scope.personaIds } },
          ...(hubspotIds.length > 0 ? [{ hubspot_contact_id: { in: hubspotIds } }] : []),
          ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
          ...(scope.accountNames?.length ? [{ account_name: { in: scope.accountNames } }] : []),
        ],
      },
      select: canonicalPersonaSelect,
    });
  } else {
    personas = await prisma.persona.findMany({
      where: scope.accountNames?.length ? { account_name: { in: scope.accountNames } } : undefined,
      select: canonicalPersonaSelect,
    });
  }

  const accountNames = Array.from(new Set([
    ...(scope.accountNames ?? []),
    ...personas.map((persona) => persona.account_name),
  ]));

  const accounts = await prisma.account.findMany({
    where: accountNames.length > 0 ? { name: { in: accountNames } } : undefined,
    select: {
      name: true,
      hubspot_company_id: true,
    },
  });

  return { accounts, personas };
}

function buildConflictReason(code: string): string {
  switch (code) {
    case 'duplicate_contact':
      return 'Canonical contact matches multiple local records.';
    case 'duplicate_company':
      return 'Canonical company matches multiple account records.';
    case 'multi_account_collision':
      return 'Canonical contact collides across multiple accounts.';
    case 'orphan_contact':
      return 'Contact is missing canonical company or contact linkage.';
    case 'domain_conflict':
      return 'Email domain conflicts with company domain.';
    default:
      return 'Canonical identity conflict detected.';
  }
}

async function persistWorkspace(workspace: CanonicalWorkspace, scope: SyncScope) {
  const summaries = Array.from(workspace.accountSummaries.values());
  const contacts = Array.from(workspace.contactsByPersonaId.values());
  const personaIds = contacts.map((contact) => contact.personaId);
  const accountNames = summaries.map((summary) => summary.accountName);
  const personas = personaIds.length > 0
    ? await prisma.persona.findMany({
        where: { id: { in: personaIds } },
        select: {
          id: true,
          email: true,
          hubspot_contact_id: true,
          account_name: true,
        },
      })
    : [];
  const personaById = new Map(personas.map((persona) => [persona.id, persona]));

  if (personaIds.length > 0) {
    await prisma.canonicalConflict.deleteMany({ where: { persona_id: { in: personaIds } } });
    await prisma.canonicalContact.deleteMany({ where: { persona_id: { in: personaIds } } });
  }
  if (accountNames.length > 0) {
    await prisma.canonicalConflict.deleteMany({ where: { account_name: { in: accountNames } } });
    await prisma.canonicalAccountLink.deleteMany({ where: { account_name: { in: accountNames } } });
  }

  for (const summary of summaries) {
    if (!summary.canonicalCompanyId) continue;
    await prisma.canonicalCompany.upsert({
      where: { id: summary.canonicalCompanyId },
      update: {
        company_key: summary.canonicalCompanyId,
        source: summary.canonicalCompanySource,
        primary_account_name: summary.accountName,
        status: summary.unresolvedConflicts > 0 ? 'conflict' : 'resolved',
      },
      create: {
        id: summary.canonicalCompanyId,
        company_key: summary.canonicalCompanyId,
        source: summary.canonicalCompanySource,
        primary_account_name: summary.accountName,
        status: summary.unresolvedConflicts > 0 ? 'conflict' : 'resolved',
      },
    });
  }

  if (accountNames.length > 0) {
    await prisma.canonicalAccountLink.createMany({
      data: summaries
        .filter((summary) => Boolean(summary.canonicalCompanyId))
        .map((summary) => ({
          account_name: summary.accountName,
          canonical_company_id: summary.canonicalCompanyId!,
          status: summary.unresolvedConflicts > 0 ? 'conflict' : 'resolved',
        })),
      skipDuplicates: true,
    });
  }

  if (personaIds.length > 0) {
    await prisma.canonicalContact.createMany({
      data: contacts.map((contact) => {
        const persona = personaById.get(contact.personaId);
        return {
          id: `persona:${contact.personaId}`,
          canonical_key: contact.canonicalContactId,
          persona_id: contact.personaId,
          canonical_company_id: contact.canonicalCompanyId,
          email: persona?.email ?? null,
          hubspot_contact_id: persona?.hubspot_contact_id ?? null,
          status: contact.status,
          source: contact.canonicalCompanySource,
          block_reason: contact.sendBlockReason,
          conflict_codes: contact.conflictCodes,
        };
      }),
      skipDuplicates: true,
    });
  }

  const conflictRows = [
    ...summaries
      .filter((summary) => summary.canonicalCompanyId && summary.duplicateCompanyAccounts.length > 0)
      .map((summary) => ({
        code: 'duplicate_company',
        status: 'open',
        account_name: summary.accountName,
        canonical_company_id: summary.canonicalCompanyId!,
        reason: `Company collides with: ${summary.duplicateCompanyAccounts.join(', ')}`,
        persona_id: null,
        canonical_contact_id: null,
      })),
    ...contacts.flatMap((contact) => {
      const persona = personaById.get(contact.personaId);
      const contactId = `persona:${contact.personaId}`;
      return contact.conflictCodes.map((code) => ({
        code,
        status: 'open',
        reason: buildConflictReason(code),
        persona_id: contact.personaId,
        account_name: persona?.account_name ?? null,
        canonical_contact_id: contactId,
        canonical_company_id: contact.canonicalCompanyId,
      }));
    }),
  ];
  if (conflictRows.length > 0) {
    await prisma.canonicalConflict.createMany({
      data: conflictRows,
    });
  }

  await prisma.systemConfig.upsert({
    where: { key: 'canonical_records:last_sync' },
    update: {
      value: JSON.stringify({
        at: new Date().toISOString(),
        accountCount: summaries.length,
        contactCount: contacts.length,
        scope,
      }),
    },
    create: {
      key: 'canonical_records:last_sync',
      value: JSON.stringify({
        at: new Date().toISOString(),
        accountCount: summaries.length,
        contactCount: contacts.length,
        scope,
      }),
    },
  });
}

async function buildPersistedWorkspace(accounts: CanonicalAccountInput[], personas: CanonicalPersonaInput[]): Promise<CanonicalWorkspace> {
  const personaIds = personas.map((persona) => persona.id);
  const accountNames = accounts.map((account) => account.name);
  const [persistedContacts, persistedLinks, persistedConflicts] = await Promise.all([
    personaIds.length > 0
      ? prisma.canonicalContact.findMany({
          where: { persona_id: { in: personaIds } },
          select: {
            persona_id: true,
            id: true,
            canonical_key: true,
            canonical_company_id: true,
            status: true,
            source: true,
            block_reason: true,
            conflict_codes: true,
          },
        })
      : Promise.resolve([]),
    accountNames.length > 0
      ? prisma.canonicalAccountLink.findMany({
          where: { account_name: { in: accountNames } },
          select: {
            account_name: true,
            status: true,
            canonical_company: {
              select: {
                id: true,
                source: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    (personaIds.length > 0 || accountNames.length > 0)
      ? prisma.canonicalConflict.findMany({
          where: {
            OR: [
              ...(personaIds.length > 0 ? [{ persona_id: { in: personaIds } }] : []),
              ...(accountNames.length > 0 ? [{ account_name: { in: accountNames } }] : []),
            ],
          },
          select: {
            code: true,
            persona_id: true,
            account_name: true,
            canonical_company_id: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const persistedContactsByPersona = new Map(persistedContacts.map((contact) => [contact.persona_id, contact]));
  const conflictsByPersona = persistedConflicts.reduce<Map<number, CanonicalConflictCode[]>>((acc, conflict) => {
    if (!conflict.persona_id) return acc;
    const bucket = acc.get(conflict.persona_id) ?? [];
    bucket.push(conflict.code as CanonicalConflictCode);
    acc.set(conflict.persona_id, bucket);
    return acc;
  }, new Map());
  const linksByAccount = new Map(persistedLinks.map((link) => [link.account_name, link]));
  const companyAccounts = persistedLinks.reduce<Map<string, string[]>>((acc, link) => {
    const bucket = acc.get(link.canonical_company.id) ?? [];
    bucket.push(link.account_name);
    acc.set(link.canonical_company.id, bucket);
    return acc;
  }, new Map());

  const contactsByPersonaId = new Map();
  for (const persona of personas) {
    const persisted = persistedContactsByPersona.get(persona.id);
    const conflictCodes = conflictsByPersona.get(persona.id) ?? ((persisted?.conflict_codes as CanonicalConflictCode[] | null) ?? []);
    contactsByPersonaId.set(persona.id, {
      personaId: persona.id,
      canonicalContactId: persisted?.canonical_key ?? null,
      canonicalCompanyId: persisted?.canonical_company_id ?? null,
      canonicalCompanySource: ((persisted?.source as 'hubspot_company_id' | 'company_domain' | 'account_name' | 'missing' | null) ?? 'missing'),
      status: ((persisted?.status as CanonicalStatus | null) ?? 'unresolved'),
      conflictCodes,
      sendBlocked: (persisted?.status ?? 'unresolved') !== 'resolved',
      sendBlockReason: persisted?.block_reason ?? null,
    });
  }

  const accountSummaries = new Map();
  for (const account of accounts) {
    const link = linksByAccount.get(account.name);
    const bucket = personas.filter((persona) => persona.account_name === account.name);
    const duplicateCompanyAccounts = link?.canonical_company
      ? (companyAccounts.get(link.canonical_company.id) ?? []).filter((name) => name !== account.name)
      : [];
    const unresolvedConflicts = persistedConflicts.filter((conflict) => conflict.account_name === account.name).length
      + bucket.filter((persona) => {
        const persisted = persistedContactsByPersona.get(persona.id);
        return (persisted?.status ?? 'unresolved') !== 'resolved';
      }).length;

    accountSummaries.set(account.name, {
      accountName: account.name,
      canonicalCompanyId: link?.canonical_company.id ?? null,
      canonicalCompanySource: ((link?.canonical_company.source as 'hubspot_company_id' | 'company_domain' | 'account_name' | 'missing' | null) ?? 'missing'),
      linkedContacts: bucket.length,
      sendableContacts: bucket.filter((persona) => {
        if (!persona.email || persona.do_not_contact) return false;
        return !contactsByPersonaId.get(persona.id)?.sendBlocked;
      }).length,
      unresolvedConflicts,
      duplicateCompanyAccounts,
    });
  }

  return { contactsByPersonaId, accountSummaries };
}

export async function syncCanonicalRecords(scope: SyncScope = {}) {
  const { accounts, personas } = await loadScope(scope);
  const workspace = buildCanonicalWorkspace(accounts, personas);
  await persistWorkspace(workspace, scope);
  return {
    accountCount: workspace.accountSummaries.size,
    contactCount: workspace.contactsByPersonaId.size,
  };
}

export async function ensureCanonicalRecords(scope: SyncScope = {}) {
  const { accounts, personas } = await loadScope(scope);
  if (personas.length === 0 && accounts.length === 0) {
    return buildCanonicalWorkspace([], []);
  }

  const personaIds = personas.map((persona) => persona.id);
  const accountNames = accounts.map((account) => account.name);
  const [persistedContacts, persistedLinks] = await Promise.all([
    personaIds.length > 0
      ? prisma.canonicalContact.findMany({
          where: { persona_id: { in: personaIds } },
          select: {
            persona_id: true,
            id: true,
            canonical_company_id: true,
            status: true,
            block_reason: true,
            source: true,
            conflict_codes: true,
          },
        })
      : Promise.resolve([]),
    accountNames.length > 0
      ? prisma.canonicalAccountLink.findMany({
          where: { account_name: { in: accountNames } },
          select: {
            account_name: true,
            status: true,
            canonical_company: {
              select: {
                id: true,
                source: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const hasCompleteCoverage = persistedContacts.length === personaIds.length && persistedLinks.length === accountNames.length;
  if (!hasCompleteCoverage) {
    const safeInlineSync = personaIds.length > 0
      ? personaIds.length <= 100
      : accountNames.length <= 25;
    if (!safeInlineSync) {
      return buildCanonicalWorkspace(accounts, personas);
    }
    await syncCanonicalRecords(scope);
  }

  return buildPersistedWorkspace(accounts, personas);
}

export async function resolveCanonicalSendTargets(personaIds: number[]) {
  const workspace = await ensureCanonicalRecords({ personaIds });
  return workspace.contactsByPersonaId;
}
