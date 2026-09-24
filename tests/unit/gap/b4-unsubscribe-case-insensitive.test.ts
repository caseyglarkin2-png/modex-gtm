/**
 * B4 (Opus adversarial review, 2026-09-24, LIVE NOW): the unsubscribe
 * extraction normalizes the incoming address to lower case before writing
 * UnsubscribedEmail, but Persona.email is stored as imported (e.g.
 * "John@Acme.com") and the two send-guard lookups queried recipients in
 * their raw case. Postgres string equality (and Prisma's default `in`
 * filter) is case-sensitive, so a mixed-case unsubscribe silently failed to
 * flag the persona do_not_contact, and a later send in a different case
 * silently skipped the suppression row.
 *
 * These fakes emulate that case-sensitive Postgres behavior deliberately
 * (exact match unless the query explicitly asks for `mode: 'insensitive'`,
 * or the caller pre-lowercases), so this test is RED against the pre-fix
 * code and GREEN only because unsubscribe.ts, perform-send.ts and
 * send-bulk/route.ts now query case-insensitively.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

type UnsubscribedRow = { email: string };
type PersonaRow = { id: number; email: string; do_not_contact: boolean; hubspot_contact_id?: string | null };

const unsubscribedStore: UnsubscribedRow[] = [];
const personaStore: PersonaRow[] = [
  { id: 1, email: 'John@Acme.com', do_not_contact: false, hubspot_contact_id: null },
];

function emailWhereMatches(where: { email: unknown }, candidate: string): boolean {
  const w = where.email as string | { equals: string; mode?: string } | { in: string[] };
  if (typeof w === 'string') return w === candidate;
  if ('in' in w) return w.in.includes(candidate);
  if (w.mode === 'insensitive') return w.equals.toLowerCase() === candidate.toLowerCase();
  return w.equals === candidate;
}

const mockedPrisma = {
  unsubscribedEmail: {
    findUnique: vi.fn(async ({ where }: any) => unsubscribedStore.find((r) => r.email === where.email) ?? null),
    create: vi.fn(async ({ data }: any) => {
      const row = { email: data.email };
      unsubscribedStore.push(row);
      return row;
    }),
    findMany: vi.fn(async ({ where }: any) =>
      unsubscribedStore.filter((r) => emailWhereMatches(where, r.email)),
    ),
  },
  persona: {
    updateMany: vi.fn(async ({ where, data }: any) => {
      const matches = personaStore.filter((p) => emailWhereMatches(where, p.email));
      for (const p of matches) Object.assign(p, data);
      return { count: matches.length };
    }),
    findFirst: vi.fn(async ({ where }: any) => personaStore.find((p) => emailWhereMatches(where, p.email)) ?? null),
    findMany: vi.fn(async () => []),
  },
  emailLog: { create: vi.fn(async () => ({ id: 1 })) },
  generatedContent: { update: vi.fn(() => ({ catch: vi.fn() })) },
  account: {
    findUnique: vi.fn(async () => ({
      name: 'Acme Foods', pipeline_stage: null, outreach_status: 'Not started', meeting_status: null,
    })),
    updateMany: vi.fn(() => ({ catch: vi.fn() })),
  },
  accountContactCandidate: { findMany: vi.fn(async () => []) },
  activity: { create: vi.fn(() => ({ catch: vi.fn() })) },
};

const mockedSendEmail = vi.fn();
const mockedEnforceOneAccountInvariant = vi.fn(async ({ cc }: { cc?: string[] }) => ({
  ok: true,
  canonicalAccountName: 'Acme Foods',
  scopedAccountNames: ['Acme Foods'],
  normalizedCc: cc ?? [],
}));
const mockedUpsertContact = vi.fn(async () => 'hs_123');

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: mockedEnforceOneAccountInvariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/agent-actions/cache', () => ({ markAgentActionCacheStale: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/contacts', () => ({ upsertContact: mockedUpsertContact }));

const { performSend } = await import('@/lib/email/perform-send');
const { recordUnsubscribe } = await import('@/lib/email/unsubscribe');
const prisma = mockedPrisma as unknown as Parameters<typeof performSend>[0];

beforeEach(() => {
  vi.clearAllMocks();
  mockedSendEmail.mockResolvedValue({
    headers: { 'x-message-id': 'msg-1' }, provider: 'gmail', threadId: null, hubspotEngagementId: null,
  });
  mockedEnforceOneAccountInvariant.mockResolvedValue({
    ok: true,
    canonicalAccountName: 'Acme Foods',
    scopedAccountNames: ['Acme Foods'],
    normalizedCc: [],
  });
});

describe('B4: unsubscribe is case-insensitive end to end', () => {
  it('John@Acme.com unsubscribes, then sends to john@acme.com and JOHN@ACME.COM are both blocked', async () => {
    const result = await recordUnsubscribe(prisma, { email: 'John@Acme.com', source: 'unsubscribe_link' });
    expect(result.personaUpdated).toBe(1);
    expect(personaStore[0].do_not_contact).toBe(true);

    const lower = await performSend(prisma, {
      to: 'john@acme.com', subject: 'Test', bodyHtml: 'Hi', accountName: 'Acme Foods', personaName: 'John',
    });
    expect(lower.ok).toBe(false);

    const upper = await performSend(prisma, {
      to: 'JOHN@ACME.COM', subject: 'Test', bodyHtml: 'Hi', accountName: 'Acme Foods', personaName: 'John',
    });
    expect(upper.ok).toBe(false);

    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('control: without unsubscribing first, the same address sends fine', async () => {
    const result = await performSend(prisma, {
      to: 'nobody@acme.com', subject: 'Test', bodyHtml: 'Hi', accountName: 'Acme Foods', personaName: 'Nobody',
    });
    expect(result.ok).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  });
});
