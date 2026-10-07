/**
 * R63-B S5: the Note panel (role dialog, "What did you notice?") ignored Escape from its textarea and 6 of 15 Tabs left
 * it. Escape now closes it from anywhere inside, Tab and Shift+Tab stay inside, focus returns to what opened it, and
 * closing keeps what was typed (it is there when the panel opens again).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/gap/', useSearchParams: () => new URLSearchParams('') }));
import { FeedbackButton, openFeedback } from '@/components/gap/feedback-button';

describe('R63-B S5: the Note panel for the keyboard', () => {
  it('Escape from the textarea closes it and focus returns to the Note button; what was typed is kept', () => {
    render(<FeedbackButton />);
    const opener = screen.getByTestId('feedback-open');
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Note' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const area = screen.getByTestId('feedback-note');
    expect(document.activeElement).toBe(area);
    fireEvent.change(area, { target: { value: 'The pack page shows Hi Doug.' } });
    expect(dialog.textContent).toContain('Closing keeps your note here until you save it.');
    fireEvent.keyDown(area, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    expect((screen.getByTestId('feedback-note') as HTMLTextAreaElement).value).toBe('The pack page shows Hi Doug.');
  });

  it('Tab and Shift+Tab stay inside the panel', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByTestId('feedback-open'));
    const dialog = screen.getByRole('dialog', { name: 'Note' });
    fireEvent.change(screen.getByTestId('feedback-note'), { target: { value: 'x' } });
    const stops = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), textarea')];
    const first = stops[0];
    const last = stops[stops.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    // Every one of the panel's stops keeps focus inside it.
    for (let k = 0; k < stops.length * 2; k += 1) {
      const at = document.activeElement as HTMLElement;
      fireEvent.keyDown(at, { key: 'Tab' });
      if (document.activeElement === at) stops[(stops.indexOf(at) + 1) % stops.length].focus();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('opened from a Report this link, focus goes back to that link', () => {
    render(
      <>
        <button type="button" data-testid="report" onClick={() => openFeedback({ errorCode: 'x' })}>
          Report this
        </button>
        <FeedbackButton />
      </>,
    );
    const report = screen.getByTestId('report');
    report.focus();
    act(() => report.click());
    fireEvent.keyDown(screen.getByTestId('feedback-note'), { key: 'Escape' });
    expect(document.activeElement).toBe(report);
  });
});
