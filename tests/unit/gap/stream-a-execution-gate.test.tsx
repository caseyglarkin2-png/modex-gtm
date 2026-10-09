/**
 * C43 / C57 F-C2: the signed-link pages execute nothing on a bare GET. /gap/decide and /gap/start render a one-click
 * confirm form that carries the token (and `next`); the decision or the day start runs only on the confirmed step
 * executionAllowed names. /gap/item never executes: start and decide tokens go to their pages, open is navigation.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { applyDecision, startDay, sendAssignment, planDay, nextUnassignedItem, findPlanItemByToken } = vi.hoisted(() => ({
  applyDecision: vi.fn(),
  startDay: vi.fn(),
  sendAssignment: vi.fn(),
  planDay: vi.fn(),
  nextUnassignedItem: vi.fn(),
  findPlanItemByToken: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/components/gap/gap-subnav', () => ({ GapSubnav: () => null }));
vi.mock('@/lib/gap/opportunity/contact-reads', () => ({ hubspotContactByEmail: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
  notFound: () => { throw new Error('NOT_FOUND'); },
}));
vi.mock('@/lib/gap/work/decide', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/work/decide')>()), applyDecision }));
vi.mock('@/lib/gap/work/assignment', () => ({ startDay, sendAssignment, nextUnassignedItem }));
vi.mock('@/lib/gap/work/plan', () => ({ planDay, decisionIdsFromCandidates: () => [], findPlanItemByToken }));
vi.mock('@/lib/gap/work/load-day', () => ({ loadWorkDay: vi.fn() }));
vi.mock('@/lib/gap/work/settings', () => ({ loadSellerSettings: vi.fn(async () => ({ briefingTo: 'casey@freightroll.com' })) }));
vi.mock('@/lib/gap/execution/gap-sender', () => ({ gapGmailSender: () => null }));

import { signActionToken } from '@/lib/gap/work/action-token';
import DecidePage from '@/app/gap/decide/page';
import StartPage from '@/app/gap/start/page';
import ItemPage from '@/app/gap/item/page';

const NOW = new Date('2026-10-09T13:00:00Z');
const SECRET = 'test-secret';
const token = (op: 'decide' | 'start' | 'open', item?: string) => signActionToken({ op, ...(item ? { item } : {}), day: '2026-10-09' }, { secret: SECRET, now: NOW });

beforeEach(() => {
  process.env.GAP_ACTION_SECRET = SECRET;
  applyDecision.mockReset().mockResolvedValue({ ok: true, key: 'signal:s-1', decision: 'pursue', effects: ['angle_queued'], href: '/gap/accounts/kenco', accountName: 'Kenco' });
  startDay.mockReset().mockResolvedValue({ started: true });
  planDay.mockReset().mockResolvedValue({ day: '2026-10-09', items: [] });
  nextUnassignedItem.mockReset().mockResolvedValue(null);
  sendAssignment.mockReset();
  findPlanItemByToken.mockReset().mockResolvedValue({ item: { href: '/gap/accounts/kenco' } });
});
afterEach(() => {
  delete process.env.GAP_ACTION_SECRET;
});

describe('/gap/decide', () => {
  it('a bare GET with a valid token applies nothing: it renders the confirm form carrying the token and confirmed=1', async () => {
    const t = token('decide', 'signal:s-1|pursue');
    render(await DecidePage({ searchParams: Promise.resolve({ t }) }));
    expect(applyDecision).not.toHaveBeenCalled();
    const form = screen.getByTestId('decide-confirm-form');
    expect(form).toHaveAttribute('method', 'get');
    expect(form.querySelector('input[name="t"]')).toHaveAttribute('value', t);
    expect(form.querySelector('input[name="confirmed"]')).toHaveAttribute('value', '1');
    expect(screen.getByTestId('decide-confirm').textContent).toBe('Pursue');
    expect(screen.getByTestId('decide-confirm-line').textContent).toContain('Nothing is applied until you confirm');
  });

  it('the confirmed step applies it once through the one service and says what happened', async () => {
    const t = token('decide', 'signal:s-1|pursue');
    render(await DecidePage({ searchParams: Promise.resolve({ t, confirmed: '1' }) }));
    expect(applyDecision).toHaveBeenCalledTimes(1);
    expect(applyDecision.mock.calls[0][1]).toMatchObject({ key: 'signal:s-1', decision: 'pursue', via: 'gmail:link' });
    expect(screen.getByTestId('decide-line').textContent).toContain('Pursuing the signal');
  });

  it('a forged or expired token applies nothing even when confirmed; a non-decision op applies nothing', async () => {
    render(await DecidePage({ searchParams: Promise.resolve({ t: `${token('decide', 'signal:s-1|pursue')}x`, confirmed: '1' }) }));
    expect(screen.getByTestId('decide-line').textContent).toContain('could not be verified');
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('open', 'signal:s-1'), confirmed: '1' }) }));
    expect(applyDecision).not.toHaveBeenCalled();
  });
});

describe('/gap/start', () => {
  it('a bare GET starts nothing and sends nothing: it renders the confirm form; next=1 rides along', async () => {
    render(await StartPage({ searchParams: Promise.resolve({ t: token('start'), next: '1' }) }));
    expect(startDay).not.toHaveBeenCalled();
    expect(planDay).not.toHaveBeenCalled();
    expect(sendAssignment).not.toHaveBeenCalled();
    const form = screen.getByTestId('start-confirm-form');
    expect(form.querySelector('input[name="confirmed"]')).toHaveAttribute('value', '1');
    expect(form.querySelector('input[name="next"]')).toHaveAttribute('value', '1');
    expect(form.querySelector('input[name="t"]')).toBeTruthy();
    expect(screen.getByTestId('start-confirm').textContent).toBe('Send the next one');
  });

  it('a direct visit by a signed-in seller is gated the same; the confirmed step starts the day', async () => {
    render(await StartPage({ searchParams: Promise.resolve({}) }));
    expect(startDay).not.toHaveBeenCalled();
    expect(screen.getByTestId('start-confirm').textContent).toBe('Start the day');
    render(await StartPage({ searchParams: Promise.resolve({ confirmed: '1' }) }));
    expect(startDay).toHaveBeenCalledTimes(1);
    expect(startDay.mock.calls[0][1]).toMatchObject({ day: expect.any(String), via: 'app' });
    expect(screen.getByText('The day is started')).toBeTruthy();
  });
});

describe('/gap/item', () => {
  it('never executes: a start token goes to /gap/start, a decide token to /gap/decide (each asks for one click); an open token navigates to the item', async () => {
    const start = token('start');
    await expect(ItemPage({ searchParams: Promise.resolve({ t: start }) })).rejects.toThrow(`REDIRECT:/gap/start?t=${encodeURIComponent(start)}`);
    const decide = token('decide', 'signal:s-1|pursue');
    await expect(ItemPage({ searchParams: Promise.resolve({ t: decide }) })).rejects.toThrow(`REDIRECT:/gap/decide?t=${encodeURIComponent(decide)}`);
    expect(applyDecision).not.toHaveBeenCalled();
    expect(startDay).not.toHaveBeenCalled();
    await expect(ItemPage({ searchParams: Promise.resolve({ t: token('open', 'first_touch:dec-1') }) })).rejects.toThrow('REDIRECT:/gap/accounts/kenco');
    await expect(ItemPage({ searchParams: Promise.resolve({ t: `${start}x` }) })).rejects.toThrow('REDIRECT:/gap/?link=bad_signature');
    await expect(ItemPage({ searchParams: Promise.resolve({ t: 'forged' }) })).rejects.toThrow('REDIRECT:/gap/?link=malformed');
  });
});
