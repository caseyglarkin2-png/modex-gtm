/**
 * Phase 2 final review P1 (UX lens): capture on a phone with a dropped
 * connection never freezes on "Saving..." and never loses the note.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaptureFlow } from '@/components/gap/capture-flow';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('<CaptureFlow> offline', () => {
  it('a failed save says so, re-enables Save, and keeps the note on the phone', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    render(<CaptureFlow />);
    fireEvent.change(screen.getByTestId('capture-text'), { target: { value: 'Maria: The detention charges from carriers are killing us.' } });
    fireEvent.click(screen.getByTestId('capture-save'));
    await waitFor(() => expect(screen.getByText(/no connection\. Your note is kept on this phone/)).toBeInTheDocument());
    expect(screen.getByTestId('capture-save')).not.toBeDisabled();
    expect(window.localStorage.getItem('gap-capture-unsaved-note')).toBe('Maria: The detention charges from carriers are killing us.');
  });

  it('a reload brings the unsaved note back', async () => {
    window.localStorage.setItem('gap-capture-unsaved-note', 'Maria: We walk the yard with a clipboard.');
    render(<CaptureFlow />);
    await waitFor(() => expect(screen.getByTestId('capture-text')).toHaveValue('Maria: We walk the yard with a clipboard.'));
  });
});
