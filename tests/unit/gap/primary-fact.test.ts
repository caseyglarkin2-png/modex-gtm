/**
 * Final Monday P1 #2: ONE primary outreach fact opens a first touch.
 *
 * The audit defect: research selected every found fact and joined them into
 * the observation. The opener grew past what one first touch can quote, the
 * thesis was approved and used, and it only failed at Send (compiler C07).
 * Pinned here: exactly one fact is quoted (the default is the first eligible
 * fact in research order, Casey may pick another), the others are research
 * context only, and an opener over the compiler's quote cap is refused before
 * it can be approved or put in use.
 */
import { describe, expect, it, vi } from 'vitest';
import { hypothesisFindFirst } from './fixtures/hypothesis-table';
import { loadThesisGroups, useEvidenceForThesis } from '@/lib/gap/hypothesis/thesis-groups';
import { outreachReadiness } from '@/lib/gap/hypothesis/actionability';
import { transition, type HypothesisSnapshot } from '@/lib/gap/hypothesis/machine';
import { citedQuote, proposeFromResearch } from '@/lib/gap/research/propose';
import { OPENER_MAX_QUOTED_WORDS, factFitsOpener, openerFits, openerQuotedWords } from '@/lib/gap/research/opener';
import { MAX_QUOTED_WORDS, checkWordCount } from '@/lib/gap/compiler/checks/c07-structure';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-09-27T15:00:00Z');
const LATER = new Date('2026-11-06T05:00:00Z');
const SEC = 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm';
const KW = { id: 'kw', account_name: 'PepsiCo', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_url: SEC, evidence_text: '', summary: null, title: 'PEP 10-Q (2026-07-09) mentions: capital expenditure', observed_at: new Date('2026-07-09'), external_ok: null, metadata: null, freshness_expires_at: LATER };
const verified = (id: string, text: string) => ({
  id, account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: `${SEC}#${id}`, evidence_text: text, summary: null,
  title: 'PEPSICO INC 10-Q (filed 2026-07-09)', observed_at: new Date('2026-07-09'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, freshness_expires_at: LATER,
});
const F1 = verified('f1', 'PepsiCo will close three distribution centers in 2027.');
const F2 = verified('f2', 'PepsiCo opened a new distribution center in Texas with forty dock doors.');
const F3 = verified('f3', 'PepsiCo said it will consolidate its Midwest distribution centers into two larger sites next year.');
const LONG = verified('long', `PepsiCo will close three distribution centers in 2027 ${Array.from({ length: 60 }, () => 'and').join(' ')} consolidate volume.`);

function row(id: string, persona: number, status: string, over: Record<string, unknown> = {}) {
  return {
    id, account_name: 'PepsiCo', problem_family: 'hidden_capacity', status, primary_persona_id: persona, persona: 'vp_logistics', confidence: 40,
    observation: 'PEP 10-Q (2026-07-09) mentions: capital expenditure [S:kw].', problem_hypothesis: 'My guess is handoffs.', root_cause_hypotheses: [], impact_hypotheses: [],
    falsification_questions: ['How many trailers wait?'], what_a_no_means: null, secondary_families: [], why_now: null, contrary_evidence: null, predicted_buyer_language: null, buying_center: null,
    signals: [{ signal_id: 'kw', signal: KW }], primary_persona: { name: `p${persona}`, title: 'VP' }, ...over,
  };
}

function db(rows: any[], signals: any[] = [KW, F1, F2, F3, LONG]) {
  return {
    prospectingHypothesis: {
      findMany: vi.fn(async () => rows),
      findUnique: vi.fn(async ({ where }: any) => rows.find((r) => r.id === where.id) ?? null),
      findFirst: vi.fn(hypothesisFindFirst(() => rows)),
    },
    prospectingSignal: { findMany: vi.fn(async ({ where }: any) => signals.filter((s) => where.id.in.includes(s.id))) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'e' })) },
    researchRun: { findMany: vi.fn(async () => []) },
  };
}

async function useEvidence(rows: any[], signalIds: string[], primarySignalId?: string) {
  const prisma = db(rows);
  const fingerprint = (await loadThesisGroups(prisma, {}, { now: NOW, singletons: true }))[0].fingerprint;
  const updateNarrative = vi.fn(async (_p: unknown, id: string) => ({ ok: true as const, id, status: 'draft' as const }));
  const propose = vi.fn(async (_p: unknown, input: any) => ({ ok: true as const, id: `rev-${input.supersedesId}`, status: 'draft' as const }));
  const r = await useEvidenceForThesis(prisma, { fingerprint, hypothesisIds: rows.map((x) => x.id), signalIds, ...(primarySignalId ? { primarySignalId } : {}), actor: 'casey', now: NOW }, { updateNarrative: updateNarrative as any, propose: propose as any });
  return { r, updateNarrative, propose };
}

describe('14-16. use_evidence: exactly one primary fact is the opener', () => {
  it('14. three facts chosen, no primary named: the FIRST (research order) is the only quote; the others are linked context', async () => {
    const { r, updateNarrative } = await useEvidence([row('d1', 1, 'draft')], ['f1', 'f2', 'f3']);
    expect(r.ok).toBe(true);
    const patch = (updateNarrative.mock.calls[0] as any)[2];
    expect(patch.observation).toBe(citedQuote(F1.title, F1.evidence_text, 'f1', 'PepsiCo'));
    expect(patch.observation.match(/"/g)).toHaveLength(2); // one quote
    expect(patch.primarySignalId).toBe('f1');
    expect(patch.signalIds).toEqual(['kw', 'f1', 'f2', 'f3']);
  });

  it('15. Casey names a different primary: the revision opens with that fact only (frozen row -> draft revision)', async () => {
    const { r, propose } = await useEvidence([row('a1', 916, 'approved')], ['f1', 'f2', 'f3'], 'f3');
    expect(r.ok).toBe(true);
    const input = (propose.mock.calls[0] as any)[1];
    expect(input.observation).toBe(citedQuote(F3.title, F3.evidence_text, 'f3', 'PepsiCo'));
    expect(input.observation).not.toContain(F1.evidence_text.replace(/\.$/, ''));
    expect(input.observation).not.toContain(F2.evidence_text.replace(/\.$/, ''));
    expect(input.primarySignalId).toBe('f3');
  });

  it('16. the other facts never appear in the first-touch observation', async () => {
    const { updateNarrative } = await useEvidence([row('d1', 1, 'draft')], ['f2', 'f1'], 'f2');
    const obs = (updateNarrative.mock.calls[0] as any)[2].observation as string;
    expect(obs).toContain('forty dock doors');
    expect(obs).not.toContain('close three distribution centers');
  });

  it('a primary that is not among the chosen facts is refused before any write', async () => {
    const { r, updateNarrative, propose } = await useEvidence([row('d1', 1, 'draft')], ['f1'], 'f2');
    expect(r).toEqual({ ok: false, reason: 'primary_not_chosen:f2', results: [] });
    expect(updateNarrative).not.toHaveBeenCalled();
    expect(propose).not.toHaveBeenCalled();
  });

  it('17. a primary fact longer than a first touch can quote is refused before any write', async () => {
    const { r, updateNarrative, propose } = await useEvidence([row('d1', 1, 'draft'), row('a1', 916, 'approved')], ['long'], 'long');
    expect(r).toEqual({ ok: false, reason: 'opener_too_long:long', results: [] });
    expect(updateNarrative).not.toHaveBeenCalled();
    expect(propose).not.toHaveBeenCalled();
  });
});

describe('17. the opener limit is the compiler limit, pinned before approve and use', () => {
  it('is the same number C07 applies at Send', () => {
    expect(OPENER_MAX_QUOTED_WORDS).toBe(MAX_QUOTED_WORDS);
    expect(factFitsOpener(F1.evidence_text)).toBe(true);
    expect(factFitsOpener(LONG.evidence_text)).toBe(false);
  });

  it('agrees with C07: an opener at the cap passes the step-1 word count, one quoted word more fails it', () => {
    const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
    const ours = `Hi Dana, ${words(50)}. Worth a look?`;
    const at = { id: 'e1', excerpt: words(OPENER_MAX_QUOTED_WORDS) };
    const over = { id: 'e2', excerpt: words(OPENER_MAX_QUOTED_WORDS + 1) };
    const body = (e: { id: string; excerpt: string }) => `"${e.excerpt}" [S:${e.id}]. ${ours}`;
    const ctx = (e: { id: string; excerpt: string }) => ({ stepIndex: 0, evidence: [e] }) as any;
    expect(openerFits(body(at))).toBe(true);
    expect(checkWordCount({ subject: 's', body: body(at) } as any, ctx(at)).passed).toBe(true);
    expect(openerFits(body(over))).toBe(false);
    expect(checkWordCount({ subject: 's', body: body(over) } as any, ctx(over)).passed).toBe(false);
  });

  it('the old joined-facts opener is NOT outreach-ready: opener_too_long (so the UI offers revise, not use)', () => {
    const F4 = verified('f4', `PepsiCo will close its ${Array.from({ length: 20 }, () => 'old').join(' ')} distribution center in Ohio.`);
    const joined = [F1, F2, F3, F4].map((f) => citedQuote(f.title, f.evidence_text, f.id, 'PepsiCo')).join(' ');
    expect(openerQuotedWords(joined)).toBeGreaterThan(OPENER_MAX_QUOTED_WORDS);
    const signals = [F1, F2, F3, F4];
    expect(outreachReadiness({ observation: joined, account_name: 'PepsiCo', signals }, NOW)).toEqual({ ready: false, reason: 'opener_too_long' });
    // One fact from the same set is ready.
    expect(outreachReadiness({ observation: citedQuote(F1.title, F1.evidence_text, 'f1', 'PepsiCo'), account_name: 'PepsiCo', signals: [F1] }, NOW)).toEqual({ ready: true, reason: null });
  });

  it('the machine refuses approve and activate on an over-long opener (a known-invalid opener never becomes active)', () => {
    const observation = citedQuote(LONG.title, LONG.evidence_text, 'long', 'PepsiCo');
    const snap = (status: string): HypothesisSnapshot => ({
      status: status as any, problemFamily: 'hidden_capacity', persona: 'vp_logistics' as any, observation, problemHypothesis: 'My guess is handoffs.',
      falsificationQuestions: ['How many trailers wait?'], reviewedBy: 'casey', primaryPersonaId: 916, personaSuppressed: false, version: null, expiresAt: null, confirmedDispositions: [],
      linkedSignals: [{ id: 'long', hasEvidence: true, outreachFact: true, expiresAt: LATER }],
    });
    expect(transition(snap('review_required'), 'approve', { now: NOW, actor: 'casey' })).toEqual({ ok: false, reason: 'opener_too_long' });
    expect(transition(snap('approved'), 'activate', { now: NOW })).toEqual({ ok: false, reason: 'opener_too_long' });
  });
});

describe('14. Research this proposal: one primary fact, the first that fits an opener', () => {
  function researchDb(facts: any[]) {
    const hyps: any[] = [];
    const prisma: any = {
      researchRun: { findUnique: vi.fn(async () => ({ id: 'run1', account_name: 'PepsiCo', persona_id: 916, provider_status: { outcome: 'evidence_found', hypothesisId: null, problemFamily: 'hidden_capacity' } })) },
      evidenceRecord: { findMany: vi.fn(async () => facts.map((f) => ({ id: `ev-${f.id}` }))) },
      prospectingSignal: { findMany: vi.fn(async () => facts) },
      prospectingHypothesis: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(hypothesisFindFirst(() => hyps)),
        create: vi.fn(async ({ data }: any) => { hyps.push({ id: 'new', ...data }); return { id: 'new' }; }),
      },
      hypothesisSignal: { createMany: vi.fn(async ({ data }: any) => ({ count: data.length })) },
      hypothesisEvent: { create: vi.fn(async () => ({ id: 'he' })) },
      gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })) },
      persona: { findUnique: vi.fn(async () => ({ id: 916 })) },
    };
    prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
    return { prisma, hyps };
  }

  it('three facts found, the first too long: the opener quotes the next one only', async () => {
    const { prisma, hyps } = researchDb([LONG, F1, F2]);
    const p = await proposeFromResearch(prisma, { researchRunId: 'run1', actor: 'casey', now: NOW });
    expect(p).toMatchObject({ ok: true });
    expect(hyps[0].observation).toBe(citedQuote(F1.title, F1.evidence_text, 'f1', 'PepsiCo'));
    expect(openerFits(hyps[0].observation)).toBe(true);
  });

  it('every fact too long: no proposal (opener_too_long), nothing written', async () => {
    const { prisma, hyps } = researchDb([LONG]);
    expect(await proposeFromResearch(prisma, { researchRunId: 'run1', actor: 'casey', now: NOW })).toEqual({ ok: false, reason: 'opener_too_long' });
    expect(hyps).toHaveLength(0);
  });
});
