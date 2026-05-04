import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkPreviewDialog, type BulkPreviewItem } from '@/components/generated-content/bulk-preview-dialog';

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

const guardedItems: BulkPreviewItem[] = [
  {
    accountName: 'Acme Logistics',
    generatedContentId: 42,
    version: 1,
    providerUsed: 'ai_gateway',
    campaignType: 'trade_show',
    latestVersion: 2,
    pendingJobs: 1,
    processingJobs: 0,
    content: '<p>Generated body</p>',
    checklist: {
      complete: true,
      requiredComplete: 5,
      requiredTotal: 5,
      missingRequired: [],
    },
    checklistCompletedItemIds: [
      'clear_value_prop',
      'account_specific_proof',
      'cta_specific',
      'compliance_checked',
      'deliverability_checked',
    ],
    recipients: [{
      id: 1,
      name: 'Ops Lead',
      email: 'ops@acme.com',
      readiness: {
        score: 90,
        tier: 'high',
        stale: false,
        freshness_days: 6,
        reasons: [],
      },
    }],
  },
];

describe('BulkPreviewDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, job: { id: 91 } }),
    }));
  });

  it('requires guard acknowledgement before enabling async queue action', async () => {
    render(<BulkPreviewDialog items={guardedItems} />);

    fireEvent.click(screen.getByRole('button', { name: /Bulk Preview & Queue Send/i }));
    const queueButton = await screen.findByRole('button', { name: 'Queue Async Send Job' });
    expect(queueButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /I acknowledge this warning/i }));

    await waitFor(() => {
      expect(queueButton).toBeEnabled();
    });
  });

  it('enqueues send job and forwards created job id', async () => {
    const onJobCreated = vi.fn();
    render(<BulkPreviewDialog items={guardedItems} onJobCreated={onJobCreated} />);

    fireEvent.click(screen.getByRole('button', { name: /Bulk Preview & Queue Send/i }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /I acknowledge this warning/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Queue Async Send Job' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/email/send-bulk-async', expect.objectContaining({ method: 'POST' }));
    });

    expect(toastSuccess).toHaveBeenCalledWith('Send job #91 queued');
    expect(onJobCreated).toHaveBeenCalledWith(91);
  });

  it('sends experiment payload when experiment builder is enabled', async () => {
    render(<BulkPreviewDialog items={guardedItems} />);

    fireEvent.click(screen.getByRole('button', { name: /Bulk Preview & Queue Send/i }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /I acknowledge this warning/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Enable experiment/i }));

    const queueButton = screen.getByRole('button', { name: 'Queue Async Send Job' });
    expect(queueButton).toBeEnabled();
    fireEvent.click(queueButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const call = vi.mocked(fetch).mock.calls.at(-1);
    const body = JSON.parse(String(call?.[1] && (call[1] as { body?: string }).body));
    expect(body.experiment).toBeDefined();
    expect(body.experiment.variants).toHaveLength(2);
    expect(body.experiment.primaryMetric).toBe('reply_rate');
  });

  it('queues only sendable recipients after readiness filtering', async () => {
    render(<BulkPreviewDialog items={[{
      ...guardedItems[0],
      recipients: [
        guardedItems[0].recipients[0],
        {
          id: 2,
          name: 'Low Fit',
          email: 'lowfit@acme.com',
          readiness: {
            score: 40,
            tier: 'low',
            stale: true,
            freshness_days: 90,
            reasons: ['Low contact confidence'],
          },
        },
      ],
    }]} />);

    fireEvent.click(screen.getByRole('button', { name: /Bulk Preview & Queue Send/i }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /I acknowledge this warning/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Queue Async Send Job' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const call = vi.mocked(fetch).mock.calls.at(-1);
    const body = JSON.parse(String(call?.[1] && (call[1] as { body?: string }).body));
    expect(body.items[0].recipients).toEqual([
      expect.objectContaining({ to: 'ops@acme.com' }),
    ]);
  });
});
