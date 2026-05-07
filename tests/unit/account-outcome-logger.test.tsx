import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountOutcomeLogger } from '@/components/accounts/account-outcome-logger';

const { mockedRefresh, toastSuccess, toastError } = vi.hoisted(() => ({
  mockedRefresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockedRefresh,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe('AccountOutcomeLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs an account-page outcome and refreshes the page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        deduped: false,
        nextAction: {
          label: 'Replace the contact before the next send',
          route: '#contacts',
        },
      }),
    })));

    render(
      <AccountOutcomeLogger
        accountName="Boston Beer Company"
        sources={[
          {
            key: 'email-1',
            label: 'Reply signal · YardFlow follow-up',
            detail: 'ops@example.com · May 5',
            sourceKind: 'email-log',
            sourceId: '1',
            generatedContentId: 42,
            sourceMetadata: {
              candidateTrace: {
                candidateId: 9,
                state: 'promoted',
              },
            },
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Log Outcome' }));
    fireEvent.click(screen.getByRole('button', { name: 'wrong person' }));
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: 'Need the transportation lead instead' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Outcome' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/operator-outcomes', expect.objectContaining({
        method: 'POST',
      }));
    });

    const [, request] = (fetch as unknown as { mock: { calls: Array<[string, { body: string }]> } }).mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(payload).toMatchObject({
      accountName: 'Boston Beer Company',
      outcomeLabel: 'wrong-person',
      sourceKind: 'email-log',
      sourceId: '1',
      generatedContentId: 42,
      sourceMetadata: {
        candidateTrace: {
          candidateId: 9,
          state: 'promoted',
        },
      },
      notes: 'Need the transportation lead instead',
    });
    expect(toastSuccess).toHaveBeenCalledWith('Outcome logged. Next: Replace the contact before the next send');
    await waitFor(() => {
      expect(mockedRefresh).toHaveBeenCalled();
    });
    expect(toastError).not.toHaveBeenCalled();
  });
});
