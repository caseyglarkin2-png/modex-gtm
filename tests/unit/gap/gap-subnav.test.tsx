/**
 * UX-10: the seller sees three items (Work, Accounts, Capture); the intelligence and admin tools stay reachable under
 * More, never deleted; the current item is marked, and a current More item marks the menu.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GapSubnav, MORE_TABS, PRIMARY_TABS } from '@/components/gap/gap-subnav';

let pathname = '/gap';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

describe('<GapSubnav>', () => {
  it('renders Work, Accounts and Capture as the only top-level links; every other tool sits under More; the live trailing slash still marks Work current', () => {
    pathname = '/gap/';
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/gap');
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/gap/accounts');
    expect(screen.getByRole('link', { name: 'Capture' })).toHaveAttribute('href', '/gap/capture');
    const more = screen.getByTestId('gap-subnav-more');
    for (const t of MORE_TABS) expect(within(more).getByRole('link', { name: t.label })).toHaveAttribute('href', t.href);
    expect(within(more).getByRole('link', { name: 'All hypotheses' })).toHaveAttribute('href', '/gap/hypotheses');
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(['Work', 'Accounts', 'Capture']);
    expect(screen.getAllByRole('link')).toHaveLength(PRIMARY_TABS.length + MORE_TABS.length);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the current item with aria-current, and only that one; an account workspace counts as Accounts', () => {
    pathname = '/gap/accounts/pepsico';
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Work' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Capture' })).not.toHaveAttribute('aria-current');
  });

  it('a nested hypothesis path is current under All hypotheses, and the More menu label is marked', () => {
    pathname = '/gap/hypotheses/hyp_1';
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'All hypotheses' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Work' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('More').className).toMatch(/var\(--primary\)/);
  });
});
