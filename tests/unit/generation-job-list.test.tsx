import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerationJobList, type GenerationJobRow } from '@/components/queue/generation-job-list';

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

const baseJobs: GenerationJobRow[] = [
  {
    id: 12,
    account_name: 'Acme Logistics',
    content_type: 'one_pager',
    status: 'failed',
    retry_count: 1,
    created_at: '2026-05-01T00:00:00.000Z',
    error_message: 'Provider timed out',
  },
  {
    id: 14,
    account_name: 'Blue Yard',
    content_type: 'one_pager',
    status: 'completed',
    retry_count: 0,
    created_at: '2026-05-01T00:00:00.000Z',
  },
];

describe('GenerationJobList', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  it('calls retry API and updates failed row to pending', async () => {
    render(<GenerationJobList jobs={baseJobs} />);

    fireEvent.click(screen.getByRole('button', { name: /Retry Generation/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ai/generation-jobs/12/retry', { method: 'POST' });
    });
    expect(toastSuccess).toHaveBeenCalledWith('Retry queued');
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
  });

  it('uses supplied onRetry callback when provided', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(<GenerationJobList jobs={baseJobs} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /Retry Generation/i }));

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledWith(12);
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders View & Send link for completed job', () => {
    render(<GenerationJobList jobs={baseJobs} />);
    expect(screen.getByRole('link', { name: 'View & Send' })).toHaveAttribute('href', '/accounts/blue-yard');
  });
});
