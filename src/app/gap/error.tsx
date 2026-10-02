'use client';
/**
 * A GAP page that could not render. It renders inside the GAP layout, so the Note button is still here, and REPORT
 * THIS carries the error digest (never the error text or stack).
 */
import { ReportThis } from '@/components/gap/feedback-button';

export default function GapError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4" role="alert" data-testid="gap-error">
      <h1 className="text-lg font-semibold">This GAP page could not load.</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Nothing was changed. Try again; if it keeps happening, report it.
        <ReportThis errorCode={error.digest ? `page_error:${error.digest}` : 'page_error'} surface="error" />
      </p>
      <button type="button" onClick={() => reset()} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]">
        Try again
      </button>
    </div>
  );
}
