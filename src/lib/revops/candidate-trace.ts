import type { PrismaClient } from '@prisma/client';

export type CandidateTrace = {
  candidateId: number;
  accountName: string;
  candidateKey: string;
  fullName: string;
  email: string | null;
  state: string;
  source: string | null;
  promotedPersonaId: number | null;
  replacedPersonaId: number | null;
  deferredReason: string | null;
};

export type CandidateTraceLookup = {
  byScopedEmail: Map<string, CandidateTrace>;
  byEmail: Map<string, CandidateTrace>;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function scopedKey(accountName: string | null | undefined, email: string) {
  return `${(accountName ?? '').trim().toLowerCase()}::${normalizeEmail(email)}`;
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

export async function buildCandidateTraceLookup(
  prisma: PrismaClient,
  input: {
    accountNames?: string[];
    emails: string[];
  },
): Promise<CandidateTraceLookup> {
  const accountNames = dedupe(input.accountNames ?? []);
  const emails = dedupe(input.emails).map(normalizeEmail);
  const empty: CandidateTraceLookup = {
    byScopedEmail: new Map(),
    byEmail: new Map(),
  };
  if (emails.length === 0 || accountNames.length === 0) return empty;

  const rows = await prisma.accountContactCandidate.findMany({
    where: {
      account_name: { in: accountNames },
      email: { in: emails },
    },
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      account_name: true,
      candidate_key: true,
      full_name: true,
      email: true,
      state: true,
      source: true,
      promoted_persona_id: true,
      replaced_persona_id: true,
      deferred_reason: true,
    },
  });

  for (const row of rows) {
    if (!row.email) continue;
    const normalizedEmail = normalizeEmail(row.email);
    const trace: CandidateTrace = {
      candidateId: row.id,
      accountName: row.account_name,
      candidateKey: row.candidate_key,
      fullName: row.full_name,
      email: normalizedEmail,
      state: row.state,
      source: row.source,
      promotedPersonaId: row.promoted_persona_id,
      replacedPersonaId: row.replaced_persona_id,
      deferredReason: row.deferred_reason,
    };
    const scoped = scopedKey(row.account_name, normalizedEmail);
    if (!empty.byScopedEmail.has(scoped)) {
      empty.byScopedEmail.set(scoped, trace);
    }
    if (!empty.byEmail.has(normalizedEmail)) {
      empty.byEmail.set(normalizedEmail, trace);
    }
  }

  return empty;
}

export function resolveCandidateTrace(
  lookup: CandidateTraceLookup,
  input: {
    email: string;
    accountName?: string | null;
  },
): CandidateTrace | null {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) return null;
  const scoped = scopedKey(input.accountName, normalizedEmail);
  return lookup.byScopedEmail.get(scoped) ?? lookup.byEmail.get(normalizedEmail) ?? null;
}
