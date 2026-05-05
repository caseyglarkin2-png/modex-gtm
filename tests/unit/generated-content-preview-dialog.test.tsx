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
});
