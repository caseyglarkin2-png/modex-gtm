/** Review P1-A: seller relevance is now an opener gate, so a US fact must never read as a sale abroad. */
import { describe, expect, it } from 'vitest';
import { sellerRelevance } from '@/lib/gap/research/continuity';

describe('sale abroad / divestiture never opens; US facts are not caught', () => {
  it.each([
    'We entered into a definitive agreement to sell our business in Brazil to a local buyer.',
    'The company sold its European snacks division and two plants.',
    'Acme will divest its canned vegetables business, including three plants.',
  ])('context: %s', (q) => expect(sellerRelevance(q).rank).toBeGreaterThanOrEqual(7));
  it.each([
    'Opened a 600,000 square foot distribution center in Santa Teresa, New Mexico.',
    'Its new Laredo, Texas distribution center serves customers in Mexico and the U.S.',
    'The company sells its products through 40 distribution centers across the country.',
    'Products sold in 2,000 stores ship from its new automated warehouse in Ohio.',
    'Kimberly-Clark will expand the disposable diaper plant in Beech Island with a new warehouse.',
    'Selling, general and administrative expenses rose as the company opened two distribution centers.',
  ])('US fact: %s', (q) => expect(sellerRelevance(q).rank).toBeLessThan(7));
});
