import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentDiffDialog } from '@/components/generated-content/content-diff-dialog';

describe('ContentDiffDialog', () => {
  it('renders side-by-side diff rows', async () => {
    render(
      <ContentDiffDialog
        accountName="General Mills"
        oldVersion={1}
        oldContent={'Intro line\nCTA one'}
        newVersion={2}
        newContent={'Intro line\nCTA two'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Diff v1 to v2/i }));
    expect(await screen.findByText(/General Mills content diff/i)).toBeInTheDocument();
    expect(screen.getByText('CTA one')).toBeInTheDocument();
    expect(screen.getByText('CTA two')).toBeInTheDocument();
  });
});
