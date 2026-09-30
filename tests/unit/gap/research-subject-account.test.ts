/** Re-review P0s: a stored fact is ABOUT the account, not a rival's, supplier's or roundup neighbour's. */
import { describe, expect, it } from 'vitest';
import { accountIsSubject, verificationContext, verifyCandidate } from '@/lib/gap/research/run';
import { extractFactSentences, isPhysicalOpsFact } from '@/lib/gap/research/facts';

describe('the account is the subject', () => {
  it.each([
    'Kroger will open a new automated distribution center in Wyomissing, Pennsylvania in 2027.',
    'The Kroger Co. will close two warehouses in Ohio.',
    'On September 10, 2026, Kroger opened a new distribution center in Denver.',
    "Kroger's new Denver distribution center opened in August 2026.",
  ])('about Kroger: %s', (s) => expect(accountIsSubject(s, 'kroger')).toBe(true));
  it.each([
    'Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas.',
  ])('a partner operating FOR the account: %s', (s) => expect(accountIsSubject(s, 'pepsico')).toBe(true));
  it.each([
    'Walmart, a Kroger rival, opened a new 300,000-square-foot distribution center in Texas.',
    'Kroger supplier Acme Foods opened a new manufacturing plant in Ohio.',
    'Unlike Kroger, Albertsons announced it will close two warehouses.',
    'Albertsons, which competes with Kroger, is closing two warehouses.',
    'Albertsons opened a new 400,000-square-foot distribution center in Denver in August 2026.',
  ])('not about Kroger: %s', (s) => expect(accountIsSubject(s, 'kroger')).toBe(false));
});

describe('a verbatim roundup sentence about a competitor is never stored', () => {
  it('web and cited-page proposals', async () => {
    const page = 'Kroger news roundup. Albertsons opened a new 400,000-square-foot distribution center in Denver in August 2026. Walmart, a Kroger rival, opened a new distribution center in Texas in 2026.';
    const ctx = verificationContext('Kroger', async () => page);
    for (const [provider, excerpt] of [['web', 'Albertsons opened a new 400,000-square-foot distribution center in Denver in August 2026.'], ['signal', 'Walmart, a Kroger rival, opened a new distribution center in Texas in 2026.']] as const) {
      const v = await verifyCandidate({ provider, url: 'https://news.example/r', title: 'r', publishedAt: new Date('2026-09-01'), excerpt, sourceType: 'public_secondary' }, ctx);
      expect(v).toMatchObject({ ok: false, reason: 'sentence_does_not_name_account' });
    }
  });
});

describe('dateline strip and conditionals', () => {
  it('a clause before a wire tag is never stripped away', () => {
    const out = extractFactSentences('Walmart denied a report on Tuesday that said, (BUSINESS WIRE) -- Walmart will close its Bentonville distribution center in August 2026 and lay off 400. Other text.');
    expect(out.every((s) => !s.startsWith('Walmart will close'))).toBe(true);
  });
  it('a conditional plan is not a fact', () => {
    expect(isPhysicalOpsFact('Kroger said it would build a new distribution center in Ohio in 2026 if approved.')).toBe(false);
  });
});

describe('the account\'s own site speaks as "we"', () => {
  it('a "We ..." sentence on the account\'s own domain is its fact; on another domain it is not', async () => {
    const excerpt = 'We will open a new distribution center in Memphis, Tennessee in 2027 to add capacity for the region.';
    const page = `FedEx newsroom. ${excerpt} Other text.`;
    const ok = await verifyCandidate({ provider: 'signal', url: 'https://newsroom.fedex.com/newsroom/a', title: 'n', publishedAt: new Date('2026-09-01'), excerpt, sourceType: 'public_primary' }, verificationContext('FedEx', async () => page));
    expect(ok.ok).toBe(true);
    const other = await verifyCandidate({ provider: 'signal', url: 'https://news.example/a', title: 'n', publishedAt: new Date('2026-09-01'), excerpt, sourceType: 'public_secondary' }, verificationContext('FedEx', async () => page));
    expect(other).toMatchObject({ ok: false, reason: 'sentence_does_not_name_account' });
  });
});
