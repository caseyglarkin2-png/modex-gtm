/**
 * R20 follow-up: the Coverage page says, per account, when an account is outside the grounded rotation at the current
 * allowance (news only), and states the count beside the capacity. The report itself is the real pure computation
 * (coverageReport); only the session, the flag check and the ledger read are replaced.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { coverageReport } from '@/lib/gap/signals/coverage';

vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn(), usePathname: () => '/gap/coverage', useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/flags')>()), assertGapEnabled: () => null }));

const NOW = new Date('2026-10-06T20:00:00Z');
// Batch item 10: 24 turns a day less the 15% margin carry 35 rotating accounts; the last 2 of 37 by tier and name are news only.
const watched = Array.from({ length: 37 }, (_, k) => ({ accountName: `Acct ${String(k).padStart(2, '0')}`, reasons: ['priority'], tier: k < 35 ? 'Tier 1' : null, band: null }));
vi.mock('@/lib/gap/signals/coverage', async (orig) => {
  const real = await orig<typeof import('@/lib/gap/signals/coverage')>();
  return { ...real, loadCoverage: vi.fn(async () => real.coverageReport({ now: NOW, profiles: watched, grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(), accountsPerRun: 2, runsPerDay: 12 })) };
});

describe('the Coverage page (R20 follow-up)', () => {
  it('marks each account outside the grounded rotation as news only, and only those; the capacity block states the count and the decision', async () => {
    const { default: CoveragePage } = await import('@/app/gap/coverage/page');
    render(await CoveragePage());
    const rows = screen.getAllByTestId('coverage-row');
    expect(rows).toHaveLength(37);
    const newsOnly = rows.filter((r) => r.getAttribute('data-rotation') === 'news_only');
    expect(newsOnly.map((r) => within(r).getByRole('link').textContent)).toEqual(['Acct 35', 'Acct 36']);
    for (const r of newsOnly) expect(within(r).getByTestId('coverage-news-only')).toHaveTextContent('news only: outside the grounded rotation at the current allowance');
    expect(screen.getAllByTestId('coverage-news-only')).toHaveLength(2);
    expect(screen.getByTestId('coverage-news-only-count')).toHaveTextContent('Watched for news only (outside the grounded rotation at the current allowance): 2');
    expect(screen.getByTestId('coverage-choice')).toHaveTextContent('no spend increase, no cadence change');
    // Batch item 10: the news cap is stated (never "every watched account" each run), and the margin is said.
    expect(screen.getByTestId('coverage-capacity')).toHaveTextContent('15% of the rotation turns kept for a failed or skipped turn');
    expect(screen.getByTestId('coverage-capacity')).toHaveTextContent('News: at most 10 accounts a run, with the time the grounded turns leave, so each watched account is asked about every 8 hours at best, not every run.');
    expect(screen.getByTestId('coverage-capacity')).not.toHaveTextContent('News runs with the same cron for every watched account');
    // The pure report the page renders is the same one the runner uses.
    expect(coverageReport({ now: NOW, profiles: watched, grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map() }).capacity.newsOnlyAccounts).toBe(2);
  });
});
