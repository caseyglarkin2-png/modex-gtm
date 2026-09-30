/**
 * Research-integrity final review (2026-09-30): sentences that were stored as VERIFIED facts in production and
 * are not physical-operations facts about the account. Each one is a production sentence, verbatim.
 */
import { describe, expect, it } from 'vitest';
import { isPhysicalOpsFact } from '@/lib/gap/research/facts';
import { failureClass, verificationContext, verifyCandidate } from '@/lib/gap/research/run';

describe('descriptions, risk factors and exhibits are not facts', () => {
  it.each([
    // XPO 10-K: a description of its technology
    'In our North American LTL business, the caliber of our technology is mission-critical to our success; it optimizes pricing, linehaul, pickup-and-delivery and dock operations.',
    // FedEx 10-K: a standing description of its contractor model, and an accounting note
    'Federal Express contracts with approximately 5,300 independent small businesses to conduct certain linehaul and pickup-and-delivery operations.',
    'Our business optimization costs relate to the following transformation initiatives aimed to improve long-term profitability, drive efficiency within and between our transportation networks.',
    'The separation comes at a pivotal time as the FedEx network transformation continues and the company deploys assets to maximize efficiency and drive profitability.',
    // RXO 10-K: a regulatory statement and a risk factor
    'In addition, motor carriers that move freight to and from ports are subject to various registration requirements.',
    'Port shutdowns and similar disruptions to major points in national or international transportation networks could result in terminal embargoes, disrupt equipment and freight flows.',
    // KDP filing: the acquired company's auditor exhibit (JDE Peet's, "the Group")
    'In addition, the Group announced the closure of three manufacturing plants as part of its footprint optimisation efforts.',
    'Emphasis of Matter As disclosed in Note 9.6 - Subsequent Events to the Financial Statements, the Company has entered into a definitive agreement under which Keurig Dr Pepper will acquire the Company.',
    // "operations" is a noun, not an action: a description of the network
    'Our linehaul network supports pickup-and-delivery operations across North America.',
    // a conditional on the transport path (a risk factor that names a fleet)
    'Our private fleet could expand into Mexico if cross-border demand returns.',
    // Home Depot 10-Q: a heading glued to a restated sentence
    'GMS Acquisition On June 29, 2025, we entered into a definitive agreement to acquire GMS, a leading distributor of specialty building products including drywall and ceilings.',
    // Campbell's: foreign page chrome glued between a headline and its body
    "Campbell's plans to close Hyannis Cape Cod potato chip plant Terug naar selectie Campbell to close Hyannis potato chip plant in Massachusetts as production shifts to other plants.",
  ])('refused: %s', (s) => expect(isPhysicalOpsFact(s)).toBe(false));

  it.each([
    // the same vocabulary in real facts still passes
    'Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas.',
    'Walmart operates a private fleet of more than 12,000 drivers and will open two new distribution centers in 2027.',
    'XPO opened a new 120-door LTL service center in Aurora, Illinois in August 2026.',
    'On June 29, 2026, Home Depot opened a new flatbed distribution center in Dallas.',
    'General Mills will close its Allentown, Pennsylvania plant and consolidate production into its other plants in 2027.',
  ])('kept: %s', (s) => expect(isPhysicalOpsFact(s)).toBe(true));
});

describe('a third party speaking is not the account\'s fact', () => {
  // passes the fact gate on its own (a transport deployment): only the attribution makes it Gatik's, not PepsiCo's
  const quote = '"Our trucks now move freight for PepsiCo across 250 retail locations, and that\'s what we\'re deploying across Texas," said Gautam Narang, CEO of Gatik.';
  const page = `Gatik news. ${quote} More text about PepsiCo.`;
  it('a vendor CEO quoted about the account is refused as wrong account', async () => {
    const r = await verifyCandidate({ provider: 'signal', url: 'https://gatik.ai/news/a', title: 'n', publishedAt: new Date('2026-09-01'), excerpt: quote, sourceType: 'public_secondary' }, verificationContext('PepsiCo', async () => page));
    expect(r).toMatchObject({ ok: false, reason: 'quoted_third_party' });
    expect(failureClass('quoted_third_party')).toBe('WRONG_ACCOUNT');
  });
  it('the account\'s own executive quoted is still its fact', async () => {
    const own = '"We are opening two new distribution centers in Texas in 2027," said Jane Doe, chief supply chain officer of PepsiCo.';
    const r = await verifyCandidate({ provider: 'signal', url: 'https://news.example/a', title: 'n', publishedAt: new Date('2026-09-01'), excerpt: own, sourceType: 'public_secondary' }, verificationContext('PepsiCo', async () => `x ${own} y`));
    expect(r.ok).toBe(true);
  });
});
