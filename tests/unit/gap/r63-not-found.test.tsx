/**
 * R63-B S7: nonsense account and pack ids showed the prospect-facing "404 Page Not Found. This page doesn't exist or
 * has been moved." with exits only to yardflow.ai and /demo/, the tab title echoed the nonsense id, and the call page
 * said "Could not load the brief: not_found". GAP's own not-found says what is missing in seller words with one link
 * back to Work, the title is "Not found | GAP", and the call page's reason is in words.
 *
 * The HTTP status of a page under a loading boundary is committed (200) before the page can know its id is unknown
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md "Status Codes"); a real 404
 * needs the check in the proxy, which is the lead's decision (the ledger's R63-B entry).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const db = vi.hoisted(() => ({ names: [] as string[], hypothesis: null as { id: string } | null, decision: null as { id: string } | null }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(async () => db.names.map((name) => ({ name }))),
    prospectingHypothesis: { findUnique: vi.fn(async () => db.hypothesis) },
    routingDecision: { findUnique: vi.fn(async () => db.decision) },
  },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), notFound: vi.fn(), redirect: vi.fn(), usePathname: () => '/gap' }));

import { GapNotFound, GAP_NOT_FOUND_TITLE } from '@/components/gap/gap-not-found';
import GapRootNotFound from '@/app/gap/not-found';
import AccountNotFound from '@/app/gap/accounts/[slug]/not-found';
import PreviewNotFound from '@/app/gap/preview/[hypothesisId]/not-found';
import PackNotFound from '@/app/gap/pack/[decisionId]/not-found';
import { generateMetadata as accountMetadata } from '@/app/gap/accounts/[slug]/page';
import { generateMetadata as previewMetadata } from '@/app/gap/preview/[hypothesisId]/page';
import { generateMetadata as packMetadata } from '@/app/gap/pack/[decisionId]/page';
import { CallMode, callBriefErrorWords } from '@/app/gap/call/[personaId]/call-mode';
import type { GapApiClient } from '@/lib/gap/ui/gap-api-client';

const p = <T,>(v: T) => Promise.resolve(v);

describe('R63-B S7: GAP not-found in the seller\'s words, one way back to Work', () => {
  it('each GAP not-found says what is missing and links only to Work (never yardflow.ai or /demo/)', () => {
    for (const [El, title] of [
      [AccountNotFound, 'This account is not on your list'],
      [PreviewNotFound, 'This action pack is not on your list'],
      [PackNotFound, 'This action pack is not on your list'],
      [GapRootNotFound, 'This page is not in GAP'],
    ] as const) {
      const { unmount } = render(<El />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title);
      const links = screen.getAllByRole('link');
      expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([['Back to Work', '/gap']]);
      expect(document.body.textContent).not.toMatch(/404|Page Not Found|doesn't exist or has been moved|YardFlow Home|Live Network Demos/);
      unmount();
    }
    render(<GapNotFound what="account" />);
    expect(screen.getByTestId('gap-not-found')).toHaveAttribute('data-what', 'account');
  });

  it('the tab title of a link that names nothing is "Not found | GAP", never the nonsense id; a real one keeps its title', async () => {
    db.names = [];
    expect(await accountMetadata({ params: p({ slug: 'zzz-no-such-account-r63' }) })).toEqual({ title: GAP_NOT_FOUND_TITLE });
    db.names = ['Walmart Scratch Co r63'];
    expect(await accountMetadata({ params: p({ slug: 'walmart-scratch-co-r63' }) })).toEqual({ title: 'Walmart Scratch Co R63 | GAP' });
    db.hypothesis = null;
    expect(await previewMetadata({ params: p({ hypothesisId: 'zzz-nonsense-999' }) })).toEqual({ title: GAP_NOT_FOUND_TITLE });
    db.hypothesis = { id: 'h1' };
    expect(await previewMetadata({ params: p({ hypothesisId: 'h1' }) })).toEqual({ title: 'Action pack' });
    db.decision = null;
    expect(await packMetadata({ params: p({ decisionId: 'zzz' }) })).toEqual({ title: GAP_NOT_FOUND_TITLE });
  });

  it('the call page says why in words, with Work beside it, never "not_found"', async () => {
    expect(callBriefErrorWords('not_found')).toBe('This person is not on your list in GAP, so there is no call brief for them.');
    const client = { getCallBrief: vi.fn(async () => ({ ok: false, status: 404, error: 'not_found' })) } as unknown as GapApiClient;
    render(<CallMode personaId="999999" client={client} />);
    await waitFor(() => expect(screen.getByTestId('call-brief-error')).toBeTruthy());
    expect(screen.getByTestId('call-brief-error').textContent).toContain('This person is not on your list in GAP');
    expect(screen.getByTestId('call-brief-error').textContent).not.toMatch(/not_found|Could not load the brief/);
    expect(screen.getByRole('link', { name: 'Back to Work' }).getAttribute('href')).toBe('/gap');
  });
});
