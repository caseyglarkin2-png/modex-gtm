import { describe, expect, it, vi } from 'vitest';

const linkSignalsMock = vi.fn(async (_p: unknown, id: string, signalIds: string[]) => ({ ok: true as const, id, status: 'draft', linked: signalIds, already: [] as string[] }));
vi.mock('@/lib/gap/hypothesis/service', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/hypothesis/service')>()), linkSignals: (...a: unknown[]) => (linkSignalsMock as any)(...a) }));

import { applyNoteToSiblings, approveSelectedSiblings, corroborateThesis, loadThesisGroups } from '@/lib/gap/hypothesis/thesis-groups';

const NOW = new Date('2026-09-25T22:00:00Z');
const KW = { id: 'kw', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_url: 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm', evidence_text: '', summary: null, title: 'PEP 10-Q mentions: capital expenditure' };
const NOTE = { id: 'note', source_kind: 'operator_knowledge', source_type: 'first_party', evidence_url: null, evidence_text: 'bottler network is potentially a problem', summary: null, title: 'modex scuttlebutt note' };

function hyp(id: string, persona: number, status: string, signals: Array<Record<string, unknown> & { id: string }> = [KW]) {
  return {
    id, account_name: 'PepsiCo', problem_family: 'hidden_capacity', status, primary_persona_id: persona,
    observation: 'PEP 10-Q mentions: capital expenditure [S:kw].', problem_hypothesis: 'My guess is handoffs.', root_cause_hypotheses: ['Gate waiting'], impact_hypotheses: ['Fewer turns'],
    falsification_questions: ['How many trailers wait?'], what_a_no_means: 'Closed.',
    signals: signals.map((s) => ({ signal_id: s.id, signal: s })), primary_persona: { name: `p${persona}`, title: 'VP' },
  };
}

function db(rows: any[]) {
  const audit: any[] = [];
  const runs: any[] = [];
  return {
    audit, runs,
    prisma: {
      prospectingHypothesis: { findMany: vi.fn(async () => rows) },
      gapAuditEvent: { create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: 'a' }; }) },
      researchRun: { findMany: vi.fn(async () => runs) },
    },
  };
}

const PEP = () => [hyp('d1', 916, 'draft'), hyp('d2', 928, 'draft'), hyp('d3', 976, 'review_required'), hyp('a1', 1016, 'active'), hyp('j', 1027, 'active', [KW, NOTE])];

describe('account thesis groups on the real PepsiCo shape', () => {
  it('eight identical rows group; Jeremy (with Casey note) stays individual', async () => {
    const { prisma } = db(PEP());
    const groups = await loadThesisGroups(prisma);
    expect(groups).toHaveLength(1);
    expect(groups[0].members.map((m) => m.id)).toEqual(['d1', 'd2', 'd3', 'a1']);
    expect(groups[0]).toMatchObject({ reviewable: 3, depth: { independentSources: 0, label: 'INSUFFICIENT', keywordOnly: 1 } });
  });
});

describe('APPROVE SELECTED SIBLINGS', () => {
  it('runs the normal transitions per row, names the group action, never activates, reports every row', async () => {
    const { prisma } = db(PEP());
    const fp = (await loadThesisGroups(prisma))[0].fingerprint;
    const transition = vi.fn(async (_p: unknown, id: string, action: string) => (id === 'd2' && action === 'approve' ? { ok: false as const, reason: 'unhedged_hypothesis' } : { ok: true as const, id, from: 'x', to: 'y', effects: [] })) as any;
    const r = await approveSelectedSiblings(prisma, { fingerprint: fp, hypothesisIds: ['d1', 'd2', 'd3', 'a1'], actor: 'casey@freightroll.com', now: NOW }, { transition });
    expect(r.ok).toBe(false);
    expect(r.results).toEqual([
      { hypothesisId: 'd1', ok: true, from: 'draft', to: 'approved', detail: 'approved' },
      { hypothesisId: 'd2', ok: false, from: 'review_required', to: null, detail: 'approve refused: unhedged_hypothesis' },
      { hypothesisId: 'd3', ok: true, from: 'review_required', to: 'approved', detail: 'approved' },
      { hypothesisId: 'a1', ok: true, from: 'active', to: 'active', detail: 'already active; unchanged' },
    ]);
    const calls = transition.mock.calls.map((c: any[]) => `${c[1]}:${c[2]}`);
    expect(calls).toEqual(['d1:submit', 'd1:approve', 'd2:submit', 'd2:approve', 'd3:approve']);
    expect(calls.some((c: string) => c.endsWith(':activate'))).toBe(false);
    for (const c of transition.mock.calls) expect(c[3]).toMatchObject({ actor: 'casey@freightroll.com', reason: expect.stringContaining('group review') });
  });

  it('refuses ids outside the group (no bulk approval outside a reviewed sibling group)', async () => {
    const { prisma } = db(PEP());
    const fp = (await loadThesisGroups(prisma))[0].fingerprint;
    const transition = vi.fn();
    expect(await approveSelectedSiblings(prisma, { fingerprint: fp, hypothesisIds: ['d1', 'j'], actor: 'c', now: NOW }, { transition: transition as any })).toMatchObject({ ok: false, reason: 'not_in_group:j' });
    expect(transition).not.toHaveBeenCalled();
  });
});

describe('sibling-scoped notes', () => {
  it("Casey's note on one row is linked to editable siblings, recorded (not merged) on frozen ones, and never removes anything", async () => {
    linkSignalsMock.mockClear();
    const { prisma, audit } = db(PEP());
    const r = await applyNoteToSiblings(prisma, { sourceHypothesisId: 'j', signalId: 'note', actor: 'casey', now: NOW });
    expect(r.ok).toBe(true);
    expect(linkSignalsMock.mock.calls.map((c: any[]) => c[1])).toEqual(['d1', 'd2', 'd3']);
    expect(linkSignalsMock.mock.calls.every((c: any[]) => JSON.stringify(c[2]) === '["note"]')).toBe(true);
    const frozen = r.results.find((x) => x.hypothesisId === 'a1')!;
    expect(frozen.detail).toContain('frozen');
    expect(audit.map((a) => [a.subject_id, a.payload.applied])).toEqual([['d1', 'linked'], ['d2', 'linked'], ['d3', 'linked'], ['a1', 'frozen_recorded']]);
  });
});

describe('FIND CORROBORATING EVIDENCE: once per thesis', () => {
  const fact = (id: string, url: string, excerpt: string, fresh = true) => ({ signalId: id, evidenceRecordId: `e${id}`, excerpt, url, title: id, publishedAt: '2026-09-01T00:00:00Z', retrievedAt: NOW.toISOString(), provider: 'edgar' as const, type: 'acquisition' as const, change: 'acquisition' as const, fresh });

  it('runs research ONCE for all siblings and reuses it for the next click', async () => {
    const { prisma, runs } = db(PEP());
    const fp = (await loadThesisGroups(prisma))[0].fingerprint;
    const run = vi.fn(async () => {
      const result = { runId: 'r1', outcome: 'evidence_found' as const, facts: [fact('s9', 'https://www.pepsico.com/news/new-dc', 'PepsiCo opened a new distribution center in Texas this summer.')], rejected: [], conflicts: [], notes: [] };
      runs.push({ id: 'r1', provider_status: { thesisFingerprint: fp, result } });
      return result;
    });
    const a = await corroborateThesis(prisma, { fingerprint: fp, actor: 'c', now: NOW }, { run: run as any });
    expect(a).toMatchObject({ ok: true, outcome: 'corroborated', reused: false });
    expect((run.mock.calls[0] as any[])[1]).toMatchObject({ personaId: null, context: { thesisFingerprint: fp, siblingIds: ['d1', 'd2', 'd3', 'a1'] } });
    const b = await corroborateThesis(prisma, { fingerprint: fp, actor: 'c', now: NOW }, { run: run as any });
    expect(b).toMatchObject({ ok: true, reused: true });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('NO SECOND SOURCE when nothing fresh and new is found; CONTRADICTS on a conflict', async () => {
    const { prisma } = db(PEP());
    const fp = (await loadThesisGroups(prisma))[0].fingerprint;
    const none = vi.fn(async () => ({ runId: 'r2', outcome: 'insufficient_evidence' as const, facts: [fact('old', 'https://x.example/a', 'PepsiCo closed a plant years ago in Ohio for good.', false)], rejected: [], conflicts: [], notes: [] }));
    expect(await corroborateThesis(prisma, { fingerprint: fp, actor: 'c', now: NOW, force: true }, { run: none as any })).toMatchObject({ outcome: 'no_second_source', newIndependent: [] });
    const conflict = vi.fn(async () => ({ runId: 'r3', outcome: 'conflicting_evidence' as const, facts: [], rejected: [], conflicts: [{ site: 'Monroe', signalIds: ['a', 'b'] }], notes: [] }));
    expect(await corroborateThesis(prisma, { fingerprint: fp, actor: 'c', now: NOW, force: true }, { run: conflict as any })).toMatchObject({ outcome: 'contradicts' });
  });
});
