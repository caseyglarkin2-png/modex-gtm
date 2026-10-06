'use client';

/**
 * ASK GAP (UX-13): a read-only question box on the account page. It answers from the story, the state and the
 * people on this page only, keeps the trust words, says when GAP does not know, and names the control when asked to
 * act. It never acts. Typed only here (push-to-talk rides on Dictate later if the seller asks for it).
 */
import { useState } from 'react';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;

const EXAMPLES = ['Why this person over the next one?', 'Who else here owns transportation?', 'What do we already know from them?', 'Give me the 60-second story.', 'What do we still need to learn?'];

export function AskGap({ accountName }: { accountName: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; grounded: boolean; provider: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch('/api/gap/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, question: text }) });
      const body = (await res.json().catch(() => ({}))) as { answer?: string; grounded?: boolean; provider?: string | null; error?: string; detail?: string };
      if (!res.ok || !body.answer) {
        setError(body.error === 'no_provider' ? 'No AI provider answered just now. The page above still holds everything GAP knows.' : `Could not ask (${body.error ?? res.status}).`);
        return;
      }
      setAnswer({ text: body.answer, grounded: body.grounded !== false, provider: body.provider ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid="ask-gap" aria-labelledby="ask-gap-heading">
      <h2 id="ask-gap-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Ask GAP about {accountName}</h2>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
          <span>Your question (GAP answers from this page only; it cannot act)</span>
          <input type="text" value={question} maxLength={400} className="min-h-11 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm" placeholder={EXAMPLES[0]} onChange={(e) => setQuestion(e.target.value)} data-testid="ask-gap-input" />
        </label>
        <button type="submit" className={PRIMARY} disabled={busy || !question.trim()} data-testid="ask-gap-submit">{busy ? 'Asking...' : 'Ask'}</button>
      </form>
      <div className="flex flex-wrap gap-1.5" aria-label="Example questions">
        {EXAMPLES.slice(1).map((q) => (
          <button key={q} type="button" className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]" disabled={busy} onClick={() => { setQuestion(q); void ask(q); }} data-testid="ask-gap-example">
            {q}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" data-testid="ask-gap-answer" className="text-sm">
        {busy ? <span className="text-xs text-[var(--muted-foreground)]">Reading the page for you...</span> : null}
        {answer ? (
          <>
            <p className="whitespace-pre-wrap">{answer.text}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{answer.grounded ? 'From the story, the state and the people above. Trust words are theirs: the buyer said, checked, our read, unknown.' : 'Nothing was sent or changed.'}</p>
          </>
        ) : null}
      </div>
      {error ? <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="ask-gap-error">{error}</p> : null}
    </section>
  );
}
