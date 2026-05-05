import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GeneratedContentPreviewDialog } from '@/components/generated-content/generated-content-preview-dialog';

describe('GeneratedContentPreviewDialog', () => {
  it('renders account/version labels and previewed content when open', () => {
    render(
      <GeneratedContentPreviewDialog
        accountName="Acme Foods"
        version={3}
        providerUsed="ai_gateway"
        content="Hello preview"
        open
      />,
    );

    expect(screen.getByText('Acme Foods • v3')).toBeInTheDocument();
    expect(screen.getByText('Provider: ai_gateway')).toBeInTheDocument();
    expect(screen.getByText('Plain text')).toBeInTheDocument();
    expect(screen.getByText('Hello preview')).toBeInTheDocument();
  });

  it('does not show direct send for preview-only asset types', () => {
    render(
      <GeneratedContentPreviewDialog
        accountName="Acme Foods"
        version={2}
        providerUsed="ai_gateway"
        content="Meeting prep content"
        contentType="meeting_prep"
        recipients={[
          { id: 1, name: 'Taylor Lane', email: 'taylor@example.com' },
        ]}
        open
      />,
    );

    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('keeps raw payload hidden by default for machine-shaped content', async () => {
    render(
      <GeneratedContentPreviewDialog
        accountName="Acme Foods"
        version={1}
        providerUsed="ai_gateway"
        content='{"raw":true,"payload":"hello"}'
        open
      />,
    );

    expect(screen.getByText(/does not have a clean human-readable render yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/\{"raw":true,"payload":"hello"\}/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /View raw payload/i }));
    expect(screen.getByText(/\{"raw":true,"payload":"hello"\}/i)).toBeInTheDocument();
  });

  it('renders provenance and context-used metadata when version metadata is present', () => {
    render(
      <GeneratedContentPreviewDialog
        accountName="Boston Beer Company"
        version={4}
        providerUsed="ai_gateway"
        content="Hello preview"
        promptPolicyVersion="cold-outbound-v2"
        versionMetadata={{
          prompt_policy_version: 'cold-outbound-v2',
          cta_mode: 'scorecard_reply',
          generation_input_contract: {
            signals: [{ title: 'Dock pressure' }, { title: 'Queue volatility' }],
            recommended_contacts: [{ name: 'Taylor Lane' }],
            committee_gaps: ['Finance'],
            freshness: { status: 'aging', stale: false },
          },
          provenance: {
            scoped_account_names: ['Boston Beer Company', 'The Boston Beer Company'],
          },
          agentContext: { status: 'ok' },
        }}
        open
      />,
    );

    expect(screen.getByText('Policy cold-outbound-v2')).toBeInTheDocument();
    expect(screen.getByText('CTA scorecard reply')).toBeInTheDocument();
    expect(screen.getByText('aging')).toBeInTheDocument();
    expect(screen.getByText('Live intel')).toBeInTheDocument();
    expect(screen.getByText('2 signals')).toBeInTheDocument();
    expect(screen.getByText('1 contacts')).toBeInTheDocument();
    expect(screen.getByText('1 committee gaps')).toBeInTheDocument();
    expect(screen.getByText('Scope: Boston Beer Company, The Boston Beer Company')).toBeInTheDocument();
  });
});
