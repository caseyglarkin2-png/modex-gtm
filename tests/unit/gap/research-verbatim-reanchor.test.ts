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
  it('verification stores the verbatim page sentence for a web proposal', async () => {
    const v = await verifyCandidate(cand(), verificationContext('Kroger', async () => PAGE));
    expect(v).toMatchObject({ ok: true, excerpt: expect.stringMatching(/^The Kroger Co\. will open a new 400,000 square foot/) });
  });
  it('a hand-typed or EDGAR fact stays strictly verbatim (no re-anchoring)', async () => {
    const v = await verifyCandidate(cand({ provider: 'manual' }), verificationContext('Kroger', async () => PAGE));
    expect(v).toMatchObject({ ok: false, reason: 'excerpt_not_found_at_source' });
  });
});
