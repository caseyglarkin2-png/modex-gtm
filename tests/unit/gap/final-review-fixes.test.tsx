/**
 * Final review fixes: a contradiction is never swallowed by an eligible card; the redirect resolver never takes a
 * mirror as the publisher; the Note button is never under the global Compose button.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/gap', useSearchParams: () => new URLSearchParams(''), useRouter: () => ({ refresh: vi.fn() }) }));
import { loadAccountSources } from '@/lib/gap/sources/account-sources';
import { resolveRedirectFact } from '@/lib/gap/research/resolve-redirect';
import { FeedbackButton } from '@/components/gap/feedback-button';

const NOW = new Date('2026-10-01T12:00:00Z');
const OPEN = 'Kroger will open its Dallas distribution center in March 2027 to serve Texas stores.';
const CLOSE = 'Kroger is closing the Dallas distribution center and moving volume to Houston.';
const fact = (id: string, url: string, text: string) => ({ id, title: 't', evidence_text: text, evidence_url: url, observed_at: new Date('2026-09-20'), freshness_expires_at: new Date('2027-03-01'), updated_at: NOW, metadata: { verified: 'excerpt_found_at_source' } });

function prisma(facts: unknown[], signals: unknown[] = []) {
  return {
    researchRun: { findMany: vi.fn(async () => []) },
    gapSignal: { findMany: vi.fn(async () => signals) },
    prospectingSignal: { findMany: vi.fn(async () => facts) },
    gapAuditEvent: { findMany: vi.fn(async () => []) },
  };
}

describe('a contradiction is never swallowed', () => {
  it('two verified claims about the same site that say opposite things: both NEED JUDGMENT, neither counted as eligible', async () => {
    const s = await loadAccountSources(prisma([fact('f1', 'https://a.example/open', OPEN), fact('f2', 'https://b.example/close', CLOSE)]) as never, 'Kroger', { now: NOW });
    expect(s.items.map((i) => [i.verification, i.outreach])).toEqual([
      ['VERIFIED_AT_SOURCE', 'NEEDS_HUMAN_JUDGMENT'],
      ['VERIFIED_AT_SOURCE', 'NEEDS_HUMAN_JUDGMENT'],
    ]);
    expect(s).toMatchObject({ claimsVerified: 2, outreachEligible: 0 });
    expect(s.items[0].reason).toMatch(/another verified claim about .* says the opposite/);
  });

  it('a story flagged contradicted on a page holding an eligible claim: the merged card needs judgment, not eligible', async () => {
    const url = 'https://a.example/open';
    const sig = { id: 's1', url, title: 'Kroger Dallas DC', source_name: null, published_at: new Date('2026-09-20'), created_at: NOW, origin: 'discovery', research_status: 'contradiction', categories: [], feedback: null, account_name: 'Kroger', resolution_basis: 'discovery_query', event_id: null, metadata: null };
    const s = await loadAccountSources(prisma([fact('f1', url, OPEN)], [sig]) as never, 'Kroger', { now: NOW });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].outreach).toBe('NEEDS_HUMAN_JUDGMENT');
    expect(s.outreachEligible).toBe(0);
  });
});

describe('the redirect resolver never takes a mirror as the publisher', () => {
  it('an msn.com or panabee.com copy holding the exact words is not the canonical page', async () => {
    const quote = 'Kroger plans to close three older distribution facilities in the region and consolidate them into a new center.';
    for (const finalUrl of ['https://www.msn.com/en-us/money/kroger-dc', 'https://www.panabee.com/company/KR']) {
      const r = await resolveRedirectFact({ evidence_text: quote, evidence_url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/X', account_name: 'Kroger' }, { follow: async () => ({ finalUrl, text: `Kroger. ${quote}` }) });
      expect(r).toEqual({ resolved: false, reason: 'redirect_unresolved' });
    }
  });
});

describe('the Feedback button is never under the global Compose button', () => {
  it('is in the page flow at every width (R63-A S12), so it is never under anything fixed', () => {
    render(<FeedbackButton />);
    const cls = screen.getByTestId('feedback-open').className;
    expect(cls).not.toMatch(/(?:^|\s)(?:\w+:)?fixed(?:\s|$)/);
    expect(cls).not.toMatch(/\bright-\d/);
  });
});
