/** DEEPEN is Casey's click, re-planned on the server: a section the plan does not ask for is refused (409, with why) before any research runs. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, deps } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  deps: { loadAccountInputs: vi.fn(), runEvidenceResearch: vi.fn(), loadResearchHistory: vi.fn(), scoutCandidate: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/lib/gap/account-intel/load', () => ({ loadAccountInputs: deps.loadAccountInputs }));
vi.mock('@/lib/gap/research/run', () => ({ runEvidenceResearch: deps.runEvidenceResearch }));
vi.mock('@/lib/gap/entity/candidates', () => ({ scoutCandidate: deps.scoutCandidate }));
vi.mock('@/lib/prisma', () => ({ prisma: { gapAuditEvent: { create: async () => ({}) } } }));
vi.mock('@/lib/gap/account-intel/orchestrate', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/account-intel/orchestrate')>()), loadResearchHistory: deps.loadResearchHistory }));

import { POST } from '@/app/api/gap/accounts/deepen/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/accounts/deepen', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const inputs = (facts: unknown[] = []) => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: [], facts, signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
});

beforeEach(() => {
  for (const f of Object.values(deps)) f.mockReset();
  deps.loadResearchHistory.mockResolvedValue([]);
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/accounts/deepen', () => {
  it('401 without a session', async () => {
    session.value = null;
    expect((await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }))).status).toBe(401);
  });
  it('runs one focused research run for a section the plan asks for, tagged as a deepen', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs());
    deps.runEvidenceResearch.mockResolvedValue({ outcome: 'insufficient_evidence', facts: [], rejected: [], notes: [] });
    const r = await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }));
    expect(r.status).toBe(200);
    expect(deps.runEvidenceResearch.mock.calls[0][1]).toMatchObject({ accountName: 'Acme Foods', actor: 'casey@freightroll.com', context: { orchestrator: 'deepen', section: 'catalysts' }, focus: expect.stringMatching(/distribution centers/) });
  });
  it('refuses a known, fresh section with the reason, and runs nothing', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs([{ id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno.', url: 'https://n.example', title: 't', publishedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 90 * 86_400_000).toISOString(), continuity: 'event', currentness: null }]));
    const r = await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }));
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ error: 'not_in_plan', reason: expect.stringMatching(/Known and fresh/) });
    expect(deps.runEvidenceResearch).not.toHaveBeenCalled();
  });
  it('fails closed when the history cannot be read (503), and runs nothing', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs());
    deps.loadResearchHistory.mockRejectedValue(new Error('db down'));
    const r = await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }));
    expect(r.status).toBe(503);
    expect(deps.runEvidenceResearch).not.toHaveBeenCalled();
  });

  it('runs under the resolved account name, with no currentness side trip', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs());
    deps.runEvidenceResearch.mockResolvedValue({ outcome: 'insufficient_evidence', facts: [], rejected: [], notes: [] });
    await POST(req({ accountName: 'acme foods', section: 'catalysts' }));
    expect(deps.runEvidenceResearch.mock.calls[0][1]).toMatchObject({ accountName: 'Acme Foods', seekCurrentness: false });
  });

  it('a section only a human can answer is not a web call (400 at the schema)', async () => {
    expect((await POST(req({ accountName: 'Acme Foods', section: 'org' }))).status).toBe(400);
  });
  it('identity: an account of unknown type runs Scout (nothing created) and returns the fit', async () => {
    deps.loadAccountInputs.mockResolvedValue({ ...inputs(), account: { ...inputs().account, vertical: 'Unknown' } });
    deps.scoutCandidate.mockResolvedValue({ company: 'Acme Foods', verdict: 'DIRECT_BUYER', entityType: 'carrier', network: [{ claim: 'x', url: 'https://x' }], freight: [], why: 'A carrier that runs terminals.', basis: 'web' });
    const r = await POST(req({ accountName: 'Acme Foods', section: 'identity' }));
    expect(await r.json()).toMatchObject({ section: 'identity', fit: 'DIRECT_BUYER', entityType: 'carrier' });
    expect(deps.runEvidenceResearch).not.toHaveBeenCalled();
  });
});

describe('Release M: the deepen outcome is the SECTION outcome', () => {
  const reno = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno.', url: 'https://n.example', title: 't', publishedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 90 * 86_400_000).toISOString(), continuity: 'event', currentness: null };
  it('the web search down is provider_unavailable (retryable), not an empty answer', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs());
    deps.runEvidenceResearch.mockResolvedValue({ runId: 'r1', outcome: 'insufficient_evidence', facts: [], rejected: [], notes: ['edgar: 0 filings', 'web: unavailable (429 quota)'] });
    expect(await (await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }))).json()).toMatchObject({ outcome: 'insufficient_evidence', sectionOutcome: 'provider_unavailable' });
  });
  it('the web down while EDGAR found a fact for ANOTHER section is still provider_unavailable (red team)', async () => {
    deps.loadAccountInputs.mockResolvedValue(inputs());
    deps.runEvidenceResearch.mockResolvedValue({ runId: 'r1', outcome: 'evidence_found', facts: [{}], rejected: [], notes: ['edgar: 1 filing', 'web: unavailable (no grounded web search)'] });
    expect(await (await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }))).json()).toMatchObject({ sectionOutcome: 'provider_unavailable' });
  });
  it('a fact that lands in the section is section_filled; facts elsewhere are nothing_for_section', async () => {
    deps.loadAccountInputs.mockResolvedValueOnce(inputs()).mockResolvedValueOnce(inputs([reno]));
    deps.runEvidenceResearch.mockResolvedValue({ runId: 'r1', outcome: 'evidence_found', facts: [{}], rejected: [], notes: ['web: 3 candidates'] });
    expect(await (await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }))).json()).toMatchObject({ sectionOutcome: 'section_filled' });
    deps.loadAccountInputs.mockReset();
    deps.loadAccountInputs.mockResolvedValue(inputs());
    expect(await (await POST(req({ accountName: 'Acme Foods', section: 'catalysts' }))).json()).toMatchObject({ outcome: 'evidence_found', sectionOutcome: 'nothing_for_section' });
  });
});
