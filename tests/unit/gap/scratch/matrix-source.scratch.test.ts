// @vitest-environment node
/**
 * R62 MATRIX, SOURCE TRUTH AND COMMERCIAL RELEVANCE (mandate section 7): one checked fact of each shape at its own
 * account, a chosen person, and DRAFT A THESIS through the REAL route (POST /api/gap/story/draft, the page control's
 * own payload from story/draft-defaults.ts) and, where it is admitted, APPROVE AND USE and the email preview. What the
 * evidence-purpose table permits must prepare; what it forbids must be refused for its own reason. Skipped without
 * GAP_SCRATCH_DATABASE_URL pointing at the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');
const defect = process.env.MATRIX_DEFECTS === '1' ? it : it.skip;

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
type Draft = { status: number; body: { hypothesisId?: string; status?: string; preparation?: string; family?: string; missing?: string[]; error?: string; detail?: string } };

describe.skipIf(!RUN)('R62 matrix: source truth and commercial relevance (DRAFT A THESIS through the real route)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  type Acct = import('@/scripts/gap/recovery/seed-matrix').MatrixAccount;
  const tag = `msrc${Date.now().toString(36)}`;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const C: Record<string, { a: Acct; p: { id: number; title: string | null }; factId: string; claimClass: string | null; observation: string }> = {};

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    s = createMatrixSeeder(prisma, tag);
    async function shape(key: string, text: (n: string) => string, opts: Parameters<typeof s.fact>[3] = {}) {
      const a = await s.account(`Source ${key}`);
      const p = await s.person(a, 'Rae', 'Director of Transportation');
      await s.choose(a, p.id);
      const f = await s.fact(a, key.toLowerCase(), text(a.name), { observedAt: daysAgo(6), ...opts });
      C[key] = { a, p, factId: f.id, claimClass: opts.claimClass ?? null, observation: citedQuote(f.title, f.text, f.id, a.name) };
    }
    const careers = (key: string) => ({ host: `careers.source-${key.toLowerCase()}.example.com`, type: 'job_posting' });
    await shape('OpenPosting', (n) => `${n} is hiring a Yard Operations Manager at its Amarillo distribution center to manage trailer moves and dock appointments.`, { ...careers('OpenPosting'), title: 'Yard Operations Manager - Amarillo', claimClass: 'JOB_POSTING', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } });
    await shape('PostingAsIs', (n) => `${n} is hiring a Yard Operations Manager at its Amarillo distribution center to manage trailer moves and dock appointments.`, { ...careers('PostingAsIs'), title: 'Yard Operations Manager - Amarillo', claimClass: 'JOB_POSTING', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } });
    await shape('ClosedPosting', (n) => `${n} is no longer accepting applications for the Yard Operations Manager position at its Amarillo distribution center.`, { ...careers('ClosedPosting'), title: 'Yard Operations Manager - Amarillo', claimClass: 'JOB_POSTING', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'closed' } });
    await shape('Reposted', (n) => `${n} reposted a Yard Operations Manager position at its Amarillo distribution center to manage trailer moves.`, { ...careers('Reposted'), title: 'Yard Operations Manager - Amarillo (reposted)', claimClass: 'JOB_POSTING', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'reposted' } });
    const due = month(new Date(Date.now() - 20 * 86_400_000));
    await shape('ClosedRfp', (n) => `${n} issued a request for proposals for yard management services at its Reno distribution center; responses were due ${due}.`, { host: 'procurement.example.gov', type: 'news', title: 'RFP: yard management services', claimClass: 'PROCUREMENT', claimAttributes: { dueDate: new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10), issuer: null } });
    await shape('VendorQuote', (n) => `Kaleris announced that ${n} selected its yard management system for 40 distribution centers.`, { title: 'Kaleris wins a new customer' });
    await shape('VendorPhysical', (n) => `Kaleris announced that ${n} is opening a new distribution center in Reno with 60 dock doors.`, { title: 'Kaleris customer news' });
    await shape('SoftwareDeployed', (n) => `${n} deployed a new warehouse management system across its Ohio distribution centers.`, { title: 'New WMS in Ohio', type: 'technology_signal' });
    await shape('SoftwareImplemented', (n) => `${n} implemented a new warehouse management system across its Ohio distribution centers.`, { title: 'New WMS in Ohio', type: 'technology_signal' });
    await shape('Operator', (n) => `${n} told us on a call that the Columbus gate backs up every Monday morning.`, { sourceKind: 'operator_knowledge', sourceType: 'first_party', externalOk: false, title: 'Call notes' });
    await shape('Fit', (n) => `${n} operates twelve distribution centers across the Midwest, each with its own yard.`, { title: 'Network overview', type: 'news' });
    h = await startMatrixHarness({ companies: s.companies });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
    expect(daysAhead(1).getTime()).toBeGreaterThan(Date.now());
  }, 300_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  /** DRAFT A THESIS with the page control's own payload (problemFamily null: the family is derived or asked). */
  async function draft(key: string, over: { problemFamily?: string | null } = {}): Promise<Draft> {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const c = C[key];
    const payload = storyDraftPayload({ accountName: c.a.name, factId: c.factId, claimClass: c.claimClass, proposedObservation: c.observation, person: { personaId: c.p.id, title: c.p.title }, problemFamily: over.problemFamily ?? null });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    return { status: res.status, body: (await res.json()) as Draft['body'] };
  }

  it('an open job posting the account issued prepares a job-led proposal once its family is answered (the posting\'s own words)', async () => {
    const d = await draft('OpenPosting', { problemFamily: 'yard_state_integrity' });
    expect([d.status, d.body.preparation], JSON.stringify(d.body)).toEqual([201, 'submitted']);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: d.body.hypothesisId! }, select: { metadata: true } });
    expect((row!.metadata as { approach?: string }).approach).toBe('job_procurement_led');
  }, 120_000);

  // DEFECT src/lib/gap/story/propose-family.ts:56 (mandate section 8, "no mandatory family selection"): the posting
  // matches no family cue and no change class, so the page control's own payload (problemFamily null) leaves the draft
  // incomplete and asks the seller to pick one of seven families, although a job-led thesis's copy is chosen by its
  // approach program, not by the family (execution/action-pack.ts). The job-led scratch case supplies the family by hand.
  defect('the open posting drafted with the page control\'s own payload is complete: no family question', async () => {
    const d = await draft('PostingAsIs');
    expect([d.status, d.body.preparation, d.body.missing ?? []], JSON.stringify(d.body)).toEqual([expect.any(Number), 'submitted', []]);
  }, 120_000);

  it('a closed posting is refused for its own reason', async () => {
    const d = await draft('ClosedPosting', { problemFamily: 'yard_state_integrity' });
    expect([d.status, d.body.error], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence']);
    expect(d.body.detail).toMatch(/posting_closed/);
  }, 120_000);

  // DEFECT src/lib/gap/research/approach-policy.ts:134: only a CLOSED job posting is refused; a REPOSTED one is admitted as
  // a new job-led trigger. R22: an expired or reposted listing is not new demand.
  defect('a reposted posting is not admitted as a new job-led trigger', async () => {
    const d = await draft('Reposted', { problemFamily: 'yard_state_integrity' });
    expect([d.status, d.body.error], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence']);
  }, 120_000);

  // DEFECT src/lib/gap/research/approach-policy.ts:134 with research/claim-types.ts:90: a procurement notice whose stated
  // due date passed is admitted (dueDate is parsed, never enforced); the job-led copy then asks whether "the posting"
  // is still open about a closed RFP.
  defect('a procurement notice whose due date has passed is refused', async () => {
    const d = await draft('ClosedRfp', { problemFamily: 'yard_state_integrity' });
    expect([d.status, d.body.error], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence']);
  }, 120_000);

  it('a vendor\'s marketing claim about the account is never the account\'s own evidence (a software win: not a physical change)', async () => {
    const d = await draft('VendorQuote', { problemFamily: 'yard_state_integrity' });
    expect([d.status, d.body.error, d.body.detail], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence', 'not_a_physical_network_change']);
  }, 120_000);

  // DEFECT src/lib/gap/research/claim-rules.ts:57-77 (speakerOrg) used by the gate's liveFactFailure (:111-118): the
  // speaker rule recognizes "said ... at ORG", "ORG <title> said" and "according to ORG", not "<Vendor> announced that
  // <account> is opening ...", so a vendor's press release about its customer's new site passes as the account's own
  // statement and opens an event-led first touch. The evidence-purpose table: vendor marketing never becomes the
  // buyer's fact.
  defect('a vendor speaking about the account\'s new site is a third party, never the account\'s statement', async () => {
    const d = await draft('VendorPhysical', { problemFamily: 'hidden_capacity' });
    expect([d.status, d.body.error], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence']);
    expect(d.body.detail).not.toBe('not_a_physical_network_change');
  }, 120_000);

  it('a software implementation is context, not a physical-network change: refused as an event-led opening', async () => {
    const d = await draft('SoftwareImplemented', { problemFamily: 'automation_readiness' });
    expect([d.status, d.body.error, d.body.detail], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence', 'not_a_physical_network_change']);
  }, 120_000);

  // DEFECT src/lib/gap/research/claim-types.ts:86 (the physical check runs before the technology class) with
  // research/facts.ts:19 and :134 ("deploy"/"deployed" are a change and an event): the same software sentence with
  // "deployed" instead of "implemented" passes as a physical-network change and opens an event-led first touch. The
  // evidence-purpose table: a technology deployment supports at most a complementary-workflow question.
  defect('a software deployment ("deployed a new warehouse management system") is refused as an event-led opening, like "implemented"', async () => {
    const d = await draft('SoftwareDeployed', { problemFamily: 'automation_readiness' });
    expect([d.status, d.body.error], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence']);
  }, 120_000);

  it('a fact from operator knowledge (a call note, never public) is not outreach evidence', async () => {
    const d = await draft('Operator', { problemFamily: 'driver_gate_scale' });
    expect([d.status, d.body.error, d.body.detail], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence', 'operator_knowledge']);
  }, 120_000);

  it('a stable operating fact with no event is not an event-led opening', async () => {
    const d = await draft('Fit', { problemFamily: 'network_standardization' });
    expect([d.status, d.body.error, d.body.detail], JSON.stringify(d.body)).toEqual([409, 'fact_not_outreach_evidence', 'not_a_physical_network_change']);
  }, 120_000);

  // DEFECT src/lib/gap/story/draft-from-fact.ts:74 (the draft declares only event_led or job_procurement_led): the fit-led
  // approach has its policy (research/approach-policy.ts) and its copy family (sequences/families.ts) but no producer, so
  // a legitimate fit with no fresh news can never be prepared (mandate section 3: a transparent fit-led question).
  defect('a stable operating fact prepares a FIT-LED proposal (a transparent fit question, no why-now)', async () => {
    const d = await draft('Fit', { problemFamily: 'network_standardization' });
    expect([d.status, d.body.preparation], JSON.stringify(d.body)).toEqual([201, 'submitted']);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: d.body.hypothesisId! }, select: { metadata: true } });
    expect((row!.metadata as { approach?: string }).approach).toBe('fit_led');
  }, 120_000);

  it('no case reached the network', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
