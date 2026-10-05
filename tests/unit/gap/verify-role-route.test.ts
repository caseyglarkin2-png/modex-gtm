/**
 * POST /api/gap/people/verify-role and the persona verify route (owner resolution, 2026-10-05): the HTTP contract
 * (flag gate, session, exactly one subject, status codes), one grounded search per click, recorded through the
 * store, and the RoleRead computed from the evidence on record. Never callable without a session, never on a
 * render (no GET), no Apollo. Service behavior is tested apart.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const WALMART = 'Walmart Inc.';
const STORED = 'Sr Director - West Transportation Command Center';
const POST_URL = 'https://www.linkedin.com/in/christian-burton-57161518b/';

const { session, mocks, prisma } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  mocks: {
    verifyEmployment: vi.fn(),
    recordEmploymentVerification: vi.fn(),
    recordHubSpotContactRoleVerification: vi.fn(),
    loadHubSpotContactRoleEvidence: vi.fn(),
    accountEmploymentContext: vi.fn(),
  },
  prisma: {
    persona: { findUnique: vi.fn(async ({ where }: any) => (where.id === 42 ? { id: 42, name: 'c mannella', title: 'Sr Director - West Transportation Command Center', account_name: 'Walmart Inc.', linkedin_url: null, company_domain: 'walmart.com' } : null)) },
  },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/lib/gap/people/employment-verify', () => ({ verifyEmployment: mocks.verifyEmployment }));
vi.mock('@/lib/gap/people/employment-store', async (orig) => ({ ...(await orig<Record<string, unknown>>()), recordEmploymentVerification: mocks.recordEmploymentVerification, recordHubSpotContactRoleVerification: mocks.recordHubSpotContactRoleVerification, loadHubSpotContactRoleEvidence: mocks.loadHubSpotContactRoleEvidence, accountEmploymentContext: mocks.accountEmploymentContext }));

const routeModule = await import('@/app/api/gap/people/verify-role/route');
const { POST } = routeModule;
const { POST: personaVerifyPOST } = await import('@/app/api/gap/personas/[id]/employment/verify/route');

const req = (body: unknown) => new NextRequest('https://x/api/gap/people/verify-role', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const FLAGS = ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED'];
const promoted = { verdict: 'different_role', employmentVerdict: 'current', company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST_URL, sourceDate: '2026-10-05', confidence: 'high', tier: 'strong', summary: 'A colleague was promoted into the role.', kind: 'profile' };
const promotedEvidence = { kind: 'profile', tier: 'strong', company: WALMART, title: null, at: '2026-10-05T00:00:00.000Z', source: 'verified at linkedin.com', url: POST_URL, roleChanged: true };

beforeEach(() => {
  for (const f of FLAGS) process.env[f] = '1';
  session.value = { user: { email: 'casey@yardflow.ai' } };
  for (const m of Object.values(mocks)) m.mockReset();
  prisma.persona.findUnique.mockClear();
  mocks.accountEmploymentContext.mockResolvedValue({ aliases: ['Walmart'], domains: ['walmart.com'] });
  mocks.verifyEmployment.mockResolvedValue(promoted);
});

describe('POST /api/gap/people/verify-role: the gate and the body', () => {
  it('exports no GET (never on a render) and only POST', () => {
    expect(Object.keys(routeModule).filter((k) => /^[A-Z]+$/.test(k))).toEqual(['POST']);
  });
  it('404 with the routing flag off; 401 without a session; neither runs a search', async () => {
    process.env.GAP_ROUTING_ENABLED = 'false';
    expect((await POST(req({ personaId: 42 }))).status).toBe(404);
    process.env.GAP_ROUTING_ENABLED = '1';
    session.value = null;
    expect((await POST(req({ personaId: 42 }))).status).toBe(401);
    expect(mocks.verifyEmployment).not.toHaveBeenCalled();
  });
  it('400 for no subject, both subjects, a bad persona id, or an incomplete HubSpot body', async () => {
    for (const body of [{}, { personaId: 42, hubspotContactId: '7001', accountName: WALMART, name: 'C M', title: STORED }, { personaId: 'x' }, { personaId: -1 }, { hubspotContactId: '7001' }, { hubspotContactId: '7001', accountName: WALMART, name: 'C M' }, { hubspotContactId: 'abc', accountName: WALMART, name: 'C M', title: null }]) {
      const res = await POST(req(body));
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect(mocks.verifyEmployment).not.toHaveBeenCalled();
  });
});

describe('a persona: one search, recorded through the store, 200 with the verification and the RoleRead', () => {
  it('runs verifyEmployment once with the persona and the account domains, records with the session actor, answers read', async () => {
    const role = { state: 'ROLE_CHANGED_CONFIRMED', why: 'Still at Walmart Inc., but the stored role changed. Verify current remit before using.', storedTitle: STORED, effectiveTitle: null, titleSource: 'unknown', priorTitle: STORED, usableForRanking: false, decidedBy: [], verifyNeeded: true };
    mocks.recordEmploymentVerification.mockResolvedValue({ ok: true, personaId: 42, recorded: true, read: { state: 'CURRENT_CONFIRMED' }, role, auditId: 'a1' });
    const res = await POST(req({ personaId: 42 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ verification: promoted, read: role, employment: { state: 'CURRENT_CONFIRMED' }, personaId: 42, recorded: true, auditId: 'a1' });
    expect(mocks.verifyEmployment).toHaveBeenCalledTimes(1);
    expect(mocks.verifyEmployment.mock.calls[0][0]).toMatchObject({ name: 'c mannella', title: STORED, company: WALMART, companyDomains: ['walmart.com'] });
    expect(mocks.recordEmploymentVerification.mock.calls[0][1]).toMatchObject({ personaId: 42, actor: 'casey@yardflow.ai', verdict: 'different_role', title: null, priorTitle: STORED, sourceUrl: POST_URL, confidence: 'high', companyDomains: ['walmart.com'] });
    expect(mocks.recordHubSpotContactRoleVerification).not.toHaveBeenCalled();
  });
  it('404 unknown persona (no search); 409 when a human correction stands, with the verification', async () => {
    expect((await POST(req({ personaId: 9 }))).status).toBe(404);
    expect(mocks.verifyEmployment).not.toHaveBeenCalled();
    mocks.recordEmploymentVerification.mockResolvedValue({ ok: false, reason: 'human_correction_stands' });
    const res = await POST(req({ personaId: 42 }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'human_correction_stands', verification: promoted });
  });
});

describe('a HubSpot-only person: the audit row is the record, and the read comes from the evidence loaded back', () => {
  it('records one row with the stored title and the account context, loads the evidence, and reads ROLE_CHANGED_CONFIRMED not usable', async () => {
    mocks.recordHubSpotContactRoleVerification.mockResolvedValue({ ok: true, auditId: 'a2', recorded: true, evidence: promotedEvidence });
    mocks.loadHubSpotContactRoleEvidence.mockResolvedValue(new Map([['7001', [promotedEvidence]]]));
    const res = await POST(req({ hubspotContactId: '7001', accountName: WALMART, name: 'C M', title: STORED }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verification).toEqual(promoted);
    expect(body.read).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, priorTitle: STORED, storedTitle: STORED, verifyNeeded: true });
    expect(body.read.why).toMatch(/verify current remit/i);
    expect(body).toMatchObject({ recorded: true, auditId: 'a2' });
    expect(mocks.accountEmploymentContext).toHaveBeenCalledWith(expect.anything(), WALMART);
    expect(mocks.verifyEmployment).toHaveBeenCalledTimes(1);
    expect(mocks.verifyEmployment.mock.calls[0][0]).toMatchObject({ name: 'C M', title: STORED, company: WALMART, companyDomains: ['walmart.com'] });
    expect(mocks.recordHubSpotContactRoleVerification.mock.calls[0][1]).toMatchObject({ hubspotContactId: '7001', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey@yardflow.ai', verification: promoted, companyDomains: ['walmart.com'] });
    expect(mocks.loadHubSpotContactRoleEvidence.mock.calls[0][1]).toEqual(['7001']);
    expect(mocks.recordEmploymentVerification).not.toHaveBeenCalled();
    expect(prisma.persona.findUnique).not.toHaveBeenCalled();
  });
  it('an unknown answer records the attempt and reads the stored title as ROLE_UNVERIFIED', async () => {
    const unknown = { ...promoted, verdict: 'unknown', employmentVerdict: 'unknown', company: null, title: null, priorTitle: null, sourceUrl: null, tier: 'weak', kind: null, summary: 'no source found' };
    mocks.verifyEmployment.mockResolvedValue(unknown);
    mocks.recordHubSpotContactRoleVerification.mockResolvedValue({ ok: true, auditId: 'a3', recorded: false, evidence: { kind: 'web', tier: 'weak', company: null, title: null, at: null, source: 'verified at an unnamed source' } });
    mocks.loadHubSpotContactRoleEvidence.mockResolvedValue(new Map());
    const body = await (await POST(req({ hubspotContactId: '7001', accountName: WALMART, name: 'C M', title: STORED }))).json();
    expect(body.read).toMatchObject({ state: 'ROLE_UNVERIFIED', effectiveTitle: STORED, titleSource: 'stored', usableForRanking: true });
    expect(body.recorded).toBe(false);
  });
});

describe('the persona verify route passes the five-case verdict through and answers the role beside the employment read', () => {
  it('hands the store the verdict, the prior title and the confidence; the response carries role', async () => {
    const role = { state: 'ROLE_CHANGED_CONFIRMED', usableForRanking: false };
    mocks.recordEmploymentVerification.mockResolvedValue({ ok: true, personaId: 42, recorded: true, read: { state: 'CURRENT_CONFIRMED' }, role, auditId: 'a' });
    const res = await personaVerifyPOST(new NextRequest('https://x/v', { method: 'POST', body: '{}' }), ctx('42'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ verification: promoted, read: { state: 'CURRENT_CONFIRMED' }, role });
    expect(mocks.recordEmploymentVerification.mock.calls[0][1]).toMatchObject({ verdict: 'different_role', priorTitle: STORED, confidence: 'high', title: null });
  });
});
