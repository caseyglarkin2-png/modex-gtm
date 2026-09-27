/**
 * Final Monday P1 #1: ONE revision per frozen thesis. After Casey chose
 * verified evidence and GAP created the replacement draft, RESEARCH THIS on
 * the person's (stale) card must lead to that revision, never mint another.
 * History (the frozen row, supersedes links) is never touched.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hypothesisFindFirst } from './fixtures/hypothesis-table';
import { findManyFrom } from './fixtures/where';

const mockedAuth = vi.fn();
const mockedRunResearch = vi.fn();
const table: { hyps: any[]; decisions: any[] } = { hyps: [], decisions: [] };
const routePrisma: any = {
  routingDecision: { findUnique: vi.fn(async ({ where }: any) => table.decisions.find((d) => d.id === where.id) ?? null) },
  prospectingHypothesis: {
    findUnique: vi.fn(async ({ where }: any) => table.hyps.find((h) => h.id === where.id) ?? null),
    findFirst: vi.fn(hypothesisFindFirst(() => table.hyps)),
  },
};
vi.mock('@/lib/prisma', () => ({ prisma: routePrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/gap/research/run', () => ({ runEvidenceResearch: mockedRunResearch }));

const { POST: researchRoute } = await import('@/app/api/gap/research/route');
const { useEvidenceForThesis, loadThesisGroups } = await import('@/lib/gap/hypothesis/thesis-groups');
const { existingRevisionFor, revisedByOf } = await import('@/lib/gap/hypothesis/current-revision');
const { proposeFromResearch } = await import('@/lib/gap/research/propose');
const { cardReadiness, sellerLaneOf } = await import('@/lib/gap/routing/card-readiness');
const { citedQuote } = await import('@/lib/gap/research/propose');

const NOW = new Date('2026-09-27T15:00:00Z');
const LATER = new Date('2026-11-06T05:00:00Z');
const SEC = 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm';
const KW = { id: 'kw', account_name: 'PepsiCo', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_url: SEC, evidence_text: '', summary: null, title: 'PEP 10-Q (2026-07-09) mentions: capital expenditure', observed_at: new Date('2026-07-09'), external_ok: null, metadata: null, freshness_expires_at: LATER };
const FACT = { id: 'fact', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: `${SEC}#fact`, evidence_text: 'PepsiCo will close three distribution centers in 2027.', summary: null, title: 'PEPSICO INC 10-Q (filed 2026-07-09)', observed_at: new Date('2026-07-09'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' }, freshness_expires_at: LATER };

function frozen(id: string, persona: number) {
  return {
    id, account_name: 'PepsiCo', problem_family: 'hidden_capacity', status: 'approved', primary_persona_id: persona, persona: 'vp_logistics', confidence: 40,
    observation: 'PEP 10-Q (2026-07-09) mentions: capital expenditure [S:kw].', problem_hypothesis: 'My guess is handoffs.', root_cause_hypotheses: [], impact_hypotheses: [],
    falsification_questions: ['How many trailers wait?'], what_a_no_means: null, secondary_families: [], why_now: null, contrary_evidence: null, predicted_buyer_language: null, buying_center: null,
    signals: [{ signal_id: 'kw', signal: KW }], primary_persona: { name: `p${persona}`, title: 'VP' }, created_at: new Date('2026-09-20'),
  };
}

/** A thesis-groups prisma over the shared table, with a propose that really inserts a DRAFT row. */
function thesisPrisma() {
  return {
    prospectingHypothesis: {
      findMany: vi.fn(async (q: any) => {
        const superseded = new Set(table.hyps.map((r) => r.supersedes_id).filter(Boolean));
        const rows = q?.where?.superseded_by ? table.hyps.filter((r) => !superseded.has(r.id)) : table.hyps;
        return q?.where?.supersedes_id ? findManyFrom(rows, { where: { supersedes_id: q.where.supersedes_id } }) : rows;
      }),
      findUnique: vi.fn(async ({ where }: any) => table.hyps.find((r) => r.id === where.id) ?? null),
      findFirst: vi.fn(hypothesisFindFirst(() => table.hyps)),
    },
    prospectingSignal: { findMany: vi.fn(async ({ where }: any) => [KW, FACT].filter((s) => where.id.in.includes(s.id))) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'e' })) },
    researchRun: { findMany: vi.fn(async () => []) },
  };
}

let n = 0;
const propose = vi.fn(async (_p: unknown, input: any) => {
  if (table.hyps.some((h) => h.source_ref === input.sourceRef)) return { ok: false as const, reason: 'duplicate_source_ref', existingId: table.hyps.find((h) => h.source_ref === input.sourceRef).id };
  if (input.supersedesId && table.hyps.some((h) => h.supersedes_id === input.supersedesId)) throw Object.assign(new Error('unique supersedes_id'), { code: 'P2002' });
  const id = `rev-${++n}`;
  table.hyps.push({ ...frozen(id, input.primaryPersonaId), status: 'draft', observation: input.observation, supersedes_id: input.supersedesId ?? null, source_ref: input.sourceRef, signals: [{ signal_id: 'fact', signal: FACT }], created_at: NOW });
  return { ok: true as const, id, status: 'draft' as const };
});

/** The fingerprint the browser holds (read once, like a card that has not refreshed). */
let fp = '';
async function useEvidenceOnce() {
  const prisma = thesisPrisma();
  fp ||= (await loadThesisGroups(prisma, {}, { now: NOW, singletons: true }))[0].fingerprint;
  return useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['old'], signalIds: ['fact'], actor: 'casey@freightroll.com', now: NOW }, { propose: propose as any });
}

beforeEach(() => {
  table.hyps = [frozen('old', 916)];
  table.decisions = [{ id: 'dec-916', account_name: 'PepsiCo', persona_id: 916, hypothesis_id: 'old' }];
  n = 0;
  fp = '';
  propose.mockClear();
  mockedRunResearch.mockReset();
  mockedAuth.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  process.env.GAP_HYPOTHESIS_ENABLED = 'true';
});

const researchClick = () =>
  researchRoute(new Request('http://x/api/gap/research', { method: 'POST', body: JSON.stringify({ decisionId: 'dec-916' }) }) as any);

describe('11. frozen thesis + chosen verified evidence creates exactly ONE revision', () => {
  it('one DRAFT revision superseding the frozen row; the frozen row is untouched', async () => {
    const before = JSON.stringify(table.hyps[0]);
    const r = await useEvidenceOnce();
    expect(r.results[0]).toMatchObject({ ok: true, revisionId: 'rev-1' });
    expect(table.hyps.filter((h) => h.supersedes_id === 'old')).toHaveLength(1);
    expect(JSON.stringify(table.hyps[0])).toBe(before);
    expect(table.hyps[1].observation).toBe(citedQuote(FACT.title, FACT.evidence_text, 'fact', 'PepsiCo'));
  });
});

describe('12. repeating the action (double click, retry) never creates a second equivalent revision', () => {
  it('a second USE THIS EVIDENCE from the stale card creates nothing (the frozen thesis already left current work)', async () => {
    await useEvidenceOnce();
    const again = await useEvidenceOnce();
    expect(again).toMatchObject({ ok: false, reason: 'group_not_found' });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(table.hyps.filter((h) => h.status === 'draft')).toHaveLength(1);
  });

  it('USE THIS EVIDENCE when the person already has an open draft revision: points at it, proposes nothing', async () => {
    table.hyps.push({ ...frozen('draft-x', 916), status: 'draft', supersedes_id: null, source_ref: 'research:run0' });
    const r = await useEvidenceOnce();
    expect(r.results[0]).toMatchObject({ ok: true, revisionId: 'draft-x', detail: 'revision already exists' });
    expect(propose).not.toHaveBeenCalled();
  });

  it('two concurrent clicks: the loser of the unique race reads the winner as the existing revision', async () => {
    const [a, b] = await Promise.all([useEvidenceOnce(), useEvidenceOnce()]);
    const ids = [a.results[0].revisionId, b.results[0].revisionId];
    expect(new Set(ids)).toEqual(new Set(['rev-1']));
    expect(table.hyps.filter((h) => h.supersedes_id === 'old')).toHaveLength(1);
  });

  it('a Research-this proposal after the revision exists returns revision_exists and writes nothing', async () => {
    await useEvidenceOnce();
    const researchPrisma: any = {
      researchRun: { findUnique: vi.fn(async () => ({ id: 'run1', account_name: 'PepsiCo', persona_id: 916, provider_status: { outcome: 'evidence_found', hypothesisId: 'old', problemFamily: 'hidden_capacity' } })) },
      evidenceRecord: { findMany: vi.fn(async () => [{ id: 'ev1' }]) },
      prospectingSignal: { findMany: vi.fn(async () => [{ ...FACT, id: 'fact' }]) },
      prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => table.hyps.find((h) => h.id === where.id) ?? null), findFirst: vi.fn(hypothesisFindFirst(() => table.hyps)), create: vi.fn() },
      persona: { findUnique: vi.fn(async () => ({ id: 916 })) },
      $transaction: vi.fn(),
    };
    const p = await proposeFromResearch(researchPrisma, { researchRunId: 'run1', actor: 'casey', now: NOW });
    expect(p).toEqual({ ok: false, reason: 'revision_exists', existingRevision: { hypothesisId: 'rev-1', status: 'draft', via: 'supersedes' } });
    expect(researchPrisma.prospectingHypothesis.create).not.toHaveBeenCalled();
    expect(researchPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('13. an existing current revision: RESEARCH THIS leads there instead of creating another', () => {
  it('the research route answers existing_revision and runs no research at all', async () => {
    await useEvidenceOnce();
    const res = await researchClick();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outcome: 'existing_revision', existingRevision: { hypothesisId: 'rev-1', status: 'draft', via: 'supersedes' } });
    expect(mockedRunResearch).not.toHaveBeenCalled();
  });

  it('with no revision yet, the route still researches (control)', async () => {
    mockedRunResearch.mockResolvedValue({ runId: 'r', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [], notes: [] });
    const res = await researchClick();
    expect(await res.json()).toMatchObject({ outcome: 'insufficient_evidence' });
    expect(mockedRunResearch).toHaveBeenCalledTimes(1);
  });

  it('an open draft for the same person and family (no supersedes link) also counts as current work', async () => {
    table.hyps.push({ ...frozen('draft-x', 916), status: 'review_required', supersedes_id: null });
    expect(await existingRevisionFor(routePrisma, { accountName: 'PepsiCo', personaId: 916, problemFamily: 'hidden_capacity', hypothesisId: 'old' })).toEqual({ hypothesisId: 'draft-x', status: 'review_required', via: 'open_work' });
    // A different person's draft is not this person's revision.
    expect(await existingRevisionFor(routePrisma, { accountName: 'PepsiCo', personaId: 928, problemFamily: 'hidden_capacity', hypothesisId: null })).toBeNull();
  });

  it('the stale person card reads the revision: REVIEW lane, "Review the revised thesis", never RESEARCH THIS', async () => {
    await useEvidenceOnce();
    const revised = await revisedByOf(thesisPrisma(), ['old']);
    expect(revised.get('old')).toBe('rev-1');
    const card = {
      id: 'dec-916', action: 'research_required', blocked: false, ruleId: 'evidence_thin',
      account: { name: 'PepsiCo', hubspotCompanyId: null }, persona: { id: 916, displayName: 'P', email: 'p@pepsico.com', hubspotContactId: null },
      hypothesis: { id: 'old', status: 'approved', revisedBy: revised.get('old') ?? null },
    };
    const r = cardReadiness(card);
    expect(r).toMatchObject({ state: 'actionable', primary: { label: 'Review the revised thesis', href: '/gap?lane=review' } });
    expect((r as { researchable?: boolean }).researchable).toBeUndefined();
    expect(sellerLaneOf(card)).toBe('review');
    // Control: the same card before any revision is RESEARCH THIS work.
    const before = cardReadiness({ ...card, hypothesis: { id: 'old', status: 'approved', revisedBy: null } });
    expect(before).toMatchObject({ state: 'missing_prerequisite', researchable: true });
  });
});

describe('reviewer B residual: a DRAFT card thesis never gets a second evidence-backed draft beside it', () => {
  const thinDraft = () => ({ ...frozen('x', 916), status: 'draft', supersedes_id: null });
  const readyDraft = () => ({ ...thinDraft(), observation: citedQuote(FACT.title, FACT.evidence_text, 'fact', 'PepsiCo'), signals: [{ signal_id: 'fact', signal: FACT }] });

  it('Find verified evidence rebuilt the draft in place (now ready): RESEARCH THIS on its stale card answers existing_revision', async () => {
    table.hyps = [readyDraft()];
    table.decisions = [{ id: 'dec-916', account_name: 'PepsiCo', persona_id: 916, hypothesis_id: 'x' }];
    const res = await researchClick();
    expect(await res.json()).toEqual({ outcome: 'existing_revision', existingRevision: { hypothesisId: 'x', status: 'draft', via: 'open_work' } });
    expect(mockedRunResearch).not.toHaveBeenCalled();
  });

  it('a still-thin draft card keeps RESEARCH THIS (control: nothing usable exists yet)', async () => {
    table.hyps = [thinDraft()];
    table.decisions = [{ id: 'dec-916', account_name: 'PepsiCo', persona_id: 916, hypothesis_id: 'x' }];
    mockedRunResearch.mockResolvedValue({ runId: 'r', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [], notes: [] });
    await researchClick();
    expect(mockedRunResearch).toHaveBeenCalledTimes(1);
  });

  it('Research this first, then Find verified evidence on the thin draft: points at the research draft, rebuilds nothing', async () => {
    table.hyps = [thinDraft(), { ...readyDraft(), id: 'y', source_ref: 'research:run1', created_at: NOW }];
    const prisma = thesisPrisma();
    const groups = await loadThesisGroups(prisma, {}, { now: NOW, singletons: true });
    const g = groups.find((x) => x.members.some((m) => m.id === 'x'))!;
    const updateNarrative = vi.fn();
    const r = await useEvidenceForThesis(prisma, { fingerprint: g.fingerprint, hypothesisIds: ['x'], signalIds: ['fact'], actor: 'c', now: NOW }, { updateNarrative: updateNarrative as any, propose: propose as any });
    expect(r.results[0]).toMatchObject({ ok: true, revisionId: 'y', detail: 'revision already exists' });
    expect(updateNarrative).not.toHaveBeenCalled();
    expect(propose).not.toHaveBeenCalled();
  });
});
