/**
 * Final stabilization: who made a claim. A department in the speaker's job title is never an organization; the gate
 * stays as strict for a real third party (a vendor's CEO), and an account's own executive is the account speaking.
 */
import { describe, expect, it, vi } from 'vitest';
import { liveFactFailure, speakerOrg } from '@/lib/gap/research/claim-rules';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';

describe('speakerOrg', () => {
  it("a department in the title is skipped: PepsiCo's SVP of Supply Chain speaks for PepsiCo", () => {
    expect(speakerOrg('"Serving our vast network of customers requires a supply chain that is safe," said Jim Farrell, Senior Vice President of Supply Chain at PepsiCo.')).toBe('PepsiCo');
    expect(speakerOrg('"We moved 40 trailers," said Ana Ruiz, VP of Global Logistics Operations at Kroger.')).toBe('Kroger');
  });
  it('a real third party is still the speaker (the gate never loosens)', () => {
    expect(speakerOrg('"That is what we are doing with PepsiCo," said Gautam Narang, CEO and co-founder of Gatik.')).toBe('Gatik');
    expect(speakerOrg('"We deploy across Texas," said the head of Operations at Gatik, a PepsiCo partner.')).toBe('Gatik');
    const vendor = '"Our trucks now move freight for PepsiCo across 250 retail locations in Texas," said Gautam Narang, CEO of Gatik.';
    expect(liveFactFailure(vendor, 'PepsiCo')).toBe('quoted_third_party');
  });
  it('no quotation, no speaker', () => {
    expect(speakerOrg('PepsiCo will open a distribution center in Texas.')).toBeNull();
  });
});

describe('Verified at source counts every checked claim', () => {
  it('a vendor quote checked at its page (never stored as outreach evidence) is a verified claim', async () => {
    const quote = '"Driverless trucks deployed in commercial capacity, that is what we are doing with PepsiCo," said Gautam Narang, CEO of Gatik.';
    const prisma = {
      researchRun: { findMany: vi.fn(async () => [{ id: 'r1', created_at: new Date('2026-09-30'), provider_status: { result: { sources: [{ url: 'https://gatik.ai/n', title: 'Gatik', publishedAt: '2026-09-01T00:00:00.000Z', excerpt: quote, excerptKind: 'verbatim', provider: 'signal', status: 'not_verified', reason: 'quoted_third_party' }] } } }]) },
      gapSignal: { findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []) },
    };
    const s = await loadAccountSources(prisma as never, 'PepsiCo', { now: new Date('2026-10-01T12:00:00Z') });
    expect(s).toMatchObject({ claimsVerified: 1, outreachEligible: 0 });
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', attribution: 'Gatik' });
  });
});

describe('final review P0: every press attribution form', () => {
  const FW = 'https://www.freightwaves.com/news/x';
  it('"according to Gatik" and "Gatik CEO X said" are Gatik\'s claims, never PepsiCo\'s outreach evidence', () => {
    expect(liveFactFailure('PepsiCo is opening a new distribution center in Dallas served by autonomous trucks, according to Gatik.', 'PepsiCo', FW)).toBe('quoted_third_party');
    expect(liveFactFailure('Gatik CEO Gautam Narang said PepsiCo will deploy autonomous trucks across its Texas distribution centers.', 'PepsiCo', FW)).toBe('quoted_third_party');
  });
  it("the account's own executive, the page's own publisher and a lowercase document stay the account's or the page's", () => {
    expect(liveFactFailure('PepsiCo will deploy autonomous trucks across its Texas distribution centers, PepsiCo CEO Ramon Laguarta said.', 'PepsiCo', FW)).toBeNull();
    expect(liveFactFailure('PepsiCo is opening a new distribution center in Dallas, according to FreightWaves.', 'PepsiCo', FW)).toBeNull();
    expect(liveFactFailure('PepsiCo is ceasing manufacturing and warehouse operations at a bottling plant in Maryland, which will result in 143 layoffs, according to a WARN notice and statement from the beverage giant.', 'PepsiCo', 'https://www.fooddive.com/news/x')).toBeNull();
  });
  it('an aggregator or mirror page is never outreach evidence (the rule every new fact must pass)', () => {
    expect(liveFactFailure('Kroger plans to close three older distribution facilities in the region and consolidate them.', 'Kroger', 'https://www.panabee.com/company/KR')).toBe('source_too_weak');
  });
});
