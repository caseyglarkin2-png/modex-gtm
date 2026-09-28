'use client';

/**
 * BUYER TRUTH CAPTURE, phone first (Phase 2 D1-D4).
 *
 * 1. Who: search an account or person (or leave it unlinked with a hint).
 * 2. What kind of conversation: meeting, call, conference, email, LinkedIn.
 * 3. The note: paste notes or a transcript, or dictate with the keyboard mic.
 * Save keeps the raw note exactly as written and shows CANDIDATES: sentences
 * cut verbatim from the note with a proposed type. A candidate is not truth:
 * Casey confirms (optionally relabels), or rejects, each one. Only a confirm
 * records Buyer Input Data. A meeting also gets its outcome.
 * No horizontal scrolling at phone width. Voice: no em dashes.
 */
import { useEffect, useState } from 'react';
import { BID_TYPES } from '@/lib/gap/taxonomy';
import type { CaptureView } from '@/lib/gap/capture/store';
import { buyerSpeakers } from '@/lib/gap/capture/extract';

type Person = { id: number; name: string | null; title: string | null; email?: string | null; account_name?: string };
type Hyp = { id: string; status: string; problem_family: string; primary_persona_id: number | null };
type Context = { people: Person[]; hypotheses: Hyp[] };

const CONTEXTS = [
  ['meeting', 'Meeting'],
  ['call', 'Call'],
  ['conference', 'Conference'],
  ['email', 'Email'],
  ['linkedin', 'LinkedIn'],
] as const;

const OUTCOMES = [
  ['qualified_problem', 'Qualified problem'],
  ['disqualified_problem', 'Disqualified problem'],
  ['more_discovery', 'More discovery required'],
  ['no_decision', 'No decision / administrative'],
  ['next_meeting', 'Next meeting booked'],
] as const;

const words = (s: string) => s.replace(/_/g, ' ');
const input = 'w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-base';
const btn = 'rounded-md border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-60';
const primary = 'rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60';

async function json<T>(res: Response): Promise<T> {
  return ((await res.json().catch(() => ({}))) ?? {}) as T;
}

function useAccountContext(account: string | null): Context | null {
  const [ctx, setCtx] = useState<Context | null>(null);
  useEffect(() => {
    if (!account) {
      setCtx(null);
      return;
    }
    let live = true;
    fetch(`/api/gap/capture/lookup?account=${encodeURIComponent(account)}`)
      .then((r) => json<Context>(r))
      .then((c) => live && setCtx({ people: c.people ?? [], hypotheses: c.hypotheses ?? [] }))
      .catch(() => live && setCtx({ people: [], hypotheses: [] }));
    return () => {
      live = false;
    };
  }, [account]);
  return ctx;
}

function Candidates({ capture, onChange }: { capture: CaptureView; onChange: (c: CaptureView) => void }) {
  const ctx = useAccountContext(capture.accountName);
  // Review D P1: nothing is pre-chosen for Casey unless there is exactly one option.
  const onlyHyp = ctx && ctx.hypotheses.length === 1 ? ctx.hypotheses[0].id : '';
  const [hypothesisId, setHypothesisId] = useState<string>('');
  const multiSpeaker = buyerSpeakers(capture.rawText).length > 1;
  const [speakerOf, setSpeakerOf] = useState<Record<string, number | null>>({});
  const [types, setTypes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const hyp = hypothesisId || onlyHyp;
  const personaFor = (cid: string) => (cid in speakerOf ? speakerOf[cid] : multiSpeaker ? null : capture.personaId);

  async function decide(candidateId: string, decision: 'confirm' | 'reject') {
    setBusy(candidateId);
    setErrors((e) => ({ ...e, [candidateId]: '' }));
    const res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        decision === 'reject'
          ? { op: 'decide', candidateId, decision }
          : { op: 'decide', candidateId, decision, type: types[candidateId], hypothesisId: hyp || undefined, personaId: personaFor(candidateId) ?? undefined },
      ),
    });
    const body = await json<{ ok?: boolean; capture?: CaptureView; error?: string; detail?: string }>(res);
    setBusy(null);
    if (!res.ok || !body.capture) {
      setErrors((e) => ({ ...e, [candidateId]: body.detail ?? body.error ?? `HTTP ${res.status}` }));
      return;
    }
    onChange(body.capture);
  }

  if (capture.candidates.length === 0) return <p className="text-sm text-[var(--muted-foreground)]">No buyer statements stood out. The note is saved as written.</p>;
  return (
    <section className="space-y-3" data-testid="capture-candidates">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Candidate buyer truth (not truth until you confirm)</p>
      {capture.accountName && ctx ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs">
            Thesis it bears on
            <select aria-label="Thesis" className={input} value={hyp} onChange={(e) => setHypothesisId(e.target.value)}>
              <option value="">{ctx.hypotheses.length === 0 ? 'No current thesis at this account' : 'Choose the thesis'}</option>
              {ctx.hypotheses.map((h) => (
                <option key={h.id} value={h.id}>
                  {words(h.problem_family)} ({h.status})
                </option>
              ))}
            </select>
          </label>
          {multiSpeaker ? (
            <p className="text-xs text-amber-700">This note has more than one speaker: choose who said each line.</p>
          ) : null}
        </div>
      ) : null}
      {capture.candidates.map((c) => (
        <article key={c.id} data-testid="capture-candidate" data-state={c.decision?.kind ?? 'candidate'} className="space-y-2 rounded-md border border-[var(--border)] p-3">
          <blockquote className="break-words border-l-2 border-[var(--primary)] pl-2 text-sm">&ldquo;{c.quote}&rdquo;</blockquote>
          {c.speaker ? <p className="text-xs text-[var(--muted-foreground)]">In the note: {c.speaker}</p> : null}
          {c.decision?.kind === 'confirmed' ? (
            <p className="text-xs font-medium text-emerald-700">Confirmed as {words(c.decision.type)}. Recorded as buyer truth.</p>
          ) : c.decision?.kind === 'rejected' ? (
            <p className="text-xs text-[var(--muted-foreground)]">Rejected. Not buyer truth.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--muted-foreground)]">Suggested: {words(c.type)}{c.cues.length ? ` (${c.cues.join(', ')})` : ''}</span>
                <select aria-label="Relabel" className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-xs" value={types[c.id] ?? c.type} onChange={(e) => setTypes((t) => ({ ...t, [c.id]: e.target.value }))}>
                  {BID_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {words(t)}
                    </option>
                  ))}
                </select>
              </div>
              {ctx ? (
                <select aria-label="Who said it" data-testid="candidate-speaker" className={input} value={personaFor(c.id) ?? ''} onChange={(e) => setSpeakerOf((m) => ({ ...m, [c.id]: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">Who said it?</option>
                  {ctx.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name ?? p.email ?? `person ${p.id}`}
                      {p.title ? `, ${p.title}` : ''}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" data-testid="candidate-confirm" disabled={busy === c.id || !capture.accountName || !hyp || personaFor(c.id) == null} onClick={() => void decide(c.id, 'confirm')} className={primary}>
                  ✓ Confirm
                </button>
                <button type="button" data-testid="candidate-reject" disabled={busy === c.id} onClick={() => void decide(c.id, 'reject')} className={btn}>
                  ✕ Reject
                </button>
              </div>
              {errors[c.id] ? (
                <p role="alert" className="text-xs text-[var(--destructive)]">
                  Not recorded: {errors[c.id]}
                </p>
              ) : null}
            </>
          )}
        </article>
      ))}
    </section>
  );
}

function MeetingOutcomeForm({ capture, onChange }: { capture: CaptureView; onChange: (c: CaptureView) => void }) {
  const ctx = useAccountContext(capture.accountName);
  const [outcome, setOutcome] = useState<string>('qualified_problem');
  const [quote, setQuote] = useState('');
  const [objective, setObjective] = useState('');
  const [personaId, setPersonaId] = useState<number | null>(capture.personaId);
  const [error, setError] = useState<string | null>(null);
  // Review D P1: the thesis a meeting tested is Casey's explicit choice (a qualified or disqualified
  // outcome resolves it); only a single current thesis is pre-chosen.
  const [chosenHyp, setChosenHyp] = useState<string>('');
  const hypId = chosenHyp || (ctx && ctx.hypotheses.length === 1 ? ctx.hypotheses[0].id : '');
  const hyp = ctx?.hypotheses.find((h) => h.id === hypId) ?? null;
  if (!capture.accountName || (capture.context !== 'meeting' && capture.context !== 'conference')) return null;
  if (capture.meetings.length) return <p data-testid="meeting-recorded" className="text-sm">Meeting outcome recorded: {words(capture.meetings[0].outcome)}.</p>;

  async function record() {
    setError(null);
    if (!hyp) {
      setError(ctx?.hypotheses.length ? 'Choose the thesis this meeting tested.' : 'There is no current thesis at this account to record the meeting against.');
      return;
    }
    const res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'meeting', outcome, hypothesisId: hyp.id, personaId: personaId ?? undefined, buyerQuote: quote || undefined, nextLearningObjective: objective || undefined }),
    });
    const body = await json<{ capture?: CaptureView; error?: string; detail?: string }>(res);
    if (!res.ok || !body.capture) {
      setError(body.detail ?? body.error ?? `HTTP ${res.status}`);
      return;
    }
    onChange(body.capture);
  }

  return (
    <section data-testid="meeting-outcome" className="space-y-2 rounded-md border border-[var(--border)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Meeting outcome (a meeting is not success by itself)</p>
      <select aria-label="Meeting outcome" className={input} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
        {OUTCOMES.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <select aria-label="Thesis tested" data-testid="meeting-thesis" className={input} value={hypId} onChange={(e) => setChosenHyp(e.target.value)}>
        <option value="">Choose the thesis this meeting tested</option>
        {(ctx?.hypotheses ?? []).map((h) => (
          <option key={h.id} value={h.id}>
            {words(h.problem_family)} ({h.status})
          </option>
        ))}
      </select>
      {hyp && (outcome === 'qualified_problem' || outcome === 'disqualified_problem') ? (
        <p className="text-xs text-amber-700">This resolves the {words(hyp.problem_family)} thesis as {outcome === 'qualified_problem' ? 'confirmed' : 'rejected'}.</p>
      ) : null}
      <select aria-label="Main attendee" className={input} value={personaId ?? ''} onChange={(e) => setPersonaId(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Choose the main attendee</option>
        {(ctx?.people ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name ?? p.email ?? `person ${p.id}`}
          </option>
        ))}
      </select>
      {outcome === 'qualified_problem' ? (
        <select aria-label="Their words" className={input} value={quote} onChange={(e) => setQuote(e.target.value)}>
          <option value="">Choose the buyer&apos;s own words from the note</option>
          {capture.candidates.map((c) => (
            <option key={c.id} value={c.quote}>
              {c.quote.slice(0, 90)}
            </option>
          ))}
        </select>
      ) : null}
      <input aria-label="Next learning objective" className={input} placeholder="Next learning objective (optional)" value={objective} onChange={(e) => setObjective(e.target.value)} />
      <button type="button" data-testid="meeting-record" onClick={() => void record()} className={primary}>
        Record meeting outcome
      </button>
      {error ? (
        <p role="alert" className="text-xs text-[var(--destructive)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function LinkNote({ capture, onChange }: { capture: CaptureView; onChange: (c: CaptureView) => void }) {
  const [q, setQ] = useState(capture.accountHint ?? '');
  const [accounts, setAccounts] = useState<string[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/gap/capture/lookup?q=${encodeURIComponent(q.trim())}`)
        .then((r) => json<{ accounts?: string[] }>(r))
        .then((b) => setAccounts(b.accounts ?? []))
        .catch(() => setAccounts([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  async function link(accountName: string) {
    const res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'link', accountName }) });
    const body = await json<{ capture?: CaptureView }>(res);
    if (body.capture) onChange(body.capture);
  }
  return (
    <section data-testid="capture-unlinked" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">Not linked to an account yet{capture.accountHint ? ` (you wrote "${capture.accountHint}")` : ''}. Choose the account before confirming anything.</p>
      <input aria-label="Find the account" className={input} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {accounts.map((a) => (
          <button key={a} type="button" className={btn} onClick={() => void link(a)}>
            {a}
          </button>
        ))}
      </div>
    </section>
  );
}

export function CaptureFlow({ initial = null }: { initial?: CaptureView | null }) {
  const [capture, setCapture] = useState<CaptureView | null>(initial);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ accounts: string[]; people: Person[] }>({ accounts: [], people: [] });
  const [account, setAccount] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [context, setContext] = useState<string>('meeting');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const acctCtx = useAccountContext(account);

  useEffect(() => {
    if (account || q.trim().length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/gap/capture/lookup?q=${encodeURIComponent(q.trim())}`)
        .then((r) => json<{ accounts?: string[]; people?: Person[] }>(r))
        .then((b) => setFound({ accounts: b.accounts ?? [], people: b.people ?? [] }))
        .catch(() => setFound({ accounts: [], people: [] }));
    }, 250);
    return () => clearTimeout(t);
  }, [q, account]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/gap/captures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName: account, accountHint: account ? null : q.trim() || null, personaId, context, rawText: text }),
    });
    const body = await json<CaptureView & { error?: string }>(res);
    setSaving(false);
    if (!res.ok || !body.id) {
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    setCapture(body);
  }

  if (capture) {
    return (
      <div className="space-y-4" data-testid="capture-review">
        <p className="text-sm">
          Saved{capture.accountName ? ` for ${capture.accountName}` : ''}. The note is kept exactly as you wrote it.
        </p>
        {!capture.accountName ? <LinkNote capture={capture} onChange={setCapture} /> : null}
        <Candidates capture={capture} onChange={setCapture} />
        <MeetingOutcomeForm capture={capture} onChange={setCapture} />
        <button type="button" className={btn} onClick={() => { setCapture(null); setText(''); }}>
          Capture another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="capture-form">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" htmlFor="capture-who">
          Who
        </label>
        {account ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span data-testid="capture-account" className="font-medium">{account}</span>
            <button type="button" className="text-xs underline" onClick={() => { setAccount(null); setPersonaId(null); }}>
              change
            </button>
          </div>
        ) : (
          <>
            <input id="capture-who" className={input} placeholder="Account or person" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            <div className="flex flex-wrap gap-2">
              {found.accounts.map((a) => (
                <button key={a} type="button" data-testid="capture-pick-account" className={btn} onClick={() => setAccount(a)}>
                  {a}
                </button>
              ))}
              {found.people.map((p) => (
                <button key={p.id} type="button" className={btn} onClick={() => { setAccount(p.account_name ?? null); setPersonaId(p.id); }}>
                  {p.name ?? `person ${p.id}`} ({p.account_name})
                </button>
              ))}
            </div>
            {q.trim().length >= 2 && found.accounts.length === 0 && found.people.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">No match. Save anyway: the note stays unlinked until you choose the account.</p>
            ) : null}
          </>
        )}
        {account && acctCtx ? (
          <select aria-label="Person" className={input} value={personaId ?? ''} onChange={(e) => setPersonaId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Account level (no specific person)</option>
            {acctCtx.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.email ?? `person ${p.id}`}
                {p.title ? `, ${p.title}` : ''}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Conversation">
        {CONTEXTS.map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={context === k} onClick={() => setContext(k)} className={`${btn} ${context === k ? 'border-[var(--primary)] font-medium' : ''}`}>
            {l}
          </button>
        ))}
      </div>
      <textarea
        aria-label="What the buyer said"
        data-testid="capture-text"
        className={`${input} min-h-[12rem]`}
        placeholder="Paste notes or a transcript, or tap the microphone on your keyboard and talk."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" data-testid="capture-save" disabled={saving || !text.trim()} onClick={() => void save()} className={`${primary} w-full sm:w-auto`}>
        {saving ? 'Saving...' : 'Save note'}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-[var(--destructive)]">
          Not saved: {error}
        </p>
      ) : null}
    </div>
  );
}
