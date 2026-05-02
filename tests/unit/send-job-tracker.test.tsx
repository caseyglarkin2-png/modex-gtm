import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SendJobTracker } from '@/components/generated-content/send-job-tracker';

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

function makeGetPayload(status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | 'cancelled') {
  return {
    success: true,
    recipientCounts: {},
    job: {
      id: 77,
      status,
      total_recipients: 2,
      sent_count: status === 'completed' ? 2 : 0,
      failed_count: status === 'partial' ? 1 : 0,
      skipped_count: 0,
      recipients: [
        {
          id: 1,
          generated_content_id: 20,
          account_name: 'Acme Logistics',
          persona_name: 'Ops Lead',
          to_email: 'ops@acme.com',
          status: status === 'completed' ? 'sent' : 'failed',
          error_message: status === 'completed' ? null : 'Mailbox unavailable',
          hubspot_engagement_id: status === 'completed' ? '101' : null,
        },
        {
          id: 2,
          generated_content_id: 22,
          account_name: 'Blue Yard',
          persona_name: null,
          to_email: 'yard@blue.com',
          status: status === 'completed' ? 'sent' : 'pending',
          error_message: null,
          hubspot_engagement_id: null,
        },
      ],
    },
  };
}

describe('SendJobTracker', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it('renders job summary and retries failed recipients', async () => {
    let getCalls = 0;
    vi.stubGlobal('fetch', vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const url = _input.toString();
      if (url.endsWith('/retry-failed') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, resetRecipients: 1 }),
        };
      }

      getCalls += 1;
      return {
        ok: true,
        json: async () => (getCalls === 1 ? makeGetPayload('partial') : makeGetPayload('pending')),
      };
    }));

    render(<SendJobTracker jobId={77} pollMs={60_000} />);

    await screen.findByText('Send Job #77');
    expect(screen.getByRole('button', { name: /Retry Failed Recipients \(1\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Retry Failed Recipients/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/email/send-jobs/77/retry-failed', { method: 'POST' });
    });
    expect(toastSuccess).toHaveBeenCalledWith('Reset 1 failed recipient(s)');
  });

  it('shows refresh error toast when refresh fails', async () => {
    let getCalls = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      getCalls += 1;
      if (getCalls === 2) {
        return {
          ok: false,
          json: async () => ({ error: 'boom' }),
        };
      }

      return {
        ok: true,
        json: async () => makeGetPayload('pending'),
      };
    }));

    render(<SendJobTracker jobId={77} pollMs={60_000} />);
    await screen.findByText('Send Job #77');

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to fetch send job status');
    });
  });
});
