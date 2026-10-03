/**
 * Click test round 3 (UX P1): "Do this next" sat 11s with no feedback and a tab click kept the old tab and content
 * up for ~4s. Every slow GAP navigation says it is working the moment it is clicked; the account page has a loading
 * state and its browser title names the account.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const status = vi.hoisted(() => ({ pending: false }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
  useLinkStatus: () => status,
}));
import { PendingLink } from '@/components/gap/pending-link';
import AccountLoading from '@/app/gap/accounts/[slug]/loading';
import { accountTitle } from '@/lib/gap/account-intel/href';

describe('pending feedback', () => {
  it('a PendingLink announces "Opening" only while its navigation is pending', () => {
    status.pending = false;
    const { rerender } = render(<PendingLink href="/gap/accounts/pepsico">Do this next</PendingLink>);
    expect(screen.queryByRole('status')).toBeNull();
    status.pending = true;
    rerender(<PendingLink href="/gap/accounts/pepsico">Do this next</PendingLink>);
    expect(screen.getByRole('status').textContent).toBe('Opening');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/gap/accounts/pepsico');
  });
  it('the account page has a loading state that says what is loading', () => {
    render(<AccountLoading />);
    expect(screen.getByRole('status').textContent).toMatch(/Loading the account/);
  });
  it('the browser title names the account', () => {
    const m = { title: accountTitle('general-mills') };
    expect(m.title).toBe('General Mills | GAP');
  });
});
