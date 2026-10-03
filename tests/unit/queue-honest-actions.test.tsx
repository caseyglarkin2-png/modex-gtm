/**
 * Click test P0 (2026-10-03): the Queue's Complete / Snooze toasted success and dropped the KPI, but wrote nothing,
 * so the card came back on reload. Hiding a card is a per-screen view choice: it says so, never "Completed". A
 * GAP-decides row has one action (open the account in GAP), never outcome chips that would log against it.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const toastFn = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastFn }));
vi.mock('@/lib/offline-queue', () => ({ queueAll: () => [], queueRemove: vi.fn() }));
import { WorkQueueClient } from '@/app/queue/work-queue-client';
import type { WorkQueueItem } from '@/lib/work-queue';

const legacy: WorkQueueItem = {
  id: 'activity-1', itemType: 'follow-up', sourceId: '1', accountName: 'Mondelez', accountSlug: 'mondelez', title: 'Follow up on proposal',
  detail: 'Mondelez follow-up', createdAt: new Date('2026-09-14T00:00:00Z'), statusLabel: 'Open', severity: 'low', sourceTab: 'follow-ups',
  quickActions: { completeKey: 'a-c', snoozeKey: 'a-s', accountHref: '/accounts/mondelez' },
};
const gapRow: WorkQueueItem = {
  id: 'gap-next-coca-cola', itemType: 'gap-next', sourceId: 'coca-cola', accountName: 'Coca-Cola', accountSlug: 'coca-cola', title: 'GAP decides the next step',
  detail: '2 legacy items on this account. They are not the next step; open the account in GAP.', createdAt: new Date('2026-09-20T00:00:00Z'), statusLabel: 'GAP', severity: 'low', sourceTab: 'follow-ups',
  quickActions: { completeKey: 'g-c', snoozeKey: 'g-s', accountHref: '/gap/accounts/coca-cola' },
};

describe('Queue actions say what they do', () => {
  const fetchMock = vi.fn();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); toastFn.mockReset(); toastFn.success.mockReset(); toastFn.error.mockReset(); });
  afterEach(() => vi.unstubAllGlobals());

  it('a legacy card offers Hide, never Complete, and the toast says nothing was saved', () => {
    render(<WorkQueueClient defaultTab="follow-ups" initialItems={[legacy]} />);
    expect(screen.queryByRole('button', { name: /complete/i })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /^hide$/i })[0]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toastFn.success).not.toHaveBeenCalled();
    expect(String(toastFn.mock.calls[0]?.[0])).toMatch(/hidden on this screen until you reload.*nothing was saved/i);
  });

  it('a GAP-decides row has only "Open in GAP": no Hide, no Snooze, no outcome chips', () => {
    render(<WorkQueueClient defaultTab="follow-ups" initialItems={[gapRow]} />);
    const open = screen.getAllByRole('link', { name: /open in gap/i })[0];
    expect(open.getAttribute('href')).toBe('/gap/accounts/coca-cola');
    expect(screen.queryByRole('button', { name: /^hide$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /snooze/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^positive$/i })).toBeNull();
  });

  it('a failed outcome write names what failed, never a bare "Failed to fetch"', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<WorkQueueClient defaultTab="follow-ups" initialItems={[legacy]} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^positive$/i })[0]);
    await waitFor(() => expect(toastFn.error).toHaveBeenCalled());
    expect(String(toastFn.error.mock.calls[0][0])).toBe('Outcome not saved: no connection. Try again.');
  });
});
