import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GapSubnav } from '@/components/gap/gap-subnav';

let pathname = '/gap';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

describe('<GapSubnav>', () => {
  it('renders Cockpit, All hypotheses, Learning linking to the three GAP surfaces', () => {
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'Cockpit' })).toHaveAttribute('href', '/gap');
    expect(screen.getByRole('link', { name: 'All hypotheses' })).toHaveAttribute('href', '/gap/hypotheses');
    expect(screen.getByRole('link', { name: 'Learning' })).toHaveAttribute('href', '/gap/learning');
  });

  it('marks the current tab with aria-current, and only that one', () => {
    pathname = '/gap/hypotheses';
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'All hypotheses' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cockpit' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Learning' })).not.toHaveAttribute('aria-current');
  });

  it('treats a nested hypothesis path as still under Hypotheses', () => {
    pathname = '/gap/hypotheses/hyp_1';
    render(<GapSubnav />);
    expect(screen.getByRole('link', { name: 'All hypotheses' })).toHaveAttribute('aria-current', 'page');
  });
});
