'use client';

/** UX-04: the dogfood Note on the account workspace, inline in the tools row (the fixed pill is hidden there). */
import { openFeedback } from '@/components/gap/feedback-button';

export function NoteControl() {
  return (
    <button type="button" className="inline-flex min-h-11 items-center px-1 underline" onClick={() => openFeedback()} data-testid="now-note">
      Note
    </button>
  );
}
