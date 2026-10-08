/**
 * R63-B S1: the pack's EMAIL slot for a person who opted out (a "stop" reply on file, recorded or not, or a recorded do
 * not contact). No subject, no body, no "Hi Doug": what happened, that nothing goes to them, and, while it is not
 * recorded, where to record it from their reply.
 */
export function OptedOutEmail({ line, recordHref }: { line: string; recordHref: string | null }) {
  return (
    <section data-testid="opted-out" aria-labelledby="opted-out-heading" className="space-y-2 rounded-md border border-[var(--destructive)] p-4 text-sm">
      <h2 id="opted-out-heading" className="text-xs font-semibold uppercase tracking-wide">
        No email: they opted out
      </h2>
      <p data-testid="opted-out-line">{line}</p>
      {recordHref ? (
        <a href={recordHref} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-sm hover:bg-[var(--muted)]" data-testid="opted-out-record">
          Record it from their reply
        </a>
      ) : null}
    </section>
  );
}
