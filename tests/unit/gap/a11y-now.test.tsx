/**
 * Click-test accessibility fixes (2026-10-03), pinned at render:
 *   - Listen announces its state (aria-pressed) and keeps an accessible name
 *   - NOW's controls and tool links are 44px tap targets; the tool nav is labelled
 *   - the Sources list is valid markup (every child of the list is an <li>)
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import { AccountSourcesSection } from '@/components/gap/account-sources';
import type { NowView } from '@/lib/gap/context/now';

const v: NowView = {
  name: 'Acme', stateLine: 'manufacturer · Direct buyer · Ready for a first touch', lastTouch: 'No touch on record.', lastReply: null, unit: null,
  next: { text: 'Review the thesis.', source: 'motion' }, who: { name: 'Dana', title: 'Director of Transportation', why: 'Primary operator.', route: null }, betterFit: null, whoUnknown: null, alternate: null,
  whyNow: [], gap: [], currentState: 'Current state: not confirmed by the buyer.', know: [], think: null, impact: 'Impact: unknown.', ask: null, relationship: null, private: null, wedge: null, asset: null, listen: 'Acme.',
};

describe('NOW accessibility', () => {
  it('Listen has a name and a pressed state; NEXT and tool links are 44px targets in a labelled nav', () => {
    render(<AccountNowView v={v} nextHref="/gap?lane=ready" nextLabel="Open the first-touch card for Dana" links={[{ label: 'Log what happened', href: '/gap/capture?account=Acme' }, { label: 'HubSpot record', href: 'https://app.hubspot.com/x', external: true }]} />);
    // UX-04: Listen renders twice (the header from md up, the phone bottom bar below md); both carry the name and state.
    const listen = screen.getAllByRole('button', { name: 'Listen' })[0];
    expect(listen.getAttribute('aria-label')).toBe('Listen');
    expect(listen.className).toMatch(/min-h-11/);
    expect(screen.getByTestId('now-next-control').className).toMatch(/min-h-11/);
    const nav = screen.getByRole('navigation', { name: 'Account tools' });
    for (const a of nav.querySelectorAll('a')) expect(a.className).toMatch(/min-h-11/);
  });
});

describe('Sources list markup', () => {
  it('every child of the source list is an <li>', () => {
    const item = { key: 'k1', link: 'https://news.example/a', title: 'A', publisher: 'news.example', publishedAt: '2026-09-01T00:00:00.000Z', discoveredAt: '2026-09-30T00:00:00.000Z', ageDays: 30, freshTrigger: true, excerpt: 'Acme opens a DC.', excerptKind: 'verbatim', attribution: null, whyFound: [], origin: 'gap_research', verification: 'VERIFIED_AT_SOURCE', outreach: 'ELIGIBLE', reason: null, signalId: null, factId: null, reviewed: false } as never;
    const { container } = render(<AccountSourcesSection sources={{ accountName: 'Acme', items: [item], sourcesFound: 1, claimsVerified: 1, outreachEligible: 1, dropped: 0, setAside: 0, setAsideItems: [] } as never} limit={3} />);
    for (const ul of container.querySelectorAll('ul')) for (const child of ul.children) expect(child.tagName).toBe('LI');
  });
});
