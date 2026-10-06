/**
 * R22 / R23: the verifier admits a job, procurement, technology, partnership or leadership sentence as a VERIFIED
 * CLAIM of its own type (verbatim at its source, dated, naming the account), while the first-touch outreach gate
 * still refuses everything but a physical-network change; a finance line and an unclassified sentence are not
 * minted at all. Verified, relevant and usable-for-this-purpose stay three different things.
 */
import { describe, expect, it } from 'vitest';
import { verificationContext, verifyCandidate } from '@/lib/gap/research/run';
import { outreachFactRefusal, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { classifyClaim } from '@/lib/gap/research/claim-types';

const AT = new Date('2026-09-20T00:00:00Z');
const page = (text: string) => async () => ({ text, publishedAt: AT });
const cand = (excerpt: string, url = 'https://jobs.pepsico.com/yard-ops-dallas') => ({ provider: 'signal' as const, url, title: 'PepsiCo Careers', publishedAt: AT, excerpt, sourceType: 'public_secondary' as const });
const gateSignal = (text: string) => ({ id: 'x', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_text: text, evidence_url: 'https://jobs.pepsico.com/yard-ops-dallas', observed_at: AT, external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'PepsiCo Careers' });

describe('claim admission at the verifier', () => {
  it('a yard-duty job posting on the employer page is verified as a JOB CLAIM; the outreach gate still refuses it as a first-touch fact', async () => {
    const text = 'PepsiCo is now hiring a Yard Operations Manager in Dallas who will be responsible for trailer spotting, gate check-in and dock scheduling.';
    const v = await verifyCandidate(cand(text), verificationContext('PepsiCo', page(`PepsiCo Careers. ${text} Apply today.`)));
    expect(v.ok, JSON.stringify(v)).toBe(true);
    expect(classifyClaim(text)).toMatchObject({ type: 'job_posting', attributes: { postingStatus: 'open' } });
    expect(outreachFactRefusal(gateSignal(text), 'PepsiCo')).toBe('not_a_physical_network_change');
  });
  it('a procurement notice, a technology deployment and a leadership appointment are verified as their own claim types', async () => {
    for (const text of [
      'PepsiCo issued a request for proposals for a yard management system at its Tulsa production facility; proposals are due November 14, 2026.',
      'PepsiCo implemented a new transportation management system from Blue Yonder across its North America fleet.',
      'PepsiCo named Jane Doe as Senior Vice President of Supply Chain.',
    ]) {
      const v = await verifyCandidate(cand(text, 'https://www.pepsico.com/news/x'), verificationContext('PepsiCo', page(`PepsiCo newsroom. ${text} More follows.`)));
      expect(v.ok, `${text}: ${JSON.stringify(v)}`).toBe(true);
      expect(['procurement', 'technology', 'leadership']).toContain(classifyClaim(text).type);
    }
  });
  it('a finance line and an unclassified sentence are not minted, as before', async () => {
    for (const text of ['PepsiCo reported organic revenue growth of 2.1% and raised its full-year guidance.', 'PepsiCo published its annual sustainability report.']) {
      const v = await verifyCandidate(cand(text, 'https://www.pepsico.com/news/y'), verificationContext('PepsiCo', page(`PepsiCo newsroom. ${text}`)));
      expect(v).toEqual({ ok: false, reason: 'not_a_physical_operations_fact' });
    }
  });
  it("a vendor's sentence about the account stays the vendor's: refused by the speaker rule, whatever its claim type", async () => {
    const text = 'PepsiCo is now hiring a Yard Operations Manager, said the CEO of HireCo.';
    const v = await verifyCandidate(cand(text, 'https://hireco.example/news'), verificationContext('PepsiCo', page(`HireCo news. ${text}`)));
    expect(v.ok).toBe(false);
  });
});
