'use client';

/**
 * THE PREPARED ANSWER TO A REPLY (GAP OS execution recovery, R42b): loaded when the seller asks for it, then edited in
 * place. It shows what they asked, the editable text (any "[Fill in: ...]" placeholder is what GAP could not answer),
 * what GAP can cite with its trust word, the missing information, and three DISTINCT actions with their states:
 * copy the text (recorded, nothing leaves GAP), save it as a Gmail draft in their thread (not sent), and send it
 * (a preview of exactly what leaves, then CONFIRM + SEND). Every gate re-runs on the server at each press.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PreparedAnswer } from '@/lib/gap/replies/answer';
import { unfilledPlaceholders } from '@/lib/gap/replies/answer';
import type { ReplyStates } from '@/lib/gap/execution/seller-reply';
import { refreshNow } from '@/components/gap/refresh-now';

const SMALL = 'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)] disabled:opacity-60 sm:min-h-9';
const PRIMARY = 'inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60 sm:min-h-9';
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

interface Loaded {
  answer: PreparedAnswer;
  states: ReplyStates;
  blocked: { reason: string; detail: string | null } | null;
}

interface Preview {
  from: string;
  to: string;
  subject: string;
  body: string;
  contentHash: string;
}

async function call(messageId: string, method: 'GET' | 'POST', body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const res = await fetch(`/api/gap/replies/${encodeURIComponent(messageId)}/answer`, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: 'no connection' } };
  }
}

/** The answer's states in words: three distinct facts, never collapsed. */
export function stateLines(s: ReplyStates): string[] {
  return [
    ...(s.copied ? [`Copied ${when(s.copied.at)} (not sent).`] : []),
    ...(s.drafted ? [`Saved as a Gmail draft ${when(s.drafted.at)} (not sent: send or delete it in Gmail).`] : []),
    ...(s.sent ? [`Sent ${when(s.sent.at)} in their thread.`] : []),
    ...(s.openClaim && !s.sent ? ['A send or draft was started and has no outcome on record: check Gmail before trying again.'] : []),
  ];
}

export function ReplyAnswer({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  async function load() {
    setBusy(true);
    const r = await call(messageId, 'GET');
    setBusy(false);
    if (!r.ok) {
      setStatus(`Could not prepare it: ${String(r.data.error ?? 'unknown')}.`);
      return;
    }
    const l = r.data as unknown as Loaded;
    setLoaded(l);
    setText(l.answer.body);
  }
  async function act(op: 'copied' | 'draft' | 'send', confirm?: Preview) {
    setBusy(true);
    setStatus(null);
    if (op === 'copied') {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        setBusy(false);
        setStatus('Could not copy: select the text and copy it.');
        return;
      }
    }
    const r = await call(messageId, 'POST', { op, body: text, ...(confirm ? { confirm: { contentHash: confirm.contentHash, recipient: confirm.to } } : {}) });
    setBusy(false);
    if (!r.ok) {
      setStatus(`Not done: ${String(r.data.detail ?? r.data.error ?? 'refused')}`);
      return;
    }
    if (op === 'send' && !confirm && r.data.preview) {
      setPreview(r.data.preview as Preview);
      return;
    }
    setPreview(null);
    setStatus(op === 'copied' ? 'Copied. Nothing was sent.' : op === 'draft' ? 'Saved as a Gmail draft in their thread. Nothing was sent.' : r.data.alreadySent ? 'Already sent: nothing went out twice.' : 'Sent in their thread.');
    const again = await call(messageId, 'GET');
    if (again.ok) setLoaded(again.data as unknown as Loaded);
    refreshNow(router);
  }

  if (!loaded) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="reply-answer-start">
        <button type="button" className={SMALL} disabled={busy} onClick={() => void load()} data-testid="reply-answer-prepare">
          Prepare the answer
        </button>
        {status ? <span role="status" className="text-xs">{status}</span> : null}
      </div>
    );
  }
  const a = loaded.answer;
  if (a.status === 'none') {
    return <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="reply-answer-none">{a.why}</p>;
  }
  const blocked = loaded.blocked;
  const left = unfilledPlaceholders(text);
  const canAct = !blocked && a.status === 'ready';
  return (
    <div className="space-y-2" data-testid="reply-answer" data-status={a.status}>
      {a.asks.length ? (
        <ul className="list-disc pl-5 text-xs" data-testid="reply-answer-asks" aria-label="What they asked">
          {a.asks.map((x, n) => <li key={n}>They asked: &ldquo;{x.text}&rdquo;</li>)}
        </ul>
      ) : null}
      <label className="block text-xs font-semibold" htmlFor={`reply-answer-${messageId}`}>Your answer to {a.to} ({a.subject}), prepared, not sent: edit it</label>
      <textarea id={`reply-answer-${messageId}`} className="min-h-40 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} data-testid="reply-answer-text" rows={Math.min(16, text.split('\n').length + 2)} />
      {a.missing.length ? (
        <div data-testid="reply-answer-missing">
          <p className="text-xs font-semibold">Missing information (GAP will not guess it)</p>
          <ul className="list-disc pl-5 text-xs">{a.missing.map((m, n) => <li key={n}>{m}</li>)}</ul>
        </div>
      ) : null}
      {a.known.length ? (
        <div data-testid="reply-answer-known">
          <p className="text-xs font-semibold">What GAP can cite</p>
          <ul className="space-y-0.5 text-xs">
            {a.known.map((k, n) => (
              <li key={n} data-trust={k.trust}>
                <span className="mr-1 rounded bg-[var(--muted)] px-1 text-[10px] font-semibold uppercase tracking-wide">{k.trust}</span>
                {k.href ? <a className="underline" href={k.href} target="_blank" rel="noreferrer">{k.text}</a> : k.text}
                {k.source ? <span className="text-[var(--muted-foreground)]"> ({k.source})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {a.dependency ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="reply-answer-dependency">Partial: drafting and sending from GAP need {a.dependency}</p> : null}
      {blocked ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="reply-answer-blocked">{blocked.detail ?? blocked.reason}</p> : null}
      {left.length ? <p className="text-xs" data-testid="reply-answer-placeholders">{left.length} part{left.length === 1 ? '' : 's'} still to fill in before a draft or a send.</p> : null}
      <ul className="text-xs" data-testid="reply-answer-states">{stateLines(loaded.states).map((l) => <li key={l}>{l}</li>)}</ul>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={SMALL} disabled={busy || !text.trim() || (!!blocked && blocked.reason !== 'newer_message')} onClick={() => void act('copied')} data-testid="reply-answer-copy">Copy the text</button>
        <button type="button" className={SMALL} disabled={busy || !canAct || left.length > 0 || !!loaded.states.sent} onClick={() => void act('draft')} data-testid="reply-answer-draft">Save as a Gmail draft</button>
        <button type="button" className={PRIMARY} disabled={busy || !canAct || left.length > 0 || !!loaded.states.sent || !!loaded.states.drafted} onClick={() => void act('send')} data-testid="reply-answer-send">Send from GAP</button>
        {status ? <span role="status" className="text-xs" data-testid="reply-answer-status">{status}</span> : null}
      </div>
      {preview ? (
        <div className="space-y-1 rounded-md border border-[var(--border)] p-2 text-xs" data-testid="reply-answer-preview">
          <p>From {preview.from} to {preview.to}</p>
          <p>Subject: {preview.subject}</p>
          <pre className="whitespace-pre-wrap break-words font-sans">{preview.body}</pre>
          <div className="flex gap-2">
            <button type="button" className={PRIMARY} disabled={busy} onClick={() => void act('send', preview)} data-testid="reply-answer-confirm">Confirm and send</button>
            <button type="button" className={SMALL} onClick={() => setPreview(null)}>Not yet</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
