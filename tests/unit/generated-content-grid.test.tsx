import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratedContentGrid, type QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

const cards: QueueGeneratedAccountCard[] = [
  {
    account_name: 'Acme Foods',
    account_slug: 'acme-foods',
    latest_version: 2,
    pending_jobs: 0,
    processing_jobs: 0,
    campaign_names: ['Q2 Launch'],
    versions: [
      {
        id: 42,
        version: 2,
        provider_used: 'ai_gateway',
        external_send_count: 0,
        is_published: false,
        content: 'test',
        created_at: '2026-05-01T00:00:00.000Z',
      },
    ],
  },
];

describe('GeneratedContentGrid', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  it('publishes selected version through publish endpoint', async () => {
    render(<GeneratedContentGrid cards={cards} recipientsByAccount={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ai/generated-content/42/publish', { method: 'PATCH' });
    });
    expect(toastSuccess).toHaveBeenCalledWith('Published version');
  });

  it('disables preview and send when no recipients exist', () => {
    render(<GeneratedContentGrid cards={cards} recipientsByAccount={{}} />);
    expect(screen.getByRole('button', { name: /Preview & Send/i })).toBeDisabled();
  });
});
