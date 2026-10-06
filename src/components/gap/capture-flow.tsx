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
import { Dictate } from './dictate';

const OFFLINE = 'no connection. Try again when you have signal.';
const NOTE_DRAFT_KEY = 'gap-capture-unsaved-note';

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
const SOURCE_TEXT: Record<string, string> = { work: 'a Work card', reply: 'a reply', commitment: 'an obligation', account: 'the account page', meeting: 'a meeting' };
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

type ItemDraft = { keep: boolean; type?: string; quote?: string; personaId?: number | null; title?: string; dueDay?: string };
type ItemResult = { candidateId: string; ok: boolean; reason?: string; detail?: string };

const REASON_TEXT: Record<string, string> = {
  hypothesis_not_at_account: 'choose the thesis it bears on',
  speaker_required: 'choose who said it',
  no_contact: 'choose who said it',
  contact_not_at_account: 'that person is not at this account',
  quote_not_in_source: 'the quote must stay their exact words, inside its sentence',
  capture_unlinked: 'link the note to an account first',
  already_decided: 'already decided',
  bad_due: 'that is not a date',
  title_required: 'say what is owed',
  persona_not_at_account: 'that person is not at this account',
};

/**
 * R44: ONE concise review of the whole note. Every buyer statement and every obligation the note states, each kept
 * (default) or rejected, each corrected on its own (a relabelled type, a shortened quote, who said it, what is owed and
 * by when), then one press records all of it through the same single decisions (a buyer statement becomes a confirmed
 * BID only with its exact words and its speaker; an obligation becomes a commitment). The lines that are never buyer
 * words (a pasted summary, your own read) are listed with why, kept in the note, never proposed.
 */
function NoteReview({ capture, onChange }: { capture: CaptureView; onChange: (c: CaptureView) => void }) {
  const ctx = useAccountContext(capture.accountName);
  // Review D P1: nothing is pre-chosen for Casey unless there is exactly one option.
  const onlyHyp = ctx && ctx.hypotheses.length === 1 ? ctx.hypotheses[0].id : '';
  const [hypothesisId, setHypothesisId] = useState<string>('');
  const multiSpeaker = buyerSpeakers(capture.rawText).length > 1;
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hyp = hypothesisId || onlyHyp;
  const d = (id: string): ItemDraft => drafts[id] ?? { keep: true };
  const set = (id: string, patch: Partial<ItemDraft>) => setDrafts((m) => ({ ...m, [id]: { ...d(id), ...patch } }));
  const personaFor = (id: string) => (d(id).personaId !== undefined ? d(id).personaId : multiSpeaker ? null : capture.personaId);
  // A note saved before R44 carries no obligations or exclusions.
  const commitmentList = capture.commitments ?? [];
  const excludedList = capture.excluded ?? [];
  const bids = capture.candidates.filter((c) => !c.decision);
  const owed = commitmentList.filter((c) => !c.decision);
  const kept = bids.filter((c) => d(c.id).keep).length + owed.filter((c) => d(c.id).keep).length;
  const rejected = bids.length + owed.length - kept;

  async function submit() {
    setBusy(true);
    setError(null);
    const items = [
      ...bids.map((c) =>
        d(c.id).keep
          ? { candidateId: c.id, decision: 'confirm', type: d(c.id).type ?? c.type, ...(d(c.id).quote && d(c.id).quote !== c.quote ? { quote: d(c.id).quote } : {}), ...(personaFor(c.id) != null ? { personaId: personaFor(c.id) } : {}) }
          : { candidateId: c.id, decision: 'reject' },
      ),
      ...owed.map((c) =>
        d(c.id).keep
          ? { candidateId: c.id, decision: 'confirm', title: d(c.id).title ?? c.title, dueDay: d(c.id).dueDay ?? c.due?.day ?? '', ...((d(c.id).personaId ?? capture.personaId) != null ? { personaId: d(c.id).personaId ?? capture.personaId } : {}) }
          : { candidateId: c.id, decision: 'reject' },
      ),
    ];
    let res: Response;
    try {
      res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'batch', ...(hyp ? { hypothesisId: hyp } : {}), items }) });
    } catch {
      setBusy(false);
      setError(`Not recorded: ${OFFLINE}`);
      return;
    }
    const body = await json<{ results?: ItemResult[]; capture?: CaptureView; error?: string }>(res);
    setBusy(false);
    if (!res.ok || !body.capture) {
      setError(`Not recorded: ${body.error ?? `HTTP ${res.status}`}`);
      return;
    }
    setResults(Object.fromEntries((body.results ?? []).filter((r) => !r.ok).map((r) => [r.candidateId, REASON_TEXT[r.reason ?? ''] ?? r.detail ?? r.reason ?? 'not recorded'])));
    onChange(body.capture);
  }

  const people = ctx?.people ?? [];

  /** One statement on its own (the single correction path): confirm or reject it now. */
  async function decideOne(candidateId: string, decision: 'confirm' | 'reject') {
    setBusy(true);
    setResults((m) => ({ ...m, [candidateId]: '' }));
    const c = capture.candidates.find((x) => x.id === candidateId);
    let res: Response;
    try {
      res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          decision === 'reject'
            ? { op: 'decide', candidateId, decision }
            : { op: 'decide', candidateId, decision, type: d(candidateId).type ?? c?.type, ...(d(candidateId).quote && d(candidateId).quote !== c?.quote ? { quote: d(candidateId).quote } : {}), hypothesisId: hyp || undefined, personaId: personaFor(candidateId) ?? undefined },
        ),
      });
    } catch {
      // Final review P1 (UX lens): a dropped connection never leaves the buttons stuck or silent.
      setBusy(false);
      setResults((m) => ({ ...m, [candidateId]: OFFLINE }));
      return;
    }
    const body = await json<{ capture?: CaptureView; error?: string; detail?: string }>(res);
    setBusy(false);
    if (!res.ok || !body.capture) {
      setResults((m) => ({ ...m, [candidateId]: REASON_TEXT[body.error ?? ''] ?? body.detail ?? body.error ?? `HTTP ${res.status}` }));
      return;
    }
    onChange(body.capture);
  }
  const decided = (label: string, tone: string) => <p className={`text-xs font-medium ${tone}`}>{label}</p>;
  return (
    <section className="space-y-3" data-testid="capture-review-batch">
      {capture.candidates.length === 0 && commitmentList.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">No buyer statements or obligations stood out. The note is saved as written.</p> : null}
      {capture.candidates.length ? (
        <div className="space-y-2" data-testid="capture-candidates">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Candidate buyer truth (not truth until you confirm)</p>
          {capture.accountName && ctx ? (
            <label className="block text-xs">
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
          ) : null}
          {multiSpeaker ? <p className="text-xs text-amber-700 dark:text-amber-400">This note has more than one speaker: choose who said each line.</p> : null}
          {capture.candidates.map((c) => (
            <article key={c.id} data-testid="capture-candidate" data-state={c.decision?.kind ?? 'candidate'} data-keep={c.decision ? undefined : String(d(c.id).keep)} className="space-y-2 rounded-md border border-[var(--border)] p-3">
              {c.decision?.kind === 'confirmed' ? (
                <>
                  <blockquote className="break-words border-l-2 border-[var(--primary)] pl-2 text-sm">&ldquo;{c.quote}&rdquo;</blockquote>
                  {decided(`Confirmed as ${words(c.decision.type)}. Recorded as buyer truth.`, 'text-emerald-700 dark:text-emerald-400')}
                </>
              ) : c.decision?.kind === 'rejected' ? (
                <>
                  <blockquote className="break-words border-l-2 border-[var(--border)] pl-2 text-sm text-[var(--muted-foreground)]">&ldquo;{c.quote}&rdquo;</blockquote>
                  {decided('Rejected. Not buyer truth.', 'text-[var(--muted-foreground)]')}
                </>
              ) : (
                <>
                  <textarea aria-label="Their exact words" data-testid="candidate-quote" className={`${input} min-h-[3rem] text-sm`} value={d(c.id).quote ?? c.quote} onChange={(e) => set(c.id, { quote: e.target.value })} />
                  {c.speaker ? <p className="text-xs text-[var(--muted-foreground)]">In the note: {c.speaker}</p> : null}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select aria-label="What kind of statement" className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-xs sm:min-h-9" value={d(c.id).type ?? c.type} onChange={(e) => set(c.id, { type: e.target.value })}>
                      {BID_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {words(t)}
                        </option>
                      ))}
                    </select>
                    {ctx ? (
                      <select aria-label="Who said it" data-testid="candidate-speaker" className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-xs sm:min-h-9" value={personaFor(c.id) ?? ''} onChange={(e) => set(c.id, { personaId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Who said it?</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name ?? p.email ?? `person ${p.id}`}
                            {p.title ? `, ${p.title}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <label className="inline-flex min-h-11 items-center gap-1 sm:min-h-9">
                      <input type="checkbox" data-testid="candidate-reject-toggle" checked={!d(c.id).keep} onChange={(e) => set(c.id, { keep: !e.target.checked })} /> Reject this one
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" data-testid="candidate-confirm" disabled={busy || !capture.accountName || !hyp || personaFor(c.id) == null} onClick={() => void decideOne(c.id, 'confirm')} className={btn}>
                      Confirm this one now
                    </button>
                    <button type="button" data-testid="candidate-reject" disabled={busy} onClick={() => void decideOne(c.id, 'reject')} className={btn}>
                      Reject this one now
                    </button>
                  </div>
                  {results[c.id] ? <p role="alert" className="text-xs text-[var(--destructive)]">Not recorded: {results[c.id]}.</p> : null}
                </>
              )}
            </article>
          ))}
        </div>
      ) : null}
      {commitmentList.length ? (
        <div className="space-y-2" data-testid="capture-commitments">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">What is owed, and by when</p>
          {commitmentList.map((c) => (
            <article key={c.id} data-testid="capture-commitment" data-state={c.decision?.kind ?? (d(c.id).keep ? 'keep' : 'reject')} className="space-y-2 rounded-md border border-[var(--border)] p-3">
              <blockquote className="break-words border-l-2 border-[var(--primary)] pl-2 text-sm">
                {c.speaker ? <span className="font-medium">{c.speaker}: </span> : null}&ldquo;{c.quote}&rdquo;
              </blockquote>
              {c.decision?.kind === 'confirmed' ? (
                decided('Recorded as an obligation. It is on Work on its day.', 'text-emerald-700 dark:text-emerald-400')
              ) : c.decision?.kind === 'rejected' ? (
                decided('Rejected. Nothing recorded.', 'text-[var(--muted-foreground)]')
              ) : (
                <>
                  <p className="text-xs text-[var(--muted-foreground)]">{c.owner === 'seller' ? 'You owe this.' : 'They owe this: GAP waits, then reminds you to chase it.'}</p>
                  <input aria-label="What is owed" data-testid="commitment-title" className={input} maxLength={200} value={d(c.id).title ?? c.title} onChange={(e) => set(c.id, { title: e.target.value })} />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="inline-flex items-center gap-1">
                      Due
                      <input aria-label="Due day" data-testid="commitment-due" type="date" className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-xs sm:min-h-9" value={d(c.id).dueDay ?? c.due?.day ?? ''} onChange={(e) => set(c.id, { dueDay: e.target.value })} />
                    </label>
                    {c.due?.ambiguous ? <span className="text-amber-700 dark:text-amber-400">&ldquo;{c.due.phrase}&rdquo; could mean another day: check it.</span> : null}
                    {ctx && people.length ? (
                      <select aria-label="Who it is with" className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-xs sm:min-h-9" value={d(c.id).personaId ?? capture.personaId ?? ''} onChange={(e) => set(c.id, { personaId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Who it is with (optional)</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name ?? p.email ?? `person ${p.id}`}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <label className="inline-flex min-h-11 items-center gap-1 sm:min-h-9">
                      <input type="checkbox" data-testid="commitment-reject-toggle" checked={!d(c.id).keep} onChange={(e) => set(c.id, { keep: !e.target.checked })} /> Reject this one
                    </label>
                  </div>
                  {results[c.id] ? <p role="alert" className="text-xs text-[var(--destructive)]">Not recorded: {results[c.id]}.</p> : null}
                </>
              )}
            </article>
          ))}
        </div>
      ) : null}
      {bids.length + owed.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" data-testid="capture-batch-submit" disabled={busy || !capture.accountName} onClick={() => void submit()} className={primary}>
            {busy ? 'Recording...' : `Record ${kept} kept${rejected ? `, reject ${rejected}` : ''}`}
          </button>
          {!capture.accountName ? <span className="text-xs text-[var(--muted-foreground)]">Link the note to an account first.</span> : null}
          {error ? (
            <p role="alert" className="text-xs text-[var(--destructive)]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
      {excludedList.length ? (
        <details className="text-xs" data-testid="capture-excluded">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">Never proposed as their words ({excludedList.length})</summary>
          <ul className="mt-1 space-y-1">
            {excludedList.map((x, k) => (
              <li key={k}>
                <span className="text-[var(--muted-foreground)]">{x.reason}:</span> &ldquo;{x.text}&rdquo;
              </li>
            ))}
          </ul>
        </details>
      ) : null}
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
    let res: Response;
    try {
      res = await fetch(`/api/gap/captures/${encodeURIComponent(capture.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'meeting', outcome, hypothesisId: hyp.id, personaId: personaId ?? undefined, buyerQuote: quote || undefined, nextLearningObjective: objective || undefined }),
      });
    } catch {
      setError(`Not recorded: ${OFFLINE}`);
      return;
    }
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
        <p className="text-xs text-amber-700 dark:text-amber-400">This resolves the {words(hyp.problem_family)} thesis as {outcome === 'qualified_problem' ? 'confirmed' : 'rejected'}.</p>
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

export function CaptureFlow({
  initial = null,
  initialAccount = null,
  initialPersona = null,
  initialDeal = null,
  initialContext = null,
  source = null,
  dictate = false,
}: {
  initial?: CaptureView | null;
  initialAccount?: string | null;
  /** R44: the person the action that opened Capture was about (a person at the account, checked by the page). */
  initialPersona?: { id: number; name: string } | null;
  /** R44: the deal the action named (its reference as GAP knows it). */
  initialDeal?: string | null;
  /** R44: the conversation the action implies (a meeting, a call, an email). */
  initialContext?: string | null;
  /** R44: what opened Capture (a Work card, a reply, an obligation, the account page). */
  source?: { kind: string; id: string } | null;
  /** UX-12: transcription is on for this deployment (off until the spend is approved). */ dictate?: boolean;
}) {
  const [capture, setCapture] = useState<CaptureView | null>(initial);
  // UX-12: what GAP heard, editable, confirmed before anything is written.
  const [heard, setHeard] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ accounts: string[]; people: Person[] }>({ accounts: [], people: [] });
  // Opened from an account page ("Log what happened"): the account is already chosen (Casey can still clear it).
  const [account, setAccount] = useState<string | null>(initialAccount);
  const [personaId, setPersonaId] = useState<number | null>(initialPersona?.id ?? null);
  const [context, setContext] = useState<string>(initialContext && CONTEXTS.some(([k]) => k === initialContext) ? initialContext : 'meeting');
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

  // Final review P1 (UX lens): the unsaved note survives a dropped connection and a reload on this phone.
  useEffect(() => {
    try {
      const kept = window.localStorage.getItem(NOTE_DRAFT_KEY);
      if (kept) setText((t) => t || kept);
    } catch {
      // Storage unavailable (private mode): the note stays in the page only.
    }
  }, []);
  useEffect(() => {
    try {
      if (text) window.localStorage.setItem(NOTE_DRAFT_KEY, text);
      else window.localStorage.removeItem(NOTE_DRAFT_KEY);
    } catch {
      // ignore
    }
  }, [text]);

  async function save(rawText: string = text) {
    setSaving(true);
    setError(null);
    let res: Response;
    try {
      res = await fetch('/api/gap/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName: account, accountHint: account ? null : q.trim() || null, personaId, context, rawText, ...(account && initialDeal ? { dealId: initialDeal } : {}), ...(account && source ? { source } : {}) }),
      });
    } catch {
      setSaving(false);
      setError('no connection. Your note is kept on this phone; press Save again when you have signal.');
      return;
    }
    const body = await json<CaptureView & { error?: string }>(res);
    setSaving(false);
    if (!res.ok || !body.id) {
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    try {
      window.localStorage.removeItem(NOTE_DRAFT_KEY);
    } catch {
      // ignore
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
        <NoteReview capture={capture} onChange={setCapture} />
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
            {initialDeal ? <span className="text-xs text-[var(--muted-foreground)]" data-testid="capture-deal">Deal: {initialDeal}</span> : null}
            {source ? <span className="text-xs text-[var(--muted-foreground)]" data-testid="capture-source">Opened from {SOURCE_TEXT[source.kind] ?? source.kind}</span> : null}
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
      {/* UX-12: Dictate records and transcribes; nothing is written until Confirm below (the existing Save). */}
      <Dictate enabled={dictate} onTranscript={(t) => setHeard(t)} />
      {heard !== null ? (
        <section className="space-y-2 rounded-md border border-[var(--primary)] p-3" data-testid="dictate-review" aria-labelledby="dictate-heard-label">
          <label id="dictate-heard-label" htmlFor="dictate-heard" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">I heard</label>
          <textarea id="dictate-heard" data-testid="dictate-heard" className={`${input} min-h-[8rem]`} value={heard} onChange={(e) => setHeard(e.target.value)} />
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">I am about to record</p>
          <ul className="text-sm" data-testid="dictate-about">
            <li>Account: {account ?? (q.trim() ? `unlinked (hint "${q.trim()}")` : 'unlinked')}</li>
            <li>Person: {personaId !== null ? (acctCtx?.people.find((p) => p.id === personaId)?.name ?? `person ${personaId}`) : 'account level'}</li>
            <li>Conversation: {CONTEXTS.find(([k]) => k === context)?.[1] ?? context}</li>
            <li>Note: {heard.trim() ? `"${heard.trim().slice(0, 160)}${heard.trim().length > 160 ? '...' : ''}"` : 'empty'}</li>
          </ul>
          <p className="text-xs text-[var(--muted-foreground)]">Confirm saves this as the note, exactly as it reads above{text.trim() ? ', after what you already typed' : ''}, through the same path as Save. Nothing is sent to anyone.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} disabled={saving || !heard.trim()} data-testid="dictate-confirm" onClick={() => { const t = text.trim() ? `${text.trim()}\n${heard.trim()}` : heard.trim(); setText(t); setHeard(null); void save(t); }}>
              {saving ? 'Saving...' : 'Confirm'}
            </button>
            <button type="button" className={btn} data-testid="dictate-edit" onClick={() => { setText((t) => (t.trim() ? `${t.trim()}\n${heard}` : heard)); setHeard(null); document.querySelector<HTMLTextAreaElement>('[data-testid="capture-text"]')?.focus(); }}>Edit in the note</button>
            <button type="button" className={btn} data-testid="dictate-discard" onClick={() => setHeard(null)}>Discard</button>
          </div>
        </section>
      ) : null}
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
