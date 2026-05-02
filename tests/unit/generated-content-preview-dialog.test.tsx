import { render, screen } from '@testing-library/react';
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
});
