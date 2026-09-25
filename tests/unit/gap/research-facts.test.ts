import { describe, expect, it } from 'vitest';
import { classifyFact, detectConflicts, excerptFoundIn, extractFactSentences, isPhysicalOpsFact, isSingleSentence } from '@/lib/gap/research/facts';

const KR_10K = 'We have closed certain customer fulfillment centers because they have not been meeting operational and financial expectations.';

describe('research fact rules', () => {
  it('accepts a physical-operations change (Kroger 10-K) and classifies it as a closure', () => {
    expect(isPhysicalOpsFact(KR_10K)).toBe(true);
    expect(classifyFact(KR_10K)).toEqual({ type: 'site_expansion', change: 'closure' });
  });

  it('rejects generic capex and generic supply chain language (the Joey problem)', () => {
    expect(isPhysicalOpsFact('Capital investments totaled $1.5 billion for the first quarter of 2026.')).toBe(false);
    expect(isPhysicalOpsFact('Disruption in our global supply chain could negatively affect our business.')).toBe(false);
    expect(isPhysicalOpsFact('Delivery solutions include orders delivered to customers from retail store locations, customer fulfillment centers and orders placed through third-party platforms.')).toBe(false);
  });

  it('rejects financial-statement sentences that only mention a facility change in passing (live Kroger 10-Q shapes)', () => {
    for (const s of [
      'Excluding the effect of fulfillment center exits in markets where Kroger does not operate stores, the sale of Vitacost.com and the discontinuation of Ship Marketplace, eCommerce sales increased 20% in the second quarter.',
      'This decrease was primarily due to the fulfillment network closures in the fourth quarter of 2025.',
      'Excluding fuel, the sale of Vitacost and the exit of certain fulfillment centers, sales increased 0.1% compared to the same period last year.',
    ]) expect(isPhysicalOpsFact(s)).toBe(false);
    expect(isPhysicalOpsFact('The grocer plans to close three of its automated fulfillment centers in January, lean further into in-store fulfillment and expand ties with its third-party e-commerce partners.')).toBe(true);
  });

  it('classifies openings and automation', () => {
    expect(classifyFact('The company opened a new 1.2 million square foot distribution center in Ohio in May.').change).toBe('opening');
    expect(classifyFact('We are automating our Denver warehouse with robotic picking.').type).toBe('automation_program');
  });

  it('extracts, deduplicates and bounds fact sentences from a document', () => {
    const doc = `Intro text that is long enough but says nothing about facilities at all here. ${KR_10K} ${KR_10K} Capital investments totaled $1.5 billion for the quarter and more words.`;
    expect(extractFactSentences(doc)).toEqual([KR_10K]);
  });

  it('NEVER accepts an excerpt that is not at its own source (anti-fabrication)', () => {
    const page = `<html><body><p>We have closed certain customer fulfillment centers because they have not been meeting operational and financial expectations.</p></body></html>`;
    expect(excerptFoundIn(KR_10K, page.replace(/<[^>]+>/g, ' '))).toBe(true);
    expect(excerptFoundIn('Kroger is opening a new automated yard at its Monroe distribution center next year.', page)).toBe(false);
    expect(excerptFoundIn('closed', page)).toBe(false);
  });

  it('matches through curly quotes and whitespace', () => {
    expect(excerptFoundIn("Kroger's network changed as the company closed two fulfillment centers.", 'Kroger’s  network changed as the company\nclosed two fulfillment centers.')).toBe(true);
  });

  it('single-sentence check keeps observation citations valid', () => {
    expect(isSingleSentence(KR_10K)).toBe(true);
    expect(isSingleSentence('We closed a DC. We opened another one in Texas last year.')).toBe(false);
  });

  it('conflict = the same named site both opening and closing; different sites are not a conflict', () => {
    expect(detectConflicts([
      { id: 'a', excerpt: 'The Monroe distribution center opened in March.', change: 'opening' },
      { id: 'b', excerpt: 'We closed the Monroe distribution center in August.', change: 'closure' },
    ])).toEqual([{ site: 'Monroe', ids: ['a', 'b'] }]);
    expect(detectConflicts([
      { id: 'a', excerpt: 'The Monroe distribution center opened in March.', change: 'opening' },
      { id: 'b', excerpt: KR_10K, change: 'closure' },
    ])).toEqual([]);
  });
});

describe('acquisition facts and abbreviation-aware quoting (live Kroger 8-K, 2026-07-01)', async () => {
  const { isAcquisitionFact, splitSentencesAware } = await import('@/lib/gap/research/facts');
  const { citedQuote } = await import('@/lib/gap/research/propose');
  const { validateObservation } = await import('@/lib/gap/hypothesis/observation');
  const GE = 'On June 30, 2026, The Kroger Co. (the “Company”) announced that it has entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”) for a purchase price of approximately $1.65 billion, subject to customary purchase price adjustments.';

  it('does not split after Co. / Inc., and accepts a definitive acquisition as a network fact', () => {
    expect(splitSentencesAware(`${GE} Giant Eagle operates stores in Ohio.`)).toEqual([GE, 'Giant Eagle operates stores in Ohio.']);
    expect(isAcquisitionFact(GE)).toBe(true);
    expect(isPhysicalOpsFact(GE)).toBe(true);
    expect(classifyFact(GE)).toEqual({ type: 'acquisition', change: 'acquisition' });
    expect(isPhysicalOpsFact('The company may pursue acquisitions from time to time as opportunities arise in the market.')).toBe(false);
  });

  it('the cited quote keeps every word and passes the real observation validator as cited sentences', () => {
    const obs = citedQuote('KROGER CO 8-K (filed 2026-07-01)', GE, 'sig1');
    expect(obs.replace(/\[S:sig1\]/g, '')).toContain(GE.replace(/\.$/, '').replace('Co. (', 'Co. (').slice(0, 60));
    expect(validateObservation(obs, ['sig1'])).toMatchObject({ ok: true });
  });
});
