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

/**
 * Red team T6: the three PepsiCo 10-Q (2026-07-09) sentences GAP verified,
 * attached as evidence and let approve a thesis. Each is a real, verbatim
 * sentence; none is a fact about a physical-network change. Pinned verbatim.
 */
const PEP_RESTRUCTURING =
  'These pre-tax charges are expected to consist of approximately 50 % of severance and other employee-related costs, 15 % for asset impairments (all non-cash) resulting from plant closures and related actions, and 35 % for other costs associated with the implementation of our initiatives.';
const PEP_RISK_FACTOR =
  'These new or increased legal or regulatory requirements, along with initiatives to meet our sustainability goals, could result in significant increased costs and additional investments in facilities and equipment.';
const PEP_LIQUIDITY =
  'Our Liquidity and Capital Resources We believe that our cash generating capability and financial condition, together with our revolving credit facilities, working capital lines and other available methods of debt financing, such as commercial paper borrowings and long-term debt financing, will be adequate to meet our operating, investing and financing needs, including with respect to our net capital spending plans.';

describe('T6: false-positive contexts are not physical-network facts', () => {
  it.each([
    ['restructuring-charge breakdown', PEP_RESTRUCTURING],
    ['risk-factor boilerplate', PEP_RISK_FACTOR],
    ['liquidity / credit facility', PEP_LIQUIDITY],
  ])('PepsiCo %s does not qualify', (_label, sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(false);
  });

  it.each([
    'Our revolving credit facility provides for borrowings of up to $5 billion.',
    'We may be unable to open new distribution centers on schedule, which could adversely affect our results.',
    'Capital expenditures for the quarter were $1.2 billion, primarily for facilities and technology.',
    'Risks related to our facilities include natural disasters and labor disruptions.',
  ])('generic boilerplate does not qualify: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(false);
  });

  it('a real, dated network change still qualifies (Kroger / Giant Eagle; a DC opening)', () => {
    expect(isPhysicalOpsFact('On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”).')).toBe(true);
    expect(isPhysicalOpsFact('In August 2026 the company opened a 1.1 million square foot distribution center in Ohio.')).toBe(true);
  });
});

/**
 * Release C review (methodology): the filter must key on a SPECIFIC,
 * NON-HYPOTHETICAL change to a named kind of site. Pinned with the reviewer's
 * sentences.
 */
describe('Release C review: specific site changes pass; hypotheticals and non-physical changes do not', () => {
  it.each([
    'We may close additional manufacturing plants in the future if demand declines.',
    'We continue to invest in our digital network and loyalty programs to drive engagement.',
    'The Company launched a new retail media network for its suppliers.',
    'The Company completed its acquisition of an e-commerce analytics software company.',
    'The Company consolidated its gate security vendor contracts.',
    'We might build additional warehouses as volume grows.',
  ])('not a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(false);
  });

  it.each([
    'The Company plans capital investments of $1.2 billion to build a new automated distribution center in Georgia.',
    'We will close the Memphis distribution center in March and expect severance of $4 million.',
    'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”).',
    'In August 2026 the company opened a 1.1 million square foot distribution center in Ohio.',
  ])('a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(true);
  });
});

/**
 * Final red-team regression (GAP method P1-1): verbatim production signals the
 * live gate rated FACT although they state no change to the network. Pinned
 * with the exact production sentences (PepsiCo 8-K 2026-05-22 indenture
 * definition; General Mills transaction-cost lines) plus the reviewer's probes.
 */
describe('final regression: filing boilerplate is not a fact', () => {
  it.each([
    '“ Principal Property ” means any single manufacturing or processing plant, office building, warehouse or portion thereof owned or leased by the Company or a Restricted Subsidiary other than a plant, office building, warehouse or portion thereof which, in the reasonable opinion of the Company’s Board',
    '“Principal property” means any single manufacturing or processing plant, office building or warehouse owned or leased by us or any of our restricted subsidiaries other than a plant, warehouse, office building or portion thereof which, in the opinion of our Board of Directors, is not of material importance',
    'In fiscal 2026 , we also recorded $31 million of transaction costs, primarily related to the Divestitures and the definitive agreement to sell our Brazil business , compared to $49 million of transaction costs related to the Divestitures and the Acquisition last year.',
    'Transaction costs Fiscal 2027 transaction costs primarily related to the definitive agreement to sell our Brazil business.',
    'We also recorded $ 14.8 million of transaction costs, primarily related to the definitive agreement to sell our Brazil business.',
    'We continue to invest in our supply chain network to support long-term growth.',
    'We launched a new marketing campaign across our retail network.',
    'The office building next to the warehouse was repainted.',
    '“Facility Closure” means the permanent closing of any distribution center or plant owned by the Company.',
  ])('not a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(false);
  });

  it.each([
    'General Mills is closing three manufacturing plants in Missouri as the cereal and snacks company aims to make its supply chain more competitive.',
    'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury, as part of a plan to cut $3 billion in costs by fiscal 2030.',
    'On Dec. 11, the office of Kentucky Governor Andy Beshear announced that the grocery giant plans to open a new $391 million distribution center in Simpson County.',
    'Kroger has identified opportunities to optimize its fulfillment network by closing facilities in Pleasant Prairie, Wisconsin; Frederick, Maryland; and Groveland, Florida, while monitoring performance at the remaining facilities.',
    'The company launched a new automated distribution center in Texas.',
    'The company is building a new warehouse in Reno.',
  ])('still a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(true);
  });
});

/**
 * Closeout review (GAP method P2-1): a negation or a habitual/boilerplate
 * statement states no change to the network, even when it names a site and a
 * change verb.
 */
describe('closeout review: negations and habitual boilerplate are not facts', () => {
  it.each([
    'We do not plan to close the Memphis distribution center.',
    'The Company will not open a new distribution center in 2027.',
    'We have no plans to relocate the Reno fulfillment center.',
    'We never automated the Columbus warehouse.',
    'From time to time, we open, close or consolidate facilities in the ordinary course of business.',
    'We continue to invest in automation across our distribution network.',
    'We periodically evaluate whether to close or consolidate distribution centers.',
    'We regularly open new distribution centers as our business grows.',
  ])('not a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(false);
  });

  it.each([
    'Kroger will close the Memphis distribution center in March.',
    'The company opened a new automated distribution center in Texas in August 2026.',
    'Kroger has identified opportunities to optimize its fulfillment network by closing facilities in Pleasant Prairie, Wisconsin; Frederick, Maryland; and Groveland, Florida, while monitoring performance at the remaining facilities.',
  ])('still a fact: %s', (sentence) => {
    expect(isPhysicalOpsFact(sentence)).toBe(true);
  });
});
