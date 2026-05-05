import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnePageSendDialog } from '@/components/email/one-pager-send-dialog';

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: vi.fn(),
  },
}));

function renderDialog() {
  render(
    <OnePageSendDialog
      accountName="Acme Foods"
      generatedContentId={42}
      generatedContent={{
        account_name: 'Acme Foods',
        content: '<p>Hello</p>',
        version: 1,
        provider_used: 'ai_gateway',
        quality: {
          score: 90,
          scores: {
            clarity: 90,
            personalization: 90,
            cta_strength: 90,
            compliance_risk: 5,
            deliverability_risk: 5,
          },
          flags: [],
          fixes: [],
          blockedByThreshold: false,
        },
        campaign_type: 'trade_show',
        checklist: {
          complete: true,
          requiredComplete: 5,
          requiredTotal: 5,
          missingRequired: [],
        },
        checklist_completed_item_ids: [
          'clear_value_prop',
          'account_specific_proof',
          'cta_specific',
          'compliance_checked',
          'deliverability_checked',
        ],
      }}
      recipients={[{
        id: 1,
        name: 'Pat Brewer',
        email: 'pat@example.com',
        readiness: {
          score: 90,
          tier: 'high',
          stale: false,
          freshness_days: 2,
          reasons: [],
        },
      }]}
      open
      onOpenChange={() => {}}
    />,
  );
}

describe('OnePageSendDialog send blocker detail', () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  it('surfaces first field-level payload error instead of generic invalid payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/api/email/send-bulk')) {
        return {
          ok: false,
          json: async () => ({
            error: 'Invalid payload',
            code: 'INVALID_PAYLOAD',
            details: {
              fieldErrors: {
                recipients: ['Recipient email is malformed'],
              },
              formErrors: [],
            },
          }),
        } satisfies Partial<Response>;
      }

      return {
        ok: true,
        json: async () => ({}),
      } satisfies Partial<Response>;
    }));

    renderDialog();
    const send = await screen.findByRole('button', { name: /Send to 1 Recipient/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Send error: recipients: Recipient email is malformed');
    });
  });

  it('surfaces skipped-recipient reason when no recipients remain sendable', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/api/email/send-bulk')) {
        return {
          ok: false,
          json: async () => ({
            error: 'No sendable recipients available.',
            code: 'NO_SENDABLE_RECIPIENTS',
            skipped: [
              { to: 'pat@example.com', reason: 'Recipient explicitly unsubscribed' },
            ],
          }),
        } satisfies Partial<Response>;
      }

      return {
        ok: true,
        json: async () => ({}),
      } satisfies Partial<Response>;
    }));

    renderDialog();
    const send = await screen.findByRole('button', { name: /Send to 1 Recipient/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Send error: pat@example.com: Recipient explicitly unsubscribed');
    });
  });
});
