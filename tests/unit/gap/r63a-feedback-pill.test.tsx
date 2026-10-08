/**
 * R63-A S12: the floating "Note" is feedback about the app, not a note on an account, and it covered the email body at
 * 1280 px. It is called Feedback everywhere (the pill, the account's tools row, the dialog) and sits in the page flow
 * at every width, so it covers nothing.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/gap/preview/h1', useSearchParams: () => new URLSearchParams('') }));
import { FeedbackButton } from '@/components/gap/feedback-button';
import { NoteControl } from '@/components/gap/note-control';

describe('R63-A S12: Feedback, in the flow', () => {
  it('the pill says Feedback, is never fixed at any width, and opens "Feedback about GAP"', () => {
    render(<FeedbackButton />);
    const pill = screen.getByTestId('feedback-open');
    expect(pill).toHaveTextContent(/^Feedback$/);
    expect(pill).toHaveAccessibleName('Send feedback about GAP');
    expect(pill.className.split(/\s+/).filter((t) => /(^|:)(fixed|absolute|sticky)$/.test(t))).toEqual([]);
    fireEvent.click(pill);
    expect(screen.getByRole('dialog', { name: 'Feedback about GAP' })).toHaveTextContent('Save feedback');
  });

  it('the account workspace control says Feedback, never Note', () => {
    render(<NoteControl />);
    expect(screen.getByTestId('now-note')).toHaveTextContent(/^Feedback$/);
  });
});
