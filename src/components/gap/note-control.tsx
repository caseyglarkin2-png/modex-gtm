'use client';

/** UX-04: the dogfood feedback on the account workspace, inline in the tools row. R63-A S12: called Feedback (it is about the app, not an account note). */
import { openFeedback } from '@/components/gap/feedback-button';

export function NoteControl() {
  return (
    <button type="button" className="inline-flex min-h-11 items-center px-1 underline" onClick={() => openFeedback()} data-testid="now-note">
      Feedback
    </button>
  );
}
