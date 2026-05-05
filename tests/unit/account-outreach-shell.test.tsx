import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountOutreachShell } from '@/components/accounts/account-outreach-shell';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION } from '@/lib/revops/cold-outbound-policy';

vi.mock('@/lib/agent-actions/telemetry', () => ({
  recordWorkflowMetric: vi.fn(async () => undefined),
}));

describe('AccountOutreachShell', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderShell() {
    return render(
      <AccountOutreachShell
        accountName="Boston Beer Company"
        open
        onOpenChange={() => {}}
        recommendedAngle="Lead with gate-to-dock variance and service pressure."
        whyNow="Dock pressure is increasing."
        recipients={[
          {
            id: 7,
            name: 'Taylor Lane',
            email: 'taylor@example.com',
            title: 'VP Operations',
            readiness: {
              score: 91,
              tier: 'high',
              stale: false,
              freshness_days: 2,
              reasons: [],
            },
          },
        ]}
        recipientSets={[
          {
            key: 'operators',
            label: 'Operator Set',
            description: 'Recommended operator contacts',
            count: 1,
            recipientIds: [7],
            recommended: true,
          },
        ]}
        initialSelectedRecipientIds={[7]}
        defaultRecipientSetKey="operators"
        assets={[
          {
            id: 42,
            content: '{"headline":"Boston Beer Company one-pager","subheadline":"Dock pressure","painPoints":["Queue variability"],"solutionSteps":[{"step":1,"title":"Gate Check-in","description":"Standard intake"}],"outcomes":["Reduce dwell volatility"],"proofStats":[{"value":"24","label":"Facilities Live"},{"value":">200","label":"Contracted Network"},{"value":"NEUTRAL","label":"Headcount Impact"},{"value":"48→24","label":"Avg. Drop & Hook (min)"},{"value":"$1M+","label":"Per-site Profit Lift"}],"customerQuote":"Illustrative quote.","bestFit":"Strong fit.","publicContext":"","suggestedNextStep":"If useful, I can send the short version."}',
            content_type: 'one_pager',
            version: 3,
            created_at: new Date('2026-05-05T00:00:00.000Z'),
            provider_used: 'ai_gateway',
            version_metadata: {
              prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
              cta_mode: 'scorecard_reply',
              generation_input_contract: {
                signals: [{ title: 'Dock pressure' }],
                recommended_contacts: [{ name: 'Taylor Lane' }],
                committee_gaps: [],
                freshness: { status: 'fresh', stale: false },
              },
              agentContext: { status: 'ok' },
              provenance: {
                scoped_account_names: ['Boston Beer Company', 'The Boston Beer Company'],
              },
            },
          },
        ]}
      />,
    );
  }

  it('opens with the recommended asset and lets the user reset edited state', async () => {
    renderShell();

    expect(screen.getByText(/Outreach Shell/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('yard network scorecard for Boston Beer Company')).toBeInTheDocument();
    expect(screen.getByText(/Signals used: 1/i)).toBeInTheDocument();

    const subject = screen.getByLabelText('Subject');
    fireEvent.change(subject, { target: { value: 'custom subject' } });
    expect(screen.getByDisplayValue('custom subject')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByDisplayValue('yard network scorecard for Boston Beer Company')).toBeInTheDocument();
  });

  it('sends account-page compose payloads with workflow metadata and generated content linkage', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, sent: 1, failed: 0, total: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderShell();
    fireEvent.click(screen.getByRole('button', { name: /Send to 1 Recipient/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/email/send-bulk', expect.objectContaining({
        method: 'POST',
      }));
    });

    const [, request] = fetchMock.mock.calls[0] as [string, { body: string }];
    const payload = JSON.parse(request.body);
    expect(payload.generatedContentId).toBe(42);
    expect(payload.workflowMetadata).toMatchObject({
      surface: 'account_page',
      shell: 'account_outreach',
      variant: 'one_pager_asset',
      recipientSetKey: 'operators',
      selectedRecipientIds: [7],
      assetId: 42,
      assetVersion: 3,
    });
    expect(payload.recipients).toEqual([
      expect.objectContaining({
        personaId: 7,
        personaName: 'Taylor Lane',
        to: 'taylor@example.com',
      }),
    ]);
    expect(await screen.findByText(/Send result: 1 sent, 0 failed, 1 total/i)).toBeInTheDocument();
  });

  it('queues multi-recipient asset sends through the async send-job route', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          job: { id: 901, status: 'pending', total_recipients: 2 },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValue(
        new Response(JSON.stringify({
          success: true,
          recipientCounts: {},
          job: {
            id: 901,
            status: 'pending',
            experiment: null,
            total_recipients: 2,
            sent_count: 0,
            failed_count: 0,
            skipped_count: 0,
            recipients: [],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    render(
      <AccountOutreachShell
        accountName="Boston Beer Company"
        open
        onOpenChange={() => {}}
        recipients={[
          {
            id: 7,
            name: 'Taylor Lane',
            email: 'taylor@example.com',
            readiness: {
              score: 91,
              tier: 'high',
              stale: false,
              freshness_days: 2,
              reasons: [],
            },
          },
          {
            id: 8,
            name: 'Alex Ops',
            email: 'alex@example.com',
            readiness: {
              score: 88,
              tier: 'high',
              stale: false,
              freshness_days: 2,
              reasons: [],
            },
          },
        ]}
        recipientSets={[{
          key: 'operators',
          label: 'Operator Set',
          description: 'Recommended operator contacts',
          count: 2,
          recipientIds: [7, 8],
          recommended: true,
        }]}
        initialSelectedRecipientIds={[7, 8]}
        defaultRecipientSetKey="operators"
        assets={[{
          id: 42,
          content: '{"headline":"Boston Beer Company one-pager","subheadline":"Dock pressure","painPoints":["Queue variability"],"solutionSteps":[{"step":1,"title":"Gate Check-in","description":"Standard intake"}],"outcomes":["Reduce dwell volatility"],"proofStats":[{"value":"24","label":"Facilities Live"},{"value":">200","label":"Contracted Network"},{"value":"NEUTRAL","label":"Headcount Impact"},{"value":"48→24","label":"Avg. Drop & Hook (min)"},{"value":"$1M+","label":"Per-site Profit Lift"}],"customerQuote":"Illustrative quote.","bestFit":"Strong fit.","publicContext":"","suggestedNextStep":"If useful, I can send the short version."}',
          content_type: 'one_pager',
          version: 3,
          created_at: new Date('2026-05-05T00:00:00.000Z'),
          provider_used: 'ai_gateway',
          version_metadata: {
            prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
            cta_mode: 'scorecard_reply',
            generation_input_contract: {
              signals: [{ title: 'Dock pressure' }],
              recommended_contacts: [{ name: 'Taylor Lane' }, { name: 'Alex Ops' }],
              committee_gaps: [],
              freshness: { status: 'fresh', stale: false },
            },
            agentContext: { status: 'ok' },
          },
        }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Send to 2 Recipients/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/email/send-bulk-async', expect.objectContaining({
        method: 'POST',
      }));
    });

    const [, request] = fetchMock.mock.calls[0] as [string, { body: string }];
    const payload = JSON.parse(request.body);
    expect(payload.workflowMetadata).toMatchObject({
      surface: 'account_page',
      shell: 'account_outreach',
      variant: 'one_pager_asset',
      recipientSetKey: 'operators',
    });
    expect(payload.items[0].generatedContentId).toBe(42);
    expect(await screen.findByText(/Account Page Send Job #901/i)).toBeInTheDocument();
  });
});
