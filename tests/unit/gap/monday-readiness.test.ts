/**
 * GAP Monday readiness (2026-09-27): the live PepsiCo defect.
 *
 * Production shape: five PepsiCo hypotheses already APPROVED, none active,
 * the observation still "PEP 10-Q (2026-07-09) mentions: capital expenditure
 * [S:kw]" (a keyword hit), and three verified-but-irrelevant 10-Q excerpts
 * linked beside it. Approve + use was offered from status alone, the server
 * correctly refused `evidence_insufficient`, and the result read "0 approved".
 *
 * The rule pinned here: actionability is derived on the server from the
 * canonical evidence gate; approved + insufficient is RESEARCH (revise), never
 * Approve + use; the result reports actual state; chosen verified evidence
 * rebuilds an editable observation and REVISES (never edits) a frozen one.
 */
import { hypothesisFindFirst } from './fixtures/hypothesis-table';
import { describe, expect, it, vi } from 'vitest';
import { actionabilityOf, outreachReadiness } from '@/lib/gap/hypothesis/actionability';
import { approveSelectedSiblings, corroborateThesis, isResearchWork, isReviewWork, loadThesisGroups, splitThesisWork, summarizeApproval, toThesisCard, useEvidenceForThesis } from '@/lib/gap/hypothesis/thesis-groups';
import { transition, type HypothesisSnapshot } from '@/lib/gap/hypothesis/machine';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { citedQuote } from '@/lib/gap/research/propose';

const NOW = new Date('2026-09-27T15:00:00Z');
const LATER = new Date('2026-11-06T05:00:00Z');
const SEC = 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm';

const KW = { id: 'kw', account_name: 'PepsiCo', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_url: SEC, evidence_text: '', summary: null, title: 'PEP 10-Q (2026-07-09) mentions: capital expenditure', observed_at: new Date('2026-07-09'), external_ok: null, metadata: null, freshness_expires_at: LATER };
const verified = (id: string, text: string, extra: Record<string, unknown> = {}) => ({
  id, account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: `${SEC}#${id}`, evidence_text: text, summary: null,
  title: 'PEPSICO INC 10-Q (filed 2026-07-09)', observed_at: new Date('2026-07-09'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, freshness_expires_at: LATER, ...extra,
});
/** Verified, quoted, dated, but not a physical-network change (the production 10-Q sentences). */
const IRRELEVANT = verified('irr', 'Restructuring charges were recorded in selling, general and administrative expenses.');
/** A verified outreach fact. */
const FACT = verified('fact', 'PepsiCo will close three distribution centers in 2027.');
const KW_OBS = 'PEP 10-Q (2026-07-09) mentions: capital expenditure [S:kw].';
/** The observation the evidence path builds from FACT (source label + whole quote + citation). */
const FACT_OBS = citedQuote(FACT.title, FACT.evidence_text, 'fact', 'PepsiCo');

function hyp(id: string, persona: number, status: string, over: Record<string, unknown> = {}, signals: any[] = [KW, IRRELEVANT]) {
  return {
    id, account_name: 'PepsiCo', problem_family: 'hidden_capacity', status, primary_persona_id: persona, persona: 'vp_logistics', confidence: 40,
    observation: KW_OBS, problem_hypothesis: 'My guess is handoffs.', root_cause_hypotheses: ['Gate waiting'], impact_hypotheses: ['Fewer turns'],
    falsification_questions: ['How many trailers wait?'], what_a_no_means: 'Closed.', secondary_families: [], why_now: null, contrary_evidence: null, predicted_buyer_language: null, buying_center: null,
    signals: signals.map((s) => ({ signal_id: s.id, signal: s })), primary_persona: { name: `p${persona}`, title: 'VP' },
    ...over,
  };
}

/** The production shape: five approved siblings, keyword observation, nothing in use. */
const PEP5 = () => [hyp('a1', 916, 'approved'), hyp('a2', 928, 'approved'), hyp('a3', 976, 'approved'), hyp('a4', 1007, 'approved'), hyp('a5', 1845, 'approved')];

function db(rows: any[], signals: any[] = [KW, IRRELEVANT, FACT]) {
  return {
    prospectingHypothesis: {
      findMany: vi.fn(async (q: any) => {
        // Honor the CURRENT-work filter: a superseded row is history.
        const superseded = new Set(rows.map((r) => r.supersedes_id).filter(Boolean));
        return q?.where?.superseded_by ? rows.filter((r) => !superseded.has(r.id)) : rows;
      }),
      findUnique: vi.fn(async ({ where }: any) => rows.find((r) => r.id === where.id) ?? null),
      findFirst: vi.fn(hypothesisFindFirst(() => rows)),
    },
    prospectingSignal: { findMany: vi.fn(async ({ where }: any) => signals.filter((s) => where.id.in.includes(s.id))) },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'e' })) },
    researchRun: { findMany: vi.fn(async () => []) },
  };
}

// A machine snapshot of a row, so the tests prove the UI rule agrees with the refusal.
function snapshot(row: any, status = row.status): HypothesisSnapshot {
  return {
    status, problemFamily: row.problem_family, persona: row.persona, observation: row.observation, problemHypothesis: row.problem_hypothesis,
    falsificationQuestions: row.falsification_questions, reviewedBy: 'casey@freightroll.com', primaryPersonaId: row.primary_persona_id, personaSuppressed: false,
    version: null, expiresAt: null, confirmedDispositions: [],
    linkedSignals: row.signals.map((l: any) => ({ id: l.signal.id, hasEvidence: Boolean(l.signal.evidence_url || l.signal.evidence_text), outreachFact: l.signal.id === 'fact', expiresAt: l.signal.freshness_expires_at })),
  };
}

describe('1-4. actionability is server-derived from the canonical evidence gate', () => {
  it('the live PepsiCo shape: approved + insufficient -> revise, no approve, no use (and the machine agrees: activate is refused)', () => {
    const row = PEP5()[0];
    const a = actionabilityOf({ ...row, signals: row.signals.map((l: any) => l.signal) }, NOW);
    expect(a).toEqual({ outreachReady: false, reason: 'evidence_insufficient', canApprove: false, canUse: false, next: 'revise' });
    expect(transition(snapshot(row), 'activate', { now: NOW, actor: 'c' })).toEqual({ ok: false, reason: 'evidence_insufficient' });
  });

  it('draft/review + insufficient -> find_evidence (research), never an approval that is guaranteed to fail', () => {
    for (const status of ['draft', 'review_required']) {
      const row = hyp('d', 1, status);
      expect(actionabilityOf({ ...row, signals: row.signals.map((l: any) => l.signal) }, NOW)).toMatchObject({ canApprove: false, canUse: false, next: 'find_evidence' });
    }
  });

  it('approved + sendable -> use; draft + sendable -> approve_use; active -> in_use (no approval CTA)', () => {
    const obs = FACT_OBS;
    const sig = [KW, FACT];
    expect(actionabilityOf({ status: 'approved', observation: obs, account_name: 'PepsiCo', signals: sig }, NOW)).toMatchObject({ outreachReady: true, canUse: true, canApprove: false, next: 'use' });
    expect(actionabilityOf({ status: 'draft', observation: obs, account_name: 'PepsiCo', signals: sig }, NOW)).toMatchObject({ outreachReady: true, canApprove: true, next: 'approve_use' });
    expect(actionabilityOf({ status: 'active', observation: obs, account_name: 'PepsiCo', signals: sig }, NOW)).toMatchObject({ canApprove: false, canUse: false, next: 'in_use' });
  });

  it('distinguishes no_evidence and evidence_expired from insufficient', () => {
    expect(outreachReadiness({ observation: KW_OBS, account_name: 'PepsiCo', signals: [{ ...KW, evidence_url: null }] }, NOW).reason).toBe('no_evidence');
    const obs = FACT_OBS;
    // I06: a fact past its window is READY (the copy says its date); only a fact that ended, closed, is undated or superseded is evidence_expired.
    expect(outreachReadiness({ observation: obs, account_name: 'PepsiCo', signals: [{ ...FACT, freshness_expires_at: new Date('2026-09-01') }] }, NOW)).toEqual({ ready: true, reason: null });
    expect(outreachReadiness({ observation: obs, account_name: 'PepsiCo', signals: [{ ...FACT, metadata: { ...(FACT.metadata as Record<string, unknown>), superseded: true } }] }, NOW)).toEqual({ ready: false, reason: 'evidence_expired' });
  });

  it('the group card carries readiness and per-person next steps; insufficient is RESEARCH, not REVIEW', async () => {
    const groups = await loadThesisGroups(db(PEP5()), {}, { now: NOW });
    expect(groups).toHaveLength(1);
    const card = toThesisCard(groups[0]);
    expect(card.readiness).toEqual({ ready: false, reason: 'evidence_insufficient' });
    expect(card.members.map((m) => m.next)).toEqual(['revise', 'revise', 'revise', 'revise', 'revise']);
    expect(isReviewWork(groups[0])).toBe(false);
    expect(isResearchWork(groups[0])).toBe(true);
  });
});

describe('3. the result describes actual state', () => {
  it('five already-approved rows that refused activation read 5 approved, 0 in use, 5 need verified evidence (never "0 approved")', async () => {
    const prisma = db(PEP5());
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const refuse = vi.fn(async () => ({ ok: false as const, reason: 'evidence_insufficient' })) as any;
    const r = await approveSelectedSiblings(prisma, { fingerprint: fp, hypothesisIds: ['a1', 'a2', 'a3', 'a4', 'a5'], actor: 'c', now: NOW, use: true }, { transition: refuse });
    expect(r.summary).toEqual({ approved: 5, newlyApproved: 0, alreadyApproved: 5, inUse: 0, needsResearch: 5, blocked: 0, requestedUse: true, reasons: ['evidence_insufficient'] });
  });

  it('newly vs already approved, in use, and a non-evidence refusal counts as blocked', () => {
    const s = summarizeApproval(
      [
        { hypothesisId: 'x', ok: true, from: 'draft', to: 'active', detail: '' },
        { hypothesisId: 'y', ok: true, from: 'approved', to: 'active', detail: '' },
        { hypothesisId: 'z', ok: false, from: 'review_required', to: 'approved', detail: '', reason: 'suppressed' },
        { hypothesisId: 'w', ok: false, from: 'draft', to: null, detail: '', reason: 'unhedged_hypothesis' },
      ],
      true,
    );
    expect(s).toEqual({ approved: 3, newlyApproved: 2, alreadyApproved: 1, inUse: 2, needsResearch: 0, blocked: 2, requestedUse: true, reasons: ['suppressed', 'unhedged_hypothesis'] });
  });
});

describe('5-7, 9. USE THIS VERIFIED EVIDENCE', () => {
  it('5. editable rows: the observation is rebuilt from the chosen fact (the keyword observation is replaced), in one audited narrative edit', async () => {
    const rows = [hyp('d1', 1, 'draft'), hyp('d2', 2, 'review_required')];
    const prisma = db(rows);
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const updateNarrative = vi.fn(async (_p: unknown, id: string) => ({ ok: true as const, id, status: 'draft' as const }));
    const propose = vi.fn();
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['d1', 'd2'], signalIds: ['fact'], actor: 'casey@freightroll.com', now: NOW }, { updateNarrative: updateNarrative as any, propose: propose as any });
    expect(r.ok).toBe(true);
    expect(propose).not.toHaveBeenCalled();
    for (const call of updateNarrative.mock.calls as any[]) {
      const patch = call[2];
      expect(patch.observation).not.toContain('mentions: capital expenditure');
      expect(patch.observation).toContain('"PepsiCo will close three distribution centers in 2027" [S:fact]');
      expect(patch.signalIds).toEqual(['kw', 'irr', 'fact']);
      expect(call[3]).toBe('casey@freightroll.com');
    }
    // The rebuilt row is now approvable: the sentence Casey approves is the sentence the gate judged.
    const rebuilt = { ...rows[0], observation: (updateNarrative.mock.calls[0] as any)[2].observation, signals: [KW, IRRELEVANT, FACT] };
    expect(actionabilityOf(rebuilt, NOW).next).toBe('approve_use');
    expect(rebuilt.observation).toBe(FACT_OBS);
  });

  it('6. frozen approved + insufficient: the original is never edited; a DRAFT revision supersedes it, carries the new observation, and needs human review', async () => {
    const rows = PEP5();
    const prisma = db(rows);
    const before = JSON.stringify(rows);
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const updateNarrative = vi.fn();
    const propose = vi.fn(async (_p: unknown, input: any) => ({ ok: true as const, id: `rev-${input.supersedesId}`, status: 'draft' as const }));
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['a1', 'a2', 'a3', 'a4', 'a5'], signalIds: ['fact'], actor: 'casey@freightroll.com', now: NOW }, { updateNarrative: updateNarrative as any, propose: propose as any });
    expect(r.ok).toBe(true);
    expect(updateNarrative).not.toHaveBeenCalled(); // no write path to the frozen rows at all
    expect(JSON.stringify(rows)).toBe(before);
    expect(r.results.map((x) => x.revisionId)).toEqual(['rev-a1', 'rev-a2', 'rev-a3', 'rev-a4', 'rev-a5']);
    const input = (propose.mock.calls[0] as any)[1];
    expect(input).toMatchObject({ supersedesId: 'a1', sourceRef: 'revision:a1', primaryPersonaId: 916, problemHypothesis: 'My guess is handoffs.', createdBy: 'casey@freightroll.com', metadata: { revisionOf: 'a1', narrativeIsDraftCandidate: true } });
    expect(input.observation).not.toContain('mentions:');
    expect(input.signalIds).toEqual(['kw', 'irr', 'fact']);
    // proposeHypothesis only ever creates a DRAFT: approval and use stay Casey's explicit click.
  });

  it('6b. after revision the old rows leave current work (superseded), history intact; the revisions form one reviewable thesis', async () => {
    const obs = FACT_OBS;
    const rows = [...PEP5(), ...['a1', 'a2', 'a3', 'a4', 'a5'].map((id, i) => hyp(`rev-${id}`, [916, 928, 976, 1007, 1845][i], 'draft', { supersedes_id: id, observation: obs }, [KW, IRRELEVANT, FACT]))];
    const groups = await loadThesisGroups(db(rows), {}, { now: NOW });
    expect(groups).toHaveLength(1);
    expect(groups[0].members.map((m) => m.id)).toEqual(['rev-a1', 'rev-a2', 'rev-a3', 'rev-a4', 'rev-a5']);
    expect(groups[0].members.every((m) => m.next === 'approve_use')).toBe(true);
    expect(isReviewWork(groups[0])).toBe(true);
    expect(rows.slice(0, 5).every((r) => r.status === 'approved' && r.observation === KW_OBS)).toBe(true);
  });

  it('idempotent: a second click reuses the existing revision instead of creating a second one', async () => {
    const prisma = db(PEP5());
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const propose = vi.fn(async () => ({ ok: false as const, reason: 'duplicate_source_ref', existingId: 'rev-old' }));
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['a1'], signalIds: ['fact'], actor: 'c', now: NOW }, { propose: propose as any });
    expect(r.results[0]).toMatchObject({ ok: true, revisionId: 'rev-old', detail: 'revision already exists' });
  });

  it('a lost unique-constraint race (P2002) reads as the existing revision, not a 500', async () => {
    const prisma: any = db(PEP5());
    prisma.prospectingHypothesis.findFirst = vi.fn(async () => ({ id: 'rev-winner' }));
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const propose = vi.fn(async () => { throw Object.assign(new Error('unique'), { code: 'P2002' }); });
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['a1'], signalIds: ['fact'], actor: 'c', now: NOW }, { propose: propose as any });
    expect(r.results[0]).toMatchObject({ ok: true, revisionId: 'rev-winner', detail: 'revision already exists' });
  });

  it.each([
    ['keyword hit', 'kw', 'not_verified_evidence:kw:keyword_only'],
    ['verified but not a physical-network change', 'irr', 'not_verified_evidence:irr:not_a_physical_network_change'],
  ])('7. refuses evidence that is not a verified outreach fact (%s) before any write', async (_l, sig, reason) => {
    const prisma = db(PEP5());
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const propose = vi.fn();
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['a1'], signalIds: [sig], actor: 'c', now: NOW }, { propose: propose as any });
    expect(r).toEqual({ ok: false, reason, results: [] });
    expect(propose).not.toHaveBeenCalled();
  });

  it('7. an ENDED fact is refused by name; a fact past its window is not (I06)', async () => {
    const prisma = db(PEP5(), [KW, IRRELEVANT, { ...FACT, freshness_expires_at: new Date('2026-09-01'), metadata: { ...(FACT.metadata as Record<string, unknown>), continuity: { kind: 'ended' } } }]);
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const r = await useEvidenceForThesis(prisma, { fingerprint: fp, hypothesisIds: ['a1'], signalIds: ['fact'], actor: 'c', now: NOW }, { propose: vi.fn() as any });
    expect(r.reason).toMatch(/^not_verified_evidence:fact:(ended|superseded)$/);
  });
});

describe('FIND VERIFIED EVIDENCE on a not-ready thesis (final review blocker 2)', () => {
  const research = (facts: any[]) => async () => ({ runId: 'r', outcome: 'evidence_found', facts, rejected: [], conflicts: [], notes: [] }) as any;
  const asFact = (s: any) => ({ signalId: s.id, excerpt: s.evidence_text, url: s.evidence_url, title: s.title, publishedAt: '2026-07-09', fresh: true });

  it('offers a relevant fact from the SAME filing its irrelevant legacy excerpt came from (not "nothing found")', async () => {
    // Same accession as IRRELEVANT: an origin the thesis already has.
    const sameFiling = { ...FACT, id: 'same', evidence_url: IRRELEVANT.evidence_url };
    const prisma = db(PEP5(), [KW, IRRELEVANT, sameFiling]);
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const r = await corroborateThesis(prisma, { fingerprint: fp, actor: 'c', now: NOW, force: true }, { run: research([asFact(sameFiling)]) });
    expect(r.ok && r.outcome).toBe('corroborated');
    expect(r.ok && r.newIndependent.map((f) => f.signalId)).toEqual(['same']);
  });

  it('never offers a fact use_evidence would refuse (not a physical-network change) or one already linked', async () => {
    const prisma = db(PEP5(), [KW, IRRELEVANT]);
    const fp = (await loadThesisGroups(prisma, {}, { now: NOW }))[0].fingerprint;
    const other = { ...IRRELEVANT, id: 'irr2' };
    const prisma2 = db(PEP5(), [KW, IRRELEVANT, other]);
    const r = await corroborateThesis(prisma2, { fingerprint: fp, actor: 'c', now: NOW, force: true }, { run: research([asFact(other), asFact(IRRELEVANT)]) });
    expect(r.ok && r.outcome).toBe('no_second_source');
    void prisma;
  });
});

describe('8-9. the machine still decides', () => {
  it('8. the old insufficient hypothesis still refuses activation', () => {
    expect(transition(snapshot(PEP5()[0]), 'activate', { now: NOW, actor: 'c' })).toEqual({ ok: false, reason: 'evidence_insufficient' });
  });

  it('9. a verified revision activates only through the explicit transitions (submit, approve with an actor, activate after review)', () => {
    const obs = FACT_OBS;
    const rev = hyp('rev', 916, 'draft', { observation: obs }, [KW, IRRELEVANT, FACT]);
    // A draft cannot be activated or approved directly.
    expect(transition(snapshot(rev), 'activate', { now: NOW })).toEqual({ ok: false, reason: 'ILLEGAL_TRANSITION:draft->activate' });
    expect(transition(snapshot(rev), 'approve', { now: NOW, actor: 'c' })).toEqual({ ok: false, reason: 'ILLEGAL_TRANSITION:draft->approve' });
    expect(transition(snapshot(rev, 'review_required'), 'approve', { now: NOW })).toEqual({ ok: false, reason: 'no_actor' });
    expect(transition(snapshot(rev, 'review_required'), 'approve', { now: NOW, actor: 'casey@freightroll.com' })).toMatchObject({ ok: true, to: 'approved' });
    expect(transition({ ...snapshot(rev, 'approved'), reviewedBy: null }, 'activate', { now: NOW })).toEqual({ ok: false, reason: 'not_reviewed' });
    expect(transition(snapshot(rev, 'approved'), 'activate', { now: NOW })).toMatchObject({ ok: true, to: 'active' });
  });
});

describe('4. NEXT UP and the lanes never offer an activation the evidence gate will refuse', () => {
  it('the PepsiCo thesis is RESEARCH work, not a REVIEW decision; a ready thesis and a ready one-off are REVIEW work', async () => {
    const ready = [hyp('r1', 1, 'draft', { account_name: 'PepsiCo', observation: FACT_OBS, problem_family: 'network_change' }, [KW, FACT]), hyp('r2', 2, 'approved', { observation: FACT_OBS, problem_family: 'network_change' }, [KW, FACT])];
    const oneOff = hyp('o1', 3, 'review_required', { observation: FACT_OBS, problem_hypothesis: 'Maybe dwell.' }, [FACT]);
    const lonelyInsufficient = hyp('o2', 4, 'approved', { problem_hypothesis: 'Perhaps gates.' });
    const groups = await loadThesisGroups(db([...PEP5(), ...ready, oneOff, lonelyInsufficient]), {}, { singletons: true, now: NOW });
    const split = splitThesisWork(groups);
    expect(split.reviewGroups.map((g) => g.members.map((m) => m.id))).toEqual([['r1', 'r2']]);
    expect(split.readyOneOffIds).toEqual(['o1']);
    expect(split.researchGroups.map((g) => g.members.map((m) => m.id))).toEqual([['a1', 'a2', 'a3', 'a4', 'a5'], ['o2']]);
    // Nothing offered as a decision has a member whose next step is research.
    for (const g of split.reviewGroups) for (const m of g.members) expect(['approve_use', 'use', 'in_use']).toContain(m.next);
  });
});
