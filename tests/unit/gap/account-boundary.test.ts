/**
 * NEVER CROSS ACCOUNT BOUNDARIES (2026-09-28). The server rechecks
 * signal.account == thesis.account on every USE, both ways, before any write.
 * And the canonical PepsiCo case: the corroborated Gatik fact on the frozen
 * approved PepsiCo thesis drafts a REVISION (the approved row is never
 * edited, never approved, never activated).
 */
import { describe, expect, it, vi } from 'vitest';
import { hypothesisFindFirst } from './fixtures/hypothesis-table';
import { loadThesisGroups, useEvidenceForThesis } from '@/lib/gap/hypothesis/thesis-groups';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-09-28T15:00:00Z');
const PRIMARY = 'June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo’s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date.';
const fact = (id: string, account: string, text: string, over: Record<string, unknown> = {}) => ({
  id, account_name: account, source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: `https://example.test/${id}`, evidence_text: text, summary: null,
  title: `${account} news`, observed_at: new Date('2026-09-10'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, freshness_expires_at: new Date('2027-01-08'), ...over,
});
const GM = fact('gm-net', 'General Mills', 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury over the next two years.');
const PEP = fact('pep-gatik', 'PepsiCo', PRIMARY, { title: 'PepsiCo and Gatik announce multi-year agreement to deploy autonomous freight in North America', observed_at: new Date('2026-06-08'), freshness_expires_at: new Date('2026-12-23'), metadata: { verified: VERIFIED_EXCERPT, continuity: { kind: 'ongoing_state' } } });
const KW = { id: 'kw', account_name: 'PepsiCo', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_url: null, evidence_text: '', summary: null, title: 'PEP 10-Q mentions: capital expenditure', observed_at: new Date('2026-07-09'), external_ok: null, metadata: null, freshness_expires_at: null };

function hyp(id: string, account: string, status: string, persona: number) {
  return {
    id, account_name: account, problem_family: 'hidden_capacity', status, primary_persona_id: persona, persona: 'vp_logistics', confidence: 40,
    observation: 'PEP 10-Q mentions: capital expenditure [S:kw].', problem_hypothesis: 'My guess is handoffs.', root_cause_hypotheses: ['Gate waiting'], impact_hypotheses: ['Fewer turns'],
    falsification_questions: ['How many trailers wait?'], what_a_no_means: 'Closed.', secondary_families: [], why_now: null, contrary_evidence: null, predicted_buyer_language: null, buying_center: null,
    signals: [{ signal_id: KW.id, signal: { ...KW, account_name: account } }], primary_persona: { name: `p${persona}`, title: 'VP' },
  };
}

function db(rows: any[]) {
  const signals = [GM, PEP, KW];
  return {
    prospectingHypothesis: {
      findMany: vi.fn(async (q: any) => rows.filter((r) => !q?.where?.account_name || r.account_name === q.where.account_name)),
      findUnique: vi.fn(async ({ where }: any) => rows.find((r) => r.id === where.id) ?? null),
      findFirst: vi.fn(hypothesisFindFirst(() => rows)),
      update: vi.fn(), updateMany: vi.fn(),
    },
    prospectingSignal: { findMany: vi.fn(async ({ where }: any) => signals.filter((s) => where.id.in.includes(s.id))) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'e' })) },
    researchRun: { findMany: vi.fn(async () => []) },
  };
}

async function fpOf(prisma: any, account: string) {
  return (await loadThesisGroups(prisma, { account_name: account }, { now: NOW })).find((g) => g.accountName === account)!.fingerprint;
}

describe('the server rechecks signal.account == thesis.account on every USE', () => {
  it('a General Mills fact on a PepsiCo thesis is refused before any write', async () => {
    const prisma = db([hyp('pa1', 'PepsiCo', 'approved', 916), hyp('pa2', 'PepsiCo', 'approved', 928)]);
    const propose = vi.fn();
    const updateNarrative = vi.fn();
    const r = await useEvidenceForThesis(prisma, { fingerprint: await fpOf(prisma, 'PepsiCo'), hypothesisIds: ['pa1'], signalIds: ['gm-net'], actor: 'c', now: NOW }, { propose: propose as any, updateNarrative: updateNarrative as any });
    expect(r).toEqual({ ok: false, reason: 'not_verified_evidence:gm-net:other_account', results: [] });
    expect(propose).not.toHaveBeenCalled();
    expect(updateNarrative).not.toHaveBeenCalled();
  });

  it('a PepsiCo fact on a General Mills thesis is refused before any write', async () => {
    const prisma = db([hyp('gd1', 'General Mills', 'draft', 2001), hyp('gd2', 'General Mills', 'draft', 2002)]);
    const propose = vi.fn();
    const updateNarrative = vi.fn();
    const r = await useEvidenceForThesis(prisma, { fingerprint: await fpOf(prisma, 'General Mills'), hypothesisIds: ['gd1'], signalIds: ['pep-gatik'], actor: 'c', now: NOW }, { propose: propose as any, updateNarrative: updateNarrative as any });
    expect(r).toEqual({ ok: false, reason: 'not_verified_evidence:pep-gatik:other_account', results: [] });
    expect(propose).not.toHaveBeenCalled();
    expect(updateNarrative).not.toHaveBeenCalled();
  });
});

describe('USE & CREATE REVISION on the frozen approved PepsiCo thesis', () => {
  it('drafts a revision whose observation is rebuilt from the Gatik fact; the approved row is never edited or approved', async () => {
    const prisma = db([hyp('pa1', 'PepsiCo', 'approved', 916), hyp('pa2', 'PepsiCo', 'approved', 928)]);
    const propose = vi.fn(async (_p: unknown, _i: any) => ({ ok: true as const, id: 'rev-1' }));
    const r = await useEvidenceForThesis(prisma, { fingerprint: await fpOf(prisma, 'PepsiCo'), hypothesisIds: ['pa1'], signalIds: ['pep-gatik'], primarySignalId: 'pep-gatik', actor: 'c', now: NOW }, { propose: propose as any });
    expect(r.ok).toBe(true);
    expect(r.results[0]).toMatchObject({ hypothesisId: 'pa1', revisionId: 'rev-1', from: 'approved', to: 'approved' });
    const arg = propose.mock.calls[0][1];
    expect(arg).toMatchObject({ supersedesId: 'pa1', sourceRef: 'revision:pa1', primarySignalId: 'pep-gatik', metadata: { revisionBasis: 'verified_evidence', narrativeIsDraftCandidate: true } });
    expect(arg.observation).toContain('autonomous freight');
    // strictly factual: the observation quotes the fact and asserts no yard problem
    expect(arg.observation).not.toMatch(/congest|dwell|gate (?:problem|delay)|YardFlow/i);
    expect(prisma.prospectingHypothesis.update).not.toHaveBeenCalled();
    expect(prisma.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
  });
});
