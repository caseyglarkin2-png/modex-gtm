/**
 * Paid-key research: a search model restates what it read. A web proposal is re-anchored to the page's OWN
 * sentence (same facts, same numbers) and that verbatim sentence is what is stored; anything else is rejected.
 */
import { describe, expect, it } from 'vitest';
import { pageSentenceFor } from '@/lib/gap/research/facts';
import { verificationContext, verifyCandidate } from '@/lib/gap/research/run';

const PAGE = 'Kroger news. The Kroger Co. will open a new 400,000 square foot automated distribution center in Wyomissing, Pennsylvania in 2027, adding 250 jobs. Other text about stores and pharmacy services follows here.';
const PARA = 'Kroger plans to open a new automated distribution center in Wyomissing, Pennsylvania, in 2027 that will add 250 jobs.';
const cand = (over = {}) => ({ provider: 'web' as const, url: 'https://news.example/kroger', title: 'Kroger DC', publishedAt: new Date('2026-09-01T00:00:00Z'), excerpt: PARA, sourceType: 'public_secondary' as const, ...over });

describe('re-anchoring a paraphrase to the page sentence', () => {
  it('finds the page sentence carrying the same content words and every number', () => {
    expect(pageSentenceFor(PARA, PAGE)).toBe('The Kroger Co. will open a new 400,000 square foot automated distribution center in Wyomissing, Pennsylvania in 2027, adding 250 jobs.');
  });
  it('a different number is a different fact: rejected', () => {
    expect(pageSentenceFor(PARA.replace('250 jobs', '900 jobs'), PAGE)).toBeNull();
  });
  it('a proposal that SUMMARIZES several page sentences anchors to the one sentence it contains', () => {
    const page = 'Lineage celebrated the groundbreaking of its new automated cold storage facility in Hutchins, Texas, alongside city officials. The facility is expected to begin operating in late 2027. Other news follows.';
    const summary = 'Lineage broke ground on a new automated cold storage facility in Hutchins, Texas, located at Prime Pointe Park adjacent to the Union Pacific Dallas Intermodal Terminal, with operations expected in late 2027.';
    expect(pageSentenceFor(summary, page)).toBe('Lineage celebrated the groundbreaking of its new automated cold storage facility in Hutchins, Texas, alongside city officials.');
  });
  it('review P0: a competitor\'s sentence on a roundup page is never stored for the account', async () => {
    const page = 'Distribution roundup. Sysco opened a new distribution center in Houston, Texas, adding 250 jobs to the region in 2026. Walmart will close its Memphis distribution center in May.';
    expect(pageSentenceFor('US Foods opened a new distribution center in Houston, Texas, adding 250 jobs in 2026.', page)).toBeNull();
    expect(pageSentenceFor('Kroger will close its Memphis distribution center in May.', page)).toBeNull();
    const v = await verifyCandidate(cand({ excerpt: 'Kroger will close its Memphis distribution center in May.', url: 'https://news.example/roundup' }), verificationContext('Kroger', async () => `Kroger news roundup. ${page}`));
    expect(v.ok).toBe(false);
  });

  it('semantic flips are rejected: negation, open vs close, buy vs sell, planned vs done, another place', () => {
    const page = 'Acme will not open the planned distribution center in Reno, Nevada this year. Acme closed its distribution center in Fresno, California in March 2026. Acme sold its Tulare, California warehouse to a local buyer in 2026.';
    expect(pageSentenceFor('Acme will open a new distribution center in Reno, Nevada this year.', page)).toBeNull();
    expect(pageSentenceFor('Acme opened a new distribution center in Fresno, California in March 2026.', page)).toBeNull();
    expect(pageSentenceFor('Acme acquired a warehouse in Tulare, California from a local seller in 2026.', page)).toBeNull();
    expect(pageSentenceFor('Acme closed its distribution center in Stockton, California in March 2026.', page)).toBeNull();
  });
  it('verification stores the verbatim page sentence for a web proposal', async () => {
    const v = await verifyCandidate(cand(), verificationContext('Kroger', async () => PAGE));
    expect(v).toMatchObject({ ok: true, excerpt: expect.stringMatching(/^The Kroger Co\. will open a new 400,000 square foot/) });
  });
  it('a hand-typed or EDGAR fact stays strictly verbatim (no re-anchoring)', async () => {
    const v = await verifyCandidate(cand({ provider: 'manual' }), verificationContext('Kroger', async () => PAGE));
    expect(v).toMatchObject({ ok: false, reason: 'excerpt_not_found_at_source' });
  });
});
