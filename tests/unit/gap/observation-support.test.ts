/**
 * Ops closeout (item 16): a human-edited observation cannot claim more than
 * its approved evidence supports and still become sendable.
 *
 * The gate used to check CITATIONS only: an observation citing a real
 * verified fact passed approve, activate and send whatever it said (final red
 * team, GAP method P2-2: "Since the Giant Eagle merger, Kroger yards are
 * overwhelmed and trailers sit for hours at every DC [S:fact]" was
 * VERIFIED_FACT). The rule is now deterministic, no scoring layer: the
 * observation is its source label(s) plus quotes, and every quote is found in
 * the evidence of a fact it cites. Any other prose is an unsupported claim.
 */
import { describe, expect, it } from 'vitest';
import { observationSupportGap, sendableEvidence, VERIFIED_EXCERPT, type GateSignal } from '@/lib/gap/research/evidence-gate';
import { citedQuote } from '@/lib/gap/research/propose';
import { observationTitle } from '@/lib/gap/research/source-label';

const FACT_TEXT = 'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”).';
const TITLE = 'KROGER CO 10-Q (filed 2026-09-18)';
const FACT: GateSignal & { title: string } = {
  id: 'sig-f', account_name: 'Kroger', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: FACT_TEXT,
  evidence_url: 'https://sec.gov/x', observed_at: new Date('2026-09-18T00:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: TITLE,
};
const OTHER: GateSignal & { title: string } = { ...FACT, id: 'sig-o', evidence_text: 'Kroger will close three distribution centers in 2027.', title: 'Kroger 8-K (filed 2026-08-01)' };

describe('observationSupportGap', () => {
  it('the propose-built shape (source label + one verbatim quote + citation) is supported', () => {
    expect(observationSupportGap(citedQuote(TITLE, FACT_TEXT, 'sig-f', 'Kroger'), [FACT], 'Kroger')).toBeNull();
  });

  it('the legacy EDGAR-title label is still a label (historical observations stay readable)', () => {
    expect(observationSupportGap(`${TITLE}: "${FACT_TEXT.replace(/\.$/, '')}" [S:sig-f].`, [FACT], 'Kroger')).toBeNull();
  });

  it.each([
    ['a diagnosis with no quote (the reviewer’s fabrication)', 'Since the Giant Eagle merger, Kroger yards are overwhelmed and trailers sit for hours at every DC [S:sig-f].'],
    ['a claim dressed as a label', 'Kroger yards are overwhelmed: "On July 1, 2026, the Company announced it had entered into an agreement and plan of merger" [S:sig-f].'],
    ['a real quote followed by an added claim', `${citedQuote(TITLE, FACT_TEXT, 'sig-f', 'Kroger')} Trailers now sit for hours at every DC.`],
    ['a quote the fact does not contain', `From Kroger's 10-Q filed September 18: "Kroger announced that its yards are at capacity" [S:sig-f].`],
  ])('refused: %s', (_label, observation) => {
    expect(observationSupportGap(observation, [FACT], 'Kroger')).not.toBeNull();
  });

  it('a quote is supported only by a fact the observation CITES', () => {
    const obs = `From Kroger's 10-Q filed September 18: "Kroger will close three distribution centers in 2027" [S:sig-f].`;
    expect(observationSupportGap(obs, [FACT, OTHER], 'Kroger')).not.toBeNull();
    expect(observationSupportGap(obs.replace('[S:sig-f]', '[S:sig-o]'), [FACT, OTHER], 'Kroger')).not.toBeNull(); // label is sig-f's, quote is sig-o's: label must be a CITED fact's
    expect(observationSupportGap(`From Kroger's 8-K filed August 1: "Kroger will close three distribution centers in 2027" [S:sig-o].`, [FACT, OTHER], 'Kroger')).toBeNull();
  });
});

describe('sendableEvidence refuses an unsupported observation (approve, activate, send, enroll, runtime and routing all read it)', () => {
  it('fabricated diagnosis citing a real fact: INSUFFICIENT, with the reason', () => {
    const r = sendableEvidence('Since the Giant Eagle merger, Kroger yards are overwhelmed [S:sig-f].', [FACT], 'Kroger');
    expect(r.tier).toBe('INSUFFICIENT');
    expect(r.unsupported).toBeTruthy();
  });

  it('the propose-built observation stays VERIFIED_FACT', () => {
    const r = sendableEvidence(citedQuote(TITLE, FACT_TEXT, 'sig-f', 'Kroger'), [FACT], 'Kroger');
    expect(r).toMatchObject({ tier: 'VERIFIED_FACT', unsupported: null });
  });
});

describe('what GAP itself builds always passes (no false refusals)', () => {
  it('the hypothesis builder’s clipped, sentence-safe title is recognised as the label', () => {
    const longTitle = `Kroger Co. announces agreement to acquire Giant Eagle, Inc. in a transaction that expands the network. ${'Additional detail words '.repeat(12)}`;
    const signal = { ...FACT, title: longTitle };
    expect(observationTitle(longTitle).length).toBeLessThanOrEqual(160);
    expect(observationSupportGap(citedQuote(observationTitle(longTitle), FACT_TEXT, 'sig-f', 'Kroger'), [signal], 'Kroger')).toBeNull();
  });
});

/**
 * Closeout review (GAP method P2-2): substring matching let a quote drop a
 * negation or stitch fragments. A quote must be a WHOLE sentence of a fact it
 * cites (or the whole excerpt), which is exactly what citedQuote produces.
 */
describe('closeout review: a quote is a whole sentence of its fact, never a fragment', () => {
  const NEG: GateSignal & { title: string } = { ...FACT, id: 'n1', evidence_text: 'We do not plan to close the Memphis distribution center. We opened a cross-dock in Reno in August.', title: 'Acme 10-K (filed 2026-09-18)' };

  it.each([
    ['a truncation that drops the negation', '"close the Memphis distribution center" [S:n1].'],
    ['a mosaic of fragments', '"We do" [S:n1] "close the Memphis distribution center" [S:n1].'],
    ['a one-word quote', '"close" [S:n1].'],
  ])('refused: %s', (_label, observation) => {
    expect(observationSupportGap(observation, [NEG], 'Acme')).not.toBeNull();
  });

  it('one whole sentence of a multi-sentence fact is supported', () => {
    expect(observationSupportGap('"We opened a cross-dock in Reno in August" [S:n1].', [NEG], 'Acme')).toBeNull();
  });

  it('the whole excerpt, as citedQuote builds it (tokens after inner sentences), is supported', () => {
    expect(observationSupportGap(citedQuote(NEG.title, NEG.evidence_text!, 'n1', 'Acme'), [NEG], 'Acme')).toBeNull();
  });
});
