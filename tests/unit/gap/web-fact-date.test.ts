/**
 * Soak P1 (truth): a web-research fact is dated by its PAGE (article metadata, else a dateline), never by the search
 * model's claim. A page with no date of its own is not verified (no_publication_date). The date decides freshness and
 * outreach eligibility, so a model-claimed date would turn an old event into a fresh trigger.
 */
import { describe, expect, it } from 'vitest';
import { verifyCandidate, verificationContext } from '@/lib/gap/research/run';

const EXCERPT = 'Acme Foods opened a new 400,000-square-foot distribution center in Dallas, Texas.';
const web = (date: string | null) => ({ provider: 'web' as const, url: 'https://news.example/acme', title: 't', publishedAt: date ? new Date(date) : null, excerpt: EXCERPT, sourceType: 'public_secondary' as const });

describe('a web fact is dated by its page', () => {
  it("the page's article date wins over the model's claimed date", async () => {
    const ctx = verificationContext('Acme Foods', async () => ({ text: `Industry news. ${EXCERPT} More about the site.`, publishedAt: new Date('2023-03-03T00:00:00Z') }));
    const v = await verifyCandidate(web('2026-09-28'), ctx);
    expect(v).toMatchObject({ ok: true, publishedAt: new Date('2023-03-03T00:00:00Z') });
  });
  it('a dateline on the page dates it when there is no article metadata', async () => {
    const ctx = verificationContext('Acme Foods', async () => `March 3, 2023 Acme Foods announced its plans. ${EXCERPT} More about the site.`);
    const v = await verifyCandidate(web('2026-09-28'), ctx);
    expect(v.ok && v.publishedAt.toISOString().slice(0, 10)).toBe('2023-03-03');
  });
  it('a page with no date of its own is not verified, whatever the model claims', async () => {
    const ctx = verificationContext('Acme Foods', async () => `Industry news. ${EXCERPT} More about the site.`);
    expect(await verifyCandidate(web('2026-09-28'), ctx)).toEqual({ ok: false, reason: 'no_publication_date' });
  });
});
