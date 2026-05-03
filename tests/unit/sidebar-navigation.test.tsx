import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/sidebar';
import { SidebarProvider } from '@/components/sidebar-context';

vi.mock('next/navigation', () => ({
  usePathname: () => '/generated-content',
}));

vi.mock('@/components/notification-bell', () => ({
  NotificationBell: () => <button type="button">Notifications</button>,
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe('Sidebar canonical navigation', () => {
  it('renders the ten durable RevOps OS modules', () => {
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
    );

    for (const label of [
      'Home',
      'Accounts',
      'Contacts',
      'Campaigns',
      'Engagement',
      'Work Queue',
      'Content Studio',
      'Pipeline',
      'Analytics',
      'Ops',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    expect(screen.queryByRole('link', { name: 'Campaign HQ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Generated Content' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Jake Queue' })).not.toBeInTheDocument();
  });

  it('marks legacy generated-content route as Content Studio active', () => {
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
    );

    const contentStudio = screen.getByRole('link', { name: 'Content Studio' });
    expect(contentStudio).toHaveAttribute('href', '/studio');
    expect(contentStudio.className).toContain('font-medium');
  });
});

