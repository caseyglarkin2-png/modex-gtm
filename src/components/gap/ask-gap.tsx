'use client';

/**
 * ASK GAP (UX-13): a question box on the account page. It answers from the story, the state and the people on this
 * page only, keeps the trust words, says when GAP does not know, and names the control when asked to act. Typed only
 * here (push-to-talk rides on Dictate later if the seller asks for it).
 *
 * R35: a request to PREPARE something comes back with ONE proposal, rendered as a button that calls the EXISTING
 * route with the exact payload the page's own control would send (the opening story's draft, the research plan's
 * deepen), or a link to the control that already does it. The press is the seller's; the route runs its own gates.
 * Ask GAP itself never sends, enrolls, chooses, spends, suppresses or writes the CRM, and never writes copy.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AskProposal } from '@/lib/gap/ask/proposal';
import { refreshNow } from '@/components/gap/refresh-now';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;

const EXAMPLES = ['Why this person over the next one?', 'Who else here owns transportation?', 'What do we already know from them?', 'Give me the 60-second story.', 'What do we still need to learn?', 'Help me approach this person.'];

/** Plain words for the draft and deepen routes' answers (their own stable codes). */
function draftResult(body: { preparation?: string; detail?: string; error?: string; submitRefusal?: string | null }, ok: boolean): { kind: 'status' | 'alert'; text: string } {
  // Item 2: a set-aside or closed story says why; it is never reported as under review.
  if (!ok && (body.error === 'story_set_aside' || body.error === 'story_closed')) return { kind: 'alert', text: `Not drafted: ${body.detail ?? 'this story was set aside'} Nothing changed.` };
  if (!ok) return { kind: 'alert', text: body.error === 'fact_not_outreach_evidence' ? `Not drafted: the send gate would refuse this fact (${body.detail ?? body.error}). Nothing changed.` : `Not drafted (${body.detail ?? body.error ?? 'refused'}). Nothing changed.` };
  if (body.preparation === 'submitted') return { kind: 'status', text: 'Drafted and under review on this page. Approve it there and the opening is prepared. Nothing is sent.' };
  if (body.preparation === 'incomplete') return { kind: 'status', text: 'Drafted. One thing is missing: which problem it points at. Choose it on this page and it goes to review. Nothing is sent.' };
  if (body.preparation === 'in_use') return { kind: 'status', text: 'This story is already approved and in use on this page: nothing new was drafted. Nothing is sent.' };
  return { kind: 'status', text: `Drafted, not yet submitted${body.submitRefusal ? ` (${body.submitRefusal})` : ''}. Nothing is sent.` };
}

function ProposalControl({ proposal }: { proposal: AskProposal }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  if (proposal.kind === 'open_control') {
    return (
      <a href={proposal.href} className={OUTLINE} data-testid="ask-gap-proposal" data-kind="open_control">
        {proposal.label}
      </a>
    );
  }
  async function run() {
    if (proposal.kind === 'open_control') return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(proposal.route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(proposal.payload) });
      const body = (await res.json().catch(() => ({}))) as { preparation?: string; detail?: string; error?: string; reason?: string; submitRefusal?: string | null; sectionOutcome?: string; outcome?: string };
      if (proposal.kind === 'draft_thesis') setResult(draftResult(body, res.ok));
      else setResult(res.ok ? { kind: 'status', text: `Research ran: ${body.sectionOutcome ?? body.outcome ?? 'done'}. The page refreshes with what it found. Nothing is sent.` } : { kind: 'alert', text: `Not run: ${body.reason ?? body.error ?? res.status}. Nothing changed.` });
      if (res.ok) refreshNow(router);
    } catch (e) {
      setResult({ kind: 'alert', text: `${e instanceof Error ? e.message : 'network error'}. Reopen the page before trying again.` });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-1">
      <button type="button" className={PRIMARY} disabled={busy || result?.kind === 'status'} onClick={() => void run()} data-testid="ask-gap-proposal" data-kind={proposal.kind}>
        {busy ? 'Working...' : proposal.label}
      </button>
      {result ? (
        <p role={result.kind} className={`text-xs ${result.kind === 'alert' ? 'text-red-700 dark:text-red-400' : ''}`} data-testid="ask-gap-proposal-result">
          {result.text}
        </p>
      ) : null}
    </div>
  );
}

export function AskGap({ accountName }: { accountName: string }) {
  // One box: open on a desktop, behind one line on a phone (a third of the screen there).
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      setOpen(window.matchMedia('(min-width: 640px)').matches);
    } catch {
      /* keep open */
    }
  }, []);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; grounded: boolean; provider: string | null; proposal: AskProposal | null } | null>(null);
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
      const body = (await res.json().catch(() => ({}))) as { answer?: string; grounded?: boolean; provider?: string | null; proposal?: AskProposal | null; error?: string; detail?: string };
      if (!res.ok || !body.answer) {
        setError(body.error === 'no_provider' ? 'No AI provider answered just now. The page above still holds everything GAP knows.' : `Could not ask (${body.error ?? res.status}).`);
        return;
      }
      setAnswer({ text: body.answer, grounded: body.grounded !== false, provider: body.provider ?? null, proposal: body.proposal ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} className="group rounded-md border border-[var(--border)] p-3" data-testid="ask-gap">
      <summary className="min-h-11 cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] marker:content-none" id="ask-gap-heading">Ask GAP about {accountName} <span className="ml-1 font-normal normal-case group-open:hidden">(show)</span></summary>
      <div className="mt-2 space-y-2">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
          <span>Your question (GAP answers from this page; asked to prepare something, it offers the page&apos;s own control)</span>
          <input type="text" value={question} maxLength={400} className="min-h-11 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm" placeholder={EXAMPLES[0]} onChange={(e) => setQuestion(e.target.value)} data-testid="ask-gap-input" />
        </label>
        <button type="submit" className={PRIMARY} disabled={busy || !question.trim()} data-testid="ask-gap-submit">{busy ? 'Asking...' : 'Ask'}</button>
      </form>
      <div className="flex flex-wrap gap-1.5" aria-label="Example questions">
        {EXAMPLES.slice(1).map((q) => (
          <button key={q} type="button" className="min-h-11 rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] sm:min-h-8" disabled={busy} onClick={() => { setQuestion(q); void ask(q); }} data-testid="ask-gap-example">
            {q}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" data-testid="ask-gap-answer" className="text-sm">
        {busy ? <span className="text-xs text-[var(--muted-foreground)]">Reading the page for you...</span> : null}
        {answer ? (
          <>
            <p className="whitespace-pre-wrap">{answer.text}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{answer.grounded ? 'From the story, the state and the people above. Trust words are theirs: the buyer said, checked, our read, unknown.' : answer.proposal ? 'The button runs the page\'s own control, with its own checks. Nothing was sent or changed yet.' : 'Nothing was sent or changed.'}</p>
          </>
        ) : null}
      </div>
      {answer?.proposal ? <ProposalControl key={JSON.stringify(answer.proposal)} proposal={answer.proposal} /> : null}
      {error ? <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="ask-gap-error">{error}</p> : null}
      </div>
    </details>
  );
}
