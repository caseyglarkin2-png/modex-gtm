/**
 * Owner-resolution API routes (2026-10-05): the HTTP contract (flag gate, session, validation, status codes) and
 * that each handler hands its service the session actor and exactly the body. Service behavior is tested apart.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, mocks, prisma } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  mocks: {
    loadOwnerResolution: vi.fn(),
    useOwnerForHypothesis: vi.fn(),
    importHubSpotContactToAccount: vi.fn(),
    findOperator: vi.fn(),
    loadPersonaEmployment: vi.fn(),
    recordEmploymentCorrection: vi.fn(),
    recordEmploymentVerification: vi.fn(),
    verifyEmployment: vi.fn(),
    discardGapDraft: vi.fn(),
  },
  prisma: {
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => (where.id === 'h1' ? { account_name: 'FedEx' } : null)) },
    persona: { findUnique: vi.fn(async ({ where }: any) => (where.id === 1306 ? { id: 1306, name: 'dakota socha', title: 't', account_name: 'H-E-B', linkedin_url: null, company_domain: 'heb.com' } : null)) },
  },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/lib/gap/people/owner-resolution-load', () => ({ loadOwnerResolution: mocks.loadOwnerResolution }));
vi.mock('@/lib/gap/people/owner-action', () => ({ useOwnerForHypothesis: mocks.useOwnerForHypothesis }));
vi.mock('@/lib/gap/people/account-import', () => ({ importHubSpotContactToAccount: mocks.importHubSpotContactToAccount }));
vi.mock('@/lib/gap/people/find-operator', () => ({ findOperator: mocks.findOperator }));
vi.mock('@/lib/gap/people/employment-store', () => ({ loadPersonaEmployment: mocks.loadPersonaEmployment, recordEmploymentCorrection: mocks.recordEmploymentCorrection, recordEmploymentVerification: mocks.recordEmploymentVerification }));
vi.mock('@/lib/gap/people/employment-verify', () => ({ verifyEmployment: mocks.verifyEmployment }));
vi.mock('@/lib/gap/execution/draft-discard', async (orig) => ({ ...(await orig<Record<string, unknown>>()), discardGapDraft: mocks.discardGapDraft }));

const { GET: ownerGET, POST: ownerPOST } = await import('@/app/api/gap/hypotheses/[id]/owner/route');
const { POST: importPOST } = await import('@/app/api/gap/people/import/route');
const { POST: findPOST } = await import('@/app/api/gap/people/find-operator/route');
const { GET: empGET, POST: empPOST } = await import('@/app/api/gap/personas/[id]/employment/route');
const { POST: verifyPOST } = await import('@/app/api/gap/personas/[id]/employment/verify/route');
const { POST: discardPOST } = await import('@/app/api/gap/decisions/[id]/gmail-draft/discard/route');

const req = (url: string, body?: unknown) => new NextRequest(url, { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const FLAGS = ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED'];

beforeEach(() => {
  for (const f of FLAGS) process.env[f] = '1';
  session.value = { user: { email: 'casey@yardflow.ai' } };
  for (const m of Object.values(mocks)) m.mockReset();
});

describe('GET / POST /api/gap/hypotheses/[id]/owner', () => {
  it('404 with the flag off; 401 without a session; 404 unknown hypothesis; 200 the resolution for the hypothesis', async () => {
    process.env.GAP_HYPOTHESIS_ENABLED = 'false';
    expect((await ownerGET(req('https://x/o'), ctx('h1'))).status).toBe(404);
    process.env.GAP_HYPOTHESIS_ENABLED = '1';
    session.value = null;
    expect((await ownerGET(req('https://x/o'), ctx('h1'))).status).toBe(401);
    session.value = { user: { email: 'casey@yardflow.ai' } };
    expect((await ownerGET(req('https://x/o'), ctx('nope'))).status).toBe(404);
    mocks.loadOwnerResolution.mockResolvedValue({ ok: true, resolution: { nextStep: 'choose' }, hubspot: { via: 'identity' }, people: [] });
    const res = await ownerGET(req('https://x/o'), ctx('h1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resolution: { nextStep: 'choose' }, hubspot: { via: 'identity' } });
    expect(mocks.loadOwnerResolution.mock.calls[0][1]).toMatchObject({ accountName: 'FedEx', purpose: 'HYPOTHESIS_ACTIVATION', hypothesisId: 'h1' });
  });
  it('POST needs exactly one of personaId / hubspotContactId; hands the session actor to the action; 200 ok, 409 stopped, 404 unknown', async () => {
    expect((await ownerPOST(req('https://x/o', {}), ctx('h1'))).status).toBe(400);
    expect((await ownerPOST(req('https://x/o', { personaId: 1, hubspotContactId: '2' }), ctx('h1'))).status).toBe(400);
    mocks.useOwnerForHypothesis.mockResolvedValue({ ok: true, steps: [], hypothesisId: 'h1' });
    const ok = await ownerPOST(req('https://x/o', { hubspotContactId: '219922589799' }), ctx('h1'));
    expect(ok.status).toBe(200);
    expect(mocks.useOwnerForHypothesis.mock.calls[0][1]).toMatchObject({ hypothesisId: 'h1', candidate: { personaId: null, hubspotContactId: '219922589799' }, activate: true, actor: 'casey@yardflow.ai' });
    mocks.useOwnerForHypothesis.mockResolvedValue({ ok: false, steps: [{ step: 'check', ok: false, reason: 'candidate_not_eligible:left_company' }], hypothesisId: 'h1' });
    expect((await ownerPOST(req('https://x/o', { personaId: 1306, activate: false }), ctx('h1'))).status).toBe(409);
    expect(mocks.useOwnerForHypothesis.mock.calls[1][1]).toMatchObject({ activate: false });
    mocks.useOwnerForHypothesis.mockResolvedValue({ ok: false, steps: [{ step: 'check', ok: false, reason: 'not_found' }], hypothesisId: 'nope' });
    expect((await ownerPOST(req('https://x/o', { personaId: 1 }), ctx('nope'))).status).toBe(404);
  });
});

describe('POST /api/gap/people/import and /find-operator', () => {
  it('import: 401 without a session, 400 bad body, 201 created, 200 already, 409 refused, 404 unknown', async () => {
    session.value = null;
    expect((await importPOST(req('https://x/i', { accountName: 'PepsiCo', hubspotContactId: '1' }))).status).toBe(401);
    session.value = { user: { email: 'casey@yardflow.ai' } };
    expect((await importPOST(req('https://x/i', { accountName: 'PepsiCo' }))).status).toBe(400);
    mocks.importHubSpotContactToAccount.mockResolvedValue({ ok: true, status: 'created', personaId: 1, notes: [] });
    expect((await importPOST(req('https://x/i', { accountName: 'PepsiCo', hubspotContactId: '219885493392' }))).status).toBe(201);
    expect(mocks.importHubSpotContactToAccount.mock.calls[0][1]).toMatchObject({ accountName: 'PepsiCo', hubspotContactId: '219885493392', actor: 'casey@yardflow.ai' });
    mocks.importHubSpotContactToAccount.mockResolvedValue({ ok: true, status: 'already', personaId: 1, notes: [] });
    expect((await importPOST(req('https://x/i', { accountName: 'PepsiCo', hubspotContactId: '1' }))).status).toBe(200);
    mocks.importHubSpotContactToAccount.mockResolvedValue({ ok: false, reason: 'contact_not_associated', detail: 'x' });
    expect((await importPOST(req('https://x/i', { accountName: 'PepsiCo', hubspotContactId: '1' }))).status).toBe(409);
    mocks.importHubSpotContactToAccount.mockResolvedValue({ ok: false, reason: 'account_not_found' });
    expect((await importPOST(req('https://x/i', { accountName: 'Nope', hubspotContactId: '1' }))).status).toBe(404);
  });
  it('find-operator: reads who is on record first, then researches and stages; 404 unknown account', async () => {
    mocks.loadOwnerResolution.mockResolvedValue({ ok: false, reason: 'account_not_found' });
    expect((await findPOST(req('https://x/f', { accountName: 'Nope' }))).status).toBe(404);
    mocks.loadOwnerResolution.mockResolvedValue({ ok: true, resolution: { eligible: [], excluded: [{ candidate: { name: 'Dakota Socha' } }], sponsor: { name: 'Carson Landsgard' }, tech: null, site: null, others: [{ names: ['Stan Staged (staged candidate)'] }] }, people: [{ name: 'Jose Huerta' }] });
    mocks.findOperator.mockResolvedValue({ ok: true, found: [], staged: [], alreadyOnRecord: [], note: 'n' });
    const res = await findPOST(req('https://x/f', { accountName: 'H-E-B' }));
    expect(res.status).toBe(200);
    expect(mocks.findOperator.mock.calls[0][1]).toMatchObject({ accountName: 'H-E-B', actor: 'casey@yardflow.ai' });
    expect(mocks.findOperator.mock.calls[0][1].known.sort()).toEqual(['Carson Landsgard', 'Dakota Socha', 'Jose Huerta', 'Stan Staged']);
  });
});

describe('employment: correction, read and verification', () => {
  it('POST records Casey\'s correction with the session actor; 404 unknown person; 400 bad body or URL', async () => {
    mocks.recordEmploymentCorrection.mockResolvedValue({ ok: true, personaId: 1306, read: { state: 'LEFT_COMPANY_CONFIRMED' } });
    const res = await empPOST(req('https://x/e', { status: 'left', newCompany: 'ADUSA Distribution', sourceUrl: 'https://www.linkedin.com/in/x' }), ctx('1306'));
    expect(res.status).toBe(201);
    expect(mocks.recordEmploymentCorrection.mock.calls[0][1]).toMatchObject({ personaId: 1306, actor: 'casey@yardflow.ai', status: 'left', newCompany: 'ADUSA Distribution' });
    expect((await empPOST(req('https://x/e', { status: 'gone' }), ctx('1306'))).status).toBe(400);
    mocks.recordEmploymentCorrection.mockResolvedValue({ ok: false, reason: 'invalid_url' });
    expect((await empPOST(req('https://x/e', { status: 'left', sourceUrl: 'nope' }), ctx('1306'))).status).toBe(400);
    mocks.recordEmploymentCorrection.mockResolvedValue({ ok: false, reason: 'persona_not_found' });
    expect((await empPOST(req('https://x/e', { status: 'left' }), ctx('9'))).status).toBe(404);
    expect((await empPOST(req('https://x/e', { status: 'left' }), ctx('abc'))).status).toBe(404);
  });
  it('GET reads the state; verify runs one bounded check and records it, refusing to overwrite a human correction', async () => {
    mocks.loadPersonaEmployment.mockResolvedValue({ state: 'CURRENT_UNVERIFIED' });
    expect(await (await empGET(req('https://x/e'), ctx('1306'))).json()).toEqual({ state: 'CURRENT_UNVERIFIED' });
    mocks.verifyEmployment.mockResolvedValue({ verdict: 'left', company: 'ADUSA', title: 'Director', sourceUrl: 'https://www.linkedin.com/in/x', sourceDate: null, confidence: 'high', tier: 'strong', summary: 's', kind: 'profile' });
    mocks.recordEmploymentVerification.mockResolvedValue({ ok: true, personaId: 1306, recorded: true, read: { state: 'LEFT_COMPANY_CONFIRMED' }, auditId: 'a' });
    const res = await verifyPOST(req('https://x/v', {}), ctx('1306'));
    expect(res.status).toBe(200);
    expect(mocks.verifyEmployment.mock.calls[0][0]).toMatchObject({ name: 'dakota socha', company: 'H-E-B', companyDomains: ['heb.com'] });
    expect(mocks.recordEmploymentVerification.mock.calls[0][1]).toMatchObject({ personaId: 1306, actor: 'casey@yardflow.ai', verdict: 'left', sourceUrl: 'https://www.linkedin.com/in/x' });
    mocks.recordEmploymentVerification.mockResolvedValue({ ok: false, reason: 'human_correction_stands' });
    expect((await verifyPOST(req('https://x/v', {}), ctx('1306'))).status).toBe(409);
    expect((await verifyPOST(req('https://x/v', {}), ctx('9'))).status).toBe(404);
  });
});

describe('POST /api/gap/decisions/[id]/gmail-draft/discard', () => {
  it('needs the compiler flag, a session and a complete body; 200 discarded, 409 refused, 404 no such GAP draft', async () => {
    process.env.GAP_MESSAGE_COMPILER_ENABLED = 'false';
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'seller_discard' }), ctx('dec-1'))).status).toBe(404);
    process.env.GAP_MESSAGE_COMPILER_ENABLED = '1';
    session.value = null;
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'seller_discard' }), ctx('dec-1'))).status).toBe(401);
    session.value = { user: { email: 'casey@yardflow.ai' } };
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', reason: 'seller_discard' }), ctx('dec-1'))).status).toBe(400);
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'unsubscribe' }), ctx('dec-1'))).status).toBe(400);
    mocks.discardGapDraft.mockResolvedValue({ ok: true, action: 'discarded', gmailDraftId: 'r1', recipient: 'a@b.co', ledgerId: 'l' });
    const ok = await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'stale_pre_operator_who_draft' }), ctx('dec-1'));
    expect(ok.status).toBe(200);
    expect(mocks.discardGapDraft.mock.calls[0][1]).toMatchObject({ decisionId: 'dec-1', gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'stale_pre_operator_who_draft', actor: 'casey@yardflow.ai' });
    mocks.discardGapDraft.mockResolvedValue({ ok: false, reason: 'draft_not_found' });
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'seller_discard' }), ctx('dec-1'))).status).toBe(404);
    mocks.discardGapDraft.mockResolvedValue({ ok: false, reason: 'recipient_mismatch' });
    expect((await discardPOST(req('https://x/d', { gmailDraftId: 'r1', recipient: 'a@b.co', reason: 'seller_discard' }), ctx('dec-1'))).status).toBe(409);
  });
});
