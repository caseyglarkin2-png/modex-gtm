import { describe, expect, it, vi } from 'vitest';
import { runEvidenceResearch } from '@/lib/gap/research/run';
import { proposeFromResearch } from '@/lib/gap/research/propose';
import type { Candidate } from '@/lib/gap/research/providers';

const NOW = new Date('2026-09-25T18:00:00.000Z');
const Q2 = 'https://www.sec.gov/Archives/edgar/data/56873/000110465926108926/kr-20260815x10q.htm';
const FACT = 'The company plans to build a new distribution center in Kentucky and close three older distribution facilities in the region.';
const PAGE = `Kroger 10-Q text ... ${FACT} ... more text.`;

function db() {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  const t: Record<string, any[]> = { runs: [], records: [], signals: [], audit: [], hyps: [], links: [], events: [] };
  const prisma: any = {
    researchRun: {
      create: vi.fn(async ({ data }: any) => { const r = { id: id('run'), ...data }; t.runs.push(r); return { id: r.id }; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(t.runs.find((r) => r.id === where.id), data)),
      findUnique: vi.fn(async ({ where }: any) => t.runs.find((r) => r.id === where.id) ?? null),
    },
    evidenceRecord: {
      upsert: vi.fn(async ({ where, create }: any) => {
        const k = where.account_name_claim_hash_source_url_observed_at;
        let r = t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url);
        if (!r) { r = { id: id('ev'), ...create }; t.records.push(r); }
        return r;
      }),
      findUnique: vi.fn(async ({ where }: any) => { const k = where.account_name_claim_hash_source_url_observed_at; return t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url) ?? null; }),
      findMany: vi.fn(async ({ where }: any) => t.records.filter((r) => r.research_run_id === where.research_run_id)),
    },
    prospectingSignal: {
      findUnique: vi.fn(async ({ where }: any) => t.signals.find((s) => s.source_kind === where.source_kind_source_id.source_kind && s.source_id === where.source_kind_source_id.source_id) ?? null),
      create: vi.fn(async ({ data }: any) => { const s = { id: id('sig'), ...data }; t.signals.push(s); return s; }),
      findMany: vi.fn(async ({ where }: any) => t.signals.filter((s) => (where.id ? where.id.in.includes(s.id) : where.source_id.in.includes(s.source_id)))),
    },
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { t.audit.push(data); return { id: id('a') }; }) },
    prospectingHypothesis: {
      findFirst: vi.fn(async ({ where }: any) => t.hyps.find((h) => h.source_ref === where.source_ref) ?? null),
      findUnique: vi.fn(async ({ where }: any) => t.hyps.find((h) => h.id === where.id) ?? null),
      create: vi.fn(async ({ data }: any) => { const h = { id: id('hyp'), ...data }; t.hyps.push(h); return { id: h.id }; }),
      update: vi.fn(), updateMany: vi.fn(),
    },
    hypothesisSignal: { createMany: vi.fn(async ({ data }: any) => { t.links.push(...data); return { count: data.length }; }) },
    hypothesisEvent: { create: vi.fn(async ({ data }: any) => { t.events.push(data); return { id: id('he') }; }) },
    persona: { findUnique: vi.fn(async () => ({ id: 1886 })) },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  };
  t.hyps.push({ id: 'hyp-joey', account_name: 'Kroger', status: 'active', persona: 'supply_chain', problem_family: 'hidden_capacity', problem_hypothesis: 'My guess is that physical handoffs constrain production capacity at Kroger.', root_cause_hypotheses: ['Gate waiting'], impact_hypotheses: ['Fewer turns'], falsification_questions: ['How many trailers wait at the gate?'], what_a_no_means: 'x', confidence: 42 });
  return { prisma, t };
}

const input = { accountName: 'Kroger', personaId: 1886, hypothesisId: 'hyp-joey', problemFamily: 'hidden_capacity', decisionId: 'dec-joey', actor: 'casey@freightroll.com', now: NOW };
const edgarOnly = (candidates: Candidate[]) => ({ edgar: async () => ({ candidates, note: 'test' }), web: async () => ({ candidates: [], note: 'off' }) });
const primary = (over: Partial<Candidate> = {}): Candidate => ({ provider: 'edgar', url: Q2, title: 'KROGER CO 10-Q (filed 2026-09-18)', publishedAt: new Date('2026-09-18T00:00:00Z'), excerpt: FACT, sourceType: 'public_primary', ...over });

describe('RESEARCH THIS', () => {
  it('EVIDENCE FOUND: a verified primary-source fact is stored with full provenance, and no hypothesis is touched', async () => {
    const { prisma, t } = db();
    const r = await runEvidenceResearch(prisma, input, { ...edgarOnly([primary()]), fetchText: async () => PAGE });
    expect(r.outcome).toBe('evidence_found');
    expect(r.facts).toHaveLength(1);
    const s = t.signals[0];
    expect(s).toMatchObject({ source_kind: 'evidence_record', evidence_url: Q2, evidence_text: FACT, title: 'KROGER CO 10-Q (filed 2026-09-18)', source_type: 'public_primary', account_name: 'Kroger' });
    expect(s.observed_at.toISOString()).toBe('2026-09-18T00:00:00.000Z');
    expect(s.freshness_expires_at.getTime()).toBeGreaterThan(NOW.getTime());
    expect(s.metadata).toMatchObject({ retrievedAt: NOW.toISOString(), provider: 'edgar', verified: 'excerpt_found_at_source' });
    expect(t.records[0]).toMatchObject({ claim: FACT, source_url: Q2, provider: 'gap_research:edgar' });
    expect(t.runs[0].provider_status).toMatchObject({ outcome: 'evidence_found', hypothesisId: 'hyp-joey' });
    expect(prisma.prospectingHypothesis.create).not.toHaveBeenCalled();
    expect(prisma.prospectingHypothesis.update).not.toHaveBeenCalled();
    expect(prisma.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
  });

  it('NEVER fabricates: a proposed excerpt missing from its own page, an undated one, a generic one and an off-account page are all rejected', async () => {
    const { prisma, t } = db();
    const web = (over: Partial<Candidate>): Candidate => ({ provider: 'web', url: 'https://news.example/kroger', title: 'News', publishedAt: new Date('2026-09-01'), excerpt: 'Kroger is opening a brand new automated distribution center in Monroe with a digital yard.', sourceType: 'public_secondary', ...over });
    const r = await runEvidenceResearch(
      prisma,
      input,
      {
        edgar: async () => ({ candidates: [], note: '' }),
        web: async () => ({
          candidates: [
            web({}),
            web({ url: 'https://news.example/b', publishedAt: null }),
            web({ url: 'https://news.example/c', excerpt: 'Capital investments totaled $1.5 billion for the first quarter of 2026 and more.' }),
            web({ url: 'https://other.example/d', excerpt: 'Acme opened a new distribution center in Reno to add capacity for the west.' }),
          ],
          note: '',
        }),
        fetchText: async (url) => (url.includes('other.example') ? 'Acme opened a new distribution center in Reno to add capacity for the west.' : 'An unrelated page about groceries.'),
      },
    );
    expect(r.outcome).toBe('insufficient_evidence');
    expect(r.facts).toEqual([]);
    expect(r.rejected.map((x) => x.reason)).toEqual(['excerpt_not_found_at_source', 'no_publication_date', 'not_a_physical_operations_fact', 'page_does_not_name_account']);
    expect(t.signals).toEqual([]);
  });

  it('INSUFFICIENT EVIDENCE is a clean, recorded result: a run and an audit row, nothing else', async () => {
    const { prisma, t } = db();
    const r = await runEvidenceResearch(prisma, input, { ...edgarOnly([]), fetchText: async () => '' });
    expect(r).toMatchObject({ outcome: 'insufficient_evidence', facts: [] });
    expect(t.runs).toHaveLength(1);
    expect(t.audit[0]).toMatchObject({ kind: 'research.completed', payload: { outcome: 'insufficient_evidence' } });
  });

  it('a verified but STALE fact is stored for the record and never counts as a trigger', async () => {
    const { prisma } = db();
    const r = await runEvidenceResearch(prisma, input, { ...edgarOnly([primary({ publishedAt: new Date('2026-03-31T00:00:00Z') })]), fetchText: async () => PAGE });
    expect(r.facts[0].fresh).toBe(false);
    expect(r.outcome).toBe('insufficient_evidence');
  });

  it('CONFLICTING EVIDENCE: the same named site opening and closing', async () => {
    const { prisma } = db();
    const open = 'Kroger said the Monroe distribution center opened in March with automated trailer check-in at the gate.';
    const close = 'Kroger later closed the Monroe distribution center and consolidated volume into the Ohio network.';
    const r = await runEvidenceResearch(prisma, input, {
      ...edgarOnly([primary({ excerpt: open }), primary({ excerpt: close })]),
      fetchText: async () => `${open} ${close}`,
    });
    expect(r.outcome).toBe('conflicting_evidence');
    expect(r.conflicts[0].site).toBe('Monroe');
  });
});

describe('PROPOSE UPDATED HYPOTHESIS', () => {
  it('creates a DRAFT whose observation quotes the verified fact with a citation; never submits or activates; idempotent', async () => {
    const { prisma, t } = db();
    const run = await runEvidenceResearch(prisma, input, { ...edgarOnly([primary()]), fetchText: async () => PAGE });
    const p = await proposeFromResearch(prisma, { researchRunId: run.runId, actor: 'casey', now: NOW });
    expect(p).toMatchObject({ ok: true, existing: false });
    const h = t.hyps.find((x) => x.source_ref === `research:${run.runId}`);
    expect(h.status).toBe('draft');
    expect(h.observation).toBe(`KROGER CO 10-Q (filed 2026-09-18): "${FACT.replace(/\.$/, '')}" [S:${run.facts[0].signalId}].`);
    expect(h.primary_persona_id).toBe(1886);
    expect(h.problem_hypothesis).toContain('My guess is');
    expect(t.events.map((e) => e.to_status)).toEqual(['draft']);
    const again = await proposeFromResearch(prisma, { researchRunId: run.runId, actor: 'casey', now: NOW });
    expect(again).toMatchObject({ ok: true, existing: true });
    expect(t.hyps.filter((x) => x.source_ref === `research:${run.runId}`)).toHaveLength(1);
  });

  it('refuses with no fresh evidence, and on conflicting evidence', async () => {
    const { prisma } = db();
    const none = await runEvidenceResearch(prisma, input, { ...edgarOnly([]), fetchText: async () => '' });
    expect(await proposeFromResearch(prisma, { researchRunId: none.runId, actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'no_fresh_evidence' });
    const open = 'Kroger said the Monroe distribution center opened in March with automated trailer check-in at the gate.';
    const close = 'Kroger later closed the Monroe distribution center and consolidated volume into the Ohio network.';
    const c = await runEvidenceResearch(prisma, input, { ...edgarOnly([primary({ excerpt: open }), primary({ excerpt: close })]), fetchText: async () => `${open} ${close}` });
    expect(await proposeFromResearch(prisma, { researchRunId: c.runId, actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'conflicting_evidence' });
  });
});
