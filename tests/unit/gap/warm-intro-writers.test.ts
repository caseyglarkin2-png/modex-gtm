/**
 * V2 (RevOps M2): every writer that can reach a warm-intro-only account cold reads the ONE restriction authority
 * (gap/policy/restriction.ts). Each case asserts the specific refusal AND that nothing downstream ran.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  unsubscribedEmail: { findMany: vi.fn(async () => []), findUnique: vi.fn(async () => null) },
  emailLog: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) },
  draftQueueItem: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []), create: vi.fn(async () => ({ id: 1 })) },
  campaign: { findMany: vi.fn() },
  account: { findUnique: vi.fn(async () => null) },
  activity: { findFirst: vi.fn(async () => null), create: vi.fn(async () => ({ id: 1 })) },
};
const invariant = vi.fn(async ({ cc }: { cc?: string[] }) => ({ ok: true, canonicalAccountName: 'Acme', scopedAccountNames: ['Acme'], normalizedCc: cc ?? [] }));

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: vi.fn(async () => ({ exists: false, lastAt: null })) }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: vi.fn() }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));
vi.mock('@/lib/revops/one-account-invariant', () => ({ enforceOneAccountInvariant: invariant }));
vi.mock('@/lib/source-backed/metrics', () => ({ recordSourceBackedMetric: vi.fn(async () => undefined) }));
vi.mock('@/lib/revops/candidate-trace', () => ({ buildCandidateTraceLookup: vi.fn(async () => ({})), resolveCandidateTrace: vi.fn(() => null) }));
vi.mock('@/lib/email/recipient-guard', () => ({ evaluateRecipientEligibility: vi.fn(async () => ({ ok: true })) }));

const { evaluateSendGuards } = await import('@/lib/email/perform-send');
const { addOne } = await import('@/app/discovery/queue-actions');
const { POST: ingest } = await import('@/app/api/outbox/drafts/route');
const { runCampaignDripCheck } = await import('@/lib/campaigns/drip');
const { makeActiveOpportunityCheck } = await import('@/lib/gap/enroll/service');

const send = (over: Record<string, unknown>) => evaluateSendGuards(mockedPrisma as never, { to: 'ops@acme.example', subject: 's', bodyHtml: 'b', accountName: 'Acme', personaName: null, ...over } as never);

beforeEach(() => vi.clearAllMocks());

describe('legacy send guards', () => {
  it('refuse a restricted account by name, by recipient domain and by cc domain, before any other read', async () => {
    for (const over of [{ accountName: 'Dannon' }, { invariantAccountName: 'Danone North America' }, { to: 'heiko@danone.com' }, { cc: ['x@dannon.com'] }]) {
      const r = await send(over);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.block.code).toBe('WARM_INTRO_ONLY');
      expect(!r.ok && r.block.message).toMatch(/Mark Shaughnessy/);
    }
    expect(invariant).not.toHaveBeenCalled();
    expect(mockedPrisma.unsubscribedEmail.findMany).not.toHaveBeenCalled();
  });
  it('let an unrestricted send through to the usual guards', async () => {
    expect((await send({})).ok).toBe(true);
    expect(invariant).toHaveBeenCalledTimes(1);
  });
});

describe('Outbox writers', () => {
  it('addOne refuses a cold draft to a restricted account or domain, writing nothing', async () => {
    expect(await addOne({ toEmail: 'a@acme.example', accountName: 'Dannon', subject: 's', body: 'b', source: 'casey' }, 'casey@freightroll.com')).toEqual({ ok: false, reason: 'warm_intro_only' });
    expect(await addOne({ toEmail: 'heiko@danone.com', accountName: 'Shell Co', subject: 's', body: 'b', source: 'casey' }, 'casey@freightroll.com')).toEqual({ ok: false, reason: 'warm_intro_only' });
    expect(mockedPrisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(await addOne({ toEmail: 'a@acme.example', accountName: 'Acme', subject: 's', body: 'b', source: 'casey' }, 'casey@freightroll.com')).toEqual({ ok: true, id: 1 });
  });
  it('the Clawd ingest skips a restricted item and creates the rest', async () => {
    process.env.POUNCE_INGEST_TOKEN = 'tok';
    const req = new Request('http://x/api/outbox/drafts', { method: 'POST', headers: { 'x-pounce-token': 'tok', 'content-type': 'application/json' }, body: JSON.stringify({ items: [
      { to_email: 'heiko@danone.com', company: 'Danone', subject: 's', body: 'b' },
      { to_email: 'ops@acme.example', company: 'Acme', subject: 's', body: 'b' },
    ] }) });
    const res = await ingest(req as never);
    const j = await res.json();
    expect(j.results).toEqual([{ to_email: 'heiko@danone.com', status: 'skipped', reason: 'warm_intro_only' }, { to_email: 'ops@acme.example', status: 'created' }]);
    expect(mockedPrisma.draftQueueItem.create).toHaveBeenCalledTimes(1);
  });
});

describe('campaign drip writer', () => {
  it('mints no "send a touch" task for a restricted account', async () => {
    mockedPrisma.campaign.findMany.mockResolvedValue([{ id: 1, slug: 'c', name: 'C', owner: 'Casey', status: 'active', start_date: new Date('2026-01-01'), key_dates: {}, outreach_waves: [{ account_name: 'Dannon' }, { account_name: 'Acme' }], email_logs: [] }]);
    const s = await runCampaignDripCheck(new Date('2026-10-02'));
    expect(s.touchedAccounts).toEqual(['Acme (touch 1)']);
    expect(mockedPrisma.activity.create).toHaveBeenCalledTimes(1);
    expect((mockedPrisma.activity.create.mock.calls as unknown as Array<[{ data: { account_name: string } }]>)[0][0].data.account_name).toBe('Acme');
  });
});

describe('GAP action-time check', () => {
  const check = makeActiveOpportunityCheck({}, { hold: async () => null });
  it('refuses a restricted account on the terminal path with the restriction worded, before any HubSpot read', async () => {
    const db = { gapAccountAlias: { findMany: async () => [] } };
    const v = await check(db, 'Dannon', 'heiko@danone.com', new Date());
    expect(v).toEqual({ status: 'ACTIVE', detail: expect.stringMatching(/^Warm intro only: .*Mark Shaughnessy/) });
  });
  it('refuses through an alias, and fails closed when the alias read fails', async () => {
    expect((await check({ gapAccountAlias: { findMany: async () => [{ alias: 'Danone US', account_name: 'Shell Co' }] } }, 'Shell Co', 'a@shell.example', new Date())).status).toBe('ACTIVE');
    const v = await check({ gapAccountAlias: { findMany: async () => { throw new Error('db down'); } } }, 'Shell Co', 'a@shell.example', new Date());
    expect(v.status).toBe('UNKNOWN');
    expect(v.status === 'UNKNOWN' && v.detail).toMatch(/warm-intro-only restriction: db down/);
  });
});
