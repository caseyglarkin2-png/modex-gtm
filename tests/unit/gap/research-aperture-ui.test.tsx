/**
 * Research aperture UI: a source card leads with provenance, never presents a search summary as a quote, names a
 * third party as the speaker, labels an old source NOT A FRESH TRIGGER, and keeps both counts apart. Casey's actions
 * ride the existing signal spine and never approve, activate, draft or send.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { AccountSourcesSection } from '@/components/gap/account-sources';
import type { AccountSource } from '@/lib/gap/sources/source-copy';
import { applySourceOp } from '@/lib/gap/sources/source-ops';

const src = (over: Partial<AccountSource>): AccountSource => ({
  key: 'https://gatik.ai/news/pepsico', link: 'https://gatik.ai/news/pepsico', title: 'Gatik and PepsiCo', publisher: 'gatik.ai', publishedAt: '2026-06-09T00:00:00.000Z', discoveredAt: '2026-09-30T16:39:00.000Z', ageDays: 114, freshTrigger: false,
  excerpt: '"That is what we are doing with PepsiCo," said Gautam Narang, CEO of Gatik.', excerptKind: 'verbatim', attribution: 'Gatik', whyFound: ['automation'], origin: 'gap_research', status: 'NOT_VERIFIED_FOR_OUTREACH',
  reason: 'third-party statement (said by Gatik, not PepsiCo)', signalId: null, factId: null, reviewed: false, ...over,
});
const sources = (items: AccountSource[], over: Record<string, unknown> = {}) => ({ accountName: 'PepsiCo', items, sourcesFound: items.length, verifiedFacts: 1, dropped: 2, setAside: 0, setAsideItems: [], ...over });

describe('source cards', () => {
  it('provenance first; third party named; old source labelled, not hidden; both counts shown', () => {
    render(<AccountSourcesSection sources={sources([src({}), src({ key: 'k2', link: 'https://www.pepsico.com/n', publisher: 'pepsico.com', status: 'VERIFIED_FOR_OUTREACH', reason: null, attribution: null, excerpt: 'PepsiCo will deploy autonomous trucks.' })])} limit={5} viewAllHref="/gap/accounts/pepsico/sources" />);
    expect(screen.getByTestId('account-sources-counts')).toHaveTextContent('Sources found: 2 · Outreach facts verified: 1');
    const [gatik] = screen.getAllByTestId('source-card');
    expect(gatik.querySelector('[data-testid="source-provenance"]')).toHaveTextContent('gatik.ai · published Jun 9, 2026 · 3 months old');
    expect(gatik.querySelector('[data-testid="source-not-fresh"]')).toHaveTextContent('Not a fresh trigger');
    expect(gatik.querySelector('[data-testid="source-attribution"]')).toHaveTextContent('Said by Gatik (third party), not PepsiCo.');
    expect(gatik.querySelector('[data-testid="source-status"]')).toHaveTextContent('Not verified for outreach');
    expect(gatik.querySelector('[data-testid="source-open"]')).toHaveAttribute('href', 'https://gatik.ai/news/pepsico');
    expect(screen.getByTestId('account-sources-view-all')).toHaveAttribute('href', '/gap/accounts/pepsico/sources');
    expect(screen.getByTestId('account-sources-dropped')).toHaveTextContent('2 not shown: search redirects or broken links');
    // A verified source offers no "verify" (already verified); everything offers open, research more, ignore, wrong account.
    expect(screen.getAllByTestId('source-verify')).toHaveLength(1);
  });

  it('compact on the account page: three actions per card, no theme line, one Research more; the full page groups by status with counts', () => {
    const items = [src({}), src({ key: 'k2', link: 'https://news.google.com/rss/articles/CBMiABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?oc=5', title: null, publisher: 'Hoodline', status: 'COULD_NOT_VERIFY', reason: 'source could not be fetched', attribution: null, excerpt: null, excerptKind: null })];
    const { unmount } = render(<AccountSourcesSection sources={sources(items)} limit={3} viewAllHref="/v" researchHref="#research-plan" />);
    const card = screen.getAllByTestId('source-card')[0];
    expect(card.querySelectorAll('button')).toHaveLength(3);
    expect(card.querySelector('[data-testid="source-why"]')).toBeNull();
    expect(screen.getAllByTestId('account-sources-research-more')).toHaveLength(1);
    // A long feed URL with no headline never becomes the title.
    expect(screen.getAllByTestId('source-open')[1]).toHaveTextContent('Hoodline (untitled page)');
    unmount();
    render(<AccountSourcesSection sources={sources(items)} researchHref="/gap/accounts/pepsico#research-plan" />);
    expect(screen.getByTestId('account-sources-group-NOT_VERIFIED_FOR_OUTREACH')).toHaveTextContent('Not verified for outreach (1)');
    expect(screen.getByTestId('account-sources-group-COULD_NOT_VERIFY')).toHaveTextContent('Could not verify (1)');
    expect(screen.queryByTestId('account-sources-group-VERIFIED_FOR_OUTREACH')).toBeNull();
  });

  it('a long quote is cut at a word, outside the quotation marks', () => {
    const long = `${'PepsiCo moves freight across Texas '.repeat(10)}and Arizona.`;
    render(<AccountSourcesSection sources={sources([src({ excerpt: long, attribution: null })])} limit={3} />);
    const t = screen.getByTestId('source-excerpt').textContent ?? '';
    expect(t).toMatch(/\u201d \(continues at the source\)$/);
    expect(t).not.toContain('\u2026');
  });

  it('a sentence that is itself a quotation keeps its own marks, never doubled', () => {
    render(<AccountSourcesSection sources={sources([src({ excerpt: '\u201cGatik is already operating inside our networks,\u201d said Jim Farrell, PepsiCo.', attribution: null })])} limit={3} />);
    expect(screen.getByTestId('source-excerpt').textContent).toBe('\u201cGatik is already operating inside our networks,\u201d said Jim Farrell, PepsiCo.');
  });

  it('a search summary is labelled, never quoted', () => {
    render(<AccountSourcesSection sources={sources([src({ excerptKind: 'search_summary', excerpt: 'PepsiCo is expanding its fleet.', attribution: null })])} />);
    const e = screen.getByTestId('source-excerpt');
    expect(e).toHaveTextContent('Search summary, not a quote: PepsiCo is expanding its fleet.');
    expect(e.textContent).not.toContain('“');
  });

  it('"no verified fact" is not "nothing found"', () => {
    render(<AccountSourcesSection sources={sources([src({})], { verifiedFacts: 0 })} />);
    expect(screen.getByTestId('account-sources-counts')).toHaveTextContent('Sources found: 1 · Outreach facts verified: 0');
    expect(screen.queryByTestId('account-sources-empty')).toBeNull();
  });

  it('Verify as evidence posts the source op; the reply says a failure stays visible', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, signalId: 's1', researchStatus: 'queued', feedback: null }), { status: 200 }));
    render(<AccountSourcesSection sources={sources([src({})])} />);
    fireEvent.click(screen.getByTestId('source-verify'));
    await waitFor(() => expect(screen.getByTestId('source-msg')).toHaveTextContent('stays here with the reason'));
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/account-sources');
    expect(JSON.parse(String(init.body))).toEqual({ accountName: 'PepsiCo', url: 'https://gatik.ai/news/pepsico', title: 'Gatik and PepsiCo', publishedAt: '2026-06-09T00:00:00.000Z', op: 'verify' });
    f.mockRestore();
  });
});

describe('source ops ride the signal spine', () => {
  function db(existing: Record<string, unknown> | null) {
    const rows: Record<string, unknown>[] = existing ? [existing] : [];
    const prisma: any = {
      account: { findFirst: vi.fn(async ({ where }: any) => (where.name === 'PepsiCo' ? { name: 'PepsiCo' } : null)) },
      gapSignal: {
        findUnique: vi.fn(async ({ where }: any) => (where.url_hash ? rows.find((r) => r.url_hash === where.url_hash) ?? null : rows.find((r) => r.id === where.id) ?? null)),
        create: vi.fn(async ({ data }: any) => { const r = { id: 'sig-new', research_status: 'none', feedback: null, created_at: new Date('2026-10-01T12:00:00Z'), ...data }; rows.push(r); return r; }),
        update: vi.fn(async ({ where, data }: any) => Object.assign(rows.find((r) => r.id === where.id)!, data)),
        findMany: vi.fn(async () => []),
        count: vi.fn(async () => 0),
        findFirst: vi.fn(async () => null),
      },
      gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })) },
      prospectingHypothesis: { create: vi.fn(), update: vi.fn() },
    };
    return { prisma, rows };
  }

  it('verify captures the source as a signal and queues the strict check: no hypothesis touched', async () => {
    const { prisma, rows } = db(null);
    const r = await applySourceOp(prisma, { accountName: 'PepsiCo', url: 'https://gatik.ai/news/pepsico', title: 'Gatik and PepsiCo', publishedAt: '2026-06-09T00:00:00.000Z', op: 'verify', actor: 'casey@freightroll.com', now: new Date('2026-10-01T12:00:00Z') });
    expect(r).toMatchObject({ ok: true, researchStatus: 'queued' });
    expect(rows[0]).toMatchObject({ account_name: 'PepsiCo', research_status: 'queued' });
    expect(prisma.prospectingHypothesis.create).not.toHaveBeenCalled();
    expect(prisma.prospectingHypothesis.update).not.toHaveBeenCalled();
  });

  it('a link filed under another account is refused, named, never re-filed', async () => {
    const { signalUrlHash, normalizeSignalUrl } = await import('@/lib/gap/signals/intake');
    const { prisma } = db({ id: 's-k', url_hash: signalUrlHash(normalizeSignalUrl('https://gatik.ai/news/pepsico')!), account_name: 'Kroger' });
    const r = await applySourceOp(prisma, { accountName: 'PepsiCo', url: 'https://gatik.ai/news/pepsico', op: 'ignore', actor: 'c', now: new Date() });
    expect(r).toEqual({ ok: false, reason: 'other_account', detail: 'Kroger' });
    expect(prisma.gapSignal.update).not.toHaveBeenCalled();
  });
});
