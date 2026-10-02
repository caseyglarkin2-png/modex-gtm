/**
 * Signal Intelligence quality review (2026-09-28): sentences production research
 * verified verbatim. Boilerplate, past events and page-menu run-ons are not
 * physical-network facts; the real network changes still are.
 */
import { describe, expect, it } from 'vitest';
import { describesPastEvent, isPhysicalOpsFact, isRunOnOrNavigation } from '@/lib/gap/research/facts';
import { verificationContext, verifyCandidate } from '@/lib/gap/research/run';

const NOT_FACTS: Array<[string, string]> = [
  ['Caterpillar segment methodology', 'The following is a list of the more significant methodology differences: For Power & Energy, Construction Industries, Resource Industries, and our All Other Segment net assets generally include inventories, receivables, property, plant and equipment, goodwill.'],
  ['Newell credit facility', 'Notwithstanding anything herein to the contrary, with respect to the Commitment of any Lender that has not agreed to extend its Existing Maturity Date, the Maturity Date and the terms of the Facility in effect as of the Closing Date shall remain unchanged.'],
  ['GXO leverage covenant', 'In addition, the facilities require the Company to maintain a consolidated leverage ratio below a specified maximum.'],
  ['Primo reclassification', 'Certain prior period amounts have been reclassified to conform with the 2026 presentation.'],
  ['Sysco filing header', 'Sysco Corporation Sysco Holdings Corporation Item 1.01 Entry into a Material Definitive Agreement.'],
  ['PFG cost line', '(2) Includes professional fees and other costs related to in-progress, completed, and abandoned acquisitions, costs of integrating certain of our facilities, and facility closing costs.'],
  ['GM supplier inventory', 'Under the Program, the Suppliers that receive such funds will acquire and hold the inventory until it is needed by the Company to produce vehicles.'],
  ['Kraft Heinz synthetic lease', 'In June 2023, we entered into a non-cancellable synthetic lease for a distribution facility, for which we are the construction agent.'],
  ['Boston Beer supplier selection', 'The Company selects third-party production facilities with one or more of: (i) sleek can packaging and automated variety packaging capability and capacity.'],
  ['Caterpillar description', 'Caterpillar’s parts distribution centers are involved in the storage and distribution of parts for Construction Industries, Resource Industries and Power & Energy.'],
  ['PFG description', 'Specialty is a leading national distributor of candy, snacks, and beverages operating a network of 26 Specialty distribution centers.'],
  ['PepsiCo executive quote', '“Serving our vast network of customers requires a supply chain that is safe, reliable and built for the future,” said Jim Farrell, senior vice president of supply chain at PepsiCo.'],
  ['Coca-Cola tax credits', 'During the six months ended July 3, 2026, the Company invested $ 75 million in limited partnerships that receive tax credits and other tax benefits by constructing, owning and operating alternative energy facilities.'],
  ['Mondelez cash payment', 'As a result of that definitive agreement, we became entitled to a cash payment of 145 million from JAB Holding Company that we received in 2025.'],
  ['Lineage services', 'As part of our warehouse services, we offer receipt, handling, case-picking, retrieval of products from storage, building customized pallets and repackaging, order assembly and load consolidation.'],
  ['Tyson pretax charges', 'The estimated pretax charges decreased $ 23 million in the third quarter of fiscal 2026, due to an estimated gain on the sale of assets expected to close in the fourth quarter related to network changes.'],
  ['Constellation interest capitalization', 'We cease the capitalization of interest when construction activities are substantially completed and the facility and related assets are available for their intended use.'],
  ['Lineage same-warehouse definition', 'Acquired properties will be included in the same warehouse population if owned or leased by us as of the first business day of the prior calendar year.'],
  ['PFG notes proceeds', 'However, since there was no requirement to hold the funds in escrow until the Cheney Brothers Acquisition closed, the net proceeds for the Notes due 2032 were initially used to repay borrowings.'],
  // continuity dogfood 2026-09-28: the newsroom breadcrumb run into the page headline
  ['PepsiCo newsroom breadcrumb', 'Learn more News & Media Innovation & Tech PepsiCo and Gatik announce multi-year agreement to deploy autonomous freight in North America This deployment will bring autonomous trucks into one of the world’s largest food and beverage supply chains.'],
  ['a page control run into a sentence', 'Read more PepsiCo will open a new distribution center in Dallas next year.'],
  ['an ampersand menu run mid-text', 'Home News & Media Innovation & Tech PepsiCo will open a new distribution center in Dallas next year.'],
  // evidence integrity review 2026-09-28: accounting policy and a software rollout are not physical-network facts
  ['KDP depreciation policy', 'Property, plant and equipment is depreciated on a straight-line basis over the estimated useful lives of the assets, except land and assets under construction which are not depreciated.'],
  ['UNFI software platform rollout', 'The company also completed the rollout of an AI-powered supply chain and procurement planning platform across its distribution network and expanded Lean Daily Management practices to 44 distribution centers.'],
  ['depreciation language alone', 'The new distribution center in Ohio will be depreciated over forty years once construction is complete.'],
  ['a planning platform alone', 'Kroger will expand its procurement planning platform to every distribution center in Ohio this year.'],
  ['PepsiCo page menu', 'Regulation Technology Labor Operations Equipment M&A An article from Dive Brief PepsiCo expanding autonomous truck use in its supply chain The multiyear deal with Gatik will help the food and beverage giant increase capacity.'],
];

const FACTS: Array<[string, string]> = [
  ['General Mills network redesign', 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury, as part of a plan to cut $3 billion in costs by fiscal 2030.'],
  ['Georgia-Pacific warehouse', 'Construction of the new 400,000-square-foot warehouse building, which is expected to take about a year, is the second phase of a larger project already underway at the mill.'],
  ['H-E-B refrigerated facility', 'H-E-B plans to build a $175 new refrigerated facility at its campus at 711 South Foster Road in San Antonio.'],
  ['Frito-Lay plant closure', 'PepsiCo plans to shutter a Frito-Lay distribution plant in California, the latest closure for the snacking giant as it aims to bring production in line with lagging demand.'],
  ['KDP facility sale', "In a related transaction, Chobani will acquire KDP's manufacturing facility and warehouse in Allentown, Pennsylvania for approximately $125 million."],
];

describe('verified-verbatim is not the same as a physical-network fact', () => {
  for (const [name, sentence] of NOT_FACTS) {
    it(`refuses: ${name}`, () => expect(isPhysicalOpsFact(sentence)).toBe(false));
  }
  for (const [name, sentence] of FACTS) {
    it(`keeps: ${name}`, () => expect(isPhysicalOpsFact(sentence)).toBe(true));
  }

  it('a page menu run-on is not one statement', () => {
    expect(isRunOnOrNavigation(NOT_FACTS[NOT_FACTS.length - 1][1])).toBe(true);
    expect(isRunOnOrNavigation(FACTS[0][1])).toBe(false);
  });
});

describe('a past-year event restated in a newer source is not current', () => {
  it('Campbell 2024 acquisition in a 2026 filing; Bosch 2025 deal on a 2026 page', () => {
    expect(describesPastEvent('On March 12, 2024, we completed the acquisition of Sovos Brands, Inc. for $2.899 billion.', new Date('2026-09-24'))).toBe(true);
    expect(describesPastEvent('In August 2025, Bosch completed its acquisition of the HVAC business of Johnson Controls.', new Date('2026-06-11'))).toBe(true);
  });

  it('this year, a sentence with no year, and a January source about last December are current', () => {
    expect(describesPastEvent('On July 1, 2026, the Company announced it will acquire Giant Eagle.', new Date('2026-09-18'))).toBe(false);
    expect(describesPastEvent('General Mills will redesign the plant and warehouse network.', new Date('2026-07-02'))).toBe(false);
    expect(describesPastEvent('In December 2025 the company closed its Ohio plant.', new Date('2026-01-20'))).toBe(false);
  });
});

describe('the verification contract refuses a past event restated in a newer source', () => {
  it('Campbell 2024 plant sentence in a 2026 source: describes_past_event', async () => {
    const excerpt = "In 2024, Campbell's closed its Sacramento plant and opened a new distribution center in Ohio.";
    const ctx = verificationContext("Campbell's", async () => ({ text: `News. ${excerpt} More.`, publishedAt: new Date('2026-09-24') }));
    expect(await verifyCandidate({ provider: 'web', url: 'https://x.com/a', title: 't', publishedAt: new Date('2026-09-24'), excerpt, sourceType: 'public_secondary' }, ctx)).toEqual({ ok: false, reason: 'describes_past_event' });
  });
});

