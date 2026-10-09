// @vitest-environment node
/**
 * C53 (the commercial-context audit, 2026-10-08): retrieval evaluated before prose, over the frozen reference set,
 * through the real assembler with sink adapters. The report is per class with its sample size; the required Kenco
 * roadmap is retrieved; private intent (a Clawd inference, a vault seller note) is never promoted to external use;
 * the instruction-shaped text stays quoted data and the adapters see reads only; a known-bad adapter makes the
 * evaluator fail, so a clean report is a measurement.
 */
import { describe, expect, it } from 'vitest';
import { byId, REFERENCE_SET, REFERENCE_SET_VERSION } from './fixtures/reference-set';
import { EVAL_CLASSES, evaluateRetrieval, renderRetrievalEval, runCase } from '@/lib/gap/evaluation/retrieval-eval';
import { externallyUsable } from '@/lib/gap/context/commercial-context';

const NOW = new Date('2026-10-08T15:00:00Z');

describe('C53: retrieval evaluation', () => {
  it('every class passes over every case whole and with one source removed; the report says the sample size per class', async () => {
    const r = await evaluateRetrieval(REFERENCE_SET, { now: NOW, referenceVersion: REFERENCE_SET_VERSION });
    expect(r.sampleSize).toEqual({ cases: 12, runs: 24 });
    for (const k of EVAL_CLASSES) {
      expect(r.classes[k].checked, k).toBe(24);
      // FINDING C53-1 (closed by builder B, context/assemble.ts buyerClaimsFromTimeline): a vendor pitch on the timeline is an
      // internal_only claim, never externally usable; the evaluator's two classes that reported it are back to [].
      expect(r.classes[k].failures, k).toEqual([]);
    }
    const md = renderRetrievalEval(r);
    expect(md).toContain('| source_recall | 24 | 0 |');
    expect(md).toContain('| instruction_safety | 24 | 0 |');
    expect(md).toContain('| unauthorized_exclusion | 24 | 0 |');
    expect(md).toContain('kenco-positive (missing_source)');
    expect(md).toMatch(/opportunity unknown; reads: .*gaps: crm: no read returned/);
  });

  it('the Kenco case: the roadmap words, the deal and the accepted meeting are retrieved; the vault no-deal line and the Clawd wedge inference stay seller context, never external; the draft is a draft', async () => {
    const { report } = await runCase(byId('kenco-positive'), 'full', NOW);
    const p = report.packet;
    expect(p.opportunity).toMatchObject({ status: 'open', deals: [{ id: '62700000001', stage: 'presentationscheduled' }] });
    expect(p.buyerFacts.map((c) => c.text)).toEqual([expect.stringContaining('We will keep Open Dock at the ungated yards')]);
    expect(p.timeline.map((e) => [e.id, e.type, e.isDraft])).toEqual([
      ['gmail:1a0aa0000000001', 'email', false], ['gmail:1a0aa0000000002', 'email', false], ['gmail:draft:1a0aa0000000003', 'draft', true], ['calendar:evt_000001', 'calendar', false],
    ]);
    const ext = externallyUsable([...p.buyerFacts, ...p.sellerHypotheses, ...p.externalFacts]);
    expect(ext.map((c) => c.claimClass)).toEqual(['buyer_said']);
    expect(p.incumbents.map((c) => c.claimId)).toEqual([p.buyerFacts[0].claimId]);
    const seller = p.sellerHypotheses.map((c) => c.text);
    expect(seller.some((t) => /No associated deal yet/.test(t))).toBe(true);
    expect(seller.some((t) => /detention at the Chattanooga yard/.test(t))).toBe(true);
    // C15: the vault line is dated by its own day, the Clawd wedge by its version; both are indexed October 8.
    const vaultLine = p.sellerHypotheses.find((c) => /No associated deal yet/.test(c.text))!;
    expect(vaultLine.observedAt?.slice(0, 10)).toBe('2026-07-11');
    expect(vaultLine.indexedAt?.slice(0, 10)).toBe('2026-10-08');
    const wedge = p.sellerHypotheses.find((c) => /detention/.test(c.text))!;
    expect(wedge.observedAt?.slice(0, 10)).toBe('2026-08-20');
    expect(wedge.indexedAt).toBe('2026-10-08T13:02:52.000Z');
    expect(p.incumbents.map((c) => c.text)).toEqual([expect.stringMatching(/Open Dock/)]);
  });

  it('the suspicious notice: its instruction is quoted inside its own claim only, the adapters saw reads only, nothing is externally usable', async () => {
    const { report, calls } = await runCase(byId('suspicious-invite'), 'full', NOW);
    const p = report.packet;
    expect(calls.every((c) => /^(identity\.read|crm\.read|gmail\.read|public\.read|commitments\.read|vault\.readFile:|clawd\.fetchSnapshot:)/.test(c))).toBe(true);
    // C53-1 (builder B): a suspicious notice is internal_only data under the seller's authority, never a buyer fact.
    expect(p.buyerFacts).toHaveLength(0);
    const notice = p.sellerHypotheses.filter((c) => c.sourceKind === 'gmail');
    expect(notice).toHaveLength(1);
    expect(notice[0]).toMatchObject({ claimClass: 'internal_only', authority: 'seller_interpretation', visibility: 'internal' });
    expect(externallyUsable([...p.buyerFacts, ...p.sellerHypotheses])).toEqual([]);
    expect(JSON.stringify({ coverage: p.coverage, opportunity: p.opportunity, identity: p.identity })).not.toContain('GAP_AUTO_ENROLL_ENABLED');
  });

  it('a known-bad adapter (a seller note promoted to a buyer message) is caught by unauthorized_exclusion, so a clean report is a measurement and not a default', async () => {
    const r = await evaluateRetrieval([byId('kenco-positive')], { now: NOW, referenceVersion: REFERENCE_SET_VERSION, promoteSellerNote: true });
    expect(r.classes.unauthorized_exclusion.failures.length).toBeGreaterThan(0);
    expect(r.classes.unauthorized_exclusion.failures[0].detail).toMatch(/seller_noted text of vault:Kestrel\.md#standup-2026-07-11 is externally usable/);
    expect(renderRetrievalEval(r)).toContain('## Failures');
  });
});
